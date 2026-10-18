import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserBatchController } from '../apps/server/src/browser/batch-controller.js';
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
