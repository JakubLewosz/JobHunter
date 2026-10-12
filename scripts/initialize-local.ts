import { readFileSync } from 'node:fs';
import {
  previewNewLocalHistory,
  initializeNewLocalHistory,
} from '../apps/server/src/initialize-local.js';

const [command, base, csv, ...flags] = process.argv.slice(2);
if (!base || !csv || !['preview', 'initialize'].includes(command))
  throw new Error(
    'initialize-local preview KATALOG CSV albo initialize KATALOG CSV --confirmed-csv-hash HASH --confirm-new-database --allow-prior-applications-once.',
  );
const text = readFileSync(csv, 'utf8');
if (command === 'preview') {
  if (flags.length) throw new Error('Podgląd nie przyjmuje zgód ani flag inicjalizacji.');
  console.log(JSON.stringify(previewNewLocalHistory(base, text), null, 2));
} else {
  if (
    flags.length !== 4 ||
    flags[0] !== '--confirmed-csv-hash' ||
    !/^[a-f0-9]{64}$/.test(flags[1]) ||
    flags[2] !== '--confirm-new-database' ||
    flags[3] !== '--allow-prior-applications-once'
  )
    throw new Error(
      'Wymagane dokładny zatwierdzony hash CSV, --confirm-new-database i --allow-prior-applications-once.',
    );
  console.log(
    JSON.stringify(
      initializeNewLocalHistory({
        base,
        text,
        approvedHash: flags[1],
        confirmedNewDatabase: true,
        confirmedPriorApplications: true,
      }),
      null,
      2,
    ),
  );
}
