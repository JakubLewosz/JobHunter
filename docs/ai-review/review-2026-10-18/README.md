# Rozszerzony pakiet do przeglądu — eksport 18.10.2026

**REVIEW_SNAPSHOT_ONLY / NOT_ESTABLISHED.** To odczyt jednej wskazanej kopii
ze schematem 20, nie stan obecnego WORKSTATION ani kolejka gotowa do wysyłki.
Nie nadpisuje [wcześniejszego eksportu](../library-2026-10-17/README.md).
Nowy zestaw ma własne spójne pseudonimy; nie należy łączyć jego ID z dawnymi
C/K/S po nazwie lub domenie.

## Pochodzenie i zakres

Wejście: indywidualnie wskazany `after-code-review.sqlite`, SHA-256
`d94a60f9847899b820a137792f187bbd18b8d059ee1388354fc5f2042e2f6681`.
Zapisany czas punktu odniesienia: **17.10.2026 08:17:00.048 Europe/Warsaw**
(06:17 UTC); zapisany audit: **08:30:51.704 Europe/Warsaw** (06:30 UTC).
Data eksportu jest osobno w manifest.json.
To daty zapisanych dowodów, nie niezależnie ustalona metoda utworzenia backupu.

Sprawdzono własnym odczytem: oczekiwany hash przed/po, pusty WAL 0 B,
SHM 32768 B, zgodność roboczej kopii, integrity=ok, FK=0, schemat 20.
Oryginału i sidecarów nie zmieniano. Czytano wyłącznie izolowaną kopię
readonly/query_only w krótkiej transakcji, bez Store/migracji/startu aplikacji.
Wcześniejszy audit deklarował 52 tabele bez zmian; to odrębny historyczny dowód.
Metoda utworzenia kopii pozostaje UNKNOWN. Nie dopisano VACUUM_INTO/SQLITE_BACKUP.
Nie ma dopuszczonej drugiej kopii do nowego porównania „przed/po”.

## Zawartość

| Plik                                                                                                             | Co zawiera                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [drafts.jsonl](drafts.jsonl)                                                                                     | Wszystkie 240 bieżących rekordów szkiców, pełne tematy/teksty po minimalnej redakcji, wersja/status/daty, relacje do firmy, opportunity, kontaktu, faktów i dowodów.                                                                                         |
| [draft-versions.jsonl](draft-versions.jsonl)                                                                     | Wszystkie 285 zapisanych wersji, także stare i niespełniające aktualnych warunków; temat/tekst/daty, is-current, zapisane kontrole i numery wersji powiązanych z pakietem nadania.                                                                           |
| [candidate-materials.jsonl](candidate-materials.jsonl)                                                           | 1 profil, 10 faktów, 4 projekty i metadane 1 CV. Zachowane statusy zatwierdzenia; PDF, nazwa i ścieżka pliku są pominięte.                                                                                                                                   |
| [material-bindings.jsonl](material-bindings.jsonl)                                                               | 285 rekordów dokładnej wersji materiałów oraz 240 powiązań research_drafts; zapisane wyniki/statusy/datowanie kontroli. Historyczne konteksty zawierają 1986 wystąpień faktów, bez deduplikowania różnych kontekstów na oko.                                 |
| [opportunities.jsonl](opportunities.jsonl)                                                                       | Wszystkie 618 opportunities, decyzje, warunki, powody i powiązania.                                                                                                                                                                                          |
| [contact-verifications.jsonl](contact-verifications.jsonl)                                                       | 2580 historycznych weryfikacji źródeł; contact_reviews istnieje i jest puste. Nie odmładzano dat.                                                                                                                                                            |
| [contacts.jsonl](contacts.jsonl), [evidence.jsonl](evidence.jsonl), [evidence-links.jsonl](evidence-links.jsonl) | 413 kontaktów, 2164 dowody i ich relacje do źródeł. GENERAL zachowuje GENERAL.                                                                                                                                                                               |
| [companies.jsonl](companies.jsonl), [aliases.jsonl](aliases.jsonl)                                               | 515 firm i 1043 aliasy; historia/blokady jako kody i relacje, bez prywatnych powodów.                                                                                                                                                                        |
| `sources-001.jsonl` i kolejne                                                                                    | Wszystkie 2370 źródeł, pełny zapisany tekst, fragment i konteksty adresów po redakcji; oryginalny/końcowy URL, parser, daty i hashe. Podział plików nie obcina rekordów ani kontekstu.                                                                       |
| [history-safety.jsonl](history-safety.jsonl)                                                                     | Strukturalne rekordy: 8 outbox, 8 prób, 8 rezerwacji usage, 8 zgód, 2 browser deliveries, 3 blokady, 1 import historii, 169 runów i dostępne pozostałe relacje. Bez MIME, nagłówków, prywatnych tematów/treści, adresów konta i provider IDs.                |
| [policy-summary.json](policy-summary.json), [policy-records.jsonl](policy-records.jsonl)                         | Aktualne zapisane bezpieczne klucze stanu oraz ustawienia 1 kampanii. autoPolicy nie występuje; limity/tempo przyszłej sekwencji są nieustalone. Brak konfiguracji to nie zgoda bez limitu.                                                                  |
| [scope-links.jsonl](scope-links.jsonl), [identity-events.jsonl](identity-events.jsonl)                           | Tabele zakresu istnieją i są puste; tabela zdarzeń domen z migracji 022 nie istnieje w schemacie 20. Brak zdarzenia nie dowodzi nielegalności dawnej zmiany.                                                                                                 |
| [identity-audit.json](identity-audit.json)                                                                       | Relacje tożsamości/współdzielonych skrzynek i zablokowanych firm; bez merge oraz bez deklaracji braku historycznych usunięć.                                                                                                                                 |
| [schema.json](schema.json), [manifest.json](manifest.json), [validation.json](validation.json)                   | Jawne mapowanie tabel/kolumn/pól, ścisłe schematy rekordów i metadanych, fingerprint eksportera, hashe/rozmiary/liczności plików danych oraz wynik kontroli. Cały pakiet wraz z README obejmuje dodatkowy zbiorczy manifest publikacji wskazany w AI_REVIEW. |

Każdy wiersz JSONL ma `table`, `recordId` i tylko dozwolone pola danej tabeli.
Pole relacji to `{id,state}`: PRESENT, MISSING, NOT_RECORDED lub NOT_APPLICABLE.
PRESENT musi wskazywać istniejący recordId. Pseudonimy są lokalne dla tego
eksportu; nie publikujemy mapowania na oryginalne ID ani klucza HMAC. Prywatny
adres nie jest zastępowany hashem emaila. Dla tej kopii 0 relacji MISSING.
Puste tabele i nieistniejące tabele są rozróżnione przez availability.

## Wersje i granice wiedzy

`reviewMetadata.currentVersion` porównuje numer z bieżącym drafts; `savedCheck`
wskazuje dokładny zapis research_draft_materials, jeśli istnieje. `attemptVersions`
pochodzi z outbox, nie jest nowym rejestrem wysyłek. PASS/COMPLETED to historyczny
wynik dla zapisanej wersji, nie dzisiejsza gotowość. supported=false i null
pozostają różne. Modelowe uwagi są reprezentowane przez typowany wynik/liczność,
bez surowego model_calls lub arbitralnych obiektów modelu.

W kontekstach zachowano dokładne merytoryczne brzmienie historycznych faktów.
Ich indywidualna wersja i approvalStatus nie były zapisane, więc są odpowiednio
null i NOT_RECORDED. Referencja do obecnego fact row nie dowodzi, że ten sam tekst
miał wtedy obecny numer wersji lub zgodę. Bieżące portfolio_projects nie ma
własnej historii wersji; historyczne opisy projektów pozostają w kontekstach faktów.
Historyczny binding CV nie jest wszędzie dostępny. Metadane CV i cv_hash prób
pozwalają ocenić dostępne powiązania; nie dopisano brakujących związków.
Pełna historia wersji polityki i przyszła zgoda sekwencji również nie są zapisane.

Zapisana kampania RESEARCH_ONLY ma policy_version=14, limity day/cycle/campaign
10/3/50, interval_minutes=60, okno 08:00–16:00 Europe/Warsaw i wyłączony
schedule. Te historyczne pola można zbadać w policy-records.jsonl. Nie są
zatwierdzeniem tempa, limitów ani okna przyszłego AUTO_POLICY: odpowiedni
autoPolicy i zgoda sekwencji nie występują. Nie zapisano żadnej nowej zgody.

Brak completeness w starym schemacie oznacza LEGACY_UNKNOWN. Brak outbound_links
oznacza null, nie dowód braku odesłań. Hashem nie da się odtworzyć utraconego HTML
lub kontekstu. Techniczna wartość spoza jawnej listy kodów staje się UNKNOWN;
nie zamieniamy jej w PASS. Mapowanie jest w schema.json.

W tej kopii zachowano **3568 kontekstów adresów** z 2283 źródeł; 87 źródeł
nie ma takiego zapisu. Natywną tablicę `{email,text,complete?}` odwzorowano na
`{address,contexts,complete}`. Brak indywidualnego complete daje null, nie true.
Kolumny completeness i outbound_links nie istnieją w tym schemacie: publiczny
pakiet nie pozwala odtworzyć pierwotnego kontekstu odesłań potrzebnego do R3.
Eksporter obsługuje nowsze tablice `{url,context}` i zachowanie ograniczeń
kompletności, co sprawdzono syntetycznie; nie dopisuje ich do starej kopii.

## Redakcja i hashe

Lokalnie przed zapisem usunięto zbędne dane identyfikacyjne kandydata,
prywatne adresy email, telefony, ścieżki, parametry/fragmenty URL i wzorce
sekretów. Kategorie/liczby są w validation.json, bez wartości wejściowych.
Publiczne kontakty firmy zachowano, jeśli adres ma literalny ślad w jej
zapisanym źródle PUBLIC_HTTP. To nie jest ponowne potwierdzenie oficjalności
publikującego. Nie dodano, nie wygenerowano i nie poprawiono
żadnej wiadomości; zachowano pełną strukturę i merytoryczną treść.

`originalSubjectSha256`/`originalBodySha256` odnoszą się do oryginalnego tekstu,
`redacted...Sha256` do opublikowanego tekstu, a manifest.sha256 do pliku JSONL.
Oryginalnych hashy tekstu/bindingu/MIME nie da się w pełni odtworzyć z redakcji:
taką kontrolę trzeba wykonać lokalnie na dopuszczonym oryginale. Nie publikujemy
MIME lub PDF w celu pozornego usunięcia tego ograniczenia. Redakcja parametrów
URL i części kontekstu uniemożliwia niektóre byte-exact/literal kontrole.

## Odtworzenie narzędzia

```powershell
npm --silent run review:export -- --snapshot "D:\Backup\wybrana.sqlite" --provenance "D:\Backup\review-provenance.json" --output "D:\Review\nowy-pakiet"
npm --silent run review:export -- --validate "D:\Review\nowy-pakiet"
```

Provenance ma ścisły kontrakt opisany w `provenanceSchema` eksportera:
schema=1, kind=USER_DESIGNATED_RECORDED_BACKUP, oczekiwany SHA-256,
snapshotAt/auditAt ze wskazanych dowodów, recordedIntegrity=ok,
recordedForeignKeyErrors=0, recordedTableCount i creationMethod=UNKNOWN.
Nie tworzyć tej deklaracji bez konkretnego istniejącego backupu i dowodów.
Eksporter nie wyszukuje danych. Odrzuca niezerowy WAL, błędny hash/proweniencję,
nieobsługiwany schemat i istniejący katalog wyjścia. Korzysta z krótkiej
spójnej transakcji na roboczej kopii; staging publikuje dopiero po walidacji.

Kod: `apps/server/src/review/`, CLI: `scripts/export-review-package.ts`,
syntetyczne regresje: `tests/review-package.test.ts`. Dane stron i modeli
pozostają danymi, a nie instrukcjami sterującymi eksporterem lub aplikacją.
