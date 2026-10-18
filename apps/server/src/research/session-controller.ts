import { Store } from '../db.js';
import { DomainError, id } from '../util.js';
import { runningBuildIdentity, runningCodeUnchanged } from '../build-identity.js';
import {
  readProtectedSnapshot,
  compareProtectedSnapshots,
  fileMaterialProof,
  type ProtectedSnapshot,
  type MaterialProof,
} from './protection.js';
import type { Row } from '../../../../packages/shared/types.js';

export class ResearchSessionController {
  private timer?: ReturnType<typeof setInterval>;
  private checking = false;
  private finalizePending = false;
  private finalizing = false;
  private emergencyReason: string | null = null;
  private baseline?: {
    data: ProtectedSnapshot;
    files: MaterialProof;
    sessionId: string;
    deadline: string;
  };
  constructor(
    private store: Store,
    private now: () => string,
    private stopNative: () => void,
    private materialAdapter = () => fileMaterialProof(store.db, store.dir),
    private codeCheck = runningCodeUnchanged,
  ) {}
  state() {
    try {
      const state = this.store.get<Row>('researchController', {});
      return { ...state, primaryReason: state.primaryReason ?? this.emergencyReason };
    } catch {
      return { primaryReason: this.emergencyReason ?? 'GUARD_FAILED' } as Row;
    }
  }
  private save(value: Row) {
    this.store.set('researchController', { ...this.state(), ...value });
  }
  private watch() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.check(), 15000);
    this.timer.unref();
  }
  async start(startNative: () => Promise<void>, resume = false) {
    this.store.assertHealthy();
    if (resume) {
      this.baseline = this.store.get<typeof this.baseline>('researchControllerBaseline', undefined);
      const work = this.store.get<Row>('researchDay', {});
      if (
        !this.baseline ||
        this.baseline.sessionId !== work.sessionId ||
        this.baseline.deadline !== work.expiresAt
      )
        throw new DomainError(
          'RESEARCH_BASELINE_REQUIRED',
          'Brak zgodnego punktu odniesienia sesji.',
        );
      if (!this.check())
        throw new DomainError(
          'PROTECTED_DATA_CHANGED',
          'Kontrola punktu odniesienia nie powiodła się.',
        );
    } else {
      const files = this.materialAdapter();
      if (!files.valid || !this.codeCheck())
        throw new DomainError('PREFLIGHT_FAILED', 'Kod lub materiały nie przeszły kontroli.');
      this.baseline = {
        data: readProtectedSnapshot(this.store.db, this.now()),
        files,
        sessionId: '',
        deadline: '',
      };
    }
    const previous = this.state();
    this.emergencyReason = null;
    this.save({
      phase: 'STARTING',
      primaryReason: null,
      cleanupStartedAt: null,
      operationsEndedAt: null,
      previousStops: [
        ...(previous.previousStops ?? []),
        ...(previous.primaryReason
          ? [
              {
                reason: previous.primaryReason,
                at: previous.operationsEndedAt ?? previous.lastGuardFinishedAt,
              },
            ]
          : []),
      ],
      processIdentity: runningBuildIdentity,
    });
    if (!this.check(false))
      throw new DomainError('PROTECTED_DATA_CHANGED', 'Kontrola przed Start odrzuciła pracę.');
    await startNative();
    const work = this.store.get<Row>('researchDay', {});
    this.baseline!.sessionId = work.sessionId;
    this.baseline!.deadline = work.expiresAt;
    this.store.set('researchControllerBaseline', this.baseline);
    this.save({
      phase: 'RUNNING',
      sessionId: work.sessionId,
      deadline: work.expiresAt,
      startedAt: work.startedAt,
    });
    this.watch();
  }
  check(enforceDeadline = true) {
    if (!this.baseline || this.checking) return true;
    this.checking = true;
    const checkId = id(),
      startedAt = this.now();
    let reason: string | null = null;
    try {
      this.save({ guardStartedAt: startedAt, guardCheckId: checkId });
      this.store.assertExclusive();
      if (!this.codeCheck()) reason = 'RUNNING_CODE_CHANGED';
      const result = compareProtectedSnapshots(
        this.baseline.data,
        readProtectedSnapshot(this.store.db, this.now()),
        { before: this.baseline.files, after: this.materialAdapter() },
      );
      if (!result.ok) reason ??= 'PROTECTED_DATA_CHANGED';
      const work = this.store.get<Row>('researchDay', {});
      if (enforceDeadline && this.baseline.deadline && work.expiresAt !== this.baseline.deadline)
        reason ??= 'DEADLINE_CHANGED';
      if (enforceDeadline && work.active && this.baseline.deadline <= this.now())
        reason ??= 'DEADLINE';
      if (reason) {
        this.emergencyReason ??= reason;
        this.save({
          primaryReason: this.state().primaryReason ?? reason,
          guardCodes: result.codes,
          guardFinishedAt: this.now(),
        });
        this.stopNative();
        return false;
      }
      this.save({
        guardFinishedAt: this.now(),
        lastGuardFinishedAt: this.now(),
        guardCodes: [],
        acceptedChangeEvents: result.acceptedEvents,
      });
      return true;
    } catch (e) {
      reason = e instanceof DomainError ? e.code : 'GUARD_FAILED';
      this.emergencyReason ??= reason;
      clearInterval(this.timer);
      try {
        this.save({
          primaryReason: this.state().primaryReason ?? reason,
          guardFinishedAt: this.now(),
        });
      } catch {}
      try {
        this.stopNative();
      } catch {}
      return false;
    } finally {
      this.checking = false;
      if (this.finalizePending) {
        this.finalizePending = false;
        this.finalize();
      }
    }
  }
  control(action: string) {
    clearInterval(this.timer);
    if (this.state().phase === 'FINISHED') return;
    this.save({
      primaryReason: this.state().primaryReason ?? (action === 'pause' ? 'PAUSED' : 'STOPPED'),
      cleanupStartedAt: this.state().cleanupStartedAt ?? this.now(),
      phase: 'STOPPING',
    });
  }
  afterTick() {
    if (!this.baseline) return;
    const work = this.store.get<Row>('researchDay', {});
    if (!work.active && this.state().phase === 'FINISHED') return;
    if (!work.active) {
      clearInterval(this.timer);
      this.save({
        primaryReason: this.state().primaryReason ?? work.finalReason ?? 'STOPPED',
        phase: 'OPERATIONS_FINISHED',
        operationsEndedAt: this.now(),
      });
      this.finalize();
    }
  }
  finalize() {
    clearInterval(this.timer);
    if (this.finalizing) return;
    if (this.checking) {
      this.finalizePending = true;
      return;
    }
    if (!this.baseline || this.state().phase === 'FINISHED') return;
    this.finalizing = true;
    try {
      this.save({
        phase: 'FINAL_CHECK',
        cleanupStartedAt: this.state().cleanupStartedAt ?? this.now(),
      });
      const ok = this.check();
      this.save({
        phase: 'FINISHED',
        operationsEndedAt: this.now(),
        cleanupFinishedAt: this.now(),
        finalGuardOk: ok,
        finalGuardFinishedAt: this.now(),
      });
    } finally {
      this.finalizing = false;
    }
  }
}
