import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-refresh-'));
  const store = new Store(dir),
    reader = new FixtureReader(),
    runner = new FixtureRunner();
  const service = new ResearchJobHunter(store, { reader, runner });
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { store, service, reader };
}
test('refresh: unchanged content keeps its identity and records successful verification', async (t) => {
  const { store, service, reader } = setup(t);
  const source = await reader.read('https://fixture.example.test/careers');
  source.fetched_at = '2020-01-01T00:00:00.000Z';
  service.saveSource(source);
  const fresh = await reader.read(source.original_url);
  const saved = service.saveSource(fresh);
  assert.equal(saved.id, source.id);
  assert.equal(saved.fetched_at, fresh.fetched_at);
  assert.equal(store.all('SELECT * FROM research_sources').length, 1);
  service.saveSource({
    ...fresh,
    id: 'failure',
    status: 'FETCH_FAILED',
    content_hash: null,
    error: 'failure',
  });
  assert.equal(
    store.one('SELECT fetched_at FROM research_sources WHERE id=?', source.id)?.fetched_at,
    fresh.fetched_at,
  );
});
test('refresh: contact proof and purpose change; removal invalidates old qualification', async (t) => {
  const { store, service, reader } = setup(t);
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const item = store.one('SELECT * FROM research_items')!;
  const analysis = JSON.parse(item.analysis);
  const old = store.one('SELECT * FROM contacts')!;
  const fresh = service.saveSource(await reader.read(item.url));
  store.exec("UPDATE contacts SET verified_at='2020-01-01T00:00:00.000Z'");
  (service as any).qualifyItem(item, analysis, [fresh]);
  assert.equal(
    store.one('SELECT * FROM contacts WHERE id=?', old.id)?.verified_at,
    fresh.fetched_at,
  );
  analysis.contact.kind = 'SALES';
  (service as any).qualifyItem(item, analysis, [fresh]);
  assert.equal(store.one('SELECT * FROM contacts WHERE id=?', old.id)?.kind, 'SALES');
  assert.notEqual(
    store.one('SELECT * FROM contacts WHERE id=?', old.id)?.verification_status,
    'VERIFIED_PUBLIC',
  );
  analysis.contact.email = null;
  (service as any).qualifyItem(item, analysis, [fresh]);
  assert.equal(
    store.one('SELECT * FROM contacts WHERE id=?', old.id)?.verification_status,
    'INVALIDATED',
  );
});
