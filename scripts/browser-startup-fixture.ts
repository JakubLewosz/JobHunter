// Diagnostic ONLY: fresh temporary DEVELOPMENT, fictional CV/contacts/providers,
// existing public closed-batch Start and broker, own loopback page. Never accepts
// a production data directory, policy, account, batch or recipient.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { startupFixture } from '../tests/helpers/browser-startup.js';
// @ts-ignore -- existing JavaScript fixture server
import { createLocalFixturePage } from './local-fixture-page.mjs';

if (process.argv.length !== 4 || process.argv[2] !== '--out')
  throw Error('FIXTURE_OUTPUT_REQUIRED');
const out = resolve(process.argv[3]);
if (existsSync(out)) throw Error('FIXTURE_NEW_OUTPUT_REQUIRED');
mkdirSync(out, { recursive: true });
const save = (name: string, data: unknown) =>
  writeFileSync(join(out, name), JSON.stringify(data, null, 2));
const cleanups: (() => unknown)[] = [];
const page = await createLocalFixturePage();
let f: Awaited<ReturnType<typeof startupFixture>> | undefined;
const result: any = {
  synthetic: true,
  productionStarts: 0,
  productionAttempts: 0,
  productionSends: 0,
  startDispatches: 0,
  passed: false,
};
try {
  f = await startupFixture({ after: (fn: () => unknown) => cleanups.push(fn) } as any, page.origin);
  const expected = f.service.browserDelivery.status();
  assert.equal(expected.connected, false);
  assert.equal(f.service.deliveryAuthority().enabled, false);
  save('fixture-ready.json', {
    dir: f.dir,
    url: page.url + '&multi',
    origin: page.origin,
    backendId: expected.backendId,
    scope: expected.scope,
  });
  console.log(JSON.stringify({ event: 'STOPPED_FIXTURE_READY', url: page.url }));
  const until = Date.now() + 180000;
  while (!existsSync(join(out, 'host-ready.json'))) {
    if (Date.now() >= until || existsSync(join(out, 'STOP_FIXTURE')))
      throw Error('READINESS_NOT_CONFIRMED');
    await delay(100);
  }
  const host = JSON.parse(readFileSync(join(out, 'host-ready.json'), 'utf8'));
  assert.ok(Date.now() - host.observedAt >= 0 && Date.now() - host.observedAt < 5000);
  assert.equal(host.origin, page.origin);
  assert.deepEqual(host.state.scope, expected.scope);
  const live = f.service.browserDelivery.status();
  assert.equal(live.connected, true);
  assert.deepEqual(live.scope, expected.scope);
  assert.equal(f.service.state().stopped, true);
  result.startDispatches++; // No catch/retry; missing ACK remains UNKNOWN.
  await f.service.startBatch(f.batch.id);
  save('start-ack.json', {
    state: f.service.batchSummary(f.batch.id).state,
    backendId: live.backendId,
    scope: f.service.browserDelivery.status().scope,
  });
  for (let i = 0; i < 3; i++) {
    assert.equal(f.service.browserDelivery.status().connected, true);
    f.advance();
    await f.service.dispatchOne();
    const states = f.store.all('SELECT state FROM send_attempts ORDER BY rowid');
    if (states.some((a) => ['SENDING', 'SEND_UNKNOWN', 'FAILED_NOT_SENT'].includes(a.state)))
      throw Error('FIXTURE_ATTEMPT_NOT_CONFIRMED');
    // Only the explicit multi-page auto-dismisses its old ACK. The production
    // driver must still refuse an old banner; do not weaken that comparison.
    if (i < 2) await delay(2500);
  }
  result.attemptRecipients = f.store
    .all('SELECT recipient FROM send_attempts ORDER BY rowid')
    .map((a) => a.recipient);
  assert.deepEqual(
    result.attemptRecipients,
    f.ordered.map((d) => d.email),
  );
  result.counts = f.counts();
  assert.equal(result.counts.auto_sessions, 1);
  assert.equal(result.counts.send_attempts, 3);
  assert.equal(result.counts.usage_ledger, 3);
  assert.equal(f.gateway.posts.length, 0);
  result.batchState = f.service.batchSummary(f.batch.id).state;
  assert.equal(result.batchState, 'COMPLETED');
  f.stop();
  const releaseUntil = Date.now() + 10000;
  while (f.service.browserDelivery.status().connected && Date.now() < releaseUntil)
    await delay(100);
  result.released = !f.service.browserDelivery.status().connected;
  assert.equal(result.released, true);
  result.authority = f.service.deliveryAuthority().enabled;
  assert.equal(result.authority, false);
  result.passed = true;
} catch (error: any) {
  result.error = error.message;
} finally {
  const dir = f?.dir;
  for (const cleanup of cleanups) await cleanup();
  await page.close();
  result.cleanup = {
    profileRemoved: !dir || !existsSync(dir),
    backendClosed: true,
    localPageClosed: true,
    state: 'STOPPED',
    sendAuthority: false,
  };
  save('fixture-result.json', result);
}
console.log(JSON.stringify(result));
if (!result.passed) process.exitCode = 1;
