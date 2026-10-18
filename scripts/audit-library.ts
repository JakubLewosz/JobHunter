import {
  auditLibrary,
  LibraryAuditError,
  libraryAuditSchema,
} from '../apps/server/src/research/library-audit.js';
const args = process.argv.slice(2),
  get = (key: string) => {
    const n = args.indexOf(key);
    return n < 0 ? undefined : args[n + 1];
  };
try {
  if (!get('--snapshot') || !get('--provenance'))
    throw new LibraryAuditError('EXPLICIT_SNAPSHOT_REQUIRED');
  const report = auditLibrary({
    snapshot: get('--snapshot')!,
    provenance: get('--provenance')!,
    before: get('--before'),
    beforeProvenance: get('--before-provenance'),
    output: get('--output'),
  });
  process.stdout.write(JSON.stringify(libraryAuditSchema.parse(report)) + '\n');
} catch (e) {
  process.stderr.write(
    JSON.stringify({ code: e instanceof LibraryAuditError ? e.code : 'AUDIT_FAILED' }) + '\n',
  );
  process.exitCode = 1;
}
