// Adapted from the independent c03161ba review proposal. Native Node24/better-sqlite3;
// actual asynchronous CLI children and local IPC, wholly synthetic owners/data.
import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  unlinkSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer, type Socket } from 'node:net';
import { randomBytes, createHash } from 'node:crypto';
import {
  listenNightflow,
  requestNightflow,
  readNightflowReport,
} from '../apps/server/src/nightflow-control.js';
import type { NightflowCoordinator } from '../apps/server/src/nightflow.js';
import { nightflowChild } from './helpers/nightflow-child.js';

function fixture(t: any) {
  const root = mkdtempSync(join(tmpdir(), 'jh-r14-')),
    dir = join(root, 'data');
  mkdirSync(dir);
  const db = new Database(join(dir, 'jobhunter.sqlite'));
  db.exec(`CREATE TABLE nightflow_jobs(id TEXT PRIMARY KEY,plan_id TEXT,plan_version INTEGER,state TEXT,
    reason TEXT,deadline TEXT,batch_id TEXT,checkpoint TEXT,started_at TEXT,updated_at TEXT);
    INSERT INTO nightflow_jobs VALUES('J_SYNTHETIC','P_SYNTHETIC',1,'SENDING',NULL,
      '2026-10-19T12:00:00Z',NULL,'{}','2026-10-19T00:00:00Z','2026-10-19T01:00:00Z');`);
  let active = true,
    stopCalls = 0;
  const scope = {
    instanceId: 'INSTANCE_SYNTHETIC',
    jobId: 'J_SYNTHETIC',
    generation: 'GEN_SYNTHETIC' as string | null,
  };
  const owner = {
    controlScope: () => ({ ...scope }),
    stop() {
      stopCalls++;
      active = false;
      scope.generation = null;
      db.prepare("UPDATE nightflow_jobs SET state='STOPPED',reason='USER_STOP'").run();
    },
    status: () => ({
      jobId: scope.jobId,
      state: active ? 'SENDING' : 'STOPPED',
      authority: active,
    }),
  } as unknown as NightflowCoordinator;
  const env: NodeJS.ProcessEnv = {};
  for (const k of [
    'PATH',
    'Path',
    'SystemRoot',
    'SYSTEMROOT',
    'WINDIR',
    'ComSpec',
    'COMSPEC',
    'PATHEXT',
    'OS',
  ])
    if (process.env[k]) env[k] = process.env[k];
  for (const p of ['home', 'temp', 'appdata', 'localappdata']) mkdirSync(join(root, p));
  Object.assign(env, {
    HOME: join(root, 'home'),
    USERPROFILE: join(root, 'home'),
    APPDATA: join(root, 'appdata'),
    LOCALAPPDATA: join(root, 'localappdata'),
    TEMP: join(root, 'temp'),
    TMP: join(root, 'temp'),
    TMPDIR: join(root, 'temp'),
    CODEX_HOME: join(root, 'home'),
    JOBHUNTER_RUNTIME: 'DEVELOPMENT',
    JOBHUNTER_MODE: 'DEMO',
    JOBHUNTER_DATA_DIR: dir,
    CI: 'true',
  });
  t.after(() => {
    db.close();
    rmSync(root, { recursive: true, force: true });
  });
  const digest = () =>
    createHash('sha256')
      .update(readFileSync(join(dir, 'jobhunter.sqlite')))
      .digest('hex');
  const cli = (command: string) =>
    nightflowChild([command, '--data-dir', dir], { env, timeoutMs: 15000 });
  return { dir, db, scope, owner, digest, cli, active: () => active, stops: () => stopCalls };
}
async function peer(
  t: any,
  f: ReturnType<typeof fixture>,
  handle: (req: any, socket: Socket) => void,
) {
  const random = randomBytes(16).toString('hex'),
    secret = randomBytes(32).toString('hex');
  const address =
    process.platform === 'win32'
      ? `\\\\.\\pipe\\jobhunter-nightflow-${random}`
      : join(tmpdir(), `jh-nf-${random.slice(0, 16)}.sock`);
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    let input = '';
    socket.on('data', (chunk) => {
      input += chunk;
      if (input.includes('\n')) handle(JSON.parse(input), socket);
    });
  });
  await new Promise<void>((resolve) => server.listen(address, resolve));
  writeFileSync(
    join(f.dir, 'nightflow-control.json'),
    JSON.stringify({ address, secret, instanceId: f.scope.instanceId }),
  );
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
}
const live = (f: ReturnType<typeof fixture>, req: any) => ({
  ok: true,
  requestId: req.requestId,
  op: req.op,
  result: {
    source: 'LIVE_OWNER',
    observedAt: new Date().toISOString(),
    target: { ...f.scope },
    current: f.owner.status(),
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
});

test('R14: positive live Stop ACK, same instance/job/generation; no maintenance claim', async (t) => {
  const f = fixture(t),
    close = await listenNightflow(f.dir, f.owner);
  t.after(close);
  const result = await f.cli('stop');
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.source, 'LIVE_OWNER');
  assert.equal(report.current.authority, false);
  assert.equal(report.stop.acknowledgement, 'AUTHORITY_REVOKED');
  assert.equal(report.stop.maintenanceReady, false);
  assert.equal(report.target.generation, 'GEN_SYNTHETIC');
  assert.equal(f.active(), false);
  assert.equal(f.stops(), 1);
});
for (const command of ['stop', 'status'])
  test(`R14: rejected ${command} cannot stop or fabricate owner loss`, async (t) => {
    const f = fixture(t),
      close = await listenNightflow(f.dir, f.owner);
    t.after(close);
    const path = join(f.dir, 'nightflow-control.json'),
      d = JSON.parse(readFileSync(path, 'utf8'));
    d.secret = '0'.repeat(64);
    writeFileSync(path, JSON.stringify(d));
    const before = f.digest(),
      result = await f.cli(command);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    const error = JSON.parse(result.stderr);
    assert.equal(error.code, command === 'stop' ? 'STOP_UNCONFIRMED' : 'STATUS_UNAVAILABLE');
    assert.equal(error.cause, 'CONTROL_REJECTED');
    assert.equal(error.current.authority, 'UNKNOWN');
    assert.equal(f.active(), true);
    assert.equal(f.stops(), 0);
    assert.equal(f.digest(), before);
    assert.equal((result.stdout + result.stderr).includes(d.secret), false);
  });
for (const mode of ['missing', 'stale', 'wrong-instance'])
  test(`R14: ${mode} descriptor with live owner changes no history`, async (t) => {
    const f = fixture(t),
      close = await listenNightflow(f.dir, f.owner);
    t.after(close);
    const path = join(f.dir, 'nightflow-control.json'),
      d = JSON.parse(readFileSync(path, 'utf8'));
    if (mode === 'missing') unlinkSync(path);
    else {
      if (mode === 'stale') d.address = d.address.replace(/[a-f0-9]{32}$/, '0'.repeat(32));
      else d.instanceId = 'OTHER_INSTANCE';
      writeFileSync(path, JSON.stringify(d));
    }
    const before = f.digest(),
      result = await f.cli('stop');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(JSON.parse(result.stderr).code, 'STOP_UNCONFIRMED');
    assert.equal(f.stops(), 0);
    assert.equal(f.active(), true);
    assert.equal(f.digest(), before);
  });
for (const field of ['jobId', 'generation'])
  test(`R14: pinned old ${field} cannot stop a newer session`, async (t) => {
    const f = fixture(t),
      close = await listenNightflow(f.dir, f.owner);
    t.after(close);
    const before = f.digest();
    await assert.rejects(
      requestNightflow(f.dir, 'stop', { target: { ...f.scope, [field]: 'OLD' } }),
      { code: 'CONTROL_TARGET_CHANGED' },
    );
    assert.equal(f.stops(), 0);
    assert.equal(f.digest(), before);
  });
test('R14: replaced descriptor after probe never redirects Stop to new owner', async (t) => {
  const f = fixture(t);
  let stops = 0;
  await peer(t, f, (req, socket) => {
    if (req.op === 'stop') stops++;
    const response = live(f, req),
      path = join(f.dir, 'nightflow-control.json');
    const d = JSON.parse(readFileSync(path, 'utf8'));
    d.instanceId = 'NEW_INSTANCE';
    writeFileSync(path, JSON.stringify(d));
    socket.end(JSON.stringify(response));
  });
  const result = await f.cli('stop');
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(JSON.parse(result.stderr).cause, 'CONTROL_OWNER_CHANGED');
  assert.equal(stops, 0);
});
for (const fault of ['instance', 'job', 'request', 'op', 'malformed', 'authority-missing'])
  test(`R14: invalid ${fault} response is never an ACK`, async (t) => {
    const f = fixture(t);
    await peer(t, f, (req, socket) => {
      const response = live(f, req);
      if (fault === 'malformed') {
        socket.end('not-json');
        return;
      }
      if (fault === 'instance') response.result.target.instanceId = 'OTHER';
      if (fault === 'job') response.result.target.jobId = 'OTHER';
      if (fault === 'request') response.requestId = 'OTHER';
      if (fault === 'op') response.op = 'OTHER';
      if (fault === 'authority-missing') delete (response.result.current as any).authority;
      socket.end(JSON.stringify(response));
    });
    const before = f.digest(),
      result = await f.cli('stop');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(JSON.parse(result.stderr).code, 'STOP_UNCONFIRMED');
    assert.equal(f.digest(), before);
  });
for (const performed of [false, true])
  test(`R14: timeout ${performed ? 'after revocation, ACK lost' : 'before execution'} stays unconfirmed`, async (t) => {
    const f = fixture(t);
    await peer(t, f, (req, socket) => {
      if (req.op === 'status') socket.end(JSON.stringify(live(f, req)));
      else if (performed) f.owner.stop(); // deliberately retain socket without ACK
    });
    const before = f.digest(),
      result = await f.cli('stop');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(JSON.parse(result.stderr).cause, 'CONTROL_TIMEOUT');
    assert.equal(f.stops(), performed ? 1 : 0);
    assert.equal(f.active(), !performed);
    if (!performed) assert.equal(f.digest(), before);
  });

for (const fault of [
  'instance',
  'job',
  'generation',
  'request',
  'op',
  'stop-missing',
  'authority-missing',
])
  test(`R14: corrupted Stop ACK ${fault} is unconfirmed even after actual revocation`, async (t) => {
    const f = fixture(t);
    await peer(t, f, (req, socket) => {
      const response = live(f, req);
      if (req.op === 'stop') {
        f.owner.stop();
        response.result.current = f.owner.status();
        if (fault === 'instance') response.result.target.instanceId = 'OTHER';
        if (fault === 'job') response.result.target.jobId = 'OTHER';
        if (fault === 'generation') response.result.target.generation = 'OTHER';
        if (fault === 'request') response.requestId = 'OTHER';
        if (fault === 'op') response.op = 'OTHER';
        if (fault === 'stop-missing') delete response.result.stop;
        if (fault === 'authority-missing') delete (response.result.current as any).authority;
      }
      socket.end(JSON.stringify(response));
    });
    const result = await f.cli('stop');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(JSON.parse(result.stderr).code, 'STOP_UNCONFIRMED');
    assert.equal(f.stops(), 1);
    assert.equal(f.active(), false);
  });
for (const state of ['SENDING', 'STOPPED', 'COMPLETED', 'EMPTY'])
  test(`R14: offline ${state} report separates historical record and unknown owner`, async (t) => {
    const f = fixture(t);
    if (state === 'EMPTY') f.db.exec('DELETE FROM nightflow_jobs');
    else f.db.prepare('UPDATE nightflow_jobs SET state=?').run(state);
    const before = f.digest(),
      result = await f.cli('report');
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.source, 'PERSISTED_SNAPSHOT');
    assert.equal(report.current.authority, 'UNKNOWN');
    assert.equal(report.current.state, 'UNKNOWN');
    assert.ok(report.readAt);
    assert.equal(report.snapshot?.state ?? null, state === 'EMPTY' ? null : state);
    if (state !== 'EMPTY') assert.equal(report.snapshot.persistedAt, '2026-10-19T01:00:00Z');
    assert.equal(f.digest(), before);
    assert.equal(f.stops(), 0);
    assert.equal(existsSync(join(f.dir, 'profile.lock')), false);
  });
test('R14: historical timestamp absent remains null, not time of read', (t) => {
  const f = fixture(t);
  f.db.exec('UPDATE nightflow_jobs SET updated_at=NULL');
  assert.equal(readNightflowReport(f.dir).snapshot?.persistedAt, null);
});
for (const fault of ['missing', 'corrupt', 'no-report'])
  test(`R14: ${fault} report has stable error without paths`, async (t) => {
    const f = fixture(t);
    if (fault === 'no-report') f.db.exec('DROP TABLE nightflow_jobs');
    else {
      const path = join(f.dir, 'jobhunter.sqlite');
      f.db.close();
      if (fault === 'missing') unlinkSync(path);
      else writeFileSync(path, 'private-path-sentinel');
    }
    const result = await f.cli('report');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(JSON.parse(result.stderr).code, 'REPORT_UNAVAILABLE');
    assert.equal(result.stderr.includes(f.dir), false);
    assert.equal(result.stderr.includes('sentinel'), false);
  });
