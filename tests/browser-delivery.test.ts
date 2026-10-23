import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { connect } from 'node:net';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';
import { Store } from '../apps/server/src/db.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { BrowserDeliveryBroker } from '../apps/server/src/browser/broker.js';
import { BrowserExecutorClient } from '../apps/server/src/browser/client.js';
import { browserReceiptMatches } from '../apps/server/src/browser/verification.js';
import type { BrowserPayload, ComposeObservation } from '../apps/server/src/browser/contracts.js';
import { prepareMime } from '../apps/server/src/gmail/mime.js';
import { FixtureGmail } from './gmail-fixture.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { setup as autoSetup } from './auto-fixture.js';
import { hash } from '../apps/server/src/util.js';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import { runBrowserDelivery, GmailBrowserExecutor } from '../apps/server/src/browser/executor.js';
import { gmailReadScope } from '../apps/server/src/gmail/oauth.js';
import { configureSingleAccount } from '../apps/server/src/gmail/maintenance.js';

async function setup(t: TestContext, singleAccount = false) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-browser-')),
    store = new Store(dir),
    gateway = new FixtureGmail();
  if (singleAccount) {
    gateway.info.scopes = ['openid', 'email', gmailReadScope];
    store.set('gmailSendTransport', 'GMAIL_BROWSER');
  }
  const options = {
    gateway,
    accountInfo: () => gateway.info,
    runner: new FixtureRunner(),
    reader: new FixtureReader(),
    ...(singleAccount
      ? {
          accountPolicy: () => ({
            email: 'owner@example.test',
            subject: 'fictional-account',
            transport: 'GMAIL_BROWSER' as const,
            revision: 'fictional',
          }),
        }
      : {}),
  };
  const service = new GmailJobHunter(store, options);
  if (singleAccount)
    store.exec(
      'UPDATE campaigns SET account_email=? WHERE id=?',
      gateway.info.email,
      service.campaignId,
    );
  t.after(async () => {
    await service.browserDelivery.close();
    await service.stopWorker();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const d = service.draftRows()[0];
  service.reviewDraft(d.id, d.version);
  const cv = service.uploadCV(
    'Fictional_CV.pdf',
    Buffer.from('%PDF-1.4\nFictional CV\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  await service.setSendTransport({
    transport: 'GMAIL_BROWSER',
    confirmed: true,
    outgoingViewConsent: true,
  });
  service.browserDelivery.attach('worker-fixture');
  return { dir, store, gateway, service, d, cv, options };
}
async function waitJob(store: Store) {
  for (let i = 0; i < 100; i++) {
    if (store.one("SELECT id FROM browser_deliveries WHERE state='WAITING'")) return;
    await new Promise((r) => setTimeout(r, 5));
  }
  assert.fail('Browser job was not created');
}
async function begin(f: Awaited<ReturnType<typeof setup>>) {
  const p = await f.service.prepareDelivery({
    drafts: [{ id: f.d.id, version: f.d.version }],
    cvId: f.cv.id,
    kind: 'SELF_TEST',
  });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  const dispatch = f.service.dispatchOne();
  await waitJob(f.store);
  const payload = f.service.browserDelivery.claim('worker-fixture')!;
  assert.ok(payload);
  return { dispatch, payload };
}
const observation = (p: BrowserPayload): ComposeObservation => ({
  url: 'https://mail.google.com/mail/u/0/#inbox',
  composeId: 'fictional-compose',
  sender: p.sender,
  account: p.sender,
  replyTo: '',
  to: [p.recipient],
  cc: [],
  bcc: [],
  subject: p.subject,
  body: p.body,
  attachments: p.attachment ? [{ name: p.attachment.name, complete: true }] : [],
});
function ownMessage(f: Awaited<ReturnType<typeof setup>>, payload: BrowserPayload, raw?: Buffer) {
  const out = f.store.one('SELECT * FROM send_attempts WHERE outbox_id=?', payload.outboxId)!;
  f.gateway.sentMessages.push({
    id: 'abcdef0123456789',
    threadId: 'fictional-thread',
    labels: ['SENT'],
    from: [payload.sender],
    to: [payload.recipient],
    subject: payload.subject,
    messageId: '<browser-owned@example.test>',
    at: new Date().toISOString(),
    body: '',
    category: 'UNCLEAR',
    raw: raw ?? out.mime,
  });
}
test('full IPC scope fence rejects a session changed after attach without claiming its replacement', async (t) => {
  const f = await setup(t);
  (f.service.browserDelivery as any).worker = null;
  await f.service.browserDelivery.listen();
  const client = new BrowserExecutorClient(f.dir);
  const original = await client.attach();
  f.store.set('browserExecutionContext', {
    state: 'RUNNING',
    sessionId: 'new-session',
    batchId: 'new-batch',
    generation: 'new-generation',
  });
  await assert.rejects(() => client.next(original.scope), /BROWSER_SESSION_CHANGED/);
  assert.equal(
    f.store.one("SELECT count(*) n FROM browser_deliveries WHERE state='CLAIMED'")!.n,
    0,
  );
  assert.equal(f.gateway.posts.length, 0);
});
for (const phase of ['attach', 'claim', 'prepare', 'authorize', 'check'])
  test(
    'full IPC cancellation after ' +
      phase +
      ' produces zero send actions and preserves reservation',
    async (t) => {
      const f = await setup(t);
      (f.service.browserDelivery as any).worker = null;
      await f.service.browserDelivery.listen();
      const client = new BrowserExecutorClient(f.dir),
        abort = new AbortController();
      await client.attach();
      const p = await f.service.prepareDelivery({
        drafts: [{ id: f.d.id, version: f.d.version }],
        cvId: f.cv.id,
        kind: 'SELF_TEST',
      });
      await f.service.approveDelivery({
        previewId: p.id,
        previewHash: p.previewHash,
        confirmed: true,
      });
      const dispatch = f.service.dispatchOne();
      await waitJob(f.store);
      let clicks = 0;
      const prepare = GmailBrowserExecutor.prototype.prepare,
        click = GmailBrowserExecutor.prototype.clickSend;
      GmailBrowserExecutor.prototype.prepare = async function (payload) {
        if (phase === 'prepare') abort.abort();
        return observation(payload);
      };
      GmailBrowserExecutor.prototype.clickSend = async function (_expected, check) {
        await check?.();
        abort.signal.throwIfAborted();
        clicks++;
      };
      const method = phase === 'claim' ? 'next' : phase;
      if (['attach', 'next', 'authorize', 'check'].includes(method)) {
        const original = (client as any)[method].bind(client);
        (client as any)[method] = async (...args: any[]) => {
          const result = await original(...args);
          abort.abort();
          return result;
        };
      }
      try {
        const result = await runBrowserDelivery(client, {} as any, { signal: abort.signal });
        assert.equal(result.status, 'STOPPED');
        assert.equal(clicks, 0);
        f.service.control('stop');
        await dispatch;
        assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 1);
        assert.equal(f.gateway.posts.length, 0);
      } finally {
        GmailBrowserExecutor.prototype.prepare = prepare;
        GmailBrowserExecutor.prototype.clickSend = click;
      }
    },
  );

test('Browser: exact payload, CV bytes and own readonly receipt use one shared attempt and zero API posts', async (t) => {
  const f = await setup(t),
    { dispatch, payload } = await begin(f);
  assert.equal(basename(payload.attachment!.path), payload.attachment!.name);
  assert.deepEqual(readFileSync(payload.attachment!.path), f.service.cvBytes(f.cv.id).bytes);
  f.service.browserDelivery.authorize('worker-fixture', payload.id, observation(payload));
  f.service.browserDelivery.check('worker-fixture', payload.id);
  assert.throws(() => f.service.browserDelivery.check('worker-fixture', payload.id));
  ownMessage(f, payload);
  const sent = f.gateway.sent.bind(f.gateway);
  f.gateway.sent = async (query) => {
    assert.equal(query.includeRaw, true);
    return sent(query);
  };
  f.service.browserDelivery.complete('worker-fixture', payload.id, {
    acknowledged: true,
    url: 'https://mail.google.com/mail/u/0/#sent/own',
    candidateId: 'abcdef0123456789',
  });
  await dispatch;
  assert.equal(f.service.outboxRows()[0].status, 'SENT_CONFIRMED');
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.all('SELECT * FROM send_attempts').length, 1);
  assert.equal(f.store.all('SELECT * FROM usage_ledger').length, 1);
  assert.throws(() =>
    f.service.browserDelivery.complete('worker-fixture', payload.id, {
      acknowledged: true,
      url: 'https://mail.google.com',
      candidateId: null,
    }),
  );
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
});

test('single account readonly: targeted fixture history and own UI receipt keep one reservation and zero API sends', async (t) => {
  const f = await setup(t, true);
  await f.service.checkHistory({ drafts: [{ id: f.d.id, version: f.d.version }], consent: true });
  assert.equal(f.gateway.historyQueries.length, 1);
  const { dispatch, payload } = await begin(f);
  f.service.browserDelivery.authorize('worker-fixture', payload.id, observation(payload));
  f.service.browserDelivery.check('worker-fixture', payload.id);
  ownMessage(f, payload);
  f.service.browserDelivery.complete('worker-fixture', payload.id, {
    acknowledged: true,
    url: 'https://mail.google.com/mail/u/0/#sent/own',
    candidateId: 'abcdef0123456789',
  });
  await dispatch;
  assert.equal(f.service.outboxRows()[0].status, 'SENT_CONFIRMED');
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 1);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 1);
});

test('single account configuration preserves nonempty SELF_TEST/unknown, two historical subjects and suppression', async (t) => {
  const f = await setup(t),
    { dispatch, payload } = await begin(f);
  f.service.browserDelivery.authorize('worker-fixture', payload.id, observation(payload));
  f.service.control('stop');
  await dispatch;
  assert.equal(f.service.outboxRows()[0].status, 'SEND_UNKNOWN');
  f.service.suppress(f.d.company_id, 'DO_NOT_CONTACT', 'Synthetic refusal', 'user');
  // Synthetic history has an old independent account, never selected/refreshed.
  f.store.exec("UPDATE gmail_outbox SET account_subject='historical-other-subject'");
  f.store.exec(
    'UPDATE campaigns SET account_email=? WHERE id=?',
    f.gateway.info.email,
    f.service.campaignId,
  );
  const tables = [
    'outbox',
    'send_attempts',
    'usage_ledger',
    'gmail_outbox',
    'gmail_previews',
    'suppressions',
    'drafts',
    'draft_versions',
  ];
  const before = Object.fromEntries(
    tables.map((name) => [name, f.store.all(`SELECT * FROM ${name} ORDER BY rowid`)]),
  );
  const base = mkdtempSync(join(tmpdir(), 'jh-policy-history-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  writeFileSync(
    join(base, 'workstation.json'),
    JSON.stringify({ kind: 'WORKSTATION', base, historyConfirmed: true }),
  );
  configureSingleAccount(f.store, base, f.gateway.info.email);
  for (const name of tables)
    assert.deepEqual(f.store.all(`SELECT * FROM ${name} ORDER BY rowid`), before[name]);
  assert.equal(f.service.deliveryAuthority().enabled, false);
  assert.equal(f.gateway.posts.length, 0);
});
test('Browser: Stop before authorization prevents sending; after authorization it remains uncertain and blocks retry', async (t) => {
  for (const committed of [false, true]) {
    const f = await setup(t),
      { dispatch, payload } = await begin(f);
    if (committed)
      f.service.browserDelivery.authorize('worker-fixture', payload.id, observation(payload));
    f.service.control('stop');
    await dispatch;
    assert.equal(f.service.outboxRows()[0].status, committed ? 'SEND_UNKNOWN' : 'FAILED_NOT_SENT');
    assert.throws(() => f.service.browserDelivery.check('worker-fixture', payload.id));
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.store.all('SELECT * FROM send_attempts').length, 1);
    if (committed) assert.equal(f.store.get('killSwitch', false), true);
  }
});
test('Browser: changed recipient, CC, BCC, sender, subject, text, CV, origin or attachment are rejected before commit', async (t) => {
  const f = await setup(t),
    { dispatch, payload } = await begin(f);
  for (const patch of [
    { to: ['other@example.test'] },
    { to: [payload.recipient, 'other@example.test'] },
    { cc: ['other@example.test'] },
    { bcc: ['other@example.test'] },
    { sender: 'other@example.test' },
    { subject: payload.subject + ' changed' },
    { body: payload.body + ' changed' },
    { url: 'https://mail.google.com.evil.test/' },
    { attachments: [] },
    { attachments: [{ name: 'wrong.pdf', complete: true }] },
    { attachments: [{ name: payload.attachment!.name, complete: false }] },
  ])
    assert.throws(() =>
      f.service.browserDelivery.authorize('worker-fixture', payload.id, {
        ...observation(payload),
        ...patch,
      }),
    );
  writeFileSync(payload.attachment!.path, 'changed');
  assert.throws(() =>
    f.service.browserDelivery.authorize('worker-fixture', payload.id, observation(payload)),
  );
  f.service.control('stop');
  await dispatch;
  assert.equal(f.service.outboxRows()[0].status, 'FAILED_NOT_SENT');
  assert.equal(f.gateway.posts.length, 0);
});
test('Browser: no unverified UI candidate, missing raw data, modified message or wrong Sent metadata confirms a send', async (t) => {
  for (const variant of ['missing-id', 'modified', 'metadata', 'missing-raw']) {
    const f = await setup(t),
      { dispatch, payload } = await begin(f);
    f.service.browserDelivery.authorize('worker-fixture', payload.id, observation(payload));
    ownMessage(f, payload);
    f.service.browserDelivery.check('worker-fixture', payload.id);
    if (variant === 'modified')
      f.gateway.sentMessages[0].raw = Buffer.from('not the expected MIME');
    if (variant === 'metadata') f.gateway.sentMessages[0].to = ['other@example.test'];
    if (variant === 'missing-raw') delete f.gateway.sentMessages[0].raw;
    f.service.browserDelivery.complete('worker-fixture', payload.id, {
      acknowledged: true,
      url: 'https://mail.google.com/mail/u/0/#sent',
      candidateId: variant === 'missing-id' ? null : 'abcdef0123456789',
    });
    await dispatch;
    assert.equal(f.service.outboxRows()[0].status, 'SENT_PROVIDER');
    await f.service.dispatchOne();
    assert.equal(f.store.all('SELECT * FROM send_attempts').length, 1);
    assert.equal(f.gateway.posts.length, 0);
  }
});
test('Browser: expired lease, stale permission, duplicate worker and restart never resume a committed action', async (t) => {
  const f = await setup(t);
  let time = Date.now();
  const broker = new BrowserDeliveryBroker(f.store, { clock: () => time });
  broker.attach('worker-test1');
  assert.throws(() => broker.attach('worker-test2'));
  time += 46000;
  assert.throws(() => broker.claim('worker-test1'));
  broker.attach('worker-test2');
  await broker.close();
  const { dispatch, payload } = await begin(f);
  f.service.browserDelivery.authorize('worker-fixture', payload.id, observation(payload));
  // Simulates restart recovery for the persisted UI record only; old sender is cancelled.
  const recovered = new BrowserDeliveryBroker(f.store);
  assert.equal(f.store.one('SELECT state FROM browser_deliveries')!.state, 'SEND_UNKNOWN');
  assert.equal(recovered.status().connected, false);
  await recovered.close();
  f.service.control('stop');
  await dispatch;
  assert.equal(f.service.outboxRows()[0].status, 'SEND_UNKNOWN');
  assert.equal(f.gateway.posts.length, 0);
});
test('Browser IPC: authenticated named pipe preserves Polish text and does not expose the panel token', async (t) => {
  const f = await setup(t);
  await f.service.browserDelivery.listen();
  const client = new BrowserExecutorClient(f.dir);
  await client.attach().catch(() => {});
  // The first worker still owns the active lease. A second worker cannot take it.
  await assert.rejects(() => client.attach(), /BROWSER_BUSY/);
  await f.service.browserDelivery.close();
  await f.service.browserDelivery.listen();
  await client.attach();
  const p = await f.service.prepareDelivery({
    drafts: [{ id: f.d.id, version: f.d.version }],
    cvId: f.cv.id,
    kind: 'SELF_TEST',
  });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  const dispatch = f.service.dispatchOne();
  await waitJob(f.store);
  const job = (await client.next())!;
  assert.match(job.body, /Dzień|Szukam|Jestem/u);
  assert.equal(
    job.body,
    JSON.parse(f.store.one('SELECT payload_json FROM browser_deliveries')!.payload_json).body,
  );
  await client.authorize(job.id, observation(job));
  await client.check(job.id);
  await client.fail(job.id);
  await dispatch;
  assert.equal(f.service.outboxRows()[0].status, 'SEND_UNKNOWN');
  const descriptor = JSON.parse(readFileSync(join(f.dir, 'browser-executor.json'), 'utf8'));
  const denial = await new Promise<string>((resolve, reject) => {
    const s = connect(descriptor.address);
    let value = '';
    s.setEncoding('utf8');
    s.on('connect', () =>
      s.write(JSON.stringify({ secret: 'invalid', op: 'attach', workerId: 'wrong-worker' }) + '\n'),
    );
    s.on('data', (x) => (value += x));
    s.on('end', () => resolve(value));
    s.on('error', reject);
  });
  assert.equal(JSON.parse(denial).ok, false);
  assert.ok(!denial.includes(descriptor.secret));
  assert.equal(existsSync(join(f.dir, 'launch.json')), false);
});

test('Browser IPC: executor realm does not need the global process object', async (t) => {
  const f = await setup(t);
  await f.service.browserDelivery.close();
  await f.service.browserDelivery.listen();
  const require = createRequire(import.meta.url);
  const source = readFileSync('apps/server/src/browser/client.ts', 'utf8');
  const compiled = transpileModule(source, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  }).outputText;
  const realm = {
    exports: {} as { BrowserExecutorClient?: new (dir: string) => BrowserExecutorClient },
    Buffer,
    setTimeout,
    clearTimeout,
    require: (name: string) => {
      if (name === './contracts.js') return { browserDescriptorName: 'browser-executor.json' };
      assert.ok(name.startsWith('node:'));
      return require(name);
    },
  };
  runInNewContext(compiled, realm);
  assert.equal('process' in realm, false);
  const client = new realm.exports.BrowserExecutorClient!(f.dir);
  await client.attach();
  assert.equal(f.service.browserDelivery.status().connected, true);
});
test('Browser: transport change revokes old previews, requires Stop/consent and is unavailable without executor', async (t) => {
  const f = await setup(t);
  await f.service.browserDelivery.close();
  await assert.rejects(() =>
    f.service.prepareDelivery({
      drafts: [{ id: f.d.id, version: f.d.version }],
      cvId: f.cv.id,
      kind: 'SELF_TEST',
    }),
  );
  await assert.rejects(() =>
    f.service.setSendTransport({
      transport: 'GMAIL_BROWSER',
      confirmed: true,
      outgoingViewConsent: false,
    }),
  );
  await f.service.setSendTransport({
    transport: 'GMAIL_API',
    confirmed: true,
    outgoingViewConsent: false,
  });
  const p = await f.service.prepareDelivery({
    drafts: [{ id: f.d.id, version: f.d.version }],
    cvId: f.cv.id,
    kind: 'SELF_TEST',
  });
  f.service.control('pause');
  await f.service.setSendTransport({
    transport: 'GMAIL_BROWSER',
    confirmed: true,
    outgoingViewConsent: true,
  });
  f.service.browserDelivery.attach('worker-fixture');
  await assert.rejects(() =>
    f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true }),
  );
  assert.equal(f.gateway.posts.length, 0);
});
test('Browser AUTO: policy and Start still authorize each conforming first contact without manual draft approval', async (t) => {
  const f = await autoSetup(t, false, false, false, true);
  t.after(() => f.service.browserDelivery.close());
  await f.service.setSendTransport({
    transport: 'GMAIL_BROWSER',
    confirmed: true,
    outgoingViewConsent: true,
  });
  f.service.browserDelivery.attach('worker-auto');
  f.service.configurePolicy(f.policy);
  await f.service.startAuto();
  await assert.rejects(() =>
    f.service.setSendTransport({
      transport: 'GMAIL_API',
      confirmed: true,
      outgoingViewConsent: false,
    }),
  );
  await f.service.tick();
  f.advance();
  const dispatch = f.service.dispatchOne();
  await waitJob(f.store);
  const p = f.service.browserDelivery.claim('worker-auto')!;
  f.service.browserDelivery.authorize('worker-auto', p.id, observation(p));
  f.service.browserDelivery.check('worker-auto', p.id);
  f.service.browserDelivery.complete('worker-auto', p.id, {
    acknowledged: true,
    url: 'https://mail.google.com/mail/u/0/#sent',
    candidateId: null,
  });
  await dispatch;
  assert.equal(f.store.one('SELECT actor FROM draft_approvals')!.actor, 'policy');
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT status FROM outbox')!.status, 'SENT_PROVIDER');
  f.service.control('stop');
});
test('Browser payload verification tolerates layout whitespace but rejects changed words, PDF, links or injected HTML', async () => {
  const make = async (body: string, bytes = Buffer.from('%PDF-fixture')) =>
    (
      await prepareMime({
        sender: 'owner@example.test',
        recipient: 'qa@example.test',
        subject: 'Fikcyjny temat',
        body,
        cv: { name: 'Fixture.pdf', bytes, sha256: hash(bytes), approved: true },
      })
    ).mime;
  const a = await make('Dzień dobry,\n\nTo tekst testowy.\nGitHub: https://github.com/Fixture');
  assert.equal(browserReceiptMatches(a, a), true);
  const whitespace = await make(
    'Dzień dobry,\nTo tekst testowy.\n\nGitHub: https://github.com/Fixture',
  );
  assert.equal(browserReceiptMatches(a, whitespace), true);
  assert.equal(
    browserReceiptMatches(
      a,
      await make('Dzień dobry,\nTo inny tekst.\nGitHub: https://github.com/Fixture'),
    ),
    false,
  );
  assert.equal(
    browserReceiptMatches(
      a,
      await make(
        'Dzień dobry,\n\nTo tekst testowy.\nGitHub: https://github.com/Fixture',
        Buffer.from('%PDF-changed'),
      ),
    ),
    false,
  );
  assert.equal(
    browserReceiptMatches(
      a,
      await make('Dzień dobry,\n\nTo tekst testowy.\nGitHub: https://evil.example.test'),
    ),
    false,
  );
  const body = 'Dzień dobry,\n\nTo tekst testowy.\nGitHub: https://github.com/Fixture';
  const html =
    'Dzień dobry,<br><br>To tekst testowy.<br>GitHub: <a href="https://github.com/Fixture">https://github.com/Fixture</a>';
  const received = async (markup: string, extra = false) =>
    (
      await nodemailer
        .createTransport({ streamTransport: true, buffer: true, newline: 'windows' })
        .sendMail({
          from: 'owner@example.test',
          to: 'qa@example.test',
          subject: 'Fikcyjny temat',
          text: body,
          html: markup,
          attachments: [
            {
              filename: 'Fixture.pdf',
              content: Buffer.from('%PDF-fixture'),
              contentType: 'application/pdf',
            },
            ...(extra
              ? [
                  {
                    filename: 'extra.txt',
                    content: Buffer.from('extra'),
                    contentType: 'text/plain',
                  },
                ]
              : []),
          ],
        })
    ).message as Buffer;
  assert.equal(browserReceiptMatches(a, await received(html)), true);
  for (const markup of [
    html + '<footer>Dodatkowa niezatwierdzona deklaracja.</footer>',
    html + '<span hidden>Ukryta deklaracja.</span>',
    html + '<img src="https://tracking.example.test/pixel">',
    html.replace('href="https://github.com/Fixture"', 'href="https://wrong.example.test"'),
  ])
    assert.equal(browserReceiptMatches(a, await received(markup)), false);
  assert.equal(browserReceiptMatches(a, await received(html, true)), false);
});
test('Browser additive migration backs up SQLite and preserves every old row and immutable MIME/version', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-browser-migration-'));
  let store: Store | undefined;
  const rows = (s: Store) =>
    Object.fromEntries(
      s
        .all(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('migrations','browser_deliveries') ORDER BY name",
        )
        .map((r) => [r.name, s.all('SELECT * FROM "' + r.name + '" ORDER BY rowid')]),
    );
  try {
    store = new Store(dir);
    const gateway = new FixtureGmail();
    const service = new GmailJobHunter(store, {
      gateway,
      accountInfo: () => gateway.info,
      runner: new FixtureRunner(),
      reader: new FixtureReader(),
    });
    service.approveProfile();
    await service.importURL('https://fixture.example.test/careers');
    await service.tick();
    const cv = service.uploadCV('Fictional.pdf', Buffer.from('%PDF-fixture').toString('base64'));
    service.approveCV(cv.id);
    const draft = service.draftRows()[0];
    service.reviewDraft(draft.id, draft.version);
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
    await service.dispatchOne();
    assert.equal(store.one('SELECT state FROM send_attempts')!.state, 'SENT_CONFIRMED');
    assert.ok(store.one('SELECT mime FROM send_attempts')!.mime.length > 100);
    const before = rows(store);
    store.close();
    store = undefined;
    const old = new Database(join(dir, 'jobhunter.sqlite'));
    old.exec(
      "DROP TABLE browser_deliveries; DELETE FROM migrations WHERE name='020_browser_delivery.sql'",
    );
    old.close();
    store = new Store(dir);
    assert.deepEqual(rows(store), before);
    assert.equal(store.db.pragma('integrity_check', { simple: true }), 'ok');
    assert.deepEqual(store.db.pragma('foreign_key_check'), []);
    const files = readdirSync(join(dir, 'backups'));
    assert.ok(files.length);
    const backup = new Database(join(dir, 'backups', files[0]), { readonly: true });
    assert.equal(backup.pragma('integrity_check', { simple: true }), 'ok');
    assert.equal(
      backup.prepare("SELECT name FROM sqlite_master WHERE name='browser_deliveries'").get(),
      undefined,
    );
    backup.close();
  } finally {
    store?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
