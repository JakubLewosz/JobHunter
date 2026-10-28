# Domknięcie V1 — 28.10.2026

Końcowy stan: [V1_FINAL_RESULT](V1_FINAL_RESULT.md).
Kod 1f41b55 przeszedł własny pełny Windows check/CI/CUA i kontrolowane
wdrożenie. Rzeczywisty R1 nie przeszedł z powodu trzech timeoutów CLI;
R2/R3 NOT_RUN, zero nowych rzeczywistych prób, WORKSTATION STOPPED.
**NOT_PRODUCTION_VERIFIED**. Dalsza treść zachowuje historię diagnozy;
dawne przyszłe kroki nie są bieżącym poleceniem uruchomienia.

Następna kontrola zwykłego uruchomienia: c6791f6 przeszedł pełny Windows check
(1020 backend / 12 Stop / 26 UI, typecheck/build) i CI dokładnego SHA.
Nie wdrożono go: plan bez zamkniętej listy nadal oceniał całą bibliotekę
synchronicznie. Regresja odtworzyła opóźnienie Stop: oceniono pięć fikcyjnych
pozycji, zamiast zatrzymać się po pierwszej. Dotyczy to tego samego mechanizmu
przygotowania, nie nowej funkcji lub dodatkowego limitu kampanii.

Koordynator ocenia teraz kandydatów kolejno, oddając pętlę zdarzeń między
pozycjami. Rzeczywisty host może dostarczyć poll lub Stop; backend nie wytwarza
heartbeatów. Sygnał anulowania jest sprawdzany po każdym oddaniu sterowania,
a koordynator ponownie sprawdza zatwierdzony plan przed użyciem wyniku.
Zamknięta lista jest filtrowana przed walidacją, wszystkie kontrole wybranych
pozycji i bramki dispatch pozostają. Lease i timeouty bez zmian.

Pierwszy niezatwierdzony szkic implementacji pominął lokalne przechwycenie
sygnału anulowania. Testy zawiodły bez nadania, a oczekującą fikcyjną grupę
procesów zakończono po potwierdzeniu jej tożsamości. Log błędu zachowano;
żaden rzeczywisty profil nie był otwierany. Po korekcie: typecheck oraz
44/44 plan/kolejka/zakres/Stop PASS. Pełne bramki, zamrożenie, CUA i rzeczywisty
R1 nowego kodu są nadal wymagane; nie dziedziczy on zaliczenia c6791f6.

Kolejne bramki a2cae88: dwa pełne lokalne checki zakończyły się jedną porażką
tego samego limitu parsera HTML (1518 i 1809 ms przy niezmienionej granicy
1000 ms). Pozostałe 1019 testów backendu przeszło w obu próbach. Izolowany
ten sam przypadek: 489 ms PASS. Pierwsze CI miało dwa znane błędy czasu CLI
(timeout 30 s oraz wymuszone zakończenie podczas anulowania); logi i artefakt
zachowano. Jedno ponowienie CI tego samego SHA uruchomiono, bez nowych
uprawnień. Wyników nie uznano za zieloną bramkę i a2cae88 nie wdrożono.

Zamiast trzeciego niezmienionego lokalnego powtórzenia zdiagnozowano koszt
parsera: dzieci wspólnego kontenera były skanowane dla każdego adresu, a
pozycja poprzedniej niepustej linii wyszukiwana liniowo dla każdej linii.
Niezmienny DOM pozwala zapisać nagłówki raz dla rodzica; pozycję linii znamy
już podczas tworzenia listy. Nie zmienia to etykiet, tekstu, kompletności,
ograniczeń parsera ani wersji kontraktu. Benchmark 2000 adresów przed i po
pierwszym cache miał identyczny SHA-256 całego wyniku; 27/27 testów HTML PASS,
przypadek 2000 adresów 143 ms. Granica 1000 ms i wszystkie asercje pozostają.
Po końcowej poprawce pozycji linii: cały wynik nadal identyczny, zimny pomiar
145 ms wobec 485 ms przed zmianą; 27/27 HTML PASS, przypadek graniczny 133 ms.
Oba problematyczne przypadki CLI w izolacji: PASS (4667 i 2085 ms), bez zmiany
timeoutu lub grace. Pełne bramki nowego kodu wymagają osobnego potwierdzenia.
Pierwotny deadline i zatrzymana historia są zachowane.

Uzupełnienie po rzeczywistym odbiorze d222655: pełny Windows check po jednym
powtórzeniu PASS (1019 backend, 12 Stop, 26 UI); CI dokładnego SHA PASS.
Pierwszy check miał trzy porażki czasowe, zachowane razem z izolowanymi
wynikami tych samych testów i granic. Rzeczywisty CUA na fikcyjnej stronie
przeszedł A poprawne / B odłożone / C poprawne oraz restart bez nowych akcji.
Kontrolowany R1 tego wydania trwał 3617 s, zakończył się DEADLINE i końcowym
guardem; 12/12 pozycji biblioteki CHECKED, chronione dane i poczta zachowane.

Pierwszy R2 d222655 zatrzymał się BROWSER_HOST_LOST, zanim powstała jakakolwiek
nowa próba lub partia. Nie powtórzono niepotwierdzonego Startu. Native Stop,
backup i cleanup zakończone. Diagnoza przy zatrzymanym profilu wykazała
73,2 s synchronicznej oceny wszystkich 276 szkiców, mimo zamkniętej trójki;
sam snapshot chroniony trwał 358 ms. Odtworzenie syntetyczne przed poprawką
potwierdziło ocenę niepowiązanego szkicu i zatrzymanie przebiegu.

Ocena kandydatów przyjmuje teraz opcjonalną zatwierdzoną listę ID i filtruje
wiersze przed kosztowną walidacją. Koordynator przekazuje ją przy kolejce
odnowienia i selekcji. Wszystkie dotychczasowe kontrole wybranych pozycji
pozostają; nie wydłużono lease lub timeoutów. Brak listy zachowuje dotychczasowy
kontrakt. Regresja wymaga pełnego natywnego przebiegu i dwóch fikcyjnych nadań,
a ocenę materiału spoza planu traktuje jako błąd.

Poprawka wymaga własnych pełnych bramek, nowego zamrożonego buildu,
kontrolowanego wdrożenia i nowego godzinnego R1 przed R2/R3. Wcześniejszy
zaliczony R1 d222655 pozostaje dowodem tylko tamtej wersji. Pierwotny
absolutny termin zadania nie jest odnawiany. R2/R3 nadal niezaliczone;
nie deklarować V1_PRODUCTION_VERIFIED.

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
