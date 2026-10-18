import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
function codeFingerprint() {
  const root = dirname(fileURLToPath(import.meta.url)),
    files: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw Error('CODE_SYMLINK');
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.(?:js|ts|json)$/.test(entry.name) && !entry.name.endsWith('.d.ts'))
        files.push(path);
    }
  };
  visit(root);
  const shared = resolve(root, '../../../packages/shared');
  if (existsSync(shared)) visit(shared);
  const digest = createHash('sha256');
  for (const path of files.sort())
    digest.update(
      JSON.stringify([
        relative(root, path),
        createHash('sha256').update(readFileSync(path)).digest('hex'),
      ]),
    );
  return digest.digest('hex');
}
const loadedCodeHash = codeFingerprint();
function manifest() {
  if (fileURLToPath(import.meta.url).endsWith('.ts'))
    return { kind: 'SOURCE', sourceSha: null, sourceTreeHash: null, buildId: null };
  try {
    const file = resolve('dist', 'build-manifest.json');
    if (existsSync(file)) {
      const value = JSON.parse(readFileSync(file, 'utf8'));
      if (
        value.schema === 1 &&
        /^[a-f0-9]{64}$/.test(value.sourceTreeHash) &&
        (value.sourceSha === null || /^[a-f0-9]{40}$/.test(value.sourceSha))
      )
        return {
          kind: 'BUILD',
          sourceSha: value.sourceSha,
          sourceTreeHash: value.sourceTreeHash,
          buildId: value.buildId,
        };
    }
  } catch {}
  return { kind: 'SOURCE', sourceSha: null, sourceTreeHash: null, buildId: null };
}
// Captured once when these modules are loaded. Never inferred from a later HEAD.
export const runningBuildIdentity = Object.freeze({
  ...manifest(),
  loadedCodeHash,
  loadedAt: new Date().toISOString(),
});
export function runningCodeUnchanged() {
  try {
    return codeFingerprint() === loadedCodeHash;
  } catch {
    return false;
  }
}
