# Publiczne wejście nightflow — odtwarzalna lokalna fixture

Stan 21.10.2026: `HOST_TEST_NOT_RUN` dla całego przebiegu w aktywnym hoście
Codexa i dla ośmiu godzin tego hosta. Faktyczna próba importu publicznego
`scripts/browser-executor.mjs` w `cua_repl` zwróciła `process is not defined`;
kolejna próba wskazała errored module `nodemailer` / `ERR_VM_MODULE_LINK_FAILURE`.
Narzędzie strony działa, lecz ten kontekst VM nie dostarcza globalnego `process`
wymaganego przez załadowaną zależność Node. Nie wstrzykiwano globali, nie zmieniano
zależności lub uprawnień hosta i nie podstawiano `available=true`.

W osobnej nowej karcie narzędzie rzeczywistego Codexa otworzyło nasz HTTP
localhost, wypełniło fikcyjne pola i odebrało licznik jednej lokalnej akcji.
Ta ograniczona kontrola strony nie jest wykonaniem koordynatora ani testem
Gmaila. Kartę i własny serwer zamknięto. Dowód PNG jest w paczce przekazania.

## Gotowe wejście

`scripts/nightflow-host-fixture.mjs:runLocalHostFixture()` wywołuje istniejący
`scripts/browser-executor.mjs:runNightflowTask()` i ten sam koordynator, lease,
IPC, scope, kwalifikację, finalne bramki i sender. Dodano mały adapter fixture,
bez drugiego koordynatora. Każda próba tworzy nowy katalog DEVELOPMENT, komplet
FixtureRunner/FixtureReader/FixtureGmail i fikcyjne metadane konta/historię/CV.
To nowa syntetyczna historia z szablonem profilu repo, bez odczytu instalacji.
Plan testowy dotyczy wyłącznie tej nowej bazy i nie dziedziczy zgód produkcyjnych.

Własny serwer wiąże `127.0.0.1` na losowym porcie; CSP blokuje sieć i formularze.
Browser i broker wymagają tego konkretnego origin. Fixture nie akceptuje Gmaila.
Opcje fixture są odrzucone z WORKSTATION lub częściowym providerem. Przed bazą
sprawdzana jest obecność markera WORKSTATION w przodkach; publiczna fixture nie
otwiera niepustego profilu. Produkcyjny broker nadal nie uznaje lokalnej obserwacji
za obserwację Gmaila. Nie zmieniono protokołu zatwierdzania prawdziwego transportu.

W izolowanym checkoutcie, Node24, po `npm ci` i `npm run build`:

```powershell
# Node/Playwright, osobny poziom dowodu; realny czas researchu przyspieszony:
node scripts/nightflow-host-fixture.mjs --steady-short --output "<NOWY_PLIK_POZA_REPO>.json"

# Gotowy runner 8 h czasu monotonicznego plus zakończenie i cleanup.
# NIE wykonano go w bieżącym zleceniu; nadal Node/Playwright, nie host Codexa:
node scripts/nightflow-host-fixture.mjs --wall-clock --output "<NOWY_PLIK_8H_POZA_REPO>.json"
```

Nie wymaga prywatnych markerów, kont, CV ani zmiennych produkcyjnych. Chromium
używa nowego kontekstu, a route blokuje zewnętrzne żądania. Runner ma końcowy
deadline 8 h + 15 min, próbkuje postęp co 15 min i zapisuje bounded fazy,
tożsamość kodu/instancji/zakresu, rzeczywiste UTC/monotoniczne czasy,
heartbeat, liczbę fikcyjnych prób i stan cleanup. Osiem godzin researchu
nie jest skracane liczbą cykli. Nie tworzy demona lub mechanizmu wznowienia.

Dla aktywnego hosta mającego w jednym kontekście dokumentowane `tab` oraz
obsługę zależności Node, dokładnym wejściem po buildzie jest:

```js
// fixtureTab jest NOWĄ własną pustą kartą; nigdy kartą prywatnej poczty.
const fixture = await import('file:///C:/isolated/JobHunter/scripts/nightflow-host-fixture.mjs');
const report = await fixture.runLocalHostFixture({
  tab: fixtureTab,
  taskId: 'explicit-owned-fixture-task',
  wallClock: false, // najpierw krótka próba; następnie osobno true dla rzeczywistych 8 h
  onProgress: (event) => nodeRepl.write(event)
});
nodeRepl.write(report);
```

Ścieżkę należy zastąpić rzeczywistą ścieżką izolowanego checkoutu. Funkcja sama
otwiera własny localhost w podanej nowej karcie. Caller musi utrzymywać i odebrać
to samo oczekujące wywołanie; otwarte okno lub kolejne nowe sesje nie wystarczają.
Najmniejszy następny krok to uruchomić krótkie wejście w obsługującym je hoście,
bez obchodzenia ograniczeń obecnego VM; dopiero po nim rzeczywistą próbę 8 h.

Utrzymywane E2E sprawdzają normalne zakończenie, potwierdzone Stop, utratę karty
i utracone ACK po jednej akcji (SEND_UNKNOWN, bez ponowienia). Istniejące testy
brokera/kontrolera nadal sprawdzają odmowę przejęcia nowego backendu/sesji.
Nie utożsamiamy Node E2E, narzędzia strony, hosta Codexa i Gmaila.
