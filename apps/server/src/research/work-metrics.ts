import type { Store } from '../db.js';
import type { Row } from '../../../../packages/shared/types.js';
export function fairWorkOrder<T extends Row>(items: T[], category: (item: T) => string) {
  const buckets = ['REFRESH', 'DISCOVERY', 'REUSE'].map((kind) =>
      items.filter((i) => category(i) === kind),
    ),
    result: T[] = [];
  while (buckets.some((b) => b.length))
    for (const b of buckets) {
      const item = b.shift();
      if (item) result.push(item);
    }
  return result;
}
export function workMetrics(store: Pick<Store, 'all' | 'get'>, runIds: string[], now = Date.now()) {
  const ids = JSON.stringify(runIds),
    categories = store.all(
      'SELECT w.category,count(*) items,sum(w.elapsed_ms) elapsedMs,sum(w.attempts) attempts FROM research_work_items w JOIN research_items i ON i.id=w.item_id WHERE i.run_id IN (SELECT value FROM json_each(?)) GROUP BY w.category',
      ids,
    );
  const deferred = store
    .all("SELECT value FROM app_state WHERE key LIKE 'researchDeferred:%'")
    .map((r) => JSON.parse(r.value))
    .filter(Boolean);
  const reasons: Record<string, number> = {};
  for (const item of deferred) reasons[item.reason] = (reasons[item.reason] ?? 0) + 1;
  const baseline = new Set(store.get<string[]>('researchBaselineCompanies:' + runIds[0], []));
  const companies = [
    ...new Set(
      store
        .all(
          'SELECT company_id FROM research_items WHERE run_id IN (SELECT value FROM json_each(?)) AND company_id IS NOT NULL',
          ids,
        )
        .map((r) => r.company_id),
    ),
  ];
  return {
    categories,
    stages: store.all(
      'SELECT stage,sum(elapsed_ms) elapsedMs,sum(segments) segments FROM research_stage_timings WHERE run_id IN (SELECT value FROM json_each(?)) GROUP BY stage',
      ids,
    ),
    companies: {
      known: companies.filter((id) => baseline.has(id)).length,
      new: companies.filter((id) => !baseline.has(id)).length,
    },
    deferred: {
      count: deferred.length,
      oldestAgeMs: deferred.length
        ? Math.max(...deferred.map((d) => Math.max(0, now - Date.parse(d.queuedAt))))
        : 0,
      reasons,
    },
    budgets: runIds.map((id) => store.get<Row>('researchBudget:' + id, {})),
    tokenAccounting: 'INPUT_INCLUDES_CACHED',
    price: null,
  };
}
