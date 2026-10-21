# Odtwarzalna fixture Node owner ↔ rzeczywisty host

Stan 21.10.2026: krótki pełny przebieg w `cua_repl` **COMPLETED**. Jedna
rezerwacja, jedna lokalna fikcyjna akcja, wynik i cleanup. Osiem godzin
rzeczywistego czasu: **NOT_RUN**. Nie testowano Gmaila ani prywatnej historii.
[Granica, komendy produkcyjne po osobnym wdrożeniu i Stop](HOST_ADAPTER.md).

Historyczna porażka `process is not defined` z nodemailera była skutkiem
importowania backendu w VM narzędzia. Zachowane dowody R14 opisują wcześniejszy
stan. Teraz `browser-executor.mjs` jest lekki, a `nightflow-node-owner.mjs`
ładuje Store, koordynator i providery wyłącznie w zwykłym Node24. To granica
procesów; nie dynamiczne ukrycie tego samego ciężkiego importu.

## Krótki test przez rzeczywiste narzędzie

W izolowanym checkoutcie, po `npm ci` i `npm run build`, uruchomić w terminalu
Node24 i pozostawić operację pod nadzorem aktywnego zadania:

```powershell
node scripts/nightflow-node-owner.mjs --fixture --ready <NOWY_PLIK_READY_POZA_REPO> --output <NOWY_PLIK_WYNIKU_POZA_REPO>
```

CLI sam tworzy nowy DEVELOPMENT, komplet FixtureReader/FixtureRunner/FixtureGmail,
syntetyczny PDF i lokalną stronę. Nie akceptuje istniejącej historii, planu,
markera WORKSTATION ani Gmaila. Własny HTTP wiąże wyłącznie losowy port
127.0.0.1; CSP blokuje połączenia i wysyłanie formularza. `ready` zawiera
syntetyczny katalog, dokładny URL i build identity, bez sekretu IPC.
Nie drukować browser-executor.json ani nightflow-control.json.

W aktywnym narzędziu strony odczytać własny plik ready przez sprawdzone fs,
otworzyć NOWĄ własną kartę na jego URL i zaimportować adapter:

```js
const adapterModule = await import('file:///C:/isolated/JobHunter/scripts/browser-executor.mjs');
const adapter = new adapterModule.CodexNightflowAdapter(
  ready.dir, 'explicit-owned-fixture-task', fixtureTab, { fixtureOrigin: ready.origin }
);
await adapter.connect(); // NOT_STARTED, authority=false
await adapter.start();   // jawny Start fikcyjnego planu w tym ownerze
let result;
do {
  result = await adapter.segment(30000);
  // odebrać postęp i pozostawić to samo zadanie/obiekt aktywne
} while (result.status === 'WAITING');
await adapter.close();
```

Ścieżka oznacza faktyczny osobny checkout. Użyć wyłącznie API karty opisanych
przez bieżące narzędzie. Nie zakładać dostępności fs/net/timerów bez probe.
W bieżącej sesji potwierdzono je przy braku globalnego process. Nie wstrzykiwać
globali, nie instalować pluginów, nie czytać kart lub plików prywatnej poczty.

Owner oczekuje na attach i Start; samo listen nie daje ready=true. Pierwsza
uzgodniona instancja/job/generacja nie może się zmienić. Scope wyznaczonej
partii jest sprawdzany aż do ostatniej bramki. Lease 45 s odnawia realny adapter,
a owner monitoruje jego ważność. Nie ma podtrzymywania przez udawany host.
Po końcu potwierdzić zamknięcie ownera, locka, obu kanałów, strony i katalogu.

## Oddzielny poziom Node/Playwright

```powershell
node scripts/nightflow-host-fixture.mjs --steady-short --output <NOWY_PLIK_POZA_REPO>.json
```

To ten sam owner/adapter/IPC i pełny koordynator, ale uchwyt karty należy do
zwykłego Playwrighta. Nie podpisywać wyniku jako host Codexa. Route blokuje
zewnętrzną sieć. Utrzymane E2E sprawdzają sukces, Stop, utratę karty i utracony
ACK. Backendowe testy IPC sprawdzają restart, zakres zmieniony podczas await,
wygaśnięcie lease oraz R14 Stop/status/report przy błędzie lub utracie odpowiedzi.

## Osiem godzin czasu rzeczywistego

Po krótkim sukcesie ten sam CLI ownera przyjmuje dodatkowo `--wall-clock`.
Zegar jest monotoniczny; właściciel ma limit 8 h + 15 min na zakończenie.
Adapter musi przez cały czas działać w tym samym aktywnym zadaniu i odebrać
wynik po deadline. Alternatywnie Node/Playwright ma własną flagę --wall-clock,
która nadal nie dowodzi utrzymania hosta Codexa.

Nie uruchomiono tego testu w tym zleceniu. Gotowy runner nie jest wynikiem.
Nie instalować harmonogramu i nie obiecywać kontynuacji po końcu zadania.
Przyspieszony research w krótkiej fixture nie jest ośmioma godzinami.

## Przeprowadzone negatywne próby rzeczywistego hosta

- Potwierdzony Stop istniejącym CLI: AUTHORITY_REVOKED, zero lokalnych akcji;
  ACK zachowuje MAY_BE_IN_FLIGHT i maintenanceReady=false.
- Utracony ACK po kliknięciu i zamknięcie karty po kliknięciu: jedna akcja,
  SEND_UNKNOWN/NEEDS_RESOLUTION, bez ponowienia.
- Zamknięcie własnej karty przed akcją: STOPPED, zero akcji.
- Obcy batch, origin, odbiorca, body i hash PDF: odmowa i zero akcji.
- Jedna wcześniejsza próba Stop po wygaśnięciu testowego ownera zwróciła
  STOP_UNCONFIRMED/UNKNOWN, bez fałszywego potwierdzenia.

Nie odtwarzano restartu ownera ani utraty odpowiedzi Stop po mutacji w samym
cua_repl. Mają odrębne rzeczywiste testy Node IPC i nie są sumowane z macierzą
narzędzia. Końcowe dowody obejmują fazy, UTC/monotoniczny czas, build/hash,
liczby rezerwacji i akcji, przerwę heartbeat, lease oraz cleanup. Nie zawierają
sekretów ani pełnych payloadów. Wczesne porażki pozostały w historii weryfikacji.
