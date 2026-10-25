import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import { qualityCases } from './fixtures/message-quality.js';
import { projectSelection } from '../apps/server/src/research/drafting.js';
import { autoErrorDecision } from '../apps/server/src/auto-policy.js';
import { DomainError, hash } from '../apps/server/src/util.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { assertTargetedRevision } from '../apps/server/src/research/message-quality.js';

const defect = {
  code: 'LANGUAGE',
  fragment: 'To konkretny punkt wspólny.',
  reason: 'Mechaniczny komentarz zastępuje powód kontaktu.',
};
const pass = { verdict: 'PASS', defects: [] };
const revise = { verdict: 'REVISE', defects: [defect] };

for (const [index, c] of qualityCases.entries())
  test(`editorial matrix ${c.id}/${c.analysis.type}: ${index % 4 === 0 ? 'good preserved' : index % 4 === 1 ? 'one correction' : 'held'}`, async (t) => {
    const f = await setup(t, true, false, false, true);
    let reviews = 0,
      revisions = 0;
    const read = f.reader.read.bind(f.reader);
    const activity = c.evidence[0].fragment + ' Tworzymy aplikacje webowe.';
    f.reader.read = async (url, signal) => {
      const source = await read(url, signal);
      source.text +=
        '\n' +
        activity +
        '\nAktualna oferta: Programista integracji.\nPrzyjmujemy otwarte zgłoszenia.\nRekrutacja: biuro@fixture.example.test.\nTa oferta wymaga pracy stacjonarnej.';
      source.fragment = source.text;
      source.content_hash = hash(source.text);
      return source;
    };
    const run = f.runner.run.bind(f.runner);
    f.runner.run = async (prompt, schema, options) => {
      const r = await run(prompt, schema, options);
      if (prompt.includes('Wydobądź firmę')) {
        const v = r.value as any;
        const sid = v.companyProof.sourceId;
        const proof = (quote: string) => ({
          sourceId: sid,
          quote,
          explanation: 'Literal fictional fixture.',
        });
        v.type = c.analysis.type;
        v.title = v.type === 'ACTIVE' ? 'Programista integracji' : null;
        v.titleProof =
          v.type === 'ACTIVE'
            ? proof('Aktualna oferta: Programista integracji.')
            : { sourceId: null, quote: null, explanation: 'No vacancy.' };
        v.typeProof = proof(
          v.type === 'ACTIVE'
            ? 'Aktualna oferta: Programista integracji.'
            : v.type === 'OPEN'
              ? 'Przyjmujemy otwarte zgłoszenia.'
              : activity,
        );
        v.inquiryBasis = proof(activity);
        v.companyActivities = [proof(activity)];
        v.requirements = [];
        for (const [key, cond] of Object.entries(c.analysis.conditions))
          v.conditions[key] = {
            ...cond,
            sourceId: cond.value === 'unknown' ? null : sid,
            quote: cond.value === 'unknown' ? null : cond.quote,
          };
        if (v.type !== 'PROSPECT') {
          v.contact.kind = 'RECRUITMENT';
          v.contact.proof = proof('Rekrutacja: biuro@fixture.example.test.');
        }
      }
      if (prompt.includes('Przygotuj indywidualny polski szkic')) {
        const v = r.value as any;
        const old = v.claims.find((claim: any) => claim.kind === 'COMPANY').text;
        v.body = v.body.replace(old, activity);
        v.claims.find((claim: any) => claim.kind === 'COMPANY').text = activity;
        v.subject =
          c.analysis.type === 'ACTIVE' ? 'Programista integracji' : 'Zapytanie o współpracę';
        if (index % 4 !== 0) {
          v.body = v.body.replace(activity, activity + ' To konkretny punkt wspólny.');
          v.claims.find((claim: any) => claim.kind === 'COMPANY').text +=
            ' To konkretny punkt wspólny.';
        }
      }
      if (prompt.startsWith('Wykonaj JEDNĄ celowaną korektę')) {
        revisions++;
        const { draft } = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
        if (index % 4 === 1) {
          draft.body = draft.body.replace(' To konkretny punkt wspólny.', '');
          draft.claims = draft.claims.map((claim: any) => ({
            ...claim,
            text: claim.text.replace(' To konkretny punkt wspólny.', ''),
          }));
        } else draft.body += '\nTo bezpośredni punkt odniesienia.';
        r.value = schema.parse(draft);
      }
      if (prompt.includes('Sprawdź KAŻDE')) {
        reviews++;
        (r.value as any).quality =
          index % 4 === 0 || (index % 4 === 1 && reviews > 1) ? pass : revise;
      }
      return r;
    };
    await f.service.startAuto(); // Fictional provider and temporary DEVELOPMENT data only.
    await f.service.tick();
    f.service.control('stop');
    const d = f.service.draftRows()[0];
    assert.ok(d);
    const good = index % 4 < 2;
    assert.equal(f.service.draftMaterialIssues(d).length, good ? 0 : 1);
    if (!good) assert.deepEqual(f.service.draftMaterialIssues(d), ['EDITORIAL_QUALITY_REQUIRED']);
    assert.equal(revisions, index % 4 === 0 ? 0 : 1);
    assert.equal(reviews, index % 4 === 0 ? 1 : 2);
    assert.equal(d.version, index % 4 === 0 ? 1 : 2);
    assert.equal(f.store.one('SELECT count(*) n FROM draft_versions')!.n, d.version);
    const material = f.store.one(
      'SELECT * FROM research_draft_materials WHERE draft_id=? AND version=?',
      d.id,
      d.version,
    )!;
    assert.deepEqual(JSON.parse(material.payload_json).claims, JSON.parse(d.claims));
    if (index % 4 === 1) {
      const initial = f.store.one(
        'SELECT payload_json FROM research_draft_materials WHERE draft_id=? AND version=1',
        d.id,
      )!;
      assert.notDeepEqual(JSON.parse(initial.payload_json).claims, JSON.parse(d.claims));
      assert.ok(JSON.parse(d.claims).every((claim: any) => !claim.text.includes(defect.fragment)));
    }
    assert.equal(JSON.parse(material.review_result).quality.verdict, good ? 'PASS' : 'REVISE');
    if (!good) {
      const before = revisions;
      await f.service.retryDraftReview(d.id, d.version);
      assert.equal(revisions, before, 'retry cannot renew the correction budget');
      assert.equal(f.service.draftRows()[0].version, d.version);
      assert.equal(
        f.store.one("SELECT count(*) n FROM suppressions WHERE reason LIKE '%EDITORIAL%'")!.n,
        0,
      );
    }
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.gateway.historyQueries.length, 0);
    assert.equal(f.service.deliveryAuthority().enabled, false);
    assert.equal(f.store.one('SELECT count(*) n FROM outbox')!.n, 0);
  });

test('factual rejection does not launch editorial repair or bypass AUTO safety', async (t) => {
  const f = await setup(t, true, false, false, true);
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    const r = await run(prompt, schema, options);
    if (prompt.includes('Sprawdź KAŻDE'))
      Object.assign(r.value as object, {
        supported: false,
        issues: ['Unsupported claim'],
        quality: revise,
      });
    return r;
  };
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  assert.equal(d.version, 1);
  assert.equal(JSON.parse(d.semantic_review).supported, false);
  assert.equal(f.runner.prompts.filter((p) => p.startsWith('Wykonaj JEDNĄ')).length, 0);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(autoErrorDecision('EDITORIAL_QUALITY_REQUIRED'), 'draft');
});

test('CodeFabric is not selected merely because a team uses AI/Codex', () => {
  const c = qualityCases[4];
  assert.ok(
    !projectSelection(c.profile.facts, c.analysis, c.evidence).selected.some(
      (p) => p.fact.key === 'codefabric',
    ),
  );
  const task = qualityCases[3];
  assert.equal(
    projectSelection(task.profile.facts, task.analysis, task.evidence).selected[0].fact.key,
    'codefabric',
  );
});

test('targeted repair preserves unaffected paragraphs and rejects invented defect anchors', () => {
  const original = {
    subject: 'Cooperation',
    body: 'Good purpose.\n\nTo konkretny punkt wspólny.\n\nGood signature.',
  };
  assert.doesNotThrow(() =>
    assertTargetedRevision(
      original,
      { ...original, body: original.body.replace(defect.fragment, 'Concrete reason.') },
      revise,
    ),
  );
  assert.throws(
    () =>
      assertTargetedRevision(
        original,
        { ...original, body: original.body.replace('Good purpose.', 'Needless rewrite.') },
        revise,
      ),
    { code: 'EDITORIAL_SCOPE_CHANGED' },
  );
  assert.throws(
    () =>
      assertTargetedRevision(original, original, { defects: [{ fragment: 'Not in this text.' }] }),
    { code: 'EDITORIAL_FRAGMENT_INVALID' },
  );
});

test('failed correction spends its budget across a new research instance; no Start or Gmail', async (t) => {
  const f = await setup(t, true, false, false, true);
  const run = f.runner.run.bind(f.runner);
  let corrections = 0;
  f.runner.run = async (prompt, schema, options) => {
    if (prompt.startsWith('Wykonaj JEDNĄ')) {
      corrections++;
      throw new DomainError('MODEL_FAILED', 'Fictional failure');
    }
    const r = await run(prompt, schema, options);
    if (prompt.includes('Sprawdź KAŻDE')) (r.value as any).quality = revise;
    return r;
  };
  await f.service.startAuto();
  await f.service.tick();
  f.service.control('stop');
  const d = f.service.draftRows()[0];
  const restarted = new ResearchJobHunter(f.store, { runner: f.runner, reader: f.reader });
  await restarted.retryDraftReview(d.id, d.version);
  assert.equal(corrections, 1);
  assert.equal(restarted.draftRows()[0].body, d.body);
  assert.equal(restarted.draftRows()[0].version, d.version);
  assert.deepEqual(restarted.draftMaterialIssues(restarted.draftRows()[0]), [
    'EDITORIAL_QUALITY_REQUIRED',
  ]);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.gateway.historyQueries.length, 0);
  assert.equal(f.service.deliveryAuthority().enabled, false);
});

for (const outcome of ['missing', 'hold', 'unsupported-correction'] as const)
  test(`quality ${outcome} remains unready`, async (t) => {
    const f = await setup(t, true, false, false, true);
    const run = f.runner.run.bind(f.runner);
    let revisions = 0;
    f.runner.run = async (prompt, schema, options) => {
      const r = await run(prompt, schema, options);
      if (prompt.includes('Sprawdź KAŻDE')) {
        if (outcome === 'missing') delete (r.value as any).quality;
        else
          (r.value as any).quality =
            outcome === 'hold' ? { verdict: 'HOLD', defects: [defect] } : revise;
      }
      if (prompt.startsWith('Wykonaj JEDNĄ')) {
        revisions++;
        (r.value as any).body += ' Mam doświadczenie komercyjne.';
      }
      return r;
    };
    await f.service.startAuto();
    await f.service.tick();
    f.service.control('stop');
    const d = f.service.draftRows()[0];
    assert.equal(d.version, 1);
    assert.deepEqual(f.service.draftMaterialIssues(d), ['EDITORIAL_QUALITY_REQUIRED']);
    assert.equal(revisions, outcome === 'unsupported-correction' ? 1 : 0);
    assert.equal(f.gateway.posts.length, 0);
  });

for (const stage of ['review', 'revision'] as const)
  for (const fault of [
    'stop',
    'version',
    'profile',
    'source',
    'contact',
    'owner',
    'deadline',
  ] as const)
    test(`editorial ${stage} fences late ${fault} without final material writes`, async (t) => {
      const f = await setup(t, true, false, false, true);
      await f.service.startAuto();
      await f.service.tick();
      f.service.control('stop');
      const d = f.service.draftRows()[0];
      const run = f.runner.run.bind(f.runner);
      f.runner.run = async (prompt, schema, options) => {
        const r = await run(prompt, schema, options);
        if (prompt.includes('Sprawdź KAŻDE')) (r.value as any).quality = revise;
        return r;
      };
      let release!: () => void, entered!: () => void;
      const held = new Promise<void>((r) => (release = r)),
        ready = new Promise<void>((r) => (entered = r));
      f.runner.beforeCall = async (prompt) => {
        if (
          stage === 'review' ? prompt.includes('Sprawdź KAŻDE') : prompt.startsWith('Wykonaj JEDNĄ')
        ) {
          entered();
          await held;
        }
      };
      const controller = new AbortController();
      const work = f.service.retryDraftReview(d.id, d.version, controller.signal);
      await Promise.race([
        ready,
        work.then(() => {
          throw Error('NO_TARGET_STAGE');
        }),
      ]);
      const owner = f.store.assertExclusive;
      if (fault === 'stop') f.service.control('stop');
      if (fault === 'version')
        f.service.editDraft(d.id, {
          version: d.version,
          subject: d.subject,
          body: d.body + '\nNowa wersja.',
        });
      if (fault === 'profile')
        f.store.exec(
          "UPDATE candidate_facts SET content=content||' changed' WHERE fact_key='education'",
        );
      if (fault === 'source') f.store.exec("UPDATE research_sources SET text=text||' changed'");
      if (fault === 'contact')
        f.store.exec(
          "UPDATE contacts SET email='changed@fictional.example.test' WHERE id=?",
          d.contact_id,
        );
      if (fault === 'owner')
        f.store.assertExclusive = () => {
          throw new DomainError('PROFILE_LOCK_LOST', 'Fictional owner loss');
        };
      if (fault === 'deadline') controller.abort(new DomainError('DEADLINE', 'Fictional deadline'));
      const before = f.store.all('SELECT * FROM research_draft_materials');
      if (stage === 'review')
        assert.equal(
          before.find((m) => m.draft_id === d.id && m.version === d.version)!.code_status,
          'PENDING',
        );
      release();
      try {
        await assert.rejects(work);
      } finally {
        f.store.assertExclusive = owner;
      }
      assert.deepEqual(f.store.all('SELECT * FROM research_draft_materials'), before);
      assert.equal(f.store.one('SELECT count(*) n FROM outbox')!.n, 0);
      assert.equal(f.gateway.posts.length, 0);
      assert.equal(f.service.deliveryAuthority().enabled, false);
    });

for (const fault of [
  'stop',
  'version',
  'profile',
  'source',
  'contact',
  'owner',
  'deadline',
] as const)
  test(`generation cannot persist a late result after ${fault}`, async (t) => {
    const f = await setup(t, true, false, false, true);
    await f.service.startAuto();
    await f.service.tick();
    f.service.control('stop');
    const d = f.service.draftRows()[0];
    const research = new ResearchJobHunter(f.store, { runner: f.runner, reader: f.reader });
    research.regenerateDraft(d.id, d.version);
    let entered!: () => void, release!: () => void;
    const ready = new Promise<void>((r) => (entered = r)),
      held = new Promise<void>((r) => (release = r));
    f.runner.beforeCall = async (prompt) => {
      if (prompt.includes('Przygotuj indywidualny polski szkic')) {
        entered();
        await held;
      }
    };
    const work = research.tick();
    await Promise.race([
      ready,
      work.then(() => {
        throw Error('NO_DRAFT_STAGE');
      }),
    ]);
    const owner = f.store.assertExclusive;
    if (fault === 'stop') research.control('stop');
    if (fault === 'version')
      research.editDraft(d.id, {
        version: d.version,
        subject: d.subject,
        body: d.body + '\nCurrent edit.',
      });
    if (fault === 'profile')
      f.store.exec(
        "UPDATE candidate_facts SET content=content||' changed' WHERE fact_key='education'",
      );
    if (fault === 'source') f.store.exec("UPDATE research_sources SET text=text||' changed'");
    if (fault === 'contact')
      f.store.exec(
        "UPDATE contacts SET email='changed@fictional.example.test' WHERE id=?",
        d.contact_id,
      );
    if (fault === 'owner')
      f.store.assertExclusive = () => {
        throw new DomainError('PROFILE_LOCK_LOST', 'Fictional owner loss');
      };
    if (fault === 'deadline')
      (research as any).controller.abort(new DomainError('DEADLINE', 'Fictional deadline'));
    const before = f.store.all('SELECT * FROM research_draft_materials');
    const versions = f.store.all('SELECT * FROM draft_versions');
    release();
    try {
      await work.catch(() => {});
    } finally {
      f.store.assertExclusive = owner;
    }
    assert.deepEqual(f.store.all('SELECT * FROM research_draft_materials'), before);
    assert.deepEqual(f.store.all('SELECT * FROM draft_versions'), versions);
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.gateway.historyQueries.length, 0);
    assert.equal(f.service.deliveryAuthority().enabled, false);
  });
