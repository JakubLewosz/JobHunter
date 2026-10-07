# Możliwości — 7 października 2026

- Host: macOS (Darwin); Windows smoke test niewykonany.
- Pusty katalog projektu z istniejącym `.git`; brak plików użytkownika do nadpisania.
- Node v24.11.0, npm 11.6.1, Git 2.54.0.
- Codex CLI 0.160.1: `exec --help` potwierdza stdin, `--json`, `--output-schema`, `--ephemeral`, `--sandbox` i `--ignore-user-config`.
- `codex login status`: zalogowany przez ChatGPT. Nie odczytywano plików auth.
- Nie wykonano wywołania modelu ani smoke testu researchu. Logowanie nie oznacza przetestowanego dostępu do narzędzi; adapter live pozostaje UNCONFIGURED.
- Node 24 jest LTS według oficjalnej tabeli. Wersje pakietów potwierdzone przez npm registry i przypięte w package.json/lockfile.
- SQLite 3.53.4 / better-sqlite3 13.0.3: instalacja i rzeczywiste transakcje/migracje działają na macOS arm64; Windows nieprzetestowany.
- Gmail: nie skonfigurowano OAuth, konta ani tokenów; odczyt i wysyłka live niedostępne.
- Izolacja agenta runtime: niezweryfikowana; AUTO_POLICY zablokowany.

DEMO używa wyłącznie lokalnych adapterów bez dostępu do sieci, kont lub modelu. Profil jest propozycją do zatwierdzenia w osobnej bazie demo.

Stos zainstalowany: Fastify 5.12.5, React 19.3.0, Vite 8.3.3, TypeScript 5.9.3, Playwright 1.63.0. Dokładne zależności w package-lock.json. `npm install` zgłosił 0 znanych podatności w chwili instalacji; to nie jest audyt bezpieczeństwa aplikacji.

Pełny zestaw testów opisano w TEST_REPORT.md. Instalację Chromium wykonano wyłącznie jako lokalną zależność testową, bez kont/usług płatnych. Nie wykonano żadnej rzeczywistej wysyłki ani odczytu poczty.
