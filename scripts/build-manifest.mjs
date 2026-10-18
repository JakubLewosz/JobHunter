import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const files = [];
function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw Error('CODE_SYMLINK');
    const path = join(dir, entry.name);
    if (entry.isDirectory()) visit(path);
    else files.push(path);
  }
}
for (const dir of ['apps', 'packages', 'migrations', 'scripts']) visit(dir);
files.push('package.json', 'package-lock.json');
const digest = createHash('sha256');
for (const file of files.sort())
  digest.update(relative('.', file).replaceAll('\\', '/')).update(readFileSync(file));
let sourceSha = null;
try {
  sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {}
mkdirSync('dist', { recursive: true });
writeFileSync(
  'dist/build-manifest.json',
  JSON.stringify(
    {
      schema: 1,
      sourceSha,
      sourceTreeHash: digest.digest('hex'),
      buildId: randomUUID(),
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
