import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir, release } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
const output = resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw Error('OUTPUT_REQUIRED');
mkdirSync(output, { recursive: false });
const root = mkdtempSync(join(tmpdir(), 'jh-cli-measure-'));
const env: NodeJS.ProcessEnv = {};
for (const key of [
  'PATH',
  'Path',
  'SystemRoot',
  'SYSTEMROOT',
  'WINDIR',
  'ComSpec',
  'COMSPEC',
  'PATHEXT',
  'OS',
])
  if (process.env[key]) env[key] = process.env[key];
for (const dir of ['home', 'temp', 'data', 'appdata', 'localappdata']) mkdirSync(join(root, dir));
Object.assign(env, {
  HOME: join(root, 'home'),
  USERPROFILE: join(root, 'home'),
  CODEX_HOME: join(root, 'home'),
  APPDATA: join(root, 'appdata'),
  LOCALAPPDATA: join(root, 'localappdata'),
  TEMP: join(root, 'temp'),
  TMP: join(root, 'temp'),
  TMPDIR: join(root, 'temp'),
  JOBHUNTER_DATA_DIR: join(root, 'data'),
  JOBHUNTER_RUNTIME: 'DEVELOPMENT',
  JOBHUNTER_MODE: 'DEMO',
  CI: 'true',
  JOBHUNTER_TEST_DIAGNOSTICS_DIR: output,
});
const results = [];
try {
  // Fixed before execution: exactly three runs, every outcome retained, no retry-until-pass.
  for (let run = 1; run <= 3; run++) {
    const start = performance.now();
    const child = spawn(
      process.execPath,
      [
        '--import',
        'tsx',
        '--test',
        '--test-name-pattern=nightflow CLI awaits a real child',
        'tests/cli-tools.test.ts',
      ],
      { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const outerDeadline = setTimeout(() => child.kill(), 60000);
    let log = '';
    child.stdout.on('data', (c) => (log += c));
    child.stderr.on('data', (c) => (log += c));
    const exitCode = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', resolve);
    });
    clearTimeout(outerDeadline);
    writeFileSync(join(output, `run-${run}.txt`), log);
    results.push({ run, exitCode, elapsedMs: performance.now() - start });
  }
  const diagnostics = readdirSync(output)
    .filter((n) => n.startsWith('nightflow-child-'))
    .map((n) => JSON.parse(readFileSync(join(output, n), 'utf8')));
  const summary = {
    schema: 1,
    platform: process.platform,
    release: release(),
    node: process.version,
    plan: 'THREE_TARGET_RUNS_THEN_FULL_CHECK',
    command:
      'node --import tsx --test --test-name-pattern=nightflow CLI awaits a real child tests/cli-tools.test.ts',
    results,
    diagnostics,
  };
  writeFileSync(join(output, 'measurements.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary));
  if (results.some((x) => x.exitCode !== 0)) process.exitCode = 1;
} finally {
  rmSync(root, { recursive: true, force: true });
}
