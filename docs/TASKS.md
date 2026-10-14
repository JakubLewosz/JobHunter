# Zadania

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
