import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conditionKeys,
  contactEligibility,
  qualifyReal,
  validateAnalysis,
  type Analysis,
} from '../apps/server/src/research/contracts.js';
import {
  messageContactType,
  checkMessageRules,
} from '../apps/server/src/research/message-policy.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { analysisSchema } from '../apps/server/src/research/contracts.js';
import { DomainError } from '../apps/server/src/util.js';

async function fixture() {
  const reader = new FixtureReader(),
    runner = new FixtureRunner();
  reader.prospect = runner.prospect = true;
  const source = await reader.read('https://fixture.example.test');
  const a = (
    await runner.run(
      'Wydobądź firmę Dane: ' + JSON.stringify([{ id: source.id, url: source.final_url }]),
      analysisSchema,
    )
  ).value;
  source.text +=
    '\nBrak aktywnego wakatu. Senior tylko pełny etat. Nie przyjmujemy kandydatur. Wyłącznie przez formularz. Cała firma bez pracy zdalnej.';
  const proof = (quote: string) => ({
    sourceId: source.id,
    quote,
    explanation: 'Literalny dowód testowy.',
  });
  return { source, a, proof };
}
const matrix = [
  [
    'A: brak wakatu, GENERAL, działalność',
    'PROSPECT',
    'active',
    'no',
    'COMPANY',
    true,
    'COMPANY_INQUIRY',
  ],
  [
    'C: junior, nieznane godziny',
    'ACTIVE',
    'hours',
    'unknown',
    'OFFER',
    true,
    'CONDITIONS_INQUIRY',
  ],
  [
    'D: senior/full-time, osobna podstawa',
    'ACTIVE',
    'junior',
    'no',
    'OFFER',
    true,
    'COMPANY_INQUIRY',
  ],
  ['E: odmowa zdalności firmy', 'PROSPECT', 'remote', 'no', 'COMPANY', false, 'COMPANY_INQUIRY'],
  [
    'E: odmowa początkujących działu',
    'ACTIVE',
    'junior',
    'no',
    'DEPARTMENT',
    false,
    'COMPANY_INQUIRY',
  ],
  ['F: sprzeczność', 'PROSPECT', 'active', 'conflicting', 'UNKNOWN', false, 'COMPANY_INQUIRY'],
] as const;
for (const [name, type, key, value, scope, allowed, intent] of matrix)
  test('contact intent matrix ' + name, async () => {
    const { a, source, proof } = await fixture();
    source.text = source.text.split('\n')[0] + '\nSenior tylko pełny etat.';
    a.type = type;
    a.conditions[key] = {
      ...proof(value === 'no' ? 'Senior tylko pełny etat' : 'Fixture Company'),
      value,
      scope,
    };
    a.inquiryBasis = a.typeProof;
    if (type === 'ACTIVE') {
      source.text +=
        '\nRekrutacja: hr@fixture.example.test. Junior PHP Laravel. Rekrutacja otwarta.';
      a.contact = {
        email: 'hr@fixture.example.test',
        kind: 'RECRUITMENT',
        proof: proof('Rekrutacja: hr@fixture.example.test.'),
      };
      a.conditions.active = { ...proof('Rekrutacja otwarta'), value: 'yes', scope: 'OFFER' };
    }
    const result = contactEligibility(a, [source]);
    assert.equal(result.allowed, allowed);
    assert.equal(result.intent, intent);
    assert.equal(a.type, type, 'intencja nie nadpisuje źródła');
    if (key === 'junior' && scope === 'OFFER') assert.equal(qualifyReal(a).decision, 'REJECTED');
    if (allowed && intent === 'COMPANY_INQUIRY')
      assert.equal(messageContactType(a), 'GENERAL_RECRUITMENT_CONTACT');
  });
for (const restriction of [
  'Nie przyjmujemy kandydatur.',
  'Nie rozpatrujemy spontanicznych kandydatur.',
  'We do not accept unsolicited applications.',
  'Wyłącznie przez formularz.',
  'Cała firma bez pracy zdalnej.',
])
  test('contact intent B/E: ' + restriction, async () => {
    const { a, source } = await fixture();
    source.text = source.text.split('\n')[0] + '\n' + restriction;
    assert.equal(contactEligibility(a, [source]).allowed, false);
  });
test('contact intent D: missing independent activity proof blocks inquiry for mismatched offer', async () => {
  const { a, source, proof } = await fixture();
  source.text = source.text.split('\n')[0];
  a.type = 'ACTIVE';
  a.conditions.junior = { ...proof('Senior tylko pełny etat'), value: 'no', scope: 'OFFER' };
  a.inquiryBasis = null;
  assert.equal(contactEligibility(a, [source]).allowed, false);
});
test('purpose checks the concrete mailbox, ignoring an unrelated sales footer', async () => {
  const { a, source, proof } = await fixture();
  source.text = source.text.split('\n')[0] + '\nSprzedaż: sales@fixture.example.test.';
  a.contact.proof = proof(source.text);
  assert.equal(contactEligibility(a, [source]).allowed, true);
  source.text = source.text.replace('Kontakt: biuro', 'Sprzedaż: biuro');
  assert.equal(contactEligibility(a, [source]).allowed, false);
});
test('inquiry content asks unknown hours and rejects unsupported vacancy or matching schedule', async () => {
  const { a } = await fixture();
  a.conditions.active.value = 'no';
  const profile = {
    facts: [
      {
        id: 'availability',
        key: 'availability',
        content: 'Płatna zdalna współpraca około 20 godzin po lekcjach.',
      },
    ],
  };
  const draft = {
    subject: 'Zapytanie o współpracę',
    body: 'Jestem dostępny około 20 godzin po lekcjach. Czy taki wymiar i godziny pracy są dla Państwa odpowiednie?',
    factIds: ['availability'],
    claims: [],
  };
  assert.doesNotThrow(() => checkMessageRules(draft, profile, a));
  for (const body of ['Znalazłem Państwa ofertę.', 'Państwa godziny pasują do mojej dostępności.'])
    assert.throws(
      () => checkMessageRules({ ...draft, body }, profile, a),
      (e: any) => ['UNSUPPORTED_VACANCY', 'UNSUPPORTED_CONDITIONS'].includes(e.code),
    );
});
for (const ban of [
  'W całej firmie nie zatrudniamy juniorów.',
  'W naszej firmie nie oferujemy pracy zdalnej.',
])
  test('company refusal overrides a model incorrectly assigning OFFER scope: ' + ban, async () => {
    const { a, source, proof } = await fixture();
    source.text = source.text.split('\n')[0] + '\n' + ban;
    a.conditions.junior = { ...proof(ban), value: 'no', scope: 'OFFER' };
    a.inquiryBasis = a.typeProof;
    assert.equal(contactEligibility(a, [source]).allowed, false);
  });
