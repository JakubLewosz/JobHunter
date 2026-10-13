# Spójność researchu JobHunter — 2026-10-13_14-31_ac3c1403_macos_consistency

Status **BLOCKED_EXTERNAL**. Dwie kontrole i dwa cykle ukończono; trzecie wyszukiwanie zakończyło się CODEX_TIMEOUT. Celowy powrót wykonano dopiero po Stop jako osobny cache-only replay na spójnej kopii, bez transportu/modelu i bez fikcyjnych verdictów. Pamięć harnessu pominęła ostatni indeks: Sprint0 raportujemy jako wcześniej badaną firmę, nie nowe odkrycie. Po publicznym Stop poprawiono też dwie zbyt wąskie reguły znaczenia dowodu (Sprint0 i TwójSoftware); ich aktualna kwalifikacja jest sprawdzona wyłącznie offline, bez nowych maili lub publicznego powtórzenia. Wynik gotowości jest sprawdzony ponownie po dalszych cyklach i po restarcie; stare pozytywne review nie zastępuje aktualnego pakietu.

~~~json
{
  "directions": 3,
  "new_companies": 2,
  "new_literal_contacts": 1,
  "new_current_checked": 0,
  "controls": [
    {
      "domain": "gotoma.pl",
      "result": "FULLY_CHECKED"
    },
    {
      "domain": "prodaut.pl",
      "result": "FULLY_CHECKED"
    }
  ],
  "previously_researched_revisits": 1,
  "completed_cycles": 2,
  "blocked_cycles": 1,
  "versions": 2,
  "current_checked": 2,
  "repeat_checks": [],
  "manual_interventions": 0
}
~~~

Publiczna próba używała kodu 7803b9d85ce5ecdadd6abf0501fdb96ac47f157f, dirty=false; dokładne hashe w MANIFEST. Diagnoza korzystała wyłącznie ze znanej poprzedniej diagnostyki, oryginał pozostał read-only. Dokładnie odtworzono dawny hash GOTOMA: zmieniły się qualification i sources (kolejność), wersje danych nie zmieniły się. PRODAUT ignorowała poprawne inquiryBasis. Poprawka wybiera już zweryfikowany dowód, ogranicza zbędne reanalizy i wersjonuje rewalidację tego samego tekstu z nowym pakietem. Bramka STALE pozostaje. Styl i algorytm wyboru kierunków nie zostały przebudowane.

Budżet wspólny: 60 min / 120 HTTP czytnika / 60 modeli / 2 kontrole + do 6 nowych firm. Rzeczywiście 9.71 min, 29 HTTP, 14 modeli. Pierwsza publiczna operacja 2026-10-13T12:31:47.735Z, koniec 2026-10-13T12:41:30.589Z; UTC, nazwa katalogu według Europe/Warsaw. Preflight/probe/search/extract/DRAFT/review/redirect/retry są wliczone, bez zerowania. Reuse/replay i źródła świeże są oznaczone oddzielnie. Wewnętrzne HTTP wyszukiwarki nie są ujawniane przez CLI.

| Licznik | Wynik |
| --- | ---: |
| unique_requested_pages | 29 |
| unique_read_pages | 27 |
| repeat_http_requests | 0 |
| new_firms_started | 2 |
| new_firms_analyzed | 2 |
| controls_analyzed | 2 |
| technically_blocked_firms | 0 |
| versions_with_selected_project | 2 |
| versions_mentioning_selected_project | 2 |
| proposed_identities | 5 |
| analyzed_unique_firms | 5 |
| index_rows | 5 |
| http_requests | 29 |
| fresh_reads_retained | 27 |
| extraction_calls | 5 |
| extractions_completed | 6 |
| qualifications_completed | 5 |
| public_contacts_literal | 4 |
| contacts_qualified | 2 |
| retained_versions | 2 |
| fully_checked_drafts | 2 |
| code_rejected_versions | 0 |
| historical_code_rejections | 0 |
| extraction_validation_errors | 0 |
| semantic_rejected_versions | 0 |
| unverified_versions | 0 |
| rejected_offers | 0 |
| explicitly_refused_company_contacts | 0 |
| missing_contact_or_inquiry_basis | 1 |
| rejected_firms | 3 |
| historical_rejected_firm_decisions | 3 |
| source_failures_retained | 0 |
| model_errors | 1 |
| model_calls_total | 14 |
| model_calls_assigned_to_companies | 9 |
| web_search_actions | 7 |
| duplicates | 1 |
| already_researched_leads | 0 |
| replay_batches | 0 |
| real_sends | 0 |
| outbox | 0 |
| send_attempts | 0 |
| send_approvals | 0 |
| active_auto_sessions | 0 |

DEVELOPMENT; osobna diagnostyka i DisabledMailProvider, bez gateway/Gmaila. Prawdziwe maile/SELF_TEST **0**, outbox/approvals/send attempts/auto sessions **0**. Profil: dokładny snapshot z 2aa3a1e, cvVerifiedInThisRun=false, bez PDF. Prywatne dane/runtime/historia/OAuth/nadawca bez zmian. Raport jest publiczny, bez baz/WAL/backupów/sekretów/pełnych witryn/surowych logów; redakcje podpisu i hashe są w MANIFEST.

Nie sprawdzono domowej instalacji Windows ani Gmaila/dostarczalności; hosted CI i fixture nie są takim sprawdzeniem. Push nie wdraża i nie wznawia sendera.

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
  "code_commit": "dbd5a39a7bbb297074d2d0617c50e27baea8fd6d",
  "command": "npm run check",
  "status": "PASS",
  "backend": {
    "passed": 434,
    "failed": 0,
    "duration_ms": 103225.199209
  },
  "performance": {
    "passed": 12,
    "failed": 0,
    "measurements": [
      {
        "scenario": "slow-read",
        "requestReceivedMs": 28.49,
        "rightsRevokedMs": 29.08,
        "responseMs": 32.57,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "FULL_SUITE"
      },
      {
        "scenario": "slow-model",
        "requestReceivedMs": 25.54,
        "rightsRevokedMs": 25.89,
        "responseMs": 30.18,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "FULL_SUITE"
      },
      {
        "scenario": "large-history",
        "requestReceivedMs": 412.5,
        "rightsRevokedMs": 412.69,
        "responseMs": 413.86,
        "inflightFinishedMs": null,
        "companies": 10035,
        "historyBuildMs": 26.67,
        "historyRows": 10035,
        "historyBytes": 7588995,
        "timingMode": "FULL_SUITE"
      },
      {
        "scenario": "inflight-post",
        "requestReceivedMs": 16.56,
        "rightsRevokedMs": 16.68,
        "responseMs": 18.32,
        "inflightFinishedMs": 351.62,
        "companies": 35,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "FULL_SUITE"
      },
      {
        "scenario": "slow-read",
        "requestReceivedMs": 17.88,
        "rightsRevokedMs": 18.4,
        "responseMs": 21.06,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-model",
        "requestReceivedMs": 13.57,
        "rightsRevokedMs": 13.68,
        "responseMs": 16.5,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "large-history",
        "requestReceivedMs": 304.33,
        "rightsRevokedMs": 304.47,
        "responseMs": 306.22,
        "inflightFinishedMs": null,
        "companies": 10035,
        "historyBuildMs": 20.37,
        "historyRows": 10035,
        "historyBytes": 7588995,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "inflight-post",
        "requestReceivedMs": 14.36,
        "rightsRevokedMs": 14.45,
        "responseMs": 15.49,
        "inflightFinishedMs": 351.27,
        "companies": 35,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-read",
        "requestReceivedMs": 13.78,
        "rightsRevokedMs": 13.88,
        "responseMs": 16.36,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-model",
        "requestReceivedMs": 11.92,
        "rightsRevokedMs": 12,
        "responseMs": 14.51,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "large-history",
        "requestReceivedMs": 272.47,
        "rightsRevokedMs": 272.58,
        "responseMs": 274.62,
        "inflightFinishedMs": null,
        "companies": 10035,
        "historyBuildMs": 19.77,
        "historyRows": 10035,
        "historyBytes": 7588995,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "inflight-post",
        "requestReceivedMs": 13.38,
        "rightsRevokedMs": 13.46,
        "responseMs": 14.52,
        "inflightFinishedMs": 351.18,
        "companies": 35,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-read",
        "requestReceivedMs": 13.45,
        "rightsRevokedMs": 13.52,
        "responseMs": 15.78,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-model",
        "requestReceivedMs": 11.65,
        "rightsRevokedMs": 11.7,
        "responseMs": 14.14,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "large-history",
        "requestReceivedMs": 212.12,
        "rightsRevokedMs": 212.22,
        "responseMs": 214.14,
        "inflightFinishedMs": null,
        "companies": 10035,
        "historyBuildMs": 18.66,
        "historyRows": 10035,
        "historyBytes": 7588995,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "inflight-post",
        "requestReceivedMs": 13.19,
        "rightsRevokedMs": 13.25,
        "responseMs": 14.32,
        "inflightFinishedMs": 350.8,
        "companies": 35,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      }
    ],
    "thresholds_changed": false
  },
  "ui": {
    "passed": 15,
    "failed": 0,
    "duration_seconds": 35.1
  },
  "typecheck": "PASS",
  "build": "PASS",
  "diff_check": "PASS",
  "initial_reproduction": {
    "failed": 3,
    "cause": "Missing companyActivities fallback, ignored explicit PROSPECT inquiryBasis, unordered source set triggers EXTRACT/DRAFT again."
  },
  "earlier_failed_checks": [
    {
      "backend_pass": 416,
      "backend_fail": 12,
      "causes": [
        "Regulation quote rejection incomplete",
        "Replay test attempted import before normal partial continuation",
        "Historical draft opportunity remains historical; test now checks current opportunity and blocking",
        "Pending flag incorrectly applied to already qualified DRAFT backlog",
        "Synthetic reader clock differed from simulated app clock",
        "Revalidation events counted as new drafts in hourly research"
      ]
    },
    {
      "backend_pass": 431,
      "backend_fail": 1,
      "cause": "Fixture assumed first three randomly ordered items always included Company 1; choose an actually prepared A instead, no weaker assertions."
    }
  ],
  "targeted_after_fixes": {
    "passed": 62,
    "failed": 0
  },
  "original_seven_contexts_checked": true,
  "offline_reviewer": "FIXTURE_EXPLICIT_NOT_REAL_PASS",
  "public_status": "BLOCKED_EXTERNAL",
  "public_stop": "CODEX_TIMEOUT",
  "public_repeat_in_loop": "NOT_REACHED",
  "after_stop_cache_only": "NO_HTTP_NO_MODEL_NO_MOCK_VERDICT",
  "windows_local": "NOT_RUN",
  "ci": "CHECK_AFTER_FINAL_PUSH",
  "public_code_commit": "7803b9d85ce5ecdadd6abf0501fdb96ac47f157f",
  "post_public_semantics": {
    "old_7803_helper_isolated_failures": 2,
    "new_strict_consistency_tests": 24,
    "policy_version": 2,
    "extraction_policy": 6,
    "public_rerun": false,
    "current_source_check_models": 0,
    "current_source_check_http": 0
  }
}
~~~
