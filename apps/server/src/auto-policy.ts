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
import { contactSourceAuthority } from './research/source-policy.js';
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
type BatchSummary = Row & {
  items: (Row & { state: string; packets: Row[] })[];
  counts: {
    total: number;
    sent: number;
    remaining: number;
    skipped: number;
    needsPreparation: number;
    uncertain: number;
  };
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
      'EDITORIAL_QUALITY_REQUIRED',
      'EDITORIAL_REVIEW_REQUIRED',
      'TEMPLATE_STYLE_PREFERENCES_REQUIRED',
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
      'BATCH_MATERIALS_CHANGED',
      'BATCH_SCOPE_CHANGED',
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
  private startingBatch = false;
  private approvalOperation?: Operation & { batchId: string | null };
  private transferring = false;
  private controlEpoch = 0;
  private preparationController?: AbortController;
  private activeBatchId: string | null = null;
  private libraryResearch = false;
  private plannedActivation?: { jobId: string; generation: string; batchId: string };
  private nightflowSendGuard?: () => void;
  setNightflowSendGuard(guard?: () => void) {
    this.nightflowSendGuard = guard;
  }
  operationEpoch() {
    return this.controlEpoch;
  }
  async activateNightflowBatch(jobId: string, generation: string) {
    const job = this.store.one(
      "SELECT * FROM nightflow_jobs WHERE id=? AND generation=? AND state='SENDING'",
      jobId,
      generation,
    );
    if (!job?.batch_id) throw new DomainError('SESSION_STOPPED', 'Brak aktywnego wykonania planu.');
    this.plannedActivation = { jobId, generation, batchId: job.batch_id };
    try {
      await this.startBatch(job.batch_id);
    } finally {
      this.plannedActivation = undefined;
    }
  }
  protected override researchOnlySession() {
    return this.libraryResearch;
  }
  async startLibraryResearch(
    query: string | undefined,
    hours: number,
    resume = false,
    deadline?: string,
  ) {
    if (this.sessionId || this.preparing || this.sending || this.researching || this.starting)
      throw new DomainError('BUSY', 'Zatrzymaj nadawanie przed researchem biblioteki.');
    if (!this.policyConfig())
      throw new DomainError('POLICY_REQUIRED', 'Zapisz zakres i materiały biblioteki w polityce.');
    this.libraryResearch = true;
    try {
      await this.researchController().start(async () => {
        if (resume) await ResearchJobHunter.prototype.resumeSession.call(this);
        else {
          await ResearchJobHunter.prototype.startDay.call(this, query, hours, {
            deadlineOnly: true,
          });
          if (deadline) {
            const work = this.store.get<Row>('researchDay', {});
            if (deadline > work.expiresAt)
              throw new DomainError('DEADLINE_CHANGED', 'Nie wolno wydłużyć researchu.');
            this.store.set('researchDay', { ...work, expiresAt: deadline });
          }
        }
      }, resume);
    } catch (e) {
      this.libraryResearch = false;
      throw e;
    }
  }
  constructor(store: Store, options: ConstructorParameters<typeof GmailJobHunter>[1] = {}) {
    super(store, { ...options, mode: 'AUTO_POLICY' });
    this.queryPlanner = new QueryPlanner(store, this.clock, (d) => this.draftMaterialIssues(d));
    store.exec(
      "UPDATE auto_sessions SET status='STOPPED',stopped_at=?,reason='RESTART' WHERE status IN ('RUNNING','PAUSED','WAITING')",
      this.now(),
    );
    store.set('stopped', true);
    store.set('paused', false);
    store.set('workerStatus', 'STOPPED');
    store.exec(
      "UPDATE auto_batches SET state='STOPPED',reason='RESTART',updated_at=? WHERE state='RUNNING'",
      this.now(),
    );
    const context = store.get<Row | null>('browserExecutionContext', null);
    if (context) store.set('browserExecutionContext', { ...context, state: 'STOPPED' });
  }
  batches() {
    return this.store
      .all('SELECT * FROM auto_batches ORDER BY prepared_at DESC LIMIT 50')
      .map((b) => this.batchSummary(b.id));
  }
  nightflowBinding() {
    const policy = this.assertPolicy(false);
    this.assertHistory();
    return hash(
      JSON.stringify({
        policy,
        profile: this.profile(),
        transport: this.sendTransport(),
        campaign: this.campaignId,
      }),
    );
  }
  completeLibraryResearch(sessionId: string, deadline: string) {
    const outcome = this.researchController().state();
    if (
      this.researching ||
      this.probing ||
      outcome.sessionId !== sessionId ||
      outcome.deadline !== deadline ||
      outcome.phase !== 'FINISHED' ||
      outcome.finalGuardOk !== true ||
      !['DEADLINE', 'NO_NEW_QUERIES'].includes(outcome.primaryReason)
    )
      throw new DomainError('RESEARCH_OUTCOME_REJECTED', 'Nie zakończono kontroli researchu.');
    this.store.atomic(() => {
      this.deferPendingRuns(
        this.store.get<Row>('researchDay', {}).runIds ?? [],
        'RESEARCH_DEADLINE',
      );
      this.store.set('stopped', true);
    });
    this.libraryResearch = false;
  }
  nightflowCandidates(draftIds?: string[]) {
    const policy = this.assertPolicy(false),
      account = this.deliveryState().account!;
    return this.draftRows()
      .filter((d) => !draftIds || draftIds.includes(d.id))
      .map((d) => ({
        d,
        channelRank:
          this.store.one('SELECT kind FROM contacts WHERE id=?', d.contact_id)?.kind ===
          'RECRUITMENT'
            ? 1
            : 0,
        issues: [
          ...this.issues(d, 'FIRST_CONTACT', account, false, policy),
          ...(!this.inScope(d) ? ['SCOPE_CHANGED'] : []),
          ...(this.companyHistoryBlocked(d.company_id) ? ['CONTACT_HISTORY'] : []),
          ...(!this.store.one(
            'SELECT draft_id FROM research_draft_materials WHERE draft_id=? AND version=?',
            d.id,
            d.version,
          )
            ? ['DRAFT_MATERIAL_UNVERIFIED']
            : []),
        ],
      }));
  }
  async evaluateNightflowCandidates(draftIds: string[] | undefined, signal: AbortSignal) {
    signal.throwIfAborted();
    const ids = this.draftRows()
      .filter((d) => !draftIds || draftIds.includes(d.id))
      .map((d) => d.id as string);
    const candidates: ReturnType<AutoPolicyJobHunter['nightflowCandidates']> = [];
    for (const draftId of ids) {
      // Let the real host poll, or deliver Stop, even for a large library.
      // This creates no heartbeat and grants no authority of its own.
      await new Promise<void>((resolve) => setImmediate(resolve));
      signal.throwIfAborted();
      candidates.push(...this.nightflowCandidates([draftId]));
    }
    return candidates;
  }
  nightflowRecipient(draftId: string) {
    const d = this.draftRows().find((d) => d.id === draftId);
    if (!d) throw new DomainError('NOT_FOUND', 'Brak szkicu zamkniętego planu.');
    const contact = this.store.one('SELECT kind FROM contacts WHERE id=?', d.contact_id)!;
    const analysis = JSON.parse(
      this.store.one(
        'SELECT details FROM research_qualifications WHERE opportunity_id=?',
        d.opportunity_id,
      )!.details,
    );
    return {
      draftId,
      companyId: d.company_id as string,
      email: d.email as string,
      kind: contact.kind as string,
      intent: contactEligibility(analysis, this.sourcesForDraft(d)).intent,
    };
  }
  matchesNightflowRecipient(draftId: string, scope: Row[] | undefined) {
    if (!scope) return true;
    const approved = scope.find((r) => r.draftId === draftId);
    if (!approved) return false;
    try {
      const current = this.nightflowRecipient(draftId);
      return Object.entries(current).every(([key, value]) => approved[key] === value);
    } catch {
      return false;
    }
  }
  deriveNightflowBatch(jobId: string, drafts: { id: string; version: number }[]) {
    const job = this.store.one('SELECT * FROM nightflow_jobs WHERE id=?', jobId);
    const plan = job && this.store.one('SELECT * FROM nightflow_plans WHERE id=?', job.plan_id);
    if (
      !job ||
      job.state !== 'CLOSING' ||
      !plan?.approved_at ||
      plan.approved_hash !== plan.content_hash
    )
      throw new DomainError('PLAN_APPROVAL_REQUIRED', 'Brak zgody na reguły wyboru partii.');
    const content = JSON.parse(plan.content);
    if (content.binding !== this.nightflowBinding())
      throw new DomainError('PLAN_CHANGED', 'Materiały planu się zmieniły.');
    if (
      drafts.length > content.maxItems ||
      (content.draftIds &&
        (!content.recipientScope ||
          drafts.some(
            (d) =>
              !content.draftIds.includes(d.id) ||
              !this.matchesNightflowRecipient(d.id, content.recipientScope),
          )))
    )
      throw new DomainError(
        'PLAN_SCOPE_CHANGED',
        'Partia wykracza poza zatwierdzony zakres planu.',
      );
    return this.store.atomic(() => {
      const batch = this.prepareBatch({ drafts });
      this.store.exec(
        'INSERT INTO auto_batch_plan_grants VALUES (?,?,?,?,?,?)',
        batch.id,
        jobId,
        plan.id,
        plan.content_hash,
        batch.approvalHash,
        this.now(),
      );
      if (
        this.store.exec(
          "UPDATE nightflow_jobs SET batch_id=? WHERE id=? AND state='CLOSING' AND generation=?",
          batch.id,
          jobId,
          job.generation,
        ).changes !== 1
      )
        throw new DomainError('SESSION_STOPPED', 'Zamknięcie partii zostało odwołane.');
      return batch;
    });
  }
  batchSummary(batchId: string): BatchSummary {
    const batch = this.store.one('SELECT * FROM auto_batches WHERE id=?', batchId);
    if (!batch) throw new DomainError('NOT_FOUND', 'Brak partii.', 404);
    const items: (Row & { state: string; packets: Row[] })[] = this.store
      .all('SELECT * FROM auto_batch_items WHERE batch_id=? ORDER BY ordinal', batchId)
      .map((item) => {
        const packets = this.store.all(
          'SELECT o.id,o.status,a.id attempt_id FROM auto_batch_outbox b JOIN outbox o ON o.id=b.outbox_id LEFT JOIN send_attempts a ON a.outbox_id=o.id WHERE b.item_id=? ORDER BY o.created_at DESC',
          item.id,
        );
        const uncertain = packets.some((p) => ['SENDING', 'SEND_UNKNOWN'].includes(p.status));
        const sent = packets.some((p) => ['SENT_PROVIDER', 'SENT_CONFIRMED'].includes(p.status));
        let state = uncertain ? 'UNRESOLVED' : sent ? 'SENT' : item.state;
        if (
          !packets.some((p) =>
            ['QUEUED', 'SENDING', 'SEND_UNKNOWN', 'SENT_PROVIDER', 'SENT_CONFIRMED'].includes(
              p.status,
            ),
          ) &&
          state === 'READY'
        ) {
          const external =
            this.store.one(
              "SELECT a.state FROM send_attempts a JOIN outbox o ON o.id=a.outbox_id WHERE o.kind='FIRST_CONTACT' AND (o.company_id=? OR lower(a.recipient)=lower(?)) AND a.state<>'FAILED_NOT_SENT' ORDER BY CASE WHEN a.state IN ('SENDING','SEND_UNKNOWN') THEN 0 ELSE 1 END LIMIT 1",
              item.company_id,
              item.recipient,
            ) ??
            this.store.one(
              "SELECT state FROM shared_attempts WHERE (company_id=? OR lower(recipient)=lower(?)) AND state<>'FAILED_NOT_SENT' ORDER BY CASE WHEN state IN ('SENDING','SEND_UNKNOWN') THEN 0 ELSE 1 END LIMIT 1",
              item.company_id,
              item.recipient,
            );
          if (external && ['SENDING', 'SEND_UNKNOWN'].includes(external.state))
            state = 'UNRESOLVED';
          else if (external || this.companyHistoryBlocked(item.company_id)) {
            state = 'SKIPPED';
            this.store.exec(
              "UPDATE auto_batch_items SET state='SKIPPED',code='CONTACT_HISTORY' WHERE id=?",
              item.id,
            );
          }
        }
        return { ...item, state, packets };
      });
    const uncertain = items.some((i) => i.state === 'UNRESOLVED');
    return {
      ...batch,
      state: uncertain ? 'NEEDS_RESOLUTION' : batch.state,
      approvalHash: this.batchHash(batchId),
      items,
      counts: {
        total: items.length,
        sent: items.filter((i) => i.state === 'SENT').length,
        remaining: items.filter((i) => i.state === 'READY').length,
        skipped: items.filter((i) => i.state === 'SKIPPED').length,
        needsPreparation: items.filter((i) => i.state === 'NEEDS_REPREPARATION').length,
        uncertain: items.filter((i) => i.state === 'UNRESOLVED').length,
      },
    };
  }
  private batchHash(batchId: string) {
    const b = this.store.one('SELECT * FROM auto_batches WHERE id=?', batchId)!;
    const items = this.store.all(
      'SELECT id,ordinal,company_id,contact_id,recipient,draft_id,draft_version,payload_hash,binding,contact_binding,material_binding,qualified_at FROM auto_batch_items WHERE batch_id=? ORDER BY ordinal',
      batchId,
    );
    return hash(JSON.stringify({ revision: b.revision, policy: b.policy_hash, items }));
  }
  prepareBatch(raw: unknown): BatchSummary {
    const input = z
      .object({
        drafts: z
          .array(z.object({ id: z.string(), version: z.number().int().positive() }).strict())
          .min(1)
          .max(200),
      })
      .strict()
      .parse(raw);
    if (
      !this.state().stopped ||
      this.preparing ||
      this.sending ||
      this.researching ||
      this.starting
    )
      throw new DomainError('BUSY', 'Zatrzymaj pracę przed przygotowaniem partii.');
    const policy = this.assertPolicy(false),
      batchId = id(),
      seen = new Set<string>();
    this.store.assertHealthy();
    this.store.atomic(() => {
      this.store.exec(
        "INSERT INTO auto_batches VALUES (?,'PREPARED',?,1,?,?,?,NULL,NULL,NULL,?)",
        batchId,
        this.now(),
        policy.policyHash,
        JSON.stringify(policy),
        policy.scopeHash,
        this.now(),
      );
      input.drafts.forEach((selection, ordinal) => {
        if (seen.has(selection.id))
          throw new DomainError('DUPLICATE_DRAFT', 'Szkic występuje więcej niż raz.');
        seen.add(selection.id);
        const d = this.draft(selection.id, selection.version);
        const problems = [
          ...this.issues(d, 'FIRST_CONTACT', this.deliveryState().account!, false, policy),
          ...(!this.store.one(
            'SELECT draft_id FROM research_draft_materials WHERE draft_id=? AND version=?',
            d.id,
            d.version,
          )
            ? ['DRAFT_MATERIAL_UNVERIFIED']
            : []),
          ...(!this.inScope(d) ? ['SCOPE_CHANGED'] : []),
          ...(this.companyHistoryBlocked(d.company_id) ? ['CONTACT_HISTORY'] : []),
        ];
        this.store.exec(
          'INSERT INTO auto_batch_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          id(),
          batchId,
          ordinal,
          d.company_id,
          d.contact_id,
          d.email,
          d.id,
          d.version,
          d.payload_hash,
          this.binding(d),
          this.contactBinding(d),
          this.draftMaterialContext(d),
          problems.length ? 'NEEDS_REPREPARATION' : 'READY',
          problems[0] ?? null,
          this.now(),
        );
      });
    });
    return { ...this.batchSummary(batchId), approvalHash: this.batchHash(batchId) };
  }
  approveClosedBatch(batchId: string, raw: unknown) {
    const input = z
      .object({ approvalHash: z.string().length(64), confirmed: z.literal(true) })
      .strict()
      .parse(raw);
    if (!this.state().stopped)
      throw new DomainError('BUSY', 'Zatrzymaj pracę przed zatwierdzeniem.');
    if (this.batchHash(batchId) !== input.approvalHash)
      throw new DomainError('BATCH_CHANGED', 'Zakres partii się zmienił.');
    this.assertPolicy(false);
    this.store.exec(
      "UPDATE auto_batches SET approved_hash=?,approved_at=?,state='APPROVED',updated_at=? WHERE id=?",
      input.approvalHash,
      this.now(),
      this.now(),
      batchId,
    );
    return this.batchSummary(batchId);
  }
  reprepareBatch(batchId: string) {
    if (!this.state().stopped || this.preparing || this.sending || this.researching)
      throw new DomainError('BUSY', 'Zatrzymaj pracę.');
    const batch = this.batchSummary(batchId),
      policy = this.assertPolicy(false);
    if (batch.counts.uncertain)
      throw new DomainError('SEND_UNKNOWN', 'Rozstrzygnij istniejącą próbę.');
    this.store.atomic(() => {
      this.revokeApprovals('Ponowne przygotowanie zamkniętej partii');
      for (const item of batch.items.filter((i) => i.state !== 'SENT')) {
        const d = this.draftRows().find((d) => d.id === item.draft_id)!;
        const problems = [
          ...this.issues(d, 'FIRST_CONTACT', this.deliveryState().account!, false, policy),
          ...(!this.store.one(
            'SELECT draft_id FROM research_draft_materials WHERE draft_id=? AND version=?',
            d.id,
            d.version,
          )
            ? ['DRAFT_MATERIAL_UNVERIFIED']
            : []),
          ...(!this.inScope(d) ? ['SCOPE_CHANGED'] : []),
          ...(this.companyHistoryBlocked(d.company_id) ? ['CONTACT_HISTORY'] : []),
        ];
        this.store.exec(
          'UPDATE auto_batch_items SET contact_id=?,recipient=?,draft_version=?,payload_hash=?,binding=?,contact_binding=?,material_binding=?,state=?,code=?,qualified_at=? WHERE id=?',
          d.contact_id,
          d.email,
          d.version,
          d.payload_hash,
          this.binding(d),
          this.contactBinding(d),
          this.draftMaterialContext(d),
          problems.length ? 'NEEDS_REPREPARATION' : 'READY',
          problems[0] ?? null,
          this.now(),
          item.id,
        );
        this.store.set(`autoSkipped:${d.id}:${d.version}`, false);
      }
      this.store.exec(
        "UPDATE auto_batches SET state='PREPARED',revision=revision+1,policy_hash=?,policy_json=?,scope_hash=?,approved_hash=NULL,approved_at=NULL,reason=NULL,updated_at=? WHERE id=?",
        policy.policyHash,
        JSON.stringify(policy),
        policy.scopeHash,
        this.now(),
        batchId,
      );
    });
    return { ...this.batchSummary(batchId), approvalHash: this.batchHash(batchId) };
  }
  async startBatch(batchId: string) {
    if (
      this.refreshingLibrary ||
      this.probing ||
      this.startingBatch ||
      this.starting ||
      this.preparing ||
      this.sending ||
      (this.sessionId &&
        !this.state().paused &&
        !this.state().stopped &&
        !this.store.get('autoSenderWait', null))
    )
      throw new DomainError('BUSY', 'Trwa Start lub praca poprzedniej sesji.');
    if (
      this.researching ||
      this.libraryResearch ||
      this.store.get<Row>('researchDay', {}).active ||
      this.store.one("SELECT id FROM runs WHERE status IN ('QUEUED','RUNNING','PAUSED')")
    )
      throw new DomainError('ACTIVE_RUN', 'Zakończ research przed Start partii.');
    const batch = this.batchSummary(batchId),
      policy = this.assertPolicy(false);
    const grant = this.store.one(
      'SELECT g.*,p.content_hash,p.approved_hash,p.approved_at FROM auto_batch_plan_grants g JOIN nightflow_plans p ON p.id=g.plan_id WHERE g.batch_id=?',
      batchId,
    );
    const planned =
      grant &&
      this.plannedActivation?.batchId === batchId &&
      this.plannedActivation.jobId === grant.job_id &&
      this.store.one(
        "SELECT id FROM nightflow_jobs WHERE id=? AND generation=? AND state='SENDING'",
        grant.job_id,
        this.plannedActivation.generation,
      ) &&
      grant.approved_at &&
      grant.plan_hash === grant.content_hash &&
      grant.approved_hash === grant.plan_hash &&
      grant.batch_hash === this.batchHash(batchId);
    if (
      (!planned && (!batch.approved_at || batch.approved_hash !== this.batchHash(batchId))) ||
      batch.policy_hash !== policy.policyHash
    )
      throw new DomainError(
        'BATCH_APPROVAL_REQUIRED',
        'Sprawdź podsumowanie i zatwierdź bieżący zakres partii.',
      );
    if (batch.counts.uncertain)
      throw new DomainError('SEND_UNKNOWN', 'Rozstrzygnij istniejącą próbę.');
    if (!batch.counts.remaining && batch.counts.skipped && !batch.counts.needsPreparation) {
      this.store.exec(
        "UPDATE auto_batches SET state='COMPLETED_WITH_SKIPS',reason='CONTACT_HISTORY',updated_at=? WHERE id=?",
        this.now(),
        batchId,
      );
      return;
    }
    if (!batch.counts.remaining)
      throw new DomainError('BATCH_EMPTY', 'Brak pozycji dopuszczonych do wykonania.');
    if (this.sessionId) this.control('stop');
    this.startingBatch = true;
    this.activeBatchId = batchId;
    const epoch = this.controlEpoch;
    try {
      await this.startAuto(true);
      if (epoch !== this.controlEpoch || !this.sessionId || !this.sessionEnabled)
        throw new DomainError('SESSION_STOPPED', 'Start partii został odwołany.');
      const sessionId = this.sessionId;
      this.store.atomic(() => {
        this.store.exec('INSERT INTO auto_batch_sessions VALUES (?,?)', batchId, sessionId);
        this.store.exec(
          "UPDATE auto_batches SET state='RUNNING',reason=NULL,updated_at=? WHERE id=?",
          this.now(),
          batchId,
        );
        this.store.set('browserExecutionContext', {
          batchId,
          sessionId,
          generation: id(),
          state: 'RUNNING',
        });
      });
    } catch (e) {
      this.revokeSessionAuthority();
      this.revokeDeliveryAuthority();
      try {
        this.control('stop');
      } catch {}
      try {
        this.store.assertExclusive();
        this.store.exec(
          "UPDATE auto_batches SET state='STOPPED',reason=?,updated_at=? WHERE id=?",
          e instanceof DomainError ? e.code : 'BATCH_START_FAILED',
          this.now(),
          batchId,
        );
      } catch {}
      throw e;
    } finally {
      this.startingBatch = false;
    }
  }
  private frozenBatchIssues(d: Row) {
    if (!this.activeBatchId) return [];
    const item = this.store.one(
      'SELECT * FROM auto_batch_items WHERE batch_id=? AND draft_id=?',
      this.activeBatchId,
      d.id,
    );
    if (!item || item.state !== 'READY') return ['BATCH_SCOPE_CHANGED'];
    return item.draft_version !== d.version ||
      item.recipient !== d.email ||
      item.payload_hash !== d.payload_hash ||
      item.binding !== this.binding(d) ||
      item.contact_binding !== this.contactBinding(d) ||
      item.material_binding !== this.draftMaterialContext(d)
      ? ['BATCH_MATERIALS_CHANGED']
      : [];
  }
  private settleBatch() {
    if (!this.activeBatchId) return;
    const batch = this.batchSummary(this.activeBatchId);
    if (batch.counts.uncertain) {
      this.store.exec(
        "UPDATE auto_batches SET state='NEEDS_RESOLUTION',reason='SEND_UNKNOWN',updated_at=? WHERE id=?",
        this.now(),
        batch.id,
      );
      return;
    }
    if (batch.counts.remaining) return;
    const state = batch.counts.needsPreparation
      ? 'NEEDS_REPREPARATION'
      : batch.counts.skipped
        ? 'COMPLETED_WITH_SKIPS'
        : 'COMPLETED';
    this.control('stop');
    this.store.exec(
      'UPDATE auto_batches SET state=?,reason=?,updated_at=? WHERE id=?',
      state,
      state,
      this.now(),
      batch.id,
    );
    this.store.set('browserExecutionContext', {
      batchId: batch.id,
      sessionId: this.store.get<Row>('browserExecutionContext', {}).sessionId,
      state,
    });
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
      this.refreshingLibrary ||
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
    this.assertActiveAccount(input.senderEmail);
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
  override async refreshLibraryDrafts(
    raw: unknown,
    options: NonNullable<Parameters<ResearchJobHunter['refreshLibraryDrafts']>[1]> = {},
  ) {
    // Existing-library qualification uses an already approved policy, never grants it.
    this.assertPolicy(false);
    return super.refreshLibraryDrafts(raw, options);
  }
  private assertPolicy(requireSession = true) {
    if (requireSession) this.nightflowSendGuard?.();
    const p = this.policyConfig(),
      account = this.deliveryState().account;
    this.assertActiveAccount(p?.senderEmail);
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
  async startAuto(closedBatch = false) {
    if (this.refreshingLibrary || this.probing)
      throw new DomainError('BUSY', 'Trwa odnowienie lub kontrola materiałów.');
    if (!closedBatch && (this.libraryResearch || this.store.get<Row>('researchDay', {}).active))
      throw new DomainError('ACTIVE_RUN', 'Zakończ research biblioteki przed Start sendera.');
    if (this.startingBatch && !closedBatch)
      throw new DomainError('BUSY', 'Trwa Start zamkniętej partii.');
    if (!closedBatch && this.activeBatchId)
      throw new DomainError('BATCH_ACTIVE', 'Zatrzymaj partię przed rozpoczęciem ciągłego AUTO.');
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
    if (
      !closedBatch &&
      (!this.capability('codexCapability').tested || !this.capability('searchCapability').tested)
    )
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
      if (run && !closedBatch) await ResearchJobHunter.prototype.start.call(this, p.searchScope);
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
    if (this.activeBatchId) {
      this.store.exec(
        "UPDATE auto_batches SET state='STOPPED',reason=?,updated_at=? WHERE id=?",
        action,
        this.now(),
        this.activeBatchId,
      );
      this.store.set('browserExecutionContext', {
        batchId: this.activeBatchId,
        sessionId: this.sessionId,
        state: 'STOPPED',
      });
      this.activeBatchId = null;
    }
    this.libraryResearch = false;
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
  protected override deliveryOwnershipLost() {
    this.revokeSessionAuthority();
    this.controlEpoch++;
    this.preparationController?.abort();
    super.deliveryOwnershipLost();
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
    const session = this.activeBatchId
      ? this.store.one(
          'SELECT count(*) n FROM usage_ledger u JOIN auto_batch_outbox b ON b.outbox_id=u.outbox_id JOIN auto_batch_items i ON i.id=b.item_id WHERE i.batch_id=?',
          this.activeBatchId,
        )!.n
      : this.store.one(
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
    preparedPolicy?: Row,
  ) {
    const problems = super.issues(d, kind, account, requireHistory);
    problems.push(...this.frozenBatchIssues(d));
    if (kind !== 'FIRST_CONTACT') return [...problems, 'AUTO_FIRST_CONTACT_ONLY'];
    try {
      const p = preparedPolicy ?? this.assertPolicy();
      if (!this.inScope(d)) problems.push('SCOPE_CHANGED');
      if (!preparedPolicy) this.assertHistory();
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
        if (!this.sourceIsCurrent(s)) problems.push('STALE_EVIDENCE');
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
      if (this.refreshingLibrary) problems.push('DRAFT_MATERIAL_UNVERIFIED');
      if (review.supported !== true || review.issues.length)
        problems.push('SEMANTIC_REVIEW_REQUIRED');
      const contactSource = sources.find((s) => s.id === verified.contact.proof.sourceId);
      if (contactSource && domain) {
        const domains = [
          company.primary_domain,
          ...this.store
            .all(
              "SELECT value FROM company_aliases WHERE company_id=? AND kind='DOMAIN' AND verified_at IS NOT NULL",
              company.id,
            )
            .map((r) => r.value),
        ].filter(Boolean);
        if (!contactSourceAuthority(verified, sources, domains)) problems.push('CONTACT_POLICY');
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
    if (this.store.get(`researchPending:${d.company_id}`, null)) return true;
    // A late provider must not write INVALIDATED. A stale binding is already a draft
    // rejection, not an in-flight review to wait for indefinitely.
    if (this.draftMaterialIssues(d).includes('DRAFT_MATERIAL_STALE')) return false;
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
    const frozen = this.frozenBatchIssues(d);
    if (frozen.length)
      throw new DomainError(
        frozen[0],
        'Zatwierdzone materiały partii się zmieniły. Przygotuj i zatwierdź pozostały zakres.',
      );
    if (this.binding(d) !== op.binding || this.contactBinding(d) !== op.contactBinding)
      throw new DomainError('VERSION_CONFLICT', 'Treść lub kontakt wybranej wersji zmieniły się.');
    return d;
  }
  protected override deliveryPacketCreated(outboxId: string, draftId: string) {
    const op = this.approvalOperation;
    if (
      !op ||
      op.draftId !== draftId ||
      op.sessionId !== this.sessionId ||
      op.epoch !== this.controlEpoch ||
      !this.sessionEnabled
    )
      throw new DomainError('SESSION_STOPPED', 'Pakiet nie należy do aktualnej operacji AUTO.');
    this.store.assertExclusive();
    this.store.exec('INSERT INTO auto_outbox VALUES (?,?)', outboxId, op.sessionId);
    if (op.batchId) {
      const member = this.store.one(
        'SELECT id FROM auto_batch_items WHERE batch_id=? AND draft_id=?',
        op.batchId,
        draftId,
      );
      if (!member) throw new DomainError('BATCH_SCOPE_CHANGED', 'Brak pozycji zamkniętej partii.');
      this.store.exec('INSERT INTO auto_batch_outbox VALUES (?,?)', member.id, outboxId);
    }
  }
  private skip(op: Operation, code: string, message: string) {
    this.store.atomic(() => {
      if (this.activeBatchId)
        this.store.exec(
          'UPDATE auto_batch_items SET state=?,code=? WHERE batch_id=? AND draft_id=?',
          [
            'BATCH_MATERIALS_CHANGED',
            'VERSION_CONFLICT',
            'DRAFT_MATERIAL_STALE',
            'STALE_EVIDENCE',
            'STALE_CONTACT',
          ].includes(code)
            ? 'NEEDS_REPREPARATION'
            : 'SKIPPED',
          code,
          this.activeBatchId,
          op.draftId,
        );
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
    if (this.activeBatchId) {
      const state = reason === 'SEND_UNKNOWN' ? 'NEEDS_RESOLUTION' : 'PAUSED';
      this.store.exec(
        'UPDATE auto_batches SET state=?,reason=?,updated_at=? WHERE id=?',
        state,
        reason,
        this.now(),
        this.activeBatchId,
      );
      this.store.set('browserExecutionContext', {
        batchId: this.activeBatchId,
        sessionId: this.sessionId,
        state,
      });
    }
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
      const batch = this.activeBatchId ? this.batchSummary(this.activeBatchId) : null;
      if (batch) {
        // An existing packet has priority, but cannot be adopted from another scope.
        queued = this.store.one(
          "SELECT id FROM outbox WHERE status='QUEUED' ORDER BY created_at,rowid LIMIT 1",
        );
        if (
          queued &&
          !this.store.one(
            "SELECT i.id FROM auto_batch_outbox b JOIN auto_batch_items i ON i.id=b.item_id JOIN outbox o ON o.id=b.outbox_id JOIN auto_outbox a ON a.outbox_id=o.id WHERE o.id=? AND i.batch_id=? AND a.session_id=? AND i.state='READY' AND i.draft_id=o.draft_id AND i.draft_version=o.draft_version",
            queued.id,
            batch.id,
            this.sessionId,
          )
        )
          throw new DomainError(
            'BATCH_SCOPE_CHANGED',
            'Oczekujący pakiet nie należy do bieżącej partii i sesji.',
          );
      }
      const nextItem = batch?.items.find((item) => item.state === 'READY');
      const candidate = queued
        ? null
        : batch
          ? nextItem && this.draft(nextItem.draft_id)
          : this.draftRows().find(
              (d) =>
                d.status !== 'SENT' &&
                this.inScope(d) &&
                !this.awaitingDraftReview(d) &&
                !this.store.get(`autoSkipped:${d.id}:${d.version}`, false),
            );
      if (
        batch &&
        candidate &&
        (this.awaitingDraftReview(candidate) ||
          this.store.get(`autoSkipped:${candidate.id}:${candidate.version}`, false))
      ) {
        // Keep the next ordinal pending; a later READY item must not overtake it.
        this.store.set('autoSenderReason', 'DRAFT_MATERIAL_UNVERIFIED');
        this.store.set(
          'autoNextSendAt',
          iso(new Date(this.clock().getTime() + p.sendIntervalSeconds * 1000)),
        );
        return;
      }
      if (!queued && !candidate) {
        this.settleBatch();
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
      if (batch && !this.inScope(chosen))
        throw new DomainError('SCOPE_CHANGED', 'Szkic nie należy do zatwierdzonego zakresu.');
      if (this.historyMode() === 'PRIVATE_GIT') await this.historySync.checkpoint();
      this.selected(operation);
      if (!queued) {
        await this.refreshDraftSources(operation.draftId, this.preparationController.signal);
        this.selected(operation);
        const account = await this.connectedAccount();
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
        this.approvalOperation = { ...operation, batchId: this.activeBatchId };
        try {
          await super.approveDelivery({
            previewId: preview.id,
            previewHash: preview.previewHash,
            confirmed: true,
          });
        } finally {
          this.approvalOperation = undefined;
        }
        this.selected(operation);
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
      this.settleBatch();
    }
  }
  override async tick() {
    if (this.activeBatchId) return;
    if (this.libraryResearch) {
      await ResearchJobHunter.prototype.tick.call(this);
      return;
    }
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
          this.continueAfterItemErrors();
          this.queryPlanner.reconcile(this.policyConfig()!.scopeHash);
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
      queueSize: this.store.one(
        "SELECT count(*) n FROM drafts d JOIN auto_draft_scope s ON s.draft_id=d.id WHERE d.status<>'SENT' AND s.scope_hash=? AND NOT EXISTS(SELECT 1 FROM auto_skips k WHERE k.draft_id=d.id AND k.draft_version=d.version)",
        this.policyConfig()?.scopeHash ?? '',
      )!.n,
      activeBatch: this.activeBatchId ? this.batchSummary(this.activeBatchId) : null,
      latestBatch:
        this.store.one(
          'SELECT id,state,prepared_at FROM auto_batches ORDER BY prepared_at DESC LIMIT 1',
        ) ?? null,
      libraryResearch: this.libraryResearch,
      browser: this.browserDelivery.status(),
      sendTransport: this.sendTransport(),
      databaseHealth: this.store.healthStatus(),
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
            this.store.assertExclusive();
            return this.store.healthStatus().ok;
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
  override companies(
    query?: Parameters<ResearchJobHunter['companies']>[0],
  ): (Row & { researchDetails: any })[] {
    const rows = super.companies(query),
      ids = JSON.stringify(rows.map((c) => c.id));
    const contexts = new Map(
      this.store
        .all(
          'SELECT * FROM shared_company_context WHERE company_id IN (SELECT value FROM json_each(?))',
          ids,
        )
        .map((r) => [r.company_id, r]),
    );
    const attempts = new Map<string, Row>();
    for (const row of this.store.all(
      'SELECT * FROM shared_attempts WHERE company_id IN (SELECT value FROM json_each(?)) ORDER BY created_at DESC',
      ids,
    ))
      if (!attempts.has(row.company_id)) attempts.set(row.company_id, row);
    const sourcesByCompany = new Map<string, Row[]>(),
      skipsByCompany = new Map<string, Row[]>();
    for (const row of this.store.all(
      'SELECT company_id,canonical_url,fetched_at,fragment FROM evidence WHERE company_id IN (SELECT value FROM json_each(?))',
      ids,
    )) {
      const list = sourcesByCompany.get(row.company_id) ?? [];
      list.push(row);
      sourcesByCompany.set(row.company_id, list);
    }
    for (const row of this.store.all(
      'SELECT * FROM auto_skips WHERE company_id IN (SELECT value FROM json_each(?)) ORDER BY created_at DESC',
      ids,
    )) {
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
    ) WHERE company_id IN (SELECT value FROM json_each(?)) GROUP BY company_id`,
          ids,
        )
        .map((r) => [r.company_id, r.at]),
    );
    const unique = new Map<string, Row & { researchDetails: any }>();
    for (const c of rows)
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
