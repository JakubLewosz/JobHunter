import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { startupFixture } from './helpers/browser-startup.js';
import { BrowserBatchTask } from '../apps/server/src/browser/batch-task.js';
import { BrowserExecutorClient } from '../apps/server/src/browser/client.js';
import { GmailBrowserExecutor } from '../apps/server/src/browser/executor.js';
const origin = 'http://127.0.0.1:19019';
const tab = { url: async () => origin + '/fixture' } as any;

test('cold disconnected executor never dispatches Start, creates a session or reserves', async (t) => {
  const f = await startupFixture(t, origin);
  await assert.rejects(f.start(), /No confirmed executor/);
  assert.equal(f.startDispatches(), 0);
  assert.deepEqual(Object.values(f.counts()), [0, 0, 0, 0]);
});

test('reproduction: early attach pins MANUAL and cannot be used for the later BATCH', async (t) => {
  const f = await startupFixture(t, origin);
  assert.equal((await f.client.attach()).scope.kind, 'MANUAL');
  await f.prepare(tab);
  await f.start();
  const state = await f.client.attach();
  assert.equal(state.scope.kind, 'BATCH');
  await assert.rejects(f.client.next(state.scope), /BROWSER_SESSION_CHANGED/);
  assert.equal(f.counts().send_attempts, 0);
});

for (const failure of ['none', 'prepare', 'unknown'])
  test(`probe MANUAL → one Start → same continuous worker; first-action outcome=${failure}`, async (t) => {
    const f = await startupFixture(t, origin);
    assert.equal((await f.prepare(tab)).scope.kind, 'MANUAL');
    await f.start();
    const actions: string[] = [];
    t.mock.method(GmailBrowserExecutor.prototype, 'prepare', async (p) => {
      if (failure === 'prepare') throw Error('FIXTURE_PREPARE_FAILURE');
      return {
        url: origin,
        composeId: 'fictional',
        account: p.sender,
        sender: p.sender,
        replyTo: '',
        to: [p.recipient],
        cc: [],
        bcc: [],
        subject: p.subject,
        body: p.body,
        attachments: p.attachment ? [{ name: p.attachment.name, complete: true }] : [],
      };
    });
    t.mock.method(GmailBrowserExecutor.prototype, 'clickSend', async (observation, check) => {
      await check?.();
      actions.push(observation.to[0]);
      if (failure === 'unknown') throw Error('FIXTURE_ACK_LOST');
    });
    t.mock.method(GmailBrowserExecutor.prototype, 'receipt', async () => ({
      acknowledged: true,
      url: origin + '/fixture',
      candidateId: null,
    }));
    const task = new BrowserBatchTask(f.client, tab, {
      taskId: 'fixture',
      deadlineMs: Date.now() + 20000,
      fixtureOrigin: origin,
    });
    const running = task.run();
    try {
      for (let i = 0; i < (failure === 'none' ? 3 : 1); i++) {
        f.advance();
        await f.service.dispatchOne();
      }
      f.stop();
      await running;
      await task.close();
      assert.equal(f.startDispatches(), 1);
      assert.deepEqual(
        actions,
        failure === 'prepare'
          ? []
          : f.ordered.slice(0, failure === 'none' ? 3 : 1).map((d) => d.email),
      );
      assert.equal(f.counts().send_attempts, failure === 'none' ? 3 : 1);
      assert.equal(f.counts().usage_ledger, failure === 'none' ? 3 : 1);
      const attempts = f.store.all('SELECT state FROM send_attempts ORDER BY rowid');
      if (failure === 'unknown') assert.equal(attempts[0].state, 'SEND_UNKNOWN');
      if (failure === 'prepare') assert.equal(attempts[0].state, 'FAILED_NOT_SENT');
      await f.service.dispatchOne();
      assert.equal(f.counts().send_attempts, failure === 'none' ? 3 : 1);
      assert.equal(f.gateway.posts.length, 0);
      assert.equal(f.service.deliveryAuthority().enabled, false);
      assert.equal(f.service.browserDelivery.status().connected, false);
    } finally {
      f.stop();
      await task.close();
    }
  });

test('lost Start response records dispatch and native session; never repeats or creates another worker', async (t) => {
  const f = await startupFixture(t, origin);
  await f.prepare(tab);
  await assert.rejects(f.start(true), /START_RESPONSE_UNKNOWN/);
  assert.equal(f.service.batchSummary(f.batch.id).state, 'RUNNING');
  await assert.rejects(f.start(), /never repeated/);
  assert.equal(f.startDispatches(), 1);
  assert.equal(f.counts().auto_sessions, 1);
  assert.equal(f.counts().send_attempts, 0);
});

for (const phase of ['tab', 'probe'])
  test(`Stop during ${phase}, including delayed callback, cannot cause a late Start`, async (t) => {
    const f = await startupFixture(t, origin);
    let finish!: () => void;
    const held = new Promise<void>((resolve) => {
      finish = resolve;
    });
    if (phase === 'probe') {
      const probe = f.client.probe.bind(f.client);
      t.mock.method(f.client, 'probe', async (signal) => {
        const state = await probe(signal);
        await held;
        return state;
      });
    }
    const work = f.prepare(
      phase === 'tab'
        ? ({
            url: async () => {
              await held;
              return origin;
            },
          } as any)
        : tab,
    );
    await delay(20);
    f.stop();
    finish();
    await assert.rejects(work);
    await assert.rejects(f.start());
    assert.equal(f.startDispatches(), 0);
    assert.equal(f.counts().auto_sessions, 0);
  });

test('lost card before readiness does not even attach or Start', async (t) => {
  const f = await startupFixture(t, origin);
  await assert.rejects(
    f.prepare({
      url: async () => {
        throw Error('TAB_LOST');
      },
    } as any),
    /TAB_LOST/,
  );
  assert.equal(f.service.browserDelivery.status().connected, false);
  await assert.rejects(f.start());
  assert.equal(f.startDispatches(), 0);
});

test('another worker, changed backend/manual generation and expired lease block pre-Start', async (t) => {
  const f = await startupFixture(t, origin);
  await f.prepare(tab);
  await assert.rejects(new BrowserExecutorClient(f.dir).probe(), /BROWSER_BUSY/);
  // Fault injection remains inside isolated DEVELOPMENT data.
  (f.service.browserDelivery as any).worker.seen -= 46000;
  await assert.rejects(f.start());
  await assert.rejects(f.client.probe(), /BROWSER_LEASE_EXPIRED/);
  assert.equal(f.startDispatches(), 0);
});

for (const change of ['backendId', 'generation'])
  test(`readiness refuses changed ${change} before Start`, async (t) => {
    const f = await startupFixture(t, origin);
    const probe = f.client.probe.bind(f.client);
    t.mock.method(f.client, 'probe', async (signal) => {
      const state = await probe(signal);
      return change === 'backendId'
        ? { ...state, backendId: 'other' }
        : { ...state, scope: { ...state.scope, generation: 'other' } };
    });
    await assert.rejects(f.prepare(tab));
    await assert.rejects(f.start());
    assert.equal(f.startDispatches(), 0);
  });

test('caller RPC timeout leaves the awaited host running; observe same instance, never run twice', async (t) => {
  const f = await startupFixture(t, origin);
  await f.prepare(tab);
  await f.start();
  const task = new BrowserBatchTask(f.client, tab, {
    taskId: 'fixture',
    deadlineMs: Date.now() + 15000,
    fixtureOrigin: origin,
  });
  const work = task.run();
  try {
    const readyDeadline = Date.now() + 10000;
    while (task.status().status === 'CONNECTING' && Date.now() < readyDeadline) await delay(5);
    assert.equal(task.status().status, 'RUNNING');
    const reply = await Promise.race([work, delay(50).then(() => 'RPC_TIMEOUT')]);
    assert.equal(reply, 'RPC_TIMEOUT');
    assert.equal(task.status().status, 'RUNNING');
    assert.equal(f.service.browserDelivery.status().connected, true);
    await assert.rejects(task.run(), /ALREADY_STARTED/);
    await assert.rejects(f.start(), /never repeated/);
    f.stop();
    await work;
    assert.equal(f.startDispatches(), 1);
    assert.equal(f.counts().auto_sessions, 1);
    assert.equal(f.counts().send_attempts, 0);
  } finally {
    f.stop();
    await task.close();
  }
});
