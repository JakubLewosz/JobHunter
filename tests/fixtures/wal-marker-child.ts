import Database from 'better-sqlite3';
import { join } from 'node:path';
if (process.env.JOBHUNTER_FIXTURE_CHILD !== '1') throw Error('FIXTURE_ONLY');
const db = new Database(join(process.argv[2], 'jobhunter.sqlite'));
db.pragma('journal_mode=WAL');
db.pragma('wal_autocheckpoint=0');
db.prepare("INSERT OR REPLACE INTO app_state VALUES ('diagnosticOnly',?)").run(process.argv[3]);
process.send?.('WAL_COMMITTED');
setInterval(() => {}, 1000);
