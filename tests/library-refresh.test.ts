import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
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
