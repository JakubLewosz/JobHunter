import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
const runtime = process.env.JOBHUNTER_RUNTIME ?? 'DEVELOPMENT';
if (!['DEVELOPMENT', 'WORKSTATION'].includes(runtime))
  throw new Error('Nieprawidłowy JOBHUNTER_RUNTIME.');
const appDirectory = runtime === 'WORKSTATION' ? 'JobHunter' : 'JobHunter-development';
export const base = resolve(
  process.env.JOBHUNTER_DATA_DIR ??
    (process.platform === 'win32'
      ? join(process.env.LOCALAPPDATA ?? homedir(), appDirectory)
      : process.platform === 'darwin'
        ? join(homedir(), 'Library', 'Application Support', appDirectory)
        : join(homedir(), '.local', 'share', appDirectory)),
);
const mode = process.env.JOBHUNTER_MODE ?? 'DEMO';
if (!['DEMO', 'RESEARCH_ONLY', 'APPROVAL_REQUIRED', 'AUTO_POLICY'].includes(mode))
  throw new Error('Nieprawidłowy JOBHUNTER_MODE.');
export const dir = join(base, mode === 'DEMO' ? 'demo' : 'research-only');
if (
  runtime === 'DEVELOPMENT' &&
  (existsSync(join(base, 'workstation.json')) ||
    (existsSync(join(base, 'research-only', 'jobhunter.sqlite')) &&
      !existsSync(join(base, 'development.json'))))
)
  throw new Error(
    'Development wymaga osobnego katalogu syntetycznego. Nie otwarto istniejącej prywatnej historii.',
  );
