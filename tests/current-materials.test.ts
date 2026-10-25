import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { projectSelection, projectMentions } from '../apps/server/src/research/drafting.js';
import { checkMessageRules, messagePrompt } from '../apps/server/src/research/message-policy.js';
import { setup } from './auto-fixture.js';

test('new staged facts remain DRAFT, preserve deferred project, profile versions and sender', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-new-materials-')),
    store = new Store(dir),
    service = new ResearchJobHunter(store);
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const initial = service.profile(),
    sender = service.campaign().sender_email;
  const input = {
    name: 'Alex Fixture',
    goal: 'Płatna regularna współpraca programistyczna zdalnie.',
    hours_approx: 20,
    version: initial.version,
    message_template: initial.message_template,
    facts: initial.facts
      .filter((f) => f.fact_key !== 'fixdesk')
      .map((f) => ({
        id: f.id,
        content:
          f.fact_key === 'availability' ? 'Praca zdalna około 20 godzin tygodniowo.' : f.content,
      })),
  };
  service.updateProfile(input);
  service.control('stop');
  const staged = service.stageProfileFact({
    key: 'sekiforma',
    content: 'Fixture furniture: fikcyjna strona demonstracyjna; formularz nie wysyła danych.',
    source: 'Synthetic current material; not approval',
  });
  assert.equal(staged.approval_status, 'DRAFT');
  assert.equal(service.profile().approved_at, null);
  assert.equal(
    service.profile().deferred_facts.find((f) => f.fact_key === 'fixdesk')?.approval_status,
    'DEFERRED',
  );
  assert.equal(service.campaign().sender_email, sender);
  assert.doesNotMatch(
    service.profile().facts.find((f) => f.fact_key === 'availability')!.content,
    /po lekcjach/,
  );
  assert.throws(() =>
    service.stageProfileFact({ key: 'sekiforma', content: 'Duplicate', source: 'Synthetic' }),
  );
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});

test('availability without timing never inherits after-school or all-day assertions; old draft bytes stay unchanged', () => {
  const profile: any = {
    availabilityMode: 'APPROX',
    hoursApprox: 20,
    facts: [
      {
        id: 'synthetic-availability',
        key: 'availability',
        content: 'Praca zdalna około 20 godzin tygodniowo.',
      },
    ],
  };
  const draft = (body: string) => ({ subject: 'Zapytanie', body, factIds: [], claims: [] });
  const old = draft('Około 20 godzin tygodniowo, głównie po lekcjach.');
  const bytes = JSON.stringify(old);
  for (const text of [
    old.body,
    'Jestem w pełni dyspozycyjny.',
    'Dostępny 8–16.',
    'Pełen etat.',
    'Dokładnie 20 godzin tygodniowo.',
  ])
    assert.throws(() => checkMessageRules(draft(text), profile), {
      code: 'UNSUPPORTED_AVAILABILITY',
    });
  assert.equal(JSON.stringify(old), bytes);
  assert.doesNotThrow(() =>
    checkMessageRules(draft('Około 20 godzin tygodniowo, zdalnie.'), profile),
  );
  const prompt = messagePrompt({
    profile,
    analysis: { type: 'PROSPECT', contact: { kind: 'GENERAL' }, conditions: {} } as any,
    qualification: 'Synthetic',
    evidence: [],
    history: '',
    template: '[Syntetyczne preferencje stylu.]',
    recent: [],
  });
  assert.doesNotMatch(prompt, /głównie po lekcjach/iu);
});

test('four projects require literal task evidence; unrelated/privacy words do not force a project', () => {
  const facts = ['sekiforma', 'autorelay', 'elektroscan', 'codefabric'].map((key) => ({
    key,
    id: 'synthetic-' + key,
    content: 'Synthetic fact',
  }));
  for (const [quote, key] of [
    ['Tworzymy responsywne strony internetowe z galeriami.', 'sekiforma'],
    ['Tworzymy integracje API i webhooki.', 'autorelay'],
    ['Analizujemy dokumenty PDF i obrazy.', 'elektroscan'],
    ['Tworzymy narzędzia z lokalnymi modelami językowymi LLM.', 'codefabric'],
  ])
    assert.equal(
      projectSelection(facts, { companyActivities: [{ sourceId: 'synthetic-read', quote }] })
        .selected[0]?.fact.key,
      key,
    );
  for (const quote of [
    'Nasza firma działa w Polsce.',
    'Polityka privacy: frontend development.',
    'frontend',
  ])
    assert.equal(
      projectSelection(facts, { companyActivities: [{ sourceId: 'synthetic-read', quote }] })
        .selected.length,
      0,
    );
  assert.deepEqual(projectMentions('Sęk i Forma'), ['sekiforma']);
});

test('project facts do not become real customers, solo authorship or an official institution product', () => {
  const p: any = {
    facts: [
      { id: 's', key: 'sekiforma', content: 'Fikcyjna marka; formularz nie wysyła danych.' },
      { id: 'e', key: 'elektroscan', content: 'Dwuosobowy zespół.' },
      { id: 'c', key: 'codefabric', content: 'Prototyp z praktyk, modele Ollamy.' },
    ],
  };
  for (const body of [
    'Sęk i Forma to rzeczywista pracownia.',
    'Sęk i Forma: formularz wysyła zgłoszenia.',
    'Samodzielnie stworzyłem ElektroScan.',
    'CodeFabric to oficjalny produkt UKNF.',
    'CodeFabric używa Codexa jako silnika modeli.',
  ])
    assert.throws(
      () => checkMessageRules({ body, subject: 'Synthetic', factIds: [], claims: [] }, p),
      { code: 'UNSUPPORTED_PROJECT_CLAIM' },
    );
  assert.doesNotThrow(() =>
    checkMessageRules(
      {
        body: 'Sęk i Forma to fikcyjna marka; formularz nie wysyła danych.',
        subject: 'Synthetic',
        factIds: [],
        claims: [],
      },
      p,
    ),
  );
});

test('new PDF has its own approval and contact material never switches configured sender or past bytes', async (t) => {
  const f = await setup(t, true, false, false, true);
  const old = f.service.profile(),
    first = f.store.one('SELECT * FROM cv_assets')!,
    bytes = f.service.cvBytes(first.id).bytes;
  const sender = f.service.policyConfig()!.senderEmail;
  const next = f.service.uploadCV(
    'Synthetic-new.pdf',
    Buffer.from('%PDF-1.4\nnew synthetic version\n%%EOF').toString('base64'),
  );
  assert.notEqual(next.id, first.id);
  assert.equal(next.approved_at, null);
  assert.deepEqual(f.service.cvBytes(first.id).bytes, bytes);
  assert.ok(f.store.one('SELECT approved_at FROM cv_assets WHERE id=?', first.id)!.approved_at);
  f.service.control('stop');
  f.service.stageProfileFact({
    key: 'contact',
    content: 'contact-new@example.test',
    source: 'Synthetic current CV',
  });
  assert.equal(f.service.policyConfig()!.senderEmail, sender);
  assert.equal(f.gateway.info.email, sender);
  assert.ok(f.service.profile().version > old.version);
  assert.equal(f.gateway.posts.length, 0);
});

test('exact material links reject lookalike hosts, paths, redirects and queries in body and subject', async (t) => {
  const f = await setup(t, true, false, false, true);
  const profile = f.service.minimalProfile();
  profile.facts = [
    { id: 'synthetic-link', key: 'portfolio', content: 'https://fixture-demo.example.test/' },
  ];
  const draft: any = {
    subject: 'Zapytanie',
    body: 'Dzień dobry. Szukam płatnej, regularnej współpracy programistycznej. Praca zdalna około 20 godzin tygodniowo. https://fixture-demo.example.test/',
    factIds: ['synthetic-link'],
    evidenceIds: ['synthetic-evidence'],
    claims: [
      {
        kind: 'CANDIDATE',
        text: 'Praca zdalna około 20 godzin tygodniowo.',
        factIds: ['synthetic-link'],
        evidenceIds: [],
      },
    ],
    warnings: [],
  };
  const evidence = [{ id: 'synthetic-evidence' }];
  assert.doesNotThrow(() => f.service.checkDraft(draft, 'synthetic-company', profile, evidence));
  for (const link of [
    'https://fixture-demo.example.test.evil.test/',
    'https://fixture-demo.example.test/other',
    'https://redirect.example.test/?to=https://fixture-demo.example.test/',
    'https://fixture-demo.example.test/?x=1',
    'https://foreign.chatgpt.site/',
    'https://github.com/foreign/repo',
  ]) {
    assert.throws(
      () =>
        f.service.checkDraft(
          { ...draft, body: draft.body.replace('https://fixture-demo.example.test/', link) },
          'synthetic-company',
          profile,
          evidence,
        ),
      { code: 'UNAPPROVED_LINK' },
    );
    assert.throws(
      () =>
        f.service.checkDraft(
          { ...draft, subject: 'Zapytanie ' + link },
          'synthetic-company',
          profile,
          evidence,
        ),
      { code: 'UNAPPROVED_LINK' },
    );
  }
});
