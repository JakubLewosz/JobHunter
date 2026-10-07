import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { dir } from './paths.mjs';
try {
  const { url } = JSON.parse(readFileSync(join(dir, 'launch.json'), 'utf8'));
  const command =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'explorer.exe'
        : 'xdg-open';
  const child = spawn(command, [url], { detached: true, stdio: 'ignore', shell: false });
  child.on('error', () => {
    console.error('Nie udało się otworzyć przeglądarki.');
    process.exitCode = 1;
  });
  child.unref();
} catch {
  console.error('Uruchom najpierw npm start. Nie znaleziono aktywnego panelu.');
  process.exitCode = 1;
}
