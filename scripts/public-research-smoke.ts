import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createPublicDiagnostic,
  approvedDiagnosticMaterials,
} from '../apps/server/src/research/diagnostic.js';
import { DomainError } from '../apps/server/src/util.js';

// Always creates new temporary diagnostic data. No personal database, Gmail or later production queue.
const dir = mkdtempSync(join(tmpdir(), 'jh-public-diagnostic-'));
const [flag, base] = process.argv.slice(2);
if (flag && (flag !== '--approved-profile' || !base))
  throw new Error(
    'Opcjonalnie: --approved-profile KATALOG_BAZOWY, wyłącznie na skonfigurowanym Windowsie.',
  );
const diagnostic = createPublicDiagnostic(dir, {
  maxCompanies: 5,
  materials: flag ? approvedDiagnosticMaterials(base) : undefined,
});
const deadline = setTimeout(() => diagnostic.service.control('stop'), 15 * 60000);
try {
  await diagnostic.service.probe('codex');
  await diagnostic.service.probe('search');
  await diagnostic.service.start(
    'Polskie firmy tworzące aplikacje webowe, automatyzacje i integracje API, także bez wakatu. Maksymalnie 5 firm do technicznej diagnostyki z profilem fikcyjnym.',
  );
  await diagnostic.service.tick();
  const run = diagnostic.store.one(
    'SELECT status,error FROM runs ORDER BY started_at DESC LIMIT 1',
  );
  console.log(JSON.stringify({ status: run, ...diagnostic.summary() }, null, 2));
  if (run?.status !== 'COMPLETED') process.exitCode = 3;
  console.log('Wyniki diagnostyczne poza repo:', dir);
} catch (e) {
  console.log(
    JSON.stringify(
      {
        status: 'BLOCKED_EXTERNAL',
        code: e instanceof DomainError ? e.code : 'DIAGNOSTIC_FAILED',
        ...diagnostic.summary(),
      },
      null,
      2,
    ),
  );
  process.exitCode = 2;
} finally {
  clearTimeout(deadline);
  diagnostic.service.control('stop');
  await diagnostic.service.stopWorker();
  diagnostic.store.close();
}
