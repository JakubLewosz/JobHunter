import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkMessageRules,
  messageContactType,
  messagePrompt,
  checkAvailability,
  messageStyleIssues,
  recentMessageContext,
  messageWritingGoal,
  semanticReviewPrompt,
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
test('unknown company hours permit a question, never a claim that the schedule matches', () => {
  const a = analysis();
  assert.equal(a.conditions.hours.value, 'unknown');
  assert.doesNotThrow(() =>
    checkMessageRules(
      draft(
        'Jestem uczniem technikum. Jestem dostępny około 20 godzin tygodniowo po lekcjach. Czy taki wymiar i godziny pracy są dla Państwa odpowiednie?',
      ),
      profile,
      a,
    ),
  );
  assert.throws(
    () =>
      checkMessageRules(draft('Państwa godziny pracy pasują do mojej dostępności.'), profile, a),
    (e: any) => e.code === 'UNSUPPORTED_CONDITIONS',
  );
});
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

test('cel redakcyjny rozróżnia warunki oferty od zaproszenia do zespołu', () => {
  const active = analysis('ACTIVE');
  assert.equal(messageWritingGoal(active), 'SCHEDULE_FEASIBILITY');
  active.conditions.hours.value = 'yes';
  active.conditions.partTime.value = 'yes';
  assert.equal(messageWritingGoal(active), 'PROJECT_FIT');
  assert.equal(messageContactType(active), 'ACTIVE_JOB');
  const open = analysis('OPEN');
  assert.equal(messageWritingGoal(open), 'JOIN_TEAM_POSSIBILITY');
  for (const key of ['remote', 'paid', 'hours'] as const) open.conditions[key].value = 'yes';
  assert.equal(messageWritingGoal(open), 'JOIN_TEAM_POSSIBILITY');
  assert.equal(messageContactType(open), 'OPEN_APPLICATION');
  assert.equal(messageWritingGoal(analysis('PROSPECT')), 'COOPERATION_POSSIBILITY');
});

test('a truthful limitation is not automatically treated as a cosmetic disclaimer', () => {
  const body =
    'Przygotowałem stronę fikcyjnej pracowni. To projekt demonstracyjny, ale formularz nie wysyła danych.';
  assert.deepEqual(messageStyleIssues(draft(body)), []);
  // The relaxation concerns a context-free style warning, never the factual gate.
  assert.throws(
    () => checkMessageRules(draft('Jestem studentem i wdrożyłem system produkcyjnie.'), profile),
    (e: any) => e.code === 'UNSUPPORTED_EDUCATION',
  );
});

test('adres ogólny i konflikt nie uzyskują otwarcia udającego ofertę lub kandydaturę', () => {
  const general = analysis('ACTIVE');
  general.contact.kind = 'GENERAL';
  assert.equal(messageWritingGoal(general), 'COOPERATION_POSSIBILITY');
  const conflict = analysis('OPEN');
  conflict.conditions.remote.value = 'conflicting';
  assert.equal(messageWritingGoal(conflict), 'COOPERATION_POSSIBILITY');
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
      template: '[Fikcyjne preferencje stylu.]',
      recent: [{ opening: 'Poprzednie otwarcie.' }],
    });
    assert.match(prompt, /80–130/);
    assert.match(prompt, /około 20 godzin/);
    assert.doesNotMatch(prompt, /15–20/);
    assert.match(prompt, /Samo wspólne używanie AI\/Codexa nie uzasadnia dopasowania/);
    assert.match(prompt, /Poprzednie otwarcie/);
    assert.match(prompt, /pytanie o współpracę lub aplikowanie występuje tylko raz/);
    assert.match(prompt, /układ w podobnym kontekście są poprawne/);
    assert.match(prompt, /przed zwróceniem pierwszej wersji/);
    assert.match(prompt, /Sprawdź claims: dosłowne finalne fragmenty/);
    assert.doesNotMatch(prompt, /Wyraź tę jedną prośbę już we wprowadzeniu/);
    assert.ok(prompt.includes(messageContactType(analysis(type))));
  }
});

test('kontekst poprzednich wiadomości przekazuje sygnały wad bez kopiowania listu', () => {
  const previous = draft(
    'Dzień dobry,\r\n\r\nKontekst oferty.\r\n\r\nDopasowanie projektu.\r\n\r\nDostępność i edukacja.\r\n\r\nCzy taki wymiar pracy jest odpowiedni?',
  );
  const original = structuredClone(previous);
  const recent = recentMessageContext(previous);
  assert.ok(Array.isArray(recent.styleSignals));
  assert.doesNotMatch(
    JSON.stringify(recent),
    /Kontekst oferty|Dopasowanie projektu|Dostępność i edukacja/,
  );
  assert.deepEqual(previous, original);
});
test('pierwszy kontakt: Państwo domyślnie, dowód wyjątku zamiast kopiowania tonu recent', () => {
  for (const type of ['ACTIVE', 'OPEN', 'PROSPECT'] as const) {
    const data = {
      profile,
      analysis: analysis(type),
      qualification: 'NEEDS_REVIEW',
      evidence: [{ id: 'tone', fragment: 'Młody zespół IT. Dołącz do nas!' }],
      history: 'NEW',
      template: 'Preferencje stylu: przykład tonu „Cześć, piszę do Was.”.',
      recent: [{ opening: 'Piszę do Was.' }],
    };
    const original = structuredClone(data);
    const prompt = messagePrompt(data);
    assert.match(prompt, /pierwszym kontakcie domyślnie stosuj Państwo/);
    assert.match(prompt, /Wy dopuszczaj tylko przy wyraźnej podstawie w odczytanym oficjalnym/);
    assert.match(prompt, /pojedyncze Ty w ogłoszeniu nie wystarczają/);
    assert.match(prompt, /Nie mieszaj form Państwo i Wy/);
    assert.match(prompt, /nie kopiuj tonu recent lub template bez takiej podstawy/);
    assert.match(prompt, /bez deklaracji idealnego dopasowania lub korzyści dla firmy/);
    assert.deepEqual(
      JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6)).recent,
      data.recent,
    );
    assert.deepEqual(data, original);
  }
});

test('ograniczenie statusu pozostaje faktem, neutralny prototyp nie wymaga zastrzeżenia w treści', () => {
  const body =
    'Podczas praktyk przygotowałem prototyp CodeFabric wykorzystujący lokalne modele językowe.';
  const mail = {
    ...draft(body),
    factIds: ['codefabric'],
    claims: [{ text: body, kind: 'CANDIDATE', factIds: ['codefabric'], evidenceIds: [] }],
  };
  const p = {
    ...profile,
    facts: [
      {
        id: 'codefabric',
        key: 'codefabric',
        content:
          'CodeFabric: samodzielny prototyp z praktyk, lokalne modele językowe. Nie jest oficjalnym produktem fikcyjnej instytucji.',
      },
    ],
  };
  const data = { draft: mail, profile: p, evidence: [], analysis: analysis('OPEN') };
  const before = structuredClone(data);
  assert.deepEqual(checkMessageRules(mail, p, data.analysis), []);
  const review = semanticReviewPrompt(data);
  assert.match(review, /nie wymaga dopisku o braku oficjalnego statusu lub wdrożenia/);
  assert.match(
    review,
    /Nadal odrzuć deklarację oficjalnego produktu lub produkcyjnego wdrożenia bez dowodu/,
  );
  const sent = JSON.parse(review.slice(review.lastIndexOf('Dane: ') + 6));
  assert.deepEqual(sent, data);
  assert.doesNotMatch(sent.draft.body, /nie jest|oficjalnym produktem/);
  assert.match(sent.profile.facts[0].content, /Nie jest oficjalnym/);
  assert.deepEqual(data, before);
});

test('finalny styl: formalność, meta-komentarz, sprzedaż i prezentacja wymagają przeglądu bez odrzucenia', () => {
  for (const [text, code, flagged = true] of [
    ['Pragnę wyrazić zainteresowanie regularną współpracą.', 'FORMAL'],
    ['To konkretny punkt wspólny między projektami.', 'META'],
    ['Projekt pozostaje lokalnym demo.', 'META', false],
    ['Czy potrzebują Państwo pomocy przy automatyzacjach?', 'SALES_CTA'],
    ['Mogę zademonstrować rozwiązanie.', 'PROJECT_PRESENTATION'],
  ] as const) {
    const warnings = checkMessageRules(draft(text), profile, analysis());
    assert.equal(
      warnings.some((w) => w.startsWith(code)),
      flagged,
      text,
    );
  }
});
test('finalny styl: sensowny krótszy mail, za długi tekst, jedno pytanie i brak powtórzeń', () => {
  const short =
    'Dzień dobry, jestem uczniem technikum i szukam regularnej współpracy. Na stronie opisują Państwo integracje API. Mam projekt AutoRelay oparty na webhookach. Mogę pracować około 20 godzin tygodniowo po lekcjach, w pełni zdalnie. Czy rozważają Państwo taką współpracę? GitHub: https://github.com/JakubLewosz Pozdrawiam Jakub Lewosz';
  assert.ok(!messageStyleIssues(draft(short), analysis()).some((w) => w.startsWith('LENGTH')));
  assert.ok(
    !messageStyleIssues(draft('Słowo '.repeat(230)), analysis()).some((w) =>
      w.startsWith('LENGTH'),
    ),
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
  assert.deepEqual(
    messageStyleIssues(
      draft('Czy biorą Państwo pod uwagę początkującego programistę z taką dostępnością?'),
      analysis(),
    ),
    [],
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
      template: '[Fikcyjne preferencje stylu.]',
      recent: [],
    });
    assert.match(prompt, /80–130/);
    assert.match(prompt, /Nie ma obowiązkowej kolejności akapitów lub fraz/);
    assert.match(prompt, /pytanie o współpracę lub aplikowanie występuje tylko raz/);
    assert.doesNotMatch(prompt, /Cztery krótkie części|Schemat zapytania:/);
    assert.match(prompt, /Umowę zlecenie wspomnij tylko przy ACTIVE_JOB/);
  });
test('konstrukcja wynika z celu i dowodów, bez stałych zdań, list funkcji i losowych wariantów', () => {
  const prompt = messagePrompt({
    profile,
    analysis: analysis('ACTIVE', ['PHP Laravel']),
    qualification: 'NEEDS_REVIEW',
    evidence: [],
    history: 'NEW',
    template: '[Fikcyjne preferencje stylu.]',
    recent: [],
  });
  assert.match(prompt, /Nie ma obowiązkowej kolejności akapitów lub fraz/);
  assert.match(prompt, /Projekt jest opcjonalny/);
  assert.match(prompt, /nie dodawaj doświadczenia, technologii, wdrożenia ani warunków/);
  assert.match(prompt, /Status ucznia, szkoła i miejscowość także wymagają faktów/);
  assert.match(prompt, /Oferta dotyczy konkretnej potwierdzonej roli/);
  assert.match(prompt, /tylko zatwierdzone fakty/);
  assert.match(prompt, /różnorodność nie jest celem/);
  assert.match(prompt, /bez urzędowego tonu, sprzedaży, list funkcji/i);
  assert.match(prompt, /nie limit/);
});

test('proste zapytanie: edukacja i dostępność razem, n8n jest faktem firmy, nie kompetencją kandydata', () => {
  const company =
    'Zobaczyłem, że zajmują się Państwo automatyzacjami w n8n i integracjami systemów.';
  const candidate =
    'Jestem uczniem ostatniej klasy technikum programistycznego i szukam płatnej pracy zdalnej na około 20 godzin tygodniowo, głównie po lekcjach.';
  const project = 'Stworzyłem AutoRelay, projekt automatyzacji na webhookach.';
  const body = `Dzień dobry,

piszę z pytaniem, czy byliby Państwo otwarci na współpracę z początkującym programistą.

${candidate}

${company} ${project}

Chciałbym zapytać, czy widzą Państwo możliwość współpracy w takim wymiarze.

Pozdrawiam
Fictional Candidate`;
  const message = {
    ...draft(body),
    factIds: ['education', 'availability', 'autorelay'],
    claims: [
      {
        text: candidate,
        kind: 'CANDIDATE',
        factIds: ['education', 'availability'],
        evidenceIds: [],
      },
      { text: company, kind: 'COMPANY', factIds: [], evidenceIds: ['evidence'] },
      { text: project, kind: 'CANDIDATE', factIds: ['autorelay'], evidenceIds: [] },
    ],
  };
  assert.ok(
    checkMessageRules(message, profile, analysis('PROSPECT', ['integracje API'])).some((w) =>
      w.startsWith('REPEATED_REQUEST'),
    ),
  );
  assert.throws(
    () =>
      checkMessageRules(
        {
          ...message,
          claims: [
            {
              text: 'Tworzę automatyzacje w n8n.',
              kind: 'CANDIDATE',
              factIds: ['autorelay'],
              evidenceIds: [],
            },
          ],
        },
        profile,
        analysis(),
      ),
    (e) => e instanceof DomainError && e.code === 'UNSUPPORTED_TECHNOLOGY',
  );
});

for (const body of [
  'Piszę z pytaniem, czy byliby Państwo otwarci na współpracę. Chciałbym zapytać, czy widzą Państwo możliwość współpracy w takim wymiarze.',
  'Czy rozważają Państwo taką współpracę? Proszę o informację o możliwości współpracy.',
  'Pytam o możliwość współpracy programistycznej. Czy taki wymiar i godziny pracy są dla Państwa odpowiednie?',
])
  test(`dwie prośby, także zakończone kropką, wymagają przeglądu: ${body}`, () => {
    assert.ok(messageStyleIssues(draft(body)).some((w) => w.startsWith('REPEATED_REQUEST')));
  });

for (const body of [
  'Szukam płatnej, regularnej współpracy. Czy rozważają Państwo taką współpracę?',
  'Piszę w sprawie oferty Junior Developer. Czy taki wymiar i godziny pracy są dla Państwa odpowiednie?',
  'Piszę z pytaniem, czy byliby Państwo otwarci na współpracę. Jestem uczniem technikum i szukam płatnej pracy zdalnej.',
  'Pracowałem w zespole nad aplikacją do analizy planów. Chciałbym zapytać, czy widzą Państwo możliwość współpracy.',
])
  test(`jedna prośba z kontekstem lub celem nie wymaga powtórzenia na końcu: ${body}`, () => {
    assert.ok(!messageStyleIssues(draft(body)).some((w) => w.startsWith('REPEATED_REQUEST')));
  });

for (const body of [
  'Dzień dobry,\n\nchciałbym zapytać, czy rozważają Państwo współpracę z początkującym programistą na około 20 godzin tygodniowo. Szukam stałej, płatnej współpracy w pełni zdalnej.\n\nJestem uczniem technikum. W portfolio mam AutoRelay — aplikację do automatyzacji z webhookami. Piszę ze względu na Państwa integracje API.\n\nW załączniku przesyłam CV.\n\nPozdrawiam\nFictional Candidate',
  'Dzień dobry,\n\nszukam stałej, płatnej współpracy programistycznej — w pełni zdalnie, około 20 godzin tygodniowo. Czy taki wymiar współpracy wchodzi u Państwa w grę?\n\nJestem uczniem technikum. W AutoRelay pracowałem nad automatyzacjami uruchamianymi przez webhooki. Chętnie pracowałbym przy podobnych integracjach w Fikcyjnej Firmie.\n\nZałączam CV.\n\nPozdrawiam\nFictional Candidate',
  'Dzień dobry,\n\nna Państwa stronie znalazłem zaproszenie do przesłania CV.\n\nJestem uczniem technikum. Szukam stałej, płatnej pracy w pełni zdalnej, na około 20 godzin tygodniowo. Chętnie pracowałbym przy Państwa integracjach.\n\nCzy biorą Państwo pod uwagę początkującego programistę z taką dostępnością?\n\nW załączniku przesyłam CV.\n\nPozdrawiam\nFictional Candidate',
])
  test(`krótki naturalny mail z jednym powodem kontaktu, także bez projektu: ${body.slice(0, 75)}`, () => {
    assert.deepEqual(messageStyleIssues(draft(body), analysis('OPEN', ['integracje API'])), []);
    checkAvailability(draft(body), profile);
  });

test('instrukcje dopuszczają naturalne pytanie i warunkowe CV bez fikcyjnego dowodu lub prawa wysyłki', () => {
  const data = {
    profile,
    analysis: analysis('OPEN'),
    qualification: 'NEEDS_REVIEW',
    evidence: [],
    history: 'NEW',
    template: '[Fikcyjne preferencje stylu.]',
    recent: [],
  };
  const prompt = messagePrompt(data),
    review = semanticReviewPrompt({ ...data, draft: draft() });
  assert.match(prompt, /pytanie o współpracę lub aplikowanie występuje tylko raz/);
  assert.match(prompt, /CV oznacza warunek przyszłego pakietu z zatwierdzonym plikiem/);
  assert.match(review, /nie żądaj fikcyjnego cytatu/);
  assert.match(review, /brak opisu projektu przy konkretnym powodzie kontaktu/);
  assert.match(review, /kontrole faktycznego załącznika i uprawnień/);
  assert.match(review, /nie zgoda na wysyłkę/);
});
