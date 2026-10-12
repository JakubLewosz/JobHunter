# Jeden komputer roboczy — 12 października 2026

Gałąź codex/local-windows-pilot zawiera nocne poprawki i LOCAL_ONLY. Main nie jest automatycznie scalany. Kod rozwijaj na obu komputerach, prawdziwy automat tylko na domowym Windowsie. Push z MacBooka nie zmienia działającej sesji.

## A. Development Windows/macOS

Osobny checkout i Node 24:

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

Domyślnie DEVELOPMENT/DEMO i osobne dane JobHunter-development/demo, bez natywnego Gmaila. Testy AUTO wstrzykują fikcyjne providery. Nie kopiuj CV, poświadczeń, oznaczenia instalacji lub prywatnej bazy do developmentu. JOBHUNTER_DATA_DIR/PORT wybiera testowy katalog/port. Istniejąca nieoznaczona baza osobista nie otworzy się jako development.

## B. Domowy Windows

Najpierw właściwe miejsce danych. GitHub nie przenosi historii:

```powershell
npm run history:local -- doctor "$env:LOCALAPPDATA\JobHunter"
```

Diagnostyka jest tylko do odczytu: katalog, integralność, liczby firm/kontaktów/aliasów/ręcznych rekordów/blokad/prób/rezerwacji i niepewnych prób. Nie publikuje treści. Liczby nie dowodzą kompletności; brak bazy nie tworzy nowej. Sprawdź również Maca, jeśli nie wiadomo, gdzie jest oryginał. Nie resetuj historii, liczników lub SEND_UNKNOWN.

Jeżeli wcześniejsze kontakty są tylko na Macu: po Stop i zamknięciu tamtego backendu wykonaj `npm run history:local -- export KATALOG_BAZOWY PRYWATNY_PLIK_POZA_REPO`. Przenieś plik prywatnie, np. nośnikiem, bez GitHuba. Na Windowsie utwórz tylko katalog bazowy, potem `npm run history:local -- import KATALOG_BAZOWY PRYWATNY_PLIK --confirm-private-import`. To istniejący addytywny format: blokady, próby/shared records i liczniki, bez materiałów/CV/poświadczeń/zgody na send. Sprawdź diagnostykę i kompletność. PRIVATE_GIT wymaga wcześniej domkniętej opublikowanej historii; niepewny stan drugiego urządzenia blokuje zmianę. Nie wykonywano tych operacji na prywatnych danych w tej sesji.

Po sprawdzeniu pełnej istniejącej historii, przy zamkniętym backendzie:

```powershell
npm run history:local -- backup "$env:LOCALAPPDATA\JobHunter"
npm run history:local -- configure "$env:LOCALAPPDATA\JobHunter" --confirm-existing-history --single-workstation
$env:JOBHUNTER_RUNTIME = 'WORKSTATION'
$env:JOBHUNTER_MODE = 'AUTO_POLICY'
# JOBHUNTER_DATA_DIR, jeśli dotychczasowe dane są w innym katalogu.
.\scripts\start.ps1
```

workstation.json jest lokalny, poza repo, nie kopiowany między komputerami. Nie daje aktywnej zgody na send. Backend jest zatrzymany. Osobiste tryby współdzielą research-only. Już skonfigurowany PRIVATE_GIT zostaje do jawnej zmiany w Ustawieniach: Stop, brak niepewnych prób, zamknięty opublikowany stan i zgodność historii. Zmiana nie kasuje danych.

1. Sprawdź wcześniejsze kontakty i blokady; pustej bazy nie uznawaj za kompletną.
2. Sprawdź fakty/projekty/CV, bieżącego nadawcę i politykę. Bez automatycznej zmiany konta. Połączenia tylko świadomie według GMAIL_SETUP; Codex/search mają osobne testy. Brak loginu/limitu nie upoważnia do paid API lub full access.
3. Najpierw krótki publiczny research bez poczty. `npm run smoke:public -- --approved-profile KATALOG_BAZOWY` na skonfigurowanym Windowsie kopiuje wyłącznie wcześniej zatwierdzone materiały do nowego katalogu diagnostycznego, tylko do odczytu oryginału. Używa parsera, kwalifikacji i drafting AUTO; bez Gmaila/CV bajtów, zgód/outbox lub przyszłej kolejki produkcyjnej. Maksymalnie 5 firm/15 minut. Domyślne smoke:public używa profilu syntetycznego. RESEARCH_ONLY nadal służy pracy bez wysyłki z tą samą lokalną historią.
4. Obejrzyj cytaty, etykiety kontaktów, kilka treści i powody pominięcia. Zamknij RESEARCH_ONLY, wróć do AUTO. Historia i niezmieniona polityka pozostają, sesja nie.
5. Dopiero później samodzielnie Start. Pierwszy pilotaż może mieć 3–5 maili i kilkuminutowy odstęp. To sugestia pierwszej próby, nie limit produktu lub akceptacja pojedynczych maili. Tego punktu nie wykonano w developmentcie.
6. Po ocenie pilotażu przejdź do dłuższej sesji bez małego limitu, w kontrolowanym tempie do Stop lub problemu wymagającego reakcji.

## C. Aktualizacja po pushu

Osobny checkout roboczy i development. Stop w panelu → czekaj na rozpoczęte operacje → zakończ backend scripts/stop.ps1 → backup → git status → wybrana stabilna wersja. Bez pull/npm ci/build/hot reloadu przy aktywnym senderze.

```powershell
# WORKSTATION i ten sam katalog bazowy jak dotąd:
npm run history:local -- backup "$env:LOCALAPPDATA\JobHunter"
git fetch origin
git switch codex/local-windows-pilot
git pull --ff-only
npm ci
npm run build
npm run doctor
.\scripts\start.ps1
```

Backend jest zatrzymany; sprawdź gotowość i dopiero świadomie Start. Store przed zmianą schematu robi dodatkowy spójny VACUUM INTO z kontrolą integralności poza repo w research-only/backups. Nie kopiuj samego aktywnego SQLite bez WAL.

`history:local restore-copy KATALOG_BAZOWY BACKUP NOWY_KATALOG_PROFILU` odtwarza osobną kopię do kontroli, bez nadpisania oryginału. Sesje/zgody są odwołane, SENDING staje się SEND_UNKNOWN. CV/materiały zachowaj osobno i sprawdź. Nie zastępuj nowszej historii starszym backupem bez uzgodnienia późniejszych prób.

## Praca i zasilanie

Karta może być zamknięta, backend pracuje dalej. Komputer musi być włączony, backend uruchomiony, sieć dostępna. Ręcznie sprawdź uśpienie, zasilanie, aktualizacje/restart i łączność. Program nie zmienia zasilania, zapory, autostartu i nie pracuje podczas snu. Restart nie wznawia sendera, wybudzenie nie nadrabia serią. Stop blokuje nowe POST; przekazane dostawcy żądanie może zakończyć się później.

Wyniki macOS/CI i ograniczonej próby publicznej: TEST_REPORT. Fixture soak nie jest dobą Google. CI Windows nie potwierdza prywatnej instalacji domowej.
