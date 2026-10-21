# Znane problemy i granice dowodów — 18 października 2026

Bieżący etap: [R1–R13 i nightflow](reviews/WINDOWS_NIGHTFLOW_IMPLEMENTATION.md).
Status rzeczywistego hosta: **WIP / NIEWERYFIKOWANE_UTRZYMANIE_HOSTA**.
Aktualizacja 21.10.2026: R14 i kontrakt niepotwierdzonego Stop opisano w
[NIGHTFLOW_CONTROL](NIGHTFLOW_CONTROL.md), fixture i ograniczenie hosta w
[NIGHTFLOW_HOST_FIXTURE](NIGHTFLOW_HOST_FIXTURE.md). Nowy wynik kodu:
[raport R14](reviews/JOBHUNTER_R14_CI_HOST_WYNIK.md).
Pierwszy CI zachowuje **FAILURE** (39171469775 / 117805244708), 720/721 backend.
Przegląd c03161ba odczytał log: test procesu nightflow CLI, status null wobec 0,
30034,9529 ms przy spawnSync timeout 30000. Szczegółowej przyczyny fazy nie
ustalono; nie jest to błąd benchmarku Stop. Dawne UNKNOWN_LOGS_UNAVAILABLE
jest nieaktualne. Bazowy c03161ba ma osobny CI PASS (39173019427), potwierdzony
także publicznym API 21.10; sama zmiana dokumentacji nie naprawiała timeoutu.
Nowe pomiary i bounded diagnostyka asynchronicznego nadzoru są w raporcie R14.
Lokalny check R14 przed CI 39572278361 miał PASS: 761 backend / 12 Stop / 26 UI. Nie
odtworzono timeoutu CLI; szczegółowej dawnej przyczyny nie uznano za naprawioną
na podstawie samego PASS. Host public entry i jego 8 h nadal HOST_TEST_NOT_RUN.
Poprawki oraz testy syntetyczne nie aktualizują prywatnej instalacji.

Późniejszy CI dla `1b9f0deda6e6cb032c22f6d49764d8aa3bc6fe02`, run
39572278361: **FAILURE 760/761**. Artefakt dostarczony przez użytkownika
potwierdził błąd nowego testu deadline 1 ms: SIGTERM po 2032,3175 ms przy
SERVICE_READY, bez cleanup. Nie był to ponowny timeout głównego lifecycle 30 s.
Poprawiono handshake anulowania i sprawdzanie sygnału podczas inicjalizacji;
test rozróżnia łagodne zakończenie od pozostawionej blokady po hard kill.
Siedem celowanych regresji PASS obejmuje też ochronę żywego właściciela i
odzyskanie po potwierdzonym ESRCH. Produkcyjny lock i jego ochrona bez zmian.
Nowy pełny Windows check po naprawie ma PASS: 765/765 backend, 12/12 Stop,
typecheck/build i 26/26 UI; 224 identyczne pliki, 823097,7617 ms. Nowy CI
jest osobno rejestrowany dla finalnego SHA; wcześniejszy FAIL pozostaje.
Otwarte pozostają: produkcyjne ustawienia/zgoda planu, rozstrzygnięcie dawnego
PAUSED po backupie, kontrolowana aktualizacja, faktyczne odnowienie biblioteki,
utrzymanie prawdziwego hosta Codexa przez osiem godzin i osobno autoryzowany pilot.
Nieznana historyczna przyczyna Linux Stop 1154 ms pozostaje historyczna;
wsparcie tego wydania i obowiązkowy CI obejmują Windows. Nie certyfikujemy macOS.
Poniżej zachowano wcześniejsze zgłoszenia, nie twierdzenie, że nowych napraw brak.

Nowy pakiet informacji nie naprawia usterek rdzenia. Aktualna
[macierz R1–R12](REVIEW_FINDINGS.md) zachowuje ustalenia przeglądu, w tym guard,
kontekst kontaktów/odesłań, refresh/Start, wyścig wykonawcy, deferred, nakładające
się partie, schemat 20, WAL preflight, filtry, npm na CI i opóźnienie Stop.
[CODEX_OPERATION](CODEX_OPERATION.md) rozdziela nowe wymaganie nocnej sekwencji
od istniejącego kodu. Rozszerzony snapshot jest materiałem do przeglądu,
nie dowodem gotowości biblioteki lub wdrożenia.

Historyczny etap implementacji: [CORE_IMPLEMENTATION](CORE_IMPLEMENTATION.md).
Poprawki były wtedy lokalne; poniższa historia nie jest deklaracją wdrożenia.
W tamtym etapie prywatnej kopii nie audytowano, a rzeczywista ciągłość browser nie została
zweryfikowana. Pozostaje osobny przegląd istniejącego checkpointu i pilota.

Aktualne zadania: [TASKS](TASKS.md). Kontekst: [REVIEW_HANDOFF](REVIEW_HANDOFF.md).
Poniżej rozdzielono lokalne poprawki od nadal otwartych operacji i granic dowodów.

## 1. Historyczny fałszywy stop — poprawka w nowym guardzie repo, bez wdrożenia

Historyczna warstwa: doraźny kontroler poza repo, nie sam startDay. W bazowym
`f37afc` natywny `service.ts/findOrCreateCompany` dopuszczał dopisanie domeny, gdy była null,
po rozpoznaniu znanej firmy i dodaniu aliasu. Prywatny guard porównywał
wszystkie stare pola (ID/nazwa/normalized_key/domena/historia/blokada) dokładnie:

```js
// Minimalne odtworzenie warunku, fikcyjne dane. Nie jest nowym guardem.
const before = { id: 'fixture', canonical_name: 'Fixture', primary_domain: null };
const after = { ...before, primary_domain: 'fixture.example.test' };
const oldGuardStops = JSON.stringify(after) !== JSON.stringify(before); // true
```

W sesji 16/17 października potwierdzona domena uzupełniła pustą wartość;
ID/nazwa/historia/blokady bez zmian, mimo tego GUARD_STOP i koniec po 3 h 32 min.
Nie naprawiono tego przez poluzowanie reguł lub zmianę eksportera raportu.

Nowy kontroler i czyste porównanie snapshotów rozpoznają dokładnie
udokumentowane uzupełnienie: wcześniej null, zgodne źródło i alias tej firmy,
niezmienione pozostałe pola i brak kolizji właściciela. Zamiana niepustej domeny,
utrata blokady/aliasu/historii, niepewna tożsamość i brak dowodu nadal zatrzymują.
Nie usuwać primary_domain z kontroli bez warunków. Stary checkpoint wymaga
osobnej jawnej operacji i backupu, nie automatycznego wznowienia.

## 2. Otoczka długich prób — nowy wspólny punkt wejścia w repo

Repo ma natywny mechanizm sesji i jego testy, ale launchery, fingerprinty,
zewnętrzny guard i część audytów ostatnich prób były prywatnymi helperami.
Historycznej próby nie odtworzy się z samego klonu. Nowy `research:session`
i panel korzystają ze wspólnego lifecycle/guarda; parametry i dane pozostają poza repo.
Nie kopiować bez przeglądu helperów z absolutnymi ścieżkami i materiałami.
Nowy standardowy kontroler jest częścią implementacji z 18.10, testowanej na fixture.

## 3. Domena i subdomena — zgłoszenie, tożsamość nierozstrzygnięta

Jedna pozycja otrzymała COMPANY_IDENTITY_CONFLICT wobec wcześniejszej
subdomeny tej samej domeny nadrzędnej. To konserwatywny komunikat kodu,
nie dowód, że są dwie firmy. Sam wspólny root/mailbox też nie dowodzi tożsamości.
Potrzebne oficjalne źródła/operator/aliasy i zachowanie szkiców/blokad;
bez automatycznego merge/delete albo skracania domen dla obejścia zabezpieczeń.
Nazwy i adresy są w prywatnym raporcie, nie w tym repozytorium.

## 4. Aktualność źródeł i czas raportu — zachowanie + poprawiony opis

W chwili stopu ostatniej sesji 2 stare szkice były STALE; w porannym audycie
5, bo trzy przekroczyły 24 h po sesji. Nie zgłaszać tych trzech jako nowych
awarii generowania. Zapisane review PASS nie jest bezterminową kwalifikacją.
Eksporter zachowuje generatedAt; kontrola gotowości musi podać czas oceny.
STOPPED/PAUSED może być sprzątaniem. Opcja --controller-result pozwala jawnie
dołączyć przyczynę tylko zgodnej zakończonej sesji. Nie wnioskuje „brak internetu”.

## 5. Część czasu idzie na znane firmy — do dalszego pomiaru

Ostatnia sesja odwiedziła 96 rekordów, dodała 43, utworzyła 19 szkiców,
odświeżyła 12 starych, użyła 13 w tej samej wersji. Nie wszystko jest nową firmą.
Nowe przeplatanie DISCOVERY/REFRESH/REUSE i pomiary etapów, HTTP/cache/modeli
sprawdzono syntetycznie. Wyniki modeli nadal mogą powracać do znanych podmiotów.
Mierzyć rzeczywisty rozkład czasu, nie zwiększać limitów
kosztem źródeł lub zabezpieczeń. Brak dowodu liniowej wydajności 8/15 h.

## 6. Stop i transporty — ograniczenia oraz niestabilny benchmark

Historycznie performance 11/12 przekroczył próg Stop; odtworzono na starszym
kodzie. Następny pełny check 12/12 przeszedł bez ustalenia przyczyny. Nie
podnosić progów i nie uznawać flakiness za rozwiązany problem na podstawie PASS.
Zdalny POST/kliknięcie po ostatniej bramce nie jest atomowe ze Stop. SEND_UNKNOWN
i brak retry/failover pozostają konieczne. Historia Gmaila też nie ma atomowego
snapshotu z ręczną aktywnością użytkownika. Pełne gwarancje exactly-once nie istnieją.

## 7. Browser executor — ograniczony zakres

Wymaga aktywnego Codexa i zalogowanego UI. Wciąż korzysta z API do celowanego
potwierdzenia; nie zastępuje całej integracji Google. Testowano dwa realne
SELF_TEST i fixture awarii, nie długą kampanię do firm. UI może się zmienić.
Historycznie pętla poll po zamknięciu backendu zwróciła ENOENT po przyjętej
wiadomości. Nowy klient i wykonawca kończą ją kontrolowanym statusem,
zachowując wynik, licznik ukończonych i niepewność. Macierz IPC oraz kontroler
partii z lease są sprawdzone syntetycznie; rzeczywista ciągłość hosta przez
całą partię pozostaje nieweryfikowana. Zamknięcie Codexa kończy wykonawcę.

## 8. Spam — hipotezy, bez ustalonej przyczyny

SPF/DKIM/DMARC/ARC lub poprawny MIME/PDF nie gwarantują Odebranych. Różni
odbiorcy i kolejność nie izolują transportu/wieku/reputacji. Browser 2/2
Odebrane jest małą pozytywną próbą, nie dowodem winy API ani trwałej naprawy.
Nie zmieniać stylu/faktów/nadawcy/OAuth lub tempa na podstawie przypuszczeń.

## 9. Niewykonane funkcje i testy

Zamknięta partia biblioteki jest lokalnie zaimplementowana i testowana na
fikcyjnych providerach. Niewykonane pozostają: jej wdrożenie i rzeczywista
ciągłość browser, audyt prywatnej kopii, adaptery ofert/formularzy,
kwalifikacja zleceń, realny pilot do firm, długa produkcyjna wysyłka,
pełna izolacja procesu OS, nowy realny macOS transportu browser oraz pełna
macierz awarii PRIVATE_GIT. Nie są potwierdzone przez samą symulację lub build.
