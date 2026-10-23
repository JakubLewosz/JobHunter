# Node owner i lekki adapter Codexa — 21.10.2026

23.10: [jedno konto i pomocnicze API](SINGLE_ACCOUNT.md). Podział Node24/lekki
adapter oraz R1–R15 pozostają. Samą tożsamość sprawdza helper bez ownera,
runNightflowTask, Start lub wiadomości. Natywny transport pozostaje browser-only.

Nowe wykonanie 22–23.10: krótka pełna fixture i osiem rzeczywistych godzin
COMPLETED, jedna fikcyjna akcja i cleanup. Limit odpowiedzi RPC300 s opisano
oddzielnie w [raporcie R15](reviews/JOBHUNTER_R15_HOST_8H_RESULT.md).
Poniższe datowane wyniki 21.10 zachowują historię poprzedniego etapu.

Aktualizacja R15 (22.10.2026): `connect(signal)` i `start(signal)` sprawdzają
anulowanie przed pracą, po oczekiwaniach oraz przy samym przekazaniu komendy
do socketu. Sygnał z connect pozostaje przypięty także przy `start()` bez
argumentu; można też przekazać `options.signal` konstruktorowi. Publiczne
`runNightflowTask` odrzuca już anulowane wejście przed utworzeniem klienta.
Przed dispatch flaga started pozostaje false; po dispatch nie wraca do false,
także przy utracie odpowiedzi. Start nie jest ponawiany. Close czeka na własne
oczekujące podłączenie i zwalnia własnego workera najwyżej raz. Brak potwierdzenia
release daje `BROWSER_RELEASE_UNCONFIRMED`, bez deklaracji utraty uprawnienia.
Po potwierdzonym ackResult cleanup należy do kończącego się ownera; adapter
nie wykonuje drugiego release przez już zamykany kanał.
Samo zwolnienie workera nie jest ACK Stop ani potwierdzeniem końca operacji;
wynik przerwanego segmentu zachowuje `authority: UNKNOWN`. Kontrakt R14 pozostaje.
Wyniki nowego wykonania: [raport R15](reviews/JOBHUNTER_R15_HOST_8H_RESULT.md).

Backend działa w zwykłym Node 24 na Windowsie. `scripts/browser-executor.mjs`
importuje wyłącznie wykonawcę UI, klienta IPC i kontroler partii. Nie ładuje
Store, SQLite, nodemailera, OAuth ani koordynatora. Import w rzeczywistym
`cua_repl` działa przy `typeof process === 'undefined'`. Nie dodano globali,
proxy HTTP, CORS, CDP, API key, nowych zależności ani uprawnień przeglądarki.

Właściciel Node używa `withNightflow` i istniejącego `NightflowCoordinator`.
`RemoteNightflowHost` obsługuje cztery ograniczone komendy przez obecny
uwierzytelniony named pipe brokera: attach, start, poll, ackResult. Sekret
czyta tylko klient w pamięci. Nie wypisywać deskryptora lub payloadów.

## Kolejność w jednym aktywnym zadaniu

Po odrębnie zatwierdzonym wdrożeniu i konfiguracji istniejącego WORKSTATION:

1. W zwykłym Node uruchomić zatrzymanego właściciela:
   `npm --silent run nightflow -- browser-owner --workstation --data-dir <HISTORIA> --plan <ZATWIERDZONY_PLAN>`.
   Wymagany jest wcześniejszy build. Sam komunikat STOPPED_OWNER_READY nie daje
   prawa sesji ani gotowości transportu. Owner utrzymuje lock i kanały IPC.
   Jawne wznowienie istniejącego checkpointu wymaga dodatkowego `--job <ID>`;
   koordynator zachowuje wcześniejszy deadline i reguły resume. Restart sam tego nie wybiera.
2. W tym samym aktywnym zadaniu narzędzia przeglądarkowego zaimportować lekki
   `scripts/browser-executor.mjs`, przekazać świadomie wskazany uchwyt `tab`
   i połączyć `CodexNightflowAdapter(dir, taskId, tab).connect()`.
   Attach odnawia lease tej instancji; nie wykonuje Start i nie rezerwuje próby.
3. Dopiero świadomy `adapter.start()` uruchamia wcześniej zatwierdzony plan
   w właścicielu Node. Późniejsze normalne przejścia nie potrzebują nowej zgody.
   `runNightflowTask({dir,taskId,tab,...})` łączy te kroki dla polecenia użytkownika
   już autoryzującego Start. Nie przekazywać do adaptera dawnych opcji fixture/plan:
   plan i providery należą do osobno uruchomionego właściciela.
4. Odbierać kolejne `await adapter.segment(30000)` aż do wyniku terminalnego;
   ten sam obiekt pozostaje przypięty. `runNightflowTask` wykonuje tę pętlę i
   obsługuje onSegment. Zadanie Codexa czeka na obie części i końcowy raport.
   Nie wystarczy odłączony Node albo samo otwarte okno. Nie ma autostartu,
   harmonogramu, wake ani gwarancji kontynuacji po zakończeniu zadania.
5. Stop używa istniejącej komendy `nightflow stop --data-dir <HISTORIA>`.
   [R14](NIGHTFLOW_CONTROL.md) nadal obowiązuje: bez ACK jest UNKNOWN; ACK
   odbiera prawo, lecz nie potwierdza zakończenia operacji lub maintenance.
   Następnie odebrać zakończenie ownera i cleanup. Zatrzymanego ownera, do którego
   nigdy nie wykonano Start, można zakończyć sygnałem jego własnego procesu;
   samo Stop nie jest poleceniem kasowania locka lub zabijania obcego procesu.

Jedno polecenie użytkownika w rozmowie mapuje się na uruchomienie ownera przez
terminal oraz wykonanie/monitorowanie adaptera przez udokumentowane narzędzie
tej samej aktywnej rozmowy. Node nie próbuje sam tworzyć sesji przeglądarkowej.
Frontend nie jest wymagany. Nie wdrożono tej wersji na WORKSTATION.

## Zakres i utrata hosta

Klient przypina sekret instancji. Host przypina jednego workera, job i generację
otrzymaną po Start; później przyjmuje tylko wyznaczony scope zamkniętej partii.
Claim/authorize/check nadal wymagają backend/session/generation/batch. Zmiana
deskryptora lub zakresu kończy pracę, bez przejęcia nowego zadania. Po await
sprawdzane są sygnały odwołania. Lease hosta ma 45 s i jest odnawiany tylko
przez adapter po rzeczywistym odczycie uchwytu karty. Timer Node kontroluje
ważność, nie wysyła sztucznych heartbeatów. Finalna bramka sprawdza lease.

Treść jest wpisywana dokumentowanymi fill/type/Shift+Enter. Probe wykazał, że
wieloliniowe fill w tym hoście tworzy dodatkowe rendered newlines. Nie
poluzowano dokładnego porównania body. Upload nadal sprawdza hash PDF.
Jedna próba otrzymuje najwyżej jedno końcowe uprawnienie; brak ACK po możliwym
kliknięciu pozostawia SEND_UNKNOWN. Bez retry, API failover i exactly-once.

## Dowody i granice

Krótki rzeczywisty host: pełna fixture, jedna rezerwacja i lokalna fikcyjna
akcja, COMPLETED oraz cleanup. Oddzielne próby obejmują potwierdzony Stop,
utracony ACK, utratę karty przed/po akcji i odmowę obcego scope/originu,
odbiorcy, body oraz PDF. Macierz i hashe są w końcowym pakiecie przeglądu.
Restart/zmiany sesji podczas await i niepotwierdzone Stop mają również
utrzymane testy prawdziwego Node IPC; nie przedstawiamy ich jako restartu
rzeczywistej aplikacji Codex. Rzeczywistych 8 h nie wykonano: NOT_RUN.

Ogólna [oficjalna dokumentacja przeglądarki](https://learn.chatgpt.com/docs/browser?surface=app)
nie potwierdza dostępności konkretnego modułu Node. Decydują kontrakt narzędzia
i probe tej sesji. Zapisane nazwy możliwości nie zawierają prywatnych wartości.
