import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
export const base = resolve(
  process.env.JOBHUNTER_DATA_DIR ??
    (process.platform === 'win32'
      ? join(process.env.LOCALAPPDATA ?? homedir(), 'JobHunter')
      : process.platform === 'darwin'
        ? join(homedir(), 'Library', 'Application Support', 'JobHunter')
        : join(homedir(), '.local', 'share', 'JobHunter')),
);
export const dir = join(base, 'demo');
