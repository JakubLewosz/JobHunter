import { BrowserExecutorClient } from './client.js';
import { runBrowserDelivery, type BrowserTab } from './executor.js';

// Lives in the active Codex task. Each segment is bounded; the same object renews
// its pinned lease. It never claims a replacement backend/session/batch.
export class BrowserBatchController {
  private pinned?: { backendId: string; sessionId: string; batchId: string };
  private ended = false;
  private busy = false;
  private completed = 0;
  constructor(
    private client: BrowserExecutorClient,
    private tab: BrowserTab,
    private clock = () => Date.now(),
    private wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
  ) {}
  async segment(durationMs = 30000, signal?: AbortSignal) {
    if (this.busy) throw Error('BROWSER_CONTROLLER_BUSY');
    if (!Number.isFinite(durationMs) || durationMs < 1 || durationMs > 60000)
      throw Error('BROWSER_DURATION');
    if (this.ended) return { status: 'ENDED', completed: this.completed };
    this.busy = true;
    try {
      const deadline = this.clock() + durationMs;
      while (this.clock() < deadline && !signal?.aborted) {
        const state = await this.client.attach(),
          context = state.execution;
        if (!context?.batchId || !context?.sessionId) throw Error('BROWSER_BATCH_REQUIRED');
        const identity = {
          backendId: state.backendId,
          sessionId: context.sessionId,
          batchId: context.batchId,
        };
        if (this.pinned && JSON.stringify(this.pinned) !== JSON.stringify(identity))
          throw Error('BROWSER_SESSION_CHANGED');
        this.pinned ??= identity;
        if (context.state !== 'RUNNING') {
          this.ended = true;
          return { status: context.state, completed: this.completed };
        }
        const result = await runBrowserDelivery(this.client, this.tab);
        if (result.status === 'STOPPED') {
          this.ended = true;
          return { ...result, completed: this.completed };
        }
        if (result.status === 'RECORDED') this.completed++;
        else await this.wait(Math.min(1000, Math.max(1, deadline - this.clock())));
      }
      if (signal?.aborted) this.ended = true;
      return { status: this.ended ? 'STOPPED' : 'WAITING', completed: this.completed };
    } catch (e) {
      this.ended = true;
      return {
        status: 'STOPPED',
        completed: this.completed,
        code:
          e instanceof Error && /^[A-Z_]{1,80}$/.test(e.message) ? e.message : 'BROWSER_PROTOCOL',
      };
    } finally {
      this.busy = false;
    }
  }
}
