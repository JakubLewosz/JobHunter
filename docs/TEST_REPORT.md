# Weryfikacja — 7 października 2026

Środowisko: macOS / arm64, Node 24.11.0, npm 11.6.1, SQLite 3.53.4. Testy używają wyłącznie fikcyjnych odbiorców i osobnych katalogów tymczasowych. Żadnych prawdziwych maili, kont, modelu ani publicznego researchu.

## Wynik

- `npm run typecheck`: PASS — backend i frontend, TypeScript strict.
- `npm test`: PASS — **44/44** testy domenowe/integracyjne/API.
- `npm run build`: PASS — kompilacja backendu i produkcyjny build Vite.
- `npm run test:e2e`: PASS — **4/4** scenariusze Chromium przez rzeczywisty backend i SQLite.
- `npm run doctor`: PASS — Node, natywny moduł SQLite, build i rozpoznanie lokalnego CLI.
- Próba uruchomienia drugiego backendu: zablokowana. `scripts/stop.mjs`: poprawne uwierzytelnione zakończenie procesu, bez zabijania innych programów.
- Oględziny PNG desktop 1440 px i mobile 390 px; brak poziomego overflow na mobile i błędów JavaScript w głównym scenariuszu.

## Zakres domeny/API

Proces discovery → dowody → kwalifikacja → szkic → zgoda → mock send → odpowiedź → raport; DRAFT profilu; brak i wygaśnięcie zgody; zmiana treści/odbiorcy/profilu/nadawcy/CV/polityki; niezmienna kopia PDF i MIME; CRLF/CC/BCC; źródła innej firmy i nieistniejące fact/evidence IDs; nadmiarowe pola approved/recipient/shell, malformed output i określone zmyślone deklaracje.

Unknown/conflicting/archiwum/kontakt ogólny; senior onsite i bezpłatne praktyki; otwarte kandydatury; deduplikacja firmy, aliasów i współdzielonego ATS/Gmail; Fingoweb i historia; import CSV z podglądem, hashem, szczegółami i idempotencją; ochrona formuł CSV.

Atomowe kwoty, dwa równoległe ticki, oczekująca kolejka między cyklami, limit dnia, Warszawa/północ/DST, trwały stop i kill switch; timeout po przyjęciu, jedna próba, reconcile bez retry; restart w SENDING; brak potwierdzenia w Wysłanych; odmowa przed dispatch; autoresponder i ręczna korekta; trzy trwałe zwroty; jeden zaległy cykl po uśpieniu i zakończenie po trzech pustych cyklach.

Host/Origin, HttpOnly/SameSite, sesja, CSRF, cross-site, nieprawidłowy link, brak endpointu ogólnej wysyłki i odrzucanie trybów live. Test ścieżki ze spacjami i polskimi znakami wykonany na macOS.

## Scenariusze UI

1. Zatwierdzenie profilu → cykl → 5 szkiców → zaznaczenie konkretnej wiadomości → mock send → klasyfikacja odpowiedzi → odrzucone oferty → eksport raportu → desktop/mobile.
2. Blokada mutacji bez CSRF i nieaktywny HTML w szkicu.
3. Wybór timeoutu → SEND_UNKNOWN → rozstrzygnięcie → potwierdzenie istniejącej wiadomości → osobne wznowienie sendera.
4. Podgląd i import CSV → sugestia widoczna w historii.

Zrzuty: `test-results/dashboard-desktop.png`, `test-results/dashboard-mobile.png`. Raport Playwright: `playwright-report/index.html`. Pliki wynikowe są ignorowane przez Git.

## Niezweryfikowane

Windows i skrypty PowerShell na realnym Windowsie; sandbox/ACL/DPAPI i izolacja runtime; Codex structured call i prawdziwe narzędzia researchu; Gmail OAuth/historia/paginacja/send/reconcile; SSRF i DNS rebinding przyszłego fetchera; produkcyjne bezpieczeństwo i pełna semantyczna prawdziwość tekstu. Te elementy nie zostały uznane za działające na podstawie testów mock.
