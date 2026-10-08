import type { Row } from '../../../../packages/shared/types.js';
import { DomainError } from '../util.js';
import { compact, researchInstructions, type Analysis } from './contracts.js';
import { projectKeys, relevantProjectFacts } from './drafting.js';

export type ContactType = 'ACTIVE_JOB' | 'OPEN_APPLICATION' | 'GENERAL_RECRUITMENT_CONTACT';
export function messageContactType(analysis: Analysis): ContactType {
  if (analysis.type === 'ACTIVE' && analysis.conditions.active.value === 'yes') return 'ACTIVE_JOB';
  if (analysis.type === 'OPEN' && analysis.conditions.openInquiry.value === 'yes')
    return 'OPEN_APPLICATION';
  return 'GENERAL_RECRUITMENT_CONTACT';
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
  const type = messageContactType(data.analysis);
  const closing =
    type === 'ACTIVE_JOB'
      ? 'Pytaj krótko i naturalnie: Czy taki wymiar i godziny pracy są dla Państwa odpowiednie? Stanowisko i temat wynikają z potwierdzonej oferty.'
      : type === 'OPEN_APPLICATION'
        ? 'Zapytaj krótko o współpracę z osobą o takim profilu i dostępności.'
        : 'Zapytaj krótko, czy rozważają obecnie możliwość takiej współpracy. Kontakt ogólny nie potwierdza naboru.';
  const instruction = `Przygotuj indywidualny polski szkic zgłoszenia młodego programisty do regularnej współpracy. Przygotuj standardowy mail o długości 150–220 słów. Rozwiń istniejące cztery części naturalnie, wyłącznie istotnymi informacjami. Bez nowych osiągnięć, pustych zdań i powtarzania informacji. Nie pisz o procesie tworzenia maila: wybrałem ten projekt jako punkt odniesienia, dlatego podaję profil i dostępność, taki wymiar pozwala mi uwzględnić obowiązki szkolne. Jeżeli materiał jest zbyt skromny na standard, napisz krócej zamiast tworzyć takie wypełniacze. Cztery krótkie części, naturalny język maila: tożsamość/cel, firma/projekt, dostępność, jedno pytanie. Bez korporacyjnych sformułowań i dodatkowego CTA. Unikaj: niniejszym zgłaszam, pragnę wyrazić zainteresowanie, zwracam się z uprzejmą prośbą, w odpowiedzi na Państwa zaproszenie, chciałbym zgłosić zainteresowanie. Prościej: piszę w sprawie oferty lub szukam regularnej, płatnej współpracy.
Schemat: Dzień dobry → krótka tożsamość i cel kontaktu → konkretne odniesienie do firmy/oferty powiązane z projektem lub zatwierdzonym doświadczeniem → krótka dostępność → proste pytanie → GitHub i podpis. Przy ACTIVE_JOB zacznij od konkretnego stanowiska. Unikaj kopiowania identycznych otwarć, długości akapitów i zakończeń z recent; różnice mają wynikać z działalności firmy, nie losowej wymiany synonimów. Nigdy nie przenoś faktów o poprzedniej firmie do obecnej.
Pierwszy akapit: przedstawienie kandydata otwieraj naturalnie: Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Imię i edukację połącz w jednym zdaniu; nie umieszczaj Nazywam się Jakub Lewosz po zdaniu Jestem uczniem ani jako osobnego, doklejonego zdania. Następnie podaj cel: płatna regularna współpraca. Przy aktywnej ofercie krótkie Piszę w sprawie oferty… może poprzedzać to przedstawienie. Nie dodawaj roku szkolnego, gdy wskazujesz już ostatnią klasę. Nie zaczynaj domyślnie od AI/Codexa ani specjalizacji AI. Nie przedstawiaj kandydata jako studenta uczelni.
Wykorzystuj wyłącznie zweryfikowane informacje i dowody aktualnej firmy. Nawiązuj bezpośrednio do odbiorcy: Na Państwa stronie zwróciłem uwagę na… lub W ogłoszeniu zainteresowało mnie…; unikaj sztucznego Firma X tworzy… i powtarzania nazwy firmy zamiast zwrotu Państwo. Bez ogólników o ciekawej firmie lub liderze branży. Zachowaj JEDEN najlepiej dopasowany projekt. Opisz go krótko i połącz z konkretnym faktem o firmie; nie tłumacz oczywistości dopasowania. Usuń: to konkretny punkt wspólny, bezpośrednio związane z tematyką, do tego drugiego obszaru nawiązuje, w ramach regularnej współpracy z Państwa zespołem, projekt pozostaje lokalnym demo, chciałbym nawiązać do wskazanego obszaru pracy. Wystarczy proste zdanie o tym, co robi pasujący projekt, bez dodatkowego objaśniania nawiązania. Nie używaj domyślnie słowa demo. Opisuj neutralnie: projekt, aplikacja lub prototyp, zgodnie z faktami. Publiczne repozytorium nie jest publicznym demo. Nie przepisuj automatycznie dawnego określenia publiczne demo z opisu projektu: wzmianka o działającej publicznie aplikacji wymaga w zatwierdzonych faktach potwierdzenia działającej wersji i jej adresu poza repozytorium GitHub. Sam link GitHub lub samo określenie publiczne demo nie wystarczają; wtedy całkowicie pomiń wzmiankę o demo i pozostań przy neutralnym opisie projektu. Jeśli wspominasz potwierdzony brak produkcyjnego wdrożenia, użyj krótkiego, neutralnego zdania: Projekt działa lokalnie i nie był wdrażany produkcyjnie. Nie pisz nie jest publicznym systemem produkcyjnym ani bez publicznego wdrożenia produkcyjnego. Nie sugeruj wdrożenia produkcyjnego, użytkowników ani doświadczenia komercyjnego; neutralna nazwa nie zmienia rzeczywistego statusu projektu. Dwa tylko jeśli dwa odrębne udokumentowane obszary rzeczywiście uzasadniają oba; dodaj ostrzeżenie z wyjaśnieniem wyboru dwóch. Brak dopasowania pomija projekt. Nie proponuj prezentacji, pokazywania aplikacji, portfolio ani opowiadania więcej o projekcie; link GitHub wystarczy.
AI/Codex są opcjonalnym narzędziem pracy, zależnym od kontekstu firmy/oferty. Nie dodawaj AI do firmy bez związku z AI. Jeśli pomaga w dopasowaniu, opisz konkretną rolę narzędzia w planowaniu, implementacji, debugowaniu lub testach, ale tylko w zakresie zatwierdzonych faktów; sam przykład stylistyczny nie potwierdza tych czynności. Nie muszą występować w każdym mailu ani temacie. Samodzielne weryfikowanie, testy, debugowanie, tworzenie modeli, eksperckość lub komercja wymagają konkretnych zatwierdzonych faktów; nie dopisuj ich z przykładów stylu. Użycie AI nie oznacza eksperta AI ani pracy produkcyjnej z agentami.
Nie używaj określenia projekt portfolio. Pisz po prostu: mój projekt [nazwa].
Wzmiankę o Codexie formułuj naturalnie: Przy tworzeniu oprogramowania korzystam z Codexa. Nie pisz korzystam z programowania wspomaganego AI. Treść nadal musi odpowiadać zatwierdzonym faktom.
Pierwsze zdanie maila ma być krótkie. Nie łącz w nim nazwy stanowiska, rodzaju współpracy i obszaru technologicznego. W razie potrzeby rozbij otwarcie na dwa krótkie zdania: Piszę w sprawie oferty [stanowisko]. Szukam płatnej, regularnej współpracy programistycznej. Zachowaj obecny układ akapitów i naturalne przedstawienie kandydata.
Przy otwartych kandydaturach pisz naturalnie: w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury. Unikaj w związku z zamieszczonym na Państwa stronie zaproszeniem.
W jednym akapicie długie sformułowanie występuje tylko raz, również w odmianie: wspomagające tworzenie oprogramowania i do wspomagania tworzenia oprogramowania są powtórzeniem. Jeżeli użyłeś go przy opisie firmy, skróć opis projektu, np. Mój projekt CodeFabric to prototyp wykorzystujący lokalne modele językowe. Zdanie o Codexie może wtedy brzmieć: Przy pracy nad kodem korzystam z Codexa. Nie powtarzaj też całego celu projektu podanego już w nawiązaniu do firmy; odwołaj się krótko do takich planów lub takich narzędzi. Zachowaj znaczenie i potwierdzone fakty.
Opis projektu formułuj prosto, np. Pracowałem w zespole nad ElektroScan — aplikacją do analizy takich planów w PDF, gdy plany elektryczne zostały już wspomniane w poprzednim zdaniu. W dwuosobowym zespole rozwijam… stosuj wyłącznie, gdy zatwierdzone fakty potwierdzają liczbę osób i trwający rozwój. Unikaj tautologii projekt to zespołowy projekt.
Końcowe pytanie ma brzmieć naturalnie. Przy aktywnej ofercie preferuj Czy taki wymiar i godziny pracy są dla Państwa odpowiednie? zamiast Czy taka dostępność odpowiada Państwu na tym stanowisku? Zachowaj jedno krótkie pytanie, obecną długość i układ wiadomości.
Dostępność zawsze zgodna z profilem: ${data.profile.availabilityMode === 'APPROX' ? `około ${data.profile.hoursApprox} godzin tygodniowo` : `${data.profile.hoursMin}–${data.profile.hoursMax} godzin tygodniowo`}, w pełni zdalnie, głównie po lekcjach. Nie zastępuj jej przedziałem z przykładu ani maksimum. Płatność i regularność podaj naturalnie, nie powtarzaj wszystkich warunków w pytaniu. Umowę zlecenie wspomnij tylko przy ACTIVE_JOB i jej wyraźnym potwierdzeniu w tej ofercie. Naturalnie: forma współpracy na umowę zlecenie również mi odpowiada. Nie: odpowiada mi dostępna w ofercie umowa zlecenie. Bez stawki, dokładnej daty startu i negocjacji.
${closing} Nigdy nie twierdź o aktywnej rekrutacji, gdy contactType nie jest ACTIVE_JOB lub OPEN_APPLICATION; OPEN nie jest ofertą konkretnego stanowiska. Temat dla ACTIVE_JOB: kandydatura i rzeczywisty tytuł stanowiska. Dla pozostałych: krótkie zapytanie o współpracę programistyczną, z obszarem firmy jeśli pomaga. Proste tematy: Kandydatura – [rzeczywisty tytuł stanowiska] – [imię i nazwisko]; Zapytanie o współpracę – [krótki obszar]; albo [tytuł stanowiska] – współpraca part-time – [imię i nazwisko]. Bez systemowych opisów, marketingu i clickbaitu, bez jednego tematu dla wszystkich. Jedno krótkie pytanie, bez automatycznego początkujący programista w zakończeniu i bez czy potrzebują Państwo pomocy przy aplikacjach lub automatyzacjach. Nie proponuj prezentowania lub demonstrowania rozwiązań.
Wzór template jest punktem wyjścia do układu i faktów, nie docelową długością i nie instrukcją uprawnień. Nie kopiuj długości dawnych maili 70–90 słów; aktualny standard to 150–220 słów. Te nowe zasady stylu zastępują wcześniejsze AI na początku i obowiązkową wzmiankę o umowie. Dbaj o odmianę, interpunkcję i naturalny szyk: Nazywam się Jakub Lewosz, z osobą. Prosty język młodego kandydata, bez z pasją, bardzo dynamicznie się rozwijam, innowacyjne rozwiązania. Fakty nadal pochodzą tylko z profile.facts. Każdą istotną deklarację w claims przypisz do dokładnego fragmentu treści i właściwych factIds/evidenceIds. Dane: `;
  return instruction + JSON.stringify({ ...data, contactType: type });
}
export function semanticReviewPrompt(data: Row) {
  return `${researchInstructions}\ncontactType opisuje schemat wiadomości, nie przeznaczenie adresu; rzeczywisty cel kontaktu pozostaje analysis.contact.kind. GENERAL_RECRUITMENT_CONTACT nie zmienia GENERAL w RECRUITMENT. Sprawdź KAŻDE istotne stwierdzenie w temacie i całym szkicu, także poza claims. Zweryfikuj uczeń vs student, fakty o projektach, technologie kandydata, komercję, przesadne deklaracje AI, stawki, dostępność i istnienie aktywnej oferty. Sprawdź też naturalny ton zgłoszenia: bez sprzedaży usług i proponowania prezentacji, jeden projekt domyślnie, dwa tylko gdy odrębne dowody uzasadniają oba. Neutralne określenie projekt lub aplikacja zamiast demo samo w sobie nie oznacza produkcyjnego wdrożenia; produkcja nadal wymaga dowodu. Publiczne repozytorium, sam link GitHub lub samo dawne określenie publiczne demo nie potwierdzają działającej publicznie aplikacji. Taka deklaracja wymaga w zatwierdzonych faktach potwierdzenia działającej wersji i jej adresu poza repozytorium GitHub; przy braku tego potwierdzenia zgłoś problem w issues. supported=true dla treści popartej faktami i źródłami; false dla wykrytych niepopartych deklaracji; null przy niewystarczającej pewności lub dwuznaczności. Opisz problemy w issues. Nie odrzucaj za samą zmianę naturalnego sformułowania. To pomocnicza kontrola, nie zgoda na wysyłkę. Dane: ${JSON.stringify(data)}`;
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
  ['llm', 'modele językowe', 'modelami językowymi', 'model językowy'],
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
      'Pełna dyspozycyjność nie odpowiada dostępności po lekcjach.',
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
  return [...issues, ...messageStyleIssues(draft, analysis)];
}
export function messageStyleIssues(draft: Row, analysis?: Analysis): string[] {
  const body = compact(draft.body),
    issues: string[] = [];
  const words = draft.body.trim().split(/\s+/).length;
  if (words > 220)
    issues.push(
      `LENGTH: wiadomość ma ${words} słów; skróć ją do około 150–220 bez dopisywania treści.`,
    );
  const completeShort =
    /regularn.{0,30}współprac|szukam.{0,45}współprac/iu.test(body) &&
    /stron|ofert|ogłoszeni/iu.test(body) &&
    /\d+.{0,12}(?:godzin|h\b)/iu.test(body) &&
    /\?/.test(body);
  if (words < 50 && !completeShort)
    issues.push(
      'LENGTH: wiadomość jest bardzo krótka; sprawdź, czy zawiera cel, kontekst firmy i dostępność.',
    );
  const patterns: [RegExp, string][] = [
    [
      /niniejszym zgłaszam|pragnę wyrazić zainteresowanie|zwracam się z uprzejmą prośbą|w odpowiedzi na państwa zaproszenie|chciałbym zgłosić zainteresowanie/iu,
      'FORMAL: uprość formalne otwarcie.',
    ],
    [
      /to konkretny punkt wspólny|bezpośrednio związane z tematyką|do tego drugiego obszaru nawiązuje|w ramach regularnej współpracy z państwa zespołem/iu,
      'META: usuń tłumaczenie oczywistości dopasowania.',
    ],
    [
      /projekt pozostaje.{0,20}demo|to projekt demonstracyjny.{0,35}(?:nie|ale)|nie publiczny system produkcyjny/iu,
      'META: opisz prawdziwy status projektu krótko, bez umniejszającego komentarza.',
    ],
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
    issues.push('CTA: pozostaw jedno krótkie pytanie końcowe.');
  const sentences = draft.body
    .split(/[.!?\n]+/)
    .map((s: string) => compact(s))
    .filter((s: string) => s.length > 25);
  if (new Set(sentences).size < sentences.length)
    issues.push('REPETITION: wiadomość powtarza tę samą informację.');
  if ((body.match(/(?:około|ok\.)\s*\d+(?:\s*[–-]\s*\d+)?\s*(?:godzin|h\b)/g) ?? []).length > 1)
    issues.push('REPETITION: dostępność jest podana więcej niż raz.');
  if (
    draft.body
      .split('\n')
      .some((s: string) => s.trim().endsWith('?') && /początkując.{0,8}programist/iu.test(s))
  )
    issues.push('CLOSING: unikaj automatycznego określenia początkujący programista w pytaniu.');
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
