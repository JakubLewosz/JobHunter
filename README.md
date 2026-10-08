# JobHunter

Lokalny panel Jakuba do prowadzenia poszukiwań pracy. Zachowane **DEMO**, rzeczywisty research **RESEARCH_ONLY** oraz **APPROVAL_REQUIRED** z Gmailem i akceptacją konkretnych wiadomości. Dziewięć rzeczywistych testów wysyłki jest potwierdzonych w Wysłanych. Świeże konto miało problemy ze Spamem; pierwszy test z innym wybranym kontem, przy tej samej aplikacji, treści i CV, trafił do Odebranych według użytkownika. Wpływ historii konta jest mocnym tropem, bez ustalonej dokładnej przyczyny lub gwarancji kolejnych dostaw. Szczegóły i ograniczenia: [Raport testów](docs/TEST_REPORT.md). Interfejs po polsku. Używane jest wyłącznie konto projektu; tymczasowe połączenie konta osobistego i jego lokalne dane usunięto.

**Docelowy sposób pracy i ustalenia do dalszej rozmowy z ChatGPT:** [Wizja projektu](docs/WIZJA_PROJEKTU.md). Bieżący stan i zadania: [TASKS](docs/TASKS.md).

**Aktualny schemat wiadomości:** [naturalne zgłoszenie do zespołu](docs/MESSAGE_STYLE.md), opcjonalny Codex i wersjonowana ponowna generacja.

**Gmail z CV:** [konfiguracja i pierwszy test do siebie](docs/GMAIL_SETUP.md). Przegląd dokładnej treści, nadawcy, odbiorców i CV; do trzech wiadomości w jednej paczce. W RESEARCH_ONLY wysyłka pozostaje niedostępna.

**Krótki test dostarczalności:** SELF_TEST bez linków i CV, z normalnym podglądem, zgodą i limitami. Użytkownik zgłosił Spam obu testów WP, również drugiego wysłanego jako sam tekst. EML drugiej próby potwierdza zgodną treść, poprawny DKIM według WP i oznaczenie Spam; dokładna przyczyna pozostaje nieustalona. Następny krok to sprawdzenie reguł odbiorcy. 157 backend / 6 UI PASS. [Szczegóły prób](docs/TEST_REPORT.md).

**Domyślny DEMO nadal używa fikcyjnych firm i lokalnej poczty. RESEARCH_ONLY nie wysyła i nie odczytuje Gmaila.** APPROVAL_REQUIRED korzysta z tych samych osobistych materiałów i historii researchu, a DEMO pozostaje w osobnej bazie. Rzeczywista próba researchu dała 10 kandydatów i 3 szkice; wykonano dziewięć testów poczty na wskazane adresy, bez kontaktowania firm. Szczegóły: [Raport testów](docs/TEST_REPORT.md). AUTO_POLICY pozostaje zablokowany.

## Gmail po moim zatwierdzeniu

Zatrzymaj dotychczasowy backend, następnie uruchom `npm run build` i `npm run start:approval`. Panel otwiera `JOBHUNTER_MODE=APPROVAL_REQUIRED npm run open`. Tryb używa istniejącego katalogu `research-only`; zmiana trybu unieważnia zgody, a restart nie wznawia kolejki wysyłek.

Jeżeli konto jest już podłączone, `npm run gmail:enable-read` otwiera dodatkową zgodę Google, korzystając z klienta zapisanego w systemowym magazynie haseł. Nagłówki historii odczytujemy wyłącznie dla wybranych adresów i domen firm; treść odpowiedzi tylko z własnych wysłanych wątków. Poczta nie trafia do AI. Google udziela szerszego uprawnienia `gmail.readonly`, a filtrowanie jest ograniczeniem aplikacji.

W „Wiadomościach” wybierz zatwierdzone CV i przygotuj **podgląd testu do siebie**. Po sprawdzeniu i zaznaczeniu zgody kliknij wysyłkę. Test nie oznacza firmy jako skontaktowanej. Dla firm: aktualne źródła i kontakt, pozytywna kontrola treści, przegląd aktualnej wersji, sprawdzenie historii oraz osobna akceptacja dokładnej paczki. Ręczna edycja wymaga ponownej kontroli; odtworzenie odwołań do faktów zapisuje nową wersję bez zmiany tekstu.

Limit to maksymalnie 3 wiadomości w paczce, 10 prób dziennie i 50 w kampanii, również testy do siebie i próby niepewne. Podgląd i zgoda wygasają po 15 minutach. Timeout zachowuje SEND_UNKNOWN i zatrzymuje wysyłkę. „Sprawdź tę próbę w Wysłanych” rozstrzyga istniejącą próbę; nie wysyła ponownie.

## RESEARCH_ONLY

- Automatyczne wyszukiwanie przez natywny web search Codexa po udanym teście integracji oraz osobny import publicznego URL (bez wymogu logowania do samego odczytu).
- Bezpieczne publiczne HTTP/HTTPS: kontrola DNS/IP i każdego redirectu, przypięte połączenie, limity rozmiaru/czasu/dekompresji, stany niedostępności i HTTP 429.
- Źródła z pierwotnym/końcowym URL, tytułem, czasem, rzeczywistym fragmentem i hashem. Cytat i kontakt weryfikowane w odczytanej treści. Brak zgadywania emaili.
- Warunki yes/no/unknown/conflicting z wyjaśnieniami, archiwum, otwarte kandydatury, dopasowane/odrzucone/do decyzji. Nieznane godziny nie są dopasowaniem.
- Rzeczywisty `codex exec` ze stdin, JSONL i schematem, przez istniejące logowanie ChatGPT. Bez automatycznego API key i bez dziedziczenia pluginów aplikacji desktopowej.
- Naturalne zgłoszenia do zespołu, standardowo 150–220 słów: tożsamość/cel, bezpośrednie nawiązanie i neutralny opis projektu, dostępność oraz jedno pytanie. Proste tematy i poprawna odmiana; AI/Codex przy istotnym związku z firmą, wyłącznie z zatwierdzonych faktów. Umowa tylko przy potwierdzonej aktywnej ofercie. Uwagi stylu zachowują NEEDS_REVIEW, błędy faktów nadal blokowane. Ponowna generacja dopisuje wersję bez zmiany historii. Podgląd EML może dołączyć zatwierdzony PDF; zero wysyłek.
- Trwałe etapy SEARCH → READ → EXTRACT → QUALIFY → DRAFT. Pauza/stop przerywają własne zadanie; po restarcie jawne wznowienie z zapisanych źródeł, bez pobierania nowej listy do numerowanego kursora.
- Maksymalnie 10 kandydatów i 3 szkice, bez uzupełniania braków fikcją. Limit czasu obejmuje wyszukiwanie/model. Częściowy cykl pozostaje PAUSED; pojedynczy błąd nie usuwa pozostałych wyników.
- Żadnego SMTP/Gmail/read/send/formularzy ani symulowanych odpowiedzi. Przegląd szkicu nie tworzy send approval. Historia ze specyfikacji to HISTORY_TO_VERIFY; Fingoweb pozostaje zablokowany.

### Uruchomienie na macOS

Zamknij działający backend w jego dotychczasowym trybie. W katalogu projektu:

```sh
npm ci
npm run build
JOBHUNTER_MODE=RESEARCH_ONLY npm start
```

W drugim terminalu w tym samym katalogu:

```sh
JOBHUNTER_MODE=RESEARCH_ONLY npm run open
```

Zatrzymanie: `JOBHUNTER_MODE=RESEARCH_ONLY node scripts/stop.mjs`. Powrót do demo: `JOBHUNTER_MODE=DEMO npm start` i analogiczny `npm run open`. Nie zmieniamy trybu w działającym backendzie.

### Uruchomienie na Windowsie

```powershell
npm ci
npm run build
$env:JOBHUNTER_MODE = 'RESEARCH_ONLY'
# Jeżeli potrzebne: $env:JOBHUNTER_CODEX_PATH = 'C:\...\codex.exe'
.\scripts\start.ps1
```

Alternatywnie `npm start`, a w drugim PowerShell ustaw ten sam JOBHUNTER_MODE i wykonaj `npm run open`. Zatrzymanie: `node scripts/stop.mjs` z ustawionym RESEARCH_ONLY. CLI musi być natywnym codex.exe; wrapper cmd/bat nie jest wykonywany. [Instrukcja Windows smoke](docs/WINDOWS_SMOKE.md). **Windows nieprzetestowany.**

### Pierwszy research i powrót do wyników

Wyszukiwanie obejmuje software house’y, agencje, SaaS, web/backend, automatyzacje, API, integracje, narzędzia AI i dokumenty. Uwzględnia też firmy bez ogłoszonego wakatu: „Zapytanie o współpracę” (PROSPECT) pozostaje do przeglądu i pyta o nieznane warunki. Może mieć publiczny, potwierdzony kontakt ogólny firmy; adresy sprzedaży i zgadywane adresy nie pozwalają na szkic. To nie jest potwierdzona rekrutacja ani zgoda na wysyłkę.

1. W Połączeniach wykonaj „Sprawdź połączenie z Codexem” i „Sprawdź wyszukiwanie”. Próby zużywają niewielką część limitu planu. W razie braku loginu użyj oficjalnego `codex login`; aplikacja nie otwiera ani nie kopiuje auth.json. Dostępność CLI, konfiguracja i udany test są osobnymi stanami.
2. W „Moje materiały” przejrzyj wiadomość bazową i opisy projektów, dodaj CV, a następnie kliknij **Zapisz i zatwierdź moje materiały**. Zatwierdzenie demo nie przenosi się do researchu. Dostępność to „około 20 godzin tygodniowo po lekcjach”, bez maksimum. Zmiana orientacyjnej liczby godzin aktualizuje fact availability. W tym samym ekranie edytujesz swoją wiadomość bazową; techniczne identyfikatory nie są częścią tego przepływu.
3. Na początek kliknij **Test na godzinę**: kolejne kierunki co 10 minut, do 10 kandydatów i 3 szkiców łącznie. Test kończy się po godzinie lub po osiągnięciu limitu. **Start na 8 godzin** uruchamia do 8 małych cykli, najwyżej raz na godzinę. „Dodaj firmę ręcznie” pozwala wkleić URL. Możesz podać osobny URL źródła kontaktu. Import przed zatwierdzeniem zapisuje źródło; później użyj „Analizuj zapisane źródło”.
4. W „Firmy i oferty” sprawdź cytaty i kwalifikację; historyczne firmy wymagają rozstrzygnięcia. W „Wiadomościach” przejrzyj i edytuj szkic, skopiuj temat/treść. „Oznacz jako przejrzany” nie zezwala na przyszłą wysyłkę.
5. Po restarcie wróć do tych samych ekranów. Start na 8 godzin podejmuje aktywny niepełny cykl; po restarcie praca wymaga jawnego startu. przy błędzie pojedynczego elementu najpierw „Ponów etap”. „Zakończ niepełny cykl” zachowuje wyniki i pozwala zacząć inne zapytanie.

Każde ręczne wznowienie odnawia budżet bieżącej próby; łączny czas pozostaje zapisany. Powtarzanie identycznego zapytania z tym samym profilem przez 24 h jest blokowane; źródła READ są w tym czasie ponownie wykorzystywane. Nowa oferta znanej firmy jest zapisywana osobno, ale nie tworzy kolejnego automatycznego szkicu pierwszego kontaktu. Nieznany koszt oznacza „brak danych”.

Ograniczona próba po zatwierdzeniu profilu: `npm run smoke:research` przy uruchomionym RESEARCH_ONLY. Nie zatwierdza profilu ani szkiców. Wyniki pozostają w panelu, nie w repo. Bez zatwierdzenia kończy się WAITING_FOR_PROFILE (exit 2), co nie jest PASS pełnego E3.

## Co działa w DEMO

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

Mock template używa tylko początkowych, zgodnych i zatwierdzonych faktów. Zmieniony profil nie uruchamia generowania nowych faktów z domysłów: przygotowanie nowych szkiców w DEMO jest blokowane; adapter RESEARCH_ONLY korzysta z aktualnych zatwierdzonych faktów. Kontrole treści są ograniczonymi regułami, nie dowodem prawdziwości każdego zdania.

## Dane i historia

- macOS: `~/Library/Application Support/JobHunter/demo`.
- Windows: `%LOCALAPPDATA%\JobHunter\demo`.
- Linux: `~/.local/share/JobHunter/demo`.
- `JOBHUNTER_DATA_DIR` pozwala wybrać inny katalog poza repo. Podkatalogi demo i research-only są osobne; transport live nie istnieje.
- RESEARCH_ONLY: ten sam katalog bazowy, podkatalog `research-only`, osobny profil/SQLite/szkice. Git pull przenosi kod, nie lokalną historię aplikowania. Przenoszenie pełnego stanu i backup pozostają osobnym zadaniem.
- Backend: `JOBHUNTER_PORT`, domyślnie 4317; zawsze 127.0.0.1. Konfiguracja przez zmienne środowiskowe; plik `.env` nie jest automatycznie ładowany.

Oba tryby zapisują dostarczone nazwy firm jako historię do weryfikacji. Fingoweb ma trwałą lokalną blokadę. Aplikacja nie potwierdza rzeczywistej historii kontaktów ani informacji z portfolio.

CSV jest UTF-8, z przecinkiem i nagłówkiem:

```csv
company,status,domain,email,date
Przykładowa Firma,SUGGESTED,firma.example.invalid,hr@firma.example.invalid,2026-10-06
```

Wymagane: `company,status`; opcjonalne: `domain,email,date`. Statusy: SUGGESTED, CONTACTED, REJECTED, ACTIVE_CONVERSATION, RECRUITMENT_ON_HOLD. W DEMO adresy/domeny muszą kończyć się na `.example.invalid`. Historia rzeczywistych kontaktów należy wyłącznie do osobnej bazy researchu i wymaga świadomego importu użytkownika. RESEARCH_ONLY przyjmuje rzeczywiste domeny/adresy i odrzuca dane example.invalid. Surowe CSV nie jest wysyłane do modelu.

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

E3 zaimplementowany z adapterami w `apps/server/src/research`, checkpointami i panelem. Ograniczona rzeczywista próba z zatwierdzonym profilem dała 10 kandydatów i 3 szkice; nie wykonano pełnego dnia researchu. Izolacja narzędzi sprawdzona syntetyczną próbą; pełna izolacja procesu OS pozostaje niepotwierdzona.

E4: implementacja Gmail readonly/send, celowanej paginowanej historii, zgód na dokładny MIME z CV, sendera, odczytu znanych wątków i reconcile. Przepływ sprawdzono na fikcyjnych odbiorcach oraz dziewięciu rzeczywistych testach zleconych przez użytkownika: siedmiu z CV i dwóch krótkich bez załącznika. Wyniki folderów są mieszane; oba krótkie testy WP trafiły do Spamu. Dostarczalność, rzeczywista historia firm, odpowiedzi i mała paczka do firm pozostają do sprawdzenia. Synchronizacja jest pełnym odczytem wybranego kontaktu/wątku, bez inkrementalnego Gmail History API.

E5: dopiero po potwierdzeniu granic izolacji runtime i bramki wysyłki. Niezweryfikowana izolacja blokuje AUTO_POLICY. Nie jest to gotowy autonomiczny system live.

Dokumentacja: [możliwości](docs/CAPABILITY_REPORT.md), [plan](docs/IMPLEMENTATION_PLAN.md), [źródła](docs/SOURCES.md), [bezpieczeństwo](docs/SECURITY.md), [zadania](docs/TASKS.md).

Panel jest przeznaczony dla Jakuba: jedna wiadomość, CV i cztery projekty. Główny przepływ to research, przegląd i konkretna akceptacja wysyłki. Techniczne identyfikatory pozostają wewnętrzne; automatyczne wysyłki bez przeglądu są kolejnym, niedostępnym etapem.
