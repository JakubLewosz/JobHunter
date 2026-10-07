import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, relative, isAbsolute, sep } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createApp } from './app.js';

const port = Number(process.env.JOBHUNTER_PORT ?? 4317);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Nieprawidłowy port.');
const base = resolve(
  process.env.JOBHUNTER_DATA_DIR ??
    (process.platform === 'win32'
      ? join(process.env.LOCALAPPDATA ?? homedir(), 'JobHunter')
      : process.platform === 'darwin'
        ? join(homedir(), 'Library', 'Application Support', 'JobHunter')
        : join(homedir(), '.local', 'share', 'JobHunter')),
);
const dataRelative = relative(process.cwd(), base);
if (
  !dataRelative ||
  (dataRelative !== '..' && !dataRelative.startsWith('..' + sep) && !isAbsolute(dataRelative))
)
  throw new Error('Dane runtime muszą znajdować się poza repozytorium.');
const dir = join(base, 'demo');
mkdirSync(dir, { recursive: true, mode: 0o700 });
mkdirSync(join(base, 'live'), { recursive: true, mode: 0o700 });
const lock = join(dir, 'backend.lock');
const instance = randomUUID();
if (existsSync(lock)) {
  const owner = JSON.parse(readFileSync(join(lock, 'owner.json'), 'utf8'));
  let alive = false;
  try {
    process.kill(owner.pid, 0);
    alive = true;
  } catch (e: any) {
    if (e.code !== 'ESRCH') alive = true;
  }
  if (alive)
    throw new Error(
      'Backend JobHunter już działa lub blokada wymaga sprawdzenia. Użyj npm run open.',
    );
  rmSync(lock, { recursive: true });
}
mkdirSync(lock);
writeFileSync(join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, instance }), {
  mode: 0o600,
});
let closing = false;
const cleanup = () => {
  try {
    const owner = JSON.parse(readFileSync(join(lock, 'owner.json'), 'utf8'));
    if (owner.instance === instance) {
      rmSync(lock, { recursive: true });
      rmSync(join(dir, 'launch.json'), { force: true });
    }
  } catch {}
};
try {
  const result = await createApp({ dir, port, shutdown: async () => shutdown() });
  async function shutdown() {
    if (closing) return;
    closing = true;
    await result.app.close();
    cleanup();
    process.exit(0);
  }
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
  await result.app.listen({ host: '127.0.0.1', port });
  writeFileSync(
    join(dir, 'launch.json'),
    JSON.stringify({
      url: `http://127.0.0.1:${port}/#access=${result.launchToken}`,
      port,
      pid: process.pid,
      instance,
    }),
    { mode: 0o600 },
  );
  console.log(`JobHunter DEMO działa na http://127.0.0.1:${port}. Otwórz panel: npm run open`);
} catch (error) {
  cleanup();
  throw error;
}
