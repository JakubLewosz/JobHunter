# Kolejność zamkniętej partii — 24 października 2026

`prepareBatch()` utrwala `ordinal`, a `batchSummary()` odczytuje go w tej
kolejności. `dispatchOne()` wcześniej zamieniał pozycje w zbiór ID i wybierał
szkic z `draftRows()` według `created_at DESC`. Zatwierdzone A/B/C mogło zatem
przygotować i zarezerwować próby C/B/A.

Poprawka dotyczy wyłącznie aktywnej zamkniętej partii. Wybiera pierwszy
pozostały element READY według istniejącego ordinal i pobiera jego aktualny
szkic. Dotychczasowe kontrole zamrożonej wersji, treści, kontaktu, materiałów,
scope, historii, właściciela, generacji, Stop i limitów nadal obowiązują.
Nie zmienia dat szkiców, ordinal, migracji ani selekcji ciągłego AUTO.

Istniejący QUEUED ma pierwszeństwo; przed jego użyciem wymagane jest zgodne
powiązanie z partią, sesją, ID i wersją szkicu. Obcy pakiet zatrzymuje pracę
z BATCH_SCOPE_CHANGED bez nowej rezerwacji. Oczekiwanie na review następnej
pozycji zachowuje PENDING/RUNNING/ERROR i nie pozwala późniejszej pozycji jej
wyprzedzić. Trwale zablokowane B pozostaje SKIPPED/CONTACT_HISTORY; A/C
zachowuje zatwierdzony porządek i nie dobiera zamiennika.

`tests/closed-batch-order.test.ts` przechodzi publiczną ścieżkę
prepareBatch → approveClosedBatch → startBatch → dispatchOne. Różne daty
powstają podczas tworzenia fikcyjnych szkiców, przed wyborem partii.
Sprawdza kolejność przygotowania, rezerwacji i prób, zero skutków przed
zgodą/Start, wykluczenie pozostałych firm, blokadę B, trzy stany review,
zmiany wersji/payloadu/kontaktu, odwołaną zgodę i istniejący QUEUED.
Fikcyjny broker GMAIL_BROWSER wymaga jednej akcji na rezerwację, odrzuca
drugie uprawnienie i nie wykonuje API send. Utrata ACK pozostawia niepewność
i blokuje wznowienie oraz ponowienie po restarcie.

Początkowa właściwa regresja na niezmienionym kodzie: FAIL 0/1, faktycznie
C/B/A zamiast A/B/C. Zachowano też błąd początkowej fixture bez odrębnych
dat oraz serię 13/15 z brakującym attach fikcyjnego brokera przed konfiguracją
polityki. Po skorygowaniu wyłącznie fixture: nowe regresje 15/15 PASS.
Celowane siedem plików: 103/103 PASS. Pełne izolowane `npm run check`:
888/888 backend, 12/12 Stop, 26/26 UI, typecheck/build PASS, exit 0,
bez FAIL/SKIP/cancel. Fingerprint kodu przed i po identyczny. Historyczne
problemy benchmarku Stop nie zostały ukryte przez ten wynik; nie zmieniono
progów ani testów Stop. CI dokładnego commitu pozostaje oddzielnym dowodem
w dostawie; nie wywodzimy jego wyniku z lokalnego PASS.

Testy używają Node24/Windows, danych tymczasowych i fikcyjnych providerów.
Nie są dowodem rzeczywistej dostawy ani zgodą na odczyt Gmaila lub pilot.
Aktualizacja WORKSTATION wymaga zakończenia testów i CI, Stop, sprawdzonego
backupu i identyfikacji załadowanego buildu. Preflight nie tworzy produkcyjnej
partii, rezerwacji, zgody lub prawa wysyłki; przyszły Start pozostaje osobny.
