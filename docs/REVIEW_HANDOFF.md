# JobHunter — materiał do przeglądu

Prace z 11 października 2026. Specyfikacja 2.0 i AGENTS zastępują dawny wymóg akceptacji każdego maila i blokadę implementacji AUTO_POLICY. Granice danych, separacji trybów i niezamówionych wysyłek pozostają.

Aktualna stabilizacja jest na `codex/overnight-stabilization`; zakres i rzeczywiste
wyniki w OVERNIGHT_PLAN/TEST_REPORT. Sprawdzono niezależnym agentem backend i wyścigi;
odtworzono i naprawiono także zmianę origin podczas fetch, zmianę gałęzi, Start podczas
handoff, okno internalApproval, cofanie postępu po zmianie samego limitu, dziedziczenie
starego zakresu i cache ignorujące nowe źródło pominiętego szkicu.

Migracje 013–015 są addytywne: konkretne pominięcia wersji, planer i związanie
researchu/szkicu z zakresem. Stare dane pozostają; brak scopeHash w dawnej polityce
wymaga jawnego ponownego zatwierdzenia konfiguracji. Kolejne zgodne maile nadal
nie wymagają przeglądu użytkownika. Nowe źródło/kontakt może dać nową wersję, ale
nie usuwa skip starej wersji ani blokady wcześniejszego kontaktu.

Przegląd kolejnego etapu: pełna macierz awarii handoff (przed/po rename, commit i push),
rozstrzyganie niepewnej próby w pełnym A→B→A, systemowy sen/wybudzenie, skalowanie
dużej historii i wpływ synchronicznych kontroli Git na opóźnienie Stop. CI offline
Windows/macOS ma read-only permissions, przypięte SHA oficjalnych akcji, brak sekretów,
ograniczoną retencję fikcyjnych artefaktów i brak workflow cyklicznych. Nie zastępuje
prawdziwej skrzynki ani dziennej kampanii.

Czytaj: README → AGENTS → JobHunter_SPEC → docs/TASKS → docs/TEST_REPORT → docs/SECURITY → docs/HISTORY_SYNC. Styl jest w MESSAGE_STYLE. Audyt Gmaila opisuje wcześniejsze próby, nie działanie nowej sesji.

Zachowane: bezpieczny fetcher, źródła/cytaty, strict schematy, wersje faktów/CV/szkiców, checkpointy researchu, Gmail z zamrożonym MIME, pojedynczy POST i konserwatywny reconcile, import kontaktów i Fingoweb.

Nowe: ponowna weryfikacja źródeł, aktualizacja/unieważnianie kontaktów, ręczny przegląd GENERAL, AUTO_POLICY związany z materiałami/nadawcą, ciągłe cykle i osobny sender, opcjonalne limity/tempo, minimalny eksport/import i właściciel historii. Panel AUTO ma Pracę, Historię i Ustawienia. Zakładka odpowiedzi ukryta, dane zachowane.

Przegląd powinien sprawdzić ostatnią bramkę przed POST, wyścigi Stop/Pauzy/zmiany materiałów, rezerwacje po awarii, brak transferu zgody, opublikowaną własność, odtwarzanie historii i zachowanie konfliktów. Fikcyjny Gmail/lokalny Git nie dowodzą rzeczywistej dostarczalności lub jakości wszystkich ekstrakcji.

Repo kodu nie zawiera prywatnej SQLite, CV, tokenów/OAuth ani oryginalnych EML. Rozwój nie upoważnia do odtwarzania tych danych, resetów, zmiany nadawcy, maili testowych i tworzenia zdalnego repo historii. Rzeczywisty nadawca pozostaje wyborem użytkownika w lokalnej konfiguracji, poza checkout.
