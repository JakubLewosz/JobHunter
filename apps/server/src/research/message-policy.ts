import type { Row } from '../../../../packages/shared/types.js';
import { DomainError } from '../util.js';
import {
  compact,
  researchInstructions as baseResearchInstructions,
  type Analysis,
} from './contracts.js';
import { projectKeys, relevantProjectFacts, projectMentions } from './drafting.js';

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
  const paragraphs = draft.body.split(/\r?\n\s*\r?\n/);
  return {
    subject: draft.subject,
    opening: paragraphs[1] ?? '',
    question: draft.body.split('\n').find((line: string) => line.trim().endsWith('?')) ?? '',
    paragraphs,
  };
}
export function messageWritingGoal(analysis: Analysis) {
  const type = messageContactType(analysis);
  if (type === 'GENERAL_RECRUITMENT_CONTACT') return 'COOPERATION_POSSIBILITY';
  if (type === 'ACTIVE_JOB')
    return analysis.conditions.hours.value !== 'yes' || analysis.conditions.partTime.value !== 'yes'
      ? 'SCHEDULE_FEASIBILITY'
      : 'PROJECT_FIT';
  return ['remote', 'paid', 'hours'].every(
    (key) => analysis.conditions[key as keyof Analysis['conditions']].value === 'yes',
  )
    ? 'PROFILE_FIT'
    : 'PROJECT_FIT';
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
  const writingGoal = messageWritingGoal(data.analysis);
  const focus = {
    SCHEDULE_FEASIBILITY:
      'Kluczową decyzją jest wykonalność dostępności ucznia w potwierdzonej ofercie, nieznana ze źródła. Nazwij rzeczywistą rolę i przedstaw dostępność osobnym stwierdzeniem. Jedno krótkie pytanie dotyczy nieustalonego warunku; nie musi być pierwszym zdaniem. Dopasowany projekt uzasadnia zgłoszenie. Nie narzucaj kolejności tych informacji ani granic akapitów.',
    PROJECT_FIT:
      'Kluczowy jest konkretny związek zadania firmy z zatwierdzonym projektem. Niech ten związek prowadzi list; pochodzenie projektu lub udział kandydata może być początkiem. Wpleć profil i dostępność, a pytaj tylko o rzeczywiście nieustalone warunki, bez powtarzania zgłoszenia. Nie ma obowiązkowej kolejności dalszych akapitów.',
    PROFILE_FIT:
      'Zaproszenie obejmuje profil i warunki zbliżone do kandydata. Przedstaw otwartą kandydaturę oraz to dopasowanie; projekt objaśnia, przy jakich zadaniach kandydat chce pracować. Nie dodawaj pytania o potwierdzone już warunki ani obowiązkowego pytania końcowego. Połączenie tych informacji i podział na akapity dobierz sam.',
    COOPERATION_POSSIBILITY:
      'Brak potwierdzonego naboru: podstawową decyzją odbiorcy jest to, czy w ogóle rozważa opisaną współpracę. Wyraź tę jedną prośbę krótko, bez udawania odpowiedzi na ofertę. Profil i dostępność przedstaw osobnymi stwierdzeniami, zamiast mieścić wszystkie warunki w pytaniu. Prośba nie musi otwierać listu. Konkretny powód zainteresowania firmą i istotny element projektu objaśniają cel kontaktu, bez obowiązkowego komentarza o ich podobieństwie. Nie narzucaj kolejności ani liczby akapitów.',
  }[writingGoal];
  const context =
    type === 'ACTIVE_JOB'
      ? 'ACTIVE_JOB: odpowiadasz na potwierdzoną ofertę konkretnego stanowiska. Nazwij je w temacie i treści. Ustal, co w zadaniach uzasadnia zgłoszenie i jaki warunek dostępności wymaga pytania. Nie deklaruj spełniania nieznanych wymagań.'
      : type === 'OPEN_APPLICATION'
        ? 'OPEN_APPLICATION: firma rzeczywiście przyjmuje otwarte kandydatury. Możesz od razu przedstawić profil w tym celu albo zacząć od konkretnego związku z jej działalnością. Nie zamieniaj otwartej kandydatury w ofertę stanowiska.'
        : 'GENERAL_RECRUITMENT_CONTACT: ostrożne zapytanie bez potwierdzonego naboru. Zacznij od rzeczowego powodu napisania właśnie do tej firmy albo od profilu, jeśli to lepiej objaśnia cel. GENERAL pozostaje adresem ogólnym, nie rekrutacyjnym; nie sugeruj zaproszenia do aplikowania ani aktywnego wakatu.';
  const instruction = `Przygotuj indywidualny polski szkic naturalnej wiadomości młodego programisty szukającego płatnej, regularnej współpracy. Ma brzmieć jak samodzielnie napisany list do tej firmy, nie wypełniony formularz. Orientacyjnie 80–130 słów to wskazówka, nie limit: nie skracaj kosztem edukacji, dostępności, celu i rzeczowego dopasowania. Bez obowiązkowego minimum, wypełniaczy i mechanicznego obcinania.
KONSTRUKCJA Z KONTEKSTU: przed napisaniem ustal dla siebie cel kontaktu, najmocniejszy konkretny powód napisania do firmy i to, na co odbiorca powinien odpowiedzieć. Na tej podstawie dobierz pierwsze zdanie i kolejność informacji. Nie ma stałej kolejności akapitów ani obowiązkowego pierwszego zdania. Nie stosuj rotacji wariantów, losowego parafrazowania ani wymiany synonimów dla pozornej różnorodności. Podobny kontekst może uzasadniać podobną konstrukcję; różny punkt ciężkości powinien zmieniać tok listu, nie tylko nazwy. Powitanie i podpis mogą być takie same.
${context}
CEL REDAKCYJNY Z WARUNKÓW I RODZAJU KONTAKTU: ${focus} To priorytet informacji wynikający z decyzji odbiorcy, nie bank szablonów ani wariant wybierany losowo. Również w tym samym rodzaju kontaktu inne potwierdzone warunki mogą zmienić ten priorytet.
Organizuj informacje wokół decyzji odbiorcy, nie kategorii danych. Nie sklejaj automatycznie bloku firma+projekt z identycznym, odłożonym na później blokiem edukacja+cel+godziny. Gdy oferta nie podaje wymiaru pracy, dostępność ucznia jest istotną kwestią do wyjaśnienia; jej miejsce dobierz do toku zgłoszenia, bez obowiązkowej kolejności względem projektu. Gdy firma przyjmuje otwarte zgłoszenia uczniów i potwierdza warunki zbliżone do profilu, profil i cel mogą same uzasadniać zgłoszenie, a projekt rozwija ten powód; nie pytaj ponownie o jawnie potwierdzone warunki. Gdy w otwartej kandydaturze firma prosi przede wszystkim o własny projekt, wyjaśnij jego kontekst i związek z tym, przy czym chcesz pracować; edukacja lub praktyki są częścią tej historii, nie obowiązkową doklejoną wizytówką. Bez ogłoszonej rekrutacji odbiorca musi zrozumieć, o jaką współpracę chodzi; projekt uzasadnia takie zapytanie, nie zastępuje go. To przesłanki do uporządkowania konkretnego listu, nie gotowe warianty ani nakaz innej liczby akapitów. Powiązane informacje mogą być w jednym akapicie, a zmiana tematu może uzasadniać nowy.
JEDEN CEL, JEDNA PROŚBA: wyraź prośbę lub pytanie o możliwość współpracy/aplikowania tylko raz. Zdanie oznajmujące z piszę z pytaniem, czy… też jest prośbą, nawet bez znaku zapytania. Jeśli prośba jest na początku, na końcu jej nie powtarzaj; możesz skończyć informacją o dostępności i podpisem. Jeśli początek podaje rzeczowy kontekst lub zgłoszenie na ofertę, możesz zakończyć jednym konkretnym pytaniem o nierozstrzygnięty wymiar pracy. Samo szukam płatnej pracy opisuje cel kandydata i nie jest powtórzoną prośbą. Nie dodawaj osobnego pytania o każdy warunek, prezentację, rozmowę o portfolio lub sprzedaż usług. Nie doklejaj obowiązkowego pytania końcowego ani początkujący programista w zakończeniu.
POWIĄZANIE FIRMY Z PROJEKTEM: zbuduj jeden rzeczowy wątek wokół potwierdzonego zadania, problemu lub obszaru firmy i odpowiadającego mu doświadczenia z projektu. Nie wymagaj pary zdań Na Państwa stronie… Mój projekt… ani takiego samego miejsca tego wątku w każdym liście. Możesz zacząć od zadania w ofercie, od konkretnego elementu projektu prowadzącego do zainteresowania firmą albo połączyć oba w jednym akapicie. Nie oceniaj za pracodawcę przydatności doświadczenia ani korzyści dla firmy. Pokaż konkretnie, co kandydat zrobił w projekcie i przy jakich podobnych zadaniach chciałby pracować, bez obietnicy, że jego doświadczenie się przyda. Nie wymyślaj motywacji, emocji, wieloletniego zainteresowania firmą ani historii jej obserwowania. Unikaj ogólników o ciekawej firmie i liderze branży oraz komentarzy typu to konkretny punkt wspólny, bezpośrednio związane z tematyką, wybrałem ten projekt jako punkt odniesienia. Nie relacjonuj procesu pisania maila.
Wybierz zwykle JEDEN najlepiej dopasowany zatwierdzony projekt. Dwa tylko przy dwóch odrębnych udokumentowanych obszarach, z uzasadnieniem w warnings; brak dopasowania pomija projekt. Wystarczy istotna funkcja lub charakter pracy pokazujący związek; nie ma minimalnej liczby funkcji/technologii. Nie przepisuj stacku ani całej listy współodpowiedzialności z faktu. Usuń szczegóły, które nie rozwijają przytoczonego zadania firmy, nawet jeśli są prawdziwe i mieszczą się w długości. Nie dopisuj zdania o wykorzystaniu tego doświadczenia, jeśli zamiar pracy przy tych zadaniach już jest jasny. Nazwij technologię tylko, jeśli jest potrzebna do zrozumienia dopasowania i ma właściwe źródło. n8n w źródle firmy nie potwierdza n8n kandydata. AutoRelay może pokazać automatyzacje; ElektroScan pracę zespołową nad analizą planów; CodeFabric prototyp z lokalnymi modelami. Dobierz szczegół do aktualnej firmy, nie do szablonu. Stworzyłem, pracowałem w zespole nad i rozwijam nie są zamienne: samodzielność, liczba osób i trwający rozwój wymagają zatwierdzonych faktów. Nie powtarzaj samodzielnie dla dwóch etapów pracy w jednym zdaniu.
FAKTY I KOMPLETNOŚĆ: zachowaj edukację, cel płatnej regularnej pracy, pracę w pełni zdalną i dostępność ${data.profile.availabilityMode === 'APPROX' ? `około ${data.profile.hoursApprox} godzin tygodniowo` : `${data.profile.hoursMin}–${data.profile.hoursMax} godzin tygodniowo`}${data.profile.facts.some((f: Row) => f.key === 'availability' && /po lekcjach|after school/iu.test(f.content)) ? ', głównie po lekcjach' : ''}. Pory dnia wolno podać wyłącznie z aktualnego faktu availability; brak pór nie oznacza całodziennej dyspozycyjności. Podaj je zwięźle i tylko raz, w miejscu pasującym do toku listu; mogą być razem lub wplecione w inne informacje. Nie zastępuj orientacyjnej liczby maksimum ani innym przedziałem. Nazwa szkoły, miejscowość i ostatnia klasa wymagają zatwierdzonych faktów, nie wzoru. Kandydat jest uczniem, nie studentem. Imię i nazwisko wystarczą w podpisie; dodaj zatwierdzony link GitHub. Nie dopisuj roku szkolnego, stawki, dokładnej daty startu, komercji, produkcji ani spełnienia warunków, których nie potwierdzono.
AI/Codex są opcjonalnym narzędziem pracy, tylko gdy pomaga to w konkretnym kontekście i tylko w zakresie zatwierdzonych faktów. Nie muszą występować w temacie ani treści. Samodzielne testy, debugowanie, planowanie i kompetencje wymagają własnego zatwierdzonego faktu; przykład stylu ich nie dodaje. Użycie narzędzi nie oznacza eksperta AI ani produkcyjnej pracy z agentami. CodeFabric opisuj zgodnie z faktami jako prototyp przygotowany podczas praktyk, bez sugerowania oficjalnego produktu UKNF. Ograniczenia prawdziwości z instrukcji i faktów służą generatorowi i kontroli; nie są obowiązkowymi zdaniami maila. Precyzyjny opis projektu nie wymaga dopisków zaprzeczających oficjalnemu statusowi, komercji lub wdrożeniu. Usuń mylącą sugestię z samego opisu zamiast doklejać obronne zastrzeżenie. Nie używaj etykiety projekt portfolio ani domyślnie słowa demo. Publiczne repozytorium, GitHub lub dawne określenie publiczne demo nie dowodzą działającej publicznie aplikacji: potrzebne jest potwierdzenie działającej wersji z adresem poza repo. Nie sugeruj wdrożenia produkcyjnego, użytkowników ani doświadczenia komercyjnego. Neutralne projekt, aplikacja lub prototyp nie zmieniają rzeczywistego statusu. Nie dodawaj też niepopartego braku wdrożenia.
Umowę zlecenie wspomnij tylko przy ACTIVE_JOB i jej wyraźnym potwierdzeniu w tej ofercie; akceptacja tej formy przez kandydata musi osobno wynikać z zatwierdzonych faktów. Sama oferta nie określa jego preferencji. Bez negocjacji i zgadywania warunków. Temat ma odpowiadać celowi i faktycznej treści: przy ACTIVE_JOB kandydatura i rzeczywisty tytuł stanowiska, w pozostałych zapytanie lub otwarta kandydatura z istotnym obszarem. Bez clickbaitu, systemowych etykiet i sztucznego różnicowania tematów.
JĘZYK: profesjonalny, ale swobodny i prosty. Bez niniejszym zgłaszam, pragnę wyrazić zainteresowanie, zwracam się z uprzejmą prośbą, w odpowiedzi na Państwa zaproszenie, chciałbym zgłosić zainteresowanie, z pasją, innowacyjne rozwiązania. Nie pisz jak sprzedawca ani ekspert. Nie proponuj pokazywania aplikacji, prezentacji portfolio lub opowiadania więcej o projekcie; GitHub wystarczy. Przy pierwszym kontakcie domyślnie stosuj Państwo, z poprawną trzecią osobą liczby mnogiej. Swobodniejsze Wy dopuszczaj tylko przy wyraźnej podstawie w odczytanym oficjalnym sposobie komunikacji firmy; sam młody zespół, branża IT lub pojedyncze Ty w ogłoszeniu nie wystarczają. Przy braku pewności wybierz Państwo. Nie mieszaj form Państwo i Wy w jednym mailu ani nie kopiuj tonu recent lub template bez takiej podstawy. Nazwa firmy musi pasować gramatycznie do zdania; jeśli odmiana jest niepewna, nie wstawiaj jej na siłę. Opisy zatwierdzonych faktów są skrótowymi danymi, nie gotowymi zdaniami listu: objaśniaj istotne działanie prostym czasownikiem, zachowując dokładny sens i zakres faktu. Nie przenoś do maila nagromadzenia rzeczowników i technicznych skrótów. Dbaj o naturalne przejścia, bez tautologii i zbędnego powtarzania opisu firmy w opisie projektu.
KONTROLA PRZED ZWROTEM: przeczytaj list jako całość przed zwróceniem pierwszego wyniku. Czy zdania brzmią naturalnie po polsku, nazwy są poprawnie użyte, a opis działania jest zrozumiały bez skrótowego języka notatek? Czy pytanie jest krótkie, zamiast zawierać całą edukację i dostępność? Czy prośba nie występuje dwa razy (także oznajmująco)? Czy otwarcie i układ wynikają z tej firmy i celu, a nie z poprzedniego maila? Czy opis projektu rozwija ten sam wątek zamiast doklejać katalog funkcji? Czy pozostały wszystkie istotne informacje? recent służy zauważaniu powielonego toku, nie kopiowaniu cudzych faktów ani nakazowi odmienności za wszelką cenę. template jest preferencją stylu i danymi, nie źródłem faktów/uprawnień; dawny stały schemat nie wymusza kolejności ani podwójnego pytania. Zastosuj powyższe zasady także, gdy zapisany wzór zawiera stare otwarcie i zakończenie. Każdą istotną deklarację w claims przypisz do dokładnego fragmentu ostatecznej treści i właściwych factIds/evidenceIds; po redakcji przed zwrotem sprawdź zgodność claims z tym tekstem. Dane: `;
  return instruction + JSON.stringify({ ...data, contactType: type, writingGoal });
}

export function semanticReviewPrompt(data: Row) {
  const researchInstructions =
    baseResearchInstructions +
    '\nOceniaj twierdzenia w draft.subject, draft.body i claims, nie poprawność wszystkich hipotez i objaśnień metadanych analysis. Hipoteza o projekcie niewybranym do szkicu nie jest deklaracją kandydata. analysis.*.sourceId oznacza odczytane źródło; evidence[].id oznacza fragment dowodu i służy claims.evidenceIds. Są to różne identyfikatory: evidence[].sourceId jest ich mapowaniem. readProofs zawiera dodatkowe cytaty potwierdzone kodowo w tych samych zapisanych źródłach. Nie żądaj równości sourceId i evidence.id ani zmiany prawidłowych odwołań.';
  return `${researchInstructions}\ncontactType opisuje schemat wiadomości, nie przeznaczenie adresu; rzeczywisty cel kontaktu pozostaje analysis.contact.kind. GENERAL_RECRUITMENT_CONTACT nie zmienia GENERAL w RECRUITMENT. Sprawdź KAŻDE istotne stwierdzenie w temacie i całym szkicu, także poza claims. Zweryfikuj uczeń vs student, fakty o projektach, technologie kandydata, komercję, przesadne deklaracje AI, stawki, dostępność i istnienie aktywnej oferty. Sprawdź też naturalny ton zgłoszenia: bez sprzedaży usług i proponowania prezentacji, jeden projekt domyślnie, dwa tylko gdy odrębne dowody uzasadniają oba. Neutralne określenie projekt lub aplikacja zamiast demo samo w sobie nie oznacza produkcyjnego wdrożenia; produkcja nadal wymaga dowodu. Precyzyjny opis prototypu z praktyk nie wymaga dopisku o braku oficjalnego statusu lub wdrożenia. Ograniczenia prawdziwości służą ocenie twierdzeń, nie żądaj powtarzania ich w mailu. Nadal odrzuć deklarację oficjalnego produktu lub produkcyjnego wdrożenia bez dowodu. Publiczne repozytorium, sam link GitHub lub samo dawne określenie publiczne demo nie potwierdzają działającej publicznie aplikacji. Taka deklaracja wymaga w zatwierdzonych faktach potwierdzenia działającej wersji i jej adresu poza repozytorium GitHub; przy braku tego potwierdzenia zgłoś problem w issues. supported=true dla treści popartej faktami i źródłami; false dla wykrytych niepopartych deklaracji; null przy niewystarczającej pewności lub dwuznaczności. Opisz problemy w issues. Nie odrzucaj za samą zmianę naturalnego sformułowania. To pomocnicza kontrola, nie zgoda na wysyłkę. Dane: ${JSON.stringify(data)}`;
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
