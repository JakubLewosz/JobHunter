// Native half of the idle Computer Use test. All data is temporary and fictional.
// It never calls Start, creates an AUTO batch/reservation, or enqueues a delivery.
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { Store } from '../dist/apps/server/src/db.js';
import { BrowserDeliveryBroker } from '../dist/apps/server/src/browser/broker.js';
import { runningBuildIdentity } from '../dist/apps/server/src/build-identity.js';
import { createLocalFixturePage } from './local-fixture-page.mjs';

if (process.argv.length !== 4 || process.argv[2] !== '--out')
  throw Error('FIXTURE_OUTPUT_REQUIRED');
const out = resolve(process.argv[3]);
mkdirSync(out, { recursive: true });
const root = mkdtempSync(join(tmpdir(), 'jh-idle-browser-fixture-'));
const store = new Store(root);
const page = await createLocalFixturePage();
// Only a synthetic broker context; there are no AUTO sessions or send rights.
store.set('browserExecutionContext', {
  batchId: 'synthetic-idle-batch',
  sessionId: 'synthetic-idle-session',
  generation: 'synthetic-idle-generation',
  state: 'RUNNING',
});
const broker = new BrowserDeliveryBroker(store, { fixtureOrigin: page.origin });
const result = {
  startedAt: new Date().toISOString(),
  build: runningBuildIdentity,
  synthetic: true,
  minimumActiveMs: 660000,
  activeMs: 0,
  samples: 0,
  disconnectedAfterAttach: false,
  passed: false,
};
let activeAt,
  maxGap = 0,
  previous,
  samples = [];
try {
  await broker.listen();
  writeFileSync(
    join(out, 'fixture-ready.json'),
    JSON.stringify({
      dir: root,
      url: page.url,
      origin: page.origin,
      minimumActiveMs: result.minimumActiveMs,
    }),
  );
  console.log(
    JSON.stringify({
      stage: 'SYNTHETIC_READY',
      url: page.url,
      minimumActiveMs: result.minimumActiveMs,
    }),
  );
  const limit = performance.now() + 15 * 60000;
  while (performance.now() < limit) {
    if (existsSync(join(out, 'STOP_FIXTURE'))) throw Error('FIXTURE_CANCELLED');
    const connected = broker.status().connected;
    if (connected && activeAt === undefined) activeAt = performance.now();
    if (activeAt !== undefined) {
      result.activeMs = performance.now() - activeAt;
      result.samples++;
      if (previous !== undefined) maxGap = Math.max(maxGap, performance.now() - previous);
      previous = performance.now();
      if (!connected) {
        result.disconnectedAfterAttach = true;
        throw Error('FIXTURE_LEASE_LOST');
      }
      if (samples.length < 1000)
        samples.push({ activeMs: result.activeMs, connected, pending: broker.status().pending });
      writeFileSync(
        join(out, 'fixture-live.json'),
        JSON.stringify({ ...result, maxObserverGapMs: maxGap }),
      );
      if (result.activeMs >= result.minimumActiveMs) break;
    }
    await delay(1000);
  }
  if (result.activeMs < result.minimumActiveMs) throw Error('FIXTURE_INCOMPLETE');
  store.set('browserExecutionContext', {
    batchId: 'synthetic-idle-batch',
    sessionId: 'synthetic-idle-session',
    generation: 'synthetic-idle-generation',
    state: 'STOPPED',
  });
  const releaseDeadline = performance.now() + 10000;
  while (broker.status().connected && performance.now() < releaseDeadline) await delay(100);
  result.released = !broker.status().connected;
  result.counts = Object.fromEntries(
    [
      'auto_batches',
      'auto_sessions',
      'send_attempts',
      'usage_ledger',
      'outbox',
      'browser_deliveries',
    ].map((table) => [table, store.one('SELECT count(*) n FROM ' + table).n]),
  );
  result.passed =
    result.released &&
    Object.values(result.counts).every((n) => n === 0) &&
    !result.disconnectedAfterAttach;
} catch (error) {
  result.code = /^[A-Z_]+$/.test(error.message) ? error.message : 'FIXTURE_FAILED';
} finally {
  await broker.close();
  store.close();
  await page.close();
  if (
    dirname(resolve(root)) !== resolve(tmpdir()) ||
    !basename(root).startsWith('jh-idle-browser-fixture-')
  )
    throw Error('FIXTURE_CLEANUP_PATH');
  rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  result.cleanup = {
    brokerClosed: !existsSync(join(root, 'browser-executor.json')),
    directoryRemoved: !existsSync(root),
    pageClosed: true,
  };
  result.finishedAt = new Date().toISOString();
  result.samplesDetail = samples;
  writeFileSync(join(out, 'fixture-result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, samplesDetail: undefined }));
  if (!result.passed) process.exitCode = 1;
}
