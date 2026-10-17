> Archiwum stanu sprzed porządkowania 17 października 2026. Historyczne wymagania i liczby nie zastępują [bieżącego kontekstu](../../REVIEW_HANDOFF.md).

# JobHunter — materiał do przeglądu

12 października 2026, specyfikacja 2.1. Gałąź codex/local-windows-pilot na overnight 810b860.
Nowa decyzja: jedna trwała historia LOCAL_ONLY i poczta na domowym Windowsie; kod rozwijany
Windows/macOS, development z osobnymi danymi i technicznie niedostępnym natywnym Gmailem.
Prywatny Git/handoff jest opcjonalny i odłożony; brak origin nie blokuje lokalnego AUTO.

Czytaj README → AGENTS → JobHunter_SPEC → TASKS → TEST_REPORT → SECURITY → URUCHOMIENIE_RANO.
Styl w MESSAGE_STYLE, HISTORY_SYNC tylko dla opcjonalnego PRIVATE_GIT. Dawne próby Gmaila
nie są potwierdzeniem obecnej sesji lub dostarczalności.

Do przeglądu: całe LOCAL_ONLY (Start/Wznów/Stop/shutdown, issues/gates/dispatch i readiness),
blokada jednego profilu niezależna od portu, utrata lock przed POST, lokalny marker Windowsa,
brak natywnego Gmaila/OAuth/metadanych w developmentcie i poczty w publicznym smoke.

Store przed migracją tworzy integralny VACUUM INTO z WAL poza repo. Migracja 016 jest
addytywna: parser_version/address_contexts. Restore-copy zachowuje historię/shared records/
liczniki i MIME, odwołuje zgody/sesje, zachowuje niepewność. Przejście PRIVATE_GIT → LOCAL_ONLY
wymaga Stop, potwierdzenia użytkownika i zgodności zamkniętej opublikowanej historii.

Parser htmlparser2 zachowuje granice i kontekst nagłówka/sekcji/listy/wiersza. GENERAL
nie jest promowany, sprzeczne etykiety blokują, marketing sprzedażowy nie zmienia celu
kontaktu. Zmiana celu/zniknięcie adresu blokuje dawny szkic; stary publiczny cache
wymaga odczytu, hash jest wersjonowany parserem. Nie przepisujemy wysłanych MIME.

Zachowane nocne poprawki: znana firma jest pomijana bez końca sesji, dokładna wersja
i uprawnienie przez await, intencja oddzielna od offer fit, planer po ośmiu kierunkach,
bounded queue bez utraty kandydatów, pojedynczy POST, SEND_UNKNOWN i ostatnia bramka.

Stop testowany przez realny serwer HTTP z powolnym read/model, 10 000 fikcyjnych firm
i kontaktów oraz równoległym odświeżaniem. Rozróżnia receipt/revoke/inflight completion.
Odtworzono wielosekundowe opóźnienie dashboardu i usunięto N+1 oraz pełną historię z jego
normalnego odczytu. Wyniki pomiarów w TEST_REPORT, bez obietnicy czasu na każdym sprzęcie.

Publiczna próba po poprawce schematu faktycznie powtórzona: 5 kandydatów/9 stron,
5 ekstrakcji/4 kontakty GENERAL/1 zapisany szkic z review=true. Całość INCOMPLETE:
błędy wykonania DRAFT i SEMANTIC_REVIEW oraz UNSUPPORTED_TECHNOLOGY, bez poluzowania
kwalifikacji. Jedno odrzucenie ujawniło sklejenie etykiety Email/adresu w parserze.
Minimalne poprawki: parser v2 z ponownym odczytem cache v0/v1, syntetyczny szablon,
tożsamość/edukacja wyłącznie z zatwierdzonych faktów, dokładniejsze agregaty smoke.
326 backend/7 UI PASS macOS. Limit dwóch prób wykorzystany; publiczna ścieżka po
nowej poprawce parsera/szablonu nie była ponawiana. Dokładne granice TEST_REPORT.
Brak prawdziwej poczty/SELF_TEST, odczytu skrzynki lub zmian prywatnego runtime.

Pozostaje: diagnostyka i potwierdzenie oryginalnej historii na Windowsie, konfiguracja
lokalnej instalacji/materiałów/CV/konta/polityki, publiczny smoke bez Gmaila z zatwierdzonymi
materiałami, potem samodzielny pilotaż. Nie potwierdzono pełnego dnia Google, prywatnej
instalacji Windows, pełnej izolacji OS lub dostarczalności. CI dotyczy finalnego SHA.
