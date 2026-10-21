import test from 'node:test';
import assert from 'node:assert/strict';
import { fork, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../apps/server/src/db.js';
import { JobHunter } from '../apps/server/src/service.js';
import { libraryAuditSchema } from '../apps/server/src/research/library-audit.js';
import { resolveNpmCli } from '../apps/server/src/npm-cli.js';
import { nightflowChild } from './helpers/nightflow-child.js';
import { acquireProfileLock } from '../apps/server/src/backend-lock.js';
const cli = (file: string, args: string[]) =>
  spawnSync(process.execPath, ['--import', 'tsx', file, ...args], {
    windowsHide: true,
    encoding: 'utf8',
    timeout: 30000,
  });
test('audit CLI runs the snapshot-only analyzer and never prints invalid provenance/sentinel values', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-audit-cli-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new Store(join(root, 'data'));
  new JobHunter(store);
  const snapshot = store.backup();
  store.close();
  const output = join(root, 'safe.json'),
    result = cli('scripts/audit-library.ts', [
      '--snapshot',
      snapshot,
      '--provenance',
      snapshot + '.provenance.json',
      '--output',
      output,
    ]);
  assert.equal(result.status, 0);
  const report = libraryAuditSchema.parse(JSON.parse(result.stdout));
  assert.equal(report.scope, 'SNAPSHOT_ONLY');
  assert.equal(result.stderr, '');
  assert.equal(JSON.parse(readFileSync(output, 'utf8')).schema, 1);
  const npm = resolveNpmCli();
  const quiet = spawnSync(
    process.execPath,
    [
      npm,
      '--silent',
      'run',
      'audit:library',
      '--',
      '--snapshot',
      snapshot,
      '--provenance',
      snapshot + '.provenance.json',
    ],
    { windowsHide: true, encoding: 'utf8', timeout: 30000 },
  );
  assert.equal(quiet.status, 0);
  libraryAuditSchema.parse(JSON.parse(quiet.stdout));
  assert.equal((quiet.stdout + quiet.stderr).includes(snapshot), false);
  const sentinels = [
    'SENTINEL_NAME',
    'secret@example.test',
    'a7bb698d-249b-4554-a1e5-ceb5e004b950',
    'C:\\private\\sentinel',
    'SENTINEL_MESSAGE',
  ];
  const invalid = join(root, 'invalid.json');
  writeFileSync(invalid, JSON.stringify({ method: sentinels, sha256: sentinels }));
  const rejected = cli('scripts/audit-library.ts', [
    '--snapshot',
    snapshot,
    '--provenance',
    invalid,
  ]);
  assert.equal(rejected.status, 1);
  assert.equal(JSON.parse(rejected.stderr).code, 'PROVENANCE_INVALID');
  for (const value of sentinels)
    assert.equal((rejected.stdout + rejected.stderr).includes(value), false);
  const again = cli('scripts/audit-library.ts', [
    '--snapshot',
    snapshot,
    '--provenance',
    snapshot + '.provenance.json',
    '--output',
    output,
  ]);
  assert.equal(again.status, 1);
  assert.equal(JSON.parse(again.stderr).code, 'OUTPUT_EXISTS');
});
test('native session CLI uses complete fakes, default hours, controller guard and cleans its lease', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-session-cli-')),
    dir = join(root, 'fixture');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = cli('scripts/research-session.ts', [
    '--fixture',
    '--data-dir',
    dir,
    '--start',
    '--steps',
    '2',
    '--advance-ms',
    '960000',
  ]);
  assert.equal(result.status, 0);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.fixture, true);
  assert.equal(summary.counts.attempts, 0);
  assert.equal(summary.state.phase, 'FINISHED');
  assert.ok(summary.state.lastGuardFinishedAt);
  assert.equal(
    Date.parse(summary.state.deadline) - Date.parse(summary.state.startedAt),
    8 * 3600000,
  );
  assert.equal(existsSync(join(dir, 'profile.lock')), false);
  const rejected = cli('scripts/research-session.ts', [
    '--fixture',
    '--data-dir',
    join(root, 'other'),
    '--start',
    '--resume',
  ]);
  assert.equal(rejected.status, 1);
  assert.equal(JSON.parse(rejected.stderr).code, 'EXPLICIT_START_REQUIRED');
  assert.equal(existsSync(join(root, 'other')), false);
});
test('npm resolver honors actual launcher paths with spaces and Polish characters', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-npm-Łódź path-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const path = join(root, 'npm-cli.js');
  writeFileSync(path, '// synthetic npm executable');
  assert.equal(resolveNpmCli({ npm_execpath: path }), path);
});
test('nightflow CLI awaits a real child process across fake research and sender phases, then releases its owner', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-nightflow-cli-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = await nightflowChild(['fixture', '--data-dir', join(root, 'data')]);
  assert.equal(result.status, 0, JSON.stringify(result.diagnostics));
  assert.equal(result.diagnostics.termination, 'EXIT', JSON.stringify(result.diagnostics));
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.fixture, true);
  assert.equal(summary.state, 'COMPLETED');
  assert.equal(summary.counts.sent, 1);
  assert.equal(summary.checkpoint.researchOutcome.reason, 'DEADLINE');
  assert.equal(existsSync(join(root, 'data', 'profile.lock')), false);
  assert.equal(existsSync(join(root, 'data', 'nightflow-control.json')), false);
  assert.ok(result.diagnostics.events.some((x) => x.event === 'FIXTURE_READY'));
  assert.ok(result.diagnostics.events.some((x) => x.event === 'LOCK_RELEASED'));
});

test('nightflow CLI supervision distinguishes cancellation and releases its own resources', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-cancel-cli-')),
    dir = join(root, 'data');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const abort = new AbortController();
  const result = await nightflowChild(['fixture', '--data-dir', dir], {
    signal: abort.signal,
    onProgress: (event) => {
      if (event === 'PHASE_RESEARCHING') abort.abort();
    },
  });
  assert.equal(result.diagnostics.termination, 'CANCELLED');
  assert.equal(result.diagnostics.errorCode, null);
  assert.equal(JSON.parse(result.stdout).state, 'STOPPED');
  assert.equal(existsSync(join(dir, 'profile.lock')), false);
  assert.equal(existsSync(join(dir, 'nightflow-control.json')), false);
});

test('nightflow CLI supervision reports its bounded test timeout and reaps only its own child', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-timeout-cli-')),
    dir = join(root, 'data');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = await nightflowChild(['fixture', '--data-dir', dir], { timeoutMs: 1 });
  assert.equal(result.diagnostics.termination, 'TEST_TIMEOUT');
  assert.equal(result.diagnostics.errorCode, 'ETIMEDOUT');
  // The 2s grace bounds supervision, not cleanup after Windows TerminateProcess.
  // If startup is slow enough to force a kill, recover only via normal dead-owner checks.
  if (result.diagnostics.forceKillRequestedMs === null) {
    assert.equal(result.signal, null);
    assert.ok(result.diagnostics.events.some((x) => x.event === 'CANCEL_RECEIVED'));
    assert.equal(existsSync(join(dir, 'profile.lock')), false);
  } else if (existsSync(join(dir, 'profile.lock'))) {
    const lock = acquireProfileLock(dir);
    lock.assert();
    lock.release();
  }
  assert.ok(result.diagnostics.elapsedMs < 15000);
});

for (const phase of ['LOCK_ACQUIRED', 'STORE_READY', 'SERVICE_READY'])
  test(`nightflow CLI cooperatively cancels initialization at ${phase}`, async (t) => {
    const root = mkdtempSync(join(tmpdir(), 'jh-init-cancel-')),
      dir = join(root, 'data'),
      abort = new AbortController();
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const result = await nightflowChild(['fixture', '--data-dir', dir], {
      signal: abort.signal,
      onProgress: (event) => {
        if (event === phase) abort.abort();
      },
    });
    assert.equal(result.diagnostics.termination, 'CANCELLED', JSON.stringify(result.diagnostics));
    assert.equal(result.diagnostics.forceKillRequestedMs, null, JSON.stringify(result.diagnostics));
    assert.equal(result.signal, null);
    assert.ok(result.diagnostics.events.some((x) => x.event === 'CANCEL_RECEIVED'));
    assert.ok(result.diagnostics.events.some((x) => x.event === 'LOCK_RELEASED'));
    assert.equal(result.stdout, '');
    assert.equal(existsSync(join(dir, 'profile.lock')), false);
    assert.equal(existsSync(join(dir, 'nightflow-control.json')), false);
  });

test(
  'hard-killed fixture retains its lock; live ownership blocks recovery and confirmed dead ownership permits it',
  { timeout: 30000 },
  async (t) => {
    const root = mkdtempSync(join(tmpdir(), 'jh-killed-lock-')),
      dir = join(root, 'data');
    const child = fork('tests/fixtures/nightflow-blocked-owner.ts', [dir], {
      execArgv: ['--import', 'tsx'],
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    });
    t.after(async () => {
      if (child.exitCode === null && child.signalCode === null) {
        const closed = once(child, 'close');
        child.kill('SIGKILL');
        await closed;
      }
      rmSync(root, { recursive: true, force: true });
    });
    const ready = await Promise.race([
      once(child, 'message').then(([value]) => value),
      once(child, 'exit').then(() => {
        throw Error('FIXTURE_EXIT_BEFORE_LOCK');
      }),
    ]);
    assert.equal(ready, 'LOCK_HELD');
    const ownerPath = join(dir, 'profile.lock', 'owner.json'),
      owner = readFileSync(ownerPath);
    assert.equal(JSON.parse(owner.toString()).pid, child.pid);
    assert.throws(
      () => acquireProfileLock(dir),
      (error: any) => error.code === 'PROFILE_LOCKED',
    );
    assert.deepEqual(readFileSync(ownerPath), owner);
    const closed = once(child, 'close');
    child.kill('SIGKILL');
    await closed;
    assert.deepEqual(readFileSync(ownerPath), owner);
    assert.throws(
      () => process.kill(child.pid!, 0),
      (error: any) => error.code === 'ESRCH',
    );
    const recovered = acquireProfileLock(dir);
    recovered.assert();
    assert.notEqual(
      JSON.parse(readFileSync(ownerPath, 'utf8')).instance,
      JSON.parse(owner.toString()).instance,
    );
    recovered.release();
    assert.equal(existsSync(join(dir, 'profile.lock')), false);
  },
);
