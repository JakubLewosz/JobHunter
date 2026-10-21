// Host-only entry: no Store, coordinator, MIME, Gmail API or auto-policy import.
export {
  GmailBrowserExecutor,
  connectBrowserExecutor,
  runBrowserDelivery,
  serveBrowserDeliveries,
} from '../dist/apps/server/src/browser/executor.js';
export { BrowserBatchController } from '../dist/apps/server/src/browser/batch-controller.js';
import { BrowserExecutorClient } from '../dist/apps/server/src/browser/client.js';
import { runBrowserDelivery } from '../dist/apps/server/src/browser/executor.js';
import { setTimeout as delay } from 'node:timers/promises';

export async function serveBrowserBatch(client, tab, options = {}) {
  const { BrowserBatchController } =
    await import('../dist/apps/server/src/browser/batch-controller.js');
  const controller = new BrowserBatchController(client, tab);
  let result;
  do {
    result = await controller.segment(options.segmentMs ?? 30000, options.signal);
    await options.onSegment?.(result);
  } while (result.status === 'WAITING');
  return result;
}

export class CodexNightflowAdapter {
  constructor(dir, taskId, tab, options = {}) {
    if (!taskId) throw Error('BROWSER_TASK_REQUIRED');
    this.client = new BrowserExecutorClient(dir);
    this.tab = tab;
    this.options = options;
    this.ended = false;
    this.started = false;
    this.busy = false;
    this.completed = 0;
  }
  async connect() {
    if (this.state || this.ended) throw Error('BROWSER_HOST_BUSY');
    await this.tab.url();
    await this.client.probe();
    this.state = await this.client.nightflow('attach');
    return this.state;
  }
  async start() {
    if (!this.state || this.started || this.ended) throw Error('BROWSER_HOST_BUSY');
    this.started = true; // never retry a possibly accepted Start
    this.state = await this.client.nightflow('start', this.state.target);
    return this.state;
  }
  async segment(durationMs = 30000, signal) {
    if (this.busy || !this.started || this.ended) throw Error('BROWSER_HOST_BUSY');
    if (!Number.isFinite(durationMs) || durationMs < 1 || durationMs > 60000)
      throw Error('BROWSER_DURATION');
    this.busy = true;
    const end = performance.now() + durationMs;
    try {
      while (performance.now() < end) {
        signal?.throwIfAborted();
        await this.tab.url();
        signal?.throwIfAborted();
        const state = await this.client.nightflow('poll', this.state.target);
        signal?.throwIfAborted();
        if (JSON.stringify(state.target) !== JSON.stringify(this.state.target))
          throw Error('BROWSER_SESSION_CHANGED');
        if (this.scope && JSON.stringify(state.scope) !== JSON.stringify(this.scope))
          throw Error('BROWSER_SESSION_CHANGED');
        this.state = state;
        if (['COMPLETED', 'STOPPED', 'PAUSED', 'NEEDS_RESOLUTION'].includes(state.current.state)) {
          await this.client.nightflow('ackResult', state.target);
          this.ended = true;
          return { status: state.current.state, completed: this.completed, current: state.current };
        }
        if (state.scope) {
          this.scope ??= state.scope;
          const result = await runBrowserDelivery(this.client, this.tab, {
            scope: this.scope,
            signal,
            fixtureOrigin: this.options.fixtureOrigin,
          });
          if (result.status === 'STOPPED') {
            this.ended = true;
            return result;
          }
          if (result.status === 'RECORDED') this.completed++;
        }
        await delay(250, undefined, { signal });
      }
      return { status: 'WAITING', completed: this.completed, phase: this.state.current.state };
    } catch (error) {
      this.ended = true;
      await this.client.release().catch(() => {});
      return {
        status: 'STOPPED',
        code: /^[A-Z_]{1,80}$/.test(error.message) ? error.message : 'BROWSER_HOST_LOST',
        completed: this.completed,
      };
    } finally {
      this.busy = false;
    }
  }
  async close() {
    this.ended = true;
    await this.client.release().catch(() => {});
  }
}

export async function runNightflowTask(input) {
  if (
    Object.keys(input).some(
      (key) => !['dir', 'taskId', 'tab', 'signal', 'fixtureOrigin', 'onSegment'].includes(key),
    )
  )
    throw Error('BROWSER_OWNER_OPTIONS_REQUIRED');
  const { dir, taskId, tab, signal, fixtureOrigin, onSegment } = input;
  const adapter = new CodexNightflowAdapter(dir, taskId, tab, { fixtureOrigin });
  try {
    await adapter.connect();
    await adapter.start();
    let result;
    do {
      result = await adapter.segment(30000, signal);
      await onSegment?.(result);
    } while (result.status === 'WAITING');
    return result;
  } finally {
    await adapter.close();
  }
}
