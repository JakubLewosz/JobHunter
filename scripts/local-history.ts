import Database from 'better-sqlite3';
import { existsSync, realpathSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve, relative, sep, isAbsolute } from 'node:path';
import { acquireProfileLock } from '../apps/server/src/backend-lock.js';
import { Store, backupSQLite } from '../apps/server/src/db.js';
import { exportHistory, importHistory, historySchema } from '../apps/server/src/history-sync.js';
import { restoreBackupCopy } from '../apps/server/src/backup.js';

const [command, input, extra, confirmation] = process.argv.slice(2);
if (!['doctor', 'backup', 'configure', 'export', 'import', 'restore-copy'].includes(command))
  throw new Error('Nieznana operacja historii.');
if (
  command === 'configure' &&
  (process.platform !== 'win32' ||
    extra !== '--confirm-existing-history' ||
    confirmation !== '--single-workstation')
)
  throw new Error(
    'Konfiguracja wyłącznie na Windows po diagnostyce: configure KATALOG --confirm-existing-history --single-workstation.',
  );
if (command === 'restore-copy' && (!extra || !confirmation))
  throw new Error('restore-copy KATALOG BACKUP NOWY_KATALOG_PROFILU.');
if (command === 'import' && (!extra || confirmation !== '--confirm-private-import'))
  throw new Error('Import wymaga prywatnego pliku i --confirm-private-import.');
if (!input)
  throw new Error('Wskaż jawnie katalog bazowy poza repo: doctor/backup/configure/export/import.');
const base = realpathSync(resolve(input));
const rel = relative(realpathSync(process.cwd()), base);
if (!rel || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel)))
  throw new Error('Dane muszą być poza repo.');
const dir = join(base, 'research-only'),
  path = join(dir, 'jobhunter.sqlite');
const imported =
  command === 'import' && extra && confirmation === '--confirm-private-import'
    ? historySchema.parse(JSON.parse(readFileSync(resolve(extra), 'utf8')))
    : null;
if (imported && !imported.closed)
  throw new Error('Eksport ma aktywnego właściciela. Zakończ pracę na oryginalnym komputerze.');
if (!existsSync(path) && !imported)
  throw new Error(
    'Brak istniejącej historii. Nie utworzono pustej bazy. Sprawdź także oryginalny komputer.',
  );
if (command === 'doctor') {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    const counts = Object.fromEntries(
      [
        'companies',
        'contacts',
        'company_aliases',
        'history_records',
        'suppressions',
        'send_attempts',
        'usage_ledger',
        'shared_attempts',
        'shared_usage',
      ]
        .filter((table) => db.prepare('SELECT name FROM sqlite_master WHERE name=?').get(table))
        .map((table) => [table, (db.prepare(`SELECT count(*) n FROM ${table}`).get() as any).n]),
    );
    console.log(
      JSON.stringify(
        {
          directory: dir,
          integrity: db.pragma('quick_check', { simple: true }),
          counts,
          uncertain: db
            .prepare("SELECT count(*) n FROM outbox WHERE status IN ('SENDING','SEND_UNKNOWN')")
            .get(),
          historyComplete:
            'Wymaga świadomego potwierdzenia użytkownika; liczby nie potwierdzają kompletności.',
        },
        null,
        2,
      ),
    );
  } finally {
    db.close();
  }
} else {
  if (existsSync(join(base, 'backend.lock')))
    throw new Error('Zakończ backend przed pracami nad historią.');
  const lock = acquireProfileLock(dir);
  let store: Store | undefined;
  try {
    if (command === 'backup') {
      const db = new Database(path, { readonly: true, fileMustExist: true });
      try {
        console.log('Spójny backup:', backupSQLite(db, dir));
      } finally {
        db.close();
      }
    } else if (command === 'restore-copy') {
      const output = resolve(confirmation),
        outputRel = relative(process.cwd(), output);
      if (!outputRel.startsWith('..' + sep) && !isAbsolute(outputRel))
        throw new Error('Odtwarzanie musi być poza repo.');
      console.log(
        'Odtworzono kopię bez aktywnej zgody:',
        restoreBackupCopy(resolve(extra), output),
      );
    } else {
      store = new Store(dir);
      store.assertExclusive = lock.assert;
      store.assertHealthy();
      if (command === 'configure') {
        if (store.get('mode', 'DEMO') === 'DEMO')
          throw new Error('Baza DEMO nie może być historią roboczą.');
        if (
          !store.one("SELECT id FROM history_records WHERE status<>'SUGGESTED'") &&
          !store.one('SELECT id FROM send_attempts') &&
          !store.one('SELECT id FROM shared_attempts') &&
          !store.one('SELECT id FROM shared_usage')
        )
          throw new Error(
            'Brak wcześniejszej historii. Nie oznaczono pustej bazy jako kompletnej.',
          );
        // Marker enables providers, never a session or an approval; PRIVATE_GIT transition is separate.
        writeFileSync(
          join(base, 'workstation.json'),
          JSON.stringify({
            kind: 'WORKSTATION',
            base,
            historyConfirmed: true,
            configuredAt: new Date().toISOString(),
          }),
          { mode: 0o600, flag: 'wx' },
        );
        console.log(
          'Instalacja robocza skonfigurowana. Backend pozostaje zatrzymany; Start wymaga polityki.',
        );
      } else if (command === 'export') {
        if (
          store.get('historySyncConfig', null) &&
          store.get('historySyncStatus', '') !== 'HANDED_OFF'
        )
          throw new Error(
            'Najpierw zakończ i opublikuj dotychczasową PRIVATE_GIT. Eksport nie obchodzi stanu innego urządzenia.',
          );
        if (!extra || existsSync(resolve(extra)))
          throw new Error('Wskaż nowy prywatny plik eksportu poza repo.');
        const output = resolve(extra),
          outputRel = relative(process.cwd(), output);
        if (!outputRel.startsWith('..' + sep) && !isAbsolute(outputRel))
          throw new Error('Eksport musi być poza repo.');
        writeFileSync(output, JSON.stringify(exportHistory(store)), { mode: 0o600, flag: 'wx' });
        console.log('Zapisano prywatną historię; bez poświadczeń, CV i aktywnej zgody.');
      } else if (command === 'import') {
        if (!extra || confirmation !== '--confirm-private-import')
          throw new Error('Import wymaga prywatnego pliku i --confirm-private-import.');
        importHistory(store, imported);
        if (!store.get('mode', null)) store.set('mode', 'RESEARCH_ONLY');
        store.set('stopped', true);
        store.set('gmailSenderPaused', true);
        console.log('Dodano historię bez usuwania istniejących rekordów i bez zgody na wysyłkę.');
      } else throw new Error('Nieznana operacja historii.');
    }
  } finally {
    store?.close();
    lock.release();
  }
}
