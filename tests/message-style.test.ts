import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkMessageRules,
  messageContactType,
  messagePrompt,
  checkAvailability,
  messageStyleIssues,
} from '../apps/server/src/research/message-policy.js';
import { relevantProjectFacts } from '../apps/server/src/research/drafting.js';
import { conditionKeys, type Analysis } from '../apps/server/src/research/contracts.js';
import { DomainError } from '../apps/server/src/util.js';
const facts = [
  { id: 'identity', key: 'identity', content: 'Fictional Candidate' },
  {
    id: 'education',
    key: 'education',
    content: 'Uczeń ostatniej klasy technikum programistycznego.',
  },
  {
    id: 'availability',
    key: 'availability',
    content: 'Płatna regularna współpraca zdalna około 20 godzin po lekcjach.',
  },
  { id: 'ai', key: 'ai', content: 'Korzysta z programowania wspomaganego AI, szczególnie Codex.' },
  {
    id: 'fixdesk',
    key: 'fixdesk',
    content: 'FixDesk: lokalne demo PHP/Laravel, nie system produkcyjny.',
  },
  { id: 'autorelay', key: 'autorelay', content: 'AutoRelay: projekt automatyzacji na webhookach.' },
  {
    id: 'codefabric',
    key: 'codefabric',
    content: 'CodeFabric: prototyp z lokalnymi modelami językowymi.',
  },
  {
    id: 'elektroscan',
    key: 'elektroscan',
    content: 'ElektroScan: analiza dokumentów PDF i planów elektrycznych.',
  },
];
const profile = {
  name: 'Fictional Candidate',
  facts,
  availabilityMode: 'APPROX',
  hoursApprox: 20,
  hoursMin: null,
  hoursMax: null,
};
const proof = {
  sourceId: 'source',
  quote: 'Fictional firm',
  explanation: 'Fikcyjne źródło testowe.',
};
function analysis(type: Analysis['type'] = 'PROSPECT', requirements: string[] = []): Analysis {
  return {
    company: 'Fictional firm',
    companyProof: proof,
    companyURL: 'https://firm.example.test',
    title: requirements[0] ?? 'Fictional firm',
    titleProof: proof,
    type,
    typeProof: proof,
    conditions: Object.fromEntries(
      conditionKeys.map((k) => [
        k,
        {
          ...proof,
          value:
            (k === 'active' && type === 'ACTIVE') || (k === 'openInquiry' && type === 'OPEN')
              ? 'yes'
              : 'unknown',
        },
      ]),
    ) as Analysis['conditions'],
    requirements: requirements.map((text) => ({ text, sourceId: 'source', quote: text })),
    contact: { email: 'hr@firm.example.test', kind: 'RECRUITMENT', proof },
    warnings: [],
  };
}
function draft(
  body = 'Jestem uczniem technikum i szukam płatnej, regularnej współpracy zdalnej. Czy rozważają Państwo początkującego programistę?',
) {
  return {
    subject: 'Zapytanie o współpracę programistyczną',
    body,
    factIds: ['education'],
    claims: [{ text: body, kind: 'CANDIDATE', factIds: ['education'], evidenceIds: [] }],
    evidenceIds: ['evidence'],
    warnings: [],
  };
}
for (const [area, key] of [
  ['PHP Laravel', 'fixdesk'],
  ['API integracje webhooki', 'autorelay'],
  ['LLM i narzędzia AI', 'codefabric'],
  ['PDF computer vision', 'elektroscan'],
])
  test(`dobór projektu: ${area} → ${key}`, () =>
    assert.equal(relevantProjectFacts(facts, analysis('PROSPECT', [area]))[0].key, key));
test('projekt: jeden domyślnie, dwa tylko dla dwóch odrębnych wymagań, brak dopasowania pomija opis', () => {
  assert.equal(relevantProjectFacts(facts, analysis('PROSPECT', ['PHP Laravel API'])).length, 1);
  assert.deepEqual(
    relevantProjectFacts(facts, analysis('PROSPECT', ['PHP Laravel', 'lokalne modele LLM'])).map(
      (f) => f.key,
    ),
    ['fixdesk', 'codefabric'],
  );
  assert.deepEqual(relevantProjectFacts(facts, analysis('PROSPECT', ['Systemy CAD'])), []);
});
test('typ kontaktu nie tworzy oferty z niepotwierdzonej rekrutacji', () => {
  assert.equal(messageContactType(analysis('ACTIVE')), 'ACTIVE_JOB');
  assert.equal(messageContactType(analysis('OPEN')), 'OPEN_APPLICATION');
  assert.equal(messageContactType(analysis('PROSPECT')), 'GENERAL_RECRUITMENT_CONTACT');
  const unconfirmed = analysis('ACTIVE');
  unconfirmed.conditions.active.value = 'unknown';
  assert.equal(messageContactType(unconfirmed), 'GENERAL_RECRUITMENT_CONTACT');
});
for (const [body, code] of [
  ['Chętnie zaprezentuję projekt.', 'PROJECT_PRESENTATION'],
  ['Mogę zaprezentować portfolio.', 'PROJECT_PRESENTATION'],
  ['Chętnie opowiem więcej o projekcie.', 'PROJECT_PRESENTATION'],
  ['Mogę pokazać działanie aplikacji.', 'PROJECT_PRESENTATION'],
  ['Chętnie omówię moje doświadczenie.', 'PROJECT_PRESENTATION'],
  ['Chętnie pokażę moje realizacje.', 'PROJECT_PRESENTATION'],
  ['Jestem studentem uczelni.', 'UNSUPPORTED_EDUCATION'],
  ['Studiuję informatykę.', 'UNSUPPORTED_EDUCATION'],
  ['Jestem studentką uczelni.', 'UNSUPPORTED_EDUCATION'],
  ['Mam doświadczenie komercyjne.', 'UNSUPPORTED_EXPERIENCE'],
  ['Pracowałem produkcyjnie z agentami AI.', 'UNSUPPORTED_EXPERIENCE'],
  ['Jestem ekspertem AI.', 'UNSUPPORTED_AI'],
  ['Specjalizuję się w AI.', 'UNSUPPORTED_AI'],
  ['Trenuję modele AI.', 'UNSUPPORTED_AI'],
  ['Moja stawka to 80 zł za godzinę.', 'UNAPPROVED_RATE'],
])
  test(`walidacja: ${body}`, () =>
    code === 'PROJECT_PRESENTATION'
      ? assert.ok(
          checkMessageRules(draft(body), profile, analysis()).some((s) => s.startsWith(code)),
        )
      : assert.throws(
          () => checkMessageRules(draft(body), profile, analysis()),
          (e) => e instanceof DomainError && e.code === code,
        ));
test('naturalne zgłoszenie bez Codexa i negacja nie są fałszywym naruszeniem', () => {
  assert.doesNotThrow(() => checkMessageRules(draft(), profile, analysis()));
  assert.doesNotThrow(() =>
    checkMessageRules(
      draft(
        'Nie jestem studentem uczelni. Jestem uczniem technikum. Nie mam doświadczenia komercyjnego.',
      ),
      profile,
      analysis(),
    ),
  );
});
test('negacja w zatwierdzonym opisie nie potwierdza statusu studenta', () => {
  const negative = {
    ...profile,
    facts: [
      {
        id: 'education',
        key: 'education',
        content: 'Jestem uczniem technikum, nie studentem uczelni.',
      },
    ],
  };
  assert.throws(
    () => checkMessageRules(draft('Jestem studentem uczelni.'), negative, analysis()),
    (e) => e instanceof DomainError && e.code === 'UNSUPPORTED_EDUCATION',
  );
});
test('technologia firmy nie staje się kompetencją kandydata', () => {
  const unsupported = draft('Mam doświadczenie z React.');
  unsupported.claims[0].factIds = ['fixdesk'];
  assert.throws(
    () => checkMessageRules(unsupported, profile, analysis()),
    (e) => e instanceof DomainError && e.code === 'UNSUPPORTED_TECHNOLOGY',
  );
  const company = draft('Na stronie opisują Państwo React.');
  company.claims[0].kind = 'COMPANY';
  company.claims[0].factIds = [];
  assert.doesNotThrow(() => checkMessageRules(company, profile, analysis('PROSPECT', ['React'])));
});
test('bez aktywnej oferty nie ma deklaracji znalezionego wakatu; negacja jest dozwolona', () => {
  assert.throws(
    () =>
      checkMessageRules(
        draft('Widziałem Państwa ofertę i aplikuję na stanowisko.'),
        profile,
        analysis(),
      ),
    (e) => e instanceof DomainError && e.code === 'UNSUPPORTED_VACANCY',
  );
  assert.doesNotThrow(() =>
    checkMessageRules(
      draft('Nie widziałem Państwa oferty, dlatego pytam o możliwość współpracy.'),
      profile,
      analysis(),
    ),
  );
});
test('prompt: około 20 z profilu, AI opcjonalne, różny temat i pytanie oraz poprzednie otwarcia jako dane', () => {
  for (const type of ['ACTIVE', 'OPEN', 'PROSPECT'] as const) {
    const prompt = messagePrompt({
      profile,
      analysis: analysis(type, ['PHP Laravel']),
      evidence: [],
      history: 'NEW',
      qualification: 'NEEDS_REVIEW',
      template: 'old template',
      recent: [{ opening: 'Poprzednie otwarcie.' }],
    });
    assert.match(prompt, /150–220/);
    assert.match(prompt, /około 20 godzin/);
    assert.doesNotMatch(prompt, /15–20/);
    assert.match(prompt, /AI\/Codex są opcjonalnym narzędziem pracy/);
    assert.match(prompt, /Poprzednie otwarcie/);
    assert.ok(prompt.includes(messageContactType(analysis(type))));
  }
});
test('finalny styl: formalność, meta-komentarz, sprzedaż i prezentacja wymagają przeglądu bez odrzucenia', () => {
  for (const [text, code] of [
    ['Pragnę wyrazić zainteresowanie regularną współpracą.', 'FORMAL'],
    ['To konkretny punkt wspólny między projektami.', 'META'],
    ['Projekt pozostaje lokalnym demo.', 'META'],
    ['Czy potrzebują Państwo pomocy przy automatyzacjach?', 'SALES_CTA'],
    ['Mogę zademonstrować rozwiązanie.', 'PROJECT_PRESENTATION'],
  ]) {
    const warnings = checkMessageRules(draft(text), profile, analysis());
    assert.ok(
      warnings.some((w) => w.startsWith(code)),
      text,
    );
  }
});
test('finalny styl: sensowny krótszy mail, za długi tekst, jedno pytanie i brak powtórzeń', () => {
  const short =
    'Dzień dobry, jestem uczniem technikum i szukam regularnej współpracy. Na stronie opisują Państwo integracje API. Mam projekt AutoRelay oparty na webhookach. Mogę pracować około 20 godzin tygodniowo po lekcjach, w pełni zdalnie. Czy rozważają Państwo taką współpracę? GitHub: https://github.com/JakubLewosz Pozdrawiam Jakub Lewosz';
  assert.ok(!messageStyleIssues(draft(short), analysis()).some((w) => w.startsWith('LENGTH')));
  assert.ok(
    messageStyleIssues(draft('Słowo '.repeat(230)), analysis()).some((w) => w.startsWith('LENGTH')),
  );
  assert.ok(
    messageStyleIssues(draft(short + ' Czy są Państwo zainteresowani?'), analysis()).some((w) =>
      w.startsWith('CTA'),
    ),
  );
  assert.ok(
    messageStyleIssues(
      draft(short + ' Mogę pracować około 20 godzin tygodniowo.'),
      analysis(),
    ).some((w) => w.startsWith('REPETITION')),
  );
});
test('finalny styl: zlecenie tylko w potwierdzonej aktywnej ofercie, bez obowiązkowego początkujący', () => {
  const mail = draft(
    'Forma współpracy na umowę zlecenie również mi odpowiada. Czy moja dostępność pasowałaby do tej rekrutacji?',
  );
  const active = analysis('ACTIVE', ['PHP Laravel']);
  active.conditions.contract = { ...proof, value: 'yes', quote: 'umowa zlecenie' };
  assert.ok(!messageStyleIssues(mail, active).some((w) => w.startsWith('CONTRACT_CONTEXT')));
  active.conditions.contract.value = 'unknown';
  assert.ok(messageStyleIssues(mail, active).some((w) => w.startsWith('CONTRACT_CONTEXT')));
  assert.ok(
    messageStyleIssues(mail, analysis('OPEN')).some((w) => w.startsWith('CONTRACT_CONTEXT')),
  );
  assert.ok(
    messageStyleIssues(draft('Czy rozważają Państwo początkującego programistę?'), analysis()).some(
      (w) => w.startsWith('CLOSING'),
    ),
  );
});
test('dostępność: profil zakresowy 15–20 odrzuca sztywne 20h i pełną dyspozycyjność', () => {
  const ranged = {
    ...profile,
    availabilityMode: 'RANGE',
    hoursMin: 15,
    hoursMax: 20,
    hoursApprox: null,
  };
  assert.doesNotThrow(() =>
    checkAvailability(draft('Mogę pracować około 15–20h tygodniowo po lekcjach.'), ranged),
  );
  assert.throws(
    () => checkAvailability(draft('Jestem dostępny 20h tygodniowo.'), ranged),
    /Godziny/,
  );
  assert.throws(
    () => checkAvailability(draft('Jestem dostępny około 10–20 godzin tygodniowo.'), ranged),
    /Godziny/,
  );
  assert.throws(
    () => checkMessageRules(draft('Jestem w pełni dyspozycyjny.'), ranged, analysis()),
    (e) => e instanceof DomainError && e.code === 'UNSUPPORTED_AVAILABILITY',
  );
  assert.doesNotThrow(() =>
    checkAvailability(draft('Jestem dostępny około 20 godzin tygodniowo.'), profile),
  );
});
for (const [kind, requirements, hasContract] of [
  ['ACTIVE', ['PHP Laravel'], true],
  ['OPEN', ['integracje API'], false],
  ['PROSPECT', ['lokalne LLM'], false],
  ['PROSPECT', ['PHP Laravel'], false],
  ['ACTIVE', ['PDF computer vision'], false],
] as const)
  test(`finalny prompt: ${kind}/${requirements[0]}, umowa=${hasContract}`, () => {
    const a = analysis(kind, [...requirements]);
    a.conditions.contract = {
      ...proof,
      value: hasContract ? 'yes' : 'unknown',
      quote: hasContract ? 'umowa zlecenie' : null,
    };
    const prompt = messagePrompt({
      profile,
      analysis: a,
      qualification: 'NEEDS_REVIEW',
      evidence: [],
      history: 'NEW',
      template: 'old',
      recent: [],
    });
    assert.match(prompt, /150–220/);
    assert.match(prompt, /Cztery krótkie części/);
    assert.match(prompt, /bez automatycznego początkujący programista/);
    assert.match(prompt, /Umowę zlecenie wspomnij tylko przy ACTIVE_JOB/);
  });
test('drobny tuning języka: bezpośrednie nawiązanie, neutralny projekt, odmiana i proste tematy', () => {
  const prompt = messagePrompt({
    profile,
    analysis: analysis('ACTIVE', ['PHP Laravel']),
    qualification: 'NEEDS_REVIEW',
    evidence: [],
    history: 'NEW',
    template: 'old',
    recent: [],
  });
  assert.match(prompt, /Na Państwa stronie zwróciłem uwagę/);
  assert.match(prompt, /Nie używaj domyślnie słowa demo/);
  assert.match(prompt, /Nie sugeruj wdrożenia produkcyjnego/);
  assert.match(prompt, /Nazywam się Jakub Lewosz, z osobą/);
  assert.match(prompt, /Kandydatura – \[rzeczywisty tytuł stanowiska\]/);
  assert.match(prompt, /tylko w zakresie zatwierdzonych faktów/);
  assert.match(prompt, /bez z pasją/);
});
