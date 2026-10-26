import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runResearchSession } from '../apps/server/src/research/session-entry.js';
import { Store } from '../apps/server/src/db.js';

test('one-hour operator entry uses the full immutable deadline without legacy trial caps or Gmail', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-entry-hour-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  let deadline = '';
  const summary = await runResearchSession({
    dir: join(root, 'fixture'),
    hours: 1,
    fixture: true,
    steps: 6,
    advanceMs: 16 * 60000,
    afterTick: async (service) => {
      const work = service.store.get<any>('researchDay', {});
      deadline ||= work.expiresAt;
      assert.equal(work.expiresAt, deadline);
      assert.equal(work.trial, false);
      assert.equal(work.maxCycles, null);
      assert.equal(service.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
    },
  });
  assert.equal(summary.state.primaryReason, 'DEADLINE');
  assert.equal(summary.counts.attempts, 0);
  assert.equal(summary.state.finalGuardOk, true);
});
test('native repository entry: synthetic cycles, immutable deadline, guard, Stop and explicit restart', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-entry-')),
    dir = join(root, 'fixture');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  let deadline = '';
  const summary = await runResearchSession({
    dir,
    hours: 8,
    fixture: true,
    steps: 3,
    advanceMs: 16 * 60000,
    afterTick: async (service, index) => {
      const w = service.store.get<any>('researchDay', {});
      deadline ||= w.expiresAt;
      if (index < 2) assert.equal(w.expiresAt, deadline);
      if (index === 1)
        service.store.set('researchDay', {
          ...w,
          expiresAt: new Date(Date.parse(deadline) + 1).toISOString(),
        });
    },
  });
  assert.equal(summary.counts.attempts, 0);
  assert.ok(summary.state.lastGuardFinishedAt);
  assert.equal(summary.state.phase, 'FINISHED');
  assert.equal(summary.state.primaryReason, 'DEADLINE_CHANGED');
  assert.ok(summary.state.operationsEndedAt);
  const db = new Store(dir);
  assert.equal(db.get<any>('researchDay', {}).active, false);
  db.close();
  await assert.rejects(
    () => runResearchSession({ dir, hours: 8, fixture: true, resume: true, steps: 1 }),
    { code: 'RESEARCH_BASELINE_REQUIRED' },
  );
});
test('entry rejects invalid configuration and nonempty unmarked directories before opening a database', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-entry-invalid-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, 'unrelated'), 'synthetic');
  await assert.rejects(() => runResearchSession({ dir, hours: 8, fixture: true, steps: 1 }), {
    code: 'DEVELOPMENT_REQUIRED',
  });
  await assert.rejects(
    () => runResearchSession({ dir: join(dir, 'new'), hours: NaN, fixture: true, steps: 1 }),
    { code: 'SESSION_OPTIONS' },
  );
});
