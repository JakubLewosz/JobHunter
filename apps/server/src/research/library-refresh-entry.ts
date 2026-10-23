import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Store } from '../db.js';
import { acquireProfileLock } from '../backend-lock.js';
import { assertOutsideRepository } from '../safe-paths.js';
import { workstationRuntime } from '../runtime.js';
import { runningBuildIdentity, runningCodeUnchanged } from '../build-identity.js';
import { DomainError } from '../util.js';
import { ResearchJobHunter } from './service.js';
import { readProtectedSnapshot, compareProtectedSnapshots, fileMaterialProof } from './protection.js';
import type { SourceReader } from './fetcher.js';
import type { StructuredRunner } from './codex.js';

/** Bounded existing-library operation. No scheduler, discovery, Gmail or send service. */
export async function runLibraryRefresh(options: {
  dir: string;
  draftIds: string[];
  minutes: number;
  signal?: AbortSignal;
  fixture?: { reader: SourceReader; runner: StructuredRunner };
}) {
  options.signal?.throwIfAborted();
  if (!Number.isFinite(options.minutes) || options.minutes <= 0 || options.minutes > 60 ||
      !options.draftIds.length || options.draftIds.some(id => typeof id !== 'string' || !id) ||
      new Set(options.draftIds).size !== options.draftIds.length)
    throw new DomainError('REFRESH_OPTIONS', 'Wskaż zamkniętą listę ID i budżet do 60 minut.');
  const dir = assertOutsideRepository(options.dir);
  if (!existsSync(join(dir, 'jobhunter.sqlite')))
    throw new DomainError('EXISTING_HISTORY_REQUIRED', 'Nie utworzono pustej historii.');
  if (options.fixture) {
    for (let ancestor = dir; ; ancestor = dirname(ancestor)) {
      if (existsSync(join(ancestor, 'workstation.json')))
        throw new DomainError('DEVELOPMENT_REQUIRED', 'Fixture wymaga osobnych danych.');
      if (ancestor === dirname(ancestor)) break;
    }
    if (!existsSync(join(dir, 'development.json')))
      throw new DomainError('DEVELOPMENT_REQUIRED', 'Fixture wymaga oznaczonej historii.');
  } else workstationRuntime(dir).assertNative();
  const lock = acquireProfileLock(dir);
  let store: Store | undefined, service: ResearchJobHunter | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const abort = new AbortController();
  const signal = options.signal ? AbortSignal.any([options.signal, abort.signal]) : abort.signal;
  const result: Record<string, any> = {
    schema: 1, operationId: randomUUID(), kind: 'LIBRARY_REFRESH_ONLY',
    build: runningBuildIdentity, selected: options.draftIds, results: [],
    startedAt: null, deadline: null, researchFinishedAt: null, cleanupFinishedAt: null,
    reason: 'PREPARING', sendAuthority: false,
  };
  let report: string | undefined;
  const persist = () => {
    if (report) writeFileSync(report, JSON.stringify(result, null, 2), { mode: 0o600 });
  };
  let before: ReturnType<typeof readProtectedSnapshot> | undefined;
  let files: ReturnType<typeof fileMaterialProof> | undefined;
  const guard = () => {
    lock.assert();
    if (!runningCodeUnchanged()) throw new DomainError('CODE_CHANGED', 'Kod zmienił się w trakcie pracy.');
    const check = compareProtectedSnapshots(before!, readProtectedSnapshot(store!.db), {
      before: files!, after: fileMaterialProof(store!.db, dir),
    });
    if (!check.ok) throw new DomainError('PROTECTED_DATA_CHANGED', check.codes.join(','));
    if (store!.one('SELECT count(*) n FROM companies')!.n !== result.companyCount ||
        store!.one('SELECT count(*) n FROM drafts')!.n !== result.draftCount)
      throw new DomainError('REFRESH_SCOPE_CHANGED', 'Odnowienie nie może odkrywać nowych firm lub szkiców.');
  };
  const onStop = () => service?.control('stop');
  try {
    signal.throwIfAborted();
    store = new Store(dir);
    store.assertExclusive = lock.assert;
    store.assertHealthy();
    if (!store.get('stopped', true) ||
        store.one("SELECT id FROM runs WHERE status IN ('RUNNING','QUEUED','PAUSED')") ||
        store.one("SELECT id FROM auto_sessions WHERE status IN ('RUNNING','WAITING','PAUSED')"))
      throw new DomainError('BUSY', 'Zakończ wcześniejszą operację przed odnowieniem.');
    const mode = store.get<string>('mode', 'DEMO');
    if (!['RESEARCH_ONLY', 'APPROVAL_REQUIRED', 'AUTO_POLICY'].includes(mode))
      throw new DomainError('MODE_MISMATCH', 'Wymagana istniejąca biblioteka.');
    service = new ResearchJobHunter(store, { ...options.fixture, mode: mode as 'RESEARCH_ONLY' });
    service.minimalProfile();
    const profile = service.profile(), cv = store.one('SELECT * FROM cv_assets WHERE id=?', service.campaign().cv_id);
    if (!cv?.approved_at || !fileMaterialProof(store.db, dir).valid)
      throw new DomainError('CV_UNAPPROVED', 'Wymagany zatwierdzony dokładny PDF.');
    const drafts = service.draftRows();
    if (options.draftIds.some(id => !drafts.some(d => d.id === id)))
      throw new DomainError('NOT_FOUND', 'Lista zawiera obcy szkic.');
    result.materials = { profileVersion: profile.version, profileHash: profile.profile_hash, cvId: cv.id, cvHash: cv.sha256 };
    result.companyCount = store.one('SELECT count(*) n FROM companies')!.n;
    result.draftCount = drafts.length;
    before = readProtectedSnapshot(store.db);
    files = fileMaterialProof(store.db, dir);
    const started = Date.now();
    result.startedAt = new Date(started).toISOString();
    result.deadline = new Date(started + options.minutes * 60000).toISOString();
    timer = setTimeout(() => abort.abort(), Math.max(1, Date.parse(result.deadline) - Date.now()));
    const reports = join(dir, 'reports');
    mkdirSync(reports, { recursive: true, mode: 0o700 });
    report = join(reports, 'library-refresh-' + result.operationId + '.private.json');
    result.reason = 'RUNNING';
    persist();
    options.signal?.addEventListener('abort', onStop, { once: true });
    // One ID per native call keeps every completed result durable if the next is interrupted.
    for (let index = 0; index < options.draftIds.length; index++) {
      signal.throwIfAborted();
      guard();
      result.currentBatch = options.draftIds.slice(index, index + 1);
      persist();
      const batch = await service.refreshLibraryDrafts({ draftIds: result.currentBatch }, { signal, deadline: result.deadline });
      result.results.push(...batch.results);
      result.currentBatch = [];
      guard();
      persist();
      if (batch.interrupted) break;
    }
    result.reason = Date.now() >= Date.parse(result.deadline) ? 'DEADLINE' : 'COMPLETED';
  } catch (error) {
    result.reason = options.signal?.aborted ? 'STOPPED' : abort.signal.aborted ? 'DEADLINE' :
      error instanceof DomainError ? error.code : 'REFRESH_FAILED';
    // An unreturned batch is explicitly unresolved, never counted as completed.
    result.unreturnedBatch = result.currentBatch ?? [];
  } finally {
    result.researchFinishedAt = new Date().toISOString();
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onStop);
    if (service) {
      // No further work; retain interrupted checkpoints, pending invalidation and reasons.
      service.control('stop');
      await service.stopWorker();
    }
    if (before) {
      try { guard(); result.preserved = true; }
      catch (error) { result.preserved = false; result.reason = error instanceof DomainError ? error.code : 'GUARD_FAILED'; }
    }
    store?.close();
    lock.release();
    result.cleanupFinishedAt = new Date().toISOString();
    persist();
  }
  return { ...result, report };
}
