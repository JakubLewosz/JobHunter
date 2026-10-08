> Aktualizacja sposobu pracy: aplikacja jest osobistym narzędziem Jakuba, nie produktem dla wielu kandydatów. Główny przepływ to jedna wiadomość bazowa, CV, krótkie opisy projektów i Start/Pauza/Stop. Techniczne identyfikatory pozostają wewnętrzne. Próba obejmuje pracę researchu przez dzień i przygotowanie szkiców; podłączenie Gmaila i rzeczywiste wysyłki pozostają osobnym krokiem.

> Stan z 8 października 2026: APPROVAL_REQUIRED ma dokładny podgląd maila z CV, test do siebie, celowaną historię i zatwierdzanie do trzech wiadomości. DEMO i RESEARCH_ONLY zachowują własne ograniczenia. Dziewięć osobno zleconych prób Gmaila ma SENT_CONFIRMED; odbiorcy zgłaszali Spam i Odebrane. Uwierzytelnienie i MIME sprawdzonych EML poprawne, dokładna przyczyna spamu nieustalona; API nadawcy nie potwierdza folderu u odbiorcy. Projekt używa wyłącznie konta przeznaczonego do JobHuntera; tymczasowe konto osobiste odłączono, cofnięto jego zgodę Google i usunięto lokalne dane adresu, zachowując anonimowe stany oraz wykorzystane limity. AUTO_POLICY pozostaje zablokowany. Szczegóły: [GMAIL_SETUP.md](docs/GMAIL_SETUP.md) i [TEST_REPORT.md](docs/TEST_REPORT.md).

> Aktualizacja preferencji użytkownika (7 października 2026): w rzeczywistym profilu dostępność to około 20 godzin tygodniowo po lekcjach, bez deklarowania maksimum ani sztywnego przedziału. Wiadomości mają korzystać z jednego edytowalnego wzoru; nawiązanie i krótki opis jednego najbardziej dopasowanego projektu są dostosowywane do firmy. Ta aktualizacja zastępuje wcześniejszy przedział i dobór dwóch projektów w szkicu. Profil nadal zatwierdza użytkownik.

> Aktualizacja strategii (7 października 2026): szerokie szukanie firm we wszystkich dziedzinach pasujących do zatwierdzonych projektów, również bez ogłoszonej rekrutacji. Nie ograniczać pierwszej tury do PHP/Laravel. Firma PROSPECT może otrzymać szkic zapytania o współpracę na potwierdzony publiczny kontakt ogólny; brak naboru i nieznane warunki muszą pozostać jawne. Nie oznaczać tego jako aktywnej oferty ani potwierdzonego dopasowania. Nadal zero rzeczywistych wysyłek w RESEARCH_ONLY.

> Docelowy sposób pracy, główny przekaz o programowaniu z AI i późniejsze źródła ogłoszeń: [Wizja projektu](docs/WIZJA_PROJEKTU.md). Dokument zawiera najnowsze ustalenia z użytkownikiem oraz rozróżnia planowane funkcje od obecnej implementacji.

> Aktualizacja stylu zgłoszeń (7 października 2026): [MESSAGE_STYLE.md](docs/MESSAGE_STYLE.md) zastępuje wcześniejsze obowiązkowe AI na początku. Naturalna kandydatura, opcjonalny Codex, personalizacja według typu kontaktu i bez prezentacji portfolio. Dostępność pozostaje zgodna z zatwierdzonym profilem: około 20 h.

# JobHunter — pełna specyfikacja implementacyjna

Wersja 1.0 • 7 października 2026 • Windows • aplikacja lokalna dla jednego kandydata

## 1. Cel i granice projektu

Zbuduj narzędzie dla Jakuba Lewosza do prowadzenia regularnego poszukiwania pracy. Użytkownik uruchamia kampanię na swoim komputerze, a aplikacja w ograniczonych cyklach wyszukuje firmy/oferty, weryfikuje dopasowanie i kontakty, przygotowuje wiadomości, w dozwolonym trybie wysyła je z zatwierdzonym CV oraz pokazuje przebieg i odpowiedzi w panelu.

Miarą powodzenia nie jest maksymalna liczba maili. Ważniejsze są poprawnie dobrani odbiorcy, brak duplikatów, prawdziwe informacje o kandydacie oraz rozmowy z pracodawcami. Nie obiecuj liczby znalezionych ofert, odpowiedzi ani zatrudnienia.

Jest to specyfikacja proponowanego rozwiązania, nie opis istniejącej aplikacji. Podane limity i godziny to konfigurowalne ustawienia pilotażu, a nie ograniczenia usługodawców lub potwierdzony plan lekcji.

### Co budujemy

Lokalny panel WWW + backend + trwała kolejka zadań + adapter uruchamiający Codexa + kontrolowany moduł poczty. Bez publicznego hostingu i bez konieczności sterowania otwartym oknem Codexa.

### Czego nie budujemy w pierwszej wersji

Nie buduj platformy SaaS, aplikacji mobilnej, rozszerzenia Chrome, wieloagentowej infrastruktury, własnego modelu AI ani maszynowego trenowania rankingu. Bez automatycznego wypełniania formularzy ATS, obchodzenia CAPTCHA, rotowania kont/IP, kupowanych baz adresów, śledzenia otwarć, automatycznych negocjacji i publikowania danych kandydata. Przypomnienia do firm pozostają wyłączone.

## 2. Profil kandydata — wersja do zatwierdzenia

Wprowadź poniższe jako DRAFT, nie jako automatycznie zaakceptowany profil wysyłkowy:

- Imię i nazwisko: Jakub Lewosz.
- Uczeń ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku; rok szkolny 2026/2027. Nie opisuj go jako studenta uczelni.
- Cel: płatna, regularna współpraca programistyczna lub techniczna, całkowicie zdalna, około 15–20 godzin tygodniowo, przede wszystkim po lekcjach.
- Preferencja: bezpośredni kontakt z firmą, nie pojedyncze zlecenia z Useme. Preferowana forma umowy do potwierdzenia: zlecenie.
- Interesuje się i korzysta z programowania wspomaganego AI, szczególnie Codex. To nie oznacza poszukiwania wyłącznie stanowisk AI/ML Engineer.
- Nie deklaruj samodzielnej znajomości każdej technologii występującej w repozytoriach. Nie dopisuj lat doświadczenia komercyjnego.
- Portfolio: https://github.com/JakubLewosz
- FixDesk: https://github.com/JakubLewosz/FixDesk — lokalne demo obsługi usterek w PHP/Laravel; nie publiczny system produkcyjny.
- AutoRelay: https://github.com/JakubLewosz/AutoRelay — projekt portfolio automatyzacji opartych na webhookach.
- CodeFabric: https://github.com/JakubLewosz/CodeFabric — prototyp wykorzystujący lokalne modele językowe do wspomagania tworzenia oprogramowania.
- ElektroScan: https://github.com/JakubLewosz/ElektroScan — projekt zespołowy analizy planów elektrycznych w PDF; publiczna wersja demonstracyjna.

Każdy fakt otrzymuje ID, treść, źródło, datę sprawdzenia i status zatwierdzenia. Portfolio można odczytać za zgodą użytkownika, ale odczyt repozytorium nie jest dowodem umiejętności ani audytem kodu. Zmiana opisu źródłowego nie aktualizuje samoczynnie zatwierdzonych faktów.

Nie ustawiaj domyślnie stawki, daty rozpoczęcia, poziomu angielskiego, wieku, telefonu, adresu domowego ani wyników egzaminu. Użytkownik może je dodać i zatwierdzić. Nie mieszaj informacji innych osób korzystających z tego samego konta.

Adres nadawcy należy wybrać i potwierdzić podczas podłączania Gmaila. Nie wybieraj go na podstawie samej otwartej sesji Chrome lub danych z innego projektu. CV użytkownik wskazuje lokalnie; nie wymyślaj jego nazwy, zawartości ani ścieżki.

## 3. Decyzja architektoniczna

### Warstwy

1. **Dashboard:** React + TypeScript + Vite. Interfejs po polsku.
2. **Backend:** Node.js LTS + TypeScript + Fastify; aktualne kompatybilne wersje sprawdzone na etapie diagnostycznym i zapisane w lockfile.
3. **Baza:** SQLite, np. przez `better-sqlite3`, z włączonymi kluczami obcymi, busy timeout i odpowiednią trwałością. Weryfikuj instalację na Windowsie bez zakładania, że natywny moduł zadziała wszędzie. Proste numerowane migracje; bez dodatkowego serwera bazy.
4. **Scheduler/worker:** w backendzie, jeden aktywny cykl kampanii i jeden dispatcher wysyłkowy. Codex działa w procesie potomnym. Brak Redis/Celery/Kubernetes.
5. **CodexRunner:** oficjalne `codex exec`, wynik strukturalny i zdarzenia JSONL. Nie steruj interfejsem Codexa i nie zakładaj prywatnego API aplikacji desktopowej.
6. **ResearchProvider:** adapter źródeł i wyszukiwania, niezależny od adaptera poczty.
7. **MailProvider:** domyślnie Gmail API przez OAuth użytkownika; najpierw lokalne szkice, nie szkice w Gmailu.
8. **PolicyEngine:** zwykły kod, nie kolejny prompt. Kontroluje uprawnienia, blokady, wersje treści i limity przed wysyłką.

Aplikacja Codex służy użytkownikowi do budowy/rozwoju JobHuntera. Docelowo to uruchomiony JobHunter wywołuje Codexa przez oficjalny interfejs programistyczny. Nie potrzebuje stale otwartego okna czatu, jeśli używa CLI. Uwierzytelnienie CLI i dostępność narzędzi trzeba osobno potwierdzić; nie zakładaj, że odziedziczą się z aplikacji.

Opcjonalny adapter SDK można dodać później, jeżeli faktycznie upraszcza implementację. Nie implementuj od razu CLI, SDK, app-server i sterowania GUI jednocześnie.

### Dlaczego nie Computer Use jako fundament

Pełne Computer Use na Windowsie działa na aktywnym pulpicie i wymaga odblokowanej sesji. Nie daje łatwej, niezależnej kontroli nad limitem i odbiorcą każdego kliknięcia. Dlatego w pierwszej wersji przeglądarka jest ewentualną pomocą w weryfikacji stron, nie autonomicznym nadawcą maili. Gmail API pozwala identyfikować wiadomości i zarządzać wynikiem wysyłki. Ani API, ani poprawny prompt nie gwarantują braku błędów. [S1–S6]

## 4. Tryby działania

### DEMO

Osobna baza i wyraźny baner „SYMULACJA”. Fikcyjne firmy pod example.invalid. MockSearchProvider, MockCodexRunner, MockMailProvider. Zero realnych maili, zero odczytu prawdziwej skrzynki, brak korzystania z tokenów live. Przejście przez rzeczywisty kod procesu i bazy, nie statyczne liczby w interfejsie.

### RESEARCH_ONLY

Rzeczywisty research i lokalne szkice. Nie inicjalizuj transportu wysyłki. Jeśli wyszukiwanie wymaga niezainstalowanego narzędzia, pokazuj BLOCKED, nie „znaleziono 0”.

### APPROVAL_REQUIRED

Użytkownik zatwierdza konkretną paczkę: odbiorcy, tematy, treści, nadawca i hash CV. Dopiero dispatcher wysyła zatwierdzone wiadomości. Zmiana dowolnego elementu unieważnia zgodę. Gmail może być odczytywany tylko w zatwierdzonym zakresie.

### AUTO_POLICY

Tryb późniejszy, niewłączany podczas budowy. Wymaga osobnej autoryzacji kampanii w panelu: czas ważności, typy kontaktów, zakres wiadomości, zatwierdzony profil/CV, nadawca, limity, warunki zatrzymania. Nie jest dożywotnią zgodą „wysyłaj wszystko”. Możliwe są automatyczne wysyłki wyłącznie wewnątrz tego zakresu i zgodnie z uprawnieniami używanego narzędzia.

AUTO_POLICY jest niedostępny, dopóki nie przejdą testy bramki wysyłki, historii i izolacji agenta. Nie obchodź potwierdzeń platformy. Gdy integracja wymaga kolejnej zgody, wynik to WAITING_FOR_APPROVAL.

## 5. Ekrany i zachowanie UI

### 5.1 Start / Dzisiaj

Karty liczbowe z bazy: unikalne nowe firmy, zweryfikowane oferty, pominięte duplikaty, odrzucone dopasowania, przygotowane szkice, wysłane wiadomości, wysyłki niepewne, odpowiedzi, zainteresowane odpowiedzi potwierdzone przez użytkownika.

Status pracy: uruchomiony / w trakcie / pauza / czeka na zgodę / brak integracji / błąd / zakończony. Bieżący etap, ostatnie zdarzenie, ostatnia synchronizacja i następny cykl. Przyciski Start, Pauza, Zatrzymaj wysyłkę i Stop wszystko. Wysyłki już przekazanej dostawcy nie można obiecać cofnąć.

Prosty wykres dzienny oparty na zdarzeniach i tabela ostatnich działań. Brak danych oznacza 0/stan pusty, a brak dostępu oznacza „nieznane”, nie 0.

### 5.2 Firmy i oferty

Filtrowanie po statusie, rodzaju naboru, zdalności, wymiarze, dopasowaniu i kontakcie. Widoczne przyczyny odrzucenia. Szczegóły pokazują źródła, daty weryfikacji, wymagania i historię firmy, w tym aliasy domen.

Nie używaj procentowego „prawdopodobieństwa zatrudnienia”. W MVP wystarczą priorytety wysoki / średni / niski oraz spełnione, niespełnione i nieznane warunki.

### 5.3 Wiadomości

Lokalne szkice, edycja, przywracanie wcześniejszej wersji, podgląd nadawcy i CV, źródło personalizacji oraz fakty użyte w wiadomości. Wspólna akceptacja wybranych rekordów, nie całej przyszłej kolejki.

### 5.4 Odpowiedzi

Rozmowy powiązane z firmą i zgłoszeniem. Kategorie: potwierdzenie automatyczne, zainteresowanie, zaproszenie, pytania, zadanie, odmowa, rekrutacja wstrzymana, autoresponder, zwrot, niejasne. Pokaż propozycję AI i pozwól ją skorygować. Autoresponder nie zwiększa licznika zainteresowanych pracodawców.

### 5.5 Profil i CV

Formularz zatwierdzonych faktów i wykluczeń. Biblioteka projektów. CV wczytane przez użytkownika, jego podgląd, rozmiar, hash SHA-256, wersja, język i status zatwierdzenia. Aplikacja nie przerabia samodzielnie PDF. Nowe CV unieważnia oczekujące zgody zależne od starej wersji.

### 5.6 Kampania i integracje

Harmonogram, limity, dozwolone kontakty, data końca zgody. Osobne statusy CLI, logowania Codexa, dostępu do researchu, Gmail readonly i Gmail send. „Zainstalowane” to nie „przetestowane”. Pokaż ostatnią udaną próbę każdej operacji i jej ograniczenia.

### 5.7 Raporty

Podsumowania cykli i dni: linki do firm, rzeczywiście wysłane treści, blokady, odrzucone wyniki, koszty/zużycie dostępne w źródle i sprawy do decyzji. Eksport Markdown/CSV; Excel nie jest wymagany.

UI responsywne, czytelne etykiety, fokus klawiatury, stany ładowania i błędów. Tryb live wyraźnie różny od demo. Nie przeładowuj projektu animacjami.

## 6. Onboarding i diagnostyka możliwości

Przed wywołaniem zewnętrznych usług:

1. Sprawdź środowisko Windows, Node/npm, Git, dostępność SQLite oraz Codex CLI. Użyj faktycznych `--version` i `--help`; nie wymyślaj flag i identyfikatorów modeli.
2. Sprawdź, czy CLI ma poprawne logowanie i czy prosta próba strukturalnej odpowiedzi działa. Użytkownik loguje się sam przez oficjalną ścieżkę. Nie czytaj ani nie kopiuj plików uwierzytelnienia do prompta.
3. Sprawdź działający research: faktyczne wyszukiwanie oraz odczyt znanej publicznej strony. Osobno zweryfikuj dostępność narzędzi w wybranym trybie CLI. Narzędzia GUI nie muszą być dostępne przez CLI.
4. Gdy research nie działa, udostępnij import URL/CSV i pokaż potrzebną konfigurację adaptera. Nie instaluj płatnych usług ani nie uruchamiaj rozliczeń API bez zgody.
5. Użytkownik zatwierdza profil, konto nadawcy, CV i zakres przetwarzania korespondencji. Wyjaśnij, jakie informacje trafiają do modelu.
6. Historia: import rzeczywiście wysłanych zgłoszeń z Gmaila lub CSV. Brak pełnej historii jest jawnie widoczny i blokuje automatyczne pierwsze kontakty z niejasnymi firmami.
7. Dopiero później test maila do własnego adresu użytkownika, z osobnym potwierdzeniem. Ten test nie jest uprawnieniem do wysyłania do firm.

Zapisz `docs/CAPABILITY_REPORT.md`: wersje, wykonane próby, observed success/failure, źródła dokumentacji, blokady i wybrana ścieżka integracji. Nie zapisuj haseł, tokenów, całej skrzynki ani prywatnych identyfikatorów sesji.

## 7. Research — pozyskiwanie i weryfikacja

### Źródła

Preferuj oficjalne strony karier i kontaktu, następnie publiczne ogłoszenia portali. Wynik wyszukiwania jest wskazówką, a nie dowodem aktywności oferty. Ogłoszenie w archiwum można zapisać jako kontekst firmy, ale nie jako trwającą rekrutację.

Zapytania obejmują m.in. junior PHP/Laravel, junior web developer, automation/integration, part-time, płatny staż, remote i otwarte aplikacje. Nie ograniczaj się do stanowisk zawierających „AI”. Nie dopisuj firm do wyniku tylko po to, by osiągnąć limit.

Każde zapytanie ma fingerprint, datę, źródło, wynik i termin ponownego sprawdzenia. Każda strona ma canonical URL, domenę, fetched_at, content hash i krótki istotny fragment dowodu. Zapisuj niewielkie fragmenty, nie nieograniczone kopie portali.

### Fakty wymagające dowodu

Przyjmij status `yes`, `no`, `unknown`, `conflicting` dla: zdalność, niepełny etat, zgodność godzin, przyjmowanie juniorów/uczniów, odpłatność, otwarta rekrutacja i przyjmowanie otwartych zgłoszeń. Wymagania obowiązkowe oddziel od mile widzianych.

Nieznany wymiar pracy nie jest potwierdzonym pół etatem. Elastyczne godziny nie znaczą automatycznie popołudni. Etykieta „junior” nie znosi wymogu kilku lat doświadczenia w treści.

### Kontakt

Adres musi być jawnie opublikowany w kontekście zawodowym/rekrutacyjnym przez firmę lub wskazany w wiarygodnym ogłoszeniu. Zachowaj źródło i fragment. Nie zgaduj kombinacji imię.nazwisko@domena. Nie pobieraj kontaktów z wycieków i baz sprzedawanych do masowej wysyłki.

`careers/hr/rekrutacja` jest wskazówką nazwy, nie samodzielnym dowodem. Adres ogólny może być używany automatycznie tylko wtedy, gdy źródło wyraźnie zaprasza do przesyłania kandydatur właśnie tam. Pozostałe kontakty ogólne — do decyzji użytkownika.

### Zasady dopasowania

- `READY_APPLICATION`: aktywne i zweryfikowane ogłoszenie, brak konfliktu obowiązkowych warunków, właściwy kontakt, znane istotne warunki, zatwierdzone fakty kandydata.
- `READY_OPEN_INQUIRY`: firma jawnie przyjmuje spontaniczne kandydatury, właściwy adres, brak jednoznacznego wykluczenia; mail pyta o nieznane godziny i nie twierdzi, że istnieje pasujący wakat. Tylko jeśli kampania dopuszcza ten rodzaj zapytania.
- `NEEDS_REVIEW`: brak dowodów, sprzeczne dane, dawna oferta bez obecnego zaproszenia, niepewna tożsamość spółki, ogólny mailbox, formularz ATS, wyjątek od wymagań.
- `REJECTED`: obowiązkowy niepasujący grafik/zdalność, rola wyraźnie seniorska, praca bezpłatna, nieprzyjmowanie kandydatur lub inne twarde wykluczenie.

Wstępny TTL: ponownie sprawdź ofertę przed wysyłką, gdy dowód starszy niż 24 h; kontakt, gdy starszy niż 7 dni. To domyślna reguła projektu, nie zapewnienie aktualności strony.

### Dostęp do stron

Respektuj warunki serwisów i dostępne ograniczenia. Obsłuż 403/429, timeout i wymagane logowanie bez obchodzenia blokad. Nie wykonuj kodu pobranego ze strony. Fetcher blokuje lokalne/prywatne adresy IPv4 i IPv6, adresy metadanych, file:// i niekontrolowane przekierowania; rozwiąż również ryzyko DNS-rebinding/TOCTOU przez faktyczną kontrolę połączenia/egress, nie samą jednorazową kontrolę tekstu URL. Strony renderuj jako nieaktywny tekst, bez skryptów i zdalnych pikseli.

## 8. Historia i deduplikacja

Porównuj canonical company ID, domeny/aliasy, adresy i identyfikatory ofert. Agregator/ATS nie jest pracodawcą — dwie firmy z tego samego ATS nie są duplikatem. Gmail.com nie służy do grupowania niezależnych pracodawców.

Domyślnie jedna pierwsza wiadomość na firmę w danej kampanii; wcześniejszy kontakt, odmowa, otwarta rozmowa i proces wstrzymany blokują ponowną pierwszą wiadomość także między kampaniami, dopóki użytkownik świadomie nie rozstrzygnie wyjątku. Nie wysyłaj równolegle do kilku pracowników tej samej firmy.

Importuj wyłącznie fakty potwierdzone korespondencją. Dopasowanie niepewne kieruj do użytkownika. Przejrzyj zakres/paginację zamiast zakładać, że pierwszy ekran Gmaila zawiera całą historię. Błędy synchronizacji nie oznaczają braku wcześniejszego kontaktu.

Przygotuj Fingoweb jako lokalną blokadę `RECRUITMENT_ON_HOLD` na podstawie instrukcji użytkownika. Bez kontaktowania się z tą firmą.

Nazwy wcześniej rozważanych firm mogą wejść do listy `history_to_verify`, ale NIE jako lista potwierdzonych wysyłek: Iyuno, UX GIRL, Pirxey, Autooomate, Software Mind, EasyAutomate, Netwise, NAVIA, Formamind, Havenocode, Personit, SupportME, Finitec, Studio SKORPIUS, Automation House, EL Passion, dataplace.ai, Leaware, XPERTEO, BlockWise, From Poland With Dev, DataComplex, Vazco, wPraktyce.AI, Gorrion, NextApps, Cogitech, Oxido AI, LexAlpha, WebMakers, N-SOFT, BeroBasket, CONFILOGI. Nie zgaduj ich domen ani kontaktów. Wyjaśnij historię przed live.

## 9. Personalizacja i prawdziwość wiadomości

Każdy szkic musi odwoływać się do istniejących evidence IDs i zatwierdzonych candidate fact IDs. Tekst powstaje po sprawdzeniu firmy; nie dopasowuj faktów kandydata do wymagań przez ich zmyślanie.

Wiadomość zwykle ma 120–200 słów, naturalny polski, jeden konkretny powód kontaktu, krótki opis pracy z AI, jeden lub dwa przykłady projektów oraz jawne pytanie o 15–20 godzin po szkole. Bez masowego CC/BCC, linków śledzących, presji, fikcyjnych pochwał i stwierdzeń o komercyjnym wdrożeniu projektu portfolio.

Nie trzeba za każdym razem pisać długich zastrzeżeń o AI. Nie obiecuj znajomości technologii lub testowania, które nie zostały zatwierdzone w profilu. Dla zagranicznej firmy użyj angielskiego wyłącznie po dopuszczeniu tego w profilu.

Aplikacja kontroluje dozwolone repozytoria, liczby dotyczące dostępności, zakazane deklaracje i wskazane dowody. Te kontrole ograniczają błędy, ale nie dowodzą semantycznej poprawności każdego zdania. Dlatego w AUTO_POLICY dopuszczaj tylko zatwierdzone rodziny szablonów i ograniczone personalizowane fragmenty; niepewność prowadzi do review.

## 10. Poczta i OAuth

### Domyślny transport

Gmail API. Szkice w MVP są w lokalnej bazie; opcjonalny eksport EML można dodać bez tworzenia szkiców w Gmailu. Nie proś o `gmail.compose`, jeżeli funkcja Gmail Drafts nie została zaimplementowana.

Zakresy uprawnień przyrostowo: `gmail.readonly` do historii/odpowiedzi i `gmail.send` dopiero przy funkcji wysyłki. Nie wymagaj pełnego `mail.google.com` lub `gmail.modify`, gdy nie są potrzebne. `gmail.readonly` daje szeroki odczyt konta — filtrowanie do rekrutacji jest ograniczeniem aplikacji, nie osobnym wąskim uprawnieniem Google. [S6–S8]

Użytkownik konfiguruje swój projekt Google Cloud i klienta OAuth typu Desktop app, loguje się w systemowej przeglądarce, potwierdza zakresy i rzeczywistą tożsamość konta. Korzystaj z oficjalnego przepływu dla aplikacji instalowanych, z kontrolą `state`, poprawną obsługą PKCE/redirect URI i loopback callback. Nie implementuj logowania przez zbieranie hasła. [S9]

Uprzedź w README o ograniczeniach trybu OAuth Testing, w tym możliwym wygaśnięciu refresh tokenu po 7 dniach dla opisanej przez Google konfiguracji External/Testing. Nie zakładaj, że samo przełączenie aplikacji na Production znosi wymagania weryfikacji. Nie obiecuj gotowej publicznej dystrybucji tej integracji. [S10]

### Sekrety

Tokeny chronione mechanizmem Windows Credential Manager lub DPAPI CurrentUser, przechowywane poza repozytorium. Bez sekretów w .env, SQLite, logach, promptach i localStorage. Nie wypisuj plików auth Codexa. Nie zapisuj tokenów w argv procesu. DPAPI nie chroni przed każdym procesem uruchomionym jako ten sam użytkownik — izolację agenta trzeba egzekwować oddzielnie. [S11]

### Odpowiedzi i synchronizacja

Przechowuj gmail message ID, thread ID, RFC Message-ID, nadawcę/odbiorcę, daty i minimalną niezbędną treść. Zakres historycznego odczytu musi być zatwierdzony. Dla bieżącej pracy pobieraj znane wątki i wiadomości potencjalnie powiązane z kampanią; nie kopiuj całej prywatnej korespondencji.

Paginacja obowiązkowa. Aktualizuj trwały cursor dopiero po zapisie przetworzonej strony. Przy historyId poza zakresem/HTTP 404 wykonaj ograniczony re-sync, nie uznaj skrzynki za pustą. Przy nieudanej lub zbyt starej synchronizacji blokuj live, jeśli nie można wykluczyć odpowiedzi/odmowy. [S8]

Wykryj autorespondery i zwroty; brak odczytu/odpowiedzi nie jest odmową ani dowodem dostarczenia. Nie pobieraj automatycznie załączników z maili i nie uruchamiaj zadań rekrutacyjnych. Nie klikaj linków logowania otrzymanych od niezweryfikowanego nadawcy.

Odpowiedzi można klasyfikować lokalnymi regułami, a AI opcjonalnie z minimalnym fragmentem treści po odrębnej zgodzie. Dane lokalnej aplikacji przesłane do Codexa/modelu nie pozostają wyłącznie na komputerze. Jasno to opisz; zbadaj wymagania Google dotyczące dostępu i przekazywania danych przed włączeniem zewnętrznej klasyfikacji.

## 11. Niezawodna wysyłka — najważniejsze wymagania

### Bramka

Wyłącznie deterministyczny dispatcher posiada dostęp do funkcji send. Agent researchowy nie dostaje narzędzia Gmail send, ogólnej przeglądarki z zalogowanym Gmailem, tokenów poczty, endpointu zatwierdzania ani możliwości zmiany limitów.

Przed wysyłką ponownie sprawdź: aktywną i niewygasłą zgodę, konto nadawcy, tryb, kill switch, zakres kampanii, historię kontaktu, odpowiedzi, aktualność źródeł, stan firmy, wymagane dopasowanie, zatwierdzony profil, dokładną treść i hash CV, limit dnia i kampanii.

Samo pole `approved=true` nadesłane przez model niczego nie zatwierdza. Odrzuć je jako niedozwolone pole. Akceptacja jest podpisana stanem sesji użytkownika/wersją polityki i bound do hasha konkretnej paczki danych. Nowy draft, zmiana odbiorcy, CV, nadawcy lub profilu unieważnia poprzednie zatwierdzenie.

### Outbox i stany

`DRAFT -> NEEDS_REVIEW -> APPROVED -> QUEUED -> SENDING -> SENT_PROVIDER -> SENT_CONFIRMED`.

Odgałęzienia: `BLOCKED`, `CANCELLED`, `FAILED_NOT_SENT`, `SEND_UNKNOWN`. `SENT_PROVIDER` oznacza potwierdzenie przyjęcia operacji przez Gmail z ID. `SENT_CONFIRMED` oznacza potwierdzenie właściwej wiadomości w Wysłanych. Żaden z nich nie jest „dostarczono odbiorcy” lub „przeczytano”.

Przed wywołaniem API zapisz próbę, zarezerwuj limit w transakcji, utwórz unikalny submission ID oraz stabilny RFC Message-ID i hash MIME. Zapisz ID konta, odbiorcę, temat, czas, wersję tekstu i CV. Nie trzymaj transakcji SQLite otwartej podczas oczekiwania na HTTP.

Wysyłaj kompletny, niezmienny MIME z jednym odbiorcą. Po sukcesie zapisz identyfikatory dostawcy i sprawdź Wysłane. Korzystaj z biblioteki MIME i poprawnego kodowania UTF-8; nie sklejaj niezweryfikowanych nagłówków.

### Timeout i awaria

Timeout po wysłaniu żądania NIE oznacza, że wiadomość nie została wysłana. `SEND_UNKNOWN` blokuje ponowienie i zużywa zarezerwowany limit, dopóki wynik nie zostanie rozstrzygnięty. Po restarcie porzucone `SENDING` staje się `SEND_UNKNOWN`, nie nowym QUEUED.

Reconcile przez znany provider ID lub RFC Message-ID, konto, odbiorcę i czas. Gmail może zmienić część nagłówków; jeśli dopasowanie nie jest pewne, eskaluj. Brak wyniku bezpośrednio po wysyłce nie uzasadnia automatycznego ponowienia. Nie obiecuj transakcyjnego exactly-once między SQLite i Gmail API.

Odczyty mogą mieć ograniczone retry/backoff. Dla send wyłącz ślepe automatyczne ponawianie w bibliotece HTTP. Ponowienie tylko przy jednoznacznej, sklasyfikowanej odpowiedzi oznaczającej brak przyjęcia; stan niejasny zawsze do reconcile/review.

### CV

Wczytaj zatwierdzony PDF przez ID zasobu, nigdy ścieżkę podaną przez model. Sprawdź sygnaturę pliku, rozsądny limit rozmiaru (propozycja 5 MB), hash i nazwę. Wykorzystaj niezmienne zatwierdzone bajty, żeby podmiana pliku między walidacją a send nie zmieniła załącznika. Zero dowolnego odczytu plików na podstawie treści maila.

## 12. Limity i harmonogram

Domyślnie przygotuj konfigurację, ale nie aktywuj żadnej kampanii:

- strefa Europe/Warsaw; wszystkie timestampy w bazie UTC;
- dni robocze, proponowane okno 08:00–16:00, do zatwierdzenia;
- cykl co 60 minut, maksymalnie 20 minut pracy na cykl;
- najwyżej 20 kandydatów firm/ofert do oceny na cykl;
- jeden aktywny run i jeden sender;
- pilotaż: 10 wysyłek w lokalnym dniu, maksymalnie 3 w jednym cyklu, 50 w zatwierdzonej kampanii;
- zgoda AUTO_POLICY maksymalnie 7 dni w pilotażu, później wymaga odnowienia;
- maksymalna długość wywołania modelu, liczba żądań i dzienny budżet pracy konfigurowalne;
- po 3 kolejnych cyklach bez nowych wartościowych kandydatów status `NO_NEW_CANDIDATES`; brak bezcelowego ciągłego przeszukiwania tych samych stron.

Powyższe liczby są ostrożnymi ustawieniami produktu, nie gwarancją dostarczalności. Agent nie zwiększa ich sam. Osiągnięcie limitu wysyłki nie musi kończyć researchu, jeśli zostały na niego budżety; kolejne szkice czekają.

Licznik dnia licz atomowo z zaakceptowanych wysyłek, rezerwacji i niepewnych prób. Wznowienie procesu, drugi run, zmiana trybu i zmiana daty nie mogą resetować limitu w niewłaściwy sposób. Testuj DST i wznowienie po północy; używaj biblioteki stref czasowych/Intl, nie ręcznie stałego UTC+2.

Zapisuj heartbeat i lease z expiry. Opuść zaległe serie po uśpieniu komputera; uruchom jeden kontrolowany cykl, bez nadrabiania całego dnia wysyłkami naraz. Stop jest trwały i obowiązuje po restarcie. Stale lease dla researchu można bezpiecznie przejąć, ale wysyłkę niepewną tylko rozstrzygnąć.

Na Windowsie uruchomienie `start.ps1` startuje lokalny backend/worker i otwiera dashboard. Zamknięcie przeglądarki nie kończy backendu; uśpienie lub zamknięcie procesu zatrzymuje pracę. Bez Computer Use można pracować bez aktywnego pulpitu, ale zweryfikuj to na realnym środowisku; połączenie i brak uśpienia nadal są konieczne. Opcjonalny Harmonogram zadań Windows dopiero za zgodą, bez samoczynnej zmiany zabezpieczeń systemu.

## 13. Pauza, błędy i warunki przerwania

Rozróżniaj `RATE_LIMITED`, `AUTH_REQUIRED`, `APPROVAL_REQUIRED`, `SOURCE_BLOCKED`, `PROVIDER_UNAVAILABLE`, `BUDGET_EXCEEDED`, `INVALID_MODEL_OUTPUT`, `SEND_UNKNOWN` i `ERROR`.

Ograniczenie konta, nieprawidłowe uwierzytelnienie, niepewna wysyłka lub brak możliwości sprawdzenia blokad wstrzymują sender. Twardy bounce wyłącza adres; seria 3 kolejnych twardych zwrotów w pilotażu pauzuje wysyłkę do przeglądu. To reguła ostrożności, nie próg usługi Google.

Prośba o niekontaktowanie się zapisuje blokadę odbiorcy/firmy. AI nie może usuwać blokady. Nie używaj nowego konta, adresu lub IP jako sposobu obejścia ograniczeń. [S12]

Błąd jednej strony nie musi zatrzymać researchu innych firm, ale błąd tożsamości nadawcy, bazy lub polityki jest krytyczny.

## 14. Model danych

Wszystkie istotne rekordy mają ID, created_at, updated_at i wersję do kontroli konfliktów.

| Tabela | Najważniejsze pola |
|---|---|
| `candidate_profiles` | wersja, approved_at, profile_hash, imię, dostępność, ograniczenia |
| `candidate_facts` | profile_id, fact_key, treść, źródło, approval_status |
| `portfolio_projects` | URL, zatwierdzony opis, technologie/obszary, limitations |
| `cv_assets` | ID pliku, SHA-256, byte_size, nazwa, wersja, approved_at |
| `mail_accounts` | provider, email, subject_id, zakresy, credential_reference, status |
| `campaigns` | mode, profile_version, cv_id, account_id, policy_version, limity, okno, expires_at |
| `campaign_authorizations` | actor=user, zakres, timestamps, payload_hash, expires_at, revoked_at |
| `companies` | canonical_name, primary_domain, normalized_key, history_status, suppression_reason |
| `company_aliases` | company_id, typ aliasu, value, evidence_id, verified_at |
| `opportunities` | company_id, source_url, title, type, status, required_conditions, decision, reasons |
| `contacts` | company_id, email, typ, source_id, purpose, verification_status, verified_at |
| `evidence` | canonical_url, fetched_at, content_hash, fragment, extraction_metadata, availability |
| `search_queries` | query, provider, fingerprint, last_run, next_due, result_status |
| `drafts` | campaign/company/opportunity/contact, subject, body, evidence_ids, fact_ids, version, payload_hash |
| `draft_approvals` | draft_version, payload_hash, CV/account/profile binding, actor, expires_at |
| `outbox` | submission_id, draft_version, company_id, status, lease, idempotency_key |
| `send_attempts` | outbox_id, RFC Message-ID, MIME hash, state, time, provider IDs, error_class |
| `mail_threads` | account_id, provider_thread_id, company_id, match_confidence/state |
| `mail_messages` | provider_message_id, direction, date, type, minimal content, classification, reviewed_at |
| `suppressions` | firma/adres/domena, reason, source, actor, scope, until lub permanent |
| `runs` i `jobs` | etap, lease, heartbeat, status, cursor, attempt, next_retry, model/provider usage |
| `usage_ledger` | dzień/strefa, campaign, quota reservations, model/request usage |
| `audit_events` | actor, action, entity, reason, redacted payload, timestamp |
| `sync_state` | konto, zakres importu, cursor/historyId, last_success, incomplete flag |
| `app_state` | pause, kill_switch, scheduler settings, local setup status |

Dodaj unikalność: wiadomość dostawcy w obrębie konta, RFC Message-ID próby, submission ID, unikalne zaplanowanie cyklu oraz pierwszy kontakt w aktywnej polityce firmowej. Normalizacja aliasów/merge firm jest transakcyjna i nie usuwa historii. Nie próbuj wyrazić wszystkich zależności jednym wielkim JSON-em.

## 15. Kontrakty integracji

### CodexRunner

`probe()`, `run(task, input, outputSchema, signal)`, `cancel(runId)`; wynik ma structuredOutput, usage, providerRunId, status, warnings. Szczegółową sygnaturę dopasuj do kodu, zachowując rozdzielenie obowiązków.

Użyj rzeczywiście dostępnych funkcji `codex exec`, m.in. JSONL i output schema, po sprawdzeniu `--help`. Twórz proces bez interpolowania prompta do PowerShell. Dane wejściowe przez stdin lub bezpieczny plik zadania. Timeout anuluje proces i potomków bez zamykania cudzej sesji Codexa. [S1]

Nie parsuj wewnętrznego toku rozumowania i nie pokazuj go w dashboardzie. Wystarczą operacje narzędziowe, widoczne podsumowania i końcowy JSON. Nieznane zdarzenia są ignorowane bez awarii; malformed final output nie staje się pustą listą firm.

### ResearchProvider

`search`, `fetchPublicPage`, `extractEvidence`. Prawdziwy dostęp do wyszukiwarki musi być udokumentowany i przetestowany. Nie implementuj pozornej wyszukiwarki zwracającej fixtures w live. Gdy natywne narzędzia Codexa nie działają w tej integracji, zaimplementuj import URL/CSV i interfejs do przyszłego uprawnionego SearchProvider. Brak płatnego klucza nie jest zgodą na zakup.

### MailProvider

`probe`, `getAccountIdentity`, `listRelevantMessages`, `getThread`, `sendFrozenMessage`, `lookupSendResult`. Nie udostępniaj tego interfejsu w całości agentowi. Read i send mają osobne możliwości, nawet jeśli korzystają z tego samego konta.

### Walidacja

Każde wejście z modelu przez Zod/JSON Schema z `additionalProperties: false`. URL, email, rozmiary tablic, długości tekstu i enumy ograniczone. Wszystkie ID zwrócone przez model muszą istnieć i należeć do bieżącego zadania. Nie wykonuj instrukcji lub poleceń shell zawartych w odpowiedzi.

## 16. Lokalny HTTP API

Przykładowe grupy tras — zachowaj ich sens, nie buduj zbędnych endpointów:

- `GET /api/health`, `GET /api/capabilities`.
- `GET/PUT /api/profile`, `POST /api/profile/approve`, `POST /api/cv`, `GET /api/cv/:id/preview`.
- `GET/POST /api/companies`, `GET /api/companies/:id`, `POST /api/history/import`, `POST /api/history/review`.
- `GET /api/opportunities`, `POST /api/opportunities/:id/review`.
- `GET /api/drafts`, `PATCH /api/drafts/:id`, `POST /api/drafts/approve-batch`.
- `POST /api/campaigns`, `POST /api/campaigns/:id/authorize`, `POST /api/campaigns/:id/start`, `.../pause`, `.../revoke`.
- `POST /api/emergency-stop` — wymaga lokalnej autoryzacji użytkownika, a nie publicznej strony.
- `GET /api/runs`, `GET /api/runs/:id`, `GET /api/events` (SSE), `GET /api/reports`.
- `GET /api/replies`, `POST /api/replies/:id/review`.
- `POST /api/integrations/gmail/connect`, callback, `.../disconnect`, `POST /api/integrations/codex/probe`.

Nie dodawaj ogólnego endpointu `/send-any-email` przyjmującego dowolną treść/adres i obchodzącego outbox. Agent ma dostęp co najwyżej do ograniczonych danych i zapisu propozycji, nigdy do admin endpoints.

## 17. Bezpieczeństwo lokalne i prompt injection

Backend nasłuchuje wyłącznie na 127.0.0.1. To nie jest zamiennik autoryzacji: dodaj lokalną sesję użytkownika, ochronę CSRF, kontrolę Host/Origin, SameSite cookies i brak otwartego CORS. Autoryzacji live nie wykonuje żądanie z obcej strony. Hasło/token sesji nie jest dostarczany modelowi. Nie otwieraj portu na LAN i nie uruchamiaj tunelu do telefonu w MVP.

Dane runtime, baza, CV i sekrety poza repozytorium, np. `%LOCALAPPDATA%/JobHunter`. Osobne katalogi demo i live. Agent runtime dostaje tylko osobny katalog zadania z minimalnymi danymi; nie źródła aplikacji pozwalające zmieniać dispatcher.

Zablokuj odczyt tokenów/sekretów oraz zapis do polityki, bazy i aplikacji przez OS sandbox/ACL i odpowiednio ograniczone narzędzia. Sam tryb read-only może nadal pozwalać czytać niektóre pliki — sprawdź granice. Sam brak narzędzia send nie wystarcza, gdy agent ma ogólny shell i dostęp do tokenu/API. DPAPI pod tym samym użytkownikiem również nie stanowi pełnej izolacji. Jeśli nie da się wykazać tych granic na danym Windowsie, AUTO_POLICY pozostaje wyłączony. [S2, S11]

Nie używaj flag wyłączających wszystkie zabezpieczenia jako sposobu naprawiania integracji. Nie omijaj pytań o zgody. Budujący aplikację Codex może edytować jej kod; uruchomiony agent researchowy nie może samodzielnie zmieniać własnych uprawnień i programu nadawcy.

Treść stron, ogłoszeń i maili jest nieufnym materiałem. Nie może zlecać odczytu dysku, zmiany odbiorcy, wysłania plików ani modyfikacji kampanii. Każde źródło zachowuje metadane pochodzenia. Wyświetlanie treści w panelu wymaga escapowania/sanitizacji; linki bez automatycznego otwierania.

Brak automatycznego pobierania skryptów, plików .exe/.zip z maili i wykonywania załączników. Brak wysyłania całej skrzynki/modelowi i brak telemetrii projektu bez zgody. Logi redagują dane wrażliwe; nie loguj surowych OAuth callbacków, nagłówków Authorization ani tokenów.

Kopie bazy przez mechanizm bezpieczny dla aktywnego SQLite/WAL, nie prosty copy pojedynczego pliku podczas zapisu. Backup bez tokenów; UI informuje, że zawiera prywatne dane. Eksport CSV zabezpiecz przed formułami zaczynającymi się od =, +, -, @ oraz poprawnie cytuj pola. Retencja raw research/mail excerpts i czyszczenie do konfiguracji użytkownika; zachowuj minimalne blokady kontaktu po usunięciu treści.

## 18. Statystyki i koszty

KPI liczone wyłącznie z trwałych zdarzeń. Rozdziel: znaleziono firmę, odczytano źródło, sprawdzono dopasowanie, przygotowano szkic, wysłano, potwierdzono w Wysłanych, otrzymano automatyczne potwierdzenie, otrzymano ludzką odpowiedź, użytkownik potwierdził zainteresowanie, zaproszono na rozmowę.

Nie traktuj trzech ofert tej samej firmy jako trzech nowych firm. Nie doliczaj ponownego odczytu maila jako nowej odpowiedzi. Nie pokazuj statystyk demo w live. Dla wskaźnika odpowiedzi podaj mianownik, przedział czasu i opóźnienie; najnowsze zgłoszenia nie są jeszcze porównywalne ze starszymi.

Zapisuj realnie dostępne: czas pracy, wywołania, input/output tokens, dostawcę i model. Przy koncie subskrypcyjnym nie wymyślaj kosztu w PLN. Jeśli kwoty nie są dostępne, pokaż „brak danych”, nie „0 zł”. Nie przechodź z logowania kontem na płatny klucz API bez decyzji użytkownika.

Raport po szkole dostępny w panelu oraz jako plik Markdown. Wysyłanie go mailem/SMS to funkcja późniejsza, wymagająca osobnej zgody.

## 19. Testy obowiązkowe

### Proces i jakość

- Pełny scenariusz offline: discovery -> evidence -> qualification -> draft -> approval -> mock send -> mock reply -> statystyki.
- Rzeczywiste stany puste, timeouty, niepełna konfiguracja, brak wyszukiwania i brak logowania.
- AI zwraca nieistniejące evidence ID, zmyślone doświadczenie, niepoprawny JSON, zbyt długą treść — blokada/review.
- Nieznana zdalność nie staje się potwierdzoną. Ogłoszenie archiwalne nie staje się aktywne. Senior/full-time-onsite nie przechodzi automatycznie.
- Ponowne przeszukanie, zmiana adresu i alias domeny nie tworzą nowego pierwszego kontaktu.

### Sender

- Brak zgody i wygasła zgoda uniemożliwiają prawdziwy send.
- Zmiana CV, recipienta, tekstu, profilu i nadawcy unieważnia zatwierdzenie.
- Jeden odbiorca; brak CC/BCC i wstrzyknięć CRLF do nagłówków.
- Dwa równoległe zadania nie wysyłają dwóch wiadomości do tej samej firmy i nie przekraczają limitu.
- Timeout po faktycznym przyjęciu maila: SEND_UNKNOWN -> reconcile; liczba wywołań send pozostaje 1.
- Restart w SENDING nie uruchamia ponownej wysyłki.
- Pause/kill switch, nowa odmowa lub blokada przed dispatch uniemożliwiają send.
- Odpowiedź Gmail sukces bez potwierdzenia w Wysłanych nie jest prezentowana jako doręczenie.
- Podmiana pliku CV nie zmienia zatwierdzonych bajtów.
- Osiągnięty limit, północ, DST, uśpienie i wznowienie nie powodują burst ani resetu rezerwacji.

### Izolacja i UI

- Prompt injection w stronie/mailu: propozycja wysłania innego pliku lub na inny adres nie dociera do send.
- Runtime agent nie czyta sekretów ani nie zapisuje polityki/bazy. Wynik negatywny blokuje AUTO_POLICY.
- Próba wykonania approve/start z obcej strony jest odrzucona; test Host/Origin, CSRF, sesji.
- Fetcher odrzuca localhost, IPv6 loopback, prywatne IP i przekierowanie na takie zasoby.
- HTML z maila nie wykonuje skryptu; CSV export nie wykonuje formuł.
- Import historii i synchronizacja z paginacją są idempotentne; 404 historyId nie gubi zapisanej historii.
- Demo nigdy nie korzysta z transportu live, nawet jeśli na komputerze istnieją tokeny.
- Playwright sprawdza panel i rzeczywisty mock backend, nie tylko statyczne zrzuty.

Testy automatyczne używają wyłącznie fikcyjnych firm i adapterów. Realny test poczty tylko do własnego adresu użytkownika po osobnej zgodzie. Windows smoke test z polską ścieżką i spacjami. Nie deklaruj testów Windows jako wykonanych, jeżeli działałeś wyłącznie na innym OS.

## 20. Plan implementacji i kryteria ukończenia

### E0 — diagnostyka i plan

Rozpoznaj istniejący katalog i nie nadpisuj cudzej pracy. Przygotuj CAPABILITY_REPORT.md, IMPLEMENTATION_PLAN.md, SOURCES.md i TASKS.md. Opisz brakujące konfiguracje, wybraną wersję stosu i rozdzielenie ról. Nie kontaktuj się z firmami.

### E1 — lokalny fundament

Działający backend, migracje, UI po polsku, lokalna konfiguracja profilu, rejestr firm, szkice, historia i run log. Osobna baza demo/live, widoczne możliwości, start/pause/stop i empty states. Lokalne uwierzytelnienie przewidziane od początku; live niedostępny.

### E2 — pełny proces demonstracyjny

Mock adapters, kolejka, deduplikacja, policy engine, wersjonowanie szkiców/zgód, quota reservations, stany niepewnej wysyłki, fake replies oraz dashboard z rzeczywistych rekordów. Testy normalnego przebiegu i krytycznych awarii. To pierwszy działający produkt, nie makieta.

### E3 — rzeczywisty research + Codex

Działający CodexRunner, strukturalne wyniki, pobieranie publicznych źródeł/import URL, evidence i lokalne wiadomości. Prawdziwe wyszukiwanie tylko po konfiguracji i smoke teście. Jeżeli brak providerów, import URL działa, a autonomiczny search jest jawnie zablokowany. Zero wysyłek.

### E4 — Gmail, historia i wysyłka zatwierdzonej paczki

OAuth, identyfikacja konta, zatwierdzony import historii i replies, manual approval, pojedynczy test do siebie, następnie możliwość ręcznie zatwierdzonych prawdziwych paczek. Zbudowanie tej możliwości nie upoważnia do jej użycia podczas kodowania.

### E5 — kontrolowana autonomia

AUTO_POLICY po testach bezpieczeństwa/izolacji, limity w kodzie, harmonogram, trwałe pauzy, resume i raport. Użytkownik sam zatwierdza zakres i uruchamia kampanię. Jeśli izolacja lub dostawca tego nie pozwala, pozostań w trybie akceptacji zamiast udawać autonomię.

### Definition of Done

Aplikacja działa na Windowsie z udokumentowanych poleceń, pamięta stan po restarcie, przedstawia prawdziwe źródła i metryki, nie dubluje zgłoszeń w przetestowanych scenariuszach, nie wysyła nic bez właściwej zgody i nie ukrywa błędów integracji. README dokładnie rozróżnia działające funkcje, demo, blokady i roadmapę.

Nie rozbudowuj projektu o nowe ekrany marketingowe, publiczny landing page, wieloużytkownikowość, instalator desktopowy i dodatkowe technologie przed E2/E3.

## 21. Proponowany układ repozytorium

```text
JobHunter/
  AGENTS.md
  README.md
  JobHunter_SPEC.md
  package.json
  package-lock.json
  .env.example
  .gitignore
  apps/
    web/
    server/
      src/
        api/
        auth/
        db/
        domain/
        policy/
        scheduler/
        worker/
        providers/codex/
        providers/research/
        providers/mail/
        security/
        reporting/
  packages/shared/
  migrations/
  prompts/
    discover.md
    qualify.md
    draft.md
    classify-reply.md
  schemas/
  fixtures/
  tests/
  scripts/
    setup.ps1
    start.ps1
    stop.ps1
    doctor.ps1
  docs/
    CAPABILITY_REPORT.md
    IMPLEMENTATION_PLAN.md
    SOURCES.md
    SECURITY.md
    TEST_REPORT.md
    TASKS.md
```

To propozycja organizacji, nie pretekst do tworzenia pustych modułów. Repo prywatne domyślnie; bez remote/push, dopóki użytkownik o to nie poprosi. Dane runtime i tokeny pozostają poza drzewem projektu.

## 22. Jak ma pracować Codex budujący aplikację

Czytaj tę specyfikację, ale nie traktuj jej jako przyzwolenia na prawdziwe wiadomości. W pierwszym uruchomieniu wykonaj E0–E2, sprawdź działanie i zatrzymaj się z raportem. Nie kończ na planie lub statycznym dashboardzie. Nie blokuj implementacji demo pytaniem o hasła lub klucze, które będą potrzebne dopiero do E3/E4.

Sprawdzaj bieżącą dokumentację oficjalną i lokalne wersje narzędzi. Nie wymyślaj endpointów, flag, pluginów i ich uprawnień. Używaj małych etapów i uruchamiaj testy. Gdy środowisko nie pozwala na daną czynność, zachowaj ograniczenie i opisz je, nie zmieniaj zabezpieczeń globalnych Windowsa.

Na końcu podaj: co działa, co jest symulowane, jakie testy uruchomiono i z jakim wynikiem, jak wystartować na Windowsie, czego wymaga następny etap i jakie są znane ryzyka. Nie deklaruj produkcyjnego bezpieczeństwa ani pełnej autonomii na podstawie samego przejścia testów.

## 23. Oficjalne źródła do sprawdzenia podczas implementacji

Dokumenty sprawdzono przy przygotowaniu specyfikacji; funkcje i dostępność konta mogą się zmienić. Rozwiązania projektowe powyżej są naszymi wymaganiami, a nie deklaracjami producentów.

- [S1] Codex, Non-interactive mode: https://learn.chatgpt.com/docs/non-interactive-mode — `codex exec`, JSONL, output schema i uwierzytelnienie.
- [S2] Windows sandbox: https://learn.chatgpt.com/docs/windows/windows-sandbox — ograniczenia dostępu do plików i sieci, tryby izolacji.
- [S3] Codex SDK: https://learn.chatgpt.com/docs/codex-sdk — oficjalne możliwości programowego sterowania; alternatywa, nie wymagany drugi adapter.
- [S4] Computer Use: https://learn.chatgpt.com/docs/computer-use — aktywny pulpit i odblokowane urządzenie w Windows.
- [S5] Scheduled tasks: https://learn.chatgpt.com/docs/automations — automatyzacje aplikacji a dostęp do lokalnego folderu. JobHunter ma własny scheduler.
- [S6] Gmail sending: https://developers.google.com/workspace/gmail/api/guides/sending — wiadomości MIME, załączniki i send.
- [S7] Gmail scopes: https://developers.google.com/workspace/gmail/api/auth/scopes — zakresy readonly/send/compose i wymagania weryfikacji.
- [S8] Gmail sync: https://developers.google.com/workspace/gmail/api/guides/sync — paginacja, historia i re-sync.
- [S9] OAuth dla aplikacji instalowanych: https://developers.google.com/identity/protocols/oauth2/native-app
- [S10] OAuth expiration/testing: https://developers.google.com/identity/protocols/oauth2#expiration
- [S11] Windows ProtectedData: https://learn.microsoft.com/en-us/dotnet/api/system.security.cryptography.protecteddata
- [S12] Gmail Program Policies: https://support.google.com/mail/answer/16734397?hl=en
- [S13] Node LTS: https://nodejs.org/en/about/previous-releases
- [S14] Fastify: https://fastify.dev/docs/latest/Guides/Getting-Started/

W SOURCES.md zapisz konkretny URL, datę dostępu oraz co z niego potwierdzono. Nie uzasadniaj obsługi narzędzia w CLI samym faktem, że działa ono w desktopowym GUI.
