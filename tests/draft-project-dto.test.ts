import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generationPrompt,
  targetedRevisionPrompt,
} from '../apps/server/src/research/message-quality.js';
import { semanticReviewPrompt } from '../apps/server/src/research/message-policy.js';
import { projectSelection, projectKeys } from '../apps/server/src/research/drafting.js';
import { qualityCases } from './fixtures/message-quality.js';

const dto = (prompt: string) => JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
for (const [index, key] of [
  [0, 'autorelay'],
  [2, 'sekiforma'],
  [3, 'codefabric'],
  [5, null],
] as const)
  test(`DRAFT keeps canonical complete approved facts and only selected identity: ${key ?? 'no project'}`, () => {
    const c = structuredClone(qualityCases[index]);
    if (key === null)
      c.analysis.titleProof = {
        sourceId: null,
        quote: null,
        explanation: 'No verified title in this fictional context.',
      };
    const selection = projectSelection(c.profile.facts, c.analysis, c.evidence);
    assert.equal(selection.selected[0]?.fact.key ?? null, key);
    const data = {
      ...c,
      profile: {
        ...c.profile,
        projectSelection: selection,
        facts: c.profile.facts.filter(
          (f) =>
            !projectKeys.includes(f.key as any) ||
            selection.selected.some((p) => p.fact.id === f.id),
        ),
      },
    };
    const original = structuredClone(data);
    const generated = dto(
      generationPrompt(data, 'GENERAL_RECRUITMENT_CONTACT', 'COOPERATION_POSSIBILITY'),
    );
    const expected = structuredClone(data.profile);
    expected.projectSelection.selected = expected.projectSelection.selected.map((entry) => ({
      ...entry,
      fact: { id: entry.fact.id, key: entry.fact.key } as any,
    }));
    assert.deepEqual(generated.profile, expected);
    for (const selected of selection.selected) {
      assert.equal(
        generated.profile.facts.find((f: any) => f.id === selected.fact.id).content,
        selected.fact.content,
      );
      assert.deepEqual(
        generated.profile.projectSelection.selected.find((p: any) => p.fact.id === selected.fact.id)
          .proofs,
        selected.proofs,
      );
      assert.equal(
        JSON.stringify(generated).split(JSON.stringify(selected.fact.content)).length - 1,
        1,
      );
    }
    assert.deepEqual(data, original);
    assert.deepEqual(generated.analysis, data.analysis);
    assert.deepEqual(generated.evidence, data.evidence);
    for (const prompt of [semanticReviewPrompt(data), targetedRevisionPrompt(data)])
      assert.deepEqual(dto(prompt).profile, data.profile);
    assert.doesNotMatch(
      JSON.stringify(generated),
      /foreign-project|UnapprovedRustTechnology|invented quote/,
    );
  });

test('DRAFT presentation preserves two independent project choices, scores, IDs and literal proof maps', () => {
  const c = structuredClone(qualityCases[0]);
  c.analysis.inquiryBasis!.quote = 'Tworzymy automatyzacje oraz integracje API.';
  c.evidence.push({
    id: 'automation-proof',
    sourceId: 'source',
    fragment: c.analysis.inquiryBasis!.quote,
  });
  c.analysis.companyActivities!.push({
    sourceId: 'other-source',
    quote: 'Tworzymy responsywne interfejsy i formularze.',
    explanation: 'Fictional other task.',
  });
  c.evidence.push({
    id: 'other-evidence',
    sourceId: 'other-source',
    fragment: 'Tworzymy responsywne interfejsy i formularze.',
  });
  const selection = projectSelection(c.profile.facts, c.analysis, c.evidence);
  assert.equal(selection.selected.length, 2);
  const profile = { ...c.profile, projectSelection: selection };
  const original = structuredClone(profile);
  const result = dto(
    generationPrompt({ ...c, profile }, 'GENERAL_RECRUITMENT_CONTACT', 'COOPERATION_POSSIBILITY'),
  );
  assert.ok(
    result.profile.projectSelection.selected.every(
      (p: any) => Object.keys(p.fact).join(',') === 'id,key',
    ),
  );
  assert.deepEqual(
    result.profile.projectSelection.selected.map((p: any) => ({
      ...p,
      fact: original.projectSelection.selected.find((s) => s.fact.id === p.fact.id)!.fact,
    })),
    selection.selected,
  );
  assert.deepEqual(result.profile.facts, c.profile.facts);
  assert.deepEqual(profile, original);
});

test('DRAFT with no projectSelection retains ordinary facts, claims and provenance without invented data', () => {
  const c = qualityCases[0];
  const data = {
    ...c,
    factIds: ['education'],
    evidenceIds: ['activity'],
    claims: [{ text: 'Fictional claim', factIds: ['education'], evidenceIds: [] }],
  };
  const result = dto(
    generationPrompt(data, 'GENERAL_RECRUITMENT_CONTACT', 'COOPERATION_POSSIBILITY'),
  );
  assert.deepEqual(result.profile, c.profile);
  assert.deepEqual(result.factIds, data.factIds);
  assert.deepEqual(result.evidenceIds, data.evidenceIds);
  assert.deepEqual(result.claims, data.claims);
  assert.equal(result.profile.projectSelection, undefined);
});
