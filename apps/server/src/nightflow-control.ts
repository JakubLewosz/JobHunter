import { createServer, connect, type Socket } from 'node:net';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
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
import { z } from 'zod';
import type { NightflowCoordinator } from './nightflow.js';
import { DomainError } from './util.js';
import Database from 'better-sqlite3';

const descriptor = 'nightflow-control.json';
const scopeSchema = z
  .object({
    instanceId: z.string().min(1).max(100),
    jobId: z.string().min(1).max(100).nullable(),
    generation: z.string().min(1).max(100).nullable(),
  })
  .strict();
export type NightflowControlScope = z.infer<typeof scopeSchema>;
const currentSchema = z
  .object({
    state: z.enum([
      'NOT_STARTED',
      'PREPARING',
      'REFRESHING',
      'RESEARCHING',
      'VALIDATING',
      'CLOSING',
      'WAITING_WINDOW',
      'SENDING',
      'COMPLETED',
      'PAUSED',
      'STOPPED',
      'NEEDS_RESOLUTION',
    ]),
    authority: z.boolean(),
    jobId: z.string().optional(),
  })
  .passthrough();
const stopSchema = z
  .object({
    acknowledgement: z.literal('AUTHORITY_REVOKED'),
    operations: z.literal('MAY_BE_IN_FLIGHT'),
    maintenanceReady: z.literal(false),
  })
  .strict();
const liveSchema = z
  .object({
    source: z.literal('LIVE_OWNER'),
    observedAt: z.iso.datetime(),
    target: scopeSchema,
    current: currentSchema,
    stop: stopSchema.optional(),
  })
  .strict();
export type NightflowLiveResult = z.infer<typeof liveSchema>;
export const unknownNightflowOwner = () => ({
  state: 'UNKNOWN' as const,
  authority: 'UNKNOWN' as const,
  owner: 'UNKNOWN' as const,
});
export function controlCause(error: unknown) {
  return error instanceof Error && /^CONTROL_[A-Z_]+$/.test(error.message)
    ? error.message
    : 'CONTROL_PROTOCOL';
}
const failure = (code: string) => new DomainError(code, code);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Historical read only: no Store, migrator, worker, owner-death inference or authority.
export function readNightflowReport(dir: string) {
  let db: Database.Database | undefined;
  try {
    db = new Database(join(dir, 'jobhunter.sqlite'), { readonly: true, fileMustExist: true });
    const snapshot = db.transaction(() => {
      const job = db!
        .prepare('SELECT * FROM nightflow_jobs ORDER BY started_at DESC,rowid DESC LIMIT 1')
        .get() as any;
      if (!job) return null;
      const items = job.batch_id
        ? db!
            .prepare(
              'SELECT state,count(*) n FROM auto_batch_items WHERE batch_id=? GROUP BY state',
            )
            .all(job.batch_id)
        : [];
      const packets = job.batch_id
        ? db!
            .prepare(
              'SELECT o.status,count(*) n FROM auto_batch_outbox b JOIN auto_batch_items i ON i.id=b.item_id JOIN outbox o ON o.id=b.outbox_id WHERE i.batch_id=? GROUP BY o.status',
            )
            .all(job.batch_id)
        : [];
      return {
        jobId: job.id,
        planId: job.plan_id,
        planVersion: job.plan_version,
        state: job.state,
        reason: job.reason,
        deadline: job.deadline,
        batchId: job.batch_id,
        checkpoint: JSON.parse(job.checkpoint),
        items,
        packets,
        persistedAt: job.updated_at ?? null,
      };
    })();
    return {
      source: 'PERSISTED_SNAPSHOT' as const,
      readAt: new Date().toISOString(),
      current: unknownNightflowOwner(),
      snapshot,
    };
  } catch {
    throw failure('REPORT_UNAVAILABLE');
  } finally {
    db?.close();
  }
}

export async function listenNightflow(dir: string, coordinator: NightflowCoordinator) {
  const secret = randomBytes(32).toString('hex');
  const instanceId = coordinator.controlScope().instanceId;
  const address =
    process.platform === 'win32'
      ? `\\\\.\\pipe\\jobhunter-nightflow-${secret.slice(0, 32)}`
      : join(realpathSync(tmpdir()), `jh-nf-${secret.slice(0, 16)}.sock`);
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
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
          throw failure('CONTROL_REJECTED');
        if (
          req.instanceId !== instanceId ||
          typeof req.requestId !== 'string' ||
          !['stop', 'status', 'report'].includes(req.op)
        )
          throw failure('CONTROL_PROTOCOL');
        const target = scopeSchema.parse(coordinator.controlScope());
        if (req.op === 'stop') {
          // No await between comparing the pinned job/generation and revoking it.
          if (!same(scopeSchema.parse(req.target), target)) throw failure('CONTROL_TARGET_CHANGED');
          coordinator.stop();
        }
        const current = currentSchema.parse(coordinator.status());
        if (req.op === 'stop' && current.authority !== false) throw failure('CONTROL_PROTOCOL');
        socket.end(
          JSON.stringify({
            ok: true,
            requestId: req.requestId,
            op: req.op,
            result: {
              source: 'LIVE_OWNER',
              observedAt: new Date().toISOString(),
              target,
              current,
              ...(req.op === 'stop'
                ? {
                    stop: {
                      acknowledgement: 'AUTHORITY_REVOKED',
                      operations: 'MAY_BE_IN_FLIGHT',
                      maintenanceReady: false,
                    },
                  }
                : {}),
            },
          }) + '\n',
        );
      } catch (error) {
        socket.end(JSON.stringify({ ok: false, code: controlCause(error) }) + '\n');
      }
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(address, resolve);
  });
  if (process.platform !== 'win32') chmodSync(address, 0o600);
  const path = join(dir, descriptor);
  if (existsSync(path)) unlinkSync(path); // Caller owns the profile lock.
  writeFileSync(path, JSON.stringify({ address, secret, instanceId }), { mode: 0o600, flag: 'wx' });
  return async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try {
      if (JSON.parse(readFileSync(path, 'utf8')).secret === secret) unlinkSync(path);
    } catch {} // Never delete a replacement descriptor or mask the primary result.
  };
}

function readDescriptor(dir: string) {
  try {
    const value = JSON.parse(readFileSync(join(dir, descriptor), 'utf8'));
    if (
      !/^[a-f0-9]{64}$/.test(value.secret) ||
      typeof value.instanceId !== 'string' ||
      !value.instanceId ||
      typeof value.address !== 'string' ||
      !(process.platform === 'win32'
        ? /^\\\\\.\\pipe\\jobhunter-nightflow-[a-f0-9]{32}$/.test(value.address)
        : dirname(value.address) === realpathSync(tmpdir()) &&
          /^jh-nf-[a-f0-9]{16}\.sock$/.test(basename(value.address)))
    )
      throw Error();
    return {
      address: value.address as string,
      secret: value.secret as string,
      instanceId: value.instanceId as string,
    };
  } catch {
    throw failure('CONTROL_DESCRIPTOR');
  }
}

export async function requestNightflow(
  dir: string,
  op: string,
  options: { target?: NightflowControlScope; timeoutMs?: number } = {},
): Promise<NightflowLiveResult> {
  if (!['stop', 'status', 'report'].includes(op)) throw failure('CONTROL_PROTOCOL');
  const value = readDescriptor(dir);
  const timeoutMs = options.timeoutMs ?? 5000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 5000)
    throw failure('CONTROL_PROTOCOL');
  const exchange = (
    operation: string,
    target?: NightflowControlScope,
  ): Promise<NightflowLiveResult> =>
    new Promise((resolve, reject) => {
      const requestId = randomUUID();
      const socket = connect(value.address);
      let response = '',
        settled = false;
      const finish = (error?: Error, result?: NightflowLiveResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        if (error) reject(error);
        else resolve(result!);
      };
      // Absolute deadline, not an idle timeout that a broken peer can extend forever.
      const timer = setTimeout(() => finish(failure('CONTROL_TIMEOUT')), timeoutMs);
      socket.setEncoding('utf8');
      socket.on('error', () => finish(failure('CONTROL_UNAVAILABLE')));
      socket.on('close', () => finish(failure('CONTROL_PROTOCOL')));
      socket.on('connect', () =>
        socket.write(
          JSON.stringify({ ...value, address: undefined, op: operation, requestId, target }) + '\n',
        ),
      );
      socket.on('data', (chunk) => {
        response += chunk;
        if (response.length > 100000) finish(failure('CONTROL_LIMIT'));
      });
      socket.on('end', () => {
        try {
          const r = JSON.parse(response);
          if (r.ok === false)
            throw failure(
              ['CONTROL_REJECTED', 'CONTROL_TARGET_CHANGED', 'CONTROL_PROTOCOL'].includes(r.code)
                ? r.code
                : 'CONTROL_PROTOCOL',
            );
          if (r.ok !== true || r.requestId !== requestId || r.op !== operation)
            throw failure('CONTROL_PROTOCOL');
          const result = liveSchema.parse(r.result);
          if (
            result.target.instanceId !== value.instanceId ||
            (target && !same(result.target, target)) ||
            (result.target.jobId !== null && result.current.jobId !== result.target.jobId)
          )
            throw failure('CONTROL_TARGET_CHANGED');
          if (operation === 'stop' && (!result.stop || result.current.authority !== false))
            throw failure('CONTROL_PROTOCOL');
          if (operation !== 'stop' && result.stop) throw failure('CONTROL_PROTOCOL');
          if (!same(readDescriptor(dir), value)) throw failure('CONTROL_OWNER_CHANGED');
          finish(undefined, result);
        } catch (error) {
          finish(failure(controlCause(error)));
        }
      });
    });
  // A read establishes the exact live instance/job/generation before Stop. No retries.
  const target = op === 'stop' ? (options.target ?? (await exchange('status')).target) : undefined;
  if (target && target.instanceId !== value.instanceId) throw failure('CONTROL_TARGET_CHANGED');
  return exchange(op, target);
}
