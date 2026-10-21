# JobHunter — host Codexa i propozycja materiałów, 21.10.2026

Zrealizowano rozdzielenie zwykłego Node24 i lekkiego adaptera oraz lokalną
wersjonowaną propozycję materiałów. Krótki pełny przebieg w rzeczywistym
`cua_repl` zakończył się COMPLETED. Nie wykonano testu 8 h czasu rzeczywistego,
wdrożenia, prywatnej migracji/researchu, Gmaila, OAuth, SELF_TEST lub wysyłki.

## Pochodzenie i granice

Rzeczywista baza gałęzi: `66dbc9e23ac3c906faf6520e7c3b8fdf75d490ad`,
odczytana z origin/codex/windows-nightflow-fixes. Osobny detached worktree;
oryginalny checkout i wcześniejsze worktree pozostały bez aktualizacji.
Zachowano nowsze poprawki R14 i wcześniejsze R1–R13. Nie zmieniono migracji,
lockfile, progów Stop, rozmiaru fixture ani mechanizmu historii/kampanii.
Pełny końcowy SHA, URL, CI i testowany fingerprint są w metadanych dostawy.

Paczka wejściowa została rozpakowana poza repo i instalacją. Wszystkie 7 pozycji
manifestu przeszło kontrolę rozmiaru i SHA-256. Dokładny PDF odczytano lokalnie,
obejrzano jedną stronę i odnośniki; pliku nie zmieniano. Hashe prywatnego CV,
telefon, zdjęcie i propozycja materiałów nie są częścią publikowanego kodu.
Nie odczytano bieżącego profilu, bazy, WAL, poczty, tokenów lub prywatnych helperów.

## Implementacja A

- `browser-executor.mjs`: lekki punkt wejścia, adapter i ograniczone segmenty.
- `nightflow-node-owner.mjs`: właściciel Node z istniejącym withNightflow/
  NightflowCoordinator, providerami, Store, lockiem i planem. Polecenie
  `nightflow browser-owner` obsługuje zatrzymany owner; jawne --job zachowuje
  istniejące reguły resume. Fixture zawsze wymaga nowej historii syntetycznej.
- `browser/nightflow-host.ts`, broker/client: wąski lifecycle przez dotychczasowy
  uwierzytelniony IPC. Attach nie uruchamia planu. Klient przypina instancję,
  host workera/job/generację, a dostawy scope partii. Lease ma 45 s, jest
  kontrolowany przez owner i odnawiany tylko przez rzeczywisty adapter.
- `executor.ts`: dokładne wstawianie nowych linii przez dokumentowane klawisze
  i type. Kontrola body/PDF pozostała dokładna. Nie dodano retry/failover.
- `local-fixture-page.mjs` i dotychczasowy runner: ten sam owner/adapter dla
  Node/Playwright i rzeczywistego narzędzia, bez drugiego koordynatora.

Probe tej sesji wykazał brak globalnego process, obecność fs/net/timerów i
udokumentowanego tab. Import lekkiego wejścia przeszedł. Graf kodu i utrzymany
test AST wykluczają Store/SQLite/nodemailer/backend; nie wstrzykiwano globali.
[Oficjalna dokumentacja](https://learn.chatgpt.com/docs/browser?surface=app)
jest kontekstem, nie dowodem dostępności modułów w tej konkretnej VM.

| Poziom | Rzeczywisty wynik |
| --- | --- |
| Windows Node24 | Pełny check opisany w test-summary i TEST_REPORT; fikcyjne usługi i dane |
| Node/Playwright | 9/9 celowanych E2E po poprawce; pełny check ma oddzielny wynik UI |
| Rzeczywisty Codex/cua_repl | Pełne fazy → jedna rezerwacja → jedna lokalna akcja → COMPLETED → cleanup |
| Rzeczywisty host, Stop | ACK AUTHORITY_REVOKED, 0 akcji; MAY_BE_IN_FLIGHT/maintenanceReady=false |
| Utracony ACK po kliknięciu | 1 akcja, SEND_UNKNOWN/NEEDS_RESOLUTION, bez ponowienia |
| Utrata własnej karty | Przed akcją 0; po możliwym nadaniu SEND_UNKNOWN |
| Obcy batch/origin/odbiorca/body/PDF | Odmowa, 0 akcji |
| Stop po wygaśnięciu ownera testowego | STOP_UNCONFIRMED, current UNKNOWN; bez fałszywego potwierdzenia |
| Restart/sesja zmieniona podczas await/utracona odpowiedź Stop po mutacji | Osobne utrzymane testy prawdziwego Node IPC; nie nowy test restartu aplikacji Codex |
| 8 godzin rzeczywistego hosta | NOT_RUN; gotowy --wall-clock, bez harmonogramu lub obietnicy pracy po końcu zadania |
| Gmail, prywatny research i wdrożenie | NOT_RUN, poza autoryzacją zlecenia |

Dowody zawierają rzeczywiste UTC, monotoniczny czas, loadedCodeHash/build identity,
przerwę heartbeat, lease, próby, akcje i cleanup. Są oddzielone od danych materiałów.
Zwykły Node/Playwright nie jest podpisany jako host Codexa. Przyspieszony deadline
researchu w krótkiej fixture nie jest ośmioma godzinami czasu rzeczywistego.

## Implementacja B i prywatny wynik

Propozycja `materials-2026-10-21-v1` ma 15 faktów z provenance: strona/hash PDF
lub README przypięty do commitu. Cztery główne projekty; FixDesk osobno jako
opcja zachowująca DEFERRED. Kontakt jest faktem materiałowym, nie wyborem konta.
Dostępność pozostaje około 20 h zdalnie, bez dopisku o lekcjach i bez pełnego etatu.
Nie dopisano eksperckości, komercji, realnego klienta, produkcji lub oficjalnego
produktu instytucji. Telefon i zdjęcie nie trafiają do faktów ani podpisu.

Istniejący updateProfile przyjmuje opcjonalną provenance source. Mała operacja
stageProfileFact dodaje wyłącznie DRAFT w obecnej bazie/schemacie, odrzuca
duplikat i nierozstrzygnięte operacje, zmienia wersję/hash i odwołuje stare zgody.
Nie ma drugiego magazynu tożsamości lub parsera CV. Nowe dane nie są zatwierdzone
przez samo pochodzenie. Sęk i Forma ma własny klucz selektora i dopasowanie do
literalnego zadania strony/interfejsu; reszty wag nie zmieniono. Nazwa ze spacjami
i polskimi znakami podlega kontroli projektów. Linki są dokładnymi elementami
faktów, sprawdzanymi także w temacie, bez wildcardów GitHub/Sites.

Przygotowano prywatne: JSON propozycji, provenance/źródła, diff do udostępnionego
historycznego eksportu profilu v4, wejście updateProfile sprawdzone na NOWEJ
bazie oraz instrukcję późniejszego preview/apply. ID i wersja testowej bazy
nie są ID/wersją WORKSTATION. Żadnej propozycji nie zastosowano do produkcji.
Nie zmieniono profilu GitHub, repo portfolio ani ich widoczności. Odczyt
dokumentacji projektów nie oznacza uruchomienia ich funkcji lub publicznego demo.

## Regresje i pierwsze niepowodzenia

Końcowy pełny Windows check: **PASS**, 773/773 backend, 12/12 serial Stop,
typecheck/build, 26/26 UI, exit 0. Czas 860918,848 ms,
12:57:06.559–13:11:27.478 UTC. Niezmienione 229 plików, fingerprint
`05f32e4bc2414b554de9e6121142d1824ca5d555b1761e2660b695b8f9990265`.
To rzeczywisty stan przed commitem; zgodność bajtów z finalnym SHA oraz CI
sprawdza się niezależnie w metadanych dostawy. Testy mają osobne, syntetyczne
HOME/data, bez natywnych providerów. Nie zastępuje to testu 8 h hosta.

Nowe testy: `host-adapter.test.ts`, `current-materials.test.ts`. Utrzymane
material-scope/research-materials/library-refresh/batches/send-authority oraz
browser-delivery/crash/control-failures obejmują niezmienne dawne wersje/MIME,
nowe CV bez dziedziczenia zgody, zmianę materiałów podczas await/Start,
odwołanie starego bindingu, historię/limity/blokady i R14. Nie kasowano rekordów.

Pierwsze odtworzenia i korekty są zachowane w verification-history:

1. Rozdzielony CLI miał cykl importu lokalnej strony; wydzielono prosty serwer.
2. Realny multiline fill wstawił dodatkowe newline: kontrola odmówiła, 0 akcji.
   Próbę pressSequentially ograniczył host; użyto szybkiego dokumentowanego type
   z Shift+Enter, bez osłabienia porównania lub ponowienia kliknięcia.
3. Nowe testy miały niekompletną syntetyczną treść schematu oraz regex grafu
   trafiający w komentarz/tekst DOM. Poprawiono fixture i zastosowano AST.
4. Pierwsza seria E2E miała 8/9: dawny adapter oznacza ready=false po jednorazowym
   użyciu. Nowy jawny leaseValid jest sprawdzany tylko dla implementującego go
   remote hosta, bez zmiany dawnego kontraktu ready. Kolejna seria 9/9.
5. Pierwszy pełny Windows check: PASS 773/12/26, lecz checkout zawierał CRLF
   inne niż bloby Git. Końcowa kontrola została powtórzona na dokładnych bajtach
   commitu; dwa historyczne pliki zachowały własne oryginalne CRLF. Wczesny
   przebieg normalizacji przerwano przed wynikiem, nie podpisano go jako PASS.
6. Pierwsza atrapa utraty ACK w narzędziu nie przekazała wszystkich metod tab,
   więc skończyła się przed akcją. Poprawiony wrapper dał faktyczne kliknięcie
   i SEND_UNKNOWN. Obie próby są rozróżnione w dowodach.

Nie ustalano ponownie bez nowych danych historycznej przyczyny timeoutu CLI
30 s. Zachowano limit, diagnostykę, rozmiar fixture i progi Stop.

## Przed późniejszym wdrożeniem i Start

Potrzebne są: potwierdzony Stop, koniec operacji i zamknięty backend; spójny
backup; wybrany SHA/build/doctor; dopuszczony preview aktualnego profilu i
historia bez obejścia SENDING/SEND_UNKNOWN; jedna zgoda na konkretny pakiet
faktów i nowy asset CV; zgodność rzeczywistego konta/From/Reply-To/podpisu;
plan i polityka kontaktów, reguły wyboru, tempo, limity lub jawny brak limitu,
okno oraz rozstrzygnięcie wcześniejszego checkpointu; wymagany długi test hosta
i osobno dopuszczony pilot. Dopiero świadomy Start. AUTO_POLICY nadal nie
wymaga akceptacji każdego zgodnego pierwszego maila. Push kodu nie wdraża.
