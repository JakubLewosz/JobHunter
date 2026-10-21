# JOBHUNTER_R14_CI_HOST_WYNIK — 21.10.2026

Praca w osobnym izolowanym worktree od rzeczywistej bazy
`c03161ba5b086fd625648f54eb9527a7b3032883`, zgodnej z remote przed rozpoczęciem.
Oryginalny checkout `codex/local-windows-pilot` oraz istniejące worktrees
`codex/core-completion` i `codex/windows-nightflow-fixes` zachowano bez zmian.
Nowe commity dotyczą wyłącznie wskazanej gałęzi zdalnej, bez force push.

Przed zmianami przeczytano prompt i cały wskazany zestaw raportu, README dowodów,
CI, reprodukcji i propozycji testu. ZIP wejściowy ma SHA-256
`b73b4b03a92e5056bad1016d6e155b0d5f6ab06714d795f08abd474f01ee37df`;
20/20 plików manifestu przeglądu ma zgodne rozmiary i hashe.
Nie wykonywano audytorskiego adaptera Node22 jako zamiennika natywnych regresji.

## Zakres kodu

| Pliki | Zmiana |
| --- | --- |
| `apps/server/src/nightflow-control.ts`, `nightflow.ts`, `scripts/nightflow.ts` | Rozdzielenie live/offline/niepotwierdzonej komendy; związany ACK, zakres instancja/job/generacja, request/op, wykrycie zmiany deskryptora, absolutny bounded timeout, readonly bez wymyślonego OWNER_LOST. |
| `tests/nightflow-control-failures.test.ts`, `tests/nightflow.test.ts` | Natywna macierz R14 na prawdziwym lokalnym IPC/CLI i koordynatorze z fikcyjnym transportem, również operacja już przyjęta i błąd zapisu po revoke. |
| `tests/helpers/nightflow-child.ts`, `tests/cli-tools.test.ts`, `tests/fixtures/nightflow-blocked-owner.ts`, `scripts/measure-nightflow-cli.ts`, `scripts/offline-check.ts` | Asynchroniczny własny proces, 30 s + 2 s grace, handshake anulowania, jawny timeout/crash/cancel/exit i wymuszone zakończenie bez obietnicy cleanup; regresje żywej/martwej blokady. |
| `.github/workflows/offline-check.yml`, `scripts/ci-check.ts` | Zachowany kod błędu npm check; przy porażce ograniczone JSON diagnostyki backendu przed UI, bez ogólnych logów/danych użytkownika. |
| `scripts/browser-executor.mjs`, `scripts/nightflow-host-fixture.mjs`, `nightflow-entry.ts`, `nightflow-browser-host.ts` | Minimalna kompletna fixture publicznego wejścia, nowy DEVELOPMENT i własna lokalna strona, tryb monotonicznych 8 h, fazy/heartbeat/cleanup. Istniejący koordynator pozostaje. |
| `browser/executor.ts`, `browser/batch-controller.ts`, `browser/broker.ts`, `gmail/service.ts`, `testing/local-fixture-origin.ts` | Przekazanie konkretnego testowego origin; odmowa Gmaila w fixture, WORKSTATION/niepełnych providerów w lokalnym adapterze. Zwykłe bramki i zakres IPC pozostają. |
| `tests/nightflow-fixture.test.ts`, `tests/e2e/browser-delivery.spec.ts` | Zabezpieczenia adaptera i cztery scenariusze publicznego wejścia: complete/Stop/executor-loss/lost-ack, bez ponowienia SEND_UNKNOWN. |
| `scripts/package-nightflow-review.py` | Istniejący packager rozszerzony o nowy raport/evidence, dokładny commit, manifest, ponowne wypakowanie i automatyczne odtworzenie całego drzewa patchem. |

Dokumentacja: README, CODEX_OPERATION, NIGHTFLOW_CONTROL, NIGHTFLOW_HOST_FIXTURE,
SECURITY, GMAIL_BROWSER, TASKS, KNOWN_ISSUES, TEST_REPORT i ten raport.
Nie zmieniano migracji, zależności/lockfile, MESSAGE_STYLE, generatora lub
starych eksportów/manifestów w docs/ai-review. R1–R13 i koordynator zachowane.

## R14 przed i po

W bazowym c03161ba dowolny błąd IPC przechodził do odczytu SQLite; aktywne
SENDING było drukowane jako STOPPED/OWNER_LOST/authority=false, exit 0.
Właściciel mógł pozostawać aktywny, bez wywołania Stop. To błąd raportowania
i sterowania, nie wykazanie nowej akcji po poprawnym odwołaniu prawa.

Teraz `stop` bez wiarygodnego ACK daje exit 1 / STOP_UNCONFIRMED + CONTROL_*,
pusty stdout i stan/uprawnienie UNKNOWN. `status` daje w tej sytuacji
STATUS_UNAVAILABLE / exit 1. `report` offline może zakończyć się exit 0,
ale zwraca PERSISTED_SNAPSHOT, historyczny stan/czas zapisu i czas odczytu;
bieżący właściciel/uprawnienie pozostają UNKNOWN. Pusty zapis to snapshot=null,
brak daty to persistedAt=null; błędna baza/raport daje REPORT_UNAVAILABLE.

ACK jest związany z istniejącą instancją backendu, jobem, generacją, requestem
i operacją. Celowany odczyt nie uruchamia sendera. Zmiana celu lub deskryptora
nie pozwala przejąć nowej sesji. Potwierdzenie odwołania nie potwierdza
zakończenia operacji już przekazanej transportowi: MAY_BE_IN_FLIGHT,
maintenanceReady=false. Stop nadal odwołuje prawo w pamięci przed zapisem;
błąd zapisu lub utracone ACK nie daje fałszywego sukcesu ani stwierdzenia,
że Stop na pewno nie został wykonany.

Macierz obejmuje pozytywny ACK; odmowę poświadczenia przy żywym właścicielu
(zero Stop i identyczna baza); brak/stary/obcy/zmieniony deskryptor; stary job
i generację; błędną odpowiedź oraz osobno błędne ACK po rzeczywistym revoke;
timeout przed wykonaniem i utratę odpowiedzi po revoke; status UNKNOWN;
offline aktywny/terminalny/pusty/brak daty; brak, uszkodzenie lub brak tabeli
raportu. Sprawdzono brak nowych rezerwacji i akcji po revoke oraz odrębność
wcześniej przyjętej operacji. Szczegóły w NIGHTFLOW_CONTROL i regresjach.

## Timeout konkretnego testu CLI

Historyczny CI 39171469775 / job 117805244708 / 894ab953… pozostaje FAIL:
720/721 backend, test `nightflow CLI awaits a real child process across fake
research and sender phases, then releases its owner`, 30034,9529 ms, status
null zamiast 0 przy spawnSync timeout 30000. Nie zapisano error.code/signal
ani fazy, więc szczegółowa przyczyna jest nadal NOT_ESTABLISHED. Późniejszy
CI 39173019427 / c03161ba jest PASS; zmieniła się dokumentacja, nie ta implementacja.
Publiczne API ponownie potwierdziło jego success 21.10.2026. Dawny opis
UNKNOWN_LOGS_UNAVAILABLE zastąpiono tą wiedzą, zachowując datowane FAIL.

Plan przed wykonaniem: trzy celowane pomiary starego testu, trzy nowego
nadzoru, potem pełny check. Wszystkie wyniki są zachowane; brak retry do PASS.
Stary test: 5753,4771 / 4814,5018 / 4810,8557 ms, exit 0 w każdym przebiegu.
Nowy: 4419,5661 / 3947,1912 / 3911,5156 ms całego testowego procesu, wszystkie
exit 0; osobne czasy dziecka/faz są w cli-measurements.json. Nie odtworzono
30 s; nie przypisujemy różnicy czasu konkretnej przyczynie pierwszej porażki.

Pozostawiono 30000 ms badanego dziecka. Nadzór jest asynchroniczny i zbiera
spawn, import/init/fixture, fazy, cleanup i exit; zapisuje ostatnią fazę,
error.code/status/signal oraz EXIT/TEST_TIMEOUT/CRASH/CANCELLED. Timeout
jest FAIL także gdy dziecko zdąży wyjść z 0 po anulowaniu. IPC telemetrii
ma zamknięty słownik; stdout nadal jest jednym JSON wyniku programu.
Po deadline wysyłane jest fixture-only anulowanie, po 2 s kończony jest
wyłącznie własny bezpośredni proces Node, bez obcego drzewa procesów.
Regresje rozróżniają łagodne anulowanie z cleanup od wymuszonego zakończenia,
które może pozostawić nieaktywną blokadę; szczegóły nowej porażki CI poniżej.
Nie zmieniono progów Stop, 10035 firm, lease, provider timeouts lub deadline planu.

### Nowy CI 39572278361: anulowanie podczas inicjalizacji

[CI dla 1b9f0deda6e6cb032c22f6d49764d8aa3bc6fe02](https://github.com/JakubLewosz/JobHunter/actions/runs/39572278361)
zakończył się **FAILURE**: 760/761 backend, exit 1, 844174,7058 ms,
08:51:19.690–09:05:23.862 UTC. Ten wynik jest odrębny od lokalnego PASS
i od historycznego timeoutu 30 s. Użytkownik dostarczył brakujący artefakt;
jego check-summary i wszystkie 32 ograniczone rekordy procesu zachowano.
Nie pobierano sekretów ani nie zmieniano uprawnień konektora.

Nieudana asercja `tests/cli-tools.test.ts:173` wymagała braku `profile.lock`
po celowym timeout 1 ms. Dziecko: ETIMEDOUT, status null, SIGTERM,
2032,3175 ms; ENTRY 302,0341 ms, IMPORT_END 558,1566 ms, LOCK_ACQUIRED
592,2003 ms, STORE_READY 1233,4604 ms, SERVICE_READY 1449,5583 ms.
Brak CLEANUP_BEGIN/LOCK_RELEASED. Nie był to ponowny timeout głównego
testu 30 s, lecz nagłe zakończenie w trakcie startu po dwusekundowym grace.

Kod miał dwie luki obsługi anulowania: nadzorca wysyłał żądanie jeszcze przed
gotowością listenera, a inicjalizacja sprawdzała sygnał dopiero przed action,
po ciężkim setupie. Stara telemetria nie pozwala ustalić, czy żądanie zostało
utracone, czy odebrane i jeszcze niesprawdzone. Poprawka obejmuje oba okna:
ENTRY jest wysyłane po instalacji listenera; nadzorca zatrzymuje żądanie do
ENTRY, wysyła raz, a dziecko raportuje CANCEL_RECEIVED. Wejście sprawdza
sygnał przed otwarciem profilu i między etapami inicjalizacji, oddając pętlę
zdarzeń pomiędzy synchronicznymi etapami fixture. Diagnostyka schematu 2
zapisuje osobno czas żądania, wysłania i wymuszonego zabicia.

Limity 30000 ms oraz grace 2000 ms pozostają. Grace ogranicza oczekiwanie,
nie gwarantuje wykonania finally po Windows TerminateProcess. Test 1 ms
pozostaje i nadal wymaga TEST_TIMEOUT/ETIMEDOUT. Przy łagodnym zakończeniu
wymaga odbioru anulowania i braku locka; po wymuszonym zakończeniu ewentualne
odzyskanie przechodzi wyłącznie przez istniejące acquireProfileLock.
Nadzorca nigdy nie kasuje blokady. Produkcyjny mechanizm własności nie został
osłabiony ani zmieniony: żywy lub niepewny właściciel nadal blokuje przejęcie.

Celowane polecenie `node --import tsx --test --test-name-pattern='nightflow CLI|hard-killed fixture' tests/cli-tools.test.ts`:
**7/7 PASS, zero FAIL/SKIP/cancel**, 8766,5592 ms. Obejmuje normalny lifecycle,
Stop w researchu, deadline 1 ms, anulowanie przy LOCK_ACQUIRED/STORE_READY/
SERVICE_READY oraz osobnego własnego potomka z prawdziwą blokadą i celowo
zablokowaną pętlą. Żywy właściciel odrzucił przejęcie z identycznym owner.json;
po SIGKILL i potwierdzonym ESRCH blokada pozostała na dysku, a zwykłe bezpieczne
odzyskanie nadało nową tożsamość i pozwoliło ją zwolnić. Trzy anulowania
inicjalizacji zakończyły się LOCK_RELEASED bez wymuszonego zabicia.
Wyniki i dokładny trace są w `r14-ci-host-evidence/cancellation-regression.json`.

Nowy pełny Windows check po tej poprawce: **PASS, exit 0**, 765/765 backend,
12/12 serial Stop, typecheck/build, 26/26 UI (1,5 min), zero FAIL/SKIP/cancel.
Rzeczywiste `node --import tsx scripts/offline-check.ts --output <NOWY_KATALOG>`
uruchomiło cały `npm run check` z izolowanym środowiskiem i pełnymi fixture.
Windows 10.0.26300 x64 / Node 24.19.0 / npm 11.17.0 / SQLite 3.53.4.
2026-10-21 09:22:11.555–09:35:54.650 UTC, 823097,7617 ms.
To UNCOMMITTED_WORKTREE od 1b9f0deda6e6cb032c22f6d49764d8aa3bc6fe02;
224 pliki przed/po identyczne, fingerprint
`1c420911cc10c86e4e2bb7ced36fd452ebb676b5657648c460f208bc8faff35e`.
Główny proces CLI: 4019,6406 ms, EXIT, bez force kill. Celowy timeout 1 ms:
723,4762 ms, TEST_TIMEOUT/ETIMEDOUT, odebrane anulowanie i LOCK_RELEASED,
bez wymuszonego zabicia. Odrębny test SIGKILL sprawdza pozostawioną blokadę.
`test-summary.json`, `source-files.json`, `full-check-3.txt`,
`full-child-diagnostics.json` i `stop-measurements.json` dotyczą tego wykonania.
Poprzednie metadane/manifest/pomiary zachowano jako pliki z `check-2` w nazwie;
historia weryfikacji wskazuje właściwe wykonania. Nowy CI i finalny SHA są
oddzielnymi metadanymi przekazania, bez wnioskowania CI PASS z lokalnego PASS.

Po checku ponowiono krótkie publiczne wejście na tej samej wersji kodu:
Node/Playwright na własnym localhost, kompletna fixture, COMPLETED,
34680,4229 ms, 09:36:16.827–09:36:51.507 UTC, jedna fikcyjna akcja i pełny
cleanup lock/IPC/browser/strony/katalogu. `node-public-entry-repair.json`
zachowuje rzeczywistą tożsamość builda od 1b9f0de i loadedCodeHash; nie wpisano
przyszłego SHA. Nowy Stop: 12 pomiarów, maks. reception 233,24 ms,
receive→revoke 0,74 ms, zero nowych POST po revoke, 10035 firm.
Nie jest to próba utrzymania rzeczywistego hosta Codexa ani osiem godzin.

## Wykonania i granice

Windows 10.0.26300 x64, Node v24.19.0, npm 11.17.0, lockfile projektu.
`npm ci`: exit 0, 119 pakietów, zero vulnerabilities; bez aktualizacji zależności.
Wszystkie bazy/history/mail/model/search są nowymi lokalnymi fixture.

| Wykonanie | Zaobserwowany wynik |
| --- | --- |
| Pierwsza seria R14 + koordynator | 49/50 PASS; istniejący test okna dostał HISTORY_REQUIRED, nie SEND_WINDOW_CLOSED. |
| Pierwsza korekta fixture okna | Start blisko 23:59; celowane 2/2 PASS, ale pełny check później ujawnił dalszy problem kroku 16 min. |
| Następna seria CLI/R14/fixture/koordynator | 61/61 PASS, exit 0, 56002,6768 ms; później dodano siedem wariantów uszkodzonego ACK do pełnego checka. |
| Pierwsze E2E nowego publicznego adaptera | 0/4; ścisła konfiguracja polityki dostała także zapisane metadane. Naprawiono projekcję do istniejącego schematu, bez poluzowania walidatora. |
| E2E po projekcji; po rozszerzeniu SEND_UNKNOWN | 4/4 PASS w 42,7 s, następnie 4/4 PASS w 39,0 s po nowych asercjach. Nie zmieniono rzeczywistego transportu. |
| Krótki Node public entry + localhost | COMPLETED, 35563,4848 ms, jedna fikcyjna akcja/próba, 3 heartbeat, max przerwa 10077,2359 ms; wszystkie własne zasoby zwolnione. To czas przyspieszony researchu. |
| Aktywny Codex: własna lokalna strona | PASS ograniczonego narzędzia strony: nowa karta, example.test, licznik 1, brak zewnętrznych żądań; PNG w dowodach. |
| Aktywny Codex: import publicznego wejścia | HOST_TEST_NOT_RUN: rzeczywista próba zakończona `process is not defined` w nodemailer; fixture nie została wywołana. Host VM wybiera własne korzenie zależności. Bez wstrzykiwania globali/poszerzania uprawnień. |
| Rzeczywiste 8 h aktywnego hosta | HOST_TEST_NOT_RUN; gotowy runner wallClock:true i dokładne wejście w NIGHTFLOW_HOST_FIXTURE. |

Pierwszy pełny check 21.10: **FAIL, exit 1**, 760/761 backend, zero SKIP/cancel,
710521,5029 ms, 08:13:51.084–08:25:41.606 UTC. Manifest przed/po był identyczny:
`55ea85de8197345014b89750d262f7fa43e39a9c97bcadedeb8ebb536e389a39`.
Jedyny błąd: istniejący test okna zwrócił SESSION_STOPPED; CLI z telemetrią
przeszedł w 3680,6881 ms (spawn 16,6549 ms), ostatnia faza SENDING, ostatnie
zdarzenie RESULT, status 0, signal/errorCode null. Osobny Stop/build/UI nie
zostały uruchomione przez pipeline po tym FAIL.

Diagnoza fixture okna: ogólny wait koordynatora fixture przesuwał czas o 16 min
przy każdym oczekiwaniu. Po ustawieniu 23:58 przeskakiwał północ, zanim sender
osiągnął swój termin. Dawny scan wymuszający kolejną 23:59 powodował skok prawie
o dobę i wcześniejsze wygaśnięcie innych kontroli. Próba samego jednorazowego
skoku 61 s pokazała prawidłowe COMPLETED w ponownie otwartym oknie (zachowany
FAIL, nie zmiana asercji do PASS). Ostateczna fixture zaczyna dokładnie 23:57:00,
używa żądanych milisekund wait i przekracza okno raz, o 61 s podczas scan.
Celowany test PASS z niezmienioną asercją SEND_WINDOW_CLOSED i zerem POST.
Kod bramek i koordynatora nie był w tym celu zmieniany.

Przed finalnym checkiem wyrównano 199 niezmienionych plików w izolowanym
checkoutcie z CRLF do literalnych bajtów LF już zapisanych w Git. Sprawdzono
każdy transform, bez zmiany treści, migracji lub zależności i bez kosmetycznego
diffu tych plików. Dzięki temu finalny manifest bajtów testowanych plików
można wprost porównać z archiwum commitu. `line-endings.json` zachowuje hashe
przed/po, a pierwszy wynik checka pozostaje oddzielnym wykonaniem.
Po wyrównaniu ponownie wykonano krótki public entry: COMPLETED po
35620,0205 ms, jedna fikcyjna próba/akcja, trzy heartbeat i pełny cleanup.

Drugi pełny Windows check, przed nowym CI 39572278361: **PASS, exit 0**, 761/761 backend, 12/12 serial Stop,
typecheck/build i 26/26 Playwright (1,5 min); zero FAIL/SKIP/cancel. Windows
10.0.26300 x64, Node 24.19.0, npm 11.17.0, SQLite 3.53.4. Rzeczywiste polecenie
`node --import tsx scripts/offline-check.ts --output <NOWY_KATALOG_POZA_REPO>`
uruchomiło `npm run check` z izolowanym HOME/USERPROFILE/APPDATA/LOCALAPPDATA/
TEMP/CODEX_HOME/data i allowlistą środowiska. Czas 813305,5537 ms,
2026-10-21 08:30:59.177–08:44:32.484 UTC. Przed/po identyczne 223 pliki kodu:
`8cddc799fedfe8df74d3c8b11d86cb8fe9f996c008ca8dca4e13ab8f0a84df0e`.
To rzeczywisty UNCOMMITTED_WORKTREE od c03161ba; końcowy pakiet porównuje
każdy z 223 plików z literalnym blobem finalnego commitu. Dokumentacja i dowody
są aktualizowane osobno. Cały wynik i manifest są w `r14-ci-host-evidence/`.
Finalny badany proces CLI: 3502,9805 ms, normalny EXIT. W osobnej serii Stop
maks. reception 181,59 ms, receive→revoke 0,61 ms, zero nowych POST po revoke;
duża fixture zachowała 10035 firm. Progi i pełne rekordy 12 pomiarów pozostają
bez zmian. Sprawdzenie indeksu potwierdziło literalną zgodność wszystkich
223 testowanych plików z bajtami przeznaczonymi do commitu.

Stan: **poprawki i testy kodu zakończone; rzeczywisty host nadal nieweryfikowany**.
Ostateczny commit/CI, hashe ZIP-a,
manifest i odtworzenie patcha są w metadanych przekazania dołączanych po commicie;
nie wpisujemy przyszłego SHA do źródeł.

## Niewykonane i przed kontrolowaną aktualizacją

Pełne utrzymanie aktywnego hosta Codexa i osiem godzin nadal wymagają
krótkiej próby w hoście z obsługą Node + dokumentowanego tab w jednym
oczekującym wywołaniu, następnie wallClock:true. Gotowy runner używa tylko
kompletnej nowej fixture. Node E2E, przyspieszony zegar i otwarte okno nie
zastępują tego dowodu. Nie obiecujemy pracy po zakończeniu zadania.

Nie aktualizowano WORKSTATION, nie otwierano produkcyjnej bazy/WAL/SHM,
CV, poczty, sekretów lub prywatnych deskryptorów. Nie uruchamiano publicznego
researchu, modelowych providerów, Gmaila/OAuth, rzeczywistego SELF_TEST lub
wysyłki. Nie zatwierdzono prawdziwego planu i nie użyto Start/Resume prywatnej
sesji. Nie zmieniono nadawcy, liczników, historii, blokad lub ustawień Windowsa.
Zamykano wyłącznie własne testowe zasoby; nie zatrzymywano procesów użytkownika.

Osobno pozostają: rzeczywiste materiały/nadawca/polityka/reguły planu,
potwierdzone Stop → koniec operacji → zamknięcie backendu → spójny backup
→ kontrolowana wybrana wersja/build/doctor/audyt zachowania historii → zatrzymana
instalacja, potem osobno zatwierdzony pilot. AUTO_POLICY nadal nie wymaga
akceptacji każdego zgodnego maila. W tej pracy nie wykonuje się tych operacji.
