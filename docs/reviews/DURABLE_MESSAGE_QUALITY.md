# Trwała jakość wiadomości — 29.10.2026

Naturalny tok i sensowny związek firma–kandydat są stałym kryterium odbioru
opisanym w [MESSAGE_STYLE](../MESSAGE_STYLE.md). Wspólna implementacja
`messageConstructionStandard` i `editorialRubric` ma wersję 2, używaną przez
generację, ocenę dokładnego tekstu i jedną celowaną korektę. Nie zmienia
faktów, kontaktów, modelu, CLI, timeoutu, uprawnień ani załącznika.

Wykazane przyczyny i granice diagnozy:

- Dotychczasowy pozytywny przykład generatora sugerował, że autor osobiście
  ponawia zadania. W połączeniu z naciskiem na jedną czynność promował
  niejasny skrót. Zastąpiono go opisem kontekstu aplikacji i jej mechanizmu;
  to wykazana sprzeczność instrukcji z wymaganiem, nie dowód wyłącznej
  przyczyny wszystkich gorszych listów.
- OPEN kierowało się dopasowaniem projektu/profilu. Cel dotyczy teraz
  możliwości dołączenia do zespołu; trafny projekt pozostaje opcjonalny.
- Reuse przy niezmienionych źródłach sprawdzał tylko częściowe przesłanki
  dawnego review. Nie uwzględniał wersji i werdyktu jakości. Nowa regresja
  rzeczywistego `refreshLibraryDrafts` najpierw zakończyła się FAIL:
  `EDITORIAL_REVIEW_REQUIRED` zamiast odnowienia. Użycie wspólnego
  `materialRecordIssues` kieruje wybrany niewysłany materiał do nowego review
  bez kosmetycznej regeneracji. Stary materiał i tekst pozostają w historii.
- Kontekstowa konieczność ograniczenia projektu nie daje się ustalić
  regexem. Usunięto jedną heurystykę META odrzucającą także prawdziwe
  zastrzeżenie. Pozostałe kontrole, w tym blokada niepopartego statusu
  studenta, technologii i produkcji, nadal obowiązują.

Nowa generacja i odnowienie wymagające treści wywołują ten sam
`messagePrompt`. Zachowanie poprawnego tekstu, ręczna edycja/verify i
korekta trafiają do `reviewStoredDraft` i aktualnego `semanticReviewPrompt`.
Zmiana standardu nie kopiuje starego PASS, nie tworzy zgody na nowy payload
i nie powoduje migracji biblioteki. Wysłane wersje nie są otwierane.

Celowane testy na Windows: 152/152 PASS po poprawce reuse. Zachowano
pierwsze FAIL, w tym wykazany błąd reuse, zamiast podmiany logów. Testy
obejmują literalny zakres korekty, własne claims i referencje, jedną próbę,
wersję kryteriów, Stop, utratę właściciela i brak późnego zapisu/wysyłki.

Prywatny pomiar: 8 znanych materiałów kalibracyjnych, 9 fikcyjnych par
kontrastowych oraz zamrożone przed edycją 8 innych kontekstów. Dwie pierwsze
generacje na wariant/kontekst, wszystkie wyniki i błędy zachowane. Anonimowe
pary ocenia osobne wywołanie tego samego silnika modelowego, nie niezależny
człowiek. Odbiorcy w teście są fikcyjni. Źródła/fakty i pełne teksty
pozostają poza Git. Porównanie używa natywnych builderów, DTO i walidatora;
nie kopiuje produkcyjnej bazy i nie bada nowego researchu lub prawa kontaktu.

Pierwszy pełny Windows check: backend 1042/1044 PASS, dwa FAIL asercji
dosłownego dawnego brzmienia prompta w `research.test.ts`. Uaktualniono tylko
te asercje; kontrole doboru projektu, braku obcych faktów i orientacyjnych
godzin pozostają. Po zamrożeniu próbki nie zmieniono kodu lub promptów
aplikacji. Powtórzony pełny Windows check: **PASS**, typecheck,
**1044/1044 backend, 12/12 Stop, build, 26/26 UI**. Kod testów odbioru
`f85f0e87151e2c4e6d223ec1e8cefe26e6ed02ed`; aplikacja jest identyczna z
zamrożonym do porównania `83a86e5ea2f17eb3df96d59d3ed6c638d46a5824`.
Build DEVELOPMENT `b718ac7a-410d-4f78-9e77-445f39d7bef3` nie jest wdrożony.
[CI dokładnego f85f0e8: PASS](https://github.com/JakubLewosz/JobHunter/actions/runs/40872689852).
Pierwszy run 40870989975 został anulowany po pushu poprawek asercji;
nie jest raportowany jako PASS. Końcowa dokumentacja po f85f0e8 nie zmienia
aplikacji/testów lub zamrożonego builda. Pełne prywatne teksty, raport,
prompty, ledger i manifesty dostawy pozostają poza repo.

Wynik odłożonej próbki: **STYLE_VALIDATED=FAIL**. Anonimowy recenzent
modelowy dał w pierwszym powtórzeniu 8 remisów, w drugim 1 preferencję nowego
wariantu i 7 remisów. Łącznie 1/16 wygranych, 15 remisów, bez przegranych.
To niemal same remisy, nie wyraźna powtarzalna przewaga wymagana do przyjęcia.
Wszystkie 32 pierwsze teksty miały natywny code/factual/editorial PASS; żaden
nie kwalifikował się do korekty. Finalne teksty tej próbki są więc pierwszymi,
a nie wynikiem skuteczności korekt. Agent po pełnym odczycie wskazał także
przeoczone katalogi funkcji i niepotrzebne zastrzeżenie w nowym wariancie.
Osobny modelowy recenzent nie jest niezależnym ludzkim potwierdzeniem.

Kalibracja zachowała 3/3 dobrych wzorców i wskazała 3/5 znanych słabszych
tekstów; dwa przeoczenia pozostają. Fikcyjne kontrole zachowały 9/9 dobrych
i zatrzymały 9/9 złych przykładów, lecz jest to jedno zbiorcze wywołanie ze
szerszym schematem, nie natywny pomiar czułości na 18 produkcyjnych materiałach.
Brak projektu i potrzebne ograniczenie prototypu nie powodowały odrzucenia.
Zapisano pełne teksty, literalne defekty, rzeczywiste hashe promptów/rubryk,
wejścia i błędy poza Git; nie wybierano samych najlepszych wyników.

**DEPLOYED=false; DRAFTS_UPDATED=NOT_APPLIED (bramka jakości).** Stabilna
produkcja pozostaje bez zmian. Nie wykonano warunkowego wdrożenia, migracji
lub zapisu nowych wersji. Nie stroi się kolejnego kandydata na tej ósemce.
Trzy prywatne kopie kalibracyjne z naturalnie kwalifikującym się REVISE
przeszły po jednej korekcie i nowym pełnym review. Nie zapisano produkcyjnych
wersji. To kontrola istniejącej ścieżki, nie nowa próba przewagi generatora;
nie zastępuje nieudanej odłożonej próby ani nie zmienia decyzji wdrożeniowej.
Łącznie **95/120 rzeczywistych wywołań**, 0 błędów wykonania, 1221,288 s.
Nie wykorzystano reszty budżetu do kolejnego strojenia lub wymuszania PASS.

Końcowy spójny odczyt tylko-do-odczytu: wszystkie **62 tabele bez zmian**,
14 wcześniejszych prób zachowanych, nowych 0, oba wybrane szkice nadal v2.
Profil/fakty/CV, HOLD, historia, blokady, limity, granica kampanii i instalacja
pozostają bez zmian. STOPPED, brak aktywnych operacji/locków/niepewnych prób.
Ta dokumentacja nie deklaruje przewagi na podstawie samego PASS.
Nie wolno użyć wyniku tego zadania jako R3 lub produkcyjnego odbioru V1.
W całym zadaniu Gmail/OAuth/Start/rezerwacje/próby/kliknięcia/wysyłki = 0.
