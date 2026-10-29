import type { Row } from '../../../../packages/shared/types.js';
import { DomainError } from '../util.js';
import {
  compact,
  researchInstructions as baseResearchInstructions,
  type Analysis,
} from './contracts.js';
import { projectKeys, relevantProjectFacts, projectMentions } from './drafting.js';
import { generationPrompt, editorialRubric, messageModelData } from './message-quality.js';

export type ContactType = 'ACTIVE_JOB' | 'OPEN_APPLICATION' | 'GENERAL_RECRUITMENT_CONTACT';
export function messageContactType(analysis: Analysis): ContactType {
  if (analysis.contact.kind !== 'RECRUITMENT') return 'GENERAL_RECRUITMENT_CONTACT';
  if (Object.values(analysis.conditions).some((c) => c.value === 'no' || c.value === 'conflicting'))
    return 'GENERAL_RECRUITMENT_CONTACT';
  if (analysis.type === 'ACTIVE' && analysis.conditions.active.value === 'yes') return 'ACTIVE_JOB';
  if (analysis.type === 'OPEN' && analysis.conditions.openInquiry.value === 'yes')
    return 'OPEN_APPLICATION';
  return 'GENERAL_RECRUITMENT_CONTACT';
}
export function recentMessageContext(draft: Row) {
  return {
    // Defect signals, never a bank of full previous letters or paragraph plans.
    styleSignals: messageStyleIssues(draft),
  };
}

export function messageWritingGoal(analysis: Analysis) {
  const type = messageContactType(analysis);
  if (type === 'GENERAL_RECRUITMENT_CONTACT') return 'COOPERATION_POSSIBILITY';
  if (type === 'ACTIVE_JOB')
    return analysis.conditions.hours.value !== 'yes' || analysis.conditions.partTime.value !== 'yes'
      ? 'SCHEDULE_FEASIBILITY'
      : 'PROJECT_FIT';
  return 'JOIN_TEAM_POSSIBILITY';
}
export function messagePrompt(data: {
  profile: Row;
  analysis: Analysis;
  qualification: string;
  evidence: Row[];
  history: string;
  template: string;
  recent: Row[];
}) {
  return generationPrompt(
    data,
    messageContactType(data.analysis),
    messageWritingGoal(data.analysis),
  );
}

export function semanticReviewPrompt(data: Row) {
  const researchInstructions =
    baseResearchInstructions +
    '\nOceniaj twierdzenia w draft.subject, draft.body i claims, nie poprawność wszystkich hipotez i objaśnień metadanych analysis. Hipoteza o projekcie niewybranym do szkicu nie jest deklaracją kandydata. analysis.*.sourceId oznacza odczytane źródło; evidence[].id oznacza fragment dowodu i służy claims.evidenceIds. Są to różne identyfikatory: evidence[].sourceId jest ich mapowaniem. readProofs zawiera dodatkowe cytaty potwierdzone kodowo w tych samych zapisanych źródłach. Nie żądaj równości sourceId i evidence.id ani zmiany prawidłowych odwołań.';
  return `${researchInstructions}\ncontactType opisuje schemat wiadomości, nie przeznaczenie adresu; rzeczywisty cel kontaktu pozostaje analysis.contact.kind. GENERAL_RECRUITMENT_CONTACT nie zmienia GENERAL w RECRUITMENT. Sprawdź KAŻDE istotne stwierdzenie w temacie i całym szkicu, także poza claims. Zweryfikuj uczeń vs student, fakty o projektach, technologie kandydata, komercję, przesadne deklaracje AI, stawki, dostępność i istnienie aktywnej oferty. Sprawdź też naturalny ton zgłoszenia: bez sprzedaży usług i proponowania prezentacji, jeden projekt domyślnie, dwa tylko gdy odrębne dowody uzasadniają oba. Neutralne określenie projekt lub aplikacja zamiast demo samo w sobie nie oznacza produkcyjnego wdrożenia; produkcja nadal wymaga dowodu. Precyzyjny opis prototypu z praktyk nie wymaga dopisku o braku oficjalnego statusu lub wdrożenia. Ograniczenia prawdziwości służą ocenie twierdzeń, nie żądaj powtarzania ich w mailu. Nadal odrzuć deklarację oficjalnego produktu lub produkcyjnego wdrożenia bez dowodu. Publiczne repozytorium, sam link GitHub lub samo dawne określenie publiczne demo nie potwierdzają działającej publicznie aplikacji. Taka deklaracja wymaga w zatwierdzonych faktach potwierdzenia działającej wersji i jej adresu poza repozytorium GitHub; przy braku tego potwierdzenia zgłoś problem w issues. supported=true dla treści popartej faktami i źródłami; false dla wykrytych niepopartych deklaracji; null przy niewystarczającej pewności lub dwuznaczności. Opisz problemy w issues. Nie odrzucaj za samą zmianę naturalnego sformułowania, jedno pytanie o początkującego programistę ani brak opisu projektu przy konkretnym powodzie kontaktu. Stała współpraca określa cel regularności, nie gwarancję zatrudnienia. Informacja o załączanym CV jest warunkiem przyszłego pakietu z zatwierdzonym PDF, nie nowym osiągnięciem ani faktem firmy; nie żądaj fikcyjnego cytatu. Nadal obowiązują kontrole faktycznego załącznika i uprawnień. To pomocnicza kontrola, nie zgoda na wysyłkę. ${editorialRubric} Dane: ${JSON.stringify(messageModelData(data))}`;
}

function hasPositiveClaim(pattern: RegExp, text: string) {
  return [
    ...text
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .matchAll(
        new RegExp(
          pattern.source.normalize('NFD').replace(/\p{M}/gu, ''),
          pattern.flags.replace('g', '') + 'g',
        ),
      ),
  ].some((m) => !/\bnie\s*$/iu.test(text.slice(Math.max(0, m.index! - 12), m.index)));
}
const technologyGroups = [
  ['php'],
  ['laravel'],
  ['react'],
  ['python'],
  ['typescript'],
  ['javascript'],
  ['node.js', 'nodejs'],
  ['java'],
  ['rust'],
  ['ruby'],
  ['docker'],
  ['n8n'],
  ['llm', 'modele językowe', 'modelami językowymi', 'model językowy', 'modeli językowych'],
  ['computer vision', 'analiza obrazu', 'analizy obrazu'],
];
function positiveEvidence(facts: Row[], patterns: RegExp) {
  return facts.some(
    (f) =>
      new RegExp(patterns.source.normalize('NFD').replace(/\p{M}/gu, ''), patterns.flags).test(
        compact(f.content).normalize('NFD').replace(/\p{M}/gu, ''),
      ) &&
      !/\b(?:bez|nie|brak)\b.{0,35}(?:komerc|produkcyjn|ekspert|student|studi|specjal)/iu.test(
        f.content,
      ),
  );
}
export function checkMessageRules(draft: Row, profile: Row, analysis?: Analysis) {
  const issues: string[] = [];
  const body = compact(draft.body),
    text = compact(draft.subject + ' ' + draft.body);
  if (
    hasPositiveClaim(
      /\b(?:jestem|pozostaję) (?:w pełni|całkowicie|zawsze) dyspozycyjny|\bpełna dyspozycyjność/iu,
      body,
    )
  )
    throw new DomainError(
      'UNSUPPORTED_AVAILABILITY',
      'Pełna dyspozycyjność nie wynika z zatwierdzonego profilu.',
    );
  if (
    /po lekcjach|after school/iu.test(body) &&
    !profile.facts.some(
      (f: Row) => f.key === 'availability' && /po lekcjach|after school/iu.test(f.content),
    )
  )
    throw new DomainError(
      'UNSUPPORTED_AVAILABILITY',
      'Pory dostępności nie wynikają z aktualnych faktów.',
    );
  if (
    hasPositiveClaim(
      /dostępny.{0,25}(?:8\s*[–-]\s*16|bez ograniczeń)|pełen etat|dokładnie\s*20\s*godzin/iu,
      body,
    )
  )
    throw new DomainError(
      'UNSUPPORTED_AVAILABILITY',
      'Niepoparty dokładny grafik lub wymiar pracy.',
    );
  const mentioned = projectMentions(body);
  if (
    mentioned.includes('sekiforma') &&
    profile.facts.some((f: Row) => f.key === 'sekiforma' && /fikcyjn/iu.test(f.content)) &&
    hasPositiveClaim(
      /(?:realn|rzeczywist).{0,40}(?:klient|pracown)|(?:formularz|brief)\s+(?:wysyła|przesyła|zbiera|gromadzi)|wdrożyłem.{0,40}(?:klient|pracown)/iu,
      body,
    )
  )
    throw new DomainError(
      'UNSUPPORTED_PROJECT_CLAIM',
      'Demo fikcyjnej marki nie potwierdza obsługi klienta.',
    );
  if (
    mentioned.includes('elektroscan') &&
    profile.facts.some(
      (f: Row) => f.key === 'elektroscan' && /dwuosobow|zespoł/iu.test(f.content),
    ) &&
    hasPositiveClaim(/samodzielnie\s+(?:stworzyłem|zbudowałem|przygotowałem)\s+elektroscan/iu, body)
  )
    throw new DomainError(
      'UNSUPPORTED_PROJECT_CLAIM',
      'Projekt zespołowy nie dowodzi solowego autorstwa.',
    );
  if (
    mentioned.includes('codefabric') &&
    hasPositiveClaim(
      /codefabric.{0,30}(?:oficjalny produkt|system produkcyjny)|codefabric.{0,60}(?:używa|wykorzystuje).{0,20}codex.{0,25}(?:silnik|model|backend)/iu,
      body,
    )
  )
    throw new DomainError(
      'UNSUPPORTED_PROJECT_CLAIM',
      'Niepoparty status lub dostawca modeli prototypu.',
    );
  if (
    hasPositiveClaim(
      /\b(?:mogę|chętnie|z przyjemnością|chciałbym)\s+(?:państwu\s+)?(?:zaprezentować|przedstawić|pokazać|omówić|opowiedzieć|opowiem|omówię|pokażę|przedstawię|zaprezentuję)\b.{0,65}(?:projekt|portfolio|realizacj|doświadczeni|działanie aplikacji)|\b(?:zaprezentuję|pokażę|przedstawię)\b.{0,65}(?:projekt|portfolio|realizacj)|chętnie opowiem więcej/iu,
      body,
    )
  )
    issues.push(
      'PROJECT_PRESENTATION: pierwsza wiadomość proponuje prezentację projektu lub portfolio.',
    );
  if (
    hasPositiveClaim(
      /\b(?:jestem|jako)\s+(?:również\s+)?student(?:em|ką|ka)?\b|\bstudiuję\b|\b(?:mam|posiadam) status studenta\b/iu,
      body,
    ) &&
    !positiveEvidence(profile.facts, /student|studiuję/iu)
  )
    throw new DomainError(
      'UNSUPPORTED_EDUCATION',
      'Status studenta nie wynika z zatwierdzonego profilu.',
    );
  if (
    hasPositiveClaim(
      /\b(?:mam|posiadam)\b.{0,65}doświadczeni.{0,25}komerc|\bpracowałem\b.{0,65}(?:komercyjnie|produkcyjnie)|\b(?:moje|moich)\b.{0,40}(?:komercyjne projekty|projektach komercyjnych)/iu,
      body,
    ) &&
    !positiveEvidence(profile.facts, /komerc|produkcyjn/iu)
  )
    throw new DomainError(
      'UNSUPPORTED_EXPERIENCE',
      'Doświadczenie komercyjne nie wynika z zatwierdzonych faktów.',
    );
  if (
    hasPositiveClaim(
      /\b(?:jestem|jako)\b.{0,20}(?:ekspert|specjalist).{0,15}\bai\b|\bspecjalizuję się\b.{0,20}\bai\b|\b(?:tworzę|trenuję) modele (?:ai|sztucznej inteligencji)|\bpracowałem\b.{0,30}produkcyjnie.{0,30}agent/iu,
      body,
    ) &&
    !positiveEvidence(profile.facts, /ekspert|specjaliz|trenuj|produkcyjnie.*agent/iu)
  )
    throw new DomainError(
      'UNSUPPORTED_AI',
      'Przesadna deklaracja AI nie ma zatwierdzonego źródła.',
    );
  if (
    hasPositiveClaim(/\d+(?:[.,]\d+)?\s*(?:zł|pln|eur|usd|euro|dolar)/iu, body) &&
    !positiveEvidence(profile.facts, /\d+\s*(?:zł|pln|eur|usd)/iu)
  )
    throw new DomainError('UNAPPROVED_RATE', 'Stawka nie została zatwierdzona w profilu.');
  for (const claim of draft.claims.filter((c: Row) => c.kind === 'CANDIDATE')) {
    const approved = profile.facts
      .filter((f: Row) => claim.factIds.includes(f.id))
      .map((f: Row) => compact(f.content))
      .join(' ');
    for (const group of technologyGroups) {
      const mentioned = group.some((t) =>
        new RegExp(
          `(^|[^\\p{L}])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`,
          'iu',
        ).test(claim.text),
      );
      if (
        mentioned &&
        !group.some((t) => approved.includes(t)) &&
        !/(?:chciałbym poznać|chętnie poznam|nauczyć|czy)(?=\s|$)/iu.test(claim.text)
      )
        throw new DomainError(
          'UNSUPPORTED_TECHNOLOGY',
          `Technologia ${group[0]} w deklaracji kandydata nie wynika ze wskazanych faktów.`,
          409,
          { technology: group[0], claim: claim.text, factIds: claim.factIds },
        );
    }
  }
  const selected = profile.facts.filter(
    (f: Row) =>
      projectKeys.includes(f.key as (typeof projectKeys)[number]) && draft.factIds.includes(f.id),
  );
  const allowed = analysis ? relevantProjectFacts(profile.facts, analysis) : [];
  if (
    selected.length > 1 &&
    (selected.length > 2 ||
      allowed.length < 2 ||
      selected.some((f: Row) => !allowed.some((a) => a.id === f.id)))
  )
    throw new DomainError(
      'TOO_MANY_PROJECTS',
      'Dwa projekty wymagają odrębnych potwierdzonych obszarów dopasowania.',
    );
  if (
    analysis &&
    messageContactType(analysis) !== 'ACTIVE_JOB' &&
    hasPositiveClaim(
      /znalazłem\s+(?:państwa\s+)?ofertę|w odpowiedzi na\s+(?:państwa\s+)?(?:ofertę|ogłoszenie)|aplikuję na stanowisko|widziałem\s+(?:państwa\s+)?(?:ofertę|ogłoszenie)|prowadz(?:icie|ą państwo) rekrutację/iu,
      text,
    )
  )
    throw new DomainError(
      'UNSUPPORTED_VACANCY',
      'Brak potwierdzonej aktywnej oferty dla tej deklaracji.',
    );
  if (analysis) {
    for (const [key, pattern] of [
      [
        'hours',
        /(?:państwa|ofert[ay]).{0,30}(?:godziny|grafik|wymiar).{0,30}(?:pasują|odpowiadają|zgodne)|(?:godziny|grafik|wymiar).{0,30}(?:państwa|ofert[ay]).{0,30}(?:pasują|odpowiadają|zgodne)/iu,
      ],
      [
        'remote',
        /(?:firma|państwo).{0,30}(?:oferuje|oferują|umożliwia|umożliwiają).{0,20}(?:pracę zdalną|zdalną współpracę)/iu,
      ],
    ] as const) {
      if (analysis.conditions[key].value !== 'yes' && hasPositiveClaim(pattern, text))
        throw new DomainError(
          'UNSUPPORTED_CONDITIONS',
          'Nieznane warunki firmy nie potwierdzają dopasowania dostępności. Zadaj pytanie.',
        );
    }
  }
  return [...issues, ...messageStyleIssues(draft, analysis)];
}
export function messageStyleIssues(draft: Row, analysis?: Analysis): string[] {
  const body = compact(draft.body),
    issues: string[] = [];
  // Length is editorial guidance in the prompt, never a review/send gate.
  const patterns: [RegExp, string][] = [
    [
      /niniejszym zgłaszam|pragnę wyrazić zainteresowanie|zwracam się z uprzejmą prośbą|w odpowiedzi na państwa zaproszenie|chciałbym zgłosić zainteresowanie/iu,
      'FORMAL: uprość formalne otwarcie.',
    ],
    [
      /to konkretny punkt wspólny|bezpośrednio związane z tematyką|do tego drugiego obszaru nawiązuje|w ramach regularnej współpracy z państwa zespołem/iu,
      'META: usuń tłumaczenie oczywistości dopasowania.',
    ],
    // Necessary truth qualifications and redundant disclaimers need context, not a regex verdict.
    [
      /czy potrzebują państwo pomocy|chętnie porozmawiam o pomocy przy podobnych zadaniach/iu,
      'SALES_CTA: zastąp sprzedaż usług pytaniem o regularną współpracę.',
    ],
    [
      /mogę (?:opowiedzieć więcej|zademonstrować rozwiązanie)|chętnie pokażę projekt/iu,
      'PROJECT_PRESENTATION: usuń dodatkową propozycję prezentacji.',
    ],
    [
      /odpowiada mi dostępna w ofercie umowa zlecenie/iu,
      'CONTRACT_STYLE: forma współpracy na umowę zlecenie również mi odpowiada.',
    ],
  ];
  for (const [pattern, issue] of patterns) if (hasPositiveClaim(pattern, body)) issues.push(issue);
  if ((draft.body.match(/\?/g) ?? []).length > 1)
    issues.push('CTA: pozostaw jedno pytanie wynikające z celu kontaktu.');
  const sentences = draft.body
    .split(/[.!?\n]+/)
    .map((s: string) => compact(s))
    .filter((s: string) => s.length > 25);
  if (new Set(sentences).size < sentences.length)
    issues.push('REPETITION: wiadomość powtarza tę samą informację.');
  // Count requests, including indirect questions ending in a period. A statement of
  // the candidate's goal ("szukam pracy") is not itself a request to the recipient.
  const requests = sentences.filter((s: string) =>
    /(?:\bczy\b|\b(?:pytam|zapytam|zapytać|pytaniem|proszę)\b).{0,160}(?:współprac|współpracy|rozważ|otwarci|możliwość|odpowiedni|odpowiada|dostępność|wymiar|godziny pracy)|\bproszę o (?:informację|rozważenie).{0,100}(?:współprac|kandydatur)/iu.test(
      s,
    ),
  );
  if (requests.length > 1)
    issues.push('REPEATED_REQUEST: prośba o współpracę lub jej warunki występuje więcej niż raz.');
  if ((body.match(/(?:około|ok\.)\s*\d+(?:\s*[–-]\s*\d+)?\s*(?:godzin|h\b)/g) ?? []).length > 1)
    issues.push('REPETITION: dostępność jest podana więcej niż raz.');
  const contractKnown =
    analysis &&
    messageContactType(analysis) === 'ACTIVE_JOB' &&
    analysis.conditions.contract.value === 'yes' &&
    /zleceni[aeu]/iu.test(analysis.conditions.contract.quote ?? '');
  if (/umow.{0,12}zleceni/iu.test(body) && !contractKnown)
    issues.push('CONTRACT_CONTEXT: forma umowy nie jest potwierdzona w aktywnej ofercie.');
  return issues;
}
export function checkAvailability(draft: Row, profile: Row) {
  // Company hours are source facts, not a declaration of the candidate's availability.
  let text = draft.body;
  for (const claim of draft.claims ?? [])
    if (claim.kind === 'COMPANY') text = text.replace(claim.text, '');
  const ranges = /\b(\d{1,3})\s*[–—-]\s*(\d{1,3})\s*(?:godzin|godz\.?|h)(?=$|[\s.,;!?/])/giu;
  const found = [...text.matchAll(ranges)];
  const singles = [
    ...text.replace(ranges, '').matchAll(/\b(\d{1,3})\s*(?:godzin|godz\.?|h)(?=$|[\s.,;!?/])/giu),
  ];
  const incorrect =
    profile.availabilityMode === 'APPROX'
      ? found.length > 0 ||
        singles.some((m) => Number(m[1]) !== profile.hoursApprox) ||
        /(?:maksymalnie|maks\.?|nie więcej niż|do)\s*\d+\s*(?:godzin|godz\.?|h\b)/iu.test(text)
      : found.some((m) => Number(m[1]) !== profile.hoursMin || Number(m[2]) !== profile.hoursMax) ||
        singles.length > 0;
  if (incorrect)
    throw new DomainError(
      'UNSUPPORTED_CLAIM',
      'Godziny nie zgadzają się z zatwierdzonym profilem.',
    );
}
