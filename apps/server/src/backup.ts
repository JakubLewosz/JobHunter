import Database from 'better-sqlite3';
import { existsSync, mkdirSync, chmodSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Store } from './db.js';
import { assertOutsideRepository } from './safe-paths.js';
import { acquireProfileLock } from './backend-lock.js';

export function restoreBackupCopy(backup: string, destination: string) {
  destination = assertOutsideRepository(destination);
  if (existsSync(destination) && readdirSync(destination).length)
    throw new Error('RESTORE_TARGET_EXISTS');
  const target = join(destination, 'jobhunter.sqlite');
  if (existsSync(target)) throw new Error('RESTORE_TARGET_EXISTS');
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  const lock = acquireProfileLock(destination);
  try {
    assertOutsideRepository(destination);
    lock.assert();
    if (existsSync(target)) throw new Error('RESTORE_TARGET_EXISTS');
    const source = new Database(backup, { readonly: true, fileMustExist: true });
    try {
      if (source.pragma('integrity_check', { simple: true }) !== 'ok')
        throw new Error('BACKUP_INVALID');
      source.prepare('VACUUM INTO ?').run(target);
    } finally {
      source.close();
    }
    chmodSync(target, 0o600);
    const restored = new Store(destination);
    restored.assertExclusive = lock.assert;
    try {
      restored.atomic(() => {
        for (const [key, value] of Object.entries({
          stopped: true,
          paused: false,
          gmailSenderPaused: true,
          workerStatus: 'STOPPED',
          localHistoryConfirmed: false,
        }))
          restored.set(key, value);
        restored.exec(
          'UPDATE draft_approvals SET revoked_at=? WHERE revoked_at IS NULL',
          new Date().toISOString(),
        );
        restored.exec('UPDATE gmail_previews SET approved_at=NULL');
        restored.exec(
          "UPDATE auto_sessions SET status='STOPPED',reason='BACKUP_RESTORED',stopped_at=? WHERE status IN ('RUNNING','PAUSED','WAITING')",
          new Date().toISOString(),
        );
        restored.exec(
          "UPDATE auto_batches SET state='STOPPED',reason='BACKUP_RESTORED',updated_at=? WHERE state='RUNNING'",
          new Date().toISOString(),
        );
        restored.exec(
          "UPDATE nightflow_jobs SET state='STOPPED',reason='BACKUP_RESTORED',generation='',updated_at=? WHERE state IN ('PREPARING','REFRESHING','RESEARCHING','VALIDATING','CLOSING','WAITING_WINDOW','SENDING')",
          new Date().toISOString(),
        );
        const work = restored.get<any>('researchDay', {});
        restored.set('researchDay', { ...work, active: false, finalReason: 'BACKUP_RESTORED' });
        const execution = restored.get<any>('browserExecutionContext', null);
        if (execution) restored.set('browserExecutionContext', { ...execution, state: 'STOPPED' });
        restored.exec(
          "UPDATE browser_deliveries SET state=CASE WHEN state='COMMITTING' THEN 'SEND_UNKNOWN' ELSE 'FAILED_NOT_SENT' END WHERE state IN ('WAITING','CLAIMED','COMMITTING')",
        );
        restored.exec(
          "UPDATE outbox SET status='SEND_UNKNOWN',reason='BACKUP_RESTORED' WHERE status='SENDING'",
        );
        restored.exec("UPDATE send_attempts SET state='SEND_UNKNOWN' WHERE state='SENDING'");
        restored.exec(
          "UPDATE outbox SET status='CANCELLED',reason='BACKUP_RESTORED' WHERE status='QUEUED'",
        );
      });
      restored.assertHealthy();
    } finally {
      restored.close();
    }
    return target;
  } finally {
    lock.release();
  }
}
