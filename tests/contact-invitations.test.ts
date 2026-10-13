import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePublicHTML } from '../apps/server/src/research/html.js';
import {
  conditionKeys,
  validateAnalysis,
  contactUsage,
  contactEligibility,
  qualifyReal,
} from '../apps/server/src/research/contracts.js';
import { hash, iso } from '../apps/server/src/util.js';

// Reconstruction of published excerpts, not the historical HTML or a live site.
function invitation(quote: string) {
  const html = `<main><h1>Fixture Company</h1><section><p>Tworzymy aplikacje i integracje API.</p></section><section><p>${quote}</p></section><section><h2>Sprzedaż</h2><p>sales@fixture.example.test</p></section></main>`;
  const parsed = parsePublicHTML(html);
  const source = {
    id: 'fixture-source',
    original_url: 'https://fixture.example.test/career',
    final_url: 'https://fixture.example.test/career',
    title: 'Fixture Company',
    fetched_at: iso(),
    method: 'TEST_FIXTURE_RECONSTRUCTED',
    status: 'READ',
    http_status: 200,
    error: null,
    text: parsed.text,
    fragment: parsed.text,
    content_hash: hash(parsed.text),
    parser_version: parsed.parserVersion,
    address_contexts: JSON.stringify(parsed.contexts),
  };
  const proof = (q: string) => ({
    sourceId: source.id,
    quote: q,
    explanation: 'Reconstructed fixture.',
  });
  const analysis = {
    company: 'Fixture Company',
    companyURL: source.final_url,
    companyProof: proof('Fixture Company'),
    title: null,
    titleProof: proof(quote),
    type: 'OPEN',
    typeProof: proof(quote),
    inquiryBasis: proof('Tworzymy aplikacje i integracje API.'),
    companyActivities: [proof('Tworzymy aplikacje i integracje API.')],
    conditions: Object.fromEntries(
      conditionKeys.map((k) => [
        k,
        { ...proof(quote), scope: 'COMPANY', value: k === 'openInquiry' ? 'yes' : 'unknown' },
      ]),
    ),
    requirements: [],
    contact: { email: 'hello@fixture.example.test', kind: 'RECRUITMENT', proof: proof(quote) },
    warnings: [],
  };
  return { source, analysis };
}
test('join-us invitation is recruitment independent of mailbox prefix and unrelated sales section', () => {
  for (const quote of [
    'Nie znalazłeś oferty dla siebie, jednak chcesz do nas dołączyć? Napisz do nas na hello@fixture.example.test',
    'Chcesz dołączyć do naszego zespołu? Napisz na hello@fixture.example.test',
    'Want to join our team? Write to hello@fixture.example.test',
    'Nie znalazłeś oferty dla siebie? Zostaw nam swoje CV na hello@fixture.example.test',
  ]) {
    const { source, analysis } = invitation(quote);
    assert.ok(
      JSON.parse(source.address_contexts).some(
        (c: any) => c.email === analysis.contact.email && !c.text.includes('sales@'),
      ),
    );
    const v = validateAnalysis(analysis, [source]);
    assert.equal(v.contact.kind, 'RECRUITMENT', quote);
    assert.equal(contactEligibility(v, [source]).allowed, true, quote);
  }
});
test('recruitment question and mailbox prefix alone do not authorize CV', () => {
  const question = invitation(
    'Chcesz dołączyć do naszego zespołu? Masz pytania? Napisz na hello@fixture.example.test',
  );
  const v = validateAnalysis(question.analysis, [question.source]);
  assert.equal(v.contact.kind, 'RECRUITMENT');
  assert.equal(contactUsage(v, [question.source]), 'QUESTIONS_ONLY');
  assert.equal(contactEligibility(v, [question.source]).allowed, false);
  const bare = invitation('Napisz na hello@fixture.example.test');
  assert.equal(validateAnalysis(bare.analysis, [bare.source]).contact.kind, 'UNKNOWN');
});
test('future open candidature is not an expired vacancy, while actual closure still rejects', () => {
  const { source, analysis } = invitation(
    'Wyślij CV na hello@fixture.example.test, skontaktujemy się, gdy pojawi się pasująca rola.',
  );
  analysis.conditions.active = {
    value: 'no',
    scope: 'OFFER',
    sourceId: source.id,
    quote: 'skontaktujemy się, gdy pojawi się pasująca rola.',
    explanation: 'No current vacancy; invitation remains open.',
  };
  const v = validateAnalysis(analysis, [source]);
  assert.notEqual(qualifyReal(v).decision, 'REJECTED');
  assert.equal(contactEligibility(v, [source]).allowed, true);
  v.type = 'ARCHIVED';
  v.inquiryBasis = null;
  assert.equal(qualifyReal(v).decision, 'REJECTED');
  source.text += '\nNie przyjmujemy spontanicznych kandydatur.';
  assert.equal(contactEligibility(v, [source]).allowed, false);
});
