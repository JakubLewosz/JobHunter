# Bieżące zadania — 18 października 2026

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
