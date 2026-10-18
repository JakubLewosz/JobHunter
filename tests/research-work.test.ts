import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import { fairWorkOrder, workMetrics } from '../apps/server/src/research/work-metrics.js';
test('mixed research schedules discovery/refresh/reuse, reports actual cache/HTTP/model stages and preserves blocks', async (t) => {
  const f = await setup(t, false, true, false, true);
  await f.service.startLibraryResearch('First synthetic library research', 8);
  await f.service.tick();
  f.service.control('stop');
  f.service.finishPartial();
  const c1 = f.store.one("SELECT * FROM companies WHERE primary_domain='fixture1.example.test'")!,
    c2 = f.store.one("SELECT * FROM companies WHERE primary_domain='fixture2.example.test'")!;
  f.service.suppress(c2.id, 'OPT_OUT', 'Synthetic block', 'user');
  f.store.exec(
    "UPDATE research_sources SET fetched_at=? WHERE original_url LIKE 'https://fixture1.%'",
    new Date(Date.now() - 25 * 3600000).toISOString(),
  );
  f.service.search.search = async () => ({
    queries: ['mixed synthetic'],
    urls: [1, 2, 3, 6].map((i) => ({
      url: `https://fixture${i}.example.test/careers`,
      contactUrl: null,
    })),
  });
  const reads = f.reader.calls,
    blocks = f.store.all('SELECT * FROM suppressions');
  await f.service.startLibraryResearch('Second synthetic mixed research', 8);
  await f.service.tick();
  const work = f.store.get<any>('researchDay', {}),
    metrics = workMetrics(f.store, work.runIds);
  assert.equal(f.reader.calls - reads, 2, 'only stale known source and new source need reads');
  assert.ok(metrics.categories.some((c) => c.category === 'DISCOVERY'));
  assert.ok(metrics.categories.some((c) => c.category === 'REFRESH'));
  assert.ok(metrics.categories.some((c) => c.category === 'REUSE'));
  assert.equal(metrics.companies.new, 1);
  assert.ok(metrics.companies.known >= 2);
  assert.ok(metrics.stages.some((s) => s.stage === 'READ'));
  assert.ok(metrics.stages.some((s) => s.stage === 'DRAFT'));
  assert.deepEqual(f.store.all('SELECT * FROM suppressions'), blocks);
  assert.equal(
    f.store.one('SELECT primary_domain FROM companies WHERE id=?', c1.id)!.primary_domain,
    c1.primary_domain,
  );
  assert.equal(f.gateway.posts.length, 0);
  f.service.control('stop');
});
test('fair work order interleaves categories without starving refresh, reuse or discovery', () => {
  const items = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: i, kind: 'REFRESH' })),
    { id: 8, kind: 'REUSE' },
    { id: 9, kind: 'DISCOVERY' },
  ];
  const ordered = fairWorkOrder(items, (i) => i.kind);
  assert.deepEqual(
    ordered.slice(0, 3).map((i) => i.kind),
    ['REFRESH', 'DISCOVERY', 'REUSE'],
  );
  assert.equal(new Set(ordered.map((i) => i.id)).size, items.length);
});
