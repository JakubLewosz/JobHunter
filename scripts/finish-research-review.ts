import {
  appendFileSync,
  closeSync,
  openSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ReviewBudget } from '../apps/server/src/research/review-session.js';
import { reopenPublicDiagnostic } from '../apps/server/src/research/diagnostic.js';
import { ExecCodexRunner, cleanDiagnostic } from '../apps/server/src/research/codex.js';
import { DomainError, hash } from '../apps/server/src/util.js';
import { JobHunter } from '../apps/server/src/service.js';

// Finish only saved material: no search, new company, public HTTP or production database.
const dir = resolve(process.argv[2] ?? '');
const result = JSON.parse(readFileSync(join(dir, 'result.json'), 'utf8'));
const material = JSON.parse(readFileSync(join(dir, 'materials-used.json'), 'utf8'));
const lock = join(dir, 'run.lock'),
  fd = openSync(lock, 'wx');
writeFileSync(fd, String(process.pid));
closeSync(fd);
const budget = new ReviewBudget(dir, result.budget.sessionId, true);
for (const name of ['result', 'materials-used'])
  writeFileSync(join(dir, `${name}-batch-2.json`), readFileSync(join(dir, `${name}.json`)));
const walk = (path: string): string[] =>
  readdirSync(path, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? walk(join(path, f.name)) : f.name.endsWith('.ts') ? [join(path, f.name)] : [],
  );
const files = [
  ...walk('apps/server/src'),
  ...walk('packages/shared'),
  'scripts/public-research-review.ts',
  'scripts/finish-research-review.ts',
];
const code = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: true,
  sourceHashes: Object.fromEntries(
    files.sort().map((f) => [f.replaceAll('\\', '/'), hash(readFileSync(f))]),
  ),
};
const codeId = hash(JSON.stringify(code.sourceHashes));
writeFileSync(
  join(dir, 'materials-used.json'),
  JSON.stringify({ ...material, code, codeId, batchId: 'live-3-checkpoints' }, null, 2),
);
budget.event('SESSION', 'RESUME_EXISTING_ONLY', {
  batch_id: 'live-3-checkpoints',
  code_id: codeId,
  code_head: code.head,
  dirty: true,
  purpose:
    'Link punctuation fix: recheck unchanged draft versions; finish already-read checkpoint. HTTP disabled.',
});
const path = readFileSync(join(dir, 'database-path.txt'), 'utf8').trim();
const d = reopenPublicDiagnostic(path, budget.wrap(new ExecCodexRunner()), {
  read: async () => {
    throw new DomainError(
      'HTTP_BUDGET_EXHAUSTED',
      'HTTP technicznie wyłączone podczas domykania zapisanych etapów.',
    );
  },
});
const reviews = JSON.parse(readFileSync(join(dir, 'reviews.json'), 'utf8'));
const history: any[] = [];
const capture = (stage: string) => {
  for (const v of d.store.all('SELECT * FROM research_draft_materials')) {
    const row = d.service.draftRows().find((r) => r.id === v.draft_id);
    const entry = {
      timestamp: new Date().toISOString(),
      stage,
      code_id: stage === 'BEFORE_CODE_FIX_RECHECK' ? result.codeId : codeId,
      draft_id: v.draft_id,
      version: v.version,
      code_status: v.code_status,
      code_error: v.code_error,
      review_status: v.review_status,
      review_error: v.review_error,
      semantic: row ? JSON.parse(row.semantic_review) : null,
    };
    history.push(entry);
    budget.event('DRAFT_CHECKPOINT', stage, entry);
    if (row)
      reviews[row.id + ':' + row.version] = {
        semantic: JSON.parse(row.semantic_review),
        warnings: JSON.parse(row.warnings),
        materialIssues: d.service.draftMaterialIssues(row),
        email: row.email,
        company_id: row.company_id,
      };
  }
};
try {
  capture('BEFORE_CODE_FIX_RECHECK');
  for (const v of d.store.all(
    "SELECT * FROM research_draft_materials WHERE code_status='REJECTED'",
  )) {
    const error = v.code_error ? JSON.parse(v.code_error) : {};
    if (error.code !== 'UNAPPROVED_LINK') continue;
    budget.assertModel();
    try {
      await d.service.retryDraftReview(v.draft_id, v.version);
    } catch (e) {
      budget.event('RECHECK', 'ERROR', {
        draft_id: v.draft_id,
        version: v.version,
        code: e instanceof DomainError ? e.code : 'UNKNOWN',
        reason: cleanDiagnostic(e instanceof Error ? e.message : 'unknown'),
      });
    }
    capture('AFTER_CODE_FIX_RECHECK');
  }
  // A page read before the HTTP cap may finish extraction/qualification using its saved sources.
  const starts = readFileSync(join(dir, 'events.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l))
    .filter((e) => e.stage === 'COMPANY' && e.outcome === 'REPLAY_STARTED');
  for (const event of starts) {
    if (d.store.one('SELECT id FROM research_items WHERE url=?', event.url.replace(/\/$/, '')))
      continue;
    const saved = d.store
      .all("SELECT * FROM research_sources WHERE status='READ'")
      .filter((s) => new URL(s.original_url).hostname.replace(/^www\./, '') === event.identity);
    if (!saved.length || !saved.some((s) => s.original_url === event.url)) continue;
    budget.assertModel();
    JobHunter.prototype.control.call(d.service, 'stop');
    const imported = await d.service.importURL(event.url);
    if (imported.queued) {
      d.store.exec(
        "UPDATE research_items SET source_ids=?,stage='EXTRACT' WHERE run_id=?",
        JSON.stringify(saved.map((s) => s.id)),
        imported.runId,
      );
      budget.event('READ', 'CACHE_CHECKPOINT_COMPLETION', {
        company_domain: event.identity,
        run_id: imported.runId,
        source_ids: saved.map((s) => s.id),
        code_id: codeId,
        source_kind: 'CACHE_NO_HTTP',
      });
      await d.service.tick();
      capture('CHECKPOINT_COMPLETED');
    }
  }
} finally {
  d.service.control('stop');
  await d.service.stopWorker();
  capture('FINAL');
  const count = d.service
    .draftRows()
    .filter(
      (r) =>
        JSON.parse(r.semantic_review).supported === true &&
        !JSON.parse(r.semantic_review).issues.length &&
        !d.service.draftMaterialIssues(r).length,
    ).length;
  budget.recordChecked(
    d.service
      .draftRows()
      .filter(
        (r) =>
          JSON.parse(r.semantic_review).supported === true &&
          !JSON.parse(r.semantic_review).issues.length &&
          !d.service.draftMaterialIssues(r).length,
      )
      .map((r) => r.id),
  );
  budget.state.endedAt = new Date().toISOString();
  budget.state.stopReason = 'HTTP_LIMIT';
  budget.save();
  writeFileSync(join(dir, 'checks-history.json'), JSON.stringify(history, null, 2));
  writeFileSync(join(dir, 'reviews.json'), JSON.stringify(reviews, null, 2));
  writeFileSync(
    join(dir, 'result.json'),
    JSON.stringify(
      { outcome: 'PARTIAL', stopReason: 'HTTP_LIMIT', budget: budget.state, code, codeId },
      null,
      2,
    ),
  );
  budget.event('SESSION', 'PARTIAL', {
    batch_id: 'live-3-checkpoints',
    stop_reason: 'HTTP_LIMIT',
    code_id: codeId,
    real_sends: 0,
  });
  d.store.close();
  unlinkSync(lock);
  console.log(
    JSON.stringify({
      models: budget.state.models,
      http: budget.state.http,
      checked: count,
      real_sends: 0,
    }),
  );
}
