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

### Wybierz stan instalacji, zanim zmienisz kod

Decyzja dla tego projektu: nowa lokalna instalacja na domowym Windowsie, Fingoweb
wykluczony, świadomy jednorazowy wyjątek dla pozostałych dawnych ręcznych zgłoszeń.
Nie przenosimy testowej bazy z Maca i nie kompletujemy 33 nazw. W tej rundzie
nie wykonano inicjalizacji, importu, Gmaila ani Start na Windowsie.

**Nowa instalacja bez bazy:** brak SQLite oznacza nową instalację, a nie utratę
historii do odtworzenia. Nie ma jeszcze bazy do backupu. Pobierz wybraną wersję
kodu do nieaktywnego checkoutu, wykonaj `npm ci`, `npm run build`, `npm run doctor`.
Następnie użytkownik wykonuje poniższą jawną procedurę nowej historii, z lokalnym
CSV obejmującym Fingoweb i potwierdzonym wyjątkiem. Materiały pozostają DRAFT do
osobnego zatwierdzenia. Macowy raport/snapshot nie zatwierdza PDF na Windowsie.

**Istniejąca instalacja:** Stop w panelu → zakończenie rozpoczętych operacji →
zakończenie backendu → read-only doctor i spójny backup → wybrana wersja kodu →
zależności/build/doctor → backend bez aktywnej zgody na wysyłkę. Zachowaj ten sam
katalog `research-only`, materiały, liczniki, shared records i blokady. Nie twórz
nowej bazy jako sposobu aktualizacji. `npm run history:local -- doctor KATALOG`
nie tworzy brakującej bazy. `history:local backup KATALOG` używa spójnej operacji
SQLite z WAL, poza repo. Nie kopiuj samego aktywnego pliku SQLite.

Wybieraj wersję z wynikami testów i jej SHA; push sam nie wdraża backendu.
Nie kopiuj `node_modules` ani markerów WORKSTATION między systemami. Jeśli lokalne
zmiany uniemożliwiają fast-forward, zachowaj je i ustal wersję w osobnym checkoutcie.
Bez automatycznego pull/restart, autostartu i zmiany zasilania.

Po pobraniu kodu nadal sprawdź na domowym komputerze:

1. Właściwy katalog i rzeczywisty stan nowej albo istniejącej instalacji.
2. Zatwierdzone fakty, dokładny PDF/CV, materiały i ich wersje.
3. Node 24, SQLite, lokalny doctor, Codex/login i odczyt publicznych stron z właściwym CA.
   Macowy `--use-system-ca` nie potwierdza magazynu Windowsa; nie wyłączaj TLS.
4. Właściwe konto i uprawnienia Gmaila, dopiero w późniejszej świadomej konfiguracji.
5. Backend uruchomiony bez zgody sesji; później świadomy pilotaż przez Start.
   3–5 maili i odstęp kilku minut to sugestia pilotażu, nie limit produktu.

`smoke:public` pozostaje małym testem: do 5 firm/15 minut, domyślnie syntetyczny.
Na skonfigurowanym Windowsie `--approved-profile KATALOG_BAZOWY` kopiuje tylko
zatwierdzone materiały do nowego katalogu diagnostycznego, bez PDF/Gmaila/send.
Duży harness `public-autonomous-review.ts` jest osobną jawną diagnostyką, bez prawa
późniejszej wysyłki. Domeny badane wcześniej nie są dowodem wcześniejszych maili.

Jeżeli **wiadomo**, że istnieje oryginalna historia na innym komputerze, zachowaj ją
prywatnie i użyj read-only doctor/backup oraz addytywnego eksportu/importu z HISTORY_SYNC.
To ścieżka dla rzeczywistej istniejącej historii, nie obowiązek poszukiwania bazy
przy uzgodnionej nowej instalacji. PRIVATE_GIT pozostaje opcjonalny; LOCAL_ONLY nie
wymaga prywatnego origin. Już skonfigurowanego PRIVATE_GIT nie zmieniaj bez Stop,
jawnej decyzji i zgodności pełnego opublikowanego stanu; nie omijaj SEND_UNKNOWN.

### Nowa historia i ręczne kontakty — późniejsze jawne wykonanie na Windowsie

Decyzja użytkownika z 12 października: JobHunter nie wysyłał wcześniej wiadomości
do firm, a SELF_TEST były próbami testowymi, nie aplikacjami. Wybrano nową lokalną
instalację Windows bez przenoszenia testowej historii MacBooka. Historycznych
raportów i baz nie kasujemy. Do nowej historii wchodzą wyłącznie potwierdzone
ręczne kontakty użytkownika, nie zapisane w kodzie propozycje firm.

Późniejsza decyzja doprecyzowuje ręczną historię: CSV obejmuje tylko wykluczoną
firmę, a wobec pozostałych wcześniejszych zgłoszeń użytkownik świadomie dopuszcza
jedną kolejną wiadomość. Nie twierdzimy, że wcześniej do nich nie pisał.
Nie wymagamy uzupełnienia listy 33 nazw. Nowe wysyłki i niepewne próby nadal
blokują, a czasowa granica kampanii jest zapisana raz, bez odnawiania.

W wybranej nowej instalacji Windows docelowy
katalog to `%LOCALAPPDATA%\JobHunter`, profil `research-only`. Poniższe kroki
pozostają planem; przygotowanie instrukcji nie upoważnia do utworzenia bazy,
importu, uznania historii za kompletną lub podłączenia Gmaila.

1. Użytkownik przygotowuje prywatny CSV UTF-8 poza repo, na podstawie własnego
   ręcznego sprawdzenia Gmaila lub swojej listy kontaktów. Aplikacja nie odczytuje
   skrzynki. Kolumny: `company,status,domain,email,date`. `CONTACTED` oznacza
   rzeczywisty wcześniejszy kontakt; `REJECTED`, `ACTIVE_CONVERSATION` i
   `RECRUITMENT_ON_HOLD` zachowują odpowiednie blokady. `SUGGESTED` pozostaje
   niepotwierdzoną sugestią, a nie dowodem wysłania. Domain to znana oficjalna
   domena firmy, nie domena współdzielonej skrzynki. Email musi być dokładnie
   znany; nie zgaduj adresu. Nieznaną datę/domenę/adres pozostaw puste.
   Maksymalnie 1000 wierszy na plik. Nie dopisuj treści poczty ani sekretów.
   CSV wymaga przecinków, nie średników, i kodowania UTF-8. Znana data w formacie
   YYYY-MM-DD; nieznana pusta. Nazwę zawierającą przecinek obejmij cudzysłowami.
   Pusty szablon zawiera tylko nagłówki, więc nie jest jeszcze plikiem do importu.
2. Przed bazą roboczą wykonaj lokalny podgląd CSV w nowym katalogu tymczasowym
   z istniejącym `ResearchJobHunter.previewHistory`. Sprawdź wszystkie wiersze,
   konflikty nazw/domen, scalenia, statusy i hash dokładnego tekstu. Pokaż podgląd
   użytkownikowi; dane rzeczywistych firm pozostają poza repo i nie trafiają do
   modelu researchu. Nie przenoś całej tymczasowej bazy do instalacji roboczej.
   Gotowe narzędzie: `npm run history:new -- preview KATALOG_BAZOWY PRYWATNY_CSV`.
   Nie tworzy katalogu docelowego ani nie importuje kontaktów.
3. Uzyskaj osobne, konkretne potwierdzenie: utworzenie wskazanej nowej bazy oraz
   import dokładnego pliku/wersji z podglądu. Do tego czasu nie twórz katalogu
   roboczego ani SQLite. Nie potwierdzaj automatycznie kompletności historii.
4. Po zgodzie, przy braku backendu i istniejącej bazy docelowej, użyj
   `history:new initialize` z dokładnym zatwierdzonym hashem CSV oraz
   `--confirm-new-database --allow-prior-applications-once`. Narzędzie korzysta
   z istniejących `acquireProfileLock`, `Store` i `ResearchJobHunter`, bez
   serwera, workerów, start/tick/probe, modelu lub Gmaila. Inny hash przerywa
   operację; istniejący katalog docelowy nie jest przyjmowany. Ta ścieżka
   nie generuje prób/rezerwacji ani wiadomości. Zachowuje propozycje materiałów
   jako DRAFT i blokadę Fingoweb.
   Propozycje nie są zatwierdzonym profilem. Nie importuj fixture, nie kopiuj
   testowej bazy i nie fabrykuj SENT_CONFIRMED lub liczników wysyłek ręcznych.
5. Narzędzie kończy z sesją Stop i spójnym backupem. Wykonaj read-only
   `history:local doctor` i sprawdź liczby oraz blokady. Po potwierdzeniu zakresu
   NOWEJ kampanii i jednego Windowsa użyj
   `configure --confirm-new-campaign-history --single-workstation`. To odrębny
   zakres od kompletnej oryginalnej historii; nie uznajemy dawnej listy za pustą.
   Znacznik zawiera wyraźny historyScope i nieodnawianą granicę. Nie twórz
   workstation.json ręcznie. Helper celowo odrzuca bazę bez wcześniejszej historii;
   sam JSON eksportu z pustymi listami nie jest procedurą inicjalizacji.
6. Materiały i PDF wymagają odrębnego sprawdzenia użytkownika. Na tym etapie
   ewentualny backend tylko WORKSTATION/RESEARCH_ONLY, bez Gmaila. Potem dopiero
   zatwierdzony profil w izolowanym smoke:public, do 5 firm/15 minut. Gmail,
   polityka i pierwszy Start są późniejszą, oddzielną decyzją.

`history:local import` obsługuje wersjonowany JSON prawdziwej historii, nie CSV.
`history:new` opakowuje istniejący importer CSV do jawnej nowej inicjalizacji.
Dotychczasowa `history:local configure --confirm-existing-history` nadal służy
pełnej istniejącej historii. Procedurę
sprawdzono na dwóch fikcyjnych ręcznych kontaktach na Windowsie: podgląd/hash,
blokada zmienionego pliku, addytywny import, idempotencja, deduplikacja domeny,
doctor/backup/configure; zero sieci, prób, rezerwacji i zatwierdzeń materiałów.
Nie wykonano tych kroków na danych użytkownika.

Jawna nowa inicjalizacja i nowy publiczny katalog diagnostyczny pomijają dawną
listę 33 nazw; blokada Fingoweb i materiały DRAFT pozostają. Istniejących baz
nie czyścimy. Wyjątek wcześniejszych zgłoszeń ma wersję, ID i nieodnawianą
granicę. Nie obejmuje własnych utrwalonych prób JobHuntera ani odmów kontaktu.
Nowy backend pozostaje zatrzymany. Najpierw materiały, CV i publiczny smoke;
samodzielne późniejsze Gmail/polityka/Start pozostają osobnymi decyzjami.

Przykład przygotowany do wykonania dopiero po potwierdzeniu użytkownika:

```powershell
$newHistoryCsv = Join-Path $env:USERPROFILE 'Documents\JobHunter-przygotowanie\kontakty-reczne.csv'
npm run history:new -- preview "$env:LOCALAPPDATA\JobHunter" $newHistoryCsv
# Nie zastępuj placeholdera hashem innego pliku; najpierw zgoda na pokazany podgląd/katalog.
npm run history:new -- initialize "$env:LOCALAPPDATA\JobHunter" $newHistoryCsv --confirmed-csv-hash HASH_Z_ZATWIERDZONEGO_PODGLADU --confirm-new-database --allow-prior-applications-once
npm run history:local -- doctor "$env:LOCALAPPDATA\JobHunter"
# Po potwierdzeniu nowego zakresu historii i jednego komputera:
npm run history:local -- configure "$env:LOCALAPPDATA\JobHunter" --confirm-new-campaign-history --single-workstation
# Dopiero po tych czynnościach, do pracy bez poczty:
$env:JOBHUNTER_RUNTIME = 'WORKSTATION'
$env:JOBHUNTER_MODE = 'RESEARCH_ONLY'
# Uruchomienie panelu nie zatwierdza materiałów lub CV; bez Start kampanii.
```

Znaczenie kolumn istniejącego CSV:

| Kolumna | Co wpisać                                                     |
| ------- | ------------------------------------------------------------- |
| company | Rzeczywista nazwa firmy; wymagane.                            |
| status  | CONTACTED dla wcześniejszego kontaktu; wymagane.              |
| domain  | Potwierdzona domena firmy bez https:// i ścieżki, albo puste. |
| email   | Dokładny adres, na który wcześniej pisano, albo puste.        |
| date    | Znana data wcześniejszego kontaktu, albo puste.               |

CONTACTED zwykle blokuje nowy pierwszy kontakt; jawny wyjątek dla dawnych
zgłoszeń może dopuścić jeden kontakt. Fingoweb pozostaje wykluczony. CSV nie tworzy send_attempts ani
usage_ledger: import nie udaje dostawy potwierdzonej przez dostawcę. Odmowa firmy
to REJECTED, trwająca rozmowa ACTIVE_CONVERSATION, wstrzymany nabór
RECRUITMENT_ON_HOLD. Nie oznaczaj tych sytuacji jako SUGGESTED. Kolumn dodatkowych
nie dodawaj; importer odrzuca nieznane pola. Można też przekazać zwykłą listę
firm do lokalnego przygotowania CSV przed podglądem i potwierdzeniem importu.

## C. Aktualizacja po pushu

Osobny checkout roboczy i development. Stop w panelu → czekaj na rozpoczęte operacje → zakończ backend scripts/stop.ps1 → backup → git status → wybrana stabilna wersja. Bez pull/npm ci/build/hot reloadu przy aktywnym senderze.

Przed pierwszą aktualizacją dawny checkout może nie mieć history:local. Uruchom nowy helper z osobnego checkoutu developerskiego po npm ci, podając jawnie oryginalny katalog poza repo. Doctor i backup korzystają z read-only SQLite, bez migracji oryginału. Nie uruchamiaj npm ci/build w aktywnym checkoutcie roboczym. Restore-copy migruje wyłącznie nową kopię do kontroli; configure/import są osobnymi jawnymi operacjami.

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

## Osobny publiczny research z zatwierdzoną propozycją

Zlecenie z 12 października dopuszcza osobną diagnostykę z lokalnym
`profil-propozycja.json` nawet przed utworzeniem WORKSTATION. Flaga
`--approved-profile` oznacza wcześniej uzyskaną zgodę człowieka na dokładny
zestaw; nie udziela jej skrypt. Hash wskazanego PDF musi odpowiadać propozycji.
PDF i dane pozostają poza repo. Brakujące opisy projektów nie mają fallbacku
do domyślnych faktów. Ograniczenia zestawu są w template, poza faktami.

```powershell
$proposal = Join-Path $env:USERPROFILE 'Documents\JobHunter-przygotowanie\profil-propozycja.json'
$reviewSession = Join-Path $env:USERPROFILE 'Documents\JobHunter-przygotowanie\research-SESJA'
node --use-system-ca --import tsx scripts/public-research-review.ts --profile $proposal --approved-profile --session-dir $reviewSession
# Dopiero po zatrzymaniu researchu:
node --import tsx scripts/export-research-review.ts $reviewSession
```

`--use-system-ca` w Node 24 używa zaufanych certyfikatów Windows, zachowując
weryfikację TLS. Nie używamy `NODE_TLS_REJECT_UNAUTHORIZED=0`, proxy lub
osłabienia DNS/SSRF/izolacji. Nie zmienia to konfiguracji Gmaila. Odczyt
`TLS_UNTRUSTED` wymaga sprawdzenia łańcucha/zaufania, a nie wyłączenia kontroli.

Wspólny katalog sesji zawiera trwały budżet i blokadę procesu: 4 h od pierwszego
publicznego query, 30 tożsamości, 20 szkiców po pełnych kontrolach, 120 model
calls i 150 HTTP requests (także retry, błędy i przekierowania). Nie zmieniaj
katalogu/ID, aby odnowić budżet. Mały `smoke:public` zachowuje 5 firm/15 minut.
Limit tożsamości jest konserwatywny; nieudany odczyt nie liczy się jako
zweryfikowana analiza. Cache/replay nie jest świeżym pobraniem ani nową firmą.

Po konkretnej naprawie i kontrolowanym zakończeniu można użyć
`--resume-existing` z tym samym katalogiem, wyłącznie do wcześniejszych
tożsamości w pozostałym budżecie. `finish-research-review.ts KATALOG_SESJI`
domyka utrwalone kontrole/odczyty: publiczny HTTP jest technicznie niedostępny,
nie ma nowych firm ani generacji poprawiających tekst. Przed ponowną kontrolą
zachowuje pierwotne statusy; nie zamienia ich wstecz na PASS.

Eksporter wymaga zatrzymanego researchu, czyta SQLite tylko do odczytu,
kontroluje zerowe send/approvals/outbox/sesje AUTO i mapowania wersji/źródeł.
Prywatny `redactions.json` sesji może wskazać `emails` i `phones` kandydata do
zastąpienia jawnymi znacznikami. Wynik to osiem UTF-8 plików i LATEST w
`docs/research-review`. Publiczny eksport wymaga osobnej, jawnej zgody na
publikację firm/kontaktów/tekstów/faktów; użytkownik udzielił jej dla tej próby.
Nie publikuj SQLite, PDF, backupów, surowych logów lub konfiguracji logowania.
Po audycie staging ma być jawnie wybrany; commit/push kodu nie aktywuje sendera.

Aktualny pakiet: [LATEST](research-review/LATEST.md). Nie dowodzi gotowości
do rzeczywistego Gmaila ani całodziennej wysyłki.

## Praca i zasilanie — warunki runtime

Karta może być zamknięta, backend pracuje dalej. Komputer musi być włączony, backend uruchomiony, sieć dostępna. Ręcznie sprawdź uśpienie, zasilanie, aktualizacje/restart i łączność. Program nie zmienia zasilania, zapory, autostartu i nie pracuje podczas snu. Restart nie wznawia sendera, wybudzenie nie nadrabia serią. Stop blokuje nowe POST; przekazane dostawcy żądanie może zakończyć się później.

Wyniki macOS/CI i ograniczonej próby publicznej: TEST_REPORT. Fixture soak nie jest dobą Google. CI Windows nie potwierdza prywatnej instalacji domowej.
