# Rdzeń po diagnostyce — lokalna implementacja 18.10.2026

Punkt odniesienia: `f37afc077c0d7c80f231ef0e9ad2f4dcac17363c`.
Implementację zakończono lokalnie na `codex/core-completion`, bez publikacji
i deploymentu. Późniejsze osobne zlecenie obejmuje commit/push i ograniczony
eksport biblioteki: [AI_REVIEW](AI_REVIEW.md). Nie obejmuje deploymentu.
Sam HEAD nie identyfikuje tego stanu: raport poza repo zawiera manifest SHA-256
zmienionych i nowych plików oraz pełny diff. Wyniki: [TEST_REPORT](TEST_REPORT.md).

## Źródła, tożsamość i prawo wysyłki

Właściciele nazwy, klucza i domeny są rozstrzygani przed mutacją. Nie ma
automatycznego łączenia po domenie nadrzędnej ani skrzynce. Parser 3 zachowuje
etykietę po adresie i odrębne strukturalne konteksty kontaktów. `completeness`
obejmuje limity tekstu HTML/plain text, głębokości, liczby adresów i kontekstu.
Niepełne źródło nie jest dowodem uprawniającym do kontaktu.

Autorytet publikacji wynika z oficjalnego hosta, zweryfikowanego aliasu albo
literalnego odesłania firmy do konkretnego adresu ATS/agencji. Domena skrzynki
i nazwa na katalogu nie wystarczają. GENERAL pozostaje GENERAL. Stary parser
wymaga rzeczywistego ponownego odczytu. Nowe wersje źródła mają osobne rekordy,
także przy identycznych bajtach i innym parserze lub wyniku kompletności.
Dotychczasowe ID, źródła, daty historycznych wersji i MIME pozostają zachowane.

Ręczny sender i AUTO współdzielą odwoływalne prawo w pamięci oraz generację.
Stop/Pauza odwołują je przed SQLite. Zgoda po oczekiwaniu na konto sprawdza
generację ponownie. Własność profilu jest kontrolowana przed rezerwacją i
przed przekazaniem akcji transportowi. Zdalna akcja już przekazana może
zakończyć się później; brak ślepego retry, failover i obietnicy exactly-once.

## Wspólny lifecycle researchu

`ResearchSessionController` otacza natywne `startDay`/`tick`, bez drugiego
schedulera researchu. Panel, research biblioteki w AUTO i `research:session`
korzystają ze wspólnego lifecycle. Guard działa przed pracą, okresowo i na
końcu. Snapshot jest krótką transakcją odczytu; kontrola zatwierdzonych plików
jest osobnym adapterem, porównanie czystą funkcją. Baseline pozostaje stały.

Jednorazowa mutacja NULL → domena ma atomowy zapis aliasu i niezmiennego
zdarzenia z operacją kwalifikacji, wersją, firmą, literalnym źródłem, hashem,
parserem i weryfikacją. Dowód można czytać wielokrotnie i po upływie 24 h;
aktualność kontaktu sprawdza się osobno przed użyciem. Pusty string wymaga
odrębnej jawnej ścieżki przeglądu, nie ogólnego warunku falsy. Guard niczego
nie cofa ani nie naprawia automatycznie.

Powiązanie bieżącego szkicu z zakresem może przejść do nowego zakresu tylko
przy nowej, zgodnej wersji w `draft_versions` i polityce zatwierdzonej przed
baseline sesji. Dawne wersje i powiązania runów pozostają niezmienne. Samo
przestawienie zakresu, regres wersji lub brak zgodnego rekordu blokują guard.

Tożsamość kodu jest zapamiętana przy wczytaniu modułów. Manifest builda ma
oddzielny identyfikator i hash drzewa. Bieżący HEAD nie zastępuje tożsamości
uruchomionego procesu; Start/Stop LOCAL_ONLY nie wymagają Gita.

Deadline nie jest odnawiany. W długiej sesji TIME_BUDGET zamyka cykl z
checkpointem i ograniczonymi odłożeniami, pozostawiając harmonogram do pierwotnego
terminu. Stop, utrata locka, guard, CODEX_LIMIT, READER_ENVIRONMENT i deadline
sesji zatrzymują pracę. Raport rozdziela powód, kontrole guarda i etapy cleanup;
czas zamknięcia procesu trzeba ustalić niezależnie od zapisu FINISHED.

Jawny `reader-probe` działa tylko przy zatrzymaniu/pauzie. Ograniczone odczyty
2–3 niezależnych publicznych hostów zachowują TLS/SSRF/timeout/limity. Udany test
usuwa zatrzaśnięcie, lecz nie uruchamia ani nie wznawia sesji. Stop przerywa probe.
Restart pozostaje zatrzymany; jawne wznowienie korzysta z tego samego deadline
i baseline. Wygasłe sesje są odrzucane.

Syntetyczny przykład poza repo, bez poczty, modelu i publicznego HTTP:

```powershell
npm run research:session -- --fixture --data-dir "$env:TEMP\JobHunter-fixture-nowa" --start --hours 8 --steps 3 --advance-ms 960000
```

Bez `--fixture` CLI wymaga jawnie wskazanego istniejącego WORKSTATION. Ten
przykład ani dokumentacja nie udzielają zgody na taką rzeczywistą operację.
Nie wskazywać prywatnego katalogu, nie kopiować markerów ani prywatnych helperów.

## Planowanie i pomiary

DISCOVERY, REFRESH i REUSE są przeplatane w przetwarzaniu; odłożenia zachowują
wiek i mają ograniczone ponowienia. Aktualny cache nie powoduje HTTP. Raport
podaje etapy, czas kategorii, nowe/znane firmy, HTTP/cache/bajty, odłożenia,
powody i budżety. Tokeny pochodzą z `model_calls`; cached input jest częścią
input, nie dodatkowym kosztem. Brak wyceny API. Nie ekstrapolować pomiarów
syntetycznych na osiem godzin rzeczywistej pracy.

## Audyt snapshotu

```powershell
npm --silent run audit:library -- --snapshot "D:\Backup\wybrana.sqlite" --provenance "D:\Backup\wybrana.sqlite.provenance.json" --output "D:\Audyt\nowy-raport.json"
# Opcjonalnie: --before "D:\Backup\przed.sqlite" --before-provenance "D:\Backup\przed.sqlite.provenance.json"
```

Audytor nie szuka baz, nie otwiera profilu aplikacji i nie używa Store,
migratora ani restore. Wymaga manifestu `schema=1`, `method=VACUUM_INTO` lub
`SQLITE_BACKUP`, `createdAt` ISO, `sha256` pliku, `standalone=true`. Natywny
backup dopisuje taki manifest. Nie dopisywać go do znalezionej starej kopii
na podstawie samego integrity_check. Inne formaty wymagają potwierdzonego
mapowania pochodzenia, nie domyślnie przyjętej deklaracji uwzględnienia WAL.

`--silent` jest częścią bezpiecznego wywołania przez npm: usuwa jego nagłówek
z argumentami. Bezpośrednie `node --import tsx scripts/audit-library.ts ...`
również zwraca tylko walidowany raport albo ustalony kod błędu.

Hash i brak sidecarów są sprawdzane przed utworzeniem izolowanej roboczej
kopii. Oryginalny wskazany snapshot nie jest zapisywany. Nieobsługiwany schemat
jest ograniczeniem. Bez kopii „przed” nie ma deklaracji braku usunięć.
Porównanie kopii wykorzystuje ten sam czysty guard; `protectedDifferences`
liczy kategorie naruszeń, nie rekordy i nie ujawnia ich zawartości.

Wyjście zawsze ma `scope=SNAPSHOT_ONLY` i
`production_readiness=NOT_ESTABLISHED`. Ścisły schemat jest sprawdzany przed
stdout i plikiem: ustalone liczniki, booleany, kody, wersje oraz najwyżej 20
pseudonimów anomalii. Bez nazw, adresów, URL, oryginalnych ID, ścieżek, cytatów,
wiadomości, zwykłych hashy emaili lub profilu. Błędy CLI zwracają wyłącznie
ustalony kod. Raport nie nadpisuje wejścia ani istniejącego pliku.

W tej implementacji prywatny audyt **niewykonany**: nie wskazano konkretnego
backup-u z jawnym dopuszczeniem odczytu. Testy używają wyłącznie syntetycznych kopii.

## Odnowienie szkiców i zamknięta partia

Panel AUTO: „Otwórz bibliotekę i partie”. Research biblioteki działa bez
uprawnienia sendera. Lista rozdziela zapisane szkice i datowane kontrole wersji.
Wybrane szkice można rzeczywiście odczytać i ponownie zakwalifikować w
ograniczonej operacji (do 10 szkiców, do 6 źródeł na pozycję). Poprawny tekst
jest zachowywany przez dotychczasową ścieżkę `revalidateSameText`; nowe wersje
nie zmieniają dawnych `draft_versions`, MIME ani prób. Odnowienie nie nadaje zgody.

Przygotowanie partii zamyka skład do wskazanych wersji. Wiąże odbiorcę,
kontakt, payload, materiały, profil/CV, nadawcę, politykę, zakres, tempo i limity.
Nie tworzy rezerwacji ani próby. Zatwierdzenie podsumowania i osobny Start
wystarczają dla zgodnych pozycji; bez akceptacji każdego maila. Partia nie
odkrywa firm i nie dopisuje nowych rekordów biblioteki.

Każda pozycja przechodzi aktualne bramki istniejącego sendera. Odświeżenie
niezmienionego dowodu ma ograniczony zakres; zmiana materiałów lub wersji
wymaga ponownego przygotowania i zatwierdzenia. Linki `auto_batch_outbox`
zachowują także stare/anulowane pakiety. Rzeczywisty wynik i wykorzystanie
wynikają nadal z outbox/send_attempts/usage_ledger, nie drugiego rejestru.
Limit partii obejmuje wcześniejsze sesje i dni; dzienny limit pozostaje
związany ze strefą kampanii. Po wznowieniu nie ma nadrabiania lawiną.

Stop/restart odwołuje sesję. Jawny Start pozostałych pozycji tworzy nowe
prawo sesji bez zerowania wykorzystania. SENDING/SEND_UNKNOWN blokują ponowienie;
reconcile sprawdza istniejącą próbę. Końce rozróżniają COMPLETED,
COMPLETED_WITH_SKIPS, NEEDS_REPREPARATION oraz NEEDS_RESOLUTION. Zwykły ciągły
AUTO zachowuje dotychczasową semantykę i brak ukrytego limitu kampanii.

## Panel, browser i wydajność

Historia firm i biblioteka mają paginację SQL, filtrowanie/sortowanie i
szczegóły po ID. Nie ma slice po pobraniu całej historii w endpointach list.
Dashboard nie ocenia przy każdym pollingu całej biblioteki i nie wykonuje
PRAGMA zdrowia; pokazuje czas ostatniej kontroli. Kontrola po migracji,
otwarciu aplikacji i świeża przed Start pozostaje.

`/api/performance` rozdziela przygotowanie SQL, wykonanie SQLite/drivera,
materializację/reguły JS, serializację, kontrolę zdrowia i opóźnienie pętli
zdarzeń. Native driver konwertuje wiersze podczas wykonania SQL; ten koszt
pozostaje uczciwie w `sqlDriverMs`, a nie w zmyślonym osobnym pomiarze silnika.
Latencja Stop jest mierzona osobno od budowy listy; progi nie zostały poluzowane.

IPC rozróżnia zamknięty backend, zmianę sesji, lease, protokół i niepewny wynik.
Zachowuje liczbę ukończonych prób. `BrowserBatchController` utrzymuje przypięty
backend/sesję/partię oraz odnawialne odcinki do 60 sekund. Nie przejmuje nowej
sesji i nie ponawia kliknięcia/POST. Szczegóły: [GMAIL_BROWSER](GMAIL_BROWSER.md).
Rzeczywista ciągłość hosta Codexa przez całą partię pozostaje **nieweryfikowana**;
zamknięcie Codexa nie utrzymuje wykonawcy i nie przełącza transportu.

## Późniejsza aktualizacja, dopiero po osobnym zleceniu

1. Stop → zakończenie operacji, także przekazanych już dostawcy → zamknięcie
   własnych procesów i zwolnienie profilu. Nie aktualizować aktywnego sendera.
2. Spójny backup SQLite obejmujący WAL poza repo; kontrola integralności/FK,
   manifest/hash, kopia materiałów według istniejącej procedury. Nigdy sam
   aktywny plik SQLite bez WAL. Nie tworzyć zastępczej pustej historii.
3. Wybrana wersja kodu i zgodność schematu → zależności z lockfile → build,
   check i doctor w zatrzymanym środowisku. Zachować pełną historię, cutoff,
   blokady, wersje, MIME, liczniki i próby niepewne.
4. Kontrolowana migracja z backupem → kontrola danych i narzędzi na właściwej
   instalacji → uruchomiony backend z sesją **zatrzymaną**.
5. Osobna ocena wybranej partii, aktualne dowody i celowana historia, materiały,
   nadawca, zakres i tempo → dopiero świadomy Start dopuszczonego pilota.

Rollback preferuje poprawkę naprzód. Powrót kodu wymaga zgodności schematu.
Po rzeczywistych nowych wysyłkach nie wolno zastąpić autorytatywnej bazy starszą
kopią i zgubić późniejszych prób. Restore służy nowemu katalogowi i pozostawia
wszystkie uprawnienia odwołane oraz porzucone SENDING jako SEND_UNKNOWN.
