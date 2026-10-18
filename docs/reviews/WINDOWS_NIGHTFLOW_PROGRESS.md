# Windows nightflow — dziennik implementacji

Baza: `40850745d5677cf411072d2798a56034e3ec9873`.
Gałąź: `codex/windows-nightflow-fixes`. Osobny worktree, wyłącznie synthetic DEVELOPMENT.
Wejście: pełny prompt `JobHunter_PROMPT_WINDOWS_NOC_R1-R13.md` z Downloads.
Bezpiecznie rozpakowany dostępny ZIP źródeł do nowego katalogu. Nie zawierał
deklarowanego `JobHunter_review_40850745`; scenariusze odtwarzamy z promptu
i istniejących testów, bez żądania nowych danych prywatnych.

Plan pakietów: A (R13/R4), B (R1), C (R2/R3), D (R5), E (R6/R7),
F (R8/R9), G (koordynator/CLI/fixture), H (R10/R11/R12/Windows CI),
następnie pełny Windows check, dokumentacja, publikacja i zweryfikowany ZIP.

Stan początkowy: Node 24.19.0/npm 11.17.0; instalacja z lockfile ukończona, bez aktualizacji zależności.
Nie odczytywano prywatnego runtime, SQLite, materiałów, sekretów ani poczty.
Nie uruchamiano publicznego researchu, modeli, Gmaila ani wysyłki.

## Postęp

- A–F oraz R10/R11: kod i utrzymywane regresje, syntetyczne PASS.
- Parser 4; nowe migracje 026/027. Dawne migracje i datowane snapshoty bez diffu.
- Koordynator/CLI/IPC/adapter aktywnego browser: zaimplementowane.
  Osiem godzin na przyspieszonym zegarze, prawdziwy proces fixture, Stop/Resume,
  SEND_UNKNOWN, okno po history await, globalny guard i osiem fake SELF_TEST testowane.
- Playwright browser 5/5 PASS, w tym adapter całej sekwencji i abort upload/final click.
- Manifest 69 dawnych plików PASS dla bfbbc630…, nie dla 40850745 (późniejszy package.json).
- Pierwszy pełny check w toku przez `scripts/offline-check.ts`, osobne syntetyczne
  HOME/APPDATA/LOCALAPPDATA/CODEX_HOME/TEMP/data, bez natywnych providerów.
  Dowody poza repo: `JobHunter_nightflow_evidence_20261018/check-01`.
  Nie zmieniać kodu podczas tego checka; dokumentacja jest poza fingerprintem kodu.

## Dalszy dokładny krok

Po check-01 zachować wynik/pierwszą serię Stop. Przegląd diffu wskazuje dodatkowe
granice do poprawienia i regresji przed końcowym checkiem:
1. Atomowo zapisać job.batch_id razem z derived grant (obecnie kolejny zapis).
2. R7: uzgadniać również pozycję z własnym anulowanym pakietem i późniejszą cudzą wysyłką.
3. Wznowienie po zakończonym poprawnym researchu przed zamknięciem partii nie może
   odnawiać deadline ani wymuszać nowego researchu; zachować checkpoint zakończenia.
4. WAIT_DEADLINE powinien obejmować również wyczerpanie samej biblioteki.
5. Jawnie rankować zweryfikowany rodzaj kanału między dopasowaniem i wiekiem.
Następnie pełny finalny check, raport wyników, explicit staging/commit/push,
rzeczywisty CI, git-archive ZIP z manifestem, ponowne wypakowanie i weryfikacja.
Nie kończyć na tym dzienniku; pozostałe prace są autoryzowane.

## Zakończony przegląd granic

Wszystkie pięć powyższych punktów ma poprawki i utrzymywane regresje.
Dodano również deadline podczas odnowienia z wyborem wyłącznie ukończonego
podzbioru oraz ochronę wcześniejszego zakończonego joba przed błędnym Resume.
Pierwszy pełny check: 709/710, nieudana reentrancy końcowego guarda; oryginalny
test naprawionej ścieżki przechodzi bez zmiany asercji. Drugi check przerwano
dla poprawki podtrzymania hosta od initialize. Heartbeat: 8 h kontrolowanego
zegara/960 rzeczywistych żądań IPC, release/loss/restart sprawdzone.
Celowane po zmianach: 51/51 usługi/IPC/koordynator; browser UI 5/5.
Finalny pełny check: `check-03` PASS, exit 0 (noc 18/19.10): 721/721 backend,
12/12 serial Stop, typecheck/build i 22/22 UI. Czas 681,713 s. Manifest
`8ae15067784be0fea94c78653826e80d1b43fdfc07454e6435515e717b2d4e63`
nie zmienił się przed/po. Dowody skopiowano do docs/reviews/windows-nightflow-evidence.
Nie zmieniać kodu po tym wyniku. Następny krok: jawny staging sprawdzonych plików,
commit/push wyłącznie gałęzi napraw, rzeczywisty CI dla SHA, następnie
`scripts/package-nightflow-review.py` i ponowne wypakowanie/weryfikacja ZIP.
