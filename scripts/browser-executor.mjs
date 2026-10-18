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
export async function runNightflowTask({ dir, planId, taskId, tab, signal, resumeJobId }) {
  let host;
  const adapter = {
    ready: () => !!host?.ready(),
    run: (signal, scope) => host.run(signal, scope),
    close: async () => host?.close(),
    setLossHandler: (handler) => host?.setLossHandler(handler),
  };
  return withNightflow({ dir, signal, host: adapter }, async (coordinator, service) => {
    if (service.sendTransport() !== 'GMAIL_BROWSER') throw Error('BROWSER_TRANSPORT_REQUIRED');
    await service.browserDelivery.listen();
    host = new ActiveTaskNightflowBrowserHost(dir, taskId, tab);
    await host.initialize();
    return coordinator.start(planId, resumeJobId);
  });
}
