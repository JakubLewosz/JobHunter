# Windows — zakres potwierdzony i lista następnej kontroli

18.10: implementacja i syntetyczne testy na Windows x64, Node 24.19.0,
npm 11.17.0. Dokładny aktualny wynik: [TEST_REPORT](TEST_REPORT.md).
Nowe komendy i późniejsza procedura: [CORE_IMPLEMENTATION](CORE_IMPLEMENTATION.md).
Nie wykonywano publicznego researchu, OAuth, Gmaila ani migracji prywatnej instalacji.

Wyniki historycznych etapów: [TEST_REPORT](TEST_REPORT.md). Potwierdzono rzeczywisty
domowy Windows, Node 24, SQLite, native CLI, publiczny research i dwa osobno
zlecone SELF_TEST Gmail UI. Nie oznacza to pełnego dnia produkcyjnego AUTO.
Nowy kod/testy należy przypisać do faktycznie uruchomionej rewizji.

Poniższa lista jest procedurą przyszłej kontroli, nie zapisem wykonania wszystkich
punktów. Domyślny nowy checkout to DEVELOPMENT/DEMO, bez natywnego Gmaila.

1. Sprawdzić AGENTS, czystość/gałąź i brak aktywnego sendera przed zmianą/buildem.
2. Node 24, npm ci, npm run check. Zachować dokładny log/zakres i wynik każdej części.
3. npm run doctor rzeczywiście ładuje SQLite. CLI potwierdzić version/help;
   używać native exe, bez poszerzania uprawnień lub API key.
4. Start/health/open/Stop w osobnym syntetycznym DEMO; ścieżka ze spacjami,
   zwolnienie locka, brak auto-resume. Nie odczytywać tokenu panelu do modelu.
5. Publiczny smoke tylko po osobnym zleceniu. RESEARCH_ONLY, poprawne CA,
   reader/search preflight, zatwierdzone materiały, określony deadline i raport.
6. Rejestrować literalne kontakty/przeznaczenie, dowody, cache, odłożenia,
   pełne wersje szkiców, czas kontroli i wszystkie błędy. Nie liczyć PENDING jako wyniku.
7. Przy końcu/przerwaniu readonly audyt, spójny backup z WAL, stare ID/wersje/
   materiały/historia/blokady/kwoty zachowane. Nie wznawiać samoczynnie.
8. Gmail/SELF_TEST/pilot to oddzielne uprawnienia; fixture nie jest realną dostawą.

Prawdziwy WORKSTATION ma istniejącą historię i lokalny marker. Nie tworzyć nowej
bazy lub configure w celu obejścia problemu. Nie zmieniać zasilania/autostartu.
Przed kolejną długą sesją świadomie wdrożyć przetestowany guard z repo
i osobno rozstrzygnąć historyczny checkpoint.

[Dawna instrukcja i datowane wyniki Windows](archive/2026-10-17/WINDOWS_SMOKE.md)
pozostały zachowane. Stwierdzenie z 12 października „Windows nieprzetestowany”
dotyczyło tamtego etapu, nie obecnego stanu.
