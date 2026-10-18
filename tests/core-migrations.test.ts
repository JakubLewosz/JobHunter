import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { execFileSync } from 'node:child_process';
import { Store } from '../apps/server/src/db.js';
import { restoreBackupCopy } from '../apps/server/src/backup.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { pathToFileURL } from 'node:url';
import { FixtureGmail } from './gmail-fixture.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { analyzeLibrarySnapshot } from '../apps/server/src/research/library-audit.js';
const newTables = [
  'auto_batch_plan_grants',
  'nightflow_jobs',
  'nightflow_plans',
  'auto_batch_outbox',
  'auto_batch_sessions',
  'auto_batch_items',
  'auto_batches',
  'company_domain_enrichments',
  'research_work_items',
  'research_stage_timings',
];
test('core migrations 021–025 preserve populated schema20 IDs, history, source bytes, MIME, versions and quota; WAL backup restores stopped', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-core-migrations-')),
    dir = join(root, 'source');
  let store = new Store(dir);
  t.after(() => {
    if (store.db.open) store.close();
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  const gateway = new FixtureGmail(),
    service = new GmailJobHunter(store, {
      gateway,
      accountInfo: () => gateway.info,
      reader: new FixtureReader(),
      runner: new FixtureRunner(),
    });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const draft = service.draftRows()[0],
    cv = service.uploadCV(
      'Synthetic.pdf',
      Buffer.from('%PDF-1.4\nfixture\n%%EOF').toString('base64'),
    );
  service.approveCV(cv.id);
  service.reviewDraft(draft.id, draft.version);
  const p = await service.prepareDelivery({
    drafts: [{ id: draft.id, version: draft.version }],
    cvId: cv.id,
    kind: 'SELF_TEST',
  });
  await service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  gateway.timeout = true;
  await service.dispatchOne();
  store.exec("UPDATE outbox SET status='SENDING'");
  store.exec("UPDATE send_attempts SET state='SENDING'");
  store.set('researchDay', {
    active: true,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  });
  await service.browserDelivery.close();
  store.db.pragma('foreign_keys=OFF');
  store.atomic(() => {
    for (const table of newTables) store.db.exec('DROP TABLE ' + table);
    const sql = readFileSync('migrations/003_research.sql', 'utf8')
      .match(/CREATE TABLE research_sources \([\s\S]*?\);/)![0]
      .replace('research_sources', 'research_sources_old');
    store.db.exec(sql);
    store.db.exec(
      'ALTER TABLE research_sources_old ADD COLUMN parser_version INTEGER NOT NULL DEFAULT 0;ALTER TABLE research_sources_old ADD COLUMN address_contexts TEXT',
    );
    store.db.exec(
      'INSERT INTO research_sources_old SELECT id,original_url,final_url,title,fetched_at,method,status,http_status,fragment,content_hash,text,error,parser_version,address_contexts FROM research_sources;DROP TABLE research_sources;ALTER TABLE research_sources_old RENAME TO research_sources',
    );
    store.exec("DELETE FROM migrations WHERE name>='021'");
  });
  store.db.pragma('foreign_keys=ON');
  const names = store
    .all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name<>'migrations'",
    )
    .map((r) => r.name);
  const before = Object.fromEntries(
    names.map((name) => [name, store.all('SELECT * FROM "' + name + '" ORDER BY rowid')]),
  );
  const legacyAudit = analyzeLibrarySnapshot(store.db);
  assert.equal(legacyAudit.supported, true);
  assert.equal(legacyAudit.schemaVersion, 20);
  assert.equal(legacyAudit.recordedMetadata.completeness, 'NOT_RECORDED');
  assert.equal(legacyAudit.recordedMetadata.outboundLinks, 'NOT_RECORDED');
  assert.equal(legacyAudit.recordedMetadata.historicalFactVersions, 'NOT_RECORDED');
  assert.ok(legacyAudit.counts.companies > 0);
  assert.equal(legacyAudit.counts.drafts, 1);
  assert.equal(legacyAudit.counts.attempts, 1);
  const oldSnapshot = store.backup();
  store.close();
  store = new Store(dir);
  const oldDb = new Database(oldSnapshot, { readonly: true });
  try {
    assert.equal(analyzeLibrarySnapshot(store.db, oldDb).counts.protectedDifferences, 0);
  } finally {
    oldDb.close();
  }
  for (const name of names) {
    const oldCols = Object.keys(before[name][0] ?? {});
    if (oldCols.length)
      assert.deepEqual(
        store.all(
          'SELECT ' +
            oldCols.map((c) => '"' + c + '"').join(',') +
            ' FROM "' +
            name +
            '" ORDER BY rowid',
        ),
        before[name],
      );
  }
  assert.equal(
    store.one('SELECT completeness FROM research_sources')!.completeness,
    'LEGACY_UNKNOWN',
  );
  store.db.pragma('wal_autocheckpoint=0');
  store.set('walProof', { value: 'synthetic newest WAL row' });
  const backup = store.backup(),
    copy = new Database(backup, { readonly: true, fileMustExist: true });
  assert.ok(copy.prepare("SELECT value FROM app_state WHERE key='walProof'").get());
  copy.close();
  const destination = join(root, 'restore');
  restoreBackupCopy(backup, destination);
  const restored = new Store(destination);
  try {
    assert.equal(restored.get('stopped', false), true);
    assert.equal(restored.get('gmailSenderPaused', false), true);
    assert.equal(restored.get<any>('researchDay', {}).active, false);
    assert.equal(restored.one('SELECT state FROM send_attempts')!.state, 'SEND_UNKNOWN');
    assert.equal(restored.one('SELECT count(*) n FROM usage_ledger')!.n, 1);
    assert.equal(
      restored.one('SELECT count(*) n FROM draft_approvals WHERE revoked_at IS NULL')!.n,
      0,
    );
  } finally {
    restored.close();
  }
});
test('failed additive migration rolls back DDL/data and leaves existing rows plus consistent backup', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-migration-failure-')),
    migrations = join(root, 'migrations'),
    dir = join(root, 'data');
  mkdirSync(migrations);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of readdirSync('migrations'))
    copyFileSync(join('migrations', name), join(migrations, name));
  const store = new Store(dir);
  store.set('migrationSentinel', 'synthetic');
  store.close();
  writeFileSync(
    join(migrations, '026_failure.sql'),
    "CREATE TABLE partial_failure(x TEXT);UPDATE app_state SET value='null' WHERE key='migrationSentinel';SELECT * FROM nonexistent_failure;",
  );
  const loader = resolve('node_modules/tsx/dist/loader.mjs'),
    module = resolve('apps/server/src/db.ts').replaceAll('\\', '/');
  const script = join(root, 'attempt.mjs');
  writeFileSync(
    script,
    `import {Store} from ${JSON.stringify('file:///' + module)};try{new Store(process.argv[2]);process.exit(2);}catch{process.stdout.write('ROLLED_BACK');}`,
  );
  assert.equal(
    execFileSync(process.execPath, ['--import', pathToFileURL(loader).href, script, dir], {
      cwd: root,
      windowsHide: true,
      encoding: 'utf8',
    }),
    'ROLLED_BACK',
  );
  const db = new Database(join(dir, 'jobhunter.sqlite'), { readonly: true });
  try {
    assert.equal(
      db.prepare("SELECT value FROM app_state WHERE key='migrationSentinel'").get()!.value,
      '"synthetic"',
    );
    assert.equal(
      db.prepare("SELECT name FROM sqlite_master WHERE name='partial_failure'").get(),
      undefined,
    );
    assert.equal(
      db.prepare("SELECT name FROM migrations WHERE name='026_failure.sql'").get(),
      undefined,
    );
  } finally {
    db.close();
  }
  assert.ok(readdirSync(join(dir, 'backups')).some((name) => name.endsWith('.sqlite')));
});
test('026–027 preserve every schema25 source field and existing protected rows; restore revokes a persisted job', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-nightflow-migration-')),
    dir = join(root, 'data');
  let store = new Store(dir);
  t.after(() => {
    if (store.db.open) store.close();
    rmSync(root, { recursive: true, force: true });
  });
  const service = new GmailJobHunter(store, {
    gateway: new FixtureGmail(),
    accountInfo: () => new FixtureGmail().info,
    reader: new FixtureReader(),
    runner: new FixtureRunner(),
  });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  await service.stopWorker();
  await service.browserDelivery.close();
  store.db.pragma('foreign_keys=OFF');
  store.atomic(() => {
    for (const name of ['auto_batch_plan_grants', 'nightflow_jobs', 'nightflow_plans'])
      store.db.exec('DROP TABLE ' + name);
    store.db.exec(readFileSync('migrations/025_source_versions.sql', 'utf8'));
    store.exec("DELETE FROM migrations WHERE name>='026'");
  });
  store.db.pragma('foreign_keys=ON');
  const before = Object.fromEntries(
    [
      'companies',
      'company_aliases',
      'research_sources',
      'draft_versions',
      'research_draft_materials',
      'source_verifications',
    ].map((table) => [table, store.all('SELECT * FROM ' + table + ' ORDER BY rowid')]),
  );
  store.close();
  store = new Store(dir);
  for (const [table, rows] of Object.entries(before))
    assert.deepEqual(store.all('SELECT * FROM ' + table + ' ORDER BY rowid'), rows);
  store.exec(
    'INSERT INTO nightflow_plans VALUES (?,?,?,?,?,?)',
    'synthetic-plan',
    1,
    '{}',
    'synthetic-hash',
    'synthetic-hash',
    new Date().toISOString(),
  );
  store.exec(
    "INSERT INTO nightflow_jobs(id,plan_id,plan_version,state,generation,deadline,end_at,code_identity,started_at,updated_at) VALUES ('synthetic-job','synthetic-plan',1,'SENDING','must-be-revoked',?,?,?,?,?)",
    '2099-01-01',
    '2099-01-02',
    '{}',
    new Date().toISOString(),
    new Date().toISOString(),
  );
  const backup = store.backup(),
    target = join(root, 'restore');
  restoreBackupCopy(backup, target);
  const restored = new Store(target);
  try {
    const job = restored.one('SELECT * FROM nightflow_jobs')!;
    assert.equal(job.state, 'STOPPED');
    assert.equal(job.generation, '');
    assert.equal(job.reason, 'BACKUP_RESTORED');
  } finally {
    restored.close();
  }
});
