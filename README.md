# JobHunter

Lokalny panel do prowadzenia poszukiwań pracy. Zaimplementowany zakres **E0–E2**: diagnostyka, aplikacja i pełny proces demonstracyjny przez rzeczywistą bazę SQLite. Interfejs po polsku.

**Ta wersja działa w DEMO. Firmy i adresy użyte w researchu są fikcyjne, a poczta jest symulowana lokalnie.** Rzeczywiste wyszukiwanie, model w runtime, Gmail i AUTO_POLICY czekają na kolejne etapy. Aplikacja nie używa istniejącego logowania Gmail/Codex ani tokenów na komputerze.

## Co działa

- Dashboard z licznikami z bazy, wykresem dziennym, działaniami, statusem i limitem dnia.
- Profil jako DRAFT, edycja i zatwierdzanie faktów, propozycje projektów portfolio.
- CV: PDF do 5 MB, niezmienna kopia, SHA-256, podgląd i zatwierdzenie. Demo działa bez CV.
- Firmy i oferty: fikcyjne dowody, daty, wymagania yes/no/unknown/conflicting, powody kwalifikacji/odrzucenia i historia.
- Lokalne szkice, edycja, wersjonowanie, przywracanie treści starszej wersji, źródła personalizacji i zatwierdzanie konkretnej paczki.
- Trwałe jobs, runy, outbox i próby; jeden worker i dispatcher. Start/wznów, pauza, stop wszystko i trwały kill switch.
- Polityka w kodzie: zgoda związana z wersją treści, odbiorcą, nadawcą, profilem, CV i polityką. Zmiany ją unieważniają; zgoda wygasa po godzinie.
- Atomowe rezerwacje kwot dnia/cyklu/kampanii. Niezmienny MIME i stabilny Message-ID. Rezerwacje i niepewne próby pozostają w limicie.
- Timeout po przyjęciu i restart w SENDING → SEND_UNKNOWN; rozstrzygnięcie po identyfikatorze bez ponownego send. Bez obietnicy exactly-once dla przyszłego Gmaila.
- Symulowane zainteresowanie, pytania, odmowa, autoresponder, wstrzymanie rekrutacji i trwałe zwroty; korekta klasyfikacji. Trzy kolejne trwałe zwroty zatrzymują sender.
- Import historii CSV z podglądem, hashami, duplikatami i idempotencją. Sugestia nie oznacza potwierdzonego kontaktu. Zachowywane adresy, daty i pochodzenie.
- Lokalne raporty Markdown i CSV z treścią wiadomości i statusem prób. Zabezpieczenie formuł w CSV.
- Rozdzielenie dostępności/konfiguracji/testu integracji. Brak danych o koszcie nie jest pokazywany jako 0 zł.

## Uruchomienie na tym Macu

Wymagany Node.js **24 LTS**. Zależności i build są już przygotowane w tym katalogu.

```sh
cd "/Users/jakublewosz/Documents/ChatGPT/JobHunter"
npm start
```

W drugim terminalu otwórz panel:

```sh
npm run open
```

`npm run open` odczytuje lokalny link dostępu. Zwykły adres bez tego linku nie tworzy sesji. Domyślny adres backendu: `http://127.0.0.1:4317`.

Zatrzymanie backendu bez zabijania innych procesów:

```sh
node scripts/stop.mjs
```

Na nowym komputerze najpierw wykonaj `npm ci`, `npm run build` i `npm run doctor`.

## Windows

Skopiuj projekt bez node_modules i dist, zainstaluj Node 24 LTS, otwórz PowerShell w katalogu projektu:

```powershell
.\scripts\setup.ps1
.\scripts\start.ps1
```

Diagnostyka i zakończenie pracy:

```powershell
.\scripts\doctor.ps1
.\scripts\stop.ps1
```

Skrypty używają jawnych ścieżek i LiteralPath oraz nie zmieniają globalnej polityki wykonywania skryptów. `start.ps1` uruchamia backend w tle i otwiera panel. `stop.ps1` korzysta z uwierzytelnionego endpointu własnej aplikacji; nie zamyka procesów Codexa.

**Windows smoke test nie został wykonany.** better-sqlite3 jest modułem natywnym; setup/doctor sprawdzają jego rzeczywiste uruchomienie. Bieżące testy wykonano na macOS arm64, w tym lokalny test ścieżki ze spacjami i polskimi znakami. Nie stanowi to potwierdzenia Windows.

## Pierwszy proces demonstracyjny

1. Otwórz „Profil i CV”, przejrzyj propozycje faktów i naciśnij **Zatwierdź profil demo**. CV jest opcjonalne.
2. Na ekranie „Dzisiaj” uruchom cykl demo. Fixture zawiera 11 unikalnych firm i jeden duplikat: 5 kwalifikuje się do szkicu, 4 wymagają przeglądu, 2 są odrzucane.
3. W „Wiadomościach” sprawdź odbiorcę, temat, treść i dowody; zaznacz do 3 szkiców, potem **Zatwierdź i symuluj wysyłkę**.
4. W „Odpowiedziach” potwierdź lub popraw klasyfikację. Zainteresowanie jest liczone dopiero po Twoim zatwierdzeniu.
5. W „Raportach” sprawdź próbę i pobierz Markdown lub CSV.

Przy większej paczce pozostałe szkice czekają na kolejny cykl, bez przekroczenia limitu. Zatwierdzenie wygasa po godzinie i może wymagać ponowienia.

W „Kampanii” można wybrać scenariusz timeoutu po przyjęciu, błędu przed wysyłką, braku potwierdzenia w Wysłanych albo trwałych zwrotów. Niepewne próby rozstrzyga przycisk **Rozstrzygnij** w „Raportach”. Po rozstrzygnięciu użytkownik osobno wznawia sender. Brak pewnego wyniku nie uruchamia retry.

Mock template używa tylko początkowych, zgodnych i zatwierdzonych faktów. Zmieniony profil nie uruchamia generowania nowych faktów z domysłów: przygotowanie nowych szkiców jest blokowane do implementacji adaptera E3 lub ręcznej obsługi. Kontrole treści są ograniczonymi regułami, nie dowodem prawdziwości każdego zdania.

## Dane i historia

- macOS: `~/Library/Application Support/JobHunter/demo`.
- Windows: `%LOCALAPPDATA%\JobHunter\demo`.
- Linux: `~/.local/share/JobHunter/demo`.
- `JOBHUNTER_DATA_DIR` pozwala wybrać inny katalog poza repo. Podkatalogi demo i live są osobne; E2 nie inicjalizuje bazy ani transportu live.
- Backend: `JOBHUNTER_PORT`, domyślnie 4317; zawsze 127.0.0.1. Konfiguracja przez zmienne środowiskowe; plik `.env` nie jest automatycznie ładowany.

Demo zapisuje dostarczone nazwy firm jako historię do weryfikacji. Fingoweb ma trwałą lokalną blokadę. Aplikacja nie potwierdza rzeczywistej historii kontaktów ani informacji z portfolio.

CSV jest UTF-8, z przecinkiem i nagłówkiem:

```csv
company,status,domain,email,date
Przykładowa Firma,SUGGESTED,firma.example.invalid,hr@firma.example.invalid,2026-10-06
```

Wymagane: `company,status`; opcjonalne: `domain,email,date`. Statusy: SUGGESTED, CONTACTED, REJECTED, ACTIVE_CONVERSATION, RECRUITMENT_ON_HOLD. W DEMO adresy/domeny muszą kończyć się na `.example.invalid`. Dane rzeczywistej korespondencji należy w przyszłości importować do osobnego trybu live. Surowe CSV nie jest wysyłane do modelu.

## Testy

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Po jednorazowym zainstalowaniu Chromium pełny zestaw: `npm run check`.

Testy używają osobnych katalogów tymczasowych i fikcyjnych odbiorców. Playwright uruchamia prawdziwy backend na 127.0.0.1:4328, a nie statyczny mock HTTP. Raport: [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

## Architektura i dalsza praca

- `apps/web`: React/TypeScript/Vite i własny CSS, bez usług sieciowych dla wyglądu.
- `apps/server`: Fastify, SQLite, domena/polityka, trwała kolejka i rozdzielone kontrakty ResearchProvider/CodexRunner/MailProvider.
- `migrations`: numerowane, transakcyjne migracje SQLite.
- `packages/shared`: wspólne typy; `tests`: domena/API i Playwright.
- `scripts`: lokalna diagnostyka, otwieranie i zatrzymywanie, skrypty Windows.

E3: bezpieczny fetcher z kontrolą rzeczywistego połączenia/egress i SSRF, import URL, sprawdzony SearchProvider, oficjalny adapter `codex exec` ze stdin/JSONL/schema i izolacją. Uwierzytelnienie CLI i działający research wymagają osobnego testu. Nie zakładaj dziedziczenia pluginów desktopowych.

E4: własny projekt Google Cloud i Desktop OAuth, potwierdzenie nadawcy, zakres historii, zatwierdzone CV, Gmail readonly/send, paginacja/synchronizacja i rzeczywisty reconcile. Test maila do własnego adresu wymaga osobnej zgody; dodanie integracji nie uruchamia wysyłek do firm.

E5: dopiero po potwierdzeniu granic izolacji runtime i bramki wysyłki. Niezweryfikowana izolacja blokuje AUTO_POLICY. Nie jest to gotowy autonomiczny system live.

Dokumentacja: [możliwości](docs/CAPABILITY_REPORT.md), [plan](docs/IMPLEMENTATION_PLAN.md), [źródła](docs/SOURCES.md), [bezpieczeństwo](docs/SECURITY.md), [zadania](docs/TASKS.md).
