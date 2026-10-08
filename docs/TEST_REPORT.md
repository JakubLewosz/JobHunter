# Weryfikacja — 8 października 2026

## Kontrola przed publikacją aktualnego projektu na GitHubie

Na wyraźne zlecenie użytkownika przygotowano publikację wszystkich aktualnych zmian kodu, migracji, testów i dokumentacji. Ponowny `npm run check` zakończył się powodzeniem: typecheck/build PASS, **157/157 testów backendu i 6/6 scenariuszy UI**. Testy używały fikcyjnej poczty i katalogów tymczasowych; nie wykonywały rzeczywistych wysyłek. Windows pozostaje nieprzetestowany.

Przegląd 86 plików przeznaczonych do repo nie znalazł prywatnych kategorii plików ani dopasowań sprawdzanych wzorców sekretów, usuniętego adresu osobistego lub adresów testowych odbiorców. Dane runtime, tokeny OAuth, CV, SQLite i źródłowe EML pozostają lokalnie poza repo. Ujednolicono bieżący opis E3/E4 w README, wizji i planie; starsze wyniki raportu są historią kolejnych etapów, nie deklaracją bieżącego braku Gmaila. `git diff --check` PASS. Publikacja kodu nie uruchamia researchu ani sendera.

## Krótki test bez CV na WP — pierwszy trafił do Spamu

Użytkownik zlecił dalsze testy i wskazał adres WP. Dodano wyłącznie wariant diagnostyczny SELF_TEST: stały krótki temat/tekst z zatwierdzoną nazwą nadawcy, bez CV i linków. Podgląd jawnie pokazuje brak załącznika. Tryb jest zapisany w migracji 008, objęty hashem podglądu i niedostępny dla FIRST_CONTACT. Standardowe maile i generator bez zmian; zatwierdzenie materiałów, dokładnego MIME, limity oraz SEND_UNKNOWN nadal obowiązują. Krótki test nie zalicza sprawdzenia wysyłki CV przed kontaktem z firmami.

Pierwszy `npm run check`: typecheck/build PASS, **156/156 backend i 6/6 UI**. Kontrole obejmują brak PDF/linków i zachowanie zamrożonych bajtów, zgodę przed send, wykorzystanie limitu, brak kontaktu z firmą lub zmiany szkicu, zakaz wariantu diagnostycznego dla FIRST_CONTACT, unieważnienie podglądu po zmianie wariantu i brak ponowienia po timeout. UI sprawdza podgląd bez CV oraz obowiązkowe zaznaczenie zgody. Testy korzystają z fikcyjnych kont i katalogów tymczasowych.

Przed restartem potwierdzono siedem SENT_CONFIRMED, brak kolejki i aktywnego researchu; utrwalono hashe materiałów i szkiców wyłącznie w prywatnym runtime. Na dokładny wskazany adres przygotowano normalnym API podgląd z nadawcą będącym wyłącznie kontem projektu. Niezależny parser potwierdził jednego nadawcę/odbiorcę, poprawny MIME, dokładny tekst, brak załączników, linków i PDF. Zatwierdzono jedną nową próbę zwykłą ścieżką: SENT_CONFIRMED, jedna nowa rezerwacja, łącznie osiem prób i osiem rezerwacji. Zapisane bajty i hash zgodne z podglądem, cv_hash próby null; profil/fakty/projekty/CV/szkice/wersje bez zmian. SQLite integrity_check i foreign_key_check poprawne. Po próbie sender paused.

Użytkownik zgłosił Spam pierwszego krótkiego testu WP. Wynik pokazuje, że problem występuje również bez CV i linków; nie dowodzi przyczyny dotyczącej wyłącznie wieku konta. Następna próba w ramach tego samego zlecenia ma zachować temat/treść/odbiorcę, ale pominąć HTML. Dodano opcję textOnly wyłącznie dla diagnostyki; nie zmieniono formatu standardowych maili ani limitów. Wynik kolejnej próby musi uwzględniać wpływ historii odbiorcy.

## Drugi test WP — sam tekst, również Spam

Po zgłoszeniu Spamu pierwszej próby kontynuowano zlecony przez użytkownika test. Wariant `textOnly: true` jest dozwolony wyłącznie razem z diagnostyką SELF_TEST. Zachowano konto projektu, dokładny adres, temat i zdekodowaną treść pierwszej próby; usunięto część HTML. Niezależny parser potwierdził pojedynczą część text/plain, brak HTML/PDF/linków, poprawny MIME i hash. Druga próba przeszła świeży podgląd oraz zwykłe zatwierdzenie i ma SENT_CONFIRMED, jedną próbę i jedną rezerwację. Łącznie dziewięć prób i dziewięć rezerwacji. Materiały i szkice zgodne z hashami sprzed obu prób; SQLite poprawne, brak oczekujących/niepewnych send, sender paused. Użytkownik zgłosił Spam także drugiej wiadomości; wynik zapisano jako relację odbiorcy, odrębną od SENT_CONFIRMED. Nie wysyłano trzeciej wiadomości.

Oba krótkie testy WP trafiły do Spamu według użytkownika. Usunięcie HTML nie rozwiązało problemu w tej próbie; problem występuje także bez CV i linków. Nie ustalono konkretnej przyczyny ani wyłącznego wpływu wieku konta, transportu API czy treści. Następny krok to odczyt źródłowego EML drugiej wiadomości pobranego ze skrzynki WP: identyfikator, uwierzytelnienie, MIME i ewentualne nagłówki antyspamowe. Aplikacja nie zmieniała folderów ani reguł odbiorcy; jego wcześniejsze ustawienia nie zostały niezależnie sprawdzone. [Instrukcja WP zapisu EML](https://pomoc.wp.pl/otrzymuje-podejrzane-wiadomosci), [kontakt z pomocą WP](https://pomoc.wp.pl/kontakt-z-nami). Zgłoszenia do pomocy nie wysłano.

Końcowy `npm run check`: typecheck/build PASS, **157/157 backend i 6/6 UI**. Dodatkowy test sprawdza zakaz textOnly poza diagnostyką, zgodną treść/temat wariantów i wysłanie dokładnych zamrożonych bajtów. Wcześniejsze testy CV i SEND_UNKNOWN nadal przechodzą. Wariant jest kontrolą formatu; drugiej próby na tym samym adresie nie można traktować jako niezależnej od historii odbiorcy.

## EML drugiego testu WP — poprawny DKIM, oznaczenie Spam

Użytkownik dostarczył źródło wiadomości odebranej przez WP. RFC Message-ID jest zgodny z identyfikatorem zaobserwowanym w reconcile drugiej próby. Nadawca, odbiorca, temat i zdekodowany tekst odpowiadają dokładnie tej próbie po normalizacji CRLF; hash zamrożonego MIME poprawny. Pojedyncza część text/plain, bez HTML i załączników; parser nie wykrył błędów. Received wskazuje przyjęcie przez mx.wp.pl od serwera Google przez TLS 8 października o 17:31:58 Europe/Warsaw.

WP dodało `X-WP-DKIM-Status: good (id: gmail.com)` i `X-WP-SPAM: YES (U9)`. To wynik poprawnej weryfikacji DKIM według odbiorcy oraz bezpośrednie potwierdzenie oznaczenia Spam. Plik nie zawiera osobnych wyników SPF/DMARC odbiorcy; nie deklarujemy ich zaliczenia na podstawie wcześniejszych EML Gmaila. W sprawdzonej oficjalnej pomocy WP nie znaleziono wyjaśnienia kodu U9; nie przypisano go reputacji konta, konkretnej regule ani transportowi API. Received ujawnia kanał gmailapi/HTTPREST, ale nie dowodzi, że to przyczyna klasyfikacji.

Wynik i odcisk źródła zapisano tylko w prywatnym runtime. Zatwierdzone materiały, generator, format wysyłki, limity i stany outbox bez zmian; nadal dziewięć prób i dziewięć rezerwacji, sender paused. Nie wysłano kolejnego maila. Przed wyborem następnej próby potrzebne sprawdzenie listy Zablokowani i reguł odbiorcy, bez zmiany ustawień. WP opisuje możliwość kierowania poczty do Spamu przez te ustawienia. [Reguły WP](https://pomoc.wp.pl/jak-skonfigurowac-reguly). W razie braku reguły dalsza diagnoza może obejmować kontrolowaną ręczną wysyłkę z tego samego konta lub zgłoszenie z oryginalnym EML do pomocy technicznej WP; żadnego zgłoszenia nie wysłano. [Pomoc w odbiorze i kontakt techniczny WP](https://pomoc.wp.pl/dlaczego-nie-otrzymuje-wiadomosci).

## Usunięcie konta osobistego z projektu

Na wyraźną prośbę użytkownika usunięto tymczasowe konto osobiste z Test users istniejącego projektu Google Cloud. UI potwierdziło jednego aktywnego testera: konto projektu. Na koncie osobistym cofnięto wszystkie połączenia z JobHunterem; wyszukanie nazwy aplikacji w połączonych aplikacjach Google zwróciło brak wyników. Pomoc techniczna i kontakt dewelopera OAuth korzystają wyłącznie z konta projektu. Systemowy magazyn haseł zawiera wyłącznie właściwe konto projektu z send/readonly; sekretów nie wypisywano.

Przed czyszczeniem lokalnego runtime potwierdzono brak aktywnego researchu i siedem terminalnych SENT_CONFIRMED, a backend zatrzymano zwykłą ścieżką. W prywatnej bazie usunięto adres konta osobistego: zastąpiono go neutralnym znacznikiem w archiwalnych polach, wyczyszczono MIME trzech prób i czterech podglądów oraz identyfikatory Google dotyczące tymczasowego nadawcy. Oryginalne hashe pozostały historycznymi odciskami usuniętych MIME, a nie deklaracją zgodności pustych danych. Archiwalne stany są terminalne, wszystkie zgody cofnięte i podglądy dotyczące usuniętych danych wygaszone; nie wolno ich ponawiać. Metadane wskazują jawnie usunięcie danych osobistych. Kampania używa konta projektu, polityka zaktualizowana, sender paused.

Zachowano siedem prób i siedem rezerwacji limitu. Hashe tabel profilu, faktów, projektów, CV, szkiców, wersji, outbox i usage_ledger zgodne przed/po. SQLite integrity_check i foreign_key_check poprawne; secure_delete, VACUUM i checkpoint usunęły adres z bieżących plików SQLite/WAL. Usunięto pięć prywatnych plików pomocniczych i EML dotyczących tego konta; skan całego katalogu danych JobHuntera nie znalazł adresu. Backend uruchomiono ponownie w APPROVAL_REQUIRED. Nie wysłano nowej wiadomości ani nie zmieniono generatora. Nie usuwano konta Google, korespondencji w skrzynkach odbiorców, źródłowych plików użytkownika w Pobranych ani historii czatu.

## Zanonimizowany wynik porównania nadawcy

Jednorazowy, wcześniej zlecony test porównawczy był SENT_CONFIRMED i według użytkownika trafił do Odebranych przy identycznej aplikacji/API, treści, HTML, CV i odbiorcy, ale innym nadawcy bez wcześniejszej korespondencji z tym odbiorcą. Wynik wzmacnia hipotezę wpływu konta/kontekstu nadawcy, bez ustalonej dokładnej przyczyny spamu ani gwarancji przyszłych dostaw. Dane osobiste tego testu usunięto zgodnie z opisem powyżej; konto nie uczestniczy w dalszym projekcie. AUTO_POLICY nadal zablokowany.

## Informacja o historii konta nadawcy

Użytkownik potwierdził, że konto Gmail nadawcy zostało utworzone do tego projektu i służyło dotąd tylko do testów wysyłanych przez aplikację oraz poleconych ręcznych prób. To informacja diagnostyczna od użytkownika, bez zmiany lub zatwierdzenia profilu kandydata. Wzmacnia hipotezę wpływu historii konta/kontekstu korespondencji, lecz nie dowodzi przyczyny spamu ani winy API. Świeże konto w gmail.com nie jest nową domeną ani własnym nowym IP; nie utożsamiano tych pojęć z publicznymi zaleceniami Google dotyczącymi reputacji domen/IP.

Dalsza diagnoza ma korzystać wyłącznie z konta projektu. Możliwy osobno zlecony test to krótka wiadomość bez CV i linków na kontrolowany adres bez wcześniejszej korespondencji; wynik wymaga sprawdzenia przez odbiorcę. Nie podłączamy ponownie konta osobistego. Brak potwierdzonego progu dni lub liczby maili, po którym to nowe konto miałoby trafiać do Odebranych. Nie zaproponowano fikcyjnego ruchu ani automatycznego powtarzania wiadomości. Google zaleca stopniowe zwiększanie wolumenu i obserwowanie wyników dostawy; to ogólne zalecenie, bez gwarancji dla tego konta. [Wskazówki Google dla nadawców](https://support.google.com/mail/answer/81126?hl=en).

## Para wiadomości bez ręcznej wysyłki pomiędzy

Użytkownik podał kolejny adres do wcześniej zaproponowanego testu dwóch jednakowych wiadomości z aplikacji. Przyjęto minimum pięć minut odstępu, a odbiorca ma pozostawić obie wiadomości nieotwarte do końca oraz nie zmieniać filtrów/kontaktów. Wysłano 8 października o 14:05:15 i 14:10:33 Europe/Warsaw: oba etapy SENT_CONFIRMED, po jednej próbie i jednej rezerwacji. Rzeczywisty odstęp wyniósł 5 min 18 s. Porównanie MIME potwierdziło identyczne bajty tekstu, HTML i PDF oraz ten sam nadawcę, odbiorcę i temat. Profil, fakty, CV, szkice i wersje bez zmian; łącznie sześć prób aplikacji. Obie operacje przeszły przez świeży podgląd i normalne API zatwierdzenia; nie powtórzono wcześniejszej próby. Stan i adres są wyłącznie w prywatnym runtime. Użytkownik zgłosił, że obie wiadomości trafiły do Spamu. Nie sprawdzono niezależnie wcześniejszej korespondencji ani braku interakcji odbiorcy; tych założeń nie traktowano jako potwierdzonych faktów. Nie zmieniono kodu generatora ani transportu.

Wynik tej pary nie wspiera zasady „drugi mail działa”. Użytkownik zapytał o udział AI. Kontrola kodu wykazała: model proponuje treść, zwykły backend składa MIME, a GmailMailProvider wysyła jedno żądanie messages.send z polem raw. Nie dodaje pola lub nagłówka oznaczającego autorstwo AI. Nie jest to dowód, że Gmail nie rozpoznaje kanału API/aplikacji ani że treść nie wpływa na filtr. Wcześniejsze ręczne wysyłki tej samej treści AI trafiały do Odebranych, więc samo autorstwo tekstu nie wyjaśnia obserwowanej różnicy. Kanał wysyłki, kontekst nadawcy/odbiorcy i ocena treści pozostają hipotezami, bez wskazania jednej przyczyny. [Oficjalna wysyłka Gmail API](https://developers.google.com/workspace/gmail/api/guides/sending), [sygnały filtrów Gmail](https://workspace.google.com/blog/identity-and-security/an-overview-of-gmails-spam-filters).

Ewentualny następny eksperyment powinien oddzielić kanał od treści: krótka neutralna wiadomość bez CV i linków wysłana tą samą ścieżką API na uzgodniony kontrolowany adres, z dokładnym podglądem i nowym zleceniem. Opis eksperymentu nie zatwierdza dodatkowego maila ani zmiany generatora rekrutacyjnego. Nie dodano automatycznego powtarzania wiadomości, nie zmieniono SEND_UNKNOWN ani nie wysłano dodatkowych testów.

## Kolejny test na drugim adresie po ręcznej wiadomości

Użytkownik zgłosił, że ręczna wysyłka na drugi adres testowy trafiła do Odebranych, a następnie wyraźnie zlecił jeden kolejny test aplikacji na ten sam adres. Przygotowano i zatwierdzono świeży SELF_TEST przez normalne API. Czwarta próba aplikacji ma SENT_CONFIRMED, jedną próbę i jedną rezerwację. Porównanie zapisanych MIME potwierdziło identyczne text/plain, text/html, PDF, temat, nadawcę i odbiorcę jak w poprzednim teście na ten adres; hash prawidłowy. Nie ponowiono wcześniejszej próby ani nie zmieniono generatora lub transportu. Łącznie cztery próby aplikacji; użytkownik potwierdził Odebrane także dla czwartej próby.

Ta próba następuje po udanej ręcznej wiadomości. Na obu testowanych adresach zaobserwowano pierwszy mail aplikacji w Spamie, ręczną wiadomość w Odebranych i kolejny mail aplikacji w Odebranych. Nie jest to dowód zasady „druga wysyłka zawsze trafia do Odebranych”: liczba adresów wynosi dwa, a przed kolejnym testem aplikacji była ręczna korespondencja. Pierwszy adres miał również zmianę nazwy nadawcy/HTML. Wynik nie rozstrzyga wpływu numeru próby, ręcznej korespondencji, czasu i innych sygnałów Gmaila. Nie traktować go jako podstawy do automatycznego powtarzania maili do firm.

Proponowane dalsze porównanie wymaga świeżych, kontrolowanych adresów testowych bez wcześniejszej korespondencji i zmian filtrów/kontaktów: osobno pierwsza wiadomość aplikacji oraz ręczna wiadomość na drugim świeżym adresie; jeśli badany jest wpływ kolejnej próby, na pierwszym adresie nie wstawiać ręcznej wiadomości pomiędzy próbami aplikacji. Zmieniać jedną rzecz naraz i odnotować wynik, czas oraz nagłówki. To opis przyszłego eksperymentu, bez nowych odbiorców i bez zgody na wysyłkę. [Google o sygnałach i działaniach użytkownika](https://workspace.google.com/blog/identity-and-security/an-overview-of-gmails-spam-filters).

## Format maila po porównaniu ręcznych wysyłek

Po przygotowaniu korekty użytkownik zlecił wysłanie jednego dodatkowego testu na ten sam osobisty adres. Utworzono świeży podgląd SELF_TEST z identyczną treścią Codapi v4 i zatwierdzonym CV, sprawdzono nazwę nadawcy, HTML oraz hash MIME, a następnie zatwierdzono konkretny podgląd przez normalne API. Wynik SENT_CONFIRMED: jedna nowa próba i jedna rezerwacja, bez ponowienia; na tym etapie łącznie dwie wysyłki aplikacji. Profil, fakty, CV, szkice i wersje pozostały bez zmian. Użytkownik następnie potwierdził poprawny odbiór w Odebranych, pokazując wiadomość z tą etykietą. To pozytywny wynik jednej próby, bez ustalonej przyczyny wcześniejszego spamu ani gwarancji dla innych odbiorców.

Na kolejne wyraźne zlecenie użytkownika wysłano jedną taką samą wiadomość z CV na inny wskazany adres testowy. Adres zapisano wyłącznie w prywatnym runtime przez zwykłe API, co unieważniło starsze zgody/podglądy. Świeży podgląd zatwierdzono z dokładnym adresem, treścią, CV i hashem MIME. Trzeci test ma SENT_CONFIRMED, jedną próbę i jedną rezerwację, bez ponowienia. Łącznie trzy próby aplikacji; materiały, szkice i wersje bez zmian. Nie oznaczono firm jako skontaktowanych. Użytkownik zgłosił, że test na drugim adresie trafił do Spamu.

Ponownie odczytano SQLite w trybie read-only i porównano zamrożone MIME ostatnich dwóch prób: identyczne bajty text/plain, text/html i PDF, ten sam temat oraz nazwa/adres nadawcy. Hash każdego zapisanego MIME jest poprawny; parser nie wykrył błędów. Wynik po korekcie jest mieszany: Odebrane na pierwszym adresie, Spam na drugim. Nie potwierdza to rozwiązania dostarczalności ani przyczyny klasyfikacji. Przy pierwszym odczycie referencja do EML trzeciej próby nie była dostępna; po ponownym dostarczeniu plik odczytano i wynik znajduje się poniżej. Nie wysłano dodatkowego maila ani nie zmieniono generatora. Google opisuje wiele sygnałów klasyfikacji, w tym uwierzytelnienie i działania użytkownika; nie przypisano wyniku konkretnej reputacji ani transportowi. [Opis filtrów Gmaila](https://workspace.google.com/blog/identity-and-security/an-overview-of-gmails-spam-filters).

Ponownie dostarczony EML drugiego odbiorcy: Authentication-Results mx.google.com zawiera SPF/DKIM/DMARC/ARC PASS. RFC Message-ID jest zgodny z identyfikatorem zaobserwowanym podczas reconcile trzeciej próby; adresy, temat, treść i PDF odpowiadają dokładnie tej wysyłce. Parser nie wykrył błędów MIME, brak nagłówków podających przyczynę spamu. Zdekodowane text/plain i text/html mają identyczne hashe jak wcześniejszy ręczny EML, który na pierwszym adresie trafił do Odebranych. Nie ma podstaw do kolejnej korekty formatu na podstawie tych danych. Następny test diagnostyczny to ręczne porównanie na tym samym drugim adresie z identyczną treścią/PDF, przed zmianą filtrów/kontaktów. Sama zgodność uwierzytelnienia nie rozstrzyga klasyfikacji. [Uwierzytelnienie a klasyfikacja Gmail](https://support.google.com/mail/answer/180707?hl=en&co=GENIE.Platform%3DDesktop).

Użytkownik dostarczył trzeci EML i potwierdził kolejną ręczną dostawę do Odebranych. Treść po pominięciu białych znaków, temat i adresy są zgodne z pierwszym testem JobHuntera. PDF ma identyczne bajty i SHA-256 jak zatwierdzone CV; zmieniła się jedynie nazwa pobranego pliku z dopiskiem (1). SPF/DKIM/DMARC/ARC PASS. To potwierdza, że ta treść z tym PDF może trafić do Odebranych; nie ujawnia przyczyny pierwszej klasyfikacji jako spam. Ręczne wysyłki mają nazwę nadawcy i HTML obok tekstu, których brakowało w aplikacji.

Dodano nazwę nadawcy z zatwierdzonego profilu i prostą alternatywę HTML tej samej treści w podglądach przygotowania i wysyłki. HTML powstaje przez escapowanie tekstu, zachowuje podziały wierszy i jawne linki HTTPS; nie przyjmuje surowego HTML, obrazów ani śledzenia. Nie zmieniono generatora, zaakceptowanej treści, CV, transportu i mechanizmu SEND_UNKNOWN. Nazwa/HTML są częścią zamrożonego MIME i jego hasha. [Pola wiadomości Nodemailer](https://nodemailer.com/message), [adres z nazwą nadawcy](https://nodemailer.com/message/addresses).

`npm run check`: typecheck/build PASS, **153/153 backend i 6/6 UI**. Test nowego MIME sprawdza nazwę z polskimi znakami, pojedynczą tożsamość, identyczną treść tekstową/HTML, escapowanie tagów, bezpieczne linki i blokadę wstrzyknięcia nagłówka. Test przepływu potwierdza nazwę z profilu oraz wysyłkę dokładnych zamrożonych bajtów. Lokalny backend uruchomiono ponownie po sprawdzeniu braku aktywnego researchu i kolejki wysyłki. Najpierw przygotowano normalnym API wyłącznie podgląd SELF_TEST z dotychczasowym CV na zapisany osobisty adres; niezależny parser MIME potwierdził właściwego nadawcę, odbiorcę, temat, treść, hash CV i brak błędów. Porównanie SQLite przed/po przygotowaniu: materiały, szkice i wersje bez zmian, jedna dotychczasowa próba i SENT_CONFIRMED, sender paused. Późniejsze wyraźnie zlecone wysyłki i potwierdzenie Odebranych opisano powyżej.

## Pierwsza rzeczywista wysyłka Gmail

Użytkownik wyraźnie polecił wysłać pojedynczy test z CV na swój dodatkowy adres osobisty. Dodano zapisywany poza repo adres do prób, związany z polityką i dokładnym podglądem; zmiana adresu unieważnia poprzednią zgodę. Mail użył aktualnej wiadomości Codapi v4 oraz wcześniej zatwierdzonego PDF. Przeszedł normalną ścieżkę preview → approval → outbox → jedna próba POST Gmail. Nie kontaktowano firm, nie zatwierdzano profilu/CV i nie dopisywano zgody na przyszłe maile.

Gmail przyjął wiadomość z provider ID i zmienił RFC Message-ID. Naprawiono rzeczywisty przypadek: znany ID dostawcy i wątek z wyniku send potwierdzają konkretną próbę przy dodatkowej zgodności konta, jednego odbiorcy, tematu, SENT i czasu. Przy braku znanego ID nadal wymagany jest oryginalny RFC Message-ID. Zachowano oryginalny identyfikator/MIME i zapisano zaobserwowany identyfikator Gmail osobno. Testy złego wątku/odbiorcy pozostają blokowane. Nie ponowiono wysyłki.

Końcowy `npm run check`: typecheck/build PASS, **152/152 backend i 6/6 UI**. Rzeczywista próba ma **SENT_CONFIRMED**, jedną wiadomość, jeden send_attempt i jedną rezerwację. Użytkownik potwierdził odbiór i poprawne otwarcie CV, ale wiadomość automatycznie trafiła do Spamu. Gmail wskazał podobieństwo do wcześniej wykrytych wiadomości spamowych, bez dokładnej przyczyny. SENT_CONFIRMED potwierdza wiadomość w Wysłanych, nie klasyfikację w Odebranych. Historia firm, odpowiedzi, długi test i Windows nadal niezweryfikowane rzeczywiście.

Kontrola zapisanego MIME: zwykły tekst i PDF, bez części HTML i śledzenia otwarć; nadawca zgodny z połączonym kontem. Użytkownik dostarczył EML z odebranej wiadomości. Nagłówek Authentication-Results serwera mx.google.com zawiera SPF=pass, DKIM=pass, DMARC=pass oraz ARC=pass. Parser nie zgłosił błędów MIME; SHA-256 odebranego PDF jest zgodny z zatwierdzonym CV. Nie stwierdzono błędu uwierzytelnienia w tej próbie. Nagłówki nie podają szczegółowej przyczyny klasyfikacji jako spam. Możliwy następny krok to osobno uzgodnione porównanie z ręczną wysyłką tej samej treści i CV z tego samego konta. Nie zmieniono zaakceptowanego stylu, nie ponowiono wysyłki. [Sprawdzanie uwierzytelnienia w Gmailu](https://support.google.com/mail/answer/180707?hl=en&co=GENIE.Platform%3DDesktop), [wskazówki Google dla nadawców](https://support.google.com/mail/answer/81126?hl=en).

Użytkownik wykonał ręczną wysyłkę z Gmaila, dostarczył drugi EML i potwierdził trafienie do Odebranych. Adresy i temat są takie same; treść tekstowa jest zgodna po pominięciu białych znaków. Obie wiadomości mają SPF/DKIM/DMARC/ARC PASS. Ręczny mail ma nazwę nadawcy „Jakub Lewosz” oraz część HTML obok tekstu. Załącznik jest inny: JobHunter użył Jakub_Lewosz_CV_AI_Python.pdf (58 698 bajtów), ręczny mail Jakub_Lewosz_CV_EN.pdf (78 467 bajtów); ich SHA-256 różnią się. Użytkownik potwierdził, że przed ręcznym testem nie oznaczał pierwszego maila jako „To nie jest spam” ani nie zmieniał kontaktów lub filtrów. Wynik nadal nie rozstrzyga, czy różnicę klasyfikacji spowodował sposób wysyłki, format, PDF czy inne sygnały Gmaila. Kolejne porównanie powinno zachować dokładnie ten sam załącznik. Ręczny test nie dopisuje prób ani zgód w JobHunterze; nie zmieniono kodu wysyłki ani zatwierdzonego CV.

## Odświeżenie zapisanych maili i układu panelu

Na prośbę użytkownika wygenerowano przez normalną ścieżkę API nowe wersje wszystkich trzech rzeczywistych szkiców: PRODAUT i TwójSoftware v3, Codapi v4. Korzystają z zaakceptowanych instrukcji stylu oraz istniejących zatwierdzonych faktów i źródeł. Wszystkie oceny semantyczne true; wersje pozostają NEEDS_REVIEW bez zatwierdzenia. Starsze treści zachowane. Poprzednio kontrola deklaracji nie przepisywała treści; dopiero ponowna generacja zastosowała nowy styl do zapisanych wiadomości.

Wiadomość i lista szkiców są przed panelem Gmaila. Wyrównano odstępy/etykiety/CV/przyciski, uproszczono badge trybu w sidebarze, treść rośnie do wysokości całego maila, uwagi są zwijane, a powiadomienie nie przechwytuje kliknięć. `npm run check`: typecheck/build PASS, 149/149 backend, 6/6 UI. Dodatkowy odczyt rzeczywistego panelu przez Playwright: 1440, 1024 i 390 px, bez poziomego overflow; cały mail mieści się w polu, panel Gmaila poniżej edytora. PNG desktop/mobile obejrzane. Zero rzeczywistych wysyłek i nowych zgód.

## Gmail po zatwierdzeniu — implementacja E4

`npm run check`: typecheck/build PASS, **149/149 backend i 6/6 Chromium**. Nowe testy używają fikcyjnego konta, adresów example.test i katalogów tymczasowych; bez rzeczywistego Gmaila i Keychain. Przeszedł dodatkowy przepływ OAuth readonly przez rzeczywisty lokalny callback z fikcyjnym serwerem Google. Desktop 1440 i mobile 390: podgląd z CV, jawna zgoda, brak poziomego overflow; PNG obejrzane.

Sprawdzono: test do siebie bez oznaczenia firmy jako skontaktowanej; dokładny MIME/hash CV; brak send przed zgodą; zmiany treści, odbiorcy, CV, profilu i konta; uszkodzone bajty; równoległy dispatch; znana odmowa przed przyjęciem; pauza po uzyskaniu tokenu; timeout po przyjęciu; restart kolejki/SENDING; brak ponowienia; quota i zgodne KPI. Reconcile sprawdza konto, adres, temat, identyfikator, SENT i czas, najpierw po znanym provider ID, a potem przez RFC Message-ID.

Historia ma jawny zakres dla wybranych kontaktów/domen, stronicowanie i cursor po kompletnej stronie. Testy błędu drugiej strony, powtórzonego cursora, zmiany historyId i wcześniejszej korespondencji blokują uznanie historii za pustą. Przed send wykonywany jest nowy scan. Testy odczytu znanego wątku sprawdzają deduplikację, tekstowy HTML, brak pobierania załączników, ręczną klasyfikację i blokadę odmowy. Poczta nie trafia do modelu.

Ręczna edycja czyści odwołania do wcześniejszej treści. Wykryty w UI problem naprawiono przez kontrolowane odtworzenie mapy deklaracji i ponowną kontrolę faktów, z nową wersją do przeglądu, bez zmiany tekstu. Nie poluzowano wymogu odwołań ani false/null. Modele nadal nie udzielają zgody na wysyłkę. Przejścia RESEARCH_ONLY/APPROVAL_REQUIRED zachowują profil, wersje i próby, a DEMO nie przechodzi do danych osobistych. Migracja E2 zachowuje stare rekordy i sprawdza nową domyślną wartość kind.

Na etapie poniżej opisanej implementacji rzeczywisty test maila nie był jeszcze wykonany; późniejszy wynik znajduje się na początku raportu. Odczyt historii firm/odpowiedzi, działanie pełnego dnia, Windows i izolacja OS nadal niepotwierdzone. Inkrementalny Gmail History API nie jest zaimplementowany; używany jest pełny celowany scan ze snapshotem historyId. Readonly wymaga dodatkowej zgody użytkownika Google. Dotychczasowe połączenie send z 7 października samo nie potwierdzało tej nowej ścieżki. AUTO_POLICY pozostaje zablokowany.

Po powyższych testach uruchomiono lokalnie APPROVAL_REQUIRED po wykonaniu kopii SQLite. Porównanie potwierdziło zachowanie profilu, faktów, trzech szkiców i sześciu dotychczasowych wersji. Użytkownik zakończył dodatkowy rzeczywisty OAuth readonly/send 8 października; potwierdzono konto i zakresy bez odczytu skrzynki. Zatwierdzone CV było już dostępne. Rzeczywisty Codex odtworzył deklaracje jednego szkicu Codapi bez zmiany treści, zapisując wersję 3 do przeglądu; kontrola supported=true. Przygotowano lokalny podgląd SELF_TEST z CV na potwierdzony adres własny. Nie utworzono zgody na wysyłkę ani outbox; zero rzeczywistych send_attempts. Faktyczne send, Wysłane i odpowiedzi nadal oczekują na decyzję użytkownika w panelu.

## Mikro-poprawki naturalnych sformułowań

Wyłącznie wskazówki językowe promptu: naturalne otwarte kandydatury, bez powtórzeń także w odmienionych formach w jednym akapicie, prosty opis pracy zespołowej i pytanie o wymiar oraz godziny pracy. Aktualny zatwierdzony fakt ElektroScan potwierdza projekt zespołowy; liczby osób ani trwającego rozwoju nie dopisano. Długość, cztery części, pozostały styl i logika aplikacji bez zmian.

Końcowy `npm run check`: typecheck/build PASS, 125/125 backend i 5/5 UI. Kontrola rzeczywistym Codexem dla fikcyjnych integracji, LLM i PDF: 88, 80 i 99 słów. Pierwszy podgląd LLM nadal powtarzał sformułowanie o wspomaganiu tworzenia oprogramowania; po doprecyzowaniu wskazówki ponowiono podglądy LLM i PDF. Odczyt końcowych treści potwierdził cztery poprawki, oceny semantyczne true i brak uwag stylu. Rzeczywisty profil i szkice bez edycji, zero wysyłek.

## Trzy końcowe korekty językowe

Dodano wyłącznie trzy wskazówki do promptu: „mój projekt [nazwa]”, naturalne „Przy tworzeniu oprogramowania korzystam z Codexa” oraz krótkie pierwsze zdanie bez łączenia stanowiska, rodzaju współpracy i obszaru technologicznego. Pozostały styl, struktura i logika bez zmian. `npm run check`: typecheck/build PASS, 125/125 backend i 5/5 UI.

Ponownie wygenerowano trzy fikcyjne podglądy: integracje, LLM i aktywne PDF. Odczyt treści potwierdził wszystkie trzy poprawki; brak uwag stylistycznych. Oceny semantyczne: integracje i LLM true, PDF false z powodu jawnie fikcyjnego źródła kontrolnego, bez problemu dotyczącego nowego sformułowania. Oceny nie poluzowano ani nie uznano za zgodę na wysyłkę. Rzeczywisty profil i szkice pozostały bez zmian; zero wysyłek.

## Ostatnie mikro-poprawki językowe

Wyłącznie wskazówki generatora i istniejącej kontroli semantycznej: imię naturalnie otwiera przedstawienie i łączy się z edukacją w jednym zdaniu, bez zbędnego roku szkolnego. Opis projektu jest bezpośredni, a brak wdrożenia krótki i neutralny. Publiczne repozytorium ani samo dawne określenie „publiczne demo” nie potwierdzają działającej publicznie aplikacji. Bez potwierdzenia działającej wersji i jej adresu w zatwierdzonych faktach generator pomija taką wzmiankę. Struktura maili i logika aplikacji bez zmian.

Końcowy `npm run check`: typecheck/build PASS, 125/125 backend i 5/5 UI. Istniejące szkice, historia i zatwierdzony profil nie były edytowane; kontrolne generacje korzystają z fikcyjnych firm i odbiorców, bez wysyłek.

Sprawdzono pięć kontrolnych wiadomości rzeczywistym Codexem. Pierwsza próba ujawniła dwa powtórzenia dawnego opisu statusu projektu; po doprecyzowaniu instrukcji ponownie wygenerowano przypadki PHP bez oferty i PDF. Końcowe podglądy mają połączone przedstawienie, nie zawierają roku szkolnego ani niepotwierdzonego publicznego demo, a FixDesk jest opisany jako lokalny projekt bez wdrożenia produkcyjnego. Wszystkie oceny semantyczne true, bez zgłoszonych uwag; to kontrola treści, nie zgoda na wysyłkę. Długość 81–103 słowa: w tej mikro-korekcie nie zmieniano preferencji długości ani wcześniejszej zasady unikania wypełniaczy.

## Drobna korekta języka

Zmiany ograniczone do sformułowań promptu, neutralnych opisów projektu, tematów i odpowiadającego preferencji progu długości (220 słów). Struktura, wybór projektu, kontrola źródeł, dostępność, wersjonowanie, baza i integracje zachowane. Standardowy cel 150–220 słów; bez „Firma X tworzy”, domyślnego demo, marketingowych ozdobników i sztucznego rozciągania tekstu. Szczegóły użycia AI nadal wymagają zatwierdzonych faktów.

`npm run check`: typecheck/build PASS, 125/125 backend i 5/5 UI. Kontrola rzeczywistym Codexem: pięć fikcyjnych firm/odbiorców, poprawne tematy, odmiana i nawiązania; wszystkie końcowe oceny semantyczne true i brak wykrytych uwag stylu. Pierwsza próba 159–169 słów dodawała zbędne objaśnienia. Po doprecyzowaniu promptu końcowe podglądy mają 90–107 słów: cel długości pozostaje preferencją, wymagającą dalszej oceny na bogatszych materiałach. Podglądy poza repo, bez zapisu do rzeczywistych szkiców i bez wysyłek.

macOS arm64 / Node 24.11.0. Testy powtarzalne korzystają z osobnych katalogów tymczasowych, fikcyjnych kontaktów i kontrolowanych adapterów offline. Playwright uruchamia Fastify + SQLite, nie statyczny mock HTTP.

## Punkt wyjścia

Czyste `main`, `109effa`. Bazowe `npm run check`: typecheck/build PASS, 44/44 testy backendu, 4/4 scenariusze Chromium. Nie znaleziono istniejących błędów do oddzielenia.

## E3

Ostatni pełny `npm run check`: typecheck/build PASS, 125/125 testów backendu i 5/5 scenariuszy Chromium.

Zachowano wszystkie testy E0–E2. Nowe sprawdzają: osobne tryby/profil/historię, DisabledMailProvider i brak approvals/outbox, import przed zatwierdzeniem, migracje 003/004 i prawdziwego schematu E2 z rekordami zależnymi, IPv4/IPv6/protokoły/porty/credentials, DNS mixed/pinning/redirecty/429/timeout, gzip/brotli i limit treści po dekompresji, niepotwierdzone cytaty/email, unknown/archiwum, deduplikację firmy/oferty/kontaktu, historię i Fingoweb, zmianę profilu, schemat i prompt injection, trwałe wznowienie etapu po przerwaniu/restartach.

Procesowy test adaptera przez fikcyjne CLI sprawdza oficjalny login status, brak CLI/logowania, timeout, limit, limit wyjścia, JSONL, uszkodzony końcowy JSON i odrzucenie niezgodności ze schematem. Brak fallbacku do mocka.

Regresja reconcile odtworzona testem: timeout po przyjęciu → potwierdzenie istniejącej próby → KPI sent=1 i wykres sent=1, jedna dostawa oraz jedna próba. Wykres korzysta teraz z tego samego rejestru prób i dnia rezerwacji co licznik.

Nowy scenariusz UI RESEARCH_ONLY: testy integracji przez kontrolowane adaptery → zatwierdzenie fikcyjnego profilu w testowej bazie → search → szkic → kopiowanie/edycja/przegląd/reload → backendowa blokada approve-batch → podgląd warunków i źródeł. Desktop 1440 i mobile 390 bez poziomego overflow; PNG w ignorowanym test-results.

Wykryte i naprawione podczas implementacji: wymagana obsługa DNS lookup all:true w Node 24 (próba online) i zmiana nazwy eksportu DEMO (regresja UI). Nie występowały w bazowym E2.

## Próby rzeczywiste, odrębne od testów offline

- CLI 0.160.1 i ChatGPT login: potwierdzone oficjalnym poleceniem; bez odczytu auth.json.
- Strukturalny JSON na fikcyjnych danych: PASS.
- Web search z potwierdzonym zdarzeniem narzędzia: PASS. Próba bez hosta narzędzi prawidłowo nie była uznana za udane wyszukiwanie.
- Publiczny HTTPS fetch strony Node.js: PASS, rzeczywista treść i hash. Timeout innej strony zachowano jako TIMEOUT, bez fikcyjnego fragmentu.
- Fikcyjny plik poza task dir: model nie odczytał go ani nie zmienił; sentinel pozostał niezmienny. Nie jest to pełny audyt izolacji OS ani prywatnych plików.
- Wcześniejszy `npm run smoke:research`: test CLI i wyszukiwarki zapisany; WAITING_FOR_PROFILE (exit 2). Po późniejszym zatwierdzeniu materiałów przez użytkownika wykonano poniższą ograniczoną próbę na rzeczywistych firmach.
- Zero rzeczywistych maili, prywatnej poczty i formularzy.

## Niezweryfikowane

Windows/PowerShell/native CLI i ACL, pełny sandbox procesu OS, kompletna semantyczna prawdziwość każdej deklaracji, skuteczność kontaktów oraz wielogodzinnej pracy. Instrukcja Windows: WINDOWS_SMOKE.md. Gmail/E4 i AUTO_POLICY/E5 poza zakresem.

## Zmiana dostępności i wspólny wzór

Dostępność RESEARCH_ONLY to orientacyjnie około 20 h, bez min/max w UI i pakiecie modelu. Migracja 005 zachowuje historyczne kolumny i DEMO, a nowa propozycja wymaga zatwierdzenia. Wzór jest edytowalny i związany z hashem profilu. Dobór jednego projektu na podstawie oferty oraz blokada maksimum/przedziału i kilku projektów sprawdzone testami. Playwright sprawdza pojedyncze pole godzin i edytowalny wzór. `npm run check`: 72 testy backendu, 5 scenariuszy UI, typecheck/build PASS.

## Prosty panel i praca na dzień

Moje materiały: jedna konkretna wiadomość Jakuba, CV i krótkie opisy projektów; bez pól identity i ogólnego edytora profili. Start na 8 godzin używa tej samej pojedynczej kolejki, do 8 cykli, nie częściej niż raz na godzinę. Osobne kierunki, cache zapytań i źródeł; brak lawiny po uśpieniu. Pauza, restart, koniec dnia i limit Codexa zatrzymują kontynuację. Pojedynczy błędny kandydat jest zapisany jako PARTIAL i nie blokuje pozostałych kierunków. Zweryfikowano testami offline i UI; nie wykonano rzeczywistej próby trwającej pełne 8 godzin. Na tym historycznym etapie Gmail nie był jeszcze podłączony; późniejsze wdrożenie APPROVAL_REQUIRED i testy są opisane na początku raportu. Wysyłka bez przeglądu pozostaje niedostępna.

## Godzinny test

Dodano przycisk „Test na godzinę”: pojedynczy worker, kolejne kierunki co 10 minut, do 10 kandydatów i 3 szkiców na całą sesję, automatyczny stop po czasie lub limicie. Testy offline sprawdzają wspólny limit kandydatów, pomniejszanie budżetu szkiców i zakończenie po terminie; Playwright uruchamia godzinny tryb przez API. `npm run check`: 74 testy backendu, 5 scenariuszy UI, typecheck/build PASS.

W działającej bazie użytkownik zatwierdził materiały. Pierwsza rzeczywista tura poza godzinnym testem była PARTIAL: dwa odrzucenia i jeden niepotwierdzony kandydat, bez szkiców i wysyłek. Na prośbę użytkownika zatrzymano sesję 8 h i uruchomiono ograniczony godzinny test 7 października o 13:09, z terminem 14:09 Europe/Warsaw.

Przy sprawdzeniu o 14:11 potwierdzono automatyczne zakończenie o 13:52 po osiągnięciu limitów, po około 42 minutach. Wyłącznie w runIds godzinnej sesji: 5 tur, 10 kandydatów, 8 elementów DONE, 2 błędy SEMANTIC_REVIEW_FAILED na etapie DRAFT, 3 zapisane szkice. Wszystkie 10 kandydatur pozostaje NEEDS_REVIEW; zero odrzuceń w tej sesji. Odrzucenia z wcześniejszej tury nie są doliczane. Cała baza RESEARCH_ONLY ma zero send_attempts i pusty outbox.

Przeczytano 3 szkice i zatwierdzone fakty: każdy ma indywidualne nawiązanie do działalności firmy, jeden pasujący projekt AutoRelay, informację o programowaniu z AI oraz pytanie o niepotwierdzone warunki. Wynagrodzenie, pełna zdalność, około 20 godzin po lekcjach i forma umowy są propozycją kandydata. Wiadomości nie udają odpowiedzi na istniejący wakat. Kontrola modelu zaakceptowała te 3 szkice, ale wymagają one przeglądu użytkownika. Powtarzanie warunków w akapicie o kandydacie i końcowym pytaniu wydłuża treść; programowanie z AI warto wyeksponować wcześniej. Materiały firm i treści szkiców pozostają w prywatnej bazie, poza repo.

Potwierdzono rzeczywisty przepływ wyszukiwanie → publiczne źródło → analiza → szkic i działanie limitów. Zachowano dwie nieudane próby bez ponawiania ani usuwania błędów. Nie wykonano pełnej godziny ani testu wysyłek, odpowiedzi i skuteczności.

## Szerokie szukanie i zapytania o współpracę

Zapytania obejmują wszystkie dziedziny pasujące do zatwierdzonych projektów, także firmy bez ogłoszonego wakatu. PROSPECT ma dowód działalności, pozostaje NEEDS_REVIEW i może mieć szkic na publiczny kontakt GENERAL zweryfikowany literalnie w źródle. SALES i zgadywany email nadal blokują szkic. Szkic pyta o warunki i nie może udawać odpowiedzi na znalezioną ofertę. Testy offline sprawdzają te przypadki oraz wznowienie sesji po restarcie bez zmiany jej terminu, liczników i limitów. `npm run check`: 77 testów backendu i 5 scenariuszy UI, typecheck/build PASS. Wynik ograniczonej rzeczywistej próby opisano powyżej.

## Krótsze wiadomości i przygotowanie Google

Trzy rzeczywiste szkice zapisano jako wersje 2, 86–88 słów: AI na początku, AutoRelay powiązany z działalnością firmy, warunki tylko raz. Nie zatwierdzono profilu, CV ani przeglądu w imieniu użytkownika; stare wersje zachowane, nowe treści pozostają do sprawdzenia. Generator ma krótki wzór i pomija projekt przy braku udokumentowanego dopasowania. Edycja czyści mapę wcześniejszych deklaracji; migracja 006 usuwa ją również ze starszych ręcznych edycji.

Przygotowano oddzielny helper Google OAuth z loopback/state/PKCE S256, tożsamością konta, gmail.send, odświeżaniem i cofnięciem zgody oraz magazynem systemowym bez plaintext fallbacku. Adapter Gmail API nie jest inicjalizowany przez DEMO ani RESEARCH_ONLY i nie ma aktywnej drogi wysyłki w aplikacji. Testy używają fikcyjnych tokenów i wstrzykniętego HTTP; lokalny serwer callback jest rzeczywisty. Sprawdzono złe state (także Unicode), odmowę, timeout, zakresy, refresh/revoke, brak sekretów w metadanych, jedną próbę HTTP i SEND_UNKNOWN po timeout/5xx/uszkodzonym wyniku. Native Keychain na macOS: fikcyjny, losowo nazwany wpis zapisany/odczytany/usunięty, PASS. Znormalizowano zwracany przez native binding null przy braku wpisu.

API i Playwright potwierdzają lokalny podgląd EML z zatwierdzonym PDF, polski tekst, wersję szkicu/hash CV i brak approvals/outbox/send_attempts. Niezatwierdzony lub zmieniony PDF blokuje przygotowanie. Dodano przycisk zatwierdzenia CV w osobistym ekranie; upload wiąże wybrany zasób z bieżącym trybem, zamiast zawsze z DEMO.

Finalny `npm run check`: 85/85 testów backendu, 5/5 UI, typecheck/build PASS. Rzeczywiste logowanie Google na macOS potwierdzono później 7 października o 20:41 Europe/Warsaw: użytkownik dostarczył JSON Desktop app poza repo, wybrał konto i udzielił zgody. Callback zweryfikował konto i zakresy, a połączenie zapisano w magazynie systemowym; w repo nie zapisano emaila, identyfikatora konta ani sekretów. Profil jest zatwierdzony, CV pozostaje niezatwierdzone, trzy szkice w wersji 2 czekają na przegląd. Baza nadal ma zero send_attempts i pusty outbox. Nie wysłano wiadomości. Sender APPROVAL_REQUIRED, historia, odczyt Wysłanych/odpowiedzi, reconcile i E5 pozostają do wdrożenia; Windows nieprzetestowany.

## Naturalny schemat zgłoszenia

Nowy schemat dostarczony przez użytkownika: tożsamość i cel, konkretna firma/oferta, projekt lub zatwierdzone doświadczenie, dostępność i proste pytanie. Zwykle 110–180 słów, AI/Codex opcjonalnie, umowa tylko w istotnym kontekście źródłowym. Aktualne około 20 h pozostaje zgodne z zatwierdzonym profilem. Trzy rodzaje kontaktu mają odrębne wskazówki tematu i zakończenia; ostatnie otwarcia/tematy/pytania są porównywane jako dane.

Testy sprawdzają PHP/Laravel→FixDesk, integracje→AutoRelay, LLM/AI→CodeFabric, PDF/vision→ElektroScan, brak dopasowania i uzasadnione dwa projekty. Walidacja obejmuje prezentacje, studenta, komercję, przesadne AI, stawki, technologie, wakat i dostępność; polskie znaki i negacje nie tworzą fałszywych pozytywnych deklaracji. Obce referencje i pozostałe zabezpieczenia nadal blokowane. Review false/null zachowuje NEEDS_REVIEW z problemami; issues są zachowane także przy true.

Ponowna generacja dopisuje wersję, zachowuje wcześniejsze rekordy i blokuje zapis przy edycji w trakcie pracy. Playwright wykonuje pauzę sesji, zleca nową wersję, sprawdza historię i podgląd z CV. Pełne `npm run check`: 114/114 backend, 5/5 UI, typecheck/build PASS.

Rzeczywisty Codex wygenerował trzy kontrolne szkice dla fikcyjnych firm i odbiorców w odrębnym katalogu danych: ACTIVE_JOB/PHP, OPEN_APPLICATION/integracje, GENERAL_RECRUITMENT_CONTACT/LLM. Końcowa próba: 113, 109 i 115 słów, różne tematy i nawiązania, po jednym odpowiednim projekcie. Jedna ocena null wynikała z fikcyjnego źródła; została zachowana do przeglądu. Poprzednia kontrolna próba LLM została zablokowana przez walidację technologii; nie osłabiono tej reguły, kolejna generacja przeszła. Wyniki są poza repo w content-previews, niezależnie od katalogu czyszczonego przez Playwright. Nie dodano fikcyjnych firm do rzeczywistego researchu i nie wysłano maili.

## Finalny tuning stylu

Zakres ograniczony do generatora, stylu, walidacji i testów; bez zmian architektury, schematu bazy lub integracji. Po wyjaśnieniu preferencji użytkownik wybrał zachowanie obecnego około 20 h. Zasady mają cztery krótkie części, 100–150 słów lub sensownie mniej, jedno zdanie o projekcie i jedno pytanie; formalność, sprzedażowe CTA, zbędne meta-komentarze i powtórzenia są uwagami do przeglądu. Faktu/dowodu, studenta, komercji, AI, stawki, wakatu i dostępności nie poluzowano. Nowa walidacja zakresowa odrzuca sztywne 20 h przy profilu 15–20 i pełną dyspozycyjność.

Testy obejmują aktywne PHP z potwierdzonym zleceniem, otwarte integracje, LLM bez naboru, firmę bez związku z AI i aktywne PDF z nieznaną umową. Sprawdzają sensownie krótki mail, długość, powtórzenia, jedno pytanie, stylistyczne NEEDS_REVIEW i zachowanie wszystkich dotychczasowych zabezpieczeń. `npm run check`: typecheck/build PASS, 124/124 backend i 5/5 UI.

Rzeczywisty Codex wygenerował pięć podglądów dla fikcyjnych firm/odbiorców: 85, 80, 78, 73 i 78 słów. Wszystkie zachowują komplet części i mają pustą listę uwag stylistycznych. Dwa review=null odnoszą się do fikcyjnych źródeł, więc nadal wymagają przeglądu; pozostałe review=true nie są zgodą na wysyłkę. Podglądy poza repo, bez zapisu do żywego profilu lub szkiców, bez używania Gmaila i bez wysyłek.
