import { z } from 'zod';
import type { Row } from '../../../packages/shared/types.js';
import { GmailJobHunter, type DeliveryKind } from './gmail/service.js';
import type { AccountInfo } from './gmail/oauth.js';
import { ResearchJobHunter, dayQueries } from './research/service.js';
import { HistorySync } from './history-sync.js';
import { Store } from './db.js';
import { DomainError, hash, id, iso, day, companyDomain } from './util.js';
import { validateAnalysis, compact } from './research/contracts.js';

export const autoPolicySchema = z
  .object({
    senderEmail: z.email(),
    cvId: z.string().min(1),
    contactKinds: z
      .array(z.enum(['RECRUITMENT', 'GENERAL']))
      .min(1)
      .max(2),
    contactTypes: z
      .array(z.enum(['ACTIVE', 'OPEN', 'PROSPECT']))
      .min(1)
      .max(3),
    searchScope: z.string().min(10).max(1500),
    sessionLimit: z.number().int().positive().max(100000).nullable(),
    dailyLimit: z.number().int().positive().max(100000).nullable(),
    sendIntervalSeconds: z.number().int().min(60).max(86400),
    researchIntervalSeconds: z.number().int().min(60).max(86400),
    confirmed: z.literal(true),
    targetedHistoryConsent: z.literal(true),
  })
  .strict();
export class AutoPolicyJobHunter extends GmailJobHunter {
  readonly historySync: HistorySync;
  private pumping = false;
  private internalApproval = false;
  private sessionId: string | null = null;
  private preparing = false;
  private starting = false;
  private controlEpoch = 0;
  private preparationController?: AbortController;
  constructor(store: Store, options: ConstructorParameters<typeof GmailJobHunter>[1] = {}) {
    super(store, { ...options, mode: 'AUTO_POLICY' });
    this.historySync = new HistorySync(store);
    store.exec(
      "UPDATE auto_sessions SET status='STOPPED',stopped_at=?,reason='RESTART' WHERE status IN ('RUNNING','PAUSED','WAITING')",
      this.now(),
    );
    store.set('stopped', true);
    store.set('paused', false);
    store.set('workerStatus', 'STOPPED');
  }
  policyConfig() {
    return this.store.get<Row | null>('autoPolicy', null);
  }
  configurePolicy(raw: unknown) {
    if (this.sessionId || this.sending || this.researching || this.preparing || this.starting)
      throw new DomainError('SESSION_ACTIVE', 'Zatrzymaj sesję przed zmianą polityki.');
    const input = autoPolicySchema.parse(raw),
      account = this.deliveryState().account;
    const p = this.minimalProfile(),
      { cv } = this.cvBytes(input.cvId);
    if (!account || account.email !== input.senderEmail)
      throw new DomainError('ACCOUNT_CHANGED', 'Wybierz bieżące podłączone konto nadawcy.');
    if (!cv.approved_at) throw new DomainError('CV_NOT_APPROVED', 'Zatwierdź wybrane CV.');
    if (!this.deliveryState().readReady || !this.deliveryState().sendReady)
      throw new DomainError(
        'READ_PERMISSION_REQUIRED',
        'Wymagane istniejące uprawnienia Gmaila. Aplikacja nie rozszerza ich sama.',
      );
    const config = {
      ...input,
      profileHash: p.hash,
      cvHash: cv.sha256,
      accountSubject: account.subject,
      approvedAt: this.now(),
    };
    const policyHash = hash(JSON.stringify(config));
    this.store.atomic(() => {
      this.revokeApprovals('Użytkownik zmienił politykę sesji');
      this.store.exec(
        'UPDATE campaigns SET account_email=?,cv_id=?,policy_version=policy_version+1 WHERE id=?',
        input.senderEmail,
        cv.id,
        this.campaignId,
      );
      this.store.set('autoPolicy', {
        ...config,
        policyHash,
        policyVersion: this.campaign().policy_version,
      });
      this.event(
        'AUTO_POLICY_CONFIGURED',
        'Zatwierdzono materiały, nadawcę, typy kontaktów, zakres i tempo; wysyłka wymaga Start.',
        null,
        'user',
      );
    });
    return this.policyConfig();
  }
  private assertPolicy(requireSession = true) {
    const p = this.policyConfig(),
      account = this.deliveryState().account;
    if (!p) throw new DomainError('POLICY_REQUIRED', 'Najpierw zatwierdź politykę w Ustawieniach.');
    const profile = this.minimalProfile(),
      { cv } = this.cvBytes(p.cvId);
    if (
      profile.hash !== p.profileHash ||
      !cv.approved_at ||
      cv.sha256 !== p.cvHash ||
      this.campaign().cv_id !== p.cvId ||
      this.campaign().policy_version !== p.policyVersion
    )
      throw new DomainError(
        'MATERIALS_CHANGED',
        'Materiały, CV lub ustawienia zmieniły się. Sprawdź i zatwierdź nową politykę.',
      );
    if (
      !account ||
      account.subject !== p.accountSubject ||
      account.email !== p.senderEmail ||
      this.campaign().account_email !== p.senderEmail
    )
      throw new DomainError(
        'ACCOUNT_CHANGED',
        'Nadawca zmienił się. Sprawdź i zatwierdź nową politykę.',
      );
    if (
      requireSession &&
      (!this.sessionId ||
        this.state().stopped ||
        this.state().paused ||
        this.store.one('SELECT status FROM auto_sessions WHERE id=?', this.sessionId)?.status !==
          'RUNNING')
    )
      throw new DomainError(
        'SESSION_STOPPED',
        'Sesja nie ma aktywnego uprawnienia do wysyłki. Użyj Start lub Wznów.',
      );
    if (
      this.store.one(
        "SELECT id FROM outbox WHERE status IN ('SENDING','SEND_UNKNOWN') AND id<>?",
        this.allowOwnReservation ?? this.activeSendingOutbox ?? '',
      ) ||
      this.store.one(
        "SELECT s.id FROM shared_attempts s WHERE s.state IN ('SENDING','SEND_UNKNOWN') AND NOT EXISTS (SELECT 1 FROM send_attempts a WHERE a.id=s.id AND a.state IN ('SENT_PROVIDER','SENT_CONFIRMED'))",
      )
    )
      throw new DomainError(
        'SEND_UNKNOWN',
        'Rozstrzygnij niepewne próby; bez automatycznego ponowienia.',
      );
    return p;
  }
  override async start(_query?: string) {
    await this.startAuto();
  }
  async startAuto() {
    if (this.starting || this.researching || this.preparing || this.sending)
      throw new DomainError('BUSY', 'Trwa kończenie poprzedniej operacji.');
    const p = this.assertPolicy(false);
    if (!this.capability('codexCapability').tested || !this.capability('searchCapability').tested)
      throw new DomainError(
        'SEARCH_NOT_TESTED',
        'Sprawdź bieżącą integrację Codexa i wyszukiwanie w Ustawieniach.',
      );
    this.starting = true;
    const epoch = this.controlEpoch;
    try {
      if (this.sessionId) {
        this.historySync.assertOwner();
        this.store.exec(
          "UPDATE auto_sessions SET status='RUNNING',reason=NULL WHERE id=?",
          this.sessionId,
        );
      } else {
        await this.historySync.claim();
        if (this.controlEpoch !== epoch)
          throw new DomainError(
            'CANCELLED',
            'Start przerwany przez Pauzę lub Stop. Historia zachowana.',
          );
        this.assertPolicy(false);
        this.sessionId = id();
        this.store.exec(
          "INSERT INTO auto_sessions VALUES (?,?,'RUNNING',?,NULL,NULL)",
          this.sessionId,
          p.policyHash,
          this.now(),
        );
      }
      this.store.set('stopped', false);
      this.store.set('paused', false);
      this.store.set('gmailSenderPaused', false);
      this.store.set('killSwitch', false);
      this.store.set('workerStatus', 'RUNNING');
      // Never catch up with a burst after a pause/restart/sleep.
      this.store.set(
        'autoNextSendAt',
        iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
      );
      this.store.set('autoNextResearchAt', this.now());
      const run = this.store.one("SELECT id FROM runs WHERE status='PAUSED'");
      if (run) await ResearchJobHunter.prototype.start.call(this, p.searchScope);
      this.event(
        'AUTO_STARTED',
        'Start — szukaj i wysyłaj zgodnie z zatwierdzoną polityką.',
        this.sessionId,
        'user',
      );
    } finally {
      this.starting = false;
    }
  }
  override control(action: 'pause' | 'stop' | 'emergency-stop' | 'resume-sender') {
    if (action === 'resume-sender')
      throw new DomainError('START_REQUIRED', 'Użyj jawnego Start/Wznów sesję.');
    this.controlEpoch++;
    this.preparationController?.abort();
    super.control(action);
    if (action === 'pause')
      this.revokeApprovals('Pauza sesji automatycznej: przygotuj świeże pakiety przy wznowieniu');
    if (this.sessionId)
      this.store.exec(
        'UPDATE auto_sessions SET status=?,stopped_at=?,reason=? WHERE id=?',
        action === 'pause' ? 'PAUSED' : 'STOPPED',
        action === 'pause' ? null : this.now(),
        action,
        this.sessionId,
      );
    if (action !== 'pause') this.sessionId = null;
  }
  async handoff() {
    this.control('stop');
    // Control aborts research immediately; wait only for our operations, including a POST already in flight.
    while (this.starting || this.researching || this.sending || this.preparing)
      await new Promise((r) => setTimeout(r, 10));
    await this.historySync.checkpoint(true);
    return this.historySync.status();
  }
  async prepareHistory() {
    if (!this.state().stopped)
      throw new DomainError('SESSION_ACTIVE', 'Zatrzymaj sesję przed przygotowaniem historii.');
    this.control('stop');
    while (this.starting || this.researching || this.sending || this.preparing)
      await new Promise((r) => setTimeout(r, 10));
    await this.historySync.claim();
    await this.historySync.checkpoint(true);
    return this.historySync.status();
  }
  private quotaIssues(reserved = false) {
    if (reserved) return [];
    const p = this.policyConfig()!,
      today = day(this.clock(), this.campaign().timezone);
    const local = this.store.one(
      "SELECT count(*) n FROM usage_ledger u JOIN outbox o ON o.id=u.outbox_id WHERE o.kind='FIRST_CONTACT' AND u.day=?",
      today,
    )!.n;
    const transferred = this.store.one(
      "SELECT count(*) n FROM shared_usage s WHERE s.day=? AND s.kind='FIRST_CONTACT' AND NOT EXISTS (SELECT 1 FROM usage_ledger u WHERE u.id=s.id)",
      today,
    )!.n;
    const session = this.store.one(
      'SELECT count(*) n FROM usage_ledger u JOIN auto_outbox a ON a.outbox_id=u.outbox_id WHERE a.session_id=?',
      this.sessionId,
    )!.n;
    return [
      ...(p.dailyLimit !== null && local + transferred >= p.dailyLimit ? ['DAILY_LIMIT'] : []),
      ...(p.sessionLimit !== null && session >= p.sessionLimit ? ['SESSION_LIMIT'] : []),
    ];
  }
  protected override issues(
    d: Row,
    kind: DeliveryKind,
    account: AccountInfo,
    requireHistory = true,
  ) {
    const problems = super.issues(d, kind, account, requireHistory);
    if (kind !== 'FIRST_CONTACT') return [...problems, 'AUTO_FIRST_CONTACT_ONLY'];
    try {
      const p = this.assertPolicy();
      this.historySync.assertOwner();
      if (account.subject !== p.accountSubject || account.email !== p.senderEmail)
        problems.push('ACCOUNT_CHANGED');
      const o = this.store.one('SELECT * FROM opportunities WHERE id=?', d.opportunity_id)!;
      const t = this.store.one('SELECT * FROM contacts WHERE id=?', d.contact_id)!;
      const analysis = JSON.parse(
        this.store.one('SELECT details FROM research_qualifications WHERE opportunity_id=?', o.id)!
          .details,
      );
      const sources = this.sourcesForDraft(d);
      for (const s of sources) {
        const last = this.store.one(
          'SELECT v.* FROM source_verifications v JOIN research_sources r ON r.id=v.source_id WHERE r.original_url=? ORDER BY v.checked_at DESC,v.rowid DESC LIMIT 1',
          s.original_url,
        );
        if (
          last &&
          (last.status !== 'READ' ||
            last.content_hash !== s.content_hash ||
            last.final_url !== s.final_url)
        )
          problems.push('STALE_EVIDENCE');
      }
      const verified = validateAnalysis(analysis, sources as any);
      const company = this.store.one('SELECT * FROM companies WHERE id=?', d.company_id)!;
      const identitySource = sources.find((s) => s.id === verified.companyProof.sourceId);
      const domain = verified.companyURL
        ? companyDomain(new URL(verified.companyURL).hostname)
        : null;
      if (
        !domain ||
        !identitySource?.final_url ||
        companyDomain(new URL(identitySource.final_url).hostname) !== domain ||
        (company.primary_domain !== domain &&
          !this.store.one(
            "SELECT id FROM company_aliases WHERE company_id=? AND kind='DOMAIN' AND value=? AND verified_at IS NOT NULL",
            company.id,
            domain,
          ))
      )
        problems.push('UNVERIFIED_COMPANY');
      const review = JSON.parse(d.semantic_review);
      if (review.supported !== true || review.issues.length)
        problems.push('SEMANTIC_REVIEW_REQUIRED');
      const contactSource = sources.find((s) => s.id === verified.contact.proof.sourceId);
      if (contactSource && domain) {
        const sourceDomain = companyDomain(
          new URL(contactSource.final_url ?? contactSource.original_url).hostname,
        );
        const emailDomain = companyDomain(t.email.split('@')[1]);
        const related =
          sourceDomain === domain ||
          emailDomain === domain ||
          sourceDomain?.endsWith('.' + domain) ||
          emailDomain?.endsWith('.' + domain);
        const namedRecruiter =
          t.kind === 'RECRUITMENT' &&
          compact(contactSource.text).includes(compact(verified.company));
        if (!related && !namedRecruiter) problems.push('CONTACT_POLICY');
      }
      if (
        !p.contactKinds.includes(t.kind) ||
        !p.contactTypes.includes(o.type) ||
        !t.literal_verified ||
        t.verification_status === 'INVALIDATED' ||
        !contactSource ||
        verified.contact.email?.toLowerCase() !== t.email ||
        verified.contact.kind !== t.kind ||
        !compact(contactSource.text).includes(t.email) ||
        t.evidence_id !==
          this.store.one(
            'SELECT evidence_id FROM research_evidence WHERE source_id=? AND evidence_id IN (SELECT id FROM evidence WHERE company_id=?)',
            contactSource.id,
            d.company_id,
          )?.evidence_id
      )
        problems.push('CONTACT_POLICY');
      // Reject restricted mailbox purposes even if a model mislabeled the address.
      if (
        /^(?:sales|sprzedaz|faktur\w*|billing|invoice|security|abuse|privacy|iod|dpo|rodo)(?:[._+-]|@)/i.test(
          t.email,
        ) ||
        /(?:nie przyjmujemy (?:zgłoszeń|kandydatur)|wyłącznie (?:przez formularz|przez portal)|aplikuj tylko przez)/iu.test(
          sources.map((s) => s.text).join('\n'),
        )
      )
        problems.push('CONTACT_POLICY');
      if (
        /sprzedaż|sprzedaz|sales|faktur|rozlicze[nń]|billing|invoice|security|bezpieczeństw|ochron.{0,15}danych|privacy|\biod\b|\bdpo\b/iu.test(
          verified.contact.proof.quote ?? '',
        )
      )
        problems.push('CONTACT_POLICY');
      if (o.type !== 'PROSPECT' && !o.decision.startsWith('READY_'))
        problems.push('QUALIFICATION_REQUIRED');
      if (
        o.type === 'PROSPECT' &&
        Object.values(verified.conditions).some(
          (c: any) => c.value === 'conflicting' || c.value === 'no',
        )
      )
        problems.push('QUALIFICATION_REQUIRED');
      if (
        this.store.one(
          "SELECT id FROM shared_attempts WHERE (company_id=? OR lower(recipient)=?) AND state<>'FAILED_NOT_SENT'",
          d.company_id,
          d.email.toLowerCase(),
        )
      )
        problems.push('CONTACT_HISTORY');
      if (
        this.store.one(
          "SELECT a.id FROM send_attempts a JOIN outbox o ON o.id=a.outbox_id WHERE o.kind='FIRST_CONTACT' AND lower(a.recipient)=? AND o.company_id<>? AND a.state<>'FAILED_NOT_SENT'",
          d.email.toLowerCase(),
          d.company_id,
        )
      )
        problems.push('RECIPIENT_HISTORY');
    } catch (e) {
      problems.push(e instanceof DomainError ? e.code : 'INVALID_DRAFT');
    }
    return [...new Set(problems)];
  }
  protected override gates(o: Row, account: AccountInfo, reserved = false) {
    // The current reservation is expected here; all other uncertain attempts block the session.
    const own = this.store.one(
      "SELECT id FROM outbox WHERE status IN ('SENDING','SEND_UNKNOWN') AND id<>?",
      o.id,
    );
    if (own) throw new DomainError('SEND_UNKNOWN', 'Istnieje inna niepewna próba.');
    const problems = this.quotaIssues(reserved);
    if (problems.length)
      throw new DomainError(problems[0], 'Osiągnięto ustawiony limit wiadomości.');
    const session = this.store.one('SELECT session_id FROM auto_outbox WHERE outbox_id=?', o.id);
    if (session?.session_id !== this.sessionId)
      throw new DomainError('SESSION_STOPPED', 'Rezerwacja nie należy do bieżącej sesji.');
    if (
      this.store.one('SELECT actor FROM draft_approvals WHERE id=?', o.approval_id)?.actor !==
      'policy'
    )
      throw new DomainError('POLICY_REQUIRED', 'Brak decyzji kodu według polityki.');
    this.allowOwnReservation = reserved ? o.id : null;
    try {
      super.gates(o, account, reserved);
    } finally {
      this.allowOwnReservation = null;
    }
  }
  private allowOwnReservation: string | null = null;
  protected override async syncCompany(d: Row, account: AccountInfo) {
    const p = this.assertPolicy();
    if (account.subject !== p.accountSubject || account.email !== p.senderEmail)
      throw new DomainError(
        'ACCOUNT_CHANGED',
        'Konto zmieniło się przed celowanym odczytem historii.',
      );
    return super.syncCompany(d, account);
  }
  override async approveDelivery(input: {
    previewId: string;
    previewHash: string;
    confirmed: boolean;
  }) {
    if (!this.internalApproval)
      throw new DomainError(
        'AUTO_POLICY_ONLY',
        'W AUTO_POLICY wiadomości dopuszcza kod aktywnej sesji.',
      );
    return super.approveDelivery(input);
  }
  private wait(reason: string) {
    if (this.sessionId)
      this.store.exec(
        "UPDATE auto_sessions SET status='WAITING',reason=? WHERE id=?",
        reason,
        this.sessionId,
      );
    super.control('pause');
    this.revokeApprovals('Wstrzymanie sesji automatycznej: odwołano niewysłane pakiety');
    this.store.set('workerStatus', reason);
  }
  override async dispatchOne() {
    // Research and sender have independent busy flags. A long model call cannot hold Stop.
    if (
      !this.sessionId ||
      this.state().paused ||
      this.state().stopped ||
      this.preparing ||
      this.sending
    )
      return;
    const p = this.policyConfig()!;
    if (this.store.get('autoNextSendAt', '') > this.now()) return;
    this.preparing = true;
    this.preparationController = new AbortController();
    try {
      this.assertPolicy();
      this.historySync.assertOwner();
      const limits = this.quotaIssues();
      if (limits.length) {
        this.wait(limits[0]);
        return;
      }
      let queued = this.store.one(
        "SELECT o.id FROM outbox o JOIN auto_outbox a ON a.outbox_id=o.id WHERE o.status='QUEUED' AND a.session_id=?",
        this.sessionId,
      );
      const candidate = queued
        ? null
        : this.draftRows().find(
            (d) =>
              d.status !== 'SENT' && !this.store.get(`autoSkipped:${d.id}:${d.version}`, false),
          );
      if (!queued && !candidate) {
        this.store.set(
          'autoNextSendAt',
          iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
        );
        return;
      }
      await this.historySync.checkpoint();
      this.assertPolicy();
      if (!queued) {
        const d = candidate!;
        await this.refreshDraftSources(d.id, this.preparationController.signal);
        this.assertPolicy();
        const publicProblems = this.issues(d, 'FIRST_CONTACT', await this.gateway.account(), false);
        if (publicProblems.length)
          throw new DomainError(
            publicProblems[0],
            'Kontakt lub szkic nie przeszedł kontroli publicznych dowodów i polityki. Nie odczytano historii Gmaila.',
          );
        // Only selected contacts/domains; policy consent never scans the whole inbox.
        await this.checkHistory({ drafts: [{ id: d.id, version: d.version }], consent: true });
        this.assertPolicy();
        const preview = await this.prepareDelivery({
          drafts: [{ id: d.id, version: d.version }],
          cvId: p.cvId,
          kind: 'FIRST_CONTACT',
        });
        this.assertPolicy();
        this.internalApproval = true;
        try {
          await super.approveDelivery({
            previewId: preview.id,
            previewHash: preview.previewHash,
            confirmed: true,
          });
        } finally {
          this.internalApproval = false;
        }
        for (const item of this.preview(preview.id).items)
          this.store.exec('INSERT INTO auto_outbox VALUES (?,?)', item.outbox_id, this.sessionId);
        queued = { id: this.preview(preview.id).items[0].outbox_id };
      }
      await super.dispatchOne();
      this.store.set(
        'autoNextSendAt',
        iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
      );
      const result = this.store.one('SELECT status FROM outbox WHERE id=?', queued.id);
      if (result?.status === 'SEND_UNKNOWN') this.wait('SEND_UNKNOWN');
      else if (result?.status === 'FAILED_NOT_SENT') this.wait('GMAIL_SEND_BLOCKED');
      else if (result?.status === 'BLOCKED') {
        const reason = this.store.get<string>('gmailLastError', 'GMAIL_SEND_BLOCKED');
        if (
          reason.startsWith('GMAIL_') ||
          reason.startsWith('HISTORY_') ||
          ['ACCOUNT_CHANGED', 'PROFILE_CHANGED', 'APPROVAL_CHANGED', 'CV_CHANGED'].includes(reason)
        )
          this.wait(reason);
        else {
          const o = this.store.one(
            'SELECT draft_id,draft_version FROM outbox WHERE id=?',
            queued.id,
          )!;
          this.store.set(`autoSkipped:${o.draft_id}:${o.draft_version}`, true);
          this.event(
            'AUTO_SKIPPED',
            'Kontrola przed wysyłką zablokowała szkic; nie wykonano POST.',
            o.draft_id,
          );
        }
      }
      if (this.quotaIssues().length) this.wait(this.quotaIssues()[0]);
    } catch (e) {
      const code = e instanceof DomainError ? e.code : 'AUTO_ERROR';
      const sessionErrors = [
        'ACCOUNT_CHANGED',
        'MATERIALS_CHANGED',
        'PROFILE_NOT_APPROVED',
        'SEND_UNKNOWN',
        'POLICY_REQUIRED',
        'READ_PERMISSION_REQUIRED',
      ];
      if (sessionErrors.includes(code) || code.startsWith('GMAIL_') || code.startsWith('HISTORY_'))
        this.wait(code);
      else if (!this.state().paused && !this.state().stopped) {
        const d = this.draftRows().find(
          (d) => d.status !== 'SENT' && !this.store.get(`autoSkipped:${d.id}:${d.version}`, false),
        );
        if (d) {
          this.store.set(`autoSkipped:${d.id}:${d.version}`, true);
          this.event(
            'AUTO_SKIPPED',
            e instanceof DomainError ? e.message : 'Niepewny szkic pominięty.',
            d.id,
          );
        }
        this.store.set(
          'autoNextSendAt',
          iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
        );
      }
    } finally {
      this.preparing = false;
      this.preparationController = undefined;
    }
  }
  override async tick() {
    if (
      this.pumping ||
      this.researching ||
      !this.sessionId ||
      this.state().paused ||
      this.state().stopped
    )
      return;
    this.pumping = true;
    try {
      this.assertPolicy();
      if (!this.store.one("SELECT id FROM runs WHERE status='QUEUED'")) {
        if (this.store.get('autoNextResearchAt', '') > this.now()) return;
        const pending = this.draftRows().filter(
          (d) => d.status !== 'SENT' && !this.store.get(`autoSkipped:${d.id}:${d.version}`, false),
        ).length;
        if (pending >= 3) {
          this.store.set('workerStatus', 'QUEUE_FULL');
          return;
        }
        const p = this.policyConfig()!;
        const recent = this.store.all(
          "SELECT query FROM research_queries WHERE profile_hash=? AND status='DONE' AND updated_at>?",
          this.profile().profile_hash,
          iso(new Date(this.clock().getTime() - 86400000)),
        );
        const query = dayQueries
          .map((q) => `${p.searchScope}\n${q}`)
          .find((q) => !recent.some((r) => r.query === q));
        if (!query) {
          this.store.set('workerStatus', 'WAITING_FOR_NEW_SOURCES');
          this.store.set('autoNextResearchAt', iso(new Date(this.clock().getTime() + 3600000)));
          return;
        }
        this.enqueue(`auto-${id()}`, query, 3 - pending);
        this.store.set(
          'autoNextResearchAt',
          iso(new Date(this.clock().getTime() + p.researchIntervalSeconds * 1000)),
        );
      }
      await ResearchJobHunter.prototype.tick.call(this);
      if (this.state().paused && !this.state().stopped) {
        const reason = this.state().status;
        if (reason === 'ITEMS_NEED_REVIEW') {
          this.store.exec("UPDATE runs SET status='PARTIAL' WHERE status='PAUSED'");
          this.store.set('paused', false);
        } else this.wait(reason);
      }
    } catch (e) {
      if (!this.state().stopped) this.wait(e instanceof DomainError ? e.code : 'AUTO_ERROR');
    } finally {
      this.pumping = false;
      if (this.state().stopped) this.store.set('workerStatus', 'STOPPED');
    }
  }
  private autoTimers: ReturnType<typeof setInterval>[] = [];
  override startWorker() {
    this.autoTimers.push(
      setInterval(() => void this.tick(), 750),
      setInterval(() => void this.dispatchOne(), 750),
    );
  }
  override async stopWorker() {
    this.control('stop');
    for (const timer of this.autoTimers) clearInterval(timer);
    this.autoTimers = [];
    await super.stopWorker();
    while (this.starting || this.preparing || this.pumping)
      await new Promise((r) => setTimeout(r, 10));
  }
  override dashboard() {
    const d = super.dashboard();
    d.state.auto = {
      policy: this.policyConfig(),
      session: this.sessionId
        ? this.store.one('SELECT * FROM auto_sessions WHERE id=?', this.sessionId)
        : null,
      sync: this.historySync?.status(),
      nextSendAt: this.store.get('autoNextSendAt', null),
      nextResearchAt: this.store.get('autoNextResearchAt', null),
    };
    d.stats.sent = this.store.one(
      "SELECT count(*) n FROM outbox WHERE kind='FIRST_CONTACT' AND status IN ('SENT_PROVIDER','SENT_CONFIRMED')",
    )!.n;
    d.stats.sent += this.store.one(
      "SELECT count(*) n FROM shared_attempts s WHERE state IN ('SENT_PROVIDER','SENT_CONFIRMED') AND NOT EXISTS (SELECT 1 FROM send_attempts a WHERE a.id=s.id)",
    )!.n;
    d.stats.discovered = this.store.one(
      'SELECT count(DISTINCT company_id) n FROM research_items WHERE company_id IS NOT NULL',
    )!.n;
    d.stats.skipped = this.store.one(
      "SELECT count(*) n FROM audit_events WHERE action='AUTO_SKIPPED'",
    )!.n;
    d.stats.skipped += this.store.one(
      "SELECT count(*) n FROM research_items WHERE status IN ('ERROR','UNAVAILABLE')",
    )!.n;
    d.stats.skipped += this.store.one(
      "SELECT count(*) n FROM opportunities WHERE decision='REJECTED'",
    )!.n;
    return d;
  }
  override companies(): (Row & { researchDetails: any })[] {
    const unique = new Map<string, Row & { researchDetails: any }>();
    for (const c of super.companies())
      if (!unique.has(c.id)) {
        const sharedContext = this.store.one(
          'SELECT * FROM shared_company_context WHERE company_id=?',
          c.id,
        );
        const sources = this.store.all(
          'SELECT canonical_url,fetched_at,fragment FROM evidence WHERE company_id=?',
          c.id,
        );
        unique.set(c.id, {
          ...c,
          description: sharedContext?.description ?? c.title,
          sharedAttempt: this.store.one(
            'SELECT * FROM shared_attempts WHERE company_id=? ORDER BY created_at DESC LIMIT 1',
            c.id,
          ),
          skipReason: this.store.one(
            "SELECT message FROM audit_events WHERE action='AUTO_SKIPPED' AND entity_id IN (SELECT id FROM drafts WHERE company_id=?) ORDER BY created_at DESC LIMIT 1",
            c.id,
          )?.message,
          sources: sources.length
            ? sources
            : JSON.parse(sharedContext?.sources ?? '[]').map((s: Row) => ({
                canonical_url: s.url,
                fetched_at: s.checkedAt,
                fragment: s.fragment,
              })),
        });
      }
    return [...unique.values()];
  }
}
