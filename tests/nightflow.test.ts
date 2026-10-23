import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import {
  NightflowCoordinator,
  nightflowPlanSchema,
  inSendWindow,
  compareNightflowCandidates,
} from '../apps/server/src/nightflow.js';
import { withNightflow } from '../apps/server/src/nightflow-entry.js';
import {
  requestNightflow,
  readNightflowReport,
  listenNightflow,
} from '../apps/server/src/nightflow-control.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function fixture(
  t: any,
  discovery = false,
  boundary?: (phase: string) => Promise<void>,
  many = false,
  realisticWait = false,
) {
  const f = await setup(t, false, many, false, true);
  await f.service.startLibraryResearch(undefined, 8);
  await f.service.tick();
  f.service.control('stop');
  f.service.finishPartial();
  let coordinator!: NightflowCoordinator;
  coordinator = new NightflowCoordinator(f.store, f.service, {
    installation: 'fixture-history',
    clock: f.options.clock,
    wait: async (_ms, signal) => {
      signal.throwIfAborted();
      f.advance(realisticWait ? _ms : 16 * 60000);
    },
    boundary,
  });
  const plan = {
    schema: 1,
    id: 'fixture-plan-v1',
    version: 1,
    installation: 'fixture-history',
    goal: 'Fictional paid remote regular work',
    binding: f.service.nightflowBinding(),
    researchHours: 8,
    afterResearchHours: 24,
    discovery,
    exhaustion: 'FINISH',
    selection: 'VERIFIED_FIT_THEN_CHANNEL_THEN_AGE',
    maxItems: 10,
    limits: { daily: null, session: null, unlimitedExplicit: true },
    intervalSeconds: 60,
    window: { start: '00:00', end: '23:59', timezone: f.service.campaign().timezone },
    empty: 'REPORT_WITHOUT_SEND',
  };
  coordinator.savePlan(plan, true);
  return { ...f, coordinator, plan };
}
test('nightflow: one approved rule plan → existing refresh → frozen derived batch → fake send → report, no fabricated human batch approval', async (t) => {
  const f = await fixture(t);
  const before = f.reader.calls;
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.state, 'COMPLETED', JSON.stringify(result));
  assert.equal(f.gateway.posts.length, 1);
  assert.ok(f.reader.calls > before);
  assert.equal(f.store.one('SELECT count(*) n FROM auto_batch_plan_grants')!.n, 1);
  assert.equal(f.store.one('SELECT approved_at FROM auto_batches')!.approved_at, null);
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 1);
  assert.equal(result.authority, false);
});
test('nightflow: accelerated eight-hour multi-cycle research hands its exact guard result to send without a second Start', async (t) => {
  const f = await fixture(t, true);
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.state, 'COMPLETED', JSON.stringify(result));
  assert.equal(f.gateway.posts.length, 1);
  const job = f.store.one('SELECT * FROM nightflow_jobs')!;
  const checkpoint = JSON.parse(job.checkpoint);
  assert.equal(checkpoint.researchOutcome.deadline, job.deadline);
  assert.equal(checkpoint.researchOutcome.sessionId, job.research_session_id);
  assert.equal(checkpoint.researchOutcome.reason, 'DEADLINE');
  assert.ok(f.store.get<any>('researchDay', {}).cycles > 1);
});
for (const phase of ['REFRESHING', 'VALIDATING', 'CLOSING', 'WAITING_WINDOW', 'SENDING'])
  test('nightflow: Stop at ' + phase + ' cannot be undone by a late continuation', async (t) => {
    let stop!: () => void;
    const f = await fixture(t, false, async (current) => {
      if (current === phase) stop();
    });
    stop = () => f.coordinator.stop();
    const result = await f.coordinator.start(f.plan.id);
    assert.equal(result.state, 'STOPPED');
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
  });
test('nightflow: competing Start, changed profile, restart and missing plan fail closed', async (t) => {
  let release!: () => void;
  const hold = new Promise<void>((r) => (release = r));
  const f = await fixture(t, false, async (phase) => {
    if (phase === 'VALIDATING') await hold;
  });
  assert.deepEqual(f.coordinator.preflight('absent').codes, ['PLAN_REQUIRED']);
  const running = f.coordinator.start(f.plan.id);
  await assert.rejects(() => f.coordinator.start(f.plan.id), { code: 'BUSY' });
  f.coordinator.stop();
  release();
  await running;
  const restarted = new NightflowCoordinator(f.store, f.service, {
    installation: 'fixture-history',
    clock: f.options.clock,
  });
  assert.equal(restarted.status().authority, false);
  assert.equal(f.gateway.posts.length, 0);
  f.store.exec('UPDATE candidate_profiles SET approved_at=NULL');
  assert.equal(restarted.preflight(f.plan.id).ready, false);
});
test('nightflow plan requires explicit unlimited choice and a real timezone/window', () => {
  assert.equal(nightflowPlanSchema.safeParse({}).success, false);
  const plan = { window: { start: '22:00', end: '06:00', timezone: 'Europe/Warsaw' } } as any;
  assert.equal(inSendWindow(plan, new Date('2026-10-18T21:00:00Z')), true);
  assert.equal(inSendWindow(plan, new Date('2026-10-18T10:00:00Z')), false);
});
test('nightflow: live authenticated control Stop is received by the same waiting owner, offline report stays readonly', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-nightflow-control-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let reached!: () => void;
  const waiting = new Promise<void>((resolve) => (reached = resolve));
  await withNightflow(
    {
      dir,
      fixture: true,
      realWaitMs: 20,
      fixtureAdvanceMs: 0,
      onProgress: (event) => {
        if (event === 'PHASE_WAITING_WINDOW') reached();
      },
    },
    async (coordinator, _service, plan) => {
      // Exercise a waiting owner, not synchronous refresh/setup before its first
      // IPC turn. The real RPC deadline remains unchanged at five seconds.
      plan = {
        ...plan,
        discovery: false,
        window: { ...plan.window, start: '22:00', end: '23:00' },
      };
      coordinator.savePlan(plan, true);
      const running = coordinator.start(plan.id);
      await Promise.race([
        waiting,
        running.then(() => {
          throw Error('OWNER_ENDED_BEFORE_WAITING');
        }),
      ]);
      const state = await requestNightflow(dir, 'status');
      assert.equal(state.current.authority, true);
      assert.equal(state.current.state, 'WAITING_WINDOW');
      await requestNightflow(dir, 'stop');
      const report = await running;
      assert.equal(report.state, 'STOPPED');
    },
  );
  assert.equal(readNightflowReport(dir).snapshot?.state, 'STOPPED');
});
test('nightflow: protected history changed during refresh cannot reach a batch', async (t) => {
  const f = await fixture(t);
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (...args) => {
    f.store.set('priorApplicationTamper', 'synthetic');
    return read(...args);
  };
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.reason, 'PROTECTED_DATA_CHANGED');
  assert.equal(f.store.one('SELECT count(*) n FROM auto_batches')!.n, 0);
  assert.equal(f.gateway.posts.length, 0);
});

test('R14: actual coordinator IPC revokes before held SENDING continuation, zero reservations/actions', async (t) => {
  let reached!: () => void, release!: () => void;
  const entered = new Promise<void>((r) => (reached = r)),
    hold = new Promise<void>((r) => (release = r));
  const f = await fixture(t, false, async (phase) => {
    if (phase === 'SENDING') {
      reached();
      await hold;
    }
  });
  const close = await listenNightflow(f.store.dir, f.coordinator);
  try {
    const running = f.coordinator.start(f.plan.id);
    await entered;
    const ack = await requestNightflow(f.store.dir, 'stop');
    assert.equal(ack.current.authority, false);
    assert.equal(ack.stop?.maintenanceReady, false);
    release();
    const result = await running;
    assert.equal(result.state, 'STOPPED');
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
    assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
  } finally {
    release();
    await close();
  }
});

test('R14: IPC ACK revokes authority while a previously accepted fake transport is still settling', async (t) => {
  const f = await fixture(t);
  let reached!: () => void, release!: () => void;
  const entered = new Promise<void>((r) => (reached = r)),
    hold = new Promise<void>((r) => (release = r));
  const send = f.gateway.send.bind(f.gateway);
  f.gateway.send = async (...args) => {
    const result = await send(...args);
    reached();
    await hold;
    return result;
  };
  const close = await listenNightflow(f.dir, f.coordinator);
  try {
    const running = f.coordinator.start(f.plan.id);
    await entered;
    const ack = await requestNightflow(f.dir, 'stop');
    assert.equal(ack.current.authority, false);
    assert.equal(ack.stop?.operations, 'MAY_BE_IN_FLIGHT');
    assert.equal(f.gateway.posts.length, 1);
    release();
    await running;
    assert.equal(f.gateway.posts.length, 1);
    assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 1);
  } finally {
    release();
    await close();
  }
});

test('R14: failed Stop persistence remains unconfirmed but cannot undo in-memory revocation', async (t) => {
  let reached!: () => void, release!: () => void;
  const entered = new Promise<void>((r) => (reached = r)),
    hold = new Promise<void>((r) => (release = r));
  const f = await fixture(t, false, async (phase) => {
    if (phase === 'SENDING') {
      reached();
      await hold;
    }
  });
  const close = await listenNightflow(f.dir, f.coordinator),
    exec = f.store.exec.bind(f.store);
  try {
    const running = f.coordinator.start(f.plan.id);
    await entered;
    f.store.exec = ((sql: string, ...args: any[]) => {
      if (sql.startsWith("UPDATE nightflow_jobs SET state='STOPPED'"))
        throw Error('SYNTHETIC_DISK');
      return exec(sql, ...args);
    }) as typeof exec;
    await assert.rejects(requestNightflow(f.dir, 'stop'), { code: 'CONTROL_PROTOCOL' });
    assert.equal(f.coordinator.controlScope().generation, null);
    f.store.exec = exec;
    release();
    await running;
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  } finally {
    f.store.exec = exec;
    release();
    await close();
  }
});
test('nightflow: changed plan approval during validation is rejected', async (t) => {
  let tamper!: () => void;
  const f = await fixture(t, false, async (phase) => {
    if (phase === 'VALIDATING') tamper();
  });
  tamper = () => f.store.exec('UPDATE nightflow_plans SET approved_hash=NULL');
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.reason, 'PLAN_CHANGED');
  assert.equal(f.gateway.posts.length, 0);
});
test('nightflow: explicit Resume of a closed stopped batch preserves its original deadline and membership', async (t) => {
  let stop!: () => void,
    first = true;
  const f = await fixture(t, false, async (phase) => {
    if (phase === 'WAITING_WINDOW' && first) {
      first = false;
      stop();
    }
  });
  stop = () => f.coordinator.stop();
  const stopped = await f.coordinator.start(f.plan.id);
  assert.equal(stopped.state, 'STOPPED');
  f.service.findOrCreateCompany('Late fictional company', 'late.example.test');
  const resumed = await f.coordinator.start(f.plan.id, stopped.jobId);
  assert.equal(resumed.state, 'COMPLETED', JSON.stringify(resumed));
  assert.equal(resumed.deadline, stopped.deadline);
  assert.equal(resumed.batchId, stopped.batchId);
  assert.equal(resumed.counts?.total, 1);
  assert.equal(f.gateway.posts.length, 1);
});
test('nightflow: unknown accepted fake attempt stops with resolution, restart/Resume cannot retry it', async (t) => {
  const f = await fixture(t);
  f.gateway.timeout = true;
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.state, 'NEEDS_RESOLUTION', JSON.stringify(result));
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.store.one('SELECT state FROM send_attempts')!.state, 'SEND_UNKNOWN');
  assert.equal(f.coordinator.preflight(f.plan.id).ready, false);
  await assert.rejects(() => f.coordinator.start(f.plan.id, result.jobId));
  assert.equal(f.gateway.posts.length, 1);
});
test('nightflow: final send gate enforces a window that closes during a private history await', async (t) => {
  const f = await fixture(t, false, undefined, false, true);
  // Start next to the boundary: advancing most of a day also expires history,
  // which legitimately fails before the window gate and masks this assertion.
  const initialLocal = new Intl.DateTimeFormat('en-GB', {
    timeZone: f.plan.window.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(f.options.clock())
    .split(':')
    .map(Number);
  const initialClock = f.options.clock();
  const offset =
    (23 * 60 + 57 - initialLocal[0] * 60 - initialLocal[1]) * 60000 -
    initialClock.getUTCSeconds() * 1000 -
    initialClock.getUTCMilliseconds();
  f.advance((offset + 86400000) % 86400000);
  const scan = f.gateway.scan.bind(f.gateway);
  let crossed = false;
  f.gateway.scan = async (...args) => {
    await scan(...args);
    if (!crossed) {
      crossed = true;
      f.advance(61000);
    }
  };
  const result = await f.coordinator.start(f.plan.id);
  assert.notEqual(
    result.state,
    'COMPLETED',
    JSON.stringify({
      result,
      crossed,
      batches: f.store.all('SELECT state,reason FROM auto_batches'),
    }),
  );
  assert.equal(
    result.reason,
    'SEND_WINDOW_CLOSED',
    JSON.stringify({
      result,
      batches: f.store.all('SELECT state,reason FROM auto_batches'),
      sessions: f.store.all('SELECT status,reason FROM auto_sessions'),
    }),
  );
  assert.equal(f.gateway.posts.length, 0);
});
test('nightflow: zero eligible results produce report without reservations', async (t) => {
  const f = await fixture(t);
  f.service.suppress(f.service.draftRows()[0].company_id, 'OPT_OUT', 'synthetic');
  // Existing suppression is part of the new run baseline and must be preserved.
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.reason, 'NO_READY_ITEMS');
  assert.equal(result.state, 'COMPLETED');
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});
test('nightflow: a completed guarded research checkpoint resumes validation after its deadline without new research', async (t) => {
  let stop!: () => void,
    first = true;
  const f = await fixture(t, true, async (phase) => {
    if (phase === 'CLOSING' && first) {
      first = false;
      stop();
    }
  });
  stop = () => f.coordinator.stop();
  const paused = await f.coordinator.start(f.plan.id);
  assert.equal(paused.state, 'STOPPED');
  assert.equal(paused.checkpoint?.researchComplete, true);
  assert.ok(Date.parse(f.options.clock().toISOString()) >= Date.parse(paused.deadline));
  const reads = f.reader.calls;
  const result = await f.coordinator.start(f.plan.id, paused.jobId);
  assert.equal(result.state, 'COMPLETED', JSON.stringify(result));
  assert.equal(result.deadline, paused.deadline);
  assert.equal(f.reader.calls, reads);
  assert.equal(f.gateway.posts.length, 1);
});
test('nightflow: derived batch, grant and job binding commit together across a failure immediately after derive', async (t) => {
  const f = await fixture(t),
    derive = f.service.deriveNightflowBatch.bind(f.service);
  f.service.deriveNightflowBatch = (...args) => {
    derive(...args);
    throw Error('SIMULATED_CRASH_AFTER_COMMIT');
  };
  const result = await f.coordinator.start(f.plan.id);
  assert.equal(result.state, 'STOPPED');
  assert.ok(result.batchId);
  const grant = f.store.one('SELECT * FROM auto_batch_plan_grants')!;
  assert.equal(grant.batch_id, result.batchId);
  assert.equal(grant.job_id, result.jobId);
  f.service.deriveNightflowBatch = derive;
  const resumed = await f.coordinator.start(f.plan.id, result.jobId);
  assert.equal(resumed.state, 'COMPLETED');
  assert.equal(resumed.batchId, result.batchId);
  assert.equal(f.gateway.posts.length, 1);
});
test('nightflow: failed atomic job binding rolls back both prepared batch and derived grant', async (t) => {
  const f = await fixture(t),
    exec = f.store.exec.bind(f.store);
  f.store.exec = (sql, ...args) => {
    if (sql.startsWith('UPDATE nightflow_jobs SET batch_id='))
      throw Error('SYNTHETIC_BINDING_FAILURE');
    return exec(sql, ...args);
  };
  try {
    const result = await f.coordinator.start(f.plan.id);
    assert.equal(result.state, 'STOPPED');
  } finally {
    f.store.exec = exec;
  }
  assert.equal(f.store.one('SELECT count(*) n FROM auto_batches')!.n, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM auto_batch_plan_grants')!.n, 0);
  assert.equal(f.gateway.posts.length, 0);
});
test('nightflow: an invalid Resume never overwrites a previous completed job', async (t) => {
  const f = await fixture(t);
  const done = await f.coordinator.start(f.plan.id);
  await assert.rejects(() => f.coordinator.start(f.plan.id, 'missing-job'), {
    code: 'RESUME_REJECTED',
  });
  assert.equal(f.coordinator.status(done.jobId).state, 'COMPLETED');
  assert.equal(f.gateway.posts.length, 1);
});
test('nightflow: WAIT_DEADLINE applies to exhausted library without discovery', async (t) => {
  const f = await fixture(t),
    plan = { ...f.plan, id: 'wait-plan-v1', exhaustion: 'WAIT_DEADLINE' };
  f.coordinator.savePlan(plan, true);
  const result = await f.coordinator.start(plan.id);
  assert.equal(result.state, 'COMPLETED', JSON.stringify(result));
  assert.ok(Date.parse(f.options.clock().toISOString()) >= Date.parse(result.deadline));
  assert.equal(result.researchSessionId, null);
  assert.equal(f.gateway.posts.length, 1);
});
test('nightflow ranking uses verified fit and contact kind rather than a mailbox name', () => {
  const make = (id: string, decision: string, channelRank: number, created_at: string) => ({
    d: { id, decision, created_at },
    channelRank,
  });
  const inquiry = make('recruitment', 'NEEDS_REVIEW', 1, '2026-01-01');
  const general = make('general', 'NEEDS_REVIEW', 0, '2025-01-01');
  const offer = make('fit', 'READY_APPLICATION', 0, '2026-02-01');
  assert.deepEqual(
    [general, inquiry, offer].sort(compareNightflowCandidates).map((c) => c.d.id),
    ['fit', 'recruitment', 'general'],
  );
});
for (const stopped of [false, true])
  test(
    'nightflow: deadline during refresh preserves completed subset and pending library; explicit Stop wins=' +
      stopped,
    async (t) => {
      const f = await fixture(t, false, undefined, true),
        read = f.reader.read.bind(f.reader);
      let calls = 0;
      f.reader.read = async (...args) => {
        if (++calls === 2) {
          f.advance(8 * 3600000);
          if (stopped) f.coordinator.stop();
        }
        return read(...args);
      };
      const result = await f.coordinator.start(f.plan.id);
      assert.equal(f.service.draftRows().length, 5);
      assert.equal(f.gateway.posts.length, stopped ? 0 : 1);
      assert.equal(result.state, stopped ? 'STOPPED' : 'COMPLETED', JSON.stringify(result));
      if (!stopped) {
        assert.equal(result.counts?.total, 1);
        assert.equal(result.checkpoint?.checked.length, 1);
      }
    },
  );
