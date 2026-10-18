import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../apps/server/src/db.js';
import { JobHunter } from '../apps/server/src/service.js';
import { libraryAuditSchema } from '../apps/server/src/research/library-audit.js';
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
  const npm = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
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
