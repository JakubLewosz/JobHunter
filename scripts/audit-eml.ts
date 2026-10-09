import { readFileSync, writeFileSync, statSync, realpathSync } from 'node:fs';
import { dirname, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareMime, maxMimeBytes, mimeReport } from '../apps/server/src/gmail/inspection.js';

// Local files only; no Gmail, OAuth, HTTP, send or URL fetching capability.
const args = process.argv.slice(2);
const privateDetails = args.includes('--private');
const outputIndex = args.indexOf('--output');
const output = outputIndex >= 0 ? args[outputIndex + 1] : undefined;
const files = args.filter(
  (a, i) => a !== '--private' && (outputIndex < 0 || (i !== outputIndex && i !== outputIndex + 1)),
);
try {
  if (!files.length || (outputIndex >= 0 && !output) || files.some((f) => f.startsWith('--')))
    throw new Error(
      'Użycie: npm run audit:eml -- A.eml [B.eml ...] [--output /private/report.json] [--private]',
    );
  const root = fileURLToPath(new URL('../', import.meta.url));
  // Resolve the physical parent before checking containment, including symlink/.. paths.
  // wx below also refuses an existing final path, including a symlink.
  const parent = privateDetails && output ? realpathSync.native(dirname(output)) : null;
  const rel = parent === null ? null : relative(realpathSync.native(root), parent);
  const inside =
    rel !== null && (!rel || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + sep)));
  if (privateDetails && (!output || inside))
    throw new Error(
      '--private wymaga pliku --output poza repozytorium; zawiera adresy i dokładną treść.',
    );
  const inputs = files.map((path) => {
    if (statSync(path).size > maxMimeBytes) throw new Error('MIME_SIZE');
    return readFileSync(path);
  });
  const reports = inputs.map((raw, i) => ({
    source: `source-${i + 1}`,
    ...mimeReport(raw, privateDetails),
  }));
  const comparisons = inputs
    .slice(1)
    .map((raw, i) => ({ against: `source-${i + 2}`, ...compareMime(inputs[0], raw) }));
  const json =
    JSON.stringify(
      {
        normalization:
          'Only CRLF -> LF in decoded text; no trim or whitespace collapse. Attachments compare byte for byte.',
        reports,
        comparisons,
      },
      null,
      2,
    ) + '\n';
  if (output) writeFileSync(output, json, { mode: 0o600, flag: 'wx' });
  else process.stdout.write(json);
} catch (e) {
  // File errors can contain private paths. Do not print them or file contents.
  const message = e instanceof Error ? e.message : 'AUDIT_FAILED';
  process.stderr.write(
    (/^(MIME_|Użycie:|--private)/.test(message)
      ? message
      : 'AUDIT_FAILED: sprawdź pliki lokalnie.') + '\n',
  );
  process.exitCode = 1;
}
