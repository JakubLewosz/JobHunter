import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { setup } from './auto-fixture.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { FixtureGmail } from './gmail-fixture.js';
async function fixture(t: any) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-library-refresh-')),
    store = new Store(dir),
    reader = new FixtureReader(),
    runner = new FixtureRunner(),
    service = new ResearchJobHunter(store, { reader, runner });
  t.after(async () => {
    await service.stopWorker();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  service.control('stop');
  return { store, reader, runner, service, draft: service.draftRows()[0] };
}
test('library refresh really reads and qualifies selected sources, preserves text and old versions, creates no send rights', async (t) => {
  const f = await fixture(t),
    oldVersions = f.store.all('SELECT * FROM draft_versions'),
    before = f.reader.calls;
  const result = await f.service.refreshLibraryDrafts({ draftIds: [f.draft.id] });
  assert.ok(f.reader.calls > before);
  assert.equal(result.results[0].sameText, true);
  assert.equal(result.results[0].code, 'CHECKED');
  assert.deepEqual(
    f.store.all('SELECT * FROM draft_versions').slice(0, oldVersions.length),
    oldVersions,
  );
  assert.equal(f.store.one('SELECT count(*) n FROM draft_approvals')!.n, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
  assert.equal(f.service.state().stopped, true);
});
test('parser change refresh produces new source and validates the same message without rewriting historic versions', async (t) => {
  const f = await fixture(t),
    read = f.reader.read.bind(f.reader),
    versions = f.store.all('SELECT * FROM draft_versions');
  f.reader.read = async (url, signal) => ({
    ...(await read(url, signal)),
    parser_version: 3,
    completeness: 'COMPLETE',
  });
  const result = await f.service.refreshLibraryDrafts({ draftIds: [f.draft.id] });
  assert.equal(result.results[0].sameText, true);
  assert.equal(result.results[0].code, 'CHECKED');
  assert.ok(f.store.one('SELECT count(*) n FROM research_sources')!.n >= 2);
  for (const old of versions)
    assert.deepEqual(f.store.one('SELECT * FROM draft_versions WHERE id=?', old.id), old);
});
test('incomplete and changed purpose fail closed; Stop cancels a selected refresh without authorization', async (t) => {
  const f = await fixture(t),
    read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => ({
    ...(await read(url, signal)),
    status: 'INCOMPLETE',
    completeness: 'TEXT_LIMIT',
  });
  const result = await f.service.refreshLibraryDrafts({ draftIds: [f.draft.id] });
  assert.equal(result.results[0].code, 'STALE_EVIDENCE');
  let ready!: () => void;
  const started = new Promise<void>((r) => (ready = r));
  f.reader.read = async (_url, signal) => {
    ready();
    await new Promise<void>((r) => signal!.addEventListener('abort', () => r(), { once: true }));
    signal!.throwIfAborted();
    return {} as any;
  };
  const work = f.service.refreshLibraryDrafts({ draftIds: [f.draft.id] });
  await started;
  f.service.control('stop');
  await assert.rejects(() => work);
  assert.equal(f.service.state().stopped, true);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});

test('eight completed fake SELF_TEST messages allow real renewal while frozen MIME, versions, attempts and usage remain byte-identical', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-eight-selftests-')),
    store = new Store(dir),
    gateway = new FixtureGmail(),
    reader = new FixtureReader();
  const service = new GmailJobHunter(store, {
    gateway,
    accountInfo: () => gateway.info,
    reader,
    runner: new FixtureRunner(),
  });
  t.after(async () => {
    await service.stopWorker();
    await service.browserDelivery.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const d = service.draftRows()[0];
  service.reviewDraft(d.id, d.version);
  const cv = service.uploadCV(
    'Fixture.pdf',
    Buffer.from('%PDF-1.4\nSynthetic\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  for (let n = 0; n < 8; n++) {
    const preview = await service.prepareDelivery({
      drafts: [{ id: d.id, version: d.version }],
      cvId: cv.id,
      kind: 'SELF_TEST',
    });
    await service.approveDelivery({
      previewId: preview.id,
      previewHash: preview.previewHash,
      confirmed: true,
    });
    await service.dispatchOne();
  }
  service.control('stop');
  assert.equal(
    store.one("SELECT count(*) n FROM outbox WHERE kind='SELF_TEST' AND status='SENT_CONFIRMED'")!
      .n,
    8,
  );
  const tables = ['outbox', 'send_attempts', 'usage_ledger', 'draft_approvals', 'draft_versions'];
  const before = Object.fromEntries(
    tables.map((table) => [table, store.all('SELECT * FROM ' + table + ' ORDER BY rowid')]),
  );
  const calls = reader.calls;
  const result = await service.refreshLibraryDrafts({ draftIds: [d.id] });
  assert.equal(result.results[0].code, 'CHECKED');
  assert.ok(reader.calls > calls);
  assert.equal(gateway.posts.length, 8);
  for (const table of tables)
    for (const row of before[table])
      assert.deepEqual(store.one('SELECT * FROM ' + table + ' WHERE id=?', row.id), row);
  assert.equal(store.one('SELECT count(*) n FROM usage_ledger')!.n, 8);
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 8);
});
test('a later incomplete verification at the same clock instant invalidates cache; recovery requires a real read', async (t) => {
  const f = await fixture(t),
    read = f.reader.read.bind(f.reader),
    source = f.store.one('SELECT * FROM research_sources')!;
  const incomplete = {
    ...source,
    id: 'synthetic-incomplete',
    status: 'INCOMPLETE',
    completeness: 'TEXT_LIMIT',
  };
  f.service.saveSource(incomplete as any);
  const before = f.reader.calls;
  await f.service.readSource(source.original_url);
  assert.equal(f.reader.calls, before + 1);
  const current = f.store.one(
    'SELECT * FROM source_verifications ORDER BY checked_at DESC,rowid DESC LIMIT 1',
  )!;
  assert.equal(current.status, 'READ');
});

for (const kind of ['SELF_TEST', 'FIRST_CONTACT'])
  for (const status of ['QUEUED', 'SENDING', 'SEND_UNKNOWN', 'SENT_PROVIDER', 'SENT_CONFIRMED'])
    test(`refresh history: ${kind}/${status}`, async (t) => {
      const f = await fixture(t),
        before = f.reader.calls;
      f.store.exec(
        'INSERT INTO draft_approvals VALUES (?,?,?,?,?,?,?,NULL,?)',
        'fixture-approval',
        f.draft.id,
        f.draft.version,
        f.draft.payload_hash,
        'synthetic-binding',
        'user',
        f.service.now(),
        f.service.now(),
      );
      for (let n = 0; n < (kind === 'SELF_TEST' ? 3 : 1); n++)
        f.store.exec(
          'INSERT INTO outbox (id,submission_id,draft_id,draft_version,company_id,run_id,approval_id,kind,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          `fixture-${n}`,
          `submission-${n}`,
          f.draft.id,
          f.draft.version,
          f.draft.company_id,
          f.store.one('SELECT id FROM runs')!.id,
          'fixture-approval',
          kind,
          status,
          f.service.now(),
          f.service.now(),
        );
      const history = f.store.all('SELECT * FROM outbox ORDER BY id');
      const result = await f.service.refreshLibraryDrafts({ draftIds: [f.draft.id] });
      const allowed = kind === 'SELF_TEST' && status === 'SENT_CONFIRMED';
      assert.equal(f.reader.calls > before, allowed);
      assert.equal(result.results[0].code, allowed ? 'CHECKED' : 'CONTACT_HISTORY');
      assert.deepEqual(f.store.all('SELECT * FROM outbox ORDER BY id'), history);
      assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
      assert.equal(f.store.one('SELECT count(*) n FROM draft_approvals')!.n, 1);
    });

test('refresh fences both AUTO Starts before reader completes and Stop cannot be undone by late reader', async (t) => {
  const f = await setup(t, false, false, false, true);
  await f.service.startLibraryResearch(undefined, 8);
  await f.service.tick();
  f.service.control('stop');
  f.service.finishPartial();
  const d = f.service.draftRows()[0];
  const b = f.service.prepareBatch({ drafts: [{ id: d.id, version: d.version }] });
  f.service.approveClosedBatch(b.id, { approvalHash: b.approvalHash, confirmed: true });
  const read = f.reader.read.bind(f.reader);
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  f.reader.read = async (url, signal) => {
    await held;
    return read(url, signal);
  };
  const refresh = f.service.refreshLibraryDrafts({ draftIds: [d.id] });
  await assert.rejects(() => f.service.startAuto(), { code: 'BUSY' });
  await assert.rejects(() => f.service.startBatch(b.id), { code: 'BUSY' });
  await assert.rejects(() => f.service.refreshLibraryDrafts({ draftIds: [d.id] }), {
    code: 'BUSY',
  });
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM auto_sessions')!.n, 0);
  f.service.control('stop');
  release();
  await assert.rejects(() => refresh);
  assert.equal(f.service.state().stopped, true);
  assert.ok(f.service.draftMaterialIssues(d).includes('DRAFT_MATERIAL_UNVERIFIED'));
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  f.reader.read = read;
  await f.service.refreshLibraryDrafts({ draftIds: [d.id] });
  assert.deepEqual(f.service.draftMaterialIssues(f.service.draftRows()[0]), []);
  const currentBatch = f.service.reprepareBatch(b.id);
  f.service.approveClosedBatch(b.id, { approvalHash: currentBatch.approvalHash, confirmed: true });
  await f.service.startBatch(b.id);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
});
