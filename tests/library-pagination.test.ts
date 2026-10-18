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
  app.service.approveProfile();
  await app.service.start();
  await app.service.tick();
  app.service.control('stop');
  const example = app.store.one('SELECT * FROM opportunities LIMIT 1')!;
  const columns = Object.keys(example);
  app.store.exec(
    "UPDATE opportunities SET company_id=?,decision='READY_APPLICATION' WHERE id=?",
    selected[0].id,
    example.id,
  );
  app.store.exec(
    'INSERT INTO opportunities (' +
      columns.join(',') +
      ') VALUES (' +
      columns.map(() => '?').join(',') +
      ')',
    ...columns.map((key) =>
      key === 'id'
        ? 'fixture-newest'
        : key === 'title'
          ? 'Different newest role'
          : key === 'company_id'
            ? selected[0].id
            : key === 'decision'
              ? 'REJECTED'
              : key === 'updated_at'
                ? '2099-01-01T00:00:00.000Z'
                : example[key],
    ),
  );
  const filtered = await app.app.inject({
    url: '/api/companies?search=paged250.example.test&filter=READY_APPLICATION&limit=1',
    headers,
  });
  assert.equal(filtered.statusCode, 200);
  assert.equal(filtered.headers['x-total-count'], '1');
  assert.equal(filtered.json()[0].opportunity_id, example.id);
  assert.equal(filtered.json()[0].decision, 'READY_APPLICATION');
  const unfiltered = app.service.companies({ id: selected[0].id, limit: 1 });
  assert.equal(unfiltered[0].opportunity_id, 'fixture-newest');
  const detail = await app.app.inject({ url: '/api/companies/' + selected[0].id, headers });
  assert.equal(detail.json().company.id, selected[0].id);
  assert.equal(detail.json().opportunities.length, 2);
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
