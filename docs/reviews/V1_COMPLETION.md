# Domknięcie V1 — 28.10.2026

Odtworzono lukę zamkniętego planu: po zatwierdzeniu `draftIds` odnowienie
mogło zmienić kontakt tego samego szkicu. Test na fikcyjnej firmie potwierdził
nadanie do innego adresu. Pierwszy FAIL zachowano poza repo; nie był to Gmail.

`savePlan` zapisuje teraz wraz z listą ID dokładną firmę, adres, rodzaj kontaktu
i cel. Jawnie podana mapa musi zgadzać się z materiałami. Odnowienie i selekcja
pomijają zmieniony zakres, a derywacja partii oraz guard dispatch ponownie go
sprawdzają. Dane pochodzą z zatwierdzanego planu, nie z późniejszej ekstrakcji.
Starsze plany z samymi `draftIds` pozostają w historii i wymagają nowej wersji
zgody; restart nie uzupełnia ich po cichu. Brak zamkniętej listy zachowuje
dotychczasowy tryb regułowy, bez nowego domyślnego limitu AUTO.

Opcjonalne `expiresAt` jest absolutnym terminem wcześniejszej zgody. Ogranicza
utrwalone `end_at`, preflight, kolejne Starty i guard przed nadaniem. Nie jest
odnawiane po restarcie lub Resume. Pominięcie pola zachowuje dawny kontrakt
pozostałych planów. Nie dodano migracji ani nie zmieniono transportu poczty.

Windows/Node 24.19.0: 42/42 testy planu, kolejki i zamkniętego zakresu PASS.
Obejmują reprodukcję zmiany adresu podczas odnowienia, derywację, podmianę
odbiorcy przy dispatch, Stop/restart, starszą zgodę oraz wygaśnięcie podczas
await i przed następnym Startem. Pełny check, CI oraz rzeczywisty host tego
nowego wydania są osobnymi bramkami; bieżące wyniki pozostają w prywatnym
checkpointcie zadania. Nie przypisywać poprzednich testów CUA nowemu kodowi.

Prywatny audyt literalnych cytatów miał inny błąd: używał
`verifyQuote(quote, text)`, podczas gdy kontrakt przyjmuje dowód z `sourceId`
i tablicę źródeł. Odtworzono fałszywy wynik, sprawdzono mapę źródeł i 31
rzeczywistych cytatów. Wszystkie były zgodne. Nie zmieniono walidatora ani
nie kopiowano starego PASS na nowe materiały. Celowaną korektę pojedynczej
wiadomości zapisano i sprawdzono natywnie; prywatne treści pozostają poza Git.

Po spójnym backupie SQLite z WAL i odtworzeniu wszystkich 62 tabel zapisano
autoryzowane trwałe wyłączenie użytkownika przez istniejące `suppress`.
Zachowano wcześniejsze blokady, profil, CV oraz historię. Krótki R1 na
poprzednim wydaniu zatrzymano po reprodukcji luki i NIE zaliczono. Pierwotny
absolutny termin zgody zadania pozostał niezmieniony. Przed nowym R1 wymagane
są pełne bramki nowego kodu i kontrolowane wdrożenie; R2/R3 nie wykonano.

Dokładne SHA, build, czasy, wyniki, ograniczona zgoda oraz nieodnawiany termin
znajdują się poza repo w prywatnym katalogu zadania
`Downloads/JobHunter-V1-COMPLETION-20261028`. Po przerwaniu odczytać tam jeden
`CHECKPOINT_PRIVATE.json`, sprawdzić wskazanego właściciela i istniejące
operacje. Sam odczyt nie jest wznowieniem lub nową zgodą.
