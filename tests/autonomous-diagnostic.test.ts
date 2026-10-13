import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createPublicDiagnostic,
  reopenPublicDiagnostic,
} from '../apps/server/src/research/diagnostic.js';
import { AutonomousDiagnostic } from '../apps/server/src/research/autonomous-diagnostic.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';

test('planner → worker continues through failed site, duplicates and empty batch, preserves results across restart without mail authority', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-autonomous-fixture-'));
  const runner = new FixtureRunner(),
    fixture = new FixtureReader();
  runner.prospect = fixture.prospect = true;
  const reader = {
    read: async (url: string) => {
      const s = await fixture.read(url);
      return url.includes('bad.example.test')
        ? {
            ...s,
            status: 'HTTP_ERROR',
            text: '',
            fragment: '',
            content_hash: null,
            error: 'fixture 404',
          }
        : s;
    },
  };
  const queries: string[] = [];
  const search = {
    search: async (q: string) => {
      queries.push(q);
      const urls =
        queries.length === 2
          ? [
              { url: 'https://bad.example.test/', contactUrl: null },
              { url: 'https://fixture.example.test/', contactUrl: null },
            ]
          : queries.length === 3
            ? [{ url: 'https://fixture.example.test/', contactUrl: null }]
            : [];
      return { urls, queries: [q] };
    },
  };
  const d = createPublicDiagnostic(dir, { runner, reader, search, maxCompanies: 4 });
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  await d.service.probe('search');
  const policy = {
    scopeHash: 'fixture-public-policy',
    searchScope: 'Polska',
    profileHash: d.service.minimalProfile().hash,
  };
  const a = new AutonomousDiagnostic(d.store, d.service, policy);
  const first = await a.cycle();
  assert.equal(first.metrics.contacts, 1);
  assert.equal(first.metrics.checkedDrafts, 1);
  assert.deepEqual(first.metrics.errors, ['NO_READABLE_SOURCE']);
  const second = await a.cycle();
  assert.equal(second.metrics.duplicates, 1);
  assert.equal(second.metrics.newCompanies, 0);
  const third = await a.cycle();
  assert.equal(third.metrics.newCompanies, 0);
  assert.equal(new Set(queries.slice(1)).size, 3);
  assert.equal(d.store.get('plannerEmpty:fixture-public-policy', 0), 2);
  const versions = d.store.one('SELECT count(*) n FROM research_draft_materials')!.n;
  assert.equal(versions, 1);
  d.service.control('stop');
  await d.service.stopWorker();
  d.store.close();
  const resumed = reopenPublicDiagnostic(dir, runner, reader);
  assert.equal(resumed.service.state().stopped, true);
  assert.equal(resumed.store.all('SELECT * FROM auto_query_plan').length, 3);
  assert.equal(resumed.summary().drafts, 1);
  for (const table of ['send_attempts', 'outbox', 'draft_approvals', 'auto_sessions'])
    assert.equal(resumed.store.one(`SELECT count(*) n FROM ${table}`)!.n, 0);
  resumed.store.close();
});

test('public worker reads literal navigation even when homepage already contains an unrelated mailbox', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-navigation-fixture-'));
  const fixture = new FixtureReader(),
    runner = new FixtureRunner();
  fixture.prospect = runner.prospect = true;
  const urls: string[] = [];
  const reader = {
    read: async (url: string) => {
      urls.push(url);
      return fixture.read(url);
    },
    relatedURLs: () => [
      'https://fixture.example.test/career',
      'https://other.example.test/contact',
    ],
  };
  const d = createPublicDiagnostic(dir, { runner, reader });
  t.after(() => {
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await d.service.probe('search');
  await d.service.start();
  await d.service.tick();
  assert.ok(urls.includes('https://fixture.example.test/career'));
  assert.ok(!urls.includes('https://other.example.test/contact'));
});
