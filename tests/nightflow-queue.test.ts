import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import { NightflowCoordinator, selectNightflowRefreshQueue } from '../apps/server/src/nightflow.js';

async function library(t: any, hours = 2, discovery = true) {
  const f = await setup(t, false, true, false, true);
  f.options.search!.search = async () => ({
    urls: Array.from({ length: 24 }, (_, i) => ({
      url: `https://fixture${i + 1}.example.test/careers`,
      contactUrl: null,
    })),
    queries: ['fictional priority library'],
  });
  await f.service.startLibraryResearch(undefined, 8);
  await f.service.tick();
  for (let i = 6; i <= 24; i++) {
    await f.service.importURL(`https://fixture${i}.example.test/careers`);
    await f.service.tick();
  }
  for (let i = 0; i < 6; i++) await f.service.tick();
  f.service.control('stop');
  f.service.finishPartial();
  assert.ok(f.service.draftRows().length > 15, 'native overfull library');
  const coordinator = new NightflowCoordinator(f.store, f.service, {
    installation: 'queue-fixture',
    clock: f.options.clock,
    wait: async (_ms, signal) => {
      signal.throwIfAborted();
      f.advance(16 * 60000);
    },
  });
  const plan = {
    schema: 1,
    id: 'queue-plan',
    version: 1,
    installation: 'queue-fixture',
    goal: 'Fictional paid remote regular work',
    binding: f.service.nightflowBinding(),
    researchHours: hours,
    afterResearchHours: 24,
    discovery,
    exhaustion: 'FINISH',
    selection: 'VERIFIED_FIT_THEN_CHANNEL_THEN_AGE',
    maxItems: 1,
    limits: { daily: null, session: null, unlimitedExplicit: true },
    intervalSeconds: 60,
    window: { start: '00:00', end: '23:59', timezone: f.service.campaign().timezone },
    empty: 'REPORT_WITHOUT_SEND',
  };
  coordinator.savePlan(plan, true);
  return { ...f, coordinator, plan };
}

test('bounded native refresh selects fifteen from an overfull library before discovery, independently of batch size', async (t) => {
  const f = await library(t);
  const before = new Map(f.service.draftRows().map((d) => [d.id, d.version]));
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.state, 'COMPLETED', JSON.stringify(result));
  assert.equal(result.checkpoint?.refreshed.length, 15);
  assert.equal(result.checkpoint?.refreshQueue.length, 15);
  assert.equal(new Set(result.checkpoint?.refreshQueue).size, 15);
  assert.ok(result.researchSessionId, 'discovery actually started');
  assert.equal(result.counts?.total, 1);
  assert.equal(f.gateway.posts.length, 1);
  for (const [id, version] of before)
    assert.ok(f.service.draftRows().find((d) => d.id === id)!.version >= version);
});

test('refresh budget leaves discovery its original deadline after slow native reads', async (t) => {
  const f = await library(t, 1);
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (...args) => {
    if (
      f.store.one('SELECT state FROM nightflow_jobs ORDER BY rowid DESC LIMIT 1')?.state ===
      'REFRESHING'
    )
      f.advance(10 * 60000);
    return read(...args);
  };
  const result = await f.coordinator.start(f.plan.id);
  assert.ok(result.researchSessionId, JSON.stringify(result));
  assert.equal(result.checkpoint?.refreshQueue.length, 12);
  assert.ok(result.checkpoint?.refreshed.length < 12);
  assert.equal(
    result.checkpoint?.researchOutcome?.deadline,
    result.deadline,
    JSON.stringify({ result, research: f.service.researchController().state() }),
  );
  assert.equal(result.checkpoint?.refreshBudgetReason, 'DEADLINE');
  assert.equal(f.service.state().stopped, true);
});

test('refresh priority excludes contacted/duplicate companies, rotates equal fits, and keeps a send cap independent', () => {
  const make = (id: string, rank = 0, issues: string[] = []) => ({
    d: {
      id,
      company_id: id,
      email: `${id}@example.test`,
      status: 'NEEDS_REVIEW',
      created_at: '2026-01-01',
      decision: 'NEEDS_REVIEW',
    },
    channelRank: rank,
    issues,
  });
  const a = make('a'),
    b = make('b'),
    hr = make('hr', 1),
    blocked = make('blocked', 1, ['CONTACT_HISTORY']);
  const duplicate = make('duplicate');
  duplicate.d.company_id = 'a';
  assert.deepEqual(
    selectNightflowRefreshQueue([a, b, hr, blocked, duplicate], 1, (id) =>
      id === 'a' ? '2026-10-26' : '',
    ),
    ['hr', 'b', 'duplicate'],
  );
});
