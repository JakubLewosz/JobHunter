# Kontynuacja V1: pomiar CLI — 28.10.2026

Stan bieżący: DEVELOPMENT; WORKSTATION nadal STOPPED na zamrożonym 1f41b55.
Nie uruchomiono nowego R1 ani Gmaila. Pierwotny deadline zgody i historia bez
zmian. To kontynuacja istniejącego zlecenia, nie nowa kampania.

## Co wiadomo o wcześniejszych przerwaniach

Odczytano oczyszczone diagnostyki tych samych trzech callId. Rejestrowały
czas 120 s i wymuszone zakończenie własnego procesu, ale nie miały zdarzeń
przed timeoutem. Nie można z nich odtworzyć czasu bootstrapu, transportu,
generowania lub zamykania. Nie dowodzą konkretnej awarii zewnętrznej.
Również małe probe nie wystarczały do oceny reprezentatywnych zadań.

Dodano mały obserwator JSONL bez treści: spawn/stdin/pierwsze bajty,
turn.started/completed, exit/close/kill, rozmiary wejścia/schematu/strumieni,
liczby źródeł i typów zdarzeń, maksymalnie 64 znaczniki zdarzeń, jawnie
obserwowane retry. Nie zapisuje rozumowania, odpowiedzi, poleceń, URL,
środowiska ani sekretów. Model/effort pozostają null, jeśli strumień ich
nie ujawnia; ustawienia rozmowy nie są uznawane za ustawienia nested exec.
Kontrola niedozwolonych narzędzi działa również od item.started i przy EOF.
Zakończony turn bez close nadal nie jest sukcesem. Kill własnego drzewa jest
wywoływany najwyżej raz; brak globalnego zabijania procesów po nazwie.

Bazowy limit nadal 120000 ms, bez resetowania przez postęp stdout. Sygnał
Stop/zewnętrznego deadline nadal przerywa wcześniejsze wywołanie. Nie zmieniono
lease, progów Stop/testów, konta, modelu, uprawnień lub konfiguracji CLI.

## Rzeczywiste pomiary Windows

CLI 0.165.0-alpha.1.2, to samo konto i izolacja JobHuntera, pomoc i wymagane
flagi sprawdzone. Wywołania sekwencyjne, bez produkcyjnych zapisów i Gmaila.
W jednej rundzie wykonano 8 z dopuszczonych najwyżej 12 wywołań:

| Przypadek | Wejście / schema, bajty | Czas | Wynik |
|---|---:|---:|---|
| Mały probe | 76 / 160 | 4486 ms | zgodny wynik i close |
| EXTRACT, 4 zachowane publiczne źródła, fikcyjny profil | 18566 / 6837 | 22759 ms | zgodny wynik i close |
| SEMANTIC_REVIEW, fikcyjny materiał, natywny prompt/schema | 27323 / 824 | 7183 ms | supported=true, REVISE, bez wymuszania PASS |
| SEARCH, natywny provider i zachowane zapytanie | 3656 / 513 | 32257 ms | 3 web search, zgodny wynik i close |
| EXTRACT, te same źródła i zatwierdzone fakty | 21841 / 6837 | 23453 ms | zgodny wynik i close |
| SEMANTIC_REVIEW zachowanego własnego materiału | 18385 / 824 | 5898 ms | zgodny wynik i close, supported=true/PASS |
| SEARCH po celowanej aktualizacji zależności | 3656 / 513 | 23852 ms | zgodny wynik i close |
| SEMANTIC_REVIEW z natywnym mapowaniem źródeł i rodzaju kontaktu | 18808 / 824 | 7789 ms | zgodny wynik i close, supported=true/PASS |

Drugie review jest reprezentatywną rekonstrukcją zachowanego pakietu, nie
bitowym odtworzeniem dawnego promptu: użyto zatwierdzonego profilu i własnego
szkicu, natywnego buildera/schema, bez zapisu tekstów w diagnostyce. W próbie
8 uzupełniono mapę research_evidence→sourceId, zweryfikowany inquiryBasis
i natywne contactType. Próba 6 nie jest dowodem dokładnego natywnego pakietu.
Oryginalna
baza była otwarta readonly; nie kopiowano SQLite do DEVELOPMENT.

W tych pomiarach pierwsze bajty pojawiały się po ok. 0,3 s, strumień zawierał
turn.completed, procesy zamknęły się prawidłowo, brak zarejestrowanych retry
transportu. Dawnych timeoutów nie odtworzono. To nie ustala ich przyczyny ani
nie daje gwarancji bezawaryjności. Brak podstaw do podnoszenia limitu 120 s,
próby z 300 s, zmiany effort/modelu lub losowych kolejnych powtórek.
Następny dowód musi pochodzić z pełnego R1 zamrożonego nowego wydania po
regresjach, pełnym check/CI, bezpiecznym wdrożeniu i doctor.

[Oficjalny format non-interactive](https://learn.chatgpt.com/docs/non-interactive-mode)
i [flagi CLI](https://learn.chatgpt.com/docs/developer-commands) wyjaśniają
kontrakt zdarzeń. Nie ustanawiają przyczyny lokalnego timeoutu JobHuntera.

## Cztery alerty zależności: osiągalność

- **Nodemailer 10.0.15:** osiągalny bezpośrednio w parseGmailMessage przy
  kontroli historii, niezależnie od transportu nadania. Natywna regresja na
  fikcyjnym nagłówku z zagnieżdżonym komentarzem odtworzyła inny adres niż
  rzeczywista skrzynka. Minimalna aktualizacja do 10.1.4 odtwarza poprawny
  adres; nowy test PASS. Wyjściowe adresy są dodatkowo walidowane, ale to nie
  chroniło wejściowego parsera historii. [Advisory](https://github.com/advisories/GHSA-8c8m-p3m8-cjg8).
- **Zod 4.6.5:** osiągalny przy nieufnym wyniku modelu i JSON żądania.
  Sam limit bajtów nie usuwa kosztu tworzenia błędu dla każdego elementu.
  Natywny reviewSchema: 60071 bajtów, 20000 błędnych elementów, 20001 issues,
  ok. 12,1 MB wzrostu heap. Minimalna aktualizacja 4.6.6: ten sam payload
  odrzucony jedną informacją too_big, ok. 0,36 MB. Oba wyniki są odrzuceniem;
  nie poluzowano schematu. Nowa regresja sprawdza tę granicę.
  [Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- **Fastify:** istniejąca wersja pozostaje objęta alertem. Ścieżka aplikacji
  nie definiuje headers/propertyNames schema, której dotyczy obejście;
  Host, Origin, sesja i CSRF są sprawdzane hookami. Nie stwierdzono tej
  konkretnej podatnej konfiguracji. [Advisory](https://github.com/advisories/GHSA-389g-gv7q-r4x8).
- **fast-uri:** pozostaje w Ajv/fast-json-stringify jako parser odwołań
  schematów. Aplikacja nie przekazuje mu publicznych URL jako podstawy
  autoryzacji/normalizacji; fetcher używa WHATWG URL i kontroli sieci.
  Brak dynamicznego schema od modelu lub użytkownika. Alert pozostaje
  maintenance; nie deklarujemy ogólnej nieosiągalności wszystkich zastosowań.
  [Advisory](https://github.com/advisories/GHSA-w74x-v6f9-j3xg).

Po dwóch celowanych aktualizacjach npm audit nadal zgłasza 2 alerty
(moderate fast-uri, low Fastify). Nie używano audit fix --force i nie
przypisano żadnego z tych alertów do timeoutów CLI. Dalsze bramki nowego
kodu muszą uwzględniać oba zmienione pakiety; stary check nie jest ich testem.

## Bramka testowa i korekta nowej fixture

Kod 3617b59: CI na windows-latest, run 40746331941, attempt 1 SUCCESS.
Pierwszy lokalny check: 1041 backend / 12 Stop / build PASS, ale wrapper
Windows PowerShell 5 z ErrorActionPreference=Stop przerwał uruchamianie UI
na ostrzeżeniu NO_COLOR/FORCE_COLOR. Wyniku nie nazwano pełnym PASS.
Po korekcie wrappera drugi lokalny check: 1040/1041; nowy test narzędzia
dostał CODEX_TIMEOUT zamiast ISOLATION_FAILED. Obie próby i logi zachowano.

Wykazano błąd założenia nowego testu: fikcyjny proces emitujący zdarzenie po
600 ms, z narzuconym przez test budżetem 350 ms, prawidłowo kończy się
CODEX_TIMEOUT/NO_OUTPUT (zero stdout). Nie dowodzi to przepuszczenia narzędzia.
Oczekiwanie konkretnej reakcji przed pojawieniem się jej bodźca było błędem.

Testy twardego 350 ms deadline kontrolują teraz zegar rodzica i najpierw
obserwują badany etap. Procesy Windows i zakończenie ich drzewa są rzeczywiste.
Pozostałe testy zdarzeń używają domyślnego budżetu aplikacji i własnego
zewnętrznego sygnału testu, bez sztucznego założenia o szybkości bootstrapu.
Dodano jawnie opóźnione zdarzenie narzędzia: nadal musi być ISOLATION_FAILED,
oraz sprawdzenie, że osobny proces testowy przeżywa kill własnego drzewa.
19/19 regresji procesu PASS. Kod aplikacji, limit LLM 120 s, istniejące progi
wydajności/Stop i oczekiwane błędy izolacji nie zostały zmienione.
Poprawka dotyczy wyłącznie nowych testów; kolejne bramki dotyczą nowego SHA.
