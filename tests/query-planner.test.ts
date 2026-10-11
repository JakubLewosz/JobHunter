import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../apps/server/src/db.js';
import {
  QueryPlanner,
  normalizeQuery,
  normalizeResearchURL,
} from '../apps/server/src/research/query-planner.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
test('planner persists progress, expands beyond eight, cools down and bounds history prompts', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-plan-')),
    store = new Store(dir);
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  let time = Date.parse('2026-10-10T20:00:00.000Z');
  const queries: string[] = [];
  const service = new ResearchJobHunter(store, {
    clock: () => new Date(time),
    reader: new FixtureReader(),
    runner: new FixtureRunner(),
    search: {
      search: async (q) => {
        queries.push(q);
        return { urls: [], queries: [q] };
      },
    },
  });
  service.approveProfile();
  await service.probe('search');
  queries.length = 0;
  const p = {
    policyHash: 'fictional-policy',
    searchScope: 'Firmy działające w Polsce, integracje',
  };
  let planner = new QueryPlanner(store, () => new Date(time));
  for (let i = 0; i < 10; i++) {
    let plan = planner.next(p, service.profile().facts);
    if (!plan.query) {
      assert.ok(plan.nextAt);
      time = Date.parse(plan.nextAt!);
      plan = planner.next(p, service.profile().facts);
    }
    assert.ok(plan.query);
    await service.start(plan.query!);
    const run = store.one("SELECT id FROM runs WHERE status='QUEUED'")!;
    planner.started(plan.id!, run.id);
    await service.tick();
    planner.reconcile(p.policyHash);
    if (i === 7) planner = new QueryPlanner(store, () => new Date(time));
    time += 61000;
  }
  assert.equal(queries.length, 10);
  assert.equal(
    new Set(
      store.all('SELECT normalized_query FROM auto_query_plan').map((r) => r.normalized_query),
    ).size,
    10,
  );
  assert.match(queries[8], /Polska/);
  assert.match(queries[8], /integracje|aplikacje/);
  assert.ok(
    store
      .all('SELECT metrics FROM auto_query_plan')
      .every((r) => JSON.parse(r.metrics).newCompanies === 0),
  );
  const cooldown = planner.next(p, service.profile().facts);
  assert.equal(cooldown.query, undefined);
  assert.ok(cooldown.nextAt! > new Date(time).toISOString());
  const other = planner.next({ ...p, policyHash: 'changed-scope' }, service.profile().facts);
  assert.notEqual(other.id, store.one('SELECT id FROM auto_query_plan')!.id);
});
test('normalization removes fake query/URL novelty while retaining a distinct page', () => {
  assert.equal(normalizeQuery('  SaaS, API — Polska! '), normalizeQuery('saas api Polska'));
  assert.equal(
    normalizeResearchURL('https://firm.example.test/kontakt/?utm_source=x#footer'),
    normalizeResearchURL('https://firm.example.test/kontakt'),
  );
  assert.notEqual(
    normalizeResearchURL('https://firm.example.test/old'),
    normalizeResearchURL('https://firm.example.test/contact'),
  );
});
test('planner prioritizes an approved topic supported by productive qualified results', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-plan-topic-')),
    store = new Store(dir);
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const policy = { scopeHash: 'scope-topic', searchScope: 'Polska, firmy programistyczne' };
  store.exec(
    "INSERT INTO auto_query_plan (id,scope_hash,query,normalized_query,status,next_at,metrics,updated_at) VALUES ('seed','scope-topic','seed','seed','DONE',?,?,?)",
    new Date().toISOString(),
    JSON.stringify({ topicCounts: { elektroscan: 3 } }),
    new Date().toISOString(),
  );
  store.set('plannerCursor:scope-topic', 8);
  const planner = new QueryPlanner(store, () => new Date());
  const plan = planner.next(policy, [
    { key: 'fixdesk', approval_status: 'APPROVED' },
    { key: 'elektroscan', approval_status: 'APPROVED' },
    { key: 'codefabric', approval_status: 'DRAFT' },
  ]);
  assert.match(plan.query!, /przetwarzanie dokumentów PDF/);
  assert.doesNotMatch(plan.query!, /narzędzia LLM/);
});
