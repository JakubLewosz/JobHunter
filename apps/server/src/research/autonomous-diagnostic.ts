import { QueryPlanner } from './query-planner.js';
import type { ResearchJobHunter } from './service.js';
import type { Store } from '../db.js';
import type { Row } from '../../../../packages/shared/types.js';

// Public worker coordination only: no AutoPolicyJobHunter, mail gateway or session authority.
export class AutonomousDiagnostic {
  readonly planner: QueryPlanner;
  constructor(
    readonly store: Store,
    readonly service: ResearchJobHunter,
    readonly policy: Row,
    clock: () => Date = () => new Date(),
  ) {
    if (!store.get('diagnosticOnly', false) || 'gateway' in service)
      throw new Error('DIAGNOSTIC_ONLY_REQUIRED');
    this.planner = new QueryPlanner(store, clock);
  }
  async cycle() {
    const plan = this.planner.next(this.policy, this.service.minimalProfile().facts);
    if (!plan.query) return { plan, run: null, metrics: null };
    await this.service.start(plan.query);
    const run = this.store.one(
      "SELECT * FROM runs WHERE status='QUEUED' ORDER BY started_at LIMIT 1",
    )!;
    this.planner.started(plan.id!, run.id);
    await this.service.tick();
    const finished = this.store.one('SELECT * FROM runs WHERE id=?', run.id)!;
    // Per-item errors are terminal for this diagnostic cycle, retained for explicit review-only retry.
    // The shared AUTO continuation never manufactures successful item outcomes.
    if (finished.status === 'PAUSED' && !finished.error) this.service.continueAfterItemErrors();
    this.planner.reconcile(this.policy.scopeHash);
    return {
      plan,
      run: this.store.one('SELECT * FROM runs WHERE id=?', run.id)!,
      metrics: JSON.parse(
        this.store.one('SELECT metrics FROM auto_query_plan WHERE id=?', plan.id)!.metrics,
      ),
    };
  }
}
