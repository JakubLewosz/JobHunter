import { z } from 'zod';
import { setTimeout as delay } from 'node:timers/promises';
import { Store } from './db.js';
import { AutoPolicyJobHunter } from './auto-policy.js';
import { DomainError, hash, id } from './util.js';
import { runningBuildIdentity, runningCodeUnchanged } from './build-identity.js';
import {
  readProtectedSnapshot,
  compareProtectedSnapshots,
  fileMaterialProof,
} from './research/protection.js';
import type { Row } from '../../../packages/shared/types.js';
import type { BrowserExecutionScope } from './browser/contracts.js';
import { selectLibraryRefreshQueue as selectNightflowRefreshQueue } from './research/refresh-queue.js';
export { selectNightflowRefreshQueue };

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const nightflowPlanSchema = z
  .object({
    schema: z.literal(1),
    id: z.string().min(1).max(100),
    version: z.number().int().positive(),
    installation: z.string().min(1),
    goal: z.string().min(10),
    binding: z.string().length(64),
    researchHours: z.number().int().min(1).max(24),
    afterResearchHours: z.number().min(1).max(48),
    // Optional absolute user boundary; a later Start cannot renew it.
    expiresAt: z.iso.datetime().optional(),
    discovery: z.boolean(),
    exhaustion: z.enum(['FINISH', 'WAIT_DEADLINE']),
    selection: z.literal('VERIFIED_FIT_THEN_CHANNEL_THEN_AGE'),
    maxItems: z.number().int().min(1).max(200),
    // Optional closed acceptance scope. Omission preserves the continuous rule-based plan.
    draftIds: z.array(z.string().min(1)).min(1).max(200).optional(),
    recipientScope: z
      .array(
        z
          .object({
            draftId: z.string().min(1),
            companyId: z.string().min(1),
            email: z.email(),
            kind: z.enum(['RECRUITMENT', 'GENERAL', 'SALES', 'UNKNOWN']),
            intent: z.enum([
              'APPLICATION',
              'OPEN_APPLICATION',
              'CONDITIONS_INQUIRY',
              'COMPANY_INQUIRY',
            ]),
          })
          .strict(),
      )
      .min(1)
      .max(200)
      .optional(),
    limits: z
      .object({
        daily: z.number().int().positive().nullable(),
        session: z.number().int().positive().nullable(),
        unlimitedExplicit: z.boolean(),
      })
      .strict(),
    intervalSeconds: z.number().int().min(60).max(86400),
    window: z
      .object({
        start: time,
        end: time,
        timezone: z.string().refine((v) => {
          try {
            new Intl.DateTimeFormat('en', { timeZone: v });
            return true;
          } catch {
            return false;
          }
        }),
      })
      .strict(),
    empty: z.literal('REPORT_WITHOUT_SEND'),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.draftIds && new Set(p.draftIds).size !== p.draftIds.length)
      ctx.addIssue({ code: 'custom', message: 'Closed draft scope must be unique' });
    if (p.draftIds && p.discovery)
      ctx.addIssue({
        code: 'custom',
        message: 'Closed existing-draft scope cannot discover substitutes',
      });
    if (
      p.recipientScope &&
      (!p.draftIds ||
        p.recipientScope.length !== p.draftIds.length ||
        new Set(p.recipientScope.map((r) => r.draftId)).size !== p.draftIds.length ||
        p.recipientScope.some((r) => !p.draftIds!.includes(r.draftId)))
    )
      ctx.addIssue({ code: 'custom', message: 'Recipient scope must match the closed draft list' });
    if ((p.limits.daily === null || p.limits.session === null) && !p.limits.unlimitedExplicit)
      ctx.addIssue({ code: 'custom', message: 'Explicit unlimited choice required' });
    if (p.window.start === p.window.end)
      ctx.addIssue({ code: 'custom', message: 'Nonempty window required' });
  });
export type NightflowPlan = z.infer<typeof nightflowPlanSchema>;
export type NightflowHost = {
  ready(): boolean;
  leaseValid?(): boolean;
  run(signal: AbortSignal, scope: BrowserExecutionScope): Promise<void>;
  close?(): Promise<void>;
  setLossHandler?(handler?: () => void): void;
};
export function compareNightflowCandidates(
  a: { d: Row; channelRank: number },
  b: { d: Row; channelRank: number },
) {
  return (
    (b.d.decision === 'READY_APPLICATION' ? 1 : 0) -
      (a.d.decision === 'READY_APPLICATION' ? 1 : 0) ||
    b.channelRank - a.channelRank ||
    a.d.created_at.localeCompare(b.d.created_at) ||
    a.d.id.localeCompare(b.d.id)
  );
}
export function inSendWindow(plan: NightflowPlan, date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: plan.window.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return plan.window.start < plan.window.end
    ? parts >= plan.window.start && parts < plan.window.end
    : parts >= plan.window.start || parts < plan.window.end;
}

// One profile owner and one awaited execution, over the existing research/sender.
// Durable state records progress; only this live object's generation grants work.
export class NightflowCoordinator {
  private static owners = new WeakMap<Store, NightflowCoordinator>();
  private generation?: string;
  private controller?: AbortController;
  private busy = false;
  private jobId?: string;
  private epoch = 0;
  constructor(
    readonly store: Store,
    readonly service: AutoPolicyJobHunter,
    private options: {
      installation: string;
      clock?: () => Date;
      wait?: (ms: number, signal: AbortSignal) => Promise<void>;
      host?: NightflowHost;
      boundary?: (phase: string) => Promise<void>;
    },
  ) {
    if (NightflowCoordinator.owners.get(store)?.busy)
      throw new DomainError('BUSY', 'Profil ma aktywnego koordynatora.');
    NightflowCoordinator.owners.set(store, this);
    store.exec(
      "UPDATE nightflow_jobs SET state='STOPPED',reason='RESTART',generation='',updated_at=? WHERE state IN ('PREPARING','REFRESHING','RESEARCHING','VALIDATING','CLOSING','WAITING_WINDOW','SENDING')",
      this.now(),
    );
  }
  private now() {
    return (this.options.clock?.() ?? new Date()).toISOString();
  }
  private row() {
    return this.store.one('SELECT * FROM nightflow_jobs WHERE id=?', this.jobId)!;
  }
  savePlan(raw: unknown, confirmed: boolean) {
    if (this.busy || !this.service.state().stopped)
      throw new DomainError('BUSY', 'Zatrzymaj pracę.');
    let plan = nightflowPlanSchema.parse(raw);
    if (!confirmed)
      throw new DomainError('PLAN_APPROVAL_REQUIRED', 'Potwierdź reguły przyszłego wyboru.');
    if (plan.draftIds) {
      const recipients = plan.draftIds.map((id) => this.service.nightflowRecipient(id));
      if (
        plan.recipientScope &&
        plan.draftIds.some((id) => !this.service.matchesNightflowRecipient(id, plan.recipientScope))
      )
        throw new DomainError(
          'PLAN_SCOPE_CHANGED',
          'Odbiorcy nie odpowiadają zatwierdzanej liście.',
        );
      plan = nightflowPlanSchema.parse({ ...plan, recipientScope: recipients });
    }
    this.validatePlan(plan);
    const content = JSON.stringify(plan),
      digest = hash(content);
    // New ID/version required; approvals are never rewritten by a model or run.
    this.store.exec(
      'INSERT INTO nightflow_plans VALUES (?,?,?,?,?,?)',
      plan.id,
      plan.version,
      content,
      digest,
      digest,
      this.now(),
    );
    return { id: plan.id, version: plan.version, hash: digest };
  }
  private validatePlan(plan: NightflowPlan) {
    if (plan.draftIds && !plan.recipientScope)
      throw new DomainError(
        'PLAN_SCOPE_REQUIRED',
        'Starsza lista wymaga nowej zgody wiążącej odbiorców.',
      );
    if (plan.expiresAt && plan.expiresAt <= this.now())
      throw new DomainError('EXECUTION_DEADLINE', 'Absolutny termin zgody minął.');
    const p = this.service.policyConfig();
    if (
      plan.installation !== this.options.installation ||
      plan.binding !== this.service.nightflowBinding()
    )
      throw new DomainError('PLAN_CHANGED', 'Instalacja lub zatwierdzone materiały się zmieniły.');
    if (
      p?.sendIntervalSeconds !== plan.intervalSeconds ||
      p.dailyLimit !== plan.limits.daily ||
      p.sessionLimit !== plan.limits.session ||
      this.service.campaign().timezone !== plan.window.timezone
    )
      throw new DomainError(
        'PLAN_POLICY_CHANGED',
        'Tempo, limity lub strefa muszą odpowiadać zatwierdzonej polityce.',
      );
  }
  preflight(planId: string) {
    const row = this.store.one('SELECT * FROM nightflow_plans WHERE id=?', planId);
    if (!row)
      return {
        ready: false,
        codes: ['PLAN_REQUIRED'],
        required: [
          'approved materials/CV/sender/policy',
          'research hours and discovery',
          'selection and maximum batch',
          'explicit limits',
          'pace',
          'send window/timezone',
          'execution deadline',
          'active browser task for GMAIL_BROWSER',
        ],
        context: this.planContext(),
      };
    try {
      const plan = nightflowPlanSchema.parse(JSON.parse(row.content));
      if (
        !row.approved_at ||
        row.content_hash !== hash(row.content) ||
        row.approved_hash !== row.content_hash
      )
        throw new DomainError('PLAN_APPROVAL_REQUIRED', 'Brak zgody.');
      this.validatePlan(plan);
      this.store.assertHealthy();
      if (this.service.sendTransport() === 'GMAIL_BROWSER' && !this.options.host?.ready())
        throw new DomainError('BROWSER_HOST_REQUIRED', 'Potrzebny aktywny uchwyt przeglądarki.');
      return { ready: true, codes: [] };
    } catch (e) {
      return { ready: false, codes: [e instanceof DomainError ? e.code : 'PLAN_INVALID'] };
    }
  }
  private planContext() {
    try {
      const p = this.service.policyConfig()!;
      return {
        installation: this.options.installation,
        binding: this.service.nightflowBinding(),
        limits: { daily: p.dailyLimit, session: p.sessionLimit },
        intervalSeconds: p.sendIntervalSeconds,
        timezone: this.service.campaign().timezone,
      };
    } catch {
      return null;
    }
  }
  status(jobId?: string) {
    const job = jobId
      ? this.store.one('SELECT * FROM nightflow_jobs WHERE id=?', jobId)
      : this.store.one('SELECT * FROM nightflow_jobs ORDER BY started_at DESC,rowid DESC LIMIT 1');
    if (!job) return { state: 'NOT_STARTED', reason: null, authority: false };
    const batch = job.batch_id ? this.service.batchSummary(job.batch_id) : null;
    return {
      jobId: job.id,
      planId: job.plan_id,
      planVersion: job.plan_version,
      state: job.state,
      reason: job.reason,
      deadline: job.deadline,
      researchSessionId: job.research_session_id,
      batchId: job.batch_id,
      counts: batch?.counts ?? null,
      checkpoint: JSON.parse(job.checkpoint),
      authority: !!this.generation && this.generation === job.generation,
    };
  }
  controlScope() {
    return {
      instanceId: this.service.browserDelivery.status().backendId,
      jobId: this.jobId ?? null,
      generation: this.generation ?? null,
    };
  }
  stop(reason = 'USER_STOP') {
    // Revoke first, even if a subsequent disk operation fails.
    this.generation = undefined;
    this.controller?.abort();
    this.service.control('stop');
    if (this.jobId)
      this.store.exec(
        "UPDATE nightflow_jobs SET state='STOPPED',reason=?,generation='',updated_at=? WHERE id=?",
        reason,
        this.now(),
        this.jobId,
      );
  }
  private assert(plan: NightflowPlan, generation: string) {
    this.controller!.signal.throwIfAborted();
    if (
      this.service.sendTransport() === 'GMAIL_BROWSER' &&
      this.options.host?.leaseValid?.() === false
    )
      throw new DomainError('BROWSER_HOST_LOST', 'Wygasł lease wykonawcy.');
    if (
      this.generation !== generation ||
      this.row().generation !== generation ||
      this.service.operationEpoch() !== this.epoch
    )
      throw new DomainError('SESSION_STOPPED', 'Wykonanie zostało odwołane.');
    this.store.assertExclusive();
    const approved = this.store.one('SELECT * FROM nightflow_plans WHERE id=?', plan.id);
    if (
      !approved?.approved_at ||
      approved.content !== JSON.stringify(plan) ||
      approved.approved_hash !== hash(approved.content)
    )
      throw new DomainError('PLAN_CHANGED', 'Zgoda nie dotyczy bieżącego planu.');
    this.validatePlan(plan);
    if (this.row().batch_id && plan.recipientScope) {
      const items = this.store.all(
        'SELECT * FROM auto_batch_items WHERE batch_id=?',
        this.row().batch_id,
      );
      if (
        items.some((item) => {
          const recipient = plan.recipientScope!.find((r) => r.draftId === item.draft_id);
          return (
            !recipient ||
            recipient.companyId !== item.company_id ||
            recipient.email !== item.recipient ||
            !this.service.matchesNightflowRecipient(item.draft_id, plan.recipientScope)
          );
        })
      )
        throw new DomainError('PLAN_SCOPE_CHANGED', 'Odbiorca partii wykracza poza zgodę.');
    }
    if (this.now() >= this.row().end_at)
      throw new DomainError('EXECUTION_DEADLINE', 'Koniec całego zadania.');
  }
  private async phase(state: string, plan: NightflowPlan, generation: string) {
    this.assert(plan, generation);
    this.store.exec(
      'UPDATE nightflow_jobs SET state=?,updated_at=? WHERE id=?',
      state,
      this.now(),
      this.jobId,
    );
    await this.options.boundary?.(state);
    this.assert(plan, generation);
  }
  private async wait(ms: number) {
    const signal = this.controller!.signal;
    await (this.options.wait?.(ms, signal) ?? delay(ms, undefined, { signal }));
    signal.throwIfAborted();
  }
  async start(planId: string, resumeJobId?: string) {
    if (this.busy) throw new DomainError('BUSY', 'Zadanie już pracuje.');
    const preflight = this.preflight(planId);
    if (!preflight.ready)
      throw new DomainError(preflight.codes[0], 'Plan nie przeszedł preflight.');
    if (!this.service.state().stopped) throw new DomainError('BUSY', 'Zatrzymaj poprzednią pracę.');
    const plan = nightflowPlanSchema.parse(
      JSON.parse(this.store.one('SELECT content FROM nightflow_plans WHERE id=?', planId)!.content),
    );
    this.busy = true;
    this.generation = id();
    const generation = this.generation;
    this.controller = new AbortController();
    const signal = this.controller.signal;
    this.epoch = this.service.operationEpoch();
    this.jobId = undefined;
    this.options.host?.setLossHandler?.(() => this.stop('BROWSER_HOST_LOST'));
    try {
      if (resumeJobId) {
        const old = this.store.one('SELECT * FROM nightflow_jobs WHERE id=?', resumeJobId);
        if (
          !old ||
          old.plan_id !== planId ||
          !['STOPPED', 'PAUSED'].includes(old.state) ||
          old.end_at <= this.now()
        )
          throw new DomainError('RESUME_REJECTED', 'Nie można wznowić zadania.');
        const checkpoint = JSON.parse(old.checkpoint);
        if (JSON.parse(old.code_identity).loadedCodeHash !== runningBuildIdentity.loadedCodeHash)
          throw new DomainError('RESUME_CODE_CHANGED', 'Wersja kodu zadania się zmieniła.');
        this.jobId = old.id;
        // Expired research is never silently renewed, even on an explicit Resume.
        if (!old.batch_id && !checkpoint.researchComplete && old.deadline <= this.now())
          throw new DomainError('SESSION_EXPIRED', 'Deadline researchu minął.');
        this.store.exec(
          "UPDATE nightflow_jobs SET generation=?,state='PREPARING',reason=NULL,updated_at=? WHERE id=?",
          generation,
          this.now(),
          this.jobId,
        );
      } else {
        this.jobId = id();
        const deadline = new Date(
          Date.parse(this.now()) + plan.researchHours * 3600000,
        ).toISOString();
        this.store.exec(
          "INSERT INTO nightflow_jobs (id,plan_id,plan_version,state,generation,deadline,end_at,code_identity,started_at,updated_at) VALUES (?,?,?,'PREPARING',?,?,?,?,?,?)",
          this.jobId,
          plan.id,
          plan.version,
          generation,
          deadline,
          new Date(
            Math.min(
              Date.parse(deadline) + plan.afterResearchHours * 3600000,
              plan.expiresAt ? Date.parse(plan.expiresAt) : Infinity,
            ),
          ).toISOString(),
          JSON.stringify(runningBuildIdentity),
          this.now(),
          this.now(),
        );
      }
      if (!this.row().batch_id) {
        const baselineKey = `nightflowBaseline:${this.jobId}`;
        if (!resumeJobId)
          this.store.set(baselineKey, {
            data: readProtectedSnapshot(this.store.db, this.now()),
            files: fileMaterialProof(this.store.db, this.store.dir),
          });
        const baseline = this.store.get<any>(baselineKey, null);
        if (!baseline)
          throw new DomainError('RESEARCH_BASELINE_REQUIRED', 'Brak stałego punktu odniesienia.');
        const checkpoint = JSON.parse(this.row().checkpoint);
        const refreshed = new Set<string>(checkpoint.refreshed ?? []);
        const checked = new Set<string>(checkpoint.checked ?? []);
        if (!checkpoint.researchComplete) {
          await this.phase('REFRESHING', plan, generation);
          const refreshQueue: string[] =
            checkpoint.refreshQueue ??
            selectNightflowRefreshQueue(
              (await this.service.evaluateNightflowCandidates(plan.draftIds, signal))
                .filter((c) => !plan.draftIds || plan.draftIds.includes(c.d.id))
                .filter((c) => this.service.matchesNightflowRecipient(c.d.id, plan.recipientScope)),
              plan.researchHours,
              (draftId) => this.store.get<Row>(`nightflowRefreshAttempt:${draftId}`, {}).at ?? '',
            );
          this.assert(plan, generation);
          if (plan.draftIds && refreshQueue.some((id) => !plan.draftIds!.includes(id)))
            throw new DomainError(
              'PLAN_SCOPE_CHANGED',
              'Kolejka nie należy do zamkniętego zakresu.',
            );
          const refreshDeadline: string =
            checkpoint.refreshDeadline ??
            new Date(
              Date.parse(this.row().deadline) -
                (plan.discovery ? plan.researchHours * 3600000 * 0.6 : 0),
            ).toISOString();
          this.store.exec(
            'UPDATE nightflow_jobs SET checkpoint=? WHERE id=?',
            JSON.stringify({
              ...checkpoint,
              refreshQueue,
              refreshDeadline,
            }),
            this.jobId,
          );
          for (const draftId of refreshQueue) {
            if (refreshed.has(draftId)) continue;
            if (this.now() >= refreshDeadline) break;
            this.assert(plan, generation);
            this.store.set(`nightflowRefreshAttempt:${draftId}`, {
              at: this.now(),
              jobId: this.jobId,
            });
            const result = !this.service.matchesNightflowRecipient(draftId, plan.recipientScope)
              ? { results: [{ draftId, code: 'PLAN_SCOPE_CHANGED' }], interrupted: undefined }
              : await this.service.refreshLibraryDrafts(
                  { draftIds: [draftId] },
                  {
                    signal: AbortSignal.any([
                      this.controller.signal,
                      AbortSignal.timeout(
                        Math.max(1, Date.parse(refreshDeadline) - Date.parse(this.now())),
                      ),
                    ]),
                    deadline: refreshDeadline,
                    guard: () => this.assert(plan, generation),
                  },
                );
            this.assert(plan, generation);
            result.results.forEach((r) => {
              refreshed.add(r.draftId);
              if (r.code === 'CHECKED') checked.add(r.draftId);
            });
            this.store.exec(
              'UPDATE nightflow_jobs SET checkpoint=? WHERE id=?',
              JSON.stringify({
                ...JSON.parse(this.row().checkpoint),
                refreshed: [...refreshed],
                checked: [...checked],
                refreshResults: [
                  ...(JSON.parse(this.row().checkpoint).refreshResults ?? []),
                  ...result.results,
                ],
                refreshBudgetReason: result.interrupted ?? null,
              }),
              this.jobId,
            );
            if (result.interrupted) break;
          }
          if (
            this.now() >= refreshDeadline &&
            refreshQueue.some((draftId) => !refreshed.has(draftId))
          )
            this.store.exec(
              'UPDATE nightflow_jobs SET checkpoint=? WHERE id=?',
              JSON.stringify({
                ...JSON.parse(this.row().checkpoint),
                refreshBudgetReason: 'DEADLINE',
              }),
              this.jobId,
            );
          if (plan.discovery && this.now() < this.row().deadline) {
            await this.phase('RESEARCHING', plan, generation);
            await this.service.startLibraryResearch(
              undefined,
              plan.researchHours,
              !!this.row().research_session_id,
              this.row().deadline,
            );
            this.assert(plan, generation);
            const work = this.store.get<Row>('researchDay', {});
            this.store.exec(
              'UPDATE nightflow_jobs SET research_session_id=? WHERE id=?',
              work.sessionId,
              this.jobId,
            );
            while (this.store.get<Row>('researchDay', {}).active) {
              await this.service.tick();
              const state = this.service.researchController().state();
              if (state.primaryReason === 'DEADLINE') break;
              this.assert(plan, generation);
              if (
                this.service.state().paused ||
                (this.service.state().stopped && this.store.get<Row>('researchDay', {}).active)
              )
                throw new DomainError('RESEARCH_INTERRUPTED', 'Research zatrzymany.');
              await this.wait(750);
            }
            this.service.researchController().finalize();
            const outcome = this.service.researchController().state();
            if (
              outcome.sessionId !== this.row().research_session_id ||
              outcome.deadline !== this.row().deadline ||
              outcome.phase !== 'FINISHED' ||
              outcome.finalGuardOk !== true ||
              !outcome.lastGuardFinishedAt ||
              outcome.guardCodes?.length ||
              !['DEADLINE', 'NO_NEW_QUERIES'].includes(outcome.primaryReason)
            )
              throw new DomainError(
                'RESEARCH_OUTCOME_REJECTED',
                'Brak prawidłowego wyniku końcowego.',
              );
            if (outcome.primaryReason === 'NO_NEW_QUERIES' && plan.exhaustion === 'WAIT_DEADLINE')
              while (this.now() < this.row().deadline) {
                this.assert(plan, generation);
                await this.wait(750);
              }
            // The native planned deadline closes its child authority, not this job.
            if (
              this.service.operationEpoch() !==
              this.epoch + (outcome.primaryReason === 'DEADLINE' ? 1 : 0)
            )
              throw new DomainError('SESSION_STOPPED', 'Dodatkowe odwołanie prawa researchu.');
            this.epoch = this.service.operationEpoch();
            this.service.completeLibraryResearch(outcome.sessionId, outcome.deadline);
            this.store.exec(
              'UPDATE nightflow_jobs SET checkpoint=? WHERE id=?',
              JSON.stringify({
                ...JSON.parse(this.row().checkpoint),
                refreshed: [...refreshed],
                checked: [...checked],
                researchOutcome: {
                  sessionId: outcome.sessionId,
                  deadline: outcome.deadline,
                  reason: outcome.primaryReason,
                  finalGuard: outcome.lastGuardFinishedAt,
                },
              }),
              this.jobId,
            );
          }
          if (plan.exhaustion === 'WAIT_DEADLINE')
            while (this.now() < this.row().deadline) {
              this.assert(plan, generation);
              await this.wait(750);
            }
        }
        if (
          !runningCodeUnchanged() ||
          !compareProtectedSnapshots(
            baseline.data,
            readProtectedSnapshot(this.store.db, this.now()),
            { before: baseline.files, after: fileMaterialProof(this.store.db, this.store.dir) },
          ).ok
        )
          throw new DomainError(
            'PROTECTED_DATA_CHANGED',
            'Końcowa kontrola fazy badawczej odrzucona.',
          );
        this.store.exec(
          'UPDATE nightflow_jobs SET checkpoint=? WHERE id=?',
          JSON.stringify({
            ...JSON.parse(this.row().checkpoint),
            refreshed: [...refreshed],
            checked: [...checked],
            researchComplete: true,
            phaseGuardFinishedAt: this.now(),
          }),
          this.jobId,
        );
        await this.phase('VALIDATING', plan, generation);
        const work = this.store.get<Row>('researchDay', {});
        const researched = new Set(
          this.row().research_session_id === work.sessionId
            ? this.store
                .all(
                  "SELECT DISTINCT d.id FROM drafts d JOIN research_items i ON i.opportunity_id=d.opportunity_id WHERE i.status='DONE' AND i.run_id IN (SELECT value FROM json_each(?))",
                  JSON.stringify(work.runIds ?? []),
                )
                .map((d) => d.id)
            : [],
        );
        const candidates = (await this.service.evaluateNightflowCandidates(plan.draftIds, signal))
          .filter((c) => !plan.draftIds || plan.draftIds.includes(c.d.id))
          .filter((c) => this.service.matchesNightflowRecipient(c.d.id, plan.recipientScope))
          .filter((c) => !c.issues.length && (checked.has(c.d.id) || researched.has(c.d.id)))
          .sort(compareNightflowCandidates);
        this.assert(plan, generation);
        const seen = new Set<string>();
        const selected = candidates
          .filter(({ d }) => {
            if (seen.has(d.company_id) || seen.has(d.email)) return false;
            seen.add(d.company_id);
            seen.add(d.email);
            return true;
          })
          .slice(0, plan.maxItems)
          .map(({ d }) => ({ id: d.id, version: d.version }));
        if (!selected.length) return this.finish('COMPLETED', 'NO_READY_ITEMS');
        await this.phase('CLOSING', plan, generation);
        this.service.deriveNightflowBatch(this.jobId!, selected);
      }
      await this.phase('WAITING_WINDOW', plan, generation);
      while (!inSendWindow(plan, new Date(this.now()))) {
        this.assert(plan, generation);
        await this.wait(1000);
      }
      await this.phase('SENDING', plan, generation);
      this.service.setNightflowSendGuard(() => {
        this.assert(plan, generation);
        if (!inSendWindow(plan, new Date(this.now())))
          throw new DomainError('SEND_WINDOW_CLOSED', 'Okno wysyłki zamknięte.');
      });
      if (this.service.sendTransport() === 'GMAIL_BROWSER' && !this.options.host?.ready())
        throw new DomainError('BROWSER_HOST_REQUIRED', 'Utracono wykonawcę.');
      await this.service.activateNightflowBatch(this.jobId!, generation);
      this.assert(plan, generation);
      let hostFailure = false;
      const hostWork =
        this.service.sendTransport() === 'GMAIL_BROWSER'
          ? this.options.host
              ?.run(this.controller.signal, this.service.browserDelivery.status().scope)
              .catch(() => {
                if (!this.controller?.signal.aborted) {
                  hostFailure = true;
                  this.stop('BROWSER_HOST_LOST');
                }
              })
          : undefined;
      try {
        while (true) {
          this.assert(plan, generation);
          if (hostFailure) throw new DomainError('BROWSER_HOST_LOST', 'Utrata wykonawcy.');
          if (!inSendWindow(plan, new Date(this.now()))) {
            await this.wait(1000);
            continue;
          }
          await this.service.dispatchOne();
          const batch = this.service.batchSummary(this.row().batch_id);
          if (['COMPLETED', 'COMPLETED_WITH_SKIPS'].includes(batch.state))
            return this.finish('COMPLETED', batch.state);
          if (batch.state === 'NEEDS_RESOLUTION' && this.generation === generation)
            return this.finish('NEEDS_RESOLUTION', 'SEND_UNKNOWN');
          this.assert(plan, generation);
          if (batch.state !== 'RUNNING') return this.finish('PAUSED', batch.reason ?? batch.state);
          const senderWait = this.store.get<string | null>('autoSenderWait', null);
          if (senderWait) return this.finish('PAUSED', senderWait);
          await this.wait(750);
        }
      } finally {
        this.controller.abort();
        await hostWork;
      }
    } catch (e) {
      const reason =
        e instanceof DomainError
          ? e.code
          : this.controller.signal.aborted
            ? 'USER_STOP'
            : 'EXECUTION_FAILED';
      if (this.jobId && this.store.one('SELECT id FROM nightflow_jobs WHERE id=?', this.jobId))
        return this.finish('STOPPED', this.row().reason ?? reason);
      throw e;
    } finally {
      this.generation = undefined;
      this.controller.abort();
      this.service.control('stop');
      this.service.setNightflowSendGuard(undefined);
      this.options.host?.setLossHandler?.(undefined);
      await this.options.host?.close?.();
      this.busy = false;
    }
  }
  private finish(state: string, reason: string) {
    this.generation = undefined;
    this.store.exec(
      "UPDATE nightflow_jobs SET state=?,reason=?,generation='',updated_at=? WHERE id=?",
      state,
      reason,
      this.now(),
      this.jobId,
    );
    return this.status(this.jobId);
  }
}
