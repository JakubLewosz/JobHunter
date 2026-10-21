// CI preserves npm's result and uploads only fixed-schema synthetic diagnostics.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveNpmCli } from '../apps/server/src/npm-cli.js';

const destination = process.env.JOBHUNTER_TEST_DIAGNOSTICS_DIR;
if (!destination) throw Error('DIAGNOSTICS_DIR_REQUIRED');
mkdirSync(destination, { recursive: true });
const startedAt = new Date().toISOString(),
  start = performance.now();
const child = spawn(process.execPath, [resolveNpmCli(), 'run', 'check'], {
  env: process.env,
  windowsHide: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let pending = '';
const counts: { metric: string; value: number }[] = [];
child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  pending += chunk.toString();
  const lines = pending.split(/\r?\n/);
  pending = lines.pop()!.slice(-1000);
  for (const line of lines) {
    const m = line.match(/^ℹ (tests|pass|fail|skipped|cancelled) (\d+)$/);
    if (m && counts.length < 40) counts.push({ metric: m[1], value: Number(m[2]) });
  }
});
child.stderr.on('data', (chunk) => process.stderr.write(chunk));
let errorCode: string | null = null;
child.once('error', (error: NodeJS.ErrnoException) => {
  errorCode = error.code ?? 'SPAWN_ERROR';
});
const result = await new Promise<{ exitCode: number | null; signal: string | null }>((resolve) => {
  child.once('close', (exitCode, signal) => resolve({ exitCode, signal }));
});
writeFileSync(
  join(destination, 'check-summary.json'),
  JSON.stringify(
    {
      schema: 1,
      scope: 'SYNTHETIC_CI_CHECK',
      command: 'npm run check',
      startedAt,
      endedAt: new Date().toISOString(),
      elapsedMs: performance.now() - start,
      ...result,
      errorCode,
      counts,
    },
    null,
    2,
  ) + '\n',
);
process.exitCode = result.exitCode === 0 && !errorCode ? 0 : result.exitCode || 1;
