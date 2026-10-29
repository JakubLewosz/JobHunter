import test from 'node:test';
import assert from 'node:assert/strict';
import { qualityCases } from './fixtures/message-quality.js';
import { trustedStyleExamples } from '../apps/server/src/research/message-style-examples.js';
import { targetedRevisionPrompt } from '../apps/server/src/research/message-quality.js';
import {
  messagePrompt,
  semanticReviewPrompt,
  checkMessageRules,
} from '../apps/server/src/research/message-policy.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';

test('native generation, exact review and single correction receive the full style references without promoting their data', () => {
  const data = structuredClone(qualityCases[0]),
    before = structuredClone(data);
  const payload = {
    subject: 'Współpraca programistyczna',
    body: 'Dzień dobry, szukam płatnej, regularnej współpracy w pełni zdalnie około 20 godzin tygodniowo. Jestem uczniem technikum. Czy rozważają Państwo taką współpracę?',
    factIds: ['education', 'availability'],
    evidenceIds: ['activity'],
    claims: [
      {
        text: 'Jestem uczniem technikum.',
        kind: 'CANDIDATE',
        factIds: ['education'],
        evidenceIds: [],
      },
    ],
    warnings: [],
  };
  const prompts = [
    messagePrompt(data),
    semanticReviewPrompt({ ...data, draft: payload }),
    targetedRevisionPrompt({
      ...data,
      draft: payload,
      quality: {
        verdict: 'REVISE',
        defects: [
          { code: 'LANGUAGE', fragment: payload.body, reason: 'Fikcyjna kontrola zakresu.' },
        ],
      },
    }),
  ];
  for (const prompt of prompts) {
    assert.ok(prompt.includes(trustedStyleExamples));
    const packet = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
    assert.deepEqual(packet.profile.facts, data.profile.facts);
    assert.deepEqual(packet.evidence, data.evidence);
    assert.ok(!JSON.stringify(packet).includes('Jan Przykład'));
    assert.ok(!JSON.stringify(packet).includes('przykladowy-kandydat'));
  }
  assert.deepEqual(data, before);
  assert.throws(
    () =>
      ResearchJobHunter.prototype.checkDraft.call(
        {} as any,
        { ...payload, body: payload.body + ' https://github.com/przykladowy-kandydat' } as any,
        'fictional-company',
        { ...data.profile, availabilityMode: 'APPROX', hoursMin: null, hoursMax: null } as any,
        data.evidence,
        data.analysis,
      ),
    { code: 'UNAPPROVED_LINK' },
  );
  assert.throws(
    () =>
      ResearchJobHunter.prototype.checkDraft.call(
        {} as any,
        { ...payload, factIds: ['style-example-identity'] } as any,
        'fictional-company',
        { ...data.profile, availabilityMode: 'APPROX', hoursMin: null, hoursMax: null } as any,
        data.evidence,
        data.analysis,
      ),
    { code: 'INVALID_REFERENCE' },
  );
});

test('a necessary demo qualification is not a keyword defect; unsupported student still fails', () => {
  const c = qualityCases[0];
  const body = 'To projekt demonstracyjny, nie system obsługujący rzeczywistych klientów.';
  assert.ok(
    !checkMessageRules(
      { subject: 'Współpraca', body, claims: [], factIds: [] },
      c.profile,
      c.analysis,
    ).some((x) => x.startsWith('META')),
  );
  assert.throws(
    () =>
      checkMessageRules(
        { subject: 'Współpraca', body: 'Jestem studentem uczelni.', claims: [], factIds: [] },
        c.profile,
        c.analysis,
      ),
    { code: 'UNSUPPORTED_EDUCATION' },
  );
});
