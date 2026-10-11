# JobHunter — aktualna specyfikacja

Wersja 2.0, 11 października 2026. Zastępuje ręczną akceptację każdej wiadomości i rozbudowaną obsługę odpowiedzi ze specyfikacji 1.0. Granice danych, prawdziwości, separacji trybów i niezamówionych wysyłek pozostają.

## Produkt

Osobiste narzędzie Jakuba do znalezienia płatnej, regularnej współpracy programistycznej: firmy przede wszystkim z Polski, wiadomości po polsku, w pełni zdalnie, około 20 h tygodniowo głównie po lekcjach. Rano użytkownik włącza Start; program szuka, czyta publiczne źródła, dobiera zatwierdzony projekt, sprawdza kontakt, tworzy wiadomość z CV i przechodzi dalej. Pracuje do Stop, ustawionego limitu lub wymagającego reakcji problemu. Odpowiedzi użytkownik obsługuje sam w Gmailu.

Zakres wyklucza CRM, AI do odpowiedzi, automatyczne odpowiedzi/follow-upy, kalendarz, LinkedIn, Useme, formularze, SaaS dla wielu użytkowników i nową płatną infrastrukturę. Adapter źródeł pozostaje rozszerzalny; przyszłych integracji nie implementujemy z wyprzedzeniem.

## Research i materiały

Szukanie obejmuje software house’y, agencje, zespoły produktowe, SaaS, web/backend, API, integracje, automatyzacje, dokumenty i narzędzia wewnętrzne. Firmy spoza IT wymagają udokumentowanej podstawy kontaktu. Do zapytań trafiają skrócone zatwierdzone projekty, cel i dostępność. Pamiętamy zapytania, domeny, źródła i firmy; po wykorzystaniu kierunków czekamy, bez intensywnej pętli tych samych zapytań.

Rozróżniamy ACTIVE, OPEN i PROSPECT. Nieznane warunki pozostają unknown. Niedopasowane ogłoszenie nie jest blokadą całej firmy: osobno udokumentowana działalność i właściwy kontakt mogą uzasadniać PROSPECT. Nie przedstawiamy kandydata jako spełniającego wymagania seniorskej/full-time oferty. Wyraźne odmowy spontanicznych zgłoszeń i ograniczenia kanału aplikacji mają pierwszeństwo.

Dowody mają pierwotny/końcowy URL, czas, metodę, tekst/fragment i hash. Wersja treści jest oddzielona od zdarzenia ponownej weryfikacji. Nieudany odczyt nie odmładza źródła. Kontakt ma oddzielny literalny dowód, przeznaczenie i kwalifikację użycia. Zniknięcie lub zmiana celu unieważnia wcześniejszy dowód.

Materiały mają jawne wersje i zatwierdzenie. Publiczny GitHub nie jest działającym publicznym demo; projekt portfolio nie jest produkcją. Kandydat jest uczniem technikum, nie studentem uczelni. Nie dopisujemy doświadczenia, stawek, egzaminów ani kompetencji. CV wskazuje i zatwierdza użytkownik; sprawdzamy SHA-256 niezmiennej kopii. Zmiana faktów/CV/nadawcy wymaga ponownego sprawdzenia polityki.

Styl pozostaje w docs/MESSAGE_STYLE.md: przedstawienie, prawdziwe nawiązanie, zwykle jeden projekt, dostępność, jedno pytanie, GitHub i podpis. Bez sprzedaży usług, marketingu, prezentacji i wypełniaczy. AI/Codex opisujemy naturalnie, w zatwierdzonym zakresie.

## Tryby i polityka

DEMO jest osobną symulacją. RESEARCH_ONLY nie inicjalizuje Gmaila/send. APPROVAL_REQUIRED zachowuje opcjonalną akceptację paczek. AUTO_POLICY wymaga zatwierdzenia nadawcy, faktów, CV, kontaktów/naboru, zakresu, tempa, opcjonalnych limitów i ograniczonego technicznego odczytu historii. Potem jawny Start tworzy lokalną sesję; poprawne wiadomości nie wymagają osobnych zgód.

Kod sprawdza tożsamość firmy, literalny adres/źródło/przeznaczenie/aktualność, treść wobec faktów/źródeł, historię/blokady/niepewne próby, aktualną politykę/CV/nadawcę i własność historii. GENERAL dopuszczony do zapytania zachowuje GENERAL; nie jest potwierdzoną rekrutacją. Kontakty sprzedaży/faktur/security/privacy i niepewne informacje są blokowane. Kontrola modelu jest pomocnicza; kontrole deterministyczne pozostają. Niepewny szkic zapisujemy jako pominięty/do sprawdzenia i kontynuujemy inne firmy.

## Sesja i sender

Brak limitu użytkownika oznacza pracę ciągłą. Tempo jest niezależne od liczby wiadomości. Nie ma ukrytych 3/10/8/godziny ani daty końca AUTO_POLICY. Ograniczona kolejka i rozmiar zadania chronią zasoby. Limity dostawcy i awarie zatrzymują właściwą część procesu; bez rotacji kont i obchodzenia ograniczeń. CODEX_LIMIT zapisuje checkpoint i wymaga jawnego wznowienia, bez obietnicy terminu odnowienia.

Research i sender mają oddzielną zajętość. Pauza blokuje nowe operacje i zachowuje postęp. Stop kończy sesję i odwołuje uprawnienie. Restart wymaga Start, uśpienie nie wywołuje zaległej serii. Przed jednym POST utrwalamy rezerwację, ID i zamrożony MIME. SENDING/SENT/SEND_UNKNOWN blokują kolejny pierwszy kontakt między sesjami, kontami i urządzeniami. Timeout po możliwym przyjęciu pozostaje niepewny. Reconcile potwierdza istniejącą próbę, nie wysyła drugi raz. Bez obietnicy exactly-once między SQLite i Gmailem.

## Historia i urządzenia

Osobne prywatne repo historii przenosi wersjonowany minimalny JSON: firmy, potwierdzone aliasy, kontakty ręczne, blokady, próby/rezerwacje i liczniki. Nie przenosi aktywnej zgody, tokenów/OAuth, CV/PDF, loginu Codexa, SQLite/WAL lub całej skrzynki. Eksport wynika z transakcyjnego odczytu, plik publikujemy atomowo, import jest transakcyjny i nie usuwa lokalnych danych. Konflikt blokuje wysyłkę; bez force-push.

Start weryfikuje remote i przejmuje opublikowaną własność. Nieukończona sesja innego urządzenia blokuje pracę także po pull. Przekazanie zatrzymuje operacje, czeka na rozpoczętą próbę, eksportuje/publikuje i dopiero zwalnia właściciela. Brak konfiguracji daje instrukcję, nie sukces. Nie tworzymy zdalnego repo ani nie publikujemy prywatnego stanu bez wskazania i potwierdzenia celu. Testy używają lokalnych repo i fikcyjnych danych.

## Panel i testy

Dwa główne widoki: Praca programu i Historia firm. Materiały, połączenia i polityka w Ustawieniach. Stan, firma, liczniki, limit, nadawca, CV, synchronizacja i powód blokady są widoczne. Historia zachowuje temat/treść, datę, kontakt i źródła. SELF_TEST nie zwiększa statystyk aplikowania. Odpowiedzi/CRM/raporty nie są eksponowane; stare dane nie są usuwane.

Testy: automat bez akceptacji maili, GENERAL/polityka, unknown kontra fałszywe dopasowanie, zmiana profilu/CV/nadawcy, Stop/Pauza, niepewny send, tempo/limity/brak limitu, dostawcy, świeżość źródeł, deduplikacja i właściciel między urządzeniami, konflikty/przerwany eksport/brak sekretów oraz SELF_TEST. Po etapach npm run check; Windows zaliczamy wyłącznie po rzeczywistym uruchomieniu z opisem zakresu. Specyfikacja nie dowodzi wdrożenia: patrz docs/TASKS.md i docs/TEST_REPORT.md.
