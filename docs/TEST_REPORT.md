# Wyniki i zakres weryfikacji — 23 października 2026

## Utrzymanie Computer Use — 24 października 2026

Windows / Node24.19.0: **17/17 nowych regresji PASS**, a rzeczywisty,
syntetyczny przebieg w `cua_repl`: **660529,7027 ms PASS** (11 min 0,53 s),
521 kontroli karty, maksymalny odstęp 4769 ms, bez utraty lease.
Próg 45 s niezmieniony. Stop, release i cleanup potwierdzone; zero AUTO
sessions/batches/outbox/rezerwacji/prób. Poprzednie odłączone próby nie są PASS.
Pełny check/CI i późniejszy preflight mają oddzielne manifesty w dostawie.
[Zakres i ograniczenia](reviews/COMPUTER_USE_LIVENESS.md).

## Kolejność zamkniętej partii — 24 października 2026

Windows x64 / Node24.19.0. Nowa regresja publicznej ścieżki wykazała na
bazowym kodzie faktyczne C/B/A zamiast zatwierdzonego A/B/C. Po poprawce:
**15/15 nowych regresji PASS**, a celowany zestaw AUTO/partii/review/brokera/
restartu: **103/103 PASS, FAIL0, SKIP0, cancel0**, exit 0.
Pełne izolowane `npm run check` na Windows/Node24: **888 backend + 12 Stop
+ 26 UI PASS**, typecheck/build PASS, exit 0; FAIL0/SKIP0/cancel0.
Fingerprint kodu przed/po zgodny. CI dokładnego końcowego SHA jest
rozliczane osobno w dowodach dostawy, bez utożsamiania go z lokalnym PASS.
Początkowe błędy fixture i oczekiwany FAIL bazowego kodu pozostają w dowodach.
Zakres i granice: [CLOSED_BATCH_ORDER](reviews/CLOSED_BATCH_ORDER.md).
Wyłącznie dane fikcyjne; te testy nie uruchamiają rzeczywistego pilota.

## RESEARCH_ONLY → nowa wersja w polityce AUTO → zamknięta partia

Baza d514ea7; Windows x64 / Node24.19.0. Celowane **45/45 PASS, FAIL0, SKIP0**,
w tym 16 nowych przypadków zaczynających od szkiców RESEARCH_ONLY bez scope.
Pełny przebieg publicznych metod zachowuje ID/stare wersje, w fixture również
dokładny temat/tekst, nie tworzy historii/uprawnień/rezerwacji przed zgodą i
Start; wysyła tylko zamknięte trzy fikcyjne pozycje, bez discovery/czwartej firmy.
Sprawdzono powtórzenie, wykluczenie kontaktu, stare źródła, niezatwierdzony
profil/zmieniony PDF, blokadę, wersję/politykę/Stop i utratę właściciela podczas
czytnika oraz review. Scope SQL-em nie służy do budowania poprawnej fixture.

Zachowano pierwsze błędy i poprawę synchronizacji/cleanup nowych fixture;
opis w [raporcie](reviews/JOBHUNTER_EXISTING_DRAFTS_TO_AUTO_RESULT.md).
Pełny Windows check oraz CI końcowego SHA mają osobne check-summary/manifest
i ci-final w dowodach dostawy. Brak rzeczywistego Gmaila/OAuth/pilota,
wdrożenia i zgody na korespondencję; WORKSTATION pozostaje STOPPED.

## Reply-To / ograniczony odczyt Send-As

Baza 22b540007696d6a1650f5f6d441dfc3bac2fc031. Windows x64 / Node24.
Celowane regresje: **46/46 PASS, FAIL0, SKIP0**. Pierwsza seria **45/46**
miała BROWSER_BUSY w nowej fixture IPC: klient użył innego workerId niż
wykonawca, który wcześniej przejął zadanie. Dopasowano fixture do własnego
lease; produkcyjna odmowa i progi Stop pozostały bez zmian.

Zakres: NONE (pominięty/pusty opcjonalny nagłówek), własny/obcy Reply-To,
niepełna odpowiedź, niezweryfikowany alias, główny/domyslny nadawca,
tożsamość/stabilny subject, utrata API, zmiana ustawień lub rewizji, sprzeczność
UI, Stop/cancel podczas obu odczytów, wygaśnięcie przed kliknięciem, brak
synchronizowanego obejścia i ponownego przyznania kliknięcia. Rzeczywiste
wiadomości i poświadczenia nie są fixture. Wynik ograniczonego odczytu
rzeczywistego konta jest wyłącznie lokalny poza Git.

Pełny check Windows i CI dokładnego końcowego SHA mają osobne logi oraz
check-summary/ci-final w dowodach dostawy. Wcześniejszy check nie jest
wynikiem tego diffu. R1–R15, limity, historia, Node24/lekki adapter i lifecycle
hosta pozostają; nie powtarzamy testu ośmiogodzinnego.

## Jedno konto / Computer Use / pomocnicze API

Nowy etap od bazy 4cd344e: Windows x64, Node24.19.0/npm11.17.0.
Pierwszy pełny lokalny check 808e9fa: PASS 806/806 backend, 12/12 Stop,
26/26 UI, typecheck/build, exit0 (1076874,4052 ms). CI tego SHA zachowuje
FAIL 805/806 backend / CONTROL_TIMEOUT w teście waiting-owner. Test wysyłał
status bez bariery po starcie, podczas pracy fixture. Dodano jawną barierę
WAITING_WINDOW, wyłączono discovery w tym teście kontroli i zamrożono czas
fixture poza oknem wysyłki; deadline IPC5 s i progi Stop niezmienione.
Nie uznano na tej podstawie wydajności produkcyjnego ownera za wyjaśnioną.
Końcowe wykonanie po poprawce ma oddzielny log/SHA/CI w dowodach dostawy.

Typecheck i celowane regresje: **99/99 PASS**; po dodaniu pełnego readonly
przebiegu i zachowania niepustej historii: **29/29 PASS**. Serie częściowo
pokrywają się. Pierwszy FAIL komunikatu i cztery błędy cleanup nowych fixture
zachowano; poprawiono prefiks błędu i kolejność zamknięcia SQLite przed usuwaniem
katalogu. Nie osłabiono bramek lub progów Stop.

Pełny `npm run check` ma osobny, izolowany HOME/USERPROFILE/APPDATA/LOCALAPPDATA,
TEMP i katalog danych oraz komplet fikcyjnych providerów. Dokładny wynik,
liczniki i exit code są w `evidence/check-summary.json` i pełnym syntetycznym
logu dostawy. `evidence/ci-final.json` wiąże CI z finalnym SHA; nie zastępujemy
go wynikiem wcześniejszego commitu. Manifest testowanych źródeł i weryfikacja
ponownego wypakowania ZIP wiążą rzeczywiste bajty kodu z dowodami.

Zmieniono kontrolę konta/OAuth i końcową obserwację UI, bez lifecycle ownera
Node24/adaptera R15; testu ośmiogodzinnego nie powtarzamy. Rzeczywisty Gmail,
konto karty, scope i przygotowanie WORKSTATION mają oddzielny prywatny wynik,
bez korespondencji lub rzeczywistej wysyłki. Nowe testy syntetyczne nie są
zgodą na SELF_TEST/pilota. [Raport techniczny](reviews/JOBHUNTER_SINGLE_ACCOUNT_TECHNICAL.md).

## Pierwsze rzeczywiste odnowienie — 23.10.2026

Kod wdrożony i załadowany: **5adc8c31bee86bd60f86dd01a0a8bbe74121104b** (baza 1ec973a). Nowe wejście odnowienia i minimalny kontekst starej wiadomości: **7/7 celowanych PASS**. Końcowy pełny Windows npm run check: **794/794 backend, 12/12 Stop, 26/26 UI, typecheck/build PASS, exit 0**; 09:50:31.913–10:07:01.919 UTC, 990006.52 ms. Testy miały osobne syntetyczne HOME/data i komplet fikcyjnych providerów. Fingerprint 02267446f301a7c7e19ef5b9763932655e14996bae9d2aa8a6e69e42b89f91e3 bez zmian; 233 pliki kodu/testów bajtowo zgodne z Git. Pierwszy nieukończony check przerwano przed wynikiem po ujawnieniu potrzeby przekazania poprzedniego tekstu do minimalnej korekty; nie jest PASS.

[Windows CI dokładnego SHA — success](https://github.com/JakubLewosz/JobHunter/actions/runs/39935218837). Nie utożsamiano CI, HEAD i faktycznie załadowanego buildu. Build 809f8e42-3547-41b0-a253-e3f036f7ad2e; loadedCodeHash a31200ae8344e824c1679cd9027e5ce132ed83234dc246e3808637893211bbff. Nie powtarzano 8 h po zmianach nieobejmujących adaptera hosta.

Osobny dowód produkcyjny: backup 52 tabel z WAL i integralnością/FK, izolowana próba odtworzenia/migracji 20 → 27, następnie migracja właściwej historii. Po konkretnej zgodzie zastosowano profil v11 / PDF PL publicznymi operacjami, zachowując stare ID, stare CV i DEFERRED. Rzeczywiste publiczne źródła/model: 10:09:30.133→11:08:25.154UTC (58 min 55,021 s ściennie; 50 min 47,121 s aktywnych przebiegów), cleanup czterech przebiegów — 7,567 s. Cap 11:09:30.133 UTC nieodnawiany; kolejne deadline wyłącznie wcześniejsze. Trzy lokalne odrzucenia treści zachowano i zamknięto publicznie przed przejściem do innych nietkniętych ID; ostatni przebieg DEADLINE.

71 pozycji rozpoczętych, 70 wyników, 40 materiałów po code PASS/pozytywnym review, 30 odłożeń, 1 przerwany, 168 nietkniętych. 272 nowe weryfikacje źródeł, 130 wywołań modelu (129 OK / 1 CANCELLED przy deadline); pełnego HTTP/cache nie mierzono. Biblioteka: 515 firm, 414 kontaktów, 240 szkiców, 327 wersji. 285 dawnych wersji i wszystkie stare rekordy zachowane; 62 tabele zgodne z końcowym backupem VACUUM INTO, integrity=ok / FK=0.

**Rzeczywista wysyłka/Gmail/OAuth/SELF_TEST/pilot: 0/NOT_RUN.** Brak nowych outbox/zgód/rezerwacji/prób/akcji browser, brak prawa wysyłki, brak aktywnego cyklu lub własnego właściciela. Nie jest to dowód gotowości całej biblioteki do wysyłki ani kompletnego sprawdzenia historii Gmaila. [Pełny bezpieczny wynik](reviews/JOBHUNTER_FIRST_REAL_REFRESH_RESULT.md); szczegóły odbiorców i PDF wyłącznie lokalnie.

## R15 / Windows / rzeczywiste 8 h — 22–23.10.2026

[Pełny raport wersji, poleceń i granic](reviews/JOBHUNTER_R15_HOST_8H_RESULT.md).
Check 8332363: PASS 786/786 backend, 12/12 Stop, 26/26 UI, typecheck/build,
exit 0; Windows10.0.26300 x64, Node24.19.0/npm11.17.0/SQLite3.53.4,
748135,3822 ms, niezmienne źródła przed/po. Pierwszy check zachowuje FAIL UI
24/26 (wyścig cleanup po ACK); po poprawce celowane 18/18 native i 4/4 UI.
Nowy krótki cua_repl: COMPLETED, jedna fikcyjna akcja. Rzeczywisty 8 h:
28 800 212,549 ms fazy RESEARCHING, potem jedna fikcyjna akcja i cleanup;
956 segmentów, 88902 odnowienia, max gap2251 ms, ten sam owner/job/generacja.
Odpowiedź długiego RPC miała timeout300 s; wykonanie w VM kontynuowało bez
nowego Start i zostało odebrane przez zapis wyniku oraz końcowy odczyt narzędzia.
Końcowy check drzewa dostawy i CI finalnego SHA są osobnymi metadanymi ZIP-a.
Bez danych produkcyjnych, Gmaila, OAuth, SELF_TEST, migracji WORKSTATION i pilota.

## Node owner / lekki host / materiały — 21.10.2026

Końcowy check dokładnych bajtów: **PASS, exit 0**, 773/773 backend, 12/12
serial Stop, typecheck/build, 26/26 UI; 860918,848 ms. 12:57:06.559–13:11:27.478
UTC (14:57–15:11 Europe/Warsaw). 229 plików niezmienionych przed/po;
fingerprint `05f32e4bc2414b554de9e6121142d1824ca5d555b1761e2660b695b8f9990265`.
Brak FAIL/SKIP/cancel. Stan w czasie testu UNCOMMITTED_WORKTREE od 66dbc9e;
pakiet niezależnie porównuje każdy testowany plik z blobem finalnego commitu.
CI końcowego SHA jest osobnym wynikiem w metadanych przekazania.

[Raport nowego etapu](reviews/JOBHUNTER_HOST_MATERIALS_RESULT.md).
Rzeczywisty krótki cua_repl: COMPLETED, jedna rezerwacja, jedna lokalna akcja,
cleanup. Oddzielnie wykonano rzeczywiste negatywne próby Stop/utraty ACK/karty
i odmów zakresu/originu/odbiorcy/treści/PDF. JSON dowody i hashe adaptera są w
końcowym ZIP. To nie Gmail i nie 8 h; osiem godzin czasu rzeczywistego: NOT_RUN.

Pierwszy nowy pełny Windows `npm run check`: PASS, exit 0; 773/773 backend,
12/12 serial Stop, typecheck/build, 26/26 UI, 782201,3527 ms.
12:42:08.186–12:55:10.388 UTC (14:42–14:55 Europe/Warsaw).
Windows x64 10.0.26300, Node24.19.0/npm11.17.0/SQLite3.53.4;
odrębne HOME/APPDATA/LOCALAPPDATA/TEMP/CODEX_HOME/data i komplet fikcyjnych usług.
Fingerprint 4745134662c134d283dcae3c71dd082bc26adbc23c2b1f4e53d2fc6e2eb8df93
był identyczny przed/po. Ten checkout miał CRLF inne niż część blobów Git.
Końcowy check wykonano ponownie na bajtach przeznaczonych do dokładnego archiwum;
ostateczny wynik/fingerprint i powiązanie z finalnym SHA znajdują się w dostawie.
Wczesny przebieg normalizacji przerwano; nie deklarowano go jako pełnego PASS.

Celowane 25/25 na wcześniejszym stanie i 8/8 po dalszych korektach; pierwsze
fixture/graf testu wymagały poprawy. Node/Playwright: pierwsza seria 8/9,
następnie 9/9 po dodaniu jawnego leaseValid bez zmiany dawnego ready hosta.
Wczesne błędy realnego multiline fill i wrappera utraty ACK zachowano osobno.
Nie sumować nakładających się zestawów. Nie zmieniono progów ani fixture Stop.
Propozycja materiałów: lokalna walidacja istniejącą usługą na nowej bazie,
15 DRAFT, FixDesk DEFERRED, sender bez zmian, 0 model calls i prób wysyłki.
Bez prywatnego CV/propozycji w repo lub CI. Brak nowej operacji na WORKSTATION.

## Aktualizacja R14 — 21.10.2026

[Nowy raport, rzeczywiste wyniki i tożsamość testowanego kodu](reviews/JOBHUNTER_R14_CI_HOST_WYNIK.md).
Poprzedni `npm run check` 21.10.2026, przed CI 39572278361: **PASS, exit 0**, 761/761 backend,
12/12 serial Stop, typecheck/build, 26/26 UI, 813305,5537 ms. Node 24.19.0,
npm 11.17.0, SQLite 3.53.4, Windows 10.0.26300 x64; izolowane środowisko.
08:30:59.177–08:44:32.484 UTC. Manifest 223 plików przed/po:
`8cddc799fedfe8df74d3c8b11d86cb8fe9f996c008ca8dca4e13ab8f0a84df0e`.
Pierwszy nowy pełny check: FAIL 760/761, 710521,5029 ms; wcześniejsza wersja
fixture okna, bez performance/build/UI. CLI już wtedy PASS 3680,6881 ms.
Oba wyniki i pomiary są w `reviews/r14-ci-host-evidence/`; nie ponawiano
do pierwszego PASS bez zmiany. Finalny SHA/CI jest osobnym zapisem przekazania.
Odrębne dowody: natywne IPC/CLI na Node24/Windows, Node public entry na własnym
localhost oraz ograniczona próba narzędzia strony w aktywnym Codexie. Import
całego publicznego wejścia w tym hoście: HOST_TEST_NOT_RUN z błędem zależności
wymagającej globalnego process. Ośmiu godzin rzeczywistego hosta nie wykonano.
Poniższe datowane FAIL/PASS oraz stare manifesty pozostają historyczne.

Po publikacji 1b9f0deda6e6cb032c22f6d49764d8aa3bc6fe02 nowy CI
[39572278361](https://github.com/JakubLewosz/JobHunter/actions/runs/39572278361)
zakończył się FAILURE, 760/761 backend. Artefakt dostarczony przez użytkownika
potwierdza deadline 1 ms i SIGTERM po 2032,3175 ms przy SERVICE_READY, bez
cleanup. To odrębna porażka nowego testu nadzoru. Poprawiono gotowość kanału
anulowania i punkty przerwania setupu; test zachowano z poprawnym kontraktem
hard kill. Celowana seria: 7/7 PASS, zero FAIL/SKIP/cancel, 8766,5592 ms.
Obejmuje trzy etapy inicjalizacji, zachowanie blokady żywego właściciela oraz
pozostawienie i bezpieczne odzyskanie blokady po własnym zabitym procesie.
Pełny nowy check po naprawie: **PASS, exit 0**, 765/765 backend, 12/12 serial
Stop, typecheck/build, 26/26 UI; zero FAIL/SKIP/cancel, 823097,7617 ms.
09:22:11.555–09:35:54.650 UTC, ten sam Windows/Node/npm/SQLite i izolacja.
224 pliki przed/po identyczne, fingerprint
`1c420911cc10c86e4e2bb7ced36fd452ebb676b5657648c460f208bc8faff35e`.
To UNCOMMITTED_WORKTREE od 1b9f0de; zgodność z finalnym commitem weryfikuje
pakiet. Główny proces CLI 4019,6406 ms, celowy deadline 1 ms zakończył
się po 723,4762 ms z LOCK_RELEASED i bez force kill. CI finalnego SHA jest
osobnym wynikiem przekazania; starszy FAILURE pozostaje w dowodach.

## Windows nightflow — nowy kod, osobne dowody

Baza `40850745d5677cf411072d2798a56034e3ec9873`, osobny worktree
`codex/windows-nightflow-fixes`. Node 24.19.0/npm 11.17.0, Windows.
Komplet fikcyjnych providerów; bez publicznego HTTP/modelu, prywatnego profilu,
Gmaila, rzeczywistych wiadomości, roboczej SQLite lub wdrożenia.

Celowane wyniki przed końcowym checkiem: 52/52 regresji bibliotek/IPC/koordynatora/
migracji/list; 41/41 parsera i autorytetu; 16/16 odnowienia, w tym osiem fake
SELF_TEST z identycznymi dawnymi MIME/próbami/wykorzystaniem; 15/15 audytu,
schematów 20/25 i procesów CLI; Playwright browser 5/5, w tym pełny adapter
nightflow i anulowanie przy uploadzie/final click. Zestawy częściowo nakładają się;
nie sumować ich jako liczby testów całego checka.

Pierwszy pełny check zakończył się 709/710 backend, exit 1 (595,927 s), fingerprint
`0e51fe0a7ef19a06124d24c5d1eb207436c811e8f9976368d9cbfaeedc4a7900`,
niezmieniony przed/po. Nie uruchomił serial benchmarku/build/UI. Oryginalny test
sesji ujawnił rekurencyjny `finalize` przy ponownym błędzie guarda. Dodano
barierę reentrancy; te same asercje przechodzą, a finalGuardOk pozostaje false
przy błędzie. Drugi check przerwano dla poprawki podtrzymania hosta w researchu.
Trzeci check zakończył się **PASS, exit 0**: 721/721 backend, 12/12 osobny Stop,
typecheck/build oraz 22/22 Playwright (59,7 s). Windows 10.0.26300 x64,
SQLite 3.53.4; cały check 681,713 s, 2026-10-18 22:00:59.163–22:12:20.876 UTC.
Fingerprint przed/po:
`8ae15067784be0fea94c78653826e80d1b43fdfc07454e6435515e717b2d4e63`.
`scripts/offline-check.ts` uruchamia rzeczywiste
`npm run check` z osobnym syntetycznym HOME/APPDATA/LOCALAPPDATA/CODEX_HOME/TEMP/data
i allowlistą środowiska. Nowy manifest obejmuje bajty kodu przed/po; dokumentacja
jest poza jego zakresem. Dotychczasowych 660/12/20 nie przedstawiamy jako wyniku
nowej implementacji. [Końcowe dowody](reviews/windows-nightflow-evidence/test-summary.json)
i [manifest testowanego kodu](reviews/windows-nightflow-evidence/source-files.json)
zachowują rzeczywistą tożsamość przed commitem; ZIP weryfikuje zgodność bajtów
z finalnym drzewem Git. CI jest odrębnym wynikiem w przekazaniu.

Pierwsza ukończona seria R12: 3 × slow-read/slow-model/large-history/inflight-post,
12/12, bez zmiany progów i pełnej fixture 10035 firm. Maks. reception
151,12 ms (<1000), receive→revoke 0,57 ms (<100), HTTP 228,14 ms, zero nowych
POST po revoke we wszystkich pomiarach. Seed 2993,55–3354,79 ms jest osobną
fazą. [Surowe pomiary faz requestu](reviews/windows-nightflow-evidence/stop-measurements.json)
obejmują SQL/prepare, JS, serialization, health/eventloop oraz wcześniejszy
POST kończący się po Stop. Historycznej porażki Linux nie przepisano na PASS.

Po przeglądzie granic: 53/53 regresje partii/odnowienia/koordynatora/sesji;
24/24 rozszerzona macierz koordynatora; 51/51 usługi/IPC/host/sesja po heartbeat;
browser UI 5/5. Test podtrzymania obejmuje osiem godzin kontrolowanego zegara
i 960 żądań przez rzeczywisty IPC, w około 60 s ściennych. Nie jest realnym
ośmiogodzinnym testem hosta Codexa. Poprawiono też atomowy binding partii,
wznowienie zakończonego researchu, WAIT_DEADLINE biblioteki, własny CANCELLED
przed cudzą wysyłką i deadline podczas odnowienia.

Zachowane pierwsze niepowodzenia: odtworzenia R1/R2/R3 na starej ścieżce;
nowa fixture outbox początkowo używała nieistniejącej kolumny recipient —
poprawiono pełne FK/approvals bez zmiany oczekiwanego kontraktu. Test parsera
miał historyczny literal 3, zastąpiony eksportowaną wersją 4. Fixture future
schema używa teraz 999 zamiast właśnie dodanego 26. Granica research/sender
ujawniła PAUSED run i brak osobnego końcowego guarda — poprawiono cleanup
kontrolera i zachowanie odłożeń. Test adaptera browser początkowo próbował
zatwierdzić politykę przed podłączeniem fikcyjnego wykonawcy — poprawiono
kolejność fixture. Abort file chooser ujawnił odrzucenie Promise przed jej
await; handler jest podłączany od razu, bez ignorowania wyniku await.
Jedną szeroką próbę przerwano podczas dalszych zmian kodu, bez ogłaszania PASS.

Manifest 69 dawnych plików: PASS dla `bfbbc630f11bd02da1b00bdaf5d089af38835838`.
40850745 daje różny package.json z późniejszego etapu, zgodnie z historią.
Dawnych manifestów/danych nie zmieniano. [Nowy raport](reviews/WINDOWS_NIGHTFLOW_IMPLEMENTATION.md).

Poniżej pozostają datowane wyniki wcześniejszych etapów.

Pierwsza publikacja 894ab953…: Windows CI **FAILURE**, run 39171469775,
job 117805244708, npm run check exit 1 (15 min 44 s). W chwili pierwotnego
raportu logi były niedostępne. Nowy przegląd c03161ba odczytał je: backend
720 PASS / 1 FAIL / 721, test nightflow CLI, status null zamiast 0,
30034,9529 ms przy limicie spawnSync 30000. Error.code/signal i faza nie były
zapisane. [Dawny zapis CI](reviews/windows-nightflow-evidence/ci-first.json)
nie jest aktualną diagnozą. Końcowy bazowy c03161ba ma osobny CI PASS
39173019427; nie dowodzi naprawy przyczyny pierwszego przekroczenia.

## Rozszerzony pakiet przeglądu — etap po bfbbc630

Zakres: eksporter/walidator i jego testy, dokumentacja wymagań/uruchamiania,
R1–R12 oraz zredagowany odczyt dopuszczonego snapshotu. Bez napraw rdzenia,
nowych zależności, wdrożenia lub rzeczywistych usług. Gałąź
`codex/core-completion`, początek czysty i zgodny z remote bfbbc630.

Fingerprint trzech modułów eksportera:
`1054f4f51c3a62ffb9e3d7b2f7a468dc6b15219119f39d72057a951bbea3dbdf`.
[Manifest danych](ai-review/review-2026-10-18/manifest.json) podaje hashe źródeł
narzędzia i plików projekcji, datę snapshotu oddzielnie od daty eksportu.
Zbiorczy manifest publikacji wskazany w AI_REVIEW identyfikuje pozostałe nowe
pliki; sam HEAD sprzed commitu nie jest tożsamością zmienionego checkoutu.

Celowane regresje końcowej wersji: **10/10 PASS**, exit 0 (`test-1792350512445`). Typowane
zagnieżdżenia/tablice, historyczne materiały i wersje, brakujące relacje,
schemat 20, niezmienione wejście, odmowa nadpisania, sentinele prywatności,
zabronione odczyty, błędny hash/proweniencja/SQLite i niezerowy WAL, redakcja
z zachowaniem treści oraz publicznych HTTP/HTTPS. Osobna regresja zachowuje
natywne tablice kontekstów adresów, complete=false, pary URL–kontekst odesłań
i znane kody ograniczeń/dowodów. Prywatne zagnieżdżenia i parametry względnych
URL nie przechodzą projekcji. CLI błędów zwraca wyłącznie
ustalony kod, bez wejściowych ścieżek i surowego wyjątku.

Wcześniejsze niepowodzenia zachowano: pierwszy typecheck miał 3 błędy typów,
poprawione; pierwszy test 7/8 miał niejednoznaczny fikcyjny token nazwiska
„Identity”, kolidujący z oczekiwaną treścią. Zastąpiono fixture jednoznacznym
fikcyjnym nazwiskiem. Kolejne 7/8 wykryło konwersję bool JSON przez SQLite do
liczby podczas projekcji polityki — poprawiono zachowanie prawdziwego typu.
Pełny `check-1792348858469` przerwano po 36 s, przed benchmarkiem, wyłącznie
własnego drzewa PID z potwierdzonym czasem utworzenia. Powód: rzeczywisty
eksport ujawnił nadmierną redakcję s:/ w HTTPS jako ścieżki Windows. Dodano
regresję HTTP/HTTPS, poprawiono wzorzec, a odrzucony nieopublikowany eksport
zachowano poza repo. Nie nadpisano poprzedniego publicznego eksportu.

Pierwszy pełny check tego etapu (`check-1792348963592`): **PASS, exit 0**,
659 backend / 12 performance / 20 UI; typecheck/build PASS.
18.10.2026 18:42:43.631–18:57:47.906 UTC (20:42–20:57 Europe/Warsaw),
904,275 s. [Pomiar i fazy Stop](ai-review/evidence-2026-10-18/first-full-check.json).
Dotyczy eksportera o poprzednim fingerprintcie `1d42fbe0...`, przed końcową
poprawką zachowania natywnych kontekstów/odesłań i technicznego słownika.
Nie jest przedstawiany jako test końcowego kodu.

Końcowa kontrola odwzorowania danych wykryła tablice `{email,text,complete?}`
oraz `{url,context}`, zamiast założonej mapy/stringów. Rozszerzono ścisłe
projekcje i regresję; jej pierwsze 9/10 wynikało z użycia w fixture nazwy
`sources` zamiast rzeczywistej `research_sources` — poprawiono fixture.
Check `1792350139653` przerwano przed benchmarkiem dla poprawki odesłań,
a `1792350340660` przed benchmarkiem dla zachowania znanych kodów
VERIFIED_PUBLIC/READ_VERIFIED_EXCERPT/UNCONFIRMED i stanów historii.
Zatrzymano wyłącznie potwierdzone własne drzewa PID; nie ingerowano w WORKSTATION.
Odrzucone, nieopublikowane kandydaty eksportu zachowano poza repo.

Końcowy pełny `npm run check`: **PASS, exit 0** (`check-1792350527243`):
**660/660 backend, 12/12 performance, 20/20 UI, typecheck/build PASS**.
18.10.2026 19:08:47.274–19:21:19.558 UTC (21:08–21:21 Europe/Warsaw),
752,284 s. Backend 661,304 s, performance 16,533 s, UI 56,2 s.
Kod sześciu zmienionych plików narzędzia/testów/package.json zamrożony:
`fef7ab0488ce9e2281fc0c7011017624d68ec5c13bc492e7a33cde4fb9d62305`.
Fingerprint przed i po check jest identyczny. Progi Stop i fixture 10k nie zmienione.
Zachowano pierwszy udany benchmark; kolejny pełny check wynika ze zmiany
eksportera, nie z powtarzania pomiaru aż do PASS.

[Końcowy pomiar i fazy](ai-review/evidence-2026-10-18/final-full-check.json),
[tożsamość kodu i historia prób](ai-review/evidence-2026-10-18/test-evidence.json).
Maksimum przyjęcia Stop dla large-history: 372,47 ms, odwołanie od przyjęcia
0,26 ms, odpowiedź 434,83 ms; próbka ma 10 035 firm. To pomiar lokalnego
Windowsa, nie rozwiązanie niezależnego R12 na Linuxie. Po sprawdzeniu 0 własnych
procesów i 0 listenerów na portach testowych 4328–4332;
[kontrola procesów](ai-review/evidence-2026-10-18/process-check.json).

Środowisko: Windows x64 10.0.26300, Node 24.19.0, npm 11.17.0,
SQLite 3.53.4, Codex CLI 0.163.0-alpha.10.2. Runner przekazuje allowlistę
środowiska i własne HOME/APPDATA/TEMP/data, DEVELOPMENT/DEMO oraz nowy katalog
E2E dla każdego uruchomienia; providery fikcyjne, bez usług rzeczywistych.
Polecenia: `node --import tsx --test --test-concurrency=1 tests/review-package.test.ts`
(10/10, exit 0), `npm run typecheck` (exit 0) i `npm run check`.

Walidacja nowego publicznego eksportu: **PASS**, schema=20, integrity=ok/FK=0,
hash wejścia przed/po zgodny, WAL 0 B i SHM 32768 B bez zmian. **240 szkiców,
285 wersji, 285 material rows, 240 research_drafts, 1986 historycznych faktów
w kontekstach; 0 MISSING referencji, wszystkie PRESENT rozwiązywalne**.
Puste i brakujące tabele mają oddzielne statusy. Zapisane PASS nie są bieżącą
gotowością. autoPolicy nie występuje; nie utworzono nowej zgody lub tempa/limitu.
Metoda historycznego backupu UNKNOWN; nie dopisano metody kopii ani before/after
porównania dwóch baz. Szczegóły [validation.json](ai-review/review-2026-10-18/validation.json).
Niezależnie sprawdzono hashe 40 plików manifestu i 13 141 rekordów JSONL;
18 929 referencji PRESENT i 3568 kontekstów adresów. Kontrola prywatnych wzorców
i adresów spoza literalnego zestawu publicznych kontaktów: 0 trafień.
Oddzielny odczyt wyłącznie metadanych schematu własnej kopii potwierdził 52 tabele,
34 istniejące tabele projekcji, 16 tabel bez odczytu rekordów oraz 68 pominiętych
kolumn. app_state i migrations są opisane osobno. Wejście nadal ma ten sam hash,
WAL 0 B; [inwentarz](ai-review/evidence-2026-10-18/read-inventory.json).

GitHub API dla poprzedniego run 39151095938: **macOS failure, Windows cancelled**.
Nie deklarować PASS Windowsa w CI na podstawie lokalnego wyniku. R11 pozostaje
otwarte. Linux 1154,72 ms z instrukcji użytkownika jest niezależnym zgłoszeniem,
nie własnym pomiarem; brakuje jego faz/logu. CI nowego SHA sprawdzamy po push.
Rzeczywisty WORKSTATION, Gmail/browser 8 h i nocny koordynator: **NIEWERYFIKOWANE**.

Źródła uruchamiania: [CODEX_OPERATION](CODEX_OPERATION.md). Dodatkowy odczyt
struktury prywatnych helperów został automatycznie odrzucony („blocked by policy”);
nie obchodzono odmowy. Kontrakt opisano z wcześniejszej dopuszczonej diagnostyki,
bez deklaracji bieżącego fingerprintu tych plików.

## Lokalna implementacja po diagnostyce — wcześniejsza weryfikacja

Osobny worktree `codex/core-completion`, baza
`f37afc077c0d7c80f231ef0e9ad2f4dcac17363c`, niezacommitowane zmiany i nowe
pliki w chwili testów. Później osobno zlecono commit/push oraz ograniczony
eksport wskazanego backupu: [AI_REVIEW](AI_REVIEW.md). Oryginalny checkout
`codex/local-windows-pilot` pozostaje bez zmian.
[CORE_IMPLEMENTATION](CORE_IMPLEMENTATION.md) opisuje pakiety A–J i komendy.
Raport poza repo `JOBHUNTER_IMPLEMENTACJA_DO_PRZEGLADU.md` zawiera pełny patch,
manifest SHA-256 wszystkich zmienionych/nowych plików i logi. Sam HEAD nie
identyfikuje testowanego kodu. Fingerprint plików kodu/testów/migracji/konfiguracji:
`8b0bcf8f493eb6128466b555565ec94aef43d1db4e0be6e8b065333eabad311d`.

Windows x64 10.0.26300, Node 24.19.0, npm 11.17.0, SQLite 3.53.4,
Codex CLI 0.163.0-alpha.10.2. Zależności zgodne z lockfile, osobny offline
cache, bez install scripts i bez zmiany wersji zależności. Izolowany runner
przekazuje allowlistę środowiska, własne HOME/APPDATA/TEMP/data oraz
DEVELOPMENT/DEMO; każdy E2E ma nowy syntetyczny katalog. Testowy Chromium,
pełne fikcyjne providery, bez modelu, publicznego researchu, Gmaila/OAuth/send.
`NODE_USE_SYSTEM_CA=1`, bez wyłączenia TLS.

Końcowy pełny `npm run check` (`check-1792341350035`): **PASS, exit 0**,
650/650 backend, 12/12 izolowany performance, 20/20 UI, typecheck/build PASS.
18.10.2026 16:35:50.078–16:49:16.214 UTC (18:35–18:49 Europe/Warsaw),
13 min 26,136 s. Backend 708,152 s, performance 18,907 s, UI 58,2 s.
Kod przez cały check pozostał zgodny z powyższym fingerprintem; dokumentację
uzupełniono osobno. To pierwszy uruchomiony izolowany benchmark tego etapu,
bez powtarzania go do PASS.

Maksima z trzech powtórzeń każdego scenariusza (ms):

| Scenariusz    | Przyjęcie HTTP od żądania | Odwołanie od przyjęcia | Odpowiedź HTTP |
| ------------- | ------------------------: | ---------------------: | -------------: |
| slow-read     |                     72,53 |                   1,19 |          92,89 |
| slow-model    |                     64,77 |                   0,24 |          85,57 |
| large-history |                    516,23 |                   0,41 |         550,67 |
| inflight-post |                    102,72 |                   0,18 |         115,30 |

Duża fixture ma 10 035 firm (10 000 dodanych w teście); zapytanie strony
zwraca 100 wierszy, nie ładuje całej historii. Maks. budowa strony 6,25 ms,
odpowiedź listy 75 673 B. Obserwowane maksima faz żądań: SQL prepare 6,429 ms,
SQLite/driver 6,203 ms, materializacja/reguły JS 12,265 ms, serializacja
0,388 ms; zapamiętana kontrola zdrowia 1,714 ms. P99/max pętli 4412,408 ms
obejmuje także synchroniczne przygotowanie dużej fixture; nie jest latencją
Stop ani dowodem braku długich blokad pętli w całym lifecycle.

Po check kontrola PID/czasów, własnych ścieżek i portów: 0 własnych procesów
testowych oraz 0 listenerów 4328–4332. Oryginalny checkout pozostał czysty
na tej samej gałęzi i pełnym HEAD. Nie czytano produkcyjnej bazy w celu
takiego porównania; prywatna instalacja nie była przedmiotem uruchomień.

Pierwszy zintegrowany check (`check-1792337968451`): typecheck PASS,
**637 backend: 625 PASS / 12 FAIL**; nie doszedł do izolowanego performance,
builda ani UI. Poprawiono rzeczywisty kontekst etykiet HTML, fixture starego
schematu z nowym UNIQUE, liczenie samych backupów SQLite po dodaniu manifestu,
zachowanie ustalonego kodu błędu ścieżki i teardown fikcyjnego locka.
Drugi (`check-1792340803934`) przerwano podczas backendu na potrzeby nowego
odtworzenia fałszywego stopu po zmianie zakresu; nie doszedł do benchmarku.
Nie przedstawiać go jako pełnego wyniku. Zakończono tylko własne drzewo tego
uruchomienia; nie zatrzymywano prywatnego backendu.

Nowa regresja (`test-1792340907490`) wykazała nieprawidłową ochronę bieżącego
powiązania zakresu szkicu. Naprawa wymaga nowej zgodnej immutable wersji
i polityki zatwierdzonej przed baseline, bez wyłączenia ochrony starych wersji.
Po niej `test-1792341307930`: **56/56 PASS** (guard, partie, audytor, natywny
punkt wejścia i długa sesja), `typecheck-1792341324651` PASS. Testowane są
także usunięcie powiązania, regres/brak nowej wersji, zły zakres, brak zgodnego
rekordu wersji i zmiana polityki. Wcześniejsze celowane niepowodzenia i poprawki
są zachowane w logach, nie zastąpione ostatnim PASS.

Wcześniejszy Playwright `test-e2e-1792340597324`: **20/20 PASS**, także pełny
fikcyjny przepływ partii i mobilny widok. `doctor-1792341552566`: PASS,
DEVELOPMENT/DEMO, SQLite w pamięci oraz `codex --version`; nie test loginu.
Backend ma jawne `--test-concurrency=4`, izolowany Stop nadal concurrency=1,
3 powtórzenia × 4 scenariusze, te same 10 000 rekordów i progi: przyjęcie
HTTP <1000 ms oraz odwołanie prawa od przyjęcia <100 ms. Nie powtarzać
benchmarku do pierwszego PASS; pierwszy wynik tego etapu zostaje w raporcie.

Audyt prywatnej kopii: **SKIP**, nie wskazano konkretnego backupu dopuszczonego
do odczytu. Rzeczywisty research, Gmail/SELF_TEST/pilot i browser przez całą
partię: **NIEWYKONANE/NIEWERYFIKOWANE**. Macierz IPC i kontroler sprawdzone
syntetycznie nie potwierdzają życia narzędzia po zamknięciu Codexa. Bez nowego
wyniku realnego macOS, GitHub CI, wdrożenia lub migracji WORKSTATION.

## Wyniki historyczne do 17 października — odrębny zakres

Poniższe zapisy opisują wcześniejsze etapy. Ich pełny dziennik:
[archiwalny TEST_REPORT](archive/2026-10-17/TEST_REPORT.md).
Nie sumować dawnych kampanii, baz i różnych systemów jako jednej próby.

## Porządkowanie i poprawka raportów z 17 października

Zmiana kodu ograniczona do eksportera pochodzenia przyczyny zakończenia
oraz komunikatu o ustawieniach RESEARCH_ONLY. Bez migracji, generatora stylu,
zmian profilu/CV/szkiców, ustawień Gmaila, historii, kwot lub blokad.
Eksporter przyjmuje opcjonalny zakończony wynik kontrolera i sprawdza sessionId;
odrzuca inną/aktywną sesję, konflikt ID, RUNNING i niepoprawny kod przyczyny.
Bez osobnej przyczyny STOPPED/PAUSED pozostają stanem, nie diagnozą sieci.

Celowane testy Windows: **26/26 PASS** (5 nowych pochodzenia raportu oraz
21 istniejących sesji/researchu). Końcowy rzeczywisty `npm run check`:
**555/555 backend, 12/12 performance, 19/19 UI, typecheck/build PASS**, exit 0.
Wszystko na fikcyjnych providerach/odbiorcach i tymczasowych danych.
Nie jest to nowy publiczny research, realny Gmail lub wynik GitHub CI.

Dodatkowy readonly eksport istniejącej bazy: poprawna przyczyna kontrolera
przy zachowanym stanie STOPPED i 44 identyczne treści/tematy/wersje.
Wynik innej sesji odrzucony REPORT_SCOPE_MISMATCH, bez utworzenia eksportu.
Końcowy niezależny audyt: **52 tabele bez zmian**, integrity=ok/FK=0,
zgodne spójne backupy przed/po, PDF/hash zachowany; research/send zatrzymane,
8 dawnych prób/outbox/usage bez zmian. Bez czytania poczty, OAuth lub tokenu panelu.

Kontrola dokumentacji: brak zerwanych względnych linków; kontrola bieżących
plików i znanych wzorców poświadczeń bez trafień. Nie jest to pełny audyt
wszystkich historycznych blobów Git. Dziesięć starych dokumentów zachowano
w oznaczonym archiwum; publicznych pakietów diagnostycznych nie usunięto.
Wygenerowane playwright-report/test-results przeniesiono poza repo z pełną
zawartością. Kod, migracje, dependencies, build i prywatne dane zachowane.

## Ostatni ukończony pełny check przed tym etapem

Windows, kod bazowy `b64091eca995fad1027d02b6aaf4615351b7ded7`:
**550 backend / 12 performance / 19 UI, typecheck/build PASS**.
Celowane IPC/receipt 93 PASS. Rzeczywistego macOS dla tej wersji nie wykonano.
Wcześniej wystąpił wynik performance 11/12 z przekroczeniem progu Stop;
odtworzono go na wcześniejszej wersji. Późniejsze pełne PASS nie wyjaśniają
przyczyny niestabilności i nie stanowią gwarancji czasu na każdym sprzęcie.

## Rzeczywista sesja RESEARCH_ONLY — 16/17 października

Plan 8 h, rzeczywiście **23:52:43 → 03:24:51 Europe/Warsaw**, 3 h 32 min 8 s.
15 rozpoczętych cykli: 9 COMPLETED, 5 PARTIAL, 1 PAUSED. Zakończenie
PROTECTED_DATA_CHANGED: prywatny kontroler zatrzymał się po potwierdzonym
uzupełnieniu pustej domeny istniejącej firmy. Stan sprzątania: STOPPED.
Kontroler był doraźnym plikiem poza repo; nie należy przypisywać tego błędu
samej natywnej metodzie startDay ani twierdzić, że poprawka raportu go naprawia.

Windows odnotował odłączenie sieci **03:54:51**, podłączenie od **08:02:09**.
To około 30 min po stopie, nie zapisany powód wcześniejszego GUARD_STOP.
Logi nie są ciągłym pomiarem dostępności każdej usługi. Nie odtworzono restartu
lub uśpienia w badanym oknie. Nie wznawiano sesji po awarii/rozłączeniu.

Punkt odniesienia **472 firmy / 376 kontaktów / 221 szkiców**.
Nowe: **43 rekordy firm / 37 kontaktów / 19 szkiców**; cała baza **515/413/240**.
96 odwiedzonych rekordów (43 nowe, 53 wcześniejsze), 44 szkice w zakresie:
19 nowych, 12 dawnych w nowej wersji i 13 użytych bez zmiany wersji.
31 nowych wersji; wszystkie 254 dawne zachowane. Trzy odświeżenia zmieniły
tekst, dziewięć zachowało tekst. 132 wpisy kandydatów / 117 różnych URL.
To liczby rekordów, nie potwierdzonych niezależnych podmiotów.

19 nowych szkiców PASS/COMPLETED/supported=true, bez materialIssues;
wszystkie GENERAL/PROSPECT/NEEDS_REVIEW. Nabór i warunki niepotwierdzone.
44 szkice: na czas stopu **42 OK / 2 STALE**, podczas audytu o 08:08
**39 OK / 5 STALE**. Trzy przekroczyły 24 h po zakończeniu sesji.
13 przypadków błędów pozycji, 10 błędów źródeł; nie sumować jako firm.
Jeden model call CANCELLED po stopie, 10 PENDING nieukończonych.
Zgłoszenie konfliktu domena/subdomena nie dowodzi różnej tożsamości prawnej.
Brak nowych kolizji potwierdzonych aliasów lub wspólnych mailboxów;
wcześniejszy rozstrzygnięty alias pozostał zachowany.

Audyt readonly: **52 tabele, integrity=ok/FK=0**, spójne backupy,
stare ID, wersje i research_draft_materials zachowane. Jedna opisana zmiana
pustej domeny; 32 stare kontakty odświeżyły dowody/daty bez zmiany tożsamości;
63 dowody odświeżyły daty lub rozszerzyły fragmenty, zachowując stare fragmenty
i hashe. Profil v4/9 zatwierdzonych faktów/PDF/hash, historia, granica kampanii,
blokady i 8 dawnych prób/outbox/liczników/Gmail/browser/shared zgodne.
Fingerprint 234 plików zgodny z kodem wtedy uruchomionym; nie dotyczy nowych
zmian tego etapu. 44 pełne treści sprawdzono bez redakcji w prywatnym raporcie.
Zero Gmaila/send/AUTO. Proces zakończony; pozostał PAUSED checkpoint.

## Rzeczywiste SELF_TEST transportu przeglądarkowego — 16 października

Dwie osobno zatwierdzone wiadomości Gmail UI: ACKNOWLEDGED + SENT_CONFIRMED,
celowana kontrola znanych własnych ID i całego payloadu/PDF. Użytkownik:
**2/2 Odebrane, 2/2 CV otwiera się**. Nie odczytywano przychodzącej poczty
ani historii firm. Nie wysłano wiadomości do firmy. Różni odbiorcy i mała
próba nie izolują wpływu transportu i nie dowodzą przyczyny wcześniejszego Spamu.

W tej próbie naprawiono klienta IPC bez globalnego process oraz żądanie RAW
znanego ID dopiero po kontroli SENT/konta/odbiorcy/czasu. Pierwszą próbę
uzgodniono bez ponowienia, dopiero potem wysłano drugą. Nie poluzowano
porównania tekstu/HTML/linków/PDF ani domyślnego reconcile API.

## Czego nie sprawdzono

Pilot do firm, ich rzeczywista historia Gmaila, całodzienny sender/AUTO,
samodzielny wykonawca po zamknięciu Codexa, adapter portalu/formularzy,
kwalifikacja zleceń usługowych, pełna izolacja OS i nowy realny macOS.
GitHub CI dla przygotowywanego commitu nie został sprawdzony. Push kodu
nie jest deploymentem lub zgodą na Start.

Korekta narracji z 18.10.2026: 9 COMPLETED / 5 PARTIAL / 1 PAUSED pochodzi z dwóch raportów JSON zakończonej sesji i guarda, porównanych w diagnostyce z 18.10. Wcześniejsze 10/4/1 było błędem opisu; nie zmieniano danych runów.


## 24.10.2026 — niezależne odnowienie: rzeczywisty Windows

Windows x64, Node v24.19.0. Kod wykonawczy b0ac8ca5f20b65d4416d8c1cb7f7bbdefac2b3cf. Końcowy pełny npm run check: 873/873 backend, 12/12 Stop, 26/26 UI oraz typecheck/build PASS; osobny doctor PASS. Celowane regresje 69/69 PASS. Izolowane HOME/dane, DEVELOPMENT/DEMO i fikcyjni dostawcy; brak natywnego Gmaila. Nie podnoszono progów Stop ani limitów parsera.

Przed poprawkami zachowano porażki: skorygowany fixture A → B → C 0/2, pierwszy zestaw 47/48, dostępność 0/3, odrębne zapytanie przy dokładnym zakresie OFFER 0/1 oraz dawny cache ekstrakcji 0/1. Błędy przygotowania fixture są odrębne od regresji produktu. Wcześniejszy ukończony pełny check kodu 1ea9de3: 868/868 + 12/12 + 26/26 PASS. Trzy inne rozpoczęte pełne przebiegi przerwano przed kolejnymi wykazanymi korektami (ochrona właściciela review, osobne zapytanie, kontrola cache); nie są PASS ani ukończonym FAIL. Logi pozostają zachowane.

GitHub CI Offline Windows dla dokładnego b0ac8ca5f20b65d4416d8c1cb7f7bbdefac2b3cf: completed/success, [run 40036595927](https://github.com/JakubLewosz/JobHunter/actions/runs/40036595927), zakończony 23.10.2026 23:15:43 UTC. To potwierdzenie tego SHA, nie późniejszego commitu dokumentacji.

Regresje obejmują niezmieniony zapisany tryb i zakres AUTO, chronione materiały/źródła, kontynuację po lokalnym odrzuceniu, obcy PAUSED, właściciela i wszystkie tabele po utracie własności, Stop/deadline oraz zmiany profilu/polityki/wersji podczas await. Nie wykonano rzeczywistej wysyłki ani testu pocztowego na koncie użytkownika. Prywatne dane nie są częścią dowodów publikowanych w Git.
