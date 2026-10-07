import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../apps/server/src/app.js';

test('lokalne API: Host, Origin, sesja, CSRF i odrzucanie trybów live', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jobhunter-api-'));
  const { app } = await createApp({ dir, port: 4321, launchToken: 'test-token', worker: false });
  t.after(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const host = '127.0.0.1:4321',
    origin = `http://${host}`;
  assert.equal((await app.inject({ url: '/api/health', headers: { host } })).statusCode, 200);
  assert.equal((await app.inject({ url: '/api/profile', headers: { host } })).statusCode, 401);
  assert.equal(
    (await app.inject({ url: '/api/health', headers: { host: 'evil.example' } })).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        url: '/api/session',
        method: 'POST',
        headers: { host, origin: 'https://evil.example' },
        payload: { token: 'test-token' },
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        url: '/api/session',
        method: 'POST',
        headers: { host },
        payload: { token: 'test-token' },
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        url: '/api/session',
        method: 'POST',
        headers: { host, origin },
        payload: { token: 'bad' },
      })
    ).statusCode,
    403,
  );
  const login = await app.inject({
    url: '/api/session',
    method: 'POST',
    headers: { host, origin },
    payload: { token: 'test-token' },
  });
  assert.equal(login.statusCode, 200);
  const cookie = String(login.headers['set-cookie']).split(';')[0],
    csrf = login.json().csrf;
  assert.match(String(login.headers['set-cookie']), /HttpOnly/);
  assert.match(String(login.headers['set-cookie']), /SameSite=Strict/i);
  const headers = { host, origin, cookie, 'x-csrf-token': csrf };
  assert.equal(
    (
      await app.inject({
        url: '/api/profile/approve',
        method: 'POST',
        headers: { host, origin, cookie },
        payload: {},
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        url: '/api/profile/approve',
        method: 'POST',
        headers: { ...headers, origin: 'null' },
        payload: {},
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        url: '/api/profile/approve',
        method: 'POST',
        headers: { ...headers, 'sec-fetch-site': 'cross-site' },
        payload: {},
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (await app.inject({ url: '/api/profile/approve', method: 'POST', headers, payload: {} }))
      .statusCode,
    200,
  );
  assert.equal(
    (
      await app.inject({
        url: '/api/campaign',
        method: 'PUT',
        headers,
        payload: { mode: 'AUTO_POLICY' },
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (
      await app.inject({
        url: '/api/send-any-email',
        method: 'POST',
        headers,
        payload: { to: 'live@example.com' },
      })
    ).statusCode,
    404,
  );
  assert.equal(
    (await app.inject({ url: '/api/capabilities', headers: { host, cookie } })).json().liveEnabled,
    false,
  );
  assert.equal(
    (await app.inject({ url: '/api/campaign/start', method: 'POST', headers, payload: {} }))
      .statusCode,
    200,
  );
});
