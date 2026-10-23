# JobHunter — pierwsze rzeczywiste odnowienie, 23.10.2026

**40 szkiców odnowionych i poprawionych dla 40 istniejących rekordów firm. Wysyłka: 0. Program STOPPED, bez aktywnego prawa wysyłki.**

## Zakres i wersja

Wykonano kontrolowaną migrację i zastosowanie zatwierdzonych materiałów na istniejącym WORKSTATION, następnie rzeczywiste publiczne odczyty i modelowy review. Nie uruchomiono Gmaila, OAuth, SELF_TEST, wykonawcy przeglądarkowego, pełnego nightflow, partii wysyłki ani odkrywania nowych firm.

Załadowany kod: `5adc8c31bee86bd60f86dd01a0a8bbe74121104b`. Build `809f8e42-3547-41b0-a253-e3f036f7ad2e`, sourceTreeHash `6c6b9c507b9bd04dee024b202799916e7680d270352b638019f3f66f34d3f0df`, loadedCodeHash `a31200ae8344e824c1679cd9027e5ce132ed83234dc246e3808637893211bbff`. Kod wykonywano z osobnego checkoutu gałęzi codex/windows-nightflow-fixes; starszy checkout pozostawiono bez zmian. Lokalny rekord instalacji wskazuje ten build.

Przed pracami nie istniał żywy proces starego właściciela; PID potwierdzono jako zakończony, port nie odpowiadał. Nie przypisano mu fikcyjnego ACK Stop ani historycznej wersji załadowanej do pamięci. Stary PAUSED zamknięto operacją programu, zachowując checkpoint, powód i odłożenia; nie wznowiono ośmiu godzin.

## Zachowanie danych i materiały

Spójny VACUUM INTO obejmujący WAL przed migracją: integralność ok, FK=0, identyczne wiersze wszystkich 52 tabel. Odtworzenie do izolowanego katalogu: schemat 20 → 27; stare wiersze zachowane, oczekiwane odwołania starych uprawnień kopii wykazane oddzielnie. Migracja właściwej historii zachowała wszystkie dawne wiersze i relacje.

Końcowo: integralność ok, FK=0, brak usuniętych rekordów. Wszystkie 285 starych wersji, aliasy, blokady, historia, zamrożone MIME, próby, shared records, dawne CV i granica kampanii zachowane. Nadawca, tempo i limity niezmienione. Dziesięć dawnych odłożeń bez zmian. Końcowy spójny backup: wszystkie 62 tabele zgodne z bieżącą bazą.

Po jednej konkretnej zgodzie zastosowano materials-2026-10-21-v1 i dokładny PDF PL, wyłącznie publicznymi operacjami profilu/CV z rzeczywistymi ID. Profil v11, 15 aktywnych zatwierdzonych faktów; FixDesk nadal DEFERRED. Stare fakty pozostają w kopii i historycznych kontekstach. Stare CV EN zachowane jako oddzielny asset, nowy PDF PL zweryfikowany bajtowo. Dane kontaktowe CV nie zmieniły nadawcy/OAuth.

| Rekordy | Przed | Po |
|---|---:|---:|
| Firmy | 515 | 515 |
| Kontakty | 413 | 414 |
| Bieżące szkice | 240 | 240 |
| Wersje szkiców | 285 | 327 |
| CV | 1 | 2 |

## Rzeczywisty wynik

- Zamrożony zakres A: 239 szkiców / 239 firm; rozpoczęto 71 pozycji, zapisano 70 wyników, jedna przerwana deadline. Nietkniętych w tym zakresie: 168.
- Odnowione materiały: 40 szkiców / 40 unikalnych company_id, wszystkie z końcowym code PASS i pozytywnym review bez uwag. Wszystkie 40 wymagały zmiany tekstu; 0 zachowanych całkowicie bez zmiany. Zachowano dobre fragmenty, poprzednie wersje i ID.
- Odłożone/błędne: 30 — 23 STALE_EVIDENCE, 5 DRAFT_MATERIAL_STALE, 2 DRAFT_MATERIAL_UNVERIFIED. Dwie zmienione wersje pozostały niezweryfikowane i nie są zaliczone do 40.
- Poza zakresem A: 1 wcześniej zablokowany szkic; grupa D łącznie 3 firmy. Łącznie w bibliotece nadal 200 szkiców bez ukończonego odnowienia w tej fazie (30 odłożeń + 1 przerwany + 168 nietkniętych + 1 wcześniejsza blokada).
- Kolejne kolejki: B 167 firm z kontaktem bez szkicu; C 106 bez wystarczającego kontaktu. Liczby policzone z relacji, po oddzieleniu D. Nie tworzono dla nich szkiców.

Faza: 23.10.2026, 12:09:30 → 23.10.2026, 13:08:25, Europe/Warsaw, 58 min 55.021 s czasu ściennego. Pierwotny niezmienny cap 13:09:30.133; zakończenie badań 13:08:25.154, ostatni cleanup 13:08:27.096. Łączne aktywne przebiegi 50 min 47.121 s, cleanup czterech przebiegów 7.567 s. Pozostały czas fazy to bezpieczne przerwy operatora. Nie podpisano tego jako pełnych 60 minut pracy modelu.

Trzy pojedyncze odrzucenia kodowe (UNSUPPORTED_TECHNOLOGY, INVALID_CLAIM, INVALID_MODEL_RESULT) pozostawiły cykle PAUSED/ITEMS_NEED_REVIEW i wtórne BUSY. Po potwierdzonym zakończeniu każdego procesu wykonano backup i publiczne finishPartial; błędy, niezweryfikowane materiały i checkpointy zachowano. Kontynuowano wyłącznie nietknięte ID w reszcie pierwotnego czasu, bez powtarzania wyników. Cztery przebiegi miały nieprzedłużane deadline; ostatni zakończył DEADLINE. Żaden Start lub nowy budżet nie został przyznany.

Pomiary: 272 nowe weryfikacje źródeł (223 READ/COMPLETE, 49 INCOMPLETE/CONTEXT_LIMIT, HTTP 200), 130 zapisanych wywołań modelu (129 OK, 1 anulowane deadline). Pełny licznik HTTP/redirect/cache nie obejmuje wszystkich odczytów refresh, dlatego nie podano fikcyjnej sumy. SEARCH=0; nowych firm=0.

## Kontrole i ograniczenia

Zero nowych pakietów pocztowych, zgód wysyłkowych, rezerwacji, prób i akcji przeglądarki. Outbox/próby/usage pozostają po 8, dawne dostawy przeglądarkowe 2 — wiersze i MIME identyczne. Aktywne zgody na szkice=0, aktywne cykle=0, aktywne sesje AUTO=0. Własne procesy i locki zwolnione. Dawnego martwego locka backendu nie usuwano ręcznie.

Najważniejsze pozostające kwestie:

1. Limit kontekstu parsera zablokował część stron mimo HTTP 200; nie podnoszono limitu ani nie udawano pełnego odczytu.
2. Trzy odrzucenia treści/modelowego wyniku wymagają późniejszej celowanej naprawy, bez akceptowania błędnych deklaracji. CLI kończy się BUSY po takim niezamkniętym cyklu — potrzebne jest jawne rozstrzygnięcie cyklu, nie retry w ciemno.
3. Pięć pozycji pozostało ze starym bindingiem materiałów. Część metadanych kwalifikacji nadal zawiera dawną etykietę godzin po lekcjach; nie jest ona zatwierdzonym faktem aktualnego profilu i nie występuje w odnowionych tekstach.
4. Jedna pozycja jest niedokończona po deadline; 168 nie rozpoczęto. Nie oznaczono całej biblioteki jako odnowionej.
5. Nie wykonano bieżącej kontroli historii Gmaila ani rzeczywistej tożsamości nadawcy. Warunki pracy pozostają pytaniem, gdy źródło ich nie potwierdza.

## Testy i kolejny krok

Nowe celowane testy wejścia: 7/7 PASS. Pełny rzeczywisty Windows npm run check: 794 backend / 12 Stop / 26 UI, typecheck/build PASS, exit 0; dane syntetyczne i fikcyjni providerzy. Fingerprint 02267446f301a7c7e19ef5b9763932655e14996bae9d2aa8a6e69e42b89f91e3, bez zmian; 233 pliki kodu/testów zgodne bajtowo z Git. Pierwszy nieukończony check przed dodaniem kontekstu minimalnej poprawki nie jest PASS. Nie powtarzano 8 h.

Windows CI dokładnego kodu: [completed / success](https://github.com/JakubLewosz/JobHunter/actions/runs/39935218837), SHA 5adc8c31bee86bd60f86dd01a0a8bbe74121104b. Push nie był uznany za deployment; załadowany build sprawdzono oddzielnie.

Prywatnie wybrano 3 kandydatów do późniejszego pilota z kompletnym bindingiem, literalnym oficjalnym kontaktem RECRUITMENT i pozytywnym review. To propozycja, bez partii, rezerwacji, approve/start lub odczytu Gmaila. Jedna przyszła decyzja obejmuje konkretnych odbiorców i wersje wiadomości, dotychczasowe konto po potwierdzeniu, dokładny PDF, celowaną kontrolę historii, tempo/limit/okno. Obecny limit pilota nie jest limitem regularnego AUTO_POLICY.

**Status materiałów: sprawdzone 23.10.2026; oczekują na kontrolę historii poczty/nadawcy i osobną autoryzację pilota.**
