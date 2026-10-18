# Wyniki i zakres weryfikacji — 18 października 2026

## Lokalna implementacja po diagnostyce — bieżąca weryfikacja

Osobny worktree `codex/core-completion`, baza
`f37afc077c0d7c80f231ef0e9ad2f4dcac17363c`, niezacommitowane zmiany i nowe
pliki w chwili testów. Później osobno zlecono commit/push oraz ograniczony
eksport wskazanego backupu: [AI_REVIEW](AI_REVIEW.md). Oryginalny checkout
`codex/local-windows-pilot` pozostaje bez zmian.
[CORE_IMPLEMENTATION](CORE_IMPLEMENTATION.md) opisuje pakiety A–J i komendy.
Raport poza repo `JOBHUNTER_IMPLEMENTACJA_DO_PRZEGLADU.md` zawiera pełny patch,
manifest SHA-256 wszystkich zmienionych/nowych plików i logi. Sam HEAD nie
identyfikuje testowanego kodu. Fingerprint plików kodu/testów/migracji/konfiguracji:
`8b0bcf8f493eb6128466b555565ec94aef43d1db4e0be6e8b065333eabad311d`.

Windows x64 10.0.26300, Node 24.19.0, npm 11.17.0, SQLite 3.53.4,
Codex CLI 0.163.0-alpha.10.2. Zależności zgodne z lockfile, osobny offline
cache, bez install scripts i bez zmiany wersji zależności. Izolowany runner
przekazuje allowlistę środowiska, własne HOME/APPDATA/TEMP/data oraz
DEVELOPMENT/DEMO; każdy E2E ma nowy syntetyczny katalog. Testowy Chromium,
pełne fikcyjne providery, bez modelu, publicznego researchu, Gmaila/OAuth/send.
`NODE_USE_SYSTEM_CA=1`, bez wyłączenia TLS.

Końcowy pełny `npm run check` (`check-1792341350035`): **PASS, exit 0**,
650/650 backend, 12/12 izolowany performance, 20/20 UI, typecheck/build PASS.
18.10.2026 16:35:50.078–16:49:16.214 UTC (18:35–18:49 Europe/Warsaw),
13 min 26,136 s. Backend 708,152 s, performance 18,907 s, UI 58,2 s.
Kod przez cały check pozostał zgodny z powyższym fingerprintem; dokumentację
uzupełniono osobno. To pierwszy uruchomiony izolowany benchmark tego etapu,
bez powtarzania go do PASS.

Maksima z trzech powtórzeń każdego scenariusza (ms):

| Scenariusz    | Przyjęcie HTTP od żądania | Odwołanie od przyjęcia | Odpowiedź HTTP |
| ------------- | ------------------------: | ---------------------: | -------------: |
| slow-read     |                     72,53 |                   1,19 |          92,89 |
| slow-model    |                     64,77 |                   0,24 |          85,57 |
| large-history |                    516,23 |                   0,41 |         550,67 |
| inflight-post |                    102,72 |                   0,18 |         115,30 |

Duża fixture ma 10 035 firm (10 000 dodanych w teście); zapytanie strony
zwraca 100 wierszy, nie ładuje całej historii. Maks. budowa strony 6,25 ms,
odpowiedź listy 75 673 B. Obserwowane maksima faz żądań: SQL prepare 6,429 ms,
SQLite/driver 6,203 ms, materializacja/reguły JS 12,265 ms, serializacja
0,388 ms; zapamiętana kontrola zdrowia 1,714 ms. P99/max pętli 4412,408 ms
obejmuje także synchroniczne przygotowanie dużej fixture; nie jest latencją
Stop ani dowodem braku długich blokad pętli w całym lifecycle.

Po check kontrola PID/czasów, własnych ścieżek i portów: 0 własnych procesów
testowych oraz 0 listenerów 4328–4332. Oryginalny checkout pozostał czysty
na tej samej gałęzi i pełnym HEAD. Nie czytano produkcyjnej bazy w celu
takiego porównania; prywatna instalacja nie była przedmiotem uruchomień.

Pierwszy zintegrowany check (`check-1792337968451`): typecheck PASS,
**637 backend: 625 PASS / 12 FAIL**; nie doszedł do izolowanego performance,
builda ani UI. Poprawiono rzeczywisty kontekst etykiet HTML, fixture starego
schematu z nowym UNIQUE, liczenie samych backupów SQLite po dodaniu manifestu,
zachowanie ustalonego kodu błędu ścieżki i teardown fikcyjnego locka.
Drugi (`check-1792340803934`) przerwano podczas backendu na potrzeby nowego
odtworzenia fałszywego stopu po zmianie zakresu; nie doszedł do benchmarku.
Nie przedstawiać go jako pełnego wyniku. Zakończono tylko własne drzewo tego
uruchomienia; nie zatrzymywano prywatnego backendu.

Nowa regresja (`test-1792340907490`) wykazała nieprawidłową ochronę bieżącego
powiązania zakresu szkicu. Naprawa wymaga nowej zgodnej immutable wersji
i polityki zatwierdzonej przed baseline, bez wyłączenia ochrony starych wersji.
Po niej `test-1792341307930`: **56/56 PASS** (guard, partie, audytor, natywny
punkt wejścia i długa sesja), `typecheck-1792341324651` PASS. Testowane są
także usunięcie powiązania, regres/brak nowej wersji, zły zakres, brak zgodnego
rekordu wersji i zmiana polityki. Wcześniejsze celowane niepowodzenia i poprawki
są zachowane w logach, nie zastąpione ostatnim PASS.

Wcześniejszy Playwright `test-e2e-1792340597324`: **20/20 PASS**, także pełny
fikcyjny przepływ partii i mobilny widok. `doctor-1792341552566`: PASS,
DEVELOPMENT/DEMO, SQLite w pamięci oraz `codex --version`; nie test loginu.
Backend ma jawne `--test-concurrency=4`, izolowany Stop nadal concurrency=1,
3 powtórzenia × 4 scenariusze, te same 10 000 rekordów i progi: przyjęcie
HTTP <1000 ms oraz odwołanie prawa od przyjęcia <100 ms. Nie powtarzać
benchmarku do pierwszego PASS; pierwszy wynik tego etapu zostaje w raporcie.

Audyt prywatnej kopii: **SKIP**, nie wskazano konkretnego backupu dopuszczonego
do odczytu. Rzeczywisty research, Gmail/SELF_TEST/pilot i browser przez całą
partię: **NIEWYKONANE/NIEWERYFIKOWANE**. Macierz IPC i kontroler sprawdzone
syntetycznie nie potwierdzają życia narzędzia po zamknięciu Codexa. Bez nowego
wyniku realnego macOS, GitHub CI, wdrożenia lub migracji WORKSTATION.

## Wyniki historyczne do 17 października — odrębny zakres

Poniższe zapisy opisują wcześniejsze etapy. Ich pełny dziennik:
[archiwalny TEST_REPORT](archive/2026-10-17/TEST_REPORT.md).
Nie sumować dawnych kampanii, baz i różnych systemów jako jednej próby.

## Porządkowanie i poprawka raportów z 17 października

Zmiana kodu ograniczona do eksportera pochodzenia przyczyny zakończenia
oraz komunikatu o ustawieniach RESEARCH_ONLY. Bez migracji, generatora stylu,
zmian profilu/CV/szkiców, ustawień Gmaila, historii, kwot lub blokad.
Eksporter przyjmuje opcjonalny zakończony wynik kontrolera i sprawdza sessionId;
odrzuca inną/aktywną sesję, konflikt ID, RUNNING i niepoprawny kod przyczyny.
Bez osobnej przyczyny STOPPED/PAUSED pozostają stanem, nie diagnozą sieci.

Celowane testy Windows: **26/26 PASS** (5 nowych pochodzenia raportu oraz
21 istniejących sesji/researchu). Końcowy rzeczywisty `npm run check`:
**555/555 backend, 12/12 performance, 19/19 UI, typecheck/build PASS**, exit 0.
Wszystko na fikcyjnych providerach/odbiorcach i tymczasowych danych.
Nie jest to nowy publiczny research, realny Gmail lub wynik GitHub CI.

Dodatkowy readonly eksport istniejącej bazy: poprawna przyczyna kontrolera
przy zachowanym stanie STOPPED i 44 identyczne treści/tematy/wersje.
Wynik innej sesji odrzucony REPORT_SCOPE_MISMATCH, bez utworzenia eksportu.
Końcowy niezależny audyt: **52 tabele bez zmian**, integrity=ok/FK=0,
zgodne spójne backupy przed/po, PDF/hash zachowany; research/send zatrzymane,
8 dawnych prób/outbox/usage bez zmian. Bez czytania poczty, OAuth lub tokenu panelu.

Kontrola dokumentacji: brak zerwanych względnych linków; kontrola bieżących
plików i znanych wzorców poświadczeń bez trafień. Nie jest to pełny audyt
wszystkich historycznych blobów Git. Dziesięć starych dokumentów zachowano
w oznaczonym archiwum; publicznych pakietów diagnostycznych nie usunięto.
Wygenerowane playwright-report/test-results przeniesiono poza repo z pełną
zawartością. Kod, migracje, dependencies, build i prywatne dane zachowane.

## Ostatni ukończony pełny check przed tym etapem

Windows, kod bazowy `b64091eca995fad1027d02b6aaf4615351b7ded7`:
**550 backend / 12 performance / 19 UI, typecheck/build PASS**.
Celowane IPC/receipt 93 PASS. Rzeczywistego macOS dla tej wersji nie wykonano.
Wcześniej wystąpił wynik performance 11/12 z przekroczeniem progu Stop;
odtworzono go na wcześniejszej wersji. Późniejsze pełne PASS nie wyjaśniają
przyczyny niestabilności i nie stanowią gwarancji czasu na każdym sprzęcie.

## Rzeczywista sesja RESEARCH_ONLY — 16/17 października

Plan 8 h, rzeczywiście **23:52:43 → 03:24:51 Europe/Warsaw**, 3 h 32 min 8 s.
15 rozpoczętych cykli: 9 COMPLETED, 5 PARTIAL, 1 PAUSED. Zakończenie
PROTECTED_DATA_CHANGED: prywatny kontroler zatrzymał się po potwierdzonym
uzupełnieniu pustej domeny istniejącej firmy. Stan sprzątania: STOPPED.
Kontroler był doraźnym plikiem poza repo; nie należy przypisywać tego błędu
samej natywnej metodzie startDay ani twierdzić, że poprawka raportu go naprawia.

Windows odnotował odłączenie sieci **03:54:51**, podłączenie od **08:02:09**.
To około 30 min po stopie, nie zapisany powód wcześniejszego GUARD_STOP.
Logi nie są ciągłym pomiarem dostępności każdej usługi. Nie odtworzono restartu
lub uśpienia w badanym oknie. Nie wznawiano sesji po awarii/rozłączeniu.

Punkt odniesienia **472 firmy / 376 kontaktów / 221 szkiców**.
Nowe: **43 rekordy firm / 37 kontaktów / 19 szkiców**; cała baza **515/413/240**.
96 odwiedzonych rekordów (43 nowe, 53 wcześniejsze), 44 szkice w zakresie:
19 nowych, 12 dawnych w nowej wersji i 13 użytych bez zmiany wersji.
31 nowych wersji; wszystkie 254 dawne zachowane. Trzy odświeżenia zmieniły
tekst, dziewięć zachowało tekst. 132 wpisy kandydatów / 117 różnych URL.
To liczby rekordów, nie potwierdzonych niezależnych podmiotów.

19 nowych szkiców PASS/COMPLETED/supported=true, bez materialIssues;
wszystkie GENERAL/PROSPECT/NEEDS_REVIEW. Nabór i warunki niepotwierdzone.
44 szkice: na czas stopu **42 OK / 2 STALE**, podczas audytu o 08:08
**39 OK / 5 STALE**. Trzy przekroczyły 24 h po zakończeniu sesji.
13 przypadków błędów pozycji, 10 błędów źródeł; nie sumować jako firm.
Jeden model call CANCELLED po stopie, 10 PENDING nieukończonych.
Zgłoszenie konfliktu domena/subdomena nie dowodzi różnej tożsamości prawnej.
Brak nowych kolizji potwierdzonych aliasów lub wspólnych mailboxów;
wcześniejszy rozstrzygnięty alias pozostał zachowany.

Audyt readonly: **52 tabele, integrity=ok/FK=0**, spójne backupy,
stare ID, wersje i research_draft_materials zachowane. Jedna opisana zmiana
pustej domeny; 32 stare kontakty odświeżyły dowody/daty bez zmiany tożsamości;
63 dowody odświeżyły daty lub rozszerzyły fragmenty, zachowując stare fragmenty
i hashe. Profil v4/9 zatwierdzonych faktów/PDF/hash, historia, granica kampanii,
blokady i 8 dawnych prób/outbox/liczników/Gmail/browser/shared zgodne.
Fingerprint 234 plików zgodny z kodem wtedy uruchomionym; nie dotyczy nowych
zmian tego etapu. 44 pełne treści sprawdzono bez redakcji w prywatnym raporcie.
Zero Gmaila/send/AUTO. Proces zakończony; pozostał PAUSED checkpoint.

## Rzeczywiste SELF_TEST transportu przeglądarkowego — 16 października

Dwie osobno zatwierdzone wiadomości Gmail UI: ACKNOWLEDGED + SENT_CONFIRMED,
celowana kontrola znanych własnych ID i całego payloadu/PDF. Użytkownik:
**2/2 Odebrane, 2/2 CV otwiera się**. Nie odczytywano przychodzącej poczty
ani historii firm. Nie wysłano wiadomości do firmy. Różni odbiorcy i mała
próba nie izolują wpływu transportu i nie dowodzą przyczyny wcześniejszego Spamu.

W tej próbie naprawiono klienta IPC bez globalnego process oraz żądanie RAW
znanego ID dopiero po kontroli SENT/konta/odbiorcy/czasu. Pierwszą próbę
uzgodniono bez ponowienia, dopiero potem wysłano drugą. Nie poluzowano
porównania tekstu/HTML/linków/PDF ani domyślnego reconcile API.

## Czego nie sprawdzono

Pilot do firm, ich rzeczywista historia Gmaila, całodzienny sender/AUTO,
samodzielny wykonawca po zamknięciu Codexa, adapter portalu/formularzy,
kwalifikacja zleceń usługowych, pełna izolacja OS i nowy realny macOS.
GitHub CI dla przygotowywanego commitu nie został sprawdzony. Push kodu
nie jest deploymentem lub zgodą na Start.

Korekta narracji z 18.10.2026: 9 COMPLETED / 5 PARTIAL / 1 PAUSED pochodzi z dwóch raportów JSON zakończonej sesji i guarda, porównanych w diagnostyce z 18.10. Wcześniejsze 10/4/1 było błędem opisu; nie zmieniano danych runów.
