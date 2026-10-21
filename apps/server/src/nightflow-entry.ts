import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { Store } from './db.js';
import { AutoPolicyJobHunter } from './auto-policy.js';
import { NightflowCoordinator, type NightflowHost } from './nightflow.js';
import { acquireProfileLock } from './backend-lock.js';
import { assertOutsideRepository } from './safe-paths.js';
import { workstationRuntime } from './runtime.js';
import { FixtureReader, FixtureRunner } from './testing/research-fixture.js';
import { FixtureGmail } from './testing/gmail-fixture.js';
import { DomainError, id } from './util.js';
import { listenNightflow } from './nightflow-control.js';

export async function withNightflow<T>(
  options: {
    dir: string;
    fixture?: boolean;
    signal?: AbortSignal;
    host?: NightflowHost;
    fixtureAdvanceMs?: number;
    realWaitMs?: number;
    onProgress?: (event: string) => void;
    fixtureBrowserOrigin?: string;
    fixtureWallClock?: boolean;
  },
  action: (
    coordinator: NightflowCoordinator,
    service: AutoPolicyJobHunter,
    fixturePlan: any,
  ) => Promise<T>,
) {
  const dir = assertOutsideRepository(options.dir);
  if (!options.fixture && (options.fixtureBrowserOrigin || options.fixtureWallClock))
    throw new DomainError('DEVELOPMENT_REQUIRED', 'Opcje fixture wymagają pełnej symulacji.');
  const progress = (event: string) => {
    try {
      if (options.fixture) options.onProgress?.(event);
    } catch {}
  };
  if (options.fixture) {
    for (let ancestor = dir; ; ancestor = dirname(ancestor)) {
      if (existsSync(join(ancestor, 'workstation.json')))
        throw new DomainError('DEVELOPMENT_REQUIRED', 'Fixture wymaga odrębnego katalogu.');
      if (ancestor === dirname(ancestor)) break;
    }
    if (existsSync(dir) && readdirSync(dir).length && !existsSync(join(dir, 'development.json')))
      throw new DomainError('DEVELOPMENT_REQUIRED', 'Nie otwarto nieoznaczonej historii.');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'development.json'), JSON.stringify({ kind: 'DEVELOPMENT' }), {
      mode: 0o600,
    });
  }
  const runtime = options.fixture ? undefined : workstationRuntime(dir);
  const lock = acquireProfileLock(dir);
  progress('LOCK_ACQUIRED');
  let store: Store | undefined,
    service: AutoPolicyJobHunter | undefined,
    closeControl: (() => Promise<void>) | undefined;
  let time = Date.parse('2026-10-18T10:00:00Z');
  const monotonicStart = performance.now();
  const clock = () =>
    new Date(options.fixtureWallClock ? time + performance.now() - monotonicStart : time);
  try {
    lock.assert();
    store = new Store(dir);
    progress('STORE_READY');
    store.assertExclusive = lock.assert;
    const gateway = options.fixture ? new FixtureGmail() : undefined;
    const reader = options.fixture ? new FixtureReader() : undefined;
    if (reader) {
      const read = reader.read.bind(reader);
      reader.read = async (url, signal) => ({
        ...(await read(url, signal)),
        fetched_at: clock().toISOString(),
      });
    }
    service = new AutoPolicyJobHunter(
      store,
      options.fixture
        ? {
            gateway,
            accountInfo: () => gateway!.info,
            reader,
            runner: new FixtureRunner(),
            clock,
            fixtureBrowserOrigin: options.fixtureBrowserOrigin,
          }
        : { runtime },
    );
    progress('SERVICE_READY');
    let fixturePlan: any;
    if (options.fixture && !service.policyConfig()) {
      service.approveProfile();
      const cv = service.uploadCV(
        'Fixture.pdf',
        Buffer.from('%PDF-1.4\nFictional only\n%%EOF').toString('base64'),
      );
      service.approveCV(cv.id);
      service.configurePolicy({
        senderEmail: gateway!.info.email,
        cvId: cv.id,
        contactKinds: ['GENERAL', 'RECRUITMENT'],
        contactTypes: ['ACTIVE', 'OPEN', 'PROSPECT'],
        searchScope: 'Fictional companies in Poland, paid remote programming',
        sessionLimit: null,
        dailyLimit: null,
        sendIntervalSeconds: 60,
        researchIntervalSeconds: 60,
        confirmed: true,
        targetedHistoryConsent: true,
      });
      await service.configureLocalHistory({
        confirmedHistory: true,
        confirmedSingleWorkstation: true,
      });
      await service.probe('codex');
      await service.probe('search');
      await service.startLibraryResearch(undefined, 8);
      await service.tick();
      service.control('stop');
      service.finishPartial();
    }
    const installation = store.get<string>('nightflowInstallationId', '');
    if (!installation) store.set('nightflowInstallationId', id());
    progress('FIXTURE_READY');
    const coordinator = new NightflowCoordinator(store, service, {
      installation: store.get('nightflowInstallationId', ''),
      host: options.host,
      boundary: async (phase) => progress('PHASE_' + phase),
      ...(options.fixture
        ? {
            clock,
            wait: async (_ms: number, signal: AbortSignal) => {
              await new Promise<void>((resolve) =>
                setTimeout(resolve, options.fixtureWallClock ? _ms : (options.realWaitMs ?? 1)),
              );
              signal.throwIfAborted();
              if (!options.fixtureWallClock) time += options.fixtureAdvanceMs ?? 16 * 60000;
            },
          }
        : {}),
    });
    if (options.fixture)
      fixturePlan = {
        schema: 1,
        id: 'fixture-nightflow-v1',
        version: 1,
        installation: store.get('nightflowInstallationId', ''),
        goal: 'Fictional paid regular remote work, twenty hours weekly',
        binding: service.nightflowBinding(),
        researchHours: 8,
        afterResearchHours: 24,
        discovery: true,
        exhaustion: 'FINISH',
        selection: 'VERIFIED_FIT_THEN_CHANNEL_THEN_AGE',
        maxItems: 10,
        limits: { daily: null, session: null, unlimitedExplicit: true },
        intervalSeconds: 60,
        window: { start: '00:00', end: '23:59', timezone: service.campaign().timezone },
        empty: 'REPORT_WITHOUT_SEND',
      };
    closeControl = await listenNightflow(dir, coordinator);
    const stop = () => coordinator.stop();
    options.signal?.addEventListener('abort', stop, { once: true });
    try {
      options.signal?.throwIfAborted();
      return await action(coordinator, service, fixturePlan);
    } finally {
      options.signal?.removeEventListener('abort', stop);
    }
  } finally {
    progress('CLEANUP_BEGIN');
    await closeControl?.();
    progress('CONTROL_CLOSED');
    await service?.stopWorker();
    progress('WORKER_CLOSED');
    await options.host?.close?.();
    progress('HOST_CLOSED');
    await service?.browserDelivery.close();
    store?.close();
    progress('STORE_CLOSED');
    lock.release();
    progress('LOCK_RELEASED');
  }
}
