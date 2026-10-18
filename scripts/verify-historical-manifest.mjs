import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2),
  get = (key) => args[args.indexOf(key) + 1];
try {
  const ref = get('--ref'),
    manifest = get('--manifest');
  if (!args.includes('--ref') || !/^[a-f0-9]{40}$/.test(ref) || !args.includes('--manifest'))
    throw Error('MANIFEST_OPTIONS');
  const rows = JSON.parse(readFileSync(manifest, 'utf8'));
  if (!Array.isArray(rows)) throw Error('MANIFEST_INVALID');
  let checked = 0;
  for (const row of rows) {
    if (
      !row ||
      typeof row.path !== 'string' ||
      !/^[a-zA-Z0-9_.\/-]+$/.test(row.path) ||
      row.path.startsWith('/') ||
      row.path.split('/').includes('..') ||
      !/^[a-f0-9]{64}$/.test(row.sha256)
    )
      throw Error('MANIFEST_INVALID');
    const bytes = execFileSync('git', ['show', `${ref}:${row.path}`], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    if (createHash('sha256').update(bytes).digest('hex') !== row.sha256)
      throw Error('HISTORICAL_HASH_MISMATCH');
    checked++;
  }
  console.log(
    JSON.stringify({
      scope: 'HISTORICAL_CODE_ONLY',
      ref,
      checked,
      valid: true,
      currentCodeTested: false,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      code:
        error instanceof Error && /^[A-Z_]+$/.test(error.message)
          ? error.message
          : 'HISTORICAL_VALIDATION_FAILED',
    }),
  );
  process.exitCode = 1;
}
