# Bieżące zadania — 29 października 2026

Końcowy wynik kontynuacji: **NOT_PRODUCTION_VERIFIED**.
Kod `ca5bd42df8b6addb8048e4906cfdbbc215c10cb8`, ten sam zamrożony build:
pełny Windows check1042/12/26/CI/CUA PASS, nowy R1 PASS3611s,
R2 COMPLETED (3 próby, 3 potwierdzone), R3 STOPPED/EXECUTION_DEADLINE
(2 odnowione/sprawdzone w partii, 0 prób). Łącznie3/5, 0 niepewnych,
0 duplikatów lub działań poza zakresem. Dwa wcześniejsze zatrzymania hosta
wynikały z przerw operatora pomiędzy segmentami; zachowane, bez zwiększania lease.
[Dokładny wynik i ograniczenia](reviews/V1_CLI_FINAL_RESULT.md).

WORKSTATION STOPPED, brak ownera i aktywnych operacji/prawa wysyłki;
Gmail zamknięty. Pierwotna zgoda wygasła29.10 11:06:39 Warsaw; nie odnawiać
jej ani pozostałych limitów. Bez kolejnego Startu lub Gmaila dla starej partii.
Następna dozwolona granica dla dwóch niewysłanych kontaktów to nowa świadoma
decyzja użytkownika, nie kolejna poprawka programistyczna lub nowa kampania
uruchomiona automatycznie. Pozostają2 alerty npm z oceną osiągalności i
nierozstrzygnięta historyczna przyczyna trzech starych timeoutów.

Poniższe wcześniejsze wpisy zachowują historię etapów; stan powyżej jest bieżący.

Aktualizacja 20:55 UTC: wdrożony kod `ca5bd42df8b6addb8048e4906cfdbbc215c10cb8`,
build `90e528ed-9018-442d-8e06-e71484443bb6`. Pełny Windows check
1042/12/26, typecheck/build, CI40754519704 i rzeczywisty fikcyjny CUA PASS.
Nowy rzeczywisty godzinny R1 tej wersji **PASS**: 3611 s, 12/12 biblioteki,
4 cykle discovery, 47/47 poprawnych wywołań modelu, końcowy guard/backup/cleanup
PASS. Poczta niewłączona, oryginalne 11 prób zachowane, 0 nowych prób.
WORKSTATION STOPPED, bez ownera i prawa wysyłki. R2/R3 jeszcze NOT_RUN;
V1 nadal **NOT_PRODUCTION_VERIFIED**. Następny krok: w najbliższym ważnym
oknie istniejącej zgody świeża tożsamość/From/Reply-To, natywne R2 i osobne R3,
bez zmiany kodu lub pierwotnego deadline. Po wygaśnięciu bez Gmaila/nadawania.
Diagnoza dawnych timeoutów pozostaje ograniczona: nie odtworzono ich przyczyny,
nie podniesiono 120 s. Szczegóły w [diagnozie](reviews/V1_CLI_DIAGNOSIS.md).

Poniżej zachowane historyczne wpisy poprzednich bramek; ich „następny krok”
nie zastępuje aktualnego stanu powyżej.

Kontynuacja CLI: [pomiary i celowane poprawki](reviews/V1_CLI_DIAGNOSIS.md).
3617b59 ma CI Windows SUCCESS. Dwa lokalne pełne przebiegi zachowane:
pierwszy przerwany przez wrapper na ostrzeżeniu przed UI, drugi 1040/1041,
bo nowa fixture miała nieuzasadnione założenie o bootstrapie w 350 ms.
Wykazano to kontrolowanym opóźnionym zdarzeniem z zerowym stdout przed
timeoutem. Zegar testów deadline jest teraz sterowany po obserwacji etapu,
a test izolacji nadal wymaga ISOLATION_FAILED, także przy późnym zdarzeniu.
19/19 procesu PASS; kod aplikacji i jej limity bez zmian. Następny krok:
commit testów, pełny check/CI właściwego SHA, freeze/CUA/wdrożenie/R1.
Poniższe wcześniejsze wpisy 7 wywołań zastępuje aktualny ledger 8 prób.
7 rzeczywistych diagnostycznych wywołań zakończyło się poprawnie przy 120 s;
dawnej przyczyny timeoutów nie ustalono. Dodano metadane procesu/JSONL.
Natywnie odtworzono i poprawiono parser adresu historii (Nodemailer 10.1.4)
oraz nadmierne issues dla kolekcji modelu (Zod 4.6.6). Pozostałe 2 alerty
zachowane jawnie. 32 celowane testy i typecheck PASS; pełny check nowego kodu
oraz CI/freeze/doctor/wdrożenie/R1 nadal do wykonania. WORKSTATION STOPPED
na 1f41b55, zero nowych prób; oryginalny termin zgody bez zmian.
Następny krok: końcowe regresje, commit i pełne bramki, następnie R1;
R2/R3 dopiero po zaliczeniu R1 i wyłącznie w ważnym oknie istniejącej zgody.
Poniższy stan opisuje poprzednią dostawę, nie koniec kontynuacji.

Stan końcowy zlecenia V1: **NOT_PRODUCTION_VERIFIED**. Kod
`1f41b550578751b68811c9628f4b915f2ea51c26` ma pełny Windows check
1021/12/26, typecheck/build, CI dokładnego SHA i świeży fikcyjny CUA PASS.
Kontrolowane wdrożenie tego buildu zakończone; WORKSTATION **STOPPED**,
zero nowych rzeczywistych prób i nadań, bez aktywnego ownera/prawa wysyłki.
[Końcowe fakty i granice](reviews/V1_FINAL_RESULT.md).

R1 tej wersji NIEZALICZONY: trzy rzeczywiste wywołania CLI przekroczyły
niezmienione 120 s (SEMANTIC_REVIEW, EXTRACT, SEARCH). Dwie krótkie próby
kontrolne przeszły; nie ustalono przyczyny. Nie powtarzać bez nowej przesłanki.
R2/R3 na tym wydaniu NOT_RUN. Zaliczonego R1 d222655 nie przenosić na 1f41b55.

Dokładny następny krok: usunąć/wyjaśnić przyczynę czasu reprezentatywnych
wywołań istniejącego CLI, zachowując izolację i limit 120 s. Sam mały probe
nie wystarczy. Po rzeczywistym ustąpieniu problemu wykonać pełny godzinny R1
tego samego wydania, a dopiero potem warunkowe R2/R3 zgodnie z prywatną zgodą.
Pierwotnego deadline 2026-10-29T10:06:39.233Z nie odnawiać. Po jego upływie
rzeczywisty odbiór wymaga nowego polecenia użytkownika; brak autowznowienia.
Nie zwiększać timeoutów ani uprawnień, nie przełączać na API key.

Osobny otwarty maintenance: zapisany `npm audit` zgłasza 4 alerty
(1 high, 2 moderate, 1 low). Zależności zamrożonego wydania nie zmieniono.
Nie ustalono związku tych alertów z czasem CLI. Poniżej zachowana historia
wcześniejszych etapów; dawne „następne kroki” nie zastępują tego stanu.

28.10.2026: pełny Windows check c6791f6 (1020/12/26) i dokładne CI PASS.
Przed wdrożeniem odtworzono jeszcze opóźnienie Stop zwykłego planu bez listy:
synchroniczna ocena całej biblioteki nie oddawała sterowania. Natywna ocena
oddaje teraz pętlę między pozycjami i sprawdza anulowanie/plan bez tworzenia
heartbeatów. Typecheck i 44/44 regresje PASS; pierwszy roboczy błąd zachowany.
[Szczegóły](reviews/V1_COMPLETION.md). Następny krok: commit, pełny check/CI
nowego SHA, zamrożenie i świeży CUA, kontrolowane wdrożenie, nowy godzinny R1,
potem warunkowe R2/R3. WORKSTATION nadal STOPPED d222655, zero nowych prób;
pierwotny deadline zadania nie jest odnawiany.

28.10.2026, dalsza bramka V1: a2cae88 nie wdrożono. Dwa lokalne pełne checki
miały pojedynczy FAIL limitu HTML; CI miało dwa błędy czasowe CLI. Wszystkie
pierwsze wyniki zachowane. Zamiast kolejnego niezmienionego powtórzenia
usunięto powtarzane skanowanie tego samego kontenera i poprzedniej linii w
parserze; bez zmian semantyki lub granic testów. [Szczegóły](reviews/V1_COMPLETION.md).
Następny krok: potwierdzić identyczność wyniku i celowane HTML, pełny check/CI
nowego SHA, świeży CUA, wdrożenie i nowy R1, potem warunkowe R2/R3. WORKSTATION
nadal zatrzymana na d222655; zero nowych rzeczywistych prób. Nie odnawiać
absolutnego terminu zapisanej zgody.

28.10.2026, dalszy odbiór V1: d222655 przeszedł pełny check/CI i fikcyjny CUA,
a rzeczywisty R1 zakończył godzinę z guardem i zachowaną historią. R2 zatrzymał
się bez nowych prób: ocena całej biblioteki przed odfiltrowaniem zamkniętego
planu blokowała hosta. Reprodukcję i minimalną poprawkę opisuje
[V1_COMPLETION](reviews/V1_COMPLETION.md). Następny krok: pełne bramki nowego
kodu, zamrożenie/wdrożenie, nowy R1 i warunkowe R2/R3. Nie ponawiać starego
Startu ani nie odnawiać absolutnego deadline. Prywatny checkpoint pozostaje
w Downloads/JobHunter-V1-COMPLETION-20261028.

28.10.2026, zlecenie domknięcia V1: odtworzono podmianę adresu podczas
odnowienia tego samego szkicu zamkniętego planu. Poprawka przypina odbiorcę
oraz opcjonalny absolutny termin zgody; 42/42 regresje Windows PASS.
[Zakres i stan](reviews/V1_COMPLETION.md). Pierwszy krótki R1 starego kodu
zatrzymany, NIE zaliczony; brak Gmaila i nowych nadań. Trwałe wyłączenie
użytkownika zapisano natywnie po backupie/restore. Następny krok: pełny check,
CI i rzeczywisty CUA dokładnego nowego wydania, kontrolowane wdrożenie i nowy
godzinny R1, potem warunkowe R2/R3 w granicach prywatnej zgody. Termin zadania
nie odnawia się. Checkpoint: Downloads/JobHunter-V1-COMPLETION-20261028.

28.10.2026: przygotowanie ograniczonego R2/R3 opisuje
[R2_R3_ACCEPTANCE](R2_R3_ACCEPTANCE.md). Istniejąca suppression użytkownika
blokuje selekcję/partię/dispatch i przeżywa restart; NEEDS_REVIEW nie zastępuje
takiego wyłączenia. Odtworzono osobny brak zamkniętej listy w planie Nightflow:
maxItems nie ogranicza tożsamości kandydatów. Opcjonalne draftIds ogranicza
odnowienie i wybór; natywna derywacja ponownie egzekwuje listę/limit. Bez nowego
koordynatora, zmian generatora, migracji lub domyślnego limitu AUTO.
Celowane 63/63 Windows PASS; początkowe niezaliczone próby zachowane. Odebrać
pełny check/CI dokładnego SHA i prywatną dostawę. Nowy kod nie dziedziczy R1
starszego wydania i nie jest wdrożony. WORKSTATION pozostaje bez zapisu, Gmaila,
Startu i nadania. Przy przerwaniu: prywatny checkpoint w Downloads/
JobHunter-R2-R3-PREPARATION-20261028; dokończyć raport/materials/HOLD proof i ZIP.
Jedna przyszła decyzja musi objąć wymagany nowy odbiór wydania przed R2/R3.

27.10.2026: zatwierdzony R1 3541725 wykonał bibliotekę (15 wyników, 8 CHECKED)
i ponad godzinę discovery, ale CLI zakończył SEARCH kodem 1: workspace routing
discovery failed. Dane chronione i poczta zachowane. Brak STOPPED przy normalnym
powrocie z natywnej pauzy odtworzono w trzech trybach; poprawka dotyczy wyłącznie
końca wejścia CLI, z zachowaniem pierwotnego kodu i checkpointu. Bez retry modelu,
nowego Startu lub Gmaila w tej ścieżce. WORKSTATION zatrzymano kontrolowanym Stop.
Nowy kod w codex/v1-session-stop wymaga pełnego check/CI/T1–T3 i nowego buildu;
bieżący checkpoint oraz rzeczywiste raporty są poza repo w Downloads/
JobHunter-R1-3541725-20261027. Nie wznawiać starego, wygasłego deadline.

26/27.10.2026: [R1_RESEARCH_ENTRY](reviews/R1_RESEARCH_ENTRY.md) jest bieżącym
uzupełnieniem. Zatwierdzony a7652a3 wdrożono po spójnym backupie; krótki R1
zatrzymano i NIE zaliczono: wejście operatora pomijało odnowienie biblioteki.
WORKSTATION pozostaje STOPPED na a7652a3, bez Gmaila i wysyłek. Nowa poprawka
w odrębnym DEVELOPMENT wymaga check/CI i T1/T2/T3 na zamrożonym nowym SHA,
potem jednej decyzji o jego wdrożeniu i powtórzeniu 1–2 h R1. Nie wznawiać
poprzedniego checkpointu ani nie wdrażać nowego SHA na podstawie dawnej zgody.
Przy przerwaniu sesji: odczytać prywatny katalog JobHunter-R1-a7652a3-20261026
w Downloads, R1_FINAL_PRIVATE.json i CHECKPOINT_PRIVATE; sprawdzić właścicieli,
następnie dokończyć bramkę nowego kodu w codex/v1-research-entry. Nie ruszać
starego worktree v1-stabilization wybranego w installed-build.json.

26.10.2026, kolejna regresja przed wydaniem: research:session zachowuje teraz
istniejące AUTO/APPROVAL, politykę i historyczne zatwierdzenia, bez Gmaila
i scope sendera. Start oraz Resume mają testy trwałego stanu (28/28 + 2/2 PASS).
Kandydat ff07bbc wycofany; po poprawce obowiązuje nowy SHA i pełny check/CI/T1–T3.
Następny krok po tych dowodach: jedna dokładna zgoda na deployment/backup/R1,
bez rozszerzenia v17 lub realnego Start wysyłki. Wznowienie developmentu:
czytać CHECKPOINT_PRIVATE/FROZEN_RELEASE_PRIVATE poza repo i nie wznawiać kampanii.

26.10.2026 — [stabilizacja V1](reviews/V1_STABILIZATION.md): ograniczona priorytetowa kolejka z trwałym checkpointem; wspólny deadline i osobne 40% refresh / pozostały czas discovery; koordynowany godzinny research bez limitów trial; regresje źródeł; odtwarzalny T1/T2 przez rzeczywisty host. Następny krok: odebrać końcową prywatną macierz check/CI/T1/T2/T3 i manifest wybranego SHA. Po ich PASS wymagana jedna dokładna decyzja WORKSTATION/backup/R1, potem osobno polityka i Start R2. Nie wracać do hurtowych zmian stylu ani nie wznawiać poprzedniego pilota. Jeżeli sesja zostanie przerwana: użyć SHA, worktree i checkpointu prywatnej dostawy, sprawdzić właścicieli i stan fixture; nie wznawiać automatycznie żadnej realnej sesji.

## Niezależne odnowienie / limit cytatów — 26.10.2026

- [x] Odtworzyć przekroczenie schematu przez dołączanie poprzednich cytatów
      do poprawnej ekstrakcji; ograniczyć do ośmiu bez osłabienia walidacji.
- [x] Pominąć niespełniający schematu cache w obu istniejących ścieżkach,
      wykonać świeżą ekstrakcję i zachować historyczny rekord.
- [x] Pełny Windows check: typecheck/build, 986 backend, 12 Stop i 26 UI PASS.
      Wynik CI dokładnego SHA jest zapisywany oddzielnie w dostawie.
- [x] WORKSTATION pozostaje bez wdrożenia poprawki i bez kolejnej operacji.

[Zakres i regresje](reviews/INDEPENDENT_REFRESH_PROOF_LIMIT.md).

## Kalibracja i legacy — 25.10.2026

- [x] Zamrozić reprezentatywne dane i porównać natywne generate parami;
      12/12 identycznych wejść nie pozwala przypisać różnic poprawce kodu.
- [x] Odebrać trzy ślepe preferencje użytkownika B/B/B; wyłącznie ocena tekstów.
- [x] Zamknąć przekazywanie pełnego wzoru bez placeholderów i pomijanie
      bieżącej jakości przez starsze PASS; zachować historyczne oceny.
- [x] Odtworzyć luki i przejść celowane regresje; bez zmian produkcyjnych.
- [ ] Odebrać końcowy Windows check, CI dokładnego SHA i bezpieczny ZIP.
      Wyniki końcowe są w prywatnej dostawie; nie utożsamiać z wdrożeniem.
- [ ] Jakość generatora nadal niepotwierdzona: następna mała hipoteza to
      ograniczenie powielonego pełnego opisu projektu w modelowym DTO;
      potrzebny nowy holdout i wiele prób, bez dostrajania do tych wyników.
- [ ] WORKSTATION, polityka v17 i prywatne P1 pozostają bez zmian.

[Wynik i instrukcja](reviews/MESSAGE_QUALITY_CALIBRATION.md).

## Systemowa jakość — 25.10.2026

- [x] Oddzielić redakcję od zgodności faktów i podłączyć bramkę do AUTO.
- [x] Wspólny review nowych generacji i dokładnych edycji; jedna trwała korekta.
- [x] Sparowany benchmark CLI i 20 fikcyjnych kontekstów; bez zmiany produkcji.
- [ ] Przed ewentualnym wdrożeniem odczytać finalny prywatny raport Windows/CI
      oraz manifest dostawy; bieżący kod nie udziela zgody na wdrożenie lub Start.
- [ ] Pięć P1 pozostaje NOT_APPLIED; późniejszy zapis/nowy zakres w osobnym zadaniu.

[Mechanizm i instrukcja operatora](reviews/MESSAGE_QUALITY.md).

## Utrzymanie Computer Use — 24.10.2026

- [x] Odtworzyć utratę lease między ręcznymi segmentami; zachować próg 45 s.
- [x] Dodać ciągły, ograniczony deadline'em task w lekkim adapterze; żywa
      kontrola karty, przypięty zakres, Stop/abort/release bez retry/Start.
- [x] Regresje nowej ścieżki 17/17 i rzeczywisty syntetyczny test Computer Use
      660529,7027 ms (>11 minut), Stop/release/cleanup bez prób lub rezerwacji.
- [ ] Odebrać pełny Windows check/CI; dokładne wyniki zapisać w dostawie.
- [ ] Po sprawdzonym backupie wybrać zweryfikowany build WORKSTATION,
      wykonać ponowny preflight i pełny prywatny podgląd tych samych v5.
- [ ] Ewentualny kolejny pilot wymaga nowej osobnej zgody; obecne zlecenie
      nie pozwala na Start, Gmail history/messages, partię lub wysyłkę.

[Kontrakt i dowody](reviews/COMPUTER_USE_LIVENESS.md).

## Naturalny styl — 23.10.2026

- [x] Wąsko doprecyzować prosty ton, jeden powód kontaktu, krótki projekt
      i warunkową informację o CV; bez zmiany zatwierdzonych materiałów.
- [x] Usunąć automatyczne CLOSING za uczciwe pytanie o początkującego
      programistę. Zachować kontrole faktów, dostępności i powtórzonych próśb.
- [x] Zablokować spóźniony zapis verifyDraft po Stop; regresje obejmują
      mapowanie i review, konflikt wersji oraz utratę właściciela.
- [ ] Dokończyć pełny Windows check i wersjonowany zapis trzech jawnie
      wskazanych szkiców przez editDraft/verifyDraft. Prywatne treści,
      numery wersji i dowody instalacji wyłącznie poza Git.
- [ ] Późniejszy pilot pozostaje osobnym krokiem użytkownika; ten etap
      kończy się STOPPED, bez prawa wysyłki, historii poczty lub Start.

## Istniejące szkice RESEARCH_ONLY do AUTO — 23.10.2026

- [x] Odtworzyć rzeczywiste pochodzenie bez wcześniejszych scope: istniejące
      odnowienie AUTO tworzy nową wersję tego samego ID i może zachować tekst.
- [x] Regresje 45/45 Windows; uszczelnić zmianę polityki/wersji i właściciela
      podczas await, bez nowej architektury lub osłabienia guarda scope.
- [ ] WORKSTATION: najpierw jawnie zatwierdzona polityka (obecnie brak), potem
      backup i publiczne odnowienie tylko wybranych ID w backendzie AUTO;
      pokazać finalne wersje/diff. Nie wpisywać samodzielnie zgody na historię.
- [ ] Dopiero późniejszy pilot: odrębne zatwierdzenie finalnych materiałów,
      celowanej historii, tempa/limitów/okna oraz Start. Bez obecnego prawa wysyłki.

[Obsługa](EXISTING_DRAFTS_TO_AUTO.md),
[wynik i granice testów](reviews/JOBHUNTER_EXISTING_DRAFTS_TO_AUTO_RESULT.md).

## Reply-To / wąskie przygotowanie pilota — 23.10.2026

- [x] Odczyt jednego głównego/domyślnego Send-As z gmail.readonly; bez nowego
      OAuth i operacji poczty. NONE odróżnione od UNKNOWN/błędu/niepełnej odpowiedzi.
- [x] Świeży dowód konta/subject/rewizji/operacji przy authorize i click gate;
      zgodność widocznego UI, ponowny odczyt, termin 5 s i bariery Stop/lease.
- [x] Celowane regresje 46/46 PASS; pierwsze 45/46 zachowane (BROWSER_BUSY
      przez błędny identyfikator wykonawcy nowej fixture, poprawiono test).
      Pełny Windows check oraz CI końcowego SHA mają dokładny wynik w dowodach
      tej dostawy; nie przypisywać wcześniejszego checka do nowego diffu.
- [ ] Pilot: osobna zgoda na celowaną historię trzech odbiorców/domen,
      aktualne wersje/PDF, zakres, tempo/limit/okno i późniejszy świadomy Start.
      Prywatny podgląd i rzeczywisty wynik ustawień pozostają poza Git.

## Jedno konto / Computer Use / bez wysyłki — 23.10.2026

- [x] Prywatne przypięcie email/subject/revision w istniejącym workstation.json;
      brak domyślnego wyboru dawnego konta i brak automatycznej zmiany nadawcy.
- [x] OAuth identity + readonly dla browser-only; kontrola przed zapisem i refresh,
      natywny API send zablokowany przed tokenem/HTTP i przed rezerwacją.
- [x] Osobne konto karty/From/Reply-To, ponowna obserwacja po końcowym await;
      nieznany Reply-To blokuje. Helper konfiguracji/verify bez workera i poczty.
- [x] Celowane testy 99/99, następnie dodatkowe integracyjne 29/29 PASS,
      z zachowaniem pierwszych błędów i poprawy cleanup. Wynik pełnego check osobno.
- [ ] Przed pilotem: potwierdzone logowanie provider + Gmail profile oraz osobno
      karta Codexa, efektywny From/Reply-To/podpis. Nie używać Start do diagnostyki.
- [x] Uzupełnić brak pola Reply-To świeżym odczytem dokładnego Send-As;
      UNKNOWN i sprzeczność UI nadal blokują, bez odblokowania flagą raportu.
- [ ] Osobno autoryzować celowaną historię i pilota z konkretnymi materiałami,
      odbiorcami/domenami i tempem/limitem. Dzisiejszy etap niczego nie wysyła.

[Mechanizm i obsługa](SINGLE_ACCOUNT.md), [raport techniczny](reviews/JOBHUNTER_SINGLE_ACCOUNT_TECHNICAL.md).

## Pierwsze rzeczywiste odnowienie bez poczty — 23.10.2026

- [x] Ustalić istniejący WORKSTATION i brak żywego starego właściciela; spójny backup z WAL, odtworzenie i migracja 20 → 27 z zachowaniem dawnych rekordów.
- [x] Po jednej konkretnej zgodzie zastosować propozycję materiałów i dokładny PDF; rzeczywiste ID, profil v11, stare CV/fakty/historia zachowane, FixDesk DEFERRED.
- [x] Dodać cienkie research:refresh nad refreshLibraryDrafts, bez Gmaila/sendera/nightflow, z zakresem ID, Stop, deadline i chronionymi snapshotami. 7 nowych testów; pełny Windows check 794/12/26 oraz CI kodu 5adc8c3 PASS.
- [x] Wykonać rzeczywistą fazę pod nieodnawianym limitem 3600 s: 71 rozpoczętych / 70 wyników / 40 odnowionych i poprawionych / 30 odłożeń / 1 przerwany deadline / 168 nietkniętych. Cztery ograniczone przebiegi, bez powtórzenia zakończonych ID i bez przedłużania cap.
- [x] Potwierdzić zachowanie 285 dawnych wersji, MIME, historii, blokad i liczników; 62 tabele zgodne z końcowym spójnym backupem. Zero nowych pakietów, rezerwacji, prób i uprawnień wysyłki. STOPPED, bez własnych procesów/locków.
- [x] Przygotować prywatną propozycję 3 kandydatów pilota, bez Gmaila, zgody na partię lub wysyłki.
- [ ] W następnej osobno zleconej sesji kontynuować stabilną kolejkę 168 nietkniętych; osobno naprawić 30 odłożeń i pozycję przerwaną. Nie wznawiać starego deadline ani nie zaliczać starych PASS. Grupy B: 167 / C: 106 pozostają kolejną kolejką; D: 3 firmy / 1 szkic nadal zablokowane.
- [ ] Wyjaśnić pojedyncze UNSUPPORTED_TECHNOLOGY / INVALID_CLAIM / INVALID_MODEL_RESULT i wtórne BUSY po ITEMS_NEED_REVIEW. Błędy zachować; zamykać cykl publicznie, bez SQL obejść i retry błędnej wiadomości.
- [ ] Ujednolicić dawne etykiety godzin w metadanych kwalifikacji z aktualnym profilem; odnowione teksty nie deklarują pory po lekcjach.
- [ ] Przed pilotem uzyskać jedną odrębną zgodę na konkretne wersje/odbiorców/PDF/konto, celowany odczyt historii oraz tempo/limit/okno; sprawdzić rzeczywistego nadawcę. Dzisiejszy research nie uruchamia pilota i nie zmienia docelowego AUTO_POLICY.

[Bezpieczny raport rzeczywistego wyniku](reviews/JOBHUNTER_FIRST_REAL_REFRESH_RESULT.md). Prywatne materiały, checkpointy i propozycja pilota pozostają poza Git.

## R15 / host 8 h — wykonanie 22.10.2026

- [x] Manifest wejścia 17/17, pełny prompt/raport/odtworzenia; zachowano nowsze
      commity gałęzi, R1–R14, bibliotekę, Node owner i lekki adapter.
- [x] Kontrole abort przed Start, po connect/attach i przy write do IPC;
      przypięty sygnał, brak retry możliwego Start i pojedynczy własny cleanup.
- [x] Regresje Node24/Windows/named pipe z pełnymi fixture oraz kontrolowanymi
      barierami. Po pierwszym pełnym check poprawiono wyścig cleanup po ACK
      raportu; nowe 18/18 native i cztery scenariusze UI PASS.
- [x] Pełny Windows check 8332363: 786/786 backend, 12/12 Stop, 26/26 UI,
      typecheck/build PASS, exit 0, niezmienne bajty. Pierwszy wynik zachowany: backend
      785/785, Stop 12/12, UI 24/26, exit 1 (wyścig cleanup, bez złagodzenia testów).
- [x] Nowy krótki host COMPLETED i pełne 28 800 212,549 ms rzeczywistej fazy
      badawczej w tym samym adapterze/ownerze/job/generacji. Potem jedna fikcyjna
      akcja, raport i cleanup. Pre-abort w cua_repl: zero nowych zadań/akcji.
      Timeout odpowiedzi MCP 300 s nie zatrzymał wykonania; szczegóły w raporcie.
- [x] Raport wyników z rozdzieleniem lokalnego check, 8 h wykonania i błędu RPC.
      Końcowy check drzewa, CI dokładnego SHA i pełna weryfikacja ZIP są zapisywane
      po commicie w metadanych przekazania. Brak wdrożenia lub zgody na produkcję.
- [x] Po potwierdzonym anulowaniu CI ca79c2e przez limit 25 minut zwiększono
      budżet całego joba do 40 minut; progi Stop i komplet testów bez zmian.
      Nowe wykonanie i SHA mają osobne metadane, bez ponawiania starego runa.
- [x] Odtworzono nieosiągalną barierę testu IPC po wcześniejszym Stop. Oczekiwanie
      odrzuca teraz przedwczesny koniec ownera; REFRESHING zastępuje VALIDATING
      jako bariera testowa. Nowa regresja cleanup, 51/51 celowanych PASS.
      To niezależny dowód słabości testu, nie ustalona przyczyna anulowania CI.

[Raport bieżącego wykonania](reviews/JOBHUNTER_R15_HOST_8H_RESULT.md).

## Lekki host i materiały — 21 października 2026

- [x] Zweryfikowano pełny prompt i 7/7 plików manifestu poza repo; aktualne
      README przypięto do commitów, bez zmian profilu/repozytoriów portfolio.
- [x] Oddzielono Node24 owner od lekkiego adaptera. Zachowano koordynator,
      R1–R14, IPC, scope, Stop i historię; attach sam nie wykonuje Start.
- [x] Rzeczywisty cua_repl importuje adapter bez process/SQLite/nodemailera;
      pełna krótka fixture kończy się jedną fikcyjną akcją i cleanup.
- [x] W rzeczywistym hoście sprawdzono Stop, utratę ACK/karty oraz odmowę
      obcego scope/originu/odbiorcy/body/PDF; Node IPC zachowuje własną macierz.
- [x] Lokalna propozycja materiałów v1 z provenance/diff i wejściem istniejącej
      usługi sprawdzona na nowej bazie. Nie zastosowano jej na WORKSTATION.
- [x] Końcowy pełny Windows check dokładnych bajtów: PASS 773/12/26,
      229 plików przed/po bez zmian. Zgodność z blobami commitu i osobny
      wynik CI są w metadanych finalnej dostawy oraz TEST_REPORT.
- [ ] Realne 8 h hosta: następny krok to --wall-clock na kompletnej lokalnej
      fixture, ten sam adapter/owner/lease w aktywnym zadaniu, odebrany deadline
      i raport. NOT_RUN; przyspieszony zegar nie zastępuje tej próby.
- [ ] Później osobne zlecenie: Stop/koniec operacji/backup, wybrany build/doctor,
      preview aktualnych materiałów i historii, jedna zgoda na nowe fakty/PDF,
      zgodność konta i From/Reply-To, polityka/plan/tempo/limity/okno, pilot i Start.

[Raport zakresu](reviews/JOBHUNTER_HOST_MATERIALS_RESULT.md),
[obsługa bez frontendu](HOST_ADAPTER.md), [fixture](NIGHTFLOW_HOST_FIXTURE.md).
Poniższe checklisty zachowują wcześniejsze wyniki i historyczne ograniczenia.

## R14 / CLI / host — 21 października 2026

- [x] Przeczytano nowy raport/dowody/propozycję regresji c03161ba, zweryfikowano
      20 plików manifestu ZIP-a. Rzeczywista baza pracy c03161ba, osobny worktree.
- [x] R14: Stop wymaga związanego ACK; brak odpowiedzi nie staje się sukcesem
      odczytu. Status UNKNOWN jest oddzielony od zapisu PERSISTED_SNAPSHOT.
- [x] Natywne regresje rzeczywistego IPC/CLI, scope, utraconych/uszkodzonych ACK,
      readonly i koordynatora z kompletnym fikcyjnym transportem.
- [x] Zaplanowane trzy pomiary przed/po, nadzór procesu z zachowaniem 30 s,
      fazy/cleanup/exit w bezpiecznym kanale i artefakty backendu CI przy awarii.
- [x] Publiczne wejście z kompletną nową fixture i własnym localhost; Node E2E
      zakończenia/Stop/utraty wykonawcy/niepewnej jednej akcji.
- [x] Windows check przed CI 39572278361: 761/761 backend, 12/12 Stop, typecheck/build,
      26/26 UI, exit 0, 223 identyczne testowane pliki przed/po. Pierwszy
      pełny FAIL 760/761 zachowany; poprawiono wyłącznie zegar fixture okna.
- [x] Po nowym CI FAILURE 39572278361 odczytano dostarczony artefakt:
      test deadline 1 ms błędnie wymagał cleanup po SIGTERM przy SERVICE_READY.
      Poprawiono handshake i anulowanie inicjalizacji; 7/7 celowanych regresji.
      Żywy właściciel nadal blokuje przejęcie, martwa blokada wymaga ESRCH.
- [x] Pełny Windows check po naprawie CI: 765/765 backend, 12/12 Stop,
      typecheck/build, 26/26 UI, exit 0; 823097,7617 ms, 224 identyczne
      pliki przed/po; manifest i poprzednie FAIL/PASS zachowane w raporcie R14.
- [ ] Osiem godzin rzeczywistego hosta: HOST_TEST_NOT_RUN. Import w bieżącym VM
      zatrzymuje się w zależności Node (`process is not defined`, nodemailer).
      Najpierw krótki `runLocalHostFixture` w hoście obsługującym Node + tab,
      następnie wallClock:true; dokładne wejście w NIGHTFLOW_HOST_FIXTURE.
- [ ] Kontrolowana aktualizacja i osobno dopuszczony pilot pozostają poza zleceniem.

Końcowy Windows check, commit/CI i ZIP są rejestrowane w
[raporcie R14](reviews/JOBHUNTER_R14_CI_HOST_WYNIK.md); poniżej historyczny stan
18/19.10, z zachowaniem pierwszych FAIL.

## Windows nightflow — gałąź napraw

- [x] Osobny worktree i syntetyczne dane; brak odczytu/migracji prywatnej bazy,
      modeli, publicznego researchu, Gmaila lub deploymentu.
- [x] Kod R1–R11/R13 i celowane odtworzenia usług/IPC/UI; parser 4,
      migracje 026–027 bez zmiany dawnych plików. R12 ma osobną końcową serię niżej.
- [x] Granice zapisu/wznowienia koordynatora: zgoda na reguły przyszłego wyboru,
      atomowy binding, CLI, Stop/restore, fixture, aktywny browser i heartbeat
      przez osiem godzin kontrolowanego zegara.
- [x] Przegląd granic zapisu/wznowienia i finalny Windows check: 721/721 backend,
      12/12 serial Stop, typecheck/build, 22/22 UI; niezmienny manifest kodu.
- [x] Opublikowano kod i dowody (894ab953…); narzędzie ZIP sprawdziło pełne
      drzewo Git, wszystkie 216 testowanych plików i ponowne wypakowanie.
      Patch odtwarza 376 plików; osobna kopia ZIP: npm ci/build/fixture PASS.
      Metadane finalnego przekazania są dopisywane po commicie w paczce.
- [x] Ustalono pierwszą błędną asercję CI 39171469775 / 117805244708 z nowego
      przeglądu: timeout procesu CLI 30000 ms, status null wobec 0. Historyczny
      FAIL pozostaje; brak dawnego error.code/signal nie rozstrzyga fazy.
      Dodano nowe pomiary i diagnostykę; nie zmieniono progów Stop/fixture/lease.
- [ ] Przed prawdziwym użyciem: zatwierdzone ustawienia planu, spójny backup,
      rozstrzygnięcie starego PAUSED, kontrolowana aktualizacja/audyt/odnowienie,
      utrzymanie rzeczywistego hosta browser i osobno dopuszczony pilot.

[Zakres, komendy, testy i granice](reviews/WINDOWS_NIGHTFLOW_IMPLEMENTATION.md).
Poniższe checklisty zachowują historyczny stan sprzed bieżącej gałęzi.

## Doprecyzowanie po przeglądzie — etap pakietu informacji

- [x] Eksporter readonly schematu 20–25, ścisła projekcja i redakcja przed
      publikacją; wszystkie szkice/wersje i dostępne historyczne materiały.
- [x] Wymaganie jednej sekwencji obsługiwanej rozmową Codex, z priorytetem
      odnowienia dotychczasowej biblioteki, zapisane z datą i statusem docelowym.
- [x] [Macierz R1–R12](REVIEW_FINDINGS.md) zachowuje otwarte problemy i źródła dowodów.
- [ ] Implementacja i test koordynatora research → kontrola → partia → sender;
      trwałe przejścia, odrębne prawidłowe zakończenie i utrata uprawnienia.
- [ ] Kontrakt wcześniejszej zgody na reguły wyboru przyszłej partii, ustalenie
      rzeczywistego tempa/limitów/okna i wykonawcy. Brak autoPolicy w kopii.
- [ ] Bieżący `workstation-invocation-record.json`, manifest aktywnego programu
      oraz pełna weryfikacja podtrzymania rzeczywistego wykonawcy.
- [ ] Naprawy R1–R12 poza tym zadaniem; nie uznawać eksportera za naprawę rdzenia.

Wyniki publikacji i kontroli: [AI_REVIEW](AI_REVIEW.md), [TEST_REPORT](TEST_REPORT.md).

Implementację sprawdzono na osobnym worktree `codex/core-completion`.
Później osobno zlecono commit/push i publiczny eksport wybranej kopii:
[AI_REVIEW](AI_REVIEW.md). Bez wdrożenia prywatnej instalacji.
[Zakres, komendy i procedura aktualizacji](CORE_IMPLEMENTATION.md).
Weryfikacja zintegrowanego diffu: [TEST_REPORT](TEST_REPORT.md).
Poniższe historyczne próby nie są testem nowych zmian.

Źródła wymagań: [specyfikacja](../JobHunter_SPEC.md), [wizja](WIZJA_PROJEKTU.md),
[AGENTS](../AGENTS.md). Kontekst do analizy całego projektu:
[REVIEW_HANDOFF](REVIEW_HANDOFF.md). Starsze checklisty zachowano w
[archiwum](archive/2026-10-17/TASKS.md); nie są aktualnymi blokadami produktu.

## Stan potwierdzony

- [x] Jedna historia LOCAL_ONLY na domowym Windowsie; osobny DEVELOPMENT/DEMO.
- [x] Research zapisuje firmy, literalne kontakty, źródła i wersjonowane szkice.
      Sesje 1–24 h, plan rozszerzany, odłożenia, kontrola deadline i brak autostartu.
- [x] Opcjonalne GMAIL_API i GMAIL_BROWSER z tą samą historią/limitami/Stop.
      Dwa osobno autoryzowane SELF_TEST przez przeglądarkę: SENT_CONFIRMED;
      użytkownik potwierdził 2/2 Odebrane i działające CV. To nie gwarancja folderu.
- [x] Ostatnia sesja planowana 8 h przerwana po 3 h 32 min 8 s przez prywatny
      guard po uzupełnieniu pustej domeny. 43 nowe rekordy firm / 37 kontaktów /
      19 szkiców; biblioteka 515/413/240, wersje 254 → 285. Nie są to liczby
      potwierdzonych niezależnych podmiotów ani wiadomości gotowych do wysyłki.
- [x] Rozdzielić fakty: stop 03:24:51, systemowe rozłączenie 03:54:51,
      podłączenie od 08:02:09. Zachować przyczynę PROTECTED_DATA_CHANGED wobec
      stanu sprzątania STOPPED. Kontrole źródeł: 2 stare szkice nieaktualne
      na stopie, 5 podczas audytu 08:08; trzy zestarzały się po sesji.
- [x] Niezależny audyt readonly: 52 tabele, integrity=ok/FK=0, spójne backupy,
      stare ID/254 wersje/materiały/blokady/granica kampanii zachowane.
      32 dawne kontakty odświeżyły dowody/daty, 63 dowody daty/fragmenty;
      oryginalne fragmenty i hashe zachowane. 8 dawnych prób/liczników bez zmian.
      Research/send zatrzymane, automatyzacja tej sesji PAUSED.
- [x] Eksport raportu rozdziela stan sprzątania i przyczynę z jawnie wskazanego,
      zakończonego wyniku kontrolera zgodnej sesji; bez niego nie zgaduje powodu.
- [x] Uporządkować dokumenty i zachować historyczne raporty; usunąć fałszywy
      opis stałego limitu 3 szkiców we wszystkich wariantach RESEARCH_ONLY.

## Przed następnym długim researchem

- [x] Nowy guard w repo odróżnia potwierdzone uzupełnienie
      null → domena od podmiany istniejącej tożsamości. Nie wystarczy usunięcie
      pola z porównania; wymagane źródło, alias, niezmienione ID/nazwa/historia/
      blokady i negatywne testy konfliktów. Szczegóły: [KNOWN_ISSUES](KNOWN_ISSUES.md).
      Dowód jest atomowo zapisany przy kwalifikacji i przechodzi powtarzane
      porównania ze stałym baseline. Stary kontroler i jego
      prywatne pliki pozostają materiałem historycznym poza Git.
- [x] Dodano wspólną przeglądalną, testowaną ścieżkę
      sesji/audytu w repo; bez sekretów, autostartu, odnowienia deadline lub
      automatycznego wznowienia po awarii. `research:session` i panel korzystają
      z natywnego startDay/tick oraz nowego lifecycle; historycznych helperów nie wdrażano.
- [ ] Przy nowym zleceniu rozstrzygnąć pozostawiony PAUSED checkpoint;
      backup przed operacją, bez kasowania danych lub samoczynnego wznowienia.
- [x] Dodano przeplatanie DISCOVERY/REFRESH/REUSE, pomiary etapów/HTTP/cache/modeli,
      mierzyć nowe rekordy osobno od odwiedzin i wersji. Bez obchodzenia deduplikacji.

## Przed pilotem do firm

- [ ] Odświeżyć źródła w chwili użycia; wcześniejsze PASS nie daje trwałej gotowości.
- [ ] Wyjaśnić zgłoszenie domena/subdomena oraz niepewne kontakty. Stary alias
      jest rozstrzygnięty, jedna firma pozostaje wstrzymana ze względu na cel kontaktu,
      inna trwale zablokowana. Szczegóły identyfikujące firmy pozostają prywatne.
- [ ] Osobno dopuszczony celowany odczyt historii i konkretny podgląd pilota
      do maksymalnie 3 firm. Obecnie brak zgody na wysyłkę do firm.
- [ ] Po ocenie pilota jawnie zatwierdzić zakres/tempo/materiały/nadawcę i Start.
      AUTO_POLICY jest zaimplementowany; po świadomym Start nie przywracać
      indywidualnej akceptacji każdego zgodnego pierwszego maila.
- [ ] Wyjaśnić historyczną niestabilność benchmarku Stop pod dużym obciążeniem;
      późniejsze PASS nie ustalają przyczyny wcześniejszego przekroczenia progu.

## Późniejsze rozszerzenia

- [x] Rozdzielono „wyślij przygotowaną partię” od „szukaj i wysyłaj ciągle”.
      Użytkownik preferuje nocny research i osobno uruchamianą dzienną wysyłkę.
      Model trwałej partii korzysta ze wspólnego sendera i historii. Panel
      prowadzi przez przygotowanie, zatwierdzenie zakresu, Start, Stop i wznowienie.

## Pozostałe operacje poza zakresem tej implementacji

- [ ] Dopuszczony przez użytkownika audyt konkretnego prywatnego backupu.
- [ ] Aktualizacja zatrzymanego WORKSTATION zgodnie z procedurą; nie wykonywano jej teraz.
- [ ] Weryfikacja rzeczywistego hosta browser przez całą zatwierdzoną partię.
      Kontroler/lease/IPC sprawdzamy syntetycznie; nie deklarować ciągłości po zamknięciu Codexa.
- [ ] Osobna ocena materiałów wybranej partii oraz świadomy Start dopuszczonego pilota.
      Nie deklarować osobnego produktu do partii jako już wdrożonego.
- [ ] Jeden adapter ofert/formularzy pracy, później kwalifikacja potencjalnych
      zleceń stron/automatyzacji. To przyszły zakres; bez CRM/AI odpowiedzi/follow-upów.
- [ ] Rzeczywiste macOS dla nowego transportu, pełna izolacja procesu OS,
      długi test prawdziwego sendera, pełna macierz awarii opcjonalnego PRIVATE_GIT.

## Przygotowanie repozytorium do analizy

- [x] Bieżący kontekst, problemy i wyniki zamiast sprzecznych historycznych stanów.
- [x] Końcowy pełny check Windows: 555 backend / 12 performance / 19 UI,
      typecheck/build PASS, celowane 26 PASS; readonly eksport i odrzucenie
      wyniku innej sesji. 52 tabele i PDF bez zmian, spójne backupy przed/po.
- [x] Kontrola lokalnych linków i bieżących plików do publikacji bez błędów
      lub znanych wzorców poświadczeń; prywatne pliki ignorowane. Nie stanowi
      audytu całej historii Git. Wygenerowane raporty testowe przeniesione poza
      repo, bez usunięcia migracji, historii lub potrzebnych zależności.

Zmiany przygotowane do lokalnego commitu i pakietu źródeł dla AI.
Rewizję ustala Git/manifest pakietu. Push nie jest deploymentem lub Start;
GitHub CI wymaga osobnego rzeczywistego sprawdzenia konkretnego SHA.

## 24.10.2026 — niezależne odnowienie istniejącej biblioteki

- [x] Oddzielna możliwość researchu przy zapisanym AUTO_POLICY: bez zmiany polityki, zakresów i bez inicjalizacji Gmaila.
- [x] Rozliczenie wyłącznie własnego zakończonego cyklu po lokalnym błędzie danych; regresja A → odrzucone B → C oraz brak ingerencji w obcy PAUSED.
- [x] Ochrona właściciela, Stop, bezwzględnego deadline, profilu/polityki/wersji i wykluczonych materiałów wraz ze współdzielonymi źródłami.
- [x] Ekstrakcja dostępności z zatwierdzonego profilu i kontrola wersji analizy przed użyciem cache; odrębne zapytanie badawcze nie dziedziczy warunków odrzuconej oferty.
- [x] Dokładny kod b0ac8ca5f20b65d4416d8c1cb7f7bbdefac2b3cf: Windows/Node24, celowane 69/69 oraz pełne 873 backend + 12 Stop + 26 UI, typecheck/build/doctor PASS.
- [ ] Osobne przyszłe zadanie: wspólna, badawcza ścieżka korekty mapowania claims dla istniejącego materiału odrzuconego przez kod, z nową wersją i regresjami, bez uruchamiania usługi Gmaila. Sam review nie naprawia odrzucenia kodowego.

Szczegóły kontraktu: docs/reviews/INDEPENDENT_LIBRARY_REFRESH.md. Prywatne wyniki i kolejki pozostają poza repo. Te zmiany nie uruchamiają pilota ani prawa nadawania.

## 24.10.2026 — kolejność zamkniętej partii

- [x] Odtworzyć C/B/A na bazowym kodzie i wybierać tylko aktywną zamkniętą
      partię według zatwierdzonego ordinal; ciągłe AUTO zachowuje selekcję.
- [x] Regresje kolejności przygotowania/rezerwacji/prób, review, pominięć,
      zmian materiału, QUEUED, obcego scope i pojedynczej akcji brokera.
- [ ] Osobny rzeczywisty pilot: ponowny aktualny preflight i jedna zbiorcza
      zgoda na dokładne materiały, celowaną historię i warunkowy Start.

Wyniki Windows/CI oraz identyfikacja instalacji są rozliczane w dowodach
dostawy. Sama poprawka i aktualizacja nie udzielają prawa nadawania.

## 25.10.2026 — gotowość wykonawcy przed pierwszym Start

- [x] Odtworzono wczesne przypięcie MANUAL i sprawdzono probe → pojedynczy Start → ta sama instancja BATCH. Korekta procedury, bez zmian sendera, limitów i selekcji ciągłego AUTO.
- [x] 13 nowych regresji syntetycznych: zimny start, błędny scope/backend/worker/lease, Stop i spóźniony callback, utracony ACK Start bez retry, RPC timeout przy działającym hoście, awaria pierwszej akcji i SEND_UNKNOWN.
- [x] Rzeczywisty Computer Use na lokalnej stronie: 3 fikcyjne akcje w zatwierdzonym ordinal, jeden syntetyczny Start/sesja, brak API fallback, COMPLETED, potwierdzony release i cleanup.
- [ ] Pełny bieżący Windows check i CI dokładnego SHA są wymagane przed dostawą; wynik wykonania i identyfikacja buildu w prywatnym raporcie dostawy. Nie zastępować ich dawnym PASS.

[Procedura i izolowana komenda diagnostyczna](HOST_ADAPTER.md). Ta zmiana nie udziela prawa do prawdziwego Start, Gmaila, nowego scope ani wysyłki.
