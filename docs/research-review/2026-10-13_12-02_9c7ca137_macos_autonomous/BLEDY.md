# Błędy wykonania i wyniki merytoryczne

## Wykonanie publiczne

0 błędów modeli, 0 nieudanych odczytów i 0 błędów walidacji ekstrakcji. Publiczny worker ukończył cztery cykle i cztery kontrole bez interwencji. Nie ma ślepego retry. Błędy/asercje fixture oraz pierwszy przerwany check są w [TEST_REPORT](../../TEST_REPORT.md), nie są błędami publicznego dostawcy.

## Nieaktualny materiał i metryka

GOTOMA została przeanalizowana dwukrotnie. Pierwszy szkic przeszedł kontrolę treści. Druga analiza OPEN zachowała brak bieżących ogłoszeń, ale nie dostarczyła inquiryBasis dla adresu GENERAL. Nie wolno zapełnić tego pola ręcznie. Oryginalny szkic pozostał w historii z supported=true; materialBinding zmienił się, więc DRAFT_MATERIAL_STALE blokuje aktualne użycie. Eksport nie liczy go jako aktualnie sprawdzonego. To brak aktualnego materiału, nie odmowa firmy i nie błąd wysyłki.

Planer początkowo liczył taki szkic na podstawie code PASS/review true. Po Stop fixture odtworzył 1 zamiast 0; poprawka używa tej samej draftMaterialIssues co bramka. Replay na osobnej spójnej kopii, bez modeli/HTTP: cykl 4 checkedDrafts 2 → 1. Publiczne zdarzenia f59ccb8 nie są przepisywane; nowy kod 835a6d5 jest sprawdzony offline.

## Pominięcia, nie odmowy wszystkich firm

- 83174621-938f-4fc6-a066-39efe1329f13 (takegroup.pl): Niepotwierdzone lub wykluczone przeznaczenie adresu.; remote: yes — Oferta potwierdza pełną pracę zdalną w Polsce.; partTime: no — Wakat przewiduje pełny etat zamiast około 20 godzin tygodniowo.; hours: no — Stałe godziny 9:00–17:00 nie odpowiadają dostępności głównie po lekcjach..
- bb66efc4-1dda-496a-88b7-9a8c85572d1b (softech.app): Niepotwierdzone lub wykluczone przeznaczenie adresu.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- a1967e85-07bb-4e60-beb8-f23f32c486be (solutionspace.pl): Niepotwierdzone lub wykluczone przeznaczenie adresu.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- 8cf2f751-4fa6-4b4f-8b5f-05a3deac4a88 (reactpoland.com): Brak osobnego dowodu działalności programistycznej do zapytania.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- 74ec68dc-3f6b-42c6-8a5b-6e0b74e0a165 (gotoma.pl): Brak osobnego dowodu działalności programistycznej do zapytania.; Braki informacji lub kontakt wymagają ręcznej decyzji.; active: no — Strona kariery jawnie informuje o braku bieżących ogłoszeń..
- 202d91de-849f-4bec-95c9-cd7ad776411e (justsite.pl): Niepotwierdzone lub wykluczone przeznaczenie adresu.; Firma do zapytania o współpracę. Rekrutacja i warunki niepotwierdzone..
- 79daf458-8ab4-44e7-8eeb-5c7c26eac5db (prodaut.pl): Brak osobnego dowodu działalności programistycznej do zapytania.; Firma do zapytania o współpracę. Rekrutacja i warunki niepotwierdzone..
- 3b7dffc5-01fc-4e0a-b6f5-dc8e25ef14df (tobit.pl): Niepotwierdzone lub wykluczone przeznaczenie adresu.; Firma do zapytania o współpracę. Rekrutacja i warunki niepotwierdzone..

Take Group: niedopasowanie pełnego etatu/9–17 dotyczy oferty; brak literalnego maila jest osobnym problemem. Source [email protected] nie jest odgadniętym adresem. Pozostałe nieznane lub brakujące kontakty/podstawa pozostają brakami danych, nie dowodem odmowy współpracy. React Poland udostępnia kanał formularza z CV; obecny proces nie obsługuje tej czynności. GENERAL hello@ nie jest potwierdzonym adresem do aplikacji z CV. Bez nowego systemu formularzy lub pytań bez CV. Brak wakatu sam nie wygasza OPEN.

W tej próbie 8 firm ma końcową decyzję kontaktową REJECTED (kodowa niedopuszczalność/brak danych); nie oznacza to 8 potwierdzonych odmów firmy. Wszystkie powody i zakres OFFER/COMPANY są w CSV. Pozytywne szkice nie udzielają zgody na wysyłkę.
