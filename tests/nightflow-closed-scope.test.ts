import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import { NightflowCoordinator, nightflowPlanSchema } from '../apps/server/src/nightflow.js';
import { hash } from '../apps/server/src/util.js';

async function fixture(t: any, empty = false, boundary?: (phase: string) => Promise<void>) {
  const f = await setup(t, false, true, false, true);
  await f.service.startLibraryResearch(undefined, 2);
  await f.service.tick();
  f.service.control('stop');
  f.service.finishPartial();
  const rows = f.service.draftRows();
  assert.equal(rows.length, 5);
  const allowed = rows.filter((d) => /fixture[45]\./.test(d.email));
  if (empty)
    for (const d of allowed)
      f.service.suppress(d.company_id, 'USER_HOLD', 'Fictional user exclusion', 'user');
  const coordinator = new NightflowCoordinator(f.store, f.service, {
    installation: 'fictional-closed-scope',
    clock: f.options.clock,
    wait: async (_ms, signal) => {
      signal.throwIfAborted();
      f.advance(61000);
    },
    boundary,
  });
  const plan = {
    schema: 1,
    id: 'closed-scope',
    version: 1,
    installation: 'fictional-closed-scope',
    goal: 'Fictional closed acceptance, no substitute recipients',
    binding: f.service.nightflowBinding(),
    researchHours: 1,
    afterResearchHours: 1,
    discovery: false,
    exhaustion: 'FINISH',
    selection: 'VERIFIED_FIT_THEN_CHANNEL_THEN_AGE',
    maxItems: 2,
    draftIds: allowed.map((d) => d.id),
    limits: { daily: null, session: null, unlimitedExplicit: true },
    intervalSeconds: 60,
    window: { start: '00:00', end: '23:59', timezone: f.service.campaign().timezone },
    empty: 'REPORT_WITHOUT_SEND',
  };
  return { ...f, coordinator, plan, allowed, rows };
}

test('closed nightflow scope: renew and select only the named drafts, no substitute from other valid material', async (t) => {
  const f = await fixture(t);
  f.coordinator.savePlan(f.plan, true);
  const observed: string[] = [],
    read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    observed.push(url);
    return read(url, signal);
  };
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.state, 'COMPLETED', JSON.stringify(result));
  assert.equal(f.gateway.posts.length, 2);
  assert.ok(f.gateway.posts.every((p) => f.allowed.some((d) => d.email === p.recipient)));
  assert.ok(
    observed.length > 0 && observed.every((url) => /fixture[45]\./.test(url)),
    JSON.stringify(observed),
  );
  const checkpoint = JSON.parse(f.store.one('SELECT checkpoint FROM nightflow_jobs')!.checkpoint);
  assert.deepEqual(new Set(checkpoint.refreshQueue), new Set(f.plan.draftIds));
  assert.ok(
    f.store
      .all('SELECT draft_id FROM auto_batch_items')
      .every((i) => f.plan.draftIds.includes(i.draft_id)),
  );
  assert.equal(result.authority, false);
});

test('closed nightflow scope: all named drafts held means zero, never substitute another ready company', async (t) => {
  const f = await fixture(t, true);
  f.coordinator.savePlan(f.plan, true);
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.reason, 'NO_READY_ITEMS', JSON.stringify(result));
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM auto_batches')!.n, 0);
});

test('closed nightflow scope: empty/duplicate list or discovery cannot widen a named existing-draft plan', async (t) => {
  const f = await fixture(t);
  for (const p of [
    { ...f.plan, draftIds: [] },
    { ...f.plan, draftIds: [f.plan.draftIds[0], f.plan.draftIds[0]] },
    { ...f.plan, discovery: true },
  ])
    assert.equal(nightflowPlanSchema.safeParse(p).success, false);
  const { draftIds: _ignored, ...legacy } = f.plan;
  assert.equal(nightflowPlanSchema.safeParse(legacy).success, true);
});

test('closed nightflow scope: native batch derivation rejects an outsider before any batch or reservation', async (t) => {
  const f = await fixture(t);
  f.coordinator.savePlan(f.plan, true);
  // Synthetic CLOSING operation: exercise the native public derivation gate directly.
  f.store.exec(
    'INSERT INTO nightflow_jobs (id,plan_id,plan_version,state,reason,generation,deadline,end_at,research_session_id,batch_id,checkpoint,code_identity,started_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    'fictional-derivation',
    f.plan.id,
    1,
    'CLOSING',
    null,
    'fictional-generation',
    f.service.now(),
    f.service.now(),
    null,
    null,
    '{}',
    '{}',
    f.service.now(),
    f.service.now(),
  );
  const outsider = f.rows.find((d) => !f.plan.draftIds.includes(d.id))!;
  assert.throws(
    () =>
      f.service.deriveNightflowBatch('fictional-derivation', [
        { id: outsider.id, version: outsider.version },
      ]),
    { code: 'PLAN_SCOPE_CHANGED' },
  );
  const limited = { ...f.plan, id: 'limited', maxItems: 1 };
  f.coordinator.savePlan(limited, true);
  f.store.exec('UPDATE nightflow_jobs SET plan_id=?', limited.id);
  assert.throws(
    () =>
      f.service.deriveNightflowBatch(
        'fictional-derivation',
        f.allowed.map((d) => ({ id: d.id, version: d.version })),
      ),
    { code: 'PLAN_SCOPE_CHANGED' },
  );
  assert.equal(f.store.one('SELECT count(*) n FROM auto_batches')!.n, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});

test('closed nightflow scope: explicit resume rejects a persisted foreign queue before any source read', async (t) => {
  let f!: Awaited<ReturnType<typeof fixture>>;
  f = await fixture(t, false, async (phase) => {
    if (phase === 'REFRESHING') {
      f.coordinator.stop();
    }
  });
  f.coordinator.savePlan(f.plan, true);
  const stopped = await f.coordinator.start(f.plan.id);
  assert.equal(stopped.state, 'STOPPED');
  const outsider = f.rows.find((d) => !f.plan.draftIds.includes(d.id))!;
  f.store.exec(
    'UPDATE nightflow_jobs SET checkpoint=?',
    JSON.stringify({ refreshQueue: [outsider.id] }),
  );
  const restarted = new NightflowCoordinator(f.store, f.service, {
    installation: 'fictional-closed-scope',
    clock: f.options.clock,
    wait: async (_ms, signal) => {
      signal.throwIfAborted();
      f.advance(61000);
    },
  });
  const before = f.reader.calls;
  const result = await restarted.start(f.plan.id, stopped.jobId);
  assert.equal(result.reason, 'PLAN_SCOPE_CHANGED', JSON.stringify(result));
  assert.equal(f.reader.calls, before);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});

test('closed nightflow scope: renewal cannot replace an approved recipient on the same draft', async (t) => {
  const f = await fixture(t);
  f.coordinator.savePlan(f.plan, true);
  const originalRecipients = f.allowed.map((d) => d.email);
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    const source = await read(url, signal);
    source.text = source.text.replaceAll('hr@fixture4.', 'jobs@fixture4.');
    source.fragment = source.text;
    source.content_hash = hash(source.text + url);
    return source;
  };
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    const result = await run(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const value = result.value as any;
      value.contact.email = value.contact.email.replace('hr@fixture4.', 'jobs@fixture4.');
      value.contact.proof.quote = value.contact.proof.quote.replace(
        'hr@fixture4.',
        'jobs@fixture4.',
      );
      result.value = schema.parse(value);
    }
    return result;
  };
  const result = await f.coordinator.start(f.plan.id);
  assert.ok(
    f.gateway.posts.every((p) => originalRecipients.includes(p.recipient)),
    JSON.stringify({ result, recipients: f.gateway.posts.map((p) => p.recipient) }),
  );
  assert.ok(f.gateway.posts.some((p) => p.recipient === 'hr@fixture5.example.test'));
});

test('closed nightflow scope: native derivation rejects a changed address on an approved draft', async (t) => {
  const f = await fixture(t);
  f.coordinator.savePlan(f.plan, true);
  f.store.exec(
    "INSERT INTO nightflow_jobs (id,plan_id,plan_version,state,generation,deadline,end_at,code_identity,started_at,updated_at) VALUES (?,?,1,'CLOSING','fixture',?,?,?, ?,?)",
    'scope-derivation',
    f.plan.id,
    f.service.now(),
    f.service.now(),
    '{}',
    f.service.now(),
    f.service.now(),
  );
  const d = f.allowed[0];
  f.store.exec(
    'UPDATE contacts SET email=? WHERE id=?',
    'replacement@fixture4.example.test',
    d.contact_id,
  );
  assert.throws(
    () => f.service.deriveNightflowBatch('scope-derivation', [{ id: d.id, version: d.version }]),
    { code: 'PLAN_SCOPE_CHANGED' },
  );
  assert.equal(f.store.one('SELECT count(*) n FROM auto_batches')!.n, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});

test('closed nightflow scope: persisted recipients survive Stop and restart without recapture', async (t) => {
  let f!: Awaited<ReturnType<typeof fixture>>;
  f = await fixture(t, false, async (phase) => {
    if (phase === 'REFRESHING') f.coordinator.stop();
  });
  f.coordinator.savePlan(f.plan, true);
  const original = f.store.one(
    'SELECT content FROM nightflow_plans WHERE id=?',
    f.plan.id,
  )!.content;
  const stopped = await f.coordinator.start(f.plan.id);
  f.store.exec(
    'UPDATE contacts SET email=? WHERE id=?',
    'replacement@fixture4.example.test',
    f.allowed[0].contact_id,
  );
  const restarted = new NightflowCoordinator(f.store, f.service, {
    installation: 'fictional-closed-scope',
    clock: f.options.clock,
    wait: async (_ms, signal) => {
      signal.throwIfAborted();
      f.advance();
    },
  });
  const result = await restarted.start(f.plan.id, stopped.jobId);
  assert.equal(result.state, 'COMPLETED', JSON.stringify(result));
  assert.ok(f.gateway.posts.every((p) => p.recipient !== 'replacement@fixture4.example.test'));
  assert.equal(
    f.store.one('SELECT content FROM nightflow_plans WHERE id=?', f.plan.id)!.content,
    original,
  );
});

test('closed nightflow scope: changed batch recipient at dispatch is rejected before reservation', async (t) => {
  let f!: Awaited<ReturnType<typeof fixture>>;
  f = await fixture(t, false, async (phase) => {
    if (phase === 'SENDING')
      f.store.exec('UPDATE auto_batch_items SET recipient=?', 'outsider@fictional.example.test');
  });
  f.coordinator.savePlan(f.plan, true);
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.reason, 'PLAN_SCOPE_CHANGED', JSON.stringify(result));
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});

test('closed nightflow scope: legacy named approval without frozen recipients cannot silently upgrade', async (t) => {
  const f = await fixture(t);
  f.coordinator.savePlan(f.plan, true);
  const { recipientScope: _removed, ...legacy } = JSON.parse(
    f.store.one('SELECT content FROM nightflow_plans')!.content,
  );
  const content = JSON.stringify(legacy),
    digest = hash(content);
  f.store.exec(
    'UPDATE nightflow_plans SET content=?,content_hash=?,approved_hash=?',
    content,
    digest,
    digest,
  );
  const before = f.reader.calls;
  await assert.rejects(f.coordinator.start(f.plan.id), { code: 'PLAN_SCOPE_REQUIRED' });
  assert.equal(f.reader.calls, before);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT content FROM nightflow_plans')!.content, content);
});

test('nightflow: absolute approval expiry cannot be renewed by a later Start or restart', async (t) => {
  const f = await fixture(t),
    expiresAt = new Date(Date.parse(f.service.now()) + 60000).toISOString();
  const plan = { ...f.plan, expiresAt };
  f.coordinator.savePlan(plan, true);
  f.advance(61000);
  const restarted = new NightflowCoordinator(f.store, f.service, {
    installation: 'fictional-closed-scope',
    clock: f.options.clock,
  });
  await assert.rejects(restarted.start(plan.id), { code: 'EXECUTION_DEADLINE' });
  assert.equal(f.store.one('SELECT count(*) n FROM nightflow_jobs')!.n, 0);
  assert.equal(f.gateway.posts.length, 0);
});

test('nightflow: absolute end bounds the saved job and revokes dispatch during an await', async (t) => {
  let f!: Awaited<ReturnType<typeof fixture>>;
  f = await fixture(t, false, async (phase) => {
    if (phase === 'SENDING') f.advance(61000);
  });
  const expiresAt = new Date(Date.parse(f.service.now()) + 60000).toISOString();
  f.coordinator.savePlan({ ...f.plan, expiresAt }, true);
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.reason, 'EXECUTION_DEADLINE', JSON.stringify(result));
  assert.equal(f.store.one('SELECT end_at FROM nightflow_jobs')!.end_at, expiresAt);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});
