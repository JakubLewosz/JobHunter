import { BrowserExecutorClient } from './client.js';
import { BrowserBatchController } from './batch-controller.js';
import type { BrowserTab } from './executor.js';
import { localFixtureOrigin } from '../testing/local-fixture-origin.js';

// Await run() in ONE active Computer Use invocation. UI handles cannot be used
// by detached promises after that invocation returns. Reading progress never
// suspends the awaited operation or renews its deadline. No Node daemon, Start,
// replacement client, blind keepalive, or retry is created here.
export class BrowserBatchTask {
  private abort = new AbortController();
  private work?: Promise<void>;
  private deadlineTimer?: ReturnType<typeof setTimeout>;
  private release?: Promise<unknown>;
  private phase = 'NEW';
  private completed = 0;
  private code: string | null = null;
  private probes = 0;
  private closed = false;
  private releaseConfirmed = false;
  private maxProbeGapMs = 0;
  private lastProbe = 0;
  private externalAbort = () => {
    this.code ??= 'BROWSER_TASK_ABORTED';
    this.abort.abort();
  };
  constructor(
    private client: BrowserExecutorClient,
    private tab: BrowserTab,
    private options: {
      taskId: string;
      deadlineMs: number;
      signal?: AbortSignal;
      fixtureOrigin?: string;
    },
  ) {
    if (!options.taskId || !Number.isSafeInteger(options.deadlineMs))
      throw Error('BROWSER_TASK_REQUIRED');
    if (options.fixtureOrigin) localFixtureOrigin(options.fixtureOrigin);
    this.options = Object.freeze({ ...options });
  }
  private assertActive() {
    if (this.options.signal?.aborted) throw Error('BROWSER_TASK_ABORTED');
    this.abort.signal.throwIfAborted();
    if (Date.now() >= this.options.deadlineMs) throw Error('BROWSER_TASK_DEADLINE');
  }
  private async probe() {
    this.assertActive();
    // A stalled/missing tab cannot be disguised by periodic IPC attaches.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const url = await Promise.race([
      this.tab.url(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(Error('BROWSER_TAB_UNAVAILABLE')), 5000);
      }),
    ]).finally(() => clearTimeout(timer));
    this.assertActive();
    if (new URL(url ?? '').origin !== (this.options.fixtureOrigin ?? 'https://mail.google.com'))
      throw Error('GMAIL_LOGIN_REQUIRED');
    const now = Date.now();
    if (this.lastProbe) this.maxProbeGapMs = Math.max(this.maxProbeGapMs, now - this.lastProbe);
    this.lastProbe = now;
    this.probes++;
  }
  async run() {
    if (this.phase !== 'NEW') throw Error('BROWSER_TASK_ALREADY_STARTED');
    this.phase = 'CONNECTING';
    this.options.signal?.addEventListener('abort', this.externalAbort, { once: true });
    const remaining = this.options.deadlineMs - Date.now();
    if (remaining > 0)
      this.deadlineTimer = setTimeout(
        () => {
          this.code = 'BROWSER_TASK_DEADLINE';
          this.abort.abort();
        },
        Math.min(remaining, 2 ** 31 - 1),
      );
    let resolveReady!: () => void, rejectReady!: (error: Error) => void;
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    this.work = (async () => {
      try {
        await this.probe();
        const state = await this.client.attach();
        this.assertActive();
        if (state.scope?.kind !== 'BATCH' || state.execution?.state !== 'RUNNING')
          throw Error('BROWSER_BATCH_REQUIRED');
        const controller = new BrowserBatchController(
          this.client,
          this.tab,
          undefined,
          undefined,
          state.scope,
          this.options.fixtureOrigin,
        );
        this.phase = 'RUNNING';
        resolveReady();
        for (;;) {
          await this.probe();
          const result = await controller.segment(1000, this.abort.signal);
          this.assertActive();
          this.completed = result.completed;
          if (result.status !== 'WAITING') {
            this.phase = result.status;
            this.code = 'code' in result ? (result.code ?? null) : null;
            break;
          }
        }
      } catch (error) {
        this.phase = 'STOPPED';
        this.code ??=
          error instanceof Error && /^[A-Z_]{1,80}$/.test(error.message)
            ? error.message
            : 'BROWSER_HOST_LOST';
        rejectReady(Error(this.code));
      } finally {
        this.abort.abort();
        clearTimeout(this.deadlineTimer);
        this.options.signal?.removeEventListener('abort', this.externalAbort);
        try {
          this.release ??= this.client.release();
          await this.release;
          this.releaseConfirmed = true;
        } catch {
          // A closed owner may have already cleaned up. This is not a Stop ACK.
          this.code ??= 'BROWSER_RELEASE_UNCONFIRMED';
        }
        this.closed = true;
      }
    })();
    await ready;
    await this.work;
    return this.status();
  }
  status() {
    return {
      status: this.phase,
      code: this.code,
      completed: this.completed,
      deadlineMs: this.options.deadlineMs,
      probes: this.probes,
      maxProbeGapMs: this.maxProbeGapMs,
      authority: 'OWNER_CONTROLLED',
      closed: this.closed,
      releaseConfirmed: this.releaseConfirmed,
    };
  }
  async close() {
    if (['RUNNING', 'CONNECTING'].includes(this.phase)) this.code ??= 'BROWSER_TASK_CLOSED';
    this.abort.abort();
    await this.work;
    if (this.phase === 'NEW') {
      this.phase = 'STOPPED';
      this.closed = true;
    }
    return this.status();
  }
  async result() {
    if (!this.work) throw Error('BROWSER_TASK_NOT_STARTED');
    await this.work;
    return this.status();
  }
}
