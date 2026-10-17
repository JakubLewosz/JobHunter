# Wyniki i zakres weryfikacji — 17 października 2026

Ten dokument opisuje bieżący stan. Pełny dziennik poprzednich etapów:
[archiwalny TEST_REPORT](archive/2026-10-17/TEST_REPORT.md).
Nie sumować dawnych kampanii, baz i różnych systemów jako jednej próby.

## Obecne porządkowanie i poprawka raportów

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
15 rozpoczętych cykli: 10 COMPLETED, 4 PARTIAL, 1 PAUSED. Zakończenie
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
