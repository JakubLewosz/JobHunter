import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createServer } from 'node:net';
import { createApp } from '../apps/server/src/app.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { FixtureGmail } from './gmail-fixture.js';

export const stopScenarios = ['slow-read', 'slow-model', 'large-history', 'inflight-post'] as const;
export async function stopScenario(
  t: TestContext,
  scenario: (typeof stopScenarios)[number],
  checkLatency: boolean,
) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-stop-')),
    runner = new FixtureRunner(),
    reader = new FixtureReader(),
    gateway = new FixtureGmail();
  runner.prospect = reader.prospect = true;
  const reservation = createServer();
  await new Promise<void>((r) => reservation.listen(0, '127.0.0.1', r));
  const port = (reservation.address() as { port: number }).port;
  await new Promise<void>((r) => reservation.close(() => r()));
  let time = Date.now(),
    received = 0,
    revoked = 0,
    finished = 0;
  let historyBuildMs = 0,
    historyRows = 0,
    historyBytes = 0,
    postsAtRevoke = 0;
  const result = await createApp({
    dir,
    port,
    mode: 'AUTO_POLICY',
    worker: false,
    researchOptions: { runner, reader, clock: () => new Date(time) },
    gmailOptions: { gateway, accountInfo: () => gateway.info },
    launchToken: 'fictional-stop-token',
  });
  result.app.addHook('onSend', (request, _reply, payload, done) => {
    if (request.url === '/api/companies' && typeof payload === 'string')
      historyBytes = Buffer.byteLength(payload);
    done(null, payload);
  });
  const originalCompanies = result.service.companies.bind(result.service);
  result.service.companies = () => {
    const start = performance.now();
    const rows = originalCompanies();
    historyBuildMs += performance.now() - start;
    historyRows = rows.length;
    return rows;
  };
  await result.app.listen({ host: '127.0.0.1', port });
  const address = result.app.server.address() as { port: number },
    host = `127.0.0.1:${port}`,
    origin = `http://${host}`;
  const url = `http://127.0.0.1:${address.port}`;
  const service = result.service as AutoPolicyJobHunter;
  t.after(async () => {
    await result.app.close();
    rmSync(dir, { recursive: true, force: true });
  });
  service.approveProfile();
  const cv = service.uploadCV(
    'Fictional.pdf',
    Buffer.from('%PDF-1.4\nfixture\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  service.configurePolicy({
    senderEmail: gateway.info.email,
    cvId: cv.id,
    contactKinds: ['GENERAL', 'RECRUITMENT'],
    contactTypes: ['PROSPECT', 'ACTIVE', 'OPEN'],
    searchScope: 'Fikcyjne firmy w Polsce, integracje API',
    sessionLimit: null,
    dailyLimit: null,
    sendIntervalSeconds: 60,
    researchIntervalSeconds: 60,
    confirmed: true,
    targetedHistoryConsent: true,
  });
  await service.configureLocalHistory({
    confirmedHistory: true,
    confirmedSingleWorkstation: true,
  });
  await service.probe('codex');
  await service.probe('search');
  await service.startAuto();
  result.app.server.prependListener('request', (req) => {
    if (req.url === '/api/stop') received = performance.now();
  });
  const revoke = (service as any).revokeSessionAuthority.bind(service);
  (service as any).revokeSessionAuthority = () => {
    revoke();
    revoked = performance.now();
    postsAtRevoke = gateway.posts.length;
  };
  const session = await fetch(url + '/api/session', {
    method: 'POST',
    headers: { host, origin, 'content-type': 'application/json' },
    body: JSON.stringify({ token: result.launchToken }),
  });
  assert.equal(session.status, 200);
  const cookie = session.headers.get('set-cookie')!.split(';')[0],
    csrf = ((await session.json()) as any).csrf;
  const headers = {
    host,
    origin,
    cookie,
    'x-csrf-token': csrf,
    'content-type': 'application/json',
  };
  let ready!: () => void;
  const started = new Promise<void>((r) => {
    ready = r;
  });
  const slow = (signal?: AbortSignal) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 5000);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
      ready();
    });
  let operation: Promise<void>;
  if (scenario === 'slow-read') {
    const read = reader.read.bind(reader);
    reader.read = async (input, signal) => {
      await slow(signal);
      return read(input, signal);
    };
    operation = service.tick();
    await started;
  } else if (scenario === 'slow-model') {
    runner.beforeCall = (prompt) =>
      prompt.includes('Wydobądź firmę')
        ? slow((service as any).controller?.signal)
        : Promise.resolve();
    operation = service.tick();
    await started;
  } else {
    await service.tick();
    time += 61000;
    if (scenario === 'large-history') {
      result.store.atomic(() => {
        for (let i = 0; i < 10000; i++) {
          const c = service.findOrCreateCompany(
            `Synthetic ${i}`,
            `fixture${i}.example.test`,
          ).company;
          result.store.exec(
            'INSERT INTO evidence VALUES (?,?,?,?,?,?,?,?,?)',
            `e-${i}`,
            c.id,
            `https://fixture${i}.example.test`,
            service.now(),
            'synthetic-hash',
            'Syntetyczny kontakt',
            'READ',
            service.now(),
            service.now(),
          );
          result.store.exec(
            'INSERT INTO contacts (id,company_id,email,kind,evidence_id,verification_status,verified_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
            `t-${i}`,
            c.id,
            `kontakt@fixture${i}.example.test`,
            'GENERAL',
            `e-${i}`,
            'NEEDS_REVIEW',
            service.now(),
            service.now(),
            service.now(),
          );
        }
      });
      operation = Promise.resolve();
    } else {
      const send = gateway.send.bind(gateway);
      gateway.send = async (...args) => {
        const sent = await send(...args);
        ready();
        await new Promise((r) => setTimeout(r, 350));
        finished = performance.now();
        return sent;
      };
      operation = service.dispatchOne();
      await started;
    }
  }
  const at = performance.now();
  const refreshes = Array.from({ length: 3 }, (_, i) =>
    fetch(url + (scenario === 'large-history' && i === 1 ? '/api/companies' : '/api/dashboard'), {
      headers,
    }),
  );
  const response = await fetch(url + '/api/stop', { method: 'POST', headers, body: '{}' });
  const answered = performance.now();
  assert.equal(response.status, 200);
  assert.equal(service.state().stopped, true);
  const posts = gateway.posts.length;
  await operation;
  await Promise.all(refreshes);
  await service.dispatchOne();
  assert.equal(gateway.posts.length, posts, 'Stop prevents any new POST');
  assert.equal(
    gateway.posts.length,
    postsAtRevoke,
    'no new POST after authority revocation, including before HTTP response',
  );
  const measurements = {
    scenario,
    requestReceivedMs: +(received - at).toFixed(2),
    rightsRevokedMs: +(revoked - at).toFixed(2),
    responseMs: +(answered - at).toFixed(2),
    inflightFinishedMs: finished ? +(finished - at).toFixed(2) : null,
    companies: result.store.one('SELECT count(*) n FROM companies')!.n,
    historyBuildMs: +historyBuildMs.toFixed(2),
    historyRows,
    historyBytes,
    timingMode: checkLatency ? 'ISOLATED' : 'FULL_SUITE',
  };
  t.diagnostic(JSON.stringify(measurements));
  assert.ok(revoked >= received, 'authority was revoked after reception');
  if (checkLatency) {
    assert.ok(received - at < 1000, 'API reception must not wait multiple seconds');
    assert.ok(
      revoked - received < 100,
      'revoke within controller, independent of provider completion',
    );
  }
  if (finished) assert.ok(finished > revoked);
}
