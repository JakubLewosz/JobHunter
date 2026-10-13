# JobHunter

Osobiste narzędzie do pierwszego kontaktu z firmami działającymi w Polsce: płatna, regularna współpraca programistyczna, w pełni zdalnie, około 20 godzin tygodniowo po lekcjach. Zatwierdzone fakty/CV i polskie wiadomości. Odpowiedzi użytkownik obsługuje w Gmailu.

Od 12 października 2026 kod rozwijamy na Windows/macOS, lecz prawdziwy research i poczta pracują na **jednym domowym Windowsie**. GitHub przenosi kod, nie lokalną historię, CV, szkice lub poświadczenia. Push nie jest deploymentem. Gałąź `codex/local-windows-pilot` obejmuje nocne poprawki `810b860`.

[Specyfikacja](JobHunter_SPEC.md), [wizja](docs/WIZJA_PROJEKTU.md), [styl](docs/MESSAGE_STYLE.md), [zadania](docs/TASKS.md), [testy](docs/TEST_REPORT.md). Rozwój nie upoważnia do prawdziwej poczty, również SELF_TEST, lub zmian prywatnego runtime.

[Publiczny pakiet diagnostyczny z 12 października](docs/research-review/LATEST.md)
opublikowano na jawną zgodę użytkownika: firmy, publiczne kontakty, krótkie
źródła, zachowane wiadomości i zatwierdzone fakty zawodowe. Ten wyjątek dotyczy
konkretnego raportu. Baza robocza, CV, poświadczenia i poczta pozostają lokalne;
publikacja nie jest zgodą na wysyłkę.

## Tryby i środowiska

| Tryb              | Działanie                                                                     |
| ----------------- | ----------------------------------------------------------------------------- |
| DEMO              | Osobna baza, fikcyjne firmy i symulowana poczta.                              |
| RESEARCH_ONLY     | Publiczne źródła/szkice, bez Gmaila i zgód na przyszły send.                  |
| APPROVAL_REQUIRED | Opcjonalny ręczny podgląd i zgoda na paczkę.                                  |
| AUTO_POLICY       | Polityka i świadomy Start; zgodne pierwsze wiadomości bez osobnej akceptacji. |

`JOBHUNTER_RUNTIME=DEVELOPMENT` jest domyślny: osobne dane, technicznie niedostępny natywny Gmail i brak odczytu osobistego konta. Testy wstrzykują pełne fikcyjne providery; AUTO działa z nimi na Windowsie i macOS.

`WORKSTATION` wymaga Windowsa i lokalnego `workstation.json` poza repo, z potwierdzoną istniejącą historią. Sam OS/clone/build/otwarcie panelu nie daje prawa do wysyłki. Materiały/CV/nadawcę/politykę zatwierdza użytkownik; Start udziela prawa sesji.

## Development

Node 24 LTS. Nowy klon, osobny checkout:

```sh
git fetch origin
git switch codex/local-windows-pilot
npm ci
npm run check
npm run doctor
npm start
# drugi terminal:
npm run open
```

Domyślnie DEVELOPMENT/DEMO na 127.0.0.1:4317. JOBHUNTER_PORT wybiera port. Windows: scripts/start.ps1 uruchamia backend w tle i otwiera panel; zamknięcie karty nie kończy backendu. scripts/stop.ps1 lub node scripts/stop.mjs kończy własny backend. Tryb zmieniaj po zamknięciu procesu. .env nie jest ładowany automatycznie.

`npm run dev` wymusza DEVELOPMENT/DEMO; watch nie uruchamia instalacji roboczej.

Zależności są przypięte, .npmrc wyłącza ich skrypty instalacyjne; doctor faktycznie ładuje SQLite. JOBHUNTER_CODEX_PATH wskazuje natywne CLI, bez cmd/bat. Codex używa istniejącego loginu ChatGPT, bez fallbacku do płatnego API.

## Domowy Windows

Procedury A/B/C są w [URUCHOMIENIE_RANO](docs/URUCHOMIENIE_RANO.md). Najpierw diagnostyka **oryginalnej** historii:

```powershell
npm run history:local -- doctor "$env:LOCALAPPDATA\JobHunter"
# Po potwierdzeniu kompletności i zamknięciu backendu:
npm run history:local -- backup "$env:LOCALAPPDATA\JobHunter"
npm run history:local -- configure "$env:LOCALAPPDATA\JobHunter" --confirm-existing-history --single-workstation
$env:JOBHUNTER_RUNTIME = 'WORKSTATION'
$env:JOBHUNTER_MODE = 'AUTO_POLICY'
.\scripts\start.ps1
```

Configure nie tworzy bazy, nie zatwierdza materiałów/polityki i nie włącza sesji. Jeżeli historia jest tylko na Macu, instrukcja opisuje prywatny eksport/import istniejącym formatem, bez GitHuba. Same liczniki nie dowodzą kompletności. Nie zmieniamy nadawcy/OAuth automatycznie; [GMAIL_SETUP](docs/GMAIL_SETUP.md).

Sprawdź fakty/projekty, PDF, konto i zgody Gmaila, Codex/search oraz politykę kontaktów/tempa/limitów. GENERAL zachowuje GENERAL. Brak wakatu może uzasadniać zapytanie z dowodem działalności; nie udajemy dopasowania do oferty. Sprzedaż/faktury/RODO, odmowy firmy i wymagany kanał blokują kontakt.

Publiczny przegląd może jawnie użyć opublikowanego, zatwierdzonego `PROFIL_UZYTY.md`
przez `--snapshot-profile` i `--snapshot-commit` w `scripts/public-research-review.ts`.
Ten wariant zapisuje pochodzenie/hash i `cvVerifiedInThisRun=false`, nie odczytuje PDF.
Baza `diagnosticOnly` nie może zostać otwarta przez usługę Gmail, także w WORKSTATION.
Produkcyjne zatwierdzanie CV nadal wymaga rzeczywistego PDF i zgodnego hasha.

Krótka kontrola publicznego czytnika na macOS lub później na domowym Windowsie:

```sh
node --use-system-ca --import tsx scripts/reader-preflight.ts
```

Polecenie używa kilku niezależnych hostów, liczy redirecty/próby i nie otwiera bazy lub
Gmaila. Flaga jest lokalna dla procesu; nie zmienia systemowego zaufania. PASS na macOS
nie potwierdza magazynu CA Windowsa. Właściwy przegląd wykonuje preflight w tym samym
procesie i konfiguracji co research, w swoim wspólnym budżecie.

## Lokalna historia

`LOCAL_ONLY` jest domyślną strategią, niezależną od trybu pracy. AUTO działa bez repo historii i operacji Git w Start/bramkach/senderze/Stop/readiness. Kontakty, aliasy, blokady, próby i rezerwacje pozostają w SQLite. Jeden profil ma jeden backend także na różnych portach; utrata blokady lub niespójność blokuje send.

`PRIVATE_GIT` jest opcjonalnym modułem kompatybilności. Istniejąca konfiguracja zachowuje go do jawnego przejścia po Stop i sprawdzeniu zgodności pełnej opublikowanej historii. Bez obejścia niepewnych prób lub nieopublikowanych danych. [HISTORY_SYNC](docs/HISTORY_SYNC.md) dotyczy tylko tego wariantu.

Stop kończy sesję; Pauza przerywa research i blokuje nowe operacje. Restart jest zatrzymany, bez nadrabiania snu serią. POST już przekazany dostawcy może zakończyć się później. Przed jednym POST zapisujemy rezerwację i zamrożony MIME. Timeout/restart w SENDING zachowuje SEND_UNKNOWN; bez retry send. Reconcile sprawdza istniejącą próbę. Nie obiecujemy exactly-once lub dostarczenia do Odebranych.

## Dane i aktualizacja

WORKSTATION zachowuje %LOCALAPPDATA%\JobHunter\research-only albo jawny dotychczasowy JOBHUNTER_DATA_DIR. RESEARCH_ONLY/APPROVAL_REQUIRED/AUTO współdzielą historię. Development używa osobnego JobHunter-development w lokalnym katalogu systemu. DEMO ma podkatalog demo. Istniejąca nieoznaczona baza osobista nie jest otwierana jako development.

**Stop → koniec operacji → zamknięcie backendu → backup → wybrana wersja kodu → npm ci/build/doctor → zatrzymany backend → świadomy Start.** Zalecany osobny checkout roboczy. Bez pull/build/hot reloadu w kampanii. Przed migracją Store robi sprawdzony VACUUM INTO w research-only/backups poza repo, uwzględniający WAL. Nigdy nie kopiuj samego aktywnego SQLite.

## Publiczna diagnostyka

`npm run smoke:public`: maksymalnie 5 firm, 15 minut, nowy katalog tymczasowy i jawnie fikcyjny profil. Ten sam parser oraz publiczna kwalifikacja/drafting AUTO, bez klasy Gmail, gateway, approvals, outbox i przyszłej kolejki produkcyjnej. Raport zawiera liczniki/powody; strony i ewentualne szkice zostają poza repo. To test techniczny, nie ocena kandydatury Jakuba. Brak zgodności CLI/loginu/limitu daje BLOCKED_EXTERNAL, bez full access i zmian konfiguracji.

Na domowym Windowsie `npm run smoke:public -- --approved-profile KATALOG_BAZOWY` jawnie kopiuje tylko wcześniej zatwierdzone materiały (odczyt oryginału) do nowego katalogu diagnostycznego. Nadal bez Gmaila, zgód/outbox i przyszłej kolejki produkcyjnej.

Poprawny strukturalnie DRAFT jest najpierw zachowany jako materiał niezweryfikowany, z dokładną wersją/hashem i odwołaniami. Błąd review nie usuwa tekstu; ponowienie tego etapu nie generuje maila ponownie. Zmiana treści, profilu, kontaktu lub źródeł unieważnia kontrolę. Raport rozdziela zachowane wersje, negatywne review, błędy wykonania i szkice po kontroli; samo zachowanie tekstu nie oznacza gotowości do wysyłki. Diagnostyka CLI jest ograniczona i oczyszczona, poza repo, bez tokenów/środowiska/zdarzeń treści modelu.

Wyniki świeżych prób i replay, przyczyny oraz granice: [TEST_REPORT](docs/TEST_REPORT.md). npm run check obejmuje typecheck, backend, osobny szeregowy test wydajności Stop (test:performance), build i Playwright na fikcyjnych usługach/tymczasowych bazach. Pełny backend nadal twardo sprawdza brak nowych POST po odwołaniu prawa. Testy opcjonalnego PRIVATE_GIT zachowane. [WINDOWS_SMOKE](docs/WINDOWS_SMOKE.md), [SECURITY](docs/SECURITY.md). CI finalnego SHA potwierdzamy po zakończeniu.
