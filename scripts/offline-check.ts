import { spawn, spawnSync, execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  openSync,
  closeSync,
} from 'node:fs';
import { join, resolve, relative, dirname } from 'node:path';
import { tmpdir, release } from 'node:os';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import Database from 'better-sqlite3';
import { resolveNpmCli } from '../apps/server/src/npm-cli.js';
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const args = process.argv.slice(2),
  at = args.indexOf('--output');
if (at < 0 || !args[at + 1]) throw Error('OUTPUT_REQUIRED');
const output = resolve(args[at + 1]);
mkdirSync(output, { recursive: false });
function fingerprint() {
  const paths: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw Error('CODE_SYMLINK');
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else paths.push(path);
    }
  };
  for (const directory of ['apps', 'packages', 'migrations', 'scripts', 'tests', '.github'])
    visit(directory);
  paths.push(
    'package.json',
    'package-lock.json',
    'tsconfig.server.json',
    'tsconfig.web.json',
    'vite.config.ts',
    'playwright.config.ts',
    '.npmrc',
  );
  const files = paths.sort().map((path) => {
    const bytes = readFileSync(path);
    return {
      path: relative('.', path).replaceAll('\\', '/'),
      bytes: bytes.length,
      sha256: sha(bytes),
    };
  });
  return { fingerprint: sha(JSON.stringify(files)), files };
}
const before = fingerprint(),
  root = mkdtempSync(join(tmpdir(), 'jh-offline-check-'));
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
  'ProgramFiles',
  'ProgramFiles(x86)',
  'ProgramW6432',
  'SystemDrive',
  'OS',
  'NUMBER_OF_PROCESSORS',
  'PROCESSOR_ARCHITECTURE',
])
  if (process.env[key]) env[key] = process.env[key];
for (const name of ['home', 'appdata', 'localappdata', 'temp', 'data', 'cache', 'codex'])
  mkdirSync(join(root, name));
const npm = resolveNpmCli();
Object.assign(env, {
  HOME: join(root, 'home'),
  USERPROFILE: join(root, 'home'),
  APPDATA: join(root, 'appdata'),
  LOCALAPPDATA: join(root, 'localappdata'),
  TEMP: join(root, 'temp'),
  TMP: join(root, 'temp'),
  TMPDIR: join(root, 'temp'),
  CODEX_HOME: join(root, 'codex'),
  JOBHUNTER_DATA_DIR: join(root, 'data'),
  JOBHUNTER_RUNTIME: 'DEVELOPMENT',
  JOBHUNTER_MODE: 'DEMO',
  CI: 'true',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: join(root, 'gitconfig'),
  NPM_CONFIG_USERCONFIG: join(root, 'npmrc'),
  NPM_CONFIG_CACHE: join(root, 'cache'),
  PLAYWRIGHT_BROWSERS_PATH: dirname(dirname(dirname(chromium.executablePath()))),
  JOBHUNTER_TEST_DIAGNOSTICS_DIR: join(output, 'child-diagnostics'),
});
writeFileSync(
  env.GIT_CONFIG_GLOBAL!,
  '[user]\n name = Synthetic Test\n email = synthetic@example.test\n',
);
writeFileSync(env.NPM_CONFIG_USERCONFIG!, 'ignore-scripts=true\n');
const sqlite = new Database(':memory:');
const sqliteVersion = (sqlite.prepare('SELECT sqlite_version() version').get() as any).version;
sqlite.close();
const startedAt = new Date().toISOString(),
  started = performance.now();
const log = join(output, 'check.log'),
  fd = openSync(log, 'wx');
const child = spawn(process.execPath, [npm, 'run', 'check'], {
  env,
  windowsHide: true,
  stdio: ['ignore', fd, fd],
});
const exit = await new Promise<{ code: number | null; signal: string | null }>(
  (resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  },
);
closeSync(fd);
const after = fingerprint(),
  text = readFileSync(log, 'utf8');
const npmVersion = spawnSync(process.execPath, [npm, '--version'], {
  env,
  windowsHide: true,
  encoding: 'utf8',
}).stdout.trim();
const summary = {
  schema: 1,
  scope: 'SYNTHETIC_WINDOWS_CHECK',
  platform: process.platform,
  release: release(),
  arch: process.arch,
  node: process.version,
  npm: npmVersion,
  sqlite: sqliteVersion,
  baseSha: execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
    windowsHide: true,
  }).trim(),
  state: 'UNCOMMITTED_WORKTREE',
  command: 'npm run check',
  startedAt,
  endedAt: new Date().toISOString(),
  elapsedMs: performance.now() - started,
  exitCode: exit.code,
  signal: exit.signal,
  sourceFingerprint: before.fingerprint,
  unchanged: before.fingerprint === after.fingerprint,
  counts: [...text.matchAll(/ℹ (tests|pass|fail|skipped|cancelled) (\d+)/g)].map((m) => ({
    metric: m[1],
    value: Number(m[2]),
  })),
  ui: text.match(/\d+ passed \([^\r\n]+\)/g) ?? [],
  isolatedHome: true,
  nativeProviders: false,
};
writeFileSync(join(output, 'source-files.json'), JSON.stringify(before, null, 2) + '\n');
writeFileSync(join(output, 'test-summary.json'), JSON.stringify(summary, null, 2) + '\n');
const stop = text
  .split(/\r?\n/)
  .filter((line) => /"timingMode":"ISOLATED"/.test(line))
  .map((line) => JSON.parse(line.slice(line.indexOf('{'))));
writeFileSync(join(output, 'stop-measurements.json'), JSON.stringify(stop, null, 2) + '\n');
console.log(JSON.stringify(summary));
process.exitCode = exit.code === 0 && before.fingerprint === after.fingerprint ? 0 : 1;
