# Zadania

Kierunek dalszego rozwoju: [Wizja projektu](WIZJA_PROJEKTU.md).

- [x] Dodać krótki SELF_TEST bez CV i linków, z dokładnym podglądem, zgodą i istniejącymi limitami. Standardowe maile bez zmian; 156 backend / 6 UI PASS.
- [x] Wysłać jeden wyraźnie zlecony krótki test na wskazany adres WP: SENT_CONFIRMED, jedna próba, łącznie osiem. Użytkownik zgłosił Spam. Materiały/szkice bez zmian, sender paused.
- [x] W ramach zleconych testów wysłać drugi wariant na WP bez HTML: ten sam tekst/temat/odbiorca, SENT_CONFIRMED, jedna próba. Łącznie dziewięć; końcowe 157 backend / 6 UI PASS.
- [x] Uzyskać wynik drugiego testu WP: użytkownik zgłosił Spam także dla samego tekstu. Wynik zapisany; nadal dziewięć prób, bez trzeciej wysyłki.
- [x] Odczytać EML drugiego testu WP: zgodny identyfikator/treść, MIME bez błędów, DKIM good według WP, X-WP-SPAM YES (U9). Brak wyników SPF/DMARC i potwierdzonego wyjaśnienia U9. Nadal dziewięć prób/rezerwacji, bez dodatkowego send.
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
