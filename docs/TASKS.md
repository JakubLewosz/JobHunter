# Bieżące zadania — 18 października 2026

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
