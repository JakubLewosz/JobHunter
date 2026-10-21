import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

// The IPC channel carries a fixed progress vocabulary, never argv/env/payloads.
export async function nightflowChild(
  args: string[],
  options: {
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number;
    signal?: AbortSignal;
    onProgress?: (event: string) => void;
  } = {},
) {
  const start = performance.now(),
    startedAt = new Date().toISOString();
  const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/nightflow.ts', ...args], {
    env: options.env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  let stdout = '',
    stderr = '',
    errorCode: string | null = null,
    spawnMs: number | null = null,
    termination = 'EXIT',
    timedOut = false;
  const events: { event: string; elapsedMs: number }[] = [];
  child.once('spawn', () => {
    spawnMs = performance.now() - start;
  });
  child.on('message', (message: any) => {
    if (
      message?.kind === 'NIGHTFLOW_FIXTURE_PROGRESS' &&
      /^(ENTRY|IMPORT_BEGIN|IMPORT_END|LOCK_ACQUIRED|STORE_READY|SERVICE_READY|FIXTURE_READY|PHASE_(REFRESHING|RESEARCHING|VALIDATING|CLOSING|WAITING_WINDOW|SENDING)|RESULT|CLEANUP_BEGIN|CONTROL_CLOSED|WORKER_CLOSED|HOST_CLOSED|STORE_CLOSED|LOCK_RELEASED)$/.test(
        message.event,
      ) &&
      events.length < 128
    ) {
      events.push({ event: message.event, elapsedMs: performance.now() - start });
      options.onProgress?.(message.event);
    }
  });
  const output = (field: 'stdout' | 'stderr', chunk: Buffer) => {
    if (field === 'stdout') stdout += chunk.toString();
    else stderr += chunk.toString();
    if (stdout.length + stderr.length > 200000) cancel('OUTPUT_LIMIT');
  };
  child.stdout!.on('data', (b) => output('stdout', b));
  child.stderr!.on('data', (b) => output('stderr', b));
  let force: NodeJS.Timeout | undefined;
  function cancel(reason: string) {
    if (termination !== 'EXIT') return;
    termination = reason;
    if (child.connected) child.send({ op: 'CANCEL_FIXTURE' }, () => {});
    // Only our directly spawned Node child; no npm shell or unknown process tree.
    force = setTimeout(() => child.kill(), 2000);
  }
  const abort = () => cancel('CANCELLED');
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(() => {
    timedOut = true;
    cancel('TEST_TIMEOUT');
  }, options.timeoutMs ?? 30000);
  const exit = await new Promise<{ status: number | null; signal: NodeJS.Signals | null }>(
    (resolve) => {
      child.once('error', (error: NodeJS.ErrnoException) => {
        errorCode = /^[A-Z_]+$/.test(error.code ?? '') ? error.code! : 'SPAWN_ERROR';
      });
      child.once('close', (status, signal) => resolve({ status, signal }));
    },
  );
  clearTimeout(timer);
  clearTimeout(force);
  options.signal?.removeEventListener('abort', abort);
  if (timedOut) errorCode = 'ETIMEDOUT';
  if (termination === 'EXIT' && exit.status !== 0) termination = 'CRASH';
  const diagnostics = {
    schema: 1,
    scope: 'SYNTHETIC_NIGHTFLOW_CHILD',
    startedAt,
    endedAt: new Date().toISOString(),
    elapsedMs: performance.now() - start,
    spawnMs,
    errorCode,
    ...exit,
    termination,
    lastPhase: events.filter((x) => x.event.startsWith('PHASE_')).at(-1)?.event ?? null,
    lastEvent: events.at(-1)?.event ?? null,
    events,
  };
  const destination =
    options.env?.JOBHUNTER_TEST_DIAGNOSTICS_DIR ?? process.env.JOBHUNTER_TEST_DIAGNOSTICS_DIR;
  if (destination) {
    mkdirSync(destination, { recursive: true });
    writeFileSync(
      join(destination, `nightflow-child-${randomUUID()}.json`),
      JSON.stringify(diagnostics, null, 2) + '\n',
    );
  }
  return { ...exit, stdout, stderr, diagnostics };
}
