# Jeden eksperyment DTO — 25.10.2026

**EXPERIMENT ONLY — nie jest wersją wybraną do WORKSTATION.** Bazą ochrony
jakości pozostaje 4c573619964b6f39c9295c379f5b138c32b47aed. Wynik skuteczności
i decyzję o zachowaniu/odrzuceniu eksperymentu rozlicza prywatna dostawa.
Techniczne PASS nie udowadnia poprawy tekstów i nie udziela zgody na wdrożenie.

Jedyna zmiana zachowania to prezentacja danych DRAFT w `draftModelData()`:
`projectSelection.selected[].fact` ma ID i klucz, bez drugiej kopii `content`.
Pełny, zatwierdzony fakt nadal znajduje się w `profile.facts`. Zachowano
scores/proofs, reguły selekcji i identyfikatory. `draftProfile` zapisany przez
native generate, binding, checkDraft, semantic review oraz targeted revision
nadal otrzymują pełne dotychczasowe dane. Wspólny `messageModelData()` pozostaje
bez zmian. Nie zmieniono instrukcji, rubryki, temperatury, modelu lub liczby
faz generowania. Dobry szkic nie jest przepisywany. Jedna korekta i wszystkie
bramki wersji/źródeł/legacy/Stop/owner/deadline/AUTO pozostają.

Nowy holdout: 12 innych niewysłanych w JobHunterze firm z zapisanych źródeł,
bez wcześniejszych 12 przypadków, 23 kontroli ani wysłanych v5. Offline replay
na fikcyjnych adresach, świeża DEVELOPMENT baza per próba i DisabledMailProvider.
6 PROSPECT, 3 OPEN, 3 ACTIVE; GENERAL/RECRUITMENT, konflikty ofert i wąskie źródła.
Dwie niezależne powtórki każdej wersji na każdym kontekście: 48 pierwszych DRAFT,
przemieszana i utrwalona kolejność. Bez discovery lub korespondencji Gmaila.

Literalny capture przed generowaniem potwierdził duplikat i diff wyłącznie
`selected.fact.content` w 9 kontekstach; 3 bez projektu mają identyczne wejście
i są kontrolą negatywną, ich losowe zwycięstwa nie dowodzą wpływu poprawki.
Pierwszy protokół zastosował próg proporcjonalny do całego zestawu; przed
jakimikolwiek odpowiedziami doprecyzowano tę samą proporcję dla 18 par z 9
zmienionych kontekstów. Oba zapisy pozostają w prywatnej dostawie.

Stała ślepa rubryka: naturalność, konkretny udokumentowany powód firmy,
przekonujące dopasowanie lub uzasadnione pominięcie projektu, brak katalogu
i metakomentarzy, jedno pytanie oraz zachowane warunki kandydata/GitHub/CV.
Fakty i cel kontaktu są osobną oceną. Zaplanowano maksymalnie dwie osobne
ślepe oceny każdej z 24 par, z niezależnym mapowaniem A/B; ten sam dostawca
CLI, bez twierdzenia o innej architekturze modelu. Drobna różnica słów/długości
oznacza remis. Przed pierwszą oceną dopisano regułę ujemnego futility:
najpierw pierwsza ocena wszystkich par; druga pełna seria jest potrzebna
tylko gdy pierwsza pozwala jeszcze osiągnąć pierwotny próg zgodnych wygranych
(12 łącznie i 6 w każdej powtórce). Jeżeli arytmetyczna górna granica jest
niższa, kończy się decyzją ujemną. Nie obniża się progów ani nie zastępuje
otrzymanych ocen. Odstępstwo od pierwotnego planu jest jawne w dostawie.

Zamrożony próg adopcji: co najmniej 12/18 zgodnych wyraźnych zwycięstw obu
ocen, najwyżej 3 zgodne porażki, co najmniej 6/9 kontekstów ze zwycięstwem
i bez porażki oraz co najmniej 6 zwycięstw w każdej powtórce. Na wszystkich
48 próbach nie może wzrosnąć liczba code rejects, niepopartych deklaracji lub
przepuszczonych istotnych wad. Potrzebne są konkretne przekonujące przykłady.
Próg jest konserwatywny; mała próba i wspólny dostawca pozostają ograniczeniami.

Brak wyraźnej przewagi oznacza `GENERATOR_IMPROVEMENT_NOT_CONFIRMED`, pozostawienie
bezpiecznej bazy 4c57361 i koniec tej hipotezy, bez następnego automatycznego
strojenia. Eksperymentalnego ZIP/patcha nie łączy się z proponowaną instalacją.
Wynik i teksty pozostają prywatne. Nie zmienia się WORKSTATION, v17, profilu,
CV, P1, historii lub blokad. Bez Startu, Gmaila, partii i rzeczywistego send.

Syntetyczne regresje obejmują AutoRelay, CodeFabric, Sęk i Forma, brak wyboru,
dwa niezależne projekty, brak projectSelection, zachowanie faktów/claims/proofs
oraz pełnych danych review. Pierwsza próba 67/69 PASS ujawniła dwa błędne
założenia fixture: tytuł integracyjny dawał projekt mimo braku dopasowania
aktywności, a drugi wynik miał score poniżej wymaganego progu. Skorygowano
wyłącznie fikcyjne dane, nie selektor. Kolejna próba 69/69 PASS. Baseline
reproducer i końcowy check/CI są zachowane i osobno rozliczane w dostawie.

Pierwszy pełny Windows check 7b2f3a1: 987/988 backend PASS, FAIL1 w dawnym
kontrakcie testu, który wymagał drugiej kopii content w DRAFT selected.fact.
Test zachowuje teraz pełny kanoniczny fakt w DRAFT i pełny selected.fact
w review **oraz zapisanym materiale**, a generacyjna selekcja ma ID/klucz.
Nie złagodzono kontroli faktów ani zapisu. Końcowy pełny check/CI następcy
są osobnymi wynikami. Błędy wykonania modelu nie są dowodem jakości.

Końcowy lokalny Windows check 1940b99: 988 backend, 12 Stop, 26 UI,
typecheck/build PASS. CI b0c97cb: te same wyniki, bez FAIL/SKIP/cancel.
Następny commit zmienia tylko dokumentację; CI jego dokładnego SHA pozostaje
odrębnym wynikiem w prywatnej dostawie. Nie ma podstaw do proponowania
eksperymentalnego DTO do WORKSTATION; pozostaje osobną gałęzią audytową.
Baza ochrony jakości 4c57361 jest zachowana. Nie rozpoczynać kolejnego
automatycznego strojenia na tym holdoucie. Prywatne teksty, rozbieżności
ocen i koszty rozlicza raport poza repo, a nie techniczny PASS.
