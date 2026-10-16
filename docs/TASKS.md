# Zadania

## Konstrukcja wiadomości z kontekstu — 16 października 2026

- [x] Na kolejne jawne zlecenie usunąć sztywne pierwsze zdanie i kolejność
      czterech części z instrukcji generatora. Jedna prośba, rzeczowe
      połączenie firmy z projektem, kompletne informacje i prosty język.
      Bez rotacji wariantów, losowych parafraz i obowiązkowej listy funkcji.
      Nowe wskazówki mają pierwszeństwo przed dawnym domyślnym wzorem;
      zatwierdzonego pola wzoru/profilu w głównej bazie nie zmieniać.
- [x] Uzupełnić pomocniczą kontrolę powtórzeń o dwie prośby zakończone
      kropką, bez karania pojedynczej prośby z opisem celu kandydata.
      Celowane testy stylu **48/48 PASS**. Kontrole faktów i uprawnień zachowane.
      Do kontekstu trzech poprzednich szkiców przekazywać także dalsze
      akapity, aby porównywać tok listu zamiast samego otwarcia i pytania.
      Wyznaczać cel redakcyjny z rodzaju kontaktu i zweryfikowanych warunków,
      bez gotowych zdań/rotacji. Ten sam rodzaj kontaktu może wymagać innego
      priorytetu po potwierdzeniu godzin; to nie zmiana przeznaczenia adresu.
- [x] Dokończyć sześć rzeczywistych generacji na fikcyjnych firmach:
      po dwie ACTIVE/OPEN/PROSPECT, trzy zatwierdzone projekty, bez researchu,
      Gmaila i wysyłki. Ocenić funkcję otwarcia, tok informacji, prośby,
      dopasowanie i kompletność, nie tylko inne brzmienie. Kod i semantyka
      sześciu prób bez zastrzeżeń. Cztery minimalne korekty języka w prywatnych
      podglądach ponownie sprawdzone, surowe teksty zachowane; bez ręcznej
      zmiany konstrukcji. Różnice funkcjonalne są rzeczywiste, ale bliskie
      pary pozostają podobne — nie są to sześć całkowicie odmiennych toków.
- [x] Windows: typecheck PASS, pełny backend 529/530; jedyna porażka to stara
      asercja dosłownego zdania promptu. Po zastąpieniu kontrolą danych
      i zachowania cała grupa research **40/40 PASS**, finalna asercja 1/1.
      Następnie **12/12 performance, build i 15/15 UI PASS**. Kod aplikacji
      bez zmian podczas tej korekty testu. Nie raportować jednego
      nieprzerwanego `npm run check` zakończonego PASS.
- [x] Końcowy audyt readonly: wszystkie **51 tabel bez zmian**, integrity=ok,
      FK=0; spójne backupy przed/po. Biblioteka 472/376/221 i 254 wersje,
      profil v4/9 faktów/PDF/hash, zapisany wzór, historia/granica, aliasy,
      blokady, 6 SELF_TEST/outbox/liczników i shared 0/0 zachowane. Fingerprint
      206 plików kodu/builda; bez nieoczekiwanych zmian źródeł podczas checka.
      Prywatny pełny raport z surowymi generacjami, korektami, oceną podobieństw
      i pełnymi wiadomościami poza Git. RESEARCH_ONLY zatrzymany, zero Gmaila,
      publicznego researchu i rzeczywistych wysyłek.

## Prostszy wzór zapytania wskazany przez użytkownika — 16 października 2026

- [x] Na wyraźne życzenie zmienić układ nowych generacji: proste pytanie
      o współpracę → edukacja i dostępność razem → konkretna firma i projekt
      → krótkie zakończenie. Bez wymuszania „Nazywam się…”, powtarzania godzin
      i wymuszonego różnicowania otwarć. Dopasowanie oraz źródła/fakty nadal
      wymagane; przykład technologii firmy nie dodaje kompetencji kandydata.
- [x] Zaktualizować domyślny wzór i instrukcję, zachowując istniejące
      wiadomości i zatwierdzony profil. Celowane testy stylu **38/38 PASS**.
      Dwa rzeczywiste podglądy modelu na fikcyjnych firmach, 78/86 słów:
      poprawnie różne projekty, kod i review bez zastrzeżeń; również przy
      poprzednim zapisanym domyślnym wzorze. Wszystkie 51 tabel głównej bazy
      bez zmian, materiały v4/9 faktów/PDF i historia/blokady zachowane.
- [x] Pełne `npm run check` na Windowsie po aktualizacji asercji starego
      wzoru: **520/520 backend, 12/12 performance, 15/15 UI**, typecheck/build
      PASS. Nowy fingerprint kodu/builda i prywatny raport/podglądy zapisane.
      Wszystkie 51 tabel głównej bazy nadal bez zmian. Bez Gmaila, wysyłki
      i uruchamiania rzeczywistej sesji researchu.

## Korekta dwóch szkiców z nierozstrzygniętą kontrolą — 16 października 2026

- [x] Ponownie odczytać oficjalne źródła na Windowsie: 10 READ z systemowymi
      CA. Zachować rozbieżność wersji językowych i niepotwierdzoną aktualność
      jednego wakatu; oprzeć zapytanie na dosłownym opisie własnej działalności.
      Drugi szkic: usunąć wyłącznie niezatwierdzoną preferencję umowy.
- [x] Dwie minimalne korekty jako **wersje 2**, te same ID i odbiorcy;
      2 DRAFT + 2 SEMANTIC_REVIEW zakończone OK, kod PASS, review COMPLETED,
      supported=true/issues=[], materialIssues=[]. Status NEEDS_REVIEW,
      bez zgody na wysyłkę. Generator, walidator i styl bez zmian.
- [x] Niezależny audyt readonly: wszystkie wcześniejsze ID, 252 wersje,
      materiały starych kontroli, pozostałe szkice/kontakty, stare analizy,
      historia/granica, blokady, aliasy i zatwierdzone materiały zachowane.
      **472/376/221**, wersje **252 → 254**; SELF_TEST/outbox/liczniki 6/6/6,
      shared 0/0 bez zmian. Spójne backupy SQLite (51 tabel), integrity=ok/FK=0,
      206 plików kodu/builda zgodnych. Końcowy RESEARCH_ONLY zatrzymany,
      paused/senderPaused=true, brak aktywnych run/job. Prywatny pełny raport
      z wiadomościami, źródłami i zachowanymi wersjami poza Git. Bez Gmaila/send.

## Uporządkowanie całej biblioteki — 16 października 2026

- [x] Audyt readonly całej głównej bazy Windows: **472 rekordy firm /
      376 kontaktów / 221 szkiców / 252 wersje**. Rozłączny podział firm:
      155 z dodatnimi bieżącymi kontrolami szkicu, 63 do odświeżenia źródeł
      lub powiązań, 2 z zastrzeżeniami treści/oceny, 3 wstrzymane (w tym
      archiwalny duplikat i jeden zachowany szkic), 249 pozostałych bez szkicu.
      To datowany widok; źródła mają limit 24 h, bez uprawnienia do wysyłki.
- [x] Prywatny katalog TXT/JSON, wszystkie dokładne wiadomości i wersje,
      plan dalszej pracy oraz przeglądarka z filtrami poza Git. Kontakty,
      przeznaczenie, źródła, ostrzeżenia i powody braku szkicu zachowane.
      249 niewstrzymanych firm bez szkicu: 99 bez kontaktu, 48 z kontaktem
      niedopuszczonym lub niepotwierdzonym, 93 bez potwierdzonej podstawy/
      zgodności, 9 do odświeżenia analizy. Brak natychmiastowej dodatniej
      kwalifikacji dla kolejnego szkicu w tej kontroli offline.
- [x] Spójny backup SQLite, integrity=ok/FK=0, hashe wszystkich 51 tabel
      przed/po bez różnic; profil v4/9 faktów/PDF/hash, historia/granica,
      aliasy/blokady, 6 SELF_TEST/outbox/liczników i shared zachowane.
      Kod/build 206 plików bez zmian. Bez nowego researchu, Gmaila i wysyłki.
- [ ] Dalsza kolejność po opisanej wyżej korekcie dwóch szkiców: 3 grupy relacji
      nazw i domen (4 istniejące rekordy) do weryfikacji oficjalnymi źródłami;
      bez automatycznego scalenia. Następnie odświeżać źródła bliżej przyszłego
      kontaktu i uzupełniać braki kontaktu/podstawy. Nie kasować 2 zachowanych
      znaczników niedokończonej analizy ani historii błędów; nie są procesami.

## Pojedynczy SELF_TEST — 16 października 2026

- [x] Po jawnym zleceniu jednej wysyłki bez dodatkowego pytania użyć istniejącego
      konta, dotychczasowej treści testowej i zatwierdzonego CV. Świeży natywny
      podgląd i MIME sprawdzone co do nadawcy/odbiorcy/treści oraz bajtów PDF.
      Jedna próba **16:53:14.951 Europe/Warsaw**, SENT_CONFIRMED o 16:53:16.598;
      normalne potwierdzenie dotyczyło wyłącznie tej próby w Wysłanych.
- [x] Backupy SQLite przed/po spójne; integrity=ok/FK=0. Wszystkie dawne
      wiersze i chroniony stan zachowane. Biblioteka 472/376/221 bez zmian,
      SELF_TEST/outbox/liczniki **5/5/5 → 6/6/6**, bez resetu liczników.
      Materiały/CV, historia, blokady i kod/build zachowane; prywatny wynik
      i dokładny MIME poza Git. Bez nowego OAuth, innych odczytów poczty,
      wiadomości do firm i AUTO_POLICY. Końcowy RESEARCH_ONLY zatrzymany,
      senderPaused=true, aktywne run/job i nierozstrzygnięty outbox=0.
- [x] Użytkownik zgłosił Spam dla próby z programu i Odebrane dla dwóch
      ręcznych wiadomości o tej samej treści/CV do innych odbiorców bez
      wcześniejszego kontaktu. Nie jest to porównanie na tej samej skrzynce.
      Lokalny audyt MIME nie wykazał oczywistego błędu w zbadanej strukturze;
      nie zawiera jednak nagłówków dostarczenia. Oryginały i wstępna analiza
      pozostają poza Git. Bez nowych wysyłek, odczytu poczty lub zmian kodu.
- [ ] Porównać oryginały .eml odebrane w Spam i Odebranych: uwierzytelnienie,
      nagłówki i MIME. Nie uznawać Message-ID lub wieku konta za potwierdzoną
      przyczynę bez danych; otwarcie PDF w tej próbie nadal niepotwierdzone.

## Nowa sesja RESEARCH_ONLY 8 h po odzyskaniu internetu — 16 października 2026

- [x] Po jawnym zleceniu użytkownika sprawdzić połączenie: reader 3/3 READ,
      natywny CLI i rzeczywisty web search PASS. Windows doctor: win32 x64,
      Node 24.19.0, SQLite 3.53.4, CLI 0.162.0-alpha.17.2, systemowe CA.
      Kod/build bez zmian; fingerprint 206 plików zgodny z pełnym checkiem
      Windows z 15 października (519/12/15, typecheck/build PASS).
      Nie powtarzano pełnego checka i nie przypisuje się mu dzisiejszej daty.
- [x] Przed zamknięciem poprzedniego checkpointu spójny backup 51 tabel.
      Natywne finishPartial zakończyło wyłącznie pozostawiony run/job;
      wpisy zachowane jako CANCELLED, błąd CODEX_FAILED zachowany. Poprzedni
      sessionId, terminy, metadane sesji i raport pozostały bez zmian.
      Ochrona danych bez różnic; drugi spójny backup przed nową sesją.
      Punkt odniesienia: **354 rekordy firm / 282 kontakty / 170 szkiców**,
      z zachowanym archiwalnym duplikatem i wszystkimi wcześniejszymi blokadami.
- [x] Jedna nowa natywna sesja **16.10.2026 07:27:08.873 Europe/Warsaw**,
      nieodnawialny termin **16.10.2026 15:27:08.873**. 8 h, interwał 15 min,
      do 10 nowych propozycji i 5 szkiców/cykl; główna baza, bez Gmaila/send.
      Osobny sessionId i zakres runIds, bez wznowienia poprzedniej sesji.
      Zatwierdzony profil v4/9 faktów/PDF, historia, granica, aliasy, shared
      i 5 SELF_TEST/outbox/liczników pod ochroną kontrolera. Bez zmiany kodu,
      automatycznego wznowienia, autostartu lub ustawień zasilania.
- [x] Audyt readonly po starcie: native hours=8, deadline 28 800 000 ms,
      128 początkowych kierunków, sesja aktywna, pierwszy cykl rozpoczęty.
      Integrity=ok/FK=0, wszystkie pola protection puste, senderPaused=true,
      próby/outbox/liczniki nadal 5/5/5. W trakcie sesji monitor ACTIVE,
      powiadamia tylko o końcu, awarii lub potrzebnej decyzji.
- [x] Rzeczywisty koniec **16.10.2026 15:27:09.252 Europe/Warsaw**, DEADLINE,
      **8 h + 0,379 s**. 32 cykle: 23 COMPLETED / 9 PARTIAL, 0 błędów modeli
      i brak awarii workera. Suma okien operacji 2 h 15 min 3,692 s, nie CPU.
      **+118 rekordów firm / +94 kontakty / +51 szkiców**, baza **472/376/221**;
      82 znane firmy ponownie odwiedzone, 9 starych szkiców z nową wersją,
      26 ponownie użytych, 60 nowych wersji i 192 pierwotne wersje zachowane.
- [x] Jakość: 50 nowych szkiców PASS/COMPLETED/supported=true; 1 z supported=null
      wymaga potwierdzenia aktualności wakatu. 3 wcześniejsze szkice w zakresie
      DRAFT_MATERIAL_STALE wymagają ponownej analizy. 16 przypadków błędów
      kandydatów / 13 nieudanych rekordów źródeł; 3 konflikty tożsamości dotyczą
      2 kandydatur i pozostały zablokowane. Brak nowych duplikatów kluczy
      i nierozstrzygniętych wspólnych mailboxów. Pełne prywatne TXT/JSON poza Git:
      firmy, literalne kontakty/przeznaczenie, dowody, 86 pełnych bieżących
      wiadomości, 60 wersji i wszystkie zastrzeżenia, błędy oraz pominięcia.
- [x] Niezależny audyt readonly: integrity=ok/FK=0, wszystkie pola protection
      puste, pierwotne ID/wersje, materiały v4/9 faktów/PDF/hash, historia/granica,
      blokady/aliasy, shared i 5 SELF_TEST/outbox/liczników zachowane. 206 plików
      kodu/builda zgodnych; 3 backupy po 51 tabel zgodne ze stanami odniesienia.
      PID zakończony, brak aktywnych run/job, stopped=true/paused=true,
      senderPaused=true; zero Gmaila/wysyłki. Aktywna kolejka odłożeń była pusta
      przed i po; historyczne znaczniki nie dowodzą oczekujących szkiców.
      Nie zaliczać powrotu niepustej kolejki ani rozszerzania 128 kierunków
      na podstawie tego przebiegu. Końcowy raport przygotowany.
- [x] Po jednym końcowym raporcie automatyzacja tej sesji ustawiona na PAUSED.
- [ ] Przed przyszłym kontaktem wyjaśnić niepewną aktualność 1 nowego szkicu,
      odświeżyć źródła 3 starszych i rozstrzygnąć 2 kandydatury z konfliktem
      tożsamości. Zebrane dane i pozytywne kontrole treści nie udzielają zgody
      na Gmaila, pilotaż lub AUTO_POLICY.

## Usprawnienie i sesja RESEARCH_ONLY 15 h — 15 października 2026

- [x] Przed zmianą kodu zatrzymany profil i spójny backup 51 tabel poza Git;
      punkt odniesienia 146 rekordów firm / 109 kontaktów / 82 szkice.
- [x] Natywny mechanizm sesji: walidowane 1–24 h, panel 8/15 h, API 2–24 h;
      dla długiej pracy interwał 15 min, 10 nowych propozycji i 5 szkiców/cykl,
      do 5 odłożeń w kolejce, bez zmiany godzinnego testu 10/3 łącznie.
      Rozszerzany plan regionów/branż/projektów wykracza poza 8 kierunków.
      Stały deadline, jedna operacja naraz, restart pozostaje zatrzymany;
      generator, kontakty, historia, deduplikacja i bramki send bez zmian.
- [x] Celowane testy Windows 21/21: symulacja 15 h/60 cykli, rozszerzanie
      kierunków, 5 miejsc szkiców i powrót odłożeń, brak duplikatów, Stop,
      restart/termin, niewłaściwe długości i dotychczasowe zabezpieczenia.
- [x] Pełny npm run check Windows PASS: 519 backend / 12 performance / 15 UI,
      typecheck i build. Doctor: win32 x64, Node 24.19.0, SQLite 3.53.4,
      natywny CLI 0.162.0-alpha.17.2. Test panelu uruchamia i zatrzymuje 15 h
      na fikcyjnych danych; symulacja zegara nie zastępuje prawdziwych 15 h.
- [x] Natywny reader preflight 3/3 READ, CLI/search probe PASS. Jedna sesja
      15 h wystartowała **15.10.2026 21:43:46 Europe/Warsaw**, stały termin
      **16.10.2026 12:43:46**. 128 początkowych kierunków z dalszym rozszerzaniem,
      interwał 15 min i budżet 5 szkiców. Fingerprint 206 plików kodu/builda.
      Bez Gmaila, wysyłki i automatycznego wznowienia; raport poza Git,
      monitor w tej rozmowie powiadamia o końcu/awarii/potrzebnej decyzji.
- [x] Raport zakończonej przed terminem sesji: **16.10.2026 06:14:14.536**,
      **CODEX_FAILED**, rzeczywisty przedział **8 h 30 min 28,210 s**;
      nie wykonano pełnych 15 h. 35 rozpoczętych cykli: 20 COMPLETED,
      14 PARTIAL, 1 PAUSED na SEARCH. CLI exit=1, zapisany problem transportu
      „workspace routing discovery failed”; brak wznowienia i nowego startu.
- [x] Wyniki tylko runIds tej sesji: **+208 rekordów firm / +173 kontakty /
      +88 szkiców**, cała biblioteka **354/282/170** (nadal archiwalny duplikat).
      Powrót do 40 znanych firm, 8 wcześniejszych szkiców z nową wersją,
      16 ponownie użytych; 96 nowych wersji. 87 nowych szkiców PASS/COMPLETED/
      supported=true, 1 odrzucony przez kod — niegotowy. Kontakty UNKNOWN/SALES
      zachowano z przeznaczeniem, bez nowych szkiców na te typy.
      33 przypadki błędów kandydatów / 34 nieudane źródła / 1 błąd modelu;
      pełne treści, dowody, ostrzeżenia, pominięcia i diagnostyka poza Git.
- [x] Niezależny audyt readonly po zakończeniu PID: integrity=ok/FK=0,
      wszystkie pola protection puste, pierwotne ID i stare wersje zachowane,
      profil v4/9 faktów/PDF/hash, historia/granica, blokady/aliasy, shared
      i 5 SELF_TEST/outbox/liczników bez zmian. Fingerprint 206 plików zgodny;
      backupy przed/po zgodne z właściwymi 51 tabelami. Zero Gmaila/wysyłki.
      Zatrzymana sesja pozostawiła 1 run PAUSED i 1 job QUEUED jako checkpoint;
      bez aktywnego procesu/zapisu, bez usuwania locków lub zmian checkpointu.
- [x] Przygotować jeden końcowy raport prywatny i pełny plik wiadomości;
      automatyzacja raportu tej sesji ustawiona na PAUSED.
- [x] Przed nową sesją 8 h sprawdzono dostępność transportu CLI i wyszukiwarki;
      nie uznano poprzedniego problemu za limit konta. Pełne rzeczywiste 15 h
      pozostaje niezaliczone.
- [ ] Przed przyszłym kontaktem rozstrzygnąć dwie zatrzymane próby dopasowania
      tożsamości tej samej kandydatury i jeden odrzucony szkic. Kolejny research
      nie obchodzi ich blokad ani nie zatwierdza wysyłki.

## Celowana weryfikacja trzech kandydatur — 15 października 2026

- [x] Sprawdzić aktualne oficjalne źródła na Windowsie w RESEARCH_ONLY.
      Zapisano 2 nowe rekordy firm, 1 literalny kontakt GENERAL i 1 szkic;
      biblioteka 144/108/81 → 146/109/82 (z zachowanym archiwalnym duplikatem).
      Osobne zapytanie o współpracę po korekcie ma code PASS, review COMPLETED,
      supported=true/issues=[], bez uwag i problemów powiązania materiałów.
      Pierwszą wersję z zastrzeżeniem review zachowano. Status NEEDS_REVIEW
      i rzeczywiste przeznaczenie kontaktu pozostały; bez zgody na wysyłkę.
- [x] Pozostałe dwie kandydatury pozostawić bez szkiców: jedna ma zamaskowany
      email w natywnym HTML i niedopasowany konkretny wakat, druga otrzymuje
      HTTP 403 na obu oficjalnych stronach kariery. Literalny rekrutacyjny
      mailto pierwszej potwierdzono dodatkowo readonly w przeglądarce;
      nie podstawiano tego jako odczytu PUBLIC_HTTP ani nie obchodzono bramek.
      Otwarta kandydatura pozostaje osobnym kierunkiem do ponownej kwalifikacji.
- [x] Końcowy audyt readonly: integrity=ok/FK=0, wszystkie pola protection
      puste, całe wcześniejsze 81 drafts, wersje, kontakty i research_items
      niezmienione; profil v4/9 faktów/PDF/hash, historia/granica, blokady,
      aliasy, shared i 5 SELF_TEST/outbox/liczników zachowane. Backupy spójne
      względem 51 tabel, fingerprint 203 plików kodu/builda zgodny.
      Prywatny raport i dokładna wiadomość poza Git. Program zatrzymany,
      bez Gmaila/wysyłki/AUTO_POLICY. Kod i generator projektu bez zmian.
- [ ] Przy kolejnym zleceniu obsługi odłożonych kandydatur: poprawny natywny
      odczyt adresu widocznego po JavaScript i osobna kwalifikacja otwartej
      kandydatury; dla strony z 403 wymagane odczytywalne oficjalne dowody.
      Nie uznawać braku odczytu za odmowę firmy ani nie dopuszczać send.

## Sesja RESEARCH_ONLY na 5 godzin — 15 października 2026, zakończona

- [x] Uruchomić na głównym domowym Windowsie, bez Gmaila i wysyłki.
      Spójny backup poza Git: integrity=ok, FK=0, wszystkie 51 tabel zgodne.
      Punkt odniesienia: 114 rekordów firm / 85 kontaktów / 70 szkiców;
      wliczony zachowany archiwalny duplikat, bez deklaracji 114 podmiotów.
- [x] Prywatny adapter istniejącego mechanizmu sesji przekazuje 5 godzin
      i koryguje wyłącznie dawny opis zdarzenia 8 h. Próba na fikcyjnej
      bazie i zegarze PASS: 18 000 000 ms, interwał 60 min, stały deadline,
      koniec DEADLINE, DisabledMailProvider i outbox=0. Kod/build projektu
      bez zmian od pełnego checka 513/12/15; fingerprint 203 plików zgodny.
- [x] Rzeczywisty preflight Windows: systemowe CA, 3/3 publiczne strony READ,
      natywny CLI i wyszukiwarka PASS. Start **15:45:17**, pierwotny termin
      **20:45:17 Europe/Warsaw**. Osobny kontroler bez autostartu/wznowienia;
      bieżące źródła, kontakty i szkice zapisuje w głównej bazie, z natywną
      deduplikacją. Nowe kierunki nie powielają cache poprzedniej sesji.
- [x] Stan po starcie: pierwszy kierunek COMPLETED, 0 kandydatów/nowych szkiców,
      0 błędów; wówczas sesja aktywna, następny kierunek o 16:45. Historyczne wiersze
      i tożsamości/aliasy pod ochroną kontrolera, dane chronione niezmienione,
      profil v4/9 faktów i PDF/hash zachowane. Nadal 5 SELF_TEST/outbox/liczników,
      zero nowych prób lub użycia wysyłek. Raport po końcu ustawiony w tej
      rozmowie; monitor pozostaje cichy podczas prawidłowej pracy.
- [x] Zakończenie natywne DEADLINE **20:45:17.517 Warszawa**; rzeczywisty
      przedział 18 000 465 ms (5 h + 0,465 s), 5 cykli, PID zakończony.
      Suma okien operacji 29 min 7,333 s, reszta to planowe oczekiwanie;
      nie jest to pomiar CPU. Bez przerwania lub automatycznego wznowienia.
- [x] Wynik tylko runIds tej sesji: **+30 rekordów firm, +23 kontakty,
      +11 szkiców**. Biblioteka **144/108/81**, w tym zachowany archiwalny
      duplikat. 4 znane firmy ponownie odwiedzone, 1 wcześniejsza wiadomość
      ponownie wykorzystana; wszystkie 70 starych treści i wersji bez zmian.
      39 elementów / 37 URL: 36 DONE, 2 ERROR, 1 UNAVAILABLE. 3 problemy
      kandydatur (2 STALE_EVIDENCE, 1 NO_READABLE_SOURCE/403); brak awarii
      kontrolera i błędów modeli. Nie ponawiano przy sporządzaniu raportu.
- [x] Nowe kontakty: 14 GENERAL, 6 RECRUITMENT, 2 UNKNOWN, 1 SALES;
      nieznane/sprzedażowe nie dopuszczone do szkicu. 11 nowych wiadomości:
      8 GENERAL/3 RECRUITMENT, 9 COMPANY_INQUIRY/2 OPEN_APPLICATION.
      11/11 code=PASS/review=COMPLETED, supported=true/issues=[], ponowny
      readonly check payloadów PASS. Warunki i zastrzeżenia kanału kontaktu
      zachowane w raporcie; nie jest to zgoda ani pełna kwalifikacja do wysyłki.
- [x] Końcowy niezależny audyt readonly: wszystkie pola protection puste,
      oryginalne ID i tożsamości/aliasy zachowane, profil v4/9 faktów/PDF/hash,
      historia/granica, blokady, shared i 5 SELF_TEST/outbox/liczników bez zmian.
      203 pliki kodu/builda zgodne; integralność/FK i oba backupy względem
      51 tabel PASS. Brak nowych duplikatów kluczy i nierozstrzygniętych
      wspólnych emaili; nie jest to kontrola rejestrowa wszystkich firm.
      Zatrzymany RESEARCH_ONLY, senderPaused=true, brak aktywnych run/job,
      lock zwolniony. Bez Gmaila, wysyłki i zmian programu po uruchomieniu.
- [x] Pełny raport, katalog firm/kontaktów, komplet błędów/pominięć/ostrzeżeń
      i dokładne 11 nowych + 1 zachowana wiadomość poza Git. Monitor jednej
      zakończonej sesji wyłączony (PAUSED); nie uruchamiać kolejnej próby.

## Rozstrzygnięcie jednej pary tożsamości firm — 15 października 2026

- [x] Potwierdzić wspólny podmiot na podstawie 5 rzeczywistych odczytów
      publicznych stron READ/HTTP 200 i oficjalnego odpisu rejestrowego.
      Dowody, dane firm i pełna zachowana wiadomość wyłącznie poza Git.
- [x] Powiązać dwie domeny oraz nazwę marki, skróconą i pełną nazwę prawną
      z rekordem głównym. Zachować drugi rekord jako archiwalny duplikat
      z trwałą blokadą DUPLICATE_COMPANY_ALIAS, bez zmiany jego history_status
      na odmowę lub kontakt. Wszystkie dawne ID, kontakty, dowody i szkice
      zachowane; bez DELETE, przenoszenia treści lub ponownej generacji.
- [x] Resolver i podgląd importu historii rozpoznają potwierdzone aliasy
      nazw również bez domeny. Kolizja z niearchiwalnym rekordem, sprzeczne
      aliasy i obca niepotwierdzona domena nadal blokują. Pamięć aliasów
      odświeża się po zmianie, rollbacku i zapisie drugiego połączenia;
      bez migracji schematu i wielokrotnego skanowania nazw w dużym imporcie.
- [x] Końcowy rzeczywisty Windows check: **513 backend / 12 performance /
      15 UI PASS**, typecheck/build PASS, źródła niezmienne podczas checka.
      Pierwszy check ujawnił koszt dużej historii; poprawiono przed wdrożeniem.
      Scenariusze ponad 10 tys. firm wróciły z ok. 69 s do 4,5–4,8 s;
      końcowy zestaw performance 17,7 s. Doctor poprawny, backend zatrzymany.
- [x] Spójne backupy przed/po i kontrola w osobnym procesie: integrity=ok,
      FK=0. Zmieniono 4 tabele, pozostałe 47 identyczne; wcześniejsze wiersze
      blokad i audytu zachowane, dopisano tylko rozstrzygnięcie. Nadal
      114 rekordów firm / 85 kontaktów / 70 szkiców, w tym archiwalny duplikat;
      liczba rekordów nie oznacza tylu potwierdzonych niezależnych podmiotów.
      Profil v4/9 faktów, PDF/hash, wszystkie treści i wersje, historia,
      granica kampanii, shared i 5 SELF_TEST/outbox/liczników bez zmian.
- [x] Ponowny audyt readonly: **69/69 przygotowanych do przyszłego podglądu**,
      code=PASS/review=COMPLETED, supported=true/issues=[]. Zastrzeżenie
      tożsamości rozstrzygnięte, dotychczasowa blokada odłożonego szkicu
      zachowana poza tą grupą. 257 zapisanych URL; bez ponownego odczytu
      wszystkich stron. Najwcześniejszy próg 24 h nadal 17:37 Warszawa.
      Ręczny przegląd paczki i ewentualny Gmail pozostają osobnymi etapami.
- [x] RESEARCH_ONLY zatrzymany, lock zwolniony. Bez Gmaila, poczty, sekretów,
      OAuth, tokenu panelu, wysyłki lub Start/AUTO_POLICY. Pełny raport prywatny.

## Audyt pozostałych 69 szkiców przed przyszłym pilotażem — 15 października 2026

- [x] Audyt readonly dokładnie 69 z 70 szkiców, z pominięciem odłożonej firmy.
      **68 przygotowanych do przyszłego podglądu, 1 wymaga wyjaśnienia
      deduplikacji**: wspólny literalny email dwóch rekordów firm, z jednym
      szkicem. To zastrzeżenie audytu, bez dodania nowej blokady technicznej.
      Dotychczasowe trwałe wykluczenie pozostało aktywne.
- [x] 69/69 materiałów code=PASS/review=COMPLETED, supported=true/issues=[].
      Ponowna kontrola kodowa dokładnych zapisanych payloadów PASS, brak uwag
      stylistycznych, stale/unverified materiałów lub obcych referencji.
      Kontrole aktualności/wersji/hash/parserów obejmują 257 zapisanych URL;
      nie wykonano pełnego ponownego odczytu stron ani modelu/generatora.
      Przejrzano 69 literalnych dowodów/kontekstów kontaktu, bez dodatkowego
      przypadku wyłącznie informacji administratora zamiast kontaktu ogólnego.
- [x] Przygotowane 68: 62 GENERAL i 6 RECRUITMENT; 62 COMPANY_INQUIRY,
      5 OPEN_APPLICATION, 1 CONDITIONS_INQUIRY. Nieznane warunki pozostają
      pytaniami. Dla ręcznego pilotażu istniejące review wybranej paczki nadal
      wymagane; nie przywrócono akceptacji każdego maila w AUTO_POLICY.
      Najwcześniejszy próg 24 h materiałów: **15 października 17:37 Warszawa**.
- [x] Wszystkie 51 tabel identyczne, również względem końcowego backupu
      poprzedniej operacji. Nadal 114/85/70, profil v4/9 faktów, zatwierdzony
      PDF/hash, historia/blokady/granica, shared i 5 SELF_TEST/liczników
      bez zmian; integrity=ok, FK=0. Kod/build 203 plików zgodny, bez zmian
      implementacji/builda i bez powtarzania checka. RESEARCH_ONLY zatrzymany,
      lock zwolniony. Bez Gmaila/poczty/OAuth/sekretów/tokenów i wysyłki.
      Pełna lista, konteksty i 69 dokładnych wiadomości poza Git.
- [x] Rozstrzygnąć tożsamość pary ze wspólnym adresem przed włączeniem
      zależnego szkicu do pilotażu — ukończone na osobne polecenie użytkownika
      w nowszym etapie powyżej, bez kasowania rekordów lub wysyłki.
- [ ] Po powrocie użytkownika do Gmaila: świeże materiały wybranej paczki,
      potwierdzenie nadawcy/testu, uzgodniony celowany odczyt historii,
      dokładny podgląd do 3 wiadomości i osobna zgoda na wysyłkę. Ten audyt
      nie potwierdza pustej historii Gmaila ani aktualnego połączenia konta.

## Odłożenie jednej firmy do wyjaśnienia kontaktu — 15 października 2026

- [x] Na wyraźne polecenie użytkownika zapisano blokadę
      CONTACT_PURPOSE_UNCONFIRMED w istniejących suppressions i marker jednej
      firmy. Aktor user, permanent=0, bez automatycznego wygaśnięcia;
      obecne bramki blokują każdy taki wpis. Bez zmiany history_status,
      oznaczania wcześniejszego kontaktu/odmowy lub typu GENERAL.
- [x] Spójne backupy przed/po, transakcja i audyt zachowania danych. Wspólna
      natywna bramka: false → true; osobny proces readonly po zamknięciu zapisu
      potwierdził trwałe true. Zmiany wyłącznie w companies (marker/wersja/data
      jednej firmy), suppressions (+1) i audit_events (+1); pozostałe 48 tabel
      identyczne. Wcześniejsze blokady i zdarzenia zachowane.
- [x] Wszystkie 70 szkiców/treści/odbiorców, stare wersje/materiały i 85
      kontaktów bez zmian. Historia/granica/shared, profil v4/9 faktów,
      CV/PDF/hash, Fingoweb i 5 SELF_TEST/outbox/liczników zachowane.
      Nadal 114/85/70 rekordów, integrity=ok, FK=0; oba backupy zgodne z 51
      tabelami. RESEARCH_ONLY zatrzymany, paused/senderPaused=true, lock
      zwolniony. Bez Gmaila, poczty, OAuth/sekretów/tokenów i wysyłki.
      Kod/build 203 plików bez zmian, bez ponawiania checka implementacji.
      Pełny prywatny raport i dowody poza Git.
- [ ] Ewentualne zdjęcie wyłącznie tej blokady wymaga uprzedniego
      potwierdzenia przeznaczenia kontaktu i kontrolowanej zmiany stanu;
      pozostałe blokady/historia/niepewne próby nadal obowiązują. Restart,
      Start, zmiana dnia, nowy research lub review treści nie odblokowują firmy.

## Celowana ocena przeznaczenia jednego kontaktu — 15 października 2026

- [x] Sprawdzono pięć oficjalnych stron na Windowsie (5/5 READ), jawne
      atrybuty kontaktu w stopkach trzech stron oraz dostępną warstwę tekstową
      dwóch oficjalnych podręczników. Adres biura występuje w danych
      administratora pod formularzem w dwóch wersjach językowych. Kontakt
      w stopce jest innym adresem serwisowym; nie zastąpiono odbiorcy.
- [x] Wynik oceny: przeznaczenie do kontaktu ogólnego poza klauzulą nie jest
      dostatecznie potwierdzone; rekomendacja pozostawienia poza pilotażem.
      Brak podstaw do oznaczenia wyłącznego PRIVACY, odmowy firmy lub
      RECRUITMENT. Brak wakatu nie jest przeszkodą dla GENERAL; nierozstrzygnięta
      jest funkcja tego konkretnego adresu. Techniczna bramka nadal dopuszcza
      GENERAL; nie utożsamiono jej wyniku z potwierdzeniem przeznaczenia.
- [x] Cała baza readonly, bez Store/backendu/poczty: wszystkie **51 tabel
      identyczne** przed/po, cały wiersz szkicu v2 i treść zachowane, podobnie
      jak historia, blokady, granica, profil v4/9 faktów, CV/PDF/hash,
      5 SELF_TEST/outbox/usage i shared. Nadal 114/85/70 rekordów firm,
      kontaktów i szkiców; integrity=ok, FK=0, RESEARCH_ONLY zatrzymany.
      Kod/build 203 plików bez zmian; nie powtarzano checka bez zmiany kodu.
      Prywatny raport i dowody poza Git; bez Gmaila/OAuth/tokenów i wysyłki.
- [ ] Przed ewentualnym włączeniem tego kontaktu do pilotażu uzyskać
      jednoznaczne aktualne źródło lub wyjaśnienie z firmą. W tej operacji
      nie kontaktowano firmy, nie wykonano reviewContact w imieniu użytkownika
      i nie dodano ani nie usunięto blokady technicznej. Wcześniejsze
      ostrzeżenie w analizie pozostaje zapisane; domyślna rekomendacja dla
      przyszłego pilotażu to pominięcie tego odbiorcy do wyjaśnienia.

## Resolver opisów działalności i dwa zachowane szkice — 15 października 2026

- [x] Resolver v4 rozpoznaje ofertę wykonania programów komputerowych,
      produkcję systemów informatycznych i autorskie oprogramowanie wynikające
      z doświadczeń firmy. Bierny opis produktu wymaga zgodnej marki w domenie
      i tytule oraz konkretnych szczegółów technicznych. Bez wyjątków po nazwie
      firmy i bez zmian generatora/stylu. Zachowano kontrole literalności,
      aktualności, tożsamości, przeznaczenia kontaktu, odmów i historii.
- [x] Cztery regresje odtworzone FAIL → PASS; dodano 27 syntetycznych przypadków
      pozytywnych/negatywnych. 97/97 celowanych; pełny Windows `npm run check`:
      **508/508 backend, 12/12 performance, 15/15 UI**, typecheck/build PASS.
      Doctor na Windows/WORKSTATION/RESEARCH_ONLY PASS. Fingerprint 135 plików
      źródłowych + 68 builda, bez zmian podczas checka i operacji.
- [x] Dwa celowane przebiegi w głównej bazie: **3/3 READ**, oba COMPLETED,
      dwie kontrole semantyczne OK, zero generowania nowych treści.
      Oba istniejące szkice mają wersję materiałów 2, code=PASS,
      review=supported/bez issues i brak DRAFT_MATERIAL_STALE. Pozostają
      NEEDS_REVIEW; warunki współpracy niepotwierdzone, kontakty GENERAL.
- [x] Nadal **114 rekordów firm / 85 kontaktów / 70 szkiców**. Wszystkie
      70 tematów/treści/odbiorców, pozostałe 68 szkiców, stare wersje/materiały,
      tożsamości firm, historia/blokady/granica, shared, profil v4/9 faktów,
      PDF/hash i 5 SELF_TEST/outbox/liczników zachowane. Chronione tabele/stan
      bez zmian; spójne backupy, końcowy zgodny z 51 tabelami, integrity=ok,
      FK=0. stopped/paused/senderPaused=true, aktywne runs/jobs=0,
      nierozstrzygnięty outbox=0. Bez Gmaila, sekretów/OAuth, poczty i wysyłki.
      Pełny prywatny raport z oboma zachowanymi wiadomościami poza Git.
- [ ] Przed przyszłym pilotażem rozstrzygnąć niepewność przeznaczenia jednego
      adresu: literalnie występuje w danych firmy/administratora pod formularzem;
      obecna reguła dopuszcza GENERAL i brak jawnego ograniczenia do privacy,
      lecz nie znaleziono osobnego potwierdzenia zastosowania do współpracy.
      Ostrzeżenie zachowano w nowej analizie i raporcie; adresu nie zastąpiono
      innym kontaktem serwisowym. Ten etap nie zatwierdza przyszłej wysyłki.

## Odświeżenie źródeł 21 wcześniejszych szkiców — 15 października 2026

- [x] Sprawdzono dokładnie 21 identyfikatorów z wcześniejszego audytu
      DRAFT_MATERIAL_STALE. Przyczyną wszystkich był próg 24 godzin;
      poprzednie binding/payload i profil były zgodne. Windows,
      RESEARCH_ONLY/DisabledMailProvider, bez Gmaila/poczty/OAuth i wysyłki.
      **87/87 READ, 73 różne URL**, w tym ponowne odczyty fazy uzupełnienia
      oraz jedna dodatkowa strona produktu. Zero błędów źródeł/modelu.
- [x] Wszystkie 21 tematów, treści i odbiorców zachowano. **19 przechodzi
      bieżące kontrole**; 10 nowych wersji materiałów z identycznym tekstem
      i nowym review, 11 zachowuje wersję. Dla dwóch zatrzymanych wykonano
      osobną ocenę treści na aktualnych dowodach: kod bez uwag,
      supported=true/issues=[], bez nadpisania materiałów lub bramek.
      Łącznie 12 wywołań modelu OK, zero generacji nowych treści.
- [x] Cztery pierwotne pominięcia uzupełniono pełniejszym ciągłym kontekstem
      usług/produktu i właściwą stroną produktu. W dwóch analizach użyto
      potwierdzonej marki, zachowując pełny literalny dowód tożsamości,
      host, ID i nazwę firmy w bazie. Natywna kwalifikacja i same-text review;
      bez zmiany kodu lub obchodzenia blokad. Pierwotne pominięcia zachowane.
- [x] Biblioteka nadal **114 rekordów firm / 85 kontaktów / 70 szkiców**.
      Wszystkie 70 tekstów/odbiorców, 49 szkiców spoza zakresu, stare wersje,
      materiały i zdarzenia weryfikacji zachowane. Chronione tabele/stan,
      historia/blokady/granica, profil v4/9 faktów, PDF/hash, shared
      i 5 SELF_TEST/outbox/usage bez zmian. Spójne backupy przed/po fazach,
      końcowy zgodny z 51 tabelami; integrity=ok, FK=0. Fingerprint 135+68
      zgodny; kod/build bez zmian, nie powtarzano poprzedniego checka.
      Końcowo stopped/paused/senderPaused=true, aktywne runs/jobs=0,
      nierozstrzygnięty outbox=0, blokada profilu zwolniona. Pełny prywatny
      raport z 21 wiadomościami, źródłami i ostrzeżeniami poza Git.
- [x] Dwa pozostałe ograniczenia rozpoznawania opisów produktu/usług usunięto
      w osobnym etapie resolvera v4 opisanym powyżej: oba zachowane szkice
      ponownie zakwalifikowano i zweryfikowano na świeżych źródłach.
      Niezależne potwierdzenie przeznaczenia jednego adresu pozostaje otwartym
      zastrzeżeniem przed przyszłą wysyłką, zapisanym w bieżącym zadaniu.
      Szczegóły firm i kontaktów poza Git.

## Rozpoznawanie opisów własnego oprogramowania — 15 października 2026

- [x] Resolver podstawy zapytania v3 rozpoznaje własny TMS, formy
      „zbudowałem”/„buduję”, producenta oprogramowania i wsparcie firm
      w budowaniu oprogramowania. Bez wyjątków po nazwach firm, zmian
      generatora/stylu lub kontaktów GENERAL na RECRUITMENT. Własny TMS
      nie dowodzi wewnętrznego zespołu programistycznego.
- [x] Dodano 20 syntetycznych regresji językowych i kontroli źródeł/kontaktu;
      70/70 testów celowanych PASS na Windowsie. Negacje, cudza działalność,
      rozwój pracowników, menu, zgoda marketingowa, nieaktualne/obce źródło,
      odmowy i zabronione kontakty pozostają blokujące.
- [x] Pełne npm run check końcowej wersji na Windowsie: 481/481 backend,
      12/12 performance, 15/15 UI, typecheck/build PASS; doctor PASS.
      Fingerprint 135 plików źródłowych i 68 plików builda, bez zmian
      źródeł podczas końcowego checka. UI używało danych syntetycznych.
- [x] Dokończono cztery wskazane przypadki RESEARCH_ONLY w głównej bazie:
      15/15 READ, 11 wywołań modelu OK, zero błędów. Cztery nowe szkice v1,
      **114/85/66 → 114/85/70**, bez nowych firm/kontaktów. Wszystkie kod
      PASS, review COMPLETED/supported=true/issues=[], powiązania/uwagi
      stylistyczne puste, NEEDS_REVIEW. Kontakt GENERAL zachowany.
- [x] Jeden pierwotny wybór krótkiego nagłówka nie przeszedł podstawy
      zapytania. Po Stop/backupie ponowny odczyt i pełniejszy dosłowny cytat
      z tej samej strony przeszedł niezmienione bramki, natywną kwalifikację,
      generator i review. Pierwotne pominięcie zachowane w historii/raporcie;
      nie jest odmową firmy. Pięć przebiegów COMPLETED, jeden obejmuje to
      pierwotne pominięcie. Bez zmiany kodu aktywnego procesu.
- [x] Spójne backupy przed kodem i przed/po obu fazach; końcowy zgodny z 51
      tabelami, integrity=ok, FK=0. Chronione tabele/stan, 66 starych szkiców,
      ich wersje/materiały, historia/blokady firm, profil v4/9 faktów,
      CV/hash, granica, shared i 5 SELF_TEST/outbox/usage bez zmian.
      Fingerprint 135+68 zgodny. Końcowo stopped/paused/senderPaused=true,
      aktywne runs/jobs=0, nierozstrzygnięty outbox=0, blokada zwolniona.
      Bez Gmaila/poczty/OAuth/wysyłki. Pełne wiadomości, kontakty, źródła,
      ostrzeżenia i audyt poza Git. Nie zaliczać biblioteki 70 szkiców jako
      gotowości do wysyłki: 21 wcześniejszych miało już DRAFT_MATERIAL_STALE.

## Uzupełnienie podstaw dla grupy 18 firm — 15 października 2026

- [x] Sprawdzono dokładnie wcześniejszą grupę 18 firm, bez nowych szerokich
      wyszukiwań. Windows, główna baza, RESEARCH_ONLY/DisabledMailProvider,
      bez gateway Gmaila, poczty, OAuth i wysyłki. 104 zapisane próby odczytu
      publicznych URL zakończone READ, dodatkowo 2 odczyty polityk do kontroli
      powiązania podmiotów. 48 wywołań modelu OK, zero błędów modelu.
- [x] Przygotowano **14 nowych szkiców v1**; biblioteka **114/85/52 →
      114/85/66**. Wszystkie GENERAL zachowują przeznaczenie. Kod PASS,
      review COMPLETED/supported=true/issues=[], bez problemów powiązań.
      NEEDS_REVIEW, bez zatwierdzania wysyłki. Dwa pominięcia uzupełniono
      pełnymi dosłownymi akapitami z tych samych aktualnych źródeł; pozostałe
      dane i reguły/generator zachowane, ponowna kwalifikacja i kontrola.
- [x] Potwierdzono wspólnego administratora i adres jednej pary rekordów.
      Pierwotne zatrzymanie TARGET_IDENTITY_REVIEW_REQUIRED zachowano
      w historii. Po kontroli lokalnej historii obu rekordów powstał jeden
      szkic pod istniejącym rekordem drugiej marki. Bez scalania, kasowania
      lub podwójnej wiadomości do wspólnego adresata.
- [x] Prywatny raport wszystkich 18 przypadków, pełne 14 wiadomości,
      kontakty/dowody, źródła, ostrzeżenia, pierwotne pominięcia i błąd
      tożsamości poza Git. Spójne backupy trzech faz; końcowy zgodny z 51
      tabelami. Integrity=ok, FK=0; chronione tabele/stan, 52 wcześniejsze
      szkice/wersje/materiały i historia firm bez zmian. Profil v4/9 faktów,
      CV/hash, blokady/granica, shared oraz 5 SELF_TEST/outbox/usage zachowane.
      Fingerprint 134 zgodny. Końcowo zatrzymany RESEARCH_ONLY, brak aktywnych
      runs/jobs i nierozstrzygniętych wysyłek; blokada profilu zwolniona.
- [x] Późniejsze jawne zlecenie: cztery brakujące przypadki uzupełnione
      po poprawie rozpoznawania języka i testach zabezpieczeń; szczegóły
      w sekcji powyżej. Pierwotne ograniczenie nie było odmową firmy.
      W pierwotnej operacji 18 firm nie obchodzono bramki ani nie zmieniano
      kodu; zmiana resolvera i cztery nowe szkice stanowią osobny etap.
- [ ] Uporządkować powiązanie dwóch zachowanych rekordów przed przyszłą
      wysyłką; obecne dane i raport wskazują jednego wspólnego adresata.
      Liczby rekordów nie utożsamiać z potwierdzoną liczbą niezależnych firm.

## Dokończenie dwóch znanych firm — 15 października 2026

- [x] Na zlecenie użytkownika ponownie odczytano 6 wskazanych publicznych
      źródeł na Windowsie (6/6 READ), sprawdzono lokalną historię/blokady
      i wykonano 2 celowane przebiegi RESEARCH_ONLY bez Gmaila/send.
      Oba COMPLETED, 6/6 wywołań modelu OK. Dwa nowe szkice v1 zapisane
      w głównej bazie: 114 firm / 85 kontaktów / 52 szkice; bez duplikatów
      nowych firm i bez zastępowania 50 wcześniejszych szkiców.
- [x] Rekrutacyjna otwarta kandydatura i zapytanie na kontakt GENERAL;
      bez potwierdzonego wakatu programistycznego/warunków. Oba kod PASS,
      review COMPLETED/supported=true/issues=[], bez problemów powiązań.
      Status NEEDS_REVIEW zachowany, nie udzielono zgody na wysyłkę.
      NO_PROJECT_MATCH oznacza brak wybranego projektu w kontekście tych
      generacji; pełny profil nadal ma 9 APPROVED faktów i 3 projekty.
- [x] Pełne wiadomości, literalne dowody kontaktów, źródła, ostrzeżenia
      i audyt poza Git. Spójne backupy przed/po, integrity=ok, FK=0,
      chronione tabele/stan i stare szkice/materiały bez zmian. Pięć dawnych
      SELF_TEST/outbox/usage, shared, profil/CV/hash i granica zachowane;
      fingerprint 134 plików kodu zgodny. Końcowo zatrzymany RESEARCH_ONLY,
      bez aktywnych runs/jobs, blokada profilu zwolniona.

## Pokrycie biblioteki szkicami — audyt 15 października 2026

- [x] Wyjaśniono stan 114 firm / 85 kontaktów / 50 szkiców przez readonly
      SQLite i istniejące walidatory. 29 firm bez zapisanego emaila. Wśród
      35 firm z kontaktem, lecz bez szkicu: 25 nie przechodzi kwalifikacji
      kontaktu/podstawy zapytania, 8 ma odrzuconą analizowaną ofertę,
      2 przechodzą obecne kontrole wstępne. GENERAL nie jest sam w sobie
      wykluczony. Prywatne szczegóły poza Git, bez zmian danych i kodu.
- [x] Późniejsze zlecenie użytkownika: ponowna weryfikacja i generowanie
      dla tych dwóch firm zakończone; szczegóły w sekcji powyżej. Pierwotnej
      przyczyny pominięcia nie ustalono; nie przypisywać jej arbitralnie
      błędowi kontaktu lub odmowie. Nowe szkice nie są zgodą na wysyłkę.

## Dwie zatwierdzone próby Gmaila — 15 października 2026

- [x] Po osobnej zgodzie użytkownika wykonano na domowym Windowsie dwa
      SELF_TEST do dwóch wskazanych adresów, z dotychczasowym nadawcą,
      dokładną przejrzaną treścią i zatwierdzonym PDF. Świeży podgląd każdej
      próby sprawdzono z zaakceptowanym zestawem; prywatne podglądy i wyniki
      poza Git. Istniejące połączenie OAuth, bez nowego logowania/uprawnień.
- [x] Obie próby SENT_CONFIRMED po celowanym odczycie właściwych wiadomości
      w Wysłanych, bez odczytu historii firm lub innych wiadomości. Brak
      ponowień POST; 3 wcześniejsze próby zachowane, łącznie 5 outbox/attempts/
      usage, dzienne użycie 0 → 2 bez resetu. Biblioteka nadal 114/85/50.
      Spójne backupy przed/po, integrity=ok, FK=0, dawne rekordy nienaruszone,
      profil v4/9 faktów/CV/hash i blokady zachowane, fingerprint 134 zgodny.
      Końcowo RESEARCH_ONLY, stopped=true, senderPaused=true, bez aktywnych
      runs/jobs lub nierozstrzygniętego outbox; blokada profilu zwolniona.
- [x] Użytkownik potwierdził wynik: jeden odbiorca WP — Odebrane, jeden
      odbiorca Gmail — Spam; CV otwiera się poprawnie u obu. Wyniki zapisane
      w prywatnym raporcie jako zgłoszenie użytkownika, bez odczytu skrzynek.
- [ ] Wyjaśnić nadal występujący spam w Gmailu przed oceną pilotażu do firm.
      Wynik mieszany nie potwierdza rozwiązania problemu ani jego przyczyny.
      Brak dodatkowych wysyłek, zmian OAuth/bazy lub zgody na AUTO_POLICY.

## Nocny RESEARCH_ONLY w głównej bazie — 14/15 października 2026

- [x] Użytkownik jawnie zlecił 8 godzin szukania kolejnych firm i zapisu
      kontaktów/wiadomości bezpośrednio w głównej bibliotece, bez Gmaila/send.
      Przed startem: 74 firmy, 52 kontakty, 31 szkiców; spójny SQLite backup
      poza Git, integrity=ok i 51/51 tabel zgodnych, pełna historia zachowana.
      WORKSTATION/LOCAL_ONLY sprawdzone, brak aktywnych operacji; profil v4,
      9 APPROVED faktów i zatwierdzone CV/hash zgodne. Kod/build bez zmian.
- [x] Natywny CLI i wyszukiwarka probe PASS na Windowsie. Uruchomiono istniejącą
      sesję `startDay(...,8)`: **14 października 20:36:03 → 15 października
      04:36:03 Europe/Warsaw**, stały deadline, kierunki co godzinę,
      maxCycles=null. Nowe kierunki preferują kolejne firmy oraz publiczne
      kontakty do pracy; ograniczenia kandydatów/cyklu i 3 szkiców/cyklu
      zachowane. To pełna sesja aplikacyjna, bez godzinnego kontrolera prób.
      Chroniona blokada jednego profilu, DisabledMailProvider, bez gateway.
- [x] Pierwszy odczyt zatrzymał start po **56,640 s** jako READER_ENVIRONMENT:
      launcher pominął wcześniejszą flagę Node `--use-system-ca`, trzy różne
      hosty zwróciły TLS_UNTRUSTED. Nie wyłączano TLS ani zabezpieczeń SSRF.
      Flaga jest obsługiwana przez zainstalowany Node; kontrola 3/3 publicznych
      stron READ, systemCA=true. W ramach bieżącego zlecenia ręcznie poprawiono
      launcher i kontynuowano ten sam checkpoint/sesję **20:42:49** z pierwotnym
      deadline 04:36:03. Nie resetowano historii błędów, liczników ani terminu.
      Nie była to nowa sesja lub automatyczne wznowienie po restarcie komputera.
      Początkowy raport/audyt zachowany oddzielnie poza Git. Ponowny odczyt
      działał; końcowy audyt tej sesji opisano poniżej, z zachowaniem przerwy.
- [x] Osobny lokalny proces zapisuje postęp/raport poza Git i kontroluje
      chronione tabele, stare wersje szkiców, materiały oraz termin końca.
      Wyniki zapisuje główna SQLite; nie będzie potrzebne kolejne scalenie.
      Bez autostartu/wznowienia po błędzie lub restarcie i bez zmian zasilania.
      Poranny powrót w tej rozmowie ustawiony na **15 października 07:00**;
      wcześniejszy godzinny monitor pozostaje PAUSED.
- [x] Koniec **15 października 04:36:04.011 — DEADLINE**: przedział
      8 h 0,271 s z tempem i przerwą naprawczą 5 min 48,968 s; **8/8 COMPLETED**.
      50 wpisów, 47 URL, 44 rekordy firm w zakresie; **40 nowych rekordów firm,
      33 kontakty (32 adresy nowe względem wcześniejszej biblioteki),
      19 nowych wiadomości**. Główna baza: **114 / 85 / 50**. Cztery znane
      firmy odwiedzone ponownie, dwie stare wiadomości nie doliczone do nowych.
      Trzy odłożenia wróciły; na końcu brak aktywnego researchDeferred.
- [x] Poranny niezależny audyt readonly: 47/47 pełnych analiz i 19/19 nowych
      szkiców PASS, review supported=true, issues=[], powiązania poprawne.
      Wszystkie wcześniejsze tematy/treści i wersje zachowane; jedno odświeżenie
      powiązania dopisało wersję 2 bez zmiany tekstu i z zachowaniem wersji 1.
      Profil/9 faktów/CV/hash, historia/blokady/granica, 3 SELF_TEST/outbox/usage
      i shared bez zmian; integrity=ok, FK=0, oba backupy 51/51 tabel zgodnych,
      fingerprint 134 plików kodu zgodny. PID zakończone, stopped=true,
      DAY_FINISHED, brak aktywnych runs/jobs. Bez Gmaila, OAuth, send lub Start.
- [x] Pełny prywatny raport 44 rekordów firm, kontaktów/dowodów, 19 nowych
      dokładnych wiadomości i dwóch starych, ostrzeżeń, pominięć i wszystkich
      błędów poza Git. Trzy przypadki NO_READABLE_SOURCE, siedem nieudanych
      źródeł (trzy TLS na starcie, dwa HTTP 526, ACCESS_BLOCKED i 404), zero
      błędów modelu i końcowych błędów cyklu. 89 wywołań w cyklach + 2 probe.
      Nie zaliczać planowanych przerw do ciągłej pracy obliczeniowej.
- [x] Końcowy raport przygotowany; poranna automatyzacja ustawiona PAUSED
      i zapis potwierdzony. Godzinny monitor również pozostaje PAUSED.
- [x] Późniejszy research 15 października potwierdził wspólnego administratora
      i adres tej pary. Jeden szkic pod istniejącym rekordem; oba rekordy
      i historia zachowane. Uporządkowanie reprezentacji przed wysyłką
      pozostaje zadaniem z najnowszej sekcji. 40 oznacza przyrost rekordów.
      Nowe kontakty: 22 GENERAL, 6 RECRUITMENT, 4 UNKNOWN, 1 SALES; ostatnich
      pięć nie jest dopuszczonych do wysyłki. 19 nowych szkiców: 16 GENERAL,
      3 RECRUITMENT. Gmail/pilot nadal wymagają osobnego uzgodnionego kroku.

## Scalenie wyników do głównej biblioteki — 14 października 2026

- [x] Na wyraźne polecenie użytkownika scalono wyniki krótkiej i godzinnej
      próby: **14 nowych firm, 12 kontaktów GENERAL, 8 dokładnych szkiców**.
      Główna baza: **74 firmy, 52 kontakty, 31 szkiców**; 51 nowych źródeł,
      dowody, kwalifikacje, wersje i powiązania materiałów zachowane.
      Import ograniczony do siedmiu zakończonych przebiegów i ich firm;
      nie zastąpiono bazy pełną kopią diagnostyczną.
- [x] Po Stop i potwierdzeniu braku aktywnych operacji użyto blokady profilu
      oraz spójnego SQLite backup API. Przed zapisem sprawdzono scalenie
      na kopii, ponowny import bez zapisów, rollback po wymuszonym błędzie
      oraz odrzucenie konfliktu bez częściowego zapisu. Następnie jedna
      transakcja w głównej bazie; backup po i 51/51 tabel zgodnych,
      integrity=ok, foreign_key_check bez naruszeń, brak duplikatów.
- [x] Wszystkie 17 analiz i 8 wiadomości zweryfikowane istniejącym kodem,
      bez modelu/sieci. Tematy, treści, hashe, wersje i NEEDS_REVIEW bez zmian.
      Dawne rekordy zachowane; jedyny wcześniejszy wpis pomocniczy zmieniony
      to porządek analiz 79 → 91, bez zmian liczników maili/granicy kampanii.
      Chronione tabele, profil/9 faktów/CV, historia/blokady i 3 SELF_TEST
      bez zmian. Obie bazy źródłowe pozostały nienaruszone.
- [x] Pełny prywatny raport firm/kontaktów/wiadomości oraz audit i backupy
      poza Git. Kod aplikacji/generatora/schemat bez zmian; fingerprint kodu
      zgodny z wcześniejszym Windows check. Stan stopped=true, RESEARCH_ONLY;
      bez Gmaila, tokenu panelu, OAuth, nowych sesji lub wysyłek.
- [x] Dalszy research jawnie zlecony jako powyższa nocna sesja 8 h. Gmail i pilotaż
      odłożone przez użytkownika do rozwiązania dostarczalności; brak
      automatycznej wysyłki do zgromadzonej biblioteki. Przed przyszłym
      pilotażem aktualne źródła/kontakty, celowana historia na odrębną zgodę
      oraz konkretny podgląd/zgoda na SELF_TEST i pilotaż. AUTO_POLICY wyłączone.

## Dwie poprawki po krótkiej próbie — 14 października 2026

- [x] Zwykłe „inne pytania”/„other questions” na GENERAL zachowują
      GENERAL_INQUIRY. Pytania o rekrutację i pytania na RECRUITMENT nadal
      nie upoważniają do aplikacji z CV. Komunikat nie nazywa GENERAL adresem
      rekrutacyjnym. Odmowy, kanały, SALES i dowody bez obejścia; polityka
      analizy v8 wymaga ponownej kwalifikacji starego pakietu. Styl bez zmian.
- [x] Standardowy raport TXT/JSON zawiera zapisane ostrzeżenia właściwego
      szkicu i konkretny wynik oceny przeznaczenia kontaktu. Regresja sprawdza
      dokładny temat/treść, zakres jednej sesji, brak obcych ostrzeżeń i zero
      zapisów w SQLite przez raport. Powtórzony prywatny eksport starej próby
      ma oba dokładne teksty i wszystkie zastrzeżenia.
- [x] Cztery nowe regresje: trzy wykazały FAIL przed zmianą, potem celowany
      zestaw 41/41 PASS; przypadki odmowy/sprzedaży/kanału pozostają blokowane.
      Zapisany rzeczywisty przypadek przeliczony w pamięci na readonly SQLite,
      bez modelu/sieci/zmiany rekordu, potwierdza GENERAL + COMPANY_INQUIRY.
- [x] Przed zmianami brak aktywnego backendu i spójny readonly SQLite backup
      API poza repo, integrity=ok. Odczyt wyłącznie lokalnych metadanych Gmaila
      potwierdził zapisane konto i wcześniejsze zakresy; bez skrzynki, OAuth,
      zmiany nadawcy, sekretów lub nowej wysyłki. Dane nadawcy poza Git.
- [x] Końcowy pełny `npm run check` na Windowsie: **461/461 backend,
      12/12 performance Stop, 15/15 UI**, typecheck/build PASS, exit 0.
      Fingerprint 134 plików zgodny; doctor DEVELOPMENT/DEMO PASS.
      Wszystkie 51 tabel oryginalnej SQLite bez zmian, zatwierdzone materiały
      i CV/hash zgodne, 3 dawne próby/outbox zachowane. Pierwsza próba wykryła
      brak deklaracji typu nowego pola warnings; poprawiono typ i uruchomiono
      pełne ponowienie. Nie zaliczać przerwanej próby jako PASS.
- [x] Po check uruchomiono osobną godzinną diagnostykę RESEARCH_ONLY na aktualnej
      kopii zatwierdzonych materiałów i historii. Do 6 cykli co 10 minut,
      do 2 kandydatów i 1 szkicu/cykl, stały deadline; kolejne procesy jawnie
      uruchamiane przez kontroler testu po Stop, bez samoczynnego wznowienia.
      Sprawdzono odłożenia, deduplikację, restart procesów i chronione tabele.
      Wynik dotyczy ograniczonego testu z kontrolerem, nie natywnej sesji 8 h.
- [x] **Koniec 19:15:02 Europe/Warsaw — DEADLINE**, od 18:15:02,
      60 min 0,337 s z przerwami zgodnymi z tempem. Search probe PASS,
      **6/6 cykli COMPLETED, 12 wpisów, 9 różnych firm, 6 nowych szkiców**.
      Zero błędów źródeł/modelu/cykli. Trzy odłożone firmy wróciły i dostały
      szkic z tymi samymi źródłami bez ponownej ekstrakcji; jedna pozostaje
      BUDGET_DEFERRED z ostatniego cyklu. Dwie pominięte: NO_CONTACT i brak
      zaakceptowanej podstawy działalności. Brak podwójnych szkiców/domen.
- [x] **7/7 procesów** (probe + 6 cykli) potwierdziło stopped/paused oraz
      bezczynność po otwarciu przed jawnym startem; po cyklach Stop/zakończenie.
      DisabledMailProvider, bez gateway/Gmaila/wysyłki. **6/6 szkiców** kod PASS,
      review COMPLETED, supported=true, issues=[], powiązania i kod ponownie
      sprawdzone readonly. 51 tabel oryginalnej SQLite oraz chronione tabele
      kopii bez zmian; 3 dawne próby/outbox/liczniki, Fingoweb i granica zachowane.
      Profil/9 faktów/CV zatwierdzone, SHA obu PDF zgodny; spójny końcowy backup
      integrity=ok i wszystkie tabele zgodne. Fingerprint 134 plików bez zmian.
- [x] Pełne dokładne wiadomości, wszystkie firmy/pominięcia/zastrzeżenia,
      źródła, logi i audyt zapisano poza Git; raport zweryfikowany z 6 szkicami.
      Monitor „Raport godzinnego testu JobHunter” po końcowym raporcie ustawiono
      PAUSED i potwierdzono zapis. Procesy zakończone; zero nowego Start.
- [ ] Po wznowieniu etapu Gmaila przez użytkownika wrócić do SELF_TEST i pilotażu: konkretny podgląd
      nadawcy/odbiorcy/tekstu/CV i osobna zgoda na wysyłkę; celowana historia
      firm także wymaga zapisanej zgody. AUTO_POLICY pozostaje wyłączone.

## Krótki publiczny test nowej wersji — 14 października 2026

- [x] Na wyraźne zlecenie rzeczywista próba Windows RESEARCH_ONLY: do 5 firm
      i 15 minut, zatwierdzony profil v4 i 9 faktów, bez Gmaila/wysyłki.
      Spójna osobna kopia pełnej aktualnej SQLite i zatwierdzonego PDF poza repo;
      oryginalne materiały, historia, blokady i liczniki niezmienione.
- [x] Wyszukiwarka PASS; 5 nowych firm, 2 pełne nowe szkice, cykl COMPLETED
      w 5 min 34 s. Zero błędów modelu/pobierania. Wszystkie analizy, literalne
      emaile, historia i deduplikacja sprawdzone; oba szkice kod PASS, review
      COMPLETED, bez nieaktualnego powiązania materiałów. Program zatrzymany.
      Pełne teksty, przyczyny pominięcia, źródła i ostrzeżenia w prywatnym raporcie.
- [x] Doprecyzować komunikat QUESTIONS_ONLY: rzeczywisty adres GENERAL opisany
      jako „Inne pytania” dostał błędny opis „Adres rekrutacyjny”. Przejrzeć
      zakres tej klasyfikacji na fikcyjnej regresji; zachować blokadę do
      rozstrzygnięcia, bez zgadywania przeznaczenia lub automatycznej promocji.
      W tej próbie kod/generator nie były zmieniane.

## Wdrażanie poprawek researchu — 14 października 2026

- [x] Polecenie „działaj”: poprawki kodu z planu, bez Gmaila, rzeczywistej
      wysyłki lub kolejnego publicznego researchu. Potwierdzony brak aktywnego
      backendu przed zmianami; spójny backup oryginalnej SQLite wykonany przez
      natywne SQLite backup API z uchwytu readonly. Wszystkie tabele zgodne,
      integrity=ok, 3 dawne SELF_TEST/outbox/liczniki zachowane. Zero migracji.
- [x] Rozpoznawanie literalnych zaproszeń, CV/resume i pytań; negacja wymaga
      związku z zakazanym działaniem, więc „nie znalazłeś oferty, wyślij CV”
      nie jest odmową. Zmieniona wersja ekstrakcji wymaga aktualnej analizy,
      bez automatycznej promocji starego UNKNOWN lub samego prefiksu adresu.
- [x] Trwałe odłożenie szkicu z przyczyną i powrót w następnym uprawnionym
      cyklu. W RESEARCH_ONLY kwalifikacja małej paczki przed generowaniem,
      pierwszeństwo właściwej rekrutacji i jedno miejsce dla zaległej firmy.
      AUTO zachowuje własną ograniczoną, wznawialną kolejkę. Bez outboxu w researchu.
- [x] Wspólna ocena intencji: GENERAL przy ACTIVE/OPEN pozostaje zapytaniem.
      Niedopasowane ACTIVE może mieć osobne zapytanie tylko z niezależną
      aktualną podstawą działalności i dopuszczonym kontaktem; pierwotny typ,
      warunki i odrzucenie dopasowania zachowane. Odmowy/kanały bez obejścia.
- [x] Świeżo sprawdzone NEW w kontekście wyszukiwarki, pomiary HTTP/cache/
      przekierowań/bajtów, cooldown SIZE_LIMIT, jawne ponowienie i znana
      literalna podstrona zamiast za dużej strony. Minimalna diagnostyka
      UNVERIFIED_COMPANY z wynikiem/cytatem/hashem; bez osłabienia dowodów.
- [x] Sesja 8 h do deadline, osobna przyczyna końca i zatrzymanie także
      podczas operacji. Częściowy ukończony cykl ma finished_at; częściowa
      kolejka AUTO z PENDING zachowuje wznawialny charakter. TXT/JSON w panelu,
      atomowy prywatny zapis/backup oraz `research:report` z readonly SQLite.
      Panel pokazuje czas kolejnego kierunku i zapisany raport, bez autostartu.
- [x] Regresje na fikcyjnych danych: kontakt/cel/odmowa, dwa cykle i cache,
      zmieniony profil, historia, ranking, deadline w trakcie pracy, cooldown,
      dekompresja, PARTIAL/diagnostyka, NEW i alternatywne publiczne źródło.
      Celowany finał: 20/20; wcześniejszy szeroki zestaw 131/131. Styl zachowany.
- [x] Pełny końcowy `npm run check` na fizycznym Windowsie: **457 backend,
      12 performance Stop i 15 UI PASS**, typecheck/build PASS, bez pominięć.
      Kod użyty przez check zgodny z zapisanym fingerprintem 134 plików.
      Wcześniejsze uruchomienia przerwano świadomie przed końcem po przeglądzie/regresjach;
      nie stanowią zaliczonego pełnego check. Backend 456/457 ujawnił regresję
      oddzielenia odrzuconej oferty od podglądu zapytania; naprawiono ją bez
      zmiany oczekiwań planera. Celowany finał 79/79 PASS. Wynik pełnego
      ponowienia zapisany; wcześniejszy FAIL pozostaje w raporcie.
- [x] Doctor DEVELOPMENT/DEMO PASS (Windows/Node/SQLite/CLI/build), diff check
      PASS. Wszystkie tabele oryginalnej bazy identyczne z backupem, integrity=ok;
      9 faktów APPROVED, PDF zatwierdzony i SHA zgodny. Prywatny backend nie
      działa, historia/nadawca/OAuth/liczniki bez zmian. CLI eksportu sprawdzony
      rzeczywistym procesem na fikcyjnej SQLite: pełny tekst i zero zmian
      wszystkich tabel. Następny publiczny test i Gmail/pilot są osobno zlecanymi
      operacjami.

## Plan poprawek po nocnym teście — 14 października 2026

- [x] Na zlecenie użytkownika przeanalizować raport, 22 pełne wiadomości,
      kwalifikacje i publiczne źródła oraz kod. Spójny końcowy backup otwarto
      tylko do odczytu. Dwie błędne klasyfikacje przeznaczenia kontaktu
      odtworzono istniejącym `validateAnalysis` w pamięci, bez modelu/sieci.
      Szczegółowa analiza i plan zapisane obok prywatnego raportu poza repo;
      kod aplikacji, baza, materiały, nadawca i uprawnienia bez zmian.
- [ ] **Etap A — poprawne kontakty i dokończenie szkiców.** W `contracts.ts`
      rozszerzyć rozpoznawanie literalnych zaproszeń dotyczących pracy o dwa
      odtworzone warianty językowe. Ujednolicić klasyfikację i `contactUsage`,
      rozróżniając aplikację z CV, kontakt o pracy i pytania. Zachować odmowy,
      GENERAL/SALES i wykluczone cele; sam prefiks adresu nie dowodzi rekrutacji.
      Regresje na syntetycznych cytatach dodatnich i przeciwnych przykładach.
- [ ] W `service.ts` rozdzielić ponowne użycie analizy od ukończenia szkicu.
      Obecne `reuseResearchItem` może zakończyć pozycję bez szkicu (`!d`),
      choć wcześniejszy cykl pominął generowanie po limicie trzech, a nowy
      ma wolny budżet. Zapisać przyczynę pominięcia i zachować odłożoną pracę
      badawczą; odrzucenie/blokada nie jest kolejką do ponownej generacji.
      Sprawdzić nowy profil/źródło/kontakt, zachować teksty i historię wersji.
- [ ] W małej paczce wybierać szkice po kwalifikacji: dopasowanie zadań,
      dowody i właściwy kanał rekrutacji, ze sprawiedliwą obsługą zaległych.
      Limit operacji nie może gubić kwalifikacji ani kończyć całej AUTO_POLICY.
      Regresja: brak miejsca w pierwszym cyklu, cache i wolne miejsce w drugim
      dają jeden szkic bez ponownej ekstrakcji; blokady nadal uniemożliwiają go.
- [ ] **Etap B — trafniejsze odkrywanie i diagnostyka.** Ujednolicić ocenę
      intencji podglądu RESEARCH_ONLY z istniejącym `contactEligibility`, bez
      przełączenia trybu lub nadawania zgody. GENERAL przy OPEN/ACTIVE nadal
      wymaga właściwej podstawy/celu, a wymagany formularz lub odmowa blokują.
      Zachować oryginalną ofertę i warunki; nie zmieniać jej na PROSPECT.
- [ ] Dodać kontekst świeżo sprawdzonych domen niezależny od historii kontaktu;
      obecny SEARCH pomija firmy NEW w liście już sprawdzonych. Korzystać
      z istniejącej normalizacji/cache/plannera, dopuszczając istotny nowy dowód
      lub potrzebę lepszego kontaktu. Powtórzenie discovery nie jest blokadą
      firmy w historii wysyłek. W próbie 14 dodatkowych powrotów / 77 wpisów.
- [ ] Dodać diagnostykę rozmiaru HTTP i minimalną diagnostykę
      UNVERIFIED_COMPANY analogiczną do istniejącej dla tytułu. Zapisane dane
      nie pozwalają ustalić dokładnego powodu dwóch odrzuconych nazw.
      Nie osłabiać literalnego dowodu lub dopisywać aliasów przez domysł.
      Dla SIZE_LIMIT najpierw pomiar, ograniczony techniczny cooldown i próba
      znanej literalnej podstrony w małym budżecie; bez uciętego READ lub
      podnoszenia limitu 1 MiB w ciemno. Zachować TLS/SSRF i blokady celu.
- [ ] **Etap C — sesja czasowa i raport.** „8 godzin” ma oznaczać deadline
      przy ustalonym tempie, bez ukrytego końca po ośmiu cyklach. Osiem cykli
      może być osobną jawną opcją. Pauza nie odnawia czasu, restart nie wznawia,
      brak kierunków/limit ma własną przyczynę zakończenia. AUTO_POLICY nadal
      bez odziedziczonego deadline; test godzinny zachowuje swój jawny budżet.
- [ ] Zapisywać `finished_at` dla zakończonego PARTIAL, odróżnić sesję/cykl,
      źródła/HTTP/cache i skorelowane błędy. Standardowy eksport poza repo
      ma obejmować pełne teksty/wersje/dowody/warunki oraz powody braku szkicu.
      Panel po ponownym otwarciu pokazuje ostatni raport i stan zatrzymany,
      bez autostartu. Zachować obecny opis oczekiwania na kolejny kierunek,
      dodać jego termin i datę ostatniego postępu. Atomowy raport i spójny backup.
- [ ] Po etapach regresje na fikcyjnych danych i `npm run check` na Windowsie;
      deadline testować kontrolowanym zegarem. Następnie osobno zlecona krótka
      próba publiczna w nowej diagnostyce, przed ewentualnym następnym testem
      nocnym. Mierzyć nowe firmy, właściwe kanały i ukończone szkice, bez
      obietnicy liczby pasujących ofert. Przed deploymentem standardowy Stop,
      zakończenie operacji, backup/build/doctor i zatrzymany backend.
- [ ] Gmail/pilot pozostają oddzielnym etapem z konkretnymi zgodami; nocny
      test nie wyjaśnia spamu. Zachować generator, styl, zatwierdzone materiały,
      nadawcę, OAuth i historię. Nie wykonywać kolejnego researchu lub wysyłki
      w ramach samego planowania. Wdrożenie kodu i jego weryfikacja opisane
      powyżej; nowa rzeczywista sesja nadal wymaga świadomego Start.

## Nocny RESEARCH_ONLY — 13/14 października 2026

- [x] Użytkownik jawnie zlecił jedną sesję 8 godzin, najpierw test wyszukiwarki,
      bez Gmaila/wysyłki; rano pełny raport firm, wiadomości i błędów.
- [x] Rzeczywisty Windows: doctor/build dostępny, historia integrity=ok,
      trzy wcześniejsze SELF_TEST zachowane, niepewne próby 0, spójny backup.
      Istniejący probe('search') potwierdził zdarzenie web_search i oficjalną
      stronę wydań Node.js; searchCapability READY dla obecnej konfiguracji CLI.
- [x] Istniejący backend/ResearchJobHunter uruchomiony w WORKSTATION/RESEARCH_ONLY
      prywatnym bootstrapem, bez zmiany kodu produktu/generatora/builda. Start
      13 października 22:32:16 Europe/Warsaw, planowany koniec 14 października
      06:32:16; do 8 małych cykli, co około godzinę. Transport DisabledMailProvider,
      bez Gmail gateway lub sekretów Google. Standardowy panel/Stop dostępny.
      Ukryty Start-Process odrzucony przez politykę poleceń; zamiast niego
      kontrolowana, utrzymywana sesja terminala. Brak zmian zasilania/autostartu.
- [x] Początkowe health=ok i żywy proces; stan EXTRACT, pierwszy rzeczywisty
      szkic, 10 kandydatów. Raport poza repo aktualizowany co 30 s, w razie
      zakończenia/Stop/błędu zachowuje wynik i backup, bez automatycznego wznowienia.
      Hashe historii/prób/liczników/materiałów/granicy kampanii identyczne; nowych
      send_attempts 0. Raport i logi prywatne, bez publikacji firm/treści.
- [x] Jednorazowy poranny powrót do tego czatu zaplanowany na 14 października
      07:00 Europe/Warsaw. Czyta tylko wyniki tej próby; bez Gmaila lub nowego Start.
- [x] Sesja zakończyła się sama jako DAY_FINISHED o 14 października 05:39:53
      Europe/Warsaw po 8 cyklach: 6 COMPLETED, 2 PARTIAL. Rzeczywisty czas około
      7 h 8 min, nie pełne osiem godzin. Raport i spójny backup powstały przed
      restartami systemu około 05:45/05:46; User32 1074 wskazuje TrustedInstaller
      i zaplanowaną aktualizację. Restart nie przerwał researchu; backend nie działa.
- [x] Końcowa próba: 77 rekordów kandydatów / 63 różne URL, 58 firm,
      21 nowych szkiców i 1 ponownie użyty (22 pełne wiadomości w raporcie),
      222 źródła i 110 wywołań modelu. 11 zapisów błędów: 4 UNAVAILABLE,
      2 UNVERIFIED_COMPANY, 5 SIZE_LIMIT; część to dwa etapy tego samego problemu.
      Model errors 0. Powrót do 10 URL daje 14 dodatkowych rekordów kandydatów;
      w zestawie szkiców brak powtórzonych firm lub odbiorców.
- [x] Read-only kontrola po restarcie: 22/22 kod/semantyka/literalny kontakt/
      powiązania materiałów PASS, bez STALE/UNVERIFIED. 21 GENERAL i 1 RECRUITMENT;
      warunki pracy nadal wymagają potwierdzenia. Baza i końcowy backup integrity=ok,
      hashe chronionej historii/prób/liczników/materiałów/granicy identyczne,
      Fingoweb blokowany. Nowych send attempts 0, poczty nie odczytywano.
- [x] Pełny końcowy raport przygotowano poza repo przy powrocie użytkownika
      po restarcie; zawiera listę firm, dokładne wiadomości, kontakty/dowody,
      warunki, odrzucenia, powtórzenia i błędy. Poranny heartbeat wyłączony (PAUSED)
      po wykonaniu jednorazowego raportu. Nie wznawiano testu/Start ani Gmaila.
- [ ] Dalsza ocena wyników i decyzja o ewentualnym kolejnym etapie; problem
      dostarczalności nadawcy i wymagane zgody na historię/pilot pozostają odrębne.
      Nie uznawać szkiców z RESEARCH_ONLY za zatwierdzenie wysyłki lub pełnych 8 h pracy.

## Przygotowanie domowego Windowsa — 13 października 2026

- [x] Czysty, nieaktywny checkout: fetch i fast-forward `2aa3a1e` → `ed23d96`;
      upstream zgodny. Diagnostyka hosta nie wykryła backendu JobHuntera ani
      katalogu produkcyjnego. Sandbox przekierowuje LOCALAPPDATA, dlatego
      diagnostyka historii użyła jawnej ścieżki rzeczywistego profilu Windows.
- [x] Node 24.19.0, npm 11.17.0, Codex CLI 0.162.0-alpha.17.2;
      npm ci/build/doctor PASS. Instalacja w sandboxie miała DNS ENOTFOUND;
      instalacja tego samego lockfile przez sieć hosta zakończona poprawnie.
- [x] Istniejący reader-preflight z --use-system-ca: 3 niezależne READ/HTTP 200,
      4 żądania z przekierowaniem, bez wyłączania TLS/SSRF. Probe ChatGPT/JSON
      i rzeczywisty web search PASS. Jedna publiczna ekstrakcja/kwalifikacja
      strony Node.js w izolowanej diagnostyce syntetycznej, bez szkiców/poczty.
- [x] Aktualny CSV i wskazany PDF znalezione poza repo; SHA PDF zgodny
      z propozycją. Podgląd CSV poprawny, tylko scalenie z blokadą Fingoweb;
      podczas podglądu zero zapisanych rekordów i dawnych propozycji, bez targetu.
- [x] Pełny npm run check na fizycznym Windowsie PASS, exit 0: typecheck/build,
      434 backend, 12 performance Stop, 15 Playwright. Fikcyjne providery i dane.
- [x] Użytkownik potwierdził utworzenie wskazanej nowej bazy i import wyłącznie
      dokładnego CSV/hashu z prywatnego podglądu. Bez zgody na WORKSTATION lub send.
- [x] Po PASS check wykonano zatwierdzone history:new initialize z dokładnym
      hashem, history:local doctor oraz osobny backup. Jeden ręczny rekord,
      Fingoweb zablokowany, LOCAL_ONLY, stopped=true, gmailSenderPaused=true;
      próby/outbox/usage/shared/auto sessions 0, niepewnych prób 0.
      Oba spójne backupy: integrity=ok, zgodne liczniki i granica kampanii.
- [x] Po osobnej zgodzie wykonano dokładny configure
      --confirm-new-campaign-history --single-workstation istniejącym helperem.
      WORKSTATION ma zakres nowej kampanii, bez deklaracji kompletnej listy
      dawnych kontaktów i bez odnowienia granicy lub uprawnienia do send.
- [x] Odtworzony blocker konfiguracji: subset bez domyślnego projektu dawał
      INVALID_FACT. Opisy projektów poza wybranym zestawem pozostają DEFERRED,
      poza modelem/aprobatą/smoke, bez kasowania; jawny późniejszy wybór → DRAFT.
      Fakty osobiste/dostępność nadal wymagane. Typecheck i 46 testów celowanych PASS.
- [x] Po dodatkowym backupie przygotowano 9 aktualnych faktów DRAFT, trzy projekty,
      FixDesk odłożony i zweryfikowany PDF jako niezatwierdzona niezmienna kopia.
      Bez dodatkowych faktów o egzaminach/praktykach, bez edycji PDF. Historia
      i granica kampanii bez zmian; native Gmail nieinicjalizowany, outbox/próby 0.
- [x] Nowy pełny check Windows po poprawce zakresu PASS, exit 0:
      439 backend / 12 performance Stop / 15 UI, typecheck/build.
- [x] Wychodzące 7 plików sprawdzone, commit/push `6409e09`, zdalny ref zgodny.
      Doctor WORKSTATION/RESEARCH_ONLY PASS, jawny katalog i system CA.
      Standardowy helper uruchomił backend/panel; health=ok, stopped=true.
      Odczyt SQLite po starcie: 9 DRAFT, 1 DEFERRED, CV niezatwierdzone,
      Fingoweb zablokowany, próby/outbox/usage/auto sessions 0.
- [x] Użytkownik potwierdził widoczność panelu w domyślnej Operze GX po otwarciu
      przez Windows. Odmówił przekazywania tokenu do Codexa; tej ścieżki nie użyto.
      Sam zatwierdził profil i osobno CV. Host read-only potwierdził 9 APPROVED,
      approved_at profilu/PDF i zgodność SHA; FixDesk nadal DEFERRED, program Stop.
- [x] Jedyny approved-profile smoke na fizycznym Windowsie: 5 firm / 25 stron,
      4 szkice i 4 pełne kontrole PASS, 1 pominięcie SALES/zamaskowanego emaila.
      Exit 0, czas 6 min 47 s, system CA; izolowany DisabledMailProvider, bez Gmaila.
      Brak błędów modelu/elementów/walidacji; dwie read-only kontrole tych samych
      źródeł bez DRAFT_MATERIAL_STALE. Brak duplikatów domen/firmowych szkiców.
      Fingoweb blokowany rzeczywistą funkcją historii; 11 tabel produkcyjnych
      identycznych przed/po, granica kampanii zachowana, outbox/próby/auto sessions 0.
- [x] Prywatny raport poza repo zawiera pełne 4 wiadomości, źródła i plan 3 firm
      co 5 minut, bez kolejki. GENERAL zachowany jako GENERAL, bez udawania wakatu.
      Gmail/status: lokalna instalacja nie ma podłączonego konta; bez odczytu
      magazynu sekretów lub skrzynki. Nie zmieniono kodu ani aktywnego builda.
- [x] Na nową decyzję użytkownika wybrano prywatnie nadawcę i odbiorcę SELF_TEST
      oraz inne trzy priorytetowe firmy. Sześć publicznych stron odświeżonych
      obecnym PublicSourceReader na Windowsie: 6 READ/HTTP 200, system CA,
      bez modelu/Gmaila. Wstępnie dwa kontakty RECRUITMENT i jeden nadal GENERAL;
      pełna zdalność jednej firmy zależy od roli, 20 h nadal do potwierdzenia.
      Lokalne nazwy/domeny/aliasy bez dopasowań; nie oznacza to pustej historii Gmaila.
      Trzy wcześniejsze wiadomości zachowane i porównane dokładnie, bez zmian generatora.
- [x] Użytkownik osobno zatwierdził drugi klucz istniejącego klienta Desktop
      i przyszłe połączenie wskazanego konta ze scopes identity/send/readonly.
      Google Cloud po logowaniu potwierdził istniejący projekt i typ klienta.
      Jednorazowy klucz utworzony, stary nadal aktywny; JSON nie został zapisany:
      download timeout, ręczne pobranie też nieskuteczne, clipboard API puste.
      Automatyczny reviewer odrzucił szerszy odczyt schowka przed wykonaniem;
      potem przeglądarka zablokowała dostęp do domeny po odmowie zgody. Bez obejścia.
      Powstał wyłącznie prywatny szablon JSON i propozycja treści testu, nie frozen preview.
- [x] Użytkownik dostarczył rzeczywisty Desktop JSON po ręcznej operacji w Operze.
      Typ/klient/projekt zgodne; sekret nie trafił do modelu lub Git. Połączenie
      wskazanego konta z uzgodnionymi scopes zakończone i potwierdzone przez użytkownika.
      Stock opener explorer.exe zwracał exit 1 na Windowsie; prywatny adapter użył
      istniejącego connectGoogle i standardowego ShellExecute, bez zmiany kodu produktu.
      Ten krok nie odczytał poczty ani nie wysłał maila. Nie ponawiano zablokowanego
      dostępu do Google Cloud lub schowka; metadane i zgody tylko w prywatnym raporcie.
- [x] Stop backendu → spójny backup/doctor PASS → jeden publiczny import URL
      i zwykły szkic produkcyjny istniejącym RESEARCH_ONLY z wyłączoną pocztą.
      COMPLETED/DRAFTS_READY, semantic review PASS, material issues puste.
      Bez zmiany generatora; historia, blokady i granica kampanii zachowane.
- [x] Istniejący GmailJobHunter/WORKSTATION przygotował dokładny SELF_TEST z CV
      w zatrzymanym APPROVAL_REQUIRED. Wszystkie 9 faktów, profil i PDF zatwierdzone.
      Nadawca/odbiorca/cały tekst/CV/hash pokazane; użytkownik osobno zatwierdził
      jedną wysyłkę i celowane potwierdzenie tej próby w Wysłanych.
      Rzeczywisty Windows 21:12:14 Europe/Warsaw: SENT_CONFIRMED, jedna próba
      i rezerwacja, MIME zgodny z zatwierdzonym podglądem, CV bez zmian.
      Zero kontaktów z firmami lub odczytów ich historii. Sender ponownie Stop;
      granica, ręczna historia i suppressions identyczne; wykorzystanie 1/10 bez resetu.
      Końcowy doctor integrity=ok, niepewne próby 0; spójny backup po wysyłce.
      Trzy zachowane szkice i hash pierwotnego raportu ponownie porównane: bez zmian.
- [x] Odbiorca zgłosił Spam pierwszego SELF_TEST; otwarcie CV niepotwierdzone.
      Nie przypisano przyczyny generatorowi lub OAuth i nie zmieniono treści.
- [x] Po osobnej zgodzie i ukończeniu logowania połączono drugie wskazane konto
      tym samym klientem i zakresami. Nowy SELF_TEST preview zachował dokładny
      temat/tekst/CV; użytkownik osobno zatwierdził drugą próbę i jej Wysłane.
      Windows 21:25:11–21:25:13 Europe/Warsaw: SENT_CONFIRMED, jedna nowa próba
      i rezerwacja, pierwsza zachowana. Odbiorca potwierdził Odebrane i poprawne CV.
      Doctor integrity=ok, uncertain=0, spójny backup; wykorzystanie 2/10 bez resetu.
- [x] Pilotaż rozpoczęto wyłącznie celowanym publicznym importem: BizCode
      COMPLETED/DRAFTS_READY, kanał RECRUITMENT, zapisany szkic wersji 1.
      Prywatny helper raportu zapytał o nieistniejące research_items.draft_id;
      zakończył się po tym celu, bez dalszych firm. Dane w SQLite zachowane,
      program zatrzymany; to błąd raportu operacyjnego, nie generatora.
      Częściowy raport odtworzono read-only z zapisanych danych, bez reanalizy.
      Pytanie o celowaną historię trzech firm pozostało bez odpowiedzi; nie czytano Gmaila.
- [x] Na wyraźne polecenie powrót do pierwszego wskazanego konta istniejącym
      klientem i wcześniej zatwierdzonymi zakresami. OAuth 21:33:03 Europe/Warsaw,
      konto zgodne; użytkownik potwierdził zakończenie. Przygotowano nowy dokładny
      preview tej samej treści/CV; użytkownik w odpowiedzi jawnie wskazał nowego
      osobistego odbiorcę i polecił wysłać teraz. Poprzedni preview nie został wysłany.
- [x] Nowy podgląd z dokładnie wskazanym odbiorcą pokazany i zamrożony;
      jeden SELF_TEST 21:38:57–21:38:59 Europe/Warsaw, SENT_CONFIRMED.
      Odbiorca zgłosił Spam, CV otwiera się poprawnie. Obie wcześniejsze próby
      zachowane, tekst/temat/PDF identyczne, granica/historia/blokady bez zmian.
      Doctor integrity=ok, attempts=3, usage=3/10, uncertain=0, spójny backup.
      Program i sender Stop, firmowe wysyłki 0, AUTO_POLICY wyłączone.
- [ ] Aktualny następny krok: ocena wyników dostarczalności i decyzja użytkownika
      przed wznowieniem pilotażu lub następnym testem. Dwa testy pierwszego nadawcy
      trafiły do Spamu, jeden drugiego do Odebranych; przyczyna nieustalona.
      Nie zmieniać generatora ani resetować limitów. Pilot nadal wymaga osobnej
      zgody na celowaną historię konkretnych firm i dokładnego przeglądu do 3 maili.
- [ ] Poprawić stock opener helpera OAuth na Windowsie po wykazanym exit 1:
      oddzielna zmiana z fikcyjnym URL i regresją, po zakończeniu operacji/backupie.
      Nie ponawiać poprawnie zakończonego OAuth ani zmieniać scopes w ramach testów.
- [ ] Po udanym SELF_TEST zwykła kwalifikacja priorytetowych trzech firm,
      wymagane celowane sprawdzenie historii Gmaila z osobną zgodą oraz aktualność
      źródeł/materiałów. Konflikty przedstawić, nie obchodzić. Dopiero dokładny
      podgląd do 3 firm (RECRUITMENT/GENERAL, tempo/limity/CV/nadawca) i osobna zgoda
      na wysyłkę. SEND_UNKNOWN → Stop bez retry; pilot nie udziela zgody na ciągłą AUTO.
      Program Stop, wysłany wyłącznie jeden zatwierdzony SELF_TEST; firmowe wysyłki 0.

## Spójność dowodów — 13 października 2026

- [x] Znana oryginalna diagnostyka odczytana bez zmian; spójna read-only kopia przed
      migracją i replay. Nie szukano prywatnej historii, CV lub poczty.
- [x] GOTOMA: dokładnie odtworzony dawny hash. Ta sama firma/URL/wersje danych,
      inny contactUrl i kolejność source_ids → cache miss → EXTRACT → utrata inquiryBasis
      mimo companyActivities → nadpisanie qualification → prawidłowa blokada STALE.
- [x] PRODAUT: poprawne inquiryBasis było ignorowane przez PROSPECT, a typeProof nie
      pasował do reguły. Host/nazwa, aktualność, literalność i kontakt były potwierdzone.
- [x] Wspólny wybór dowodu z audytem sourceId/evidenceId/hash/parser/data/powód;
      GENERAL/kanał/konflikt/odmowy niezależne. Reuse bez zmiany materialBinding,
      rewizja identycznego tekstu z nową kontrolą, jedna trwała próba na wersję wejścia.
- [x] Starszy wynik nie nadpisuje nowszego; Stop/restart bez odnowienia prawa. Firma B
      obsługiwana podczas reanalizy A. Review_result zachowuje historyczny verdict.
- [x] Faktycznie sprawdzono 7 oryginalnych aktualnych kontekstów przed/po replay/restart,
      bez zmiany tekstów/wersji; reviewer replayu jest jawnie fikcyjny, nie nowy publiczny PASS.
- [x] Publiczny kod 7803b9d: GOTOMA i PRODAUT ze szkicami po rzeczywistym review,
      utrzymane po dalszych cyklach i restarcie. Dwa cykle ukończone, trzeci SEARCH
      CODEX_TIMEOUT; BLOCKED_EXTERNAL bez ponowienia/zmiany timeoutu/mock fallbacku.
      9.71 min / 29 HTTP czytnika / 14 modeli, 2 rzeczywiście nowe firmy, 1 wcześniejsza
      (Sprint0), 2 kontrole. Nowe firmy nie dały aktualnego szkicu w tym publicznym kodzie.
- [x] Po Stop cache-only powrót do obu kontroli na spójnej kopii z wyłączonym modelem
      i HTTP (rzucają błąd, bez fikcyjnych verdictów): 2→2 aktualne, tekst/wersja bez zmian,
      restart zatrzymany, oryginał/budżet bez zmian. Powrót w głównym publicznym loopie
      nie nastąpił przez timeout — nie oznaczamy go jako wykonany.
- [x] Po publicznym Stop odtworzono 2 dodatkowe błędy reguły (własna praca u klienta,
      rzeczownikowy opis usługi). Helper v2 i extraction policy v6 poprawione offline;
      Sprint0/TwójSoftware teraz mają podstawę w read-only sprawdzeniu danych, bez nowych
      maili lub publicznego powtórzenia. Poprawiono pamięć przyszłego harnessu (oba indeksy).

Raport ma BLOCKED_EXTERNAL, a nie pełny sukces discovery. Publikacja/CI końcowego SHA
są potwierdzane po pushu w końcowej odpowiedzi. Nie uruchamiać nowej szerokiej rundy ani
Gmaila w tej pracy. Dokładny kolejny krok, jeśli użytkownik wróci: krótki search preflight
po ustąpieniu zewnętrznego timeoutu; normalna analiza na nowym kodzie, bez ręcznej zmiany
starych decyzji. Domowy Windows/Gmail pozostaje oddzielnym etapem. Prawdziwe maile 0.

## Runda samodzielnego researchu — 13 października, zakończony zakres

- [x] Czysty checkout, brak aktywnego backendu, fetch/fast-forward do 646de0d;
      zachowane nowsze poprawki i historia. Publiczny kod f59ccb8.
- [x] Regresje języka zaproszenia, future OPEN, osobnego zapytania przy REJECTED
      oferty i literalnej nawigacji mimo maila w stopce; ogólne poprawki bez domeny.
- [x] 2–3 funkcje zamiast stacku, orientacyjnie 110–170 bez minimum/bramki długości.
      Pełne zatwierdzone fakty zachowane. BizCode 150→91, OKE 143→117, ApiFamily 151→85.
- [x] Faktyczny QueryPlanner → web search → worker: 4 kierunki, 15 nowych unikatowych
      firm + 1 powtórna analiza, 10 literalnych kontaktów i 7 aktualnych szkiców po
      kontroli. Osobno 4/4 pozytywne kontrole, w tym Transparent Data RECRUITMENT/OPEN.
- [x] Jeden trwały budżet: 27.16 min / 80 HTTP czytnika / 50 modeli, w tym probe/search
      i wszystkie kontrole. 12 akcji web search; wewnętrzne HTTP dostawcy nie są ujawniane
      przez CLI. Bez zerowania, ręcznych interwencji podczas publicznego procesu i maili.
- [x] Zachowany GOTOMA DRAFT_MATERIAL_STALE: bramka blokowała, licznik zawyżał.
      Po Stop fixture FAIL→PASS, wspólna draftMaterialIssues, końcowy kod 835a6d5.
      Offline replay na spójnej kopii: cykl 4 checkedDrafts 2→1; publiczna chronologia
      i oryginalna baza bez zmian. Nie ponawiano publicznego procesu na późniejszym kodzie.
- [x] Końcowy macOS check 410 backend / 12 performance / 15 UI, typecheck/build/diff
      check PASS. Wcześniejsze FAIL i niewyjaśniony historyczny Stop CI są w TEST_REPORT.
- [x] Kompletny pakiet i audyt wersji/ID/hash/linków/CSV/sekretów, istniejący eksport.
      [Pełny raport](research-review/2026-10-13_12-02_9c7ca137_macos_autonomous/README.md),
      status PARTIAL: jeden zachowany nieaktualny szkic, bez błędów modeli/HTTP.

Publikację zdalnego SHA, obecność plików i stan CI finalnego commitu potwierdzamy
po rzeczywistym pushu w końcowej odpowiedzi; przygotowany commit nie jest dowodem pushu.
Nie rozpoczynamy kolejnej szerokiej rundy. Jeśli użytkownik wróci do GOTOMA, dokładny
następny krok to normalna ponowna analiza z zapisanej działalności i kontrola nowej
wersji/bindingu, bez ręcznego dopisania inquiryBasis; obecny materiał pozostaje zablokowany.
Domowy Windows wymaga późniejszej świadomej procedury nowej albo istniejącej instalacji
w URUCHOMIENIE_RANO, CV/materiałów, CA/czytnika, konta/uprawnień i pilotażu. Niczego tam
nie inicjalizowano. Prywatny runtime/Gmail/CV/OAuth/liczniki bez zmian; rzeczywiste maile 0.

## Wynik 13 października 2026 — publiczna diagnostyka MacBooka

- [x] Osobny managed checkout od `2aa3a1e`, DEVELOPMENT i nowa diagnostyczna baza poza repo.
- [x] Snapshot 9 zatwierdzonych faktów z opublikowanego PROFIL_UZYTY, zachowane ID/treści;
      pochodzenie i hash, `cvVerifiedInThisRun=false`. Brak PDF i prywatnego runtime.
- [x] Reader preflight, oczyszczone TLS/DNS/HTTP/timeout/limit, bounded retry i zatrzymanie
      serii wspólnych awarii; reuse po końcowym URL, aktualnej wersji i parserze.
- [x] Import zapisanych źródeł przez serwis, bez ręcznego przestawiania stage w SQLite.
- [x] Dobór projektu z potwierdzonych usług/produktów; pełny opis i mapping dowodów
      identyczne w generatorze/review. Ogólne reguły, fixture ze zmienionymi nazwami.
- [x] Brak dopisanego zlecenia; pytanie versus CV; OFFER versus COMPANY; neutralny tytuł
      OPEN/PROSPECT, zachowanie diagnostyki rzeczywiście niepotwierdzonego wakatu.
- [x] Blokada otwarcia `diagnosticOnly` jako Gmail/WORKSTATION przed native transportem.
- [x] Jedna sesja 08:10:30–08:44:05 Europe/Warsaw: 10 nowych firm + 6 kontroli,
      69 HTTP / 68 różnych żądanych URL / 58 poprawnie odczytanych stron, 46 modeli.
      13 nowych wersji, 11 różnych szkiców po pełnej kontroli; 7 nowych firm ze szkicem,
      3 nowe pominięte. 4 nieudane odczyty, 2 błędy modeli zachowane i rozpoznane.
- [x] AutoRelay rzeczywiście w nowych tekstach BizCode/Tukano, CodeFabric w OKE.
      Stare wersje zachowane; nie poprawiano ręcznie tekstów eksportu.
- [x] Końcowy macOS check: 403 backend, 12 performance Stop, 15 UI, typecheck/build;
      21 celowanych regresji i diff check PASS.
- [x] Publiczny pakiet UTF-8 z pełnymi tekstami, porównaniem i audytem liczb/odwołań.
      [Raport](research-review/2026-10-13_08-10_macos-01a133d7/README.md).

Publikacja 15198a6 potwierdzona: SHA i README/FIRMY/WIADOMOSCI w GitHubie.
CI 15198a6: Windows PASS, macOS backend PASS i performance Stop 11/12 FAIL.

- [ ] Poza zakończonym researchem: profilować zimny odbiór Stop przy 10035 firmach
      i trzech odświeżeniach w hosted macOS/Node 24.19; 1458,72 ms > 1000 ms, bez
      zmiany progu. Rerun przez integrację odmówiony HTTP 403.
      Końcowy commit dokumentacji ma ten sam kod runtime; jego CI sprawdzamy po pushu.
      Pozostaje na domowym Windowsie: uruchomić `node --use-system-ca --import tsx
scripts/reader-preflight.ts`, osobno sprawdzić istniejącą historię/marker/CV/Gmail/politykę
      według URUCHOMIENIE_RANO. MacBook i izolowane CI nie potwierdzają tej konfiguracji.
      Nie rozpoczynać następnej szerokiej rundy; uwagę jakościową stanowią długie opisy stacku
      w części szkiców mimo poprawnego doboru. Payarto nadal wymaga pełniejszego oficjalnego
      źródła; Merixstudio wymaga osobnego procesu pytania bez CV, jeśli użytkownik go zechce.
      Zero rzeczywistych maili/SELF_TEST, odczytów Gmaila i zmian OAuth/liczników/produkcji.

## Publiczny research i publikacja — 12 października 2026

- [x] Zgoda użytkownika na skorygowaną propozycję i oryginalny PDF; zgodność
      SHA sprawdzona. Osobna diagnostyka użyła 9 faktów, bez domyślnego FixDesk
      lub dodatkowych aktywności CV. Produkcyjne materiały nie były zapisywane.
- [x] Rzeczywisty Codex/web search, trzy partie na niezerowanym budżecie;
      30 rozpoczętych tożsamości, 5 zweryfikowanych analiz, 2 zachowane szkice.
      Po osiągnięciu 150 HTTP brak nowych firm/HTTP; domknięto zapisane kontrole.
      15 wywołań modelu, 2 pozytywne kontrole, 3 pominięcia, 1 błąd ekstrakcji.
- [x] Odwzorowanie TLS i poprawka porównywania linku z końcową kropką;
      nie wyłączono zabezpieczeń. Dwa teksty bez zmian sprawdzono ponownie;
      pierwotne odrzucenia są zachowane. Brak szerokiej przebudowy stylu/UI.
- [x] Osiem plików publicznego pakietu i LATEST; automatyczny audyt wszystkich
      firm/wersji/ID/odnośników/danych prywatnych i zerowej poczty PASS.
- [x] Końcowy npm run check PASS: 382 backend, 12 performance, 15 UI,
      typecheck/build; diff check PASS. Fikcyjne usługi, bez Gmaila.
- [ ] Zweryfikować zdalny SHA pakietu po pushu i stan CI dla tego SHA.
- [ ] Przed pilotażem: wyjaśnić nadmierną interpretację contract=no w Tukano
      (profil nie wymaga zlecenia), wąską kontrolę celu adresu Merixstudio oraz
      niepoparty tytuł ekstrakcji Payarto. Nie zmieniono wyników ręcznie i nie
      osłabiono walidatorów dla zwiększenia liczby szkiców.
- [ ] Nowa baza/import Fingoweb, LOCAL_ONLY/WORKSTATION i backup nadal wymagają
      konkretnych potwierdzeń użytkownika. Przenieść zatwierdzony zestaw do
      tej bazy bez automatycznej aprobaty domyślnego FixDesk. CV pozostaje bez
      edycji. Dopiero później osobne decyzje Gmail/polityka/SELF_TEST/Start.
      Research i publikacja nie są zgodą na którykolwiek send.

## Domowy Windows — punkt wznowienia z 12 października 2026

Kod `a3bc37b`, zależności i pełny check Windows przygotowane: **350 backend,
12 performance Stop, 15 UI PASS**. Nie uruchomiono prywatnego backendu ani Gmaila.

- [x] Poszerzona diagnostyka Windows tylko do odczytu: profil bieżącego
      użytkownika, dostępne D i wybrane katalogi wspólne. Przed nową próbą fixture
      znaleziono 73 tymczasowe bazy; wszystkie adresy kontaktów/rekordów/prób
      w domenach .test/.invalid. Nie ustalono żadnej bazy osobistej; chronione
      katalogi systemowe niedostępne. Nie migrowano ani nie resetowano baz.
- [x] Przygotowana procedura nowej instalacji i ręcznej historii CSV w
      URUCHOMIENIE_RANO; jednorazowa kontrola na fikcyjnych danych PASS.
- [x] Użytkownik wybrał nową instalację Windows bez przenoszenia historii testów
      z MacBooka. Potwierdził brak wcześniejszych wysyłek JobHuntera do firm;
      SELF_TEST nie były aplikacjami. Nie usuwamy historycznych danych Maca.
- [x] Przygotowany prywatny pusty szablon CSV poza repo: pięć nagłówków,
      UTF-8 BOM, separator przecinek, zero firm. Nie utworzono bazy roboczej.
- [x] Po otrzymaniu listy użytkownika uzupełniono CSV jednym rzeczywistym
      wcześniejszym kontaktem. Adres/domena/data nieznane i pozostawione puste.
      Podgląd istniejącego importera PASS; zapisany lokalnie poza repo wraz
      z hashem. Nie wykonano importu, także do tymczasowej bazy podglądu.
- [x] CSV zatwierdzony przez użytkownika. Inne wcześniejsze ręczne zgłoszenia
      świadomie objęte wyjątkiem jednej kolejnej wiadomości, nie deklaracją
      braku wcześniejszego kontaktu. Nie wymagać kompletowania ich CSV.
- [x] Jawny nowy initializer i publiczna diagnostyka pomijają 33 dawne nazwy.
      Wdrożono trwałą, nieodnawianą granicę kampanii i zachowano Fingoweb,
      istniejące rekordy, odmowy oraz niepewne/własne próby. Testy w TEST_REPORT.
- [ ] Po przygotowaniu inicjalizacji pokazać pełne podsumowanie docelowego
      katalogu, skutków i dokładnego CSV/hashu; uzyskać zgodę na utworzenie
      bazy oraz import. Dopiero potem tworzyć bazę; bez danych syntetycznych.
- [ ] Po zaakceptowanym utworzeniu/importowaniu nowej historii wykonać
      `history:local doctor`, pokazać liczniki/blokady i potwierdzić zakres
      NOWEJ kampanii z wyjątkiem dawnych zgłoszeń oraz jeden Windows.
      Nie potwierdzać kompletnej oryginalnej historii w imieniu użytkownika.
- [ ] Wykonać spójny backup istniejącym helperem; po wymaganym potwierdzeniu
      configure WORKSTATION i sprawdzić LOCAL_ONLY, pozostawiając send zatrzymany.
- [ ] Skonfigurować z użytkownikiem rzeczywisty profil, projekty i wskazane CV.
      Propozycje z kodu pozostają niezatwierdzone; nie zatwierdzać za użytkownika.
      Po jego akceptacji `smoke:public -- --approved-profile`
      w osobnym katalogu, maksymalnie 5 firm/15 minut, bez Gmaila i kolejki produkcyjnej.
- [x] Wskazany PDF odczytany/wyrenderowany bez zmian; użytkownik potwierdził
      właściwe CV. Propozycja profilu i dane pozostają wyłącznie poza repo.
- [x] Końcowe zatwierdzenie zmienionych fragmentów materiałów (zlecenie publicznego researchu): główne trzy
      projekty, zwykle jeden na firmę; FixDesk wymaga osobnego opisu w obecnym
      zestawie i nie jest faktem/poleceniem ani permanentnym wykluczeniem.
      Przy konfiguracji nie zatwierdzić domyślnego opisu FixDesk ze starego seed.
      Przekazać do diagnostyki tylko wybrany zatwierdzony zestaw faktów, bez
      fallbacku do brakujących opisów z kodu. Nie przebudowywać CV/stylu/programu.
- [ ] Pokazać firmy, literalne dowody/przeznaczenie adresów, pełne wiadomości,
      wyniki kontroli i konkretne pominięcia. Pierwszy pilotaż Gmaila wymaga
      osobnej decyzji użytkownika; w tej sesji nie wysyłać żadnych wiadomości.

## Wynik 12 października 2026 — jeden komputer roboczy

Nowa decyzja zastępuje obowiązek prywatnego Git/handoff. Kod rozwijany na Windows/macOS;
jedna trwała historia i prawdziwa poczta wyłącznie w jawnie skonfigurowanej instalacji
domowego Windowsa. PRIVATE_GIT pozostaje opcjonalny, odłożony. Brak origin nie blokuje LOCAL_ONLY.

- [x] Stan bazowy najnowszej gałęzi overnight (810b860), izolowane kontrole macOS.
- [x] LOCAL_ONLY w całej ścieżce AUTO; blokada lokalnego profilu, bezpieczny backup
      przed migracją i diagnostyka istniejącej historii; restart bez zgody na send.
- [x] Domyślny development, osobne dane i technicznie niedostępny native Gmail;
      jawna lokalna instalacja Windows, bez zmiany prywatnego runtime w tej sesji.
- [x] HTML → źródło → lokalny kontekst adresu → kwalifikacja → decyzja AUTO;
      granice sekcji/wierszy/list, konflikty i świadoma kontrola starego cache.
- [x] Trzy widoki, lokalna gotowość, test prawdziwego API Stop z pomiarami,
      regresje, dwa procesy i restart/backup na syntetycznych danych.
- [x] Adapter diagnostyczny bez Gmaila i jedna ograniczona próba: 5 firm/5 stron,
      FAILED_EXTRACTION przez schemat CLI, 0 szkiców. Schemat poprawiony i natywnie
      sprawdzony na danych syntetycznych. Późniejsze rzeczywiste powtórzenie: 5 kandydatów,
      9 stron, 5 ekstrakcji, 4 kontakty GENERAL, 1 zapisany szkic z review=true. Całość
      INCOMPLETE: błędy DRAFT/SEMANTIC_REVIEW i kontrola technologii. Szczegóły TEST_REPORT.
- [x] Regresje i minimalna poprawka sklejania etykiety Email z adresem; parser v2,
      ponowny odczyt cache v0/v1, całkowicie syntetyczny szablon diagnostyczny i brak
      narzuconej tożsamości/szkoły w prompcie; raport limitu zapisanego przez worker.
- [x] Świeży publiczny smoke po parserze v2/szablonie i osobna próba problematycznej
      strony: 5+1 firm, 6+2 stron, 4+1 zachowanych wersji, 2+1 pozytywne kontrole.
- [x] Diagnostyka CLI z ID/etapem/czasem/wersją/exit/sygnałem i redakcją; zachowanie
      niezweryfikowanych materiałów, powód/fragment odrzucenia i retry samego review.
- [x] Replay źródeł i rzeczywiste odtworzenie błędu kontekstu review (source/evidence
      IDs i brak inquiryBasis); 5 review-only PASS na identycznych tekstach/hashach.
- [x] Stop: twardy brak POST w pełnym zestawie i 3 szeregowe pomiary z dotychczasowymi
      progami, zachowane w check/CI. Nie podniesiono progu dla uzyskania PASS.
- [ ] Pierwotne CODEX_FAILED oraz utracony fragment UNSUPPORTED_TECHNOLOGY pozostają
      nieustalone; nie wystąpiły ponownie. Nowe błędy będą miały lokalną diagnostykę.
      Rzeczywisty profil, domowy Windows i Gmail nadal wymagają osobnej próby.
- [x] Dokumentacja A/B/C, końcowy check **322 backend/7 UI**, 6 soak, diff check,
      przegląd kodu i skan 61 plików bez sekretów/prywatnych artefaktów.

Kod: 3dfb49b8e4db92580fb3be735088b923f37d7e93, codex/local-windows-pilot.
Końcowy dodatkowy commit naprawia read-only backup/restore-copy, liniowy koszt dużego
HTML, natychmiastowe odwołanie prawa przed SQLite i zegar fixture po regresjach Windows.
Pierwszy CI f25621e: macOS PASS, Windows 5 FAIL, powody i poprawki w TEST_REPORT.
Publikacja obejmuje osobny commit raportu. Zdalny ref i wynik CI **finalnego SHA** są
sprawdzane po pushu i podane w końcowym raporcie czatu / Actions; nie zakładaj wyniku
na podstawie samego przygotowania workflow. Main nie jest automatycznie scalany.

Pozostaje użytkownikowi na domowym Windowsie: ustalić i potwierdzić oryginalną historię
(doctor, w razie potrzeby jednorazowy prywatny import), backup, lokalny WORKSTATION,
zatwierdzone materiały/CV/konto/polityka i aktualny publiczny smoke bez Gmaila.
Dopiero potem samodzielny pilotaż 3–5 maili i ewentualna dłuższa sesja. Brak origin
historii nie jest zadaniem blokującym. Nieweryfikowane: prywatna instalacja Windows,
pełny dzień Google, systemowy sen/wybudzenie, dostarczalność i pełna izolacja OS.

Zakaz tej sesji: prawdziwe send/SELF_TEST, odczyt skrzynki/OAuth, prywatna baza/CV,
liczniki, zakup usług, repo historii i zatrzymanie aplikacji użytkownika.
Starsze listy poniżej są zapisem historii i nie przywracają obowiązkowego handoff.

## Stan historyczny — 11 października 2026

### Stabilizacja `codex/overnight-stabilization`

- [x] Odtworzyć wcześniejszy kontakt przed podglądem i przed POST: pominięcie konkretnej
      firmy, brak zatrzymania poszukiwań, brak drugiego pierwszego kontaktu.
- [x] Zachować wybrany draft/version/company/session/outbox przez await; wersjonowane,
      idempotentne pominięcia. Edycja/Stop nie dopuszczają nowej treści po starej kontroli.
- [x] Oddzielić offer fit od intencji kontaktu: macierz A–F, GENERAL bez promocji,
      pytanie przy unknown, osobny dowód do zapytania mimo niedopasowanej oferty,
      odmowy/kanał/przeznaczenie/sprzeczności nadal blokowane.
- [x] Trwały planer poza ośmioma kierunkami: normalizacja, metryki, dobór obszarów
      oparty na skuteczności, cooldown, restart, postęp niezależny od zmiany limitu.
      Niedokończeni kandydaci pozostają PENDING do zwolnienia kolejki.
- [x] Celowany ponowny scan Gmaila ograniczony do tej samej firmy; bounded read retry.
      Ręczne endpointy Gmaila zablokowane w AUTO, internalApproval usunięte.
- [x] Blokować Start przez całe handoff/prepare; origin/gałąź/ścieżka rewalidowane,
      push do zatwierdzonego celu. A→B→A z aliasem, kontaktami i syntetycznymi licznikami.
- [x] Symulacja ponad doby, seed 17/41/93: pauza/Stop/restart, zmiana dnia,
      błędy odczytu/źródeł, queue≤3, ≥9 kierunków, jeden POST/rezerwację i SEND_UNKNOWN.
- [x] Gotowość/terminy w obecnym panelu, szukanie/status historii, data przeniesionego
      kontaktu i powód konkretnej wersji. Pobieranie danych aktywnego widoku;
      naprawiona wykryta regresja DEMO raportów. UI 7/7 po poprawce.
- [x] Instrukcja URUCHOMIENIE_RANO i CI offline Windows/macOS z minimalnymi uprawnieniami.
- [x] Końcowy pełny check/przegląd: 282/282 backend + 7/7 UI, typecheck/build/diff check PASS.
- [x] Dwa logiczne commity kodu/UI/dokumentacji wypchnięte do `codex/overnight-stabilization`;
      zdalny ref zweryfikowany dla `d10e42f7989a2d3af5cc8bba0d1caf12fa6e67a6`.
      Skan 31 blobów obu commitów: bez prywatnych plików/sekretów. Main bez scalenia.
- CI uruchomione; rzeczywisty wynik finalnego SHA dokumentacji w raporcie końcowym
  czatu i [Actions](https://github.com/JakubLewosz/JobHunter/actions).

Następny etap implementacji (nie oznaczony jako gotowy): pełna macierz awarii
przekazania przed/po rename, commit i utraconym wyniku push; scenariusz rozstrzygnięcia
SEND_UNKNOWN w pełnym A→B→A na oryginalnym MIME; systemowy sen/wybudzenie; duża historia
i zmierzony czas reakcji Stop podczas synchronicznych operacji Git. Rozszerzyć soak
o mieszany scenariusz OPEN/PROSPECT/429 i rzeczywistą zmianę właściciela w tej samej
symulacji (obecne testy pokrywają je osobno). Nie zastępować tych dowodów liczbą iteracji.

BLOCKED_EXTERNAL: prywatny origin użytkownika i pierwszy rzeczywisty eksport z oryginalnej
bazy, prawdziwa skrzynka/pilotaż, pełny dzień z Google, niezależny audyt OS, próba na
macOS użytkownika. Opcjonalnego live researchu nocą nie wykonano. CI potwierdzać tylko
dla zakończonego SHA; nie zmieniano prawdziwej poczty/runtime/OAuth/liczników.

### Poprzedni etap — punkt wyjścia stabilizacji

Obowiązuje specyfikacja 2.0. Sekcje niżej zachowują historię wcześniejszych prac i nie przywracają akceptacji każdego maila lub blokady implementacji AUTO_POLICY.

- [x] Pobrano istniejące main do pustego lokalnego checkout; praca na `codex/auto-policy`, bez resetów danych użytkownika.
- [x] Odtworzono błędy odświeżania źródeł/kontaktów testami FAIL; dodano zdarzenia weryfikacji, odświeżenie niezmienionych treści i unieważnianie zmienionego/znikającego kontaktu. Ręczny GENERAL ma operację przeglądu.
- [x] AUTO_POLICY: zatwierdzony profil/CV/nadawca/zakres/kontakty/tempo, lokalna sesja Start/Pauza/Stop, własne timery sendera/researchu, ograniczona kolejka i opcjonalne limity. Bez ukrytej daty końca i bez indywidualnej zgody na każdy mail.
- [x] Bramka: tożsamość/domena, literalny kontakt i przeznaczenie, źródła obu stron (firma/kontakt), wersje/hash, semantyka i reguły, historia/aliasy/rezerwacje. GENERAL zachowuje GENERAL; niepewne szkice pomijane. Pojedynczy POST i SEND_UNKNOWN zachowane.
- [x] Prywatna historia: minimalny wersjonowany JSON, transakcyjny import/eksport, atomowy plik, oddzielny origin, właściciel/przekazanie, liczniki i publiczny kontekst firm, blokady konfliktów/usunięcia/cofnięcia historii. Brak transferu zgody i sekretów. Pierwsza baza wymaga potwierdzenia; przygotowanie historii możliwe bez sesji wysyłkowej.
- [x] Panel AUTO: Praca programu, Historia firm i Ustawienia. Stare odpowiedzi zachowane, zakładka ukryta. SELF_TEST poza licznikiem kontaktowanych firm; ręczny przegląd kontaktu w APPROVAL_REQUIRED.
- [x] Windows: npm ci, SQLite, doctor, rzeczywiste testy backendu/UI i start.ps1 -NoBrowser / stop.ps1 w tymczasowym DEMO. Native CLI version/help/features sprawdzone. Szczegóły i granice w TEST_REPORT/WINDOWS_SMOKE.
- [x] Ostateczny `npm run check` na Windowsie: **237/237 backend, 7/7 UI**, typecheck/build PASS. Regresje obejmują także długą pauzę, usunięcie odziedziczonego deadline, literalny pełny adres, kontrolę przed prywatnym odczytem, snapshot konta i zachowanie domen po imporcie. `git diff --check` PASS; raport w TEST_REPORT.

### Następny konkretny krok użytkownika

- [ ] Wskazać i potwierdzić osobne prywatne repo historii; pierwszy eksport wykonać na komputerze z oryginalną bazą kontaktów, przyciskiem „Przygotuj historię bez uruchamiania sesji”. Nie utworzono zdalnego repo ani nie opublikowano prawdziwej historii w tych pracach.
- [ ] Lokalnie zatwierdzić fakty/CV, sprawdzić istniejące logowanie Codexa i uprawnienia Gmaila, zatwierdzić politykę. Rzeczywistą sesję uruchamia dopiero użytkownik świadomym Start.
- [ ] Zweryfikować aktualny kod na macOS oraz rzeczywisty research/izolację CLI i dostarczalność Gmaila w świadomie uruchomionej sesji. Tych prób nie zastępują fixture tests; obecne zlecenie nie autoryzuje prawdziwych maili.

## Historia wcześniejszych etapów

Kierunek dalszego rozwoju: [Wizja projektu](WIZJA_PROJEKTU.md).

- [x] Na nowe polecenie przygotować cały aktualny projekt do publikacji i niezależnego przeglądu ChatGPT: diff kodu/testów sprawdzony, dokumentacja stanu i braków w REVIEW_HANDOFF. Prywatne materiały poza repo, bez zmian runtime/Gmail; ostatni pełny check 206 backend / 6 UI PASS, bez ponowienia testów po samych zmianach dokumentacji.

- [x] 9 października odtworzyć i naprawić utratę blokady znanego kontaktu Gmail po zmianie nadawcy: historia firmy działa między kontami, odpowiedzi SELF_TEST wykluczone. Pięć nowych testów: restart/zmiana konta, SELF_TEST, zgoda i ostatnia bramka przed POST, aliasy/subdomeny/Cc/Bcc, zgody i zmiana zakresu. Pełny check: 206 backend / 6 UI PASS, typecheck/build/diff check PASS. Bez migracji i zmian prywatnego runtime; zmiany lokalne.
- [x] Przygotować prywatny materiał przeglądu dwóch istniejących szkiców: dokładne niezmienione treści, świeże dwa publiczne źródła READ, literalny kontakt i dawne cytaty nadal obecne. Bez automatycznego researchu, modelu, zgody/send lub zmian źródeł w SQLite. Materiał pozostaje poza repo; nie jest zatwierdzoną paczką MIME.
- [ ] Domknąć jawny przegląd ogólnego kontaktu: obecne szkice PROSPECT mają kontakt NEEDS_REVIEW, brak operacji użytkownika do jego rozstrzygnięcia. Zachować GENERAL, źródło, aktualność i odrębną akceptację dokładnego MIME; nie oznaczać automatycznie jako rekrutacyjnego lub gotowego do wysyłki.
- [ ] Przed małą paczką sprawdzić celowaną historię wybranych firm na bieżącym nadawcy z ważną zgodą użytkownika. W runtime dotąd zero gmail_history_checks; nie odczytywać całej skrzynki ani zakładać braku wcześniejszych kontaktów starszego konta.

- [x] 9 października przygotować wszystkie aktualne zmiany do zleconego push: przegląd diffu i prywatnych danych/sekretów, blokada zapisu prywatnego raportu przez symlink do repo i ignorowanie EML. Regresja FAIL→PASS, końcowy check 201 backend / 6 UI PASS, typecheck/build/diff check PASS. Runtime/OAuth/CV/EML poza repo; zero nowych operacji Gmail.
- [x] Na nową decyzję użytkownika przełączyć bieżącego nadawcę na wskazane starsze konto po serii 5/5 Odebrane: zakończony OAuth, kampania i nowy niezatwierdzony podgląd zgodne, test do siebie na wybrane konto. Bez automatycznego powrotu do projektu. Nadal APPROVAL_REQUIRED i zatrzymany sender/research; 19 prób/rezerwacji, zero nowych wysyłek. Dawne bajty/historia/materiały zachowane, kod bez zmian, diff check PASS.
- [x] 9 października wykonać dokładnie zleconą serię: pięć SELF_TEST starszego nadawcy na mail1–mail5 oraz trzy konta projektu na mail2/mail4/mail5 bez znanej historii (lokalne próby + deklaracja użytkownika). 8/8 SENT_CONFIRMED, jeden send/próbę, dokładne frozen MIME i to samo CV. Projekt mail1/mail3 pominięte. Konto projektu przywrócone, sender/research zatrzymane; 19 historycznych prób/rezerwacji, dziś 8/10, bez resetu. Prywatne źródła poza repo, kod bez nowych zmian, CLI MIME/diff check PASS.
- [x] Zebrać foldery ośmiu prób 9 października: użytkownik zgłosił 5/5 Odebrane starszego konta i 3/3 Spam projektu. Na trzech wspólnych adresach wynik wszystkich par zgodny. Stany SENT_CONFIRMED zachowane, mocniejsza hipoteza czynnika nadawcy; sam wiek/historia/reputacja i kolejność nierozdzielone. Zero nowych operacji Gmail, sender/research zatrzymane.
- [ ] Ewentualny następny audyt bez nowych wysyłek: dwie istniejące kopie odbiorcze pary mail4 (starsze Odebrane 10:40:46 / projekt Spam 10:43:45) i odpowiadające Wysłane. Frozen A zachowane. Nie modyfikować MIME lub ogłaszać minimalnego wieku konta na podstawie samego wyniku serii.
- [x] 9 października, na osobne polecenie, dodać wskazane starsze konto do Test users projektu JobHunter i zweryfikować zapis: dwa konta testowe, konto projektu zachowane; bez ról IAM, zmian zakresów/publikacji lub nowych wysyłek. Świeży OAuth zakończony, wskazane starsze konto i zakresy send/readonly zweryfikowane lokalnie. Sender/research zatrzymane, 11 dawnych prób/rezerwacji bez zmian; do przygotowania testów brakuje dokładnej listy odbiorców.
- [x] Nowe zlecenie użytkownika: ponownie podłączyć starsze konto do ograniczonego porównania na dokładnie wskazanych odbiorcach; zakończone 9 października, później wykonano zlecone 5+3 próby opisane wyżej. Historyczne przygotowanie: Zastępuje wcześniejszy zakaz podłączania; nie odtwarzać usuniętej historii. Uruchomiono istniejący OAuth z tymi samymi zakresami; połączenie wymaga zakończenia Google przez użytkownika. Oczekujemy dokładnej listy odbiorców i ich wcześniejszej historii. Materiały referencyjne/PDF i prywatny snapshot przygotowane poza repo. Dotąd zero nowych wysyłek, sender/research zatrzymane, 11 dawnych prób/rezerwacji zachowane. Każdy nowy test wymaga świeżego podglądu/hash/zgody; bez automatycznej serii lub retry.
- [x] Na nowe polecenie użytkownika zresetować dzienne wykorzystanie bez kasowania historii: baseline w app_state, jawny audyt i uwierzytelniony endpoint, kontrola dnia/licznika i braku aktywnych/niepewnych prób. Pauza/kill switch i limity kampanii/paczki zachowane. `npm run check`: 200 backend / 6 UI PASS; bez nowej migracji.
- [x] Wykonać wcześniej zleconą jedną próbę na nowo wskazany adres Gmail: nowy podgląd tej samej treści/CV, 21:50:51 Europe/Warsaw, SENT_CONFIRMED, jeden send i zgodny zamrożony bufor. 11 historycznych prób/rezerwacji, bieżące dzienne wykorzystanie po resecie 1/10; sender zatrzymany, bez researchu. Adres i źródła poza repo.
- [x] Uzyskać wynik i oba EML Gmail próby 21:50: użytkownik zgłosił Spam. A/B body identyczne i Subject 48/52/29, C 84/32; PDF i pełne zdekodowane części C identyczne z pozytywnym WP. Auth PASS według Gmaila, body hash zgodny. Lokalny audyt/diff check PASS, zero nowych operacji Gmail; brak ustalonej przyczyny lub dowodu koniecznego wieku konta.
- [ ] Dalsze eksperymenty dostarczalności wstrzymane na prośbę użytkownika. Sender/research zatrzymane, brak kolejki lub zaplanowanego wznowienia; poniższa przyszła para Gmail pozostaje wyłącznie planem.

- [x] Audyt offline MIME i konserwatywny reconcile po utracie odpowiedzi oraz zmianie RFC ID: pełne RAW, ograniczony zakres/czas/paginacja, kandydaci bez automatycznego potwierdzania po treści, blokada ponownego przypisania Gmail id. 197 backend / 6 UI PASS, zero operacji Gmail. Generator bez zmian; [raport](GMAIL_DELIVERABILITY_AUDIT.md).
- [x] Porównać nowy EML Wysłanych próby nr 3 (8 października 13:31:27 Europe/Warsaw) z zamrożonym MIME: identyczne zakodowane body, text/plain, text/html i PDF; Subject 48/52/29 przed/po. Zmiany nagłówków: Received, RFC ID i Date +2 s. Zero operacji Gmail.
- [x] Porównać kopię odbiorcy próby nr 3: ten sam końcowy RFC ID; Subject Q 48/52/29 w A/B → B 84/32 w C, PDF identyczny, tekst przełamany w siedmiu miejscach i końcowe CRLF. Auth PASS według odbiorcy, DKIM body hash zgodny; brak dowodu przyczyny Spamu. Zero operacji Gmail.
- [x] Porównać ręczną kopię Wysłanych 13:49:39 i nowy EML odbiorcy 13:53:46: ten drugi jednoznacznie odpowiada próbie aplikacji nr 4. W obu Subject 84/32, tekst/HTML/bajty PDF identyczne, różna nazwa PDF. Brakujący wówczas odbiorczy EML ręcznej wiadomości później uzupełniono. Folder próby 4 pochodzi z wcześniejszej relacji użytkownika, nie z etykiet EML. Zero operacji Gmail.
- [x] Uzupełnić właściwą ręczną kopię odbiorcy 13:49:39: RFC ID/Date/From/To zgodne z Wysłanymi; wszystkie pełne zdekodowane części i nazwa PDF identyczne. Subject 84/32 po obu stronach, auth PASS według odbiorcy, body hash zgodny. Para ręczna kompletna; fragment 84 nie rozróżnia zgłoszonych folderów. Offline CLI/Python/inspection.ts i diff check PASS; zero operacji Gmail.
- [x] Uzupełnić porównanie o ręczną wiadomość do tego samego odbiorcy Gmail B pobraną z Odebranych. A/B/C próby aplikacji oraz ręczne Wysłane/odbiorca porównane; bez nowej wysyłki lub odtwarzania usuniętych danych.
- [x] Na nowe wyraźne polecenie wykonać jedną część aplikacyjną pary WP (mail2) i przygotować wzór ręczny (mail1): nowy podgląd dokładnie tej samej wersji z CV, pojedyncza próba o 20:41, SENT_CONFIRMED, identyczny bufor/hash. Teraz 10 prób/rezerwacji przy niezmienionym limicie dziennym 10. Celowane potwierdzenie i RAW tylko tej próby; A/B body identyczne, Subject 48/52/29. Sender ponownie zatrzymany; wzór/PDF/EML poza repo. Bez researchu lub ponowienia.
- [x] Dokończyć porównanie pierwszych kontaktów WP: komplet czterech EML, obie wiadomości od razu Odebrane według użytkownika i X-WP-SPAM NO. Pełne części plain/HTML/PDF i nazwa identyczne u obu odbiorców. Aplikacja A/B Subject 48/52/29, oba C 84/32; generator bez zmian. Trzy audyty CLI i diff check PASS; zero nowych operacji Gmail, nadal 10 prób/rezerwacji i sender paused. Brak historii zadeklarowany, reguły nieodczytane. [Wyniki](GMAIL_DELIVERABILITY_AUDIT.md).
- [ ] Przyszły, osobno uzgodniony eksperyment: analogiczna para pierwszych kontaktów na dwóch niezależnych odbiorcach Gmail bez historii, ta sama treść/format/CV/nazwa. Wynik WP nie rozstrzyga Gmaila; nie powtarzać wysyłek na dotychczasowe adresy jako nowych pierwszych kontaktów ani zwiększać/resetować limitów. Obecnie wstrzymane na prośbę użytkownika; nie wykonywać dodatkowych wysyłek bez wznowienia przez użytkownika.

- [x] Dodać krótki SELF_TEST bez CV i linków, z dokładnym podglądem, zgodą i istniejącymi limitami. Standardowe maile bez zmian; 156 backend / 6 UI PASS.
- [x] Wysłać jeden wyraźnie zlecony krótki test na wskazany adres WP: SENT_CONFIRMED, jedna próba, łącznie osiem. Użytkownik zgłosił Spam. Materiały/szkice bez zmian, sender paused.
- [x] W ramach zleconych testów wysłać drugi wariant na WP bez HTML: ten sam tekst/temat/odbiorca, SENT_CONFIRMED, jedna próba. Łącznie dziewięć; końcowe 157 backend / 6 UI PASS.
- [x] Uzyskać wynik drugiego testu WP: użytkownik zgłosił Spam także dla samego tekstu. Wynik zapisany; nadal dziewięć prób, bez trzeciej wysyłki.
- [x] Odczytać EML drugiego testu WP: zgodny identyfikator/treść, MIME bez błędów, DKIM good według WP, X-WP-SPAM YES (U9). Brak wyników SPF/DMARC i potwierdzonego wyjaśnienia U9. Nadal dziewięć prób/rezerwacji, bez dodatkowego send.
- [x] Odtworzyć dostarczony audyt EML: w pierwszym odebranym mailu encoded-word tematu ma 84 znaki przy limicie 75; obecny generator dla tego samego tematu tworzy 48/52/29, a test WP ma 39 i również Spam. Bez wykazanego aktualnego błędu kodu lub ustalonej przyczyny klasyfikacji; szczegóły w TEST_REPORT.md.
- [ ] Sprawdzić listę Zablokowani i reguły WP bez zmiany ustawień; wybrać dalsze porównanie lub zgłoszenie do pomocy technicznej na podstawie wyniku. Pytanie do użytkownika wysłane.

- [x] Potwierdzić trzeci ręczny test z identycznym CV i treścią: Odebrane, SPF/DKIM/DMARC/ARC PASS. Ujednolicić format aplikacji: nazwa z zatwierdzonego profilu i escapowany HTML obok tekstu; 153 backend / 6 UI PASS. Lokalny podgląd gotowy, bez nowej wysyłki.
- [x] Odświeżyć trzy zapisane maile do zaakceptowanego stylu (PRODAUT/TwójSoftware v3, Codapi v4), zachowując starsze wersje i wymagając przeglądu.
- [x] Wyrównać panel Gmaila i edytor; wiadomości na początku, pełna wysokość treści, zwijane uwagi, poprawione odstępy i mobile. 149 backend / 6 UI PASS, rzeczywisty układ sprawdzony przy 1440/1024/390 px.

- [x] Cztery mikro-poprawki językowe (8 października): naturalna informacja o otwartych kandydaturach, bez powtórzeń w akapicie, prosty opis pracy zespołowej i naturalne pytanie o wymiar/godziny pracy. Długość, struktura i pozostały styl bez zmian.
- [x] Trzy końcowe korekty językowe (8 października): „mój projekt [nazwa]”, naturalna wzmianka o korzystaniu z Codexa i krótkie pierwsze zdanie bez łączenia stanowiska, rodzaju współpracy i technologii. Pozostały styl i struktura bez zmian.
- [x] Ostatnie mikro-poprawki (8 października): imię i edukacja w jednym naturalnym zdaniu, bez zbędnego roku szkolnego i sztucznego objaśniania dopasowania. Publiczne repo nie jest publicznym demo; krótki, neutralny opis braku wdrożenia. Zmiany wyłącznie instrukcji językowych, bez zmiany struktury i logiki.
- [x] Drobna korekta języka: bezpośrednie nawiązania, neutralny projekt/prototyp zamiast domyślnego demo, proste tematy, odmiana i standard 150–220 słów. Bez zmiany struktury i doboru projektu.

- [x] Finalny tuning: cztery krótkie części, 100–150 słów lub sensownie mniej, miękkie uwagi stylu i pięć kontrolnych podglądów. Dostępność pozostaje około 20 zgodnie z odpowiedzią użytkownika.

- [x] Nowy styl: naturalne zgłoszenie, trzy scenariusze kontaktu, opcjonalny Codex, tematy zależne od firmy/stanowiska; MESSAGE_STYLE.md.
- [x] Walidacja treści, polskie znaki i negacje; niepewny review zachowuje NEEDS_REVIEW. Ponowna generacja dopisuje wersję i chroni równoległą edycję.

- [x] E0–E2: istniejące DEMO, sesja, SQLite, worker, outbox, kwoty, reconcile i raporty.
- [x] E3: osobny RESEARCH_ONLY, backend bez wysyłki ani zgód na przyszłą wysyłkę.
- [x] Migracja istniejącej bazy z zachowaniem zależnych rekordów.
- [x] Publiczny fetcher, SSRF/DNS pinning, import URL, trwała biblioteka źródeł.
- [x] Oficjalny `codex exec`, strukturalny wynik i rzeczywisty web search na macOS.
- [x] Ekstrakcja/kwalifikacja/szkic/kontrola semantyczna i trwałe wznowienie.
- [x] Orientacyjnie około 20 h bez maksimum; edytowalny wspólny wzór, jeden trafny projekt w szkicu.
- [x] Prosty panel dla Jakuba: wiadomość, projekty, CV; Start na 8 godzin, pauza i stop.
- [x] Godzinny test: kierunki co 10 minut, do 10 kandydatów i 3 szkiców na całą sesję; automatyczny stop.
- [x] Szerokie kierunki wyszukiwania i firmy PROSPECT bez wakatu: szkic zapytania na sprawdzony publiczny kontakt ogólny, z niepotwierdzonymi warunkami do przeglądu.
- [x] Panel, źródła wymagań, edycja, kopia tematu/treści; przegląd bez send approval.
- [x] Regresja SEND_UNKNOWN → reconcile: KPI i wykres z jednego rejestru prób/kwot.
- [x] Testy offline i Playwright przez rzeczywisty backend; dokumentacja.
- [x] Użytkownik zatwierdza profil w RESEARCH_ONLY — potwierdzone stanem działającej aplikacji.
- [x] Ograniczona rzeczywista próba: 10 kandydatów, 3 szkice, zero wysyłek; automatyczny stop po limitach. Zachowane 2 błędy kontroli zgodności; szczegóły w TEST_REPORT.md.
- [x] Skrócić 3 istniejące szkice do nowych wersji, AI na początku i warunki raz; zachować stare wersje i wymagać nowego przeglądu.
- [x] Zdiagnozować dwie nieudane próby SEMANTIC_REVIEW_FAILED: oba model_calls SEMANTIC_REVIEW zakończone OK, lecz szkic/odpowiedź/issues nie zostały zachowane; nie da się ustalić konkretnego zdania ani false/null. Obecny kod już zapisuje false/null jako NEEDS_REVIEW, istniejąca regresja PASS i wysyłka nadal blokowana. Dawne ERROR oraz źródła zachowane; bez ponowienia lub odtwarzania szkiców.
- [ ] Zbieranie CV, projektów i osiągnięć z GitHuba do przeglądu i zatwierdzenia przez Jakuba.
- [x] Programowanie z AI jako główny przekaz; projekt opcjonalny, tylko gdy pasuje do działalności lub technologii firmy. Krótszy wzór do wyboru w Moje materiały.
- [ ] Windows smoke na prawdziwym Windowsie i natywnym CLI.
- [ ] Pełna izolacja procesu OS, granice nowych wersji CLI; AUTO_POLICY pozostaje zablokowany.
- [ ] Przenoszenie pełnego prywatnego stanu/backup/retencja — osobne zadanie.
- [x] Przygotowanie E4: osobny helper OAuth/PKCE/systemowy magazyn haseł oraz lokalny podgląd MIME z zatwierdzonym CV. RESEARCH_ONLY nadal bez transportu i wysyłek.
- [x] Użytkownik skonfigurował klienta Google Desktop app i zalogował się; rzeczywisty OAuth zakończony, konto zweryfikowane i zgoda zapisana w magazynie systemowym. Bez wysyłek.
- [x] E4 implementacja APPROVAL_REQUIRED: przegląd dokładnego MIME z CV, test do siebie, paczka do trzech firm, odczyt celowanej historii, outbox/sender/read/reconcile. Poczta poza AI; zachowane blokady DEMO/RESEARCH_ONLY.
- [x] Ręcznie edytowana treść: kontrolowane odtworzenie odwołań do faktów i źródeł, wersja i ponowny przegląd, bez zmiany stylu ani treści.
- [x] Użytkownik rozszerzył rzeczywiste połączenie Google o readonly/send 8 października; zatwierdzone CV dostępne. Podgląd testu do siebie przygotowany, bez zgody i bez wysyłki.
- [x] Na wyraźną instrukcję użytkownika wysłano jeden rzeczywisty test z CV na wskazany adres osobisty; potwierdzony w Wysłanych, bez ponowienia i bez kontaktowania firm.
- [x] Użytkownik potwierdził odbiór i poprawne otwarcie CV; test automatycznie trafił do Spamu.
- [x] Sprawdzić dostarczony EML: SPF/DKIM/DMARC/ARC PASS, poprawny MIME i PDF zgodny z zatwierdzonym CV. Brak szczegółowej przyczyny spamu w nagłówkach.
- [x] Porównać ręczny test użytkownika z testem JobHuntera: ręczny trafił do Odebranych, ale miał inny PDF, nazwę nadawcy i część HTML. Treść zgodna, uwierzytelnienie PASS w obu; brak ustalonej przyczyny.
- [x] Na kolejne wyraźne zlecenie użytkownika wysłać jeden test po korekcie nazwy nadawcy/HTML: SENT_CONFIRMED, jedna nowa próba, bez ponowienia. Łącznie dwa testy aplikacji, zero kontaktów z firmami.
- [x] Użytkownik potwierdził poprawny odbiór w Odebranych testu aplikacji po korekcie nazwy nadawcy/HTML.
- [x] Na wyraźne zlecenie wysłano jeden test na inny wskazany adres: SENT_CONFIRMED, jedna nowa próba i rezerwacja, bez ponowienia. Łącznie trzy testy aplikacji, bez zmiany materiałów/szkiców i bez kontaktowania firm.
- [x] Użytkownik zgłosił Spam na drugim adresie. Zamrożone treść tekstowa, HTML i PDF obu ostatnich testów identyczne, MIME bez błędów; łącznie nadal trzy próby. Korekta formatu nie potwierdza rozwiązania dostarczalności.
- [x] Odczyt ponownie dostarczonego EML od drugiego odbiorcy: SPF/DKIM/DMARC/ARC PASS, zgodny RFC Message-ID trzeciej próby, treść i CV bez zmian, MIME poprawny. Brak szczegółowej przyczyny spamu; tekst i HTML identyczne z wcześniejszym ręcznym EML.
- [x] Użytkownik zgłosił poprawny odbiór ręcznej wiadomości na drugim adresie.
- [x] Na wyraźne zlecenie wysłano jeden kolejny test aplikacji na ten sam drugi adres: identyczna treść/HTML/PDF i temat, SENT_CONFIRMED, jedna próba i rezerwacja. Łącznie cztery próby aplikacji, bez automatycznego ponawiania.
- [x] Użytkownik potwierdził Odebrane czwartej próby. Na obu adresach: pierwszy test aplikacji Spam, ręczny mail Odebrane, kolejny test aplikacji Odebrane. Przyczyna nadal nieustalona; brak dowodu zasady „drugi mail zawsze działa”.
- [x] Po podaniu kolejnego adresu przez użytkownika wysłano dwie jednakowe wiadomości aplikacji o 14:05:15 i 14:10:33 Europe/Warsaw, z odstępem 5 min 18 s. Obie SENT_CONFIRMED, po jednej próbie/rezerwacji; tekst/HTML/PDF i materiały bez zmian. Łącznie sześć prób aplikacji.
- [x] Użytkownik zgłosił Spam obu wiadomości z pary; brak dowodu zasady „drugi mail działa”. Wcześniejsza historia i brak interakcji nie zostały niezależnie potwierdzone.
- [x] Sprawdzić udział AI w transportowaniu maila: model proponuje treść, zwykły backend wysyła raw MIME przez Gmail API, bez dodatkowego oznaczenia autorstwa AI. Przyczyna klasyfikacji nadal nieustalona.
- [x] Użytkownik potwierdził świeże konto nadawcy utworzone do projektu, używane wyłącznie do tych testów. Zapisano jako informację diagnostyczną; brak dowodu przyczyny spamu i bez zmiany profilu/konta.
- [x] Zanonimizować zakończony test porównawczy nadawcy; wynik Odebrane pozostaje informacją diagnostyczną, bez gwarancji dalszych dostaw. Materiały/szkice/wersje zachowane.
- [x] Usunąć konto osobiste z testerów Google Cloud, cofnąć zgodę JobHuntera w Google i usunąć lokalne dane tego adresu. Konto projektu pozostaje jedynym połączonym nadawcą; siedem terminalnych prób i wykorzystane limity zachowane, bez nowych wysyłek.
- [ ] Po uzgodnieniu dalszego testu: oddzielić kanał API od treści/CV/linków, zmieniając jedną rzecz naraz. Nie zmieniać zaakceptowanego stylu generatora na podstawie niepotwierdzonej hipotezy. Rzeczywista mała paczka oraz dłuższa próba wymagają osobnej akceptacji.
- [ ] E5 kontrolowana autonomia — poza tym etapem.
- [ ] Po rzeczywistej małej próbie: prosty wybór limitów/odnawianie okresu kampanii, sprawdzenie aliasów wcześniejszych kontaktów i rozstrzygnięcia niejednoznacznych historii.

`git pull` przenosi kod, nie lokalną historię aplikowania. Nie synchronizujemy baz/CV/eksportów przez Git.

Poprawka CI Windows: różnica wielkości litery dysku odtworzona FAIL→PASS;
tożsamość katalogu sprawdzana przez dev/ino, inne repo nadal blokowane.
Końcowy check po poprawce: 282/282 backend + 7/7 UI. Nowy push/CI w raporcie czatu.
