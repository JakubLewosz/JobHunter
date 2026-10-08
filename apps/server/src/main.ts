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
const mode = process.env.JOBHUNTER_MODE ?? 'DEMO';
if (!['DEMO', 'RESEARCH_ONLY', 'APPROVAL_REQUIRED'].includes(mode))
  throw new Error('JOBHUNTER_MODE: wybierz DEMO, RESEARCH_ONLY lub APPROVAL_REQUIRED.');
const dir = join(base, mode === 'DEMO' ? 'demo' : 'research-only');
mkdirSync(dir, { recursive: true, mode: 0o700 });

const lock = join(base, 'backend.lock');
const instance = randomUUID();
// An E2 backend uses a mode-local lock. Respect it before opening any database.
for (const legacyDir of ['demo', 'research-only']) {
  const legacyLock = join(base, legacyDir, 'backend.lock');
  if (existsSync(legacyLock)) {
    const owner = JSON.parse(readFileSync(join(legacyLock, 'owner.json'), 'utf8'));
    try {
      process.kill(owner.pid, 0);
      throw new Error(
        'Backend poprzedniej wersji nadal działa. Zatrzymaj go przez jego scripts/stop.mjs przed zmianą trybu.',
      );
    } catch (error: any) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
}
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
  const result = await createApp({
    dir,
    port,
    mode: mode as 'DEMO' | 'RESEARCH_ONLY' | 'APPROVAL_REQUIRED',
    shutdown: async () => shutdown(),
  });
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
  console.log(`JobHunter ${mode} działa na http://127.0.0.1:${port}. Otwórz panel: npm run open`);
} catch (error) {
  cleanup();
  throw error;
}
