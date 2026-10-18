# Publiczny eksport biblioteki — wskazany backup z 17.10.2026

Użytkownik osobno zlecił publikację firm, kontaktów i źródeł w publicznym repo.
Eksport zawiera **515 firm, 413 kontaktów i 2370 zapisanych źródeł PUBLIC_HTTP**.
W tym eksporcie nie pominięto żadnej firmy, kontaktu ani źródła.
Zakres: `PUBLIC_RESEARCH_REVIEW_ONLY`; gotowość produkcji: `NOT_ESTABLISHED`.

## Pliki i relacje

- [companies.jsonl](companies.jsonl): nazwa, domena i aliasy NAME/DOMAIN.
- [contacts.jsonl](contacts.jsonl): literalny adres, rodzaj kontaktu, zapisany
  status/data weryfikacji i odwołanie do źródła oraz fragmentu dowodu.
- `sources-001.jsonl` i kolejne pliki wymienione w [manifest.json](manifest.json):
  URL, tytuł, daty, status, parser, hash oryginalnego materiału i cały zapisany
  tekst/fragment publicznej strony. Podział około 1 MiB, bez obcinania tekstu.
- [manifest.json](manifest.json): liczności, rozmiary i SHA-256 plików.

Każdy wiersz JSONL jest osobnym obiektem JSON. `C...` identyfikuje firmę,
`K...` kontakt, `S...` źródło. `companyId`, `sourceId` oraz `companyIds`
pozwalają połączyć pliki. Oryginalne aplikacyjne UUID zostały zastąpione.
Ten format służy analizie i nie jest backupem do restore aplikacji.

Kontakty wybrano po powiązaniu evidence → research_evidence → PUBLIC_HTTP
i literalnym wystąpieniu adresu w zapisanym tekście, fragmencie lub kontekście
adresu. Zachowano rzeczywisty rodzaj kontaktu; GENERAL nie stał się RECRUITMENT.
Taka kontrola publikacji nie zastępuje bramek aktualności, celu i historii.

Pola URL mają usunięte query i fragment, aby nie publikować identyfikatorów
sesji. Dlatego nie są kopią bajtową wszystkich pierwotnych adresów URL.
`storedContentHash` dotyczy oryginalnego materiału aplikacji, nie serializacji
wiersza JSONL. Dla plików eksportu obowiązują hashe z manifestu.

## Pochodzenie i wykonana kontrola

Jawnie wskazany `after-code-review.sqlite`, SHA-256:
`d94a60f9847899b820a137792f187bbd18b8d059ee1388354fc5f2042e2f6681`.
Hash zgodny z wartością podaną przez użytkownika i wskazanym baseline.
Wskazany final-audit z 17.10.2026 06:30:51 UTC podaje readonly, 52 tabele,
0 zmienionych tabel, integrity=ok i FK=0. Nie publikujemy prywatnych raportów.

Przy eksporcie backup miał istniejący pusty WAL (0 B) i SHM 32768 B.
Nie usuwano ich ani nie otwierano produkcyjnej bazy. Do nowego katalogu poza
repo skopiowano wskazany niezmieniony plik backupu, przy ponownej kontroli
hasha i zerowego WAL. Kopię otwarto readonly/query_only bez Store i migracji.
Kontrola kopii: integrity=ok, FK=0. Metoda historycznego backupu nie została
ustalona na nowo; nie dopisano fikcyjnej deklaracji VACUUM_INTO/SQLITE_BACKUP.

Odczyt eksportera miał jawną listę tabel i kolumn: companies, company_aliases,
contacts, evidence, research_evidence i research_sources. Bez SELECT * oraz
bez odczytu profilu, konta, app_state, wiadomości, szkiców i prób.
Syntetyczna regresja potwierdziła brak prywatnych sentinelów, niezmienione
wejście, odrzucenie nadpisania, odrzucenie kontaktu bez publicznego dowodu
i usunięcie parametru URL/wzorca sekretu. W rzeczywistym eksporcie liczba
wykrytych wzorców sekretu wynosiła 0; nie jest to pełny audyt wszystkich
możliwych sekretów w historycznie zapisanych stronach internetowych.

Schemat źródeł kopii nie miał pola completeness; eksport zachowuje
`LEGACY_UNKNOWN`. Parser, historyczne daty i statusy nie były podnoszone.
W READ może być stary materiał wymagający odczytu według obecnych reguł.
Zapisane kontakty i źródła nie są aktualną listą gotową do wysyłki.

## Dane pominięte zgodnie z zakresem publikacji

Nie ma tutaj poczty, treści szkiców, profilu/faktów kandydata, CV/PDF,
sekretów, cookies/OAuth, prywatnych ścieżek, powodów blokad, historii nadania,
MIME, outbox, prób ani kwot. Nie wolno wnioskować z ich braku o pustej historii.
Nie uruchamiać kampanii lub testowego nadania na podstawie tego eksportu.
