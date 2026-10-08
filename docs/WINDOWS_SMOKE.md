# Windows smoke — do wykonania przez użytkownika

Nie zaliczono na macOS. Wymagany Node 24 LTS i natywny Codex CLI z obsługą użytych flag. Uruchamiaj na jednym komputerze naraz. Git przenosi kod, nie dane aplikacji.

1. Pobierz kod do ścieżki ze spacjami i polskimi znakami. W PowerShell:

```powershell
npm ci
npm run check
npm run doctor
codex --version
codex exec --help
codex login status
```

2. Zamknij backend poprzedniego trybu przez `node scripts/stop.mjs` w jego środowisku. Ustaw jawnie:

```powershell
$env:JOBHUNTER_MODE = 'RESEARCH_ONLY'
# Jeżeli CLI nie jest w PATH, wskaż pełną ścieżkę do NATYWNEGO codex.exe:
# $env:JOBHUNTER_CODEX_PATH = 'C:\...\codex.exe'
.\scripts\start.ps1
```

Plik `.cmd`/`.bat` jest odrzucany: nie uruchamiamy promptów przez shell. Jeśli brakuje natywnego CLI, import URL nadal działa, a model podaje czytelny błąd. Nie naprawiaj przez full access.

3. Sprawdź etykietę RESEARCH_ONLY, pustą osobną bazę i propozycje profilu. Nie kopiuj SQLite demo. W Integracjach wykonaj oba testy (może zużywać dostępny limit planu).
4. Przejrzyj fakty, popraw je i zatwierdź profil samodzielnie. Uruchom jeden cykl maks. 10 kandydatów / 3 szkice lub import publicznego URL.
5. Sprawdź pierwotny/końcowy URL, hash, cytaty, unknown/conflicting, cel kontaktu i brak zgadywanych adresów. Sprawdź różne źródła oferty/kontaktu i Fingoweb/HISTORY_TO_VERIFY.
6. Edytuj i skopiuj temat/treść, oznacz przegląd. Licznik wysyłek powinien pozostawać zero; API approve-batch nie może działać.
7. Pauza w trakcie modelu i stop powinny zakończyć wyłącznie proces zadania i jego dzieci. Inne rozmowy Codexa muszą pozostać aktywne. Uruchom ponownie backend, wznów etap, sprawdź brak duplikatów.
8. `node scripts/stop.mjs`, potem powrót do `$env:JOBHUNTER_MODE='DEMO'`: stare dane demo zachowane, nowe dane researchu niewidoczne w demo.

Zapisz datę, Windows/Node/CLI, wynik każdego punktu i błąd bez tokenów. Testu nie uznawaj za zaliczony tylko dlatego, że build się powiódł.
