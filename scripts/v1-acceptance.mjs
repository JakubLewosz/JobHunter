// Synthetic acceptance ONLY. Own temporary history, providers, PDF and loopback
// page. Run with ordinary Node; the active Codex tool imports only the existing
// browser-executor.mjs. No production paths or account can be supplied.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { Store } from '../dist/apps/server/src/db.js';
import { AutoPolicyJobHunter } from '../dist/apps/server/src/auto-policy.js';
import {
  NightflowCoordinator,
  selectNightflowRefreshQueue,
} from '../dist/apps/server/src/nightflow.js';
import { RemoteNightflowHost } from '../dist/apps/server/src/browser/nightflow-host.js';
import { FixtureReader, FixtureRunner } from '../dist/apps/server/src/testing/research-fixture.js';
import { FixtureGmail } from '../dist/apps/server/src/testing/gmail-fixture.js';
import { runningBuildIdentity } from '../dist/apps/server/src/build-identity.js';
import { hash } from '../dist/apps/server/src/util.js';
import { createLocalFixturePage } from './local-fixture-page.mjs';

if (process.argv.length !== 4 || process.argv[2] !== '--out') throw Error('NEW_OUTPUT_REQUIRED');
const out = resolve(process.argv[3]);
if (existsSync(out)) throw Error('NEW_OUTPUT_REQUIRED');
mkdirSync(out, { recursive: true });
const save = (name, data) => writeFileSync(join(out, name), JSON.stringify(data, null, 2));
const root = mkdtempSync(join(tmpdir(), 'jh-v1-acceptance-')),
  dir = join(root, 'data');
const page = await createLocalFixturePage(),
  store = new Store(dir);
let time = Date.parse('2026-10-26T10:00:00Z'),
  blockedURL,
  renewing = false;
class Reader extends FixtureReader {
  async read(url, signal) {
    const source = await super.read(url, signal),
      n = new URL(url).hostname.match(/fixture(\d+)/)[1];
    source.text = source.text
      .replaceAll('Fixture Company', `Fixture Company ${n}`)
      .replaceAll('fixture.example.test', `fixture${n}.example.test`);
    source.fragment = source.text;
    source.fetched_at = new Date(time).toISOString();
    source.content_hash = hash(
      source.text + (renewing ? 'changed raw wrapper' : 'original wrapper'),
    );
    if (renewing && url === blockedURL)
      return { ...source, status: 'TIMEOUT', text: '', fragment: '', content_hash: null };
    return source;
  }
}
class Runner extends FixtureRunner {
  async run(prompt, schema, options) {
    const result = await super.run(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const sources = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
      const n = new URL(sources[0].url).hostname.match(/fixture(\d+)/)[1],
        v = result.value;
      v.company = `Fixture Company ${n}`;
      v.companyURL = `https://fixture${n}.example.test`;
      v.companyProof.quote = v.company;
      v.contact.email = `hr@fixture${n}.example.test`;
      v.contact.proof.quote = `Rekrutacja: hr@fixture${n}.example.test.`;
      result.value = schema.parse(v);
    }
    return result;
  }
}
const gateway = new FixtureGmail(),
  reader = new Reader(),
  runner = new Runner();
const providers = {
  gateway,
  accountInfo: () => gateway.info,
  reader,
  runner,
  fixtureBrowserOrigin: page.origin,
  clock: () => new Date(time),
  search: {
    search: async () => ({
      urls: [1, 2, 3].map((n) => ({
        url: `https://fixture${n}.example.test/careers`,
        contactUrl: null,
      })),
      queries: ['synthetic acceptance'],
    }),
  },
};
let service = new AutoPolicyJobHunter(store, providers),
  host,
  coordinator;
const abort = new AbortController(),
  started = performance.now();
const timeout = setTimeout(() => abort.abort(), 10 * 60000);
const cancel = () => abort.abort();
process.once('SIGINT', cancel);
process.once('SIGTERM', cancel);
const stopWatcher = setInterval(() => {
  if (existsSync(join(out, 'STOP_FIXTURE'))) abort.abort();
}, 500);
let report = {
  schema: 1,
  code: runningBuildIdentity,
  platform: process.platform,
  node: process.version,
  startedAt: new Date().toISOString(),
  synthetic: true,
  realGmailActions: 0,
  cycles: [],
  passed: false,
};
try {
  service.approveProfile();
  const cv = service.uploadCV(
    'Fixture.pdf',
    Buffer.from('%PDF-1.4\nFictional only\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  await service.configureLocalHistory({ confirmedHistory: true, confirmedSingleWorkstation: true });
  await service.setSendTransport({
    transport: 'GMAIL_BROWSER',
    confirmed: true,
    outgoingViewConsent: true,
  });
  service.browserDelivery.attach('fixture-configuration-only');
  service.configurePolicy({
    senderEmail: gateway.info.email,
    cvId: cv.id,
    contactKinds: ['GENERAL', 'RECRUITMENT'],
    contactTypes: ['ACTIVE', 'OPEN', 'PROSPECT'],
    searchScope: 'Fictional paid remote programming in Poland',
    sessionLimit: null,
    dailyLimit: null,
    sendIntervalSeconds: 60,
    researchIntervalSeconds: 60,
    confirmed: true,
    targetedHistoryConsent: true,
  });
  service.browserDelivery.release('fixture-configuration-only');
  await service.probe('codex');
  await service.probe('search');
  await service.startLibraryResearch(undefined, 2);
  await service.tick();
  service.control('stop');
  service.finishPartial();
  assert.equal(service.draftRows().length, 3);
  const ordered = selectNightflowRefreshQueue(service.nightflowCandidates(), 2, () => '');
  const B = service.draftRows().find((d) => d.id === ordered[1]);
  blockedURL = `https://${B.email.split('@')[1]}/careers`;
  const versions = new Map(service.draftRows().map((d) => [d.id, d.version]));
  renewing = true;
  gateway.send = async () => assert.fail('API SEND FORBIDDEN');
  await service.browserDelivery.listen();
  for (const cycle of ['T1', 'T2']) {
    if (cycle === 'T2') {
      // Each cycle reconnects only after the previous owner's full cleanup.
      await service.stopWorker();
      await service.browserDelivery.close();
      service = new AutoPolicyJobHunter(store, providers);
      await service.browserDelivery.listen();
      time += 24 * 3600000;
    }
    host = new RemoteNightflowHost(() => service.browserDelivery);
    const events = [];
    coordinator = new NightflowCoordinator(store, service, {
      installation: 'synthetic-v1',
      clock: providers.clock,
      host,
      boundary: async (phase) => events.push({ phase, at: new Date().toISOString() }),
      wait: async (_ms, signal) => {
        await delay(2500, undefined, { signal });
        time += 61000;
      },
    });
    const plan = {
      schema: 1,
      id: 'synthetic-' + cycle,
      version: 1,
      installation: 'synthetic-v1',
      goal: 'Fictional paid remote regular programming',
      binding: service.nightflowBinding(),
      researchHours: 2,
      afterResearchHours: 24,
      discovery: false,
      exhaustion: 'FINISH',
      selection: 'VERIFIED_FIT_THEN_CHANNEL_THEN_AGE',
      maxItems: 2,
      limits: { daily: null, session: null, unlimitedExplicit: true },
      intervalSeconds: 60,
      window: { start: '00:00', end: '23:59', timezone: service.campaign().timezone },
      empty: 'REPORT_WITHOUT_SEND',
    };
    coordinator.savePlan(plan, true);
    let work, resolveDone, resolveAck;
    const done = new Promise((r) => {
        resolveDone = r;
      }),
      ack = new Promise((r) => {
        resolveAck = r;
      });
    host.bind(
      coordinator,
      () => {
        work = coordinator.start(plan.id);
        work.then(
          (result) => resolveDone({ result }),
          (error) => resolveDone({ error: error.message }),
        );
      },
      resolveAck,
    );
    const stop = () => {
      coordinator.stop();
      if (!work) resolveDone({ error: 'FIXTURE_ABORTED' });
    };
    abort.signal.addEventListener('abort', stop, { once: true });
    save(cycle + '-ready.json', {
      dir,
      url: page.url + '&multi',
      origin: page.origin,
      code: runningBuildIdentity,
      state: 'STOPPED_OWNER_READY',
      cycle,
    });
    console.log(cycle + '_STOPPED_OWNER_READY');
    try {
      const outcome = await done;
      if (outcome.error) throw Error(outcome.error);
      await Promise.race([ack, delay(2000)]);
      const result = outcome.result;
      assert.equal(result.state, 'COMPLETED', JSON.stringify(result));
      assert.equal(result.authority, false);
      assert.equal(service.state().stopped, true);
      const attempts = store.all('SELECT recipient,state FROM send_attempts ORDER BY rowid');
      assert.equal(attempts.length, 2);
      assert.equal(new Set(attempts.map((a) => a.recipient)).size, 2);
      // Local page supplies a real UI ACK, no fabricated Gmail API receipt.
      assert.ok(attempts.every((a) => a.state === 'SENT_PROVIDER'));
      assert.equal(
        store.one("SELECT count(*) n FROM browser_deliveries WHERE state='ACKNOWLEDGED'").n,
        2,
      );
      assert.equal(store.one('SELECT count(*) n FROM usage_ledger').n, 2);
      assert.equal(gateway.posts.length, 0);
      if (cycle === 'T1') {
        assert.deepEqual(
          result.checkpoint.refreshResults.map((r) => r.code),
          ['CHECKED', 'STALE_EVIDENCE', 'CHECKED'],
        );
        for (const d of service.draftRows().filter((d) => d.id !== B.id))
          assert.ok(d.version > versions.get(d.id));
        assert.equal(store.one('SELECT count(*) n FROM auto_batch_plan_grants').n, 1);
        assert.equal(store.one('SELECT approved_at FROM auto_batches').approved_at, null);
      } else {
        assert.equal(result.reason, 'NO_READY_ITEMS');
        assert.equal(store.one('SELECT count(*) n FROM auto_batches').n, 1);
      }
      report.cycles.push({
        cycle,
        result,
        attempts,
        events,
        host: host.diagnostics(),
        usage: store.one('SELECT count(*) n FROM usage_ledger').n,
      });
      save(cycle + '-result.json', report.cycles.at(-1));
    } finally {
      abort.signal.removeEventListener('abort', stop);
      await work;
      host.dispose();
    }
  }
  const before = store.all('SELECT * FROM usage_ledger');
  await service.browserDelivery.close();
  await service.stopWorker();
  service = new AutoPolicyJobHunter(store, providers);
  assert.equal(service.state().stopped, true);
  assert.equal(service.deliveryAuthority().enabled, false);
  assert.deepEqual(store.all('SELECT * FROM usage_ledger'), before);
  assert.equal(store.one('SELECT count(*) n FROM send_attempts').n, 2);
  report.restart = { stopped: true, sendAuthority: false, attempts: 2, usage: 2 };
  report.metrics = {
    readerCalls: reader.calls,
    modelCalls: runner.prompts.length,
    recordedModelUsage: store.all(
      'SELECT stage,count(*) calls,sum(input_tokens) inputTokens,sum(output_tokens) outputTokens FROM model_calls GROUP BY stage',
    ),
  };
  report.passed = true;
} catch (e) {
  report.error = e.stack;
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  clearInterval(stopWatcher);
  process.removeListener('SIGINT', cancel);
  process.removeListener('SIGTERM', cancel);
  abort.abort();
  coordinator?.stop();
  host?.dispose();
  service.control('stop');
  await service.stopWorker();
  await service.browserDelivery.close();
  store.close();
  await page.close();
  rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  report.cleanup = {
    storeClosed: true,
    localPageClosed: true,
    profileRemoved: !existsSync(root),
    sendAuthority: false,
  };
  report.elapsedMs = performance.now() - started;
  report.endedAt = new Date().toISOString();
  save('acceptance-result.json', report);
  console.log(
    JSON.stringify({ passed: report.passed, error: report.error, cleanup: report.cleanup }),
  );
}
