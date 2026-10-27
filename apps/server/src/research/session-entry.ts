import { mkdirSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { Store } from '../db.js';
import { acquireProfileLock } from '../backend-lock.js';
import { assertOutsideRepository } from '../safe-paths.js';
import { workstationRuntime } from '../runtime.js';
import { DomainError } from '../util.js';
import { ResearchJobHunter } from './service.js';
import { FixtureReader, FixtureRunner } from '../testing/research-fixture.js';
import type { SourceReader } from './fetcher.js';
import type { StructuredRunner } from './codex.js';

export async function runResearchSession(options: {
  dir: string;
  hours: number;
  query?: string;
  resume?: boolean;
  fixture?: boolean;
  steps?: number;
  advanceMs?: number;
  clock?: () => Date;
  providers?: { reader: SourceReader; runner: StructuredRunner };
  afterTick?: (service: ResearchJobHunter, index: number) => Promise<void>;
  signal?: AbortSignal;
  wait?: (ms: number) => Promise<void>;
}) {
  const dir = assertOutsideRepository(options.dir);
  if (
    !Number.isFinite(options.hours) ||
    options.hours < 1 ||
    options.hours > 24 ||
    (options.steps != null && (!Number.isInteger(options.steps) || options.steps < 1)) ||
    (options.advanceMs != null && (!Number.isFinite(options.advanceMs) || options.advanceMs < 0))
  )
    throw new DomainError('SESSION_OPTIONS', 'Nieprawidłowe granice sesji.');
  if (!options.fixture) {
    if (options.providers || options.steps != null || options.advanceMs != null)
      throw new DomainError(
        'FIXTURE_REQUIRED',
        'Sterowanie syntetyczne wymaga jawnego trybu fixture.',
      );
    workstationRuntime(dir).assertNative();
  } else {
    for (let ancestor = dir; ; ancestor = dirname(ancestor)) {
      if (existsSync(join(ancestor, 'workstation.json')))
        throw new DomainError(
          'DEVELOPMENT_REQUIRED',
          'Fixture wymaga oddzielnego katalogu developmentu.',
        );
      if (dirname(ancestor) === ancestor) break;
    }
    if (existsSync(dir) && readdirSync(dir).length && !existsSync(join(dir, 'development.json')))
      throw new DomainError(
        'DEVELOPMENT_REQUIRED',
        'Fixture wymaga nowego lub oznaczonego katalogu.',
      );
    if (existsSync(join(dir, 'jobhunter.sqlite')) && !existsSync(join(dir, 'development.json')))
      throw new DomainError('DEVELOPMENT_REQUIRED', 'Nie otwarto nieoznaczonej bazy.');
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    writeFileSync(join(dir, 'development.json'), JSON.stringify({ kind: 'DEVELOPMENT' }), {
      mode: 0o600,
    });
  }
  const lock = acquireProfileLock(dir);
  let store: Store | undefined, service: ResearchJobHunter | undefined;
  let time = Date.now();
  const clock = options.clock ?? (() => new Date(time));
  try {
    if (assertOutsideRepository(options.dir) !== dir)
      throw new DomainError('PATH_CHANGED', 'Katalog zmienił się.');
    lock.assert();
    store = new Store(dir);
    store.assertExclusive = lock.assert;
    const providers =
      options.providers ??
      (options.fixture ? { reader: new FixtureReader(), runner: new FixtureRunner() } : undefined);
    const mode = store.get<string>('mode', 'RESEARCH_ONLY');
    if (!['RESEARCH_ONLY', 'APPROVAL_REQUIRED', 'AUTO_POLICY'].includes(mode))
      throw new DomainError('MODE_MISMATCH', 'Wymagana biblioteka researchu, nie DEMO.');
    service = new ResearchJobHunter(store, {
      ...providers,
      // Same research-only capability as library refresh. Persisted AUTO is
      // retained, without constructing GmailJobHunter or granting sender scope.
      mode: mode as 'RESEARCH_ONLY' | 'APPROVAL_REQUIRED' | 'AUTO_POLICY',
      independentResearch: true,
      clock: options.fixture ? clock : options.clock,
    });
    if (options.fixture && !service.profile().approved_at) service.approveProfile();
    if (options.fixture) {
      await service.probe('codex');
      await service.probe('search');
    }
    const begin = () =>
      options.resume
        ? service!.resumeSession()
        : service!.startDay(options.query, options.hours, {
            deadlineOnly: true,
            libraryFirst: true,
          });
    if (mode === 'RESEARCH_ONLY') await begin();
    else await service.researchController().start(begin, !!options.resume);
    const onStop = () => service!.control('stop');
    options.signal?.addEventListener('abort', onStop, { once: true });
    try {
      let iteration = 0;
      while (
        store.get<any>('researchDay', {}).active &&
        !service.state().paused &&
        !service.state().stopped
      ) {
        if (options.signal?.aborted) {
          onStop();
          break;
        }
        await service.tick();
        await options.afterTick?.(service, iteration);
        iteration++;
        if (options.fixture && options.steps != null && iteration >= options.steps) {
          service.control('stop');
          break;
        }
        if (options.fixture && options.advanceMs) time += options.advanceMs;
        else await (options.wait ?? ((ms) => new Promise((r) => setTimeout(r, ms))))(750);
      }
    } finally {
      options.signal?.removeEventListener('abort', onStop);
    }
    // Native tick handles provider failures by pausing instead of throwing.
    // A process entry still exits STOPPED; retain the controller's primary
    // failure reason and the passive checkpoint, without retry or new Start.
    if (!service.state().stopped) service.control('stop');
    await service.stopWorker();
    return {
      schema: 1,
      scope: 'SESSION_SUMMARY',
      fixture: !!options.fixture,
      state: service.researchController().state(),
      counts: {
        companies: store.one('SELECT count(*) n FROM companies')!.n,
        drafts: store.one('SELECT count(*) n FROM drafts')!.n,
        attempts: store.one('SELECT count(*) n FROM send_attempts')!.n,
      },
    };
  } catch (error) {
    // A provider/callback failure must not leave a persisted active session.
    try {
      service?.control('stop');
    } catch {}
    throw error;
  } finally {
    if (service) await service.stopWorker();
    store?.close();
    lock.release();
  }
}
