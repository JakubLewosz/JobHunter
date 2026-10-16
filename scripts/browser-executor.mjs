// Import this entry point inside Codex's browser session. It does not open a browser,
// inspect cookies, connect Gmail OAuth or send anything by itself.
export {
  GmailBrowserExecutor,
  connectBrowserExecutor,
  runBrowserDelivery,
  serveBrowserDeliveries,
} from '../dist/apps/server/src/browser/executor.js';
