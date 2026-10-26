import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { runResearchSession } from '../apps/server/src/research/session-entry.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';

for (const mode of ['AUTO_POLICY', 'APPROVAL_REQUIRED'] as const)
  test(`research operator preserves existing ${mode} policy/history while using no Gmail`, async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'jh-session-preserve-'));
    t.after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
    const providers = { reader: new FixtureReader(), runner: new FixtureRunner() };
    const store = new Store(dir);
    const initial = new ResearchJobHunter(store, { ...providers, mode, independentResearch: true });
    initial.approveProfile();
    await initial.importURL('https://fixture.example.test/careers');
    await initial.tick();
    initial.control('stop');
    const draft = initial.draftRows()[0];
    // Expired synthetic history, never a current send grant. Mode changes must
    // not rewrite it merely to run independent research.
    store.exec(
      'INSERT INTO draft_approvals VALUES (?,?,?,?,?,?,?,NULL,?)',
      'historical-approval',
      draft.id,
      draft.version,
      draft.payload_hash,
      initial.binding(draft),
      'user',
      '2020-01-01T00:00:00Z',
      '2019-01-01T00:00:00Z',
    );
    const approval = store.one('SELECT * FROM draft_approvals WHERE id=?', 'historical-approval');
    const policy = { policyVersion: 17, scopeHash: 'old-synthetic-pilot-only' };
    store.set('autoPolicy', policy);
    const campaign = store.one('SELECT * FROM campaigns WHERE id=?', 'research');
    await initial.stopWorker();
    store.close();
    writeFileSync(join(dir, 'development.json'), '{}');
    const result = await runResearchSession({
      dir,
      hours: 1,
      fixture: true,
      providers,
      steps: 1,
      afterTick: async (service) => {
        assert.equal(service.mode, mode);
        assert.equal('gateway' in service, false);
        assert.equal(service.store.one('SELECT count(*) n FROM auto_run_scope')!.n, 0);
      },
    });
    assert.equal(result.counts.attempts, 0);
    assert.equal(result.state.finalGuardOk, true);
    const resumed = await runResearchSession({
      dir,
      hours: 1,
      fixture: true,
      providers,
      steps: 1,
      resume: true,
      afterTick: async (service) => {
        assert.equal(service.mode, mode);
        assert.equal('gateway' in service, false);
        assert.equal(service.store.one('SELECT count(*) n FROM auto_run_scope')!.n, 0);
      },
    });
    assert.equal(resumed.state.deadline, result.state.deadline);
    assert.equal(resumed.state.finalGuardOk, true);
    assert.equal(resumed.counts.attempts, 0);
    const db = new Database(join(dir, 'jobhunter.sqlite'), { readonly: true, fileMustExist: true });
    try {
      const state = (key: string) =>
        JSON.parse((db.prepare('SELECT value FROM app_state WHERE key=?').get(key) as any).value);
      assert.equal(state('mode'), mode);
      assert.deepEqual(state('autoPolicy'), policy);
      assert.deepEqual(db.prepare('SELECT * FROM campaigns WHERE id=?').get('research'), campaign);
      assert.deepEqual(
        db.prepare('SELECT * FROM draft_approvals WHERE id=?').get('historical-approval'),
        approval,
      );
      for (const table of [
        'send_attempts',
        'outbox',
        'usage_ledger',
        'auto_sessions',
        'auto_batches',
      ])
        assert.equal((db.prepare(`SELECT count(*) n FROM ${table}`).get() as any).n, 0);
    } finally {
      db.close();
    }
  });
