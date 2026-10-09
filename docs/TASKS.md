# Zadania

Kierunek dalszego rozwoju: [Wizja projektu](WIZJA_PROJEKTU.md).

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
- [ ] Zdiagnozować dwie nieudane próby SEMANTIC_REVIEW_FAILED z zachowaniem źródeł i historii; bez ślepego ponowienia.
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
