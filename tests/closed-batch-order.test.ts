import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';

async function orderedFixture(t: TestContext, browser = false) {
  const f = await setup(t, false, true, false, true);
  if (browser) {
    await f.service.setSendTransport({
      transport: 'GMAIL_BROWSER',
      confirmed: true,
      outgoingViewConsent: true,
    });
    f.service.browserDelivery.attach('synthetic-order-worker');
    f.service.configurePolicy(f.policy);
    t.after(() => f.service.browserDelivery.close());
  }
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    f.advance(1000);
    return read(url, signal);
  };
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    f.advance(1000);
    return run(prompt, schema, options);
  };
  await f.service.startLibraryResearch(undefined, 8);
  await f.service.tick();
  f.service.control('stop');
  f.service.finishPartial();
  const rows = f.service.draftRows();
  const ordered = rows.toReversed().slice(0, 3);
  assert.equal(ordered.length, 3);
  assert.equal(new Set(ordered.map((d) => d.created_at)).size, 3);
  assert.deepEqual(
    rows.filter((d) => ordered.some((item) => item.id === d.id)).map((d) => d.id),
    ordered.toReversed().map((d) => d.id),
    'The fixture creates C after B after A, before batch selection',
  );
  const preparation: string[] = [];
  const prepare = f.service.prepareDelivery.bind(f.service);
  f.service.prepareDelivery = async (input) => {
    preparation.push(...input.drafts.map((d: { id: string }) => d.id));
    return prepare(input);
  };
  const prepareBatch = () =>
    f.service.prepareBatch({ drafts: ordered.map((d) => ({ id: d.id, version: d.version })) });
  const attempts = () =>
    f.store
      .all(
        'SELECT o.draft_id FROM send_attempts a JOIN outbox o ON o.id=a.outbox_id ORDER BY a.rowid',
      )
      .map((r) => r.draft_id);
  const reservations = () =>
    f.store
      .all(
        'SELECT o.draft_id FROM usage_ledger u JOIN outbox o ON o.id=u.outbox_id ORDER BY u.rowid',
      )
      .map((r) => r.draft_id);
  const assertIdle = () => {
    assert.equal(f.gateway.posts.length, 0);
    assert.deepEqual(attempts(), []);
    assert.deepEqual(reservations(), []);
  };
  return { ...f, ordered, preparation, prepareBatch, attempts, reservations, assertIdle };
}

function approve(f: Awaited<ReturnType<typeof orderedFixture>>) {
  const b = f.prepareBatch();
  f.service.approveClosedBatch(b.id, { approvalHash: b.approvalHash, confirmed: true });
  return b;
}

async function dispatch(f: Awaited<ReturnType<typeof orderedFixture>>, count = 1) {
  for (let i = 0; i < count; i++) {
    f.advance();
    await f.service.dispatchOne();
  }
}

async function queueFirst(f: Awaited<ReturnType<typeof orderedFixture>>) {
  const original = GmailJobHunter.prototype.dispatchOne;
  GmailJobHunter.prototype.dispatchOne = async function (expected) {
    if (this !== f.service) await original.call(this, expected);
  };
  try {
    await dispatch(f);
  } finally {
    GmailJobHunter.prototype.dispatchOne = original;
  }
  assert.equal(f.store.one("SELECT count(*) n FROM outbox WHERE status='QUEUED'")!.n, 1);
  f.assertIdle();
}

test('closed batch dispatch follows approved A/B/C despite creation order C/B/A and excludes the fourth company', async (t) => {
  const f = await orderedFixture(t);
  const batch = f.prepareBatch();
  f.assertIdle();
  await assert.rejects(() => f.service.startBatch(batch.id), { code: 'BATCH_APPROVAL_REQUIRED' });
  f.service.approveClosedBatch(batch.id, { approvalHash: batch.approvalHash, confirmed: true });
  f.assertIdle();
  await f.service.startBatch(batch.id);
  f.assertIdle();
  for (let i = 0; i < 3; i++) {
    f.advance();
    await f.service.dispatchOne();
  }
  const expected = f.ordered.map((d) => d.id);
  t.diagnostic(
    JSON.stringify({
      approved: f.ordered.map((d) => d.email),
      prepared: f.preparation.map((id) => f.ordered.find((d) => d.id === id)?.email),
      attempts: f.gateway.posts.map((p) => p.recipient),
    }),
  );
  assert.deepEqual(f.preparation, expected);
  assert.deepEqual(f.reservations(), expected);
  assert.deepEqual(f.attempts(), expected);
  assert.deepEqual(
    f.gateway.posts.map((p) => p.recipient),
    f.ordered.map((d) => d.email),
  );
  assert.equal(f.store.one('SELECT count(*) n FROM auto_batch_outbox')!.n, 3);
  assert.equal(f.store.one('SELECT count(DISTINCT session_id) n FROM auto_outbox')!.n, 1);
  assert.equal(f.service.batchSummary(batch.id).state, 'COMPLETED');
  f.advance();
  await f.service.dispatchOne();
  assert.deepEqual(f.attempts(), expected);
});

test('closed batch skips a blocked B with its reason and continues A/C without a replacement', async (t) => {
  const f = await orderedFixture(t),
    b = approve(f);
  await f.service.startBatch(b.id);
  await dispatch(f);
  f.service.suppress(f.ordered[1].company_id, 'DO_NOT_CONTACT', 'synthetic refusal');
  await dispatch(f, 3);
  assert.deepEqual(f.attempts(), [f.ordered[0].id, f.ordered[2].id]);
  const item = f.service.batchSummary(b.id).items[1];
  assert.equal(item.state, 'SKIPPED');
  assert.equal(item.code, 'CONTACT_HISTORY');
  assert.equal(f.service.batchSummary(b.id).state, 'COMPLETED_WITH_SKIPS');
});

for (const review of ['PENDING', 'RUNNING', 'ERROR'])
  test(`closed batch keeps ${review} B pending and prevents C overtaking it`, async (t) => {
    const f = await orderedFixture(t),
      b = approve(f),
      d = f.ordered[1];
    await f.service.startBatch(b.id);
    await dispatch(f);
    f.store.exec(
      'UPDATE research_draft_materials SET review_status=? WHERE draft_id=? AND version=?',
      review,
      d.id,
      d.version,
    );
    await dispatch(f, 2);
    assert.deepEqual(f.attempts(), [f.ordered[0].id]);
    assert.equal(
      f.store.one(
        'SELECT review_status FROM research_draft_materials WHERE draft_id=? AND version=?',
        d.id,
        d.version,
      )!.review_status,
      review,
    );
    assert.equal(f.service.batchSummary(b.id).items[1].state, 'READY');
    assert.equal(f.store.one('SELECT count(*) n FROM auto_skips')!.n, 0);
    assert.equal(f.store.get('autoSenderReason', ''), 'DRAFT_MATERIAL_UNVERIFIED');
    await f.service.verifyDraft(d.id, d.version);
    await dispatch(f, 2);
    assert.deepEqual(
      f.attempts(),
      f.ordered.map((d) => d.id),
    );
  });

for (const change of ['version', 'payload', 'contact'])
  test(`closed batch does not reserve a changed ${change}`, async (t) => {
    const f = await orderedFixture(t),
      b = approve(f),
      d = f.ordered[0];
    await f.service.startBatch(b.id);
    if (change === 'version') f.store.exec('UPDATE drafts SET version=version+1 WHERE id=?', d.id);
    if (change === 'payload')
      f.store.exec("UPDATE drafts SET payload_hash='synthetic-change' WHERE id=?", d.id);
    if (change === 'contact')
      f.store.exec("UPDATE contacts SET email='changed@example.test' WHERE id=?", d.contact_id);
    await dispatch(f);
    f.assertIdle();
    assert.equal(f.service.batchSummary(b.id).items[0].state, 'NEEDS_REPREPARATION');
    assert.equal(f.service.batchSummary(b.id).items[0].code, 'BATCH_MATERIALS_CHANGED');
  });

test('closed batch with revoked approval never starts or reserves', async (t) => {
  const f = await orderedFixture(t),
    b = approve(f);
  f.store.exec('UPDATE auto_batches SET approved_hash=NULL WHERE id=?', b.id);
  await assert.rejects(() => f.service.startBatch(b.id), { code: 'BATCH_APPROVAL_REQUIRED' });
  await dispatch(f);
  f.assertIdle();
});

test('closed batch resumes its already queued packet without preparing or reserving twice', async (t) => {
  const f = await orderedFixture(t),
    b = approve(f);
  await f.service.startBatch(b.id);
  await queueFirst(f);
  await dispatch(f, 3);
  assert.deepEqual(
    f.preparation,
    f.ordered.map((d) => d.id),
  );
  assert.deepEqual(
    f.reservations(),
    f.ordered.map((d) => d.id),
  );
  assert.equal(f.store.one('SELECT count(*) n FROM outbox')!.n, 3);
});

for (const change of ['batch', 'session'])
  test(`closed batch refuses an existing queued packet from another ${change}`, async (t) => {
    const f = await orderedFixture(t),
      b = approve(f);
    const other = f.prepareBatch();
    await f.service.startBatch(b.id);
    await queueFirst(f);
    if (change === 'batch')
      f.store.exec('UPDATE auto_batch_outbox SET item_id=?', other.items[0].id);
    else {
      f.store.exec(
        "INSERT INTO auto_sessions SELECT 'foreign-session',policy_hash,'STOPPED',started_at,stopped_at,reason FROM auto_sessions LIMIT 1",
      );
      f.store.exec("UPDATE auto_outbox SET session_id='foreign-session'");
    }
    await dispatch(f);
    f.assertIdle();
    assert.equal(f.preparation.length, 1);
    assert.equal(f.service.state().status, 'BATCH_SCOPE_CHANGED');
    assert.equal(f.service.deliveryAuthority().enabled, false);
  });

test('continuous AUTO retains its existing newest-draft selection outside a closed batch', async (t) => {
  const f = await orderedFixture(t),
    newest = f.service.draftRows()[0];
  await f.service.startAuto();
  await dispatch(f);
  assert.deepEqual(f.attempts(), [newest.id]);
});

for (const lostAck of [false, true])
  test(`closed browser batch preserves ordinal and a single action per reservation; lost ACK=${lostAck}`, async (t) => {
    const f = await orderedFixture(t, true),
      b = approve(f),
      worker = 'synthetic-order-worker';
    const actions: string[] = [];
    f.gateway.send = async () => assert.fail('Browser transport must never fall back to Gmail API');
    f.assertIdle();
    assert.equal(f.store.one('SELECT count(*) n FROM browser_deliveries')!.n, 0);
    await f.service.startBatch(b.id);
    const scope = f.service.browserDelivery.attach(worker).scope;
    for (let i = 0; i < (lostAck ? 1 : 3); i++) {
      f.advance();
      const work = f.service.dispatchOne();
      for (
        let wait = 0;
        wait < 200 && !f.store.one("SELECT id FROM browser_deliveries WHERE state='WAITING'");
        wait++
      )
        await new Promise((resolve) => setTimeout(resolve, 5));
      const payload = f.service.browserDelivery.claim(worker, scope);
      assert.ok(payload, 'Expected a real broker job from the synthetic dispatch');
      f.service.browserDelivery.authorize(
        worker,
        payload.id,
        {
          url: 'https://mail.google.com/mail/u/0/#inbox',
          composeId: 'synthetic-compose-' + i,
          account: payload.sender,
          sender: payload.sender,
          replyTo: '',
          to: [payload.recipient],
          cc: [],
          bcc: [],
          subject: payload.subject,
          body: payload.body,
          attachments: payload.attachment
            ? [{ name: payload.attachment.name, complete: true }]
            : [],
        },
        scope,
      );
      f.service.browserDelivery.check(worker, payload.id, scope);
      actions.push(payload.recipient);
      assert.throws(() => f.service.browserDelivery.check(worker, payload.id, scope), {
        code: 'BROWSER_STALE',
      });
      if (lostAck) f.service.browserDelivery.fail(payload.id);
      else
        f.service.browserDelivery.complete(worker, payload.id, {
          acknowledged: true,
          url: 'https://mail.google.com/mail/u/0/#sent',
          candidateId: null,
        });
      await work;
    }
    const expected = lostAck ? f.ordered.slice(0, 1) : f.ordered;
    assert.deepEqual(
      actions,
      expected.map((d) => d.email),
    );
    assert.deepEqual(
      f.attempts(),
      expected.map((d) => d.id),
    );
    assert.deepEqual(
      f.reservations(),
      expected.map((d) => d.id),
    );
    assert.equal(f.gateway.posts.length, 0);
    if (lostAck) {
      assert.equal(f.service.batchSummary(b.id).state, 'NEEDS_RESOLUTION');
      f.service.control('stop');
      await assert.rejects(() => f.service.startBatch(b.id), { code: 'SEND_UNKNOWN' });
      const restarted = new AutoPolicyJobHunter(f.store, f.options);
      await restarted.dispatchOne();
      assert.deepEqual(f.attempts(), [f.ordered[0].id]);
      restarted.control('stop');
    }
  });
