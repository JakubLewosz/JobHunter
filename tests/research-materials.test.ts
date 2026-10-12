import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createPublicDiagnostic } from '../apps/server/src/research/diagnostic.js';
import { ExecCodexRunner } from '../apps/server/src/research/codex.js';
import { analysisSchema } from '../apps/server/src/research/contracts.js';
import { DomainError } from '../apps/server/src/util.js';
import { checkMessageRules } from '../apps/server/src/research/message-policy.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { setup } from './auto-fixture.js';
import { z } from 'zod';
import { hash } from '../apps/server/src/util.js';

test('atypical native process failure retains cause, correlation and exit status, never secrets or model events', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-diagnostic-test-'));
  const runner = new ExecCodexRunner({
    binary: process.execPath,
    prefix: [resolve('tests/fixtures/odd-cli.mjs')],
  });
  const d = createPublicDiagnostic(dir, { runner });
  t.after(() => {
    const trace = d.store.get<string | null>('modelDiagnosticsDirectory', null);
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
    if (trace) rmSync(trace, { recursive: true, force: true });
  });
  await assert.rejects(
    d.service.call(null, 'EXTRACT', 'fictional input', analysisSchema),
    (e: any) => e.code === 'CODEX_FAILED',
  );
  const call = d.store.one('SELECT * FROM model_calls')!;
  const info = JSON.parse(call.diagnostic);
  assert.equal(info.callId, call.id);
  assert.equal(info.stage, 'EXTRACT');
  assert.equal(info.exitCode, 37);
  assert.equal(info.signal, null);
  assert.equal(info.cliVersion, 'codex-cli 0.fixture');
  assert.equal(info.category, 'UNKNOWN');
  assert.ok(info.elapsedMs > 0);
  assert.match(info.message, /wire framing broke \(EFRAME37\)/);
  const trace = d.store.get<string>('modelDiagnosticsDirectory', '');
  const file = readFileSync(join(trace, readdirSync(trace)[0]), 'utf8');
  assert.equal(JSON.parse(file).callId, call.id);
  assert.doesNotMatch(
    file + call.diagnostic,
    /fictional-secret-value|fictional-api-secret|fictional-bearer-secret|MODEL_EVENT_MUST_NOT_BE_LOGGED|FICTIONAL_PRIVATE_ENVIRONMENT/,
  );
});

test('review execution error retains exact unverified draft; retry reviews the same version without regenerating or sending', async (t) => {
  const f = await setup(t, true, false, false, true);
  f.runner.beforeCall = async (prompt) => {
    if (prompt.includes('Sprawdź KAŻDE'))
      throw new DomainError('CODEX_FAILED', 'fictional review execution error');
  };
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  assert.ok(d);
  const material = f.store.one('SELECT * FROM research_draft_materials')!;
  assert.equal(material.code_status, 'PASS');
  assert.equal(material.review_status, 'ERROR');
  assert.equal(JSON.parse(d.semantic_review).supported, null);
  const generations = f.runner.prompts.filter((p) =>
    p.includes('Przygotuj indywidualny polski szkic'),
  ).length;
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  f.runner.beforeCall = undefined;
  await f.service.retryDraftReview(d.id, d.version);
  const checked = f.service.draftRows()[0];
  assert.equal(checked.body, d.body);
  assert.equal(checked.payload_hash, d.payload_hash);
  assert.equal(checked.version, d.version);
  assert.equal(
    f.runner.prompts.filter((p) => p.includes('Przygotuj indywidualny polski szkic')).length,
    generations,
  );
  assert.equal(JSON.parse(checked.semantic_review).supported, true);
  assert.equal(
    f.store.one('SELECT review_status FROM research_draft_materials')!.review_status,
    'COMPLETED',
  );
  assert.equal(f.gateway.posts.length, 0);
});

for (const changed of ['text', 'profile', 'contact', 'source'] as const)
  test('a prior successful review is invalid for changed ' + changed, async (t) => {
    const f = await setup(t, true, false, false, true);
    await f.service.startAuto();
    await f.service.tick();
    const d = f.service.draftRows()[0];
    if (changed === 'text')
      f.store.exec('UPDATE drafts SET body=body||? WHERE id=?', ' Changed.', d.id);
    if (changed === 'profile')
      f.store.exec(
        "UPDATE candidate_facts SET content=content||' Changed.' WHERE id='fact-education'",
      );
    if (changed === 'contact')
      f.store.exec(
        'UPDATE contacts SET email=? WHERE id=?',
        'changed@fixture.example.test',
        d.contact_id,
      );
    if (changed === 'source') f.store.exec("UPDATE research_sources SET text=text||' Changed.'");
    assert.deepEqual(
      f.service.draftMaterialIssues(
        d.id === f.service.draftRows()[0].id ? f.service.draftRows()[0] : d,
      ),
      ['DRAFT_MATERIAL_STALE'],
    );
    await assert.rejects(
      f.service.retryDraftReview(d.id, d.version),
      (e: any) => e.code === 'DRAFT_MATERIAL_STALE',
    );
    assert.equal(JSON.parse(f.service.draftRows()[0].semantic_review).supported, null);
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
  });

test('unsupported technology retains the disputed claim and fact IDs without relaxing the validator', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-diagnostic-test-')),
    runner = new FixtureRunner(),
    reader = new FixtureReader();
  runner.prospect = reader.prospect = true;
  const run = runner.run.bind(runner);
  runner.run = async (prompt, schema, options) => {
    const r = await run(prompt, schema, options);
    if (prompt.includes('Przygotuj indywidualny polski szkic')) {
      const v = r.value as any;
      v.body += ' Używam React.';
      v.claims.push({
        kind: 'CANDIDATE',
        text: 'Używam React.',
        factIds: [v.factIds[0]],
        evidenceIds: [],
      });
    }
    return r;
  };
  const d = createPublicDiagnostic(dir, { runner, reader });
  t.after(() => {
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await d.service.probe('codex');
  await d.service.probe('search');
  await d.service.start();
  await d.service.tick();
  const draft = d.service.draftRows()[0],
    material = d.store.one('SELECT * FROM research_draft_materials')!;
  assert.match(draft.body, /Używam React\./);
  assert.equal(material.code_status, 'REJECTED');
  assert.equal(material.review_status, 'NOT_RUN');
  const error = JSON.parse(material.code_error);
  assert.equal(error.technology, 'react');
  assert.equal(error.claim, 'Używam React.');
  assert.deepEqual(error.factIds, [JSON.parse(draft.fact_ids)[0]]);
  assert.equal(JSON.parse(draft.semantic_review).supported, null);
  assert.equal(d.summary().attempts, 0);
});
test('successful semantic rejection is COMPLETED/false, never an execution error or a sendable draft', async (t) => {
  const f = await setup(t, true, false, false, true);
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    const r = await run(prompt, schema, options);
    if (prompt.includes('Sprawdź KAŻDE'))
      (r as any).value = { supported: false, issues: ['Fictional unsupported statement.'] };
    return r;
  };
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  assert.equal(JSON.parse(d.semantic_review).supported, false);
  assert.equal(
    f.store.one('SELECT review_status FROM research_draft_materials')!.review_status,
    'COMPLETED',
  );
  assert.equal(f.store.one("SELECT count(*) n FROM model_calls WHERE status='ERROR'")!.n, 0);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
});
test('review packet maps excerpt IDs to source IDs and includes a verified independent inquiry quote', async (t) => {
  const f = await setup(t, true, false, false, true);
  const quote = 'Budujemy narzędzia do automatyzacji procesów.';
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    const s = await read(url, signal);
    s.text += '\n' + quote;
    s.content_hash = hash(s.text + url);
    return s;
  };
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    const r = await run(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const v = r.value as any;
      v.inquiryBasis = {
        sourceId: v.typeProof.sourceId,
        quote,
        explanation: 'Distinct verified business basis.',
      };
    }
    return r;
  };
  await f.service.startAuto();
  await f.service.tick();
  const prompt = f.runner.prompts.find((p) => p.includes('Sprawdź KAŻDE'))!;
  const data = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
  for (const e of data.evidence) {
    assert.ok(e.sourceId);
    assert.notEqual(e.sourceId, e.id);
    assert.ok(f.store.one('SELECT id FROM research_sources WHERE id=?', e.sourceId));
  }
  assert.match(prompt, /Są to różne identyfikatory/);
  assert.match(prompt, /nie poprawność wszystkich hipotez/);
  assert.equal(data.readProofs[0].quote, quote);
  assert.ok(data.evidence.some((e: any) => e.fragment.includes(quote)));
});
test('invalid model output keeps schema path and successful process exit, not a configuration or login guess', async () => {
  const runner = new ExecCodexRunner({
    binary: process.execPath,
    prefix: [resolve('tests/fixtures/odd-cli.mjs')],
  });
  await assert.rejects(
    runner.run('fixture-invalid-output', z.object({ value: z.string() }).strict(), {
      stage: 'DRAFT',
    }),
    (e: any) =>
      e.code === 'CODEX_SCHEMA' &&
      e.diagnostic.category === 'INVALID_OUTPUT' &&
      e.diagnostic.exitCode === 0 &&
      /value: invalid_type/.test(e.diagnostic.message),
  );
});
test('schema construction failure is configuration, before EXEC with no process exit invented', async () => {
  const runner = new ExecCodexRunner({
    binary: process.execPath,
    prefix: [resolve('tests/fixtures/odd-cli.mjs')],
  });
  await assert.rejects(
    runner.run(
      'fixture',
      z.custom(() => true),
      { stage: 'EXTRACT' },
    ),
    (e: any) =>
      e.code === 'CODEX_SCHEMA_CONFIGURATION' &&
      e.diagnostic.category === 'CONFIGURATION' &&
      e.diagnostic.operation === 'SCHEMA' &&
      e.diagnostic.exitCode === null,
  );
});
test('Polish LLM inflection is the same supported technology, not a guessed new competence', () => {
  const body = 'Mój prototyp wykorzystuje lokalne modele językowe.';
  const draft = {
    subject: 'Fixture',
    body,
    factIds: ['models'],
    evidenceIds: [],
    warnings: [],
    claims: [{ kind: 'CANDIDATE', text: body, factIds: ['models'], evidenceIds: [] }],
  };
  const profile = {
    facts: [
      {
        id: 'models',
        key: 'codefabric',
        content: 'Fikcyjny prototyp lokalnych modeli językowych.',
      },
    ],
  };
  assert.doesNotThrow(() => checkMessageRules(draft, profile));
  const unsupported = { ...draft, claims: [{ ...draft.claims[0], factIds: ['education'] }] };
  assert.throws(
    () =>
      checkMessageRules(unsupported, {
        facts: [
          ...profile.facts,
          { id: 'education', key: 'education', content: 'Uczeń technikum.' },
        ],
      }),
    (e: any) => e.code === 'UNSUPPORTED_TECHNOLOGY' && e.details.technology === 'llm',
  );
});
