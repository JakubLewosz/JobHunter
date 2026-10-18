# JobHunter — docelowy sposób pracy

**Bieżący etap Windows/Codex:** [implementacja nightflow](reviews/WINDOWS_NIGHTFLOW_IMPLEMENTATION.md).
Koordynator obsługuje odnowienie/research → kontrolę → zamkniętą partię → sender
→ raport przez jedno oczekujące wywołanie. Wsparcie wydania obejmuje Windows;
macOS odłożono. Syntetyczny przebieg i kod adaptera nie są wdrożeniem WORKSTATION
ani dowodem utrzymania rzeczywistego hosta przez całą noc.
Poniżej pozostawiono datowany kontekst wymagań sprzed tej implementacji.

**Aktualizacja 18.10.2026:** głównym wejściem jest rozmowa w aplikacji Codex.
Przy włączonym komputerze i Codexie jedno świadome polecenie ma docelowo prowadzić
przez około 8 h researchu, kontrolę i wysyłkę zgodnej zamkniętej partii, bez
osobnego porannego polecenia dla normalnych przejść i bez akceptacji każdego
maila. Najpierw odnawiamy dotychczasowe firmy i szkice, nowe firmy są teraz
niższym priorytetem. Materiały/nadawca/polityka/reguły wyboru przyszłej partii
oraz tempo/limity/okno wymagają wcześniejszej właściwej zgody.

To wymaganie do wdrożenia, nie opis gotowego całonocnego koordynatora.
[CODEX_OPERATION](CODEX_OPERATION.md) rozdziela obserwację, kod i braki.
Poniższy dawny model porannego panelu i preferencja z 16.10 są kontekstem
historycznym; nowe wymaganie nie zmienia samo istniejącego kodu lub zgód.

Ustalenia z 12 października 2026 zastępują obowiązkową synchronizację. Nadal obowiązuje automat bez akceptacji każdej wiadomości i ręczna obsługa odpowiedzi w Gmailu.

Jakub rano uruchamia program i klika **Start — szukaj i wysyłaj**. JobHunter szuka firm przede wszystkim z Polski, poznaje ich działalność, weryfikuje publiczny kontakt, dobiera zatwierdzony projekt i pisze naturalną polską wiadomość z CV. Kod sprawdza politykę i historię, wysyła zgodny pierwszy kontakt i przechodzi dalej. Nie wymaga potwierdzania każdej firmy/paczki. Pracuje do Stop, jawnego limitu lub problemu wymagającego reakcji. Odpowiedzi Jakub obsługuje sam w Gmailu.

Cel: płatna, regularna współpraca, w pełni zdalnie, około 20 godzin tygodniowo głównie po lekcjach. Brak wakatu/godzin/zdalności nie przekreśla zapytania do firmy o udokumentowanej działalności programistycznej; warunki pozostają unknown. ACTIVE, OPEN i PROSPECT są różnymi sytuacjami. Nie udajemy spełnienia niedopasowanej oferty i nie obchodzimy odmów lub wskazanego kanału aplikacji.

Fakty, projekty i CV zatwierdza się w konfiguracji i po istotnej zmianie. Nie zakładamy pamięci rozmów Codexa. Styl pozostaje w [MESSAGE_STYLE](MESSAGE_STYLE.md): prawdziwe nawiązanie, zwykle jeden projekt, dostępność i jedno pytanie. AI/Codex są naturalną częścią zatwierdzonego sposobu pracy, bez dopisywania eksperckości lub produkcji.

Polityka określa nadawcę, materiały, kontakty, zakres, tempo i opcjonalne limity. GENERAL może być dopuszczony do zapytania, zachowując rzeczywiste przeznaczenie. Brak limitu oznacza pracę ciągłą w określonym tempie. DEMO, RESEARCH_ONLY i ręczny APPROVAL_REQUIRED pozostają odrębne.

Osobny rodzaj pracy AUTO pozwala najpierw prowadzić research biblioteki bez
poczty, a później przygotować zamkniętą partię wskazanych wersji. Użytkownik
zatwierdza podsumowanie materiałów, odbiorców, nadawcy, zakresu i tempa, potem
używa Start. Partia kończy się po wyczerpaniu swojego składu; zwykły ciągły AUTO
zachowuje dotychczasowe działanie. Zapisane szkice nie oznaczają trwałej gotowości
do wysyłki. [Lokalna implementacja i granice weryfikacji](CORE_IMPLEMENTATION.md).

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

Obsługa przeglądarki jest warstwą wykonania działań. Adapter Gmail UI został
wdrożony i wybrany w głównej instalacji; wymaga aktywnego wykonawcy w Codexie.
Dwa osobno zatwierdzone SELF_TEST zostały potwierdzone w Wysłanych, a odbiorcy
zgłosili Odebrane i działające CV. Pilot do firm pozostaje osobnym etapem.
Ten wynik nie gwarantuje dalszej dostarczalności ani nie ustala przyczyny Spamu.
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

## Preferencja operacyjna z 16 października 2026

Użytkownik chce móc zbierać firmy i szkice nocą w RESEARCH_ONLY, a potem
osobnym poleceniem uruchamiać dzienną wysyłkę przygotowanej partii w ustalonym
zakresie i tempie. Wysyłka ponownie sprawdza źródła, historię, materiały i blokady.
Nie każdy zapisany szkic jest gotowy. Po udanym pilocie jedna jawna decyzja
o zakresie i tempie oraz Start może obejmować kolejne zgodne wiadomości, bez
indywidualnej akceptacji każdego maila. Osobna skończona partia i ciągłe
„szukaj i wysyłaj” powinny mieć wyraźnie różne granice. To kierunek dalszego
rozwoju; nie deklarować tej osobnej funkcji partii jako już ukończonej.
