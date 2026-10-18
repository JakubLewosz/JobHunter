import Database from 'better-sqlite3';
import {
  readFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
  chmodSync,
  writeFileSync,
} from 'node:fs';
import { hash } from './util.js';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import type { Row } from '../../../packages/shared/types.js';

export function backupSQLite(db: Database.Database, profileDir: string) {
  const dir = join(profileDir, 'backups');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const path = join(dir, `before-update-${Date.now()}-${randomUUID()}.sqlite`);
  db.pragma('synchronous = FULL');
  db.prepare('VACUUM INTO ?').run(path);
  chmodSync(path, 0o600);
  const copy = new Database(path, { readonly: true, fileMustExist: true });
  try {
    if (copy.pragma('integrity_check', { simple: true }) !== 'ok')
      throw new Error('BACKUP_INVALID');
  } finally {
    copy.close();
  }
  writeFileSync(
    path + '.provenance.json',
    JSON.stringify({
      schema: 1,
      method: 'VACUUM_INTO',
      createdAt: new Date().toISOString(),
      sha256: hash(readFileSync(path)),
      standalone: true,
    }),
    { flag: 'wx', mode: 0o600 },
  );
  return path;
}

export class Store {
  private measuredTimings?: { sqlDriverMs: number; prepareMs: number };
  get timings() {
    return (this.measuredTimings ??= { sqlDriverMs: 0, prepareMs: 0 });
  }
  private health?: { ok: boolean; checkedAt: string; elapsedMs: number };
  healthStatus() {
    return this.health ?? { ok: false, checkedAt: null, elapsedMs: null };
  }
  readonly db: Database.Database;
  companyAliasRevision = 0;
  assertExclusive: () => void = () => {};
  constructor(public readonly dir: string) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const existed = existsSync(join(dir, 'jobhunter.sqlite'));
    this.db = new Database(join(dir, 'jobhunter.sqlite'));
    try {
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('busy_timeout = 5000');
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = FULL');
      const names = readdirSync(resolve('migrations'))
        .filter((n) => n.endsWith('.sql'))
        .sort();
      const hasMigrations = this.db
        .prepare("SELECT name FROM sqlite_master WHERE name='migrations'")
        .get();
      const applied = hasMigrations
        ? new Set(this.all('SELECT name FROM migrations').map((r) => r.name))
        : new Set();
      if (existed && names.some((name) => !applied.has(name))) this.backup();
      this.db.exec(
        'CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
      );
      for (const name of names) {
        if (!this.one('SELECT name FROM migrations WHERE name=?', name)) {
          // Table rebuilds must not cascade-delete children. Check integrity before committing.
          this.db.pragma('foreign_keys = OFF');
          try {
            this.atomic(() => {
              this.db.exec(readFileSync(resolve('migrations', name), 'utf8'));
              if ((this.db.pragma('foreign_key_check') as unknown[]).length)
                throw new Error('MIGRATION_FOREIGN_KEY');
              this.exec('INSERT INTO migrations VALUES (?,?)', name, new Date().toISOString());
            });
          } finally {
            this.db.pragma('foreign_keys = ON');
          }
        }
      }
    } catch (e) {
      this.db.close();
      throw e;
    }
  }
  assertHealthy() {
    const started = performance.now();
    this.assertExclusive();
    if (
      this.db.pragma('quick_check', { simple: true }) !== 'ok' ||
      (this.db.pragma('foreign_key_check') as unknown[]).length
    ) {
      this.health = {
        ok: false,
        checkedAt: new Date().toISOString(),
        elapsedMs: performance.now() - started,
      };
      throw new Error('LOCAL_DATABASE_INCONSISTENT');
    }
    this.health = {
      ok: true,
      checkedAt: new Date().toISOString(),
      elapsedMs: performance.now() - started,
    };
  }
  backup() {
    this.assertExclusive();
    return backupSQLite(this.db, this.dir);
  }
  one(sql: string, ...args: any[]): Row | undefined {
    const start = performance.now(),
      statement = this.db.prepare(sql),
      ready = performance.now();
    try {
      return statement.get(...args) as Row | undefined;
    } finally {
      this.timings.prepareMs += ready - start;
      this.timings.sqlDriverMs += performance.now() - ready;
    }
  }
  all(sql: string, ...args: any[]): Row[] {
    const start = performance.now(),
      statement = this.db.prepare(sql),
      ready = performance.now();
    try {
      return statement.all(...args) as Row[];
    } finally {
      this.timings.prepareMs += ready - start;
      this.timings.sqlDriverMs += performance.now() - ready;
    }
  }
  exec(sql: string, ...args: any[]) {
    const result = this.db.prepare(sql).run(...args);
    if (/\bcompany_aliases\b|\bDELETE\b|\bREPLACE\b/i.test(sql)) this.companyAliasRevision++;
    return result;
  }
  atomic<T>(fn: () => T): T {
    try {
      return this.db.transaction(fn).immediate();
    } finally {
      // Rollbacks must invalidate name aliases added to an in-memory lookup too.
      this.companyAliasRevision++;
    }
  }
  get<T>(key: string, fallback: T): T {
    const r = this.one('SELECT value FROM app_state WHERE key=?', key);
    return r ? JSON.parse(r.value) : fallback;
  }
  set(key: string, value: unknown) {
    this.exec(
      'INSERT INTO app_state VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      key,
      JSON.stringify(value),
    );
  }
  close() {
    this.db.close();
  }
}
