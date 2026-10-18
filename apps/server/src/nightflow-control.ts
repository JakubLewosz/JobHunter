import { createServer, connect } from 'node:net';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  unlinkSync,
  realpathSync,
  chmodSync,
} from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { NightflowCoordinator } from './nightflow.js';
import Database from 'better-sqlite3';

const descriptor = 'nightflow-control.json';
export function readNightflowReport(dir: string) {
  const db = new Database(join(dir, 'jobhunter.sqlite'), { readonly: true, fileMustExist: true });
  try {
    return db.transaction(() => {
      const job = db
        .prepare('SELECT * FROM nightflow_jobs ORDER BY started_at DESC,rowid DESC LIMIT 1')
        .get() as any;
      if (!job) return { state: 'NOT_STARTED', authority: false };
      const items = job.batch_id
        ? db
            .prepare(
              'SELECT state,count(*) n FROM auto_batch_items WHERE batch_id=? GROUP BY state',
            )
            .all(job.batch_id)
        : [];
      const packets = job.batch_id
        ? db
            .prepare(
              'SELECT o.status,count(*) n FROM auto_batch_outbox b JOIN auto_batch_items i ON i.id=b.item_id JOIN outbox o ON o.id=b.outbox_id WHERE i.batch_id=? GROUP BY o.status',
            )
            .all(job.batch_id)
        : [];
      const interrupted = [
        'PREPARING',
        'REFRESHING',
        'RESEARCHING',
        'VALIDATING',
        'CLOSING',
        'WAITING_WINDOW',
        'SENDING',
      ].includes(job.state);
      return {
        jobId: job.id,
        planId: job.plan_id,
        planVersion: job.plan_version,
        state: interrupted ? 'STOPPED' : job.state,
        reason: interrupted ? 'OWNER_LOST' : job.reason,
        deadline: job.deadline,
        batchId: job.batch_id,
        checkpoint: JSON.parse(job.checkpoint),
        items,
        packets,
        authority: false,
      };
    })();
  } finally {
    db.close();
  }
}
export async function listenNightflow(dir: string, coordinator: NightflowCoordinator) {
  const secret = randomBytes(32).toString('hex');
  const address =
    process.platform === 'win32'
      ? `\\\\.\\pipe\\jobhunter-nightflow-${secret.slice(0, 32)}`
      : join(realpathSync(tmpdir()), `jh-nf-${secret.slice(0, 16)}.sock`);
  const server = createServer((socket) => {
    let input = '',
      processed = false;
    socket.setEncoding('utf8');
    socket.setTimeout(5000, () => socket.destroy());
    socket.on('error', () => {});
    socket.on('data', (chunk) => {
      if (processed) return;
      input += chunk;
      if (input.length > 4096) {
        socket.destroy();
        return;
      }
      if (!input.includes('\n')) return;
      processed = true;
      try {
        const req = JSON.parse(input.slice(0, input.indexOf('\n')));
        const supplied = Buffer.from(typeof req.secret === 'string' ? req.secret : '');
        if (supplied.length !== 64 || !timingSafeEqual(supplied, Buffer.from(secret)))
          throw Error();
        if (req.op === 'stop') coordinator.stop();
        else if (!['status', 'report', 'preflight'].includes(req.op)) throw Error();
        const result =
          req.op === 'preflight'
            ? coordinator.preflight(String(req.planId ?? ''))
            : coordinator.status();
        socket.end(JSON.stringify({ ok: true, result }) + '\n');
      } catch {
        socket.end(JSON.stringify({ ok: false, code: 'CONTROL_REJECTED' }) + '\n');
      }
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(address, resolve);
  });
  if (process.platform !== 'win32') chmodSync(address, 0o600);
  const path = join(dir, descriptor);
  // Caller already owns the profile lease. No other writer can own this file.
  if (existsSync(path)) unlinkSync(path);
  writeFileSync(path, JSON.stringify({ address, secret }), { mode: 0o600, flag: 'wx' });
  return async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (existsSync(path) && JSON.parse(readFileSync(path, 'utf8')).secret === secret)
      unlinkSync(path);
  };
}
export async function requestNightflow(dir: string, op: string, planId?: string): Promise<any> {
  const value = JSON.parse(readFileSync(join(dir, descriptor), 'utf8'));
  if (
    !/^[a-f0-9]{64}$/.test(value.secret) ||
    typeof value.address !== 'string' ||
    !(process.platform === 'win32'
      ? /^\\\\\.\\pipe\\jobhunter-nightflow-[a-f0-9]{32}$/.test(value.address)
      : dirname(value.address) === realpathSync(tmpdir()) &&
        /^jh-nf-[a-f0-9]{16}\.sock$/.test(basename(value.address)))
  )
    throw Error('CONTROL_DESCRIPTOR');
  return new Promise((resolve, reject) => {
    const socket = connect(value.address);
    let response = '';
    socket.setEncoding('utf8');
    socket.setTimeout(5000, () => {
      socket.destroy();
      reject(Error('CONTROL_TIMEOUT'));
    });
    socket.on('error', () => reject(Error('CONTROL_UNAVAILABLE')));
    socket.on('connect', () =>
      socket.write(JSON.stringify({ secret: value.secret, op, planId }) + '\n'),
    );
    socket.on('data', (chunk) => {
      response += chunk;
      if (response.length > 100000) {
        socket.destroy();
        reject(Error('CONTROL_LIMIT'));
      }
    });
    socket.on('end', () => {
      try {
        const r = JSON.parse(response);
        if (!r.ok) throw Error('CONTROL_REJECTED');
        resolve(r.result);
      } catch {
        reject(Error('CONTROL_REJECTED'));
      }
    });
  });
}
