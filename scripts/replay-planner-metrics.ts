import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { reopenPublicDiagnostic } from '../apps/server/src/research/diagnostic.js';
import { QueryPlanner } from '../apps/server/src/research/query-planner.js';
import { hash } from '../apps/server/src/util.js';

// After Stop only. Consistent read-only backup of diagnostic data; original plan/results never change.
const dir = resolve(process.argv[2] ?? '');
if (existsSync(join(dir, 'run.lock'))) throw new Error('STOPPED_RESEARCH_REQUIRED');
const result = JSON.parse(readFileSync(join(dir, 'result.json'), 'utf8'));
if (!result.autonomous || !result.budget.endedAt) throw new Error('STOPPED_DIAGNOSTIC_REQUIRED');
const data = readFileSync(join(dir, 'database-path.txt'), 'utf8').trim();
const path = join(data, 'jobhunter.sqlite'),
  sourceHash = hash(readFileSync(path));
const copy = mkdtempSync(join(tmpdir(), 'jh-metrics-replay-'));
const db = new Database(path, { readonly: true, fileMustExist: true });
try {
  await db.backup(join(copy, 'jobhunter.sqlite'));
} finally {
  db.close();
}
const d = reopenPublicDiagnostic(
  copy,
  {
    inspect: async () => ({ available: false }),
    run: async () => {
      throw new Error('MODELS_DISABLED_IN_METRICS_REPLAY');
    },
  },
  {
    read: async () => {
      throw new Error('HTTP_DISABLED_IN_METRICS_REPLAY');
    },
  },
);
try {
  const sourcePlans = d.store.all('SELECT * FROM auto_query_plan ORDER BY rowid');
  const planner = new QueryPlanner(
    d.store,
    () => new Date(),
    (row) => d.service.draftMaterialIssues(row),
  );
  const cycles = [];
  for (const plan of sourcePlans) {
    // Normal planner methods, exclusively in the isolated backup. No worker/search/generation/review.
    planner.started(plan.id, plan.run_id);
    planner.reconcile(plan.scope_hash);
    const replay = d.store.one('SELECT metrics FROM auto_query_plan WHERE id=?', plan.id)!;
    cycles.push({
      plan_id: plan.id,
      query: plan.query,
      original_metrics: JSON.parse(plan.metrics),
      replay_current_snapshot: JSON.parse(replay.metrics),
    });
  }
  if (hash(readFileSync(path)) !== sourceHash) throw new Error('ORIGINAL_DIAGNOSTIC_CHANGED');
  for (const table of ['send_attempts', 'outbox', 'draft_approvals', 'auto_sessions'])
    if (d.store.one(`SELECT count(*) n FROM ${table}`)!.n) throw new Error('ZERO_MAIL_INVARIANT');
  const files = [
    'apps/server/src/research/query-planner.ts',
    'apps/server/src/research/autonomous-diagnostic.ts',
    'apps/server/src/auto-policy.ts',
    'scripts/replay-planner-metrics.ts',
  ];
  const report = {
    timestamp: new Date().toISOString(),
    kind: 'OFFLINE_METRICS_REPLAY_CURRENT_SNAPSHOT',
    public_code_commit: result.code.head,
    replay_code_head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    replay_code_dirty: !!execFileSync('git', ['status', '--porcelain'], {
      encoding: 'utf8',
    }).trim(),
    source_hashes: Object.fromEntries(files.map((f) => [f, hash(readFileSync(f))])),
    original_database_unchanged: true,
    original_database_sha256: sourceHash,
    models: 0,
    http: 0,
    real_sends: 0,
    note: 'Current final bindings, not historical success at each earlier cycle. Public events remain unchanged; stale GOTOMA was verified earlier and invalidated by later analysis.',
    cycles,
  };
  writeFileSync(join(dir, 'metrics-replay.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      cycles: cycles.map((c) => ({
        before: c.original_metrics.checkedDrafts,
        after: c.replay_current_snapshot.checkedDrafts,
      })),
      original_unchanged: true,
      http: 0,
      models: 0,
    }),
  );
} finally {
  d.store.close();
  rmSync(copy, { recursive: true, force: true });
}
