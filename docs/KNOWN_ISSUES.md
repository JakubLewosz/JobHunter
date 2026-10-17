# Znane problemy i granice dowodów — 17 października 2026

Aktualne zadania: [TASKS](TASKS.md). Kontekst: [REVIEW_HANDOFF](REVIEW_HANDOFF.md).
Poniższe punkty są otwarte, dopóki nie ma odpowiedniej poprawki i dowodu.

## 1. Fałszywe zatrzymanie prywatnego guarda długiej sesji — potwierdzone

Warstwa: doraźny kontroler poza repo, nie sam startDay. Natywny
`service.ts/findOrCreateCompany` dopuszcza dopisanie domeny, gdy była null,
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

Przed nowym startem potrzebna testowana kontrola, która rozpoznaje dokładnie
udokumentowane uzupełnienie: wcześniej null, zgodne źródło i alias tej firmy,
niezmienione pozostałe pola i brak kolizji właściciela. Zamiana niepustej domeny,
utrata blokady/aliasu/historii, niepewna tożsamość i brak dowodu nadal zatrzymują.
Nie usuwać primary_domain z kontroli bez warunków. Stary checkpoint wymaga
osobnej jawnej operacji i backupu, nie automatycznego wznowienia.

## 2. Otoczka długich prób poza repo — potwierdzona luka odtwarzalności

Repo ma natywny mechanizm sesji i jego testy, ale launchery, fingerprinty,
zewnętrzny guard i część audytów ostatnich prób były prywatnymi helperami.
Inne AI nie odtworzy całej próby z samego klonu. Przenieść współdzieloną,
testowaną logikę do repo, zachowując prywatne parametry/dane poza nim.
Nie kopiować bez przeglądu helperów z absolutnymi ścieżkami i materiałami.
Nowy standardowy kontroler nie jest częścią obecnego porządkowania.

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
Novelty context i deduplikacja istnieją, lecz wyniki modeli nadal mogą powracać
do znanych podmiotów. Mierzyć rozkład czasu/HTTP/modeli, nie zwiększać limitów
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
W jednej skończonej próbie pętla poll po zamknięciu backendu zwróciła ENOENT
po już przyjętej wiadomości. To nie powód do retry send; ograniczyć/wyjaśnić
zachowanie zamknięcia wykonawcy osobnym testem cyklu życia.

## 8. Spam — hipotezy, bez ustalonej przyczyny

SPF/DKIM/DMARC/ARC lub poprawny MIME/PDF nie gwarantują Odebranych. Różni
odbiorcy i kolejność nie izolują transportu/wieku/reputacji. Browser 2/2
Odebrane jest małą pozytywną próbą, nie dowodem winy API ani trwałej naprawy.
Nie zmieniać stylu/faktów/nadawcy/OAuth lub tempa na podstawie przypuszczeń.

## 9. Niewykonane funkcje i testy

Osobne wysyłanie skończonej partii biblioteki, adaptery ofert/formularzy,
kwalifikacja zleceń, realny pilot do firm, długa produkcyjna wysyłka,
pełna izolacja procesu OS, nowy realny macOS transportu browser oraz pełna
macierz awarii PRIVATE_GIT. Nie są potwierdzone przez samą symulację lub build.
