import { BrowserExecutorClient } from './browser/client.js';
import { BrowserBatchController } from './browser/batch-controller.js';
import type { BrowserTab } from './browser/executor.js';
import type { BrowserExecutionScope } from './browser/contracts.js';
import type { NightflowHost } from './nightflow.js';

// Inject an already authorized tab from the active Codex task. No browser
// launch, cookies, CDP, wake API, transport fallback or background daemon.
export class ActiveTaskNightflowBrowserHost implements NightflowHost {
  private connected = false;
  private used = false;
  private client: BrowserExecutorClient;
  private cancelHeartbeat?: () => void;
  private heartbeat?: Promise<void>;
  private closing = false;
  private onLost?: () => void;
  private heartbeats = 0;
  private lastHeartbeat?: number;
  private maxHeartbeatGapMs = 0;
  constructor(
    profileDir: string,
    readonly taskId: string,
    private tab: BrowserTab,
    private schedule = (fn: () => Promise<void>) => {
      const timer = setInterval(() => void fn().catch(() => {}), 10000);
      timer.unref();
      return () => clearInterval(timer);
    },
    private fixtureOrigin?: string,
  ) {
    if (!taskId) throw Error('BROWSER_TASK_REQUIRED');
    this.client = new BrowserExecutorClient(profileDir);
  }
  async initialize() {
    if (this.used || this.connected) throw Error('BROWSER_HOST_BUSY');
    await this.client.probe();
    this.connected = true;
    this.lastHeartbeat = performance.now();
    this.cancelHeartbeat = this.schedule(() => this.keepAlive());
  }
  setLossHandler(handler?: () => void) {
    this.onLost = handler;
  }
  keepAlive(): Promise<void> {
    if (this.heartbeat) return this.heartbeat;
    if (!this.connected || this.closing) return Promise.reject(Error('BROWSER_HOST_LOST'));
    this.heartbeat = this.client
      .probe()
      .then(() => {
        const now = performance.now();
        this.maxHeartbeatGapMs = Math.max(this.maxHeartbeatGapMs, now - this.lastHeartbeat!);
        this.lastHeartbeat = now;
        this.heartbeats++;
      })
      .catch(() => {
        this.connected = false;
        this.cancelHeartbeat?.();
        if (!this.closing) this.onLost?.();
        throw Error('BROWSER_HOST_LOST');
      })
      .finally(() => {
        this.heartbeat = undefined;
      });
    return this.heartbeat;
  }
  async close() {
    this.closing = true;
    this.used = true;
    this.cancelHeartbeat?.();
    this.cancelHeartbeat = undefined;
    await this.heartbeat?.catch(() => {});
    await this.client.release().catch(() => {});
    this.connected = false;
    this.onLost = undefined;
  }
  ready() {
    return this.connected && !this.used;
  }
  diagnostics() {
    return {
      heartbeats: this.heartbeats,
      maxHeartbeatGapMs: this.maxHeartbeatGapMs,
      connected: this.connected,
      closed: this.closing,
    };
  }
  async run(signal: AbortSignal, scope: BrowserExecutionScope) {
    if (!this.ready() || scope.kind !== 'BATCH') throw Error('BROWSER_HOST_REQUIRED');
    this.used = true;
    const controller = new BrowserBatchController(
      this.client,
      this.tab,
      undefined,
      undefined,
      scope,
      this.fixtureOrigin,
    );
    try {
      while (!signal.aborted) {
        const result = await controller.segment(30000, signal);
        if (signal.aborted) return;
        if (['COMPLETED', 'COMPLETED_WITH_SKIPS'].includes(result.status)) return;
        if (result.status !== 'WAITING') throw Error('BROWSER_HOST_LOST');
      }
    } finally {
      await this.close();
    }
  }
}
