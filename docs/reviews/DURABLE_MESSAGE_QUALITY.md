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

Wynik próbki, pełnego Windows check i CI oraz decyzja wdrożeniowa są jeszcze
oczekujące. Ta dokumentacja nie deklaruje przewagi na podstawie samego PASS.
Nie wolno użyć wyniku tego zadania jako R3 lub produkcyjnego odbioru V1.
W całym zadaniu Gmail/OAuth/Start/rezerwacje/próby/kliknięcia/wysyłki = 0.
