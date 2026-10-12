import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const child = spawn(
  process.execPath,
  [resolve('node_modules/tsx/dist/cli.mjs'), 'watch', 'apps/server/src/main.ts'],
  {
    env: { ...process.env, JOBHUNTER_RUNTIME: 'DEVELOPMENT', JOBHUNTER_MODE: 'DEMO' },
    stdio: 'inherit',
    shell: false,
  },
);
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
child.once('error', () => {
  console.error('Nie uruchomiono developmentu. Wykonaj npm ci.');
  process.exitCode = 1;
});
