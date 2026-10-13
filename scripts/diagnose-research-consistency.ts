import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { reopenPublicDiagnostic } from '../apps/server/src/research/diagnostic.js';
import { FixtureRunner } from '../tests/research-fixture.js';
import { hash } from '../apps/server/src/util.js';
import { contactEligibility, resolveInquiryBasis } from '../apps/server/src/research/contracts.js';

const original = resolve(process.argv[2] ?? ''),
  output = resolve(process.argv[3] ?? '');
if (
  !process.argv[2] ||
  !process.argv[3] ||
  existsSync(join(original, 'run.lock')) ||
  output.startsWith(resolve('.') + '/')
)
  throw new Error('EXPLICIT_STOPPED_DIAGNOSTIC_AND_EXTERNAL_OUTPUT_REQUIRED');
mkdirSync(output, { recursive: true });
const data = readFileSync(join(original, 'database-path.txt'), 'utf8').trim(),
  file = join(data, 'jobhunter.sqlite');
const beforeHash = hash(readFileSync(file));
const db = new Database(file, { readonly: true, fileMustExist: true });
const all = (sql: string, ...p: any[]) => db.prepare(sql).all(...p) as any[];
const one = (sql: string, ...p: any[]) => db.prepare(sql).get(...p) as any;
if (
  JSON.parse(one("SELECT value FROM app_state WHERE key='diagnosticOnly'")?.value ?? 'false') !==
  true
)
  throw new Error('DIAGNOSTIC_ONLY_REQUIRED');
const facts = all('SELECT * FROM candidate_facts ORDER BY created_at,id'),
  profile = one("SELECT * FROM candidate_profiles WHERE id='candidate'");
const events = readFileSync(join(original, 'events.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .map((s) => JSON.parse(s));
const cases: any[] = [];
for (const domain of ['gotoma.pl', 'prodaut.pl']) {
  const items = all(
    'SELECT * FROM research_items WHERE url LIKE ? ORDER BY created_at,rowid',
    '%' + domain + '%',
  );
  const analyses = items.map((i) => ({
    itemId: i.id,
    runId: i.run_id,
    url: i.url,
    companyId: i.company_id,
    opportunityId: i.opportunity_id,
    sourceIds: JSON.parse(i.source_ids),
    analysis: JSON.parse(i.analysis),
  }));
  const sources = all(
    'SELECT * FROM research_sources WHERE id IN (SELECT value FROM json_each(?))',
    JSON.stringify([...new Set(analyses.flatMap((i) => i.sourceIds))]),
  );
  const last = analyses.at(-1),
    cid = last!.companyId;
  const current = one('SELECT * FROM drafts WHERE company_id=?', cid),
    rd = current && one('SELECT * FROM research_drafts WHERE draft_id=?', current.id),
    material =
      current &&
      one(
        'SELECT * FROM research_draft_materials WHERE draft_id=? AND version=?',
        current.id,
        current.version,
      );
  const selection = resolveInquiryBasis(last!.analysis, sources);
  const basisRecord = {
    ...selection,
    evidenceIds: selection
      ? all(
          'SELECT evidence_id FROM research_evidence WHERE source_id=?',
          selection.sourceVersion.id,
        ).map((e) => e.evidence_id)
      : [],
  };
  const entry: any = {
    domain,
    kind: 'ORIGINAL_SAVED_VALIDATED_ANALYSES',
    rawCliPayloadAvailable: false,
    originalHtmlAvailable: false,
    analyses,
    sources: sources.map(({ text, fragment, address_contexts, ...s }) => ({
      ...s,
      textHash: hash(text),
      contextsHash: hash(address_contexts ?? ''),
    })),
    selectedCurrentBasis: basisRecord,
    currentDecision: contactEligibility(last!.analysis, sources),
    draft: current
      ? {
          id: current.id,
          version: current.version,
          subject: current.subject,
          body: current.body,
          originalTextHash: hash(current.subject + '\n' + current.body),
          oldReview: JSON.parse(rd.semantic_review),
          contextHash: material.context_hash,
        }
      : null,
  };
  if (current && analyses.length === 2) {
    const srcView = (ids: string[]) =>
      ids.map((id) => {
        const s = sources.find((s) => s.id === id)!;
        return {
          id: s.id,
          hash: s.content_hash,
          url: s.final_url,
          method: s.method,
          parser: s.parser_version,
          text: hash(s.text),
          contexts: hash(s.address_contexts ?? ''),
        };
      });
    const contact = one(
      'SELECT email,kind,evidence_id,verification_status,literal_verified FROM contacts WHERE id=?',
      current.contact_id,
    );
    const binding = (a: any, ids: string[]) => ({
      version: current.version,
      payload: current.payload_hash,
      subject: current.subject,
      body: current.body,
      facts: current.fact_ids,
      evidence: current.evidence_ids,
      claims: rd.claims,
      profileHash: profile.profile_hash,
      approved: profile.approved_at,
      factsHash: hash(JSON.stringify(facts)),
      contact,
      qualification: { details: JSON.stringify(a) },
      sources: srcView(ids),
    });
    const old = binding(analyses[0].analysis, analyses[0].sourceIds),
      now = binding(last!.analysis, last!.sourceIds);
    const differences = (a: any, b: any, path = ''): any[] =>
      JSON.stringify(a) === JSON.stringify(b)
        ? []
        : a &&
            b &&
            typeof a === 'object' &&
            typeof b === 'object' &&
            !Array.isArray(a) &&
            !Array.isArray(b)
          ? [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((k) =>
              differences(a[k], b[k], path ? path + '.' + k : k),
            )
          : [{ path, before: a, after: b }];
    entry.binding = {
      reconstructedOld: hash(JSON.stringify(old)),
      savedOld: material.context_hash,
      oldHashExactlyReconstructed: hash(JSON.stringify(old)) === material.context_hash,
      current: hash(JSON.stringify(now)),
      changedFields: Object.keys(old).filter(
        (k) => JSON.stringify((old as any)[k]) !== JSON.stringify((now as any)[k]),
      ),
      analysisDifferences: differences(analyses[0].analysis, last!.analysis),
      sameSourceSet:
        analyses[0].sourceIds.slice().sort().join() === last!.sourceIds.slice().sort().join(),
      sourceOrderChanged: analyses[0].sourceIds.join() !== last!.sourceIds.join(),
      allSourceVersionsReused: true,
    };
    entry.rediscovery = events
      .filter(
        (e) => e.outcome === 'LEADS_SAVED' && e.candidates.some((c: any) => c.url.includes(domain)),
      )
      .map((e) => ({
        at: e.timestamp,
        candidate: e.candidates.find((c: any) => c.url.includes(domain)),
      }));
  }
  cases.push(entry);
}
const copy = mkdtempSync(join(tmpdir(), 'jh-consistency-replay-'));
await db.backup(join(copy, 'jobhunter.sqlite'));
db.close();
const runner = new FixtureRunner();
const d = reopenPublicDiagnostic(copy, runner, {
  read: async () => {
    throw new Error('HTTP_DISABLED_IN_OFFLINE_REPLAY');
  },
});
const snapshot = () =>
  d.service
    .draftRows()
    .map((row) => ({
      id: row.id,
      company: row.canonical_name,
      version: row.version,
      textHash: hash(row.subject + '\n' + row.body),
      supported: JSON.parse(row.semantic_review).supported,
      issues: d.service.draftMaterialIssues(row),
    }));
const before = snapshot();
for (const entry of cases) {
  const a = entry.analyses.at(-1);
  d.service.importSavedSources(a.url, a.sourceIds);
  await d.service.tick();
  entry.afterReplay = snapshot().filter((r) =>
    r.company.includes(entry.domain === 'gotoma.pl' ? 'GOTOMA' : 'PRODAUT'),
  );
}
const after = snapshot();
d.service.control('stop');
await d.service.stopWorker();
d.store.close();
const restarted = reopenPublicDiagnostic(copy, runner, {
  read: async () => {
    throw new Error('HTTP_DISABLED');
  },
});
const restart = () =>
  restarted.service
    .draftRows()
    .map((row) => ({
      id: row.id,
      version: row.version,
      textHash: hash(row.subject + '\n' + row.body),
      issues: restarted.service.draftMaterialIssues(row),
    }));
const restartRows = restart(),
  state = restarted.service.state();
restarted.store.close();
if (hash(readFileSync(file)) !== beforeHash) throw new Error('ORIGINAL_DIAGNOSTIC_CHANGED');
const result = {
  kind: 'OFFLINE_REPLAY_WITH_EXPLICIT_FIXTURE_REVIEWER',
  originalSessionId: JSON.parse(readFileSync(join(original, 'result.json'), 'utf8')).budget
    .sessionId,
  originalDatabaseUnchanged: true,
  originalDatabaseHash: beforeHash,
  realHttp: 0,
  realModelCalls: 0,
  fixtureCalls: runner.prompts.length,
  fixtureDraftCalls: runner.prompts.filter((p) => p.includes('Przygotuj indywidualny')).length,
  fixtureReviewCalls: runner.prompts.filter((p) => p.includes('Sprawdź KAŻDE')).length,
  checkedOriginalSeven: before.filter((r) => r.issues.length === 0).length,
  before,
  after,
  restartRows,
  restartState: state,
  cases,
};
writeFileSync(join(output, 'diagnosis-replay.json'), JSON.stringify(result, null, 2) + '\n');
writeFileSync(join(output, 'replay-database-path.txt'), copy);
console.log(
  JSON.stringify({
    originalUnchanged: true,
    exactBindingReconstruction: cases[0].binding?.oldHashExactlyReconstructed,
    fields: cases[0].binding?.changedFields,
    beforeCurrent: before.filter((r) => !r.issues.length).length,
    afterCurrent: after.filter((r) => !r.issues.length).length,
    fixtureCalls: runner.prompts.length,
    copy,
  }),
);
