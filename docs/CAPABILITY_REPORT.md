# Możliwości i ograniczenia — stan 17 października 2026

Aktualny kontekst: [REVIEW_HANDOFF](REVIEW_HANDOFF.md), wyniki:
[TEST_REPORT](TEST_REPORT.md), problemy: [KNOWN_ISSUES](KNOWN_ISSUES.md).
[Dawny dziennik możliwości](archive/2026-10-17/CAPABILITY_REPORT.md)
zachowuje historię; dawne liczniki i blokada AUTO nie są stanem produktu.

| Obszar            | Zaimplementowane                                                             | Granica weryfikacji                                                                   |
| ----------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| RESEARCH_ONLY     | Szukanie/odczyt, ekstrakcja, literalne dowody, kwalifikacja, szkice i wersje | Rzeczywisty Windows; ostatnia sesja przerwana po 3 h 32 min, nie pełne 8 h            |
| Sesje             | 1–24 h, deadline, plan, odłożenia, 15 min dla długich sesji                  | Symulacja zegara nie jest wielogodzinną próbą; zewnętrzny guard wymaga poprawki       |
| AUTO_POLICY       | Polityka, Start, ciągła praca, limity/tempo, historia i Stop                 | Testy offline/UI; nie uruchomiono rzeczywistego pilota do firm                        |
| APPROVAL_REQUIRED | Opcjonalne paczki, dokładny podgląd i zgoda                                  | SELF_TEST nie udziela zgody na firmy                                                  |
| Gmail API         | OAuth, pojedynczy POST, outbox, celowana historia/reconcile                  | Mieszane foldery SELF_TEST; przyczyna Spamu nieustalona                               |
| Gmail browser     | Named pipe, wykonawca aktywnej sesji Codexa, jedna próba/receipt             | 2 realne SELF_TEST w Odebranych; nadal API do celowanego potwierdzenia, brak demona   |
| LOCAL_ONLY        | Jedna baza i blokada profilu, brak wymogu prywatnego origin                  | Jeden jawnie skonfigurowany Windows; bez obietnicy własności offline między maszynami |
| DEVELOPMENT       | Osobna syntetyczna baza, brak natywnego Gmaila                               | Bezpieczny punkt wejścia nowego klonu                                                 |
| PRIVATE_GIT       | Opcjonalny moduł kompatybilności                                             | Pełna macierz awarii odłożona; nie jest domyślną strategią                            |
| Oferty i usługi   | Kierunek opisany w wizji                                                     | Adapterów portali/formularzy i kwalifikacji zleceń jeszcze nie wdrożono               |

GENERAL zachowuje przeznaczenie i wymaga polityki/dowodu; kod nie zgaduje
emaili. PASS treści nie jest trwałą gotowością ani potwierdzeniem zatrudnienia.
Odpowiedzi obsługuje użytkownik. Brak CRM, AI odpowiedzi lub follow-upów.
