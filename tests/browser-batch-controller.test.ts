import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserBatchController } from '../apps/server/src/browser/batch-controller.js';
import { BrowserDeliveryBroker } from '../apps/server/src/browser/broker.js';
import { BrowserExecutorClient } from '../apps/server/src/browser/client.js';
import { ActiveTaskNightflowBrowserHost } from '../apps/server/src/nightflow-browser-host.js';
import { Store } from '../apps/server/src/db.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
test('active-task browser controller renews bounded segments and pins backend, session and batch', async () => {
  let time = 0,
    calls = 0,
    state = 'RUNNING',
    sessionId = 'session-1';
  const client = {
    attach: async () => {
      calls++;
      return { backendId: 'backend-1', execution: { batchId: 'batch-1', sessionId, state } };
    },
    next: async () => null,
  };
  const controller = new BrowserBatchController(
    client as any,
    {} as any,
    () => time,
    async (ms) => {
      time += ms;
    },
  );
  assert.equal((await controller.segment(3000)).status, 'WAITING');
  assert.ok(calls >= 6);
  assert.equal((await controller.segment(2000)).status, 'WAITING');
  sessionId = 'session-2';
  const changed = await controller.segment(1000);
  assert.equal(changed.code, 'BROWSER_SESSION_CHANGED');
  assert.equal((await controller.segment(1000)).status, 'ENDED');
});
for (const ending of ['STOPPED', 'COMPLETED', 'COMPLETED_WITH_SKIPS', 'NEEDS_RESOLUTION'])
  test('browser controller terminates on ' + ending, async () => {
    const client = {
      attach: async () => ({
        backendId: 'backend',
        execution: { batchId: 'batch', sessionId: 'session', state: ending },
      }),
    };
    const controller = new BrowserBatchController(client as any, {} as any);
    assert.equal((await controller.segment()).status, ending);
    assert.equal((await controller.segment()).status, 'ENDED');
  });
test('browser controller refuses overlapping segments, abort and lease/protocol failures are terminal', async () => {
  let release!: () => void;
  const hold = new Promise<void>((r) => (release = r));
  const client = {
    attach: async () => {
      await hold;
      throw Error('BROWSER_LEASE_EXPIRED');
    },
  };
  const controller = new BrowserBatchController(client as any, {} as any),
    operation = controller.segment();
  await assert.rejects(() => controller.segment(), /BROWSER_CONTROLLER_BUSY/);
  release();
  assert.equal((await operation).code, 'BROWSER_LEASE_EXPIRED');
  const abort = new AbortController();
  abort.abort();
  const other = new BrowserBatchController({} as any, {} as any);
  assert.equal((await other.segment(1000, abort.signal)).status, 'STOPPED');
});
test('active browser host retains its same real IPC lease throughout eight accelerated hours and releases all resources', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-host-heartbeat-')),
    store = new Store(dir);
  let now = 0,
    pulse!: () => Promise<void>,
    cancelled = false;
  const broker = new BrowserDeliveryBroker(store, { clock: () => now });
  const host = new ActiveTaskNightflowBrowserHost(dir, 'synthetic-task', {} as any, (fn) => {
    pulse = fn;
    return () => {
      cancelled = true;
    };
  });
  t.after(async () => {
    await host.close();
    await broker.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await broker.listen();
  await host.initialize();
  for (let i = 0; i < 960; i++) {
    now += 30000;
    await pulse();
    assert.equal(broker.status().connected, true);
  }
  assert.equal(now, 8 * 3600000);
  assert.equal(host.ready(), true);
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  await host.close();
  assert.equal(cancelled, true);
  assert.equal(broker.status().connected, false);
  const replacement = new BrowserExecutorClient(dir);
  await replacement.attach();
  await replacement.release();
  assert.equal(host.ready(), false);
});
test('active browser host reports loss once, stops heartbeat and never attaches itself to a replacement backend', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-host-loss-')),
    store = new Store(dir);
  let pulse!: () => Promise<void>,
    lost = 0,
    cancelled = false;
  const broker = new BrowserDeliveryBroker(store);
  const host = new ActiveTaskNightflowBrowserHost(dir, 'synthetic-task', {} as any, (fn) => {
    pulse = fn;
    return () => {
      cancelled = true;
    };
  });
  let replacement: BrowserDeliveryBroker | undefined;
  t.after(async () => {
    await host.close();
    await replacement?.close();
    await broker.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await broker.listen();
  await host.initialize();
  host.setLossHandler(() => lost++);
  await broker.close();
  replacement = new BrowserDeliveryBroker(store);
  await replacement.listen();
  await assert.rejects(() => pulse(), /BROWSER_HOST_LOST/);
  assert.equal(lost, 1);
  assert.equal(cancelled, true);
  assert.equal(host.ready(), false);
  assert.equal(replacement.status().connected, false);
});
