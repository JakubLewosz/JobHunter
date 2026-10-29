import { existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Store } from '../db.js';
import { acquireProfileLock } from '../backend-lock.js';
import { assertOutsideRepository } from '../safe-paths.js';
import { workstationRuntime } from '../runtime.js';
import { runningBuildIdentity, runningCodeUnchanged } from '../build-identity.js';
import { DomainError } from '../util.js';
import { ResearchJobHunter } from './service.js';
import {
  readProtectedSnapshot,
  compareProtectedSnapshots,
  fileMaterialProof,
} from './protection.js';
import type { SourceReader } from './fetcher.js';
import type { StructuredRunner } from './codex.js';

/** Bounded existing-library operation. No scheduler, discovery, Gmail or send service. */
export async function runLibraryRefresh(options: {
  dir: string;
  draftIds: string[];
  minutes: number;
  protectedDraftIds?: string[];
  /** Explicit renewal of named, stopped policy drafts; never grants a send scope. */
  renewScopedDraftIds?: string[];
  deadline?: string;
  signal?: AbortSignal;
  fixture?: { reader: SourceReader; runner: StructuredRunner };
}) {
  options.signal?.throwIfAborted();
  if (
    !Number.isFinite(options.minutes) ||
    options.minutes <= 0 ||
    options.minutes > 60 ||
    !options.draftIds.length ||
    options.draftIds.some((id) => typeof id !== 'string' || !id) ||
    new Set(options.draftIds).size !== options.draftIds.length ||
    (options.renewScopedDraftIds !== undefined &&
      (!Array.isArray(options.renewScopedDraftIds) ||
        new Set(options.renewScopedDraftIds).size !== options.renewScopedDraftIds.length ||
        options.renewScopedDraftIds.some((id) => !options.draftIds.includes(id)))) ||
    (options.deadline !== undefined &&
      (!Number.isFinite(Date.parse(options.deadline)) ||
        Date.parse(options.deadline) <= Date.now()))
  )
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
    schema: 1,
    operationId: randomUUID(),
    kind: 'LIBRARY_REFRESH_ONLY',
    build: runningBuildIdentity,
    selected: options.draftIds,
    renewScopedDraftIds: options.renewScopedDraftIds ?? [],
    results: [],
    startedAt: null,
    deadline: null,
    researchFinishedAt: null,
    cleanupFinishedAt: null,
    reason: 'PREPARING',
    sendAuthority: false,
  };
  let report: string | undefined;
  const persist = () => {
    if (report) {
      writeFileSync(report + '.tmp', JSON.stringify(result, null, 2), { mode: 0o600 });
      renameSync(report + '.tmp', report);
    }
  };
  let before: ReturnType<typeof readProtectedSnapshot> | undefined;
  let files: ReturnType<typeof fileMaterialProof> | undefined;
  let protectedIds: string[] = [],
    protectedLibraryBefore: string | undefined;
  const protectedLibrary = () => {
    const drafts = service!.draftRows().filter((d) => protectedIds.includes(d.id));
    const companies = JSON.stringify(drafts.map((d) => d.company_id));
    const ids = JSON.stringify(protectedIds);
    const sources = JSON.stringify([
      ...new Set(drafts.flatMap((d) => service!.sourcesForDraft(d).map((s) => s.id))),
    ]);
    const rows: Record<string, any> = {};
    for (const table of ['companies', 'company_aliases', 'contacts', 'opportunities', 'evidence'])
      rows[table] = store!.all(
        `SELECT * FROM ${table} WHERE ${table === 'companies' ? 'id' : 'company_id'} IN (SELECT value FROM json_each(?)) ORDER BY rowid`,
        companies,
      );
    rows.drafts = store!.all(
      'SELECT * FROM drafts WHERE id IN (SELECT value FROM json_each(?)) ORDER BY id',
      ids,
    );
    for (const table of [
      'research_drafts',
      'research_draft_materials',
      'draft_versions',
      'auto_draft_scope',
    ])
      rows[table] = store!.all(
        `SELECT * FROM ${table} WHERE draft_id IN (SELECT value FROM json_each(?)) ORDER BY rowid`,
        ids,
      );
    rows.sources = store!.all(
      'SELECT * FROM research_sources WHERE id IN (SELECT value FROM json_each(?)) ORDER BY id',
      sources,
    );
    rows.verifications = store!.all(
      'SELECT * FROM source_verifications WHERE source_id IN (SELECT value FROM json_each(?)) ORDER BY rowid',
      sources,
    );
    rows.qualifications = store!.all(
      'SELECT * FROM research_qualifications WHERE opportunity_id IN (SELECT id FROM opportunities WHERE company_id IN (SELECT value FROM json_each(?))) ORDER BY rowid',
      companies,
    );
    return JSON.stringify(rows);
  };
  const guard = () => {
    lock.assert();
    if (!runningCodeUnchanged())
      throw new DomainError('CODE_CHANGED', 'Kod zmienił się w trakcie pracy.');
    const check = compareProtectedSnapshots(before!, readProtectedSnapshot(store!.db), {
      before: files!,
      after: fileMaterialProof(store!.db, dir),
    });
    if (!check.ok) throw new DomainError('PROTECTED_DATA_CHANGED', check.codes.join(','));
    if (protectedLibraryBefore !== undefined && protectedLibrary() !== protectedLibraryBefore)
      throw new DomainError(
        'PROTECTED_DATA_CHANGED',
        'Zmieniły się chronione szkice lub ich powiązania.',
      );
    if (
      store!.one('SELECT count(*) n FROM companies')!.n !== result.companyCount ||
      store!.one('SELECT count(*) n FROM drafts')!.n !== result.draftCount
    )
      throw new DomainError(
        'REFRESH_SCOPE_CHANGED',
        'Odnowienie nie może odkrywać nowych firm lub szkiców.',
      );
  };
  const onStop = () => {
    try {
      lock.assert();
      service?.control('stop');
    } catch {
      /* AbortSignal still cancels this instance; a foreign owner is never changed. */
    }
  };
  try {
    signal.throwIfAborted();
    store = new Store(dir);
    store.assertExclusive = lock.assert;
    store.assertHealthy();
    if (
      !store.get('stopped', true) ||
      store.one("SELECT id FROM runs WHERE status IN ('RUNNING','QUEUED','PAUSED')") ||
      store.one("SELECT id FROM auto_sessions WHERE status IN ('RUNNING','WAITING','PAUSED')")
    )
      throw new DomainError('BUSY', 'Zakończ wcześniejszą operację przed odnowieniem.');
    const mode = store.get<string>('mode', 'DEMO');
    if (!['RESEARCH_ONLY', 'APPROVAL_REQUIRED', 'AUTO_POLICY'].includes(mode))
      throw new DomainError('MODE_MISMATCH', 'Wymagana istniejąca biblioteka.');
    service = new ResearchJobHunter(store, {
      ...options.fixture,
      mode: mode as 'RESEARCH_ONLY' | 'APPROVAL_REQUIRED' | 'AUTO_POLICY',
      independentResearch: true,
    });
    service.minimalProfile();
    const profile = service.profile(),
      cv = store.one('SELECT * FROM cv_assets WHERE id=?', service.campaign().cv_id);
    if (!cv?.approved_at || !fileMaterialProof(store.db, dir).valid)
      throw new DomainError('CV_UNAPPROVED', 'Wymagany zatwierdzony dokładny PDF.');
    const drafts = service.draftRows();
    if (options.draftIds.some((id) => !drafts.some((d) => d.id === id)))
      throw new DomainError('NOT_FOUND', 'Lista zawiera obcy szkic.');
    result.materials = {
      profileVersion: profile.version,
      profileHash: profile.profile_hash,
      cvId: cv.id,
      cvHash: cv.sha256,
    };
    result.companyCount = store.one('SELECT count(*) n FROM companies')!.n;
    result.draftCount = drafts.length;
    before = readProtectedSnapshot(store.db);
    files = fileMaterialProof(store.db, dir);
    protectedIds = [
      ...new Set([
        ...(options.protectedDraftIds ?? []),
        ...store
          .all('SELECT draft_id FROM auto_draft_scope')
          .map((r) => r.draft_id as string)
          .filter((id) => !options.renewScopedDraftIds?.includes(id)),
      ]),
    ];
    protectedLibraryBefore = protectedLibrary();
    const started = Date.now();
    result.startedAt = new Date(started).toISOString();
    result.deadline = new Date(
      Math.min(
        started + options.minutes * 60000,
        options.deadline ? Date.parse(options.deadline) : Infinity,
      ),
    ).toISOString();
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
      const batch = await service.refreshLibraryDrafts(
        { draftIds: result.currentBatch },
        {
          signal,
          deadline: result.deadline,
          guard,
          protectedDraftIds: protectedIds,
        },
      );
      result.results.push(...batch.results);
      result.currentBatch = [];
      guard();
      persist();
      if (batch.interrupted) break;
    }
    result.reason = Date.now() >= Date.parse(result.deadline) ? 'DEADLINE' : 'COMPLETED';
  } catch (error) {
    result.reason = options.signal?.aborted
      ? 'STOPPED'
      : abort.signal.aborted
        ? 'DEADLINE'
        : error instanceof DomainError
          ? error.code
          : 'REFRESH_FAILED';
    // An unreturned batch is explicitly unresolved, never counted as completed.
    result.unreturnedBatch = result.currentBatch ?? [];
  } finally {
    result.researchFinishedAt = new Date().toISOString();
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onStop);
    let ownsLock = true;
    try {
      lock.assert();
    } catch {
      ownsLock = false;
      result.reason = 'PROFILE_LOCK_LOST';
    }
    if (service && ownsLock) {
      // No further work; retain interrupted checkpoints, pending invalidation and reasons.
      service.control('stop');
      await service.stopWorker();
    }
    if (before) {
      try {
        guard();
        result.preserved = true;
      } catch (error) {
        result.preserved = false;
        result.reason = error instanceof DomainError ? error.code : 'GUARD_FAILED';
      }
    }
    store?.close();
    if (ownsLock) {
      lock.release();
      result.lockReleased = true;
    } else result.lockReleased = false;
    result.cleanupFinishedAt = new Date().toISOString();
    persist();
  }
  return { ...result, report };
}
