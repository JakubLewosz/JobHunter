import { existsSync, mkdirSync, realpathSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { Store } from './db.js';
import { acquireProfileLock } from './backend-lock.js';
import { ResearchJobHunter } from './research/service.js';
import { DisabledMailProvider } from './providers.js';
import { confirmPriorApplications } from './prior-applications.js';
import { DomainError, hash } from './util.js';

function newBase(input: string) {
  const path = resolve(input);
  const parent = realpathSync(dirname(path));
  const base = join(parent, basename(path));
  const rel = relative(realpathSync(process.cwd()), base);
  if (!rel || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel)))
    throw new DomainError('INITIALIZATION_PATH', 'Nowe dane muszą być poza repo.');
  if (existsSync(base))
    throw new DomainError(
      'INITIALIZATION_TARGET_EXISTS',
      'Katalog już istnieje; nowa inicjalizacja nie nadpisuje historii.',
    );
  return base;
}

function offlineResearch(store: Store) {
  const runner = {
    inspect: async () => {
      throw new DomainError('INITIALIZATION_NETWORK_DISABLED', 'Inicjalizacja nie używa sieci.');
    },
    run: async <T>(): Promise<{ value: T; meta: never }> => {
      throw new DomainError('INITIALIZATION_NETWORK_DISABLED', 'Inicjalizacja nie używa modelu.');
    },
  };
  const reader = {
    read: async (): Promise<never> => {
      throw new DomainError('INITIALIZATION_NETWORK_DISABLED', 'Inicjalizacja nie pobiera źródeł.');
    },
  };
  const service = new ResearchJobHunter(store, { runner, reader });
  if (!(service.mail instanceof DisabledMailProvider) || 'gateway' in service)
    throw new DomainError(
      'INITIALIZATION_MAIL_DISABLED',
      'Inicjalizacja wymaga technicznego braku poczty.',
    );
  return service;
}

export function previewNewLocalHistory(baseInput: string, text: string) {
  const base = newBase(baseInput);
  const diagnostic = mkdtempSync(join(tmpdir(), 'jh-new-history-preview-'));
  writeFileSync(join(diagnostic, 'development.json'), JSON.stringify({ kind: 'DEVELOPMENT' }));
  const store = new Store(join(diagnostic, 'research-only'));
  try {
    store.set('skipLegacyHistorySeed', true);
    const service = offlineResearch(store);
    return {
      targetDirectory: base,
      database: join(base, 'research-only', 'jobhunter.sqlite'),
      preview: service.previewHistory(text),
      priorApplications:
        'Jedna kolejna wiadomość po zgłoszeniach sprzed trwałej granicy nowej kampanii; nowe próby pozostają blokujące.',
      previewOnly: true,
      diagnosticDirectory: diagnostic,
      legacyNamesAdded: store.one(
        "SELECT count(*) n FROM companies WHERE history_status='HISTORY_TO_VERIFY'",
      )!.n,
      historyRecordsWritten: store.one('SELECT count(*) n FROM history_records')!.n,
    };
  } finally {
    store.close();
  }
}

export function initializeNewLocalHistory(input: {
  base: string;
  text: string;
  approvedHash: string;
  confirmedNewDatabase: boolean;
  confirmedPriorApplications: boolean;
}) {
  if (!input.confirmedNewDatabase || !input.confirmedPriorApplications)
    throw new DomainError(
      'INITIALIZATION_CONFIRMATION',
      'Potwierdź nowy katalog oraz wyjątek dla wcześniejszych zgłoszeń.',
    );
  if (hash(input.text) !== input.approvedHash)
    throw new DomainError('IMPORT_CHANGED', 'CSV zmienił się od zatwierdzonego podglądu.');
  // Validate in an isolated temporary store before creating the approved target.
  const plan = previewNewLocalHistory(input.base, input.text);
  if (plan.preview.rows.some((row) => !row.valid))
    throw new DomainError('INVALID_CSV', 'Popraw wszystkie wiersze przed inicjalizacją.');
  if (plan.preview.rows.some((row) => !('status' in row) || row.status !== 'CONTACTED'))
    throw new DomainError(
      'INITIALIZATION_HISTORY',
      'Ta inicjalizacja przyjmuje zatwierdzone wcześniejsze kontakty CONTACTED.',
    );
  const base = newBase(input.base);
  // Atomic directory creation prevents adopting an existing or concurrently created database.
  mkdirSync(base, { mode: 0o700 });
  const dir = join(base, 'research-only'),
    lock = acquireProfileLock(dir);
  let store: Store | undefined;
  try {
    store = new Store(dir);
    store.assertExclusive = lock.assert;
    store.set('skipLegacyHistorySeed', true);
    const service = offlineResearch(store);
    const imported = service.importHistory(input.text, input.approvedHash);
    const exception = confirmPriorApplications(store, true, new Date());
    store.set('historyStorageMode', 'LOCAL_ONLY');
    store.set('gmailSenderPaused', true);
    service.control('stop');
    service.event(
      'PRIOR_APPLICATION_EXCEPTION',
      'Użytkownik dopuścił jeden kontakt po wcześniejszych zgłoszeniach. Granica kampanii nie odnawia się po Start/restarcie.',
      exception.id,
      'user',
    );
    store.assertHealthy();
    const backup = store.backup();
    return {
      targetDirectory: base,
      database: join(dir, 'jobhunter.sqlite'),
      imported,
      priorApplications: exception,
      backup,
      stopped: service.state().stopped,
      attempts: store.one('SELECT count(*) n FROM send_attempts')!.n,
      outbox: store.one('SELECT count(*) n FROM outbox')!.n,
    };
  } finally {
    store?.close();
    lock.release();
  }
}
