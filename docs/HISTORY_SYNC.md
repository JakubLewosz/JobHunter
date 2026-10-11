# Prywatna historia i przekazanie Windows/macOS

Nie utworzono zdalnego repozytorium ani nie opublikowano prywatnego stanu. Testy tworzą wyłącznie lokalne, fikcyjne repozytoria. Konkretny adres prywatnego origin wskazuje i potwierdza użytkownik w Ustawieniach.

## Konfiguracja

Utwórz sam osobne **prywatne** repozytorium historii, np. przez GitHub. Nie używaj repo kodu JobHunter. Sklonuj je poza katalogiem kodu i katalogiem danych SQLite; wybierz gałąź `main`. Dla pustego repo wybierz `main` jako początkową gałąź przed pierwszą sesją. Aplikacja zapisze pierwszy commit historii po Start. Dostęp Git/SSH/HTTPS konfigurujesz lokalnie, bez tokenów w pliku historii.

W AUTO_POLICY / Ustawieniach wpisz lokalny katalog i dokładny adres `git remote get-url origin`. Zaznacz potwierdzenie prywatności i publikowania minimalnej historii. Jest to jawne wskazanie miejsca, nie automatyczne potwierdzenie widoczności na GitHubie. Bez konfiguracji Start jest zablokowany.

Pierwszą inicjalizację wykonaj na komputerze z dotychczasową historią, w tym kontaktami ręcznymi. Nie inicjalizuj pustej historii na drugim komputerze. Potwierdź lokalną bazę jako początkowe źródło i użyj **Przygotuj historię bez uruchamiania sesji**. Ten przycisk importuje/eksportuje i kończy przekazanie bez udzielania prawa do wysyłki. Przy istniejącej historii w repo drugie urządzenie nie musi potwierdzać inicjalizacji.

Na każdym komputerze osobno skonfiguruj Gmail, Codexa, fakty, zatwierdzone CV i politykę. CV powinno mieć oczekiwany SHA-256; aplikacja wiąże politykę z lokalnym hashem. Aktywna zgoda na wysyłkę i poświadczenia nie są przenoszone.

## Sesja i przekazanie

1. **Start** wykonuje fetch, dopuszcza tylko aktualizację fast-forward, importuje historię transakcyjnie i publikuje właściciela urządzenia. Otwarte posiadanie przez drugi komputer blokuje Start, nawet gdy wykonano pull.
2. Sender sprawdza własność/rewizję oraz zdalny stan przed nową próbą. Oryginalna rezerwacja, Message-ID, hash i MIME są w lokalnej SQLite przed POST. Zdalny właściciel zapobiega przejęciu nieopublikowanego postępu po awarii.
3. **Pauza** nie przekazuje własności. **Stop** odwołuje sesję, lecz zachowuje właściciela do spójnego eksportu.
4. **Stop i przekaż historię drugiemu urządzeniu** przerywa nowe zadania, czeka na własne rozpoczęte operacje, eksportuje pełny minimalny stan i publikuje zamknięte przekazanie. Dopiero po sukcesie drugi komputer może użyć Start.
5. Restart backendu nie wznawia wysyłki. Po awarii właściciela wróć na ten komputer i odtwórz/zakończ przekazanie. Nie usuwaj ręcznie właściciela w celu obejścia niepewnej historii.

## Eksport i konflikty

`history.json`, schemaVersion 1: firmy, domeny/aliasy, ręczne kontakty, blokady, własne próby pierwszego kontaktu z identyfikatorem/treścią/hashami i licznikami. Osobne minimalne liczniki SELF_TEST nie przenoszą treści osobistych testów. Brak aktywnej zgody, tokenów, OAuth, CV/PDF, loginu Codexa, całej skrzynki i SQLite/WAL. Import nie usuwa lokalnych danych ani blokad.

Eksport czyta spójny stan w transakcji SQLite, zapisuje staging `history.pending`, fsync i atomowe rename, następnie commit/push tylko pliku historii. Nie kopiujemy działającej bazy. Konflikt identyfikatorów/aliasów/prób, dirty checkout, przerwany staging, zmiana origin, brak dostępu i rozbieżna gałąź blokują automat. Bez cichego nadpisania i force-push.

Przy konflikcie zachowaj obie kopie i lokalne dane. Sprawdź przyczynę, zakończ sesje i świadomie uzgodnij historię; nie resetuj gałęzi ani liczników. Przerwany eksport pozostawia ślad i wymaga sprawdzenia pliku. Nie uznawaj nowego urządzenia za gotowe tylko dlatego, że pobrało kod.

SENDING i SEND_UNKNOWN po przeniesieniu blokują automat. Rozstrzygnij próbę na urządzeniu z oryginalnym zapisem MIME przez celowany odczyt Wysłanych, a potem przekaż zaktualizowany wynik. Brak oryginalnego zapisu nie upoważnia do ponowienia. Synchronizacja i Gmail nie zapewniają matematycznej gwarancji exactly-once.
