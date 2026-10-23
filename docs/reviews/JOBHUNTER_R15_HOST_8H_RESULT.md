# R15 i rzeczywisty host — 22–23.10.2026

Zakres: syntetyczny DEVELOPMENT, bez wdrożenia, prywatnej historii/materiałów,
Gmaila, OAuth, SELF_TEST i prawdziwej kampanii. R1–R14, koordynator, biblioteka
i rozdzielenie Node/adapter zachowane. Paczkę wejściową rozpakowano poza repo;
INPUT_MANIFEST: 17/17 zgodnych długości i SHA-256. Raport i odtworzenia przeczytano.
Baza zadania: f03b50f738046467f9948713cf2c2bdbf7c7b246, po fast-forward istniejącej
czystej gałęzi codex/windows-nightflow-fixes; pozostałe gałęzie bez zmian.

## R15

Pierwsza poprawka: 56d3d8064b21d8127dc0e3958518a4e2028a5815. Kontrole przed wejściem,
po tab/probe/attach i bezpośrednio przed write Start; sygnał pozostaje przypięty.
Flaga started ustawiana przy dispatch, bez resetowania po możliwym przyjęciu.
Idempotentny cleanup czeka na oczekujące podłączenie; niepotwierdzony release
nie jest sukcesem lub authority=false. Szczegóły API w HOST_ADAPTER.md.

Nowe utrzymywane testy wykonują oryginalny moduł adaptera, mapując wyłącznie
importy dist na źródła TypeScript. Klient, named pipe, broker, koordynator,
SQLite i pełne providery fixture są rzeczywiste; Promise/barier użyto do
kontroli oczekiwań, także opóźnionej/utraconej odpowiedzi prawdziwego socketu.
Liczniki Start/job/rezerwacja/próba/akcja/uprawnienie są rozdzielone.
12 nowych testów R15 oraz 2 hosta i 32 R14: 46/46 PASS, exit 0.
Statyczny graf siedmiu modułów: PASS. Pierwszy błąd nowych testów był odczytem
nieistniejącego service.options.gateway; poprawiono fixture na service.gateway,
zachowując pierwszy wynik. Nie zmieniono progów Stop ani istniejących testów.

Po pierwszym pełnym check poprawiono wyścig: po potwierdzonym ackResult owner
zamyka IPC, więc adapter nie wykonuje dodatkowego release przez zamykany kanał.
Niepotwierdzony cleanup przy przerwaniu nadal zgłasza błąd. Końcowy kod aplikacji
i testów użyty w rzeczywistym hoście: **83323636e6e6bd236b62e3bd28b2a449d8a000f4**. Po korekcie: 18/18
celowanych testów natywnych (R15, host, fixture) i 4/4 publicznych scenariuszy UI
complete/stop/executor-loss/lost-ack. Wall-clock fixture korzysta z istniejącego
WAIT_DEADLINE; zwykła krótka fixture pozostaje FINISH. Nie zmieniono produkcyjnych planów.

Po zakończeniu 8 h odtworzono osobną słabość nowych testów IPC: zatrzymany
koordynator może zakończyć się przed barierą VALIDATING, a samo oczekiwanie
gate.entered wtedy pozostaje nierozstrzygnięte. Kontrolowany wcześniejszy Stop
potwierdził STOPPED, barrierReached=false i brak rezerwacji/akcji. Fixture
przeniesiono do pierwszej kontrolowanej fazy REFRESHING; oczekiwanie ściga teraz
barierę z zakończeniem ownera i odrzuca przedwczesny koniec, zwalniając własne IPC.
Nowa regresja weryfikuje ten błąd i cleanup. 51/51 testów R15/R14/host/fixture
PASS, exit 0; zachowano dowód przed poprawką. To poprawka testowej synchronizacji,
nie zmiana aplikacji, czasu badania, progów Stop ani założeń utraconego ACK.
Nie ustalono, że ta słabość była przyczyną anulowania CI: logi joba wymagają
logowania, a connector ich nie udostępnia; brak dostępu zapisano osobno.

## Windows check i CI

Istniejący scripts/offline-check.ts uruchomił pełne npm run check z izolowanymi
HOME/APPDATA/LOCALAPPDATA/TEMP/CODEX_HOME/data i kompletnymi fikcyjnymi providerami.
Windows x64 10.0.26300, Node 24.19.0, npm 11.17.0, SQLite 3.53.4.

- Pierwszy check 56d3d80: exit 1; 785/785 backend, 12/12 Stop, 24/26 UI,
  typecheck/build PASS; 753117,9353 ms. Dwie porażki ujawniły wyścig cleanup po
  ACK raportu; zachowano je i usunięto przyczynę, bez złagodzenia testów.
- Check 8332363: **PASS, exit 0**, 786/786 backend, 12/12 Stop, 26/26 UI,
  typecheck/build; 748135,3822 ms. 22.10, 21:10:41.857–21:23:09.981 UTC.
  Fingerprint 069d781ad1ec7cfbe1742dca3d5530a547c81eafd61c4ee6ef35f554231bb2e2
  identyczny przed/po. Wszystkie źródła testowano na dokładnych bajtach Git.
- Końcowy pełny check drzewa dostawy i jego fingerprint: review/test-summary.json
  i review/source-files.json. To odrębne wykonanie po zmianie tekstu szablonu
  packagera, budżetu joba CI i synchronizacji regresji IPC, już po zakończeniu
  i cleanup próby 8 h. Wyniki wcześniejszych pełnych check pozostają w historii.

CI starych SHA odczytano przez publiczne GitHub API (connector był niedostępny):
39853010027 / 56d3d80 oraz 39855099716 / 8332363: completed / cancelled.
Nie są PASS. Stan CI dokładnego finalnego SHA, odczytany po jego zwykłym push,
jest osobno zapisany w review/ci.json, z linkiem i SHA; lokalny PASS go nie zastępuje.
Drzewo ca79c2ebfa0c1cb0c7c107d0d8f9d7e231bdcc6b przeszło także pełny lokalny
check: 786/12/26, exit 0, 738071,4288 ms, fingerprint
7eda689c34f8a5c8ac77181c0b3cdfccd896b060a9e1ad4b6c6f6a977d7cddc7.
Jego CI 39906037731 / 120258116376 anulowano po limicie 25 minut;
adnotacja GitHub potwierdza przekroczenie maximum execution time 25m0s.
Po tym konkretnym dowodzie zwiększono tylko budżet całego joba do 40 minut.
Testy, fixture, 30 s nadzoru CLI, lease i progi Stop pozostają niezmienione.
To nie ponowienie niezmienionego CI do pierwszego PASS. Wynik nowego SHA
jest rejestrowany niezależnie w końcowej paczce.

## Rzeczywisty Codex

Pre-abort: cua_repl, process undefined, oryginalny publiczny runNightflowTask,
własna karta localhost i pełna fixture. AbortError; zero nightflow_jobs,
send_attempts, usage_ledger i browser_deliveries, zero lokalnych akcji.
Harness pre-abort napotkał zamknięty stdin exec_command. Zakończono wyłącznie
jego zatrzymany syntetyczny proces i usunięto jego własny katalog; nie deklarujemy
łagodnego finally tego harnessu. Dowody rozdzielają to od poprawnego pre-abort.
Nowa krótka próba na końcowym buildzie: **PASS / COMPLETED**, 7503,0545 ms adaptera,
21:23:38.546–21:23:46.050 UTC. Ten sam publiczny runNightflowTask najpierw odrzucił
pre-abort, potem wykonał jeden pozytywny przebieg. Jedna rezerwacja, próba,
pochodna zgoda partii i lokalna akcja; 18 odnowień, największa przerwa 2386 ms.
Pełny cleanup ownera/locka/IPC/strony/katalogu i własnej karty potwierdzony.
To nowy wynik; wcześniejsze krótkie wykonanie poprzedniej wersji pozostaje historią.

## Osiem godzin czasu rzeczywistego

**PASS wykonania / COMPLETED**, jedna ciągła próba w tej samej aktywnej rozmowie,
ten sam obiekt CodexNightflowAdapter, task r15-real-eight-hours, owner, job,
generacja i plan fixture-nightflow-v1. Nie było restartu, drugiego Start lub
sumowania niezależnych sesji. Backend Node24 i pełne FixtureReader/FixtureRunner/
FixtureGmail, nowe DEVELOPMENT, testowy PDF i odbiorca example.test, własna karta
localhost w rzeczywistym cua_repl (process undefined). Bez produkcyjnych danych.

- Attach 22.10 21:24:44.214 UTC; ACK Start 21:24:44.516 UTC.
- RESEARCHING 22.10 21:24:44.322 → VALIDATING 23.10 05:24:44.534 UTC:
  **28 800 212,5490 ms monotonicznego czasu**, czyli osiem godzin + 212,549 ms.
  Od REFRESHING: 28 800 277,6348 ms. Czas oczekiwania ownera na attach wyłączony.
- SENDING dopiero 23.10 05:24:44.631 UTC; wynik i cleanup 05:25:47 UTC
  (07:25:47 Europe/Warsaw). 956 segmentów; zero zmian zakresu; 88902 odnowienia,
  największa przerwa 2251 ms wobec lease 45000 ms; brak wygaśnięcia.
- Końcowy guard i kwalifikacja dopuściły jedną pozycję; researchOutcome DEADLINE,
  researchComplete true i phaseGuardFinishedAt zapisane. Materiały przeszły
  normalne kontrole; nie poprawiano ręcznie PASS lub dat. Daty 18.10 w checkpoint
  są datami logicznymi fixture; rzeczywisty czas pochodzi z UTC i performance.now.
- Przyrost: jeden job, usage_ledger, send_attempt, browser_delivery i grant partii.
  Jedna przyznana możliwość kliknięcia oraz osobno **jedna faktyczna lokalna akcja**
  z licznika strony. SENT_PROVIDER / ACKNOWLEDGED fixture nie dowodzą Odebranych.
- Końcowe authority false, adapterClosed true; lock, oba IPC, owner, własna
  strona, katalog i karta zamknięte. leaseValid true w diagnostyce wyniku jest
  pomiarem przed dispose; potwierdzony cleanup jest osobnym polem.

Granica hosta: dwa wywołania MCP zwróciły timeout odpowiedzi po 300 s mimo
parametrów 29700000 ms i 30000 ms. Nie był to koniec wykonania w VM. Oryginalny
adapter nadal odczytywał swoją kartę, wykonywał realne IPC i zapisywał segmenty.
Ta rozmowa pozostała aktywna i czekała na ten sam wynik; monitor tylko czytał
zagregowany plik postępu, nie odnawiał lease i nie generował heartbeatów.
Po końcu narzędzie ponownie odpowiedziało, odczytano licznik 1 i zamknięto kartę.
Wynik utrzymania wykonania 8 h jest PASS, ale pojedyncza odpowiedź RPC 8 h
**nie** jest PASS. Dla sterowania używać istniejących krótkich segmentów i
istniejącego przypiętego Stop; nie zakładać, że timeout RPC zatrzymuje zadanie.

Build obu nowych prób: sourceSha 83323636e6e6bd236b62e3bd28b2a449d8a000f4,
buildId 2834f07c-56fa-4910-8048-9f6810ff8a99,
sourceTreeHash dec6e55fef31e5d2a11c344e19c32c8e5b5029ed96cb407f473855031f548593,
loadedCodeHash a0f36901fa8a44de221edd0724906422da70dd52bfb120b7d0a140ae275bebd5,
adapter SHA-256 6257b489e2f8b4940b3b964040b79db1ccda8abc82620c64e0a9224e9f13cc54.
Nie zmieniano źródeł lub buildu podczas długiej próby. Późniejsza różnica kodu
dostawy dotyczy tekstu szablonu scripts/package-nightflow-review.py
który odsyła teraz do rzeczywistego raportu zamiast zawsze pisać „8 h nieweryfikowane”,
budżetu joba .github/workflows/offline-check.yml (25 → 40 minut) oraz opisanej
synchronizacji tests/nightflow-adapter-cancellation.test.ts. Bajty aplikacji
i lekkiego adaptera są identyczne; porównano też hash ponownie zbudowanego runtime.
Zgodność pozostałych testowanych plików i dokładny wykaz tej różnicy są w dowodach.

## Dostawa i dalsze kroki

CI jest odrębne od lokalnego check; finalny SHA i stan będą w review/ci.json ZIP-a.
Archiwum ma zawierać pełne dokładne drzewo Git, patch od bazy, manifest i dowody.
Przed późniejszą aktualizacją i pilotem pozostają osobno dopuszczone: Stop/koniec
operacji/zamknięcie backendu, spójny backup z WAL, wybór builda/build/doctor,
preview aktualnego profilu i checkpointu PAUSED, zatwierdzenie dokładnych nowych
faktów/PDF/nadawcy, plan/tempo/limity/okno, odnowienie źródeł i mały pilot.
