import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';
import { dir } from './paths.mjs';
console.log('JobHunter — diagnostyka lokalna');
console.log('System:', process.platform, process.arch, 'Node:', process.version);
if (process.versions.node.split('.')[0] !== '24') {
  console.error('Wymagany Node 24 LTS.');
  process.exitCode = 1;
}
const db = new Database(':memory:');
console.log('SQLite:', db.prepare('SELECT sqlite_version() version').get().version);
db.close();
console.log('Dane DEMO:', dir);
console.log('Build:', existsSync('dist/web/index.html') ? 'gotowy' : 'wykonaj npm run build');
try {
  const output = execFileSync(process.env.JOBHUNTER_CODEX_BIN ?? 'codex', ['--version'], {
    encoding: 'utf8',
    timeout: 5000,
    shell: false,
  });
  console.log('CLI:', output.trim());
} catch {
  console.log('Codex CLI: niewykryty w PATH. Nie blokuje DEMO; wymaga sprawdzenia w E3.');
}
console.log(
  'Model/research runtime: NIE TESTOWANO. Gmail: NIE SKONFIGUROWANO. AUTO_POLICY: ZABLOKOWANY.',
);
console.log(
  'Windows smoke test:',
  process.platform === 'win32'
    ? 'wykonaj setup/start/stop i sprawdź pełny proces UI'
    : 'NIEWYKONANY — bieżący host nie jest Windowsem.',
);
