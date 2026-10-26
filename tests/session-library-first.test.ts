import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { runResearchSession } from '../apps/server/src/research/session-entry.js';
import { ManyReader, ManyRunner } from './auto-fixture.js';
import { hash } from '../apps/server/src/util.js';
import Database from 'better-sqlite3';

async function library(t: any) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-library-entry-'));
  t.after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  writeFileSync(join(dir, 'development.json'), '{}');
  let time = Date.now(),
    armed = false;
  const clock = () => new Date(time),
    reader = new ManyReader(),
    runner = new ManyRunner();
  const reads: string[] = [];
  const read = reader.read.bind(reader);
  reader.read = async (url, signal) => {
    if (armed) reads.push(url);
    const source = await read(url, signal);
    source.fetched_at = clock().toISOString();
    if (armed) {
      source.text += '\nUpdated page layout.';
      source.content_hash = hash(source.text + url);
      if (url.includes('fixture2.')) source.status = 'INCOMPLETE';
    }
    return source;
  };
  const store = new Store(dir),
    service = new ResearchJobHunter(store, { reader, runner, clock });
  service.approveProfile();
  for (let i = 1; i <= 3; i++) {
    time += 1000;
    await service.importURL(`https://fixture${i}.example.test/careers`);
    await service.tick();
  }
  const drafts = service.draftRows().sort((a, b) => a.email.localeCompare(b.email));
  assert.equal(drafts.length, 3);
  service.control('stop');
  await service.stopWorker();
  store.close();
  time += 25 * 3600000;
  armed = true;
  return { dir, reader, runner, clock, drafts, reads, advance: (ms: number) => (time += ms) };
}

test('operator entry renews native A, holds incomplete B, renews C before discovery without Gmail', async (t) => {
  const f = await library(t);
  let first = true;
  const summary = await runResearchSession({
    dir: f.dir,
    hours: 2,
    fixture: true,
    providers: f,
    clock: f.clock,
    steps: 5,
    afterTick: async (service) => {
      const work = service.store.get<any>('researchDay', {});
      if (first) {
        first = false;
        assert.equal(work.libraryRefresh?.queue.length, 3, 'operator must use existing library');
        assert.deepEqual(
          work.libraryRefresh.queue,
          f.drafts.map((d) => d.id),
        );
        assert.equal(
          service.store.one(
            "SELECT count(*) n FROM runs WHERE id IN (SELECT value FROM json_each(?)) AND stage='SEARCH'",
            JSON.stringify(work.runIds),
          )!.n,
          0,
        );
      }
      assert.equal('gateway' in service, false);
      assert.equal(service.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
    },
  });
  assert.equal(summary.state.finalGuardOk, true);
  const store = new Store(f.dir);
  try {
    const work = store.get<any>('researchDay', {});
    assert.equal(work.libraryRefresh.completed, true);
    assert.equal(work.libraryRefresh.results.length, 3);
    assert.equal(work.libraryRefresh.results.filter((r: any) => r.code === 'CHECKED').length, 2);
    assert.equal(
      work.libraryRefresh.results.find((r: any) => r.draftId === f.drafts[1].id).code,
      'STALE_EVIDENCE',
    );
    for (const draft of [f.drafts[0], f.drafts[2]]) {
      const current = store.one('SELECT * FROM drafts WHERE id=?', draft.id)!;
      assert.ok(current.version > draft.version);
      assert.equal(
        store.one(
          'SELECT review_status FROM research_draft_materials WHERE draft_id=? AND version=?',
          draft.id,
          current.version,
        )!.review_status,
        'COMPLETED',
      );
      assert.ok(
        store.one(
          'SELECT id FROM draft_versions WHERE draft_id=? AND version=? AND payload_hash=?',
          draft.id,
          current.version,
          current.payload_hash,
        ),
      );
    }
    assert.equal(
      store.one('SELECT version FROM drafts WHERE id=?', f.drafts[1].id)!.version,
      f.drafts[1].version,
    );
    assert.equal(work.expiresAt, summary.state.deadline);
    assert.ok(work.runIds.length >= 3, 'refresh native runs are included in the session report');
    assert.equal(store.one('SELECT count(*) n FROM auto_sessions')!.n, 0);
    assert.equal(store.one('SELECT count(*) n FROM outbox')!.n, 0);
  } finally {
    store.close();
  }
});

test('refresh budget hands discovery the original deadline rather than starting a new session', async (t) => {
  const f = await library(t),
    read = f.reader.read.bind(f.reader);
  let advanced = false,
    deadline = '';
  f.reader.read = async (...args) => {
    if (!advanced) {
      advanced = true;
      f.advance(25 * 60000);
    }
    return read(...args);
  };
  const result = await runResearchSession({
    dir: f.dir,
    hours: 1,
    fixture: true,
    providers: f,
    clock: f.clock,
    steps: 3,
    afterTick: async (service) => {
      const work = service.store.get<any>('researchDay', {});
      deadline ||= work.expiresAt;
      assert.equal(work.expiresAt, deadline);
      assert.equal(work.libraryRefresh.completed, true);
      assert.equal(work.libraryRefresh.budgetReason, 'DEADLINE');
    },
  });
  assert.equal(result.state.deadline, deadline);
  assert.equal(result.state.finalGuardOk, true);
  assert.equal(result.counts.attempts, 0);
});

test('explicit Resume retains the queue, results and deadline without repeating completed renewal', async (t) => {
  const f = await library(t);
  const first = await runResearchSession({
    dir: f.dir,
    hours: 2,
    fixture: true,
    providers: f,
    clock: f.clock,
    steps: 1,
  });
  const before = new Store(f.dir),
    checkpoint = before.get<any>('researchDay', {}).libraryRefresh;
  before.close();
  const firstReads = f.reads.length;
  const second = await runResearchSession({
    dir: f.dir,
    hours: 2,
    resume: true,
    fixture: true,
    providers: f,
    clock: f.clock,
    steps: 1,
  });
  const after = new Store(f.dir);
  try {
    const work = after.get<any>('researchDay', {});
    assert.deepEqual(work.libraryRefresh.queue, checkpoint.queue);
    assert.equal(work.libraryRefresh.nextIndex, 2);
    assert.deepEqual(work.libraryRefresh.results[0], checkpoint.results[0]);
    assert.equal(second.state.deadline, first.state.deadline);
    const secondHost = f.drafts.find((d) => d.id === checkpoint.queue[1])!.email.split('@')[1];
    assert.ok(f.reads.slice(firstReads).every((url) => new URL(url).hostname === secondHost));
    assert.equal(after.get('stopped', false), true);
    assert.equal(work.active, false);
    assert.equal(second.state.finalGuardOk, true);
  } finally {
    after.close();
  }
});

test('Stop during a native renewal aborts the reader and cannot start discovery or publish a late version', async (t) => {
  const f = await library(t),
    abort = new AbortController(),
    read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    abort.abort();
    signal?.throwIfAborted();
    return read(url, signal);
  };
  await assert.rejects(
    () =>
      runResearchSession({
        dir: f.dir,
        hours: 2,
        fixture: true,
        providers: f,
        clock: f.clock,
        signal: abort.signal,
        steps: 2,
      }),
    { name: 'AbortError' },
  );
  const store = new Store(f.dir);
  try {
    const work = store.get<any>('researchDay', {});
    assert.equal(work.active, false);
    assert.equal(store.get('stopped', false), true);
    assert.equal(store.get<any>('researchController', {}).phase, 'FINISHED');
    assert.equal(store.get<any>('researchController', {}).finalGuardOk, true);
    assert.equal(work.cycles, 0);
    for (const d of f.drafts)
      assert.equal(store.one('SELECT version FROM drafts WHERE id=?', d.id)!.version, d.version);
    assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  } finally {
    store.close();
  }
});

test('fixture step limit works without afterTick and does not require an abort or clock tamper', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-entry-steps-'));
  t.after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  const abort = new AbortController();
  let waits = 0;
  await runResearchSession({
    dir,
    hours: 1,
    fixture: true,
    steps: 1,
    signal: abort.signal,
    wait: async () => {
      if (++waits === 2) abort.abort();
    },
  });
  assert.equal(waits, 0, 'steps must increment independently of an optional callback');
});

test('profile tampering during renewal triggers the same global guard before publishing a version', async (t) => {
  const f = await library(t),
    read = f.reader.read.bind(f.reader);
  let changed = false;
  f.reader.read = async (...args) => {
    const result = await read(...args);
    if (!changed) {
      const db = new Database(join(f.dir, 'jobhunter.sqlite'));
      db.prepare("UPDATE candidate_profiles SET version=version+1 WHERE id='candidate'").run();
      db.close();
      changed = true;
    }
    return result;
  };
  await assert.rejects(
    () =>
      runResearchSession({
        dir: f.dir,
        hours: 2,
        fixture: true,
        providers: f,
        clock: f.clock,
        steps: 2,
      }),
    { code: 'RESEARCH_GUARD_FAILED' },
  );
  const store = new Store(f.dir);
  try {
    assert.equal(store.get<any>('researchController', {}).primaryReason, 'PROTECTED_DATA_CHANGED');
    assert.equal(store.get<any>('researchDay', {}).active, false);
    assert.equal(store.get('stopped', false), true);
    for (const d of f.drafts)
      assert.equal(store.one('SELECT version FROM drafts WHERE id=?', d.id)!.version, d.version);
    assert.equal(store.one('SELECT count(*) n FROM outbox')!.n, 0);
  } finally {
    store.close();
  }
});

test('new Start defers an old passive discovery checkpoint before library renewal without deleting its items', async (t) => {
  const f = await library(t),
    store = new Store(f.dir),
    initial = new ResearchJobHunter(store, { ...f });
  await initial.importURL('https://fixture4.example.test/careers');
  initial.control('stop');
  const old = store.one("SELECT * FROM runs WHERE status='PAUSED'")!,
    items = store.all('SELECT * FROM research_items WHERE run_id=?', old.id);
  await initial.stopWorker();
  store.close();
  await runResearchSession({
    dir: f.dir,
    hours: 2,
    fixture: true,
    providers: f,
    clock: f.clock,
    steps: 1,
  });
  const after = new Store(f.dir);
  try {
    const work = after.get<any>('researchDay', {});
    assert.equal(work.cycles, 0);
    assert.equal(work.libraryRefresh.results.length, 1);
    assert.equal(after.one('SELECT status FROM runs WHERE id=?', old.id)!.status, 'PARTIAL');
    assert.equal(
      after.all('SELECT * FROM research_items WHERE run_id=?', old.id).length,
      items.length,
    );
    assert.ok(after.get<any>(`researchDeferred:${items[0].id}`, null));
    assert.equal(after.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  } finally {
    after.close();
  }
});
