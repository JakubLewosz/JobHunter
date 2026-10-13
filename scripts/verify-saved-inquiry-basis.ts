import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import Database from 'better-sqlite3';
import {
  validateAnalysis,
  resolveInquiryBasis,
  contactEligibility,
} from '../apps/server/src/research/contracts.js';
import { hash } from '../apps/server/src/util.js';
const dir = resolve(process.argv[2] ?? '');
if (!process.argv[2] || existsSync(join(dir, 'run.lock')))
  throw new Error('STOPPED_DIAGNOSTIC_REQUIRED');
const file = join(readFileSync(join(dir, 'database-path.txt'), 'utf8').trim(), 'jobhunter.sqlite'),
  oldHash = hash(readFileSync(file)),
  db = new Database(file, { readonly: true, fileMustExist: true });
if (
  JSON.parse(
    (db.prepare("SELECT value FROM app_state WHERE key='diagnosticOnly'").get() as any)?.value ??
      'false',
  ) !== true
)
  throw new Error('DIAGNOSTIC_ONLY_REQUIRED');
const all = db.prepare('SELECT * FROM research_items WHERE company_id IS NOT NULL').all() as any[];
const results = all.map((i) => {
  const ids = JSON.parse(i.source_ids),
    sources = ids.map((id: string) =>
      db.prepare('SELECT * FROM research_sources WHERE id=?').get(id),
    ) as any[];
  const a = validateAnalysis(JSON.parse(i.analysis), sources),
    basis = resolveInquiryBasis(a, sources);
  return {
    item_id: i.id,
    url: i.url,
    company: a.company,
    original_stored_decision: (
      db.prepare('SELECT decision FROM opportunities WHERE id=?').get(i.opportunity_id) as any
    )?.decision,
    current_code_basis: basis,
    current_code_eligibility: contactEligibility(a, sources),
  };
});
db.close();
if (hash(readFileSync(file)) !== oldHash) throw new Error('ORIGINAL_CHANGED');
const record = {
  timestamp: new Date().toISOString(),
  kind: 'POST_PUBLIC_READ_ONLY_QUALIFICATION_CHECK',
  not_public_rerun: true,
  new_messages: 0,
  http: 0,
  models: 0,
  original_unchanged: true,
  source_hashes: { contracts: hash(readFileSync('apps/server/src/research/contracts.ts')) },
  results,
};
writeFileSync(join(dir, 'post-public-basis-check.json'), JSON.stringify(record, null, 2) + '\n');
console.log(
  JSON.stringify(
    results.map((r) => ({
      company: r.company,
      stored: r.original_stored_decision,
      current: r.current_code_eligibility.allowed,
      field: r.current_code_basis?.field,
    })),
  ),
);
