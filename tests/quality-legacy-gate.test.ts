import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import {
  generationPrompt,
  templateStyleGuidance,
} from '../apps/server/src/research/message-quality.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { DomainError } from '../apps/server/src/util.js';
import { qualityCases } from './fixtures/message-quality.js';

function legacy(f: Awaited<ReturnType<typeof setup>>) {
  const d = f.service.draftRows()[0];
  const m = f.store.one(
    'SELECT * FROM research_draft_materials WHERE draft_id=? AND version=?',
    d.id,
    d.version,
  )!;
  const context = JSON.parse(m.context_json);
  delete context.messageQualityVersion;
  const review = { supported: true, issues: [] };
  f.store.exec(
    'UPDATE research_draft_materials SET context_json=?,review_result=? WHERE draft_id=? AND version=?',
    JSON.stringify(context),
    JSON.stringify(review),
    d.id,
    d.version,
  );
  f.store.exec(
    'UPDATE research_drafts SET semantic_review=? WHERE draft_id=?',
    JSON.stringify(review),
    d.id,
  );
  return {
    d: f.service.draftRows()[0],
    material: f.store.one(
      'SELECT * FROM research_draft_materials WHERE draft_id=? AND version=?',
      d.id,
      d.version,
    )!,
  };
}

test('a complete approved letter without placeholders cannot become model paragraph guidance', () => {
  const c = qualityCases[0];
  const template =
    'Dzień dobry,\n\nNazywam się Fikcyjny Kandydat i szukam regularnej pracy.\n\nJestem dostępny 20 godzin.\n\nPozdrawiam\nFikcyjny Kandydat';
  assert.throws(
    () =>
      generationPrompt(
        { ...c, template },
        'GENERAL_RECRUITMENT_CONTACT',
        'COOPERATION_POSSIBILITY',
      ),
    { code: 'TEMPLATE_STYLE_PREFERENCES_REQUIRED' },
  );
  assert.throws(
    () => templateStyleGuidance('W projekcie przetwarzam zadania.\n\nChętnie dołączę do zespołu.'),
    { code: 'TEMPLATE_STYLE_PREFERENCES_REQUIRED' },
  );
});

test('approved plain style instructions and instructions outside placeholders retain their meaning', () => {
  const plain = 'Pisz po polsku i prosto. Nie dodawaj informacji o umowie.';
  assert.deepEqual(templateStyleGuidance(plain), [plain]);
  const template =
    'Dzień dobry,\n\nSTAŁA_WIZYTÓWKA\n\n[Jedna konkretna czynność projektu.]\n\nPreferencje stylu: Zwracaj się przez Państwo i zachowaj krótki ton.\n\nPozdrawiam';
  assert.deepEqual(templateStyleGuidance(template), [
    'Jedna konkretna czynność projektu.',
    'Preferencje stylu: Zwracaj się przez Państwo i zachowaj krótki ton.',
  ]);
  assert.doesNotMatch(JSON.stringify(templateStyleGuidance(template)), /STAŁA_WIZYTÓWKA/);
});

test('legacy supported=true/PASS cannot prepare or dispatch without current editorial review', async (t) => {
  const f = await setup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.service.control('stop');
  const { d, material } = legacy(f);
  const policy = f.service.policyConfig();
  const batch = f.service.prepareBatch({ drafts: [{ id: d.id, version: d.version }] });
  t.diagnostic(
    JSON.stringify({ legacyPreparation: batch.items[0].state, code: batch.items[0].code }),
  );
  assert.equal(batch.items[0].state, 'NEEDS_REPREPARATION');
  assert.equal(batch.items[0].code, 'EDITORIAL_REVIEW_REQUIRED');
  await f.service.startAuto();
  f.advance();
  await f.service.dispatchOne();
  f.service.control('stop');
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.gateway.historyQueries.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
  assert.deepEqual(
    f.store.one(
      'SELECT * FROM research_draft_materials WHERE draft_id=? AND version=?',
      d.id,
      d.version,
    ),
    material,
  );
  assert.deepEqual(f.service.policyConfig(), policy);
});

test('selected legacy review appends an exact unverified version, preserves historical verdict and needs no per-mail manual approval', async (t) => {
  const f = await setup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.service.control('stop');
  const { d, material } = legacy(f),
    policy = f.service.policyConfig();
  const review = await f.service.verifyDraft(d.id, d.version);
  const current = f.service.draftRows()[0];
  assert.equal(review.supported, true);
  assert.equal(current.version, d.version + 1);
  assert.equal(current.subject, d.subject);
  assert.equal(current.body, d.body);
  assert.equal(current.email, d.email);
  assert.deepEqual(JSON.parse(current.fact_ids), JSON.parse(d.fact_ids));
  assert.deepEqual(
    f.store.one(
      'SELECT * FROM research_draft_materials WHERE draft_id=? AND version=?',
      d.id,
      d.version,
    ),
    material,
  );
  assert.deepEqual(f.service.draftMaterialIssues(current), []);
  assert.equal(current.reviewed_at, null);
  assert.equal(
    f.service.prepareBatch({ drafts: [{ id: current.id, version: current.version }] }).items[0]
      .state,
    'READY',
  );
  assert.deepEqual(f.service.policyConfig(), policy);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.gateway.historyQueries.length, 0);
});

test('old or unknown quality version cannot borrow a positive verdict; sent versions cannot reopen', async (t) => {
  const f = await setup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.service.control('stop');
  const d = f.service.draftRows()[0];
  const m = f.store.one('SELECT * FROM research_draft_materials WHERE draft_id=?', d.id)!;
  const context = JSON.parse(m.context_json);
  context.messageQualityVersion = 999;
  f.store.exec(
    'UPDATE research_draft_materials SET context_json=? WHERE draft_id=?',
    JSON.stringify(context),
    d.id,
  );
  assert.deepEqual(f.service.draftMaterialIssues(d), ['EDITORIAL_REVIEW_REQUIRED']);
  f.store.exec("UPDATE drafts SET status='SENT' WHERE id=?", d.id);
  const before = f.store.all('SELECT * FROM research_draft_materials');
  await assert.rejects(f.service.verifyDraft(d.id, d.version), { code: 'DRAFT_BLOCKED' });
  assert.deepEqual(f.store.all('SELECT * FROM research_draft_materials'), before);
});

test('legacy with no material is unverified and archives its old semantic verdict before review', async (t) => {
  const f = await setup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.service.control('stop');
  const { d } = legacy(f);
  f.store.exec('DELETE FROM research_draft_materials WHERE draft_id=?', d.id);
  assert.deepEqual(f.service.draftMaterialIssues(d), ['DRAFT_MATERIAL_UNVERIFIED']);
  await f.service.verifyDraft(d.id, d.version);
  const current = f.service.draftRows()[0];
  assert.equal(current.version, d.version + 1);
  assert.equal(current.body, d.body);
  assert.deepEqual(f.store.get(`legacyReviewSnapshot:${d.id}:${d.version}`, null), {
    semanticReview: JSON.parse(d.semantic_review),
    payload: {
      subject: d.subject,
      body: d.body,
      factIds: JSON.parse(d.fact_ids),
      evidenceIds: JSON.parse(d.evidence_ids),
      claims: JSON.parse(d.claims),
      warnings: JSON.parse(d.warnings),
    },
    version: d.version,
    recordedAt: f.service.now(),
  });
  assert.deepEqual(f.service.draftMaterialIssues(current), []);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.gateway.historyQueries.length, 0);
});

test('legacy promotion does not overwrite orphan material or renew an already spent correction budget after restart', async (t) => {
  const f = await setup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.service.control('stop');
  const { d, material } = legacy(f);
  const ctx = JSON.parse(material.context_json);
  ctx.editorialRevisionAttempted = true;
  f.store.exec(
    'UPDATE research_draft_materials SET context_json=? WHERE draft_id=? AND version=?',
    JSON.stringify(ctx),
    d.id,
    d.version,
  );
  f.store.exec(
    'INSERT INTO draft_versions VALUES (?,?,?,?,?,?,?)',
    'orphan-test-version',
    d.id,
    d.version + 1,
    d.subject,
    d.body,
    d.payload_hash,
    f.service.now(),
  );
  let corrections = 0;
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    if (prompt.startsWith('Wykonaj JEDNĄ')) corrections++;
    const r = await run(prompt, schema, options);
    if (prompt.includes('Sprawdź KAŻDE'))
      (r.value as any).quality = {
        verdict: 'REVISE',
        defects: [{ code: 'PACKAGING', fragment: '', reason: 'Missing portfolio context.' }],
      };
    return r;
  };
  await f.service.verifyDraft(d.id, d.version);
  const current = f.service.draftRows()[0];
  assert.equal(current.version, d.version + 2);
  assert.equal(corrections, 0);
  const restarted = new ResearchJobHunter(f.store, { runner: f.runner, reader: f.reader });
  await restarted.verifyDraft(current.id, current.version);
  assert.equal(corrections, 0);
  assert.equal(restarted.draftRows()[0].version, current.version);
  assert.ok(f.store.one('SELECT * FROM draft_versions WHERE id=?', 'orphan-test-version'));
  assert.equal(f.gateway.posts.length, 0);
});

for (const fault of ['stop', 'version', 'profile', 'source', 'owner', 'deadline', 'model'] as const)
  test(`legacy promotion keeps old verdict and fences final PASS after ${fault}`, async (t) => {
    const f = await setup(t, true, false, false, true);
    await f.service.startAuto();
    await f.service.tick();
    f.service.control('stop');
    const { d, material } = legacy(f);
    let enter!: () => void, release!: () => void;
    const ready = new Promise<void>((r) => (enter = r)),
      held = new Promise<void>((r) => (release = r));
    f.runner.beforeCall = async (prompt) => {
      if (prompt.includes('Sprawdź KAŻDE')) {
        enter();
        await held;
        if (fault === 'model') throw new DomainError('MODEL_FAILED', 'Synthetic model failure');
      }
    };
    const abort = new AbortController();
    const work = f.service.retryDraftReview(d.id, d.version, abort.signal);
    await Promise.race([
      ready,
      work.then(() => {
        throw Error('NO_REVIEW_CALL');
      }),
    ]);
    const current = f.service.draftRows()[0];
    const owner = f.store.assertExclusive;
    if (fault === 'stop') f.service.control('stop');
    if (fault === 'version')
      f.service.editDraft(current.id, {
        version: current.version,
        subject: current.subject,
        body: current.body + ' New edit.',
      });
    if (fault === 'profile')
      f.store.exec(
        "UPDATE candidate_facts SET content=content||' changed' WHERE fact_key='education'",
      );
    if (fault === 'source') f.store.exec("UPDATE research_sources SET text=text||' changed'");
    if (fault === 'owner')
      f.store.assertExclusive = () => {
        throw new DomainError('PROFILE_LOCK_LOST', 'Synthetic owner loss');
      };
    if (fault === 'deadline') abort.abort(new DomainError('DEADLINE', 'Synthetic deadline'));
    release();
    try {
      await assert.rejects(work);
    } finally {
      f.store.assertExclusive = owner;
    }
    assert.deepEqual(
      f.store.one(
        'SELECT * FROM research_draft_materials WHERE draft_id=? AND version=?',
        d.id,
        d.version,
      ),
      material,
    );
    assert.ok(f.service.draftMaterialIssues(f.service.draftRows()[0]).length);
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.gateway.historyQueries.length, 0);
    assert.equal(f.service.deliveryAuthority().enabled, false);
  });
