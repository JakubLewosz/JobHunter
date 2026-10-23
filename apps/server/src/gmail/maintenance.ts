import Database from 'better-sqlite3';
import { join } from 'node:path';
import { readdirSync, existsSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { acquireBackendMaintenanceLock, acquireProfileLock } from '../backend-lock.js';
import { Store, backupSQLite } from '../db.js';
import { DomainError, normalizeEmail, iso, day } from '../util.js';
import { accountPolicySchema, readAccountPolicy, saveAccountPolicy } from './account-policy.js';
import { setupInfo } from './oauth.js';

export async function withAccountMaintenance<T>(
  base: string,
  operation: (store: Store) => Promise<T>,
) {
  const backend = acquireBackendMaintenanceLock(base);
  let profile: ReturnType<typeof acquireProfileLock> | undefined, store: Store | undefined;
  try {
    const dir = join(base, 'research-only');
    profile = acquireProfileLock(dir);
    const db = new Database(join(dir, 'jobhunter.sqlite'), { readonly: true, fileMustExist: true });
    try {
      if (
        db.pragma('integrity_check', { simple: true }) !== 'ok' ||
        (db.pragma('foreign_key_check') as unknown[]).length
      )
        throw new DomainError('HISTORY_INVALID', 'Historia wymaga wyjaśnienia przed konfiguracją.');
      const applied = new Set(
        (db.prepare('SELECT name FROM migrations').all() as { name: string }[]).map((r) => r.name),
      );
      if (
        readdirSync('migrations')
          .filter((n) => n.endsWith('.sql'))
          .some((n) => !applied.has(n))
      )
        throw new DomainError('MIGRATION_REQUIRED', 'Konfiguracja konta nie wykonuje migracji.');
      if (
        db
          .prepare(
            "SELECT id FROM outbox WHERE status IN ('QUEUED','SENDING','SEND_UNKNOWN','SENT_PROVIDER') LIMIT 1",
          )
          .get() ||
        db
          .prepare(
            "SELECT id FROM shared_attempts WHERE state IN ('SENDING','SEND_UNKNOWN') LIMIT 1",
          )
          .get() ||
        db
          .prepare(
            "SELECT id FROM browser_deliveries WHERE state IN ('WAITING','CLAIMED','COMMITTING') LIMIT 1",
          )
          .get() ||
        db
          .prepare(
            "SELECT id FROM auto_sessions WHERE status IN ('RUNNING','PAUSED','WAITING') LIMIT 1",
          )
          .get()
      )
        throw new DomainError(
          'SESSION_ACTIVE',
          'Zakończ operacje i rozstrzygnij próby; konfiguracja nie zamyka ich za użytkownika.',
        );
      backupSQLite(db, dir);
    } finally {
      db.close();
    }
    store = new Store(dir);
    store.assertExclusive = profile.assert;
    store.assertHealthy();
    // No service, worker, timer, transport listener or sender is constructed.
    store.atomic(() => {
      store!.set('stopped', true);
      store!.set('paused', false);
      store!.set('workerStatus', 'STOPPED');
      store!.set('gmailSenderPaused', true);
      store!.exec(
        'UPDATE draft_approvals SET revoked_at=? WHERE revoked_at IS NULL',
        iso(new Date()),
      );
      const context = store!.get<any>('browserExecutionContext', null);
      if (context) store!.set('browserExecutionContext', { ...context, state: 'STOPPED' });
    });
    // launch tokens are memory-only per process; next backend generates a fresh token.
    // Removing the stale launcher is the supported shutdown cleanup from main.ts.
    const launch = join(dir, 'launch.json');
    if (existsSync(launch)) rmSync(launch);
    return await operation(store);
  } finally {
    store?.close();
    profile?.release();
    backend.release();
  }
}
export function configureSingleAccount(store: Store, base: string, email: string) {
  const parsed = accountPolicySchema.parse({
    email: normalizeEmail(email),
    subject: null,
    transport: 'GMAIL_BROWSER',
    revision: randomUUID(),
  });
  const campaign = store.one("SELECT * FROM campaigns WHERE id='research'");
  // Do not silently rewrite a campaign/material binding to a newly discovered identity.
  if (!campaign || normalizeEmail(campaign.account_email ?? '') !== parsed.email)
    throw new DomainError(
      'GMAIL_ACCOUNT_CHANGED',
      'Kampania wymaga osobnej jawnej zmiany nadawcy.',
    );
  const metadata = setupInfo(join(base, 'gmail-preparation'));
  if (metadata && normalizeEmail(metadata.email) === parsed.email)
    parsed.subject = metadata.subject;
  // Preserve a previously pinned subject even if metadata has disappeared.
  try {
    const prior = readAccountPolicy(base);
    if (prior.email === parsed.email) parsed.subject = prior.subject;
  } catch {}
  saveAccountPolicy(base, parsed);
  store.set('gmailSendTransport', 'GMAIL_BROWSER');
  store.exec("UPDATE campaigns SET policy_version=policy_version+1 WHERE id='research'");
  store.exec(
    'INSERT INTO audit_events VALUES (?,?,?,?,?,?,?)',
    randomUUID(),
    'user',
    'SINGLE_ACCOUNT_CONFIGURED',
    null,
    'Jedno aktywne konto; Computer Use; pomocnicze API; wysyłka zatrzymana.',
    day(new Date()),
    iso(new Date()),
  );
  return parsed;
}
