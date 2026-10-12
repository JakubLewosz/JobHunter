import { z } from 'zod';
import type { Row } from '../../../packages/shared/types.js';
import { GmailJobHunter, type DeliveryKind } from './gmail/service.js';
import type { AccountInfo } from './gmail/oauth.js';
import { ResearchJobHunter, dayQueries } from './research/service.js';
import { HistorySync } from './history-sync.js';
import { Store } from './db.js';
import { DomainError, hash, id, iso, day, companyDomain } from './util.js';
import { validateAnalysis, compact, contactEligibility } from './research/contracts.js';
import { QueryPlanner } from './research/query-planner.js';
import { priorApplicationException } from './prior-applications.js';

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

type Operation = {
  draftId: string;
  draftVersion: number;
  companyId: string;
  sessionId: string;
  epoch: number;
  binding: string;
  contactBinding: string;
  outboxId?: string;
};
export function autoErrorDecision(
  code: string,
): 'company' | 'draft' | 'read-retry' | 'review-wait' | 'sender' | 'session' {
  if (code === 'DRAFT_MATERIAL_UNVERIFIED') return 'review-wait';
  if (
    [
      'GMAIL_CONTACT_HISTORY',
      'CONTACT_HISTORY',
      'RECIPIENT_HISTORY',
      'ALREADY_SENT',
      'DUPLICATE_CONTACT',
      'SUPPRESSED',
    ].includes(code)
  )
    return 'company';
  if (
    [
      'VERSION_CONFLICT',
      'PREVIEW_CHANGED',
      'APPROVAL_CHANGED',
      'INVALID_DRAFT',
      'SEMANTIC_REVIEW_REQUIRED',
      'CONTACT_POLICY',
      'QUALIFICATION_REQUIRED',
      'CONTACT_REVIEW',
      'STALE_EVIDENCE',
      'STALE_CONTACT',
      'UNVERIFIED_COMPANY',
      'UNVERIFIED_QUOTE',
      'INVALID_RECIPIENT',
      'MIME_CHANGED',
      'DRAFT_MATERIAL_STALE',
    ].includes(code)
  )
    return 'draft';
  if (['HISTORY_CHANGED', 'GMAIL_READ'].includes(code)) return 'read-retry';
  if (
    [
      'GMAIL_RATE_LIMIT',
      'GMAIL_HISTORY_LIMIT',
      'GMAIL_PAGINATION',
      'GMAIL_SEND_BLOCKED',
      'FAILED_NOT_SENT',
      'DAILY_LIMIT',
      'SESSION_LIMIT',
    ].includes(code)
  )
    return 'sender';
  // Unknown errors never authorize an operation or turn an incomplete read into empty history.
  return 'session';
}
export class AutoPolicyJobHunter extends GmailJobHunter {
  private sync?: HistorySync;
  get historySync() {
    return (this.sync ??= new HistorySync(this.store));
  }
  readonly queryPlanner: QueryPlanner;
  private pumping = false;
  private sessionId: string | null = null;
  private sessionEnabled = false;
  private preparing = false;
  private starting = false;
  private transferring = false;
  private controlEpoch = 0;
  private preparationController?: AbortController;
  constructor(store: Store, options: ConstructorParameters<typeof GmailJobHunter>[1] = {}) {
    super(store, { ...options, mode: 'AUTO_POLICY' });
    this.queryPlanner = new QueryPlanner(store, this.clock);
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
  historyMode(): 'LOCAL_ONLY' | 'PRIVATE_GIT' {
    const mode = this.store.get(
      'historyStorageMode',
      this.store.get('historySyncConfig', null) ? 'PRIVATE_GIT' : 'LOCAL_ONLY',
    );
    if (mode !== 'LOCAL_ONLY' && mode !== 'PRIVATE_GIT')
      throw new DomainError(
        'HISTORY_STORAGE_UNKNOWN',
        'Nieznana konfiguracja historii wymaga sprawdzenia.',
      );
    return mode;
  }
  private assertHistory() {
    this.store.assertExclusive();
    if (this.historyMode() === 'PRIVATE_GIT') {
      this.historySync.assertOwner();
      return;
    }
    if (this.runtime.kind === 'WORKSTATION') this.runtime.assertNative();
    else if (!this.fictionalProviders || !this.store.get('localHistoryConfirmed', false))
      throw new DomainError(
        'LOCAL_HISTORY_REQUIRED',
        'Sprawdź właściwą lokalną historię. Development nie ma prawa do prawdziwej poczty.',
      );
  }
  historyState() {
    if (this.historyMode() === 'PRIVATE_GIT')
      return { ...this.historySync.status(), mode: 'PRIVATE_GIT' };
    let configured = false;
    try {
      this.assertHistory();
      configured = true;
    } catch {}
    return {
      mode: 'LOCAL_ONLY',
      configured,
      status: 'LOCAL_ONLY',
      directory: this.store.dir,
      priorApplications: priorApplicationException(this.store),
    };
  }
  async configureLocalHistory(input: {
    confirmedHistory: boolean;
    confirmedSingleWorkstation: boolean;
  }) {
    if (!input.confirmedHistory || !input.confirmedSingleWorkstation)
      throw new DomainError(
        'LOCAL_HISTORY_REQUIRED',
        'Potwierdź pełną dotychczasową historię i jeden komputer roboczy.',
      );
    if (
      !this.state().stopped ||
      this.starting ||
      this.preparing ||
      this.sending ||
      this.researching ||
      this.transferring
    )
      throw new DomainError(
        'SESSION_ACTIVE',
        'Zatrzymaj sesję i zaczekaj na zakończenie operacji.',
      );
    if (
      this.store.one("SELECT id FROM outbox WHERE status IN ('SENDING','SEND_UNKNOWN')") ||
      this.store.one(
        "SELECT s.id FROM shared_attempts s WHERE state IN ('SENDING','SEND_UNKNOWN') AND NOT EXISTS(SELECT 1 FROM send_attempts a WHERE a.id=s.id AND a.state IN ('SENT_PROVIDER','SENT_CONFIRMED'))",
      )
    )
      throw new DomainError('SEND_UNKNOWN', 'Zmiana historii nie rozstrzyga niepewnych prób.');
    this.transferring = true;
    try {
      this.store.assertHealthy();
      if (this.historyMode() === 'PRIVATE_GIT') await this.historySync.confirmLocalTransition();
      this.store.atomic(() => {
        this.store.set('historyStorageMode', 'LOCAL_ONLY');
        this.store.set('localHistoryConfirmed', true);
        this.revokeApprovals('Jawna zmiana sposobu przechowywania historii');
        this.event(
          'LOCAL_HISTORY_CONFIRMED',
          'Historia lokalna na jednym komputerze; zachowano wszystkie dotychczasowe rekordy.',
          null,
          'user',
        );
      });
      return this.historyState();
    } finally {
      this.transferring = false;
    }
  }
  configurePolicy(raw: unknown) {
    if (
      this.sessionId ||
      this.sending ||
      this.researching ||
      this.preparing ||
      this.starting ||
      this.transferring
    )
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
      priorApplications: priorApplicationException(this.store),
      approvedAt: this.now(),
      scopeHash: hash(
        JSON.stringify({
          scope: input.searchScope,
          kinds: input.contactKinds,
          types: input.contactTypes,
          profile: p.hash,
        }),
      ),
    };
    const policyHash = hash(JSON.stringify(config));
    this.store.atomic(() => {
      if (this.policyConfig()?.scopeHash !== config.scopeHash) {
        this.store.exec(
          "UPDATE runs SET status='CANCELLED',finished_at=?,error='SCOPE_CHANGED' WHERE campaign_id=? AND status IN ('QUEUED','RUNNING','PAUSED')",
          this.now(),
          this.campaignId,
        );
        this.store.set('autoNextResearchAt', this.now());
      }
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
    if (
      hash(JSON.stringify(p.priorApplications ?? null)) !==
      hash(JSON.stringify(priorApplicationException(this.store)))
    )
      throw new DomainError(
        'POLICY_PRIOR_APPLICATIONS_CHANGED',
        'Decyzja o wcześniejszych zgłoszeniach zmieniła się; ponownie sprawdź politykę.',
      );
    if (!p.scopeHash)
      throw new DomainError(
        'POLICY_SCOPE_REQUIRED',
        'Po aktualizacji sprawdź zakres i ponownie zatwierdź politykę w Ustawieniach.',
      );
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
      (!this.sessionEnabled ||
        !this.sessionId ||
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
  protected override enqueue(key: string, query: string | null, maxDrafts: number) {
    const runId = super.enqueue(key, query, maxDrafts);
    this.store.exec(
      'INSERT OR REPLACE INTO auto_run_scope VALUES (?,?)',
      runId,
      this.policyConfig()!.scopeHash,
    );
    return runId;
  }
  private inScope(d: Row) {
    return (
      !!this.policyConfig()?.scopeHash &&
      this.store.one('SELECT scope_hash FROM auto_draft_scope WHERE draft_id=?', d.id)
        ?.scope_hash === this.policyConfig()?.scopeHash
    );
  }
  override async start(_query?: string) {
    await this.startAuto();
  }
  async startAuto() {
    if (
      this.sessionId &&
      !this.state().paused &&
      !this.state().stopped &&
      !this.store.get('autoSenderWait', null)
    )
      throw new DomainError('BUSY', 'Sesja już pracuje.');
    if (this.starting || this.researching || this.preparing || this.sending || this.transferring)
      throw new DomainError('BUSY', 'Trwa kończenie poprzedniej operacji.');
    const p = this.assertPolicy(false);
    this.store.assertHealthy();
    if (!this.capability('codexCapability').tested || !this.capability('searchCapability').tested)
      throw new DomainError(
        'SEARCH_NOT_TESTED',
        'Sprawdź bieżącą integrację Codexa i wyszukiwanie w Ustawieniach.',
      );
    this.starting = true;
    const epoch = this.controlEpoch;
    try {
      if (this.sessionId) {
        this.assertHistory();
        this.store.exec(
          "UPDATE auto_sessions SET status='RUNNING',reason=NULL WHERE id=?",
          this.sessionId,
        );
      } else {
        if (this.historyMode() === 'PRIVATE_GIT') await this.historySync.claim();
        else this.assertHistory();
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
      this.store.set('autoSenderWait', null);
      this.store.set('autoSenderReason', null);
      this.store.set('killSwitch', false);
      this.store.set('workerStatus', 'RUNNING');
      // Never catch up with a burst after a pause/restart/sleep.
      this.store.set(
        'autoNextSendAt',
        iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
      );
      this.store.set(
        'autoNextResearchAt',
        this.store.get<string>('autoNextResearchAt', '') > this.now()
          ? this.store.get('autoNextResearchAt', this.now())
          : this.now(),
      );
      const run = this.store.one("SELECT id FROM runs WHERE status='PAUSED'");
      if (run) await ResearchJobHunter.prototype.start.call(this, p.searchScope);
      if (epoch !== this.controlEpoch)
        throw new DomainError('CANCELLED', 'Uprawnienie Start zostało odwołane.');
      this.assertPolicy(false);
      this.event(
        'AUTO_STARTED',
        'Start — szukaj i wysyłaj zgodnie z zatwierdzoną polityką.',
        this.sessionId,
        'user',
      );
      this.sessionEnabled = true;
    } finally {
      this.starting = false;
    }
  }
  override control(action: 'pause' | 'stop' | 'emergency-stop' | 'resume-sender') {
    if (action === 'resume-sender')
      throw new DomainError('START_REQUIRED', 'Użyj jawnego Start/Wznów sesję.');
    this.revokeSessionAuthority();
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
  protected revokeSessionAuthority() {
    this.sessionEnabled = false;
  }
  async handoff() {
    if (this.historyMode() === 'LOCAL_ONLY')
      throw new DomainError(
        'LOCAL_ONLY',
        'Historia jest lokalna. Użyj Stop, bez przekazywania urządzeniu.',
      );
    if (this.transferring) throw new DomainError('BUSY', 'Trwa przekazanie historii.');
    this.transferring = true;
    try {
      this.control('stop');
      // Control aborts research immediately; wait only for our operations, including a POST already in flight.
      while (this.starting || this.researching || this.sending || this.preparing)
        await new Promise((r) => setTimeout(r, 10));
      await this.historySync.checkpoint(true);
      return this.historySync.status();
    } finally {
      this.transferring = false;
    }
  }
  async prepareHistory() {
    if (this.historyMode() === 'LOCAL_ONLY')
      throw new DomainError('LOCAL_ONLY', 'Historia lokalna nie wymaga eksportu do repozytorium.');
    if (this.transferring) throw new DomainError('BUSY', 'Trwa przygotowanie historii.');
    if (!this.state().stopped)
      throw new DomainError('SESSION_ACTIVE', 'Zatrzymaj sesję przed przygotowaniem historii.');
    this.transferring = true;
    try {
      this.control('stop');
      while (this.starting || this.researching || this.sending || this.preparing)
        await new Promise((r) => setTimeout(r, 10));
      await this.historySync.claim();
      await this.historySync.checkpoint(true);
      return this.historySync.status();
    } finally {
      this.transferring = false;
    }
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
      if (!this.inScope(d)) problems.push('SCOPE_CHANGED');
      this.assertHistory();
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
      problems.push(...this.draftMaterialIssues(d));
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
      if (!contactEligibility(verified, sources as any).allowed)
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
  }): Promise<never> {
    throw new DomainError(
      'AUTO_POLICY_ONLY',
      'W AUTO_POLICY wiadomości dopuszcza kod aktywnej sesji.',
    );
  }
  private contactBinding(d: Row) {
    const c = this.store.one(
      'SELECT id,email,kind,evidence_id FROM contacts WHERE id=?',
      d.contact_id,
    );
    return hash(JSON.stringify({ opportunity: d.opportunity_id, contact: c }));
  }
  private awaitingDraftReview(d: Row) {
    const material = this.store.one(
      'SELECT review_status FROM research_draft_materials WHERE draft_id=? AND version=?',
      d.id,
      d.version,
    );
    // ERROR needs an explicit review-only retry, not rejection or automatic regeneration.
    return !!material && ['PENDING', 'RUNNING', 'ERROR'].includes(material.review_status);
  }
  private dispatchErrorDecision(code: string, op?: Operation) {
    // A final gate may observe a review started after selection. Never revoke it.
    if (code === 'DRAFT_MATERIAL_UNVERIFIED' && op) {
      const d = this.store.one(
        'SELECT * FROM drafts WHERE id=? AND version=?',
        op.draftId,
        op.draftVersion,
      );
      if (!d || !this.awaitingDraftReview(d)) return 'draft';
    }
    return autoErrorDecision(code);
  }
  private selected(op: Operation) {
    if (op.sessionId !== this.sessionId || op.epoch !== this.controlEpoch)
      throw new DomainError('SESSION_STOPPED', 'Uprawnienie wybranej operacji zostało odwołane.');
    this.assertPolicy();
    const d = this.draft(op.draftId, op.draftVersion);
    if (this.binding(d) !== op.binding || this.contactBinding(d) !== op.contactBinding)
      throw new DomainError('VERSION_CONFLICT', 'Treść lub kontakt wybranej wersji zmieniły się.');
    return d;
  }
  private skip(op: Operation, code: string, message: string) {
    this.store.atomic(() => {
      const inserted = this.store.exec(
        'INSERT OR IGNORE INTO auto_skips VALUES (?,?,?,?,?,?,?,?)',
        op.draftId,
        op.draftVersion,
        op.companyId,
        op.sessionId,
        op.outboxId ?? null,
        code,
        message,
        this.now(),
      ).changes;
      this.store.set(`autoSkipped:${op.draftId}:${op.draftVersion}`, true);
      if (code === 'GMAIL_CONTACT_HISTORY')
        this.store.exec(
          "UPDATE companies SET history_status='CONTACTED',updated_at=? WHERE id=? AND history_status='NEW'",
          this.now(),
          op.companyId,
        );
      if (inserted)
        this.event('AUTO_SKIPPED', `Wersja ${op.draftVersion}: ${code} — ${message}`, op.draftId);
    });
  }
  private readRetry(op: Operation, reason: string) {
    const key = `autoReadRetries:${op.draftId}:${op.draftVersion}`;
    const attempts = this.store.get<number>(key, 0) + 1;
    this.store.set(key, attempts);
    if (attempts >= 3) {
      this.wait(reason);
      return;
    }
    this.store.set('autoSenderReason', reason);
    this.store.set(
      'autoNextSendAt',
      iso(
        new Date(
          this.clock().getTime() +
            Math.max(this.policyConfig()!.sendIntervalSeconds * 1000, 60000 * 2 ** attempts),
        ),
      ),
    );
  }
  private wait(reason: string) {
    if (autoErrorDecision(reason) === 'sender' && reason !== 'SESSION_LIMIT' && this.sessionId) {
      this.store.exec('UPDATE auto_sessions SET reason=? WHERE id=?', reason, this.sessionId);
      this.store.set('autoSenderWait', reason);
      this.store.set('gmailSenderPaused', true);
      this.store.set('workerStatus', reason);
      return;
    }
    this.revokeSessionAuthority();
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
      this.sending ||
      this.store.get('autoSenderWait', null)
    )
      return;
    const p = this.policyConfig()!;
    if (this.store.get('autoNextSendAt', '') > this.now()) return;
    this.preparing = true;
    this.preparationController = new AbortController();
    let operation: Operation | undefined;
    const epoch = this.controlEpoch;
    try {
      this.assertPolicy();
      this.assertHistory();
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
              d.status !== 'SENT' &&
              this.inScope(d) &&
              !this.awaitingDraftReview(d) &&
              !this.store.get(`autoSkipped:${d.id}:${d.version}`, false),
          );
      if (!queued && !candidate) {
        this.store.set(
          'autoNextSendAt',
          iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
        );
        return;
      }
      const chosen =
        candidate ??
        this.draft(this.packet(queued!.id).draft_id, this.packet(queued!.id).draft_version);
      operation = {
        draftId: chosen.id,
        draftVersion: chosen.version,
        companyId: chosen.company_id,
        sessionId: this.sessionId!,
        epoch,
        binding: this.binding(chosen),
        contactBinding: this.contactBinding(chosen),
        outboxId: queued?.id,
      };
      if (this.historyMode() === 'PRIVATE_GIT') await this.historySync.checkpoint();
      this.selected(operation);
      if (!queued) {
        await this.refreshDraftSources(operation.draftId, this.preparationController.signal);
        this.selected(operation);
        const account = await this.gateway.account();
        const d = this.selected(operation);
        const publicProblems = this.issues(d, 'FIRST_CONTACT', account, false);
        if (publicProblems.length)
          throw new DomainError(
            publicProblems[0],
            'Kontakt lub szkic nie przeszedł kontroli publicznych dowodów i polityki. Nie odczytano historii Gmaila.',
          );
        // Only selected contacts/domains; policy consent never scans the whole inbox.
        await this.checkHistory({ drafts: [{ id: d.id, version: d.version }], consent: true });
        this.selected(operation);
        const preview = await this.prepareDelivery({
          drafts: [{ id: d.id, version: d.version }],
          cvId: p.cvId,
          kind: 'FIRST_CONTACT',
        });
        this.selected(operation);
        await super.approveDelivery({
          previewId: preview.id,
          previewHash: preview.previewHash,
          confirmed: true,
        });
        this.selected(operation);
        for (const item of this.preview(preview.id).items)
          this.store.exec('INSERT INTO auto_outbox VALUES (?,?)', item.outbox_id, this.sessionId);
        queued = { id: this.preview(preview.id).items[0].outbox_id };
        operation.outboxId = queued.id;
      }
      await super.dispatchOne(queued.id);
      if (operation.epoch !== this.controlEpoch || operation.sessionId !== this.sessionId) return;
      this.store.set(
        'autoNextSendAt',
        iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
      );
      const result = this.store.one('SELECT status FROM outbox WHERE id=?', queued.id);
      if (result && ['SENT_PROVIDER', 'SENT_CONFIRMED'].includes(result.status)) {
        this.store.set('autoSenderReason', null);
        this.store.set(`autoReadRetries:${operation.draftId}:${operation.draftVersion}`, 0);
      }
      if (result?.status === 'SEND_UNKNOWN') this.wait('SEND_UNKNOWN');
      else if (result?.status === 'FAILED_NOT_SENT') this.wait('GMAIL_SEND_BLOCKED');
      else if (result?.status === 'BLOCKED') {
        const reason = this.store.get<string>('gmailLastError', 'GMAIL_SEND_BLOCKED');
        const decision = this.dispatchErrorDecision(reason, operation);
        if (decision === 'company' || decision === 'draft')
          this.skip(
            operation,
            reason,
            'Kontrola przed wysyłką zablokowała tę wersję; nie wykonano POST.',
          );
        else if (decision === 'read-retry') this.readRetry(operation, reason);
        else if (decision === 'review-wait') this.store.set('autoSenderReason', reason);
        else this.wait(reason);
      }
      if (this.quotaIssues().length) this.wait(this.quotaIssues()[0]);
    } catch (e) {
      const code = e instanceof DomainError ? e.code : 'AUTO_ERROR';
      if (epoch !== this.controlEpoch || this.state().paused || this.state().stopped) return;
      const decision = this.dispatchErrorDecision(code, operation);
      if (operation && (decision === 'company' || decision === 'draft')) {
        this.skip(
          operation,
          code,
          e instanceof DomainError ? e.message : 'Niepewna wersja szkicu.',
        );
        this.store.set(
          'autoNextSendAt',
          iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
        );
      } else if (decision === 'review-wait') {
        this.store.set('autoSenderReason', code);
        this.store.set(
          'autoNextSendAt',
          iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
        );
      } else if (operation && decision === 'read-retry') this.readRetry(operation, code);
      else this.wait(code);
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
          (d) =>
            d.status !== 'SENT' &&
            this.inScope(d) &&
            !this.store.get(`autoSkipped:${d.id}:${d.version}`, false),
        ).length;
        if (pending >= 3) {
          this.store.set('workerStatus', 'QUEUE_FULL');
          return;
        }
        const p = this.policyConfig()!;
        const backlog = this.store.one(
          "SELECT r.id FROM runs r JOIN research_run_config c ON c.run_id=r.id JOIN auto_run_scope s ON s.run_id=r.id WHERE r.status='PARTIAL' AND c.profile_hash=? AND s.scope_hash=? AND EXISTS(SELECT 1 FROM research_items i WHERE i.run_id=r.id AND i.status='PENDING' AND i.stage='DRAFT') ORDER BY r.started_at LIMIT 1",
          this.profile().profile_hash,
          p.scopeHash,
        );
        if (backlog) {
          const count = this.store.get<number>(`draftedInRun:${backlog.id}`, 0);
          this.store.exec(
            'UPDATE research_run_config SET max_drafts=? WHERE run_id=?',
            count + 3 - pending,
            backlog.id,
          );
          this.store.exec("UPDATE runs SET status='QUEUED' WHERE id=?", backlog.id);
        } else {
          const plan = this.queryPlanner.next(p, this.profile().facts);
          if (!plan.query) {
            this.store.set('workerStatus', 'RESEARCH_COOLDOWN');
            this.store.set('autoNextResearchAt', plan.nextAt);
            return;
          }
          const runId = this.enqueue(`auto-${id()}`, plan.query, 3 - pending);
          this.queryPlanner.started(plan.id!, runId);
        }
        this.store.set(
          'autoNextResearchAt',
          iso(new Date(this.clock().getTime() + p.researchIntervalSeconds * 1000)),
        );
      }
      await ResearchJobHunter.prototype.tick.call(this);
      this.queryPlanner.reconcile(this.policyConfig()!.scopeHash);
      const cooldown = this.store.get<string>(
        `plannerCooldown:${this.policyConfig()!.scopeHash}`,
        '',
      );
      if (cooldown > this.now()) {
        this.store.set('autoNextResearchAt', cooldown);
        this.store.set('workerStatus', 'RESEARCH_COOLDOWN');
      }
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
      sync: this.historyState(),
      runtime: this.runtime.kind,
      fictionalProviders: this.fictionalProviders,
      nextSendAt: this.store.get('autoNextSendAt', null),
      nextResearchAt: this.store.get('autoNextResearchAt', null),
      senderWait: this.store.get('autoSenderWait', null),
      senderReason: this.store.get('autoSenderReason', null),
      researching: this.researching,
      sending: this.sending || this.preparing,
      queueSize: this.draftRows().filter(
        (d) =>
          d.status !== 'SENT' &&
          this.inScope(d) &&
          !this.store.get(`autoSkipped:${d.id}:${d.version}`, false),
      ).length,
      readiness: {
        materials: !!this.profile().approved_at,
        cv:
          !!this.policyConfig() &&
          !!this.store.one(
            'SELECT approved_at FROM cv_assets WHERE id=?',
            this.policyConfig()!.cvId,
          )?.approved_at,
        gmail: this.deliveryState().readReady && this.deliveryState().sendReady,
        codex:
          this.capability('codexCapability').tested && this.capability('searchCapability').tested,
        policy: (() => {
          try {
            this.assertPolicy(false);
            return true;
          } catch {
            return false;
          }
        })(),
        history: this.historyState().configured,
        database: (() => {
          try {
            this.store.assertHealthy();
            return true;
          } catch {
            return false;
          }
        })(),
        installation: this.fictionalProviders || this.runtime.kind === 'WORKSTATION',
        unresolved:
          !!this.store.one("SELECT id FROM outbox WHERE status IN ('SENDING','SEND_UNKNOWN')") ||
          !!this.store.one(
            "SELECT s.id FROM shared_attempts s WHERE state IN ('SENDING','SEND_UNKNOWN') AND NOT EXISTS(SELECT 1 FROM send_attempts a WHERE a.id=s.id AND a.state IN ('SENT_PROVIDER','SENT_CONFIRMED'))",
          ),
      },
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
      "SELECT count(DISTINCT company_id) n FROM (SELECT company_id FROM auto_skips UNION SELECT company_id FROM opportunities WHERE decision='REJECTED')",
    )!.n;
    d.stats.unreadSources = this.store.one(
      "SELECT count(*) n FROM research_items WHERE status IN ('ERROR','UNAVAILABLE')",
    )!.n;
    return d;
  }
  override companies(): (Row & { researchDetails: any })[] {
    const contexts = new Map(
      this.store.all('SELECT * FROM shared_company_context').map((r) => [r.company_id, r]),
    );
    const attempts = new Map<string, Row>();
    for (const row of this.store.all('SELECT * FROM shared_attempts ORDER BY created_at DESC'))
      if (!attempts.has(row.company_id)) attempts.set(row.company_id, row);
    const sourcesByCompany = new Map<string, Row[]>(),
      skipsByCompany = new Map<string, Row[]>();
    for (const row of this.store.all(
      'SELECT company_id,canonical_url,fetched_at,fragment FROM evidence',
    )) {
      const list = sourcesByCompany.get(row.company_id) ?? [];
      list.push(row);
      sourcesByCompany.set(row.company_id, list);
    }
    for (const row of this.store.all('SELECT * FROM auto_skips ORDER BY created_at DESC')) {
      const list = skipsByCompany.get(row.company_id) ?? [];
      list.push(row);
      skipsByCompany.set(row.company_id, list);
    }
    const contacted = new Map(
      this.store
        .all(
          `SELECT company_id,max(at) at FROM (
      SELECT company_id,created_at at FROM outbox WHERE kind='FIRST_CONTACT' AND status IN ('SENT_PROVIDER','SENT_CONFIRMED','SEND_UNKNOWN','SENDING')
      UNION ALL SELECT company_id,created_at at FROM shared_attempts WHERE state<>'FAILED_NOT_SENT'
      UNION ALL SELECT company_id,occurred_at at FROM history_records WHERE status<>'SUGGESTED'
      UNION ALL SELECT m.company_id,m.sent_at at FROM gmail_messages m LEFT JOIN outbox o ON o.id=m.outbox_id WHERE m.outbox_id IS NULL OR o.kind='FIRST_CONTACT'
    ) GROUP BY company_id`,
        )
        .map((r) => [r.company_id, r.at]),
    );
    const unique = new Map<string, Row & { researchDetails: any }>();
    for (const c of super.companies())
      if (!unique.has(c.id)) {
        const sharedContext = contexts.get(c.id);
        const sources = sourcesByCompany.get(c.id) ?? [];
        unique.set(c.id, {
          ...c,
          description: sharedContext?.description ?? c.title,
          sharedAttempt: attempts.get(c.id),
          skipReason: skipsByCompany.get(c.id)?.[0]?.message,
          skips: skipsByCompany.get(c.id) ?? [],
          lastContactAt: contacted.get(c.id),
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
  protected override recentCompanies() {
    return this.store.all(
      'SELECT c.*,o.id opportunity_id,o.title,o.decision FROM opportunities o JOIN companies c ON c.id=o.company_id ORDER BY c.created_at DESC LIMIT 4',
    );
  }
}
