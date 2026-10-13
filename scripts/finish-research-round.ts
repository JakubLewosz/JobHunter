import { readFileSync, writeFileSync, readdirSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { reopenPublicDiagnostic } from '../apps/server/src/research/diagnostic.js';
import { ReviewBudget } from '../apps/server/src/research/review-session.js';
import { ExecCodexRunner, cleanDiagnostic } from '../apps/server/src/research/codex.js';
import { DomainError, hash } from '../apps/server/src/util.js';

// A bounded correction of three already studied controls. No search, new firms or HTTP.
const dir = resolve(process.argv[2] ?? '');
const read = (name: string) => JSON.parse(readFileSync(join(dir, name), 'utf8'));
const previous = read('result.json'),
  materials = read('materials-used.json');
if (!previous.round || materials.provenance?.kind !== 'PUBLIC_APPROVED_SNAPSHOT')
  throw new Error('ROUND_SNAPSHOT_REQUIRED');
const lock = join(dir, 'run.lock'),
  fd = openSync(lock, 'wx');
closeSync(fd);
const budget = new ReviewBudget(dir, previous.budget.sessionId, true, previous.limits);
if (readFileSync(join(dir, 'events.jsonl'), 'utf8').includes('FINAL_CONTROL_CORRECTION')) {
  unlinkSync(lock);
  throw new Error('SINGLE_CORRECTION_ALREADY_RUN');
}
const n = readdirSync(dir).filter((f) => /^result-batch-\d+\.json$/.test(f)).length + 1;
for (const name of ['result', 'materials-used', 'summary'])
  writeFileSync(join(dir, `${name}-batch-${n}.json`), readFileSync(join(dir, `${name}.json`)));
const walk = (path: string): string[] =>
  readdirSync(path, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? walk(join(path, f.name)) : f.name.endsWith('.ts') ? [join(path, f.name)] : [],
  );
const files = [
  ...walk('apps/server/src'),
  ...walk('packages/shared'),
  'scripts/public-research-review.ts',
  'scripts/finish-research-round.ts',
];
const code = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: true,
  sourceHashes: Object.fromEntries(files.sort().map((f) => [f, hash(readFileSync(f))])),
};
const codeId = hash(JSON.stringify(code.sourceHashes));
writeFileSync(
  join(dir, 'materials-used.json'),
  JSON.stringify({ ...materials, code, codeId, batchId: 'control-correction' }, null, 2),
);
budget.event('SESSION', 'FINAL_CONTROL_CORRECTION', {
  code_id: codeId,
  purpose:
    'Saved-source BizCode extraction; new OKE/Tukano versions after evidence matcher correction. HTTP disabled.',
});
const d = reopenPublicDiagnostic(
  readFileSync(join(dir, 'database-path.txt'), 'utf8').trim(),
  budget.wrap(new ExecCodexRunner()),
  {
    read: async () => {
      throw new DomainError('HTTP_DISABLED', 'Saved controls only.');
    },
  },
);
// Earlier marker was absent; exact saved materials/provenance establish that this is the approved real snapshot.
d.store.set('diagnosticSynthetic', false);
const reviews = read('reviews.json');
const checks: any[] = [];
const recordChecks = (stage: string) => {
  for (const m of d.store.all('SELECT * FROM research_draft_materials')) {
    const review = reviews[m.draft_id + ':' + m.version]?.semantic ?? null;
    checks.push({
      timestamp: new Date().toISOString(),
      stage,
      code_id: codeId,
      draft_id: m.draft_id,
      version: m.version,
      code_status: m.code_status,
      code_error: m.code_error,
      review_status: m.review_status,
      review_error: m.review_error,
      semantic: review,
    });
  }
  writeFileSync(join(dir, 'checks-history.json'), JSON.stringify(checks, null, 2));
};
const capture = () => {
  for (const draft of d.service.draftRows())
    reviews[draft.id + ':' + draft.version] = {
      semantic: JSON.parse(draft.semantic_review),
      warnings: JSON.parse(draft.warnings),
      materialIssues: d.service.draftMaterialIssues(draft),
      email: draft.email,
      company_id: draft.company_id,
    };
  budget.recordChecked(
    d.service
      .draftRows()
      .filter((draft) => {
        const review = JSON.parse(draft.semantic_review);
        return (
          review.supported === true &&
          !review.issues.length &&
          !d.service.draftMaterialIssues(draft).length
        );
      })
      .map((draft) => draft.id),
  );
  writeFileSync(join(dir, 'reviews.json'), JSON.stringify(reviews, null, 2));
  writeFileSync(
    join(dir, 'summary.json'),
    JSON.stringify({ ...d.summary(), budget: budget.state }, null, 2),
  );
};
recordChecks('SNAPSHOT_BEFORE_CORRECTION');
let stopReason = 'CONTROL_CORRECTION_COMPLETE';
try {
  const biz = d.store.one(
    "SELECT * FROM research_items WHERE url LIKE 'https://bizcode.pl/%' AND analysis IS NOT NULL ORDER BY updated_at DESC LIMIT 1",
  );
  if (biz) {
    const sources = d.service
      .sourcesFor(biz)
      .filter(
        (s, i, all) =>
          s.status === 'READ' &&
          !all
            .slice(0, i)
            .some((p) => p.final_url === s.final_url && p.content_hash === s.content_hash),
      );
    budget.event('CORRECTION', 'SAVED_SOURCE_REEXTRACTION', {
      identity: 'bizcode.pl',
      source_ids: sources.map((s) => s.id),
      code_id: codeId,
    });
    const imported = d.service.importSavedSources(
      biz.url,
      sources.map((s) => s.id),
    );
    if (imported.queued) {
      await d.service.tick();
      capture();
      const run = d.store.one('SELECT * FROM runs WHERE id=?', imported.runId)!;
      if (run.error) throw new DomainError(run.error, 'Correction stopped.');
    }
  }
  for (const domain of ['oke.pl', 'tukano.com.pl']) {
    const draft = d.service
      .draftRows()
      .find((row) =>
        d.service
          .sourcesForDraft(row)
          .some((s) => new URL(s.original_url).hostname.replace(/^www\./, '') === domain),
      );
    if (!draft) continue;
    budget.assertModel();
    budget.event('CORRECTION', 'NEW_VERSION', {
      identity: domain,
      draft_id: draft.id,
      previous_version: draft.version,
      code_id: codeId,
    });
    const runId = d.service.regenerateDraft(draft.id, draft.version).runId;
    await d.service.tick();
    capture();
    const run = d.store.one('SELECT * FROM runs WHERE id=?', runId)!;
    if (run.error) throw new DomainError(run.error, 'Correction stopped.');
  }
  const capacityCalls = d.store
    .all("SELECT * FROM model_calls WHERE stage='SEMANTIC_REVIEW' AND status='ERROR'")
    .filter((c) => /at capacity/i.test(c.diagnostic ?? ''));
  for (const call of capacityCalls) {
    const item = d.store.one('SELECT * FROM research_items WHERE run_id=?', call.run_id);
    const draft = d.service.draftRows().find((row) => row.opportunity_id === item?.opportunity_id);
    if (!draft) continue;
    const material = d.store.one(
      'SELECT * FROM research_draft_materials WHERE draft_id=? AND version=?',
      draft.id,
      draft.version,
    );
    if (material?.code_status !== 'PASS' || material.review_status !== 'ERROR') continue;
    budget.assertModel();
    recordChecks('BEFORE_CAPACITY_REVIEW_REPLAY');
    budget.event('REPLAY', 'REVIEW_ONLY_AFTER_PROVIDER_CAPACITY', {
      draft_id: draft.id,
      version: draft.version,
      payload_hash: draft.payload_hash,
      original_call_id: call.id,
      code_id: codeId,
    });
    await d.service.retryDraftReview(draft.id, draft.version);
    capture();
    recordChecks('AFTER_CAPACITY_REVIEW_REPLAY');
  }
} catch (e) {
  stopReason = e instanceof DomainError ? e.code : 'CORRECTION_ERROR';
  budget.event('CORRECTION', 'ERROR', {
    code: stopReason,
    reason: cleanDiagnostic(e instanceof Error ? e.message : 'unknown'),
  });
} finally {
  d.service.control('stop');
  await d.service.stopWorker();
  capture();
  recordChecks('FINAL_CONTROL_CORRECTION');
  d.store.close();
  budget.state.endedAt = new Date().toISOString();
  budget.state.stopReason = stopReason;
  budget.save();
  budget.event('SESSION', 'PARTIAL', { stop_reason: stopReason, code_id: codeId, real_sends: 0 });
  writeFileSync(
    join(dir, 'result.json'),
    JSON.stringify(
      {
        outcome: 'PARTIAL',
        stopReason,
        budget: budget.state,
        code,
        codeId,
        limits: budget.limits,
        round: true,
      },
      null,
      2,
    ),
  );
  unlinkSync(lock);
  console.log(JSON.stringify({ stopReason, budget: budget.state }));
}
