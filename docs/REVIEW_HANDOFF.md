# JobHunter — materiał do przeglądu

Prace z 11 października 2026. Specyfikacja 2.0 i AGENTS zastępują dawny wymóg akceptacji każdego maila i blokadę implementacji AUTO_POLICY. Granice danych, separacji trybów i niezamówionych wysyłek pozostają.

Czytaj: README → AGENTS → JobHunter_SPEC → docs/TASKS → docs/TEST_REPORT → docs/SECURITY → docs/HISTORY_SYNC. Styl jest w MESSAGE_STYLE. Audyt Gmaila opisuje wcześniejsze próby, nie działanie nowej sesji.

Zachowane: bezpieczny fetcher, źródła/cytaty, strict schematy, wersje faktów/CV/szkiców, checkpointy researchu, Gmail z zamrożonym MIME, pojedynczy POST i konserwatywny reconcile, import kontaktów i Fingoweb.

Nowe: ponowna weryfikacja źródeł, aktualizacja/unieważnianie kontaktów, ręczny przegląd GENERAL, AUTO_POLICY związany z materiałami/nadawcą, ciągłe cykle i osobny sender, opcjonalne limity/tempo, minimalny eksport/import i właściciel historii. Panel AUTO ma Pracę, Historię i Ustawienia. Zakładka odpowiedzi ukryta, dane zachowane.

Przegląd powinien sprawdzić ostatnią bramkę przed POST, wyścigi Stop/Pauzy/zmiany materiałów, rezerwacje po awarii, brak transferu zgody, opublikowaną własność, odtwarzanie historii i zachowanie konfliktów. Fikcyjny Gmail/lokalny Git nie dowodzą rzeczywistej dostarczalności lub jakości wszystkich ekstrakcji.

Repo kodu nie zawiera prywatnej SQLite, CV, tokenów/OAuth ani oryginalnych EML. Rozwój nie upoważnia do odtwarzania tych danych, resetów, zmiany nadawcy, maili testowych i tworzenia zdalnego repo historii. Rzeczywisty nadawca pozostaje wyborem użytkownika w lokalnej konfiguracji, poza checkout.
