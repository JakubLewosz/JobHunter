import Database from 'better-sqlite3';
import { existsSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { Store } from './db.js';

export function restoreBackupCopy(backup: string, destination: string) {
  const target = join(destination, 'jobhunter.sqlite');
  if (existsSync(target)) throw new Error('RESTORE_TARGET_EXISTS');
  mkdirSync(destination, { recursive: true, mode: 0o700 });
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
}
