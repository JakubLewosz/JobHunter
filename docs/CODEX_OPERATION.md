# Uruchamianie przez Codex — stan i wymaganie z 18.10.2026

23.10: aktualna [konfiguracja jednego konta i diagnostyka bez poczty](SINGLE_ACCOUNT.md)
nie uruchamia sekwencji nightflow. Logowanie helpera OAuth oraz zalogowanie
karty Gmaila w Codexie są oddzielne; oba muszą potwierdzić tę samą tożsamość.

Wykonanie 22–23.10.2026: [R15 i rzeczywiste osiem godzin](reviews/JOBHUNTER_R15_HOST_8H_RESULT.md).
Nowy krótki host i 28 800 212,549 ms fazy badawczej: PASS, jedna fikcyjna akcja,
raport i cleanup. Timeout odpowiedzi MCP 300 s nie zakończył wykonania w VM;
nie utożsamiać timeoutu RPC ze Stop. Istniejący adapter obsługuje krótkie segmenty
z zachowaniem instancji. Bez wdrożenia i bez zgody na produkcyjną kampanię.

Aktualizacja integracji 21.10.2026: [Node owner i lekki adapter](HOST_ADAPTER.md).
Backend i koordynator pozostają w zwykłym Node24; `runNightflowTask` w narzędziu
łączy się z wcześniej uruchomionym zatrzymanym ownerem. Krótka pełna fixture
w rzeczywistym `cua_repl`: COMPLETED, jedna fikcyjna akcja i cleanup. 8 h: NOT_RUN.
To zastępuje niższy historyczny opis uruchamiania backendu bezpośrednio w VM.
Nie wdrożono WORKSTATION ani nie zatwierdzono nowych materiałów/produkcji.

Aktualny kontrakt z 21.10.2026: [NIGHTFLOW_CONTROL](NIGHTFLOW_CONTROL.md).
`stop` bez ACK: exit 1 / STOP_UNCONFIRMED, brak potwierdzenia zatrzymania.
`status` bez odpowiedzi właściciela: exit 1 / STATUS_UNAVAILABLE.
`report` offline: źródło PERSISTED_SNAPSHOT i bieżące uprawnienie UNKNOWN.
Żaden z tych wyników nie zezwala sam na maintenance/Start.
[Gotowa kompletna fixture i ograniczenie rzeczywistego hosta](NIGHTFLOW_HOST_FIXTURE.md).

W nadzorze testowego CLI timeout i anulowanie mają osobną diagnostykę:
gotowość ENTRY, odbiór CANCEL_RECEIVED, chwila wymuszonego zakończenia.
Dwusekundowy grace nie gwarantuje cleanup po nagłym zabiciu Windows.
Nie wolno z tego powodu kasować blokady żywego lub nieustalonego właściciela;
zwykłe otwarcie profilu odzyskuje ją wyłącznie po potwierdzonym ESRCH.
Nie zastępuje to wymaganych Stop i zakończenia operacji przed aktualizacją.

## Aktualna ścieżka Windows/nightflow

[Pełny opis komend, planu, etapów i granic hosta](reviews/WINDOWS_NIGHTFLOW_IMPLEMENTATION.md).
`npm --silent run nightflow -- fixture --data-dir <NOWY_KATALOG>` wykonuje
cały przebieg na kompletnych fikcyjnych providerach. Stabilne komendy:
plan, preflight, start, status, stop, resume, report. Dla browser aktywny
punkt wejścia to `scripts/browser-executor.mjs:runNightflowTask` z istniejącym
taskId/tab, nie terminal bez uchwytu przeglądarki. Brak automatycznego wake.
Stan rzeczywistego podtrzymania: **NIEWERYFIKOWANE_UTRZYMANIE_HOSTA**.
Nie wdrożono kodu na WORKSTATION i nie zatwierdzono produkcyjnego planu.

Poniżej zachowano historyczny stan sprzed gałęzi napraw (40850745).

Użytkownik pracuje przez rozmowę w aplikacji Codex na domowym Windowsie.
Komputer i Codex mają pozostać włączone. Frontend nie jest jego podstawowym
sposobem obsługi. Ten dokument opisuje kod i dowody; nie uruchamia programu.

## Co rzeczywiście wiadomo

| Rodzaj dowodu                    | Ustalenie                                                                                                                                                                                                                           | Granica                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Obserwacja tej rozmowy           | Wykonano eksport dopuszczonego backupu, testy na fikcyjnych danych i publikację kodu. Nie uruchamiano rzeczywistej sesji researchu lub sendera.                                                                                     | Nie jest to obserwacja sposobu wykonania przyszłego „odpal na 8h”.                              |
| Wcześniejsza diagnostyka z 18.10 | Historyczny `night-run.mjs` importował natywne Store/usługę, wywoływał `startDay(...,8)` i kolejne `tick()`. `night-common.mjs` dostarczał snapshot i guard; `prepare.mjs` przygotowanie/baseline; `night-report.mjs` raport.       | Dowód: wcześniejszy oczyszczony raport diagnostyczny, nie ponowne uruchomienie helperów.        |
| Kod repo                         | `scripts/research-session.ts` → `runResearchSession()` → `ResearchJobHunter.startDay()`/`resumeSession()` → seryjne `tick()` i `ResearchSessionController`. Proces CLI czeka w pętli do wyniku/Stop/pauzy; nie jest backendem HTTP. | Ten nowy punkt wejścia sprawdzono syntetycznie. Nie potwierdzono jego wdrożenia na WORKSTATION. |
| Kod repo                         | `main.ts`/`createApp()` uruchamia backend HTTP z workerem; panel ma osobne operacje researchu, partii i Start.                                                                                                                      | Istnienie endpointu nie dowodzi, że rozmowa „odpal na 8h” wywołuje właśnie ten endpoint.        |
| Brak dowodu                      | Bieżące mapowanie polecenia rozmowy na konkretną produkcyjną komendę/helper oraz wersja aktywnego procesu: **UNKNOWN**.                                                                                                             | Nie odczytywano launch.json, sekretów, pełnych argumentów lub środowiska procesów.              |

Dokładny brakujący dowód dla aktualnego uruchomienia to oczyszczony
`workstation-invocation-record.json`: nazwa punktu wejścia, bezpieczny szkielet
komendy, czas startu, identyfikator sesji i manifest kodu załadowanego przez
ten proces. Sam HEAD, `dist` na dysku lub otwarte okno Codexa go nie zastępują.
Potrzebny jest `dist/build-manifest.json` rzeczywiście załadowanej instalacji,
powiązany z tym rekordem uruchomienia, oraz `workstation-executor-lifecycle.json`
z obserwacją pełnego przebiegu. Nie wolno podstawić manifestu testowego worktree.

## Kontrakt historycznej otoczki poza repo

Pochodzenie: raport `JOBHUNTER_DIAGNOSTYKA_DO_PRZEKAZANIA.md` z 18.10.2026,
rozdział „Prywatny guard: kod, kontrakt, scenariusz i luka”. Do repo przeniesiono
opis interfejsu i warunków; nie kopiowano prywatnych ścieżek, konfiguracji,
markerów, materiałów ani pełnego historycznego launchera. Niczego nie zmieniano
w oryginalnych helperach.

- `prepare.mjs`: sprawdzenie wymaganej rewizji, profilu, blokady i stanu;
  punkt odniesienia danych oraz spójna kopia. W raporcie: linie 24–38.
- `night-common.mjs`: `snapshot()` i `verifyProtected()`; hashe chronionych
  tabel, stare wersje, chronione app_state, tożsamość firm, stare aliasy i pliki.
  Raport: snapshot linia 13, verifyProtected 28–35. Historyczny baseline i
  okresowy odczyt nie były jedną transakcją, a null → domena nie miało wyjątku.
- `night-run.mjs`: natywne startDay/tick; guard okresowo co 15 s (raport:
  linia 56), przed pracą (53) i na końcu. Kontrola własnej blokady, deadline,
  danych i snu procesu. TIME_BUDGET kończył dawną otoczkę. Błąd zachowywał
  przyczynę, potem Stop → stopWorker → raport/backup → close/release (78–86).
- `night-report.mjs`: dołączał końcową kontrolę i raport; nie przyznawał nowej
  zgody sendera. W raporcie: linia 14.

Te numery pochodzą z wcześniejszego raportu. Dzisiejszy odczyt struktury
oryginałów został odrzucony przez automatyczną kontrolę: „blocked by policy”,
bez dalszego uzasadnienia. **Brakuje bieżącego fingerprintu tych czterech
plików oraz nowego porównania ich treści z tamtym raportem.** Nie obchodzono
blokady. Kontrakt nie jest nowym launcherem produkcyjnym i nie stanowi instrukcji
automatycznego wznowienia starego checkpointu.

### Dokładny historyczny kontrakt guarda

Parametry ścieżek opisujemy jako `<HELPERS>`, `<REPO>`, `<DATA>` i `<BASELINE>`.
Znany historyczny punkt wejścia to Node wykonujący `night-run.mjs` z tego
konkretnego zestawu. Pełnej dzisiejszej komendy i jej konfiguracji nie
potwierdzono; poniższy opis nie jest poleceniem uruchomienia.

Wejściem `verifyProtected(db, baseline)` były połączenie SQLite i zapisany
baseline. `snapshot(db)` serializował każdy rekord tabeli do JSON, sortował
te teksty, serializował tablicę i liczył SHA-256. Zmiana kolejności SELECT
nie zmieniała wyniku, zmiana wartości rekordu tak. `protectedTables` i
`hashes` wskazywały tabele oraz ich oczekiwane hashe. Dodatkowe listy
chroniły stare ID/wersje, tożsamości, aliasy, wybrane app_state i materiały.

Całe tabele: migrations, campaigns, candidate_profiles, candidate_facts,
portfolio_projects, cv_assets, contact_reviews, draft_approvals, outbox,
send_attempts, usage_ledger, mail_messages, history_records, suppressions,
mock_deliveries, browser_deliveries oraz istniejące tabele z prefiksami
`gmail_`, `auto_`, `shared_`. Częściowe porównania obejmowały:

- cały dawny draft_versions i company_aliases według ID;
- dawne companies: id, canonical_name, normalized_key, primary_domain,
  history_status, suppression_reason, przez dokładną równość JSON;
- wybrane w prepare klucze app_state o prefiksach gmail/auto/shared/prior/history/
  localHistory/skipLegacy/newCampaign, przez dokładną równość value;
- materiały: profil, liczba zatwierdzonych faktów, metadane CV i kontrola bajtów
  PDF przez `materials()`. W tym zadaniu nie odczytywano tego PDF.

Wynik miał listy `changedProtectedTables`, `changedOldVersions`,
`protectedStateChanged`, `protectedCompanyIdentityChanged`,
`protectedAliasesChanged`. `guard()` najpierw wykonywał `lock.assert()`;
niepusta lista powodowała PROTECTED_DATA_CHANGED i `service.control('stop')`.
Nie było rollbacku historii ani kasowania nowych firm. Finally czekał na
stopWorker, tworzył raport/backup, zamykał Store i zwalniał własną blokadę.

Istotne granice historycznej implementacji: baseline i okresowy guard nie
tworzyły jednej transakcji; null i pusty string różniły się w raw JSON;
nowe aliasy same nie blokowały, a guard nie wyszukiwał konfliktu właściciela.
Nie chronił całych bieżących tabel drafts/contacts/evidence/research_sources/
research_draft_materials. Prepare po blokadzie używał db.backup i sprawdzał
kopię względem baseline; **nie dowodzi to metody utworzenia osobnego
after-code-review.sqlite**, która pozostaje UNKNOWN.

Opis jest oczyszczonym kontraktem z wcześniejszego raportu, z pominięciem
prywatnych wartości/ścieżek i ze skróceniem kodu do interfejsu oraz warunków.
Nie jest kopią dzisiejszych plików, ich fingerprintem ani zamiennikiem
produkcyjnym. Nowy natywny guard z repo i otwarte R1 należy oceniać osobno.

## Procesy i kontynuacja

| Element                   | Kto pozostaje aktywny                                                                        | Jak kończy się praca                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Codex                     | Aktywne zadanie/wywołanie musi odebrać wynik i wykonać dalsze uprawnione kroki.              | Otwarte okno aplikacji nie jest samo zdarzeniem wznowienia po 8 h.                                                       |
| CLI research:session      | Własny proces Node, synchroniczny właściciel profilu, pętla oczekująca na natywne tick.      | Stop, pauza, deadline lub błąd; stopWorker, zamknięcie Store, release; JSON podsumowania.                                |
| Backend HTTP              | Własny proces backendu i jego worker.                                                        | Zamknięcie karty nie zatrzymuje backendu; restart nie wznawia prawa sesji.                                               |
| ResearchSessionController | Obiekt w procesie usługi, guard okresowy i wspólny lifecycle; nie drugi scheduler researchu. | Zapisany pierwotny powód, kontrole i etapy cleanup; FINISHED nie dowodzi czasu wyjścia procesu.                          |
| BrowserBatchController    | Aktywny wykonawca w zadaniu Codexa, klient IPC i uchwyt przeglądarki.                        | Odcinki do 60 s, przypięty backend/sesja/partia, lease; Stop/utrata kończy. Host całonocnego wywołania niezweryfikowany. |

Oficjalna dokumentacja opisuje [pracę długotrwałą i cele](https://learn.chatgpt.com/docs/long-running-work)
oraz [zadania harmonogramowe](https://learn.chatgpt.com/docs/automations?surface=app).
To odrębne mechanizmy podtrzymania/kontynuacji, wymagające właściwego aktywnego
zadania lub konfiguracji. Ich dostępność nie dowodzi integracji z JobHunterem.
W tym etapie nie tworzono celu nocnego, harmonogramu, heartbeat ani autostartu
i nie zmieniano ustawień zasilania. Nie obiecujemy samoczynnej kontynuacji
zwykłej zakończonej rozmowy ani działania po zamknięciu Codexa.

## Wynik researchu i granica wysyłki

| Zdarzenie                             | Zachowanie kodu / wymagana decyzja                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planowany deadline                    | Natywny kontroler zapisuje powód i końcowy guard/cleanup. Sam koniec pętli nie uruchamia sendera.                                                                                |
| TIME_BUDGET długiego cyklu            | Checkpoint/PARTIAL i ograniczone odłożenia, kontynuacja do pierwotnego deadline; nie odnowienie czasu. R6 pozostaje do przeglądu.                                                |
| Stop/pauza                            | Odwołanie uprawnienia przed SQLite, anulowanie własnych operacji; brak przejścia do wysyłki.                                                                                     |
| Restart/utrata locka/guard            | Brak automatycznego wznowienia; zachowane dane i niepewne próby. PROTECTED_DATA_CHANGED nie staje się sukcesem przez cleanup STOPPED.                                            |
| Internet/reader/CODEX_LIMIT           | Błąd lub pauza/checkpoint; jawny ograniczony probe, a po recovery osobne uprawnione wznowienie. Bez automatycznej zgody na wysyłkę.                                              |
| Backend zamknięty / executor utracony | Klient rozróżnia zamknięcie, lease i sesję. Przed możliwym nadaniem FAILED_NOT_SENT, po granicy niepewności SEND_UNKNOWN; brak retry/failover. R5 nadal wymaga kontroli wyścigu. |
| Brak zgodnych materiałów              | Wynik i powody; nie wymuszać wiadomości.                                                                                                                                         |

Wiarygodnym wynikiem jest zgodny identyfikator sesji, niezmienny deadline,
`primaryReason`, zakończony guard, zakończone własne operacje i checkpoint.
Należy sprawdzić także czy po drodze nie odwołano uprawnienia. `STOPPED`, kod
wyjścia procesu lub sam upływ 8 h nie są równoważne prawidłowemu ukończeniu.

## Docelowy przebieg — WYMAGANIE, NIEZAIMPLEMENTOWANE jako całość

Jedno świadome polecenie ma uruchamiać około 8 h researchu, **najpierw odnowienie
dotychczasowych firm i szkiców**, następnie kontrolę rezultatów, finalnych wersji,
kontaktu, dowodów, historii i blokad. Po prawidłowym zakończeniu ma powstać
zamknięta partia zgodnych wiadomości i rozpocząć wysyłkę w uprzednio
zatwierdzonych granicach, tempie, limitach i oknie, z krótkim raportem w rozmowie.
Nowe firmy mają teraz niższy priorytet. Nie potrzeba porannego polecenia dla
normalnego przejścia ani akceptacji każdego maila.

Brakuje koordynatora tego przebiegu, trwałego kontraktu przejść, polityki wyboru
przyszłej partii oraz zweryfikowanego podtrzymania wykonawcy przez cały czas.
Obecne `prepareBatch()` → `approveClosedBatch()` → `startBatch()` zakładają
zatwierdzenie konkretnego podsumowania; nie reprezentują jeszcze wcześniejszej
zgody na reguły wyboru nieznanej listy. Nie wolno ich po cichu automatycznie
zatwierdzać. Nowe fakty, CV, nadawca lub poszerzenie polityki wymagają właściwej
nowej zgody. RESEARCH_ONLY pozostaje bez poczty; potrzebna jest koordynacja
odrębnych etapów, a zwykły ciągły AUTO zachowuje swoją semantykę.

W wybranej kopii `autoPolicy` nie występuje. Nie ustalono nowego tempa/limitów;
wartości kampanii w `policy-records.jsonl` nie są dowodem zatwierdzenia przyszłej
sekwencji. [policy-summary.json](ai-review/review-2026-10-18/policy-summary.json)
podaje stan i konkretne braki przed rzeczywistym Start. Cel zawodowy nadal:
płatna regularna praca, w pełni zdalnie, około 20 h/tydzień, głównie firmy
z Polski; oferty stron/automatyzacji to przyszłe rozszerzenie.

Zapisana kampania ma mode=RESEARCH_ONLY, policy_version=14, daily_limit=10,
cycle_limit=3, campaign_limit=50, interval_minutes=60, window=08:00–16:00,
timezone=Europe/Warsaw i schedule_enabled=false. Są to rzeczywiście zapisane
wartości historycznej kampanii, a nie nowa propozycja ani dowód zatwierdzenia
ustawień AUTO_POLICY dla sekwencji nocnej. Nie przenosimy ich automatycznie
na tempo, limity lub ukryty koniec przyszłego ciągłego AUTO. Osiem dawnych
draft_approvals odnosi się do konkretnych zapisanych wersji, nie nieznanej
przyszłej partii.
