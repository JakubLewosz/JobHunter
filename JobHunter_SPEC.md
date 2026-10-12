# JobHunter — aktualna specyfikacja

Wersja 2.1, 12 października 2026. Zastępuje obowiązkową synchronizację między urządzeniami. Zachowuje AUTO_POLICY bez akceptacji każdego maila i granice danych/prawdziwości/niezamówionych wysyłek.

## Produkt

Osobiste narzędzie Jakuba do znalezienia płatnej, regularnej współpracy programistycznej: firmy przede wszystkim z Polski, wiadomości po polsku, w pełni zdalnie, około 20 h tygodniowo głównie po lekcjach. Rano użytkownik włącza Start; program szuka, czyta publiczne źródła, dobiera zatwierdzony projekt, sprawdza kontakt, tworzy wiadomość z CV i przechodzi dalej. Pracuje do Stop, ustawionego limitu lub wymagającego reakcji problemu. Odpowiedzi użytkownik obsługuje sam w Gmailu.

Zakres wyklucza CRM, AI do odpowiedzi, automatyczne odpowiedzi/follow-upy, kalendarz, LinkedIn, Useme, formularze, SaaS dla wielu użytkowników i nową płatną infrastrukturę. Adapter źródeł pozostaje rozszerzalny; przyszłych integracji nie implementujemy z wyprzedzeniem.

## Research i materiały

Szukanie obejmuje software house’y, agencje, zespoły produktowe, SaaS, web/backend, API, integracje, automatyzacje, dokumenty i narzędzia wewnętrzne. Firmy spoza IT wymagają udokumentowanej podstawy kontaktu. Do zapytań trafiają skrócone zatwierdzone projekty, cel i dostępność. Pamiętamy zapytania, domeny, źródła i firmy; po wykorzystaniu kierunków czekamy, bez intensywnej pętli tych samych zapytań.

Rozróżniamy ACTIVE, OPEN i PROSPECT. Nieznane warunki pozostają unknown. Niedopasowane ogłoszenie nie jest blokadą całej firmy: osobno udokumentowana działalność i właściwy kontakt mogą uzasadniać PROSPECT. Nie przedstawiamy kandydata jako spełniającego wymagania seniorskej/full-time oferty. Wyraźne odmowy spontanicznych zgłoszeń i ograniczenia kanału aplikacji mają pierwszeństwo.

Dowody mają pierwotny/końcowy URL, czas, metodę, tekst/fragment i hash. Wersja treści jest oddzielona od zdarzenia ponownej weryfikacji. Nieudany odczyt nie odmładza źródła. Kontakt ma oddzielny literalny dowód, kontekst strukturalny HTML, przeznaczenie i kwalifikację użycia. Nagłówek nad adresem jest związany z sekcją/listą/wierszem; niezwiązany dział nie dyskwalifikuje innego adresu. Konflikt, zniknięcie lub zmiana celu unieważnia wcześniejszy dowód. Globalne odmowy/kanały pozostają niezależne.

Materiały mają jawne wersje i zatwierdzenie. Publiczny GitHub nie jest działającym publicznym demo; projekt portfolio nie jest produkcją. Kandydat jest uczniem technikum, nie studentem uczelni. Nie dopisujemy doświadczenia, stawek, egzaminów ani kompetencji. CV wskazuje i zatwierdza użytkownik; sprawdzamy SHA-256 niezmiennej kopii. Zmiana faktów/CV/nadawcy wymaga ponownego sprawdzenia polityki.

Styl pozostaje w docs/MESSAGE_STYLE.md: przedstawienie, prawdziwe nawiązanie, zwykle jeden projekt, dostępność, jedno pytanie, GitHub i podpis. Bez sprzedaży usług, marketingu, prezentacji i wypełniaczy. AI/Codex opisujemy naturalnie, w zatwierdzonym zakresie.

## Tryby i polityka

DEMO jest osobną symulacją. RESEARCH_ONLY nie inicjalizuje Gmaila/send. APPROVAL_REQUIRED zachowuje opcjonalną akceptację paczek. AUTO_POLICY wymaga zatwierdzenia nadawcy, faktów, CV, kontaktów/naboru, zakresu, tempa, opcjonalnych limitów i ograniczonego technicznego odczytu historii. Potem jawny Start tworzy lokalną sesję; poprawne wiadomości nie wymagają osobnych zgód.

Kod sprawdza tożsamość firmy, literalny adres/źródło/przeznaczenie/aktualność, treść wobec faktów/źródeł, historię/blokady/niepewne próby, aktualną politykę/CV/nadawcę i lokalną blokadę profilu. GENERAL dopuszczony do zapytania zachowuje GENERAL; nie jest potwierdzoną rekrutacją. Kontakty sprzedaży/faktur/security/privacy i niepewne informacje są blokowane. Kontrola modelu jest pomocnicza; kontrole deterministyczne pozostają. Niepewny szkic zapisujemy jako pominięty/do sprawdzenia i kontynuujemy inne firmy.

## Sesja i sender

Brak limitu użytkownika oznacza pracę ciągłą. Tempo jest niezależne od liczby wiadomości. Nie ma ukrytych 3/10/8/godziny ani daty końca AUTO_POLICY. Ograniczona kolejka i rozmiar zadania chronią zasoby. Limity dostawcy i awarie zatrzymują właściwą część procesu; bez rotacji kont i obchodzenia ograniczeń. CODEX_LIMIT zapisuje checkpoint i wymaga jawnego wznowienia, bez obietnicy terminu odnowienia.

Research i sender mają oddzielną zajętość. Pauza blokuje nowe operacje i zachowuje postęp. Stop kończy sesję i odwołuje uprawnienie. Restart wymaga Start, uśpienie nie wywołuje zaległej serii. Przed jednym POST utrwalamy rezerwację, ID i zamrożony MIME. SENDING/SENT/SEND_UNKNOWN blokują kolejny pierwszy kontakt między sesjami, kontami i urządzeniami. Timeout po możliwym przyjęciu pozostaje niepewny. Reconcile potwierdza istniejącą próbę, nie wysyła drugi raz. Bez obietnicy exactly-once między SQLite i Gmailem.

## Historia i urządzenia

GitHub przechowuje kod/testy/bezpieczną dokumentację. Jedna trwała SQLite na domowym Windowsie obejmuje historię między sesjami/nadawcami; materiały/CV i konfiguracja są poza repo, poświadczenia w lokalnym magazynie systemowym. Aktualizacja/zmiana gałęzi/trybu nie tworzy pustej alternatywnej historii. RESEARCH_ONLY i AUTO używają tego samego research-only. MacBook jest developerski, z osobnymi danymi syntetycznymi i technicznie niedostępnym natywnym Gmailem.

LOCAL_ONLY jest jawną strategią, niezależną od trybu pracy. Start/bramki/sender/Stop/readiness nie potrzebują Gita, origin ani zdalnego właściciela. Blokada jednego profilu działa między procesami i portami. Niespójna baza, utrata blokady, nieznany profil i SEND_UNKNOWN nadal blokują. Nie gwarantujemy własności między niepołączonymi komputerami: pracuje jeden komputer.

PRIVATE_GIT może pozostać jako opcjonalny moduł kompatybilności. Już skonfigurowany profil zachowuje go do jawnego przejścia po Stop: pełna lokalna historia, zamknięty opublikowany stan, brak niepewnych prób i sprawdzenie zgodności. Bez ignorowania błędów synchronizacji, porzucenia nieopublikowanej historii lub kasowania shared_attempts/shared_usage. Pełna macierz awarii handoff jest odłożona.

Nowy checkout uruchamia DEVELOPMENT/DEMO. WORKSTATION wymaga Windowsa i lokalnego oznaczenia istniejącej historii poza repo; nie udziela aktywnej zgody na send. Przed migracją spójny lokalny backup SQLite, test odtworzenia bez aktywnej sesji/zgód. Push nie aktualizuje pracującego backendu. Aktualizacja po Stop, zakończeniu operacji i backupie; restart pozostaje zatrzymany. Bez hot reloadu, automatycznego pull/restartu lub zmian zasilania.

## Panel i testy

Dwa główne widoki: Praca programu i Historia firm. Materiały, połączenia i polityka w Ustawieniach. W LOCAL_ONLY: „Historia lokalna — na tym komputerze”, bez obowiązkowego origin i przycisku przekazywania. Development jest wyraźnie oznaczony. Gotowość obejmuje instalację/bazę/niepewne próby, aktualne materiały/CV/konto/zgody/politykę i Codexa. Zamknięcie karty nie zatrzymuje backendu. Historia zachowuje temat/treść, datę, kontakt i źródła. SELF_TEST poza licznikiem firm; stare dane bez usuwania.

Testy: automat bez akceptacji maili, GENERAL/polityka, unknown kontra fałszywe dopasowanie, zmiana profilu/CV/nadawcy, Stop/Pauza, niepewny send, tempo/limity/brak limitu, dostawcy, świeżość źródeł, deduplikacja i właściciel między urządzeniami, konflikty/przerwany eksport/brak sekretów oraz SELF_TEST. Po etapach npm run check; Windows zaliczamy wyłącznie po rzeczywistym uruchomieniu z opisem zakresu. Specyfikacja nie dowodzi wdrożenia: patrz docs/TASKS.md i docs/TEST_REPORT.md.
