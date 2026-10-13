# Samodzielny research JobHunter — 2026-10-13_12-02_9c7ca137_macos_autonomous

Wynik **PARTIAL**, powód końca BOUNDED_SCOPE_COMPLETED. PARTIAL wynika z jednego zachowanego szkicu GOTOMA, którego binding po ponownej analizie stał się DRAFT_MATERIAL_STALE. Review treści było pozytywne; aktualna bramka nie dopuszcza tego materiału. Brak błędów modeli i HTTP. Późniejsza poprawka licznika gotowych szkiców została sprawdzona offline na spójnej kopii, bez zmiany publicznej chronologii. Program sam wybierał kierunki przez QueryPlanner.next(), używał CodexSearchProvider i pełnego workera READ → EXTRACT → QUALIFY → DRAFT → SEMANTIC_REVIEW. Nowe firmy pochodzą z tych wyszukiwań. Kontrole są osobną grupą. Ręczne interwencje podczas publicznej pracy: **0**.

~~~json
{
  "directions": 4,
  "new_firms_started": 15,
  "new_firms_analyzed": 15,
  "literal_contacts": 10,
  "eligible_contacts": 7,
  "latest_checked_drafts": 7,
  "duplicates": 1,
  "stale_drafts": 1,
  "all_versions": 8,
  "technical_item_errors": 0,
  "manual_interventions": 0
}
~~~

Początek publicznej części 2026-10-13T10:02:42.520Z, koniec 2026-10-13T10:29:52.193Z, czas 27.16 min. DEVELOPMENT; osobne dane poza repo. Kod f59ccb89f301d762ebd50c4eead8c758353c8116, dirty=false; hashe w MANIFEST. Zatwierdzony profil z 2aa3a1eef3fdbb1939adc6e710d80a76badb945c; cvVerifiedInThisRun=false, bez PDF.

Limity tej jawnej diagnostyki: 90 minut, 20 nowych firm i 4 kontrole, 180 bezpośrednich prób HTTP (redirect/retry/preflight wliczone), 100 wywołań modelu (probe/search/extract/draft/review wliczone), bez zerowania. Wybrany skończony zakres harnessu: do czterech cykli po cztery nowe firmy. Nie zmienia limitów produktu ani małego smoke. Wszystkie publiczne operacje tej rundy korzystają z jednego budżetu. Wewnętrzny ruch HTTP usługi web search nie jest ujawniany przez CLI; liczba jego akcji i zapytań jest w przebiegu, a ścisłej liczby transportowej po stronie dostawcy nie można zweryfikować.

| Licznik (nowe + kontrolne) | Wynik |
| --- | ---: |
| unique_requested_pages | 80 |
| unique_read_pages | 75 |
| repeat_http_requests | 0 |
| new_firms_started | 15 |
| new_firms_analyzed | 15 |
| controls_analyzed | 4 |
| technically_blocked_firms | 0 |
| versions_with_selected_project | 12 |
| versions_mentioning_selected_project | 12 |
| proposed_identities | 19 |
| analyzed_unique_firms | 19 |
| index_rows | 19 |
| http_requests | 80 |
| fresh_reads_retained | 75 |
| extraction_calls | 20 |
| extractions_completed | 20 |
| qualifications_completed | 19 |
| public_contacts_literal | 14 |
| contacts_qualified | 11 |
| retained_versions | 12 |
| fully_checked_drafts | 11 |
| code_rejected_versions | 0 |
| historical_code_rejections | 0 |
| extraction_validation_errors | 0 |
| semantic_rejected_versions | 0 |
| unverified_versions | 1 |
| rejected_offers | 1 |
| explicitly_refused_company_contacts | 0 |
| missing_contact_or_inquiry_basis | 8 |
| rejected_firms | 8 |
| historical_rejected_firm_decisions | 8 |
| source_failures_retained | 0 |
| model_errors | 0 |
| model_calls_total | 50 |
| model_calls_assigned_to_companies | 44 |
| web_search_actions | 12 |
| duplicates | 1 |
| already_researched_leads | 0 |
| replay_batches | 0 |
| real_sends | 0 |
| outbox | 0 |
| send_attempts | 0 |
| send_approvals | 0 |
| active_auto_sessions | 0 |

rejected_firms oznacza końcową kodową niedopuszczalność kontaktu, także z braku danych; nie liczbę potwierdzonych odmów firm. Oferta, rzeczywista odmowa i brak kontaktu/podstawy mają osobne liczniki.

Preflight: ten sam PublicSourceReader i Node z --use-system-ca, bez zmian zaufania TLS lub SSRF. Domeny wcześniejszego raportu są pamięcią ALREADY_RESEARCHED, nie CONTACTED. Cykl z problemem zachowuje zadania; shared continuation stosuje istniejącą regułę AUTO dla pojedynczych błędów. Nie naprawiano ręcznie kolejki, decyzji, factIds ani projektów po rozpoczęciu.

Prawdziwe maile **0**. DisabledMailProvider, brak gateway, Gmaila, zgód/send attempts/outbox/auto sessions. Brak zmian prywatnego runtime, nadawcy, OAuth, historii lub CV. To publiczny raport: kontakty firm mają publiczne źródła; prywatne dane osobiste w kopiach maili podlegają redakcji (zakres i hashe w MANIFEST). Nie publikujemy baz, sekretów, pełnych witryn lub toku rozumowania.

Nie jest to test dostarczalności ani gwarancja całodziennej pracy. Push nie wdraża domowego Windowsa. Pozostaje właściwy katalog i nowa/istniejąca instalacja, CV/materiały, CA/czytnik, konto/uprawnienia poczty i późniejszy świadomy pilotaż: [instrukcja Windows](../../URUCHOMIENIE_RANO.md).

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
  "code_commit": "835a6d53bc3267c8fe29bd54c706bdacfc5415ce",
  "command": "npm run check",
  "status": "PASS",
  "typecheck": "PASS",
  "backend": {
    "passed": 410,
    "failed": 0,
    "duration_ms": 104655.987917
  },
  "performance": {
    "passed": 12,
    "failed": 0,
    "measurements": [
      {
        "scenario": "slow-read",
        "requestReceivedMs": 29.35,
        "rightsRevokedMs": 29.96,
        "responseMs": 33.21,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "FULL_SUITE"
      },
      {
        "scenario": "slow-model",
        "requestReceivedMs": 26.71,
        "rightsRevokedMs": 26.85,
        "responseMs": 30.58,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "FULL_SUITE"
      },
      {
        "scenario": "large-history",
        "requestReceivedMs": 613.01,
        "rightsRevokedMs": 613.19,
        "responseMs": 614.17,
        "inflightFinishedMs": null,
        "companies": 10035,
        "historyBuildMs": 32.21,
        "historyRows": 10035,
        "historyBytes": 7588819,
        "timingMode": "FULL_SUITE"
      },
      {
        "scenario": "inflight-post",
        "requestReceivedMs": 16.38,
        "rightsRevokedMs": 16.5,
        "responseMs": 17.91,
        "inflightFinishedMs": 351.67,
        "companies": 35,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "FULL_SUITE"
      },
      {
        "scenario": "slow-read",
        "requestReceivedMs": 17.19,
        "rightsRevokedMs": 17.71,
        "responseMs": 20.29,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-model",
        "requestReceivedMs": 12.94,
        "rightsRevokedMs": 13.05,
        "responseMs": 15.84,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "large-history",
        "requestReceivedMs": 308.23,
        "rightsRevokedMs": 308.39,
        "responseMs": 310.07,
        "inflightFinishedMs": null,
        "companies": 10035,
        "historyBuildMs": 20.01,
        "historyRows": 10035,
        "historyBytes": 7588819,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "inflight-post",
        "requestReceivedMs": 13.9,
        "rightsRevokedMs": 13.99,
        "responseMs": 15.13,
        "inflightFinishedMs": 350.65,
        "companies": 35,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-read",
        "requestReceivedMs": 13.97,
        "rightsRevokedMs": 14.08,
        "responseMs": 16.53,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-model",
        "requestReceivedMs": 11.69,
        "rightsRevokedMs": 11.76,
        "responseMs": 14.23,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "large-history",
        "requestReceivedMs": 266.82,
        "rightsRevokedMs": 266.93,
        "responseMs": 269,
        "inflightFinishedMs": null,
        "companies": 10035,
        "historyBuildMs": 19.75,
        "historyRows": 10035,
        "historyBytes": 7588819,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "inflight-post",
        "requestReceivedMs": 12.83,
        "rightsRevokedMs": 12.89,
        "responseMs": 14.02,
        "inflightFinishedMs": 350.7,
        "companies": 35,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-read",
        "requestReceivedMs": 13.43,
        "rightsRevokedMs": 13.49,
        "responseMs": 15.81,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "slow-model",
        "requestReceivedMs": 11.15,
        "rightsRevokedMs": 11.21,
        "responseMs": 13.63,
        "inflightFinishedMs": null,
        "companies": 34,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "large-history",
        "requestReceivedMs": 208.92,
        "rightsRevokedMs": 209.03,
        "responseMs": 210.91,
        "inflightFinishedMs": null,
        "companies": 10035,
        "historyBuildMs": 18.16,
        "historyRows": 10035,
        "historyBytes": 7588819,
        "timingMode": "ISOLATED"
      },
      {
        "scenario": "inflight-post",
        "requestReceivedMs": 12.52,
        "rightsRevokedMs": 12.59,
        "responseMs": 13.69,
        "inflightFinishedMs": 349.48,
        "companies": 35,
        "historyBuildMs": 0,
        "historyRows": 0,
        "historyBytes": 0,
        "timingMode": "ISOLATED"
      }
    ],
    "thresholds_changed": false
  },
  "build": "PASS",
  "ui": {
    "passed": 15,
    "failed": 0,
    "duration_seconds": 35.6
  },
  "baseline_reproductions": {
    "invitation_open_planner": {
      "passed": 4,
      "failed": 3
    },
    "navigation": {
      "passed": 1,
      "failed": 1
    }
  },
  "earlier_failures": [
    {
      "stage": "targeted",
      "passed": 43,
      "failed": 1,
      "reason": "Fixture still contained a verified PHP/Laravel title; selector correctly chose FixDesk. Changed fixture title to Junior Developer to isolate company activity."
    },
    {
      "stage": "first npm run check",
      "passed": 408,
      "failed": 1,
      "reason": "Old prompt assertion 150–220 in research.test.ts; updated to current editorial preference. Other stages not run after backend failure."
    },
    {
      "stage": "initial stale-metric fixture setup",
      "reason": "Plain AUTO ResearchJobHunter lacked diagnostic auto_run_scope; fixture switched to createPublicDiagnostic before reproducing the actual 1 != 0 assertion."
    }
  ],
  "integration_checks": {
    "initial": {
      "passed": 20,
      "failed": 0
    },
    "final_preflight": {
      "passed": 9,
      "failed": 0
    }
  },
  "diff_check": "PASS",
  "scope": "Fictional providers/recipients, temporary directories and local Git. No native Gmail/private runtime.",
  "historical_stop_ci": "Prior macOS request-receipt delay remains unexplained; current PASS does not establish cause.",
  "windows_local": "NOT_RUN",
  "ci": "TO_BE_CHECKED_AFTER_FINAL_PUSH",
  "public_code_commit": "f59ccb89f301d762ebd50c4eead8c758353c8116",
  "postpublic_metrics_regression": {
    "before": {
      "passed": 4,
      "failed": 1,
      "failure": "checkedDrafts=1 for material-binding stale"
    },
    "after": {
      "passed": 19,
      "failed": 0
    },
    "public_probe_not_repeated": true,
    "offline_replay_http": 0,
    "offline_replay_models": 0,
    "original_diagnostic_unchanged": true
  }
}
~~~
