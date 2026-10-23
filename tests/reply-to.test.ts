import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../apps/server/src/db.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { GmailApi } from '../apps/server/src/gmail/reader.js';
import {
  replyToEvidence,
  sendAsFields,
  type SendAsRead,
} from '../apps/server/src/gmail/send-as.js';
import { sendAsOnlyRequest } from '../apps/server/src/gmail/identity-diagnostic.js';
import { gmailReadScope } from '../apps/server/src/gmail/oauth.js';
import { GmailBrowserExecutor } from '../apps/server/src/browser/executor.js';
import { BrowserExecutorClient } from '../apps/server/src/browser/client.js';
import type { ComposeObservation } from '../apps/server/src/browser/contracts.js';
import { FixtureGmail } from './gmail-fixture.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';

const info = () => ({
  email: 'owner@example.test',
  subject: 'fictional-account',
  scopes: ['openid', 'email', gmailReadScope],
  connectedAt: new Date().toISOString(),
});
const policy = () => ({
  email: info().email,
  subject: info().subject,
  transport: 'GMAIL_BROWSER' as const,
  revision: 'fixture-revision',
});
const setting = () => ({ sendAsEmail: info().email, isPrimary: true, isDefault: true });
const observation = (): ComposeObservation => ({
  account: info().email,
  sender: info().email,
  replyTo: null,
  composeId: 'fixture-compose',
  url: 'https://mail.google.com/mail/u/0/',
  to: ['qa@example.test'],
  cc: [],
  bcc: [],
  subject: 'Fictional',
  body: 'Fictional',
  attachments: [],
});
const read = (resource: unknown = setting()): SendAsRead => ({
  account: info(),
  resource,
  checkedAt: Date.now(),
});
const code = (expected: string) => (e: any) => e?.code === expected;

test('Reply-To: successful identified primary/default resource confirms absent optional header or same address', () => {
  for (const resource of [
    setting(),
    { ...setting(), replyToAddress: '' },
    { ...setting(), replyToAddress: info().email },
  ]) {
    const proof = replyToEvidence(read(resource), policy(), observation(), 'operation-one');
    assert.equal(
      proof.replyTo.kind,
      'replyToAddress' in resource && resource.replyToAddress ? 'ADDRESS' : 'NONE',
    );
    assert.equal(proof.accountSubject, info().subject);
    assert.equal(proof.operation, 'operation-one');
    assert.equal(proof.validUntil - proof.checkedAt, 5000);
  }
});

test('Reply-To: partial/unverified/default mismatch/foreign/malformed settings never become empty', () => {
  for (const resource of [
    null,
    {},
    { sendAsEmail: info().email },
    { ...setting(), isDefault: false },
    { ...setting(), isPrimary: false },
    { ...setting(), verificationStatus: 'pending' },
    { ...setting(), replyToAddress: null },
    { ...setting(), replyToAddress: 'invalid' },
  ])
    assert.throws(
      () => replyToEvidence(read(resource), policy(), observation(), 'op'),
      code('GMAIL_SETTINGS_UNVERIFIED'),
    );
  assert.throws(
    () =>
      replyToEvidence(
        read({ ...setting(), replyToAddress: 'alien@example.test' }),
        policy(),
        observation(),
        'op',
      ),
    code('GMAIL_REPLY_TO_MISMATCH'),
  );
  assert.throws(
    () =>
      replyToEvidence(
        read({ ...setting(), sendAsEmail: 'alias@example.test' }),
        policy(),
        observation(),
        'op',
      ),
    code('GMAIL_ACCOUNT_CHANGED'),
  );
});

test('Reply-To: provider identity, UI contradictions, policy revision, operation and expiry are independent fences', () => {
  for (const account of [
    { ...info(), email: 'alien@example.test' },
    { ...info(), subject: 'foreign-subject' },
  ])
    assert.throws(
      () => replyToEvidence({ ...read(), account }, policy(), observation(), 'op'),
      code('GMAIL_ACCOUNT_CHANGED'),
    );
  for (const ui of [
    { account: 'alien@example.test' },
    { sender: 'alias@example.test' },
    { replyTo: 'alien@example.test' },
    { replyTo: info().email },
  ])
    assert.throws(() => replyToEvidence(read(), policy(), { ...observation(), ...ui }, 'op'));
  assert.throws(
    () =>
      replyToEvidence(
        read({ ...setting(), replyToAddress: info().email }),
        policy(),
        { ...observation(), replyTo: '' },
        'op',
      ),
    code('GMAIL_REPLY_TO_MISMATCH'),
  );
  const previous = replyToEvidence(read(), policy(), observation(), 'op');
  for (const [op, p, resource] of [
    ['other-op', policy(), setting()],
    ['op', { ...policy(), revision: 'changed' }, setting()],
    ['op', policy(), { ...setting(), replyToAddress: info().email }],
  ] as const)
    assert.throws(
      () => replyToEvidence(read(resource), p, observation(), op, previous),
      code('GMAIL_SETTINGS_CHANGED'),
    );
  assert.throws(
    () =>
      replyToEvidence(
        { ...read(), checkedAt: 1000 },
        policy(),
        observation(),
        'op',
        undefined,
        6000,
      ),
    code('GMAIL_SETTINGS_STALE'),
  );
  assert.throws(
    () =>
      replyToEvidence(
        { ...read(), account: { ...info(), scopes: ['openid', 'email'] } },
        policy(),
        observation(),
        'op',
      ),
    code('READ_PERMISSION_REQUIRED'),
  );
});

test('Reply-To: exact readonly GET and allowlist reject mailbox, other aliases and all writes; provider errors redact secrets', async () => {
  const calls: { url: string; method: string }[] = [];
  const request = sendAsOnlyRequest(async (input, init) => {
    calls.push({ url: String(input), method: init?.method ?? 'GET' });
    return Response.json(setting());
  }, info().email);
  const api = new GmailApi(async () => ({ account: info(), bearer: 'SENTINEL_BEARER' }), request);
  const result = await api.sendAs(info());
  assert.equal(result.account.subject, info().subject);
  const url = new URL(calls[0].url);
  assert.equal(url.pathname, '/gmail/v1/users/me/settings/sendAs/owner%40example.test');
  assert.equal(url.searchParams.get('fields'), sendAsFields);
  assert.equal(calls[0].method, 'GET');
  for (const path of [
    'messages',
    'threads',
    'history',
    'settings/sendAs',
    'settings/sendAs/alien%40example.test',
  ])
    await assert.rejects(request(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`));
  for (const method of ['POST', 'PATCH', 'PUT', 'DELETE'])
    await assert.rejects(request(calls[0].url, { method }));
  assert.equal(calls.length, 1);
  for (const provider of [
    async () => Response.json({ error: 'SENTINEL_SECRET' }, { status: 403 }),
    async () => {
      throw Error('SENTINEL_SECRET');
    },
  ]) {
    const broken = new GmailApi(
      async () => ({ account: info(), bearer: 'SENTINEL_BEARER' }),
      provider,
    );
    await assert.rejects(
      broken.sendAs(info()),
      (e: any) => e.code === 'GMAIL_SETTINGS_UNVERIFIED' && !String(e).includes('SENTINEL'),
    );
  }
  let gets = 0;
  const blocked = new GmailApi(async () => {
    gets++;
    return { account: info(), bearer: 'SENTINEL' };
  }, request);
  await assert.rejects(blocked.sendAs(info(), AbortSignal.abort()));
  assert.equal(gets, 0);
  const foreign = new GmailApi(
    async () => ({ account: { ...info(), subject: 'foreign' }, bearer: 'SENTINEL' }),
    request,
  );
  await assert.rejects(foreign.sendAs(info()), code('GMAIL_ACCOUNT_CHANGED'));
  assert.equal(calls.length, 1);
});

async function job(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-reply-to-')),
    store = new Store(dir),
    gateway = new FixtureGmail();
  gateway.info = info();
  store.set('gmailSendTransport', 'GMAIL_BROWSER');
  let activePolicy = policy();
  const service = new GmailJobHunter(store, {
    gateway,
    accountInfo: () => info(),
    accountPolicy: () => activePolicy,
    runner: new FixtureRunner(),
    reader: new FixtureReader(),
  });
  let dispatch: Promise<unknown> | undefined;
  t.after(async () => {
    service.control('stop');
    service.browserDelivery.cancel();
    await dispatch?.catch(() => {});
    await service.browserDelivery.close();
    await service.stopWorker();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  store.exec('UPDATE campaigns SET account_email=? WHERE id=?', info().email, service.campaignId);
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const draft = service.draftRows()[0];
  service.reviewDraft(draft.id, draft.version);
  const cv = service.uploadCV(
    'Fictional.pdf',
    Buffer.from('%PDF-1.4\nFictional\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  await service.setSendTransport({
    transport: 'GMAIL_BROWSER',
    confirmed: true,
    outgoingViewConsent: true,
  });
  service.browserDelivery.attach('worker-reply-to');
  const preview = await service.prepareDelivery({
    drafts: [{ id: draft.id, version: draft.version }],
    cvId: cv.id,
    kind: 'SELF_TEST',
  });
  await service.approveDelivery({
    previewId: preview.id,
    previewHash: preview.previewHash,
    confirmed: true,
  });
  dispatch = service.dispatchOne();
  void dispatch.catch(() => {});
  for (
    let i = 0;
    i < 200 && !store.one("SELECT id FROM browser_deliveries WHERE state='WAITING'");
    i++
  )
    await new Promise((r) => setTimeout(r, 5));
  const payload = service.browserDelivery.claim('worker-reply-to')!;
  assert.ok(payload);
  const o = {
    ...observation(),
    sender: payload.sender,
    account: payload.sender,
    to: [payload.recipient],
    subject: payload.subject,
    body: payload.body,
    attachments: payload.attachment ? [{ name: payload.attachment.name, complete: true }] : [],
  };
  return {
    store,
    service,
    gateway,
    payload,
    o,
    changePolicy: () => {
      activePolicy = { ...policy(), revision: 'changed' };
    },
  };
}

test('Reply-To integration: null UI field uses per-operation proof, re-reads at click gate and forbids synchronous bypass', async (t) => {
  const f = await job(t),
    b = f.service.browserDelivery;
  assert.throws(
    () => b.authorize('worker-reply-to', f.payload.id, f.o),
    code('GMAIL_SETTINGS_REQUIRED'),
  );
  await b.authorizeCurrent('worker-reply-to', f.payload.id, f.o);
  assert.equal(f.gateway.sendAsCalls, 1);
  assert.throws(() => b.check('worker-reply-to', f.payload.id), code('GMAIL_SETTINGS_REQUIRED'));
  await b.listen();
  const client = new BrowserExecutorClient(f.store.dir);
  // This fixture already claimed the job with this worker; preserve that lease in IPC.
  (client as any).workerId = 'worker-reply-to';
  await client.attach();
  const gate = await client.check(f.payload.id);
  assert.ok(gate.validUntil > Date.now());
  assert.equal(f.gateway.sendAsCalls, 2);
  await assert.rejects(client.check(f.payload.id));
  assert.equal(f.gateway.posts.length, 0);
});

test('Reply-To integration: settings/account/access/policy/UI drift revoke authority without fallback or click grant', async (t) => {
  for (const scenario of ['settings', 'account', 'access', 'policy', 'ui'] as const)
    await t.test(scenario, async (t) => {
      const f = await job(t),
        b = f.service.browserDelivery;
      if (scenario === 'ui') f.o.replyTo = 'alien@example.test';
      else await b.authorizeCurrent('worker-reply-to', f.payload.id, f.o);
      if (scenario === 'settings') f.gateway.sendAsResource.replyToAddress = info().email;
      if (scenario === 'account') f.gateway.info = { ...info(), subject: 'foreign' };
      if (scenario === 'access')
        f.gateway.sendAs = async () => {
          throw Error('SENTINEL_SECRET');
        };
      if (scenario === 'policy') f.changePolicy();
      await assert.rejects(
        scenario === 'ui'
          ? b.authorizeCurrent('worker-reply-to', f.payload.id, f.o)
          : b.checkCurrent('worker-reply-to', f.payload.id),
      );
      assert.equal(f.service.deliveryAuthority().enabled, false);
      assert.equal(
        f.store.one('SELECT click_granted_at FROM browser_deliveries WHERE id=?', f.payload.id)!
          .click_granted_at,
        null,
      );
      assert.equal(f.gateway.posts.length, 0);
    });
});

test('Reply-To integration: Stop or cancellation during either settings await prevents the action', async (t) => {
  for (const phase of ['authorize', 'check'] as const)
    for (const action of ['stop', 'cancel'] as const)
      await t.test(`${phase}/${action}`, async (t) => {
        const f = await job(t),
          b = f.service.browserDelivery;
        if (phase === 'check') await b.authorizeCurrent('worker-reply-to', f.payload.id, f.o);
        let release!: () => void, entered!: () => void;
        const barrier = new Promise<void>((r) => {
            release = r;
          }),
          waiting = new Promise<void>((r) => {
            entered = r;
          });
        f.gateway.beforeSendAs = async () => {
          entered();
          await barrier;
        };
        const pending =
          phase === 'authorize'
            ? b.authorizeCurrent('worker-reply-to', f.payload.id, f.o)
            : b.checkCurrent('worker-reply-to', f.payload.id);
        await waiting;
        if (action === 'stop') f.service.control('stop');
        else b.cancel();
        release();
        await assert.rejects(pending);
        assert.equal(
          f.store.one('SELECT click_granted_at FROM browser_deliveries WHERE id=?', f.payload.id)!
            .click_granted_at,
          null,
        );
        assert.equal(f.gateway.posts.length, 0);
      });
});

test('Reply-To: expiry after final UI await and abort before click never invoke the fictional send control', async () => {
  for (const abort of [false, true]) {
    let clicks = 0;
    const controller = new AbortController();
    const driver = new GmailBrowserExecutor(
      {
        url: async () => observation().url,
        playwright: {
          evaluate: async () => ['Send'],
          getByRole: () => ({
            click: async () => {
              clicks++;
            },
          }),
        },
      } as any,
      controller.signal,
    );
    driver.observe = async () => observation();
    await assert.rejects(
      driver.clickSend(observation(), async () => {
        if (abort) controller.abort();
        return { validUntil: Date.now() - 1 };
      }),
    );
    assert.equal(clicks, 0);
  }
});
