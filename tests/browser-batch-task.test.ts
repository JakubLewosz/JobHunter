import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { Store } from '../apps/server/src/db.js';
import { BrowserDeliveryBroker } from '../apps/server/src/browser/broker.js';
import { BrowserExecutorClient } from '../apps/server/src/browser/client.js';
import { BrowserBatchController } from '../apps/server/src/browser/batch-controller.js';
import { BrowserBatchTask } from '../apps/server/src/browser/batch-task.js';
import { GmailBrowserExecutor, runBrowserDelivery } from '../apps/server/src/browser/executor.js';

async function begin(task: BrowserBatchTask) {
  void task.run().catch(() => {});
  const deadline = Date.now() + 10000;
  while (task.status().status === 'NEW' || task.status().status === 'CONNECTING') {
    if (Date.now() > deadline) throw Error('TASK_READY_TIMEOUT');
    await delay(5);
  }
  if (task.status().status !== 'RUNNING') throw Error(task.status().code ?? 'TASK_NOT_READY');
  return task.status();
}
async function fixture(t: TestContext, clock?: () => number) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-batch-task-'));
  const store = new Store(dir);
  store.set('browserExecutionContext', {
    batchId: 'batch',
    sessionId: 'session',
    generation: 'gen',
    state: 'RUNNING',
  });
  const broker = new BrowserDeliveryBroker(store, { clock });
  await broker.listen();
  const client = new BrowserExecutorClient(dir);
  const tasks: BrowserBatchTask[] = [];
  t.after(async () => {
    await Promise.all(tasks.map((task) => task.close()));
    await broker.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const create = (
    tab: any = { url: async () => 'https://mail.google.com/mail/u/0/#settings/accounts' },
    options: any = {},
  ) => {
    const task = new BrowserBatchTask(client, tab, {
      taskId: 'synthetic',
      deadlineMs: Date.now() + 15000,
      ...options,
    });
    tasks.push(task);
    return task;
  };
  return { store, broker, client, create };
}

test('reproduction: a gap between manual segments still expires the unchanged 45 second lease', async (t) => {
  let now = 0;
  const { client, broker } = await fixture(t, () => now);
  const controller = new BrowserBatchController(
    client,
    {} as any,
    () => now,
    async (ms) => {
      now += ms;
    },
  );
  assert.equal((await controller.segment(1000)).status, 'WAITING');
  now += 46000;
  assert.equal(broker.status().connected, false);
  const result = await controller.segment(1000);
  assert.equal(result.status, 'STOPPED');
  assert.equal(result.code, 'BROWSER_LEASE_EXPIRED');
});

test('one continuous task keeps the same real IPC worker active between independent progress reads', async (t) => {
  const { store, broker, create } = await fixture(t);
  const task = create();
  assert.equal((await begin(task)).status, 'RUNNING');
  const first = task.status();
  await delay(2200);
  assert.ok(task.status().probes > first.probes);
  assert.equal(task.status().deadlineMs, first.deadlineMs);
  assert.equal(broker.status().connected, true);
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  assert.equal(store.one('SELECT count(*) n FROM auto_sessions')!.n, 0);
  await task.close();
  assert.equal(task.status().closed, true);
  assert.equal(task.status().releaseConfirmed, true);
  assert.equal(broker.status().connected, false);
  await assert.rejects(task.run(), /BROWSER_TASK_ALREADY_STARTED/);
});

for (const field of ['generation', 'sessionId', 'batchId'])
  test('continuous task terminates on changed ' + field + ' without adopting it', async (t) => {
    const { store, create } = await fixture(t);
    const task = create();
    await begin(task);
    store.set('browserExecutionContext', {
      batchId: 'batch',
      sessionId: 'session',
      generation: 'gen',
      state: 'RUNNING',
      [field]: 'replacement',
    });
    const result = await task.result();
    assert.equal(result.status, 'STOPPED');
    assert.equal(result.code, 'BROWSER_SESSION_CHANGED');
    assert.equal(result.completed, 0);
  });

for (const state of ['STOPPED', 'COMPLETED', 'COMPLETED_WITH_SKIPS', 'NEEDS_RESOLUTION'])
  test('continuous task stops renewing on native ' + state, async (t) => {
    const { store, broker, create } = await fixture(t);
    const task = create();
    await begin(task);
    store.set('browserExecutionContext', {
      batchId: 'batch',
      sessionId: 'session',
      generation: 'gen',
      state,
    });
    const result = await task.result();
    // Native completion can fence a RUNNING read by changing its scope before
    // the next IPC request. That refusal is also terminal, never a reconnect.
    if (result.status !== state) {
      assert.equal(result.status, 'STOPPED');
      assert.equal(result.code, 'BROWSER_SESSION_CHANGED');
    }
    assert.equal(broker.status().connected, false);
  });

test('task deadline is fixed even if caller changes its options or reads progress', async (t) => {
  const { client } = await fixture(t);
  const options = { taskId: 'synthetic', deadlineMs: Date.now() + 3000 };
  const task = new BrowserBatchTask(
    client,
    { url: async () => 'https://mail.google.com' } as any,
    options,
  );
  await begin(task);
  const original = task.status().deadlineMs;
  options.deadlineMs += 60000;
  task.status();
  assert.equal(task.status().deadlineMs, original);
  const result = await task.result();
  assert.equal(result.code, 'BROWSER_TASK_DEADLINE');
  assert.equal(result.closed, true);
});

test('lost tab, wrong origin and unknown UI fail closed before renewed IPC or jobs', async (t) => {
  const { store, broker, create } = await fixture(t);
  let lost = false;
  const task = create({
    url: async () => {
      if (lost) throw Error('missing tab');
      return 'https://mail.google.com';
    },
  });
  await begin(task);
  lost = true;
  assert.equal((await task.result()).status, 'STOPPED');
  assert.equal(broker.status().connected, false);
  assert.equal(store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
  const wrong = create({ url: async () => 'https://example.invalid' });
  await assert.rejects(wrong.run(), /GMAIL_LOGIN_REQUIRED/);
  await wrong.result();
});

test('abort during tab probe cannot perform a late attach, Start, claim or click', async (t) => {
  const { create, client } = await fixture(t);
  let finish!: (url: string) => void,
    attaches = 0;
  client.attach = async () => {
    attaches++;
    throw Error('UNEXPECTED_ATTACH');
  };
  const signal = new AbortController();
  const task = create(
    {
      url: () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    },
    { signal: signal.signal },
  );
  const start = task.run();
  signal.abort();
  finish('https://mail.google.com');
  await assert.rejects(start, /BROWSER_TASK_ABORTED/);
  await task.result();
  assert.equal(attaches, 0);
});

test('real lease loss is terminal and is never repaired with a new worker', async (t) => {
  let now = 0;
  const { create } = await fixture(t, () => now);
  const task = create();
  await begin(task);
  now += 46000;
  const result = await task.result();
  assert.equal(result.code, 'BROWSER_LEASE_EXPIRED');
  assert.equal(result.status, 'STOPPED');
});

test('no batch or pre-aborted task can activate anything', async (t) => {
  const { store, create } = await fixture(t);
  store.set('browserExecutionContext', null);
  const task = create();
  await assert.rejects(task.run(), /BROWSER_BATCH_REQUIRED/);
  await task.result();
  const abort = new AbortController();
  abort.abort();
  const stopped = create(undefined, { signal: abort.signal });
  await assert.rejects(stopped.run(), /BROWSER_TASK_ABORTED/);
  await stopped.result();
  assert.equal(store.one('SELECT count(*) n FROM auto_sessions')!.n, 0);
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});

test('backend loss is terminal; no reconnect or replacement backend is adopted', async (t) => {
  const { broker, create } = await fixture(t);
  const task = create();
  await begin(task);
  await broker.close();
  const result = await task.result();
  assert.equal(result.status, 'STOPPED');
  // Shutdown may close the socket before its last response is complete.
  assert.ok(
    ['BROWSER_BACKEND_CLOSED', 'BROWSER_PROTOCOL', 'BROWSER_CONNECTION'].includes(result.code!),
  );
  assert.equal(result.releaseConfirmed, false);
});

test('an unavailable tab times out before attach; a late URL cannot resurrect it', async (t) => {
  const { client, create } = await fixture(t);
  let complete!: (url: string) => void,
    attaches = 0;
  client.attach = async () => {
    attaches++;
    throw Error('UNEXPECTED_ATTACH');
  };
  const task = create({
    url: () =>
      new Promise<string>((resolve) => {
        complete = resolve;
      }),
  });
  await assert.rejects(task.run(), /BROWSER_TAB_UNAVAILABLE/);
  await task.result();
  complete('https://mail.google.com');
  await delay(0);
  assert.equal(attaches, 0);
  assert.equal(task.status().closed, true);
});

test('abort cancels action heartbeat even while a UI prepare promise is unresolved', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let entered!: () => void,
    resume!: () => void,
    attaches = 0,
    fails = 0,
    authorizes = 0;
  const reached = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const held = new Promise<void>((resolve) => {
    resume = resolve;
  });
  t.mock.method(GmailBrowserExecutor.prototype, 'prepare', async () => {
    entered();
    await held;
    return {};
  });
  const client = {
    attach: async () => {
      attaches++;
      return {};
    },
    next: async () => ({ id: 'fictional-pending' }),
    authorize: async () => {
      authorizes++;
    },
    fail: async () => {
      fails++;
    },
  };
  const abort = new AbortController();
  const work = runBrowserDelivery(client as any, {} as any, { signal: abort.signal });
  await reached;
  t.mock.timers.tick(10000);
  await delay(0);
  const before = attaches;
  assert.ok(before > 1);
  abort.abort();
  t.mock.timers.tick(30000);
  await delay(0);
  assert.equal(attaches, before);
  resume();
  const result = await work;
  assert.equal(result.status, 'STOPPED');
  assert.equal(result.uncertain, false);
  assert.equal(authorizes, 0);
  assert.equal(fails, 1);
});
