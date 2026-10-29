import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { runLibraryRefresh } from '../apps/server/src/research/library-refresh-entry.js';
import { acquireProfileLock } from '../apps/server/src/backend-lock.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';

async function fixture(t: any) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-refresh-entry-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const store = new Store(dir),
    reader = new FixtureReader(),
    runner = new FixtureRunner();
  const service = new ResearchJobHunter(store, { reader, runner });
  service.approveProfile();
  const cv = service.uploadCV(
    'Fixture.pdf',
    Buffer.from('%PDF-1.4\nSynthetic\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  service.control('stop');
  const draft = service.draftRows()[0];
  await service.stopWorker();
  store.close();
  writeFileSync(join(dir, 'development.json'), JSON.stringify({ kind: 'DEVELOPMENT' }));
  const snapshot = () => {
    const db = new Database(join(dir, 'jobhunter.sqlite'), { readonly: true });
    try {
      return Object.fromEntries(
        [
          'outbox',
          'draft_approvals',
          'send_attempts',
          'usage_ledger',
          'browser_deliveries',
          'gmail_outbox',
          'gmail_previews',
          'auto_sessions',
          'auto_batches',
          'draft_versions',
        ].map((table) => [table, db.prepare('SELECT * FROM ' + table + ' ORDER BY rowid').all()]),
      );
    } finally {
      db.close();
    }
  };
  const before = snapshot();
  const preserved = () => {
    const after = snapshot();
    for (const table of Object.keys(before)) {
      if (table === 'draft_versions')
        assert.deepEqual(after[table].slice(0, before[table].length), before[table]);
      else assert.deepEqual(after[table], before[table], table);
    }
    assert.equal(existsSync(join(dir, 'profile.lock')), false);
  };
  return {
    dir,
    draft,
    reader,
    runner,
    preserved,
    options: { dir, draftIds: [draft.id], minutes: 1, fixture: { reader, runner } },
  };
}

test('refresh entry checks real fixture sources, preserves versions and creates zero mail/rights/actions', async (t) => {
  const f = await fixture(t),
    calls = f.reader.calls;
  const result = await runLibraryRefresh(f.options);
  assert.equal(result.reason, 'COMPLETED');
  assert.equal(result.results[0].code, 'CHECKED');
  assert.equal(result.results[0].sameText, true);
  assert.equal(result.preserved, true);
  assert.equal(result.sendAuthority, false);
  assert.ok(f.reader.calls > calls);
  f.preserved();
});
test('explicit scoped renewal preserves the old scope and needs an exact opt-in', async (t) => {
  const f = await fixture(t),
    store = new Store(f.dir);
  store.exec(
    'INSERT INTO auto_draft_scope(draft_id,scope_hash) VALUES (?,?)',
    f.draft.id,
    'old-stopped-scope',
  );
  store.close();
  const calls = f.reader.calls;
  const protectedResult = await runLibraryRefresh(f.options);
  assert.equal(protectedResult.results[0].code, 'PROTECTED_DRAFT');
  assert.equal(f.reader.calls, calls);
  await assert.rejects(runLibraryRefresh({ ...f.options, renewScopedDraftIds: ['foreign'] }), {
    code: 'REFRESH_OPTIONS',
  });
  const explicitProtection = await runLibraryRefresh({
    ...f.options,
    renewScopedDraftIds: [f.draft.id],
    protectedDraftIds: [f.draft.id],
  });
  assert.equal(explicitProtection.results[0].code, 'PROTECTED_DRAFT');
  assert.equal(f.reader.calls, calls);
  const result = await runLibraryRefresh({ ...f.options, renewScopedDraftIds: [f.draft.id] });
  assert.equal(result.reason, 'COMPLETED');
  assert.equal(result.results[0].code, 'CHECKED');
  assert.ok(f.reader.calls > calls);
  const db = new Database(join(f.dir, 'jobhunter.sqlite'), { readonly: true });
  try {
    assert.deepEqual(db.prepare('SELECT * FROM auto_draft_scope').all(), [
      { draft_id: f.draft.id, scope_hash: 'old-stopped-scope' },
    ]);
  } finally {
    db.close();
  }
  f.preserved();
});
test('refresh entry rejects cancellation before opening history', async (t) => {
  const f = await fixture(t),
    signal = AbortSignal.abort();
  await assert.rejects(runLibraryRefresh({ ...f.options, signal }));
  f.preserved();
});
test('refresh entry cancels in-flight read, retains pending invalidation and releases lock', async (t) => {
  const f = await fixture(t),
    controller = new AbortController();
  f.reader.read = async (_url, signal) => {
    controller.abort();
    signal!.throwIfAborted();
    throw Error('unreachable');
  };
  const result = await runLibraryRefresh({ ...f.options, signal: controller.signal });
  assert.equal(result.reason, 'STOPPED');
  assert.equal(result.results.length, 0);
  assert.deepEqual(result.unreturnedBatch, [f.draft.id]);
  assert.equal(result.preserved, true);
  f.preserved();
});
test('refresh entry deadline cancels a blocked source and never renews its budget', async (t) => {
  const f = await fixture(t);
  f.reader.read = async (_url, signal) => {
    await new Promise<void>((resolve) =>
      signal!.addEventListener('abort', () => resolve(), { once: true }),
    );
    signal!.throwIfAborted();
    throw Error('unreachable');
  };
  const result = await runLibraryRefresh({ ...f.options, minutes: 0.0005 });
  assert.equal(result.reason, 'DEADLINE');
  assert.equal(Date.parse(result.deadline) - Date.parse(result.startedAt), 30);
  assert.equal(result.results.length, 0);
  f.preserved();
});
test('refresh entry respects a live profile lock', async (t) => {
  const f = await fixture(t),
    lock = acquireProfileLock(f.dir);
  try {
    await assert.rejects(runLibraryRefresh(f.options), { code: 'PROFILE_LOCKED' });
  } finally {
    lock.release();
  }
  f.preserved();
});
test('refresh entry rejects foreign IDs and a budget over sixty minutes without new work', async (t) => {
  const f = await fixture(t),
    calls = f.reader.calls;
  assert.equal(
    (await runLibraryRefresh({ ...f.options, draftIds: ['foreign'] })).reason,
    'NOT_FOUND',
  );
  await assert.rejects(runLibraryRefresh({ ...f.options, minutes: 61 }), {
    code: 'REFRESH_OPTIONS',
  });
  assert.equal(f.reader.calls, calls);
  f.preserved();
});
test('renewal after profile change supplies the exact old message for minimal repair', async (t) => {
  const f = await fixture(t),
    store = new Store(f.dir);
  const service = new ResearchJobHunter(store, { reader: f.reader, runner: f.runner });
  const p = service.profile();
  service.updateProfile({
    name: p.name,
    goal: p.goal + ' Aktualizacja zatwierdzonych materiałów.',
    hours_approx: p.hours_approx,
    version: p.version,
    message_template: p.message_template,
    facts: p.facts.map((f) => ({ id: f.id, content: f.content })),
  });
  service.approveProfile();
  service.control('stop');
  store.close();
  const result = await runLibraryRefresh(f.options);
  assert.equal(result.reason, 'COMPLETED');
  assert.ok(
    f.runner.prompts.some(
      (p) =>
        p.includes('POPRAW ISTNIEJĄCY SZKIC') &&
        p.includes(JSON.stringify({ subject: f.draft.subject, body: f.draft.body })),
    ),
  );
  f.preserved();
});

test('a previous extraction policy cannot masquerade as current analysis reuse; the next current-policy refresh reuses normally', async (t) => {
  const f = await fixture(t),
    store = new Store(f.dir);
  const item = store.one(
    'SELECT url,analysis FROM research_items WHERE opportunity_id=? AND analysis IS NOT NULL ORDER BY rowid DESC LIMIT 1',
    f.draft.opportunity_id,
  )!;
  const profile = store.one("SELECT profile_hash FROM candidate_profiles WHERE id='candidate'")!;
  const key = `extractionPolicy:${item.url}:${profile.profile_hash}`;
  const current = store.get<number>(key, 0);
  assert.ok(current > 1);
  store.set(key, current - 1);
  store.close();
  const before = f.runner.prompts.length;
  const first = await runLibraryRefresh(f.options);
  assert.equal(first.reason, 'COMPLETED');
  assert.equal(first.results[0].code, 'CHECKED');
  assert.ok(
    f.runner.prompts.slice(before).some((p) => p.includes('Wydobądź firmę')),
    'old policy must require a new extraction even when source bytes and profile match',
  );
  const after = f.runner.prompts.length;
  const second = await runLibraryRefresh(f.options);
  assert.equal(second.reason, 'COMPLETED');
  assert.equal(second.results[0].code, 'CHECKED');
  assert.ok(
    !f.runner.prompts.slice(after).some((p) => p.includes('Wydobądź firmę')),
    'current compatible analysis is reused without repeated model calls',
  );
  const db = new Database(join(f.dir, 'jobhunter.sqlite'), { readonly: true });
  try {
    assert.ok(
      db.prepare('SELECT id FROM research_items WHERE analysis=?').get(item.analysis),
      'historical analysis is retained',
    );
  } finally {
    db.close();
  }
  f.preserved();
});
