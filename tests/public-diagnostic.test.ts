import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createPublicDiagnostic,
  approvedDiagnosticMaterials,
  diagnosticOutcome,
} from '../apps/server/src/research/diagnostic.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { DisabledMailProvider } from '../apps/server/src/providers.js';
import { strictOutputSchema } from '../apps/server/src/research/codex.js';
import { analysisSchema } from '../apps/server/src/research/contracts.js';
import { DomainError } from '../apps/server/src/util.js';

test('public diagnostic uses AUTO public qualification with no gateway, native Gmail, approval or queue', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-diagnostic-test-')),
    runner = new FixtureRunner(),
    reader = new FixtureReader();
  runner.prospect = reader.prospect = true;
  const d = createPublicDiagnostic(dir, { runner, reader });
  t.after(async () => {
    await d.service.stopWorker();
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  assert.ok(d.service.mail instanceof DisabledMailProvider);
  assert.equal('gateway' in d.service, false);
  assert.equal(d.service.minimalProfile().name, 'Alex Testowy');
  assert.ok(d.service.minimalProfile().facts.every((f) => !f.content.includes('Jakub')));
  assert.doesNotMatch(d.service.profile().message_template, /Jakub|INFOTECH|Białymstoku/);
  await d.service.probe('codex');
  await d.service.probe('search');
  await d.service.start();
  await d.service.tick();
  assert.equal(d.summary().outcome, 'COMPLETED');
  assert.equal(d.summary().extractionsCompleted, 1);
  assert.equal(d.summary().qualificationsCompleted, 1);
  assert.deepEqual(d.summary().itemErrors, []);
  assert.deepEqual(d.summary().modelErrors, []);
  assert.equal(d.summary().contactsQualified, 1);
  assert.equal(d.summary().attempts, 0);
  assert.equal(d.summary().outbox, 0);
  assert.equal(d.summary().drafts, 1);
  for (const prompt of runner.prompts) assert.doesNotMatch(prompt, /Jakub|INFOTECH|Białymstoku/);
  await assert.rejects(d.service.dispatchOne(), (e: any) => e.code === 'SEND_DISABLED');
  assert.equal(d.store.one('SELECT count(*) n FROM draft_approvals')?.n, 0);
  assert.throws(() => createPublicDiagnostic(dir), /DIAGNOSTIC_REQUIRES_NEW_DIRECTORY/);
  assert.throws(
    () => approvedDiagnosticMaterials(dir),
    (e: any) => e.code === 'WORKSTATION_REQUIRED',
  );
});
test('public diagnostic distinguishes a review execution error from contact rejection', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-diagnostic-test-'));
  const runner = new FixtureRunner(),
    reader = new FixtureReader();
  runner.prospect = reader.prospect = true;
  const d = createPublicDiagnostic(dir, { runner, reader });
  t.after(async () => {
    await d.service.stopWorker();
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await d.service.probe('codex');
  await d.service.probe('search');
  runner.beforeCall = async (prompt) => {
    if (prompt.includes('Sprawdź KAŻDE'))
      throw new DomainError('CODEX_FAILED', 'Fixture review failure; no real service.');
  };
  await d.service.start();
  await d.service.tick();
  const summary = d.summary();
  assert.equal(summary.outcome, 'INCOMPLETE');
  assert.equal(summary.extractionsCompleted, 1);
  assert.equal(summary.contactsQualified, 1);
  assert.equal(summary.drafts, 1);
  assert.equal(summary.draftsFullyChecked, 0);
  assert.equal(JSON.parse(d.service.draftRows()[0].semantic_review).supported, null);
  assert.deepEqual(summary.skipped, {});
  assert.deepEqual(summary.itemErrors, [{ stage: 'DRAFT', code: 'CODEX_FAILED', count: 1 }]);
  assert.deepEqual(summary.modelErrors, [
    { stage: 'SEMANTIC_REVIEW', code: 'CODEX_FAILED', count: 1 },
  ]);
  assert.equal(summary.attempts, 0);
  assert.equal(summary.outbox, 0);
  assert.equal(diagnosticOutcome('CODEX_SCHEMA_CONFIGURATION'), 'FAILED');
  assert.equal(diagnosticOutcome('CODEX_FAILED'), 'FAILED');
  assert.equal(diagnosticOutcome('CODEX_LOGIN'), 'BLOCKED_EXTERNAL');
});
test('public diagnostic reports a persisted search limit as BLOCKED_EXTERNAL, not an empty completed run', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-diagnostic-test-'));
  const runner = new FixtureRunner();
  const d = createPublicDiagnostic(dir, { runner, reader: new FixtureReader() });
  t.after(async () => {
    await d.service.stopWorker();
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await d.service.probe('codex');
  await d.service.probe('search');
  runner.beforeCall = async () => {
    throw new DomainError('CODEX_LIMIT', 'Fixture limit; no real service.');
  };
  await d.service.start();
  await d.service.tick();
  const summary = d.summary();
  assert.equal(summary.outcome, 'BLOCKED_EXTERNAL');
  assert.equal(summary.stage, 'SEARCH');
  assert.equal(summary.error, 'CODEX_LIMIT');
  assert.equal(summary.extractionsCompleted, 0);
  assert.equal(summary.qualificationsCompleted, 0);
  assert.equal(summary.attempts, 0);
  assert.equal(summary.outbox, 0);
});
test('Codex extraction schema makes optional domain keys explicit in strict structured output', () => {
  const schema = strictOutputSchema(analysisSchema);
  const check = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (node.properties)
      assert.deepEqual(node.required.slice().sort(), Object.keys(node.properties).sort());
    for (const child of Object.values(node))
      Array.isArray(child) ? child.forEach(check) : check(child);
  };
  check(schema);
});
