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

Kalibracja i wynik generatora są oczekujące. Nie ma zgody na wdrożenie,
zmiany WORKSTATION, profilu/faktów/CV, zapisanych szkiców, historii,
Gmail/OAuth/Start/R3/SELF_TEST/rezerwacje/próby/wysyłkę. To zlecenie DEVELOPMENT.
