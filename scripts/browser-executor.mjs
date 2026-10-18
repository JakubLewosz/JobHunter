// Import this entry point inside Codex's browser session. It does not open a browser,
// inspect cookies, connect Gmail OAuth or send anything by itself.
export {
  GmailBrowserExecutor,
  connectBrowserExecutor,
  runBrowserDelivery,
  serveBrowserDeliveries,
} from '../dist/apps/server/src/browser/executor.js';
import { BrowserBatchController } from '../dist/apps/server/src/browser/batch-controller.js';
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
