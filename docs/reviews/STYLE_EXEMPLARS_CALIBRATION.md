# Wzorce i kalibracja recenzenta — DEVELOPMENT

Poprzednia runda f85f0e8/83a86e5 pozostaje **STYLE_VALIDATED=FAIL**:
1 preferencja nowego, 15 remisów, wszystkie 32 natywne quality PASS.
Nie zmieniono jej progów lub wyników. Nie przeniesiono całego kandydata.

Samodzielna poprawka techniczna: `c905b7ee9eefd978848204b0bbba8bb6c2852104`,
baza 0cca725, wyłącznie wspólny warunek `materialRecordIssues` i regresje.
Wersja kryteriów bazy pozostaje 1, żadne instrukcje stylu nie są częścią
tego commitu. Dwa testy najpierw wykazały brak nowego review i skopiowany
stary PASS zamiast nowego HOLD. Ostateczny celowany Windows 41/41 PASS,
obejmujący niezmieniony dobry tekst, własne nowe review, zachowaną historię,
wykluczenie/protected scope, Stop i blokadę późnego zapisu po utracie ownera.
Utrata ownera nie pozwala także na końcowy zapis Stop do SQLite; syntetyczny
test porównuje niezmienione materiały i sprząta dopiero po przywróceniu
własnego testowego ownera. Pozostaje DEVELOPMENT, niezależnie od stylu.

Osobny kandydat stylu ma kryteria v3. Pełne fikcyjne odpowiedniki wzorców
oraz opisane konkretne kontrprzykłady trafiają do generatora, review dokładnej
treści i jednej korekty przez `message-style-examples.ts`. Nie są danymi
kandydata, dowodami lub zgodą. Fikcyjny link/obce referencje ze wzorca nie
mogą przejść natywnej kontroli. Usunięto mylący przykład ręcznego ponawiania
i nakaz jednej czynności/czasownika. OPEN ma prosty cel dołączenia do zespołu.
Kontekstowe ograniczenie demonstracji nie jest automatycznym defektem META.
DTO, isolation, model/effort/CLI i timeout pozostają bez zmian.

Kalibracja przed generatorem: 13 pełnych materiałów, osobne natywne review
i ten sam produkcyjny schemat, bez zbiorczego quizu. Oczekiwania zapisane
przed wywołaniami: 5 dodatnich, 7 istotnych wad stylu i 1 fałszywa deklaracja.
Maksymalnie dwa warianty; przeładowany znany przypadek nie może dostać PASS.
Niepowodzenie blokuje nową dużą próbkę. Gdy bramka przejdzie, osobno zamraża
się kandydata i 8 innych kontekstów, wykluczając poprzednie 16 widzianych.
Same PASS ani remis słaby–słaby nie dowodzą przewagi. Próg 8/16 i korzystny
bilans obu serii pozostaje bez obniżania. Pełne prywatne teksty i prompty,
proweniencja oryginałów i ledger pozostają poza publicznym Git.

**Kalibracja recenzenta: FAIL. Generator holdout: NOT_RUN_CALIBRATION_FAILED.**
Pierwsza próba miała błąd współdzielonej kopii: pozytywny tekst zastąpił też
jeden negatywny przypadek; zachowano wejście i wyniki jako INVALID_INPUT_ASSEMBLY.
Druga i ostatnia próba użyła dokładnego oryginału (hash sprawdzony przed
wywołaniem), bez zmiany kryteriów lub promptów. Wynik: 5/5 dobrych zachowanych,
6/7 istotnych wad stylu wykrytych, fałszywa deklaracja klienta zablokowana
kodowo. Jeden znany przypadek powtórzenia procedury dostał PASS zamiast
wymaganego REVISE. Dwa wywołania tego przypadku miały identyczny prompt SHA,
lecz różne REVISE/PASS. Nie złożono wyniku z najlepszych części obu prób.

Nowej odłożonej ósemki nie wybierano, nie uruchomiono 32 tekstów ani ślepych
porównań. Nie zmieniono progu 8/16 i nie wykorzystano pozostałego budżetu
do trzeciej kalibracji. Wygenerowano tylko dwie wymagane prywatne demonstracje
z istniejących zatwierdzonych faktów i archiwalnych źródeł; mają własne kontrole
i status NOT_APPLIED. Sam ich PASS nie potwierdza gotowości nieskalibrowanego
mechanizmu. Pełne przed/po i oba przebiegi kalibracji są poza publicznym Git.
Łącznie 28/120 rzeczywistych wywołań, 0 błędów wykonania (osobno błąd wejścia),
258,238 s. Model/effort i koszt walutowy UNKNOWN; konfiguracja bez zmian.

Poprawka techniczna ma osobne [CI c905b7e PASS](https://github.com/JakubLewosz/JobHunter/actions/runs/40881097946).
Celowane testy końcowego kandydata: 186/186 Windows PASS. Pierwsze błędy
zachowane: stare asercje tekstu, niepełne nowe syntetyczne DTO oraz błędne
oczekiwanie końcowego zapisu Stop po utracie ownera. Uzupełniono fixtures
i wzmocniono dowód braku późnego zapisu; bez poluzowania reguł i progów.
Pełny Windows check końcowego kodu 69a5b23 **PASS**: typecheck,
**1050 backend, 12 Stop, build, 26 UI**.
[CI dokładnego 69a5b23 PASS](https://github.com/JakubLewosz/JobHunter/actions/runs/40883089594).
Build DEVELOPMENT `c132dd2d-f679-4f39-8b49-817bfba9626e`, 161 wejść i 149
plików dist związanych hashami; niewdrożony. Dokumentacja po tym kodzie
nie zmienia aplikacji/testów lub builda. Końcowy read-only odczyt: 62 tabele,
14 wcześniejszych prób, oba produkcyjne v2, instalacja i poprzednie wyniki/
paczki identyczne z początkiem zadania. STOPPED, bez niepewnych/aktywnych
operacji i bez prawa wysyłki. Dwa rozdzielone patche oraz pełne prywatne
teksty, prompty i raport dostarczane są poza publicznym Git.

To zlecenie DEVELOPMENT. Nie ma zgody na wdrożenie,
zmiany WORKSTATION, profilu/faktów/CV, zapisanych szkiców, historii,
Gmail/OAuth/Start/R3/SELF_TEST/rezerwacje/próby/wysyłkę. To zlecenie DEVELOPMENT.
