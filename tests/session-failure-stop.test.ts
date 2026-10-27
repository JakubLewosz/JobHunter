import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { runResearchSession } from '../apps/server/src/research/session-entry.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { CodexCallError } from '../apps/server/src/research/codex.js';

for (const mode of ['RESEARCH_ONLY', 'AUTO_POLICY', 'APPROVAL_REQUIRED'] as const)
  test(`operator ${mode}: native CLI failure ends STOPPED with the original reason and no retry`, async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'jh-entry-failure-'));
    t.after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
    const runner = new FixtureRunner(),
      read = runner.run.bind(runner);
    let searches = 0;
    runner.run = async (...args) => {
      if (args[2]?.search && ++searches > 1)
        throw new CodexCallError('CODEX_FAILED', 'Native CLI exited with 1', {
          exitCode: 1,
          operation: 'EXEC',
          message: 'workspace routing discovery failed',
        });
      return read(...args);
    };
    const providers = { reader: new FixtureReader(), runner };
    let store = new Store(dir);
    const initial = new ResearchJobHunter(store, { ...providers, mode, independentResearch: true });
    initial.approveProfile();
    store.set('autoPolicy', { policyVersion: 17, scopeHash: 'synthetic-old-pilot' });
    const campaign = store.one("SELECT * FROM campaigns WHERE id='research'");
    await initial.stopWorker();
    store.close();
    writeFileSync(join(dir, 'development.json'), '{}');
    const result = await runResearchSession({
      dir,
      hours: 2,
      fixture: true,
      providers,
      steps: 5,
      wait: async () => {},
    });
    assert.equal(result.state.primaryReason, 'CODEX_FAILED');
    assert.equal(result.state.phase, 'FINISHED');
    assert.equal(result.state.finalGuardOk, true);
    assert.equal(searches, 2, 'one probe, one failing native search, no retry');
    store = new Store(dir);
    try {
      assert.equal(
        store.get('stopped', false),
        true,
        'CLI entry must return in STOPPED, including handled provider failures',
      );
      assert.equal(store.get<any>('researchDay', {}).active, false);
      assert.equal(store.get<any>('researchDay', {}).finalReason, 'CODEX_FAILED');
      assert.equal(store.get('mode', null), mode);
      assert.deepEqual(store.get('autoPolicy', null), {
        policyVersion: 17,
        scopeHash: 'synthetic-old-pilot',
      });
      assert.deepEqual(store.one("SELECT * FROM campaigns WHERE id='research'"), campaign);
      assert.equal(
        store.one("SELECT count(*) n FROM runs WHERE status='PAUSED' AND error='CODEX_FAILED'")!.n,
        1,
        'retain the checkpoint',
      );
      for (const table of ['send_attempts', 'outbox', 'usage_ledger', 'auto_sessions'])
        assert.equal(store.one('SELECT count(*) n FROM ' + table)!.n, 0);
    } finally {
      store.close();
    }
  });
