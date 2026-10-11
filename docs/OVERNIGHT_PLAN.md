# Stabilizacja — 11 października 2026

Gałąź `codex/overnight-stabilization`, punkt wyjścia `4e6b864`. Czysty checkout;
zgoda obejmuje kod/testy/dokumentację i push do JakubLewosz/JobHunter.
Testy wyłącznie na fikcyjnych providerach, osobnych bazach i lokalnych repo Git.

| Priorytet | Zadanie                                                         | Stan             | Test odbioru / następny krok                                                           |
| --------- | --------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| baza      | Rozpoznanie i `npm run check` Windows                           | GOTOWE           | 237/237 + 7/7, typecheck/build PASS                                                    |
| P0        | Wcześniejszy kontakt pomija firmę; kontekst błędu i wersji      | GOTOWE           | FAIL→PASS, A/B także przed POST; edycja/Stop i dokładna wersja                         |
| P0        | Osobna intencja zapytania i dopasowanie oferty                  | GOTOWE           | Macierz A–F i treść; odmowy/scope/adres dalej blokowane                                |
| P0        | Trwały planer po ośmiu kierunkach                               | GOTOWE           | 10 kierunków, tematy według wyników, cooldown/scope/restart; backlog zachowany         |
| P1        | Celowana historia Gmail i granice sesji                         | GOTOWE OFFLINE   | Bounded scan/retry, account/paginacja; manual endpoint i handoff race                  |
| P1        | Historia A → B → A                                              | CZĘŚCIOWO        | Dwa klony, aliasy i syntetyczne kontakty/liczniki PASS; pełna macierz awarii pozostaje |
| P1        | Deterministyczna symulacja doby i diagnostyka UI                | CZĘŚCIOWO        | 3×30h PASS, panel/UI; mieszany handoff/OPEN/429 w jednym soak pozostaje                |
| P2        | Pobieranie danych i CI                                          | CZĘŚCIOWO        | UI 7/7, workflow przygotowany; wynik CI po push, duża historia/Stop pozostają          |
| koniec    | Przegląd, instrukcja rano, kontrola sekretów, commity/push/CI   | KOD OPUBLIKOWANY | Check 280/280 + 7/7, skan blobów i ref PASS; CI w raporcie czatu                       |
| external  | Prawdziwy Gmail, repo historii, macOS/live research/pełny dzień | BLOCKED_EXTERNAL | Wymagają urządzenia/użytkownika; żadnej prawdziwej wysyłki w tej sesji                 |

Niezależny agent wykonuje tylko przegląd wyścigów i historii, bez edycji plików.
Nie oznaczać zakresu jako gotowego do całodziennej pracy z Google na podstawie symulacji.

Końcowy npm run check: **280/280 backend + 7/7 UI**, typecheck/build/diff check PASS.
Log poza repo: %TEMP%/jobhunter-publish-check.log. Kod zamrożony po sprawdzonym wyniku.
Zachowano dotychczasową deduplikację godzinnego RESEARCH_ONLY; cache nowych źródeł
ograniczono do AUTO_POLICY. Próba skrócenia kontroli historii przez fingerprint
wycofana po przeglądzie; pełny Git i konserwatywne blokady pozostają.
Kod/UI opublikowane: d10e42f7989a2d3af5cc8bba0d1caf12fa6e67a6.
Zdalny ref zgodny; main bez scalenia. Skan 31 blobów dwóch commitów PASS.
Dodatkowy commit dokumentacji zapisuje wynik publikacji; jego ref i CI będą odczytane.
Wynik publikacji/CI konkretnego SHA w końcowym raporcie czatu.
