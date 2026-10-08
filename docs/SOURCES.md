# Źródła sprawdzone 7 października 2026

- https://nodejs.org/en/about/previous-releases — Node 24: LTS; lokalnie 24.11.0.
- https://fastify.dev/docs/latest/Reference/LTS/ — polityka wsparcia Fastify i Node LTS.
- https://learn.chatgpt.com/docs/non-interactive-mode — Codex `exec`, JSONL, schema. Odczyt strony i lokalnego `--help`; nie jest to test runtime.
- https://developers.google.com/workspace/gmail/api/guides/sending — docelowe wysyłanie MIME; Gmail niezaimplementowany w E2.
- https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md — transakcje i konfiguracja SQLite.
- npm registry (`npm view`) — dokładne wersje i wymagania Node dla zależności. Lockfile jest źródłem zainstalowanych wersji.

Pełna dostarczona specyfikacja znajduje się w JobHunter_SPEC.md. Nie potwierdzano informacji z portfolio ani danych firm.

## E3 — odczytane 7 października 2026

- https://developers.openai.com/codex/noninteractive/ → https://learn.chatgpt.com/docs/non-interactive-mode — różnica JSONL/końcowy JSON, output-schema, stdin, mechanizm logowania i ephemeral. Potwierdzono również lokalnym exec --help i rzeczywistą próbą.
- https://developers.openai.com/codex/config-basic/ → https://learn.chatgpt.com/docs/config-file/config-basic — konfiguracja CLI i jej warstwy. User config świadomie pomijana w runtime.
- https://developers.openai.com/codex/config-reference/ → https://learn.chatgpt.com/docs/config-file/config-reference — shell_tool, unified_exec, web_search i kontrola funkcji. Lokalna wersja odrzuciła klucz tools.view_image mimo obecności w referencji: użyto rozpoznanego feature view_image=false. Flagi runtime sprawdzono z zainstalowaną wersją.
- https://developers.openai.com/codex/security/ → https://learn.chatgpt.com/docs/security — sandbox i granice dostępu. Dokumentacja nie zastępuje testu izolacji lokalnego procesu.

Do integracji nie dodano klucza API ani nowych kont. Wyniki użytkownika i surowe logi prób nie są publikowane w repo.

## Przygotowanie E4 — odczytane 7 października 2026

- https://developers.google.com/identity/protocols/oauth2/native-app — Desktop app, loopback, state i PKCE S256.
- https://developers.google.com/workspace/gmail/api/auth/scopes — gmail.send oraz rozróżnienie odczytu, compose i pełnego dostępu.
- https://developers.google.com/identity/protocols/oauth2/resources/best-practices — tokeny w systemowym magazynie, bez publikacji i plaintext fallbacku.
- https://developers.google.com/identity/protocols/oauth2#expiration — External/Testing i 7 dni refresh tokenu obejmującego Gmail.
- https://developers.google.com/workspace/gmail/api/guides/sending — MIME, base64url i PDF jako część wiadomości.
- https://github.com/Brooooooklyn/keyring-node — API AsyncEntry i systemowe magazyny; wersja 2.1.0 potwierdzona npm registry i natywną próbą na macOS z fikcyjnym wpisem.

Źródła dokumentują integrację; nie są dowodem wysyłki. Użytkownik później skonfigurował klienta Google, a rzeczywiste logowanie na macOS zakończyło się pomyślnie; odrębny wynik w TEST_REPORT.md. Nie wykonano wysyłek ani odczytu skrzynki.

## Diagnostyka WP — odczytane 8 października 2026

- https://pomoc.wp.pl/otrzymuje-podejrzane-wiadomosci — zapis wiadomości jako EML w przeglądarce: menu trzech kropek, Zapisz. Wykorzystano wyłącznie instrukcję pobrania źródła; wiadomości testowej nie uznano za phishing ani nie zgłoszono jako nadużycia.
- https://pomoc.wp.pl/kontakt-z-nami — oficjalny formularz kontaktowy pomocy. Nie wysłano zgłoszenia; strona nie diagnozuje przyczyny klasyfikacji konkretnego testu.
- https://pomoc.wp.pl/jak-skonfigurowac-reguly — reguły oraz listy Zaufani/Zablokowani działają w skrzynce odbiorcy. Nie zmieniano tych ustawień; dodanie nadawcy do Zaufanych nie stanowi testu dostarczalności na innych adresach.
- https://pomoc.wp.pl/dlaczego-nie-otrzymuje-wiadomosci — Spam i reguły odbiorcy wśród możliwych przyczyn problemów z odbiorem; WP wskazuje postmaster@wp.pl jako kontakt techniczny. Strona nie wyjaśnia kodu X-WP-SPAM U9 z dostarczonego EML. Nie wysłano zgłoszenia.
- https://www.rfc-editor.org/rfc/rfc2047.html#section-2 — odczyt 8 października 2026: pojedynczy encoded-word ma limit 75 znaków, obejmujący oznaczenia kodowania i delimitery. Dostarczony pierwszy EML ma fragment długości 84; obecny generator dla tego samego tematu mieści się w limicie. Standard nie wskazuje, czy ta niezgodność wpłynęła na klasyfikację Spam.
