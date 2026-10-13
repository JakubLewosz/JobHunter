# Runda samodzielnego researchu — 13 października 2026

macOS arm64, Node v24.11.0. Publiczna próba: f59ccb8; końcowy kod: 835a6d5; wyłącznie fikcyjni odbiorcy, katalogi
tymczasowe i lokalne repo Git w testach. `npm run check`: **410/410 backend,
12/12 performance, 15/15 UI**, typecheck/build PASS. `git diff --check` PASS.

Odtworzenie na poprzednim kodzie: 3 FAIL / 4 PASS — zaproszenie „chcesz do nas
dołączyć”, future OPEN bez bieżącego wakatu, REJECTED oferty z dopuszczonym
osobnym zapytaniem w planerze. Osobny test nawigacji: FAIL przed poprawką (mailbox
na stronie nie może uniemożliwić odczytu literalnego linku kariery). Po zmianach
celowane 44/44 oraz integracyjne 20/20 i późniejsze 9/9 PASS. Jeden pośredni wynik
43/44 wynikał z testowego literalnego tytułu PHP/Laravel, który prawidłowo wybierał
FixDesk; fixture zmieniono na Junior Developer, aby badała działalność API bez
trafnego tytułu. Nie zmieniano selektora projektu dla tej asercji.

Pierwszy pełny check: 408/409 backend, 1 FAIL — `research.test.ts` wymagał starej
instrukcji 150–220 słów. Dostosowano oczekiwanie do nowej preferencji, bez zmiany
bramek prawdziwości. Performance/build/UI nie wykonano w tym przerwanym check.
Końcowy check uruchomiono po tej poprawce; testy zachowano, bez skip lub poluzowania
zabezpieczeń. Długość sama nie tworzy NEEDS_REVIEW; profil/fakty/technologie nadal
podlegają kontroli. Pełne opisy projektów pozostają w kontekście generatora/review.

Stop końcowego check: max request_received 613.01 ms w pełnym zestawie;
large-history odwołanie po odbiorze 0.18 ms.
Trzy izolowane large-history: 308.23 / 266.82 / 208.92 ms.
Brak nowych POST po Stop PASS. Nie zmieniono progów; trzy iteracje są stałą częścią
check, bez powtarzania aż do PASS. Historyczny CI macOS 15198a6 z odbiorem 1458.72 ms
pozostaje niewyjaśniony. Oba udane check tej rundy nie ustalają jego przyczyny.

Współpraca etapów: zachowane istniejące auto-review-concurrency (RUNNING, retry
samego review, utrzymanie hash/wersji, Stop i spóźniony wynik), research/restart,
local-only/CV/sender/concurrency i soak. Nowy test planner→worker przechodzi przez
nieudaną witrynę, duplikaty i pusty kierunek; zachowuje badania/planer po restarcie,
bez outbox/attempts/approval/auto-session. UI auto.spec potwierdza pracę backendu po
zamknięciu karty. Nowy cykl diagnostyczny używa publicznego workera, bez sendera.

Po zamknięciu publicznej części odtworzono dodatkowy błąd metryki: positive review
z DRAFT_MATERIAL_STALE dawał checkedDrafts=1 zamiast 0. Bramka wysyłki już blokowała
materiał; poprawka dotyczy licznika i eksportu, używa istniejącej draftMaterialIssues.
Regresja 4 PASS / 1 FAIL przed, 19/19 integracyjnych PASS po. Pierwsza wersja fixture
użyła zwykłego AUTO ResearchJobHunter bez auto_run_scope i nie utworzyła szkicu;
zmieniono ją na rzeczywisty createPublicDiagnostic przed odtworzeniem 1 != 0.

Replay na spójnej read-only kopii zamkniętej diagnostyki (normalne metody planera,
0 HTTP / 0 modeli): cykl 4 daje checkedDrafts 2 → 1. Bieżący końcowy snapshot cyklu 3
ma 2 zamiast historycznych 3: GOTOMA była wcześniej sprawdzona, potem binding się
zmienił. Nie przepisano publicznego przebiegu lub oryginalnej bazy. Hashe plików
replay odpowiadają 835a6d5; publiczna próba nie była ponawiana na późniejszym kodzie.
Końcowy pełny check na tych zmianach: 410 backend / 12 performance / 15 UI PASS,
typecheck/build/diff check; wcześniejszy check na f59ccb8 miał 409/12/15 PASS.

Publiczna próba i CI finalnego SHA są raportowane osobno w nowym research-review.
Windows w tej rundzie lokalnie nie uruchomiony. Hosted CI nie potwierdza domowej
instalacji, Gmaila, dostarczalności ani całodziennej pracy. Prawdziwe maile: **0**.

---

# Weryfikacja — 12 października 2026

## 13 października 2026 — MacBook: research bez poczty

Bazowy `2aa3a1e`; osobny checkout, macOS darwin/arm64, Node v24.11.0,
CLI 0.162.0-alpha.17.2 i istniejący login ChatGPT. Bez full access/API key.
Pełny [pakiet](research-review/2026-10-13_08-10_macos-01a133d7/README.md)
zapisów, wszystkich wersji i identyfikatorów; stary raport niezmieniony.

Trzy mechanizmy odtworzone FAIL przed zmianą: brak projektu z opisu usług API,
UNKNOWN dla pytania o dołączenie do zespołu i odmowa całej firmy z zakresu OFFER.
Regresje po zmianie obejmują zmienione nazwy/domeny, negatywne AI/PDF, jawny/brak
warunku umowy, obowiązkowy kanał/zakaz maila, neutralny tytuł i literalny ACTIVE,
TLS bez retry storm, awarię jednego hosta i wspólną serię, transient retry, redirect/
budżet/cache, nowszą zmienioną wersję źródła, mapping generator/review i blokadę
snapshotowej bazy przed usługą Gmail nawet z WORKSTATION. Celowane: 21/21 PASS.
Produkcyjne sprawdzanie PDF i wcześniejsze kontrole sendera/Stop zachowane.

Końcowy `npm run check`: exit 0, typecheck/build PASS, **403/403 backend**
(101291,04 ms), **12/12 performance Stop** (6269,41 ms), **15/15 UI** (35,4 s).
Fikcyjni odbiorcy/providery, tymczasowe bazy i lokalne repozytoria Git; diff check PASS.
Bez zwiększenia timeoutów lub progów. CI finalnego SHA sprawdzane po publikacji.

Właściwy Node reader z procesowym --use-system-ca: 3/3 hosty preflight READ.
Publiczna sesja 33,59 min, 69 faktycznych HTTP (w tym redirecty i 1 powtórzony URL),
68 różnych żądanych URL, 58 różnych poprawnie odczytanych stron i 59 zapisanych READ.
4 nieudane odczyty; brak dowodu awarii całego środowiska macOS. Początkowy BizCode
EXTRACT przekroczył 120 s. Po usunięciu zduplikowanej wersji pakietu pojedyncze
wznowienie checkpointu zakończyło się po 52,36 s; przyczyna timeoutu nie jest dowiedziona.
Jedno review N-SOFT: CODEX_FAILED z oczyszczonym komunikatem „Selected model is at
capacity”; późniejsze pojedyncze review identycznego payloadu PASS, bez zmiany modelu,
tekstu lub faktów. Obydwa wcześniejsze błędy zachowane. 46 wywołań, bez zerowania budżetu.

10 nowych firm po analizie: 7 szkiców po pełnych kontrolach, 3 pominięcia za brak
właściwego kanału/dowodu. 6 kontroli: BizCode/OKE/Tukano/WizzDev ze szkicem,
Merixstudio pytania rekrutacyjne bez zgody na CV, Payarto brak treści/kontaktu.
Łącznie 13 zachowanych nowych wersji i 11 różnych szkiców po kontroli. Dwie dawne
wersje z Windowsa są osobno oznaczone i nie liczone jako sukcesy tej sesji.

AutoRelay w pełnym zatwierdzonym opisie dotarł do generatora BizCode/Tukano; CodeFabric
do nowej wersji OKE po świeżym odczycie usług AI. Projekty występują w tekstach.
Nie przypisano kandydatowi SAP, produkcji ani nowych projektów. Review PASS jest oceną
zgodności, nie gwarancją jakości: część tekstów wylicza zbyt obszerny stack. Stylu nie
przebudowano i nie poprawiono eksportu. Końcowy audyt skorygował dodatni licznik
checkpointu z 9 do rzeczywiście zapisanych 11 kontroli przez ReviewBudget.recordChecked,
bez zmiany HTTP/modeli/czasu lub wyników; zdarzenie w PRZEBIEG.

Nie zweryfikowano PDF (`cvVerifiedInThisRun=false`), magazynu CA domowego Windowsa,
Gmaila, prywatnej historii, gotowości wysyłek/dostarczalności ani pracy całodziennej.
Snapshot zachowuje zawodowe fakty/ID i hash opublikowanej wersji. Diagnostyka ma zero
approvals/outbox/send_attempts/auto sessions, DisabledMailProvider i brak gateway.
Zero prawdziwych maili, SELF_TEST, odczytów skrzynki/OAuth lub zmian prywatnego runtime.

### CI publikacji 15198a6 — faktyczne wyniki

[Run 38360438675](https://github.com/JakubLewosz/JobHunter/actions/runs/38360438675),
Node 24.19.0. Windows hosted: 403/403 backend (690940,55 ms), 12/12 performance
(24689,57 ms), build i 15/15 UI PASS. To izolowane fixture, nie domowy WORKSTATION.
macOS hosted: typecheck i 403/403 backend PASS, performance 11/12 FAIL. Pierwszy
odbiór Stop przy 10035 firmach: 1458,72 ms wobec 1000 ms; odwołanie uprawnienia
0,49 ms po odbiorze i brak nowych POST PASS. Pozostałe pomiary large-history
820,46 i 791,63 ms. Build/UI w tym jobie nie uruchomione po niezaliczonym gate.
Nie podniesiono progu, nie pominięto testu i nie przypisano przyczyny opóźnienia.
Jedno żądanie ponowienia joba odrzucone przez integrację GitHub (HTTP 403), zatem
nie ma drugiego wyniku tego SHA. Ta dokumentacja nie oznacza całego CI jako PASS.
Następny krok poza zakresem researchu: profilować zimny GET dashboard/companies
w tests/stop-scenario.ts na hosted macOS/Node 24.19 przy równoległych odświeżeniach.
Finalny commit dokumentacji ma ten sam kod runtime; jego CI sprawdzamy po pushu.

## Publiczny research na Windowsie — pakiet do weryfikacji

Research 23:29–23:40 Europe/Warsaw, bazowy HEAD `a3bc37b`, dirty.
Pełne identyfikatory i hashe faktycznie użytych trzech partii w
[pakiecie](research-review/2026-10-12_23-29_windows-01a1313a/README.md).
Node 24.19.0 / Codex CLI 0.162.0-alpha.17.2 / istniejący login ChatGPT.
Rzeczywisty probe JSON i web search PASS; wersja modelu nieustalona.
Nie użyto płatnego API, profilu syntetycznego jako użytkownika ani Gmaila.

Użytkownik zatwierdził dokładne korekty propozycji i wskazany oryginalny PDF;
hash sprawdzono bez edycji. Osobny diagnostic clone ma 9 faktów, bez fallbacku
do FixDesk. Dodatkowe aktywności CV nie są faktami generatora. Ograniczenia
statusu projektów są oddzielnie w template. Produkcyjna baza nie powstała.

Pierwsza partia: 30 rozpoczętych tożsamości, zero odczytanych źródeł.
Kontrolny odczyt odtworzył `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Node z
`--use-system-ca` odczytał tę stronę z HTTP 200, bez wyłączania TLS/SSRF.
Przyczyna wszystkich historycznych FETCH_FAILED nie została osobno ustalona.
Nie poprawiono wstecz ich statusów. Kolejne partie dokończyły tylko rozpoczęte
przypadki z tym samym niezerowanym budżetem; po 150 HTTP wyłączono ten transport.

Końcowo: 5 zweryfikowanych ekstrakcji i kwalifikacji, 5 literalnych kontaktów,
2 kwalifikujące się kontakty, 2 zachowane wersje/2 pełne kontrole, 3 pominięcia,
1 odrzucenie walidacji ekstrakcji (`UNVERIFIED_TITLE`). 15 wywołań modelu;
150 prób HTTP obejmuje błędy/retry/redirecty i dwie kontrole sieciowe.
23 zachowane READ obejmują kontrolny odczyt, nie 23 nowe firmy. Zero błędów
wykonania modelu. Dokładne liczniki i ograniczenia w MANIFEST.

Dwa pierwotne odrzucenia `UNAPPROVED_LINK` odtworzono minimalnym fixture FAIL:
kropka po URL w zatwierdzonym zdaniu była traktowana jako część adresu.
Mała normalizacja końcowej interpunkcji daje PASS; inny URL nadal blokowany.
Te same teksty sprawdzono ponownie, bez regeneracji i podmiany faktów.
Historia pierwszych kontroli pozostaje w pakiecie. Celowane diagnostic/review
tests **10/10 PASS** na fikcyjnych danych. Końcowy `npm run check`, Windows
win32/x64 i Node 24.19.0: **PASS, exit 0**. Typecheck/build PASS,
**382/382 backend** (522,2 s), **12/12 performance Stop** (15,4 s),
**15/15 Playwright** (48,0 s). Nie jest to test rzeczywistej poczty.

Audyt eksportu wszystkich rekordów/wersji/factIds/evidenceIds/sourceIds,
hashy, linków, danych prywatnych i zerowych approvals/outbox/send PASS.
Pakiet zawiera osiem plików UTF-8 i LATEST; SQLite/WAL/PDF/backupy i surowe
logi pozostają poza repo. Przykłady sprawdzono także dla pominięć i błędu.
Nadmierne contract=no w Tukano, wąska interpretacja celu kontaktu Merixstudio
i niepoparty tytuł Payarto są jawne; nie zmieniono kwalifikacji ręcznie.
Nie wykonano prawdziwego SELF_TEST, Gmail read/send, inicjalizacji WORKSTATION
lub importu do historii osobistej. Publikacja nie jest deploymentem.

## Lokalna nowa kampania — wyjątek wcześniejszych zgłoszeń

Baza kodu `a3bc37b` z lokalnymi niezacommitowanymi zmianami. Jawny nowy
initializer używa istniejącego CSV preview/import, bez sieci, modelu lub
Gmaila; odrzuca istniejący katalog, brak potwierdzenia i zmieniony hash.
Nie dodaje 33 dawnych nazw. Fingoweb i materiały DRAFT pozostają.
Nie wykonano inicjalizacji danych użytkownika, oznaczenia WORKSTATION lub
importu. Prawdziwy backend pozostaje wyłączony.

Decyzja o wcześniejszych aplikacjach jest zapisywana raz z ID/wersją/granicą
i związana z polityką. Nie odnawia się po Stop, Start, restarcie lub dniu.
Nowe własne/niepewne próby i blokady pozostają trwałe. Stara odpowiedź wymaga
lokalnej kontroli próśb o zaprzestanie kontaktu; UNKNOWN blokuje. Ograniczone
frazy PL/EN, kontrola plain/HTML, brak załączników i poczty w promptach modelu.
Migracja 018 jedynie dodaje status kontroli; nie usuwa historii.

FAIL → PASS odtworzone przed poprawką: nowy seed 34 firm zamiast jednej
blokady oraz stary SENT blokujący dozwoloną wiadomość. Nowe celowane testy:
25/25 PASS, potem dodatkowa odmiana „nie pisać”: reader 15/15 PASS.
Osobne public-diagnostic 4/4 PASS po pominięciu dawnego seed. Przypadki obejmują
restart z ponownym otwarciem SQLite/dzień, dokładnie jedną próbę, SEND_UNKNOWN,
późną odmowę, zachowanie ręcznych rekordów, niepełny odczyt, zakres adresów,
nieprzekazywanie poczty modelowi i trwałą blokadę po OPT_OUT.

Rzeczywisty `npm run check`, Windows win32/x64, Node 24.19.0:
typecheck PASS, **375/375 backend** (1612,2 s), następnie performance
**11/12**. Jedno FAIL: odbiór żądania Stop przy 10035 fikcyjnych firmach
1082,23 ms wobec progu 1000 ms; odwołanie prawa po odbiorze po 1,10 ms,
brak nowych POST. Nie podniesiono progu. Całe polecenie check zakończyło się
exit 1 przed build/UI — nie oznaczamy go jako PASS.

Jedno celowane powtórzenie `test:performance`: **12/12 PASS**, bez zmian
testu/progu lub optymalizacji kodu dla pomiaru. Przyczyny zmienności odbioru
HTTP nie ustalono. Oddzielnie końcowy build PASS i Playwright **15/15 PASS**
(49,7 s), w syntetycznych bazach i na fikcyjnych usługach. Nie jest to
rzeczywisty pilotaż Gmaila, pełny dzień lub gwarancja opóźnienia Stop na tym
komputerze.

Wskazany rzeczywisty PDF ma jedną stronę; treść i układ sprawdzono bez edycji,
hash źródła nie zmienił się. Użytkownik potwierdził właściwe CV i przekazał
doprecyzowania materiałów. Zmienione fragmenty propozycji czekają na końcową
akceptację; brak zatwierdzeń profilu/CV w bazie, bo baza nie została utworzona.
Pliki/propozycje/dane użytkownika poza repo. Zero prawdziwych send/SELF_TEST,
odczytów Gmaila, zmian OAuth/nadawcy lub publikacji danych.

## Domowy Windows — przygotowanie bez poczty

Sprawdzono zdalne refy i wybrano `a3bc37b2b9200a3b3c8435ee1046448716373ca4`
na `codex/local-windows-pilot`, zawierający wcześniejszy `810b860`. Main nadal
wskazuje starszy `4e6b864`. Początkowy checkout był czysty; przed aktualizacją
nie wykryto backendu JobHuntera. Nie zatrzymywano procesu użytkownika.

Windows win32/x64, Node **v24.19.0**, npm **11.17.0**. Po `npm ci` uzupełniono
brakujący przypięty `htmlparser2`; doctor potwierdził SQLite **3.53.4** i natywny
CLI **0.162.0-alpha.17.2**. Sprawdzono help/features i istniejące logowanie
ChatGPT przez `login status`, bez odczytu plików uwierzytelnienia. Nie jest to
potwierdzenie dostępności rzeczywistego wyszukiwania lub limitu modelu.

Rzeczywisty `npm run check`: **350/350 backend, 12/12 performance Stop,
15/15 UI**, typecheck/build PASS. Backend 553,1 s, performance 16,1 s,
Playwright 48,5 s. Wyłącznie fikcyjne providery, tymczasowe bazy i lokalne
repozytoria testowe; nie testowano prywatnej instalacji WORKSTATION.

Domyślny katalog danych roboczych nie istnieje; `history:local doctor` zakończył
się `ENOENT`, nie tworząc bazy. Brak zmiennej wskazującej inne miejsce danych.
Liczników, blokad i kompletności rzeczywistej historii nie ustalono. Poproszono
użytkownika o właściwy katalog albo informację, że oryginał pozostaje na Macu.
Backup, configure WORKSTATION/LOCAL_ONLY, odczyt materiałów/CV i publiczny smoke
pozostają niewykonane do ustalenia historii oraz wymaganych potwierdzeń.

Zero rzeczywistych wysyłek/SELF_TEST, odczytów Gmaila, zmian OAuth/nadawcy,
zatwierdzonych materiałów lub prywatnej historii. Nie publikowano danych.

### Poszerzone szukanie bazy i procedura ręcznej historii

Na prośbę użytkownika przeszukano metadane plików bieżącego profilu Windows
(AppData, Documents, Desktop, Downloads, OneDrive i pozostałe dostępne katalogi),
dostępnego D oraz ProgramData/xampp/inetpub. Poza Temp nie znaleziono bazy ani
znacznika JobHuntera. Odmowy dostępu do chronionych katalogów systemowych
zachowano jako ograniczenie; bez eskalacji lub zmiany uprawnień. Mac nie był
dostępny w tej sesji, więc brak oryginalnej historii na obu urządzeniach
pozostaje niepotwierdzony.

Przed nowym sprawdzeniem fixture znaleziono **73 jobhunter.sqlite** w Temp:
19 DEMO, 18 RESEARCH_ONLY, 17 APPROVAL_REQUIRED, 19 AUTO_POLICY. Odczyt
`readonly/fileMustExist` i quick_check: 73/73 integralne, zero workstation.json.
Wszystkie adresy w contacts/history_records/send_attempts mają domeny testowe
.test/.invalid; nie odczytywano treści wiadomości lub poświadczeń. Oficjalny
`history:local doctor` na najnowszym fixture RESEARCH_ONLY: 35 firm, 1 kontakt,
36 aliasów, 1 blokada, zero ręcznych rekordów/prób/rezerwacji/shared/niepewnych.
Te liczby opisują test, nie rzeczywistą historię użytkownika.

Oddzielny nowy katalog DEVELOPMENT, Windows win32/x64, Node 24.19.0:
jednorazowa kontrola procedury bootstrap z istniejącymi Store/ResearchJobHunter.
Tylko dwa fikcyjne kontakty CSV: CONTACTED i REJECTED. PASS: podgląd nie dodaje
rekordów, zmieniony tekst blokowany przez hash, import 2, reimport 0, scalenie
aliasu przez domenę, zachowane statusy, doctor i spójny backup. Configure
przetestowano wyłącznie na tej syntetycznej historii. Zero wywołań sieci,
Gmaila, prób/outbox/rezerwacji, zatwierdzonych faktów i CV; stopped=true.
Nie uruchamiano serwera lub workerów. Pełny check powyżej nadal dotyczy tego
samego kodu a3bc37b; teraz zmieniono wyłącznie dokumentację.

Nowa baza robocza/import/oznaczenie WORKSTATION nie zostały wykonane.
Następny krok: decyzja o Macu/źródle historii, rzeczywisty prywatny CSV,
lokalny podgląd i konkretna zgoda przed utworzeniem bazy oraz importem.

### Decyzja o nowej instalacji i pusty szablon CSV

Użytkownik potwierdził brak wcześniejszych wiadomości JobHuntera do firm
i wybrał nową instalację Windows bez historii SELF_TEST z Maca. To świadoma
decyzja o źródle nowej historii, nie usunięcie danych ani zatwierdzenie importu.

Przygotowano poza repo pusty CSV UTF-8 BOM z dokładnymi kolumnami istniejącego
importera: company,status,domain,email,date. Zero wierszy firm. Zgodność nagłówków
i zapisanych bajtów sprawdzona; podgląd nagłówków wyrenderowany i obejrzany.
Brak konkretnej listy ręcznych kontaktów: nie ma podglądu danych/hashu do
zatwierdzenia importu. Nie utworzono docelowego katalogu danych lub SQLite.
Nie zmieniono kodu, nie uruchomiono Gmaila/researchu, nie zatwierdzono profilu/CV.
Pełny check wcześniejszego etapu nadal dotyczy tego samego a3bc37b.

Użytkownik następnie podał listę obejmującą jeden ręczny kontakt. Prywatny CSV
uzupełniono jako CONTACTED, bez dopisywania nieznanego adresu/domeny/daty.
Istniejący previewHistory uruchomiono wyłącznie w nowym tymczasowym DEVELOPMENT,
bez importHistory, start/tick/probe, serwera i sieci. PASS: jeden poprawny wiersz,
zero zapisanych history_records, send_attempts i outbox. CSV i jego hash/podgląd
pozostają poza repo; baza docelowa nadal nie istnieje. Nie zatwierdzono importu
lub utworzenia bazy za użytkownika.

Podgląd nowej inicjalizacji wykazał dodatkowo 34 seedowane firmy, w tym 33 dawne
HISTORY_TO_VERIFY i jedną zachowaną blokadę. Proponowana mała korekta tylko
nowej inicjalizacji jest opisana w TASKS/URUCHOMIENIE_RANO, jeszcze niewdrożona.
Nie zmieniono kodu ani istniejącej historii.

## Zatwierdzone CV po szybkiej nawigacji — runda po 2f515ff

Punkt wyjścia 2f515ff, czysty codex/local-windows-pilot, git fetch origin,
HEAD/upstream 0/0. MacBook, DEVELOPMENT i oddzielne syntetyczne bazy testowe.
Nie zmieniono działającej poprawki review/sendera, backendu, parsera, schematów
Codexa, LOCAL_ONLY, prywatnego runtime/CV/nadawcy lub historii. Zero native Gmaila,
publicznego researchu i rzeczywistych maili/SELF_TEST.

**Mechanizm błędu potwierdzono pełnym testem przeglądarkowym przed poprawką.**
Po dodaniu fikcyjnego PDF zatrzymano żądanie zatwierdzenia, przełączono panel na
Wiadomości i dopiero wtedy przekazano żądanie do istniejącego backendu fixture.
Zatwierdzenie zwróciło 200; ponowny odczyt profilu potwierdził approved_at dla
dokładnie tego ID/pliku w testowej SQLite. Mimo tego select zawierał wyłącznie
placeholder, także po kilku cyklach pollingu. Test FAIL po 10 s asercji obecności
opcji, bez zwiększenia timeoutu. Oczyszczone dane syntetyczne: status/ID/profil/opcje
zachowane w prywatnym katalogu tymczasowym poza repo, bez dołączenia do artefaktów.

Przyczyna: act po sukcesie wykonywał load zależny od bieżącego widoku. Po nawigacji
drafts/outbox odświeżały się, ale profile nie; cached cvs zachowywało approved_at=null,
a GmailDelivery poprawnie wykluczał niezatwierdzony plik. Taki sam objaw wystąpił
na MacBooku, więc nie przypisujemy go wydajności Windowsa. Stary Windows CI
38251081308 potwierdza brak opcji/timeout, ale nie zawiera diagnostyki API/profile:
ten konkretny historyczny interleaving pozostaje nieudowodniony.

Minimalna poprawka w App.tsx: udane act invaliduje profil, a następny load pobiera
go niezależnie od aktualnego widoku. Generacja invalidacji jest konsumowana dopiero
przez zaakceptowany load zawierający profil. Jeśli loadVersion odrzuci starszą
odpowiedź, nowszy load/poll przejmuje nadal oczekującą invalidację. Starsza odpowiedź
nie nadpisuje nowszego stanu. Nie ustawiamy approved_at optymistycznie; zachowano
backendowe zatwierdzenia, CV hash/binding i unieważnianie podglądu po zmianie CV.
Nie przywrócono pełnego pobierania aplikacji co 2 s ani nie zmieniono timeoutów.

8 nowych testów UI: zatwierdzenie i upload po nawigacji; odmowa 403 i błąd sieci;
opóźniona stara odpowiedź profilu; odrzucenie mutation refresh przez nowszy poll
z zastępczym pobraniem profilu; kilka CV, dokładny wybór, polling i unieważnienie
podglądu/zgody; wspólna ścieżka PersonalMaterials w ustawieniach AUTO_POLICY.
Nowe testy nie wywołują sendera; przygotowanie podglądu nie tworzy outbox/POST.
AUTO pozostaje zatrzymane, a samo zatwierdzenie/wybór CV nie zmienia polityki.

Zwykły gmail.spec osobno zachowany: operacje potwierdzane rzeczywistą odpowiedzią
API i stanem UI, konkretne ID CV zamiast ogólnego przycisku. Nie zastępuje regresji
nawigacji. Trzy z góry zaplanowane przebiegi 9 testów każdy: **27/27 PASS**; każde
uruchomienie Playwright tworzy świeży root DEVELOPMENT i nowe bazy fixture.
Zegar Playwright służy do wyzwalania pollingu, nie sleep/reload maskującego błąd.
Pełny npm run check: typecheck/build PASS, **350/350 backend, 12/12 performance Stop,
15/15 UI**. git diff --check i formatowanie zmienionych plików TS/TSX PASS.
CI finalnego SHA na obu systemach zostanie sprawdzone po pushu i wskazane w raporcie
końcowym czatu, nie na podstawie wcześniejszego zielonego przebiegu.
To nie jest test rzeczywistej poczty ani instalacji domowego Windowsa.

## Współbieżność review i sendera — runda po c9b899f

Punkt wyjścia c9b899f, czysty codex/local-windows-pilot, po git fetch origin
HEAD/upstream 0/0. Wyłącznie istniejący fixture DEVELOPMENT/LOCAL_ONLY/AUTO_POLICY,
fikcyjni providerzy, syntetyczny profil/CV i osobne tymczasowe bazy. Bez publicznej
próby, native Gmaila, prawdziwej poczty/SELF_TEST, prywatnego runtime lub historii.

**Podejrzany błąd odtworzono przed poprawką.** Test zatrzymał SEMANTIC_REVIEW na
kontrolowanym Promise i potwierdził zapis szkicu, auto_draft_scope oraz RUNNING.
Sender uruchomiony w swoim terminie wykonał zero POST i zero trwałych pominięć,
ale przestawił sesję na WAITING, paused=true i anulował kontroler trwającego review.
Przyczyna: wybór niezweryfikowanego materiału → DRAFT_MATERIAL_UNVERIFIED z końcowej
bramki → domyślna decyzja o problemie sesji → wait/pause odwołujące research.

Minimalna poprawka ograniczona do auto-policy.ts, bez migracji, UI ani nowej kolejki:

- PENDING/RUNNING nie są pobierane przez sender. ERROR także nie jest gotowy:
  tekst pozostaje do jawnego review-only retry, nie oznacza supported=false.
- Nie ma globalnej blokady sendera podczas researchu: gotowy B może być obsłużony,
  gdy nowszy A nadal czeka na model.
- Gdy review rozpocznie się już po wyborze lub przygotowaniu pakietu, końcowa
  bramka nadal blokuje operację, ale sender odracza ją bez odwołania sesji,
  anulowania review albo trwałego pominięcia wersji. Zachowany termin polityki
  zapobiega intensywnemu ponawianiu.
- COMPLETED z false/null pozostaje odrzuceniem wersji; kodowe REJECTED/NOT_RUN
  i nieważny materiał DRAFT_MATERIAL_STALE także nie wstrzymują całej sesji.
  Nie dodano automatycznego ponawiania negatywnych kontroli ani supported=true.
- draftMaterialIssues, kontrola wersji/kontekstu/źródeł/profilu/kontaktu/CV,
  rezerwacje, deduplikacja i ostatnie sprawdzenie uprawnienia przed POST zachowane.

12 nowych testów sprawdza: RUNNING → ten sam tekst/wersja/hash → dokładnie jedna
fikcyjna wysyłka po pozytywnym review bez drugiego DRAFT lub ręcznej zgody na mail;
gotowy B obok A; PENDING; ERROR i jawny review-only retry; COMPLETED false i null
bez retry; pozytywną odpowiedź providera po Stop; edycję i zmianę źródeł w toku;
review rozpoczynające się po wyborze i na QUEUED przed rezerwacją; kodowe odrzucenie.
Dwie równoległe próby sendera dają jeden POST/rezerwację. 20 dodatkowych wywołań
przed odroczonym terminem nie odczytuje historii ani nie wykonuje POST.

Testy celowane: 24/24 PASS (12 nowych + research-materials). Pełny npm run check:
typecheck/build PASS, 350/350 backend, 12/12 performance Stop, 7/7 UI. Istniejące
testy AUTO_POLICY także PASS w pełnym zestawie. git diff --check PASS.
To testy fixture na MacBooku, nie publiczny research, replay ani domowy Windows smoke.
CI końcowego SHA zostanie sprawdzone po pushu i wskazane w raporcie końcowym.

## Diagnostyka i zachowanie materiałów — runda po fb8151e

Punkt wyjścia fb8151e, czysty codex/local-windows-pilot, git fetch origin i zgodność
HEAD/upstream 0/0. DEVELOPMENT/LOCAL_ONLY i blokada prawdziwej poczty bez zmian.
Natywny CLI 0.162.0-alpha.17.2, istniejące logowanie ChatGPT, ta sama izolacja/flag.

### Ustalone przyczyny i poprawki

- Utrata informacji o awarii: ExecCodexRunner redukował błąd do ogólnego kodu, a
  model_calls nie zachowywało wersji/exit status/sygnału/komunikatu. Teraz każde
  wywołanie ma ID, etap, początek/czas, wersję CLI, operację, exit code/sygnał,
  klasyfikację i ograniczony oczyszczony komunikat. SEARCH także zapisuje błędy.
  Diagnostyka błędu jest w lokalnej bazie i osobnym prywatnym katalogu tymczasowym,
  nie w repo; bez środowiska, args, danych logowania i niepotrzebnych zdarzeń modelu.
  Fixture prawdziwego procesu Node kończy się kodem 37: zachowano EFRAME37/cause,
  usunięto fikcyjne tokeny/API key/Bearer oraz całe zdarzenie agent_message.
- Utrata tekstu: zapis następował dopiero po checkDraft i review. Strukturalny
  DRAFT jest teraz utrwalany przed nimi jako NIEZWERYFIKOWANY: dokładny tekst,
  wersja/hash, payload z claims/factIds/evidenceIds i kontekst faktów/dowodów.
  Migracja 017 jest addytywna; backup przed migracją pozostaje aktywny. Błąd review
  zachowuje tekst, ERROR i null supported; retry sprawdza ten sam materiał bez DRAFT.
  REJECTED kodowo zachowuje powód/fragment, a UNSUPPORTED_TECHNOLOGY również
  technologię, claim i factIds. Zmiana tekstu/profilu/kontaktu/źródeł unieważnia
  kontrolę. Sender wymaga bieżącego powiązania i zakończonych kontroli, nie samego
  starego supported=true. Edycja podczas generowania nie jest nadpisywana; nowy
  wynik pozostaje osobnym niezweryfikowanym materiałem w historii wersji.
- Odtworzone negatywne review na realnych zapisanych materiałach: brak mapowania
  sourceId → evidence.id i brak inquiryBasis w fragmentach przekazanych do kontroli.
  Model żądał równości dwóch różnych przestrzeni identyfikatorów i oceniał hipotezy
  metadanych jako deklaracje w mailu, choć sam opisywał tekst jako poparty faktami.
  Pakiet ma teraz sourceId przy dowodzie i kodowo sprawdzone dodatkowe cytaty;
  niezweryfikowane inquiryBasis daje null/ostrzeżenie. Review ocenia twierdzenia
  tematu/treści/claims, nie niewybrane projekty w objaśnieniu analizy. Pytanie o
  dostępność nie potwierdza zatrudnienia zdalnego; instrukcja ekstrakcji rozdziela
  zdalną obsługę klientów/ceny usług od warunków współpracy kandydata.
- Odtworzony false positive technologii w fixture: „modele językowe” w deklaracji
  vs „modeli językowych” w zatwierdzonym fakcie. Dodano tylko tę odmianę do istniejącej
  grupy LLM. Nadal konieczny jest odpowiedni factId; samo występowanie technologii
  w firmie lub niepowiązanym fakcie nie wystarcza. FAIL → PASS, negatywna asercja
  obcego factId zachowana. Nie jest to dowód, że ten konkretny zwrot wystąpił w
  historycznym utraconym szkicu UNSUPPORTED_TECHNOLOGY.

Historyczne SEARCH/DRAFT/SEMANTIC_REVIEW / CODEX_FAILED z poprzedniej rundy nadal
mają **nieustaloną pierwotną przyczynę**: komunikaty i exit metadata nie istnieją.
Nie powróciły w tej rundzie. Nie przypisano im limitu, loginu ani błędu kontekstu
wyłącznie na podstawie kodu. Historyczny kwestionowany fragment technologii także
nie został odzyskany; utraconych tekstów nie przedstawiamy jako odzyskanych.

### Replay zapisanych źródeł

Odczytano wyłącznie poprzednią syntetyczną diagnostykę, read-only, i wykonano
spójne kopie SQLite poza repo. Oryginał identyczny bajtowo po backupie. Nie otwierano
prywatnej bazy roboczej. Replay ma wyłączone search/HTTP i brak klasy/gateway Gmaila.
Publiczny parser v1 jest jawnie historią tekstu, nie nowym odczytem parsera v2.

Jeden zachowany szkic: ponowiono wyłącznie review, dokładny tekst/wariant/hash
bez zmian. Trzy utracone teksty: 3 NOWE generacje na zachowanych analizach/źródłach,
nie rekonstrukcja poprzedniej treści. Ich początkowe review wykonały się poprawnie,
ale dały false przez opisany niepełny kontekst, nie przez awarię procesu.

Po poprawce kontekstu: **5 review-only** na kopiach (3 nowych materiałów replay +
2 z pierwszej świeżej próby), **5 supported=true/issues=[]**, **0 DRAFT i 0 HTTP/search**.
Porównano dokładny tekst, wersję i hash przed/po: wszystkie identyczne. Zachowano
prywatne wyniki false przed poprawką; nie przepisano wyników w oryginalnych bazach.

### Świeże próby publiczne

Dokładnie dwie próby tej rundy, osobne nowe dane, profil syntetyczny, każda <15 min
i ≤5 firm. Pierwsza istniejącym npm run smoke:public, druga celowo 1 wcześniej
odrzucona firma: świeży HTTP strony i kontaktu, bez powtarzania wyszukiwania.

| Wynik                                          | Próba 1: search/HTTP | Próba 2: celowany świeży HTTP |
| ---------------------------------------------- | -------------------: | ----------------------------: |
| Kandydaci/firmy                                |                    5 |                             1 |
| Strony READ                                    |                    6 |                             2 |
| Zakończone ekstrakcje                          |                    5 |                             1 |
| Dopuszczone kontakty GENERAL                   |                    4 |                             1 |
| Wygenerowane i zachowane wersje                |                    4 |                             1 |
| Odrzucenia kontaktu                            |                    1 |                             0 |
| Odrzucenia kodowe szkicu                       |                    0 |                             0 |
| Poprawnie wykonane review z false              |                    2 |                             0 |
| Błędy wykonania review                         |                    0 |                             0 |
| Szkice po pełnej kontroli treści               |                    2 |                             1 |
| Niezweryfikowane / niedopuszczone przez review |                    2 |                             0 |
| Attempts / outbox                              |                0 / 0 |                         0 / 0 |

Tabeli nie przepisano po replay: pierwsze dwa false były realnymi wynikami i nie
liczyły się jako szkice po kontroli. Ich późniejsze 2 PASS należą do replay, nie
do trzeciej próby publicznej. Niezweryfikowany materiał nie jest gotowy do wysyłki;
nawet pozytywny review w tym adapterze nigdy nie udziela prawa do wysyłki.

Próba 2 potwierdziła parser v2 na rzeczywistej wcześniej problematycznej stronie:
Email oddzielone od adresu, brak dawnego zlepienia, literalny kontakt i kontekst,
GENERAL bez promocji, ekstrakcja → kwalifikacja → zachowany szkic → code/review PASS.
Bez zgadywania, zmiany źródła lub ręcznego dopuszczania kontaktu. Nie było limitu/
braku logowania; test tych blokad pozostaje fixture, nie pozorowanym research.

### Stop i warunki CI

Ponownie odczytano log macOS fb8151e: large-history receipt **1131,73 ms**,
revoke **1132,63 ms** (różnica **0,90 ms**), odpowiedź **1139,52 ms**; brak POST
w toku w tym przypadku. Oddzielny przyjęty POST kończył się po **352,25 ms**,
nie był odwoływany przez Stop. FAIL dotyczył receipt <1000 ms, nie bramki wysyłki.

Izolowane 3 pomiary przed pełnym check: receipt **335,79 / 295,26 / 207,58 ms**;
revoke po kolejnych **0,12 / 0,12 / 0,10 ms**. Historia: 10 035 wierszy, **7 588 632
bajty** odpowiedzi, budowa danych **17,65–19,72 ms**, dodatkowo serializacja i obsługa
HTTP na tym samym event loop. Pełny zestaw wykonywał testy w kilku procesach wraz
z ciężkimi testami Git/SQLite; w kolejnych lokalnych check receipt **459,56 / 550,26 ms**.
Dokładnego opóźnienia 1131,73 ms na hostcie CI nie odtworzono lokalnie; obciążenie
współbieżnymi testami i dużą odpowiedzią jest rozpoznanym czynnikiem, nie dowodem
na każdy szczegół schedulera/GC tamtego przebiegu ani gwarancją SLA aplikacji.

Pełny zestaw nadal mierzy Stop i twardo sprawdza brak nowych POST **od chwili odwołania
prawa**, także przed odpowiedzią HTTP. Ten sam scenariusz i 10 000 firm/kontaktów
jest dodatkowo uruchamiany szeregowo 3 razy (12 przypadków) w test:performance,
automatycznie w npm run check / obu jobach CI. Progi **1000 ms receipt i 100 ms
revoke po receipt bez zmian**. To rozdzielenie testu funkcjonalnego pod konkurencyjnym
obciążeniem od powtarzalnego pomiaru; nie wyłączenie pomiaru lub zakazu POST.

Końcowy npm run check: **338/338 backend, 12/12 izolowanych pomiarów Stop, 7/7 UI**,
typecheck/build PASS, macOS arm64 / Node v24.11.0. Celowane nowe regresje 12/12 PASS.
git diff --check PASS. Ostatnia powtórka początkowo miała brak pliku Chromium w
cache: backend/performance przeszły, UI nie wystartowało. Odtworzono wyłącznie
zależność testową przez playwright install chromium i powtórzono cały check.
CI finalnego SHA jest sprawdzane po pushu; wynik będzie podany w czacie, bez
zakładania PASS na podstawie samego workflow lub wcześniejszego SHA. Szczegółowe źródła,
szkice i diagnostyka pozostają poza repo. **Zero** rzeczywistego Gmaila/skrzynek/
send/SELF_TEST, prywatnego runtime/CV/materiałów/liczników, repo historii lub zakupów.
Domowa instalacja Windows i jej profil/Gmail nadal nieweryfikowane; CI to fixture.

## Powtórzenie publicznego researchu po strictOutputSchema

Poniżej zapis poprzedniej rundy, nie aktualne liczniki.

Punkt wyjścia **a32d843**, codex/local-windows-pilot. git fetch origin wykonany;
HEAD zgodny z upstream (0/0), checkout czysty. Zachowano bieżącą gałąź. Natywny
Codex CLI **0.162.0-alpha.17.2**, istniejące logowanie ChatGPT. Bez płatnego API,
zmiany konfiguracji/uprawnień lub osłabienia izolacji. Domyślne smoke:public tworzy
nowy katalog diagnostyczny z zatwierdzonym wyłącznie syntetycznym profilem.

W tym zleceniu wykonano dokładnie **dwie** rzeczywiste próby, każdą z limitem
5 firm / 15 min, na odrębnej bazie. Pierwsza zatrzymana na SEARCH / CODEX_FAILED:
0 kandydatów/stron/ekstrakcji/kontaktów/szkiców. Probe modelu i web search PASS,
ale właściwe wyszukiwanie bez wyniku. Adapter zachował tylko ogólny kod; pierwotna
przyczyna CLI nieustalona. Nie przypisano jej schematowi, loginowi ani limitowi.

Druga próba: właściwy research 7 min 24,7 s, także z probe poniżej 15 min.

| Etap                                        | Rzeczywisty wynik drugiej próby                                  |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Kandydaci                                   | 5                                                                |
| HTML PUBLIC_HTTP / HTTP 200 / READ          | 9 stron                                                          |
| Ekstrakcje po schemacie i walidacji cytatów | 5 zakończonych                                                   |
| Kwalifikacje                                | 5 zakończonych, 4 dopuszczone kontakty GENERAL / COMPANY_INQUIRY |
| Generowanie                                 | 3 poprawne odpowiedzi DRAFT, 1 błąd wykonania DRAFT              |
| Kontrola kodowa szkiców                     | 2 PASS, 1 UNSUPPORTED_TECHNOLOGY                                 |
| Kontrola semantyczna                        | 1 supported=true/issues=[], 1 CODEX_FAILED                       |
| Zapisane szkice                             | 1 NEEDS_REVIEW                                                   |
| Send attempts / outbox / approvals          | 0 / 0 / 0                                                        |

**Wynik całości INCOMPLETE**, run PAUSED / ITEMS_NEED_REVIEW. Nie jest to pełny
PASS wszystkich kandydatów. Zapisany szkic przeszedł cały rzeczywisty proces:
search → publiczny HTML → ekstrakcja → kwalifikacja → szkic → kontrola kodowa
→ osobny semantyczny review. Ponowny lokalny checkDraft na niezmienionej treści
z odczytanej read-only bazy także PASS: 8 claims, 6 factIds, 1 evidenceId.
Nie potwierdzono rekrutacji lub warunków współpracy; szkic pyta, nie obiecuje
dopasowania. Nie przenosi do profilu technologii firmy ani produkcyjnych wdrożeń.
Szkic ma 74 słowa; zachowano ostrzeżenie o krótszym tekście zamiast wypełniaczy.

Przyczyny niezapisania pozostałych szkiców, w kolejności przetwarzania:

- DRAFT / CODEX_FAILED: brak poprawnie zakończonego wywołania modelu. Dokładny
  surowy komunikat nie był zachowywany; przyczyna natywnego błędu nieustalona.
- SEMANTIC_REVIEW / CODEX_FAILED: generowanie i kontrola kodowa przeszły, osobny
  review nie zakończył się poprawnie. research_items przechowuje etap DRAFT,
  dokładniejszy etap potwierdza model_calls. Treść nie została utrwalona.
- QUALIFY / odrzucenie literalnego adresu: parser v1 skleił etykietę Email z
  adresem. Regex traktował etykietę jako część adresu; analiza usunęła kontakt,
  a strukturalny kontekst strony był pusty. To błąd parsera, nie dowód, że adres
  miał przeznaczenie sprzedażowe. Nie dopuszczono go ręcznie dla uzyskania szkicu.
- DRAFT / UNSUPPORTED_TECHNOLOGY: kod nie potwierdził technologii w deklaracji
  CANDIDATE we wskazanych factIds. Nie poluzowano bramki. Odrzuconej treści/nazwy
  technologii nie zachowano; bez niej nie można wykluczyć false positive.

Odtworzone FAIL → PASS na fikcyjnych danych: zlepiona etykieta/adres inline oraz
diagnostyczny szablon zachowujący szkołę/miasto/portfolio z bazowego profilu.
Parser v2 oddziela widoczne adresy w elementach inline, zachowuje etykiety i
blokady sprzedaży/sprzeczności; sam href nie potwierdza adresu, a fragment innego
adresu nadal jest odrzucany. Cache v0/v1 wymaga ponownego odczytu i nowej wersji
źródła; poprzednie rekordy/MIME nie są przepisywane. Read/cache i ostatnia kontrola
źródeł używają tej samej stałej wersji. Pierwszy test v1 wykrył stałe `=== 1`
w cache; zastąpiono je wspólną wersją i powtórzono regresję.

Szablon diagnostyczny jest całkowicie syntetyczny, a instrukcja pierwszego akapitu
bierze tożsamość/edukację tylko z zatwierdzonych faktów, bez stałego nazwiska/szkoły.
Zapisany rzeczywisty szkic już wcześniej pominął niepotwierdzone dane ze wzoru.
Raport smoke zawiera liczniki ekstrakcji/kwalifikacji i osobne agregaty błędów
modelu/kandydatów. Regresja odtwarza zapisany przez worker limit: BLOCKED_EXTERNAL
z etapem/kodem, mimo braku wyjątku z tick. Nieznany CODEX_FAILED lub błędny schemat
nie są automatycznie oznaczane jako limit/brak logowania.

**Nie wykonano trzeciej publicznej próby.** Wyniki liczbowe dotyczą parsera v1 i
szablonu użytego podczas drugiej próby; świeży publiczny odczyt odrzuconej strony
po parserze v2 i publiczna generacja po poprawce szablonu pozostają nieweryfikowane.
Nie zastąpiono ich testem offline. Również ACTIVE/OPEN i kontakt RECRUITMENT nie mają
pozytywnego rzeczywistego przypadku w tym przebiegu. Dalszy smoke wymaga osobnego
zlecenia lub wykonania przez użytkownika na domowym Windowsie.

Testy celowane **101/101 PASS**. Końcowy npm run check: **326/326 backend, 7/7 UI**,
typecheck/build PASS na macOS arm64 / Node v24.11.0. Backend 111,6 s, UI 33,7 s.
Duży HTML 2000 adresów: 88,8 ms w pełnym check, bez zwiększenia progów. git diff
--check PASS. CI nowego SHA jest sprawdzane po pushu, nie zastępowane wcześniejszym CI.

Pełne pięć analiz i jedyny zapisany, niezmieniony szkic pokazano w prywatnym pliku
poza repo. Publiczny raport nie zawiera firm/adresów, surowych stron, pełnych wyników
lub prywatnych ścieżek. **Zero** inicjalizacji/odczytów Gmaila, send/SELF_TEST, zmian
prywatnej bazy/runtime/materiałów/CV/historii/liczników, repo danych lub zakupów.
Nie zatrzymano aplikacji użytkownika. Domowy Windows, jego zatwierdzony profil i
rzeczywista poczta nadal wymagają odrębnych prób; CI offline nie jest takim pilotem.

## LOCAL_ONLY i domowy Windows

Poniższe sekcje zachowują wcześniejszą weryfikację a32d843; aktualne powtórzenie
publiczne i końcowe liczniki są powyżej.

Pobrano aktualne refy GitHub; main 4e6b864 był o 5 commitów za overnight 810b860.
Czysty lokalny checkout, nowa gałąź codex/local-windows-pilot. Nie znaleziono aktywnego
backendu w tym checkoutcie. Bazowy check na macOS arm64 / Node v24.11.0:
282/282 backend, 7/7 Chromium, typecheck/build PASS.

Końcowy npm run check: **322/322 backend, 7/7 UI**, typecheck/build PASS.
Backend 100,8 s, Playwright 31,2 s. git diff --check PASS. Wszystkie dane testów
syntetyczne w katalogach tymczasowych, odbiorcy example.test / example.invalid.
To rzeczywiste testy macOS tego kodu, nie prywatnej konfiguracji użytkownika.
Nie wykonano lokalnej próby PowerShell/instalacji domowego Windowsa nowej wersji;
wynik CI finalnego SHA będzie podany po faktycznym zakończeniu.

LOCAL_ONLY: pełny search/read/qualify/draft/send na fikcyjnych providerach bez repo.
claim/assertOwner/checkpoint/status HistorySync są celowo zatrute błędem; sesja
przechodzi, bo nie korzysta z nich ani Gita. Start/Wznów/Stop/readiness i shutdown
pozostają lokalne. Dwa Start dają jedną sesję. Drugi rzeczywisty proces otwierający
ten sam profil na innym porcie dostaje PROFILE_LOCKED. Utrata lock w oknie przed
POST daje zero POST. Development nie ma natywnego gateway/metadanych konta; sam
Windows bez lokalnego markeru też nie upoważnia. Fikcyjne AUTO działa niezależnie od OS.

Przejście PRIVATE_GIT → LOCAL_ONLY wymaga Stop, potwierdzenia i zgodności zamkniętej
opublikowanej historii; niepowodzenie nie daje fallbacku. Istniejące testy opcjonalnego
PRIVATE_GIT zachowane. Restart i odtworzenie backupu nie przenoszą prawa do wysyłki.
Zmiana RESEARCH_ONLY ↔ AUTO zachowuje bazę i niezmienioną politykę, lecz odwołuje sesje
i zgody. Timeout/shared unknown po restarcie lub zmianie historii nadal blokuje.

Backup przez VACUUM INTO obejmuje WAL. Test odtworzenia i migracji syntetycznej bazy
poprzedniego schematu zachowuje pełny eksport firm/aliasów/manual records/blokad/
SENT/SEND_UNKNOWN/shared attempts/shared usage i liczników; brak aktywnych approvals.
Migracja 016 dodaje tylko strukturę kontekstu. Nie otwierano prywatnej bazy do migracji.

Końcowy przegląd wykrył, że pomocniczy backup/restore-copy otwierał również oryginalny
Store i mógł uruchomić jego migracje. Poprawka oddziela read-only backup oraz odtworzenie
kopii od migratora. Procesowa regresja sprawdza identyczne bajty starszej syntetycznej
bazy i brak migracji 016 w backupie. Niepoprawne configure jest odrzucane przed odczytem/
migracją bazy. Przed pierwszą aktualizacją helper można uruchomić z osobnego checkoutu.

HTML: reprodukcja FAIL przed poprawką na dokładnym przykładzie bez kropki między
sekcjami. Po poprawce prawdziwy PublicSourceReader/DOM → kwalifikacja → fikcyjny AUTO:
osobny GENERAL i sprzedaż, nagłówek Sprzedaż nad biuro, HR obok faktur/RODO, div/section,
lista/br/tabela, heading nad kartą/listą, minifikacja/wcięcia, sprzeczne etykiety,
marketing systemów sprzedażowych, globalna odmowa, zmiana celu i usunięcie adresu PASS.
GENERAL pozostaje GENERAL. Stary cache PUBLIC_HTTP bez struktury nie kwalifikuje
kontaktu; następuje realny ponowny odczyt i nowa wersja. compact nadal weryfikuje cytaty.
Hash obejmuje wersję parsera i surową treść; stare rekordy i wysłane MIME nieprzepisane.
Test MIME nadal porównuje identyczną treść, normalizując tylko nowe granice bloków.

UI: trzy widoki, brak origin/handoff w LOCAL_ONLY, stan developerski i syntetyczne dane,
lokalna gotowość, Start/Pauza/Stop, historia i ponowne otwarcie zamkniętej karty podczas
działającej sesji. Zrzuty 1440/390 px obejrzane, brak poziomego overflow. PNG tylko
w ignorowanym test-results. Dodatkowo końcowy scenariusz AUTO czeka na aktualny licznik.

## Pomiar Stop przez HTTP

Realny serwer Fastify na osobnym porcie, prawdziwe żądania HTTP/sesja/CSRF; fikcyjne
usługi. Od t0 wysłania Stop mierzymy odebranie request przez Node, odwołanie prawa do
nowego POST i odpowiedź. Fikcyjny POST już przyjęty kończy się niezależnie po 350 ms.

| Obciążenie                                         | Odebranie Stop | Odwołanie prawa | Odpowiedź | Zakończenie przyjętego POST |
| -------------------------------------------------- | -------------: | --------------: | --------: | --------------------------: |
| Powolny publiczny read                             |       31,99 ms |        33,43 ms |  37,70 ms |                        brak |
| Powolny model                                      |       27,96 ms |        28,13 ms |  31,58 ms |                        brak |
| 10 000 firm i kontaktów + 3 równoległe odświeżenia |      443,07 ms |       443,36 ms | 444,39 ms |                        brak |
| Przyjęty fikcyjny POST                             |       24,43 ms |        24,58 ms |  28,38 ms |                   350,85 ms |

Odtworzony wcześniejszy FAIL: 10 000 firm i 3 odświeżenia dashboardu dały 3269,64 ms
do odebrania Stop. Usunięto N+1 historii i pełną historię z normalnego dashboardu.
Końcowy test jest silniejszy: także 10 000 kontaktów i odczyt pełnej historii firm.
Po Stop żadnego nowego POST. To pomiary na tym macOS, nie SLA na każdym komputerze,
czas internetu/Google lub odwołanie już wysłanego żądania.

Duży HTML bez grup sekcji, 2000 adresów / 108,9 kB: odtworzono 6863,95 ms parsera.
Lokalny indeks kontekstów i etykiet oraz deduplikacja zbiorami usuwają powtarzane
skanowanie całego kontenera. Powtórka 45,15 ms, test celowany 65,30 ms, pełny check
107,88 ms pod równoległym obciążeniem. Etykiety każdego adresu i sprzeczności zachowane;
nie cache'ujemy tych wyników między różnymi odczytami strony. Regresja zachowuje próg
1000 ms, bez zwiększenia timeoutu lub poluzowania kwalifikacji.

CI pierwszego SHA f25621e: macOS 319/319 + 7/7 PASS, Windows 314/319 (5 FAIL).
Jeden FAIL był błędem zegara fixture: przy wolnym Windowsie realny fetched_at powstawał
kilka sekund po początkowym zegarze logicznym; +24h1s nie wykonywało odświeżenia.
Źródła fikcyjnego adaptera związano z jego zegarem logicznym, asercje bez zmian.
Cztery FAIL mierzyły odwołanie prawa dopiero po zapisach SQLite (123–164 ms po receipt),
zamiast faktycznej bramki. Kod ma teraz odrębne prawo sesji w pamięci, odwoływane na
wejściu Stop/Pauzy/wstrzymania, przed I/O. Test rejestruje tę bramkę, zachowuje próg
100 ms i dodatkowo wymusza błąd zapisu: nadal zero POST. Nie osłabiono ostatnich kontroli
SQLite, sesji, materiałów lub kontaktów. Po poprawkach pełny lokalny check 322/322 + 7/7.
CI nowego finalnego SHA jest sprawdzane po pushu; poprzedni PASS macOS go nie zastępuje.

Soak: **6/6 PASS** — LOCAL_ONLY i PRIVATE_GIT, seed 17/41/93. Każdy 96 kroków po
15 minut plus 6 godzin logicznego snu, 30 h logicznych. Lokalny wariant zatruwa wszystkie
operacje HistorySync także po restarcie. ≥9 kierunków, >5 wiadomości, queue≤3, brak
drugiego kontaktu/rezerwacji, Pauza/Stop/restart/dzień Warszawa, błędy odczytów i końcowy
timeout zachowany jako SEND_UNKNOWN. To symulacja zegara z fikcyjnymi usługami, nie
całodniowa praca z Google. Prawdziwy systemowy sleep/resume nadal nieweryfikowany.

## Ograniczona próba publiczna

Wykonano jedną smoke:public na macOS: nowy katalog tymczasowy, jawnie syntetyczny profil,
maksymalnie 5 firm/15 min. Brak GmailJobHunter/gateway/native poczty/zgód/outbox potwierdzony
w kodzie i testem przed uruchomieniem. Native CLI **0.162.0-alpha.17.2**, exec help i
login status ChatGPT sprawdzone; bez odczytu auth.json lub zmian konfiguracji globalnej.

Wynik **niepełny/FAILED_EXTRACTION**: 5 kandydatów, 5 odczytanych stron, 0 zakwalifikowanych
kontaktów, 0 szkiców i 0 prób/outbox. Pięć ekstrakcji zapisanych jako CODEX_FAILED.
Kontrolny syntetyczny proces ujawnił odrzucenie schematu (optional properties w strict
output); poprawka wymaga jawnych kluczy w schemacie CLI, bez zmiany walidatorów/izolacji.
Regresja offline i rzeczywisty Codex na fikcyjnym wejściu PASS, webSearches=0.

Nie powtarzano publicznej próby po poprawce. Nie ma szkiców do oceny zgodności treści
ze źródłami; próba nie rozstrzyga kontekstu kontaktów na realnych stronach lub skuteczności
kandydatury. Pełne źródła/wyniki są poza repo; raport nie publikuje firm/adresów/logów.
Gotowe polecenie Windows: npm run smoke:public, potem jawne --approved-profile KATALOG_BAZOWY
z już zatwierdzonymi materiałami (tylko odczyt oryginału). Brak loginu/uprawnień/limitu
da BLOCKED_EXTERNAL, nie fallback do paid API/full access.

**Zero prawdziwych send/SELF_TEST, odczytów skrzynki, zmian nadawcy/OAuth/CV/materiałów,
prywatnej bazy/liczników/runtime, repo historii lub zakupów.** Nie zatrzymano aplikacji
użytkownika i nie uruchomiono migracji na prywatnych danych. Publiczna próba była
wyraźnie diagnostyczna; nie przygotowuje kolejki do późniejszej produkcyjnej wysyłki.

## Wyniki historyczne

Kod nowego etapu: 3dfb49b8e4db92580fb3be735088b923f37d7e93, gałąź
[codex/local-windows-pilot](https://github.com/JakubLewosz/JobHunter/tree/codex/local-windows-pilot).
Osobny commit zachowuje ten raport. Zdalny ref i CI finalnego SHA są sprawdzane po
pushu i raportowane w czacie / Actions; main nie jest automatycznie scalany.

## Stabilizacja nocna — `codex/overnight-stabilization`

Windows win32/x64, Node **v24.19.0**, npm **11.17.0**. Czysty punkt wyjścia
`4e6b864c2623626cf319671ab3a83c8756dd6822`; `git fetch origin` wykonany.
Bazowy `npm run check`: **237/237 backend, 7/7 UI**, typecheck/build PASS.
Nie wykazano błędu bazowych kontroli. Późniejszy pełny etap P0:
**253/253 backend, 7/7 UI**, typecheck/build PASS.

**Końcowy `npm run check` po poprawce CI: 282/282 backend, 7/7 UI, typecheck/build PASS**,
Windows win32/x64, Node v24.19.0. Backend 623,7 s; Playwright około 1 minuty.
`git diff --check` PASS. Dodatkowy ostatni review obejmował całość diffu i pliki nowe.

Odtworzone FAIL → PASS: wcześniejsza korespondencja A (przed podglądem i przy ostatnim
scanie), zmiana kolejności A/B podczas kontroli, ręczne zatwierdzanie w oknie sendera.
Pierwszy test zmiany kolejności nie wykonywał świeżego odczytu z powodu poprawnego cache;
fixture zmieniono na przestarzałe źródło, aby faktycznie uruchomić badaną granicę await.
Niezależny przegląd odtworzył ponadto zmianę origin po fetch, zmianę gałęzi, Start podczas
handoff, niesymetryczne aliasy, odziedziczenie starego zakresu, restart kierunków po zmianie
limitu i cache ignorujący nową podstronę pominiętej firmy. Wszystkie dostały poprawki
oraz regresje w izolowanych danych. Podwójny Start i pojedyncza rezerwacja miały już
zabezpieczenia; dodano sprawdzenie równoległych wywołań sendera.

Testy kwalifikacji A–F oraz treści: active=no nie blokuje samego zapytania;
GENERAL zachowuje przeznaczenie; unknown daje pytanie; niedopasowanej oferty nie
przepisujemy na PROSPECT. Osobna podstawa działalności jest literalna, a odmowa firmy,
formularz, konflikt i niejednoznaczny zakres ograniczenia blokują. Cel konkretnego
adresu jest sprawdzany w jego zdaniu/linii, nie na podstawie innego adresu sprzedaży
w stopce. To nie jest gwarancja bezbłędnej interpretacji każdej strony.

Próba przyspieszenia bramki historii przez lokalne fingerprinty została wycofana:
niezależny przegląd odtworzył ominięcie przez commondir i zmianę efektywnego globalnego
origin. Końcowy kod zachowuje pełną kontrolę Git; nowe regresje używają wyłącznie plików
temp i przywracają zmienną GIT_CONFIG_GLOBAL w finally. Odrzucono niebezpieczny cache,
nie osłabiono asercji własności. Pomiar/optymalizacja Stop pozostają P2.

Gmail: najwyżej dwa kompletne scany na jedną kontrolę, ten sam scope, sprawdzenie
konta/paginacji; pozytywna wiadomość manualna blokuje kontakt. Niestabilny historyId
i błąd strony pozostają ERROR. Retry dotyczy wyłącznie bezpiecznego odczytu z backoffem,
nigdy POST. Zachowana niepewność i ostatnia bramka MIME/CV/konta/sesji.

Planer testowany po 10 wykonanych kierunkach, także przez ponowne utworzenie obiektu
i pełny restart AUTO w soak. Metryki/cursor/cooldown w SQLite; zmiana samego limitu
nie rozpoczyna listy od nowa. Kolejka pozostawia resztę kandydatów PENDING; nowa wersja
źródła/kontaktu unieważnia cache zależny od źródeł i materiałów.

`npx tsx --test tests/auto-soak.test.ts`: **3/3 PASS**, seed **17, 41, 93**.
Każdy przebieg ma 96 kroków po 15 minut oraz 6 godzin logicznego snu — **30 godzin**,
łącznie 90 godzin logicznych. Fikcyjne nowe/znane firmy i tracking URL, błędy źródeł
i historii, niepewny review, Pauza/Stop/restart, zmiana dnia Europe/Warsaw, brak limitu,
symulowany właściciel i transakcyjny transfer do osobnej bazy; na końcu timeout po
przyjęciu. Asercje: >8 kierunków, >5 maili, queue≤3, brak drugiego kontaktu/rezerwacji,
brak nadrabiania serią, zero POST po odwołaniu i zachowany SEND_UNKNOWN. Zegar źródeł
fixture został związany z czasem logicznym: wcześniejsza wersja fixture zwracała czas
rzeczywisty, więc po dobie kontrola słusznie blokowała przeterminowane dowody.

Soak używa podstawionego transportu właściciela bez sieci; **osobny** A→B→A używa dwóch
baz i dwóch realnych klonów lokalnego Git, aliasu prawnego, ręcznych rekordów i syntetycznych
zamrożonych prób/liczników FIRST_CONTACT/SELF_TEST. Nie jest to realna doba Google ani
pełna macierz awarii właściciela w tej samej symulacji. Testy limitów, OPEN/PROSPECT,
zmiany globalnej historii, paginacji i procesu CLI są osobnymi scenariuszami.

Pełny check w trakcie pracy: **273/274 backend**. Regresja własnej zmiany cache powodowała
nowe wersje tej samej firmy i przedwczesny koniec historycznej godzinnej sesji ręcznej.
Zależność od nowych źródeł ograniczono do AUTO_POLICY, zachowując dotychczasowy limit
i deduplikację RESEARCH_ONLY. Istniejąca asercja 10 kandydatów i 5 tur bez zmian;
celowany test PASS. Pełna kontrola końcowego kodu została ponowiona.

Regresja własnej zmiany UI: ograniczenie pobierania pominęło dane outbox raportu DEMO
i bezpieczne wartości przed pierwszym załadowaniem widoku. Dwa scenariusze Playwright
FAIL; uzupełniono wymagane dane aktywnego Raportu i ponowny kompletny przebieg **7/7 PASS**.
Nie usuwano asercji ani nie zwiększano timeoutów. AUTO UI sprawdza brak pobierania replies/reports,
blokadę ręcznego endpointu, wyszukiwarkę historii i zachowanie trybów. Zrzuty 1440/390 px
w ignorowanym test-results; wyłącznie fikcyjne treści.

CI: `.github/workflows/offline-check.yml`, Windows/macOS, Node 24.19.0,
`npm ci`, Chromium i `npm run check`. Oficjalne akcje checkout/setup-node/upload-artifact
v7 zweryfikowane 11 października w README upstream i przez odczyt tagów Git, przypięte SHA.
Permissions contents:read, brak zapisanych sekretów i płatnej infrastruktury, concurrency,
retencja fikcyjnych PNG/raportu po porażce 3 dni. Stan CI konkretnego SHA publikacji zostanie podany w końcowym raporcie czatu;
przebiegi są dostępne w [Actions](https://github.com/JakubLewosz/JobHunter/actions).
Nie uznawać przygotowania workflow za zakończony wynik macOS.

Publikacja kodu/UI: `d10e42f7989a2d3af5cc8bba0d1caf12fa6e67a6`, gałąź
[`codex/overnight-stabilization`](https://github.com/JakubLewosz/JobHunter/tree/codex/overnight-stabilization).
Dwa logiczne commity, rzeczywisty push i odczyt ref zgodny z lokalnym SHA.
Skan 31 wychodzących blobów obu commitów i plików: bez prywatnych artefaktów/sekretów.
Osobny końcowy commit zapisuje ten stan publikacji w dokumentacji. Main nie scalono.
Git nie miał autora: użyto wyłącznie per-command `Codex <codex@localhost>`, bez zmiany
globalnej konfiguracji lub kont aplikacji. Wynik CI konkretnego finalnego SHA w raporcie czatu.

CI `45c3a318ff2cac3a93365e7f5265e154accfc491`: macOS **PASS**, Windows **240/280**, 40
błędów tej samej kontroli ścieżki. Log pobrano istniejącym uwierzytelnieniem GitHub
wyłącznie dla tego repo, bez przekazania sekretu do modelu/logów i bez zmian uprawnień.
Odtworzono lokalnie FAIL: Git zwracał inną wielkość litery dysku niż konfiguracja
realpath. Poprawka porównuje tożsamość fizycznego katalogu (dev/ino BigInt), zamiast
uznawać różnicę litery dysku za inne repo. Negatywny test innego katalogu nadal blokuje.
Nie wyłączono kontroli origin, HEAD, gałęzi lub dowiązań. Obie nowe regresje PASS;
ponowny pełny lokalny check **282/282 + 7/7**. Poprawka i ten raport będą wypchnięte
na tę samą gałąź. Wynik obu zadań CI nowego SHA wymaga rzeczywistego zakończenia;
końcowy raport czatu podaje dokładny ref oraz link przebiegu.

**Zero** prawdziwych send/SELF_TEST, odczytów skrzynki, zmian nadawcy, OAuth/CV,
zatwierdzonych materiałów, prywatnych liczników i historii. Nie uruchamiano prywatnej
bazy do migracji i nie zatrzymano backendu użytkownika. Migracje tylko na tymczasowych
syntetycznych bazach. Nie wykonano optional live researchu ani nowego audytu native CLI.

Nieweryfikowane: macOS użytkownika, publiczny research/aktualne CLI login/limity,
całodzienne działanie z Gmail, dostarczalność, pełna izolacja OS, rzeczywisty prywatny
origin oraz kompletna macierz przerw handoff/utraty wyniku push. Dokładny następny
etap w TASKS; konfiguracja/pilotaż w URUCHOMIENIE_RANO.

## Poprzedni etap — AUTO_POLICY, źródła i prywatna historia

Rzeczywiście wykonany końcowy `npm run check` na Windows win32/x64, Node 24.19.0: **237/237 testów backendu, 7/7 scenariuszy Playwright, typecheck i build PASS**. `git diff --check` PASS. Testy używają tymczasowych SQLite, fikcyjnych źródeł/Gmaila, fikcyjnego procesu CLI oraz lokalnych repozytoriów Git. Nie wysyłano rzeczywistych maili, nie uruchamiano prawdziwej kampanii, nie zmieniano nadawcy, OAuth, prywatnej bazy lub jej liczników. Nie tworzono zdalnego repo historii.

Stan bazowy: 205/206 backend; jedyny błąd Windows dotyczył FIFO hooków cleanup zamykających drugą bazę dopiero po próbie usunięcia katalogu. Poprawiono kolejność zamknięcia. Dwie nowe regresje źródeł/kontaktów najpierw FAIL, potem PASS: niezmienna treść z nowym potwierdzeniem i aktualizacja/unieważnianie kontaktu. Próba ciągła wykryła też liczenie starych szkiców jako budżetu nowego cyklu; poprawiono trwały licznik generacji w konkretnym runie. Rozstrzygnięta lokalnie próba nie pozostaje globalnie zablokowana przez jej starszą przeniesioną kopię SEND_UNKNOWN, a firma nadal pozostaje skontaktowana.

Nowe testy obejmują:

- pełny search/read/extract/qualify/draft/send bez indywidualnej akceptacji, tylko konfiguracja i Start;
- GENERAL dopuszczony polityką, zachowanie przeznaczenia, niedopuszczony kontakt, brak promocji GENERAL na RECRUITMENT;
- unknown godzin i pytanie kontra zmyślone dopasowanie; niepewny review pominięty;
- stronę firmy i osobną stronę kontaktu, recheck niezmienionej treści starszej niż doba, zniknięcie/zmianę przeznaczenia;
- pełny literalny email, bez akceptacji samego fragmentu opublikowanego adresu;
- Pauzę/Stop podczas researchu i przed POST, długą pauzę z ponownym przygotowaniem niewysłanego pakietu;
- pojedynczy POST po możliwym przyjęciu, SEND_UNKNOWN/restart/reconcile bez drugiego send;
- limit sesji, tempo, pięć pierwszych kontaktów bez limitu i kolejkę maksymalnie trzech szkiców; brak odziedziczonej daty/czasu końca;
- limity Gmaila/Codexa, brak intensywnego retry, jawne wznowienie; SENDING własnego sendera nie zatrzymuje poprawnie pracującego researchu;
- zmianę profilu/CV/nadawcy, kontrolę publicznych dowodów przed prywatnym odczytem, snapshot konta przed HTTP odczytu;
- deduplikację/liczniki po przeniesieniu i zmianie nadawcy, domenę znanej firmy/wariantu prawnego, import domeny do istniejącego rekordu;
- właściciela, niedomknięte przekazanie, konflikt aliasów, staging przerwanego eksportu, usunięcie historii, pierwszą bazę wymagającą potwierdzenia;
- eksport bez aktywnej zgody, OAuth/loginu, CV/PDF i całej skrzynki; liczniki SELF_TEST odrębne od aplikowania;
- panel AUTO przy 1440 i 390 px, Start/Historię/Pauzę/Stop/przekazanie. Zrzuty obejrzano. Zakładka odpowiedzi ukryta, stare dane/API zachowane.

Windows instalacja/diagnostyka: `npm ci`, SQLite 3.53.4, doctor, native `codex --version`, `codex exec --help`, `codex features list` PASS (CLI 0.162.0-alpha.17.2). Pierwsza instalacja próbowała niepotrzebnej kompilacji SQLite i natrafiła na CA/Visual Studio. Pakiet zawiera gotową bibliotekę; .npmrc wyłącza zależnościowe lifecycle scripts, następne zwykłe npm ci i rzeczywiste ładowanie SQLite PASS. Chromium pobrano z systemowym CA, bez wyłączenia TLS.

Rzeczywisty smoke `scripts/start.ps1 -NoBrowser` → backend DEMO/health → `scripts/stop.ps1` → zwolnienie blokady PASS w oddzielnym katalogu tymczasowym ze spacjami i polskimi znakami. To nie jest próba prawdziwej sesji AUTO/Gmaila.

**Nie zweryfikowano:** nowego kodu na macOS, natywnego researchu/limitów rzeczywistego konta Codexa, jakości wszystkich ekstrakcji, niezależnej izolacji całego procesu OS, całego dnia pracy, prawdziwego repo historii, historii prawdziwych kont i dostarczalności Gmaila. Pierwszy rzeczywisty eksport powinien wykonać użytkownik na urządzeniu z oryginalną bazą przez przygotowanie historii bez sesji wysyłkowej. Rzeczywista wysyłka wymaga konfiguracji/polityki i świadomego Start użytkownika.

## Historyczne próby — 8–9 października 2026

## Publikacja do niezależnego przeglądu — 9 października

Na nowe polecenie użytkownika przygotowano publikację całego aktualnego kodu i dokumentacji do weryfikacji przez ChatGPT. Przejrzano diff poprawki blokad między kontami i jej pięciu syntetycznych regresji; kod/testy od ostatniego pełnego check niezmienione. Ostatni rzeczywiście wykonany check pozostaje **206 backend / 6 UI PASS** opisany niżej; pełnego zestawu przy samym przygotowaniu publikacji nie powtarzano. Dodano [materiał przeglądu](REVIEW_HANDOFF.md) z bieżącym stanem, kolejnością czytania, ograniczeniami źródeł i proponowanymi etapami. Skan 92 plików nie znalazł znanych adresów z lokalnych podglądów testowych, sprawdzanych wzorców sekretów ani plików EML/PDF/SQLite/kluczy; zbędny jawny adres konta projektu w opisie zastąpiono jego rolą. Prywatne podglądy/EML/CV/SQLite/OAuth pozostają poza repo, bez nowych operacji Gmail lub zmian runtime. `git diff --check` PASS.

## Blokady firm i diagnoza dawnych kontroli — 9 października

Punkt wyjścia: czyste `main` po opublikowanym `db12c29`; instrukcje, lokalny kod, istniejące regresje oraz SQLite odczytano bez mutacji rzeczywistej bazy. Nowy test zmiany nadawcy/restartu odtworzył lukę: zapisany wcześniejszy kontakt pierwszego konta nie blokował nowego podglądu FIRST_CONTACT drugiego konta. Pierwszy `node --import tsx --test --test-name-pattern='zmiana nadawcy i restart|odpowiedź w SELF_TEST' tests/gmail-delivery.test.ts`: 1 PASS / 1 FAIL, brak oczekiwanego odrzucenia.

Minimalna poprawka w service.ts usuwa filtr konta z blokady już znanej korespondencji firmy. Zgoda i pełna kontrola historii bieżącego konta nadal wymagane; nie zmieniono zdalnego zakresu odczytu. LEFT JOIN outbox wyklucza odpowiedzi przypisane do SELF_TEST, aby test nie oznaczał firmy jako skontaktowanej. Bez migracji, nowego stanu firmy lub kasowania historii. Dodano pięć testów na mockach/katalogach tymczasowych, obejmujących OUTGOING/INCOMING między kontami i restart, SELF_TEST, akceptację i ostatnią bramkę przed POST, alias/subdomenę w Cc/Bcc oraz podobną obcą domenę, brak/wygasłą zgodę i zmieniony zakres. Celowane uruchomienie pięciu regresji: 5/5 PASS. Istniejący test false/null semantic review wykonany ponownie wraz z dwiema nowymi regresjami: 3/3 PASS; nie dodano drugiego mechanizmu generowania.

Końcowy rzeczywiście uruchomiony **`npm run check`: 206/206 backend, 6/6 UI (25,9 s), typecheck/build PASS**. `git diff --check` PASS. Testy syntetyczne, bez rzeczywistego Gmaila. Na zakończenie tego etapu zmiany pozostawiono lokalnie, bez nowego commit/push lub restartu rzeczywistego runtime; późniejsze przygotowanie publikacji opisano na początku raportu.

Readonly diagnoza dwóch historycznych ERROR / DRAFT / SEMANTIC_REVIEW_FAILED: odpowiadające model_calls SEMANTIC_REVIEW mają OK w dokładnie tych samych chwilach, 7 października 13:21:40 i 13:42:15 Europe/Warsaw. To błąd po otrzymaniu poprawnej strukturalnie odpowiedzi, a nie zarejestrowany timeout/brak dostępu modelu. Zachowano po jednym źródle READ, lecz brak odrzuconych szkiców, draft_versions i odpowiedzi supported/issues dla tych prób. Nie można wskazać konkretnego zakwestionowanego zdania ani rozstrzygnąć false/null. Obecny generator już zachowuje negatywny/niepewny wynik w NEEDS_REVIEW; odrębna bramka Gmail wymaga supported=true. Nie zmieniono dawnych ERROR, nie ponawiano wywołań modelu i nie odtwarzano utraconych szkiców.

Poza repo przygotowano roboczy przegląd dwóch istniejących wersji wiadomości, z ich dokładną niezmienioną treścią. Odczytano jednorazowo dwa znane publiczne URL przez istniejący PublicSourceReader, bez automatycznego researchu lub modelu: oba READ, oba zapisane kontakty nadal literalnie obecne, wszystkie dawne cytaty analizy obecne dokładnie (9/9 i 8/8). Jest to kontrola obecności cytatów, nie pełna weryfikacja semantyczna lub potwierdzenie wakatu/warunków. Publiczne źródła: [Codapi](https://www.codapi.pl/), [PRODAUT](https://www.prodaut.pl/). Kopie źródeł i przeglądu lokalne, 0600 w prywatnym katalogu 0700; historycznych źródeł SQLite nie zastępowano. Kontakty GENERAL pozostają NEEDS_REVIEW; aplikacja nie ma jeszcze jawnej operacji użytkownika do ich rozstrzygnięcia. Nie jest to gotowa zatwierdzona paczka MIME.

Rzeczywisty Gmail nie był odczytywany, wysyłany ani rekonfigurowany. Dotąd brak zapisanych kontroli historii firm; nie zakładamy pustej skrzynki. Sender/research pozostają zatrzymane, 19 prób/rezerwacji i pusta aktywna kolejka. Wszystkie tabele prywatnej SQLite porównano readonly po odczycie źródeł z prywatnym zestawem hashy początku tego etapu: bez zmian. Windows smoke niewykonany.

## Kontrola przed zleconym pushem — 9 października

Na nowe wyraźne polecenie użytkownika przygotowano publikację wszystkich aktualnych zmian kodu, testów i dokumentacji. Pierwszy ponowny `npm run check`: 200/200 backend, 6/6 UI (27,6 s), typecheck/build PASS. Przegląd audytora wykrył, że kontrola leksykalnej ścieżki `--private --output` mogła dopuścić dowiązanie prowadzące do repo. Nowy syntetyczny test w całości tymczasowego repo najpierw FAIL (raport zapisany zamiast odrzucony), po użyciu fizycznej ścieżki rodzica PASS; objęto też przejście symlink/.. na bieżącym macOS. `node --import tsx --test tests/mime-inspection.test.ts`: 9/9 PASS.

Końcowy rzeczywiście uruchomiony **`npm run check`: 201/201 backend, 6/6 UI (26,2 s), typecheck/build PASS**. Testy używały syntetycznej poczty i katalogów tymczasowych; nie inicjowały rzeczywistej wysyłki, researchu lub odczytu prywatnej skrzynki. Windows smoke nadal niewykonany. Przegląd 91 plików repo (w tym nowych) nie znalazł znanych prywatnych adresów odbiorców/osobistego nadawcy, sprawdzanych wzorców rzeczywistych sekretów ani plików EML/CV/SQLite/kluczy. Dodano ignorowanie *.eml; prywatny runtime i źródła pozostają poza repo. `git diff --check` PASS; nie zmieniano konta, danych, liczników, zgód lub stanu sendera w przygotowaniu publikacji.

## Przełączenie bieżącego nadawcy na wybrane starsze konto

Na nową decyzję użytkownika zakończono istniejący OAuth i lokalnym normalnym API zsynchronizowano konto kampanii przez nowy niezatwierdzony SELF_TEST. From/To wskazują wybrane konto, pełny temat/plain/HTML/PDF/nazwa identyczne z referencją, hash/round-trip poprawne i Subject 48/52/29. Zero zatwierdzeń/send i zero odczytu wiadomości Gmail. Sender/research zatrzymane, schedule=false, kolejka pusta; nadal 19 prób/rezerwacji. Readonly porównanie wszystkich wierszy prób/ledger/outbox/szkiców/wersji/profilu/faktów/CV ze świeżym prywatnym snapshotem: bez zmian; integrity/foreign keys poprawne. Kod bez zmian, tylko konfiguracja/dokumentacja; `git diff --check` PASS, pełnego check nie powtarzano (ostatnie wcześniejsze 200 backend / 6 UI). Starsze konto pozostaje bieżącym nadawcą do nowej decyzji użytkownika.

## Wynik odbiorców serii 9 października

Użytkownik zgłosił **5/5 Odebrane starszego konta i 3/3 Spam projektu**. Na wspólnych mail2/mail4/mail5 każda para ma starsze Odebrane/projekt Spam przy tej samej aplikacji, transportowaniu Gmail API i dokładnie zgodnych pełnych częściach generowanych przed API/PDF. Wszystkie osiem pozostaje SENT_CONFIRMED. Foldery zapisano jako relację użytkownika, bez odczytu skrzynek odbiorców lub udawania weryfikacji nowych EML. Mocniejsza hipoteza czynnika związanego z nadawcą; sam wiek, reputacja i historia starszego konta nierozdzielone, kolejność starsze→projekt stała. Nie stwierdzono naprawy Spamu ani nowej usterki MIME.

Tylko dokumentacja i nowy prywatny raport odbiorców poza repo; SQLite readonly potwierdza 19 dawnych prób/rezerwacji, sender/research zatrzymane, brak kolejki, konto projektu aktywne. Zero nowych operacji Gmail/send. `git diff --check` PASS; pełnego check nie powtarzano, poprzednie 200 backend / 6 UI pozostają wcześniejszym wynikiem. Następny krok może wykorzystać istniejącą parę EML, bez nowej wysyłki. [Szczegóły](GMAIL_DELIVERABILITY_AUDIT.md).

## 9 października: pięć prób starszego nadawcy i trzy konta projektu

Na wyraźną listę i zlecenie użytkownika wysłano **8 wiadomości, wszystkie SENT_CONFIRMED**: starszy nadawca mail1–mail5 (10:37:43 oraz 10:40:41–48 Europe/Warsaw), konto projektu mail2/mail4/mail5 (10:43:41–47). Projekt mail1/mail3 pominięto na podstawie dawnych prób. Brak historii ręcznej projektu z mail2/mail4/mail5 potwierdził użytkownik; nie przeszukiwano całych skrzynek. Starsza historia odbiorców niezweryfikowana.

Każda próba użyła normalnego SELF_TEST, świeżego podglądu/hasha i jednej zgody; dokładne zapisane bajty zgodne z zatwierdzeniem, właściwy nadawca/adresat, ten sam temat/plain/HTML/PDF/nazwa jak referencja. Subject 48/52/29 i round-trip poprawne, brak Cc/Bcc/Reply-To. Początkowo martwy backend zatrzymał pracę przed send; uruchomiono istniejącą wersję bez nowych migracji. Pomocniczy odczyt pierwszego mail1 trafił na równoległe SENT_CONFIRMED (INVALID_STATE); wynik potwierdzono readonly i kontynuowano od mail2, bez ponowienia pierwszego send. Potem OAuth przełączono na konto projektu i wykonano trzy osobne podglądy/wysyłki.

`node --check` prywatnego skryptu PASS; dwa `npm run --silent audit:eml --` z prywatnym `--output` (referencja + pięć A / wszystkie osiem A) PASS, pełne części dokładnie zgodne. `git diff --check` PASS. Kod produktu bez nowych zmian; pełnego check nie powtarzano (poprzednio 200 backend / 6 UI). Readonly porównanie ze snapshotem potwierdziło wszystkie wcześniejsze wiersze prób/ledger/outbox/szkiców/wersji/profilu/faktów/CV bez zmian, SQLite integralne. Teraz 19 prób/rezerwacji, dzisiaj 8/10, kampania 19/50; bez resetu. Konto projektu przywrócone, sender/research zatrzymane, schedule=false, killSwitch=false, kolejka pusta. Osiem rzeczywistych send i celowane potwierdzenia Wysłanych; foldery były w tym etapie jeszcze nieznane, później użytkownik zgłosił 5/5 Odebrane starszego konta i 3/3 Spam projektu — wynik powyżej. [Szczegóły](GMAIL_DELIVERABILITY_AUDIT.md).

## Wynik Gmail 21:50: Spam; przerwa na prośbę użytkownika

Dostarczone Wysłane/odbiorca jednoznacznie odpowiadają próbie nr 11 (końcowy RFC ID/konto/adresat). Użytkownik zgłosił Spam; EML nie zawiera etykiety folderu. A/B całe zakodowane body i części identyczne, Subject 48/52/29; Date +86 s i RFC ID zmienione. C ma Subject 84/32, siedem spacji→CRLF i końcowy CRLF w plain, końcowy CRLF w HTML; PDF bajtowo identyczny. Dokładne i CRLF→LF porównanie B/C false, bez ukrywania białych znaków. C raportuje SPF/DKIM/DMARC/ARC PASS i zgodny body hash relaxed (bez pełnej weryfikacji podpisu/DNS). Pełne części i nazwa PDF tej kopii ze Spamu są dokładnie identyczne z pozytywną kopią WP. Nie wykazano przyczyny Spamu ani koniecznego wieku konta.

Nowy lokalny CLI A/B/C z prywatnym `--output` PASS, niezależne Python/email/difflib i inspection.ts; `git diff --check` PASS. Tylko dokumentacja zmieniona, pełnego check nie powtarzano (poprzednio 200 backend / 6 UI PASS). SQLite readonly; zero nowych operacji Gmail i wysyłek. Sender/research zatrzymane, kolejka pusta, schedule=false, killSwitch=false bez zmiany; 11 prób/rezerwacji zachowane. Dalsze próby wstrzymane na prośbę użytkownika, bez automatycznego wznowienia. [Szczegóły](GMAIL_DELIVERABILITY_AUDIT.md).

## Nowo zlecony reset dzienny i pojedynczy test Gmail — 21:50

Na wyraźne polecenie użytkownika dodano ręczny reset bieżącego wykorzystania dziennego przez baseline w istniejącym app_state, zamiast usuwania usage_ledger/prób. Endpoint wymaga lokalnej sesji/CSRF, potwierdzenia, pauzy, bieżącego dnia/licznika i braku oczekujących lub niepewnych prób. Nie zmienia limitu 10/3/50, nie zeruje historii ani limitu kampanii, nie uruchamia sendera i nie czyści kill switcha. Dzień/kampania baseline są sprawdzane; stan zachowuje zgodność ze starymi rekordami.

Rzeczywiste testy: pierwszy `node --import tsx --test tests/gmail-delivery.test.ts` 52/53 (błędna nowa asercja FAILED_NOT_SENT zamiast istniejącego BLOCKED przy limicie kampanii); poprawiono asercję. Pełny **`npm run check`: 200/200 backend, 6/6 UI (27,6 s), typecheck/build PASS**. Nowe regresje zachowania historii i blokad, nieaktualnego dnia/licznika, brak resetu przy aktywnych/niepewnych próbach, nowa zatwierdzona wysyłka po resecie, zachowany limit kampanii, nieprawidłowy baseline i brak endpointu w DEMO/RESEARCH_ONLY. Mock Gmail, syntetyczne dane, katalogi tymczasowe. `git diff --check` PASS; Windows nadal nieprzetestowany.

Po prywatnym snapshotcie i sprawdzeniu braku nowych migracji zrestartowano lokalny backend APPROVAL_REQUIRED. Reset normalnym API: 10→0 bieżącego wykorzystania, historyczne rekordy zachowane. Świeży podgląd miał ten sam temat/pełny tekst/HTML/PDF/nazwę co test WP, Subject 48/52/29 i zgodny hash. **Jedna próba na nowo wskazany adres Gmail o 21:50:51.859 Europe/Warsaw; SENT_CONFIRMED o 21:50:53.444**, Gmail id/thread id obecne, dokładnie zatwierdzony bufor. Bez retry. Sender ponownie zatrzymany, brak aktywnej kolejki/researchu, killSwitch=false. Teraz 11 historycznych prób/rezerwacji, po resecie 1/10 dziennie i 11/50 w kampanii. Dawne wiersze prób/ledger/outbox oraz szkice/wersje/profil/fakty/CV porównano ze snapshotem: bez zmian; SQLite integralne. Pomocniczy końcowy odczyt raportowy skorygowano z nieistniejącej confirmed_at na aktualny schemat, bez powtarzania send. W tym etapie folder odbiorcy był nieznany; później użytkownik zgłosił Spam i dostarczył oba EML — wynik oraz przerwa opisane powyżej. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Wynik kompletnej pary WP — aplikacja 20:41, ręcznie 20:45

Przeanalizowano cztery dostarczone EML Wysłanych/odbiorców, zachowany frozen A aplikacji i lokalną historię readonly. Użytkownik zgłosił **Odebrane od razu dla obu pierwszych kontaktów**; obie kopie odbiorców mają **X-WP-SPAM NO** oraz DKIM good według WP. Mail2 odpowiada jednoznacznie próbie nr 10; jego kopia Wysłanych jest identyczna z wcześniej celowo odczytanym RAW. Mail1 to ręczna wiadomość z 20:45:14 Europe/Warsaw. W obu parach RFC ID, adresy i rzeczywisty Date zachowane; po rozpoznaniu adresów Delivered-To odpowiada To.

Pełne zdekodowane plain, HTML i PDF wraz z nazwą są dokładnie identyczne **między obiema kopiami odbiorców**, bez normalizacji. Ręczna para Wysłane→odbiorca również dokładnie zgodna. Aplikacja A→Wysłane ma dokładnie identyczny zakodowany body i części. Na odcinku aplikacyjne Wysłane→odbiorca plain ma siedem spacji zastąpionych podziałem wiersza i jeden końcowy CRLF, HTML dostał końcowy CRLF; PDF identyczny. Zgodność dokładna oraz po wyłącznie CRLF→LF pozostaje false dla tej pary. Subject Q 48/52/29 w aplikacyjnym A/B, B 84/32 w obu odbiorczych i ręcznym B. Sam fragment 84 nie rozróżnia folderów; poprawnego generatora nie zmieniono.

DKIM body hashes relaxed zgodne; pełnego podpisu/DNS nie weryfikowano. WP nie podaje osobnych SPF/DMARC ani Authentication-Results. Oznaczenie (U9) występuje także przy NO, więc samo nie oznacza Spamu; jego znaczenie nieustalone. Podstawowe nagłówki pojedyncze, brak Cc/Bcc/Reply-To i samotnych CR/LF, base64url round-trip poprawny. Tolerancyjny parser nie zastępuje pełnej walidacji RFC.

Nowe komendy: trzy wywołania `npm run --silent audit:eml --` z prywatnymi lokalnymi ścieżkami i `--output` poza repo (ręczne B→C, aplikacja A→B→C, C ręczne→C aplikacyjne): **3/3 PASS**; niezależna analiza Python/email/difflib i inspection.ts, `git diff --check` PASS. Raporty 0600, katalog 0700; adresy i oryginały poza repo. Zmieniono wyłącznie dokumentację, więc pełnego check nie powtarzano: 197 backend / 6 UI to poprzednie uruchomienie. Windows, pełny DKIM/DNS, reguły WP i odbiorcza para Gmail nadal nieprzetestowane. **Zero nowych operacji Gmail i wysyłek w analizie wyników**; nadal 10 prób/rezerwacji, sender paused=true, brak aktywnych wysyłek, killSwitch=false bez zmiany. Wynik pokazuje udany pierwszy kontakt aplikacji na WP, bez dowodu ogólnej naprawy Spamu. Szczegóły i kolejny plan: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Nowa, osobno zlecona próba WP — 20:41 Europe/Warsaw

Po zakończeniu audytu offline użytkownik wyraźnie polecił jedną wysyłkę aplikacji na mail2 i przygotowanie wzoru na mail1. Użyto istniejącego backendu APPROVAL_REQUIRED: SELF_TEST z zatwierdzonym CV, dokładnie porównaną wersją tematu/body, nowym podglądem i kontrolą hasha. Jedno zatwierdzenie, **jedna próba**, **SENT_CONFIRMED** o 20:41:08.955; Gmail id/thread id obecne. Wysłany bufor identyczny z podglądem. Łącznie **10 prób i 10 rezerwacji**, wcześniejsze dziewięć zachowane, limit dzienny nadal 10. Sender ponownie paused=true, schedule_enabled=false, killSwitch=false bez zmiany. Nie uruchamiano researchu, migracji ani kolejnej wysyłki.

Zgoda obejmowała tę próbę i potwierdzenie w Wysłanych. Zachowano poza repo nowy zamrożony MIME i jednorazowo odczytany RAW dokładnie znanego Gmail id (bez listowania skrzynki). A/B: cały zakodowany body i wszystkie zdekodowane części/PDF identyczne, Subject 48/52/29; Google zmienił RFC ID i Date z 20:39:37 na 20:41:08 (+91 s), dodano Received. Wzór ręczny i identyczny PDF pod taką samą nazwą udostępniono w prywatnym pliku poza repo. W wyniku tego etapu wykonano rzeczywistą wysyłkę i celowane odczyty Gmaila; wcześniejszy audyt offline miał zero takich operacji.

W tym etapie foldery WP i wariant ręczny były jeszcze nieznane; później użytkownik dostarczył cztery EML i zgłosił Odebrane obu wiadomości — wynik powyżej. SENT_CONFIRMED nie oznacza Odebranych. Sprawdzono stan runtime i bufory oraz `git diff --check` PASS; kod bez zmian, pełnego npm check nie powtarzano. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Ręczna para Wysłane/odbiorca — 13:49:39 Europe/Warsaw

Właściwy najnowszy EML odbiorcy (90026 bajtów) powiązano z ręczną kopią Wysłanych (83499 bajtów) po identycznych RFC Message-ID, From, To, Date i Subject. Pełne zdekodowane plain (787), HTML (872) i PDF (58698 bajtów) wraz z nazwą załącznika są identyczne bez normalizacji. Zmieniły się granice MIME i dodano nagłówki transportu/odbiorcy; Date i RFC ID zachowano. Subject jest surowo identyczny, encoded-words 84/32 występują po obu stronach. Authentication-Results odbiorcy raportuje SPF/DKIM/DMARC/ARC PASS, DKIM body hash zgodny; pełnego podpisu/DNS nie weryfikowano.

Ręczna wiadomość oraz próba aplikacji nr 4 mają również identyczne pełne teksty i bajty PDF u odbiorcy, ale różne nazwy PDF. Wyniki Odebrane/Spam nadal pochodzą z wcześniejszej relacji użytkownika, ponieważ EML nie mają etykiet. Sam fragment 84 nie odróżnia zgłoszonych folderów. Para ręczna jest kompletna; nie wykazano przyczyny Spamu. Następny rekomendowany eksperyment to odrębne pierwsze kontakty ręczne/aplikacji na uzgodnionych skrzynkach bez historii, wyłącznie jako plan.

Nowe sprawdzenia: porównanie Pythonem i inspection.ts, `npm run --silent audit:eml --` z lokalnymi kopiami i prywatnym `--output` poza repo PASS; `git diff --check` PASS. Tylko dokumentacja zmieniona, pełnego check nie powtarzano; wcześniejsze 197 backend/6 UI pozostaje wynikiem poprzedniego uruchomienia. Zero rzeczywistych operacji Gmail i nowych wysyłek. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Nowy EML odbiorcy — próba aplikacji nr 4, 13:53:46 Europe/Warsaw

Końcowy RFC Message-ID tego EML jednoznacznie odpowiada próbie aplikacji nr 4 w lokalnej historii readonly. To osobna wiadomość od ręcznej kopii Wysłanych z 13:49:39. EML ma encoded-words Subject 84/32; pełny text/plain, text/html oraz bajty PDF są dokładnie zgodne z ręczną kopią Wysłanych, lecz nazwa PDF różni się. Według wcześniejszej relacji użytkownika próba 4 trafiła do Odebranych po ręcznej wiadomości; brak etykiet folderu w EML. Samo przekroczenie długości zakodowanego fragmentu tematu nie rozróżnia więc zgłoszonych wyników Spam/Odebrane. Brakujący wówczas odbiorczy EML ręcznej wiadomości 13:49:39 później dostarczono i porównano — wynik na początku raportu.

Authentication-Results nowej kopii raportuje SPF/DKIM/DMARC/ARC PASS, body hash DKIM zgodny (bez pełnej weryfikacji podpisu). Lokalne porównanie Pythonem i inspection.ts oraz `git diff --check` PASS; zero operacji Gmail i wysyłek. Zmieniono wyłącznie dokumentację, pełnego check nie powtarzano. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Kopia odbiorcy próby nr 3 — Subject zmieniony po Wysłanych

Nowo dostarczony EML odbiorcy dotyczy tej samej wiadomości co ostatnio porównane Wysłane (końcowy RFC ID, nadawca, odbiorca i Date zgodne). A i B mają encoded-words UTF-8/Q 48/52/29, C ma UTF-8/B 84/32. Dla tej konkretnej próby przekroczenie RFC 2047 jest więc widoczne dopiero w źródle odbiorcy, nie w generatorze lub kopii Wysłanych. Dokładnego etapu wewnątrz transportu Google nie ustalono; wynik nie dowodzi przyczyny Spamu.

PDF jest bajtowo identyczny. Text/plain ma siedem spacji zastąpionych CRLF i jeden końcowy CRLF (778→787 bajtów), HTML dostał końcowy CRLF (870→872 bajtów). Pozostałe znaki niezmienione; zgodność dokładna i po CRLF→LF jest fałszywa, bez ukrywania różnic przez usuwanie białych znaków. Granice multipart zmienione, topologia zachowana. C raportuje SPF/DKIM/DMARC/ARC PASS, DKIM body hash zgodny; pełnego podpisu nie weryfikowano. EML nie ma etykiety folderu — wynik Spam pochodzi z kontekstu dostarczenia i historii odbiorcy.

Lokalna analiza Pythonem/inspection.ts, SQLite readonly, `git diff --check` PASS. Bez zmian kodu/runtime oraz bez ponawiania pełnego check po samej analizie. Zero operacji Gmail i wysyłek. Następny plik: ręczny mail do tego samego odbiorcy pobrany z Odebranych. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Nowy EML Wysłanych — próba nr 3, 13:31:27 Europe/Warsaw

Nowo dostarczony plik ma tę samą nazwę co poprzedni EML pierwszego odbiorcy, lecz inne bajty/identyfikator i odpowiada próbie nr 3. Powiązano go zapisanym końcowym RFC Message-ID. Porównanie z zachowanym zamrożonym MIME: dokładnie identyczny zakodowany body oraz pełne text/plain, text/html i PDF, bez normalizacji. Hash frozen i PDF zgodne z próbą. Subject 48/52/29 identyczny przed API i w Wysłanych, bez przekroczenia RFC 2047. Jedynie Received dodano, Message-ID przepisano, a Date przesunięto o 2 s. Brak Cc/Bcc/Reply-To i duplikatów podstawowych nagłówków. Brak DKIM/Authentication-Results w tej kopii nie służy do oceny uwierzytelnienia u odbiorcy.

Wykonano lokalną analizę i odczyt SQLite readonly; zero operacji Gmail, bez zmian kodu/runtime. `git diff --check` PASS; pełnego check po samej analizie nie powtarzano. Następny potrzebny plik to ta sama wiadomość ze Spamu odbiorcy. Przyczyna Spamu i etap powstania Subject 84 pierwszej próby pozostają nieustalone. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Aktualny audyt offline dostarczalności i reconcile

Pełny `npm run check`: **197/197 backend, 6/6 UI, typecheck/build PASS**; `git diff --check` PASS. Testy korzystały wyłącznie z fikcyjnych skrzynek i katalogów tymczasowych. Zero rzeczywistych operacji Gmail i nowych wysyłek, brak zmian prywatnego runtime. Windows nadal nieprzetestowany. Szczegóły, polecenia i konkretne brakujące A/B/C/D: [GMAIL_DELIVERABILITY_AUDIT.md](GMAIL_DELIVERABILITY_AUDIT.md).

Potwierdzono historyczny encoded-word Subject 84 znaki w odebranym EML Gmaila, limit RFC 2047 wynosi 75. Aktualny generator i cztery zachowane późniejsze MIME mają dla tego tematu 48/52/29; pierwotny MIME usunięto wcześniej. Nie wykazano błędu przed API ani przyczyny Spamu. Starsze określenia „poprawny MIME” w tym raporcie oznaczały kontrole opisane na danym etapie, nie pełną zgodność RFC. WP A↔C ma identyczne zdekodowane bajty tekstu, lecz Date przesunięte o 31 s oraz zmieniony RFC ID. Oba body hashes DKIM zgodne, bez pełnej weryfikacji podpisów.

Odtworzono lukę utraconej odpowiedzi send + zmienionego RFC ID (nowy test najpierw FAIL). Dodano ograniczony, paginowany odczyt pełnych RAW kandydatów z właściwego konta/adresata/okna czasu; podobieństwo, nawet pełne i pojedyncze, pozostawia SEND_UNKNOWN. Znany Gmail id zachowuje ścieżkę potwierdzania. Zgody, brak retry, pauza/kill switch i limity nadal obowiązują. Dodano audytor CLI offline bez sieci, bez zmiany generatora MIME, OAuth lub migracji. Lokalny odczyt bazy readonly potwierdził dziewięć SENT_CONFIRMED/rezerwacji i sender paused; bez ponownej weryfikacji skrzynki.

## Kontrola przed publikacją aktualnego projektu na GitHubie

Na wyraźne zlecenie użytkownika przygotowano publikację wszystkich aktualnych zmian kodu, migracji, testów i dokumentacji. Ponowny `npm run check` zakończył się powodzeniem: typecheck/build PASS, **157/157 testów backendu i 6/6 scenariuszy UI**. Testy używały fikcyjnej poczty i katalogów tymczasowych; nie wykonywały rzeczywistych wysyłek. Windows pozostaje nieprzetestowany.

Przegląd 86 plików przeznaczonych do repo nie znalazł prywatnych kategorii plików ani dopasowań sprawdzanych wzorców sekretów, usuniętego adresu osobistego lub adresów testowych odbiorców. Dane runtime, tokeny OAuth, CV, SQLite i źródłowe EML pozostają lokalnie poza repo. Ujednolicono bieżący opis E3/E4 w README, wizji i planie; starsze wyniki raportu są historią kolejnych etapów, nie deklaracją bieżącego braku Gmaila. `git diff --check` PASS. Publikacja kodu nie uruchamia researchu ani sendera.

## Krótki test bez CV na WP — pierwszy trafił do Spamu

Użytkownik zlecił dalsze testy i wskazał adres WP. Dodano wyłącznie wariant diagnostyczny SELF_TEST: stały krótki temat/tekst z zatwierdzoną nazwą nadawcy, bez CV i linków. Podgląd jawnie pokazuje brak załącznika. Tryb jest zapisany w migracji 008, objęty hashem podglądu i niedostępny dla FIRST_CONTACT. Standardowe maile i generator bez zmian; zatwierdzenie materiałów, dokładnego MIME, limity oraz SEND_UNKNOWN nadal obowiązują. Krótki test nie zalicza sprawdzenia wysyłki CV przed kontaktem z firmami.

Pierwszy `npm run check`: typecheck/build PASS, **156/156 backend i 6/6 UI**. Kontrole obejmują brak PDF/linków i zachowanie zamrożonych bajtów, zgodę przed send, wykorzystanie limitu, brak kontaktu z firmą lub zmiany szkicu, zakaz wariantu diagnostycznego dla FIRST_CONTACT, unieważnienie podglądu po zmianie wariantu i brak ponowienia po timeout. UI sprawdza podgląd bez CV oraz obowiązkowe zaznaczenie zgody. Testy korzystają z fikcyjnych kont i katalogów tymczasowych.

Przed restartem potwierdzono siedem SENT_CONFIRMED, brak kolejki i aktywnego researchu; utrwalono hashe materiałów i szkiców wyłącznie w prywatnym runtime. Na dokładny wskazany adres przygotowano normalnym API podgląd z nadawcą będącym wyłącznie kontem projektu. Niezależny parser potwierdził jednego nadawcę/odbiorcę, poprawny MIME, dokładny tekst, brak załączników, linków i PDF. Zatwierdzono jedną nową próbę zwykłą ścieżką: SENT_CONFIRMED, jedna nowa rezerwacja, łącznie osiem prób i osiem rezerwacji. Zapisane bajty i hash zgodne z podglądem, cv_hash próby null; profil/fakty/projekty/CV/szkice/wersje bez zmian. SQLite integrity_check i foreign_key_check poprawne. Po próbie sender paused.

Użytkownik zgłosił Spam pierwszego krótkiego testu WP. Wynik pokazuje, że problem występuje również bez CV i linków; nie dowodzi przyczyny dotyczącej wyłącznie wieku konta. Następna próba w ramach tego samego zlecenia ma zachować temat/treść/odbiorcę, ale pominąć HTML. Dodano opcję textOnly wyłącznie dla diagnostyki; nie zmieniono formatu standardowych maili ani limitów. Wynik kolejnej próby musi uwzględniać wpływ historii odbiorcy.

## Drugi test WP — sam tekst, również Spam

Po zgłoszeniu Spamu pierwszej próby kontynuowano zlecony przez użytkownika test. Wariant `textOnly: true` jest dozwolony wyłącznie razem z diagnostyką SELF_TEST. Zachowano konto projektu, dokładny adres, temat i zdekodowaną treść pierwszej próby; usunięto część HTML. Niezależny parser potwierdził pojedynczą część text/plain, brak HTML/PDF/linków, poprawny MIME i hash. Druga próba przeszła świeży podgląd oraz zwykłe zatwierdzenie i ma SENT_CONFIRMED, jedną próbę i jedną rezerwację. Łącznie dziewięć prób i dziewięć rezerwacji. Materiały i szkice zgodne z hashami sprzed obu prób; SQLite poprawne, brak oczekujących/niepewnych send, sender paused. Użytkownik zgłosił Spam także drugiej wiadomości; wynik zapisano jako relację odbiorcy, odrębną od SENT_CONFIRMED. Nie wysyłano trzeciej wiadomości.

Oba krótkie testy WP trafiły do Spamu według użytkownika. Usunięcie HTML nie rozwiązało problemu w tej próbie; problem występuje także bez CV i linków. Nie ustalono konkretnej przyczyny ani wyłącznego wpływu wieku konta, transportu API czy treści. Następny krok to odczyt źródłowego EML drugiej wiadomości pobranego ze skrzynki WP: identyfikator, uwierzytelnienie, MIME i ewentualne nagłówki antyspamowe. Aplikacja nie zmieniała folderów ani reguł odbiorcy; jego wcześniejsze ustawienia nie zostały niezależnie sprawdzone. [Instrukcja WP zapisu EML](https://pomoc.wp.pl/otrzymuje-podejrzane-wiadomosci), [kontakt z pomocą WP](https://pomoc.wp.pl/kontakt-z-nami). Zgłoszenia do pomocy nie wysłano.

Końcowy `npm run check`: typecheck/build PASS, **157/157 backend i 6/6 UI**. Dodatkowy test sprawdza zakaz textOnly poza diagnostyką, zgodną treść/temat wariantów i wysłanie dokładnych zamrożonych bajtów. Wcześniejsze testy CV i SEND_UNKNOWN nadal przechodzą. Wariant jest kontrolą formatu; drugiej próby na tym samym adresie nie można traktować jako niezależnej od historii odbiorcy.

## EML drugiego testu WP — poprawny DKIM, oznaczenie Spam

Użytkownik dostarczył źródło wiadomości odebranej przez WP. RFC Message-ID jest zgodny z identyfikatorem zaobserwowanym w reconcile drugiej próby. Nadawca, odbiorca, temat i zdekodowany tekst odpowiadają dokładnie tej próbie po normalizacji CRLF; hash zamrożonego MIME poprawny. Pojedyncza część text/plain, bez HTML i załączników; parser nie wykrył błędów. Received wskazuje przyjęcie przez mx.wp.pl od serwera Google przez TLS 8 października o 17:31:58 Europe/Warsaw.

WP dodało `X-WP-DKIM-Status: good (id: gmail.com)` i `X-WP-SPAM: YES (U9)`. To wynik poprawnej weryfikacji DKIM według odbiorcy oraz bezpośrednie potwierdzenie oznaczenia Spam. Plik nie zawiera osobnych wyników SPF/DMARC odbiorcy; nie deklarujemy ich zaliczenia na podstawie wcześniejszych EML Gmaila. W sprawdzonej oficjalnej pomocy WP nie znaleziono wyjaśnienia kodu U9; nie przypisano go reputacji konta, konkretnej regule ani transportowi API. Received ujawnia kanał gmailapi/HTTPREST, ale nie dowodzi, że to przyczyna klasyfikacji.

Wynik i odcisk źródła zapisano tylko w prywatnym runtime. Zatwierdzone materiały, generator, format wysyłki, limity i stany outbox bez zmian; nadal dziewięć prób i dziewięć rezerwacji, sender paused. Nie wysłano kolejnego maila. Przed wyborem następnej próby potrzebne sprawdzenie listy Zablokowani i reguł odbiorcy, bez zmiany ustawień. WP opisuje możliwość kierowania poczty do Spamu przez te ustawienia. [Reguły WP](https://pomoc.wp.pl/jak-skonfigurowac-reguly). W razie braku reguły dalsza diagnoza może obejmować kontrolowaną ręczną wysyłkę z tego samego konta lub zgłoszenie z oryginalnym EML do pomocy technicznej WP; żadnego zgłoszenia nie wysłano. [Pomoc w odbiorze i kontakt techniczny WP](https://pomoc.wp.pl/dlaczego-nie-otrzymuje-wiadomosci).

## Weryfikacja zewnętrznego audytu EML

Użytkownik dostarczył skrypt audytu i JSON wyników dla pierwszego maila z CV odebranego przez Gmail oraz drugiego krótkiego testu WP. Po przeczytaniu skryptu odtworzono audyt lokalnie na tych plikach, bez sieci, zapisywania kopii raportu lub wysyłki. Oba wyniki są dokładnie zgodne z dostarczonym JSON. Skrypt i pełny raport pozostają poza repo, ponieważ raport zawiera prywatne adresy z wcześniejszych prób.

Nowa obserwacja: w odebranym pierwszym EML pojedynczy encoded-word w Subject ma 84 znaki, drugi 32. Pierwszy przekracza limit 75 znaków z [RFC 2047 §2](https://www.rfc-editor.org/rfc/rfc2047.html#section-2). Wcześniejszy brak błędów zgłoszonych przez parser nie oznaczał pełnej walidacji RFC. Nie ustalono, na którym etapie powstał taki nagłówek; zamrożony MIME pierwszej próby został wcześniej usunięty na prośbę użytkownika i nie może służyć do porównania przed/po.

Sprawdzono zachowany zamrożony MIME późniejszej próby z tym samym tematem oraz wykonano nową próbę offline przez obecny prepareMime na fikcyjnych adresach, bez CV i bez transportu Gmail. Oba mają encoded-words długości 48, 52 i 29, mieszczące się w limicie. Temat odebranego krótkiego maila WP ma encoded-word długości 39 i mimo tego X-WP-SPAM YES (U9). Przekroczenie w pierwszym EML nie wyjaśnia więc wszystkich wyników Spamu ani nie wykazuje aktualnego błędu generatora.

Audyt potwierdza brak samotnych LF/CR i zgodność hashy kanonizowanego body z bh= DKIM w obu plikach. To porównanie body, nie pełna kryptograficzna weryfikacja podpisu i DNS; sam skrypt zaznacza to ograniczenie. Znaczenie U9, przyczyna klasyfikacji oraz wpływ konta/API pozostają nieustalone. Kod aplikacji i kontrola wysyłek bez zmian; nie wysłano nowego maila i nie uruchamiano ponownie pełnego npm run check po samej analizie dokumentacji. Ostatni pełny wynik pozostaje 157 backend / 6 UI PASS.

## Usunięcie konta osobistego z projektu

Na wyraźną prośbę użytkownika usunięto tymczasowe konto osobiste z Test users istniejącego projektu Google Cloud. UI potwierdziło jednego aktywnego testera: konto projektu. Na koncie osobistym cofnięto wszystkie połączenia z JobHunterem; wyszukanie nazwy aplikacji w połączonych aplikacjach Google zwróciło brak wyników. Pomoc techniczna i kontakt dewelopera OAuth korzystają wyłącznie z konta projektu. Systemowy magazyn haseł zawiera wyłącznie właściwe konto projektu z send/readonly; sekretów nie wypisywano.

Przed czyszczeniem lokalnego runtime potwierdzono brak aktywnego researchu i siedem terminalnych SENT_CONFIRMED, a backend zatrzymano zwykłą ścieżką. W prywatnej bazie usunięto adres konta osobistego: zastąpiono go neutralnym znacznikiem w archiwalnych polach, wyczyszczono MIME trzech prób i czterech podglądów oraz identyfikatory Google dotyczące tymczasowego nadawcy. Oryginalne hashe pozostały historycznymi odciskami usuniętych MIME, a nie deklaracją zgodności pustych danych. Archiwalne stany są terminalne, wszystkie zgody cofnięte i podglądy dotyczące usuniętych danych wygaszone; nie wolno ich ponawiać. Metadane wskazują jawnie usunięcie danych osobistych. Kampania używa konta projektu, polityka zaktualizowana, sender paused.

Zachowano siedem prób i siedem rezerwacji limitu. Hashe tabel profilu, faktów, projektów, CV, szkiców, wersji, outbox i usage_ledger zgodne przed/po. SQLite integrity_check i foreign_key_check poprawne; secure_delete, VACUUM i checkpoint usunęły adres z bieżących plików SQLite/WAL. Usunięto pięć prywatnych plików pomocniczych i EML dotyczących tego konta; skan całego katalogu danych JobHuntera nie znalazł adresu. Backend uruchomiono ponownie w APPROVAL_REQUIRED. Nie wysłano nowej wiadomości ani nie zmieniono generatora. Nie usuwano konta Google, korespondencji w skrzynkach odbiorców, źródłowych plików użytkownika w Pobranych ani historii czatu.

## Zanonimizowany wynik porównania nadawcy

Jednorazowy, wcześniej zlecony test porównawczy był SENT_CONFIRMED i według użytkownika trafił do Odebranych przy identycznej aplikacji/API, treści, HTML, CV i odbiorcy, ale innym nadawcy bez wcześniejszej korespondencji z tym odbiorcą. Wynik wzmacnia hipotezę wpływu konta/kontekstu nadawcy, bez ustalonej dokładnej przyczyny spamu ani gwarancji przyszłych dostaw. Dane osobiste tego testu usunięto zgodnie z opisem powyżej; konto nie uczestniczy w dalszym projekcie. AUTO_POLICY nadal zablokowany.

## Informacja o historii konta nadawcy

Użytkownik potwierdził, że konto Gmail nadawcy zostało utworzone do tego projektu i służyło dotąd tylko do testów wysyłanych przez aplikację oraz poleconych ręcznych prób. To informacja diagnostyczna od użytkownika, bez zmiany lub zatwierdzenia profilu kandydata. Wzmacnia hipotezę wpływu historii konta/kontekstu korespondencji, lecz nie dowodzi przyczyny spamu ani winy API. Świeże konto w gmail.com nie jest nową domeną ani własnym nowym IP; nie utożsamiano tych pojęć z publicznymi zaleceniami Google dotyczącymi reputacji domen/IP.

Dalsza diagnoza ma korzystać wyłącznie z konta projektu. Możliwy osobno zlecony test to krótka wiadomość bez CV i linków na kontrolowany adres bez wcześniejszej korespondencji; wynik wymaga sprawdzenia przez odbiorcę. Nie podłączamy ponownie konta osobistego. Brak potwierdzonego progu dni lub liczby maili, po którym to nowe konto miałoby trafiać do Odebranych. Nie zaproponowano fikcyjnego ruchu ani automatycznego powtarzania wiadomości. Google zaleca stopniowe zwiększanie wolumenu i obserwowanie wyników dostawy; to ogólne zalecenie, bez gwarancji dla tego konta. [Wskazówki Google dla nadawców](https://support.google.com/mail/answer/81126?hl=en).

## Para wiadomości bez ręcznej wysyłki pomiędzy

Użytkownik podał kolejny adres do wcześniej zaproponowanego testu dwóch jednakowych wiadomości z aplikacji. Przyjęto minimum pięć minut odstępu, a odbiorca ma pozostawić obie wiadomości nieotwarte do końca oraz nie zmieniać filtrów/kontaktów. Wysłano 8 października o 14:05:15 i 14:10:33 Europe/Warsaw: oba etapy SENT_CONFIRMED, po jednej próbie i jednej rezerwacji. Rzeczywisty odstęp wyniósł 5 min 18 s. Porównanie MIME potwierdziło identyczne bajty tekstu, HTML i PDF oraz ten sam nadawcę, odbiorcę i temat. Profil, fakty, CV, szkice i wersje bez zmian; łącznie sześć prób aplikacji. Obie operacje przeszły przez świeży podgląd i normalne API zatwierdzenia; nie powtórzono wcześniejszej próby. Stan i adres są wyłącznie w prywatnym runtime. Użytkownik zgłosił, że obie wiadomości trafiły do Spamu. Nie sprawdzono niezależnie wcześniejszej korespondencji ani braku interakcji odbiorcy; tych założeń nie traktowano jako potwierdzonych faktów. Nie zmieniono kodu generatora ani transportu.

Wynik tej pary nie wspiera zasady „drugi mail działa”. Użytkownik zapytał o udział AI. Kontrola kodu wykazała: model proponuje treść, zwykły backend składa MIME, a GmailMailProvider wysyła jedno żądanie messages.send z polem raw. Nie dodaje pola lub nagłówka oznaczającego autorstwo AI. Nie jest to dowód, że Gmail nie rozpoznaje kanału API/aplikacji ani że treść nie wpływa na filtr. Wcześniejsze ręczne wysyłki tej samej treści AI trafiały do Odebranych, więc samo autorstwo tekstu nie wyjaśnia obserwowanej różnicy. Kanał wysyłki, kontekst nadawcy/odbiorcy i ocena treści pozostają hipotezami, bez wskazania jednej przyczyny. [Oficjalna wysyłka Gmail API](https://developers.google.com/workspace/gmail/api/guides/sending), [sygnały filtrów Gmail](https://workspace.google.com/blog/identity-and-security/an-overview-of-gmails-spam-filters).

Ewentualny następny eksperyment powinien oddzielić kanał od treści: krótka neutralna wiadomość bez CV i linków wysłana tą samą ścieżką API na uzgodniony kontrolowany adres, z dokładnym podglądem i nowym zleceniem. Opis eksperymentu nie zatwierdza dodatkowego maila ani zmiany generatora rekrutacyjnego. Nie dodano automatycznego powtarzania wiadomości, nie zmieniono SEND_UNKNOWN ani nie wysłano dodatkowych testów.

## Kolejny test na drugim adresie po ręcznej wiadomości

Użytkownik zgłosił, że ręczna wysyłka na drugi adres testowy trafiła do Odebranych, a następnie wyraźnie zlecił jeden kolejny test aplikacji na ten sam adres. Przygotowano i zatwierdzono świeży SELF_TEST przez normalne API. Czwarta próba aplikacji ma SENT_CONFIRMED, jedną próbę i jedną rezerwację. Porównanie zapisanych MIME potwierdziło identyczne text/plain, text/html, PDF, temat, nadawcę i odbiorcę jak w poprzednim teście na ten adres; hash prawidłowy. Nie ponowiono wcześniejszej próby ani nie zmieniono generatora lub transportu. Łącznie cztery próby aplikacji; użytkownik potwierdził Odebrane także dla czwartej próby.

Ta próba następuje po udanej ręcznej wiadomości. Na obu testowanych adresach zaobserwowano pierwszy mail aplikacji w Spamie, ręczną wiadomość w Odebranych i kolejny mail aplikacji w Odebranych. Nie jest to dowód zasady „druga wysyłka zawsze trafia do Odebranych”: liczba adresów wynosi dwa, a przed kolejnym testem aplikacji była ręczna korespondencja. Pierwszy adres miał również zmianę nazwy nadawcy/HTML. Wynik nie rozstrzyga wpływu numeru próby, ręcznej korespondencji, czasu i innych sygnałów Gmaila. Nie traktować go jako podstawy do automatycznego powtarzania maili do firm.

Proponowane dalsze porównanie wymaga świeżych, kontrolowanych adresów testowych bez wcześniejszej korespondencji i zmian filtrów/kontaktów: osobno pierwsza wiadomość aplikacji oraz ręczna wiadomość na drugim świeżym adresie; jeśli badany jest wpływ kolejnej próby, na pierwszym adresie nie wstawiać ręcznej wiadomości pomiędzy próbami aplikacji. Zmieniać jedną rzecz naraz i odnotować wynik, czas oraz nagłówki. To opis przyszłego eksperymentu, bez nowych odbiorców i bez zgody na wysyłkę. [Google o sygnałach i działaniach użytkownika](https://workspace.google.com/blog/identity-and-security/an-overview-of-gmails-spam-filters).

## Format maila po porównaniu ręcznych wysyłek

Po przygotowaniu korekty użytkownik zlecił wysłanie jednego dodatkowego testu na ten sam osobisty adres. Utworzono świeży podgląd SELF_TEST z identyczną treścią Codapi v4 i zatwierdzonym CV, sprawdzono nazwę nadawcy, HTML oraz hash MIME, a następnie zatwierdzono konkretny podgląd przez normalne API. Wynik SENT_CONFIRMED: jedna nowa próba i jedna rezerwacja, bez ponowienia; na tym etapie łącznie dwie wysyłki aplikacji. Profil, fakty, CV, szkice i wersje pozostały bez zmian. Użytkownik następnie potwierdził poprawny odbiór w Odebranych, pokazując wiadomość z tą etykietą. To pozytywny wynik jednej próby, bez ustalonej przyczyny wcześniejszego spamu ani gwarancji dla innych odbiorców.

Na kolejne wyraźne zlecenie użytkownika wysłano jedną taką samą wiadomość z CV na inny wskazany adres testowy. Adres zapisano wyłącznie w prywatnym runtime przez zwykłe API, co unieważniło starsze zgody/podglądy. Świeży podgląd zatwierdzono z dokładnym adresem, treścią, CV i hashem MIME. Trzeci test ma SENT_CONFIRMED, jedną próbę i jedną rezerwację, bez ponowienia. Łącznie trzy próby aplikacji; materiały, szkice i wersje bez zmian. Nie oznaczono firm jako skontaktowanych. Użytkownik zgłosił, że test na drugim adresie trafił do Spamu.

Ponownie odczytano SQLite w trybie read-only i porównano zamrożone MIME ostatnich dwóch prób: identyczne bajty text/plain, text/html i PDF, ten sam temat oraz nazwa/adres nadawcy. Hash każdego zapisanego MIME jest poprawny; parser nie wykrył błędów. Wynik po korekcie jest mieszany: Odebrane na pierwszym adresie, Spam na drugim. Nie potwierdza to rozwiązania dostarczalności ani przyczyny klasyfikacji. Przy pierwszym odczycie referencja do EML trzeciej próby nie była dostępna; po ponownym dostarczeniu plik odczytano i wynik znajduje się poniżej. Nie wysłano dodatkowego maila ani nie zmieniono generatora. Google opisuje wiele sygnałów klasyfikacji, w tym uwierzytelnienie i działania użytkownika; nie przypisano wyniku konkretnej reputacji ani transportowi. [Opis filtrów Gmaila](https://workspace.google.com/blog/identity-and-security/an-overview-of-gmails-spam-filters).

Ponownie dostarczony EML drugiego odbiorcy: Authentication-Results mx.google.com zawiera SPF/DKIM/DMARC/ARC PASS. RFC Message-ID jest zgodny z identyfikatorem zaobserwowanym podczas reconcile trzeciej próby; adresy, temat, treść i PDF odpowiadają dokładnie tej wysyłce. Parser nie wykrył błędów MIME, brak nagłówków podających przyczynę spamu. Zdekodowane text/plain i text/html mają identyczne hashe jak wcześniejszy ręczny EML, który na pierwszym adresie trafił do Odebranych. Nie ma podstaw do kolejnej korekty formatu na podstawie tych danych. Następny test diagnostyczny to ręczne porównanie na tym samym drugim adresie z identyczną treścią/PDF, przed zmianą filtrów/kontaktów. Sama zgodność uwierzytelnienia nie rozstrzyga klasyfikacji. [Uwierzytelnienie a klasyfikacja Gmail](https://support.google.com/mail/answer/180707?hl=en&co=GENIE.Platform%3DDesktop).

Użytkownik dostarczył trzeci EML i potwierdził kolejną ręczną dostawę do Odebranych. Treść po pominięciu białych znaków, temat i adresy są zgodne z pierwszym testem JobHuntera. PDF ma identyczne bajty i SHA-256 jak zatwierdzone CV; zmieniła się jedynie nazwa pobranego pliku z dopiskiem (1). SPF/DKIM/DMARC/ARC PASS. To potwierdza, że ta treść z tym PDF może trafić do Odebranych; nie ujawnia przyczyny pierwszej klasyfikacji jako spam. Ręczne wysyłki mają nazwę nadawcy i HTML obok tekstu, których brakowało w aplikacji.

Dodano nazwę nadawcy z zatwierdzonego profilu i prostą alternatywę HTML tej samej treści w podglądach przygotowania i wysyłki. HTML powstaje przez escapowanie tekstu, zachowuje podziały wierszy i jawne linki HTTPS; nie przyjmuje surowego HTML, obrazów ani śledzenia. Nie zmieniono generatora, zaakceptowanej treści, CV, transportu i mechanizmu SEND_UNKNOWN. Nazwa/HTML są częścią zamrożonego MIME i jego hasha. [Pola wiadomości Nodemailer](https://nodemailer.com/message), [adres z nazwą nadawcy](https://nodemailer.com/message/addresses).

`npm run check`: typecheck/build PASS, **153/153 backend i 6/6 UI**. Test nowego MIME sprawdza nazwę z polskimi znakami, pojedynczą tożsamość, identyczną treść tekstową/HTML, escapowanie tagów, bezpieczne linki i blokadę wstrzyknięcia nagłówka. Test przepływu potwierdza nazwę z profilu oraz wysyłkę dokładnych zamrożonych bajtów. Lokalny backend uruchomiono ponownie po sprawdzeniu braku aktywnego researchu i kolejki wysyłki. Najpierw przygotowano normalnym API wyłącznie podgląd SELF_TEST z dotychczasowym CV na zapisany osobisty adres; niezależny parser MIME potwierdził właściwego nadawcę, odbiorcę, temat, treść, hash CV i brak błędów. Porównanie SQLite przed/po przygotowaniu: materiały, szkice i wersje bez zmian, jedna dotychczasowa próba i SENT_CONFIRMED, sender paused. Późniejsze wyraźnie zlecone wysyłki i potwierdzenie Odebranych opisano powyżej.

## Pierwsza rzeczywista wysyłka Gmail

Użytkownik wyraźnie polecił wysłać pojedynczy test z CV na swój dodatkowy adres osobisty. Dodano zapisywany poza repo adres do prób, związany z polityką i dokładnym podglądem; zmiana adresu unieważnia poprzednią zgodę. Mail użył aktualnej wiadomości Codapi v4 oraz wcześniej zatwierdzonego PDF. Przeszedł normalną ścieżkę preview → approval → outbox → jedna próba POST Gmail. Nie kontaktowano firm, nie zatwierdzano profilu/CV i nie dopisywano zgody na przyszłe maile.

Gmail przyjął wiadomość z provider ID i zmienił RFC Message-ID. Naprawiono rzeczywisty przypadek: znany ID dostawcy i wątek z wyniku send potwierdzają konkretną próbę przy dodatkowej zgodności konta, jednego odbiorcy, tematu, SENT i czasu. Przy braku znanego ID nadal wymagany jest oryginalny RFC Message-ID. Zachowano oryginalny identyfikator/MIME i zapisano zaobserwowany identyfikator Gmail osobno. Testy złego wątku/odbiorcy pozostają blokowane. Nie ponowiono wysyłki.

Końcowy `npm run check`: typecheck/build PASS, **152/152 backend i 6/6 UI**. Rzeczywista próba ma **SENT_CONFIRMED**, jedną wiadomość, jeden send_attempt i jedną rezerwację. Użytkownik potwierdził odbiór i poprawne otwarcie CV, ale wiadomość automatycznie trafiła do Spamu. Gmail wskazał podobieństwo do wcześniej wykrytych wiadomości spamowych, bez dokładnej przyczyny. SENT_CONFIRMED potwierdza wiadomość w Wysłanych, nie klasyfikację w Odebranych. Historia firm, odpowiedzi, długi test i Windows nadal niezweryfikowane rzeczywiście.

Kontrola zapisanego MIME: zwykły tekst i PDF, bez części HTML i śledzenia otwarć; nadawca zgodny z połączonym kontem. Użytkownik dostarczył EML z odebranej wiadomości. Nagłówek Authentication-Results serwera mx.google.com zawiera SPF=pass, DKIM=pass, DMARC=pass oraz ARC=pass. Parser nie zgłosił błędów MIME; SHA-256 odebranego PDF jest zgodny z zatwierdzonym CV. Nie stwierdzono błędu uwierzytelnienia w tej próbie. Nagłówki nie podają szczegółowej przyczyny klasyfikacji jako spam. Możliwy następny krok to osobno uzgodnione porównanie z ręczną wysyłką tej samej treści i CV z tego samego konta. Nie zmieniono zaakceptowanego stylu, nie ponowiono wysyłki. [Sprawdzanie uwierzytelnienia w Gmailu](https://support.google.com/mail/answer/180707?hl=en&co=GENIE.Platform%3DDesktop), [wskazówki Google dla nadawców](https://support.google.com/mail/answer/81126?hl=en).

Użytkownik wykonał ręczną wysyłkę z Gmaila, dostarczył drugi EML i potwierdził trafienie do Odebranych. Adresy i temat są takie same; treść tekstowa jest zgodna po pominięciu białych znaków. Obie wiadomości mają SPF/DKIM/DMARC/ARC PASS. Ręczny mail ma nazwę nadawcy „Jakub Lewosz” oraz część HTML obok tekstu. Załącznik jest inny: JobHunter użył lokalnego zatwierdzonego PDF (58 698 bajtów), ręczny mail użył innego lokalnego PDF (78 467 bajtów); ich SHA-256 różnią się. Użytkownik potwierdził, że przed ręcznym testem nie oznaczał pierwszego maila jako „To nie jest spam” ani nie zmieniał kontaktów lub filtrów. Wynik nadal nie rozstrzyga, czy różnicę klasyfikacji spowodował sposób wysyłki, format, PDF czy inne sygnały Gmaila. Kolejne porównanie powinno zachować dokładnie ten sam załącznik. Ręczny test nie dopisuje prób ani zgód w JobHunterze; nie zmieniono kodu wysyłki ani zatwierdzonego CV.

## Odświeżenie zapisanych maili i układu panelu

Na prośbę użytkownika wygenerowano przez normalną ścieżkę API nowe wersje wszystkich trzech rzeczywistych szkiców: PRODAUT i TwójSoftware v3, Codapi v4. Korzystają z zaakceptowanych instrukcji stylu oraz istniejących zatwierdzonych faktów i źródeł. Wszystkie oceny semantyczne true; wersje pozostają NEEDS_REVIEW bez zatwierdzenia. Starsze treści zachowane. Poprzednio kontrola deklaracji nie przepisywała treści; dopiero ponowna generacja zastosowała nowy styl do zapisanych wiadomości.

Wiadomość i lista szkiców są przed panelem Gmaila. Wyrównano odstępy/etykiety/CV/przyciski, uproszczono badge trybu w sidebarze, treść rośnie do wysokości całego maila, uwagi są zwijane, a powiadomienie nie przechwytuje kliknięć. `npm run check`: typecheck/build PASS, 149/149 backend, 6/6 UI. Dodatkowy odczyt rzeczywistego panelu przez Playwright: 1440, 1024 i 390 px, bez poziomego overflow; cały mail mieści się w polu, panel Gmaila poniżej edytora. PNG desktop/mobile obejrzane. Zero rzeczywistych wysyłek i nowych zgód.

## Gmail po zatwierdzeniu — implementacja E4

`npm run check`: typecheck/build PASS, **149/149 backend i 6/6 Chromium**. Nowe testy używają fikcyjnego konta, adresów example.test i katalogów tymczasowych; bez rzeczywistego Gmaila i Keychain. Przeszedł dodatkowy przepływ OAuth readonly przez rzeczywisty lokalny callback z fikcyjnym serwerem Google. Desktop 1440 i mobile 390: podgląd z CV, jawna zgoda, brak poziomego overflow; PNG obejrzane.

Sprawdzono: test do siebie bez oznaczenia firmy jako skontaktowanej; dokładny MIME/hash CV; brak send przed zgodą; zmiany treści, odbiorcy, CV, profilu i konta; uszkodzone bajty; równoległy dispatch; znana odmowa przed przyjęciem; pauza po uzyskaniu tokenu; timeout po przyjęciu; restart kolejki/SENDING; brak ponowienia; quota i zgodne KPI. Reconcile sprawdza konto, adres, temat, identyfikator, SENT i czas, najpierw po znanym provider ID, a potem przez RFC Message-ID.

Historia ma jawny zakres dla wybranych kontaktów/domen, stronicowanie i cursor po kompletnej stronie. Testy błędu drugiej strony, powtórzonego cursora, zmiany historyId i wcześniejszej korespondencji blokują uznanie historii za pustą. Przed send wykonywany jest nowy scan. Testy odczytu znanego wątku sprawdzają deduplikację, tekstowy HTML, brak pobierania załączników, ręczną klasyfikację i blokadę odmowy. Poczta nie trafia do modelu.

Ręczna edycja czyści odwołania do wcześniejszej treści. Wykryty w UI problem naprawiono przez kontrolowane odtworzenie mapy deklaracji i ponowną kontrolę faktów, z nową wersją do przeglądu, bez zmiany tekstu. Nie poluzowano wymogu odwołań ani false/null. Modele nadal nie udzielają zgody na wysyłkę. Przejścia RESEARCH_ONLY/APPROVAL_REQUIRED zachowują profil, wersje i próby, a DEMO nie przechodzi do danych osobistych. Migracja E2 zachowuje stare rekordy i sprawdza nową domyślną wartość kind.

Na etapie poniżej opisanej implementacji rzeczywisty test maila nie był jeszcze wykonany; późniejszy wynik znajduje się na początku raportu. Odczyt historii firm/odpowiedzi, działanie pełnego dnia, Windows i izolacja OS nadal niepotwierdzone. Inkrementalny Gmail History API nie jest zaimplementowany; używany jest pełny celowany scan ze snapshotem historyId. Readonly wymaga dodatkowej zgody użytkownika Google. Dotychczasowe połączenie send z 7 października samo nie potwierdzało tej nowej ścieżki. AUTO_POLICY pozostaje zablokowany.

Po powyższych testach uruchomiono lokalnie APPROVAL_REQUIRED po wykonaniu kopii SQLite. Porównanie potwierdziło zachowanie profilu, faktów, trzech szkiców i sześciu dotychczasowych wersji. Użytkownik zakończył dodatkowy rzeczywisty OAuth readonly/send 8 października; potwierdzono konto i zakresy bez odczytu skrzynki. Zatwierdzone CV było już dostępne. Rzeczywisty Codex odtworzył deklaracje jednego szkicu Codapi bez zmiany treści, zapisując wersję 3 do przeglądu; kontrola supported=true. Przygotowano lokalny podgląd SELF_TEST z CV na potwierdzony adres własny. Nie utworzono zgody na wysyłkę ani outbox; zero rzeczywistych send_attempts. Faktyczne send, Wysłane i odpowiedzi nadal oczekują na decyzję użytkownika w panelu.

## Mikro-poprawki naturalnych sformułowań

Wyłącznie wskazówki językowe promptu: naturalne otwarte kandydatury, bez powtórzeń także w odmienionych formach w jednym akapicie, prosty opis pracy zespołowej i pytanie o wymiar oraz godziny pracy. Aktualny zatwierdzony fakt ElektroScan potwierdza projekt zespołowy; liczby osób ani trwającego rozwoju nie dopisano. Długość, cztery części, pozostały styl i logika aplikacji bez zmian.

Końcowy `npm run check`: typecheck/build PASS, 125/125 backend i 5/5 UI. Kontrola rzeczywistym Codexem dla fikcyjnych integracji, LLM i PDF: 88, 80 i 99 słów. Pierwszy podgląd LLM nadal powtarzał sformułowanie o wspomaganiu tworzenia oprogramowania; po doprecyzowaniu wskazówki ponowiono podglądy LLM i PDF. Odczyt końcowych treści potwierdził cztery poprawki, oceny semantyczne true i brak uwag stylu. Rzeczywisty profil i szkice bez edycji, zero wysyłek.

## Trzy końcowe korekty językowe

Dodano wyłącznie trzy wskazówki do promptu: „mój projekt [nazwa]”, naturalne „Przy tworzeniu oprogramowania korzystam z Codexa” oraz krótkie pierwsze zdanie bez łączenia stanowiska, rodzaju współpracy i obszaru technologicznego. Pozostały styl, struktura i logika bez zmian. `npm run check`: typecheck/build PASS, 125/125 backend i 5/5 UI.

Ponownie wygenerowano trzy fikcyjne podglądy: integracje, LLM i aktywne PDF. Odczyt treści potwierdził wszystkie trzy poprawki; brak uwag stylistycznych. Oceny semantyczne: integracje i LLM true, PDF false z powodu jawnie fikcyjnego źródła kontrolnego, bez problemu dotyczącego nowego sformułowania. Oceny nie poluzowano ani nie uznano za zgodę na wysyłkę. Rzeczywisty profil i szkice pozostały bez zmian; zero wysyłek.

## Ostatnie mikro-poprawki językowe

Wyłącznie wskazówki generatora i istniejącej kontroli semantycznej: imię naturalnie otwiera przedstawienie i łączy się z edukacją w jednym zdaniu, bez zbędnego roku szkolnego. Opis projektu jest bezpośredni, a brak wdrożenia krótki i neutralny. Publiczne repozytorium ani samo dawne określenie „publiczne demo” nie potwierdzają działającej publicznie aplikacji. Bez potwierdzenia działającej wersji i jej adresu w zatwierdzonych faktach generator pomija taką wzmiankę. Struktura maili i logika aplikacji bez zmian.

Końcowy `npm run check`: typecheck/build PASS, 125/125 backend i 5/5 UI. Istniejące szkice, historia i zatwierdzony profil nie były edytowane; kontrolne generacje korzystają z fikcyjnych firm i odbiorców, bez wysyłek.

Sprawdzono pięć kontrolnych wiadomości rzeczywistym Codexem. Pierwsza próba ujawniła dwa powtórzenia dawnego opisu statusu projektu; po doprecyzowaniu instrukcji ponownie wygenerowano przypadki PHP bez oferty i PDF. Końcowe podglądy mają połączone przedstawienie, nie zawierają roku szkolnego ani niepotwierdzonego publicznego demo, a FixDesk jest opisany jako lokalny projekt bez wdrożenia produkcyjnego. Wszystkie oceny semantyczne true, bez zgłoszonych uwag; to kontrola treści, nie zgoda na wysyłkę. Długość 81–103 słowa: w tej mikro-korekcie nie zmieniano preferencji długości ani wcześniejszej zasady unikania wypełniaczy.

## Drobna korekta języka

Zmiany ograniczone do sformułowań promptu, neutralnych opisów projektu, tematów i odpowiadającego preferencji progu długości (220 słów). Struktura, wybór projektu, kontrola źródeł, dostępność, wersjonowanie, baza i integracje zachowane. Standardowy cel 150–220 słów; bez „Firma X tworzy”, domyślnego demo, marketingowych ozdobników i sztucznego rozciągania tekstu. Szczegóły użycia AI nadal wymagają zatwierdzonych faktów.

`npm run check`: typecheck/build PASS, 125/125 backend i 5/5 UI. Kontrola rzeczywistym Codexem: pięć fikcyjnych firm/odbiorców, poprawne tematy, odmiana i nawiązania; wszystkie końcowe oceny semantyczne true i brak wykrytych uwag stylu. Pierwsza próba 159–169 słów dodawała zbędne objaśnienia. Po doprecyzowaniu promptu końcowe podglądy mają 90–107 słów: cel długości pozostaje preferencją, wymagającą dalszej oceny na bogatszych materiałach. Podglądy poza repo, bez zapisu do rzeczywistych szkiców i bez wysyłek.

macOS arm64 / Node 24.11.0. Testy powtarzalne korzystają z osobnych katalogów tymczasowych, fikcyjnych kontaktów i kontrolowanych adapterów offline. Playwright uruchamia Fastify + SQLite, nie statyczny mock HTTP.

## Punkt wyjścia

Czyste `main`, `109effa`. Bazowe `npm run check`: typecheck/build PASS, 44/44 testy backendu, 4/4 scenariusze Chromium. Nie znaleziono istniejących błędów do oddzielenia.

## E3

Ostatni pełny `npm run check`: typecheck/build PASS, 125/125 testów backendu i 5/5 scenariuszy Chromium.

Zachowano wszystkie testy E0–E2. Nowe sprawdzają: osobne tryby/profil/historię, DisabledMailProvider i brak approvals/outbox, import przed zatwierdzeniem, migracje 003/004 i prawdziwego schematu E2 z rekordami zależnymi, IPv4/IPv6/protokoły/porty/credentials, DNS mixed/pinning/redirecty/429/timeout, gzip/brotli i limit treści po dekompresji, niepotwierdzone cytaty/email, unknown/archiwum, deduplikację firmy/oferty/kontaktu, historię i Fingoweb, zmianę profilu, schemat i prompt injection, trwałe wznowienie etapu po przerwaniu/restartach.

Procesowy test adaptera przez fikcyjne CLI sprawdza oficjalny login status, brak CLI/logowania, timeout, limit, limit wyjścia, JSONL, uszkodzony końcowy JSON i odrzucenie niezgodności ze schematem. Brak fallbacku do mocka.

Regresja reconcile odtworzona testem: timeout po przyjęciu → potwierdzenie istniejącej próby → KPI sent=1 i wykres sent=1, jedna dostawa oraz jedna próba. Wykres korzysta teraz z tego samego rejestru prób i dnia rezerwacji co licznik.

Nowy scenariusz UI RESEARCH_ONLY: testy integracji przez kontrolowane adaptery → zatwierdzenie fikcyjnego profilu w testowej bazie → search → szkic → kopiowanie/edycja/przegląd/reload → backendowa blokada approve-batch → podgląd warunków i źródeł. Desktop 1440 i mobile 390 bez poziomego overflow; PNG w ignorowanym test-results.

Wykryte i naprawione podczas implementacji: wymagana obsługa DNS lookup all:true w Node 24 (próba online) i zmiana nazwy eksportu DEMO (regresja UI). Nie występowały w bazowym E2.

## Próby rzeczywiste, odrębne od testów offline

- CLI 0.160.1 i ChatGPT login: potwierdzone oficjalnym poleceniem; bez odczytu auth.json.
- Strukturalny JSON na fikcyjnych danych: PASS.
- Web search z potwierdzonym zdarzeniem narzędzia: PASS. Próba bez hosta narzędzi prawidłowo nie była uznana za udane wyszukiwanie.
- Publiczny HTTPS fetch strony Node.js: PASS, rzeczywista treść i hash. Timeout innej strony zachowano jako TIMEOUT, bez fikcyjnego fragmentu.
- Fikcyjny plik poza task dir: model nie odczytał go ani nie zmienił; sentinel pozostał niezmienny. Nie jest to pełny audyt izolacji OS ani prywatnych plików.
- Wcześniejszy `npm run smoke:research`: test CLI i wyszukiwarki zapisany; WAITING_FOR_PROFILE (exit 2). Po późniejszym zatwierdzeniu materiałów przez użytkownika wykonano poniższą ograniczoną próbę na rzeczywistych firmach.
- Zero rzeczywistych maili, prywatnej poczty i formularzy.

## Niezweryfikowane

Windows/PowerShell/native CLI i ACL, pełny sandbox procesu OS, kompletna semantyczna prawdziwość każdej deklaracji, skuteczność kontaktów oraz wielogodzinnej pracy. Instrukcja Windows: WINDOWS_SMOKE.md. Gmail/E4 i AUTO_POLICY/E5 poza zakresem.

## Zmiana dostępności i wspólny wzór

Dostępność RESEARCH_ONLY to orientacyjnie około 20 h, bez min/max w UI i pakiecie modelu. Migracja 005 zachowuje historyczne kolumny i DEMO, a nowa propozycja wymaga zatwierdzenia. Wzór jest edytowalny i związany z hashem profilu. Dobór jednego projektu na podstawie oferty oraz blokada maksimum/przedziału i kilku projektów sprawdzone testami. Playwright sprawdza pojedyncze pole godzin i edytowalny wzór. `npm run check`: 72 testy backendu, 5 scenariuszy UI, typecheck/build PASS.

## Prosty panel i praca na dzień

Moje materiały: jedna konkretna wiadomość Jakuba, CV i krótkie opisy projektów; bez pól identity i ogólnego edytora profili. Start na 8 godzin używa tej samej pojedynczej kolejki, do 8 cykli, nie częściej niż raz na godzinę. Osobne kierunki, cache zapytań i źródeł; brak lawiny po uśpieniu. Pauza, restart, koniec dnia i limit Codexa zatrzymują kontynuację. Pojedynczy błędny kandydat jest zapisany jako PARTIAL i nie blokuje pozostałych kierunków. Zweryfikowano testami offline i UI; nie wykonano rzeczywistej próby trwającej pełne 8 godzin. Na tym historycznym etapie Gmail nie był jeszcze podłączony; późniejsze wdrożenie APPROVAL_REQUIRED i testy są opisane na początku raportu. Wysyłka bez przeglądu pozostaje niedostępna.

## Godzinny test

Dodano przycisk „Test na godzinę”: pojedynczy worker, kolejne kierunki co 10 minut, do 10 kandydatów i 3 szkiców na całą sesję, automatyczny stop po czasie lub limicie. Testy offline sprawdzają wspólny limit kandydatów, pomniejszanie budżetu szkiców i zakończenie po terminie; Playwright uruchamia godzinny tryb przez API. `npm run check`: 74 testy backendu, 5 scenariuszy UI, typecheck/build PASS.

W działającej bazie użytkownik zatwierdził materiały. Pierwsza rzeczywista tura poza godzinnym testem była PARTIAL: dwa odrzucenia i jeden niepotwierdzony kandydat, bez szkiców i wysyłek. Na prośbę użytkownika zatrzymano sesję 8 h i uruchomiono ograniczony godzinny test 7 października o 13:09, z terminem 14:09 Europe/Warsaw.

Przy sprawdzeniu o 14:11 potwierdzono automatyczne zakończenie o 13:52 po osiągnięciu limitów, po około 42 minutach. Wyłącznie w runIds godzinnej sesji: 5 tur, 10 kandydatów, 8 elementów DONE, 2 błędy SEMANTIC_REVIEW_FAILED na etapie DRAFT, 3 zapisane szkice. Wszystkie 10 kandydatur pozostaje NEEDS_REVIEW; zero odrzuceń w tej sesji. Odrzucenia z wcześniejszej tury nie są doliczane. Cała baza RESEARCH_ONLY ma zero send_attempts i pusty outbox.

Przeczytano 3 szkice i zatwierdzone fakty: każdy ma indywidualne nawiązanie do działalności firmy, jeden pasujący projekt AutoRelay, informację o programowaniu z AI oraz pytanie o niepotwierdzone warunki. Wynagrodzenie, pełna zdalność, około 20 godzin po lekcjach i forma umowy są propozycją kandydata. Wiadomości nie udają odpowiedzi na istniejący wakat. Kontrola modelu zaakceptowała te 3 szkice, ale wymagają one przeglądu użytkownika. Powtarzanie warunków w akapicie o kandydacie i końcowym pytaniu wydłuża treść; programowanie z AI warto wyeksponować wcześniej. Materiały firm i treści szkiców pozostają w prywatnej bazie, poza repo.

Potwierdzono rzeczywisty przepływ wyszukiwanie → publiczne źródło → analiza → szkic i działanie limitów. Zachowano dwie nieudane próby bez ponawiania ani usuwania błędów. Nie wykonano pełnej godziny ani testu wysyłek, odpowiedzi i skuteczności.

## Szerokie szukanie i zapytania o współpracę

Zapytania obejmują wszystkie dziedziny pasujące do zatwierdzonych projektów, także firmy bez ogłoszonego wakatu. PROSPECT ma dowód działalności, pozostaje NEEDS_REVIEW i może mieć szkic na publiczny kontakt GENERAL zweryfikowany literalnie w źródle. SALES i zgadywany email nadal blokują szkic. Szkic pyta o warunki i nie może udawać odpowiedzi na znalezioną ofertę. Testy offline sprawdzają te przypadki oraz wznowienie sesji po restarcie bez zmiany jej terminu, liczników i limitów. `npm run check`: 77 testów backendu i 5 scenariuszy UI, typecheck/build PASS. Wynik ograniczonej rzeczywistej próby opisano powyżej.

## Krótsze wiadomości i przygotowanie Google

Trzy rzeczywiste szkice zapisano jako wersje 2, 86–88 słów: AI na początku, AutoRelay powiązany z działalnością firmy, warunki tylko raz. Nie zatwierdzono profilu, CV ani przeglądu w imieniu użytkownika; stare wersje zachowane, nowe treści pozostają do sprawdzenia. Generator ma krótki wzór i pomija projekt przy braku udokumentowanego dopasowania. Edycja czyści mapę wcześniejszych deklaracji; migracja 006 usuwa ją również ze starszych ręcznych edycji.

Przygotowano oddzielny helper Google OAuth z loopback/state/PKCE S256, tożsamością konta, gmail.send, odświeżaniem i cofnięciem zgody oraz magazynem systemowym bez plaintext fallbacku. Adapter Gmail API nie jest inicjalizowany przez DEMO ani RESEARCH_ONLY i nie ma aktywnej drogi wysyłki w aplikacji. Testy używają fikcyjnych tokenów i wstrzykniętego HTTP; lokalny serwer callback jest rzeczywisty. Sprawdzono złe state (także Unicode), odmowę, timeout, zakresy, refresh/revoke, brak sekretów w metadanych, jedną próbę HTTP i SEND_UNKNOWN po timeout/5xx/uszkodzonym wyniku. Native Keychain na macOS: fikcyjny, losowo nazwany wpis zapisany/odczytany/usunięty, PASS. Znormalizowano zwracany przez native binding null przy braku wpisu.

API i Playwright potwierdzają lokalny podgląd EML z zatwierdzonym PDF, polski tekst, wersję szkicu/hash CV i brak approvals/outbox/send_attempts. Niezatwierdzony lub zmieniony PDF blokuje przygotowanie. Dodano przycisk zatwierdzenia CV w osobistym ekranie; upload wiąże wybrany zasób z bieżącym trybem, zamiast zawsze z DEMO.

Finalny `npm run check`: 85/85 testów backendu, 5/5 UI, typecheck/build PASS. Rzeczywiste logowanie Google na macOS potwierdzono później 7 października o 20:41 Europe/Warsaw: użytkownik dostarczył JSON Desktop app poza repo, wybrał konto i udzielił zgody. Callback zweryfikował konto i zakresy, a połączenie zapisano w magazynie systemowym; w repo nie zapisano emaila, identyfikatora konta ani sekretów. Profil jest zatwierdzony, CV pozostaje niezatwierdzone, trzy szkice w wersji 2 czekają na przegląd. Baza nadal ma zero send_attempts i pusty outbox. Nie wysłano wiadomości. Sender APPROVAL_REQUIRED, historia, odczyt Wysłanych/odpowiedzi, reconcile i E5 pozostają do wdrożenia; Windows nieprzetestowany.

## Naturalny schemat zgłoszenia

Nowy schemat dostarczony przez użytkownika: tożsamość i cel, konkretna firma/oferta, projekt lub zatwierdzone doświadczenie, dostępność i proste pytanie. Zwykle 110–180 słów, AI/Codex opcjonalnie, umowa tylko w istotnym kontekście źródłowym. Aktualne około 20 h pozostaje zgodne z zatwierdzonym profilem. Trzy rodzaje kontaktu mają odrębne wskazówki tematu i zakończenia; ostatnie otwarcia/tematy/pytania są porównywane jako dane.

Testy sprawdzają PHP/Laravel→FixDesk, integracje→AutoRelay, LLM/AI→CodeFabric, PDF/vision→ElektroScan, brak dopasowania i uzasadnione dwa projekty. Walidacja obejmuje prezentacje, studenta, komercję, przesadne AI, stawki, technologie, wakat i dostępność; polskie znaki i negacje nie tworzą fałszywych pozytywnych deklaracji. Obce referencje i pozostałe zabezpieczenia nadal blokowane. Review false/null zachowuje NEEDS_REVIEW z problemami; issues są zachowane także przy true.

Ponowna generacja dopisuje wersję, zachowuje wcześniejsze rekordy i blokuje zapis przy edycji w trakcie pracy. Playwright wykonuje pauzę sesji, zleca nową wersję, sprawdza historię i podgląd z CV. Pełne `npm run check`: 114/114 backend, 5/5 UI, typecheck/build PASS.

Rzeczywisty Codex wygenerował trzy kontrolne szkice dla fikcyjnych firm i odbiorców w odrębnym katalogu danych: ACTIVE_JOB/PHP, OPEN_APPLICATION/integracje, GENERAL_RECRUITMENT_CONTACT/LLM. Końcowa próba: 113, 109 i 115 słów, różne tematy i nawiązania, po jednym odpowiednim projekcie. Jedna ocena null wynikała z fikcyjnego źródła; została zachowana do przeglądu. Poprzednia kontrolna próba LLM została zablokowana przez walidację technologii; nie osłabiono tej reguły, kolejna generacja przeszła. Wyniki są poza repo w content-previews, niezależnie od katalogu czyszczonego przez Playwright. Nie dodano fikcyjnych firm do rzeczywistego researchu i nie wysłano maili.

## Finalny tuning stylu

Zakres ograniczony do generatora, stylu, walidacji i testów; bez zmian architektury, schematu bazy lub integracji. Po wyjaśnieniu preferencji użytkownik wybrał zachowanie obecnego około 20 h. Zasady mają cztery krótkie części, 100–150 słów lub sensownie mniej, jedno zdanie o projekcie i jedno pytanie; formalność, sprzedażowe CTA, zbędne meta-komentarze i powtórzenia są uwagami do przeglądu. Faktu/dowodu, studenta, komercji, AI, stawki, wakatu i dostępności nie poluzowano. Nowa walidacja zakresowa odrzuca sztywne 20 h przy profilu 15–20 i pełną dyspozycyjność.

Testy obejmują aktywne PHP z potwierdzonym zleceniem, otwarte integracje, LLM bez naboru, firmę bez związku z AI i aktywne PDF z nieznaną umową. Sprawdzają sensownie krótki mail, długość, powtórzenia, jedno pytanie, stylistyczne NEEDS_REVIEW i zachowanie wszystkich dotychczasowych zabezpieczeń. `npm run check`: typecheck/build PASS, 124/124 backend i 5/5 UI.

Rzeczywisty Codex wygenerował pięć podglądów dla fikcyjnych firm/odbiorców: 85, 80, 78, 73 i 78 słów. Wszystkie zachowują komplet części i mają pustą listę uwag stylistycznych. Dwa review=null odnoszą się do fikcyjnych źródeł, więc nadal wymagają przeglądu; pozostałe review=true nie są zgodą na wysyłkę. Podglądy poza repo, bez zapisu do żywego profilu lub szkiców, bez używania Gmaila i bez wysyłek.
