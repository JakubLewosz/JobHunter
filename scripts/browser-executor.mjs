// Host-only entry: no Store, coordinator, MIME, Gmail API or auto-policy import.
export {
  GmailBrowserExecutor,
  connectBrowserExecutor,
  runBrowserDelivery,
  serveBrowserDeliveries,
} from '../dist/apps/server/src/browser/executor.js';
export { BrowserBatchController } from '../dist/apps/server/src/browser/batch-controller.js';
export { BrowserBatchTask } from '../dist/apps/server/src/browser/batch-task.js';
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
  assertActive(signal) {
    this.options.signal?.throwIfAborted();
    this.signal?.throwIfAborted();
    signal?.throwIfAborted();
    if (this.ended) throw Error('BROWSER_HOST_BUSY');
  }
  async connect(signal = this.options.signal) {
    this.assertActive(signal);
    if (this.state || this.pending) throw Error('BROWSER_HOST_BUSY');
    this.signal = signal;
    const work = (async () => {
      await this.tab.url();
      this.assertActive(signal);
      this.probed = true;
      await this.client.probe(signal);
      this.assertActive(signal);
      this.state = await this.client.nightflow('attach', undefined, signal);
      this.assertActive(signal);
      return this.state;
    })();
    this.pending = work;
    try {
      return await work;
    } catch (error) {
      await this.close();
      throw error;
    } finally {
      this.pending = undefined;
    }
  }
  async start(signal = this.signal ?? this.options.signal) {
    this.signal ??= signal;
    this.assertActive(signal);
    if (!this.state || this.started || this.pending) throw Error('BROWSER_HOST_BUSY');
    const work = (async () => {
      this.assertActive(signal);
      this.state = await this.client.nightflow('start', this.state.target, signal, () => {
        this.assertActive(signal);
        this.started = true;
      });
      this.assertActive(signal);
      return this.state;
    })();
    this.pending = work;
    try {
      return await work;
    } catch (error) {
      await this.close();
      throw error;
    } finally {
      this.pending = undefined;
    }
  }
  async segment(durationMs = 30000, signal) {
    if (this.busy || !this.started || this.ended) throw Error('BROWSER_HOST_BUSY');
    if (!Number.isFinite(durationMs) || durationMs < 1 || durationMs > 60000)
      throw Error('BROWSER_DURATION');
    this.busy = true;
    const end = performance.now() + durationMs;
    try {
      while (performance.now() < end) {
        this.assertActive(signal);
        await this.tab.url();
        this.assertActive(signal);
        const state = await this.client.nightflow('poll', this.state.target);
        this.assertActive(signal);
        if (JSON.stringify(state.target) !== JSON.stringify(this.state.target))
          throw Error('BROWSER_SESSION_CHANGED');
        if (this.scope && JSON.stringify(state.scope) !== JSON.stringify(this.scope))
          throw Error('BROWSER_SESSION_CHANGED');
        this.state = state;
        if (['COMPLETED', 'STOPPED', 'PAUSED', 'NEEDS_RESOLUTION'].includes(state.current.state)) {
          await this.client.nightflow('ackResult', state.target);
          this.resultAcknowledged = true;
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
      await this.close();
      return {
        status: 'STOPPED',
        code: /^[A-Z_]{1,80}$/.test(error.message) ? error.message : 'BROWSER_HOST_LOST',
        completed: this.completed,
        authority: 'UNKNOWN',
      };
    } finally {
      this.busy = false;
    }
  }
  async close() {
    this.ended = true;
    this.closing ??= (async () => {
      await this.pending?.catch(() => {});
      if (this.probed && !this.resultAcknowledged) {
        try {
          await this.client.release();
        } catch {
          throw Error('BROWSER_RELEASE_UNCONFIRMED');
        }
      }
    })();
    return this.closing;
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
  signal?.throwIfAborted();
  const adapter = new CodexNightflowAdapter(dir, taskId, tab, { fixtureOrigin, signal });
  try {
    await adapter.connect(signal);
    await adapter.start(signal);
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
