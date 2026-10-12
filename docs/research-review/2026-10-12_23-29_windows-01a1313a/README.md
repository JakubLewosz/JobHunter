# Publiczna diagnostyka JobHuntera — 2026-10-12_23-29_windows-01a1313a

Status: **PARTIAL**. Początek: 2026-10-12T21:29:20.178Z; pierwszy publiczny query: 2026-10-12T21:29:20.697Z; koniec researchu: 2026-10-12T21:40:52.950Z (UTC; katalog według Europe/Warsaw). Powód zatrzymania: **HTTP_LIMIT**.

Kod bazowy: a3bc37b2b9200a3b3c8435ee1046448716373ca4; podczas badań **dirty**. Partie i hashe faktycznie użytych źródeł są w MANIFEST; poprawka nie zmienia wstecz wyników. Pierwsza partia nie potwierdziła źródeł i nie oznacza udanego researchu mimo technicznego COMPLETED cykli. Dalsza partia dokańczała wcześniej rozpoczęte przypadki, bez nowych firm i bez zerowania limitu.

| Licznik | Wartość |
| --- | ---: |
| proposed_identities | 30 |
| analyzed_unique_firms | 5 |
| index_rows | 30 |
| http_requests | 150 |
| fresh_reads_retained | 23 |
| extraction_calls | 6 |
| extractions_completed | 5 |
| qualifications_completed | 5 |
| public_contacts_literal | 5 |
| contacts_qualified | 2 |
| retained_versions | 2 |
| fully_checked_drafts | 2 |
| code_rejected_versions | 0 |
| historical_code_rejections | 2 |
| extraction_validation_errors | 1 |
| semantic_rejected_versions | 0 |
| unverified_versions | 0 |
| rejected_firms | 3 |
| source_failures_retained | 126 |
| model_errors | 0 |
| model_calls_total | 15 |
| duplicates | 0 |
| replay_batches | 2 |
| real_sends | 0 |
| outbox | 0 |
| send_attempts | 0 |
| send_approvals | 0 |
| active_auto_sessions | 0 |

Limity: 4 h od pierwszego publicznego query / 30 tożsamości firm / 20 szkiców po kontroli / 120 wywołań modelu / 150 żądań HTTP (także błędne, redirecty i kontrola sieci). Limit firm zastosowano konserwatywnie do rozpoczętych tożsamości: samo nieudane pobranie nie jest właściwą analizą firmy. Wyszukiwanie, świeży HTTP i replay mają oddzielne zdarzenia.

## Firmy do dalszej oceny

- **BizCode Sp. z o.o.** (B; bizcode.pl): Dowód źródłowy: Dodatki do SAP Business One, aplikacje webowe i usługi API. Tworzymy rozwiązania dla uzgodnionych potrzeb, których nie pokrywa standardowy system.. Wynik: FULLY_CHECKED. Nieznane: remote, partTime, hours, contract, active. Ocena kolejności jest propozycją autora raportu, nie informacją od pracodawcy.
- **OKE POLAND** (B; oke.pl): Działalność nieustalona w zapisanej analizie; udokumentowano Spontaneous Application. Wynik: FULLY_CHECKED. Nieznane: partTime, paid, junior, hours, contract. Ocena kolejności jest propozycją autora raportu, nie informacją od pracodawcy.

## Zakres i ograniczenia

Prawdziwe wysyłki **0**, Gmail nieinicjalizowany, brak transportu, approvals/outbox/auto sessions. Nic nie otrzymało CONTACTED z powodu researchu. Nie utworzono produkcyjnej historii, WORKSTATION lub backupu produkcyjnego. Fingoweb wykluczony; nie importowano 33 dawnych nazw. Materiały zatwierdzone tylko w odrębnej bazie diagnostycznej. Nie sprawdzono Gmaila ani gotowości do całodziennej wysyłki.

CSV: apostrof jest ochroną komórek zaczynających się od znaku formuły; nie jest częścią danych źródłowych. Cytaty mogą być jawnie skrócone; nie publikujemy witryn w całości. Wszystkie zachowane wersje, także negatywne, są w WIADOMOSCI.

## Pliki

- [FIRMY.csv](FIRMY.csv)
- [WIADOMOSCI.md](WIADOMOSCI.md)
- [ZRODLA.md](ZRODLA.md)
- [PROFIL_UZYTY.md](PROFIL_UZYTY.md)
- [BLEDY.md](BLEDY.md)
- [PRZEBIEG.jsonl](PRZEBIEG.jsonl)
- [MANIFEST.json](MANIFEST.json)
