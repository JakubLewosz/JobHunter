import {
  exportReviewPackage,
  validateReviewPackage,
  ReviewExportError,
} from '../apps/server/src/review/export.js';
const args = process.argv.slice(2);
try {
  const get = (key: string) => {
    const at = args.indexOf(key);
    if (at < 0 || !args[at + 1] || args[at + 1].startsWith('--'))
      throw new ReviewExportError('ARGUMENT_REQUIRED');
    return args[at + 1];
  };
  if (args.includes('--validate'))
    console.log(JSON.stringify(validateReviewPackage(get('--validate'))));
  else
    console.log(
      JSON.stringify(
        exportReviewPackage({
          snapshot: get('--snapshot'),
          provenance: get('--provenance'),
          output: get('--output'),
        }),
      ),
    );
} catch (e) {
  console.error(
    JSON.stringify({ code: e instanceof ReviewExportError ? e.code : 'EXPORT_FAILED' }),
  );
  process.exitCode = 1;
}
