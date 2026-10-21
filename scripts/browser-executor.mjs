// Import this entry point inside Codex's browser session. It does not open a browser,
// inspect cookies, connect Gmail OAuth or send anything by itself.
export {
  GmailBrowserExecutor,
  connectBrowserExecutor,
  runBrowserDelivery,
  serveBrowserDeliveries,
} from '../dist/apps/server/src/browser/executor.js';
import { BrowserBatchController } from '../dist/apps/server/src/browser/batch-controller.js';
import { withNightflow } from '../dist/apps/server/src/nightflow-entry.js';
import { ActiveTaskNightflowBrowserHost } from '../dist/apps/server/src/nightflow-browser-host.js';
import { existsSync, readdirSync } from 'node:fs';
import { localFixtureOrigin } from '../dist/apps/server/src/testing/local-fixture-origin.js';
import { autoPolicySchema } from '../dist/apps/server/src/auto-policy.js';
export { BrowserBatchController };
// The active task owns this invocation. No daemon or replacement session.
export async function serveBrowserBatch(client, tab, options = {}) {
  const controller = new BrowserBatchController(client, tab);
  let result;
  do {
    result = await controller.segment(options.segmentMs ?? 30000, options.signal);
    await options.onSegment?.(result);
  } while (result.status === 'WAITING');
  return result;
}

// Await this inside the active task that owns tab. The process waits for research
// and hands the approved plan's result directly to the same pinned browser host.
// This does not wake a completed Codex turn or create a schedule.
export async function runNightflowTask({ dir, planId, taskId, tab, signal, resumeJobId, fixture }) {
  if (fixture) {
    localFixtureOrigin(fixture.origin);
    if (planId || resumeJobId || (existsSync(dir) && readdirSync(dir).length))
      throw Error('FIXTURE_NEW_PROFILE_REQUIRED');
  }
  let host;
  const adapter = {
    ready: () => !!host?.ready(),
    run: (signal, scope) => host.run(signal, scope),
    close: async () => host?.close(),
    setLossHandler: (handler) => host?.setLossHandler(handler),
  };
  return withNightflow(
    {
      dir,
      signal,
      host: adapter,
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
    async (coordinator, service, fixturePlan) => {
      const policy = fixture ? service.policyConfig() : undefined;
      if (fixture) {
        if (!fixture.origin || resumeJobId || planId) throw Error('FIXTURE_OPTIONS');
        await service.setSendTransport({
          transport: 'GMAIL_BROWSER',
          confirmed: true,
          outgoingViewConsent: true,
        });
      }
      if (service.sendTransport() !== 'GMAIL_BROWSER') throw Error('BROWSER_TRANSPORT_REQUIRED');
      await service.browserDelivery.listen();
      host = new ActiveTaskNightflowBrowserHost(dir, taskId, tab, undefined, fixture?.origin);
      await host.initialize();
      if (fixture) {
        service.configurePolicy(
          Object.fromEntries(Object.keys(autoPolicySchema.shape).map((key) => [key, policy[key]])),
        );
        fixturePlan.binding = service.nightflowBinding();
        coordinator.savePlan(fixturePlan, true);
        planId = fixturePlan.id;
      }
      const result = await coordinator.start(planId, resumeJobId);
      return fixture
        ? {
            fixture: true,
            clock: fixture.wallClock ? 'WALL_MONOTONIC' : 'ACCELERATED',
            ...result,
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
          }
        : result;
    },
  );
}
