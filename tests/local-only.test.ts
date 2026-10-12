import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setup } from './auto-fixture.js';
import { createApp } from '../apps/server/src/app.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';
import { workstationRuntime } from '../apps/server/src/runtime.js';
import { Store } from '../apps/server/src/db.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { acquireProfileLock } from '../apps/server/src/backend-lock.js';
import { restoreBackupCopy } from '../apps/server/src/backup.js';
import { exportHistory, importHistory } from '../apps/server/src/history-sync.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';

test('LOCAL_ONLY: full AUTO, Stop/restart and readiness never call HistorySync or Git', async (t) => {
  const f = await setup(t, true, false, false, true);
  for (const key of ['claim', 'assertOwner', 'checkpoint', 'status', 'configure'] as const)
    (f.service.historySync as any)[key] = () => {
      throw new Error('UNEXPECTED_HISTORY_GIT');
    };
  assert.equal(existsSync(f.repo), false);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.dashboard().state.auto.sync.mode, 'LOCAL_ONLY');
  assert.equal(f.service.dashboard().state.auto.readiness.history, true);
  f.service.control('stop');
  const restarted = new AutoPolicyJobHunter(f.store, f.options);
  assert.equal(restarted.state().stopped, true);
  assert.equal(
    f.store.one('SELECT count(*) n FROM draft_approvals WHERE revoked_at IS NULL')?.n,
    0,
  );
  await restarted.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  await restarted.startAuto();
  f.advance();
  await restarted.tick();
  await restarted.dispatchOne();
  assert.equal(f.gateway.posts.length, 1, 'restart does not repeat a first contact');
  await restarted.stopWorker();
});
test('development: AUTO has no native Gmail/account; OS alone never grants send', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-dev-'));
  const a = await createApp({ dir: root, port: 4491, mode: 'AUTO_POLICY', worker: false });
  t.after(async () => {
    await a.app.close();
    rmSync(root, { recursive: true, force: true });
  });
  const s = a.service as AutoPolicyJobHunter;
  assert.equal(s.deliveryState().account, null);
  assert.equal(s.deliveryState().sendReady, false);
  await assert.rejects((s as any).gateway.account(), (e: any) => e.code === 'SEND_DISABLED');
  await assert.rejects(s.startAuto());
  assert.throws(
    () => workstationRuntime(join(root, 'research-only'), 'win32'),
    (e: any) => e.code === 'WORKSTATION_REQUIRED',
  );
  assert.throws(
    () => workstationRuntime(join(root, 'research-only'), 'darwin'),
    (e: any) => e.code === 'WORKSTATION_REQUIRED',
  );
});
test('development process refuses a legacy personal directory even in DEMO, without opening or marking it', async () => {
  const root = mkdtempSync(join(tmpdir(), 'jh-legacy-profile-')),
    profileDir = join(root, 'research-only');
  const store = new Store(profileDir);
  store.close();
  const before = readFileSync(join(profileDir, 'jobhunter.sqlite'));
  try {
    await assert.rejects(
      promisify(execFile)(process.execPath, ['--import', 'tsx', 'apps/server/src/main.ts'], {
        env: {
          ...process.env,
          JOBHUNTER_RUNTIME: 'DEVELOPMENT',
          JOBHUNTER_MODE: 'DEMO',
          JOBHUNTER_DATA_DIR: root,
          JOBHUNTER_PORT: '4498',
        },
      }),
      (e: any) => /Nie otwarto osobistej historii/.test(e.stderr),
    );
    assert.equal(existsSync(join(root, 'development.json')), false);
    assert.equal(existsSync(join(root, 'demo')), false);
    assert.deepEqual(readFileSync(join(profileDir, 'jobhunter.sqlite')), before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test('one profile cannot open two backends on different ports; loss of lock blocks Start', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-lock-'));
  const a = await createApp({ dir: root, port: 4492, worker: false });
  t.after(async () => {
    await a.app.close();
    rmSync(root, { recursive: true, force: true });
  });
  await assert.rejects(
    createApp({ dir: root, port: 4493, worker: false }),
    (e: any) => e.code === 'PROFILE_LOCKED',
  );
  const child = await promisify(execFile)(
    process.execPath,
    [
      '--import',
      'tsx',
      '--input-type=module',
      '-e',
      "import { createApp } from './apps/server/src/app.ts'; try { const a = await createApp({ dir: process.env.JH_TEST_PROFILE, port: 4494, worker: false }); await a.app.close(); console.log('UNEXPECTED_OPEN'); } catch(e) { console.log(e.code); }",
    ],
    { env: { ...process.env, JH_TEST_PROFILE: root } },
  );
  assert.equal(child.stdout.trim(), 'PROFILE_LOCKED');
  a.store.assertExclusive();
});
test('LOCAL_ONLY: losing the lock during preparation revokes the last POST gate', async (t) => {
  const f = await setup(t, true, false, false, true),
    lock = acquireProfileLock(f.dir);
  f.store.assertExclusive = lock.assert;
  const ownerPath = join(f.dir, 'profile.lock', 'owner.json'),
    owner = readFileSync(ownerPath);
  try {
    await f.service.startAuto();
    await f.service.tick();
    f.advance();
    f.gateway.beforePost = async () => {
      writeFileSync(ownerPath, JSON.stringify({ pid: process.pid, instance: 'lost' }));
    };
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.service.dashboard().state.auto.readiness.database, false);
    writeFileSync(ownerPath, owner);
  } finally {
    writeFileSync(ownerPath, owner);
    lock.release();
  }
});
test('SQLite: WAL backup, migration and restored copy preserve all history without session permission', async (t) => {
  const f = await setup(t, false, true, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  f.gateway.timeout = true;
  f.advance();
  await f.service.dispatchOne();
  assert.equal(
    f.store.one("SELECT count(*) n FROM send_attempts WHERE state='SEND_UNKNOWN'")?.n,
    1,
  );
  f.service.control('stop');
  const text =
    'company,status,domain,email,date\nManual Fixture,CONTACTED,manual.example.test,hr@manual.example.test,2026-10-01';
  const preview = f.service.previewHistory(text);
  f.service.importHistory(text, preview.hash);
  importHistory(f.store, exportHistory(f.store));
  const before = exportHistory(f.store);
  const backup = f.store.backup();
  const restoredDir = join(f.root, 'restore'),
    file = restoreBackupCopy(backup, restoredDir);
  assert.ok(existsSync(file));
  const copy = new Store(restoredDir);
  f.extraStores.push(copy);
  assert.deepEqual(exportHistory(copy), before);
  assert.equal(copy.get('stopped', false), true);
  assert.equal(copy.get('localHistoryConfirmed', true), false);
  assert.equal(copy.one('SELECT count(*) n FROM draft_approvals WHERE revoked_at IS NULL')?.n, 0);
  // Remove only the additive fixture schema to model the immediately preceding release.
  copy.db.exec(
    'ALTER TABLE research_sources DROP COLUMN address_contexts; ALTER TABLE research_sources DROP COLUMN parser_version;',
  );
  copy.exec("DELETE FROM migrations WHERE name='016_address_context.sql'");
  copy.close();
  f.extraStores.pop();
  const upgraded = new Store(restoredDir);
  f.extraStores.push(upgraded);
  assert.deepEqual(exportHistory(upgraded), before);
  assert.ok(before.records.length > 0);
  assert.equal(readdirSync(join(restoredDir, 'backups')).length, 1);
  assert.equal(upgraded.get('stopped', false), true);
});
test('SQLite restored copy revokes actual active fixture session and approvals without altering source', async (t) => {
  const f = await setup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.store.one('SELECT status FROM auto_sessions')?.status, 'RUNNING');
  assert.ok(f.store.one('SELECT count(*) n FROM draft_approvals WHERE revoked_at IS NULL')!.n > 0);
  const backup = f.store.backup(),
    dir = join(f.root, 'active-restore');
  restoreBackupCopy(backup, dir);
  const copy = new Store(dir);
  f.extraStores.push(copy);
  assert.equal(copy.one('SELECT status FROM auto_sessions')?.status, 'STOPPED');
  assert.equal(copy.one('SELECT count(*) n FROM draft_approvals WHERE revoked_at IS NULL')?.n, 0);
  assert.equal(copy.get('stopped', false), true);
  assert.equal(f.store.one('SELECT status FROM auto_sessions')?.status, 'RUNNING');
  assert.deepEqual(exportHistory(copy), exportHistory(f.store));
});
test('PRIVATE_GIT → LOCAL_ONLY requires a closed, published and matching history', async (t) => {
  const f = await setup(t, true);
  await assert.rejects(
    f.service.configureLocalHistory({ confirmedHistory: true, confirmedSingleWorkstation: true }),
    (e: any) => e.code === 'HISTORY_TRANSITION_REQUIRED',
  );
  await f.service.prepareHistory();
  const before = exportHistory(f.store);
  await f.service.configureLocalHistory({
    confirmedHistory: true,
    confirmedSingleWorkstation: true,
  });
  assert.equal(f.service.historyMode(), 'LOCAL_ONLY');
  assert.deepEqual(exportHistory(f.store), before);
  for (const key of ['claim', 'assertOwner', 'checkpoint', 'status'] as const)
    (f.service.historySync as any)[key] = () => {
      throw new Error('GIT');
    };
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
});
test('LOCAL_ONLY: simultaneous Start has one session; unknown history cannot be bypassed', async (t) => {
  const f = await setup(t, false, false, false, true);
  const outcomes = await Promise.allSettled([f.service.startAuto(), f.service.startAuto()]);
  assert.equal(outcomes.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal(f.store.one('SELECT count(*) n FROM auto_sessions')?.n, 1);
  f.service.control('stop');
  f.store.set('localHistoryConfirmed', false);
  await assert.rejects(f.service.startAuto(), (e: any) => e.code === 'LOCAL_HISTORY_REQUIRED');
  assert.equal(f.store.one('SELECT count(*) n FROM auto_sessions')?.n, 1);
});
test('LOCAL_ONLY: research and AUTO share history and retain unchanged policy, never session authority', async (t) => {
  const f = await setup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  f.service.control('stop');
  const version = f.service.policyConfig()!.policyVersion;
  const research = new ResearchJobHunter(f.store, f.options);
  await assert.rejects(research.dispatchOne(), (e: any) => e.code === 'SEND_DISABLED');
  const auto = new AutoPolicyJobHunter(f.store, f.options);
  assert.equal(auto.state().stopped, true);
  assert.equal(auto.policyConfig()!.policyVersion, version);
  assert.equal(auto.dashboard().state.auto.readiness.policy, true);
  await auto.startAuto();
  f.advance();
  await auto.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  await auto.stopWorker();
});
test('LOCAL_ONLY: timeout and imported unknown attempts cannot be bypassed by restart or history changes', async (t) => {
  const f = await setup(t, true, false, false, true);
  f.gateway.timeout = true;
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  f.service.control('stop');
  importHistory(f.store, exportHistory(f.store));
  await assert.rejects(
    f.service.configureLocalHistory({ confirmedHistory: true, confirmedSingleWorkstation: true }),
    (e: any) => e.code === 'SEND_UNKNOWN',
  );
  const restarted = new AutoPolicyJobHunter(f.store, f.options);
  await assert.rejects(restarted.startAuto(), (e: any) => e.code === 'SEND_UNKNOWN');
  await restarted.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  await restarted.stopWorker();
});
