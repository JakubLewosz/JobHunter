# JobHunter

Osobiste narzędzie Jakuba Lewosza do pierwszego kontaktu z firmami w sprawie płatnej, regularnej współpracy programistycznej. Polski research, polskie wiadomości, zatwierdzone fakty i CV. Preferencje: w pełni zdalnie, około 20 godzin tygodniowo głównie po lekcjach. Odpowiedzi użytkownik obsługuje sam w Gmailu.

Aktualne wymagania: [specyfikacja](JobHunter_SPEC.md), [wizja](docs/WIZJA_PROJEKTU.md), [styl](docs/MESSAGE_STYLE.md). Stan: [TASKS](docs/TASKS.md). Historyczne próby dostarczalności pozostają w [audycie](docs/GMAIL_DELIVERABILITY_AUDIT.md). Potwierdzenie w Wysłanych nie dowodzi doręczenia do Odebranych.

Stabilizacja na `codex/overnight-stabilization`: pominięcie znanej firmy nie kończy sesji,
błędy są związane z wybraną wersją, zapytanie jest osobną decyzją od dopasowania oferty,
a trwały planer rozwija kierunki po pierwszych ośmiu i stosuje cooldown. Kandydaci po
zapełnieniu kolejki pozostają do przetworzenia. Zmiana zakresu unieważnia stare operacje;
starsza polityka wymaga ponownego zatwierdzenia konfiguracji. Instrukcja:
[Uruchomienie rano](docs/URUCHOMIENIE_RANO.md). Wyniki i pozostające ograniczenia:
[TEST_REPORT](docs/TEST_REPORT.md), [plan prac](docs/OVERNIGHT_PLAN.md).

## Tryby

| Tryb              | Zachowanie                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| DEMO              | Osobna baza, fikcyjne firmy i lokalna poczta.                                                                      |
| RESEARCH_ONLY     | Publiczne źródła i lokalne szkice, bez Gmaila i wysyłki.                                                           |
| APPROVAL_REQUIRED | Opcjonalny ręczny podgląd i zgoda na konkretną paczkę.                                                             |
| AUTO_POLICY       | Zatwierdzona konfiguracja i jawny **Start — szukaj i wysyłaj**; zgodne pierwsze wiadomości bez osobnej akceptacji. |

Rozwój kodu nie upoważnia do rzeczywistych wysyłek, również testowych. Prace z 11 października korzystają wyłącznie z fikcyjnych providerów i tymczasowych lokalnych repozytoriów. Nie zmieniano rzeczywistego nadawcy, historii ani OAuth.

## Instalacja i uruchomienie

Wymagane Node.js 24 LTS, Git i natywny Codex CLI. Zależności mają przypięte wersje. `.npmrc` wyłącza automatyczne skrypty instalacyjne zależności: SQLite 13 dostarcza gotowe biblioteki dla obsługiwanych systemów; `npm run doctor` sprawdza faktyczne załadowanie. Nie potrzeba przebudowy SQLite przez Visual Studio.

```powershell
npm ci
npm run build
npm run doctor
$env:JOBHUNTER_MODE = 'AUTO_POLICY'
npm start
```

W drugim PowerShell ustaw ten sam `JOBHUNTER_MODE` i uruchom `npm run open`. Alternatywnie `scripts/start.ps1` uruchamia backend w tle i otwiera panel. Na macOS:

```sh
npm ci
npm run build
JOBHUNTER_MODE=AUTO_POLICY npm start
# drugi terminal:
JOBHUNTER_MODE=AUTO_POLICY npm run open
```

Backend słucha wyłącznie na `127.0.0.1:4317`. Link dostępu pochodzi z `npm run open`. `JOBHUNTER_PORT` zmienia port. `JOBHUNTER_CODEX_PATH` może wskazywać absolutną ścieżkę do natywnego CLI; wrappery cmd/bat są odrzucane. `.env` nie jest automatycznie ładowany. Tryb zmienia się wyłącznie po zamknięciu backendu.

## Pierwsza konfiguracja AUTO_POLICY

1. W **Ustawieniach / Moje materiały i CV** sprawdź propozycje faktów i opisy projektów. Zatwierdź fakty oraz lokalny PDF. Propozycje w repo nie są zatwierdzonym doświadczeniem.
2. W **Połączeniach** wykonaj test Codexa i wyszukiwania. Wymagane istniejące logowanie ChatGPT; brak automatycznego klucza API. Sam help nie potwierdza udanego researchu.
3. Podłącz Gmail samodzielnie według [GMAIL_SETUP](docs/GMAIL_SETUP.md). Tokeny pozostają w magazynie systemowym. Aplikacja nie rozszerza uprawnień sama. Celowany odczyt historii/Wysłanych wymaga istniejącego readonly; Google daje szerszy zakres, aplikacja ogranicza odczyty do wybranego kontaktu i potwierdzonych domen.
4. Wskaż **osobne prywatne repozytorium historii**, jego lokalny katalog na gałęzi main i dokładny origin. Potwierdź prywatność oraz publikowanie minimalnej historii. Pierwszą inicjalizację wykonaj na komputerze z dotychczasową bazą, potwierdzając ją jako źródło historii. **Przygotuj historię bez uruchamiania sesji** publikuje stan bez prawa do wysyłki. Aplikacja nie tworzy zdalnego repozytorium. [Instrukcja przekazywania](docs/HISTORY_SYNC.md).
5. W **Polityce automatycznej sesji** wskaż bieżącego nadawcę, zatwierdzone CV, zakres poszukiwań, dozwolone kontakty i tempo. Limit sesji/dnia pozostaw pusty dla pracy ciągłej. Domyślne tempo panelu: 300 s między wysyłkami i 600 s między cyklami researchu; minimum konfiguracji 60 s. Kolejka najwyżej trzech oczekujących szkiców ogranicza produkcję materiałów, nie liczbę maili w sesji.
6. Dopiero **Start — szukaj i wysyłaj** udziela tej lokalnej sesji uprawnienia do zgodnych pierwszych kontaktów. GENERAL jest opcjonalnym kontaktem do zapytania o współpracę; nie staje się RECRUITMENT. SALES, niepotwierdzone adresy i ograniczenia kanału aplikacji blokują automat.

Zmiana faktów, wybranego CV lub nadawcy wstrzymuje używanie starej polityki. Zatrzymaj sesję, sprawdź materiały i zatwierdź nową politykę. AUTO_POLICY nie ma daty wygasania sesji ani ukrytego końca po 3 mailach, 10 firmach, 8 cyklach czy godzinie.

## Praca i zatrzymanie

**Pauza** przerywa własny research, zachowuje postęp i blokuje nowe operacje. **Wznów** jest jawne. **Stop** kończy sesję i odwołuje prawo do kolejnych wysyłek. Restart backendu zawsze wymaga Start. Nie nadrabiamy uśpienia serią wiadomości.

Już wysłanego żądania nie da się cofnąć. Przed pojedynczym POST zapisujemy rezerwację, identyfikator i zamrożony MIME. Timeout lub restart w SENDING zachowuje SEND_UNKNOWN; nie następuje ponowne send. W Historii dostępne jest **Sprawdź tę próbę w Wysłanych** dla lokalnych prób. Przy niepewnej próbie przeniesionej z innego urządzenia rozstrzygnięcie wykonaj na komputerze posiadającym oryginalny zapis i opublikuj zaktualizowaną historię.

Na koniec użyj **Stop i przekaż historię drugiemu urządzeniu**. Zwykły Stop nie zwalnia zdalnego właściciela: najpierw trzeba ukończyć spójny eksport i push. Błąd Git, konflikt, nieukończony eksport lub właściciel na drugim komputerze blokują wysyłkę. Awaria pierwszego komputera nie daje drugiemu automatycznego prawa do pracy.

**Historia firm** pokazuje kontakt, datę, wynik, zamrożony temat i treść, źródła oraz powody pominięcia. Licznik firm wyklucza SELF_TEST. Stare dane odpowiedzi są zachowane, zakładka odpowiedzi jest ukryta.

Zamknięcie backendu: `node scripts/stop.mjs` z tym samym JOBHUNTER_MODE. Na Windowsie: `scripts/stop.ps1`. Przed zmianą urządzenia wykonaj przekazanie w panelu, dopiero potem zamknij backend.

## Dane

- Windows: %LOCALAPPDATA%\JobHunter; macOS: ~/Library/Application Support/JobHunter; Linux: ~/.local/share/JobHunter.
- JOBHUNTER_DATA_DIR pozwala wskazać katalog poza repo kodu.
- demo jest oddzielne od research-only. RESEARCH_ONLY, APPROVAL_REQUIRED i AUTO_POLICY współdzielą osobistą historię i materiały; przejście trybu odwołuje oczekujące zgody.
- Nie kopiuj działającego SQLite do Gita. Synchronizujemy wersjonowany JSON z transakcyjnego odczytu, bez tokenów, CV/PDF, konfiguracji OAuth, loginu Codexa, całej skrzynki i aktywnej zgody.
- Import wcześniejszych kontaktów CSV i blokada Fingoweb pozostają. Nie usuwaj historii w celu rozpoczęcia od nowa.

## Weryfikacja i architektura

```sh
npx playwright install chromium
npm run check
```

Typecheck, testy backendu, build i Playwright używają fikcyjnych providerów. Synchronizacja jest testowana na lokalnych repozytoriach. Wyniki: [TEST_REPORT](docs/TEST_REPORT.md), dokładny zakres Windows: [WINDOWS_SMOKE](docs/WINDOWS_SMOKE.md). Przy systemowym CA można użyć NODE_USE_SYSTEM_CA=1 podczas pobierania przeglądarki; nie wyłączaj TLS.

React/TypeScript/Vite, Fastify, SQLite i istniejący adapter codex exec. Research i sender mają osobne zajętości/timery. Model dostaje minimalne zatwierdzone fakty, projekty i publiczne źródła. Odbiorcy, nadawca, CV, polityka, limity i historia należą do kodu. [Bezpieczeństwo](docs/SECURITY.md). Bez CRM, automatycznych odpowiedzi/follow-upów, kalendarza, LinkedIn i nowych płatnych usług.
