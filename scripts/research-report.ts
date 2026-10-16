import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { researchReport, writeResearchReport } from '../apps/server/src/research/report.js';

const [database, directory, ...extra] = process.argv.slice(2);
if (!database || !directory || extra.length)
  throw new Error('Użycie: npm run research:report -- PLIK_SQLITE KATALOG_POZA_REPO');
// No Store constructor, migrations, providers, credentials or work/resume permission.
const db = new Database(resolve(database), { readonly: true, fileMustExist: true });
try {
  const store = {
    all: (sql: string, ...args: any[]) => db.prepare(sql).all(...args) as any[],
    one: (sql: string, ...args: any[]) => db.prepare(sql).get(...args) as any,
    get: <T>(key: string, fallback: T): T => {
      const row = db.prepare('SELECT value FROM app_state WHERE key=?').get(key) as any;
      return row ? JSON.parse(row.value) : fallback;
    },
  };
  const report = db.transaction(() => researchReport(store))();
  console.log(
    JSON.stringify({ ...writeResearchReport(resolve(directory), report), summary: report.summary }),
  );
} finally {
  db.close();
}
