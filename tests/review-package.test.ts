import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { exportReviewPackage, validateReviewPackage } from '../apps/server/src/review/export.js';
import { reviewRedactor } from '../apps/server/src/review/redaction.js';
import { makePreParserFixture } from './schema-fixture.js';
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
async function fixture(t: any, legacy = false, nativeContexts = false) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-review-package-')),
    store = new Store(join(dir, 'data'));
  const reader = new FixtureReader(),
    runner = new FixtureRunner();
  reader.prospect = runner.prospect = true;
  const service = new ResearchJobHunter(store, { reader, runner });
  t.after(async () => {
    await service.stopWorker();
    store.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const draft = service.draftRows()[0];
  assert.ok(draft);
  service.editDraft(draft.id, {
    version: draft.version,
    subject: draft.subject,
    body: draft.body + '\nPreserved substantive sentence.',
  });
  store.exec('UPDATE candidate_profiles SET name=?', 'Sentinel Person');
  store.exec('UPDATE candidate_facts SET source=?', 'PRIVATE_COLUMN_SENTINEL');
  const fact = store.one('SELECT id FROM candidate_facts')!;
  store.exec(
    'UPDATE research_draft_materials SET context_json=?,review_result=?',
    JSON.stringify({
      profile: {
        name: 'Priorname Privatesurname',
        goal: 'Remote software work',
        hash: 'a'.repeat(64),
        facts: [
          { id: fact.id, key: 'education', content: 'Historical approved wording stays complete.' },
          { id: 'missing-old-fact', key: 'availability', content: 'About 20 hours after school.' },
        ],
        unexpected: { secret: 'NESTED_PRIVATE_SENTINEL' },
      },
      prompt: 'FORBIDDEN_RAW_PROMPT',
    }),
    JSON.stringify({
      supported: false,
      issues: [{ private: 'ARRAY_PRIVATE_SENTINEL' }],
      unknown: 'REVIEW_PRIVATE_SENTINEL',
    }),
  );
  store.exec(
    'UPDATE draft_versions SET body=? WHERE draft_id=? AND version=?',
    'Priorname Privatesurname\nSubstantive content before private@email.invalid and +48 123 456 789.\nPreserved line after private identity.',
    draft.id,
    draft.version,
  );
  store.set('autoPolicy', {
    senderEmail: 'private@email.invalid',
    cvId: 'missing-cv',
    confirmed: true,
    sessionLimit: null,
    dailyLimit: 5,
    sendIntervalSeconds: 120,
    researchIntervalSeconds: 900,
    contactKinds: ['GENERAL'],
    contactTypes: ['PROSPECT'],
    searchScope: 'Software employers in Poland',
    unexpected: { secret: 'POLICY_PRIVATE_SENTINEL' },
  });
  store.set('FORBIDDEN_SECRET_KEY', 'APP_STATE_PRIVATE_SENTINEL');
  store.db.exec('CREATE TABLE private_secrets(value TEXT)');
  store.exec('INSERT INTO private_secrets VALUES(?)', 'PRIVATE_TABLE_SENTINEL');
  if (nativeContexts) {
    store.exec(
      "UPDATE research_sources SET address_contexts=?,completeness='CONTEXT_LIMIT',status='INCOMPLETE'",
      JSON.stringify([
        {
          email: 'first@fixture.example.test',
          text: 'Faktury i rozliczenia\nFirst address.',
          complete: false,
          private: { secret: 'CONTEXT_PRIVATE_SENTINEL' },
        },
        {
          email: 'second@fixture.example.test',
          text: 'Faktury i rozliczenia\nSecond address.',
          complete: true,
        },
      ]),
    );
    store.exec(
      'UPDATE research_sources SET outbound_links=?',
      JSON.stringify([
        {
          url: '../careers?private=LINK_URL_PRIVATE_SENTINEL#secret',
          context: 'Rekrutacja. Wykonanie strony. Full saved link context.',
          private: { secret: 'LINK_PRIVATE_SENTINEL' },
        },
      ]),
    );
  }
  if (legacy) {
    makePreParserFixture(store);
    store.exec('DELETE FROM migrations WHERE CAST(substr(name,1,3) AS INTEGER)>20');
  }
  const snapshot = store.backup(),
    hash = sha(readFileSync(snapshot)),
    proof = join(dir, 'proof.json');
  writeFileSync(
    proof,
    JSON.stringify({
      schema: 1,
      kind: 'USER_DESIGNATED_RECORDED_BACKUP',
      sha256: hash,
      snapshotAt: '2026-10-17T06:30:00.000Z',
      auditAt: null,
      recordedIntegrity: 'ok',
      recordedForeignKeyErrors: 0,
      recordedTableCount: 52,
      creationMethod: 'UNKNOWN',
    }),
  );
  return { dir, store, service, snapshot, hash, proof, draft, output: join(dir, 'public') };
}
const allText = (dir: string) =>
  readdirSync(dir)
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
test('review export preserves every draft/version and historical facts with explicit missing references, without reading private tables/columns', async (t) => {
  const f = await fixture(t),
    queries: string[] = [];
  const result = exportReviewPackage({
    snapshot: f.snapshot,
    provenance: f.proof,
    output: f.output,
    observeSql: (s) => queries.push(s),
  });
  assert.equal(result.counts.drafts.input, result.counts.drafts.output);
  assert.equal(result.counts.draft_versions.input, 2);
  assert.equal(result.counts.draft_versions.output, 2);
  assert.ok(result.historicalProfileFacts >= 2);
  assert.ok(result.explicitMissingReferences >= 2);
  assert.equal(sha(readFileSync(f.snapshot)), f.hash);
  assert.equal(validateReviewPackage(f.output).valid, true);
  const output = allText(f.output);
  for (const sentinel of [
    'Sentinel Person',
    'Priorname Privatesurname',
    'private@email.invalid',
    '123 456 789',
    'PRIVATE_COLUMN_SENTINEL',
    'NESTED_PRIVATE_SENTINEL',
    'FORBIDDEN_RAW_PROMPT',
    'ARRAY_PRIVATE_SENTINEL',
    'REVIEW_PRIVATE_SENTINEL',
    'POLICY_PRIVATE_SENTINEL',
    'APP_STATE_PRIVATE_SENTINEL',
    'PRIVATE_TABLE_SENTINEL',
    'missing-old-fact',
  ])
    assert.ok(!output.includes(sentinel), sentinel);
  assert.ok(output.includes('Substantive content before'));
  assert.ok(output.includes('Preserved line after private identity.'));
  assert.ok(output.includes('Historical approved wording stays complete.'));
  assert.ok(output.includes('NOT_RECORDED'));
  const evidence = readFileSync(join(f.output, 'evidence.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.ok(evidence.length > 0);
  assert.ok(evidence.every((row) => row.availability === 'READ_VERIFIED_EXCERPT'));
  for (const sql of queries) {
    assert.ok(!/SELECT\s+\*/i.test(sql));
    assert.ok(
      !/FROM (?:private_secrets|mail_messages|model_calls|gmail_previews|gmail_preview_items)\b/i.test(
        sql,
      ),
    );
    assert.ok(!/\b(?:mime|account_email|account_subject|provider_id|message_id)\b/i.test(sql));
  }
  const versions = readFileSync(join(f.output, 'draft-versions.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((s) => JSON.parse(s));
  assert.equal(versions.filter((v) => v.reviewMetadata.currentVersion).length, 1);
  assert.ok(versions.every((v) => v.reviewMetadata.originalBodySha256 !== null));
  const policy = JSON.parse(readFileSync(join(f.output, 'policy-summary.json'), 'utf8'));
  assert.equal(policy.recordedApproval, true);
  assert.equal(policy.sessionLimit, null);
  assert.equal(policy.dailyLimit, 5);
  assert.equal(policy.sendIntervalSeconds, 120);
  assert.equal(policy.futureNightSequenceApproval, 'NOT_RECORDED');
  assert.throws(
    () => exportReviewPackage({ snapshot: f.snapshot, provenance: f.proof, output: f.output }),
    { code: 'OUTPUT_EXISTS' },
  );
});
test('native parser context/link arrays retain labels, completeness and authority context through a strict projection', async (t) => {
  const f = await fixture(t, false, true);
  exportReviewPackage({ snapshot: f.snapshot, provenance: f.proof, output: f.output });
  const sources = readFileSync(join(f.output, 'sources-001.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.ok(sources.length > 0);
  for (const source of sources) {
    assert.equal(source.completeness, 'CONTEXT_LIMIT');
    assert.equal(source.status, 'INCOMPLETE');
    assert.equal(source.address_contexts.length, 2);
    assert.deepEqual(
      source.address_contexts.map((c: any) => c.contexts),
      [['Faktury i rozliczenia\nFirst address.'], ['Faktury i rozliczenia\nSecond address.']],
    );
    assert.deepEqual(
      source.address_contexts.map((c: any) => c.complete),
      [false, true],
    );
    assert.deepEqual(source.outbound_links, [
      { url: '../careers', context: 'Rekrutacja. Wykonanie strony. Full saved link context.' },
    ]);
  }
  assert.ok(!allText(f.output).includes('CONTEXT_PRIVATE_SENTINEL'));
  assert.ok(!allText(f.output).includes('LINK_PRIVATE_SENTINEL'));
  assert.ok(!allText(f.output).includes('LINK_URL_PRIVATE_SENTINEL'));
  assert.equal(validateReviewPackage(f.output).valid, true);
});
test('schema 20 adapter never migrates or invents completeness, approval or missing batch tables', async (t) => {
  const f = await fixture(t, true);
  const result = exportReviewPackage({
    snapshot: f.snapshot,
    provenance: f.proof,
    output: f.output,
  });
  assert.equal(result.schemaVersion, 20);
  assert.equal(sha(readFileSync(f.snapshot)), f.hash);
  const text = allText(f.output);
  assert.ok(text.includes('LEGACY_UNKNOWN'));
  assert.ok(text.includes('NOT_RECORDED'));
  assert.ok(!text.includes('"productionReadiness":"READY"'));
});
for (const variant of ['hash', 'wal', 'provenance', 'invalidDatabase'])
  test(
    'review exporter rejects ' + variant + ' without publication or leaked errors',
    async (t) => {
      const f = await fixture(t);
      if (variant === 'hash') writeFileSync(f.snapshot, 'corrupted snapshot');
      if (variant === 'wal') writeFileSync(f.snapshot + '-wal', 'uncheckpointed data');
      if (variant === 'provenance')
        writeFileSync(f.proof, JSON.stringify({ secret: 'PROVENANCE_PRIVATE_SENTINEL' }));
      if (variant === 'invalidDatabase') {
        writeFileSync(f.snapshot, 'not sqlite');
        const p = JSON.parse(readFileSync(f.proof, 'utf8'));
        p.sha256 = sha(readFileSync(f.snapshot));
        writeFileSync(f.proof, JSON.stringify(p));
      }
      const command = spawnSync(
        process.execPath,
        [
          '--import',
          'tsx',
          'scripts/export-review-package.ts',
          '--snapshot',
          f.snapshot,
          '--provenance',
          f.proof,
          '--output',
          f.output,
        ],
        { encoding: 'utf8', windowsHide: true, timeout: 30000 },
      );
      assert.equal(command.status, 1);
      assert.equal(command.stdout, '');
      const error = JSON.parse(command.stderr);
      assert.deepEqual(Object.keys(error), ['code']);
      assert.ok(!command.stderr.includes(f.snapshot));
      assert.ok(!command.stderr.includes('PROVENANCE_PRIVATE_SENTINEL'));
      assert.equal(existsSync(f.output), false);
    },
  );
test('redaction preserves paragraphs and substantive text, strips nested URL credentials, identities and secret patterns', () => {
  const redact = reviewRedactor(['Sentinel Person'], new Set(['hr@company.test']));
  const input =
    'Sentinel Person\nValid first paragraph.\nPath C:\\private\\file then substantive text.\nContact hr@company.test and private@secret.invalid. https://site.test/jobs?id=PRIVATE_URL_SENTINEL#secret\nFinal paragraph. api_key=PRIVATE_SECRET_SENTINEL';
  const result = redact.text(input)!;
  assert.ok(result.includes('Valid first paragraph.'));
  assert.ok(result.includes('then substantive text.'));
  assert.ok(result.includes('Final paragraph.'));
  assert.ok(result.includes('hr@company.test'));
  for (const v of [
    'Sentinel Person',
    'C:\\private',
    'private@secret.invalid',
    'PRIVATE_URL_SENTINEL',
    'PRIVATE_SECRET_SENTINEL',
  ])
    assert.ok(!result.includes(v));
  assert.equal(result.split('\n').length, input.split('\n').length);
});

test('public HTTP/HTTPS links and ordinary website /home paths survive local-path redaction', () => {
  const redact = reviewRedactor([], new Set());
  const result = redact.text(
    'Source https://company.test/home/jobs?q=private#track and http://other.test/careers. Path C:\\private\\file then preserved text.',
  )!;
  assert.ok(result.includes('https://company.test/home/jobs'));
  assert.ok(result.includes('http://other.test/careers.'));
  assert.ok(!result.includes('q=private'));
  assert.ok(!result.includes('C:\\private'));
  assert.ok(result.includes('then preserved text.'));
});
test('package validator rejects nested unknown fields and hash/count tampering', async (t) => {
  const f = await fixture(t);
  exportReviewPackage({ snapshot: f.snapshot, provenance: f.proof, output: f.output });
  const manifest = JSON.parse(readFileSync(join(f.output, 'manifest.json'), 'utf8'));
  manifest.propertiesObserved.private = 'METADATA_PRIVATE_SENTINEL';
  writeFileSync(join(f.output, 'manifest.json'), JSON.stringify(manifest));
  assert.throws(() => validateReviewPackage(f.output), { code: 'PACKAGE_INVALID' });
  delete manifest.propertiesObserved.private;
  writeFileSync(join(f.output, 'manifest.json'), JSON.stringify(manifest));
  writeFileSync(join(f.output, 'drafts.jsonl'), 'tampered');
  assert.throws(() => validateReviewPackage(f.output), { code: 'PACKAGE_HASH_MISMATCH' });
});
