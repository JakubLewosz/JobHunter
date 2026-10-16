# JobHunter — docelowy sposób pracy

Ustalenia z 12 października 2026 zastępują obowiązkową synchronizację. Nadal obowiązuje automat bez akceptacji każdej wiadomości i ręczna obsługa odpowiedzi w Gmailu.

Jakub rano uruchamia program i klika **Start — szukaj i wysyłaj**. JobHunter szuka firm przede wszystkim z Polski, poznaje ich działalność, weryfikuje publiczny kontakt, dobiera zatwierdzony projekt i pisze naturalną polską wiadomość z CV. Kod sprawdza politykę i historię, wysyła zgodny pierwszy kontakt i przechodzi dalej. Nie wymaga potwierdzania każdej firmy/paczki. Pracuje do Stop, jawnego limitu lub problemu wymagającego reakcji. Odpowiedzi Jakub obsługuje sam w Gmailu.

Cel: płatna, regularna współpraca, w pełni zdalnie, około 20 godzin tygodniowo głównie po lekcjach. Brak wakatu/godzin/zdalności nie przekreśla zapytania do firmy o udokumentowanej działalności programistycznej; warunki pozostają unknown. ACTIVE, OPEN i PROSPECT są różnymi sytuacjami. Nie udajemy spełnienia niedopasowanej oferty i nie obchodzimy odmów lub wskazanego kanału aplikacji.

Fakty, projekty i CV zatwierdza się w konfiguracji i po istotnej zmianie. Nie zakładamy pamięci rozmów Codexa. Styl pozostaje w [MESSAGE_STYLE](MESSAGE_STYLE.md): prawdziwe nawiązanie, zwykle jeden projekt, dostępność i jedno pytanie. AI/Codex są naturalną częścią zatwierdzonego sposobu pracy, bez dopisywania eksperckości lub produkcji.

Polityka określa nadawcę, materiały, kontakty, zakres, tempo i opcjonalne limity. GENERAL może być dopuszczony do zapytania, zachowując rzeczywiste przeznaczenie. Brak limitu oznacza pracę ciągłą w określonym tempie. DEMO, RESEARCH_ONLY i ręczny APPROVAL_REQUIRED pozostają odrębne.

Przy świadomie wybranej nowej kampanii można dopuścić jeden kontakt po dawnych ręcznych zgłoszeniach. Nie przepisujemy historii jako pustej: zachowujemy zapisany, nieodnawiany początek tej kampanii i wszystkie istniejące rekordy. Każda nowa wysyłka JobHuntera blokuje kolejne wiadomości do firmy także po restarcie i zmianie dnia. Fingoweb, odmowy kontaktu i niepewne próby pozostają blokujące. Zatwierdzenie tego wyjątku nie jest Start ani zgodą na wysyłkę.

Kod można rozwijać na Windowsie i MacBooku. Prawdziwy research i poczta pracują tylko na domowym Windowsie, ze świadomie skonfigurowaną instalacją i jedną trwałą lokalną historią poza repo. LOCAL_ONLY nie wymaga prywatnego origin lub handoff. MacBook jest developerski: osobne dane syntetyczne i brak natywnego Gmaila. Prywatny Git pozostaje opcjonalnym, odłożonym kierunkiem. Stop odwołuje zgodę sesji; restart nie wznawia sendera. Push kodu nie jest deploymentem, aktualizacja odbywa się po Stop i backupie.

Dwa główne widoki: Praca programu i Historia firm. Materiały, połączenia i polityka w Ustawieniach. Bieżący zakres pozostaje bez CRM, AI do odpowiedzi, follow-upów, kalendarza, LinkedIn, Useme i formularzy. Nowe źródła są późniejszym rozszerzeniem istniejących adapterów.

Wdrożenie i granice weryfikacji: [TASKS](TASKS.md), [TEST_REPORT](TEST_REPORT.md), [SECURITY](SECURITY.md). Prośba o rozwój nie zleca rzeczywistych wysyłek ani publikacji prywatnej historii. Sesja wymaga konfiguracji i świadomego Start użytkownika.

## Przyszłe rozszerzenie wskazane 16 października 2026

Użytkownik chce w przyszłości aplikować na konkretne oferty przez portale
pracy (np. Pracuj.pl) oraz wyszukiwać firmy z potencjalną potrzebą strony
internetowej lub automatyzacji. Formularze stają się planowanym późniejszym
rozszerzeniem, nie częścią obecnie uruchamianego zakresu. Nie wdrożono ich
i nie sprawdzono jeszcze integracji konkretnego portalu.

Obsługa przeglądarki jest rozwijaną warstwą wykonania działań. Pierwszy
adapter Gmail UI dodano do kodu i próby fikcyjnej; wymaga aktywnego wykonawcy
w Codexie i nie został włączony w głównej instalacji. Faktyczna wysyłka
przeglądarkowa i jej dostarczalność pozostają do osobnego SELF_TEST/pilotażu.
Opis i ograniczenia: [GMAIL_BROWSER](GMAIL_BROWSER.md). Kod JobHuntera
nadal odpowiada za kwalifikację, zatwierdzone fakty i odpowiedzi, niezmienne
CV, politykę, tempo, wspólną historię, blokady i Stop. Oddzielamy aplikację
na ofertę, zapytanie o współpracę oraz propozycję wykonania usługi. Hipoteza
potrzeby strony/automatyzacji nie jest deklaracją zainteresowania firmy.
Nie zmieniamy automatycznie istniejących szkiców lub celu kampanii.

Rozwój etapami: poczta i pilot, potem jeden adapter ofert/formularzy,
następnie wyszukiwanie potencjalnych zleceń usługowych. Docelowo konfiguracja
i świadomy Start mogą obejmować automatyczne zgodne działania bez przeglądu
każdego z nich. Nieznane odpowiedzi formularza i niepewne złożenie wymagają
wyjaśnienia; zmiana kanału nie obchodzi historii, odmów lub niepewnej próby.
