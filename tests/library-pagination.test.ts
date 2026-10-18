import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../apps/server/src/app.js';
test('library pages use SQL limits and details by ID; all records remain reachable and dashboard polling reuses dated health', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-pagination-')),
    app = await createApp({ dir, port: 9995, worker: false, launchToken: 'synthetic' });
  t.after(async () => {
    await app.app.close();
    rmSync(dir, { recursive: true, force: true });
  });
  app.store.atomic(() => {
    for (let i = 0; i < 251; i++)
      app.service.findOrCreateCompany('Paged ' + i, `paged${i}.example.test`);
  });
  const host = { host: '127.0.0.1:9995' },
    origin = 'http://127.0.0.1:9995';
  const login = await app.app.inject({
    method: 'POST',
    url: '/api/session',
    headers: { ...host, origin },
    payload: { token: 'synthetic' },
  });
  const cookie = login.headers['set-cookie']!.toString().split(';')[0],
    headers = { ...host, cookie };
  const ids: string[] = [];
  let total = 0;
  for (let offset = 0; ; offset += 100) {
    const response = await app.app.inject({
      url: '/api/companies?limit=100&offset=' + offset,
      headers,
    });
    assert.equal(response.statusCode, 200);
    total = Number(response.headers['x-total-count']);
    const rows = response.json();
    ids.push(...rows.map((r: any) => r.id));
    assert.ok(rows.length <= 100);
    if (rows.length < 100) break;
  }
  assert.equal(new Set(ids).size, total);
  assert.equal(ids.length, total);
  assert.ok(total >= 251);
  const selected = app.service.companies({ search: 'Paged 250', limit: 10 });
  assert.equal(selected.length, 1);
  const detail = await app.app.inject({ url: '/api/companies/' + selected[0].id, headers });
  assert.equal(detail.json().company.id, selected[0].id);
  let pragmas = 0;
  const pragma = app.store.db.pragma.bind(app.store.db);
  app.store.db.pragma = (...args: any[]) => {
    pragmas++;
    return pragma(...(args as [any]));
  };
  for (let i = 0; i < 3; i++)
    assert.equal((await app.app.inject({ url: '/api/dashboard', headers })).statusCode, 200);
  assert.equal(pragmas, 0);
  assert.ok(app.store.healthStatus().checkedAt);
  const perf = (await app.app.inject({ url: '/api/performance', headers })).json();
  assert.ok(perf.measurements.some((m: any) => m.sqlDriverMs >= 0 && m.serializationMs >= 0));
});
