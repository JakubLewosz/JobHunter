import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  connectGoogle,
  desktopClient,
  grantedScopes,
  gmailSendScope,
  gmailReadScope,
  accessToken,
  disconnectGoogle,
  setupInfo,
  type SecretStore,
} from '../apps/server/src/gmail/oauth.js';
import { GmailMailProvider } from '../apps/server/src/gmail/client.js';
import { prepareMime } from '../apps/server/src/gmail/mime.js';
import { hash, DomainError } from '../apps/server/src/util.js';
import { createApp } from '../apps/server/src/app.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import addressparser from 'nodemailer/lib/addressparser/index.js';
import { decodeSubject } from '../apps/server/src/gmail/reader.js';
import { textFromHTML } from '../apps/server/src/research/fetcher.js';

const client = {
  client_id: 'fictional-test.apps.googleusercontent.com',
  client_secret: 'fictional-client-secret',
};
function memoryVault(): SecretStore & { value?: string } {
  return {
    get: async function () {
      return this.value;
    },
    set: async function (value) {
      this.value = value;
    },
    remove: async function () {
      this.value = undefined;
    },
  };
}
function temporary(t: { after: (fn: () => void) => void }) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-gmail-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const scopes = `openid email ${gmailSendScope}`;
test('Gmail OAuth delivery: dodatkowy readonly w rzeczywistym loopback callback, bez dostępu do prawdziwego Google', async (t) => {
  const dir = temporary(t),
    vault = memoryVault(),
    deliveryScopes = `${scopes} ${gmailReadScope}`;
  const account = await connectGoogle(
    client,
    vault,
    dir,
    async (auth) => {
      const u = new URL(auth);
      assert.ok(u.searchParams.get('scope')!.includes(gmailReadScope));
      const redirect = new URL(u.searchParams.get('redirect_uri')!);
      redirect.search = new URLSearchParams({
        state: u.searchParams.get('state')!,
        code: 'fictional-code',
      }).toString();
      assert.equal((await fetch(redirect)).status, 200);
    },
    async (url) =>
      String(url).includes('/token')
        ? Response.json({
            access_token: 'fictional-access',
            refresh_token: 'fictional-refresh',
            expires_in: 3600,
            scope: deliveryScopes,
            token_type: 'Bearer',
          })
        : Response.json({
            sub: 'fictional-account',
            email: 'owner@example.test',
            email_verified: true,
          }),
    5000,
    true,
  );
  assert.ok(account.scopes.includes(gmailReadScope));
  assert.ok(setupInfo(dir)!.scopes.includes(gmailReadScope));
  assert.doesNotMatch(
    readFileSync(join(dir, 'account.json'), 'utf8'),
    /fictional-access|fictional-refresh/,
  );
});
test('Gmail preparation: klient Desktop, minimalne scopes i odrzucenie odczytu skrzynki', () => {
  assert.deepEqual(desktopClient({ installed: client }), client);
  assert.throws(() => desktopClient({ web: client }), /Desktop app/);
  assert.deepEqual(grantedScopes(scopes), scopes.split(' '));
  assert.throws(
    () => grantedScopes(scopes + ' https://www.googleapis.com/auth/gmail.readonly'),
    /tylko tożsamość/,
  );
});
test('Gmail OAuth: rzeczywisty lokalny callback, PKCE/state, konto i tylko vault zawiera fikcyjne sekrety', async (t) => {
  const dir = temporary(t),
    vault = memoryVault();
  let challenge = '';
  let calls = 0;
  const request: typeof fetch = async (url, init) => {
    calls++;
    if (String(url).includes('/token')) {
      const body = new URLSearchParams(init!.body as URLSearchParams);
      assert.equal(body.get('code'), 'fictional-code');
      assert.equal(
        createHash('sha256').update(body.get('code_verifier')!).digest('base64url'),
        challenge,
      );
      return Response.json({
        access_token: 'fictional-access',
        refresh_token: 'fictional-refresh',
        expires_in: 3600,
        scope: scopes,
        token_type: 'Bearer',
      });
    }
    assert.equal(String(url), 'https://openidconnect.googleapis.com/v1/userinfo');
    return Response.json({
      sub: 'fictional-account',
      email: 'owner@example.test',
      email_verified: true,
    });
  };
  const account = await connectGoogle(
    client,
    vault,
    dir,
    async (auth) => {
      const url = new URL(auth);
      assert.equal(url.hostname, 'accounts.google.com');
      assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
      challenge = url.searchParams.get('code_challenge')!;
      const redirect = new URL(url.searchParams.get('redirect_uri')!);
      const bad = new URL(redirect);
      bad.searchParams.set('state', 'ą'.repeat(64));
      assert.equal((await fetch(bad)).status, 400);
      assert.equal(calls, 0);
      redirect.search = new URLSearchParams({
        state: url.searchParams.get('state')!,
        code: 'fictional-code',
      }).toString();
      assert.equal((await fetch(redirect)).status, 200);
    },
    request,
    5000,
  );
  assert.equal(account.email, 'owner@example.test');
  assert.equal(calls, 2);
  assert.ok(vault.value?.includes('fictional-refresh'));
  const saved = readFileSync(join(dir, 'account.json'), 'utf8');
  assert.doesNotMatch(
    saved,
    /fictional-access|fictional-refresh|client_secret|fictional-client-secret/,
  );
  assert.equal(setupInfo(dir)?.subject, 'fictional-account');
});
test('Gmail OAuth: odmowa i timeout nie zapisują połączenia', async (t) => {
  for (const kind of ['cancel', 'timeout']) {
    const dir = temporary(t),
      vault = memoryVault();
    let calls = 0;
    await assert.rejects(
      () =>
        connectGoogle(
          client,
          vault,
          dir,
          async (auth) => {
            if (kind === 'timeout') return;
            const u = new URL(auth);
            const redirect = new URL(u.searchParams.get('redirect_uri')!);
            redirect.search = new URLSearchParams({
              state: u.searchParams.get('state')!,
              error: 'access_denied',
            }).toString();
            assert.equal((await fetch(redirect)).status, 400);
          },
          async () => {
            calls++;
            throw new Error('NO_NETWORK');
          },
          kind === 'timeout' ? 30 : 5000,
        ),
      (error) =>
        error instanceof DomainError && ['OAUTH_CANCELLED', 'OAUTH_TIMEOUT'].includes(error.code),
    );
    assert.equal(calls, 0);
    assert.equal(vault.value, undefined);
    assert.equal(setupInfo(dir), null);
  }
});
test('Gmail OAuth: odświeżenie i cofnięcie zgody bez utraty konfiguracji po błędzie revoke', async (t) => {
  const dir = temporary(t),
    vault = memoryVault();
  vault.value = JSON.stringify({
    client,
    accessToken: 'fictional-old',
    refreshToken: 'fictional-refresh',
    expiresAt: 0,
    account: {
      email: 'owner@example.test',
      subject: 'fictional',
      scopes: scopes.split(' '),
      connectedAt: new Date().toISOString(),
    },
  });
  let calls = 0;
  const request: typeof fetch = async () => {
    calls++;
    return Response.json({
      access_token: 'fictional-new',
      expires_in: 3600,
      scope: scopes,
      token_type: 'Bearer',
    });
  };
  assert.equal(await accessToken(vault, request), 'fictional-new');
  assert.equal(await accessToken(vault, request), 'fictional-new');
  assert.equal(calls, 1);
  await assert.rejects(
    () => disconnectGoogle(vault, dir, async () => new Response('', { status: 500 })),
    /cofnięcia zgody/,
  );
  assert.ok(vault.value);
  await disconnectGoogle(vault, dir, async () => new Response('', { status: 200 }));
  assert.equal(vault.value, undefined);
});
test('Gmail adapter: jeden request, ID oznacza przyjęcie, błędy i timeout nie mają retry', async () => {
  const mime = Buffer.from(
    'From: owner@example.test\r\nTo: receiver@example.test\r\n\r\nfictional body',
  );
  const input = {
    recipient: 'receiver@example.test',
    messageId: '<fixture@example.test>',
    mime,
    mimeHash: hash(mime),
    scenario: 'NORMAL',
  };
  for (const kind of ['ok', 'timeout', 'server', 'unauthorized', 'malformed']) {
    let calls = 0;
    const provider = new GmailMailProvider(
      async () => 'fictional-access',
      async (url, init) => {
        calls++;
        assert.equal(String(url), 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
        assert.equal(init?.redirect, 'error');
        assert.deepEqual(Buffer.from(JSON.parse(init!.body as string).raw, 'base64url'), mime);
        if (kind === 'timeout')
          throw new Error('fictional network timeout containing sensitive data');
        if (kind === 'ok')
          return Response.json({ id: 'fictional-id', threadId: 'fictional-thread' });
        if (kind === 'server') return new Response('', { status: 500 });
        if (kind === 'unauthorized') return new Response('', { status: 401 });
        return Response.json({ unexpected: true });
      },
    );
    if (kind === 'ok')
      assert.deepEqual(await provider.sendFrozenMessage(input), {
        id: 'fictional-id',
        threadId: 'fictional-thread',
        confirmed: false,
      });
    else
      await assert.rejects(
        () => provider.sendFrozenMessage(input),
        (e) =>
          e instanceof DomainError &&
          e.code === (kind === 'unauthorized' ? 'FAILED_NOT_SENT' : 'SEND_UNKNOWN') &&
          !e.message.includes('sensitive data'),
      );
    assert.equal(calls, 1);
    await assert.rejects(() => provider.lookupSendResult(input.messageId), /osobnego etapu/);
  }
});
test('Gmail MIME: polski tekst, pojedynczy odbiorca i zatwierdzone bajty PDF, bez dostawy', async () => {
  const bytes = Buffer.from('%PDF-1.4\nFictional CV\n%%EOF');
  const input = {
    sender: 'owner@example.test',
    recipient: 'receiver@example.test',
    subject: 'Współpraca z AI',
    body: 'Dzień dobry, to fikcyjna wiadomość.',
    cv: { name: 'CV.pdf', bytes, sha256: hash(bytes), approved: true },
  };
  const preview = await prepareMime(input);
  assert.match(preview.mime.toString(), /multipart\/mixed/);
  assert.match(preview.mime.toString(), /filename=CV.pdf|filename="CV.pdf"/);
  assert.ok(preview.mime.toString().includes(bytes.toString('base64')));
  assert.equal(preview.mimeHash, hash(preview.mime));
  await assert.rejects(
    () => prepareMime({ ...input, cv: { ...input.cv, approved: false } }),
    /zatwierdź CV/,
  );
  await assert.rejects(
    () => prepareMime({ ...input, cv: { ...input.cv, sha256: 'wrong' } }),
    /zmienione bajty/,
  );
  await assert.rejects(
    () => prepareMime({ ...input, sender: 'owner@example.test\r\nBcc: other@example.test' }),
    /nadawcę/,
  );
  await assert.rejects(
    () => prepareMime({ ...input, senderName: 'Owner\r\nBcc: other@example.test' }),
    /nadawcę/,
  );
});
test('Gmail MIME: jedna tożsamość nadawcy, tekst i bezpieczny HTML z tą samą treścią', async () => {
  const bytes = Buffer.from('%PDF-1.4\nFictional CV\n%%EOF');
  const body =
    'Dzień dobry,\n\nOpis <script>alert("x")</script> & <img src="pixel">.\n' +
    'GitHub: https://github.com/Fictional?x=1&y=2\njavascript:alert(1)\n\nPozdrawiam\nAlex Żółć';
  const preview = await prepareMime({
    sender: 'owner@example.test',
    senderName: 'Alex Żółć, "Junior"',
    recipient: 'receiver@example.test',
    subject: 'Kandydatura',
    body,
    cv: { name: 'CV.pdf', bytes, sha256: hash(bytes), approved: true },
  });
  const mime = preview.mime.toString('ascii');
  const headers = mime.split('\r\n\r\n')[0].replace(/\r\n[ \t]+/g, ' ');
  const from = headers.match(/^From: (.*)$/m)![1].trim();
  const addresses = addressparser(from, { flatten: true }).map((address) => ({
    ...address,
    name: decodeSubject(address.name),
  }));
  assert.deepEqual(addresses, [{ address: 'owner@example.test', name: 'Alex Żółć, "Junior"' }]);
  assert.match(mime, /multipart\/alternative/);
  const readPart = (type: string) => {
    const part = mime
      .split(/\r\n--[^\r\n]+\r\n/)
      .find((part) => part.startsWith(`Content-Type: ${type};`));
    assert.ok(part, `Missing ${type}`);
    const divider = part.indexOf('\r\n\r\n');
    const headers = part.slice(0, divider);
    const content = part.slice(divider + 4);
    if (/Content-Transfer-Encoding: base64/i.test(headers))
      return Buffer.from(content, 'base64').toString('utf8').trimEnd();
    return Buffer.from(
      content
        .replace(/=\r\n/g, '')
        .replace(/=([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))),
      'latin1',
    )
      .toString('utf8')
      .trimEnd();
  };
  assert.equal(readPart('text/plain').replace(/\r\n/g, '\n'), body);
  const html = readPart('text/html');
  assert.doesNotMatch(html, /<(script|img|style|iframe)\b/i);
  assert.doesNotMatch(html, /href="javascript:/i);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(
    html,
    /<a href="https:\/\/github\.com\/Fictional\?x=1&amp;y=2">https:\/\/github\.com\/Fictional\?x=1&amp;y=2<\/a>/,
  );
  assert.equal(textFromHTML(html), body.replace(/\s+/g, ' ').trim());
});
test('RESEARCH_ONLY: podgląd z CV wymaga zatwierdzenia pliku, ale nie tworzy approval/outbox', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-gmail-api-'));
  const { app, service, store } = await createApp({
    dir,
    port: 4381,
    worker: false,
    mode: 'RESEARCH_ONLY',
    launchToken: 'fictional-token',
    researchOptions: { runner: new FixtureRunner(), reader: new FixtureReader() },
  });
  t.after(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });
  service.approveProfile();
  await service.importURL('https://fixture.example.test');
  await service.tick();
  const cv = service.uploadCV(
    'Fictional_CV.pdf',
    Buffer.from('%PDF-1.4\nfictional CV\n%%EOF').toString('base64'),
  );
  const d = service.draftRows()[0];
  const host = '127.0.0.1:4381',
    origin = `http://${host}`;
  const login = await app.inject({
    url: '/api/session',
    method: 'POST',
    headers: { host, origin },
    payload: { token: 'fictional-token' },
  });
  const cookie = String(login.headers['set-cookie']).split(';')[0],
    csrf = login.json().csrf;
  const headers = { host, origin, cookie, 'x-csrf-token': csrf };
  const payload = { sender: 'owner@example.test', version: d.version, cvId: cv.id };
  assert.equal(
    (
      await app.inject({
        url: `/api/research/drafts/${d.id}/preview`,
        method: 'POST',
        headers,
        payload,
      })
    ).json().code,
    'CV_NOT_APPROVED',
  );
  service.approveCV(cv.id);
  const preview = await app.inject({
    url: `/api/research/drafts/${d.id}/preview`,
    method: 'POST',
    headers,
    payload,
  });
  assert.equal(preview.statusCode, 200);
  assert.equal(preview.json().sent, false);
  assert.match(Buffer.from(preview.json().base64, 'base64').toString(), /multipart\/mixed/);
  assert.equal(store.all('SELECT * FROM draft_approvals').length, 0);
  assert.equal(store.all('SELECT * FROM outbox').length, 0);
  assert.equal(store.all('SELECT * FROM send_attempts').length, 0);
  const forbidden = await app.inject({
    url: '/api/drafts/approve-batch',
    method: 'POST',
    headers,
    payload: { drafts: [{ id: d.id, version: d.version }] },
  });
  assert.equal(forbidden.statusCode, 409);
});
