# Audyt offline Gmail — 8 października 2026

W **etapie audytu offline** poprawiono diagnostykę reconcile, bez dowodu poprawy folderu u odbiorcy. Ten etap miał **zero rzeczywistych operacji na Gmailu i zero nowych wysyłek**. Nie uruchamiano aplikacji na prywatnym runtime, sendera ani researchu; testy korzystały z mocków. Nie zmieniano konta, OAuth, CV, profilu, szkiców, liczników ani historycznych wyników. Nie wykonywano push ani wdrożenia. **Późniejsze osobno zlecone pojedyncze wysyłki WP i Gmail oraz ręczny reset dziennego wykorzystania są opisane poniżej; nie zmieniają zakresu wcześniejszego audytu offline.**

## Kontrola publikacji na nowe polecenie użytkownika — 9 października

Użytkownik wyraźnie zlecił commit/push wszystkich aktualnych zmian. Zweryfikowano właściwe repo/remote, gałąź main zgodną z origin/main, cały lokalny diff i 91 plików pod kątem prywatnych źródeł/adresów oraz sprawdzanych wzorców sekretów: bez dopasowań. Dane OAuth/konta/CV/SQLite/EML pozostają lokalnie poza repo. Dodano *.eml do .gitignore. W przeglądzie odtworzono lukę ścieżki prywatnego audytora: dowiązanie katalogu mogło kierować --private --output do repo. Poprawiono kontrolę na fizycznego rodzica pliku przez native realpath i relative; istniejący końcowy plik/dowiązanie nadal blokuje flag wx. Test używa wyłącznie syntetycznych danych i tymczasowego repo; FAIL przed poprawką, PASS po niej, także dla symlink/.. na macOS.

Pierwszy pełny ponowny check 200 backend / 6 UI PASS; po poprawce `node --import tsx --test tests/mime-inspection.test.ts` 9/9 PASS, końcowy **`npm run check`: 201/201 backend, 6/6 UI (26,2 s), typecheck/build PASS**. `git diff --check` PASS. Windows smoke nadal niewykonany. W tym etapie nie wykonano żadnej operacji Gmail/send/research ani zmian prywatnego runtime; zatwierdzenia, sender paused i historia pozostają zachowane. Publikacja dotyczy kodu/testów/dokumentacji, nie konfiguracji prywatnego konta lub zdalnego wdrożenia aplikacji.

## Nowa decyzja 9 października: bieżący nadawca to starsze konto

Po wyniku 5/5 Odebrane starszego konta i 3/3 Spam projektu użytkownik wyraźnie zdecydował, aby na razie korzystać ze wskazanego starszego konta. To zmiana bieżącego nadawcy, zastępująca wcześniejsze wymaganie używania konta projektu. Przyczyna samego wieku nadal nie jest wyizolowana; wybór jest praktyczną decyzją użytkownika na podstawie wyniku serii. Nie przywracać automatycznie konta projektu na podstawie wcześniejszych opisów.

Ponownie zakończono istniejący OAuth dla wskazanego starszego konta, bez zmiany klienta/zakresów. Normalnym lokalnym API ustawiono adres testu do siebie na to konto i przygotowano **wyłącznie niezatwierdzony podgląd SELF_TEST** z tą samą treścią i zatwierdzonym CV. Istniejąca ścieżka podglądu zsynchronizowała nadawcę kampanii i unieważniła wcześniejsze zgody związane z innym kontem. Potwierdzono konto OAuth, kampanię, From i To nowego bufora; hash/round-trip poprawne, pełne części/PDF identyczne z referencją, Subject 48/52/29. Nie wywoływano endpointu zatwierdzenia lub send, nie uruchamiano researchu.

Stan po zmianie: starsze konto aktywne jako nadawca i domyślny adres testu do siebie, APPROVAL_REQUIRED, sender/research zatrzymane, schedule=false, kolejka pusta; nadal **19 prób i 19 rezerwacji**. Dokładne porównanie ze świeżym prywatnym snapshotem potwierdziło niezmienione send_attempts/usage_ledger/outbox/szkice/wersje/profil/fakty/CV; SQLite integralne. Prywatne dane nowego podglądu i konta poza repo (0700/0600). **Zero nowych wysyłek i odczytów wiadomości Gmail; tylko OAuth/weryfikacja tożsamości oraz lokalny podgląd.** Kod bez zmian; dokumentacja zaktualizowana, `git diff --check` PASS. Pełnego check nie powtarzano (ostatnie wcześniejsze 200 backend / 6 UI). Kolejne wiadomości nadal wymagają dokładnego podglądu i osobnej zgody.

## Wynik serii 9 października: starsze konto 5/5 Odebrane, konto projektu 3/3 Spam

Użytkownik zgłosił, że wszystkie pięć wiadomości starszego konta trafiło do Odebranych, a wszystkie trzy konta projektu do Spamu. Zapisano tę relację jako nowy wynik odbiorców; nie zmieniano terminalnych stanów SENT_CONFIRMED, dawnych wyników lub liczników. Nie otrzymano jeszcze EML B/C z tej serii i nie odczytano skrzynek odbiorców. Stan wysyłki pochodzi z poprzednio zweryfikowanych prób; foldery z relacji użytkownika.

| Nadawca w tej serii | Odebrane według użytkownika | Spam według użytkownika | Potwierdzone w Wysłanych |
| --- | --- | --- | --- |
| Starsze konto | 5 | 0 | 5 |
| Konto projektu | 0 | 3 | 3 |

Na **tych samych trzech adresach mail2/mail4/mail5** wynik był zgodny we wszystkich parach: starsze konto Odebrane, projekt Spam. Aplikacja, transport Gmail API, klient OAuth, zdekodowany temat, pełne plain/HTML i zatwierdzony PDF/nazwa były zachowane; zmieniały się nadawca, Date, RFC ID i granice MIME. To dotychczas najmocniejsza obserwacja wspierająca **czynnik związany z kontem/identyfikacją nadawcy lub jego relacją z odbiorcą**. Podważa hipotezę, że sam użyty generator/transport zawsze uniemożliwia Odebrane. Nie jest dowodem pełnego wykluczenia każdej interakcji aplikacji z filtrami.

**Nie rozdzielono samego wieku od historii/reputacji konta i wcześniejszych kontaktów starszego nadawcy.** Starsze konto wysyłało pierwsze, projekt kilka minut później; wcześniejsza historia starszego konta i reguły/ustawienia odbiorców nie były sprawdzone. Jedna krótka seria na małej liczbie skrzynek nie dowodzi uniwersalnej skuteczności, minimalnego wieku konta lub poprawy po odczekaniu określonego czasu. Wcześniejsze pozytywne wyniki konta projektu (w tym WP) pozostają zachowane, więc nie deklarujemy, że projekt zawsze trafia do Spamu.

Nie ma nowego dowodu uzasadniającego zmianę MIME lub treści. Najbardziej wartościowy następny krok diagnostyczny **bez nowych wysyłek** to porównanie dwóch rzeczywistych EML odbiorczych już istniejącej pary, np. mail4: starszy nadawca z Odebranych 10:40:46 i projekt ze Spamu 10:43:45, wraz z odpowiadającymi kopiami Wysłanych. Frozen A obu prób już zachowano. Pozwoli porównać transformacje transportu, uwierzytelnienie i kompletne części obu wariantów, ale samo nie ujawni pełnego algorytmu filtra lub potwierdzi wieku jako przyczyny.

Wynik zapisano także w nowym prywatnym pliku 0600 obok materiałów tej serii, bez nadpisania raportu weryfikacji wysyłki. SQLite tylko readonly potwierdziło sender/research paused=true, research active=false, schedule=false, brak aktywnych/niepewnych prób; konto projektu nadal połączone, 19 prób/rezerwacji. **Zero nowych operacji Gmail i zero wysyłek w zapisaniu wyników.** Zmieniono wyłącznie dokumentację; `git diff --check` PASS, pełnego check nie powtarzano (ostatnie wcześniejsze 200 backend / 6 UI).

## 9 października: osiem zleconych prób dwóch nadawców

Użytkownik wskazał pięć dokładnych odbiorców i wyraźnie zlecił jedną wiadomość na każdy adres ze starszego konta oraz wiadomości z konta projektu na adresy bez znanej wcześniejszej wymiany z nim. W lokalnej historii projekt kontaktował już mail1 i mail3; na mail2/mail4/mail5 nie było prób, a użytkownik osobno potwierdził brak korespondencji ręcznej z kontem projektu. Dlatego z konta projektu wykonano wyłącznie trzy próby na mail2/mail4/mail5. Nie przeszukiwano całych skrzynek ani nie odtwarzano usuniętej starej historii konta osobistego. Historia odbiorców względem starszego konta pozostaje niezweryfikowana. Prywatne adresy i materiały pozostają poza repo.

| Odbiorca według listy użytkownika | Starsze konto, Europe/Warsaw | Konto projektu, Europe/Warsaw |
| --- | --- | --- |
| mail1 | 10:37:43, SENT_CONFIRMED | Pominięto: wcześniejsza próba projektu |
| mail2 | 10:40:41, SENT_CONFIRMED | 10:43:41, SENT_CONFIRMED |
| mail3 | 10:40:43, SENT_CONFIRMED | Pominięto: wcześniejsza próba projektu |
| mail4 | 10:40:46, SENT_CONFIRMED | 10:43:45, SENT_CONFIRMED |
| mail5 | 10:40:48, SENT_CONFIRMED | 10:43:47, SENT_CONFIRMED |

Wszystkie **osiem** nowych wiadomości to normalne SELF_TEST z ostatnio zatwierdzonym CV, przez istniejący lokalny backend APPROVAL_REQUIRED: nowy odbiorca, świeży podgląd, zgodny hash, jedna zgoda i jeden send na próbę. Zdekodowany temat, pełny plain/HTML, bajty/typ/nazwa PDF identyczne z zachowanym poprzednim MIME; nowe są From/To/Date/RFC ID i granice. Encoded-words 48/52/29, round-trip poprawny, brak Cc/Bcc/Reply-To i duplikacji podstawowych nagłówków. Każdy zapisany bufor dokładnie odpowiada własnemu podglądowi; konto, adresat i CV sprawdzone osobno. Nie zaimplementowano dowolnego RAW send lub obejścia zgód.

Na początku backend nie działał: odczyt wskazał nieżyjący proces i zero niezaaplikowanych migracji/aktywnego outbox. Pierwsze przygotowanie zakończyło się przed utworzeniem prób; uruchomiono istniejącą zbudowaną wersję APPROVAL_REQUIRED. Po pierwszym starszym mail1 pomocniczy skrypt napotkał INVALID_STATE, gdy dodatkowy odczyt trafił na równoległe automatyczne SENT_CONFIRMED. Wynik niezależnie potwierdzono readonly po ID/buforze/koncie/adresacie; zapisano checkpoint i wykonano wyłącznie mail2–mail5, **bez ponownego send mail1**. Kolejne próby czekały na zakończenie potwierdzenia. Przełączenie OAuth na konto projektu użytkownik zakończył przed trzema nowymi podglądami; zakresy/klient pozostają te same.

Stan końcowy: **19 historycznych prób i 19 rezerwacji, wszystkie SENT_CONFIRMED; dzisiaj 8/10, kampania 19/50, paczka do 3 nadal obowiązuje** (każdy test jest osobnym zatwierdzeniem). Nie resetowano liczników lub bazy. Nadawca połączony i wybrany w kampanii znowu jest kontem projektu; sender/research zatrzymane, schedule=false, killSwitch=false bez zmiany, brak aktywnych/niepewnych prób. Porównanie wszystkich wcześniejszych wierszy prób/ledger/outbox, szkiców/wersji/profilu/faktów/CV ze snapshotem: bez zmian. SQLite integrity_check=ok, foreign_key_check bez naruszeń. Zachowano prywatny snapshot, wszystkie frozen A, podglądy/hashe i wyniki poza repo (0700/0600); nie pobierano dodatkowych RAW Wysłanych ani skrzynek odbiorców.

Wykonano `node --check` prywatnego pomocniczego skryptu oraz dwa lokalne `npm run --silent audit:eml --` z raportami poza repo (referencja + pięć starszych A, następnie referencja + wszystkie osiem A): PASS. Porównania pełnych zdekodowanych części są dokładnie zgodne; nie używano normalizacji białych znaków. `git diff --check` PASS. Kod produktu bez nowych zmian, pełnego check nie powtarzano (ostatnie wcześniejsze 200 backend / 6 UI). W tym etapie wykonano **osiem rzeczywistych wysyłek i celowane potwierdzenia konkretnych prób w Wysłanych**, bez ślepego retry, researchu, push lub zdalnego wdrożenia.

W etapie wysyłki foldery pozostawały nieznane. **Później użytkownik zgłosił 5/5 Odebrane starszego konta i 3/3 Spam projektu — wynik powyżej.** W mail2/mail4/mail5 starsze konto wysłało jako pierwsze, konto projektu jako drugie; sekwencja i możliwa wcześniejsza relacja ze starszym nadawcą ograniczają wnioskowanie. To nowe zlecone porównanie, a nie rozstrzygnięcie przyczyny samego wieku konta. SENT_CONFIRMED potwierdza Wysłane, nie Odebrane. Dla audytu B/C potrzebne są rzeczywiste kopie Wysłanych i odbiorców tej konkretnej serii, nie reprodukcje.

## 9 października: wskazane starsze konto dodane do testerów OAuth

Na osobne wyraźne polecenie użytkownika dodano wskazany adres do Test users istniejącego projektu JobHunter. W konsoli wybrano konto zarządzające projektem, sprawdzono nazwę JobHunter i Google Auth Platform → Odbiorcy. Po zapisie lista widocznie zawiera dwa konta testowe: konto projektu i wskazane starsze konto. Nie nadano ról IAM, nie zmieniono klienta/zakresów OAuth, nie publikowano aplikacji ani nie akceptowano nowych warunków Google Cloud. Prywatnego adresu nie zapisano w repo.

Uruchomiono nowe `npm run gmail:enable-read`, ponieważ poprzednie pięciominutowe logowanie wygasło. Użytkownik zakończył nowe logowanie Google: helper potwierdził połączenie, a lokalne metadane zweryfikowano jako wskazane starsze konto z dotychczasowymi zakresami send/readonly. Nie odtwarzano usuniętego historycznego MIME lub osobistych danych. Zgoda na konkretny send pozostaje odrębnym krokiem. Nadal brak dokładnej listy nowych odbiorców, więc **zero nowych wysyłek**, sender/research zatrzymane, brak aktywnej kolejki, 11 wcześniejszych prób/rezerwacji zachowane. Kod bez zmian; zaktualizowano dokumentację, `git diff --check` PASS. Pełnego check nie powtarzano; poprzedni wynik 200 backend / 6 UI pozostaje wcześniejszym uruchomieniem.

## Nowe zlecenie: przygotowanie porównania ze starszym kontem

Po decyzji o przerwie użytkownik wyraźnie polecił ponowne połączenie wskazanego starszego konta i porównanie większej liczby wyników. To nowe upoważnienie zastępuje wcześniejszy zakaz ponownego podłączania oraz przerwę w zakresie przygotowania tej konkretnej próby; nie upoważnia do dowolnej kampanii lub odczytu całej skrzynki. Docelowe konto projektu pozostaje punktem odniesienia, a prywatnych adresów nie zapisano w repo.

Uruchomiono istniejący `npm run gmail:enable-read`, z dotychczasowym klientem zapisanym w systemowym magazynie haseł i takimi samymi zakresami OAuth: tożsamość/send/readonly. Logowanie otwarto w przeglądarce do zakończenia przez użytkownika; nie odczytywano sekretów do logów ani nie zmieniano kodu generatora/transportu. Ponieważ starsze konto było wcześniej usunięte z testerów, ewentualny 403 wymaga ponownego dodania go w Google Auth Platform przez użytkownika. Nie odtwarzano usuniętych starych danych lub MIME.

Zapytano o dokładną listę odbiorców i wcześniejszą wymianę wiadomości ze starszym nadawcą. Przygotowano prywatny snapshot aktualnej bazy i plan referencyjny poza repo (0700/0600): ta sama zatwierdzona treść plain/HTML, temat, CV i nazwa PDF; po zmianie konta wyłącznie nowe podglądy/hash/zgody. Przed połączeniem sender/research zatrzymane, schedule=false, killSwitch=false, brak aktywnych lub niepewnych prób; 11 stanów/rezerwacji zachowane. **Na etapie przygotowania zero nowych wysyłek.** Połączenie oraz próby nie są potwierdzone, dopóki Google nie zakończy OAuth i nie otrzymamy dokładnych adresatów. Jedna wiadomość na uzgodniony adres, brak automatycznego ponowienia. Wynik nadal należy rozdzielać na poprawność MIME, Wysłane nadawcy i początkowy folder odbiorcy; nie zakładać przyczyny w samym wieku konta.

## Wynik Gmail 21:50: Spam; dalsze eksperymenty wstrzymane

Użytkownik dostarczył rzeczywistą parę Wysłane/odbiorca i zgłosił **Spam**. Kopie jednoznacznie odpowiadają próbie nr 11: zapisany końcowy RFC Message-ID, właściwe konto i adresat. Folder pochodzi z relacji użytkownika; EML nie zawiera etykiet Gmaila. Użytkownik polecił przerwę w dalszych próbach. **Sender i research pozostają zatrzymane, kolejka pusta, schedule_enabled=false**, bez automatycznego wznowienia.

| Źródło | Bajty EML | Date w Europe/Warsaw | Encoded-words Subject | Plain / HTML / PDF, zdekodowane bajty |
| --- | --- | --- | --- | --- |
| A, zachowany frozen | 83459 | 8 października 21:49:26 | Q: 48/52/29 | 778 / 870 / 58698 |
| B, dostarczone Wysłane | 83712 | 8 października 21:50:52 | Q: 48/52/29 | 778 / 870 / 58698 |
| C, dostarczony odbiorca | 90209 | 8 października 21:50:52 | B: 84/32 | 787 / 872 / 58698 |

A odpowiada dokładnie buforowi i hashowi zapisanej próby. **A→B: całe zakodowane body oraz wszystkie pełne zdekodowane części identyczne**, bez normalizacji. Gmail zmienił RFC ID z .local na mail.gmail.com oraz Date o +86 s. B/C zachowują końcowy RFC ID, From, To i rzeczywisty Date; Delivered-To odpowiada To. C raportuje **SPF/DKIM/DMARC/ARC PASS**. DKIM body hash relaxed zgodny; pełnego podpisu/DNS nie weryfikowano.

B→C: PDF (nazwa/typ/rozmiar/bajty/SHA-256) identyczny. Plain: siedem spacji zastąpionych CRLF i jeden końcowy CRLF; HTML: jeden końcowy CRLF; brak zmian pozostałych znaków. Zgodność dokładna i po wyłącznie CRLF→LF false. Subject 84/32 (linie 93/33) pojawia się dopiero w C; A/B mają poprawne 48/52/29 (linie 57/53/30). Topologia MIME zachowana, nagłówki podstawowe pojedyncze, brak Cc/Bcc/Reply-To, round-trip poprawny. Brak defects tolerancyjnego parsera nie oznacza pełnej zgodności RFC.

**Wszystkie pełne zdekodowane części plain/HTML/PDF wraz z nazwą tej kopii Gmail ze Spamu są dokładnie identyczne z aplikacyjną kopią WP z Odebranych**, bez normalizacji. Ta sama transformacja tematu/tekstów występuje w pozytywnych i negatywnych wynikach; nie wyjaśnia samodzielnie Spamu. Nie wykazano nowej usterki generatora, uszkodzenia CV lub zmiany słów treści. Uwierzytelnienie PASS nie gwarantuje folderu.

Wiek konta, historia/reputacja nadawcy, sposób wysyłki i kontekst odbiorcy pozostają hipotezami. Lokalnie nie było dawnych prób aplikacji na ten adres Gmail, lecz ręcznej historii/reguł nie potwierdzono niezależnie i nie wykonano wariantu ręcznego na niezależnym odbiorcy Gmail. Ręczny mail z tego samego konta wcześniej trafiał do Odebranych; pierwsza aplikacyjna próba WP również była pozytywna. **Nie ma dowodu, że starsze konto jest wymagane lub samo odczekanie rozwiąże problem.** Przejrzane [wytyczne Google](https://support.google.com/mail/answer/81126?hl=en) opisują reputację domen/IP i zgłoszenia odbiorców, bez gwarantowanego wieku konta zapewniającego Odebrane. Nie utożsamiono tych ogólnych sygnałów z pomiarem reputacji konkretnego osobistego konta Gmail.

Nowe sprawdzenia: `npm run --silent audit:eml --` dla A/B/C z prywatnym `--output` poza repo PASS wykonania analizy; niezależne Python/email/difflib i inspection.ts; `git diff --check` PASS. Oryginały/raporty 0600 poza repo. Tylko dokumentacja zmieniona, pełnego check nie powtarzano; poprzedni wynik 200 backend / 6 UI pozostaje historyczny. SQLite tylko readonly, nadal 11 SENT_CONFIRMED/rezerwacji, sender paused=true, research paused=true/active=false, killSwitch=false bez zmiany, brak aktywnego outbox. **Zero nowych operacji Gmail i zero wysyłek. Dalsze eksperymenty wstrzymane na prośbę użytkownika.**

## Nowe zlecenie: reset dziennego wykorzystania i jedna próba Gmail, 21:50

Po pozytywnym wyniku pary WP użytkownik wyraźnie polecił wysłanie tej samej wiadomości z programu na nowo wskazany adres Gmail. Początkowo wysyłkę zatrzymało rzeczywiste wykorzystanie 10/10 dziennych rezerwacji. Użytkownik następnie wyraźnie polecił reset limitów, zmieniając wcześniejsze wymaganie zachowania licznika. Zresetowano **bieżące dzienne wykorzystanie**, bez usuwania historii lub zmiany dat dawnych prób: zapisano w istniejącym app_state jawny baseline 10 dla tej kampanii i dnia. Nie zmieniono limitów 10/3/50 ani konta/OAuth, materiałów lub blokad. Limit kampanii nadal liczy wszystkie rzeczywiste rezerwacje.

- Dodano `dailyQuota` / `resetDailyQuota` w service.ts i uwierzytelniony endpoint `POST /api/gmail/quota/reset`, chroniony dotychczasowym Host/Origin/sesją/CSRF. Reset wymaga confirmed=true, bieżącego dnia i zgodnego rzeczywistego licznika. Wymaga pauzy oraz braku QUEUED/SENDING/SEND_UNKNOWN/SENT_PROVIDER; nie ponawia send ani nie wyłącza kill switcha. Wpis audytu przechowuje fakt ręcznego resetu. Dashboard pokazuje bieżące wykorzystanie po resecie, natomiast liczbę rzeczywistych wysyłek i historię pozostawia pełne. Baseline nie działa w innym dniu/kampanii ani przy nieprawidłowej wartości. Reset jest wyłącznie ręczny.
- Przed zmianą runtime zachowano prywatny snapshot istniejącej bazy (poza repo, katalog 0700/pliki 0600). Nie dodano migracji; kontrola potwierdziła zero niezaaplikowanych migracji. Testy korzystały z syntetycznych adresów i tymczasowych baz. Po przejściu pełnego check zatrzymano dotychczasowy lokalny backend i uruchomiono sprawdzoną wersję w APPROVAL_REQUIRED, nadal bez researchu lub wznawiania kolejki.
- Reset normalnym lokalnym API dał **0/10**, zachowując dziesięć dawnych prób/rezerwacji. Nowy adres testowy, świeży podgląd i zgoda dotyczyły jednej wersji: temat, pełny plain/HTML i zatwierdzony PDF wraz z nazwą dokładnie zgodne z poprzednią próbą WP. Hash/round-trip poprawne, encoded-words **48/52/29**, jeden zamierzony odbiorca, brak Cc/Bcc/Reply-To. Zamrożony A zachowano prywatnie.
- **Jedna wysyłka** powstała 8 października 2026 o **21:50:51.859 Europe/Warsaw** (19:50:51.859 UTC), stan **SENT_CONFIRMED** zapisano o 21:50:53.444. Gmail id/thread id obecne. Bufor próby dokładnie zgodny z podglądem. Potwierdzenie obejmowało tylko tę znaną próbę w Wysłanych; nie przeglądano całej skrzynki ani skrzynki odbiorcy. Nie wykonywano dodatkowego RAW GET lub ponowienia send.
- Stan końcowy: **11 SENT_CONFIRMED i 11 historycznych rezerwacji**, bieżące wykorzystanie po resecie **1/10**, kampania **11/50**. Sender ponownie paused=true, schedule/research wyłączone, killSwitch=false bez zmiany, brak aktywnej kolejki. Porównanie ze snapshotem potwierdziło wszystkie dawne wiersze send_attempts/usage_ledger/outbox, szkice i ich wersje, profil/fakty/CV bez zmian. SQLite integrity_check=ok, foreign_key_check bez naruszeń.

Rzeczywiście uruchomiono `node --import tsx --test tests/gmail-delivery.test.ts`: pierwszy wynik 52/53, z błędnym oczekiwaniem nowego testu FAILED_NOT_SENT zamiast istniejącego BLOCKED przy limicie kampanii. Poprawiono samą asercję. Następny pełny **`npm run check`: 200/200 backend, 6/6 UI (27,6 s), typecheck/build PASS**. Regresje resetu obejmują zachowanie historii/pauzy/kill switcha, nową dokładnie zatwierdzoną próbę, nieaktualny dzień/licznik, niepewne/oczekujące próby, obcy/uszkodzony baseline, niezmieniony limit kampanii oraz odcięcie endpointu w DEMO/RESEARCH_ONLY. `git diff --check` PASS. Końcowy pomocniczy skrypt raportowy użył nieistniejącej kolumny confirmed_at; skorygowano wyłącznie odczyt na aktualny schemat i niezależnie potwierdzono wynik, **bez ponownego zatwierdzania lub send**. Windows nadal nieprzetestowany. Brak push lub zdalnego wdrożenia.

W tym etapie folder odbiorcy był nieznany. **Później dostarczono oba EML i zgłoszono Spam; wynik i decyzja o przerwie są na początku raportu.** W etapie wysyłki wykonano jedną rzeczywistą wiadomość aplikacji i celowane potwierdzenie Wysłanych. Udane testy resetu i SENT_CONFIRMED nie dowodzą poprawy Spamu. Wcześniejsza para WP pozostaje osobnym, kompletnym pozytywnym wynikiem.

## Wynik pierwszych kontaktów WP: obie wiadomości w Odebranych

Użytkownik dostarczył cztery rzeczywiste źródła: `mail1wyslane.eml`, `mail1odebrane.eml`, `mail2wyslane.eml`, `mail2odebrane.eml` i zgłosił, że **obie wiadomości od razu trafiły do Odebranych**. Mail1 to wariant ręczny, mail2 to pojedyncza próba aplikacji nr 10. Obie kopie odbiorców zawierają **X-WP-SPAM: NO** i **X-WP-DKIM-Status: good (id: gmail.com)**. Wynik początkowego folderu pochodzi z relacji użytkownika; nagłówki dodatkowo potwierdzają klasyfikację WP jako niespamową. Brak wcześniejszego kontaktu zadeklarował użytkownik, a wcześniejsze lokalne sprawdzenie nie znalazło prób aplikacji do tych dwóch adresów. Reguł ani całych skrzynek nie odczytywano.

| Źródło | Date w Europe/Warsaw | Encoded-words Subject | Plain / HTML / PDF, zdekodowane bajty |
| --- | --- | --- | --- |
| Mail1, ręczne Wysłane | 8 października 20:45:14 | B: 84/32 | 787 / 872 / 58698 |
| Mail1, odbiorca | 8 października 20:45:14 | B: 84/32 | 787 / 872 / 58698 |
| Mail2, aplikacja Wysłane | 8 października 20:41:08 | Q: 48/52/29 | 778 / 870 / 58698 |
| Mail2, odbiorca | 8 października 20:41:08 | B: 84/32 | 787 / 872 / 58698 |

Daty uwzględniają strefy: zapis aplikacji 14:41:08 -0400 odpowiada 18:41:08 UTC i 20:41:08 Europe/Warsaw. W każdej parze Wysłane→odbiorca zachowano RFC Message-ID, nadawcę, adresata, zdekodowany temat i rzeczywisty moment Date. Delivered-To po rozpoznaniu adresów odpowiada To. Aplikacyjną kopię jednoznacznie powiązano z próbą nr 10 przez zapisany końcowy RFC ID oraz konto/adresata; dostarczone Wysłane są bajtowo identyczne z wcześniej celowo odczytanym RAW tej próby. Nie oparto powiązania wyłącznie na podobnej treści.

- **Ręczne Wysłane→odbiorca:** wszystkie pełne zdekodowane części i nazwa PDF identyczne bez normalizacji. Zmieniono granice multipart i dodano nagłówki transportu. Surowe całe wiadomości i zakodowane body nie są identyczne.
- **Aplikacja A→Wysłane:** zachowany zamrożony MIME ma identyczne całe zakodowane body i wszystkie zdekodowane części/PDF. Subject 48/52/29 pozostaje poprawny. Zmiany RFC ID i Date +91 s opisano w sekcji wysyłki poniżej.
- **Aplikacja Wysłane→odbiorca:** PDF, jego nazwa, typ, rozmiar i SHA-256 zgodne bajt w bajt. Po wyłącznie CRLF→LF w tekstach znaleziono siedem spacji zastąpionych podziałem wiersza i jeden dodany końcowy podział w plain; HTML dostał jeden końcowy CRLF. Bez zmian pozostałych znaków. Zgodność dokładna oraz po samej CRLF→LF są false; nie usuwano wszystkich białych znaków.
- **Obie kopie odbiorców:** pełne zdekodowane plain, HTML i PDF wraz z nazwą załącznika są dokładnie identyczne, bez normalizacji. Zgodne są też surowy Subject i From; inne pozostają To, RFC ID, czas i granice. Nie są to identyczne całe wiadomości.
- Wszystkie cztery źródła zachowują mixed→alternative(plain+HTML)+PDF, UTF-8/quoted-printable i base64 PDF. Podstawowe nagłówki pojedyncze; brak Cc/Bcc/Reply-To, samotnych CR/LF. Round-trip Buffer→base64url→Buffer poprawny. Zero defects tolerancyjnego parsera nie oznacza pełnej walidacji RFC.
- W obu kopiach odbiorców DKIM body hash relaxed zgodny; **nie wykonano pełnej weryfikacji podpisu/DNS**. Brak Authentication-Results i osobnych wyników SPF/DMARC odbiorcy WP, więc nie deklarujemy ich PASS. Opaque oznaczenie **(U9) występuje również przy NO**, tak jak wcześniej przy YES; sam kod nie oznacza Spamu, jego znaczenie nadal nieustalone.

**Pierwsza wiadomość aplikacji może trafić do Odebranych na WP z obecnym nadawcą, HTML i zatwierdzonym PDF, bez ręcznej wiadomości poprzedzającej na ten sam adres.** W tej parze wysłano aplikację wcześniej niż wariant ręczny i do innej skrzynki. To obala konieczność wcześniejszego ręcznego kontaktu dla każdego odbioru WP, lecz nie wyjaśnia wcześniejszych wyników Spam i nie dowodzi uniwersalnej naprawy ani skuteczności u odbiorców Gmail. Jedna para nie rozdziela wszystkich różnic między skrzynkami/czasem.

Encoded-word 84 jest obecny w obu pozytywnych kopiach odbiorców, a także w ręcznej kopii Wysłanych. W aplikacji nie występuje w A/B; pojawia się dopiero na odcinku B→C, tak jak w wcześniej badanej próbie 3. Nie ustalono konkretnego komponentu transportu, który wykonuje transformację. **Nie ma podstaw do wymuszonej zmiany poprawnego lokalnego generatora ani uznania tego fragmentu za ustaloną przyczynę Spamu.**

Para WP jest kompletna: nie są potrzebne kolejne pliki dla tych dwóch wiadomości. Oryginały, frozen A i raporty zachowano prywatnie poza repo (katalog 0700, pliki 0600). Nowe sprawdzenia: niezależne Python/email/difflib i inspection.ts oraz trzy wywołania `npm run --silent audit:eml --` z `--output` poza repo: ręczne Wysłane→odbiorca, aplikacyjne A→Wysłane→odbiorca i obie kopie odbiorców — **PASS**. PASS oznacza wykonanie analizy, a nie zgodność każdej porównywanej pary. `git diff --check` PASS. Zmieniono tylko dokumentację; pełnego npm check po analizie nie powtarzano, poprzednie 197/197 backend i 6/6 UI pozostają wynikiem wcześniejszego uruchomienia.

W tym etapie **zero nowych operacji Gmail i zero nowych wysyłek**; SQLite wyłącznie readonly. Pozostaje 10 prób/rezerwacji, brak aktywnych wysyłek, sender paused=true, killSwitch=false bez zmiany. Łączny zakres późniejszego osobnego zlecenia to nadal jedna wysyłka aplikacji opisana poniżej; wariant ręczny wysłał użytkownik. Następny rekomendowany eksperyment, wyłącznie jako plan: analogiczna para pierwszych kontaktów na nowych, niezależnych odbiorcach **Gmail**. Aktualny limit dzienny jest wykorzystany; nie zwiększać go ani nie powtarzać prób na tych samych adresach jako nowych pierwszych kontaktów.

## Nowe zlecenie użytkownika: jedna wiadomość aplikacji na WP, 20:41

Po zakończeniu audytu offline użytkownik wskazał dwie nowe skrzynki WP, potwierdził brak wcześniejszej wymiany wiadomości z kontem projektu i następnie wyraźnie polecił: „wyślij na jednego maila sam wiadomość a na drugiego daj mi wzór”. Zrealizowano **jedną wiadomość aplikacji na mail2**; wariant mail1 użytkownik później wysłał ręcznie. Prywatnych adresów nie zapisano w repo. Pochodzenie i folder odbiorcy WP są osobną sprawą od potwierdzenia Wysłanych.

- Użyto działającego lokalnego backendu **APPROVAL_REQUIRED** i normalnych endpointów testowego odbiorcy, podglądu oraz zatwierdzania SELF_TEST z CV. Nie uruchamiano nowego backendu, migracji, researchu ani kampanii. Przed zgodą nie było żadnej oczekującej/niepewnej wysyłki, schedule_enabled=false, sender był zatrzymany.
- Dokładna aktualna wersja szkicu miała identyczne temat i body jak zachowana porównana próba 3; jej wersja i zatwierdzony CV były niezmienione. Zlecenie dotyczyło uzgodnionego wariantu z tym samym tekstem i PDF. Utworzono nowy podgląd dla wskazanego mail2, zamrożono MIME i sprawdzono hash. Następnie wykonano pojedyncze zatwierdzenie tej wersji na podstawie nowego polecenia użytkownika, bez omijania bramek. Nie modyfikowano wcześniej zatwierdzonych bajtów.
- Próba powstała **8 października 2026 o 20:41:07 Europe/Warsaw** (18:41:07.497 UTC), a potwierdzenie zapisano o 20:41:08.955: **SENT_CONFIRMED**, Gmail message id/thread id obecne. Bufor zapisanej próby i jego hash są dokładnie zgodne z nowym podglądem. **Jedna próba i jedna nowa rezerwacja**, bez retry; wcześniejsze dziewięć stanów zachowane.
- Stan po wysyłce: **10 SENT_CONFIRMED i 10 rezerwacji** z 8 października, limit dzienny nadal **10**, bez zwiększenia/resetu. Brak aktywnych wysyłek, **sender ponownie zatrzymany**, research/schedule wyłączone, killSwitch=false jak przed próbą. Nie wykonywano kolejnej wysyłki na mail1 ani drugiej na mail2.
- Wzór ręczny oraz niezmieniony PDF z dokładną nazwą załącznika zapisano prywatnie poza repo (katalog 0700, pliki 0600) i udostępniono użytkownikowi. Wzór ma ten sam temat, pełny tekst i PDF co zatwierdzona wiadomość aplikacji; różni się uzgodnionym odbiorcą. Fakty profilu, projekty, szkice i CV pozostały bez zmian.

Zachowano też rzeczywistą parę A/B nowej próby: zamrożony MIME oraz RAW Wysłanych. **Jednorazowy odczyt RAW obejmował wyłącznie znany Gmail id tej konkretnej próby**, w granicach jej aktualnej zgody aplikacji; potwierdzono konto, adresata, SENT, thread id i zaobserwowany końcowy RFC ID. Bez wyszukiwania/listowania całej skrzynki, bez powtórzenia send, bez odczytu WP. RAW i pełny raport pozostają poza repo/logami publicznymi.

RAW Wysłanych ma 83704 bajty. **Cały zakodowany body MIME jest identyczny z A**, podobnie jak wszystkie pełne zdekodowane części i załącznik wraz z nazwą. Subject ma poprawne encoded-words **48/52/29**. Gmail zmienił Message-ID oraz Date: A **20:39:37**, B **20:41:08 Europe/Warsaw** (rzeczywiste +91 sekund); dodano Received. Nie zmieniono źródła A po zatwierdzeniu. Wynik nie dowodzi folderu Odebrane na WP.

W tym etapie wynik folderów i ręcznej wysyłki był jeszcze nieznany. **Później dostarczono wszystkie cztery EML i zgłoszono Odebrane obu wariantów; pełny wynik jest na początku raportu.** Brak wcześniejszego kontaktu jest deklaracją użytkownika i wynikiem lokalnego sprawdzenia prób aplikacji, nie odczytem prywatnych skrzynek WP; reguł WP nie sprawdzano zdalnie. Wykonano kontrolę rzeczywistego stanu/bufora oraz `git diff --check` PASS. Kodu nie zmieniono i nie powtarzano pełnego npm check po operacjach runtime i dokumentacji. Przyczyna wcześniejszego Spamu nadal nieustalona.

## Wynik porównania: właściwa ręczna kopia odbiorcy, 13:49:39

Najnowszy dostarczony EML (90026 bajtów) dotyczy **ręcznej wiadomości z 8 października 2026, 13:49:39 Europe/Warsaw** (11:49:39 UTC). Powiązanie z zachowaną ręczną kopią Wysłanych (83499 bajtów) potwierdzają identyczny RFC Message-ID, From, To, Date i Subject. Delivered-To odpowiada To. Nagłówki Received wskazują 13:49:51–52 Europe/Warsaw. Ręczne pochodzenie i wynik Odebrane pochodzą ze wskazania/historii użytkownika; w EML brak etykiet folderu. Nie wykonano nowego odczytu skrzynki.

Porównanie rzeczywistej pary ręcznej Wysłane→odbiorca:

- **Pełne zdekodowane części identyczne bez normalizacji**: plain 787 bajtów, HTML 872 bajty, PDF 58698 bajtów. Nazwa, typ, disposition i bajty/SHA-256 PDF zgodne. `decodedPartsExact=true`, `decodedPartsLF=true`; surowe wiadomości i zakodowane body różne.
- **Subject identyczny także w postaci surowej**: UTF-8/B encoded-words **84/32**, fizyczne linie **93/33** w obu źródłach. Przekroczenie limitu RFC 2047 występuje również w źródle ręcznej wiadomości zgłoszonej jako Odebrane.
- Topologia mixed→alternative(plain+HTML)+PDF i kodowania UTF-8/quoted-printable oraz base64 PDF zachowane. Zmieniły się granice MIME. Jedyny zmieniony istniejący nagłówek główny to Content-Type (granica); dodano nagłówki odbiorcy/transportu/uwierzytelnienia. From/To/Date/RFC ID nie zmieniły się.
- Podstawowe nagłówki pojedyncze, brak Cc/Bcc/Reply-To i samotnych CR/LF. Base64url round-trip obu źródeł poprawny. Brak błędów tolerancyjnego parsera nie jest pełną walidacją RFC.
- Authentication-Results odbiorcy: **SPF/DKIM/DMARC/ARC PASS**. DKIM body hash relaxed zgodny; **nie wykonano pełnej kryptograficznej weryfikacji podpisu ani DNS**.

Pełne zdekodowane plain, HTML i bajty PDF tej ręcznej kopii odbiorcy są również **identyczne z kopią odbiorcy próby aplikacji nr 4 z 13:53:46**, bez normalizacji. Różni się nazwa PDF. Surowy Subject, From i To są zgodne. W Received aplikacji obecne HTTPREST, w dostarczonej kopii ręcznej SMTP/SMTPS; to obserwacja ścieżki, bez dowodu wpływu na klasyfikację. Nie traktowano wspólnych nagłówków, treści ani załącznika jako dowodu powiązania z jedną próbą: oba maile mają własne RFC ID i czasy.

| Wiadomość u odbiorcy | Folder według wcześniejszej relacji użytkownika | Encoded-words Subject | Uwierzytelnienie według nagłówków |
| --- | --- | --- | --- |
| Aplikacja, próba 3, 13:31:27 | Spam | 84/32 | SPF/DKIM/DMARC/ARC PASS |
| Ręczna, 13:49:39 | Odebrane | 84/32 | SPF/DKIM/DMARC/ARC PASS |
| Aplikacja, próba 4, 13:53:46 | Odebrane po ręcznej | 84/32 | SPF/DKIM/DMARC/ARC PASS |

**Sam encoded-word 84 nie rozróżnia zgłoszonych wyników Spam/Odebrane i nie jest ustaloną przyczyną Spamu.** Nie wykluczono udziału dowolnej cechy w połączeniu z innymi sygnałami, lecz brak podstaw do wymuszonej poprawki aktualnego generatora: A/B próby 3 mają poprawne 48/52/29, a transformację obserwowano dopiero w C. Nie wykazano uszkodzenia PDF ani odmiennych słów tekstu. Nie dowiedziono też, że historia odbiorcy spowodowała zmianę folderu — sekwencja na jednym adresie nie oddziela sposobu wysyłki od historii kontaktu.

**Para ręczna jest już kompletna; kolejny plik nie jest potrzebny do tego porównania.** Historyczne braki ograniczające inne porównania: RAW Wysłanych pierwszej próby aplikacji 12:31:31; RAW Wysłanych próby 4 13:53:46; usunięty wcześniej zamrożony MIME pierwszej próby (nie odtwarzać). Oryginalne wcześniejsze EML aplikacji analizowano w poprzednich etapach, lecz użytkownik zastąpił/usunął pliki pod wskazanymi ścieżkami; pozostają zapisane wyniki ich pomiarów, a nie nowe kopie źródeł. Nowe wyniki nie zastąpiły wcześniejszych wiadomości reprodukcją.

Wykonano niezależne lokalne porównanie Pythonem oraz `inspection.ts` i uruchomiono `npm run --silent audit:eml --` dla prywatnych kopii Wysłanych/odbiorcy z `--output` do nowego pliku poza repo: **PASS**. Prywatny katalog 0700, EML i raport 0600. `git diff --check` PASS. Po samej analizie EML zmieniono tylko dokumentację; pełnego check nie powtarzano. Ostatni wcześniejszy pełny wynik pozostaje 197/197 backend, 6/6 UI, typecheck/build PASS. Zero operacji Gmail i nowych wysyłek.

## Uzupełnienie: nowy EML odbiorcy to próba aplikacji nr 4, 13:53:46

Nowy plik odbiorcy (90228 bajtów) ma Date **8 października 2026, 13:53:46 Europe/Warsaw** (11:53:46 UTC). **To kopia próby aplikacji nr 4**: końcowy RFC Message-ID jest dokładnie zgodny z zachowanym identyfikatorem tej próby; From/To/Subject i PDF również odpowiadają rekordowi. SQLite odczytano readonly. Nie utożsamiono go z ręczną wiadomością z 13:49:39, ponieważ Date i końcowy RFC Message-ID są inne. Zachowana prywatna kopia dostała nazwę odpowiadającą ustalonej próbie, aby nie utrwalić błędnej proweniencji.

Nowe pomiary:

- Subject w kopii odbiorcy: encoded-words B **84/32**, linie **93/33**; surowy Subject identyczny z dostarczoną ręczną kopią Wysłanych. Dla próby nr 4 nadal brakuje RAW Wysłanych, więc nowe A→C nie lokalizuje dokładnie etapu transformacji dla tej próby.
- Pełne zdekodowane text/plain **787 bajtów** i text/html **872 bajty** są **bajtowo identyczne z ręczną kopią Wysłanych z 13:49:39**, bez normalizacji. PDF **58698 bajtów** także jest bajtowo identyczny, ale nazwa PDF różni się między wiadomością aplikacji i ręczną. Z tego powodu porównanie wszystkich części uwzględniające nazwy zwraca false. Nie nazwano tych wiadomości w pełni identycznymi.
- Zamrożony MIME próby nr 4 ma zgodny zapisany hash. A→C: te same zmiany tekstu co opisane wcześniej (siedem spacji→CRLF i jeden końcowy CRLF w plain, jeden końcowy CRLF w HTML); PDF identyczny z zatwierdzonym, także nazwa. Nie stwierdzono zmian innych znaków tekstu. Granice multipart są inne niż w ręcznej kopii Wysłanych; topologia pozostaje mixed→alternative(plain+HTML)+PDF.
- Delivered-To odpowiada To; brak Cc/Bcc/Reply-To, duplikatów podstawowych nagłówków i samotnych CR/LF. Round-trip base64url obu porównywanych EML poprawny.
- Authentication-Results raportuje **SPF/DKIM/DMARC/ARC PASS**. DKIM body hash relaxed zgadza się; pełnego podpisu/DNS nie weryfikowano.

Według zapisanej wcześniejszej relacji użytkownika **ta próba aplikacji nr 4 trafiła do Odebranych po ręcznej wiadomości**. Sam EML nie zawiera etykiet potwierdzających folder. Przy tym zastrzeżeniu mamy encoded-word 84 zarówno w źródle wiadomości aplikacji zgłoszonej jako Spam (próba 3), jak i w źródle wiadomości aplikacji zgłoszonej jako Odebrane (próba 4). Samo przekroczenie nie rozróżnia tych wyników i nie jest wykazaną przyczyną Spamu. To również nie dowodzi naprawy dostarczalności: zmieniła się historia kontaktu tego samego odbiorcy.

Na tym etapie brakowało EML ręcznej wiadomości 13:49:39 z Odebranych; później dostarczono właściwy plik opisany na początku raportu. EML 13:53:46 pozostaje osobną próbą aplikacji. Odczytano wyłącznie lokalne pliki i readonly SQLite; nie wykonano żadnej operacji Gmail ani nowej wysyłki. Analizę powtórzono niezależnie Pythonem i `inspection.ts`. Zmieniono wyłącznie dokumentację; pełnych testów kodu nie powtarzano. `git diff --check` PASS.

## Uzupełnienie: ręczna wiadomość z Wysłanych, 13:49:39

Użytkownik dostarczył kolejną wersję pliku o tej samej nazwie, wskazując ją jako ręczną wiadomość z Wysłanych. Ma 83499 bajtów i Date **8 października 2026, 13:49:39 Europe/Warsaw** (11:49:39 UTC). Pasuje do przedziału wywnioskowanego z historii prób 3→ręczna→4. Nadawca, pojedynczy odbiorca i zdekodowany temat zgadzają się z próbą nr 3. Końcowy RFC Message-ID jest inny niż w próbie 3 i nie odpowiada żadnemu zachowanemu końcowemu RFC ID aplikacji. Pochodzenie z ręcznej wysyłki ustalono na podstawie wskazania użytkownika; sam EML nie dowodzi użycia interfejsu Gmaila ani folderu odbiorcy.

**Ręczna kopia z Wysłanych również ma encoded-words Subject 84/32 i fizyczne linie 93/33.** Limit RFC 2047 jest przekroczony także w tym źródle. Tym samym cecha ta nie jest swoista dla aplikacji. Dla aplikacji pojawiła się między B a C; dla ręcznej wiadomości występuje już w dostarczonym źródle Wysłanych. W później dostarczonym ręcznym EML odbiorcy potwierdzono ten sam surowy Subject — aktualny wynik jest na początku raportu. Nie uznano tego wyniku za dowód przyczyny ani wykluczenia udziału tej cechy w Spamie.

Porównanie z zachowanym, zgodnym hashem zamrożonym MIME próby nr 3:

- Topologia: multipart/mixed z multipart/alternative (plain + HTML) oraz jednym PDF. From/To zgodne, bez Cc/Bcc/Reply-To, podstawowe nagłówki pojedyncze, brak samotnych CR/LF.
- PDF: **58698 bajtów, identyczne bajty/SHA-256 jak zatwierdzony załącznik tej próby**, lecz nazwa załącznika jest inna (29 versus 33 znaki). Nie normalizowano nazw; różnica nie znika po NFC lub zmianie wielkości liter. Prywatnych nazw nie zapisano w raporcie.
- Plain: 787 versus 778 bajtów. Po wyłącznie CRLF→LF znaleziono siedem zamian spacji na podział wiersza i jeden dodany końcowy podział wiersza, bez zmian innych znaków.
- HTML: 872 versus 870 bajtów; wyłącznie dodany końcowy CRLF. Dokładna zgodność części oraz zgodność po CRLF→LF są **false**; nazwa PDF także różni się. Nie nazwano tych źródeł identycznymi.
- Brak Delivered-To, Received, DKIM-Signature i Authentication-Results w tej kopii. Nie jest to wynik FAIL uwierzytelnienia u odbiorcy. Nie wykonano dla niej kontroli podpisu ani body hash.

Wykonano lokalną inspekcję Pythonem i `inspection.ts`, SQLite wyłącznie readonly. Zachowano prywatną kopię dostarczonego pliku w katalogu tymczasowym poza repo (katalog 0700, plik 0600), żeby następny plik o tej samej nazwie nie uniemożliwił porównania. Poprzedni plik odbiorcy próby 3 nie jest już dostępny pod dawną ścieżką; jego wcześniejsze wyniki pozostają osobną obserwacją. Zaktualizowano wyłącznie raport; nie powtarzano pełnych testów kodu. Zero operacji Gmail i nowych wysyłek.

## Uzupełnienie: kopia odbiorcy tej samej próby nr 3

Kolejny dostarczony EML odbiorcy (90217 bajtów) dotyczy **tej samej wiadomości co kopia Wysłanych**: identyczny końcowy RFC Message-ID, From, To, zdekodowany Subject i Date 13:31:27 Europe/Warsaw. Delivered-To odpowiada adresatowi; obecne są nagłówki transportu i uwierzytelnienia odbiorcy. Nie wywnioskowano folderu Spam z samego EML, ponieważ brak w nim etykiet Gmaila: plik dostarczono w odpowiedzi na prośbę o kopię wiadomości, która trafiła do Spamu.

Mamy teraz rzeczywiste A→B→C jednej próby: zamrożony MIME → Wysłane → odbiorca. Nowa obserwacja lokalizuje transformację Subject:

| Cecha | A: przed API | B: Wysłane | C: odbiorca |
| --- | --- | --- | --- |
| Encoded-words Subject UTF-8 | Q: 48/52/29 | Q: 48/52/29 | B: **84/32** |
| Fizyczne linie Subject | 57/53/30 | 57/53/30 | **93/33** |
| Zdekodowany Subject | Zgodny | Zgodny | Zgodny |
| Text/plain, zdekodowane bajty | 778 | 778 | 787 |
| Text/html, zdekodowane bajty | 870 | 870 | 872 |
| PDF, zdekodowane bajty | 58698 | 58698 | 58698, identyczne bajty/SHA-256 |

**Encoded-word 84 dla tej próby nie powstał w lokalnym generatorze ani nie występuje w kopii Wysłanych. Jest widoczny dopiero w dostarczonym źródle odbiorcy**, wraz ze zmianą kodowania Q→B i granic multipart. Można zatem wskazać odcinek B→C, lecz nie konkretny wewnętrzny komponent/etap Google. Przekroczenie RFC 2047 jest rzeczywistą obserwacją w C, nie dowodem przyczyny Spamu. Nie zmieniono generatora, aby kompensować nieustaloną transformację transportu. Pierwsza próba pozostaje osobną obserwacją z brakującym A/B.

Dokładne porównanie treści A/B↔C jest **niezgodne**, także po samej normalizacji CRLF→LF. Analiza różnic po tej jawnej normalizacji wskazuje wyłącznie:

- text/plain: siedem spacji zastąpiono podziałami wierszy CRLF, dodano jeden końcowy CRLF. Liczba CRLF wzrosła z 13 do 21. Nie znaleziono zmian innych znaków; nie nazwano tych tekstów bajtowo identycznymi i nie usuwano wszystkich białych znaków.
- text/html: dodano jeden końcowy CRLF, bez innych zmian. Bez tego terminalnego CRLF tekst HTML byłby zgodny; jest to osobno opisany fakt, nie rozszerzenie normalizacji w audytorze.
- PDF: identyczna nazwa/typ/rozmiar/bajty, bez jakiejkolwiek normalizacji.

Topologia pozostaje multipart/mixed → multipart/alternative (text/plain + text/html) + application/pdf. Wszystkie podstawowe nagłówki pojedyncze, From/To/Date/końcowy RFC ID zgodne; brak Cc/Bcc/Reply-To. Nie zaobserwowano samotnych LF/CR w surowym EML. Zmieniły się granice multipart i dodano nagłówki transportu/uwierzytelnienia. Nagłówki C raportują **SPF/DKIM/DMARC/ARC PASS**; digest kanonizowanego body (relaxed) odpowiada bh= DKIM. Subject jest wymieniony w h= podpisu, ale pełnego podpisu/DNS nie weryfikowano niezależnie i nie użyto samego body hash jako dowodu weryfikacji nagłówków.

Wykonano lokalne porównanie `inspection.ts`, niezależne dekodowanie Pythonem i analizę różnic `difflib`, bez wykonywania zawartości/odnośników. SQLite otwarto wyłącznie readonly. `git diff --check` PASS. Kod, runtime, zgody, stany prób i liczniki bez zmian; zero operacji Gmail oraz nowych wysyłek. Pełnego zestawu testów po samej analizie dokumentacji nie powtarzano. Kolejnym brakującym plikiem jest ręczna wiadomość do tego samego odbiorcy, która trafiła do Odebranych; jej Subject pokaże, czy recoding 84/32 występuje także w pozytywnym wyniku dostarczalności.

## Uzupełnienie: dostarczona kopia Wysłanych próby nr 3

Użytkownik dostarczył nowy EML o tej samej nazwie pliku co wcześniejszy EML odbiorcy. To **inny plik i inna próba**: 83711 bajtów, Date 8 października 13:31:27 Europe/Warsaw (11:31:27 UTC), bez Delivered-To i wyników uwierzytelnienia odbiorcy. Jest zgodny z kopią Wysłanych, o którą poproszono. Powiązanie z próbą nr 3 potwierdzono przez zapisany zaobserwowany końcowy RFC Message-ID oraz nadawcę/adresata; nie oparto go wyłącznie na podobnej treści. Powiązanie badano na SQLite readonly, bez zapisu i bez odczytu prawdziwego Gmaila. Pod tą ścieżką nie ma już poprzedniego EML pierwszej próby; jego wcześniejszych wyników nie zastąpiono wynikami nowego pliku.

Porównanie zachowanego A (83458 bajtów) z dostarczonym B:

- Hash zamrożonego MIME zgodny z zapisem próby; round-trip base64url poprawny.
- **Cały zakodowany body MIME identyczny bajtowo**, włącznie z granicami multipart. Pełne zdekodowane text/plain (778 bajtów), text/html (870 bajtów) i PDF (58698 bajtów) identyczne, bez normalizacji. Nazwa PDF identyczna, SHA-256 odpowiada cv_hash tej próby.
- Subject identyczny przed/po, także w zakodowanej postaci; encoded-words **48/52/29**, fizyczne linie 57/53/30. Dla tej konkretnej próby problem encoded-word 84 **nie występuje ani przed API, ani w Wysłanych**. Nie rozstrzyga to miejsca powstania nagłówka pierwszej próby.
- From/To zgodne; brak Cc/Bcc/Reply-To i duplikatów podstawowych nagłówków.
- Jedyne różne pola nagłówków: dodane Received, Message-ID z jobhunter.local zastąpiony przez mail.gmail.com, Date z 13:31:25 na 13:31:27 Europe/Warsaw. Body nie zmieniono.
- EML nie zawiera DKIM-Signature ani Authentication-Results: nie wykonywano kontroli DKIM body hash lub podpisu dla tej kopii. Nie jest to dowód błędu uwierzytelnienia wiadomości u odbiorcy; do tego potrzebna jest jego kopia.

Nie wykryto zmiany lub uszkodzenia treści na odcinku A→B w tej próbie. Wynik nie dowodzi Odebranych i nie ustala przyczyny Spamu. Wykonano lokalną inspekcję Pythonem i `inspection.ts` oraz `git diff --check` PASS. Nie zmieniono kodu ani nie powtarzano pełnego zestawu testów po samej analizie i aktualizacji dokumentacji. Wyniki wcześniejszego check pozostają historycznymi wynikami, nie nowym uruchomieniem.

## Trzy odrębne wyniki

1. MIME i implementacja: aktualny generator przechodzi testy opisane niżej. W odbiorczych EML pierwszej i trzeciej próby występuje encoded-word 84. Dla trzeciej próby rzeczywista para A/B/C wykazuje pojawienie się tego kodowania dopiero w źródle odbiorcy; dla pierwszej brak A/B nadal ogranicza diagnozę.
2. Gmail nadawcy: w etapie offline lokalna baza zawierała dziewięć SENT_CONFIRMED i dziewięć rezerwacji, sprawdzonych bez ponownego odczytu Gmaila. Późniejsza osobno zlecona próba dodała jeden rzeczywiście potwierdzony rekord: teraz dziesięć, bez nadpisania wcześniejszych stanów. Sender paused=true; tryb APPROVAL_REQUIRED. Szczegóły nowej operacji są na początku raportu.
3. Folder odbiorcy: relacje użytkownika pozostają relacjami; WP dodatkowo zapisało X-WP-SPAM YES dla wcześniejszej krótkiej próby oraz NO dla obu nowych wariantów pierwszego kontaktu. Nowe Odebrane zgłosił użytkownik, odrębnie od SENT_CONFIRMED. Testy kodu ani ten stan nie potwierdzają folderu.

Reputacja/historia konta, transport API, treść i kontekst odbiorcy nadal są hipotezami. PDF, HTML, .local i wiek konta nie zostały wykazane jako przyczyna. Przykład WP bez HTML/PDF/linków wyklucza twierdzenie, że ich obecność jest konieczna do wszystkich zaobserwowanych klasyfikacji Spam. SPF/DKIM/DMARC PASS nie gwarantują Odebranych.

## Lokalny stan i ścieżka wysyłki

Początkowe `git status --short` i `git diff --stat` były puste. Sprawdzono instrukcje, SPEC, README/TASKS, testy, schema i migracje 001/007/008. Lockfile: Nodemailer 10.0.15, better-sqlite3 13.0.3, tsx 4.23.15, TypeScript 5.9.3, Playwright 1.63.0; Node v24.11.0. `npm ci --ignore-scripts` odtworzył zależności bez zmiany lockfile.

`prepareDelivery` sprawdza materiały/konto, generuje MIME przez `prepareMime` i zapisuje bufor/hash. Podgląd zawiera ten bufor; `approveDelivery` sprawdza wersję, binding, konto, politykę, CV i hash. `dispatchOne` ponownie sprawdza bramki, zapisuje próbę/rezerwację przed HTTP, przekazuje zamrożone bajty do `GmailMailProvider`. Adapter sprawdza hash i wykonuje jeden POST z base64url. Sukces z Gmail id/thread id daje SENT_PROVIDER; timeout/niekompletna odpowiedź daje SEND_UNKNOWN i pauzę/kill switch. `reconcile` osobno potwierdza Wysłane. Restart nie wysyła ponownie. Wiadomości i adresy z EML są danymi; audyt nie wykonuje ich instrukcji/linków.

Nie zmieniono `mime.ts`, `client.ts`, `oauth.ts` ani mechanizmu zatwierdzania. Diagnostyczny textOnly nadal wymaga SELF_TEST + diagnostic; standardowa wysyłka zachowuje CV i multipart/alternative. Istniejące blokady kontaktu i limity nadal przechodzą testy.

## Źródła A/B/C/D i pomiary

Oryginały pozostają poza repo. Przeczytano `audit_eml.py` i `audit_results.json`, potem odtworzono oba wyniki audytu: dokładna zgodność JSON. Skrypt sprawdza wybrane cechy, nie pełne RFC. Jego brak parser defects nie dowodzi zgodności RFC; body hash nie weryfikuje podpisu/DNS.

| Próba/źródło | A: zamrożony MIME | B: RAW Wysłanych | C: EML odbiorcy | D: ręczny EML Odebranych |
| --- | --- | --- | --- | --- |
| Pierwsza próba z CV, 12:31:31 Europe/Warsaw | Usunięty wcześniej; nie odtwarzano | Brak lokalnego pliku | EML przeanalizowany wcześniej; pod tą samą nazwą jest teraz nowy EML próby 3 | Brak lokalnego pliku |
| Drugi krótki test WP, 17:31:56 Europe/Warsaw | Zachowany, zgodny hash | Brak lokalnego pliku | Dostarczony EML WP, powiązany zapisanym końcowym RFC ID | Brak |
| Próba z CV nr 3, 13:31:27 Europe/Warsaw | Zachowany, zgodny hash | EML przeanalizowany wcześniej; A↔B identyczne body | EML przeanalizowany wcześniej; Subject 84/32, podziały wierszy tekstu, PDF identyczny | Ręczny EML 13:49:39 do tego samego odbiorcy dostępny, wraz z jego kopią Wysłanych |
| Próba z CV nr 4, 13:53:46 Europe/Warsaw | Zachowany, zgodny hash | Brak lokalnego pliku | Dostarczony EML powiązany końcowym RFC ID; Subject 84/32, tekst i bajty PDF zgodne z ręczną wiadomością, inna nazwa PDF | Ręczna para Wysłane/odbiorca 13:49:39 dostępna |
| Późniejsze próby z CV 5–6 | Zachowane, aktualny format | Brak lokalnych plików | Brak odpowiadających plików w dostępnych materiałach | Brak |
| Para pierwszych kontaktów WP, aplikacja nr 10 20:41:08 / ręczna 20:45:14 | Zachowany, zgodny hash | Dostępny, zgodny z celowanym RAW tej próby | Dostępny, WP NO; Subject 84/32 | Ręczne Wysłane i odbiorca dostępne, WP NO; pełne części odbiorcze identyczne z aplikacją |

Nie użyto backupu do przywracania usuniętych danych. Nowo generowane syntetyczne MIME są reprodukcjami, nie historycznymi oryginałami.

- Gmail C: 88778 bajtów, multipart/mixed → text/plain UTF-8 quoted-printable (786 zdekodowanych bajtów) i PDF application/pdf base64 (58698 bajtów). Bez HTML w tej pierwszej próbie. Encoded-words Subject: **84 i 32**; pierwsza fizyczna linia Subject ma 93 bajty. To narusza limit 75 znaków encoded-word i 76 znaków linii z encoded-word z [RFC 2047 §2](https://www.rfc-editor.org/rfc/rfc2047.html#section-2). From/To/Subject/Date/Message-ID/MIME-Version/Content-Type występują pojedynczo; brak Cc/Bcc/Reply-To. CRLF bez samotnych LF/CR. Date: 10:31:31 UTC = 12:31:31 Europe/Warsaw.
- WP C: 5406 bajtów, jedna część text/plain UTF-8 quoted-printable, 120 zdekodowanych bajtów; bez HTML/załączników. Encoded-word Subject 39, linia 48. Podstawowe nagłówki pojedyncze, brak Cc/Bcc/Reply-To, brak samotnych LF/CR.
- WP A↔C: surowe wiadomości różne, **pełne zdekodowane bajty tekstu identyczne bez normalizacji**. From/To i brak Cc/Bcc/Reply-To zgodne; zdekodowany Subject identyczny. Date A 15:31:25 UTC, C 15:31:56 UTC: rzeczywista zmiana o 31 sekund, nie tylko zapis strefy. Pierwotny RFC ID w jobhunter.local zastąpiony przez mail.gmail.com. Nagłówki transportu/uwierzytelnienia dodane po stronie poczty. Nie stanowi to diagnozy Spamu.
- Oba C: digest kanonizowanego body odpowiada bh= DKIM (relaxed); **nie wykonano pełnej kryptograficznej weryfikacji podpisu**. Gmail raportuje SPF/DKIM/DMARC/ARC PASS. WP raportuje `X-WP-DKIM-Status: good (id: gmail.com)` i `X-WP-SPAM: YES (U9) 0W00018 [4fuF]`, bez osobnych SPF/DMARC. Znaczenie U9 nieustalone. Received w obu ujawnia HTTPREST; nie dowodzi jego wpływu na folder.
- Zachowane A późniejszych prób z CV mają Subject 48/52/29. Reprodukcja tego tematu przez **obecny** generator na fikcyjnych adresach również 48/52/29. Długie polskie tematy (do 1900 znaków) przechodzą testy 75/76 oraz round-trip. Nie odtworzono błędu przed API. Bez A i B pierwszej próby nie można rozstrzygnąć, czy błąd powstał w historycznym generatorze, Google czy później.

Zwykłe quoted-printable, base64 i `newline: 'windows'` nie są wykazaną usterką. Dekodowanie zachowuje pełne treści, nazwy/typy/rozmiary/SHA-256 załączników. Porównanie dokładne jest osobne od CRLF→LF w zdekodowanym tekście; bez trim, zwijania białych znaków lub przerabiania HTML. Załączniki zawsze bajt w bajt. Prywatne treści, nazwy CV i ich hashe nie zostały przepisane do tego raportu.

## Reconcile: luka i konserwatywna poprawka

Pierwszy nowy test na dotychczasowym czytniku zakończył się **FAIL: 0 kandydatów zamiast 1**, gdy mock przyjął send, zgubił odpowiedź HTTP i zastąpił RFC ID. Znany Gmail id już działał ze zmienionym RFC ID — istniejący mechanizm zachowano i przetestowano.

Bez Gmail id aplikacja może teraz wykonać ograniczony odczyt Wysłanych: właściwe konto (subject OAuth + email), właściwy pojedynczy adresat, od 2 min przed do 10 min po zapisaniu próby. Query używa czasu Unix w sekundach, zgodnie z [dokumentacją filtrów Gmail](https://developers.google.com/workspace/gmail/api/guides/filtering). Każdy odczyt ponownie wiąże konto/uprawnienie; serwis sprawdza ważną zgodę przed i po odczycie.

Najpierw kończy wszystkie strony metadanych, potem pobiera pełny RAW właściwych kandydatów. Nie używa snippet ani limitowanej treści odpowiedzi. RAW zawiera załączniki ([format zasobu Gmail](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages)). Limit 50 wyników, 20 cursorów, 45 s kontroli pracy (pojedynczy trwający request może zakończyć się później w swoim limicie 15 s), 12 MiB MIME, 16 MiB odpowiedzi RAW i 24 MiB łącznie; przekroczenie, uszkodzenie, brak RAW, powtórzony cursor lub błąd kończą odczyt jako niekompletny, nie jako brak maila. Pełny syntetyczny PDF >4 MiB przechodzi ścieżkę RAW, której nie ogranicza dawny limit metadanych 4 MiB.

**Sama zgodność wszystkich części/załączników nie potwierdza wysłania konkretnej próby.** Również jeden identyczny ręczny mail pozostaje kandydatem. W takim przypadku SEND_UNKNOWN, rezerwacja, pauza i kill switch pozostają; powód w outbox kieruje do ręcznej kontroli. Brak wyników również nie daje FAILED_NOT_SENT. Automatyczne potwierdzenie wymaga znanego Gmail id (oraz poprawnego thread id/metadanych) albo zachowanego unikalnego pierwotnego RFC ID i pełnej zgodności części. To ostatnie jest bardziej restrykcyjne niż dotychczasowe potwierdzenie wyłącznie po ID i metadanych.

Użyto istniejących pól: send_attempts.id/submission_id outbox są wewnętrzne; message_id pozostaje pierwotnym RFC ID; provider_id/provider_thread_id są identyfikatorami Gmaila; `gmailProviderMessageId:<outbox>` przechowuje zaobserwowany końcowy RFC ID. Nowe `gmailReconcileCandidates:<outbox>` w app_state zawiera wyłącznie odczytane ID, wyniki porównania i stan kompletności — bez treści maili lub nowych rekordów historii. Sprawdzenie w transakcji nie pozwala przypisać jednego Gmail id do dwóch prób tego samego konta. Nie dodano migracji ani mechanizmu send/retry/automatycznego wznowienia. Usunięty MIME blokuje automatyczne rozstrzygnięcie, bez rekonstrukcji danych.

## Narzędzie i testy

`npm run --silent audit:eml -- /lokalnie/A.eml /lokalnie/B.eml` daje raport z hashami i porównaniem. Domyślnie nie wypisuje adresów, treści ani nazw załączników. `--private --output /poza-repo/report.json` udostępnia dokładne treści/nagłówki wyłącznie w nowym pliku poza repo, z uprawnieniami 0600; nie nadpisuje pliku. Audytor nie ma operacji Gmail ani sieci, nie otwiera załączników. Obsługuje ograniczony zestaw MIME używany w tych źródłach (multipart, base64, quoted-printable, podstawowe CTE i dekodowanie charset); odrzuca niekompletne lub nieobsługiwane wejście. Nie jest pełnym walidatorem RFC, a domyślne hashe nagłówków służą porównaniu, nie anonimizacji kryptograficznej danych o małej entropii. Pełne raporty należy zachować prywatnie.

Rzeczywiście wykonano:

- `npm ci --ignore-scripts`: PASS, 174 pakiety, audit 0 vulnerabilities; lockfile bez zmian.
- `node --import tsx --test tests/gmail.test.ts tests/gmail-delivery.test.ts`: bazowe 39/39 PASS.
- `node --import tsx --test tests/gmail-reconcile-reader.test.ts`: początkowa reprodukcja luki FAIL, ten sam test po poprawce PASS.
- `node --import tsx --test tests/gmail-delivery.test.ts`: 49/49 PASS przed dodatkowym testem zgody wygasającej w odczycie; test ten następnie wszedł w pełny check.
- Końcowy `node --import tsx --test tests/gmail-delivery.test.ts`: **50/50 PASS**, również po dodaniu jawnych asercji zachowania pauzy/kill switcha po udanym reconcile timeoutu.
- `node --import tsx --test tests/gmail-reconcile-reader.test.ts tests/mime-inspection.test.ts`: końcowe 19/19 PASS. Test dużego PDF wykrył początkowo przepełnienie stosu w walidacji base64; zastąpiono powtarzający się regex walidacją znaków i dokładnym round-trip. Ten sam test następnie PASS.
- `npm run typecheck`: PASS.
- Pierwszy `npm run check`: 196/196 backend i 6/6 UI PASS. Końcowy `npm run check` po doprecyzowaniu porównania charset/BOM/tekstowych załączników: **197/197 backend, 6/6 UI (27,4 s), typecheck/build PASS**. Fikcyjne skrzynki, tymczasowe SQLite; zero prawdziwego Gmaila.
- Audyt obu lokalnych EML nowym CLI oraz porównanie zachowanego WP A↔C: PASS; brak nowych kopii oryginalnych EML/CV w repo.
- `git diff --check`: PASS.

Nowe testy obejmują długie polskie tematy, limity RFC 2047, base64url round-trip, dokładny PDF/tekst, brak Cc/Bcc/Reply-To i duplikatów, hash przed POST, przepisanie RFC ID i utratę odpowiedzi, zero/jeden/wielu/identycznego ręcznego kandydata, różny tekst/HTML/PDF/konto/odbiorcę/nadawcę/czas/etykietę, timeout/limit/paginację/brak RAW, zgodę przed i po odczycie, usunięty MIME, zakaz podwójnego przypisania Gmail id. Istniejące testy obejmują unieważnianie zgód, limity, blokady firm, standardowe CV i diagnostyczny textOnly.

Nie wykonano: Windows smoke (brak Windowsa), rzeczywistego reconcile/read/send (brak aktualnej zgody na nowe operacje; zadanie offline), pełnej weryfikacji podpisów DKIM/DNS, badań reguł odbiorców ani eksperymentu klasyfikacji. Brak nowej migracji, więc nie było migracji do uruchomienia na rzeczywistym runtime.

## Zmienione pliki

| Plik | Cel |
| --- | --- |
| apps/server/src/gmail/reader.ts | Odczyt kandydatów pełnym RAW, paginacja/limity, przypisanie konta do każdego odczytu, jawne błędy zamiast pustego wyniku |
| apps/server/src/gmail/service.ts | Ważna zgoda przed/po odczycie, porównanie pełnych części, kandydaci bez fałszywego potwierdzania, ochrona przed podwójnym przypisaniem ID i obsługa usuniętego MIME |
| apps/server/src/app.ts, apps/server/src/gmail/service.ts, tests/gmail-delivery.test.ts | Później, na nowe polecenie użytkownika: ręczny reset wyłącznie dziennego wykorzystania przez app_state, bez kasowania historii, z audytem, pauzą i kontrolą aktualnego dnia/licznika; limit kampanii zachowany |
| apps/server/src/gmail/inspection.ts | Wspólny ograniczony parser/porównanie MIME, dekoder Subject, pomiary RFC i kontrola DKIM body hash |
| scripts/audit-eml.ts, package.json | Lokalny CLI audytu, raport domyślnie bez treści/adresów i prywatny raport poza repo |
| tests/gmail-reconcile-reader.test.ts | Reprodukcja luki, strony/limity/RAW, konto/uprawnienia, pełny duży PDF |
| tests/mime-inspection.test.ts | Długie tematy, PDF/tekst, kodowanie, zatwierdzone bajty POST, normalizacja/charset/BOM/załączniki oraz CLI |
| tests/gmail-delivery.test.ts, tests/gmail-fixture.ts | Mock pełnego MIME i regresje stanów, niejednoznacznych kandydatów, zgód, blokad i przypisania ID |
| README.md, docs/TEST_REPORT.md, docs/TASKS.md, docs/CAPABILITY_REPORT.md, ten raport | Aktualne możliwości, dowody i ograniczenia, zachowana historia wcześniejszych kontroli; dwie istniejące prywatne nazwy PDF w historycznym opisie zastąpiono neutralnymi określeniami, zachowując rozmiary i wynik porównania |

## Najbardziej wartościowy następny krok

**Aktualna decyzja użytkownika: przerwa w wysyłkach i eksperymentach po wyniku Spam próby 11. Poniżej pozostaje niewykonany plan, bez automatycznego wznowienia.** Nie zakładamy, że przerwa sama poprawi dostarczalność.

Istniejącą serię porównano bez nowej wysyłki: A/B/C aplikacji próby 3, A/C aplikacji próby 4 oraz ręczne Wysłane/odbiorca 13:49:39. Późniejsza osobno zlecona para pierwszych kontaktów WP jest już kompletna i obie wiadomości trafiły do Odebranych według użytkownika oraz mają WP NO. Wskazane wyżej braki historyczne nie blokują wyniku tych porównań. Nie znaleziono cechy treści/Subject/uwierzytelnienia rozstrzygającej wcześniejsze różnice folderu. Wynik WP nie ustala zachowania odbiorcy Gmail.

Rekomendowany **jeden przyszły eksperyment**: analogiczne porównanie pierwszej ręcznej wiadomości i pierwszej wiadomości aplikacji z konta projektu na dwóch niezależnych, uzgodnionych skrzynkach **Gmail** bez wcześniejszego kontaktu. Zachować temat, treść, format, zatwierdzony PDF **i jego nazwę**; zmieniać wyłącznie sposób przygotowania/wysyłki ręczna→aplikacja oraz wymagany inny To. Przypisać sposoby do niezależnych adresów, bez wysyłania obu wariantów na ten sam adres. Zapisać zamrożony MIME aplikacji, kopie Wysłanych, EML odbiorców i początkowe foldery; sprawdzić wcześniejsze kontakty/reguły bez ich zmieniania. Wynik pokaże, czy różnica klasyfikacji powtarza się u odbiorcy Gmail przy pierwszym kontakcie, gdy historia tej samej skrzynki nie miesza się ze sposobem wysyłki; sam nie wskaże sygnału użytego przez filtr ani nie zagwarantuje Odebranych. Dzisiejszy limit aplikacji 10 jest wykorzystany; plan nie wymaga jego resetu lub zwiększenia.

Kolejne wiadomości na ten sam adres nie są niezależnym pierwszym kontaktem. **Nowa para Gmail to wyłącznie plan — tego eksperymentu nie wykonano i dostarczenie wyników WP nie autoryzuje kolejnych wysyłek.** Opcjonalne późniejsze porównanie Nodemailer MIME vs Gmail UI MIME przez to samo API rozdzieli generator od transportu; nie zaimplementowano swobodnego RAW send ani obejścia zatwierdzeń.

### Minimalny protokół do uzgodnienia

Użytkownik wskazał dwie skrzynki **WP** jako kandydatów do pary. Prywatne adresy pozostają poza repo; poniżej oznaczenia mail1/mail2 odpowiadają kolejności podanej przez użytkownika. Celowany odczyt SQLite readonly nie znalazł prób aplikacji do żadnej z nich. Użytkownik następnie potwierdził, że żadna z tych skrzynek nie wymieniała wcześniej wiadomości z `jakub.lewosz.it@gmail.com`. **Brak ręcznej historii jest deklaracją użytkownika**, bez zdalnego odczytu Gmaila lub WP.

Obie skrzynki muszą nie mieć historii wymiany wiadomości z kontem projektu ani reguł kierujących wiadomości tego nadawcy do folderu. Nie zmieniać reguł w ramach próby; wybrać skrzynki spełniające warunki. Mogą to być istniejące konta. **Para na WP pozwoli porównać wyniki klasyfikacji WP; nie ustali bezpośrednio zachowania filtra odbiorcy Gmail.** Ewentualne porównanie u odbiorców Gmail wymaga osobnej pary takich skrzynek.

| Skrzynka | Pierwszy i jedyny wariant w tej parze | Zapis wyniku |
| --- | --- | --- |
| WP mail1 | Ręcznie przez interfejs Gmaila konta projektu | Początkowy folder, EML Wysłanych i odbiorcy |
| WP mail2 | Aplikacja przez istniejący zatwierdzany przepływ | Zamrożony MIME/hash, wynik jednej próby, EML Wysłanych i odbiorcy |

Użyć porównywalnych skrzynek i wcześniej przypisać warianty; poza wymaganym innym To zachować ten sam temat, dokładną treść plain/HTML oraz zatwierdzony PDF pod identyczną nazwą. Dla aplikacji najpierw nowy podgląd i zgoda na dokładny MIME. Wynik folderu zapisać przed odpowiedzią lub przeniesieniem wiadomości. Nie wykonywać drugiej wysyłki na ten sam adres w ramach tej pary; SEND_UNKNOWN najpierw rozstrzygać zgodnie z istniejącą polityką, bez ponowienia. Jedna para jest obserwacją orientacyjną, nie dowodem ogólnej skuteczności; ewentualne powtórzenie wymaga kolejnych niezależnych skrzynek i osobnego uzgodnienia.

Samo podanie adresów i odpowiedź o historii nie były zleceniem wysyłki. **Następnie użytkownik wyraźnie polecił jedną wysyłkę aplikacji i przygotowanie wzoru ręcznego**: wykonano nowy podgląd, zgodę na tę uzgodnioną wersję, jedną próbę na mail2 i celowane potwierdzenie Wysłanych. Użytkownik wykonał ręczną część na mail1, dostarczył komplet czterech EML i zgłosił oba początkowe foldery Odebrane. Para zakończona, dalszych wiadomości na te adresy nie traktować jako pierwszego kontaktu. Sender po pojedynczej próbie pozostaje zatrzymany. Aktualne wyniki i zakres operacji opisano na początku raportu; wcześniejszy etap offline i późniejsza analiza dostarczonych wyników miały zero operacji Gmail.
