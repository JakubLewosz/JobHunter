# Jakość nowych wiadomości — 25.10.2026

Zakres: DEVELOPMENT, bez Gmaila, OAuth, Startu i zmian WORKSTATION.
Punkt odniesienia: 4c35064d27823c1c665bcaaf0b8779936d092a63.

Przyczyny rozdzielono: natywny generator dostawał pełne poprzednie listy
i zapisany wzór ze stałym układem; wybór projektu mógł premiować samo
używanie AI przez firmę. `checkDraft` zwracał uwagi, a faktyczne bramki
sprawdzały PASS/COMPLETED oraz supported/issues. Uwagi redakcyjne nie były
osobnym warunkiem gotowości. Niezapisane propozycje ad hoc nie są dowodem
pochodzącym z tego generatora. Prywatny odczyt potwierdził różnicę aktywnego
wzoru i defaultu; nie zmieniono tego wzoru ani zatwierdzonych materiałów.

`message-quality.ts` skraca i porządkuje instrukcję generowania, dodaje
fikcyjne porównania, oddziela konkretne zadanie od nazwy narzędzia AI.
`recentMessageContext` przekazuje sygnały wad, bez tekstów poprzednich listów.
Wzór z placeholderami wnosi ich preferencje, bez kopiowania stałych akapitów.
`projectSelection` nie wybiera CodeFabric tylko na podstawie używania Codexa.

Istniejący SEMANTIC_REVIEW otrzymuje krótki werdykt `quality` z dokładnym
fragmentem i powodem. Faktografia zachowuje supported/issues. Dla nowego
materiału brak PASS jakości blokuje `draftMaterialIssues`, także w AUTO.
To problem wersji szkicu, bez odmowy firmy, suppression lub ręcznej zgody
na każdy mail. Stare zatwierdzone materiały nie są masowo migrowane.
Nie ma migracji SQL: wersja reguł i budżet korekty mieszczą się w context_json,
a wynik w review_result istniejącego materiału.

Kod utrwala co najwyżej jedną próbę korekty przed jej wywołaniem. Do korekty
kwalifikuje się wyłącznie tekst poparty faktami z konkretnymi wadami REVISE.
Dobry tekst zachowuje treść i wersję. Korekta nie może rozszerzyć referencji;
nowa wersja i claims przechodzą checkDraft i pełny nowy review. Nie ma kopii
PASS. Nieudana korekta pozostaje niedopuszczona, także po retry/restarcie.
Zwykły szkic nadal kosztuje DRAFT + dotychczasowy review; tylko korekta
dodaje wywołanie poprawki i review finalnej wersji. Kod zachowuje nieobjęte
literalnym defektem akapity oraz temat; odrzuca przepisanie ich przez model.

`verifyDraft` i `retryDraftReview` są w ResearchJobHunter, również dziedziczone
przez obsługę poczty. Edycja ad hoc odtwarza claims bez zmiany tekstu, zapisuje
własną niezweryfikowaną wersję i używa tego samego review. Kod nie wymaga
aktywnego prawa wysyłki do przygotowania materiału. Po każdym oczekiwaniu
sprawdza Stop/abort/deadline, właściciela, dokładną wersję, profil, kontakt
i źródła przed zapisem, także błędu. PASS kodu jest utrwalany dopiero po review.

Przyszła obsługa Codex: przygotować kandydaturę z zatwierdzonych faktów i
publicznych dowodów; zapisać przez zwykłe editDraft; wywołać verifyDraft dla
tej wersji; odczytać aktualną wersję, claims i draftMaterialIssues. Po korekcie
numer może wzrosnąć. Nie używać prywatnego skryptu jako alternatywnej bramki
gotowości, nie kopiować starej oceny i nie uruchamiać Startu w przygotowaniu.
Zapis pięciu prywatnych propozycji i nowy zakres wymagają osobnego zadania.

Testy obejmują 20 fikcyjnych kontekstów GENERAL/OPEN/ACTIVE, projekty i ich
pominięcie, unknown hours, konflikt zdalności, kontrolowaną słabą redakcję,
dobry tekst, udaną/nieudaną korektę, nowe claims, brak werdyktu, factual reject,
budżet po restarcie oraz wyścigi podczas review i korekty. Rzeczywisty benchmark
CLI na 20 sparowanych fikcyjnych wejściach zachowano poza Git. Wynik wstępny
nie dowodzi wzrostu jakości: 20/20 ocen jakości before, 19/20 first-try after
i 1/1 po korekcie. Niezależne błędy referencji pozostają blokujące.
Prywatne v5 służyły także kalibracji fałszywego alarmu; treści nie publikowano.

Końcowy celowany zestaw Windows: 177/177 PASS, bez FAIL/SKIP/cancel,
48 nowych regresji jakości i wyścigów; typecheck PASS.
Pełny Windows check i CI dokładnego finalnego SHA są rozliczane w prywatnym
raporcie dostawy. Pierwszy check przerwano przed końcem na kalibrację review;
nie jest PASS. Nie wykonano wdrożenia ani zmiany produkcyjnej polityki.
