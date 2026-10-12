import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createPublicDiagnostic,
  approvedDiagnosticMaterials,
} from '../apps/server/src/research/diagnostic.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { DisabledMailProvider } from '../apps/server/src/providers.js';
import { strictOutputSchema } from '../apps/server/src/research/codex.js';
import { analysisSchema } from '../apps/server/src/research/contracts.js';

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
  await d.service.probe('codex');
  await d.service.probe('search');
  await d.service.start();
  await d.service.tick();
  assert.equal(d.summary().contactsQualified, 1);
  assert.equal(d.summary().attempts, 0);
  assert.equal(d.summary().outbox, 0);
  assert.equal(d.summary().drafts, 1);
  await assert.rejects(d.service.dispatchOne(), (e: any) => e.code === 'SEND_DISABLED');
  assert.equal(d.store.one('SELECT count(*) n FROM draft_approvals')?.n, 0);
  assert.throws(() => createPublicDiagnostic(dir), /DIAGNOSTIC_REQUIRES_NEW_DIRECTORY/);
  assert.throws(
    () => approvedDiagnosticMaterials(dir),
    (e: any) => e.code === 'WORKSTATION_REQUIRED',
  );
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
