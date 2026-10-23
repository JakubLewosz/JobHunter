import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { nativeGmail } from '../apps/server/src/gmail/reader.js';
import {
  connectGoogle,
  gmailCredentials,
  accessToken,
  googleJSON,
  gmailReadScope,
  gmailSendScope,
  type AccountInfo,
  type SecretStore,
} from '../apps/server/src/gmail/oauth.js';
import {
  readAccountPolicy,
  assertAccountPolicy,
  type AccountPolicy,
} from '../apps/server/src/gmail/account-policy.js';
import { identityOnlyRequest } from '../apps/server/src/gmail/identity-diagnostic.js';
import {
  configureSingleAccount,
  withAccountMaintenance,
} from '../apps/server/src/gmail/maintenance.js';
import { FixtureGmail } from './gmail-fixture.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { GmailBrowserExecutor } from '../apps/server/src/browser/executor.js';
import { DomainError, hash } from '../apps/server/src/util.js';
import type { ComposeObservation } from '../apps/server/src/browser/contracts.js';

const client = {
  client_id: 'fictional.apps.googleusercontent.com',
  client_secret: 'SENTINEL_CLIENT_SECRET',
};
const info = (): AccountInfo => ({
  email: 'owner@example.test',
  subject: 'fixture-stable-subject',
  connectedAt: new Date().toISOString(),
  scopes: ['openid', 'email', gmailReadScope],
});
const policy = (): AccountPolicy => ({
  email: 'owner@example.test',
  subject: 'fixture-stable-subject',
  transport: 'GMAIL_BROWSER',
  revision: 'fictional-revision',
});
function temporary(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-single-account-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function vault(account = info(), expiresAt = Date.now() + 3600000) {
  const v = {
    value: JSON.stringify({
      client,
      account,
      accessToken: 'SENTINEL_ACCESS',
      refreshToken: 'SENTINEL_REFRESH',
      expiresAt,
    }),
    gets: 0,
    sets: 0,
    async get() {
      this.gets++;
      return this.value;
    },
    async set(value: string) {
      this.sets++;
      this.value = value;
    },
    async remove() {
      this.value = '';
    },
  };
  return v;
}
function google(account = info(), trace: string[] = []): typeof fetch {
  return async (input) => {
    const u = new URL(String(input));
    trace.push(u.pathname);
    if (u.pathname === '/token')
      return Response.json({
        access_token: 'SENTINEL_NEW',
        refresh_token: 'SENTINEL_REFRESH',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: account.scopes.join(' '),
      });
    if (u.pathname.endsWith('/userinfo'))
      return Response.json({ sub: account.subject, email: account.email, email_verified: true });
    if (u.pathname.endsWith('/profile')) return Response.json({ emailAddress: account.email });
    throw Error('MAILBOX_ENDPOINT_FORBIDDEN');
  };
}
const isCode = (code: string) => (error: unknown) =>
  error instanceof DomainError && error.code === code;
class ProbeService extends GmailJobHunter {
  currentAccount() {
    return this.connectedAccount();
  }
}
function serviceFixture(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-single-account-')),
    store = new Store(dir),
    gateway = new FixtureGmail();
  gateway.info = info();
  store.set('gmailSendTransport', 'GMAIL_BROWSER');
  let activePolicy = policy();
  const service = new ProbeService(store, {
    gateway,
    accountInfo: () => info(),
    accountPolicy: () => activePolicy,
    runner: new FixtureRunner(),
    reader: new FixtureReader(),
  });
  t.after(async () => {
    await service.browserDelivery.close();
    await service.stopWorker();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return {
    dir,
    store,
    gateway,
    service,
    changePolicy: (next: AccountPolicy) => {
      activePolicy = next;
    },
  };
}

test('browser-only readonly identity works without send; identity-only cannot read', async (t) => {
  const v = vault(),
    trace: string[] = [],
    guard = { policy, metadata: info };
  assert.deepEqual(
    (await gmailCredentials(v, google(info(), trace), guard)).account.scopes,
    info().scopes,
  );
  assert.deepEqual(trace, ['/v1/userinfo', '/gmail/v1/users/me/profile']);
  const identityOnly = { ...info(), scopes: ['openid', 'email'] };
  const calls: string[] = [];
  await assert.rejects(
    gmailCredentials(vault(identityOnly), google(identityOnly, calls), {
      policy,
      metadata: () => identityOnly,
    }),
    isCode('OAUTH_SCOPES'),
  );
  assert.equal(calls.length, 0);
  const f = serviceFixture(t);
  assert.equal((await f.service.currentAccount()).email, info().email);
  f.gateway.info = identityOnly;
  await assert.rejects(f.service.currentAccount(), isCode('READ_PERMISSION_REQUIRED'));
  assert.equal(f.gateway.historyQueries.length, 0);
});

test('missing, foreign or changed stable identity is rejected before vault/refresh/mailbox', async () => {
  for (const metadata of [
    null,
    { ...info(), email: 'old@example.test' },
    { ...info(), subject: 'another-subject' },
  ]) {
    const v = vault(),
      calls: string[] = [];
    await assert.rejects(
      accessToken(v, google(info(), calls), { policy, metadata: () => metadata }),
    );
    assert.equal(v.gets, 0);
    assert.equal(v.sets, 0);
    assert.equal(calls.length, 0);
  }
  const v = vault({ ...info(), email: 'old@example.test' }, 0),
    calls: string[] = [];
  await assert.rejects(
    accessToken(v, google(info(), calls), { policy, metadata: info }),
    isCode('GMAIL_ACCOUNT_CHANGED'),
  );
  assert.equal(calls.length, 0);
  assert.equal(v.sets, 0);
});

test('refresh verifies provider subject and Gmail profile before persisting; mismatch preserves vault', async () => {
  for (const foreign of [
    { ...info(), subject: 'changed-subject' },
    { ...info(), email: 'alien@example.test' },
  ]) {
    const v = vault(info(), 0),
      original = v.value;
    await assert.rejects(
      gmailCredentials(v, google(foreign), { policy, metadata: info }),
      isCode('GMAIL_ACCOUNT_CHANGED'),
    );
    assert.equal(v.value, original);
    assert.equal(v.sets, 0);
  }
  const v = vault(info(), 0),
    trace: string[] = [];
  await gmailCredentials(v, google(info(), trace), { policy, metadata: info });
  assert.equal(v.sets, 1);
  assert.equal(trace.filter((p) => p === '/token').length, 1);
  const disagree: typeof fetch = async (url, init) =>
    String(url).includes('/profile')
      ? Response.json({ emailAddress: 'alien@example.test' })
      : google()(url, init);
  const bad = vault(info(), 0),
    original = bad.value;
  await assert.rejects(
    gmailCredentials(bad, disagree, { policy, metadata: info }),
    isCode('GMAIL_ACCOUNT_CHANGED'),
  );
  assert.equal(bad.value, original);
});

test('OAuth callback requests readonly + login hint; foreign email/subject rejected before write; replay rejected', async (t) => {
  for (const kind of ['valid', 'foreign-email', 'foreign-subject', 'profile-mismatch', 'stop']) {
    const dir = temporary(t),
      v = vault(),
      original = v.value,
      controller = new AbortController();
    const returned =
      kind === 'foreign-email'
        ? { ...info(), email: 'alien@example.test' }
        : kind === 'foreign-subject'
          ? { ...info(), subject: 'foreign-subject' }
          : info();
    const request: typeof fetch = async (url, init) => {
      if (String(url).includes('/profile')) {
        if (kind === 'stop') controller.abort();
        if (kind === 'profile-mismatch')
          return Response.json({ emailAddress: 'alien@example.test' });
      }
      return google(returned)(url, init);
    };
    const pending = connectGoogle(
      client,
      v,
      dir,
      async (auth) => {
        const u = new URL(auth);
        assert.equal(u.searchParams.get('login_hint'), info().email);
        assert.equal(u.searchParams.get('scope'), `openid email ${gmailReadScope}`);
        assert.equal(u.searchParams.get('code_challenge_method'), 'S256');
        const callback = new URL(u.searchParams.get('redirect_uri')!);
        const wrong = new URL(callback);
        wrong.search = '?state=wrong&code=SENTINEL_CODE';
        assert.equal((await fetch(wrong)).status, 400);
        callback.search = new URLSearchParams({
          state: u.searchParams.get('state')!,
          code: 'SENTINEL_CODE',
        }).toString();
        try {
          assert.equal((await fetch(callback)).status, kind === 'valid' ? 200 : 400);
          if (kind === 'valid') assert.equal((await fetch(callback)).status, 400);
        } catch (error) {
          if (kind !== 'stop') throw error;
        }
      },
      request,
      3000,
      true,
      { policy, metadata: info, signal: controller.signal },
    );
    if (kind === 'valid') {
      const result = await pending;
      assert.equal(result.email, info().email);
      assert.doesNotMatch(readFileSync(join(dir, 'account.json'), 'utf8'), /SENTINEL/);
    } else {
      await assert.rejects(pending);
      assert.equal(v.sets, 0);
      assert.equal(v.value, original);
      assert.equal(existsSync(join(dir, 'account.json')), false);
    }
  }
});

test('service rejects provider changes and policy drift during await, revokes authority even on write failure', async (t) => {
  for (const failure of ['email', 'subject', 'policy', 'provider-error', 'write-error']) {
    const f = serviceFixture(t);
    (f.service as any).sendEnabled = true;
    const exec = f.store.exec.bind(f.store);
    f.gateway.account = async () => {
      if (failure === 'policy') f.changePolicy({ ...policy(), revision: 'new-revision' });
      if (failure === 'provider-error') throw new DomainError('GOOGLE_AUTH', 'Bezpieczny błąd.');
      if (failure === 'write-error')
        f.store.exec = () => {
          throw Error('SENTINEL_STORAGE');
        };
      return {
        ...info(),
        ...(failure === 'subject'
          ? { subject: 'other-subject' }
          : failure === 'policy'
            ? {}
            : { email: 'alien@example.test' }),
      };
    };
    await assert.rejects(f.service.currentAccount());
    f.store.exec = exec;
    assert.equal(f.service.deliveryAuthority().enabled, false);
    assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
    assert.equal(f.gateway.posts.length, 0);
  }
});

test('all native API send entrypoints reject before token/network/reservation, including broad grant', async (t) => {
  const f = serviceFixture(t);
  f.gateway.info.scopes.push(gmailSendScope);
  await assert.rejects(
    f.service.setSendTransport({
      transport: 'GMAIL_API',
      confirmed: true,
      outgoingViewConsent: false,
    }),
    isCode('API_SEND_DISABLED'),
  );
  f.store.set('gmailSendTransport', 'GMAIL_API');
  assert.throws(() => f.service.sendTransport(), isCode('API_SEND_DISABLED'));
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
  let nativeChecks = 0;
  const native = nativeGmail(() => {
    nativeChecks++;
  }, temporary(t));
  const mime = Buffer.from('synthetic');
  await assert.rejects(
    native.send(
      {
        messageId: '<fictional@example.test>',
        recipient: 'qa@example.test',
        mime,
        mimeHash: hash(mime),
        scenario: 'NORMAL',
      },
      info(),
      () => assert.fail('NO_FINAL_CALLBACK'),
    ),
    isCode('API_SEND_DISABLED'),
  );
  assert.equal(nativeChecks, 0);
  assert.equal(f.gateway.posts.length, 0);
});

test('independent browser account and Reply-To must match; aliases are not normalized into approval', async (t) => {
  for (const email of ['owner+alias@example.test', 'o.wner@example.test', 'alien@example.test'])
    assert.throws(
      () => assertAccountPolicy(policy(), { email, subject: info().subject }),
      isCode('GMAIL_ACCOUNT_CHANGED'),
    );
  for (const [account, reply] of [
    ['alien@example.test', ''],
    [info().email, 'alien@example.test'],
    [info().email, null],
  ]) {
    const f = serviceFixture(t);
    (f.service as any).sendEnabled = true;
    const guard = (f.service.browserDelivery as any).options.assertIdentity;
    assert.throws(() => guard(account, info().email, reply), isCode('GMAIL_ACCOUNT_CHANGED'));
    assert.equal(f.service.deliveryAuthority().enabled, false);
  }
  const f = serviceFixture(t),
    guard = (f.service.browserDelivery as any).options.assertIdentity;
  guard(info().email, info().email, '');
  guard(info().email, info().email, info().email);
});

test('browser re-observes after final await; changed account/from/Reply-To blocks click', async () => {
  const expected: ComposeObservation = {
    url: 'https://mail.google.com/mail/u/0/',
    composeId: 'fixture',
    sender: info().email,
    account: info().email,
    replyTo: '',
    to: ['qa@example.test'],
    cc: [],
    bcc: [],
    subject: 'Fictional',
    body: 'Fictional',
    attachments: [],
  };
  for (const drift of [
    { sender: 'alien@example.test' },
    { account: 'alien@example.test' },
    { replyTo: 'alien@example.test' },
  ]) {
    let clicks = 0,
      changed = false;
    const driver = new GmailBrowserExecutor({
      url: async () => expected.url,
      playwright: {
        evaluate: async () => ['Send'],
        getByRole: () => ({
          click: async () => {
            clicks++;
          },
        }),
      },
    } as any);
    driver.observe = async () => (changed ? { ...expected, ...drift } : expected);
    await assert.rejects(
      driver.clickSend(expected, async () => {
        changed = true;
      }),
      /GMAIL_COMPOSE_CHANGED/,
    );
    assert.equal(clicks, 0);
  }
});

test('identity diagnostics allow only userinfo/profile/token, redact provider sentinels', async () => {
  const paths: string[] = [],
    request = identityOnlyRequest(google(info(), paths));
  for (const path of [
    'messages',
    'threads',
    'history',
    'messages/send',
    'drafts',
    'drafts/send',
    'settings/sendAs',
  ])
    await assert.rejects(
      request(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`),
      /IDENTITY_ENDPOINT_DENIED/,
    );
  assert.equal(paths.length, 0);
  try {
    await googleJSON('https://oauth2.googleapis.com/token', {}, async () => {
      throw Error('SENTINEL_ACCESS');
    });
  } catch (error) {
    assert.doesNotMatch(String(error), /SENTINEL/);
  }
});

test('maintenance backs up WAL, preserves history/materials/counters and creates zero outbound artifacts', async (t) => {
  const base = temporary(t),
    dir = join(base, 'research-only');
  mkdirSync(dir);
  const store = new Store(dir),
    g = new FixtureGmail();
  const service = new GmailJobHunter(store, {
    gateway: g,
    accountInfo: () => g.info,
    runner: new FixtureRunner(),
    reader: new FixtureReader(),
  });
  store.exec("UPDATE campaigns SET account_email=? WHERE id='research'", info().email);
  writeFileSync(
    join(base, 'workstation.json'),
    JSON.stringify({ kind: 'WORKSTATION', base, historyConfirmed: true }),
  );
  const tables = [
    'history_records',
    'shared_attempts',
    'shared_usage',
    'suppressions',
    'send_attempts',
    'usage_ledger',
    'outbox',
    'drafts',
    'draft_versions',
    'candidate_facts',
    'cv_assets',
  ];
  const existing = tables.filter((name) =>
    store.one('SELECT name FROM sqlite_master WHERE name=?', name),
  );
  const before = Object.fromEntries(
    existing.map((name) => [name, store.all(`SELECT * FROM ${name} ORDER BY rowid`)]),
  );
  store.close();
  await withAccountMaintenance(base, async (s) => {
    configureSingleAccount(s, base, info().email);
  });
  const after = new Store(dir);
  try {
    for (const name of existing)
      assert.deepEqual(after.all(`SELECT * FROM ${name} ORDER BY rowid`), before[name]);
    assert.equal(after.get('stopped', false), true);
    assert.equal(after.get('gmailSenderPaused', false), true);
    assert.equal(readAccountPolicy(base).transport, 'GMAIL_BROWSER');
    assert.equal(readdirSync(join(dir, 'backups')).filter((n) => n.endsWith('.sqlite')).length, 1);
  } finally {
    after.close();
  }
  assert.equal(existsSync(join(base, 'backend.lock')), false);
  assert.equal(service.deliveryAuthority().enabled, false);
});
