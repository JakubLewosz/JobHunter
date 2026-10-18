import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  symlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import { Store } from '../apps/server/src/db.js';
import { JobHunter } from '../apps/server/src/service.js';
import { auditLibrary, libraryAuditSchema } from '../apps/server/src/research/library-audit.js';
import {
  reopenPublicDiagnostic,
  createPublicDiagnostic,
} from '../apps/server/src/research/diagnostic.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { FixtureGmail } from './gmail-fixture.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { assertOutsideRepository, pathContains } from '../apps/server/src/safe-paths.js';
import { hash } from '../apps/server/src/util.js';
function fixture(t: any) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-auditor-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
test('snapshot auditor: standalone WAL-aware backup, strict numeric report and no sentinel values', (t) => {
  const dir = fixture(t),
    store = new Store(join(dir, 'source')),
    service = new JobHunter(store);
  const sentinels = [
    'SENTINEL_PRIVATE_NAME',
    'sentinel@example.test',
    'b760fab1-7031-42b0-8fdb-a77a21231500',
    'C:\\private\\SENTINEL',
    'SENTINEL_MESSAGE',
  ];
  service.findOrCreateCompany(sentinels[0], 'sentinel.example.test');
  for (const value of sentinels) store.set(value, value);
  const path = store.backup(),
    proof = path + '.provenance.json',
    digest = hash(readFileSync(path));
  store.close();
  const output = join(dir, 'report.json'),
    report = auditLibrary({ snapshot: path, provenance: proof, output });
  assert.equal(report.scope, 'SNAPSHOT_ONLY');
  assert.equal(report.production_readiness, 'NOT_ESTABLISHED');
  assert.equal(report.historicalDeletionCheck, false);
  assert.equal(report.counts.companies > 0, true);
  assert.equal(report.integrity, true);
  assert.equal(report.foreignKeys, true);
  for (const sentinel of sentinels)
    assert.equal(readFileSync(output, 'utf8').includes(sentinel), false);
  assert.equal(hash(readFileSync(path)), digest);
  assert.throws(() => auditLibrary({ snapshot: path, provenance: proof, output }), {
    code: 'OUTPUT_EXISTS',
  });
  assert.throws(() => auditLibrary({ snapshot: path, provenance: proof, output: path }), {
    code: 'OUTPUT_CONFLICT',
  });
  for (const array of [[], ['sentinel@example.test']])
    assert.equal(
      libraryAuditSchema.safeParse({ ...report, counts: { ...report.counts, companies: array } })
        .success,
      false,
    );
  assert.equal(libraryAuditSchema.safeParse({ ...report, extra: sentinels }).success, false);
});
test('snapshot auditor: before/after deletions, provenance/hash/WAL rejection and unsupported schema', (t) => {
  const dir = fixture(t),
    store = new Store(join(dir, 'source')),
    service = new JobHunter(store);
  const before = store.backup();
  const c = service.findOrCreateCompany('Synthetic transient', 'transient.example.test').company;
  const middle = store.backup();
  store.exec('DELETE FROM company_aliases WHERE company_id=?', c.id);
  store.exec('DELETE FROM companies WHERE id=?', c.id);
  const after = store.backup();
  store.close();
  const report = auditLibrary({
    snapshot: after,
    provenance: after + '.provenance.json',
    before: middle,
    beforeProvenance: middle + '.provenance.json',
  });
  assert.equal(report.historicalDeletionCheck, true);
  assert.ok(report.counts.removedRecords > 0);
  assert.throws(() => auditLibrary({ snapshot: after, provenance: middle + '.provenance.json' }), {
    code: 'SNAPSHOT_HASH_MISMATCH',
  });
  writeFileSync(after + '-wal', 'synthetic');
  assert.throws(() => auditLibrary({ snapshot: after, provenance: after + '.provenance.json' }), {
    code: 'SNAPSHOT_NOT_STANDALONE',
  });
  const old = join(dir, 'old.sqlite'),
    db = new Database(old);
  db.exec('CREATE TABLE arbitrary(x TEXT)');
  db.close();
  writeFileSync(
    old + '.json',
    JSON.stringify({
      schema: 1,
      method: 'VACUUM_INTO',
      createdAt: new Date().toISOString(),
      sha256: hash(readFileSync(old)),
      standalone: true,
    }),
  );
  const unsupported = auditLibrary({ snapshot: old, provenance: old + '.json' });
  assert.equal(unsupported.supported, false);
  assert.ok(unsupported.limitations.includes('UNSUPPORTED_SCHEMA'));
});
test('diagnostic preflight rejects unmarked database without migration, backup or journal change', (t) => {
  const dir = fixture(t),
    dbpath = join(dir, 'jobhunter.sqlite'),
    db = new Database(dbpath);
  db.exec(
    "CREATE TABLE app_state(key TEXT PRIMARY KEY,value TEXT);INSERT INTO app_state VALUES ('diagnosticOnly','false')",
  );
  db.close();
  const before = hash(readFileSync(dbpath)),
    files = readdirSync(dir);
  assert.throws(
    () => reopenPublicDiagnostic(dir, new FixtureRunner(), new FixtureReader()),
    /DIAGNOSTIC_ONLY_REQUIRED/,
  );
  assert.equal(hash(readFileSync(dbpath)), before);
  assert.deepEqual(readdirSync(dir), files);
});
test('safe paths: repository, descendants, Windows/POSIX boundaries and junction parent', (t) => {
  assert.equal(pathContains('C:\\Repo', 'c:\\repo\\new'), true);
  assert.equal(pathContains('C:\\Repo', 'C:\\Repository'), false);
  assert.equal(pathContains('/repo', '/repo/new'), true);
  assert.equal(pathContains('/repo', '/repo-other'), false);
  assert.throws(() => assertOutsideRepository(process.cwd()), {
    code: 'OUTSIDE_REPOSITORY_REQUIRED',
  });
  assert.throws(() => assertOutsideRepository(join(process.cwd(), 'new', 'child')), {
    code: 'OUTSIDE_REPOSITORY_REQUIRED',
  });
  const dir = fixture(t),
    link = join(dir, 'junction');
  symlinkSync(process.cwd(), link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => assertOutsideRepository(join(link, 'not-created')), {
    code: 'OUTSIDE_REPOSITORY_REQUIRED',
  });
  assert.throws(
    () =>
      createPublicDiagnostic(join(process.cwd(), 'forbidden-diagnostic-child'), {
        reader: new FixtureReader(),
        runner: new FixtureRunner(),
      }),
    { code: 'OUTSIDE_REPOSITORY_REQUIRED' },
  );
});
test('snapshot auditor shares the actual material binding and literal/publication rules; future schema is explicit limitation', async (t) => {
  const root = fixture(t),
    store = new Store(join(root, 'data')),
    service = new ResearchJobHunter(store, {
      reader: new FixtureReader(),
      runner: new FixtureRunner(),
    });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  service.control('stop');
  const valid = store.backup();
  let report = auditLibrary({ snapshot: valid, provenance: valid + '.provenance.json' });
  assert.equal(report.counts.materialMismatches, 0);
  assert.equal(report.counts.missingLiteral, 0);
  assert.equal(report.counts.missingProvenance, 0);
  store.exec('UPDATE contacts SET literal_verified=0');
  store.exec("UPDATE drafts SET payload_hash='synthetic-change'");
  const changed = store.backup();
  report = auditLibrary({ snapshot: changed, provenance: changed + '.provenance.json' });
  assert.equal(report.counts.materialMismatches, 1);
  assert.equal(report.counts.missingLiteral, 1);
  store.exec("INSERT INTO migrations VALUES ('026_unknown.sql',?)", service.now());
  const future = store.backup();
  store.close();
  report = auditLibrary({ snapshot: future, provenance: future + '.provenance.json' });
  assert.equal(report.supported, false);
  assert.equal(report.schemaVersion, 26);
});
test('snapshot audit detects a packet without its atomic reservation and uses the shared protected comparison', async (t) => {
  const root = fixture(t),
    store = new Store(join(root, 'data')),
    gateway = new FixtureGmail(),
    service = new GmailJobHunter(store, {
      gateway,
      accountInfo: () => gateway.info,
      reader: new FixtureReader(),
      runner: new FixtureRunner(),
    });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const d = service.draftRows()[0],
    cv = service.uploadCV(
      'Synthetic.pdf',
      Buffer.from('%PDF-1.4\nfixture\n%%EOF').toString('base64'),
    );
  service.approveCV(cv.id);
  service.reviewDraft(d.id, d.version);
  const p = await service.prepareDelivery({
    drafts: [{ id: d.id, version: d.version }],
    cvId: cv.id,
    kind: 'SELF_TEST',
  });
  await service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  const before = store.backup();
  store.exec("UPDATE outbox SET status='SENDING'");
  const after = store.backup();
  await service.browserDelivery.close();
  store.close();
  const report = auditLibrary({
    snapshot: after,
    provenance: after + '.provenance.json',
    before,
    beforeProvenance: before + '.provenance.json',
  });
  assert.equal(report.counts.reservationMismatches, 1);
  assert.ok(report.counts.protectedDifferences > 0);
});
