import { readFileSync, writeFileSync, mkdtempSync, appendFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { reopenPublicDiagnostic } from '../apps/server/src/research/diagnostic.js';
import { JobHunter } from '../apps/server/src/service.js';
import { hash } from '../apps/server/src/util.js';
const dir = resolve(process.argv[2] ?? '');
if (!process.argv[2] || existsSync(join(dir, 'run.lock')))
  throw new Error('STOPPED_DIAGNOSTIC_REQUIRED');
const result = JSON.parse(readFileSync(join(dir, 'result.json'), 'utf8')),
  budget = JSON.parse(readFileSync(join(dir, 'budget.json'), 'utf8'));
if (result.outcome !== 'BLOCKED_EXTERNAL')
  throw new Error('EXPLICIT_BLOCKED_CACHE_REPLAY_REQUIRED');
const origin = join(
    readFileSync(join(dir, 'database-path.txt'), 'utf8').trim(),
    'jobhunter.sqlite',
  ),
  beforeHash = hash(readFileSync(origin));
const db = new Database(origin, { readonly: true, fileMustExist: true });
if (
  JSON.parse(
    (db.prepare("SELECT value FROM app_state WHERE key='diagnosticOnly'").get() as any)?.value ??
      'false',
  ) !== true
)
  throw new Error('DIAGNOSTIC_ONLY_REQUIRED');
const copy = mkdtempSync(join(tmpdir(), 'jh-blocked-cache-'));
await db.backup(join(copy, 'jobhunter.sqlite'));
db.close();
const d = reopenPublicDiagnostic(
  copy,
  {
    inspect: async () => ({ available: false }),
    run: async () => {
      throw new Error('NO_MODEL_OR_MOCK_RESULT_AFTER_BLOCK');
    },
  },
  {
    read: async () => {
      throw new Error('NO_HTTP_AFTER_BLOCK');
    },
  },
);
const rows = () =>
  d.service
    .draftRows()
    .map((r) => ({
      id: r.id,
      company: r.canonical_name,
      version: r.version,
      textHash: hash(r.subject + '\n' + r.body),
      supported: JSON.parse(r.semantic_review).supported,
      issues: d.service.draftMaterialIssues(r),
    }));
const before = rows(),
  models = d.store.one('SELECT count(*) n FROM model_calls')!.n,
  sources = d.store.one('SELECT count(*) n FROM research_sources')!.n;
JobHunter.prototype.control.call(d.service, 'stop'); // Archive failed SEARCH on the isolated copy, retain the original checkpoint.
for (const url of ['https://gotoma.pl/', 'https://www.prodaut.pl/']) {
  await d.service.importURL(url);
  await d.service.tick();
}
const after = rows();
d.service.control('stop');
await d.service.stopWorker();
d.store.close();
const reopened = reopenPublicDiagnostic(
  copy,
  {
    inspect: async () => ({ available: false }),
    run: async () => {
      throw new Error('NO_MODEL');
    },
  },
  {
    read: async () => {
      throw new Error('NO_HTTP');
    },
  },
);
const state = reopened.service.state(),
  modelDelta = reopened.store.one('SELECT count(*) n FROM model_calls')!.n - models,
  sourceDelta = reopened.store.one('SELECT count(*) n FROM research_sources')!.n - sources;
if (modelDelta || sourceDelta || hash(readFileSync(origin)) !== beforeHash)
  throw new Error('CACHE_REPLAY_INVARIANT');
const resultCache = {
  timestamp: new Date().toISOString(),
  kind: 'CACHE_ONLY_POST_BLOCK_ON_CONSISTENT_COPY',
  not_new_public_research: true,
  no_mock_verdict: true,
  original_unchanged: true,
  public_budget_unchanged:
    JSON.stringify(budget) === readFileSync(join(dir, 'budget.json'), 'utf8').trim() ||
    JSON.stringify(budget) ===
      JSON.stringify(JSON.parse(readFileSync(join(dir, 'budget.json'), 'utf8'))),
  model_calls: 0,
  http: 0,
  before,
  after,
  restartState: state,
  attempts: reopened.store.one('SELECT count(*) n FROM send_attempts')!.n,
  outbox: reopened.store.one('SELECT count(*) n FROM outbox')!.n,
};
reopened.store.close();
writeFileSync(join(dir, 'blocked-cache-check.json'), JSON.stringify(resultCache, null, 2) + '\n');
appendFileSync(
  join(dir, 'events.jsonl'),
  JSON.stringify({
    timestamp: resultCache.timestamp,
    session_id: budget.sessionId,
    stage: 'CACHE_ONLY_POST_BLOCK',
    outcome: 'PRESERVED_CURRENT_MATERIALS',
    source_kind: 'OFFLINE_CACHE_WITH_REAL_PREVIOUS_REVIEW',
    model_calls: 0,
    http: 0,
    original_unchanged: true,
  }) + '\n',
);
console.log(
  JSON.stringify({
    modelDelta,
    sourceDelta,
    currentBefore: before.filter((r) => !r.issues.length).length,
    currentAfter: after.filter((r) => !r.issues.length).length,
    originalUnchanged: true,
  }),
);
