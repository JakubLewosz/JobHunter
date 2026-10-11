import { execFileSync, execFile } from 'node:child_process';
import {
  existsSync,
  realpathSync,
  lstatSync,
  readdirSync,
  readFileSync,
  openSync,
  writeFileSync,
  fsyncSync,
  closeSync,
  renameSync,
  unlinkSync,
} from 'node:fs';
import { resolve, relative, isAbsolute, join, sep } from 'node:path';
import { z } from 'zod';
import { Store } from './db.js';
import { DomainError, hash, id, companyDomain } from './util.js';
import type { Row } from '../../../packages/shared/types.js';

const text = z.string().max(10000),
  nullable = text.nullable();
const company = z
  .object({
    id: text,
    canonical_name: text,
    primary_domain: nullable,
    normalized_key: text,
    history_status: text,
    suppression_reason: nullable,
    version: z.number().int(),
    created_at: text,
    updated_at: text,
  })
  .strict();
const alias = z
  .object({
    id: text,
    company_id: text,
    kind: z.enum(['NAME', 'DOMAIN']),
    value: text,
    verified_at: nullable,
    created_at: text,
  })
  .strict();
const suppression = z
  .object({
    id: text,
    company_id: text,
    reason: text,
    actor: text,
    source: text,
    permanent: z.number().int(),
    created_at: text,
  })
  .strict();
const record = z
  .object({
    id: text,
    import_hash: text,
    row_number: z.number().int(),
    company_id: text,
    original_name: text,
    email: nullable,
    domain: nullable,
    status: text,
    occurred_at: nullable,
    created_at: text,
  })
  .strict();
const attempt = z
  .object({
    id: text,
    company_id: text,
    recipient: text,
    state: z.enum([
      'SENDING',
      'SEND_UNKNOWN',
      'SENT_PROVIDER',
      'SENT_CONFIRMED',
      'FAILED_NOT_SENT',
    ]),
    message_id: text,
    mime_hash: text,
    cv_hash: nullable,
    subject: text,
    body: text,
    day: text,
    created_at: text,
  })
  .strict();
const usage = z
  .object({
    id: text,
    day: text,
    kind: z.enum(['FIRST_CONTACT', 'SELF_TEST']),
    state: z.enum(['RESERVED', 'ACCEPTED', 'UNKNOWN', 'NOT_SENT']),
    created_at: text,
  })
  .strict();
const context = z
  .object({
    company_id: text,
    description: text,
    sources: z
      .array(z.object({ url: text, checkedAt: text, contentHash: text, fragment: text }).strict())
      .max(5),
  })
  .strict();
export const historySchema = z
  .object({
    schemaVersion: z.literal(1),
    generation: z.number().int().nonnegative(),
    owner: nullable,
    closed: z.boolean(),
    companies: z.array(company).max(100000),
    aliases: z.array(alias).max(200000),
    suppressions: z.array(suppression).max(100000),
    records: z.array(record).max(100000),
    attempts: z.array(attempt).max(100000),
    usage: z.array(usage).max(200000),
    contexts: z.array(context).max(100000),
  })
  .strict()
  .refine((s) => (s.closed ? s.owner === null : !!s.owner), 'Niezgodny właściciel przekazania.');
type Snapshot = z.infer<typeof historySchema>;

function combineAttempts(a: Row, b: Row): Row {
  if (JSON.stringify({ ...a, state: null }) !== JSON.stringify({ ...b, state: null }))
    throw new DomainError(
      'HISTORY_CONFLICT',
      'Niezgodna treść tej samej próby. Wyjaśnij konflikt historii.',
    );
  if (a.state === b.state) return a;
  if (a.state === 'FAILED_NOT_SENT' || b.state === 'FAILED_NOT_SENT')
    throw new DomainError('HISTORY_CONFLICT', 'Sprzeczny wynik próby wysyłki.');
  const rank = ['SENDING', 'SEND_UNKNOWN', 'SENT_PROVIDER', 'SENT_CONFIRMED'];
  return rank.indexOf(a.state) > rank.indexOf(b.state) ? a : b;
}
export function exportHistory(
  store: Store,
  generation = 0,
  owner: string | null = null,
  closed = true,
): Snapshot {
  return store.atomic(() => {
    const attempts = new Map<string, Row>();
    for (const a of store.all('SELECT * FROM shared_attempts')) attempts.set(a.id, a);
    for (const a of store.all(`SELECT a.id,o.company_id,a.recipient,a.state,a.message_id,a.mime_hash,a.cv_hash,
      i.subject,i.body,u.day,a.created_at FROM send_attempts a JOIN outbox o ON o.id=a.outbox_id
      JOIN usage_ledger u ON u.outbox_id=o.id JOIN gmail_outbox g ON g.outbox_id=o.id
      JOIN gmail_preview_items i ON i.id=g.item_id WHERE o.kind='FIRST_CONTACT'`))
      attempts.set(a.id, attempts.has(a.id) ? combineAttempts(attempts.get(a.id)!, a) : a);
    // Only own first contacts, never OAuth, MIME attachments, inbox bodies or active permissions.
    const companies = store.all('SELECT * FROM companies ORDER BY id').map((c) => {
      const correspondence = store.one(
        `SELECT m.id FROM gmail_messages m LEFT JOIN outbox o ON o.id=m.outbox_id
        WHERE m.company_id=? AND (m.outbox_id IS NULL OR o.kind='FIRST_CONTACT') LIMIT 1`,
        c.id,
      );
      return correspondence && c.history_status === 'NEW'
        ? { ...c, history_status: 'CONTACTED' }
        : c;
    });
    const counters = new Map<string, Row>(
      store.all('SELECT * FROM shared_usage').map((r) => [r.id, r]),
    );
    for (const row of store.all(
      'SELECT u.id,u.day,o.kind,u.state,u.created_at FROM usage_ledger u JOIN outbox o ON o.id=u.outbox_id',
    ))
      counters.set(row.id, row);
    const contexts = new Map<string, Row>(
      store
        .all('SELECT * FROM shared_company_context')
        .map((r) => [r.company_id, { ...r, sources: JSON.parse(r.sources) }]),
    );
    for (const c of companies) {
      const sources = store.all(
        'SELECT canonical_url url,fetched_at checkedAt,content_hash contentHash,substr(fragment,1,1000) fragment FROM evidence WHERE company_id=? ORDER BY fetched_at DESC LIMIT 5',
        c.id,
      );
      if (sources.length)
        contexts.set(c.id, {
          company_id: c.id,
          description:
            store.one(
              'SELECT title FROM opportunities WHERE company_id=? ORDER BY updated_at DESC LIMIT 1',
              c.id,
            )?.title ?? '',
          sources,
        });
    }
    return historySchema.parse({
      schemaVersion: 1,
      generation,
      owner,
      closed,
      companies,
      aliases: store.all('SELECT * FROM company_aliases ORDER BY id'),
      suppressions: store.all('SELECT * FROM suppressions ORDER BY id'),
      records: store.all('SELECT * FROM history_records ORDER BY id'),
      attempts: [...attempts.values()].sort((a, b) => a.id.localeCompare(b.id)),
      usage: [...counters.values()].sort((a, b) => a.id.localeCompare(b.id)),
      contexts: [...contexts.values()].sort((a, b) => a.company_id.localeCompare(b.company_id)),
    });
  });
}
export function importHistory(store: Store, raw: unknown) {
  const snapshot = historySchema.parse(raw);
  return store.atomic(() => {
    const map = new Map<string, string>();
    for (const c of snapshot.companies) {
      const domains = [
        c.primary_domain,
        ...snapshot.aliases
          .filter((a) => a.company_id === c.id && a.kind === 'DOMAIN' && a.verified_at)
          .map((a) => a.value),
      ]
        .map(companyDomain)
        .filter(Boolean);
      const matches = store.all(
        "SELECT DISTINCT c.* FROM companies c LEFT JOIN company_aliases a ON a.company_id=c.id AND a.kind='DOMAIN' AND a.verified_at IS NOT NULL WHERE c.id=? OR c.normalized_key=? OR c.primary_domain IN (SELECT value FROM json_each(?)) OR a.value IN (SELECT value FROM json_each(?))",
        c.id,
        c.normalized_key,
        JSON.stringify(domains),
        JSON.stringify(domains),
      );
      if (matches.length > 1)
        throw new DomainError(
          'HISTORY_CONFLICT',
          'Potwierdzone tożsamości wskazują różne lokalne firmy.',
        );
      const existing = matches[0];
      if (
        existing &&
        existing.primary_domain &&
        c.primary_domain &&
        existing.primary_domain !== c.primary_domain &&
        !domains.includes(companyDomain(existing.primary_domain)) &&
        !store.one(
          "SELECT id FROM company_aliases WHERE company_id=? AND kind='DOMAIN' AND value IN (SELECT value FROM json_each(?)) AND verified_at IS NOT NULL",
          existing.id,
          JSON.stringify(domains),
        )
      )
        throw new DomainError(
          'HISTORY_CONFLICT',
          'Ta sama nazwa ma różne potwierdzone domeny. Wymagane rozstrzygnięcie.',
        );
      if (!existing) insert(store, 'companies', c);
      else {
        store.exec(
          "UPDATE companies SET history_status=CASE WHEN history_status='NEW' THEN ? ELSE history_status END,primary_domain=coalesce(primary_domain,?),suppression_reason=coalesce(suppression_reason,?),updated_at=? WHERE id=?",
          c.history_status,
          c.primary_domain,
          c.suppression_reason,
          c.updated_at,
          existing.id,
        );
      }
      map.set(c.id, existing?.id ?? c.id);
    }
    for (const [table, rows] of [
      ['company_aliases', snapshot.aliases],
      ['suppressions', snapshot.suppressions],
      ['history_records', snapshot.records],
    ] as const) {
      for (const row of rows) {
        const companyId = map.get(row.company_id);
        if (!companyId)
          throw new DomainError('HISTORY_CONFLICT', 'Brak tożsamości firmy w eksporcie.');
        if (table === 'company_aliases') {
          const old = store.one(
            'SELECT * FROM company_aliases WHERE kind=? AND value=?',
            (row as any).kind,
            (row as any).value,
          );
          if (old && old.company_id !== companyId)
            throw new DomainError('HISTORY_CONFLICT', 'Alias należy do innej firmy.');
          if (old) continue;
        }
        if (
          table === 'suppressions' &&
          store.one(
            'SELECT id FROM suppressions WHERE company_id=? AND reason=?',
            companyId,
            (row as any).reason,
          )
        )
          continue;
        const old = store.one(`SELECT * FROM ${table} WHERE id=?`, row.id);
        const mapped = { ...row, company_id: companyId };
        if (old && JSON.stringify(old) !== JSON.stringify(mapped))
          throw new DomainError('HISTORY_CONFLICT', 'Niezgodny rekord historii.');
        if (!old) insert(store, table, mapped);
      }
    }
    for (const a of snapshot.attempts) {
      const companyId = map.get(a.company_id);
      if (!companyId) throw new DomainError('HISTORY_CONFLICT', 'Brak firmy dla próby.');
      const value = { ...a, company_id: companyId };
      const old = store.one('SELECT * FROM shared_attempts WHERE id=?', a.id);
      if (!old) insert(store, 'shared_attempts', value);
      else
        store.exec(
          'UPDATE shared_attempts SET state=? WHERE id=?',
          combineAttempts(old, value).state,
          a.id,
        );
    }
    for (const u of snapshot.usage) {
      const old = store.one('SELECT * FROM shared_usage WHERE id=?', u.id);
      if (old && (old.day !== u.day || old.kind !== u.kind || old.created_at !== u.created_at))
        throw new DomainError('HISTORY_CONFLICT', 'Sprzeczny licznik rezerwacji.');
      if (!old) insert(store, 'shared_usage', u);
      else if (old.state !== u.state) {
        if (old.state === 'NOT_SENT' || u.state === 'NOT_SENT')
          throw new DomainError('HISTORY_CONFLICT', 'Sprzeczny wynik rezerwacji.');
        const ranks = ['RESERVED', 'UNKNOWN', 'ACCEPTED'];
        store.exec(
          'UPDATE shared_usage SET state=? WHERE id=?',
          ranks.indexOf(old.state) > ranks.indexOf(u.state) ? old.state : u.state,
          u.id,
        );
      }
    }
    for (const c of snapshot.contexts) {
      const companyId = map.get(c.company_id);
      if (!companyId)
        throw new DomainError('HISTORY_CONFLICT', 'Brak tożsamości firmy dla publicznych źródeł.');
      store.exec(
        'INSERT INTO shared_company_context VALUES (?,?,?) ON CONFLICT(company_id) DO UPDATE SET description=excluded.description,sources=excluded.sources',
        companyId,
        c.description,
        JSON.stringify(c.sources),
      );
    }
    return snapshot;
  });
}
function insert(store: Store, table: string, row: Row) {
  const keys = Object.keys(row);
  store.exec(
    `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
    ...keys.map((k) => row[k]),
  );
}

export class HistorySync {
  readonly deviceId: string;
  private busy = false;
  constructor(readonly store: Store) {
    this.deviceId = store.get('historyDeviceId', id());
    store.set('historyDeviceId', this.deviceId);
  }
  configure(input: {
    directory: string;
    expectedRemote: string;
    confirmedPrivate: boolean;
    confirmedInitialHistory?: boolean;
  }) {
    if (this.busy)
      throw new DomainError('HISTORY_BUSY', 'Trwa aktualizacja historii. Poczekaj na jej wynik.');
    if (!input.confirmedPrivate)
      throw new DomainError(
        'PRIVATE_REPO_REQUIRED',
        'Potwierdź wskazane prywatne repozytorium historii.',
      );
    const directory = realpathSync(resolve(input.directory));
    for (const forbidden of [realpathSync(process.cwd()), realpathSync(this.store.dir)]) {
      const rel = relative(forbidden, directory);
      if (!rel || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel)))
        throw new DomainError(
          'PRIVATE_REPO_REQUIRED',
          'Repozytorium historii musi być poza kodem i katalogiem SQLite.',
        );
    }
    const remote = this.git(directory, ['remote', 'get-url', 'origin']);
    if (!input.expectedRemote || remote !== input.expectedRemote)
      throw new DomainError('HISTORY_REMOTE_CHANGED', 'Adres origin różni się od potwierdzonego.');
    if (/JakubLewosz[/:]JobHunter(?:\.git)?$/i.test(remote))
      throw new DomainError(
        'PRIVATE_REPO_REQUIRED',
        'Repozytorium kodu nie może przechowywać prywatnej historii.',
      );
    if (this.git(directory, ['branch', '--show-current']) !== 'main')
      throw new DomainError('HISTORY_BRANCH', 'W repozytorium historii wybierz gałąź main.');
    this.store.set('historySyncConfig', {
      directory,
      remote,
      confirmedInitialHistory: input.confirmedInitialHistory === true,
    });
    this.store.set('historySyncRevision', null);
    return this.status();
  }
  status() {
    const config = this.store.get<Row | null>('historySyncConfig', null);
    return {
      configured: !!config,
      deviceId: this.deviceId,
      directory: config?.directory ?? null,
      remote: config?.remote ?? null,
      revision: this.store.get('historySyncRevision', null),
      status: this.store.get('historySyncStatus', config ? 'START_REQUIRED' : 'UNCONFIGURED'),
    };
  }
  private git(directory: string, args: string[]) {
    try {
      return execFileSync('git', ['-c', 'core.hooksPath=', '-C', directory, ...args], {
        encoding: 'utf8',
        timeout: 15000,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    } catch {
      throw new DomainError(
        'HISTORY_GIT',
        'Nie ukończono operacji Git historii. Sprawdź dostęp i konflikt; wysyłka zablokowana.',
      );
    }
  }
  private gitNetwork(directory: string, args: string[]) {
    return new Promise<string>((resolve, reject) =>
      execFile(
        'git',
        ['-c', 'core.hooksPath=', '-C', directory, ...args],
        {
          encoding: 'utf8',
          timeout: 15000,
          windowsHide: true,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
        },
        (error, stdout) =>
          error
            ? reject(
                new DomainError(
                  'HISTORY_GIT',
                  'Nie ukończono operacji Git historii. Sprawdź dostęp i konflikt; wysyłka zablokowana.',
                ),
              )
            : resolve(stdout.trim()),
      ),
    );
  }
  private repository() {
    const config = this.store.get<Row | null>('historySyncConfig', null);
    if (!config)
      throw new DomainError(
        'HISTORY_UNCONFIGURED',
        'Skonfiguruj osobne prywatne repozytorium historii w Ustawieniach.',
      );
    this.files(config.directory);
    if (
      realpathSync(config.directory) !== config.directory ||
      realpathSync(this.git(config.directory, ['rev-parse', '--show-toplevel'])) !==
        config.directory
    )
      throw new DomainError(
        'HISTORY_PATH_CHANGED',
        'Katalog historii prowadzi do innego repozytorium.',
      );
    if (this.git(config.directory, ['branch', '--show-current']) !== 'main')
      throw new DomainError('HISTORY_BRANCH', 'Gałąź historii zmieniła się. Wymagana main.');
    for (const file of ['history.json', 'history.pending']) {
      const path = join(config.directory, file);
      if (existsSync(path) && (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()))
        throw new DomainError(
          'HISTORY_PATH_CHANGED',
          'Plik historii nie może być dowiązaniem ani katalogiem.',
        );
    }
    if (this.git(config.directory, ['remote', 'get-url', 'origin']) !== config.remote)
      throw new DomainError(
        'HISTORY_REMOTE_CHANGED',
        'Origin zmienił się; ponownie zatwierdź konfigurację.',
      );
    if (this.git(config.directory, ['status', '--porcelain']))
      throw new DomainError(
        'HISTORY_DIRTY',
        'Repozytorium historii ma niezapisane zmiany lub przerwany eksport. Sprawdź je przed Start.',
      );
    if (existsSync(join(config.directory, 'history.pending')))
      throw new DomainError(
        'HISTORY_DIRTY',
        'Pozostał staging przerwanego eksportu. Sprawdź jego zawartość.',
      );
    if (
      this.git(config.directory, ['ls-files'])
        .split('\n')
        .some((path) => path && !['history.json', 'README.md', '.gitignore'].includes(path))
    )
      throw new DomainError(
        'PRIVATE_REPO_REQUIRED',
        'Repozytorium historii zawiera inne pliki. Użyj osobnego repozytorium minimalnej historii.',
      );
    return config.directory as string;
  }
  private files(directory: string) {
    const gitDir = join(directory, '.git');
    if (existsSync(join(gitDir, 'commondir')) || existsSync(join(gitDir, 'config.worktree')))
      throw new DomainError(
        'HISTORY_PATH_CHANGED',
        'Historia wymaga samodzielnego klonu bez commondir, config.worktree i zewnętrznych include.',
      );
    if (!lstatSync(gitDir).isDirectory() || realpathSync(gitDir) !== gitDir)
      throw new DomainError(
        'HISTORY_PATH_CHANGED',
        'Historia wymaga zwykłego klonu z lokalnym katalogiem .git.',
      );
    const result: Record<string, string> = {
      directory: realpathSync(directory),
      entries: JSON.stringify(readdirSync(directory).sort()),
    };
    for (const name of [
      '.git/config',
      '.git/HEAD',
      '.git/index',
      '.git/packed-refs',
      '.git/refs/heads/main',
      'history.json',
      'README.md',
      '.gitignore',
    ]) {
      const path = join(directory, name);
      if (!existsSync(path)) {
        result[name] = 'ABSENT';
        continue;
      }
      const stat = lstatSync(path);
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        realpathSync(path) !== path ||
        stat.size > 32 * 1024 * 1024
      )
        throw new DomainError('HISTORY_PATH_CHANGED', 'Nieprawidłowy lub nadmierny plik historii.');
      result[name] = hash(readFileSync(path));
    }
    if (/\[include(?:if)?(?:\s|\])/i.test(readFileSync(join(gitDir, 'config'), 'utf8')))
      throw new DomainError(
        'HISTORY_PATH_CHANGED',
        'Lokalna konfiguracja historii nie może dołączać zewnętrznych plików.',
      );
    return result;
  }
  private current(directory: string): Snapshot {
    const path = join(directory, 'history.json');
    if (
      !existsSync(path) &&
      this.git(directory, ['log', '--all', '--format=%H', '--', 'history.json'])
    )
      throw new DomainError(
        'HISTORY_CONFLICT',
        'Usunięto wcześniej zapisaną historię. Nie utworzono pustej historii zastępczej.',
      );
    return existsSync(path)
      ? historySchema.parse(JSON.parse(readFileSync(path, 'utf8')))
      : exportHistory(this.store);
  }
  async claim() {
    if (this.busy) throw new DomainError('HISTORY_BUSY', 'Trwa aktualizacja historii.');
    this.busy = true;
    try {
      const directory = this.repository();
      await this.gitNetwork(directory, ['fetch', 'origin']);
      this.repository();
      const refs = this.git(directory, [
        'for-each-ref',
        '--format=%(refname)',
        'refs/remotes/origin/main',
      ]);
      if (refs) this.git(directory, ['merge', '--ff-only', 'origin/main']);
      if (
        !existsSync(join(directory, 'history.json')) &&
        !this.store.get<Row>('historySyncConfig', {}).confirmedInitialHistory
      )
        throw new DomainError(
          'INITIAL_HISTORY_REQUIRED',
          'Pierwsze utworzenie historii wymaga potwierdzenia, że ta lokalna baza zawiera dotychczasowe kontakty. Zacznij na urządzeniu z oryginalną historią.',
        );
      const snapshot = this.current(directory);
      if (snapshot.generation < this.store.get<number>('historyLastGeneration', 0))
        throw new DomainError('HISTORY_CONFLICT', 'Historia cofnęła się do starszej generacji.');
      if (!snapshot.closed && snapshot.owner !== this.deviceId)
        throw new DomainError(
          'HISTORY_OWNED',
          'Drugie urządzenie nie zakończyło przekazania. Uruchom je i wykonaj Stop oraz przekazanie historii.',
        );
      importHistory(this.store, snapshot);
      await this.publish(
        directory,
        exportHistory(this.store, snapshot.generation + 1, this.deviceId, false),
      );
      this.store.set('historySyncStatus', 'OWNED');
    } catch (e) {
      this.store.set('historySyncStatus', e instanceof DomainError ? e.code : 'HISTORY_CONFLICT');
      throw e;
    } finally {
      this.busy = false;
    }
  }
  assertOwner() {
    const config = this.store.get<Row | null>('historySyncConfig', null);
    if (!config) throw new DomainError('HISTORY_UNCONFIGURED', 'Brak skonfigurowanej historii.');
    this.repository();
    const snapshot = this.current(config.directory);
    if (
      snapshot.closed ||
      snapshot.owner !== this.deviceId ||
      this.store.get<string>('historySyncStatus', '') !== 'OWNED'
    )
      throw new DomainError(
        'HISTORY_OWNED',
        'Brak własności aktualnej historii. Użyj Start po spójnym przekazaniu.',
      );
    if (
      this.git(config.directory, ['rev-parse', 'HEAD']) !==
      this.store.get('historySyncRevision', '')
    )
      throw new DomainError(
        'HISTORY_CONFLICT',
        'Historia zmieniła się podczas sesji. Zatrzymaj i sprawdź stan.',
      );
  }
  async checkpoint(release = false) {
    if (this.busy) throw new DomainError('HISTORY_BUSY', 'Trwa aktualizacja historii.');
    this.busy = true;
    try {
      this.assertOwner();
      const directory = this.repository();
      await this.gitNetwork(directory, ['fetch', 'origin']);
      this.assertOwner();
      if (
        this.git(directory, ['rev-parse', 'origin/main']) !==
        this.store.get('historySyncRevision', '')
      )
        throw new DomainError(
          'HISTORY_CONFLICT',
          'Stan zdalny zmienił się. Bez nadpisywania i force-push.',
        );
      const snapshot = this.current(directory);
      await this.publish(
        directory,
        exportHistory(this.store, snapshot.generation + 1, release ? null : this.deviceId, release),
      );
      if (release) this.store.set('historySyncStatus', 'HANDED_OFF');
    } finally {
      this.busy = false;
    }
  }
  private async publish(directory: string, snapshot: Snapshot) {
    this.repository();
    const serialized = JSON.stringify(snapshot, null, 2) + '\n';
    if (Buffer.byteLength(serialized) > 32 * 1024 * 1024)
      throw new DomainError(
        'HISTORY_EXPORT_LIMIT',
        'Minimalna historia przekracza 32 MiB. Wymagana ocena eksportu; bez ucinania danych.',
      );
    const path = join(directory, 'history.json'),
      pending = join(directory, 'history.pending');
    // Exclusive staging file exposes interrupted exports; fsync before atomic rename.
    const fd = openSync(pending, 'wx', 0o600);
    try {
      writeFileSync(fd, serialized);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(pending, path);
    this.git(directory, ['add', '--', 'history.json']);
    this.git(directory, [
      '-c',
      'user.name=JobHunter',
      '-c',
      'user.email=jobhunter@localhost',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '-m',
      `History generation ${snapshot.generation}`,
      '--',
      'history.json',
    ]);
    const config = this.store.get<Row>('historySyncConfig', {});
    this.repository();
    await this.gitNetwork(directory, ['push', '--', config.remote, 'HEAD:refs/heads/main']);
    this.repository();
    this.store.set('historySyncRevision', this.git(directory, ['rev-parse', 'HEAD']));
    this.store.set('historyLastGeneration', snapshot.generation);
  }
}
