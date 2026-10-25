// Test/diagnostic procedure only. No new production coordinator or Start API.
import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';
import { setup } from '../auto-fixture.js';
import { AutoPolicyJobHunter } from '../../apps/server/src/auto-policy.js';
import { BrowserExecutorClient } from '../../apps/server/src/browser/client.js';
import type { BrowserTab } from '../../apps/server/src/browser/executor.js';

export async function startupFixture(t: Pick<TestContext, 'after'>, origin: string) {
  const cleanup: (() => unknown)[] = [];
  const f = await setup(
    { after: (fn: () => unknown) => cleanup.push(fn) } as any,
    false,
    true,
    false,
    true,
  );
  const service = new AutoPolicyJobHunter(f.store, { ...f.options, fixtureBrowserOrigin: origin });
  let startDispatches = 0,
    closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    service.control('stop');
    await service.stopWorker();
    await service.browserDelivery.close();
    for (const fn of cleanup) await fn();
  };
  t.after(close);
  await service.setSendTransport({
    transport: 'GMAIL_BROWSER',
    confirmed: true,
    outgoingViewConsent: true,
  });
  service.browserDelivery.attach('fixture-configuration-only');
  service.configurePolicy(f.policy);
  service.browserDelivery.release('fixture-configuration-only');
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (...args) => {
    f.advance(1000);
    return read(...args);
  };
  await service.startLibraryResearch(undefined, 8);
  await service.tick();
  service.control('stop');
  service.finishPartial();
  const ordered = service.draftRows().toReversed().slice(0, 3);
  assert.equal(ordered.length, 3);
  const batch = service.prepareBatch({
    drafts: ordered.map((d) => ({ id: d.id, version: d.version })),
  });
  service.approveClosedBatch(batch.id, { approvalHash: batch.approvalHash, confirmed: true });
  await service.browserDelivery.listen();
  const client = new BrowserExecutorClient(f.dir);
  const abort = new AbortController();
  const expected = service.browserDelivery.status();
  let readiness: typeof expected | undefined;
  // Mirrors HOST_ADAPTER's procedure: real tab, unpinned IPC probe, same
  // backend/manual generation, Stop fence, then one public native Start.
  const prepare = async (tab: BrowserTab) => {
    abort.signal.throwIfAborted();
    const url = await tab.url();
    abort.signal.throwIfAborted();
    assert.equal(new URL(url!).origin, origin);
    const state = await client.probe(abort.signal);
    abort.signal.throwIfAborted();
    assert.equal(service.state().stopped, true);
    assert.deepEqual(state.scope, expected.scope);
    assert.equal(state.backendId, expected.backendId);
    assert.equal(state.connected, true);
    readiness = state;
    return state;
  };
  const start = async (loseResponse = false) => {
    abort.signal.throwIfAborted();
    assert.ok(readiness, 'No confirmed executor readiness: do not call Start');
    assert.equal(
      startDispatches,
      0,
      'Dispatched Start is never repeated, including a lost response',
    );
    const current = service.browserDelivery.status();
    assert.equal(current.connected, true);
    assert.deepEqual(current.scope, readiness.scope);
    startDispatches++; // Before dispatch; a missing reply must not reset this.
    await service.startBatch(batch.id);
    if (loseResponse) throw Error('START_RESPONSE_UNKNOWN');
    return service.batchSummary(batch.id);
  };
  const stop = () => {
    abort.abort();
    readiness = undefined;
    service.control('stop');
  };
  f.gateway.send = async () => assert.fail('No API fallback in browser startup fixture');
  return {
    ...f,
    service,
    client,
    ordered,
    batch,
    prepare,
    start,
    stop,
    close,
    abort,
    startDispatches: () => startDispatches,
    counts: () =>
      Object.fromEntries(
        ['auto_sessions', 'send_attempts', 'usage_ledger', 'browser_deliveries'].map((name) => [
          name,
          f.store.one('SELECT count(*) n FROM ' + name)!.n,
        ]),
      ),
  };
}
