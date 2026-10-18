# Znane problemy i granice dowodów — 18 października 2026

Aktualizacja implementacji: [CORE_IMPLEMENTATION](CORE_IMPLEMENTATION.md).
Poprawki kodu są lokalne; poniższa historia nie jest deklaracją wdrożenia.
Prywatnej kopii nie audytowano, a rzeczywista ciągłość browser nie została
zweryfikowana. Pozostaje osobny przegląd istniejącego checkpointu i pilota.

Aktualne zadania: [TASKS](TASKS.md). Kontekst: [REVIEW_HANDOFF](REVIEW_HANDOFF.md).
Poniżej rozdzielono lokalne poprawki od nadal otwartych operacji i granic dowodów.

## 1. Historyczny fałszywy stop — poprawka w nowym guardzie repo, bez wdrożenia

Historyczna warstwa: doraźny kontroler poza repo, nie sam startDay. W bazowym
`f37afc` natywny `service.ts/findOrCreateCompany` dopuszczał dopisanie domeny, gdy była null,
po rozpoznaniu znanej firmy i dodaniu aliasu. Prywatny guard porównywał
wszystkie stare pola (ID/nazwa/normalized_key/domena/historia/blokada) dokładnie:

```js
// Minimalne odtworzenie warunku, fikcyjne dane. Nie jest nowym guardem.
const before = { id: 'fixture', canonical_name: 'Fixture', primary_domain: null };
const after = { ...before, primary_domain: 'fixture.example.test' };
const oldGuardStops = JSON.stringify(after) !== JSON.stringify(before); // true
```

W sesji 16/17 października potwierdzona domena uzupełniła pustą wartość;
ID/nazwa/historia/blokady bez zmian, mimo tego GUARD_STOP i koniec po 3 h 32 min.
Nie naprawiono tego przez poluzowanie reguł lub zmianę eksportera raportu.

Nowy kontroler i czyste porównanie snapshotów rozpoznają dokładnie
udokumentowane uzupełnienie: wcześniej null, zgodne źródło i alias tej firmy,
niezmienione pozostałe pola i brak kolizji właściciela. Zamiana niepustej domeny,
utrata blokady/aliasu/historii, niepewna tożsamość i brak dowodu nadal zatrzymują.
Nie usuwać primary_domain z kontroli bez warunków. Stary checkpoint wymaga
osobnej jawnej operacji i backupu, nie automatycznego wznowienia.

## 2. Otoczka długich prób — nowy wspólny punkt wejścia w repo

Repo ma natywny mechanizm sesji i jego testy, ale launchery, fingerprinty,
zewnętrzny guard i część audytów ostatnich prób były prywatnymi helperami.
Historycznej próby nie odtworzy się z samego klonu. Nowy `research:session`
i panel korzystają ze wspólnego lifecycle/guarda; parametry i dane pozostają poza repo.
Nie kopiować bez przeglądu helperów z absolutnymi ścieżkami i materiałami.
Nowy standardowy kontroler jest częścią implementacji z 18.10, testowanej na fixture.

## 3. Domena i subdomena — zgłoszenie, tożsamość nierozstrzygnięta

Jedna pozycja otrzymała COMPANY_IDENTITY_CONFLICT wobec wcześniejszej
subdomeny tej samej domeny nadrzędnej. To konserwatywny komunikat kodu,
nie dowód, że są dwie firmy. Sam wspólny root/mailbox też nie dowodzi tożsamości.
Potrzebne oficjalne źródła/operator/aliasy i zachowanie szkiców/blokad;
bez automatycznego merge/delete albo skracania domen dla obejścia zabezpieczeń.
Nazwy i adresy są w prywatnym raporcie, nie w tym repozytorium.

## 4. Aktualność źródeł i czas raportu — zachowanie + poprawiony opis

W chwili stopu ostatniej sesji 2 stare szkice były STALE; w porannym audycie
5, bo trzy przekroczyły 24 h po sesji. Nie zgłaszać tych trzech jako nowych
awarii generowania. Zapisane review PASS nie jest bezterminową kwalifikacją.
Eksporter zachowuje generatedAt; kontrola gotowości musi podać czas oceny.
STOPPED/PAUSED może być sprzątaniem. Opcja --controller-result pozwala jawnie
dołączyć przyczynę tylko zgodnej zakończonej sesji. Nie wnioskuje „brak internetu”.

## 5. Część czasu idzie na znane firmy — do dalszego pomiaru

Ostatnia sesja odwiedziła 96 rekordów, dodała 43, utworzyła 19 szkiców,
odświeżyła 12 starych, użyła 13 w tej samej wersji. Nie wszystko jest nową firmą.
Nowe przeplatanie DISCOVERY/REFRESH/REUSE i pomiary etapów, HTTP/cache/modeli
sprawdzono syntetycznie. Wyniki modeli nadal mogą powracać do znanych podmiotów.
Mierzyć rzeczywisty rozkład czasu, nie zwiększać limitów
kosztem źródeł lub zabezpieczeń. Brak dowodu liniowej wydajności 8/15 h.

## 6. Stop i transporty — ograniczenia oraz niestabilny benchmark

Historycznie performance 11/12 przekroczył próg Stop; odtworzono na starszym
kodzie. Następny pełny check 12/12 przeszedł bez ustalenia przyczyny. Nie
podnosić progów i nie uznawać flakiness za rozwiązany problem na podstawie PASS.
Zdalny POST/kliknięcie po ostatniej bramce nie jest atomowe ze Stop. SEND_UNKNOWN
i brak retry/failover pozostają konieczne. Historia Gmaila też nie ma atomowego
snapshotu z ręczną aktywnością użytkownika. Pełne gwarancje exactly-once nie istnieją.

## 7. Browser executor — ograniczony zakres

Wymaga aktywnego Codexa i zalogowanego UI. Wciąż korzysta z API do celowanego
potwierdzenia; nie zastępuje całej integracji Google. Testowano dwa realne
SELF_TEST i fixture awarii, nie długą kampanię do firm. UI może się zmienić.
Historycznie pętla poll po zamknięciu backendu zwróciła ENOENT po przyjętej
wiadomości. Nowy klient i wykonawca kończą ją kontrolowanym statusem,
zachowując wynik, licznik ukończonych i niepewność. Macierz IPC oraz kontroler
partii z lease są sprawdzone syntetycznie; rzeczywista ciągłość hosta przez
całą partię pozostaje nieweryfikowana. Zamknięcie Codexa kończy wykonawcę.

## 8. Spam — hipotezy, bez ustalonej przyczyny

SPF/DKIM/DMARC/ARC lub poprawny MIME/PDF nie gwarantują Odebranych. Różni
odbiorcy i kolejność nie izolują transportu/wieku/reputacji. Browser 2/2
Odebrane jest małą pozytywną próbą, nie dowodem winy API ani trwałej naprawy.
Nie zmieniać stylu/faktów/nadawcy/OAuth lub tempa na podstawie przypuszczeń.

## 9. Niewykonane funkcje i testy

Zamknięta partia biblioteki jest lokalnie zaimplementowana i testowana na
fikcyjnych providerach. Niewykonane pozostają: jej wdrożenie i rzeczywista
ciągłość browser, audyt prywatnej kopii, adaptery ofert/formularzy,
kwalifikacja zleceń, realny pilot do firm, długa produkcyjna wysyłka,
pełna izolacja procesu OS, nowy realny macOS transportu browser oraz pełna
macierz awarii PRIVATE_GIT. Nie są potwierdzone przez samą symulację lub build.
