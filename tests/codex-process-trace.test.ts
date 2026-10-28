import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';
import { ExecCodexRunner } from '../apps/server/src/research/codex.js';
import {
  newProcessTrace,
  ProcessEventObserver,
} from '../apps/server/src/research/codex-process-trace.js';
const schema = z.object({ ok: z.boolean() }).strict();
const runner = (timeoutMs = 350, maxOutputBytes = 10000) =>
  new ExecCodexRunner({
    binary: process.execPath,
    prefix: [resolve('tests/fixtures/process-trace-cli.mjs')],
    timeoutMs,
    maxOutputBytes,
  });
for (const [mode, code, phase] of [
  ['silent', 'CODEX_TIMEOUT', 'NO_OUTPUT'],
  ['progress', 'CODEX_TIMEOUT', 'TURN_ACTIVE'],
  ['completed-hang', 'CODEX_TIMEOUT', 'AFTER_TURN_COMPLETED'],
  ['partial', 'CODEX_JSONL', null],
  ['malformed', 'CODEX_JSONL', null],
  ['provider', 'CODEX_FAILED', null],
  ['overflow', 'CODEX_OUTPUT_LIMIT', null],
  ['tool', 'ISOLATION_FAILED', null],
] as const)
  test('process trace: ' + mode, async () => {
    await assert.rejects(runner().run(mode, schema, { stage: 'EXTRACT' }), (e: any) => {
      assert.equal(e.code, code);
      const p = e.diagnostic.process;
      assert.ok(p);
      assert.ok(p.spawnMs >= 0);
      assert.ok(p.stdinEndMs >= 0);
      assert.ok(p.closeMs >= p.spawnMs);
      assert.equal(p.timeoutPhase, phase);
      if (code === 'CODEX_TIMEOUT') {
        assert.ok(p.killMs >= p.timeoutMs);
        assert.equal(p.killReason, code);
      }
      if (mode === 'completed-hang') assert.ok(p.turnCompletedMs !== null);
      if (mode === 'provider') assert.equal(p.transportRetries, 1);
      assert.doesNotMatch(JSON.stringify(p), /NEVER_SAVE|fictional-secret|command"|text"/);
      return true;
    });
  });
test('valid structured result requires normal close and records lifecycle metadata', async () => {
  const r = await runner().run('ok', schema);
  assert.deepEqual(r.value, { ok: true });
  const p = r.meta.diagnostic!.process!;
  assert.ok(p.turnCompletedMs !== null);
  assert.ok(p.exitMs! >= p.turnCompletedMs!);
  assert.ok(p.closeMs! >= p.exitMs!);
  assert.equal(p.killMs, null);
  assert.equal(p.inputBytes, 2);
  assert.ok(p.schemaBytes > 0);
});
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
  await assert.rejects(
    runner(600).run('tree|' + path, schema),
    (e: any) => e.code === 'CODEX_TIMEOUT',
  );
  assert.ok(existsSync(path));
  const pid = Number(readFileSync(path, 'utf8'));
  let alive = true;
  for (let i = 0; i < 100 && alive; i++) {
    try {
      process.kill(pid, 0);
      await delay(20);
    } catch {
      alive = false;
    }
  }
  assert.equal(alive, false);
});
