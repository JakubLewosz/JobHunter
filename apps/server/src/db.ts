import Database from 'better-sqlite3';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Row } from '../../../packages/shared/types.js';

export class Store {
  readonly db: Database.Database;
  constructor(public readonly dir: string) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    this.db = new Database(join(dir, 'jobhunter.sqlite'));
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = FULL');
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
    );
    for (const name of readdirSync(resolve('migrations'))
      .filter((n) => n.endsWith('.sql'))
      .sort()) {
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
  }
  one(sql: string, ...args: any[]): Row | undefined {
    return this.db.prepare(sql).get(...args) as Row | undefined;
  }
  all(sql: string, ...args: any[]): Row[] {
    return this.db.prepare(sql).all(...args) as Row[];
  }
  exec(sql: string, ...args: any[]) {
    return this.db.prepare(sql).run(...args);
  }
  atomic<T>(fn: () => T): T {
    return this.db.transaction(fn).immediate();
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
