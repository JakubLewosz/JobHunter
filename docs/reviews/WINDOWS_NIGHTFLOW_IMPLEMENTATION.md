# Windows/Codex nightflow — implementacja w nocy 18/19.10.2026

Status: **WIP — CI FAILURE i nieweryfikowany rzeczywisty host Codexa;
NIEGOTOWE DO RZECZYWISTEJ KAMPANII**.
Kod i pełny przebieg są sprawdzane syntetycznie. Brakujący dowód utrzymania hosta
opisano jako `NIEWERYFIKOWANE_UTRZYMANIE_HOSTA`; ustawienia i wdrożenie produkcyjne
pozostają osobnym, świadomym działaniem użytkownika.

Baza: `40850745d5677cf411072d2798a56034e3ec9873`, gałąź
`codex/windows-nightflow-fixes`. Osobny worktree, Node 24, wyłącznie dane
syntetyczne. Kod nie został wdrożony na WORKSTATION. Nie uruchamiano prawdziwego
researchu, modeli, Gmaila, OAuth, rzeczywistego SELF_TEST ani wysyłki. Nie otwierano prywatnej bazy,
CV, poczty, sekretów lub wcześniejszych prywatnych helperów.

Przeczytano cały `JobHunter_PROMPT_WINDOWS_NOC_R1-R13.md` z Downloads.
Dostępny ZIP `JobHunter-core-completion-40850745d5677cf411072d2798a56034e3ec9873.zip`
sprawdzono pod kątem ścieżek i wypakowano do nowego katalogu. Zawierał źródła,
lecz nie deklarowany katalog `JobHunter_review_40850745` ani jego raport/harnessy.
Scenariusze odtworzono z pełnego promptu i repozytorium, bez kolejnego eksportu.
Historyczne publiczne snapshoty pozostają niezmienione.

## Naprawy

| ID | Zmiana | Utrzymywane regresje |
| --- | --- | --- |
| R1 | `saveSource` wersjonuje również `final_url`; migracja 026 rozszerza klucz wersji. Historyczny dowód zachowuje URL i referencje. | `domain-protection`: legalne uzupełnienie, zmiana ścieżki z identyczną treścią, powtarzany guard, wiek, zmieniony dowód/alias/właściciel, rollback. |
| R2 | Parser 4 przechodzi przez neutralne etykiety do nagłówka wspólnego działu, także w zagnieżdżeniach/listach/tabelach. | `contact-html`: parser → fikcyjny HTTP → zapis → kwalifikacja → AUTO, wspólne faktury, oba adresy, nagłówek po adresach, niezależny HR, konflikty i zero akcji. |
| R3 | Kontekst odesłania pochodzi z linku lub lokalnej jednoznacznej etykiety. Stopka ani sąsiedni link nie dają autorytetu. | `source-safety`: wykonawca/privacy/social/partner, tekst rekrutacji poza linkiem, jawny ATS i lokalne „Rekrutacja: tutaj”. |
| R4 | Oba Starty i bramki sendera widzą zajętość odnowienia. Trwały znacznik przerwanego odnowienia blokuje dawny PASS; operacja ma własną generację. | `library-refresh`: zatrzymana Promise, oba Starty, drugi caller, Stop, brak zgód/rezerwacji/POST, udane ponowne odnowienie i świadomy Start. |
| R5 | Zakres backend/session/batch/generation przechodzi przez kontroler, klienta i atomowe claim/authorize/check. Ręczny wariant ma jawny MANUAL. Sygnał sprawdzany po await i przed akcjami/UI/uploadem. | `browser-delivery`, `browser-crash`, `browser-batch-controller`, Playwright: pełne IPC, zmiana zakresu, lease/restart, abort attach/claim/prepare/authorize/check/upload/final click, pełny payload i niepewność. |
| R6 | Wznowiony item zachowuje pierwotny klucz odłożenia, wiek i próby. Zakończenie rozlicza pierwotny wpis; pobranie go nie usuwa. | `research-night`: timeout przed tożsamością → pusty search → ukończenie, pięciopozycyjny backlog, zachowane terminy i historia. |
| R7 | Partia uzgadnia cudze próby z jedną wspólną historią, także po własnym anulowanym pakiecie. Kontakt z innej partii daje SKIPPED, a nie własne SENT. Niepewność pozostaje UNRESOLVED. | `closed-batch`: dwie partie tego samego szkicu, własny CANCELLED i późniejsza cudza wysyłka, wyczerpanie z pominięciem, brak nowej próby; restart, limity i niepewność. |
| R8 | Audytor obsługuje 20–27 bez Store/migracji wejścia. Braki metadanych są NOT_RECORDED; porównanie migracji zachowuje stare wartości wspólnych kolumn. | `library-audit`, `core-migrations`: zapełnione 20 → 27, liczniki, niezmienione wejście, wykrycie usunięcia/zmiany; brak domyślnego PASS dla starego parsera. |
| R9 | Preflight pod blokadą używa transakcji readonly oryginalnego SQLite z WAL, przed Store. Błąd odczytu jest odrębny od złego markera. | `library-audit` + własny proces `wal-marker-child`: true/false wyłącznie w WAL po crash, false ma pierwszeństwo; zła baza bez migracji/zmian danych. |
| R10 | API wybiera najnowszą ofertę spełniającą filtr; UI nie odfiltrowuje ponownie stron wybranych przez SQL. Szczegóły nadal zawierają starsze oferty. | `library-pagination`: API/total/page z dwiema ofertami, domena, starszy pasujący wynik; Playwright AUTO wyszukuje po domenie. |
| R11 | Resolver używa rzeczywistego `npm_execpath` lub istniejącego npm z PATH, niezależnie od lokalizacji Node. | `cli-tools`: prawdziwe `--silent`, brak argumentów w stdout, ścieżki ze spacjami i polskimi znakami. |
| R12 | Nowa seria Windows ma zachowane progi i pełne 10k. Dodano jawny seed, reception/revoke/delta/HTTP i liczbę nowych POST po revoke, oddzielając fazy requestu. | `test:performance`: 12/12 PASS (pierwsza ukończona seria), 3 × 4 scenariusze. Maks. reception 151,12 ms, delta revoke 0,57 ms; zero nowych POST po revoke. Historyczna przyczyna Linux 1154 ms pozostaje nieustalona. |
| R13 | Wyłącznie zakończony `SELF_TEST/SENT_CONFIRMED` nie blokuje odnowienia. FIRST_CONTACT i stany oczekujące/niepewne/SENT_PROVIDER nadal blokują. | `library-refresh`: macierz rodzaj × status; osiem SELF_TEST przez pełny fikcyjny provider, potem odnowienie i porównanie bajtów MIME/wersji/prób/liczników/zgód. |

Wersja parsera jest jedna: **4**. Nie zmieniano dat/statusów/parsera dawnych
rekordów masowym UPDATE. Nie zmieniano generatora ani MESSAGE_STYLE.

## Koordynator

`NightflowCoordinator` oraz `withNightflow` korzystają z istniejących
`AutoPolicyJobHunter`, `refreshLibraryDrafts`, `ResearchSessionController`,
`startLibraryResearch`, `prepareBatch`, `startBatch` i `dispatchOne`.
Jeden proces posiada jedną blokadę profilu i Store; frontend nie jest potrzebny.

Trwałe stany: PREPARING → REFRESHING → RESEARCHING (gdy plan dopuszcza discovery)
→ VALIDATING → CLOSING → WAITING_WINDOW → SENDING → stan raportu.
COMPLETED, PAUSED, STOPPED i NEEDS_RESOLUTION pozostają różne. Zapis obejmuje
job/plan/version/session/batch, pierwotny deadline i koniec wykonania, checkpoint,
generację oraz tożsamość załadowanego kodu. Zachowane outbox/send_attempts/usage
są jedynym rejestrem prób i wykorzystania.

Plan jest niezmiennym, wersjonowanym rekordem zgody na reguły przyszłego wyboru,
z bindingiem instalacji, zatwierdzonego profilu/faktów/CV, nadawcy, polityki
i transportu. Nowa wersja używa nowego ID. Brak limitu wymaga jawnego wyboru
`unlimitedExplicit`; brak pola nie oznacza zgody. Maksymalna liczba pozycji
dotyczy zamkniętej partii, nie końca zwykłego ciągłego AUTO.

`auto_batch_plan_grants` zapisuje pochodzenie partii z zatwierdzonego planu.
Koordynator nie wywołuje `approveClosedBatch` jako człowiek i nie ustawia
`auto_batches.approved_at`. Aktywacja wymaga również bieżącej generacji w pamięci.
Ręczne zatwierdzanie konkretnej partii pozostaje osobną ścieżką.
Partia, pochodna zgoda i job.batch_id są zapisywane w jednej transakcji.
Przerwanie wewnątrz transakcji cofa całość; awaria po commit zachowuje jedno
powiązanie i pozwala jawnie wznowić tę samą partię.

Najpierw istniejące szkice. Zgodne źródła współdzielą rzeczywisty odczyt tylko
w granicach operacji i zgodnego URL/tożsamości/parsera/hashu/czasu. Poprawny tekst
przechodzi dotychczasową kontrolę `revalidateSameText`. Wybór obejmuje materiały
bez problemów, udokumentowane dopasowanie, zweryfikowany rodzaj kanału i stabilny wiek/ID; jedna firma i
jeden odbiorca w partii. GENERAL nie jest podmieniany na rekrutację. Dalsza firma
nie zostaje dopisana po zamknięciu listy.
Do wyboru trafiają ukończone kontrole tej fazy lub ukończone pozycje jej researchu.
Deadline w trakcie odnowienia zachowuje gotowy podzbiór i pozostałą bibliotekę;
nie wykorzystuje dawnego PASS nieukończonej części. WAIT_DEADLINE dotyczy także
wyczerpania samej biblioteki bez discovery.

Stały guard fazy biblioteki obejmuje również odnowienie przed discovery.
Wynik researchu wymaga zgodnych ID/deadline, końcowego guarda i prawidłowej
przyczyny DEADLINE/NO_NEW_QUERIES. Sam timer/exit 0/STOPPED nie wystarcza.
Nieukończone pozycje pozostają odłożone. TIME_BUDGET jednego cyklu nie przesuwa
deadline. Prawidłowo zakończona faza ma jawne przekazanie do części wysyłkowej.

Stop odwołuje generację przed zapisem, przerywa dzieci, a każdy await ponownie
sprawdza prawo i binding. Finalne bramki kontrolują także okno po oczekiwaniu
na historię/konto. Restart/restore pozostawiają zadanie zatrzymane. Resume
zachowuje deadline, partię, próby i limity. Poprawnie zakończony, zapisany
checkpoint researchu może wznowić pozostałą kontrolę/zamknięcie nawet po jego
deadline, bez ponownego researchu. Niezakończony research po deadline wymaga
nowego świadomego zadania. Zmiana kodu odrzuca Resume starego wykonania;
nie wydłużamy terminu pod tą nazwą. SEND_UNKNOWN wymaga celowanego rozstrzygnięcia.

## Obsługa przez Codex

Demonstracja w nowym katalogu, komplet fikcyjnych providerów, bez publicznego
HTTP/modelu/poczty i bez prawdziwego Gmaila:

```powershell
npm --silent run nightflow -- fixture --data-dir "$env:TEMP\JobHunter-nightflow-nowy"
```

Komenda jest oczekującym procesem: osiem godzin researchu na przyspieszonym zegarze,
odnowienie/kontrola/partia/fikcyjna wysyłka/raport. Test `cli-tools` uruchamia ją
w osobnym rzeczywistym procesie i sprawdza wynik oraz zwolnienie blokady/IPC.

Po przyszłej konfiguracji i osobno wykonanej aktualizacji WORKSTATION:

```powershell
npm --silent run nightflow -- preflight --workstation --data-dir "<PROFILE>" --plan "<PLAN_VERSION_ID>"
npm --silent run nightflow -- plan --workstation --data-dir "<PROFILE>" --file "<PLAN.json>" --confirm-selection-rules
npm --silent run nightflow -- start --workstation --data-dir "<PROFILE>" --plan "<PLAN_VERSION_ID>"
npm --silent run nightflow -- status --data-dir "<PROFILE>"
npm --silent run nightflow -- stop --data-dir "<PROFILE>"
npm --silent run nightflow -- resume --workstation --data-dir "<PROFILE>" --plan "<PLAN_VERSION_ID>" --job "<JOB_ID>"
npm --silent run nightflow -- report --data-dir "<PROFILE>"
```

To przykłady przyszłego użycia, nie zgoda na ich rzeczywiste wykonanie.
Preflight bez planu zwraca jedną listę wymagań i bezpieczny kontekst bindingu.
Status/Stop/raport działają przez prywatny uwierzytelniony IPC tego samego
właściciela. Po zamknięciu procesu status/raport odczytuje zapis readonly,
bez migracji lub nowego sendera. Tokeny nie występują w argv/stdout/raporcie.
Zabezpieczenia HTTP Host/Origin/CSRF pozostają zachowane.

## Host browser: implementacja i brak dowodu

`ActiveTaskNightflowBrowserHost` przyjmuje jawny taskId i istniejący uchwyt tab.
`scripts/browser-executor.mjs:runNightflowTask` łączy oczekujący koordynator
z tym adapterem w jednym aktywnym wywołaniu. Nie ma zgadywanego wake API,
czytania prywatnej bazy rozmów, cookies, CDP, demona ani fallbacku transportu.
Klient probe nie daje prawa claim; po Start obowiązuje konkretny zakres partii.
Heartbeat działa już od initialize, także podczas researchu. Close/Stop/błąd
kończą timer i zwalniają własny lease. Utrata backendu odwołuje nadrzędne zadanie;
stary klient nie przełącza się na nowy backend. Test realnego IPC obejmuje
960 odnowień przez osiem godzin kontrolowanego zegara oraz natychmiastowe
zwolnienie dla nowego jawnego wykonawcy. Nie jest to osiem godzin czasu ściennego.

Syntetyczny Playwright sprawdza cały adapter → koordynator → istniejący sender
→ IPC → fikcyjne UI. To wdrożone połączenie kodu. **NIEWERYFIKOWANE_UTRZYMANIE_HOSTA**:
nie sprawdzono utrzymania takiego wywołania i tab przez osiem godzin na rzeczywistym
hoście Codexa. Zwykła komenda terminalowa nie otrzymuje uchwytu browser; CLI
odrzuca browser bez adaptera. Wymagany aktywny punkt wejścia w zadaniu Codexa.

Sprawdzono lokalne `codex --help`, `codex exec --help`, `codex queue --help`.
Nie uruchamiano modelu ani wysyłania wiadomości przez queue. Samo istnienie queue
nie dowodzi utrzymania uchwytu browser. Oficjalne [zadania harmonogramowe](https://learn.chatgpt.com/docs/automations?surface=app)
są odrębną konfiguracją; w tym zadaniu nie tworzono harmonogramu/autostartu.

## Migracje i zachowanie danych

026: addytywne wersjonowanie przekierowań przez przebudowę tabeli źródeł bez
zmiany starych wartości/ID. 027: plany, zadania i pochodzenie zgody partii.
001–025 pozostają niezmienione. Testy porównują zawartość, nie tylko liczniki:
zapełnione schematy 20 i 25 → 27, źródła, powiązania, wersje, materiały, MIME,
próby, blokady i wykorzystanie. Zachowano test przerwanej migracji z rollbackiem,
spójny backup WAL oraz restore do nowego katalogu z odwołanym prawem.

Stary manifest 69 plików zweryfikowano względem `bfbbc630f11bd02da1b00bdaf5d089af38835838`:

```powershell
node scripts/verify-historical-manifest.mjs --ref bfbbc630f11bd02da1b00bdaf5d089af38835838 --manifest docs/ai-review/validation/tested-core-files.json
```

PASS oznacza wyłącznie historyczne bajty. Użycie 40850745 wykryło różny
package.json, zgodnie z późniejszym rozszerzeniem eksportera. Dawnego manifestu
nie poprawiano nowymi hashami. Finalny check ma nowy, oddzielny manifest kodu.

## Weryfikacja końcowa

Pierwszy pełny Windows check: 709/710 backend, exit 1, bez uruchomionego
serial benchmarku/build/UI. Oryginalny test sesji wykrył rekurencyjny finalize
przy powtórnym błędzie guarda; zabezpieczono reentrancy, bez zmiany jego asercji.
Drugi check przerwano po przeglądzie lifecycle heartbeat, przed zmianą kodu.
Trzeci pełny check: **PASS, exit 0**, Windows 10.0.26300 x64, Node 24.19.0,
npm 11.17.0, SQLite 3.53.4. Rzeczywiste `npm run check`: typecheck,
**721/721 backend**, **12/12 serial Stop**, build i **22/22 Playwright**.
Brak skipped/cancelled w obu zestawach backendu. Czas 681,713 s, od
2026-10-18 22:00:59.163 UTC do 22:12:20.876 UTC (noc 18/19.10 w Polsce).
Fingerprint kodu przed/po jest identyczny:
`8ae15067784be0fea94c78653826e80d1b43fdfc07454e6435515e717b2d4e63`.
[Metadane](windows-nightflow-evidence/test-summary.json),
[manifest kodu](windows-nightflow-evidence/source-files.json),
[pierwsze niepowodzenie i kolejne próby](windows-nightflow-evidence/verification-history.json).
Metadane zachowują prawdziwe `UNCOMMITTED_WORKTREE` i bazowy HEAD podczas testu;
pakiet porównuje każdy testowany plik z bajtami finalnego commitu. Później
uzupełniono tylko dokumentację/dowody, bez zmiany testowanego kodu.
Jedyny zastany SVG miał CRLF w testowanym checkoutcie Windows; w commicie
zachowano dokładnie te bajty (bez zmiany grafiki), aby wszystkie 216 plików
manifestu zgadzało się z archiwum. Weryfikacja indeksu wykryła tę różnicę
przed publikacją; nie podmieniano hashy manifestu.

[Pełne pomiary Stop](windows-nightflow-evidence/stop-measurements.json)
zawierają wszystkie trzy powtórzenia każdego scenariusza, osobno reception,
revoke, delta, HTTP, seed, SQL/prepare, materializację/reguły, serializację,
health i event-loop. Reception 41,97–151,12 ms (próg <1000), delta
0,14–0,57 ms (próg <100), HTTP 51,03–228,14 ms; wszystkie statusy 200,
zero nowych POST po revoke. Pełna fixture dużej historii: 10035 firm,
synchroniczny seed 2993,55–3354,79 ms przed oknem pomiaru. Wcześniej przyjęty
fikcyjny POST kończył się po revoke (325,36–343,44 ms od żądania); nie był
nową akcją. Jest to pierwsza ukończona osobna seria tej implementacji,
bez zmiany progów, zmniejszenia fixture lub powtarzania do zielonego.

Pierwszy Windows CI dla `894ab95362842c4efc9f20e2b85cb8925f9a4c7d`:
**FAILURE**, [run 39171469775](https://github.com/JakubLewosz/JobHunter/actions/runs/39171469775),
job 117805244708. Instalacja/Chromium PASS; krok `npm run check` zakończył się
exit 1 po 15 min 44 s (22:17:07–22:32:51 UTC). Dostępna publiczna adnotacja
podaje wyłącznie „Process completed with exit code 1.”, bez nazwy testu.
Brak artefaktów. [Oczyszczony zapis](windows-nightflow-evidence/ci-first.json).
Przyczyna: **UNKNOWN_LOGS_UNAVAILABLE**, nie uznajemy jej za naprawioną:
REST logów zwraca 403, interfejs wymaga „Sign in to view logs”, a połączone
narzędzie GitHub nie jest dostępne w tej sesji. Nie szukano tokenów, nie
zmieniano dostępu ani progów i nie ponawiano samego joba do zielonego.

Dokładny następny krok: odczytać log istniejącego joba 117805244708, krok
`npm run check`, przez autoryzowany dostęp; wskazać pierwszą błędną asercję,
odtworzyć ten scenariusz syntetycznie, naprawić i wykonać wymagane kontrole.
Nie zlecamy nowego ogólnego audytu lub eksportu biblioteki. Dopisanie tego
raportu nie zmienia testowanego kodu. Ewentualny automatyczny CI dla commitu
samej dokumentacji nie jest dowodem naprawy przyczyny pierwszej porażki.
Stan CI finalnego SHA jest raportowany osobno w `review/ci.json` paczki;
lokalnego PASS nie podstawiamy jako wyniku CI.
Celowane odtworzenia obejmują prawdziwe klasy usług/IPC, osobny proces CLI,
crash własnego SQLite writer, fikcyjny browser i przyspieszony zegar.
Historyczne niepowodzenia i naprawy fixture pozostają opisane w TEST_REPORT.

## Przed rzeczywistym użyciem

Jedna lista do zatwierdzenia: autorytatywna instalacja/historia; konkretne wersje
profilu/faktów/CV/nadawcy i transport; zakres firm/rodzaje kontaktów; czas
researchu, discovery i zachowanie po wyczerpaniu; reguły oraz maksymalny skład
partii; tempo, dzienny/sesyjny limit lub jawny brak; okno i timezone; maksymalny
czas dalszych etapów; aktywne zadanie/uchwyt browser dla tego transportu.
Nie zatwierdzano tych ustawień produkcyjnych w tej pracy.

Operacje wdrożenia: wybór własnej autorytatywnej instalacji → Stop i koniec
operacji → spójny backup SQLite/WAL oraz materiałów poza repo → jawne
rozstrzygnięcie dawnego PAUSED zgodną operacją → wybrana wersja kodu, build/doctor
→ kontrolowana migracja i audyt zachowania → zatrzymany backend → faktyczne
odnowienie/kwalifikacja → świadomy Start zatwierdzonego planu/pilota. Nie wykonywano
tego teraz. Starszy backup nie może zastąpić historii z nowszymi wysyłkami.
