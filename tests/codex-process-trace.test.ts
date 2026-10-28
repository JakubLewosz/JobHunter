import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { spawn } from 'node:child_process';
import { z } from 'zod';
import { ExecCodexRunner } from '../apps/server/src/research/codex.js';
import {
  newProcessTrace,
  ProcessEventObserver,
} from '../apps/server/src/research/codex-process-trace.js';
const schema = z.object({ ok: z.boolean() }).strict();
const originalSetTimeout = globalThis.setTimeout;
const realDelay = (ms: number) => new Promise<void>((resolve) => originalSetTimeout(resolve, ms));
const runner = (timeoutMs?: number, maxOutputBytes = 10000) =>
  new ExecCodexRunner({
    binary: process.execPath,
    prefix: [resolve('tests/fixtures/process-trace-cli.mjs')],
    timeoutMs,
    maxOutputBytes,
  });
async function expireAfterObservedPhase(t: any, mode: string, ready: (p: any) => boolean) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const p = newProcessTrace({
    timeoutMs: 350,
    inputBytes: Buffer.byteLength(mode),
    schemaBytes: 0,
    sourceCount: 0,
    search: false,
  });
  const c = new AbortController();
  const result = (runner() as any)
    .process(process.execPath, ['--json'], mode, 350, c.signal, undefined, undefined, p)
    .then(
      () => ({ error: null }),
      (error: unknown) => ({ error }),
    );
  t.after(async () => {
    c.abort();
    await result;
    t.mock.timers.reset();
  });
  for (let i = 0; i < 500 && !ready(p); i++) await realDelay(10);
  assert.ok(ready(p), 'Owned fixture did not reach the intended phase: ' + JSON.stringify(p));
  // The hard 350ms clock is unchanged; advance it only after observing the phase
  // this test is about. Real Windows subprocess creation/kill are still exercised.
  t.mock.timers.tick(350);
  const ended = await result;
  assert.equal(ended.error?.code, 'CODEX_TIMEOUT');
  assert.equal(p.killMs, 350);
  assert.equal(p.killReason, 'CODEX_TIMEOUT');
  return p;
}
for (const [mode, phase, ready] of [
  ['silent', 'NO_OUTPUT', (p: any) => p.stdinEndMs !== null],
  ['progress', 'TURN_ACTIVE', (p: any) => !!p.eventCounts['item.updated:reasoning']],
  ['completed-hang', 'AFTER_TURN_COMPLETED', (p: any) => p.turnCompletedMs !== null],
] as const)
  test('hard process deadline during observed ' + mode, { timeout: 10000 }, async (t) => {
    const p = await expireAfterObservedPhase(t, mode, ready);
    assert.equal(p.timeoutPhase, phase);
    assert.ok(p.closeMs !== null);
    assert.doesNotMatch(JSON.stringify(p), /NEVER_SAVE/);
  });
for (const [mode, code, phase] of [
  ['partial', 'CODEX_JSONL', null],
  ['malformed', 'CODEX_JSONL', null],
  ['provider', 'CODEX_FAILED', null],
  ['overflow', 'CODEX_OUTPUT_LIMIT', null],
  ['tool', 'ISOLATION_FAILED', null],
  ['tool-delay', 'ISOLATION_FAILED', null],
] as const)
  test('process trace: ' + mode, { timeout: 10000 }, async (t) => {
    await assert.rejects(
      runner().run(mode, schema, { stage: 'EXTRACT', signal: t.signal }),
      (e: any) => {
        assert.equal(e.code, code);
        const p = e.diagnostic.process;
        assert.ok(p);
        assert.ok(p.spawnMs >= 0);
        assert.ok(p.stdinEndMs >= 0);
        assert.ok(p.closeMs >= p.spawnMs);
        assert.equal(p.timeoutPhase, phase);
        if (mode === 'tool' || mode === 'tool-delay') {
          assert.equal(p.eventCounts['item.started:command_execution'], 1);
          assert.equal(p.killReason, 'ISOLATION_FAILED');
        }
        if (mode === 'provider') assert.equal(p.transportRetries, 1);
        assert.doesNotMatch(JSON.stringify(p), /NEVER_SAVE|fictional-secret|command"|text"/);
        return true;
      },
    );
  });
test(
  'valid structured result requires normal close and records lifecycle metadata',
  { timeout: 10000 },
  async (t) => {
    const r = await runner().run('ok', schema, { signal: t.signal });
    assert.deepEqual(r.value, { ok: true });
    const p = r.meta.diagnostic!.process!;
    assert.ok(p.turnCompletedMs !== null);
    assert.ok(p.exitMs! >= p.turnCompletedMs!);
    assert.ok(p.closeMs! >= p.exitMs!);
    assert.equal(p.killMs, null);
    assert.equal(p.inputBytes, 2);
    assert.ok(p.schemaBytes > 0);
  },
);
test('external deadline cancels completed-but-unclosed work instead of accepting output', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-external-deadline-')),
    path = join(dir, 'completed');
  const c = new AbortController();
  t.after(() => {
    c.abort();
    rmSync(dir, { recursive: true, force: true });
  });
  const result = assert.rejects(
    runner(5000).run('completed-hang|' + path, schema, { signal: c.signal }),
    (e: any) => {
      assert.equal(e.code, 'CANCELLED');
      assert.equal(e.diagnostic.process.killReason, 'CANCELLED');
      assert.ok(e.diagnostic.process.turnCompletedMs !== null);
      return true;
    },
  );
  for (let i = 0; i < 150 && !existsSync(path); i++) await delay(20);
  assert.ok(existsSync(path));
  c.abort();
  await result;
});
test('Stop before spawn does not execute the CLI', async () => {
  const c = new AbortController();
  c.abort();
  await assert.rejects(runner().run('ok', schema, { signal: c.signal }));
});
for (const mode of ['silent', 'pre-turn', 'progress', 'web-search', 'completed-hang'])
  test('Stop fences the owned process during ' + mode, async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'jh-stop-phase-')),
      path = join(dir, 'ready');
    const c = new AbortController();
    t.after(() => {
      c.abort();
      rmSync(dir, { recursive: true, force: true });
    });
    const outcome = assert.rejects(
      runner(5000).run(mode + '|' + path, schema, { signal: c.signal }),
      (e: any) => {
        assert.equal(e.code, 'CANCELLED');
        assert.equal(e.diagnostic.process.killReason, 'CANCELLED');
        assert.ok(e.diagnostic.process.closeMs !== null);
        return true;
      },
    );
    for (let i = 0; i < 150 && !existsSync(path); i++) await delay(20);
    assert.ok(existsSync(path));
    c.abort();
    await outcome;
  });
test('observer bounds events and ignores all payloads including split UTF8', () => {
  const p = newProcessTrace({
    timeoutMs: 120000,
    inputBytes: 1,
    schemaBytes: 1,
    sourceCount: 0,
    search: false,
  });
  const o = new ProcessEventObserver(p, () => 1);
  const b = Buffer.from(
    JSON.stringify({ type: 'item.updated', item: { type: 'reasoning', text: 'NEVER_SAVE_ą' } }) +
      '\n',
  );
  for (let i = 0; i < 100; i++) {
    o.stdout(b.subarray(0, b.length - 3));
    o.stdout(b.subarray(b.length - 3));
  }
  o.finish();
  assert.equal(p.events.length, 64);
  assert.equal(p.malformedLines, 0);
  assert.equal(p.eventCounts['item.updated:reasoning'], 100);
  assert.doesNotMatch(JSON.stringify(p), /NEVER_SAVE/);
  o.stdout(Buffer.from('null\n42\n[]\n'));
  assert.equal(p.malformedLines, 3);
});
test('timeout terminates the owned descendant tree', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-process-tree-')),
    path = join(dir, 'owned.pid');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const sentinel = spawn(process.execPath, ['-e', 'setInterval(()=>{},10000)'], {
    windowsHide: true,
    stdio: 'ignore',
  });
  t.after(() => sentinel.kill());
  await expireAfterObservedPhase(t, 'tree|' + path, () => existsSync(path));
  assert.ok(existsSync(path));
  const pid = Number(readFileSync(path, 'utf8'));
  let alive = true;
  for (let i = 0; i < 100 && alive; i++) {
    try {
      process.kill(pid, 0);
      await realDelay(20);
    } catch {
      alive = false;
    }
  }
  assert.equal(alive, false);
  assert.ok(sentinel.pid);
  assert.doesNotThrow(() => process.kill(sentinel.pid!, 0));
});
