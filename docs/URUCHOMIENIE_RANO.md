# Uruchomienie rano — stabilizacja z 11 października 2026

Korzystaj z gałęzi `codex/overnight-stabilization`. Nie scalono jej automatycznie do main.
Wersja i rzeczywiste wyniki końcowej kontroli znajdują się w TEST_REPORT.
Ta sesja rozwojowa nie wysyłała prawdziwej poczty i nie zmieniała prywatnego runtime.

## Aktualizacja kodu

Zamknij własny backend przed aktualizacją/budowaniem. Najpierw sprawdź `git status`;
nie nadpisuj lokalnych zmian ani nie kopiuj danych prywatnych do checkout.

Windows, PowerShell:

```powershell
git fetch origin
git switch codex/overnight-stabilization
git pull --ff-only
npm ci
npm run build
npm run doctor
$env:JOBHUNTER_MODE = 'AUTO_POLICY'
npm start
# W drugim PowerShell, z tym samym JOBHUNTER_MODE:
npm run open
```

macOS:

```sh
git fetch origin
git switch codex/overnight-stabilization
git pull --ff-only
npm ci
npm run build
npm run doctor
JOBHUNTER_MODE=AUTO_POLICY npm start
# Drugi terminal:
JOBHUNTER_MODE=AUTO_POLICY npm run open
```

`git switch` na nowym klonie utworzy lokalną gałąź z jednoznacznie znalezionego origin.
Nie używaj reset/force-push. Nie kopiuj SQLite/WAL ani plików poświadczeń między urządzeniami.

## Historia i konfiguracja

1. Na **urządzeniu z oryginalną bazą kontaktów** wskaż w Ustawieniach osobne,
   prywatne, sklonowane repo historii na `main`. Potwierdź dokładny origin i
   lokalną bazę jako pierwsze źródło. Użyj **Przygotuj historię bez uruchamiania sesji**.
   Nie inicjalizuj prawdziwej historii z pustego testowego runtime.
2. Sprawdź i samodzielnie zatwierdź fakty/projekty oraz lokalny PDF. Połączenia Gmaila
   wykonaj według GMAIL_SETUP, a Codexa/wyszukiwanie sprawdź istniejącymi przyciskami.
   Brak logowania lub limit zatrzymuje odpowiedni proces; nie ma fallbacku do API key.
3. Po aktualizacji polityki sprzed tej stabilizacji **ponownie zatwierdź politykę**:
   nadawcę, zakres, rodzaje kontaktów, tempo, materiały i CV. Stare nieoznaczone
   operacje nie odziedziczą uprawnienia nowego zakresu. To zatwierdzenie konfiguracji;
   zgodne kolejne wiadomości nie wymagają osobnej akceptacji.

## Próba bez wysyłki i pierwszy pilotaż

Najpierw można uruchomić osobny backend `RESEARCH_ONLY`, sprawdzić połączenie
Codexa/wyszukiwania i wykonać jeden krótki research. Ten tryb nie inicjalizuje transportu Gmaila.
Materiały wymagają lokalnego zatwierdzenia w wybranym trybie. Zamknij backend przed
powrotem do AUTO_POLICY; samo przełączenie trybu nie uruchamia sendera.

W AUTO_POLICY sprawdź **Gotowość programu**. Rozstrzygnij SEND_UNKNOWN na urządzeniu
z oryginalnym MIME; brak oryginalnego zapisu nie pozwala ponawiać próby. Dla pierwszego
świadomego pilotażu możesz ustawić **3–5 wiadomości** i co najmniej kilka minut odstępu.
To jednorazowy wybór użytkownika, nie stały limit programu. Dopiero **Start — szukaj
i wysyłaj** udziela sesji prawa do prawdziwych pierwszych kontaktów.

**Stop** natychmiast odwołuje uprawnienie nowych wysyłek; operacja już przekazana
dostawcy może jeszcze zakończyć się wynikiem. **Stop i przekaż historię** czeka na
własne rozpoczęte operacje, publikuje spójny stan i zwalnia właściciela. Drugi komputer
importuje historię przez Start/przygotowanie; osobno zatwierdza własne połączenia i politykę.
Restart zawsze pozostawia sender zatrzymany.

## Granice potwierdzenia

Offline testy Windows i symulacja ponad doby nie dowodzą całodziennej pracy z Google,
dostarczalności, pełnej izolacji OS lub jakości każdej ekstrakcji. CI macOS jest
potwierdzone dopiero dla zakończonego przebiegu konkretnego SHA. Nie wykonano nocnego
live researchu ani prawdziwego eksportu historii. Pełna macierz awarii przekazania
(rename/commit/push z utratą odpowiedzi) i systemowe sen/wybudzenie wymagają kolejnego etapu.
