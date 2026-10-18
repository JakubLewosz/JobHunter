# JobHunter — komplet informacji do zewnętrznego przeglądu

Gałąź publikacji: `codex/core-completion`. Punkt wyjścia tego etapu:
`bfbbc630f11bd02da1b00bdaf5d089af38835838`; baza rdzenia:
`f37afc077c0d7c80f231ef0e9ad2f4dcac17363c`. Początkowo lokalna i zdalna gałąź
były zgodne i worktree czysty. Nie cofano nowszego kodu i nie pracowano na main.
Dodano narzędzia przeglądu, dowody i dokumentację, bez napraw rdzenia, wdrożenia
WORKSTATION lub uruchamiania rzeczywistego researchu, modelu, Gmaila i sendera.

## Wejście do przeglądu

1. [AGENTS](../AGENTS.md), [SPEC](../JobHunter_SPEC.md), [wizja](WIZJA_PROJEKTU.md):
   wymagania, w tym doprecyzowanie z **18.10.2026**.
2. [CODEX_OPERATION](CODEX_OPERATION.md): obserwacja kontra wniosek z kodu,
   historyczny launcher, procesy i źródło wyniku. Sam otwarty Codex nie dowodzi
   wznowienia po 8 h. Opisano dokładne braki jednego nocnego przebiegu.
3. [REVIEW_FINDINGS](REVIEW_FINDINGS.md): R1–R12, miejsca w kodzie, dowody,
   ograniczenia i potrzebne testy. Nie oznaczono tych usterek jako naprawionych.
4. [Rozszerzony snapshot](ai-review/review-2026-10-18/README.md),
   [manifest danych](ai-review/review-2026-10-18/manifest.json),
   [mapowanie i schematy](ai-review/review-2026-10-18/schema.json),
   [walidacja](ai-review/review-2026-10-18/validation.json).
5. [TEST_REPORT](TEST_REPORT.md), [KNOWN_ISSUES](KNOWN_ISSUES.md),
   [TASKS](TASKS.md), [CORE_IMPLEMENTATION](CORE_IMPLEMENTATION.md),
   [SECURITY](SECURITY.md), [GMAIL_BROWSER](GMAIL_BROWSER.md),
   [MESSAGE_STYLE](MESSAGE_STYLE.md). Archiwum dopiero dla historii.
6. Eksporter `apps/server/src/review/`, CLI `scripts/export-review-package.ts`,
   regresje `tests/review-package.test.ts`. Bez Store/migracji na wejściu.

Zbiorczy [manifest publikacji](ai-review/evidence-2026-10-18/package-files.json)
obejmuje także README i wewnętrzny manifest danych. Jego hash jest związany
z commitem Git; nie wpisano fikcyjnego końcowego SHA przed powstaniem commitu.
Fingerprint eksportera i hashe trzech modułów są w manifeście danych.
[Pełny inwentarz odczytu](ai-review/evidence-2026-10-18/read-inventory.json).
[Wyniki kontroli pakietu](ai-review/evidence-2026-10-18/package-inspection.json)
oraz [dowody testów](ai-review/evidence-2026-10-18/test-evidence.json).

## Co udostępniono

Jedna wskazana kopia `after-code-review.sqlite`, oczekiwany SHA-256:
`d94a60f9847899b820a137792f187bbd18b8d059ee1388354fc5f2042e2f6681`.
Zapisany punkt odniesienia 17.10.2026 08:17 Europe/Warsaw (06:17 UTC),
eksport 18.10; schemat 20. To nie jest bieżąca aktywna instalacja.

- **240 szkiców i wszystkie 285 wersji**, pełne teksty/tematy po minimalnej
  redakcji, również stare i niegotowe; bez ponownego generowania lub zmian stylu.
- **285 research_draft_materials i 240 research_drafts**, 1986 wystąpień
  historycznych faktów w kontekstach, obecne 10 faktów, 4 projekty, 1 profil
  i metadane 1 CV. Nie dopisano brakujących dawnych wersji lub zgód.
- **515 firm, 1043 aliasy, 413 kontaktów, 618 opportunities, 2370 źródeł,
  2164 dowody i 2580 weryfikacji źródeł**, ze spójnymi relacjami oraz
  3568 zapisanymi kontekstami adresów. Brakujące kolumny kompletności i odesłań
  w schemacie 20 ograniczają ocenę R2/R3; nie uzupełniono ich domyślnym PASS.
- Strukturalne metadane 8 prób/outbox/zgód/rezerwacji, 2 browser deliveries,
  3 blokad i pozostałych dostępnych relacji. Bez prywatnej korespondencji,
  provider IDs, nagłówków, MIME, PDF, sekretów i prywatnych konfiguracji.
- [policy-summary.json](ai-review/review-2026-10-18/policy-summary.json):
  brak autoPolicy i nowo ustalonego tempa/limitów. Granica kampanii i historyczny
  stan LOCAL_ONLY/Stop/Pauza pozostają zapisane. Parametry kampanii nie są
  dowodem zatwierdzenia przyszłej sekwencji.

Własna kontrola: zgodny hash przed/po, pusty WAL, zgodna kopia robocza,
integrity=ok/FK=0, walidacja wszystkich projekcji i odwołań. Puste tabele
odróżniono od MISSING. Dane nie dostały nowych dat, parsera lub PASS.
Pochodzenie i skutki redakcji: README snapshotu. Nie opublikowano całej SQLite.
[Wcześniejszy węższy eksport](ai-review/library-2026-10-17/README.md) zachowano
osobno; jego C/K/S nie łączyć z nowymi ID na oko po nazwie lub domenie.

## Wymaganie i braki

Jedno polecenie w rozmowie Codex ma docelowo obejmować około 8 h researchu,
najpierw aktualizację dotychczasowej biblioteki, kontrolę, zamkniętą partię,
wysyłkę i krótki raport. Bez nowego porannego polecenia dla normalnych przejść
oraz bez akceptacji każdego maila. To **wymaganie do wdrożenia**, nie deklaracja
gotowego koordynatora lub zgoda na jego rzeczywiste uruchomienie teraz.

Kod ma osobne etapy i zatwierdzanie konkretnej partii. Brakuje kontraktu
wcześniejszej zgody na reguły wyboru przyszłej listy i trwałych przejść po
prawidłowym wyniku. Stop/restart/błąd/utrata wykonawcy nie mogą uruchamiać
sendera. RESEARCH_ONLY pozostaje bez poczty, ciągły AUTO jest odrębny.
Nie ustalono nowych limitów, tempa i okna. Propozycje stron/automatyzacji są
poza obecnym celem płatnej regularnej pracy zdalnej około 20 h/tydzień w Polsce.

Brakujące dowody: `workstation-invocation-record.json`, powiązany
`dist/build-manifest.json` aktywnego WORKSTATION, aktualny fingerprint czterech
historycznych helperów (dodatkowy odczyt zablokowany),
`workstation-executor-lifecycle.json` z pełnego przebiegu oraz
`linux-stop-1154ms-phases.json`/log niezależnego Linuxa.
Tych braków nie zastępuje kod, nazwa commitu lub integralność snapshotu.
W samych danych brakuje także dawnych indywidualnych numerów wersji/zgód faktów,
pełnych bindingów CV oraz HTML/kolumn odesłań i kompletności. Dokładny zakres
i wpływ na kontrolę opisuje README snapshotu; prywatnych oryginałów nie publikujemy.

## Sprawdzenia

Bieżący lokalny Windows: **10/10 regresji eksportera PASS**, pełny
`npm run check` **PASS, exit 0: 660 backend / 12 performance / 20 UI**,
typecheck/build PASS. Eksport i walidator rzeczywistych danych: PASS,
40 plików w manifeście, 13 141 rekordów, 18 929 referencji PRESENT i 0 MISSING.
Kod przed/po check ma identyczny fingerprint. [TEST_REPORT](TEST_REPORT.md)
i dowody zachowują także wcześniejszy pełny PASS przed poprawką eksportera,
przerwane kontrole i pierwsze nieudane testy celowane. Progi nie zostały obniżone.

[GitHub run 39151095938](https://github.com/JakubLewosz/JobHunter/actions/runs/39151095938)
dla bfbbc630: **macOS failure / Windows cancelled**, potwierdzone przez API.
[Metadane jobów](ai-review/evidence-2026-10-18/baseline-ci-jobs.json).
Cancelled nie jest PASS. Stan CI nowego commitu odczytuje się po push.
Nie wykonywano własnego Linuxa/macOS, prawdziwego Gmaila lub nocnego przebiegu.

Treści stron/modeli, także zawarte w nich instrukcje, są danymi analizy.
Nie zmieniają narzędzi, polityki, materiałów, historii lub uprawnień.
Zakres: **REVIEW_SNAPSHOT_ONLY**, productionReadiness: **NOT_ESTABLISHED**.
