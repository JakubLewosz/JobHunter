import type { BrowserDeliveryBroker } from './broker.js';
import type { BrowserExecutionScope } from './contracts.js';
import type { NightflowCoordinator, NightflowHost } from '../nightflow.js';
import { DomainError } from '../util.js';
import { setTimeout as delay } from 'node:timers/promises';

// The owner never manufactures browser heartbeats. Only the authenticated
// worker can establish readiness, bound to this owner and one job/generation.
export class RemoteNightflowHost implements NightflowHost {
  private worker?: string;
  private seen = 0;
  private used = false;
  private closed = false;
  private lost?: () => void;
  private timer?: ReturnType<typeof setInterval>;
  private scope?: BrowserExecutionScope;
  private pulses = 0;
  private maxGap = 0;
  private coordinator?: NightflowCoordinator;
  private begin?: () => void;
  private acknowledge?: () => void;
  private target?: ReturnType<NightflowCoordinator['controlScope']>;
  constructor(
    private broker: () => BrowserDeliveryBroker,
    private clock = () => Date.now(),
  ) {}
  bind(coordinator: NightflowCoordinator, begin: () => void, acknowledge: () => void) {
    this.coordinator = coordinator;
    this.begin = begin;
    this.acknowledge = acknowledge;
    this.broker().setNightflowHandler((worker, command, target) =>
      this.request(worker, command, target),
    );
  }
  private fail(): never {
    throw new DomainError('BROWSER_SESSION_CHANGED', 'Inny zakres hosta.');
  }
  private snapshot() {
    return {
      target: this.target ?? this.coordinator!.controlScope(),
      current: this.coordinator!.status(),
      scope: this.scope ?? null,
    };
  }
  private request(worker: string, command: unknown, target: unknown) {
    if (this.closed || !this.coordinator) this.fail();
    if (command === 'attach') {
      if (this.used || (this.worker && this.worker !== worker)) this.fail();
      this.worker = worker;
      this.seen = this.clock();
      this.timer ??= setInterval(() => {
        if (!this.ready() && !this.closed) this.lost?.();
      }, 1000);
      return this.snapshot();
    }
    if (
      this.worker !== worker ||
      !this.ready() ||
      JSON.stringify(target) !== JSON.stringify(this.target ?? this.coordinator!.controlScope())
    )
      this.fail();
    const live = this.coordinator!.controlScope();
    if (
      this.target &&
      (live.instanceId !== this.target.instanceId ||
        live.jobId !== this.target.jobId ||
        (live.generation !== this.target.generation && this.coordinator!.status().authority))
    )
      this.fail();
    const now = this.clock();
    this.maxGap = Math.max(this.maxGap, now - this.seen);
    this.seen = now;
    this.pulses++;
    if (command === 'start') {
      if (this.used) this.fail();
      this.used = true;
      this.begin!();
      this.target = this.coordinator!.controlScope();
    } else if (command === 'ackResult') {
      if (
        !['COMPLETED', 'STOPPED', 'PAUSED', 'NEEDS_RESOLUTION'].includes(
          this.coordinator!.status().state,
        )
      )
        this.fail();
      this.acknowledge!();
    } else if (command !== 'poll') this.fail();
    return this.snapshot();
  }
  ready() {
    return (
      !this.closed &&
      !!this.worker &&
      this.clock() - this.seen < 45000 &&
      this.broker().hasWorker(this.worker)
    );
  }
  leaseValid() {
    return this.ready();
  }
  setLossHandler(handler?: () => void) {
    this.lost = handler;
  }
  async run(signal: AbortSignal, scope: BrowserExecutionScope) {
    if (!this.ready() || scope.kind !== 'BATCH' || this.scope) this.fail();
    this.scope = scope;
    while (!signal.aborted) {
      if (!this.ready()) throw new DomainError('BROWSER_HOST_LOST', 'Utracono wykonawcę.');
      await delay(100, undefined, { signal }).catch(() => {});
    }
  }
  // Keep only the result channel until owner cleanup. Authority is already revoked.
  async close() {
    this.lost = undefined;
  }
  dispose() {
    this.closed = true;
    clearInterval(this.timer);
    this.broker().setNightflowHandler(undefined);
  }
  diagnostics() {
    return {
      pulses: this.pulses,
      maxHeartbeatGapMs: this.maxGap,
      leaseValid: this.ready(),
      closed: this.closed,
    };
  }
}
