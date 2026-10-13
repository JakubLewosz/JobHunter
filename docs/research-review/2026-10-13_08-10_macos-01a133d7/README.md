# Publiczna diagnostyka macOS — 2026-10-13_08-10_macos-01a133d7

Status **PARTIAL**, zakończenie zakresu: CONTROL_CORRECTION_COMPLETE. 2026-10-13T06:10:30.608Z–2026-10-13T06:44:05.843Z UTC; Europe/Warsaw = UTC+02:00. Czas publicznej części: 33.59 min.

Bazowy commit: 2aa3a1eef3fdbb1939adc6e710d80a76badb945c; badania używały zmienionego kodu o hashach w MANIFEST. DEVELOPMENT, osobna diagnostyczna SQLite poza repo. Profil: publiczny zatwierdzony snapshot z 2aa3a1eef3fdbb1939adc6e710d80a76badb945c; cvVerifiedInThisRun=false.

Preflight wykonano tym samym PublicSourceReader i procesem Node v24.11.0 z --use-system-ca. Oficjalna dokumentacja: [Node 24.11.0](https://nodejs.org/download/release/v24.11.0/docs/api/cli.html#--use-system-ca). Bez zmian magazynu certyfikatów lub ustawień konta.

| Licznik | Wynik |
| --- | ---: |
| unique_requested_pages | 68 |
| unique_read_pages | 58 |
| repeat_http_requests | 1 |
| new_firms_started | 10 |
| new_firms_analyzed | 10 |
| controls_analyzed | 6 |
| technically_blocked_firms | 0 |
| versions_with_selected_project | 11 |
| versions_mentioning_selected_project | 11 |
| proposed_identities | 16 |
| analyzed_unique_firms | 16 |
| index_rows | 16 |
| http_requests | 69 |
| fresh_reads_retained | 59 |
| extraction_calls | 18 |
| extractions_completed | 17 |
| qualifications_completed | 17 |
| public_contacts_literal | 14 |
| contacts_qualified | 11 |
| retained_versions | 13 |
| fully_checked_drafts | 11 |
| code_rejected_versions | 0 |
| historical_code_rejections | 0 |
| extraction_validation_errors | 0 |
| semantic_rejected_versions | 0 |
| unverified_versions | 0 |
| rejected_firms | 5 |
| historical_rejected_firm_decisions | 6 |
| source_failures_retained | 4 |
| model_errors | 2 |
| model_calls_total | 46 |
| duplicates | 0 |
| replay_batches | 2 |
| real_sends | 0 |
| outbox | 0 |
| send_attempts | 0 |
| send_approvals | 0 |
| active_auto_sessions | 0 |

Budżet: 90 minut od pierwszej operacji publicznej, 150 HTTP (redirecty, retry i błędy wliczone), 80 modeli, 10 nowych firm i 6 wskazanych kontroli. Nie zerowano liczników. Dokumentacja Node i GitHub/code fetch to czynności developerskie poza publicznym researchem firm.

HTTP i modele przypisano do każdej firmy w CSV. Liczba wersji po kontroli jest osobna od liczby wersji z trafnym projektem. Personalizacja nie oznacza szansy zatrudnienia. Dwie stare wiadomości w WIADOMOSCI mają status historyczny i nie są nowymi sukcesami.

Próba używała opublikowanych tropów, bez uzupełniającego wyszukiwania. Nieznane warunki pozostają pytaniem; pominięcie i awaria techniczna są odrębne. Historyczne błędy TLS innych firm i dawny payload Payarto pozostają nieustalone.

Prawdziwe maile **0**; DisabledMailProvider, brak gateway/Gmail, approvals/outbox/send_attempts/auto_sessions. Research nie nadaje CONTACTED ani prawa do późniejszej wysyłki. Nie odczytano prywatnego runtime, CV, skrzynki lub OAuth. Push nie wdraża kodu na Windowsie. Nie sprawdzono domowego magazynu certyfikatów, Gmaila, prywatnej historii, dostarczalności ani pracy całodziennej. Windows CI dotyczy wyłącznie fixture.

- [POROWNANIE.md](POROWNANIE.md)
- [FIRMY.csv](FIRMY.csv)
- [WIADOMOSCI.md](WIADOMOSCI.md)
- [ZRODLA.md](ZRODLA.md)
- [PROFIL_UZYTY.md](PROFIL_UZYTY.md)
- [BLEDY.md](BLEDY.md)
- [PRZEBIEG.jsonl](PRZEBIEG.jsonl)
- [MANIFEST.json](MANIFEST.json)

## Weryfikacja kodu

~~~json
{
  "platform": "darwin",
  "architecture": "arm64",
  "node": "v24.11.0",
  "command": "npm run check",
  "status": "PASS",
  "exit_code": 0,
  "typecheck": "PASS",
  "backend": {
    "passed": 403,
    "failed": 0,
    "duration_ms": 101291.040167
  },
  "performance": {
    "passed": 12,
    "failed": 0,
    "duration_ms": 6269.409083
  },
  "build": "PASS",
  "ui": {
    "passed": 15,
    "failed": 0,
    "duration_ms": 35400
  },
  "targeted_round": {
    "passed": 21,
    "failed": 0
  },
  "baseline_reproduction": {
    "passed": 0,
    "failed": 3,
    "purpose": "Project context, recruitment question, OFFER versus COMPANY before fixes."
  },
  "diff_check": "PASS",
  "scope": "Fictional providers/recipients, temporary databases and local Git repositories. No native Gmail/private runtime.",
  "ci": {
    "status": "VERIFY_FINAL_SHA_AFTER_PUSH",
    "url": "https://github.com/JakubLewosz/JobHunter/actions/workflows/offline-check.yml",
    "scope": "Windows/macOS isolated tests, not home workstation readiness."
  },
  "checked_at": "2026-10-13T07:00:03.524373+00:00"
}
~~~

Uwagi jakościowe: nowe wersje BizCode i Tukano otrzymały AutoRelay; OKE otrzymało CodeFabric po świeżym odczycie usług AI. Pełne opisy i mapping są przy wersjach w WIADOMOSCI. Część tekstów, m.in. BizCode i WizzDev, wylicza zbyt obszerny stack zamiast krótkiego dowodu pracy; review zgodności nie rozstrzyga tej jakości. Nie poprawiano ich ręcznie. WizzDev: oferta nadal REJECTED, szkic ma intencję COMPANY_INQUIRY; adres rekrutera z oferty nie jest osobnym potwierdzeniem kanału otwartej aplikacji z CV. Merixstudio: tylko pytania, obecny proces z CV zablokowany. Payarto: odczyt zawiera nazwę bez wystarczającej działalności/kontaktu, a dawny tytuł pozostaje nieustalony.

Kod po kontroli: cae2f60ff66ac50c477a467d3f46b389a3c3decf. CI finalnego commitu pakietu: [Actions](https://github.com/JakubLewosz/JobHunter/actions/workflows/offline-check.yml); wynik sprawdzany po pushu.
