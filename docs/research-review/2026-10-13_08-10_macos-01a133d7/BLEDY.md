# Błędy i odrzucenia

Błędy transportu, walidacji i wynik review są odrębne. Historycznego UNVERIFIED_TITLE Payarto nie rekonstruujemy: dawny payload nie został zachowany. Nowe błędy tytułu zachowują ograniczoną diagnostykę.

~~~json
{
  "company_id": "c4c94e3e-bfe2-4f65-b3bf-f323792def40",
  "call_id": "428e7405-ff49-4078-999a-5779d53fbf20",
  "stage": "EXTRACT",
  "code": "CODEX_TIMEOUT",
  "diagnostic": {
    "callId": "428e7405-ff49-4078-999a-5779d53fbf20",
    "stage": "EXTRACT",
    "startedAt": "2026-10-13T06:10:38.350Z",
    "elapsedMs": 123261,
    "cliVersion": "codex-cli 0.162.0-alpha.17.2",
    "operation": "EXEC",
    "exitCode": null,
    "signal": "SIGKILL",
    "code": "CODEX_TIMEOUT",
    "category": "TIMEOUT",
    "message": "Process terminated by SIGKILL"
  },
  "attempts": 1
}
~~~

~~~json
{
  "company_id": "055e544b-16bd-4527-971e-a59646a26144",
  "call_id": "e4457cb7-978d-4949-9a0e-7f665de86871",
  "stage": "SEMANTIC_REVIEW",
  "code": "CODEX_FAILED",
  "diagnostic": {
    "callId": "e4457cb7-978d-4949-9a0e-7f665de86871",
    "stage": "SEMANTIC_REVIEW",
    "startedAt": "2026-10-13T06:26:48.217Z",
    "elapsedMs": 5103,
    "cliVersion": "codex-cli 0.162.0-alpha.17.2",
    "operation": "EXEC",
    "exitCode": 1,
    "signal": null,
    "code": "CODEX_FAILED",
    "category": "UNKNOWN",
    "message": "Selected model is at capacity. Please try a different model.\nSelected model is at capacity. Please try a different model."
  },
  "attempts": 1
}
~~~

~~~json
{
  "company_id": "055e544b-16bd-4527-971e-a59646a26144",
  "call_id": "714a7626-1238-400c-ac47-01bf8be77d4b",
  "item_id": "5d79859b-4e19-492a-babf-1655ea0b5f5a",
  "stage": "DRAFT",
  "code": "CODEX_FAILED",
  "attempts": 1,
  "validation": null,
  "reason": "Szczegółowa przyczyna poza zapisanym kodem nieustalona.",
  "impact": "Brak zatwierdzonej ekstrakcji/wiadomości tego etapu; pozostałe firmy kontynuowano."
}
~~~

### Nieudane odczyty publiczne

| source_id | Firma | Status | Oczyszczony kod | Próby |
| --- | --- | --- | --- | --- |
| e6ae7068-9f25-4541-b0a2-31d2880be910 | 338688f6-a810-4125-8ae9-31de964618e6 | NOT_FOUND | {"category":"HTTP","code":"HTTP_404","stage":"HTTP","retryable":false} | 1 |
| 07e846a0-1689-4cf7-9a9e-d1d16327cf4d | 338688f6-a810-4125-8ae9-31de964618e6 | NOT_FOUND | {"category":"HTTP","code":"HTTP_404","stage":"HTTP","retryable":false} | 1 |
| 5fd3ad2a-535c-491b-8f67-b4096e759142 | 3b698ff1-e27b-4415-8873-b46925214906 | ACCESS_BLOCKED | przyczyna nieustalona | 1 |
| 798a9e6e-7f10-43a8-a7f6-27f563da5b44 | 4d321cd4-375e-4660-8266-8955574b24b5 | ACCESS_BLOCKED | {"category":"HTTP","code":"HTTP_401","stage":"HTTP","retryable":false} | 1 |

## Wyniki merytoryczne

- 4027fd05-21a5-4947-adb8-851795e4a1a3 (payarto.com): Niepotwierdzone lub wykluczone przeznaczenie adresu.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- 338688f6-a810-4125-8ae9-31de964618e6 (careers.merixstudio.com): Adres rekrutacyjny służy pytaniom; obecny proces aplikacji z CV nie jest dopuszczony.; Ogłoszenie archiwalne lub zakończone.; active: no — Zaproszenie dotyczy przyszłego dopasowania, a nie konkretnego aktualnego wakatu..
- 7e42e749-94be-4b8e-bfeb-0bc205af6795 (econnect4u.pl): Niepotwierdzone lub wykluczone przeznaczenie adresu.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- 26d80830-5cdc-445a-9f3f-57266c897688 (transparentdata.pl): Niepotwierdzone lub wykluczone przeznaczenie adresu.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- 4d321cd4-375e-4660-8266-8955574b24b5 (ecom.software): Niepotwierdzone lub wykluczone przeznaczenie adresu.; remote: no — Firmowy model hybrydowy z warunkową zdalnością nie odpowiada pracy w pełni zdalnej od początku.; remote: no — Firmowy model hybrydowy z warunkową zdalnością nie odpowiada pracy w pełni zdalnej od początku..

Niepoprawne/niepewne szkice nie zostały zatwierdzone. Brak szkicu nie jest odrzuceniem treści. Dawne CODEX_FAILED nie były ponownie diagnozowane.
