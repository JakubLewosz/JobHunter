// Ordinary Node24 only. The browser tool must import browser-executor.mjs instead.
import { withNightflow } from '../dist/apps/server/src/nightflow-entry.js';
import { RemoteNightflowHost } from '../dist/apps/server/src/browser/nightflow-host.js';
import { autoPolicySchema } from '../dist/apps/server/src/auto-policy.js';
import { runningBuildIdentity } from '../dist/apps/server/src/build-identity.js';
import { existsSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export async function runStoppedNightflowOwner({
  dir,
  planId,
  resumeJobId,
  signal,
  fixture,
  onReady,
}) {
  if (fixture && (planId || resumeJobId || (existsSync(dir) && readdirSync(dir).length)))
    throw Error('FIXTURE_NEW_PROFILE_REQUIRED');
  let service;
  const host = new RemoteNightflowHost(() => service.browserDelivery);
  try {
    return await withNightflow(
      {
        dir,
        signal,
        host,
        ...(fixture
          ? {
              fixture: true,
              fixtureBrowserOrigin: fixture.origin,
              fixtureWallClock: fixture.wallClock === true,
              realWaitMs: fixture.realWaitMs ?? 100,
              onProgress: fixture.onProgress,
            }
          : {}),
      },
      async (coordinator, backend, fixturePlan) => {
        service = backend;
        const policy = fixture ? service.policyConfig() : undefined;
        if (fixture)
          await service.setSendTransport({
            transport: 'GMAIL_BROWSER',
            confirmed: true,
            outgoingViewConsent: true,
          });
        if (service.sendTransport() !== 'GMAIL_BROWSER') throw Error('BROWSER_TRANSPORT_REQUIRED');
        await service.browserDelivery.listen();
        let settle,
          ack,
          work,
          finished = false;
        const done = new Promise((resolve) => {
          settle = resolve;
        });
        const acknowledged = new Promise((resolve) => {
          ack = resolve;
        });
        host.bind(
          coordinator,
          () => {
            if (fixture) {
              service.configurePolicy(
                Object.fromEntries(
                  Object.keys(autoPolicySchema.shape).map((key) => [key, policy[key]]),
                ),
              );
              fixturePlan.binding = service.nightflowBinding();
              coordinator.savePlan(fixturePlan, true);
              planId = fixturePlan.id;
            }
            work = coordinator.start(planId, resumeJobId);
            work.then(
              (value) => {
                finished = true;
                settle({ value });
              },
              () => {
                finished = true;
                settle({ error: 'NIGHTFLOW_START_FAILED' });
              },
            );
          },
          ack,
        );
        await onReady?.({
          state: 'STOPPED_OWNER_READY',
          target: coordinator.controlScope(),
          code: runningBuildIdentity,
        });
        const aborted = () => {
          coordinator.stop();
          if (!work) settle({ error: 'OWNER_CANCELLED' });
        };
        signal?.addEventListener('abort', aborted, { once: true });
        try {
          signal?.throwIfAborted();
          const outcome = await done;
          if (outcome.error) throw Error(outcome.error);
          await Promise.race([acknowledged, delay(2000)]);
          return {
            ...outcome.value,
            fixture: !!fixture,
            host: host.diagnostics(),
            attempts: service.store.one('SELECT count(*) n FROM send_attempts').n,
            browserActions: service.store.one(
              'SELECT count(*) n FROM browser_deliveries WHERE click_granted_at IS NOT NULL',
            ).n,
            attemptStates: service.store.all(
              'SELECT state,count(*) n FROM send_attempts GROUP BY state',
            ),
            deliveryStates: service.store.all(
              'SELECT state,count(*) n FROM browser_deliveries GROUP BY state',
            ),
          };
        } finally {
          signal?.removeEventListener('abort', aborted);
          if (!finished) coordinator.stop();
          await work;
          host.dispose();
        }
      },
    );
  } finally {
    if (service) host.dispose();
  }
}

// Only a new fully synthetic fixture can be launched without explicit paths/plan.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2),
    value = (flag) => args[args.indexOf(flag) + 1];
  if (!args.includes('--fixture') || !args.includes('--output') || !args.includes('--ready'))
    throw Error('FIXTURE_OUTPUT_READY_REQUIRED');
  const { createLocalFixturePage } = await import('./local-fixture-page.mjs');
  const page = await createLocalFixturePage();
  const root = mkdtempSync(join(tmpdir(), 'jh-node-owner-')),
    dir = join(root, 'data');
  const controller = new AbortController(),
    events = [],
    start = performance.now(),
    startedAt = new Date().toISOString();
  const timeout = setTimeout(
    () => controller.abort(),
    args.includes('--wall-clock') ? 8 * 3600000 + 15 * 60000 : 90000,
  );
  const cancel = () => controller.abort();
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try {
    const result = await runStoppedNightflowOwner({
      dir,
      signal: controller.signal,
      fixture: {
        origin: page.origin,
        wallClock: args.includes('--wall-clock'),
        realWaitMs: 100,
        onProgress: (event) => {
          if (events.length < 128) events.push({ event, elapsedMs: performance.now() - start });
        },
      },
      onReady: (info) => {
        writeFileSync(
          resolve(value('--ready')),
          JSON.stringify({ dir, url: page.url, origin: page.origin, ...info }),
          { flag: 'wx' },
        );
        console.log('STOPPED_OWNER_READY');
      },
    });
    await page.close();
    const cleanup = {
      profileLockReleased: !existsSync(join(dir, 'profile.lock')),
      controlClosed: !existsSync(join(dir, 'nightflow-control.json')),
      browserClosed: !existsSync(join(dir, 'browser-executor.json')),
      localPageClosed: true,
    };
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    cleanup.fixtureDirectoryRemoved = !existsSync(root);
    writeFileSync(
      resolve(value('--output')),
      JSON.stringify(
        {
          schema: 1,
          level: 'NODE_OWNER_EXTERNAL_BROWSER',
          node: process.version,
          platform: process.platform,
          code: runningBuildIdentity,
          startedAt,
          endedAt: new Date().toISOString(),
          elapsedMs: performance.now() - start,
          events,
          result,
          cleanup,
        },
        null,
        2,
      ),
      { flag: 'wx' },
    );
    console.log(
      JSON.stringify({
        state: result.state,
        attempts: result.attempts,
        browserActions: result.browserActions,
        cleanup,
      }),
    );
    process.exitCode = result.state === 'COMPLETED' ? 0 : 1;
  } finally {
    clearTimeout(timeout);
    controller.abort();
    await page.close();
    if (
      !existsSync(join(dir, 'profile.lock')) &&
      !existsSync(join(dir, 'nightflow-control.json')) &&
      !existsSync(join(dir, 'browser-executor.json'))
    )
      rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    process.removeListener('SIGINT', cancel);
    process.removeListener('SIGTERM', cancel);
  }
}
