# Rzeczywiste SELF_TEST Gmail UI — Windows, 16 października 2026

Po osobnym zatwierdzeniu dokładnego podglądu wykonano **dwie wysyłki przez
Gmail w przeglądarce** z istniejącego konta. Każda ma ACKNOWLEDGED z UI i
**SENT_CONFIRMED** po celowanym sprawdzeniu własnego ID, nadawcy, odbiorcy,
tematu, czasu, SENT, pełnej treści/linku i bajtów PDF. Użytkownik potwierdził
**2/2 Odebrane i 2/2 poprawnie otwierane CV**. Nie gwarantuje to folderów
przy innych odbiorcach lub przyszłych wiadomościach.

W rzeczywistym środowisku wykonawcy wykryto brak globalnego `process`.
Klient IPC używa teraz `node:os.platform()` bez zmiany dozwolonych ścieżek.
Regresja odtwarza realm bez `process`; wcześniejsza wersja nie wykonuje
żadnego żądania IPC, poprawiona wykonuje jedno uwierzytelnione żądanie.
Pełny Windows check tej poprawki: **543 backend, 12 performance, 19 UI,
typecheck/build PASS**. W przygotowaniu przed poprawką nie rezerwowano próby.

Pierwszy faktycznie przyjęty mail pozostawiono w SENT_PROVIDER, ponieważ
odczyt przez znany ID zwracał tylko metadane. Sender zatrzymał drugą próbę.
RAW pobrany wyłącznie dla dokładnego własnego ID potwierdził zgodność
tekstu, HTML/linku i PDF. Poprawiono żądanie RAW dla receipt UI, po weryfikacji
konta, odbiorcy, SENT i przedziału czasu. Zachowano domyślną ścieżkę metadanych
API, limity RAW i ścisłe porównanie payloadu; żadnej kontroli nie osłabiono.
Pierwszą próbę uzgodniono **bez ponownej wysyłki**, następnie drugi mail
został nadany i potwierdzony. Celowane **93/93 PASS**, typecheck/build PASS;
pełny końcowy check po tej poprawce na Windowsie: **550/550 backend,
12/12 performance, 19/19 UI, typecheck/build PASS**.

Końcowy niezależny audyt readonly: **52 tabele, integralność OK, FK=0,
changedOldRows=[], unexpectedStateKeys=[]**, wszystkie tabele zgodne
ze spójnym backupem po nadaniu. Migracja 020 była addytywna, 51 → 52 tabel.
Profil v4/9 zatwierdzonych faktów, CV i jego plik/hash, szkice/wersje, firmy,
kontakty, historia, granica kampanii, aliasy, blokady i shared zachowane.
Sześć starych prób/liczników pozostało bez zmian; dopisano dwa SELF_TEST.
Końcowo RESEARCH_ONLY, stopped=true, senderPaused=true, brak aktywnych
runów/zadań i nierozstrzygnięć. Brak wysyłki do firm, AUTO_POLICY, nowego OAuth
lub publicznego researchu. Odczyt poczty objął wyłącznie własne zatwierdzone
próby; bez historii firm i wiadomości przychodzących. Rzeczywistego macOS
nie uruchamiano. Wiadomości, adresy, dowody i raport pozostają poza Git.

# Pierwszy transport Gmail UI — Windows, 16 października 2026

Opcjonalny GMAIL_BROWSER dodano do istniejącego sendera: te same rezerwacje,
historia, blokady i bramki. Osobny broker named pipe, wykonawca aktywnej sesji
narzędzia przeglądarki Codexa oraz jawny wybór transportu w ustawieniach.
Bez cookie, tokenu panelu/Codexa, sekretów OAuth, CDP lub osłabienia runnera
researchu. Nowa tabela 020 zachowuje stare dane i standardowy backup.

Pierwszy pełny `npm run check`: **typecheck PASS, 542/542 backend,
12/12 performance, build PASS, 19/19 UI**. Następnie uzupełniono ochronę
utrwalonego SEND_UNKNOWN podczas sprzątania oraz porównanie całej treści
HTML, bez parsera stron pomijającego stopki. Celowane **10/10 PASS** obejmuje
kontroler/SQLite/IPC, dokładne pola i CV, Stop, restart, pojedyncze kliknięcie,
brak retry/API POST w ścieżce UI, brak własnego dowodu, ustawienia i AUTO
bez indywidualnego przeglądu zgodnych maili. Odrzucono dodatkową stopkę,
ukryty tekst, obraz, podmieniony href przy tej samej etykiecie i drugi załącznik.
Końcowy pełny check po uzupełnieniu kontroli HTML: **typecheck/build PASS,
542/542 backend, 12/12 performance, 19/19 UI**. Następnie rozszerzono test
migracji o utrwalony niepusty MIME/próbę i skrócono ścieżkę socketu Unix
dla fikcyjnych testów na innych systemach: ponowne **10/10 + typecheck PASS**
na Windowsie. Rzeczywistego uruchomienia macOS nie wykonano.

Użytkownik ręcznie zalogował się do Gmaila w przeglądarce Codexa. W faktycznym
UI adapter przygotował fikcyjny szkic .test z fikcyjnym plikiem PDF. Nadawca,
Do/DW/UDW, temat, pełny tekst, zakończenie uploadu i identyfikator okna przeszły
obserwację/schemat. **Nie kliknięto Wyślij w prawdziwym Gmailu**. Wysyłkę,
awarie i receipt testowano na imitacji UI z przechwyconą całą siecią oraz
fikcyjnych providerach, bez rzeczywistej poczty.

Niezależny audyt readonly głównej bazy i spójnego backupu: **51 tabel,
integrity=ok, FK=0, changedTables=[]**, zgodne hashe wszystkich dawnych
wartości oraz PDF. Produkcyjnej migracji/transportu nie uruchomiono; profil,
9 faktów, CV, szkice/wersje, historia, aliasy, blokady, shared i dawne próby
pozostały bez zmian. Prywatne raporty i screenshot poza Git.

Granice: wykonawca wymaga aktywnej sesji Codexa, a potwierdzenie nadal używa
celowanego odczytu API w zakresie zgody. Nie sprawdzono prawdziwego receipt
po wysyłce UI, identyfikatora wiadomości ani dostarczalności/folderu. EML
jest materiałem odniesienia; MIME tworzy Gmail. Bez exactly-once, retry lub
failover. SELF_TEST i pilot wymagają osobnego zlecenia/podglądu; nie
uruchomiono kampanii, AUTO_POLICY lub nowego publicznego researchu.
Opis: [GMAIL_BROWSER](GMAIL_BROWSER.md).

# Analiza wariantów transportu Gmail — Windows, 16 października 2026

Poniżej zapis wcześniejszej analizy, poprzedzającej powyższy etap wdrożenia.

Przegląd kodu i oficjalnej dokumentacji, bez sterowania zalogowaną skrzynką.
Natywny runner researchu wyłącza Computer/Browser Use; transport przez GUI
nie jest gotowym zamiennikiem pojedynczej funkcji. Wymaga mostu tej samej
kolejki, rozróżnienia oczekiwanej treści i zaobserwowanego MIME, dowodu
wyniku oraz zachowania Stop/SEND_UNKNOWN/historii. Rozważono wariant GUI
nadawania z celowanym odczytem przez API oraz wariant całkowicie bez API.
Wybór nie zmienia obecnego trybu, zatwierdzeń ani zasad AUTO_POLICY.

Jedna nowa próba konstrukcji MIME na fikcyjnych danych .test: dwa lokalne
warianty Message-ID, obecny .local i domyślny mechanizm zainstalowanego
Nodemailera z domeną From. **PASS: pełne zdekodowane tekst/HTML/PDF i temat
identyczne**; obecny walidator odrzuca alternatywny ID. Brak sieci, sekretów,
prawdziwego CV lub bazy; nie testowano dostarczalności. Nie zmieniono kodu
aplikacji/builda ani zależności. Wcześniejsze 12/12 testów transportu pozostaje
oddzielnym uruchomieniem, bez nowego pełnego checka w tym etapie.

Wynik: opcjonalne nadawanie przez przeglądarkę jest uzasadnionym kierunkiem
pilotażu; gotowości lokalnej sesji Gmail i poprawy Spamu nie zweryfikowano.
Plan poza Git obejmuje fikcyjne testy wykonawcy, zachowanie starej historii,
a dopiero potem osobno zlecony SELF_TEST i pilot. Wdrożenia nie wykonano.
Zero odczytu poczty, tokenu panelu/Codexa, keyring/OAuth, bazy produkcyjnej,
wysyłek, zmian historii/liczników/blokad lub uruchomienia AUTO_POLICY.

# Audyt MIME przed nadaniem i transportu — Windows, 16 października 2026

Bez kolejnych wysyłek prześledzono tworzenie MIME, zamrożony pakiet podglądu,
gateway i wywołanie Gmail API. Zachowany oryginał pasuje hashem do zapisu
jednej próby SENT_CONFIRMED; metadane odpowiadają kopii odbiorczej. Brak
odczytu bazy/skrzynki/sekretów lub uruchomienia natywnego transportu.

Oryginał ma Message-ID w domenie .local; kopia odbiorcza w mail.gmail.com.
Subject oryginału **48/52/25**, w odbiorczej **84/28**. Przekroczenie limitu
encoded-word nie występuje w oryginale. Plain **850 -> 860 B**: osiem spacji
zastąpionych CRLF i końcowy CRLF; HTML **942 -> 944 B**, końcowy CRLF.
PDF identyczny. To jawne różnice, także po normalizacji samych CRLF;
diagnostyka zmian białych znaków nie osłabia kontroli reconcile.
Bez pośredniej kopii Wysłanych nie wskazujemy dokładnego etapu transformacji.

**12/12 celowanych testów offline PASS na Windowsie**: MIME polskie/długie
tematy, tekst/HTML/PDF, błędne wejścia i audytor CLI; adapter używa dokładnie
przygotowanych bajtów w JSON raw/base64url, pojedynczego POST do właściwego
endpointu, bez retry po błędzie/timeout. Fikcyjni odbiorcy i transport;
to nie test klasyfikacji spamu. Pełnego checka nie powtarzano, kod/build
aplikacji bez zmian. Zgodność z dokumentowanym wywołaniem API nie gwarantuje
Odebranych. Wyniki i prywatny audyt przed/po poza Git.

Składnia i zachowanie adaptera nie ujawniły w tym zakresie błędu tłumaczącego
Spam. Własny Message-ID i droga nadania pozostają punktami diagnostyki;
zgodne kopie odbiorcze nie wykluczają wpływu formatu wejściowego. Nie uznawać
.local za potwierdzoną przyczynę ani spekulacyjnej zmiany za naprawę.
Bez zmian OAuth, materiałów, historii, liczników, blokad i ustawień wysyłki.

# Porównanie trzech odbiorczych EML — Windows, 16 października 2026

Offline: jeden test programu zgłoszony jako Spam oraz dwa ręczne Odebrane,
od tego samego nadawcy do trzech różnych odbiorców. Brak wcześniejszego
kontaktu jest deklaracją użytkownika, nie wnioskiem z EML. Jeden pozytywny
odbiorca ma domenę szkolną obsługiwaną przez Google; bez odczytu jego reguł.

Natywny `scripts/audit-eml.ts --private` i niezależny Python 3.12 `email`:
**PASS porównania trzech plików**. Pełne zdekodowane bajty text/plain
**860 B**, text/html **944 B**, PDF **77338 B** i nazwa PDF są identyczne,
także bez normalizacji białych znaków. PDF ma hash wcześniej zatwierdzonego
CV; nie sprawdzano otwarcia u odbiorcy. From i Subject identyczne. Jedyny
link portfolio i brak obrazków/skryptów/formularzy we wszystkich trzech.
Hashe źródeł zgodne w obu kontrolach; oryginały bez zmian.

Według Authentication-Results serwera odbiorcy **SPF/DKIM/DMARC/ARC PASS**
we wszystkich; obliczony body hash DKIM zgodny, bez nowej kryptograficznej
weryfikacji podpisu/DNS. Ten sam publiczny IP Google i domena końcowych
Message-ID. Tylko wiadomość programu ma dwa dodatkowe Received przez Gmail
API. To różnica ścieżki, nie dowód wpływu na Spam; różnią się także odbiorcy
i czas. Dodatkowy DARA FAIL dotyczy jednej wiadomości Odebrane, bez ustalonej
roli. Nie znaleziono nagłówka etykiety, oceny spamu lub przyczyny filtra.

Wspólne zastrzeżenie: encoded-word tematu **84/28**, pierwsze przekracza
limit RFC 2047. Występuje we wszystkich trzech, więc nie rozróżnia wyników;
nie ustalono etapu jego utworzenia z samych kopii odbiorczych. Parsery
przetworzyły strukturę, Python defects=[] i bare LF=0; to nie deklaracja
pełnej zgodności RFC. Brak wykazanego błędu kodu wyjaśniającego Spam.

Uzupełnienie z relacji użytkownika: Gmail uzasadnia Spam podobieństwem
do wiadomości wykrytych przez filtr. Komunikat nie wskazuje konkretnego
składnika ani przyczyny różnicy między metodami. Prywatny raport uzupełniony,
bez bezpośredniego odczytu skrzynki lub interfejsu. Przyczyna i rozwiązanie
nadal nieustalone; nie uznawać wieku konta lub samego API za dowód.
Ewentualny test porównawczy wymaga osobnego uzgodnienia, bez nowego send.
Prywatny pełny raport i dane poza Git. Zero odczytu skrzynki,
OAuth/sekretów, bazy, zmian kodu/builda, ustawień, materiałów, historii,
liczników lub wysyłek. Brak nowego pełnego checka — tylko audyt offline
i kontrola diffu dokumentacji, nie nowy wynik testów aplikacji.

# Zamknięcie stylu: forma kontaktu i ograniczenia faktów — Windows, 16 października 2026

Korekta wyłącznie instrukcji generatora i doprecyzowanie kontroli semantycznej.
Pierwszy kontakt domyślnie używa „Państwo”; swobodniejsza forma potrzebuje
wyraźnej podstawy w oficjalnym sposobie komunikacji firmy. Bez mieszania
i kopiowania tonu recent/template bez dowodu. Status prototypu z praktyk
pozostaje ograniczeniem prawdziwości; precyzyjny opis nie wymaga dopisku
o braku oficjalnego statusu. Nie osłabiono kontroli produkcji/kompetencji.
Opis wykonanej pracy zastępuje ocenianie za odbiorcę przydatności kandydata.
Bez zmiany schematu, architektury, automatycznej podmiany fraz lub starych
wiadomości. Późniejsze korekty nadal wymagają wersji i kontroli treści.

Celowane **90/90 PASS**: zasady dla trzech rodzajów kontaktu, brak dziedziczenia
tonu poprzednich wiadomości, zachowanie faktów/zastrzeżeń w danych kontrolnych
bez wymuszania ich w treści, niezmienność wejść. Istniejące kontrole i test
wersjonowania końcowej treści nadal przechodzą.

Jedna mała próba rzeczywistego CLI: **trzy pierwsze surowe generacje**, w pełni
fikcyjny profil i firmy .test. Bez użycia produkcyjnego profilu w generowaniu,
edycji lub ponawiania dla lepszego stylu. Wszystkie trzy używają „Państwo”,
bez mieszania, zbędnych zaprzeczeń lub oceny przydatności. Kod PASS,
supported=true/issues=[]. Jedno źródło jawnie dopuszczało swobodniejszą formę,
lecz model pozostał przy „Państwo”; próba nie potwierdza użycia „Wy”. Osobna
negatywna kontrola dopisała fałszywy oficjalny status i produkcję do kopii
fikcyjnego materiału: supported=false z uzasadnieniem, bez zmiany surowych
wyników. Łącznie 3 DRAFT + 4 SEMANTIC_REVIEW, search=false, zero publicznego
researchu/Gmaila/wysyłki. Surowe teksty i pełne dane kontroli poza Git.

Windows: typecheck i **532/532 backend PASS**. Pełny `npm run check` zatrzymał
się na performance **11/12**: drugi pomiar large-history odebrał żądanie Stop
po **1014,78 ms**, przy wymaganiu <1000 ms. Jedna powtórka niezmienionej grupy
również **11/12**, **1013,25 ms**. Po odebraniu cofnięcie uprawnienia trwało
około 0,33/0,25 ms; kontrole braku nowego POST po odwołaniu prawa przeszły.
Nie zmieniono progów, kodu Stop ani ustawień systemu. Bez ponawiania w pętli.

Kontrola porównawcza: odizolowany checkout poprzedniego SHA
`5acee94d6dab5ed3135a672b4770fa257a7f91ae`, te same zależności, trzy testy
large-history bez równoległego builda. Wynik **2/3**, ten sam drugi pomiar
**1005,97 ms**. Błąd występuje także bez tej poprawki. Przyczyny nie ustalono;
nie przypisujemy jej na pewno środowisku. Następnie osobno **build i 15/15 UI
PASS**. Nie był to pełny check zakończony PASS. Pełne logi i metryki poza Git;
rozstrzygnięcie wyniku Stop zapisane jako punkt gotowości przed pilotażem.

Końcowy audyt readonly: **51 tabel bez zmian**, integrity=ok/FK=0, spójne
backupy przed/po i fingerprint 206 plików. Zatwierdzony profil v4/9 faktów,
CV/PDF/hash i zapisany wzór bez zmian. Zachowane 472 rekordy firm, 376
kontaktów, 221 szkiców/254 wersje, historia/granica, Fingoweb/ARHAT/aliasy/
blokady, 6 prób/outbox/liczników i shared 0/0. Dane fikcyjne nie trafiły do
głównej bazy; RESEARCH_ONLY zatrzymany, zero prawdziwego Gmaila, publicznego
researchu, wysyłki i AUTO_POLICY. Prace stylistyczne zamknięte; następny etap
to rzeczywisty pilotaż po rozstrzygnięciu wskazanego punktu gotowości.

# Naturalność pierwszego wyniku — Windows, 16 października 2026

Mała korekta instrukcji generowania, bez zmian modeli danych, CV, profilu,
historycznych szkiców i ustawień wysyłki. Dwa priorytety redakcyjne wymuszały
wczesne łączenie prośby z profilem/dostępnością, co sprzyjało długim pytaniom.
Skrótowe opisy faktów przenikały do zdań; kontrola faktów nie gwarantuje
poprawności języka. Usunięto tę presję i dodano odczyt całego listu przed
pierwszym wynikiem: gramatyka, sens działania, krótkie pytanie i odwołania
claims zgodne z końcową treścią. Bez listy podmian, dodatkowego automatycznego
przepisywania lub wymuszania odmiennej konstrukcji każdego listu.

Celowane testy **88/88 PASS**. Istniejący test regeneracji sprawdza teraz
osobną wersję, nienaruszoną starą historię oraz dokładną zgodność wyniku
z zapisem, wersją, zamrożonym materiałem i wejściem review. Kontrole kodu
i semantyki dotyczą tego samego końcowego tekstu; brak nowych prób wysyłki.

Cztery rzeczywiste pierwsze generacje CLI na fikcyjnych źródłach .test:
ACTIVE/OPEN/GENERAL/GENERAL, trzy zatwierdzone projekty, **93/95/82/91 słów**.
Kod PASS i supported=true/issues=[] dla czterech surowych tekstów. Bez
ręcznej redakcji, podmian i generowania kolejnych wariantów do wyboru.
Otwarcie ofertą, historia projektu z praktyk oraz zapytania z kontekstu
działalności są uzasadnione sytuacją. Dwa zbliżone zapytania mają podobny
układ i zakończenie; to dopuszczalne podobieństwo, nie dowód błędu. Próbka
nie gwarantuje jakości wszystkich przyszłych tekstów; PASS faktów pozostaje
odrębny od oceny języka. Pełne surowe teksty i dane kontroli poza Git.

Pełny nieprzerwany **npm run check na Windowsie: typecheck PASS, 530/530
backend, 12/12 performance, build PASS, 15/15 UI**. Źródła i testy nie zmieniły
się podczas checka; końcowy fingerprint obejmuje 206 plików źródeł/builda.

Niezależny audyt readonly: **51 tabel bez zmian**, integrity=ok/FK=0, spójne
backupy przed/po. Zachowane 472 rekordy firm, 376 kontaktów, 221 szkiców,
254 wersje, profil v4/9 faktów, zatwierdzony PDF/hash i zapisany wzór,
historia/granica kampanii, Fingoweb, ARHAT, aliasy i blokady. Próby/outbox/
liczniki **6/6/6**, shared **0/0** bez zmian. Fikcyjne dane nie trafiły do
głównej bazy. Bez Gmaila, sekretów, tokenu panelu, publicznego researchu,
wysyłki i Start; RESEARCH_ONLY zatrzymany. Prywatny raport z pełnymi surowymi
tekstami i wynikami kontroli zapisany poza Git.

# Konstrukcja z kontekstu — Windows, 16 października 2026

Na jawne zlecenie usunięto stałe pierwsze zdanie i cztery części. Kod wyznacza
cel redakcyjny z rodzaju kontaktu i zweryfikowanych warunków, również różny
w tym samym rodzaju kontaktu po potwierdzeniu godzin. To priorytet decyzji
odbiorcy, bez gotowych zdań, losowych wariantów i zmiany uprawnień. Generator
otrzymuje też dalsze akapity trzech poprzednich szkiców. Nowe ostrzeżenie
REPEATED_REQUEST obejmuje kilka próśb zakończonych kropką, nie karze samego
opisu celu kandydata i nie wymaga pytania końcowego. Celowane testy 48/48 PASS.

Sześć rzeczywistych generacji modelu na fikcyjnych firmach i adresach .test:
po dwie ACTIVE/OPEN/PROSPECT i po dwa wybory trzech zatwierdzonych projektów.
Natywne kontrole kodu i semantyki bez uwag. Cztery minimalne korekty językowe
podglądów ponownie zweryfikowano, z zamrożoną treścią i nowymi odwołaniami;
surowe wyniki zachowane osobno. Nie zmieniano ręcznie konstrukcji. Otwarta
kandydatura ze znanymi warunkami nie ma zbędnego pytania; zapytania bez naboru
nie udają odpowiedzi na ofertę. Ocena konstrukcji jest ostrożna: funkcje
otwarć i miejsce prośby wynikają z kontekstu, lecz bliskie sytuacje dają
zbliżone listy. To nie sześć całkowicie niezależnych toków ani gwarancja
jakości przyszłych generacji. Surowe drobne usterki języka i poprawki są
ujawnione w prywatnym raporcie; PASS faktów nie oznacza braku uwag językowych.

Windows `npm run check`: typecheck PASS, backend **529/530**; jedna stara
asercja oczekiwała dosłownego zdania ze starego promptu. Zastąpiono ją
sprawdzeniem, że brak dowodów usuwa wszystkie projekty także z danych
przekazanych generatorowi. Ponowiona cała grupa research **40/40 PASS**,
finalna asercja 1/1. Następnie ukończono **12/12 performance, build i 15/15 UI
PASS**. Kod aplikacji/generatora nie zmienił się podczas korekty testu;
jedyna zmiana pliku testowego jest osobno udokumentowana. Nie był to jeden
nieprzerwany pełny check zakończony PASS. Trzy wcześniejsze checki przerwano
przy dopracowywaniu konstrukcji, bez zaliczania ich jako ukończone.

Audyt readonly względem spójnego backupu: **51 tabel bez zmian**, integrity=ok,
FK=0. Biblioteka **472/376/221, 254 wersje** zachowana; profil v4, 9 faktów,
PDF/hash, zatwierdzony zapisany wzór, historia/granica, aliasy i blokady bez
zmian. Próby/outbox/liczniki **6/6/6**, shared **0/0** bez zmian. Spójny backup
końcowy i fingerprint 206 plików kodu/builda. Fikcyjne dane nie trafiły do
głównej bazy. Bez Gmaila, skrzynki, sekretów OAuth, tokenu panelu, publicznego
researchu, Start i wysyłek; RESEARCH_ONLY zatrzymany. Pełny prywatny raport
z wiadomościami, pierwotnymi wynikami i oceną podobieństw zapisany poza Git.

# Prostszy wzór wskazany przez użytkownika — Windows, 16 października 2026

Na jawne życzenie zmieniono domyślny wzór i instrukcję nowych generacji:
proste zapytanie → edukacja i dostępność razem → fakt o firmie i jeden projekt
→ krótkie zakończenie. Bez wymuszonego „Nazywam się…” i osobnego powtarzania
godzin. Prawdziwość, wybór projektu, rodzaj kontaktu i uprawnienia bez zmian.
Technologia firmy nadal nie jest kompetencją kandydata; akceptacja formy umowy
wymaga faktu kandydata, a nie samej oferty. Stare szkice nie są przepisywane.

Celowane **38/38** testów stylu PASS, w tym poprawny nowy układ i oddzielenie
technologii firmy od deklaracji kandydata. Dwa rzeczywiste podglądy CLI na
fikcyjnych firmach/odbiorcach: **78/86 słów**, różne właściwe projekty, brak
uwag kodu i supported=true/issues=[]. Jeden podgląd używa poprzedniego
zapisanego domyślnego wzoru; aktualna instrukcja nadal daje prosty układ.
Wyłącznie odczyt zatwierdzonych faktów; żadnych zapisów fikcyjnych firm do
głównej bazy, Gmaila, researchu lub wysyłki. Podglądy i raport poza Git.

Końcowy pełny **npm run check na Windowsie: 520/520 backend, 12/12 performance,
15/15 UI, typecheck/build PASS**. UI potwierdza nowy domyślny wzór w materiałach.
Przed końcowym uruchomieniem przerwano dwa wstępne checki przy dostosowywaniu
asercji dawnego wzoru i zachowaniu zgodności rozpoznawania etapu DRAFT przez
fixture; ich logi zachowano. Powyższy PASS dotyczy finalnego ukończonego checka.

Spójny backup SQLite przed pracą, końcowy audyt readonly wszystkich 51 tabel
bez różnic. Baza **472/376/221**, **254 wersje** zachowane; zatwierdzony profil
v4, 9 faktów, PDF/hash, historia/granica, blokady i aliasy bez zmian. Sześć
SELF_TEST/outbox/liczników i shared 0/0 zachowane. Nie nadpisano zatwierdzonego
pola wzoru ani materiałów w żywej bazie; nowe instrukcje stylu działają także
z poprzednim domyślnym wzorem. Nowy fingerprint kodu/builda zapisany prywatnie;
dawne fingerprinty sesji są historyczne. Brak świadomego Start i rzeczywistej
kampanii, RESEARCH_ONLY pozostaje zatrzymany.

# Dwie minimalne korekty szkiców — Windows, 16 października 2026

Na jawne zlecenie użytkownika ponownie odczytano 10 oficjalnych publicznych
źródeł natywnym readerem: READ, Node --use-system-ca. Niejednoznaczny wakat
zastąpiono zapytaniem PROSPECT/active=unknown, z aktualnym literalnym dowodem
własnej działalności firmy. W drugim szkicu usunięto jedno zdanie deklarujące
akceptację formy umowy, której zatwierdzony profil nie określa. Pozostałe
zdania oraz odbiorcy zachowane; nie rozszerzano kompetencji kandydata.

Pierwszy krok zatrzymała natywna kwalifikacja niepełnej podstawy zapytania:
bez zmiany szkiców lub wcześniejszych ocen. Zachowano wynik i backup; następnie
znaleziono jednoznaczny opis działalności w oficjalnej polskiej wersji strony.
Natywny resolver i literalna walidacja dopuściły ten dowód. Bez zmian kodu,
osłabienia reguł lub ponawiania negatywnego/niepewnego review dla tego samego
tekstu. Osobny backup przed dokończeniem; dawne wyniki zachowane.

Dwa ograniczone runIds: 2 DRAFT i 2 SEMANTIC_REVIEW przez rzeczywisty CLI
(0.162.0-alpha.17.2, auth ChatGPT), wszystkie OK. Model opracował odwołania
do faktów/dowodów dla dokładnych minimalnych korekt, kod sprawdził zakres
tekstu, tożsamość firmy, niezmienność odbiorcy, walidację deklaracji i kontrolę
materiałów. Obie wersje 2: PASS/COMPLETED/supported=true/issues=[], bieżące
materialIssues=[]. NEEDS_REVIEW; bez zatwierdzenia lub uprawnienia do wysyłki.
Warunki, których źródła nie potwierdzają, pozostają niepotwierdzone.

Końcowy niezależny audyt readonly względem pierwszego backupu: wszystkie
pierwotne ID, 252 stare wersje i materiały kontroli zachowane. Stare oferty
i kwalifikacje bez zmian, pozostałe szkice i kontakty bez zmian. Chronione
tabele/stan, materiały v4/9 faktów/PDF/hash, historia/granica, blokady i aliasy
zachowane. Baza **472/376/221**, wersje **252 → 254**. Próby/outbox/liczniki
**6/6/6**, shared **0/0** bez zmian; zero Gmaila i wysyłek. Backupy zgodne
ze stanami 51 tabel, integrity=ok/FK=0. Kod/build 206 plików bez zmian;
to kontrola dwóch rzeczywistych operacji na danych, bez nowego pełnego
npm run check lub sesji poszukiwania firm. RESEARCH_ONLY stopped/paused/
senderPaused=true, aktywne run/job=0, lock zwolniony. Pełny prywatny raport
z dokładnymi wiadomościami, źródłami i dawnymi wersjami poza Git.

# Katalog całej biblioteki — Windows, 16 października 2026

Audyt readonly **472 rekordów firm / 376 kontaktów / 221 szkiców / 252 wersji**.
Użyto natywnych metod kontroli powiązań materiałów i historii oraz czystego
walidatora analizy/przeznaczenia, przez adapter readonly bez konstruktora
Store/service lub providerów. Bez pobierania stron, skrzynki, tokenu panelu,
sekretów lub OAuth. Bieżące kontrole: 155 szkiców dodatnich, 63 niewstrzymane
do odświeżenia, 2 zastrzeżenia; 1 dodatkowy szkic do odświeżenia pozostaje
wśród 3 wstrzymanych firm. Pozostałe 249 niewstrzymanych firm bez szkicu:
99 bez kontaktu, 48 z niedopuszczonym/niepotwierdzonym kontaktem, 93 bez
potwierdzonej podstawy/zgodności, 9 z analizą do odświeżenia. Żadna z nich
nie przeszła kompletu bieżących warunków przygotowania szkicu w tym audycie.
Stan na **17:27 Europe/Warsaw**, aktualność źródeł 24 h. Dodatnia kontrola
materiałów nie stanowi zgody na wysyłkę ani potwierdzenia warunków pracy.

Brak kolizji kluczy nazw/domen, kontaktu w firmie, szkicu w kampanii i aliasów.
Jeden wspólny mailbox dotyczy wcześniej rozstrzygniętego archiwalnego aliasu.
Wskazano 3 grupy relacji nazw/domen do sprawdzenia (4 istniejące rekordy),
w tym nowy sygnał podobieństwa nazw po pominięciu formy prawnej. To sygnał
przeglądu, nie dowód tożsamości. Bez automatycznego łączenia lub kasowania.
42 ostatnie wpisy dla URL bez ustalonego company_id pozostają osobnym
wykazem; oznaczono znane aliasy, nie doliczano ich do firm. 2 zapisane
znaczniki niedokończonej analizy nie są działającymi procesami.

Spójny backup SQLite i 51 hashy tabel identycznych z bazą; integrity=ok/FK=0.
Wszystkie 51 tabel głównej bazy bez zmian po eksporcie. Zatwierdzone materiały
v4/9 faktów/PDF/hash, historia i granica kampanii, stare wersje, blokady,
aliasy, 6 SELF_TEST/outbox/liczników oraz shared zachowane. RESEARCH_ONLY
stopped/paused/senderPaused, brak aktywnych run/job. 206 plików kodu/builda
zgodnych z wcześniejszym fingerprintem. Nie zmieniano aplikacji; nie
przypisuje się temu etapowi nowego pełnego npm run check. Prywatne TXT/JSON
i interaktywny katalog poza Git; dane firm i wiadomości nie są w dokumentacji.

Rzeczywisty Playwright na Windows: filtry grup i przeznaczenia kontaktu,
wyszukiwanie nazwy/literalnego emaila, paginacja, brak wyników oraz pokazanie
zastrzeżeń treści i blokady PASS. Wyświetlona wiadomość identyczna z zapisanym
tekstem; wszystkie 221 bieżących treści obecne w eksporcie. Układ 900/360 px,
jasny/ciemny, bez poziomego przepełnienia; podglądy obejrzane, wąska tabela
układa informacje w jednym polu. Brak pageerror. Działanie sprawdzone przy
zablokowanych zewnętrznych żądaniach bibliotek opakowania podglądu; sam katalog
nie wywołuje sieci ani API. Kontrole dotyczą prywatnego katalogu, nie nowej
próby aplikacji, researchu lub dostarczalności poczty.

# Pojedynczy rzeczywisty SELF_TEST — Windows, 16 października 2026

Jawne zlecenie użytkownika obejmowało jedną wiadomość bez kolejnego pytania
o zgodę. Zachowano normalne kontrole programu: aktualny natywny podgląd,
nadawca/odbiorca/temat/cała treść, brak CC/BCC i dokładne bajty zatwierdzonego
PDF zgodne z dotychczasowym testem. Jeden POST dla jednej rezerwacji;
**16:53:14.951 Europe/Warsaw**, **SENT_CONFIRMED 16:53:16.598**. Natywne
potwierdzenie dotyczyło wyłącznie własnej próby w Wysłanych, bez historii firm
lub innych wiadomości. Bez nowego OAuth, zmiany konta/uprawnień lub treści.

Spójne backupy SQLite przed/po, integralność=ok/FK=0, wszystkie wcześniejsze
wiersze i chroniony stan niezmienione. Baza firm/kontaktów/szkiców nadal
**472/376/221**. SELF_TEST/outbox/liczniki **5/5/5 → 6/6/6**, bez resetu;
5 wcześniejszych prób, materiały, CV/hash, historia/granica, blokady i shared
zachowane. 206 plików kodu/builda zgodnych z fingerprintem. Brak researchu,
wiadomości do firm i AUTO_POLICY. Końcowy RESEARCH_ONLY: stopped=true,
paused=true, senderPaused=true; aktywne run/job i nierozstrzygnięty outbox=0.
Pełna treść, MIME i wynik prywatnie poza Git. Folder Odebrane/Spam i działanie
CV pozostają do potwierdzenia przez odbiorcę; nie wynikają z SENT_CONFIRMED.

Późniejszy wynik użytkownika: próba z programu w Spam, dwie ręczne wiadomości
o tej samej treści i CV w Odebranych u dwóch innych odbiorców bez wcześniejszego
kontaktu. Różni odbiorcy nie izolują wpływu formatu lub sposobu wysyłki.
Wyłącznie lokalny audyt zapisanego MIME: pojedyncze nagłówki, CRLF, linie do
76 bajtów, tekst/plain+HTML i jeden PDF zgodny z zatwierdzonym hashem. Własny
Message-ID ma domenę jobhunter.local; to element do porównania, bez dowodu,
że spowodował Spam. Brak odebranych oryginałów i Authentication-Results;
nie oceniono SPF/DKIM/DMARC u odbiorcy. Bez zmian programu, nowych wysyłek,
odczytów skrzynki i konfiguracji OAuth. Dalsza diagnoza wymaga oryginałów
obu odebranych wiadomości; wynik otwarcia PDF nie został podany.

# Nowa sesja RESEARCH_ONLY 8 h — Windows, 16 października 2026, zakończona

Po zgłoszonej przez użytkownika utracie internetu sprawdzono niezależnie
publiczny reader (3/3 READ, systemowe CA), natywny CLI i rzeczywiste web search:
PASS. Doctor: win32 x64, Node 24.19.0, SQLite 3.53.4, CLI 0.162.0-alpha.17.2.
Brak zmian źródeł, zależności i builda; 206 plików zgodnych z fingerprintem
przetestowanym 15 października. Nie wykonywano nowego pełnego npm run check;
wcześniejsze wyniki 519 backend/12 performance/15 UI są osobnym zakresem.

Przed zamknięciem pozostawionego checkpointu poprzedniej sesji spójny backup
SQLite poza Git (51 tabel, integrity=ok/FK=0, hashe tabel zgodne). Natywna
operacja finishPartial zmieniła wyłącznie stan poprzedniego run/job na CANCELLED;
zachowała rekordy, CODEX_FAILED, oryginalny sessionId/deadline, metadane i raport.
Dane chronione, wszystkie stare wersje, tożsamości/aliasy, profil v4/9 faktów,
PDF/hash, historia/granica, blokady, shared i 5 SELF_TEST/outbox/liczników
bez zmian. Drugi spójny backup 51 tabel utrwala punkt odniesienia nowej sesji:
**354 rekordy firm / 282 kontakty / 170 szkiców**, w tym archiwalny duplikat.

Nowy start **16.10.2026 07:27:08.873 Europe/Warsaw**, stały termin
**16.10.2026 15:27:08.873**. Natywne 8 godzin, interwał 15 min,
do 10 nowych propozycji i 5 szkiców/cykl, rozszerzany plan i jedna operacja
naraz. Node --use-system-ca, nowy sessionId/runIds, DisabledMailProvider,
bez Gmaila, wysyłki i AUTO_POLICY. Start i preflighty są osobnym zakresem
od opisanego poniżej końcowego przebiegu. Nie wznawiano dawnego checkpointu,
nie włączano autostartu i nie zmieniano zasilania.

Audyt readonly po faktycznym starcie: hours=8, stałe 28 800 000 ms,
128 początkowych kierunków, active=true i pierwszy run w nowym zakresie.
Integrity=ok/FK=0, wszystkie pięć pól protection puste, senderPaused=true,
próby/outbox/liczniki 5/5/5. W trakcie sesji monitor ACTIVE; bez rutynowych
powiadomień podczas prawidłowej pracy. Nie przypisywać tych kontroli
powodzeniu końcowego przebiegu.

Rzeczywisty koniec **16.10.2026 15:27:09.252 Europe/Warsaw**, wynik **DEADLINE**,
przedział **28 800 379 ms (8 h + 0,379 s)**. Termin nieodnawiany. 32 cykle:
23 COMPLETED / 9 PARTIAL, bez awarii workera i bez błędów modeli. Suma okien
operacji 2 h 15 min 3,692 s, największy odstęp startów 15 min 0,663 s;
to czasy ścienne, nie CPU. PID zakończony, brak aktywnych run/job,
stopped=true, paused=true, session.active=false, senderPaused=true.

Wyniki wyłącznie runIds tej sesji: **+118 rekordów firm / +94 kontakty /
+51 szkiców**, biblioteka **354/282/170 → 472/376/221**. Zachowany archiwalny
duplikat; liczba rekordów nie potwierdza niezależności wszystkich podmiotów.
Powrót do 82 znanych firm. Raport obejmuje 86 bieżących szkiców: 51 nowych,
9 wcześniejszych z nową wersją i 26 ponownie użytych bez zmiany wersji.
Zapisano 60 nowych wersji, zachowano wszystkie 192 wersje sprzed sesji.
**50 nowych szkiców PASS/COMPLETED/supported=true**, 1 PASS/COMPLETED/supported=null
z niepewną aktualnością konkretnego wakatu; pozostaje do wyjaśnienia.
3 wcześniejsze szkice w zakresie mają DRAFT_MATERIAL_STALE; nie obchodzono
blokady, zachowano treści. Pozostałe kontrole nie udzielają zgody na wysyłkę.
Nowe kontakty literalne: 76 GENERAL / 8 RECRUITMENT / 6 UNKNOWN / 4 SALES.
Nowe szkice: 45 GENERAL / 6 RECRUITMENT, żadnych na UNKNOWN/SALES.

261 wpisów kandydatów / 223 różne URL / 200 rekordów firm w zakresie.
16 przypadków błędów: 7 NO_READABLE_SOURCE, 3 UNVERIFIED_COMPANY,
3 STALE_EVIDENCE i 3 COMPANY_IDENTITY_CONFLICT (te ostatnie dotyczą
2 kandydatur, bez automatycznego scalania lub kasowania). 13 nieudanych
rekordów źródeł: 4 DNS_FAILED, 5 NOT_FOUND, po 1 ACCESS_BLOCKED, HTTP_ERROR,
SIZE_LIMIT i TLS_UNTRUSTED. Błąd TLS dotyczył niezgodnego certyfikatu strony,
bez wyłączania TLS lub traktowania tego jako odmowy firmy. 311 wywołań modeli,
0 ERROR. Źródła w zakresie 771, FETCH=531/CACHE=233/FAILURE_CACHE=0;
brak pełnych pomiarów HTTP/redirect/bytes, null nie jest zerem. Liczb błędów
nie sumować jako niezależnych firm. contactUrl nie jest ukończoną analizą.

Aktywna kolejka researchDeferred pusta przed i po; 10 historycznych markerów
BUDGET_DEFERRED pozostaje historią, a klucze kolejki mają null. Ta sesja
nie sprawdziła opróżniania niepustej kolejki ani rozszerzenia po początkowych
128 kierunkach. Odpowiednie wcześniejsze testy fixture nie są dowodem
wykonania tych ścieżek podczas tego rzeczywistego przebiegu.

Końcowy niezależny audyt readonly: **integrity=ok/FK=0**, wszystkie pola
changedProtectedTables/changedOldVersions/protectedStateChanged/
protectedCompanyIdentityChanged/protectedAliasesChanged puste. Pierwotne ID,
wersje, profil v4/9 faktów/CV i hash, historia/trwała granica kampanii,
wcześniejsze blokady i aliasy, shared oraz 5 SELF_TEST/outbox/liczników
zachowane. Brak duplikatów kluczy i nowych nierozstrzygniętych wspólnych
mailboxów; wcześniejszy rozstrzygnięty alias pozostaje historią.
206 plików kodu/builda zgodnych z fingerprintem. 3 backupy (przed zamknięciem
dawnego checkpointu, przed nową sesją i po niej): SHA-256 zgodne,
integrity=ok/FK=0, wszystkie 51 tabel zgodne z właściwym punktem odniesienia.
Zero Gmaila/skrzynki/sekretów/tokenu panelu, wysyłek i AUTO_POLICY. Pełny
czytelny raport oraz dokładne tematy, treści, kontakty, wersje, źródła,
ostrzeżenia, pominięcia i błędy zapisane prywatnie poza Git.
Automatyzacja raportu tej jednej sesji ustawiona na PAUSED po przygotowaniu
końcowego raportu i pełnych wiadomości; nie uruchomiono kolejnej sesji.

# Rzeczywista sesja planowana na 15 h — Windows, 15–16 października 2026

Start **15.10 21:43:46.326**, koniec **16.10 06:14:14.536 Europe/Warsaw**;
stały pierwotny deadline 12:43:46.326 nie został odnowiony. Wynik **CODEX_FAILED**,
nie DEADLINE: rzeczywisty przedział **8 h 30 min 28,210 s**, a nie pełne 15 h.
35 rozpoczętych cykli: 20 COMPLETED / 14 PARTIAL / 1 PAUSED na SEARCH.
Suma ściennych okien operacji **3 h 9 min 12,760 s**, bez nazywania jej CPU;
największy odstęp startów kolejnych cykli 15 min 0,645 s.
Ostatnie wywołanie CLI: 12,670 s, exit=1, brak sygnału, zapisany komunikat
„workspace routing discovery failed”, przejście WebSockets → HTTPS i pięć
ponownych połączeń wewnątrz CLI. Nie ustalono głębszej przyczyny transportu;
nie stwierdzono na tej podstawie limitu konta, odmowy firmy lub błędu Gmaila.
Kontroler/PID zakończony; stopped=true, paused=true, session.active=false.
Zachowano 1 run PAUSED i 1 job QUEUED; brak aktywnego workera lub writera,
bez wznowienia, nowej sesji, odnowienia deadline lub usuwania locków.

Zakres wyłącznie runIds tej sesji: **+208 rekordów firm / +173 kontakty /
+88 szkiców**, baza **146/109/82 → 354/282/170**. Liczba rekordów nie dowodzi
liczby niezależnych podmiotów; zachowany wcześniejszy archiwalny duplikat.
Ponownie odwiedzono 40 znanych firm. W zakresie raportu 112 bieżących szkiców:
88 nowych, 8 wcześniejszych z nową wersją i 16 ponownie użytych bez zmiany
wersji. Utworzono 96 wersji; wszystkie pierwotne ID i wcześniejsze wersje
zachowane. **87 nowych szkiców PASS/COMPLETED/supported=true**, jeden REJECTED /
NOT_RUN / DRAFT_MATERIAL_UNVERIFIED pozostaje niegotowy. Nie zmieniano go
w raportowaniu. Nowe szkice: 78 GENERAL / 10 RECRUITMENT; brak nowych na SALES
lub UNKNOWN. Nowe literalne kontakty: 130 GENERAL / 15 RECRUITMENT / 17 UNKNOWN /
11 SALES — zapis nie oznacza dopuszczenia wszystkich do kontaktu.

319 wpisów kandydatów / 283 różne URL; **33 przypadki błędów kandydatów**:
16 NO_READABLE_SOURCE, 5 STALE_EVIDENCE, 5 UNVERIFIED_COMPANY,
4 UNVERIFIED_QUOTE, 2 COMPANY_IDENTITY_CONFLICT i 1 INVALID_CLAIM.
**34 nieudane rekordy źródeł**: 14 ACCESS_BLOCKED, 3 DNS_FAILED, 2 EMPTY,
3 HTTP_ERROR, 5 NOT_FOUND, 2 SIZE_LIMIT i 5 TIMEOUT. **469 wywołań modeli,
1 ERROR**. Liczb nie sumować jako niezależnych firm; źródła mogą się nakładać.
1000 rekordów źródeł w zakresie, 928 FETCH / 157 CACHE / 0 FAILURE_CACHE;
brak pełnego pomiaru HTTP/redirect/bytes. Błędy odczytu nie są odmowami firm.
contactUrl w metadanych nie jest ukończoną analizą. Pełne dokładne wiadomości,
96 wersji, wszystkie ostrzeżenia, dowody i diagnostyka w prywatnych TXT/JSON
poza Git. Dwa konflikty dopasowania tej samej kandydatury wymagają wyjaśnienia;
nie scalano danych. Brak duplikatów kluczy i nowych nierozstrzygniętych wspólnych
mailboxów; wcześniejszy rozstrzygnięty alias nie jest nowym konfliktem.

Niezależny audyt readonly: **integrity=ok/FK=0**; changedProtectedTables,
changedOldVersions, protectedStateChanged, protectedCompanyIdentityChanged,
protectedAliasesChanged puste. Profil v4/9 zatwierdzonych faktów/PDF i hash,
historia/trwała granica kampanii, wszystkie wcześniejsze blokady i aliasy,
5 SELF_TEST/outbox/liczników oraz shared zachowane. **206 plików źródeł/builda**
zgodnych z fingerprintem Windows check. Backupy przed/po: SHA-256 zgodne,
integrity=ok/FK=0, wszystkie 51 tabel zgodne z właściwym stanem odniesienia.
Bez zmian kodu/builda w trakcie sesji i raportowania. Zero Gmaila, skrzynki,
sekretów, tokenu panelu, wysyłek i AUTO_POLICY. Pełne rzeczywiste 15 h niezaliczone;
wykonany check i symulacja opisane poniżej pozostają osobnym zakresem.
Automatyzacja raportu tej jednej sesji ustawiona na PAUSED po przygotowaniu
końcowego raportu i pełnego eksportu wiadomości.

# Rozszerzone sesje RESEARCH_ONLY — Windows, 15 października 2026

Pełny `npm run check` PASS: **519 backend / 12 performance / 15 UI**, typecheck
i build. Doctor: Windows win32 x64, Node 24.19.0, SQLite 3.53.4, natywny CLI
0.162.0-alpha.17.2. 21 celowanych testów PASS; po dopracowaniu rotacji tematów
ponownie zaliczono cały celowany plik. UI obejmuje wybór 15 godzin, rzeczywiste
wywołanie lokalnego API i Stop, z fikcyjnymi providerami i tymczasową bazą.

Natywne parametry sesji 1–24 h; panel 8/15 h, API długiej sesji 2–24 h.
Długa sesja: odstęp 15 min, do 10 nowych propozycji i 5 szkiców/cykl, do 5
odłożeń w kolejce, bez nakładania operacji i lawiny zaległych cykli. Plan
rozszerzany po 128 początkowych kierunkach o kolejne partie; regiony, branże,
typy firm i zatwierdzone projekty są mieszane już od początku. Katalog testowy
1537 kierunków z 3 projektami i jednym kierunkiem bazowym jest unikalny.
Nie przypisuje firmom cech na podstawie słów zapytania. Godzinny test zachowuje
łączne 10 kandydatów/3 szkice; AUTO_POLICY i generator treści bez zmian.

Symulacja 15 h PASS: 60 różnych cykli, po 5 miejsc generowania, ten sam deadline
przez całą sesję, automatyczne zakończenie DEADLINE. Sprawdzono poszerzenie
planu, brak duplikatów, powrót odłożeń, Stop, restart bez automatycznego startu,
zachowanie terminu przy jawnym wznowieniu, niewłaściwe długości. Outbox/próby/
zatwierdzenia wysyłek=0. To test zegara i fixture, nie wynik rzeczywistych 15 h.

Przed zmianami kodu spójny backup 51 tabel poza Git; baza 146/109/82,
zatwierdzony profil v4/9 faktów i PDF/hash. Natywna sesja 15 h oraz jej końcowy
raport są osobnym etapem; nie oznaczać ich jako ukończone na podstawie checka.

Natywny start: **15.10.2026 21:43:46.326 Europe/Warsaw**, nieodnawialny deadline
**16.10.2026 12:43:46.326**. Publiczny reader 3/3 READ z systemowymi CA,
CLI i rzeczywisty search probe PASS; pierwotna kolejka jest analizowana.
206 plików kodu/builda utrwalonych po checku. Kontroler używa wyłącznie
DisabledMailProvider, zapisuje wyniki do głównej bazy i monitoruje ochronę.
To potwierdzenie startu, nie wynik 15-godzinnego przebiegu. Końcowy audyt
i wyniki dopisać po faktycznym końcu, bez zmian kodu aktywnego procesu.

# Celowana weryfikacja 3 kandydatur — Windows, 15 października 2026

Rzeczywisty RESEARCH_ONLY, natywny CLI i PUBLIC_HTTP z systemowymi CA.
2 cykle ekstrakcji/kwalifikacji oraz 1 regeneracja jednej nowej wiadomości;
wszystkie COMPLETED, bez nowych błędów modeli, cykli lub STALE_EVIDENCE.
Biblioteka **144/108/81 → 146/109/82**: +2 rekordy firm, +1 kontakt GENERAL,
+1 szkic. Liczba rekordów nadal obejmuje wcześniejszy archiwalny duplikat.

Pierwsza wersja wiadomości miała supported=null z zastrzeżeniem aktualności
naboru; została zachowana w historii. Bieżąca wersja 2 jest osobnym zapytaniem
o współpracę na adres ogólny: code=PASS, review=COMPLETED, supported=true,
issues=[], bindingIssues=[], styleWarnings=[]. Zachowany NEEDS_REVIEW
i przeznaczenie GENERAL; pozytywny wynik treści nie zatwierdza kontaktu,
polityki, historii skrzynki lub wysyłki.

Dwie kandydatury bez szkicu: (1) natywny HTML maskuje email; konkretna oferta
wymaga średniego doświadczenia, a osobne zaproszenie do aplikacji spontanicznej
zachowano w analizie. Publiczny DOM w przeglądarce potwierdził literalny mailto
odnoszący się do tej aplikacji; zapis prywatny, bez fałszowania PUBLIC_HTTP,
zmiany typu kontaktu w bazie lub obchodzenia walidacji. (2) dwa oficjalne
adresy kariery zwracają HTTP 403/ACCESS_BLOCKED/retryable=false. Dostępne przez
web informacje o otwartych kandydaturach nie są natywnym READ ani potwierdzeniem
wymaganej pełnej zdalności. Wszystkie dawne błędy/analizy zachowane.

Niezależny audyt readonly PASS: integrity=ok, FK=0; changedProtectedTables,
changedOldVersions, protectedStateChanged, protectedCompanyIdentityChanged,
protectedAliasesChanged puste. Wszystkie stare 81 drafts i wersje, całe
wiersze kontaktów i research_items niezmienione. Zachowane profil v4/9 faktów,
PDF/hash, historia i trwała granica kampanii, blokady, aliasy, 5 SELF_TEST/
outbox/liczników oraz shared. Brak nowych duplikatów kluczy i konfliktów
wspólnego mailboxa. Backupy SQLite przed/po zgodne względem 51 tabel.
203 pliki kodu/builda zgodne z ostatnim pełnym checkiem 513/12/15; bez zmian
źródeł, generatora, builda i bez ponawiania całego checka. Końcowy RESEARCH_ONLY
zatrzymany, senderPaused=true, brak aktywnych run/job, lock zwolniony.
Zero Gmaila, odczytów poczty/sekretów/tokenu panelu, wysyłek i AUTO_POLICY.
Pełne wyniki trzech firm, ostrzeżenia i dokładna wiadomość wyłącznie poza Git.

# Końcowy raport sesji 5 h — Windows, 15 października 2026

Zakończenie **DEADLINE 20:45:17.517 Europe/Warsaw**, początek 15:45:17.052,
rzeczywisty przedział **18 000 465 ms (5 h + 0,465 s)**. 5 cykli co godzinę;
suma okien started_at–finished_at 1 747 333 ms (29 min 7,333 s), pozostały
czas obejmuje planowe oczekiwanie. Nie jest to pomiar CPU ani nieprzerwanej
pracy obliczeniowej. Proces zakończony prawidłowo; bez awarii, restartu sesji,
nowego researchu lub odnowienia deadline podczas audytu.

W zakresie tylko runIds tej sesji: **30 nowych rekordów firm, 23 nowe kontakty,
11 nowych szkiców**. Biblioteka **114/85/70 → 144/108/81**; w całkowitej liczbie
firm nadal zachowany archiwalny duplikat. Odwiedzono ponownie 4 znane firmy,
wykorzystano 1 poprzedni szkic bez zmiany jego treści lub wersji. 34 firmy
i 12 wiadomości w zakresie nie oznaczają tylu nowych rekordów. Kontrole kluczy
domen/nazw/firma+email/firma+szkic bez nowych duplikatów; jedyny wspólny mailbox
pozostaje rozstrzygniętym wcześniej aliasem. Brak nowego konfliktu wspólnego
emaila; nie wykonano odrębnej kontroli rejestrowej wszystkich operatorów.

39 elementów kandydatur, 37 różnych URL: 36 DONE, 2 ERROR, 1 UNAVAILABLE.
3 problemy kandydatur: **2 STALE_EVIDENCE i 1 NO_READABLE_SOURCE/HTTP 403**
(dwa warianty URL 403 tej samej kandydatury). Nie są odmowami kontaktu firmy.
2 cykle PARTIAL/ITEMS_NEED_REVIEW, pozostałe 3 COMPLETED/DRAFTS_READY;
brak błędów modeli i kontrolera. Historyczne dyspozycje elementów:
11 DRAFTED, 2 BUDGET_DEFERRED, 8 NO_CONTACT, 7 REJECTED,
7 CONTACT_NOT_ALLOWED, 1 REUSED, 3 bez dyspozycji. 19 nowych firm bez szkicu,
7 bez kontaktu; te liczniki nie oznaczają automatycznej zgody na przyszły send.
Nie ponawiano błędów lub generowania podczas raportowania.

Nowe kontakty: **14 GENERAL, 6 RECRUITMENT, 2 UNKNOWN, 1 SALES**. Dla UNKNOWN
i SALES nie powstały wiadomości. Nowe szkice: **8 GENERAL, 3 RECRUITMENT**,
**9 COMPANY_INQUIRY, 2 OPEN_APPLICATION**. Wszystkie 11 oraz zachowany szkic:
code=PASS, review=COMPLETED, supported=true/issues=[], aktualne powiązania
materiałów w chwili audytu; ponowny readonly check dokładnych payloadów PASS,
bez uwag stylistycznych. Ogólny kontakt zachowuje swoje przeznaczenie.
Nieznane warunki, niedopasowana źródłowa oferta i wskazany kanał aplikowania
pozostają w ostrzeżeniach; pozytywny review nie stanowi zgody ani kompletnej
kwalifikacji do wysyłki. Literalne kontakty, krótkie dowody, źródła i wszystkie
ostrzeżenia/pominięcia oraz pełne wiadomości są w prywatnym raporcie.

Niezależny audyt po końcu otworzył wyłącznie readonly SQLite, bez konstruktora
Store/service, Gmaila, poczty, OAuth, keyring lub tokenu panelu. Wszystkie pola
protection puste: changedProtectedTables, changedOldVersions,
protectedStateChanged, protectedCompanyIdentityChanged, protectedAliasesChanged.
Wszystkie oryginalne ID zachowane; całe stare wiersze 70 drafts niezmienione,
stare ID/firma/email/typ kontaktu niezmienione. Profil v4/9 zatwierdzonych faktów,
PDF/hash, historia, trwała granica kampanii, dawne blokady i aliasy,
shared oraz wszystkie 5 SELF_TEST/outbox/liczników zachowane. 0 nowych prób,
0 nowego usage. Native blokady oraz powiązanie rozstrzygniętej tożsamości PASS.

SQLite integrity=ok/FK=0. Spójne backupy przed i po: hash plików, integrity/FK
i zgodność wszystkich 51 tabel PASS; końcowy backup odpowiada bieżącej bazie.
**203 pliki kodu/builda niezmienione**. Bez nowego buildu/npm run check,
bez zmian generatora lub programu — to audyt danych rzeczywistej sesji.
RESEARCH_ONLY stopped=true, paused=false, senderPaused=true, brak aktywnych
run/job i procesu kontrolera, lock zwolniony. Zapisano czytelny raport poza Git,
osobny plik dokładnych 11 nowych + 1 zachowanej wiadomości i audyt JSON.
Monitor pojedynczej zakończonej sesji wyłączony (PAUSED). Gmail/pilot/AUTO_POLICY
pozostają odłożone; brak zgody na wysyłkę.

# Uruchomienie sesji 5 h — Windows, 15 października 2026, zapis po starcie

Na polecenie użytkownika uruchomiono RESEARCH_ONLY w głównej bazie,
**15:45:17–20:45:17 Europe/Warsaw**, z nieodnawialnym terminem i nowymi
kierunkami wyszukiwania. To potwierdzenie startu, nie zakończenia 5 godzin.
Punkt odniesienia: **114 rekordów firm / 85 kontaktów / 70 szkiców**,
z zachowanym archiwalnym duplikatem. Spójny backup poza Git zgodny z 51
tabelami, integrity=ok, FK=0; zatwierdzony profil v4/9 faktów i PDF/hash.

Panel udostępnia warianty 1/8 h; prywatny adapter poza repo przekazuje
5 do istniejącego silnika obliczającego deadline i poprawia tylko opis
DAY_STARTED, bez zmiany generatora, uprawnień lub buildu. Próba Windows
na fikcyjnej bazie i zegarze PASS: 18 000 000 ms, godzina między kierunkami,
maxCycles=null, nieodnowiony termin, natywne DEADLINE, DisabledMailProvider,
outbox=0. Nie jest to pomiar rzeczywistej pracy przez 5 h. 203 pliki
źródeł/buildu zgodne z końcowym checkiem 513/12/15; bez ponownego buildu.

Rzeczywisty start Node z --use-system-ca: publiczny preflight 3/3 READ,
CLI/search PASS. Proces aktywny, pierwsza tura COMPLETED/DRAFTS_READY,
0 kandydatów i 0 nowych szkiców, bez błędów. Następny kierunek o 16:45.
Kontroler zachowuje główną bazę i natywne reguły deduplikacji; sprawdza
też stare tożsamości/aliasy, blokady, profil/CV, historię, shared i wersje.
Wszystkie pola protection puste; brak nowych prób wysyłki lub usage,
nadal 5 historycznych SELF_TEST/outbox/liczników. Gmail/provider nie jest
inicjalizowany. Brak automatycznego wznowienia po restarcie lub awarii,
zmian zasilania Windowsa i zmian kodu pracującego procesu.

Raport i cichy monitor zakończenia ustawiono w tej samej rozmowie.
Końcowy czas, wyniki, deduplikacja semantyczna, kontakty/przeznaczenie,
pełne wiadomości i komplet błędów pozostają do oceny po zakończeniu.
Zapisanie szkiców nie daje zgody na Gmail, rzeczywistą wysyłkę ani AUTO_POLICY.
Prywatne dane i pliki sesji pozostają poza Git.

# Rozstrzygnięcie jednej pary tożsamości — Windows, 15 października 2026

Na osobne polecenie użytkownika potwierdzono wspólny podmiot: 5 rzeczywistych
publicznych odczytów READ/HTTP 200 przez natywny czytnik Windows z systemowym
CA oraz oficjalny odpis rejestrowy HTTP 200. Wspólny email był tylko dowodem
pomocniczym; sprawdzono operatora obu witryn i dane rejestrowe. Szczegóły firm,
źródła/hash i pełna zachowana wiadomość są w prywatnym raporcie poza Git.

W transakcji przypisano obie domeny i potwierdzone nazwy do jednego rekordu
głównego. Drugi rekord zachowano jako archiwalny, blokowany przez
DUPLICATE_COMPANY_ALIAS bez automatycznego wygaśnięcia. Jego pierwotny
history_status zachowany; to nie odmowa firmy lub wcześniejsza wysyłka.
Nie usunięto żadnych rekordów. Stare kontakty, dowody i elementy researchu
pozostały z własnymi ID. Para nie miała przypisanych lokalnych prób, blokad
lub historii wymagających przenoszenia; nie jest to deklaracja braku dawnej
korespondencji Gmaila. Zmieniono tylko companies, company_aliases,
suppressions i audit_events. Pozostałe 47 tabel identyczne; wcześniejsze
wiersze blokad i audytu niezmienione, nowe wpisy wyłącznie dopisane.

Resolver i podgląd CSV używają potwierdzonych aliasów nazw również bez domeny.
Niejednoznaczny alias, kolizja z niearchiwalną firmą i niepotwierdzona obca
domena nadal blokują. Trzy regresje FAIL→PASS; dodatkowo rollback i zapis
aliasu z drugiego połączenia PASS. Pamięć aliasów ma kontrolę lokalnych zmian,
rollbacku i SQLite data_version; readonly widoki bez licznika odczytują dane
bez cache. Pierwszy pełny check przeszedł, ale ujawnił spowolnienie scenariusza
dużej historii do ok. 69 s. Naprawione przed wdrożeniem: trzy odrębne scenariusze
ponad 10 tys. firm 4,5–4,8 s, końcowy pełny zestaw performance 17,7 s.
Są to czasy całych scenariuszy, nie latencja Stop. Bez migracji schematu.

Końcowy `npm run check` na Windowsie **15:22:27–15:35:16 Europe/Warsaw**:
**513/513 backend, 12/12 performance, 15/15 UI**, typecheck/build PASS.
135 źródeł bez zmian podczas checka i 68 plików builda w fingerprint.
Doctor: win32 x64, Node 24.19.0, SQLite 3.53.4, natywny CLI 0.162.0-alpha.17.2,
WORKSTATION/RESEARCH_ONLY, build gotowy. Nie uruchamiano prawdziwego backendu.
Odrębny proces po zapisie potwierdził obie domeny, warianty nazw oraz podgląd
importu bez wykonywania rzeczywistego importu historii. Rekord główny nie ma
blokady duplikatu; rekord archiwalny jest blokowany. Dawne blokady nadal aktywne.

Spójne backupy SQLite przed i po porównano ze wszystkimi 51 tabelami;
integrity=ok, FK=0. Nadal **114 rekordów firm / 85 kontaktów / 70 szkiców**;
wśród firm jest zachowany duplikat, więc nie jest to liczba potwierdzonych
niezależnych podmiotów. Wszystkie 70 treści i wersji, materiały, profil v4/9
faktów, zatwierdzony PDF/hash, historia i trwała granica kampanii, shared,
5 SELF_TEST/outbox i liczniki zachowane. Ponowny audyt readonly:
**69/69 przygotowanych do przyszłego podglądu**, code=PASS/review=COMPLETED,
supported=true/issues=[], brak lokalnych blokad w tej grupie. Jeden odłożony
szkic nadal blokowany poza nią. 63 GENERAL/6 RECRUITMENT; 257 zapisanych URL,
bez ponownego odczytu wszystkich stron/modelu/generatora. Najwcześniejszy
próg 24 h nadal **15 października 17:37 Warszawa**. Ręczny przegląd paczki,
bieżące materiały i osobno uzgodniona historia Gmaila pozostają przed wysyłką;
nie zmieniono reguł AUTO_POLICY na akceptację każdej wiadomości.

RESEARCH_ONLY, stopped/paused/senderPaused=true, lock zwolniony. Bez Gmaila,
poczty, OAuth, magazynu haseł, tokenu panelu, rzeczywistych wysyłek lub Start.

# Audyt 69 szkiców przed przyszłym pilotażem — Windows, 15 października 2026

Audyt readonly dokładnie 69 istniejących szkiców, z pominięciem jednej
odłożonej firmy. **68 przygotowanych do przyszłego podglądu pilotażu;
1 wymaga wyjaśnienia tożsamości/deduplikacji.** Dwa rekordy firmy mają
wspólny literalny email; tylko jeden ma szkic w kontrolowanej grupie.
Nie scalano rekordów, nie kasowano danych i nie zapisano nowej blokady.
Dotychczasowa blokada odłożonej firmy pozostała aktywna poza tymi 69.

69/69 bieżących materiałów ma code=PASS, review=COMPLETED,
supported=true/issues=[]. Dokładne payloady sprawdzono ponownie funkcją
checkDraft na zapisanym kontekście zatwierdzonego profilu i dowodów:
69/69 PASS, zero uwag stylistycznych. 0 DRAFT_MATERIAL_STALE,
0 DRAFT_MATERIAL_UNVERIFIED, 0 negatywnych/nieukończonych kontroli.
Brak identycznych całych treści u różnych firm. 257 różnych zapisanych URL:
sprawdzono READ/hash/aktualną wersję/parser/24 h, binding i profil/CV;
**nie odczytano ponownie wszystkich stron** i nie uruchamiano modelu,
generatora lub discovery. Pomocniczo sprawdzono cztery publiczne strony
i odsyłacz produktu o zbieżnej nazwie; brak podstaw do scalenia po samej
nazwie. Szczegóły i źródła są w prywatnym raporcie.

Sprawdzono 69 literalnych dowodów i zapisanych kontekstów adresów oraz
contactPurposeAllowed/contactEligibility. 63 GENERAL/NEEDS_REVIEW
i 6 RECRUITMENT/VERIFIED_PUBLIC. Nie znaleziono dodatkowego przypadku
potwierdzonego wyłącznie informacją administratora bez odrębnego ogólnego
kontaktu. Adresy mające również kontekst privacy zachowały właściwy typ
dzięki osobnemu blokowi kontaktowemu; bez przepisywania na RECRUITMENT.
W przygotowanej grupie 68: **62 GENERAL, 6 RECRUITMENT; 62 COMPANY_INQUIRY,
5 OPEN_APPLICATION, 1 CONDITIONS_INQUIRY**. Nieznane warunki współpracy
pozostają pytaniami. Obecny brak reviewed_at i przeglądu 63 kontaktów GENERAL
opisano jako pozostałe kroki ręcznego pilotażu wybranej paczki; nie jako
wymóg akceptacji każdego przyszłego maila AUTO_POLICY.

Najwcześniejszy próg 24 h źródeł/dowodów/kontaktu w przygotowanej grupie:
**15 października 2026, 17:37:17 Europe/Warsaw**. Gotowość jest oceną
zapisanych materiałów w chwili audytu, nie gwarancją ich aktualności
w przyszłym terminie. Przed wysyłką potrzebne są aktualne materiały,
uzgodniony etap Gmaila (nadawca/test, celowana historia), dokładny podgląd
do 3 wiadomości i osobna zgoda na pilot. Brak nowego odczytu Gmaila nie jest
potwierdzeniem braku wcześniejszych kontaktów. W 69 nie wykryto innych
lokalnych blokad historii/suppressions lub zarejestrowanych FIRST_CONTACT.

Wszystkie **51 tabel bez zmian** przed/po i zgodne z końcowym backupem
poprzedniej operacji założenia blokady. Nadal 114 rekordów firm / 85 kontaktów /
70 szkiców, profil v4/9 faktów, zatwierdzony i wybrany CV/PDF/hash,
historia/blokady/granica, shared i 5 SELF_TEST/outbox/usage zachowane.
integrity=ok, FK=0, RESEARCH_ONLY stopped/paused/senderPaused, brak aktywnych
operacji/nierozstrzygniętego outboxa; lock zwolniony. Fingerprint 203 plików
zgodny, bez zmian kodu/zależności/migracji/builda i bez ponawiania checka
implementacji. Brak Store/backendu/providerów poczty, Gmaila, skrzynki,
sekretów/OAuth/tokenu panelu i wysyłki. Początkowy błąd prywatnego zapytania
audytu poprawiono przy połączeniu readonly; nie był błędem aplikacji.
Pełny raport, lista gotowości, konteksty i 69 zachowanych wiadomości poza Git.

# Odłożenie firmy do wyjaśnienia kontaktu — Windows, 15 października 2026

Na wyraźne polecenie użytkownika dodano jeden trwały do czasu wyjaśnienia
wpis CONTACT_PURPOSE_UNCONFIRMED w istniejącej tabeli suppressions, marker
suppression_reason jednej firmy i zdarzenie audytu z aktorem user. permanent=0
oznacza wstrzymanie do wyjaśnienia, bez automatycznej daty wygaśnięcia;
obecne bramki sprawdzają każdy wpis suppressions. Nie użyto helpera
nadpisującego history_status: dotychczasowa historia pozostaje identyczna.
Nie oznaczono kontaktowania, odmowy ani wyłącznego PRIVACY, nie zmieniono
odbiorcy lub typu GENERAL. Mocniejsze wcześniejsze blokady pozostają aktywne.

Rzeczywista wspólna bramka companyHistoryBlocks na Windowsie: przed zmianą
false, po zapisie true, po zamknięciu połączenia i otwarciu bazy readonly
w osobnym procesie nadal true. Istniejące bramki końcowe poczty i AUTO_POLICY
odrzucają suppression_reason/wpis suppressions; nie uruchamiano ich transportu,
Start ani Gmaila. Blokada nie zależy od ważności źródeł, dnia lub sesji;
powrót do rozważania kontaktu wymaga potwierdzenia jego przeznaczenia i
kontrolowanego zdjęcia wyłącznie tej blokady. Nie wykonano odblokowania.

Przed zapisem zweryfikowany spójny backup SQLite, uwzględniający WAL.
Zmiana w jednej transakcji z audytem przed zatwierdzeniem. Po zapisie drugi
spójny backup, oba zgodne ze wszystkimi 51 tabelami; integrity=ok, FK=0.
Zmieniły się jedynie companies (marker/wersja/data jednej firmy), suppressions
(+1) i audit_events (+1). Pozostałe **48 tabel identyczne**. Wszystkie stare
wpisy blokad i audytu, pozostałe firmy i wszystkie history_status zachowane.
**70 szkiców, ich treści/odbiorcy, stare wersje/materiały i 85 kontaktów
identyczne**. Nadal 114/85/70 rekordów firm/kontaktów/szkiców, profil v4/9
zatwierdzonych faktów, CV/PDF/hash, trwała granica, shared, Fingoweb oraz
5 SELF_TEST/outbox/usage bez zmian. RESEARCH_ONLY stopped/paused/senderPaused,
brak aktywnych operacji i nierozstrzygniętego outboxa; lock zwolniony.

Bez zmian kodu/zależności/migracji/builda; fingerprint 203 plików zgodny
z wcześniejszym pełnym checkiem Windows. Nie powtarzano testów implementacji;
zweryfikowano zapis rzeczywistej blokady i trwałość bramki po otwarciu
w osobnym procesie. Bez Gmaila, odczytu poczty, OAuth/sekretów/tokenu panelu
lub wysyłki. Pełny prywatny raport, zachowany szkic i backupy poza Git.

# Celowana ocena przeznaczenia kontaktu — Windows, 15 października 2026

Sprawdzono przeznaczenie jednego adresu biura bez zmiany szkicu, kodu,
powiązań źródeł lub stanu głównej bazy. Natywny PublicSourceReader z Windows
system CA: **5/5 READ** (strona główna, kontakt PL/EN, produkt i mapa witryny).
Trzy dodatkowe odczyty jawnego HTML potwierdziły, że stopka publikuje inny
adres serwisowy. Bez wykonywania skryptów, zgadywania adresów lub użycia
formularza. Dwa oficjalne podręczniki przeszukano w dostępnej warstwie
tekstowej; nie znaleziono @. Odsyłacz polityki prywatności prowadzi do #,
więc nie uznano go za odrębne źródło.

Adres biura jest literalnie opublikowany w danych administratora pod
formularzem w dwóch językach. Nie znaleziono niezależnego ogólnego kontekstu
tego adresu ani wyłącznego ograniczenia do privacy. **Wynik niejednoznaczny:
kontakt niepotwierdzony do pilotażu; rekomendowane pominięcie do wyjaśnienia.**
Nie wpisano odmowy, nie oznaczono PRIVACY/RECRUITMENT i nie zmieniono odbiorcy.
Brak ogłoszenia rekrutacji sam w sobie nie wyklucza GENERAL; wątpliwość
dotyczy funkcji konkretnej skrzynki. Obecne contactPurposeAllowed zwraca true,
ale ten wynik techniczny nie jest niezależnym potwierdzeniem przeznaczenia.
Nie zmieniono walidatora ani nie wywołano reviewContact za użytkownika;
wcześniejsze ostrzeżenie pozostaje w analizie. Nie dodawano nowej blokady
technicznej, nie usuwano istniejących blokad i nie udzielano zgody na send.

Główna SQLite otwarta wyłącznie readonly, bez instancji Store/backendu
lub providerów poczty. Porównanie **wszystkich 51 tabel przed/po identyczne**:
cały wiersz szkicu v2, temat/treść/odbiorca, pozostałe szkice, stare wersje,
materiały, historia, blokady i liczniki bez zmian. Nadal **114/85/70**
rekordów firm/kontaktów/szkiców, profil v4/9 zatwierdzonych faktów, PDF/hash,
5 SELF_TEST/outbox/usage i shared zachowane. integrity=ok, FK=0,
stopped/paused/senderPaused=true, brak aktywnych operacji, lock zwolniony.
Fingerprint 203 plików kodu/build zgodny. Brak zmian kodu/zależności/migracji
i builda; poprzedniego checka nie powtarzano. Bez Gmaila, poczty,
sekretów/OAuth/tokenu panelu i wysyłki. Wynik nie dowodzi wyczerpania całego
internetu ani dostarczalności. Pełny prywatny raport, zachowana wiadomość,
źródła i audyt poza Git; żadne dane firmy/kontaktu nie trafiły do dokumentacji.

# Resolver opisów działalności i dwa szkice — Windows RESEARCH_ONLY, 15 października 2026

Resolver policyVersion=4 uzupełnia wąskie przypadki własnej działalności:
wykonanie programów komputerowych, produkcję systemów informatycznych,
autorskie oprogramowanie wynikające z doświadczeń firmy i bierną prezentację
produktu na jego własnej stronie. Ostatni przypadek wymaga zgodnej marki
w domenie i tytule oraz konkretnych szczegółów API/obsługi błędów. Bez listy
wyjątków firm, zmiany generatora/stylu lub migracji. Negacje, cudze/zakupione
i odsprzedawane produkty, menu, działalność fizyczna i wymagania wakatu
nie zastępują dowodu. Kontrole READ/hash/parser/24 h, nowszych sprzecznych
źródeł, hosta/tożsamości, odbiorcy/przeznaczenia, odmów i historii zachowane.

Cztery brakujące przypadki odtworzone FAIL przed poprawką. Dodano 27 nowych
syntetycznych przypadków, fikcyjnych odbiorców i stron. **97/97 testów
celowanych PASS**. Pełny `npm run check` na Windows 15 października,
12:18:01–12:31:09 Europe/Warsaw: **508/508 backend, 12/12 performance,
15/15 UI**, typecheck/build PASS. Doctor: win32 x64, Node 24.19.0,
SQLite 3.53.4, natywny Codex CLI 0.162.0-alpha.17.2, build gotowy.
Fingerprint 135 źródeł i 68 plików builda zgodny po operacji;
zero zmian źródeł podczas checka. Ostrzeżenia testowe dotyczą wyłącznie
jednoczesnych NO_COLOR/FORCE_COLOR; brak błędów testów.

Po zakończeniu checka dwa celowane natywne przebiegi w głównej bazie
WORKSTATION/RESEARCH_ONLY: **3/3 rzeczywistych odczytów READ**, dwa przebiegi
COMPLETED, dwie kontrole semantyczne OK. Wszystkie wcześniejsze cytaty
pozostały literalnie w świeżych źródłach. Kwalifikacja została ponownie
wykonana; natywne revalidateSameText dopisało dla obu wersję materiałów 2,
code=PASS, review=supported=true/issues=[], bez problemów bindingu/stale.
**Tematy, treści i odbiorcy identyczni**, zero wywołań DRAFT. Szkice pozostają
NEEDS_REVIEW, kontakty GENERAL, warunki współpracy niepotwierdzone.

Jeden kontakt wymaga zachowania zastrzeżenia: literalny adres jest w danych
firmy/administratora pod formularzem, a nie w odrębnym zaproszeniu do współpracy.
Bieżące reguły dopuszczają GENERAL; brak jawnego ograniczenia tylko do privacy,
ale nie znaleziono niezależnego potwierdzenia zastosowania do współpracy.
Nie utożsamiono go z innym adresem serwisowym ani nie zmieniono odbiorcy.
Ostrzeżenie dodano do nowej analizy i prywatnego raportu; nie jest to
zatwierdzenie odbiorcy do przyszłej wysyłki. Drugi adres występuje również
w sekcji zapytania/kontaktu. Żaden nie uzyskał typu RECRUITMENT.

Baza nadal **114 rekordów firm / 85 kontaktów / 70 szkiców**. Audyt potwierdził
identyczność wszystkich 70 tekstów/odbiorców, pozostałych 68 wierszy szkiców,
starych wersji i materiałów, tożsamości firm i historii/blokad. Chronione
tabele/stan bez zmian; profil v4/9 zatwierdzonych faktów, PDF/hash, trwała
granica, shared oraz 5 SELF_TEST/outbox/usage zachowane. Spójne backupy przed
i po, końcowy zgodny ze wszystkimi 51 tabelami; integrity=ok, FK=0. Końcowo
stopped/paused/senderPaused=true, aktywne runs/jobs=0, nierozstrzygnięty
outbox=0, lock zwolniony. DisabledMailProvider, bez Gmaila, odczytu poczty,
sekretów/OAuth/tokenu panelu lub wysyłki. AUTO_POLICY wyłączone. Nie testowano
tu dostarczalności, wysyłki, nowego discovery lub pozostałych firm.
Pełne wiadomości, literalne dowody i prywatny audyt poza Git.

# Odświeżenie 21 wcześniejszych szkiców — Windows RESEARCH_ONLY, 15 października 2026

Operacja na dokładnej wcześniejszej liście 21 DRAFT_MATERIAL_STALE, bez
zmiany kodu/generatora/builda/zależności. Wszystkie miały przeterminowane
źródła przy zgodnych binding/payload/profilu. Ponownie odczytano publiczne
źródła przez natywny PublicSourceReader: **87/87 READ, 73 różne URL**,
obejmujące ponowienia fazy uzupełnienia i jedną dodatkową stronę produktu.
Nie odświeżano dat/hashów bez rzeczywistego odczytu. Nowe wersje HTML mają
własne rzeczywiste hashe; nie zrównywano ich z poprzednimi.

**Wszystkie 21 tematów, treści i odbiorców zachowane bez zmian.** 19 przechodzi
bieżące kontrole. 10 otrzymało nową wersję materiałów z identycznym tekstem
i odrębnym pozytywnym review; 11 zachowuje wersję. Wszystkie cytaty starych
analiz były literalnie obecne w nowych źródłach; ponowna kwalifikacja nadal
obowiązywała. Cztery pierwotne pominięcia uzupełniono pełniejszym ciągłym
kontekstem usług/produktu i właściwą stroną produktu. Dwie analizy używają
potwierdzonej w tych samych źródłach marki przy zachowaniu pełnego literalnego
dowodu tożsamości, hosta, ID i nazwy firmy w bazie. Bez wyjątków kodowych.

Dwa przypadki nadal nie przechodzą resolvera podstawy zapytania mimo
aktualnych opisów własnego produktu/usług. Dla obu niezależnie sprawdzono
samą treść z aktualnymi dowodami i zatwierdzonym profilem: kod bez uwag,
model supported=true/issues=[]. Ta ocena nie nadpisała materiałów szkiców
ani nie zastąpiła kwalifikacji. Jeden zachowuje DRAFT_MATERIAL_STALE,
drugi ma aktualne materiały i blokadę kwalifikacji; nie uznano ich za gotowe
do wysyłki. Następny krok i kontekst przeznaczenia adresu w TASKS oraz
prywatnym raporcie. To ograniczenia rozpoznawania dowodów, nie odmowy firm.

Łącznie **12 wywołań modelu OK**: 10 kontroli nowych wersji tego samego tekstu
i 2 odrębne kontrole treści zatrzymanych przypadków. Zero błędów modelu lub
odczytów, zero generacji nowych tekstów. 13 celowanych przebiegów COMPLETED;
trzy obejmują pierwotne pominięcia, poprawione później w dwóch przypadkach.
Pozostałe pierwotne pominięcia dotyczyły odświeżenia identycznej wersji bez
zlecania przebiegu. Źródeł dostępnych READ nie nazywano odmową.

Końcowy audyt readonly względem stanu sprzed operacji: **114/85/70 bez zmian**.
Zero zmian 70 tematów/treści/odbiorców, 49 szkiców spoza zakresu, wszystkich
starych wersji, wierszy materiałów i zdarzeń weryfikacji źródeł. Chronione
tabele/stan, historia/blokady firm i trwała granica, profil v4/9 APPROVED,
CV/PDF/hash, shared oraz 5 SELF_TEST/outbox/usage zachowane. Spójne backupy
przed/po fazach; końcowy zgodny z 51 tabelami, integrity=ok, FK=0.
Fingerprint 135 źródeł i 68 plików builda zgodny. Poprzedni pełny Windows
check tej samej wersji (481/12/15 PASS) jest referencją, nie nowym testem
tego zlecenia; nie powtarzano go bez zmiany kodu.

DisabledMailProvider, brak gateway Gmaila i odczytu poczty, OAuth, sekretów,
tokenu panelu lub wysyłki. Końcowo RESEARCH_ONLY, stopped/paused/senderPaused=true,
aktywne runs/jobs=0, nierozstrzygnięty outbox=0, blokada profilu zwolniona.
Pełne 21 wiadomości, źródła, wcześniejsze pominięcia, ostrzeżenia i audyt
poza Git. Nie przedstawiać biblioteki 70 szkiców jako zgody na wysyłkę.

# Rozpoznawanie opisów własnego oprogramowania — Windows, 15 października 2026

Resolver podstawy zapytania v3 rozpoznaje własny system TMS, formy pierwszej
osoby „zbudowałem”/„buduję”, producenta oprogramowania i wspieranie firm
w budowaniu oprogramowania. Reguły są językowe, bez wyjątków po nazwach.
Zachowano dowód literalny, aktualną wersję źródła/host/tożsamość, kontakt
i jego przeznaczenie, odmowy i konflikty warunków. Własny system nie oznacza
potwierdzonego wewnętrznego zespołu IT. Generator/styl bez zmian.

20 nowych syntetycznych przypadków obejmuje te opisy i negacje, rozwój
pracowników, cudzą działalność, menu/zgodę marketingową, nieaktualny lub
nieodczytany/obcy dowód, parser/hash i nowszą sprzeczną wersję, zakazane
przeznaczenie, odmowy i konflikt. **70/70 testów celowanych PASS** na
Windowsie. Ponadto readonly kontrola czterech rzeczywistych zapisanych
propozycji dowodu: 4/4 rozpoznane bez zmiany kontaktu GENERAL. Porównanie
kwalifikacji 66 istniejących szkiców: zero zmian. 21 wcześniejszych szkiców
miało już DRAFT_MATERIAL_STALE; blokada pozostaje, bez nadpisania materiałów.
Spójny backup sprzed zmiany kodu zgodny z 51 tabelami.

Pełne **npm run check** końcowej wersji na Windowsie: **481/481 backend,
12/12 performance, 15/15 UI**, typecheck/build PASS. Dane testowe syntetyczne,
fikcyjny transport; nie testowano prawdziwej wysyłki. Doctor PASS: Windows
x64, Node 24.19.0, SQLite 3.53.4, natywne CLI wykryte. Fingerprint 135 plików
źródłowych i 68 plików builda; zero zmian źródeł podczas końcowej kontroli.

Rzeczywista operacja RESEARCH_ONLY na tym Windowsie: **15/15 odczytów READ,
11 wywołań modelu OK, zero błędów modelu/elementów**. Cztery nowe szkice v1:
**114 firm / 85 kontaktów / 66 szkiców → 114/85/70**. Bez nowych firm lub
kontaktów i bez duplikatów odbiorców tych czterech szkiców. Wszystkie
GENERAL, kod PASS, review COMPLETED/supported=true/issues=[], binding
issues=[], uwagi stylistyczne=[], status NEEDS_REVIEW. Nie potwierdzają
nieznanych warunków, wewnętrznego zespołu programistycznego ani kompetencji
kandydata wynikających jedynie z technologii firmy. Jeden szkic odnosi się
do opublikowanej oferty; ostrzeżenia o niedopasowaniu wymagań i kanale CV
zachowano. Nie uznano go za zgodę na aplikację pod adresem ogólnym.

Pierwsza analiza jednego przypadku wybrała nagłówek z nierozpoznaną formą
czasownika. CONTACT_NOT_ALLOWED zachowano jako pierwotne pominięcie podstawy
zapytania, nie odmowę firmy lub błąd odczytu. Po zakończeniu pierwszej fazy
i spójnym backupie ponownie odczytano źródła; wybrano wcześniej znaleziony,
pełny dosłowny akapit twórcy aplikacji. Bez zmiany kontaktu, warunków lub
materiałów kandydata. validateAnalysis/resolveInquiryBasis/contactEligibility,
natywna kwalifikacja, zwykły generator i review przeszły. Pięć przebiegów
COMPLETED, z czego jeden obejmuje pierwotne pominięcie; nie testowano
automatycznej naprawy każdego możliwego zbyt krótkiego cytatu.

Końcowy audyt readonly względem stanu sprzed kodu: zero zmian chronionych
tabel/stanu, 66 wcześniejszych szkiców, ich wersji/materiałów i historii
firm. Profil v4/9 APPROVED faktów, CV/PDF/hash, Fingoweb/blokady/granica,
shared i 5 wcześniejszych SELF_TEST/outbox/usage zachowane. Spójne backupy
przed kodem i przed/po obu fazach; końcowy zgodny z 51 tabelami, integrity=ok,
FK=0. Fingerprint 135 źródeł + 68 builda zgodny również po researchu.
DisabledMailProvider, brak gateway; bez Gmaila/poczty, OAuth, tokenu panelu,
wysyłki lub AUTO_POLICY. Końcowo RESEARCH_ONLY, stopped/paused/senderPaused=true,
aktywne runs/jobs=0, nierozstrzygnięty outbox=0, blokada profilu zwolniona.
Pełne dokładne wiadomości, literalne kontakty/dowody, źródła, ostrzeżenia
i audyt pozostają poza Git. 70 to liczba zapisanych szkiców, nie gotowość
całej biblioteki do wysyłki; 21 dawnych DRAFT_MATERIAL_STALE zachowano.

# Uzupełnienie podstaw grupy 18 firm — Windows RESEARCH_ONLY, 15 października 2026

Sprawdzono dokładnie 18 istniejących przypadków z wcześniejszego audytu.
Trzy zatrzymywane fazy w głównej bazie: ponowny odczyt/kwalifikacja, dodatkowe
źródła i wybór pełniejszych cytatów, przegląd dosłownych dowodów i wyjaśnienie
tożsamości. Bez zmian kodu/generatora, builda lub zależności. **104/104 READ**
w zarejestrowanych próbach odczytu URL (obejmują ponowienia różnych faz,
nie 104 niezależne witryny); dodatkowo 2 READ polityk dla powiązania marek.
**48 wywołań modelu OK, zero błędów modelu**. 22 przebiegi: 21 COMPLETED,
jeden początkowy przypadek tożsamości przerwany i zachowany jako CANCELLED
z błędem elementu TARGET_IDENTITY_REVIEW_REQUIRED; nie pominięto go w raporcie.

**14 nowych szkiców v1; 114 firm / 85 kontaktów / 52 szkice → 114/85/66.**
Wszystkie GENERAL, bez przepisywania na RECRUITMENT; kod PASS, review
COMPLETED/supported=true/issues=[], binding issues=[], uwagi stylistyczne=[]
w końcowym audycie. Status NEEDS_REVIEW bez zgody na wysyłkę. Zapytania nie
potwierdzają nieznanych warunków; część odnosi się do opublikowanych ofert
i pyta o możliwość współpracy przy zatwierdzonej dostępności. Pełne dokładne
treści, źródła i wszystkie ostrzeżenia poza Git. Projekt wybrany tylko
z zatwierdzonych faktów; brak wyboru w zawężonym kontekście nie oznacza
utraty trzech zatwierdzonych projektów w pełnym profilu.

Dwa końcowe uzupełnienia użyły pełnych dosłownych akapitów opisujących
własne usługi firmy, zamiast zbyt wąskiego wycinka. Nie zmieniano warunków,
kontaktu lub materiałów kandydata. Uzupełniona analiza przeszła te same
validateAnalysis/resolveInquiryBasis/contactEligibility, natywną kwalifikację,
generowanie i review. Cztery przypadki nadal nie przechodzą obecnego
resolvera mimo udokumentowanej własnej aplikacji/systemu lub działalności
programistycznej; formy językowe opisano w TASKS i prywatnym raporcie.
To ograniczenie rozpoznawania dowodu, nie odmowa firmy lub nieudany odczyt.
Reguły nie zostały poluzowane, nie zapisano dla tych czterech gotowych szkiców.

W jednej parze potwierdzono wspólnego administratora i adres. Początkowa
próba zatrzymała zmianę tożsamości; po sprawdzeniu obu lokalnych historii
utworzono jeden szkic pod istniejącym rekordem drugiej marki. Oba rekordy
i historia zachowane, bez scalenia/usunięcia lub dwóch wiadomości. Przed
przyszłą wysyłką nadal potrzebne uporządkowanie reprezentacji tej pary;
114 to liczba rekordów, nie ostateczna liczba niezależnych podmiotów.

Końcowy audyt readonly obejmuje stan sprzed całej operacji: **0 zmian
chronionych tabel/stanu, starych 52 szkiców/wersji/materiałów oraz historii
firm**. Zatwierdzony profil v4/9 faktów, CV/hash, blokady, trwała granica,
shared i 5 SELF_TEST/outbox/usage zachowane. Spójne backupy przed/po każdej
fazy; końcowy zgodny z 51 tabelami, integrity=ok, FK=0. Fingerprint 134 zgodny.
DisabledMailProvider i brak gateway Gmaila. Bez odczytu poczty, OAuth,
zmian konta/liczników, wysyłki lub AUTO_POLICY. Końcowo RESEARCH_ONLY,
stopped=true, paused=true, senderPaused=true, aktywne runs/jobs=0,
nierozstrzygnięty outbox=0, blokada profilu zwolniona.

# Dokończenie dwóch znanych firm — Windows RESEARCH_ONLY, 15 października 2026

Na jawne zlecenie użytkownika odczytano ponownie 6 publicznych stron dwóch
znanych firm (**6/6 READ**), zweryfikowano kontakt/przeznaczenie, lokalną
historię i blokady. Dwa celowane przebiegi **COMPLETED / DRAFTS_READY**,
po jednym kandydacie; **6/6 EXTRACT/DRAFT/SEMANTIC_REVIEW OK**, bez błędów.
Bez wyszukania kolejnych firm. Biblioteka **114/85/50 → 114/85/52**.
Dwa nowe szkice v1: otwarta kandydatura na RECRUITMENT oraz zapytanie
na GENERAL; rodzaj kontaktu zachowany, bez potwierdzonego wakatu IT lub
warunków zdalności/wymiaru pracy. Nie deklarują zgodności z nieznaną ofertą.

Oba szkice **kod PASS, review COMPLETED, supported=true, issues=[]**,
bez problemów powiązań i uwag stylistycznych; **NEEDS_REVIEW** zachowane.
Dla obu wybór projektu dał NO_PROJECT_MATCH. Ostrzeżenie modelu o braku
opisów projektów w jednym szkicu dotyczy zawężonego kontekstu generowania;
pełny profil nadal ma 9 zatwierdzonych faktów, w tym 3 projekty. Nie zmieniano
generatora ani materiałów, nie dopisywano kompetencji. Nie ustalono jednej
historycznej przyczyny wcześniejszego pominięcia tych dwóch szkiców.

Natywny ResearchJobHunter z DisabledMailProvider, bez gateway Gmaila,
workera okresowego lub wysyłki. **Chronione tabele i stan bez zmian**,
50 dawnych szkiców, ich wersje i materiały zachowane. Profil v4/9 APPROVED,
CV/hash, historia, blokady/granica, shared i **5 SELF_TEST/outbox/usage**
zachowane. Spójne backupy przed/po zgodne ze wszystkimi 51 tabelami;
integrity=ok, FK=0. Fingerprint 134 plików kodu zgodny, kod/build bez zmian.
Końcowo RESEARCH_ONLY, stopped=true, paused=true, senderPaused=true,
brak aktywnych runs/jobs i nierozstrzygniętego outbox, blokada zwolniona.
Pełne wiadomości, dowody i ostrzeżenia w prywatnym raporcie poza Git.
Zakres obejmuje research i szkice, nie gotowość do rzeczywistej wysyłki
ani kontrolę wcześniejszej korespondencji firm w Gmailu.

# Pokrycie firm szkicami — audyt readonly, 15 października 2026

Główna biblioteka: **114 rekordów firm, 85 firm z kontaktem, 85 kontaktów
(84 różne adresy), 50 firm z 50 szkicami**. Bez szkicu 64 firmy: 29 nie ma
zapisanego emaila, 35 ma kontakt. Dla tych 35 obecne lokalne reguły i ich
najnowsze zapisane analizy dają: **25 CONTACT_NOT_ALLOWED, 8 REJECTED,
2 przechodzą kontrole wstępne**. Pierwsza grupa obejmuje nieodpowiednie lub
niepotwierdzone przeznaczenie oraz brak zweryfikowanej podstawy zapytania;
GENERAL sam w sobie nie jest zakazany. W grupie bez adresu także pojedyncza
blokada historyczna i pojedyncza odrzucona oferta; kategorie powodów nie
są tożsame z samą obecnością emaila.

Dwa przypadki bez szkicu wymagają dokończenia weryfikacji. Jeden nie ma
zapisanej dyspozycji, drugi ma dawną CONTACT_NOT_ALLOWED, mimo pozytywnej
oceny obecnymi regułami wstępnymi. Aktywne researchDeferred=0. Nie ustalono
jednej przyczyny technicznej, nie wykonano generowania lub modelu i nie
przypisano im pełnej gotowości do wysyłki. Audyt używał readonly SQLite
i metod walidujących bez konstruktorów Store/service, sieci/Gmaila,
zmian danych lub kodu. Szczegóły firm i wyników wyłącznie poza Git.

# Dwie rzeczywiste próby SELF_TEST — 15 października 2026

Operacja na domowym Windowsie po osobnej zgodzie na dwa konkretne podglądy
i celowane potwierdzenia w Wysłanych. Istniejący nadawca/OAuth i zatwierdzone
materiały, bez nowego połączenia lub uprawnień. Natywny GmailJobHunter w
APPROVAL_REQUIRED, bez uruchamiania workera/researchu; świeże podglądy kolejno
dla każdego odbiorcy. Zweryfikowano pojedynczy adres, brak CC/BCC, dokładny
temat/tekst i zgodność części MIME/PDF z zaakceptowanym prywatnym podglądem.

Wysyłki **08:16:39 i 08:16:41 Europe/Warsaw**, obie **SENT_CONFIRMED**
po odczycie metadanych konkretnych identyfikatorów w Wysłanych. Jedna próba
POST dla każdej, bez ponawiania i bez błędów operacji/audytu. Nie odczytywano
historii firm lub pozostałej poczty. Użytkownik następnie zgłosił: jeden
odbiorca WP — **Odebrane**, jeden odbiorca Gmail — **Spam**; CV poprawnie
otwiera się u **2/2 odbiorców**. To zgłoszenie użytkownika, bez odczytu ich
skrzynek. Wynik mieszany; problem spamu w Gmailu nadal występuje w tej próbie,
przyczyna nie została ustalona. Nie wykonano dodatkowych wysyłek lub zmian.

Przed/po spójne backupy SQLite: wszystkie 51 tabel zgodne z odpowiednim
stanem, integrity=ok, FK=0. **0 zmian dawnych rekordów**, brak nieoczekiwanych
zmian tabel; kampania zmieniła tylko policy_version wskutek wyboru dwóch
adresów testowych. 3 wcześniejsze SELF_TEST zachowane; outbox/attempts/usage
**3 → 5**, dzienne wykorzystanie **0 → 2**, bez resetowania liczników.
Firmy/kontakty/szkice **114/85/50** i liczba wywołań modelu bez zmian.
Profil v4, 9 zatwierdzonych faktów, PDF/hash, historia, blokady, granica
kampanii i shared records zachowane. Fingerprint 134 plików kodu zgodny.
Końcowo **RESEARCH_ONLY**, stopped=true, senderPaused=true, research inactive,
0 aktywnych runs/jobs i 0 nierozstrzygniętych outbox; profil odblokowany.
Bez wiadomości do firm i AUTO_POLICY. Pełne podglądy, zgoda, wyniki i backupy
prywatne poza Git; repo zawiera wyłącznie powyższe wyniki zbiorcze.
Zakres to operacyjne SELF_TEST, bez zmian kodu/generatora i bez dodatkowego
researchu; nie jest wynikiem pilotażu do firm i nie dowodzi ogólnej
dostarczalności do skrzynek innych odbiorców.

# Nocny RESEARCH_ONLY w głównej bazie — wynik, 15 października 2026

Sesja zakończyła się jako **DEADLINE**, **15 października 04:36:04.011
Europe/Warsaw**, przy pierwotnym terminie 04:36:03.740. Od startu
14 października 20:36:03.740 upłynęło **8 h 0,271 s**. Nie jest to osiem godzin
ciągłej pracy obliczeniowej: kierunki co godzinę, zaplanowane przerwy i ręczna
naprawa początkowego uruchomienia, z przerwą **5 min 48,968 s**. Wykonano
**8/8 cykli COMPLETED**, również po ostatnim cyklu czekano do stałego deadline.
Suma okien started_at/finished_at około 42 min 18 s obejmuje tę przerwę;
po jej odjęciu około 36 min 29 s, bez interpretacji jako pomiar CPU.
PID zakończone, blokada profilu zwolniona, stopped=true, DAY_FINISHED,
brak aktywnych/PAUSED runs i aktywnych jobs. Windows boot sprzed sesji;
brak wpisów Kernel-Power 42/107 w jej przedziale. To ograniczona kontrola
zdarzeń zasilania, nie pełny audyt uśpienia. Rano nie wznowiono pracy.

**40 nowych rekordów firm, 33 nowe rekordy kontaktowe, 19 nowych wiadomości.**
Stan głównej biblioteki: **74 → 114 firm, 52 → 85 kontaktów, 31 → 50 szkiców**.
Zapisy już w głównej SQLite, bez kolejnego scalenia. W zakresie 8 runIds:
50 wpisów kandydatów, 47 różnych URL, 44 rekordy firm (40 nowych, 4 wcześniej
znane), 21 szkiców w eksporcie, z których **2 stare nie doliczone do 19 nowych**.
Jeden stary szkic dostał wersję 2 przy odświeżeniu powiązania kwalifikacji;
temat i treść identyczne, wersja 1 i jej materiały zachowane. Wszystkie
31 wcześniejszych tematów/treści i wszystkie wcześniejsze wersje nienaruszone.
Trzy BUDGET_DEFERRED wróciły i dostały szkice; na końcu brak aktywnego
researchDeferred. Wrócił także szkic odłożony we wcześniejszej próbie.

Poranny audyt przez readonly SQLite i istniejące walidatory, bez konstruktorów
Store/service lub providerów: **47/47 pełnych analiz**, **19/19 nowych szkiców**
kod PASS, review COMPLETED, supported=true, issues=[], aktualne powiązania
bez problemów; dwie stare użyte ponownie również mają poprawne powiązania.
Metadane contactUrl w nieukończonych odczytach nie są traktowane jako analiza.
NEEDS_REVIEW zachowane; ten wynik nie zatwierdza wysyłki lub warunków pracy.
Wiadomości mają konkretne nawiązania do firm; brak dopasowania projektu
nie usuwa zatwierdzonych projektów z pełnego profilu. Ostrzeżenia o zawężonym
kontekście NO_PROJECT_MATCH zachowane wraz z pozostałymi zastrzeżeniami.

Nowe kontakty: **22 GENERAL, 6 RECRUITMENT, 4 UNKNOWN, 1 SALES**, wszystkie
z literalnym dowodem. UNKNOWN i SALES pozostają wykluczone z wysyłki.
Nowe szkice: **16 GENERAL, 3 RECRUITMENT**. UNKNOWN warunków/rekrutacji
nie przepisano na potwierdzone. Brak duplikatów kluczy domeny/normalized_key,
firma+email i kampania+firma. **Jedna para różnych nazw/domen ze wspólnym
literalnym adresem pozostaje do wyjaśnienia**; nie scalano ani nie kasowano
jej rekordów. 33 nowe kontakty obejmują **32 adresy nowe względem starej
biblioteki**. Nie ogłaszać 40 rekordów jako 40 potwierdzonych niezależnych
podmiotów ani deduplikacji tożsamości jako zakończonej. Szczegóły poza Git.

Wyniki pozycji: DRAFTED 19, REUSED 2, BUDGET_DEFERRED 3, CONTACT_NOT_ALLOWED 11,
REJECTED 6, NO_CONTACT 6, NO_READABLE_SOURCE 3. Trzy nieczytelne przypadki
nie są odmowami firm: dwa z początkowego problemu TLS, jeden z HTTP 526.
W 166 użytych rekordach źródeł **159 READ i 7 nieudanych**: TLS_UNTRUSTED 3,
HTTP_ERROR/526 2, ACCESS_BLOCKED 1, NOT_FOUND/404 1; nie sumować każdej
podstrony jako osobnej nieudanej firmy. **Zero błędów modelu i końcowych
błędów cyklu**, początkowy READER_ENVIRONMENT pozostaje w historii.
W cyklach 89 wywołań, osobno 2 probe; 163 odczyty, 7 cache, 178 HTTP,
16 przekierowań. Przyrost research_sources 160, użyto też wcześniejszych
rekordów. Pomiary CLI: input 2410243, output 97808, cached input 667520;
bez przeliczania na koszt lub limit konta.

**changedProtectedTables=[], changedOldVersions=[], protectedStateChanged=[]**.
Profil v4, 9 APPROVED faktów, odłożony fakt, zatwierdzone CV i PDF/hash,
historia/blokady/granica kampanii bez zmian. Zachowane 3 dawne SELF_TEST,
outbox=3, usage=3, shared attempts/usage=0; nowe próby/outbox/usage=0.
Rano niezależnie zweryfikowano oba spójne backupy, **51/51 tabel zgodnych**
z odpowiednim stanem, integrity=ok, FK=0. Fingerprint **134 plików kodu
bez zmian**. Nie wykonywano nowego buildu lub npm run check; obecny zakres
to rzeczywista sesja i niezależny audyt jej danych, nie nowy zestaw regresji.

Pełny czytelny raport prywatny zawiera 44 rekordy firm z kontaktami/dowodami,
19 dokładnych nowych wiadomości i 2 starsze użyte ponownie, wszystkie
ostrzeżenia/błędy/pominięcia oraz otwartą parę do weryfikacji. Porównano
literalne tematy/treści z główną bazą; audyt nie zmienił jej hashy. Wszystkie
prywatne artefakty poza Git. **Zero Gmaila/skrzynek/OAuth, tokenu panelu,
sekretów, wysyłki lub nowego Start**. AUTO_POLICY wyłączone; następny
SELF_TEST/pilot wymaga konkretnego podglądu i osobnej zgody.

Po przygotowaniu końcowego raportu poranna automatyzacja ustawiona PAUSED;
zapis potwierdzony, godzinny monitor również PAUSED. Bez zaplanowanego
wznowienia researchu lub wysyłki.

# Nocny RESEARCH_ONLY w głównej bazie — start, 14/15 października 2026

Na wyraźne polecenie użytkownika uruchomiono istniejącą 8-godzinną sesję
Windows RESEARCH_ONLY, zapisując bezpośrednio w głównej lokalnej bibliotece.
Początek **14 października 20:36:03.740 Europe/Warsaw**, stały deadline
**15 października 04:36:03.740**, różnica dokładnie 28 800 000 ms.
Kierunki co 60 minut, maxCycles=null; zachowane ograniczenia pracy cyklu
(maks. 20 kandydatów, 20 min, do 3 szkiców), bez limitu ośmiu cykli
skrótowo zastępującego czas. Kierunki doprecyzowano do kolejnych firm
i oficjalnych kontaktów do pracy, z wykorzystaniem kontekstu istniejącej
biblioteki i deduplikacji aplikacji. Odłożone szkice mogą wrócić zgodnie
z dotychczasowymi regułami. Wynik pełnej nocy pozostaje **do sprawdzenia**.

Pierwszy start faktycznie zatrzymał się **20:37:00.380**, po **56,640 s**,
na READER_ENVIRONMENT; trzy niezależne hosty TLS_UNTRUSTED /
UNABLE_TO_VERIFY_LEAF_SIGNATURE. Launcher pominął `--use-system-ca`, stosowaną
we wcześniejszym Windows preflight. Sprawdzono obsługę flagi zainstalowanego
Node; z nią publiczny reader ma **3/3 READ, systemCA=true**, bez zmiany
certyfikatów Windows, wyłączania TLS lub osłabienia SSRF/DNS pinning.
Po zamknięciu pierwszego procesu w bieżącym zleceniu poprawiono tylko
prywatny launcher i ręcznie kontynuowano checkpoint **20:42:49.388**.
Ten sam sessionId, runId i pierwotny deadline **04:36:03.740**; bez przedłużenia
czasu, kasowania błędów, nowych zgód lub resetu liczników. Początkowy raport,
audyt i backup zachowane poza Git. Po poprawce nowe firmy/kontakty są już
w głównej bazie; changedProtectedTables=[], stare wersje i chroniony stan
bez zmian, nowe próby/usage=0, integrity=ok, FK=0. W raporcie końcowym
uwzględnić przerwę oraz zachowane błędy TLS; nie przedstawiać ich jako odmów
firm ani zaliczać pełnych ośmiu godzin nieprzerwanej pracy. Metadane
contactUrl w READ/PENDING nie są ukończoną analizą — eksport prywatny
odróżnia je od wyników walidacji faktycznej analizy.

Przygotowanie: brak aktywnego backendu/researchu/sendera, profil WORKSTATION
na Windowsie i LOCAL_ONLY; punkt odniesienia **74 firmy, 52 kontakty, 31 szkiców**.
SQLite backup API przed otwarciem pod wyłączną blokadą profilu: integrity=ok,
51/51 tabel zgodnych; brak oczekujących migracji. Zatwierdzony profil v4,
9 faktów APPROVED i zatwierdzone CV/PDF/hash zgodne. Fingerprint kodu zgodny
z wcześniejszym pełnym Windows check; bez zmian aplikacji/generatora, build,
zależności, konta lub uprawnień. Natywny CLI obsługuje wymagane flagi,
istniejące logowanie ChatGPT; rzeczywiste codex/search probes PASS.

Po otwarciu brak samoczynnej pracy, stopped/paused potwierdzone; dopiero
zlecony `startDay(...,8)` uruchomił nową sesję. Proces używa wyłącznie
ResearchJobHunter + DisabledMailProvider, bez gateway/Gmaila/send. Trzy
wcześniejsze SELF_TEST/outbox/usage i shared attempts/usage=0 zachowane.
Zapis postępu i pełnego raportu poza Git, kontrola chronionych tabel/starych
wersji szkiców/materiałów, zachowanie stałego deadline. Nie tworzono tokenu
panelu ani nie odczytywano dotychczasowego. Bez autostartu/wznowienia po
awarii, restartu procesu lub zmiany zasilania Windowsa.

Poranny raport w tej rozmowie ustawiony na **15 października 07:00**;
przy przerwaniu tylko rekonstrukcja readonly, bez uruchomienia kolejnego
researchu. Nie zaliczać pełnych 8 godzin, powodzenia deduplikacji całej
sesji lub liczby nowych wyników na podstawie samego poprawnego startu.
Gmail/pilot nadal odłożone; AUTO_POLICY wyłączone.

# Scalenie biblioteki researchu — 14 października 2026

Na wyraźne zlecenie użytkownika scalono wyłącznie nowe wyniki dwóch zakończonych
prób do głównej lokalnej bazy Windows: **14 firm, 12 literalnie potwierdzonych
kontaktów GENERAL, 8 szkiców NEEDS_REVIEW**. Stan głównej biblioteki:
**60 → 74 firmy, 40 → 52 kontakty, 23 → 31 szkiców, 230 → 281 źródeł**.
Import objął 17 wpisów researchu, 7 zakończonych przebiegów, dowody/kwalifikacje,
wersje wiadomości, wyniki kontroli i potrzebne metadane. Zachowano UUID i
powiązania z zatwierdzonym profilem; nie kopiowano całej bazy diagnostycznej,
zgód na wysyłkę, prób, outbox, limitów ani konfiguracji Gmaila.

Przed zapisem stopped=true, bez aktywnych runs/jobs/outbox; istniejąca blokada
profilu przejęta wyłącznie po potwierdzeniu zakończenia poprzedniego procesu.
Spójny backup SQLite API przed i po operacji, poza Git, **51/51 tabel zgodnych**
z bazą w danym momencie. Główne scalenie jedną transakcją IMMEDIATE.
`integrity_check=ok`, `foreign_key_check` bez naruszeń. Brak duplikatów domen,
kluczy firm, kontaktów firma+email i szkiców kampania+firma; żaden nowy adres
email nie występował wcześniej w głównej bibliotece.

Weryfikacja na osobnych kopiach przed właściwym zapisem: pełne scalenie PASS;
ponowny import **0 zapisów**, wszystkie hashe bez zmian; wymuszony błąd po
20 zapisach wycofał całą transakcję; konflikt domeny/tożsamości odrzucił import
bez częściowego zapisu. Po zapisie w głównej bazie **17/17 analiz i 8/8 szkiców**
sprawdzone istniejącymi walidatorami, bez providerów/modelu/sieci. Dokładne
tematy/treści/wersje/hashe i powiązania materiałów zgodne; 8/8 kod PASS,
review COMPLETED, supported=true, issues=[]. NEEDS_REVIEW pozostaje bez zgody
na wysyłkę. Przyczyny wcześniejszych pominięć i jedno odłożenie zachowane.

Wszystkie wcześniejsze rekordy zachowane dokładnie, poza jawnym wyrównaniem
pomocniczego `analysisOperationSequence` **79 → 91** do utrwalonych analiz.
To porządek analiz, bez resetu limitów/wysyłek lub odnowienia granicy kampanii.
**changedProtectedTables=[]**: profil v4, 9 APPROVED faktów, odłożony fakt,
CV/PDF/hash, historia/blokady, 3 wcześniejsze SELF_TEST/outbox/usage,
shared attempts/usage=0 i dane polityk bez zmian. Dawne 23 szkice i wersje
zachowane. Obie źródłowe bazy diagnostyczne mają identyczne hashe do stanu
przed scaleniem. Zapisano jawny audit/receipt importu.

Pełny raport prywatny z 14 firmami, kontaktami, dowodami, zastrzeżeniami i
8 dokładnymi wiadomościami odczytany już z głównej bazy; eksport readonly
nie zmienił jej hashy. Raport, helper jednorazowej operacji, audit i backupy
poza Git. Nie zmieniano kodu aplikacji/generatora, zależności ani schematu;
fingerprint kodu zgodny z wcześniejszym pełnym Windows check. Nie uruchamiano
nowego `npm run check`; zakres obecnej weryfikacji to powyższe testy operacji
danych, a poprzedni wynik 461 backend / 12 performance / 15 UI pozostaje
wynikiem wcześniejszego etapu. **RESEARCH_ONLY, stopped=true, STOPPED**;
zero Gmaila/skrzynek/OAuth, tokenu panelu, nowych rezerwacji, wysyłek lub Start.
Etap Gmaila odłożony przez użytkownika; AUTO_POLICY wyłączone.

# Godzinna diagnostyka po poprawkach — wynik, 14 października 2026

Rzeczywista sesja na Windowsie trwała **18:15:02.030–19:15:02.367 Europe/Warsaw**,
60 min 0,337 s z przerwami zgodnymi z tempem. Osiągnięto zapisany DEADLINE,
kontroler i procesy zakończone, stopped=true. To osobna diagnostyka z zewnętrznym
kontrolerem i procesami po Stop, nie natywna sesja 8 h lub test restartu Windowsa.
Użyto pełnej spójnej kopii lokalnej historii, zatwierdzonego profilu v4/9 faktów
i zatwierdzonego PDF poza repo. Kod nie był zmieniany podczas pracy.

**6/6 cykli COMPLETED, 12 wpisów kandydatów, 9 różnych firm/URL, 6 nowych
pełnych szkiców.** Wyszukiwarka probe PASS; 7/7 procesów (probe + sześć cykli)
potwierdziło poprzedni Stop, bezczynność stopped/paused po otwarciu przed
jawnym startem i wyłączony transport. W każdym po zakończeniu wykonano Stop
i zamknięto proces; chronione tabele bez zmian. Wszystkie szkice to PROSPECT /
GENERAL / COMPANY_INQUIRY, bez potwierdzonego naboru lub warunków pracy.

Trzy wcześniej odłożone firmy wróciły po ponownym otwarciu procesu i dostały
szkic z dokładnie tymi samymi sourceIds. **9 EXTRACT dla 9 różnych firm**:
bez ponownej ekstrakcji przy tych trzech powrotach. Jedna firma pozostaje
BUDGET_DEFERRED z ostatniego cyklu. Dwie pominięto: brak potwierdzonego emaila
oraz brak zaakceptowanego aktualnego dowodu działalności do zapytania. Brak
podwójnych szkiców/domen i konfliktów z zapisaną lokalną historią; Gmaila nie
odczytywano, więc wynik nie potwierdza kompletności historii spoza SQLite.

**Zero błędów cyklu, źródeł i modelu.** 29 zapisanych rekordów READ i fetches,
34 HTTP, 5 przekierowań, zero HTTP cache hits. Cache analizy odłożonych firm
jest osobnym mechanizmem. 27 wywołań w cyklach: 6 SEARCH, 9 EXTRACT, 6 DRAFT,
6 SEMANTIC_REVIEW; osobno jeden probe. Pomiary CLI: input 947710, output 22892,
cached input 366208; bez przeliczania na cenę lub zużycie limitu konta.

Readonly audyt po końcu: **6/6 kod PASS, review COMPLETED, supported=true,
issues=[]**, ponowne checkDraft i draftMaterialIssues bez problemów. Wersje,
zatwierdzone fakty, źródła i literalne kontakty zweryfikowane. Zapisane warnings
zachowane w eksporcie i przy dokładnych wiadomościach. Jedno ostrzeżenie mówi
o braku opisów projektów w zatwierdzonych faktach: kontekst tej wiadomości
zawierał sześć faktów bazowych przy NO_PROJECT_MATCH, a cały profil nadal miał
trzy zatwierdzone projekty. Wyjaśniono zakres w prywatnym raporcie, bez edycji
szkicu lub odtwarzania generacji.

Wszystkie **51 tabel oryginalnej SQLite** mają identyczne hashe do stanu sprzed
zmian i po zakończeniu; integrity=ok. Chronione tabele kopii także identyczne:
profil/fakty/CV, historia/blokady, próby/outbox/usage/shared. Zachowane trzy
dawne SELF_TEST, outbox=3, usage=3, shared attempts/usage=0, Fingoweb blokowany,
granica kampanii bez zmian. Oryginalny i skopiowany PDF zatwierdzone i zgodne
z zapisanym SHA. Końcowy spójny backup diagnostyki integrity=ok; wszystkie jego
tabele identyczne z końcową bazą. Fingerprint 134 plików kodu zgodny z check.
Zero nowych rezerwacji/wysyłek, Gmaila/OAuth lub zmian nadawcy/uprawnień.

Pełny czytelny raport z 9 firmami, 6 dokładnymi tematami/tekstami, ostrzeżeniami,
pominięciami i dowodami, audyt, cykle oraz backup zachowano wyłącznie poza Git.
Porównanie tekstów raportu do wszystkich 6 szkiców PASS. Wynik dopisano do
dokumentacji; bez ponownego pełnego check dla samych odczytów/raportu/dokumentacji.
Monitor po jednorazowym końcowym raporcie ma PAUSED, potwierdzone lokalnie.
Gmail/SELF_TEST, celowana historia firm i pilotaż pozostają odrębnym etapem
z wymaganymi konkretnymi zgodami; AUTO_POLICY nadal wyłączone.

# Poprawki kontaktów i raportowania — 14 października 2026

Na polecenie „działaj” wdrożono dwie celowane poprawki. Zwykłe pytania pod
adresem GENERAL zachowują GENERAL_INQUIRY; literalne pytania o rekrutację lub
pytania pod RECRUITMENT nadal nie upoważniają do aplikacji z CV. Odmowy CV,
ograniczenia kanału, sprzedaż i pozostałe wykluczone przeznaczenia pozostają
blokujące. Zneutralizowano komunikat, który nazywał GENERAL rekrutacyjnym.
Analiza ma policy v8: starszy kompletny pakiet nie dostaje automatycznego reuse
bez nowej kwalifikacji według bieżących reguł. Nie zmieniano generatora/stylu.

Raport TXT/JSON czyta zapisane warnings właściwego research_draft, usuwa tylko
identyczne powtórzenia i pokazuje dokładny wynik oceny przeznaczenia kontaktu.
Regresja obejmuje zakres jednej sesji, pełny niezmieniony temat/tekst, brak
zastrzeżeń obcej firmy/cyklu oraz brak zapisów raportu do SQLite. Cztery nowe
testy: trzy FAIL przed zmianą, potem celowany zestaw **41/41 PASS**; negatywne
przypadki nie zostały rozluźnione. Zapisany rzeczywisty przypadek oceniono
wyłącznie w pamięci nad readonly SQLite, bez modelu/sieci/zmiany rekordu:
GENERAL pozostaje GENERAL, wynik COMPANY_INQUIRY dopuszczony po dowodach.
Prywatny eksport wcześniejszej krótkiej sesji ma oba dokładne teksty i wszystkie
zapisane ostrzeżenia. Nie ponawiano generacji ani odczytu stron w tym audycie.

Końcowy pełny `npm run check` na fizycznym Windowsie: **461/461 backend,
12/12 performance Stop, 15/15 UI, typecheck/build PASS**, exit 0, brak skipped.
Backend 711163 ms, performance 17562 ms, UI 49,7 s. Pierwsza próba zatrzymała
się na TS7006: brak jawnego typu nowego pola warnings; dodano warnings:string[]
i powtórzono pełny check. Nie zaliczać pierwszej próby jako PASS. Doctor
DEVELOPMENT/DEMO PASS: win32/x64, Node 24.19.0, SQLite 3.53.4, CLI
0.162.0-alpha.17.2. Fingerprint 134 plików kodu/konfiguracji/testów zgodny
przed/po. Istniejące niezacommitowane zmiany zachowane; bez push/deploymentu.

Przed zmianami brak aktywnego prywatnego backendu, spójny backup przez SQLite
backup API z readonly uchwytu poza repo. Końcowe hashe wszystkich 51 tabel
oryginalnej SQLite identyczne; integrity=ok, 9 APPROVED, zatwierdzony PDF/hash
zgodny, 3 dawne próby/outbox. Sprawdzono wyłącznie lokalne metadane istniejącej
konfiguracji Gmaila; bez odczytu skrzynki, vault/sekretów, OAuth, zmiany nadawcy,
nowych rezerwacji lub wysyłek. Dane nadawcy i prywatne logi/eksporty poza Git.

**Godzinny test rzeczywisty trwa**, rozpoczęty 18:15:02 Europe/Warsaw,
deadline 19:15:02. Spójna osobna kopia pełnej historii i zatwierdzonego PDF,
RESEARCH_ONLY z DisabledMailProvider i bez gateway. Kontroler testu jawnie
uruchamia do 6 cykli co 10 minut, do 2 kandydatów i 1 szkicu/cykl; po każdym
Stop kończy proces, następny restart ma pozostawać bezczynny do jawnego startu.
To ograniczona diagnostyka z zewnętrznym kontrolerem, nie natywna sesja 8 h.
Probe wyszukiwarki PASS, restartIdleVerified=true i chronione tabele bez zmian
po probe i pierwszym cyklu. Cykl 1 COMPLETED 18:17:43: 2 firmy, 1 nowy szkic,
druga firma BUDGET_DEFERRED, 7 źródeł READ, 8 HTTP, zero błędów źródeł/modelu;
restartIdleVerified=true, kontrolowany Stop i zakończenie procesu. Wynik godziny, dalszych restartów,
odłożeń/deduplikacji nie jest jeszcze zaliczony. Raport/stan/końcowy backup
poza Git. Heartbeat ma przekazać jednorazowy wynik lub przerwanie bez nowego
Start/Gmaila i potem się wyłączyć. SELF_TEST/pilot czekają na konkretny
podgląd i osobne uprawnienie do wysyłki; AUTO_POLICY pozostaje wyłączone.

# Krótki publiczny test nowej wersji — 14 października 2026

Na wyraźne zlecenie użytkownika wykonano rzeczywisty Windows RESEARCH_ONLY
z limitem 5 firm i 15 minut, obejmującym sprawdzenie wyszukiwarki. Windows
win32/x64, Node 24.19.0; 17:35:42–17:41:16 Europe/Warsaw, **5 min 34 s**.
Użyto aktualnego builda po pełnym check, fingerprint 134 plików źródeł,
konfiguracji i testów zgodny przed/po próbie. Nie zmieniano generatora/kodu.

Przed startem oryginalna SQLite integrity=ok, zatrzymany backend, brak aktywnych
cykli. Profil v4 i 9 faktów APPROVED, jeden projekt DEFERRED; zatwierdzony PDF
z prawidłowym SHA. SQLite backup API z readonly uchwytu utworzyło spójną osobną
kopię poza repo; dołączono kopię wyłącznie zatwierdzonego PDF. ResearchJobHunter
działał w rzeczywistym RESEARCH_ONLY, mail=DisabledMailProvider, bez gateway,
natywnego providera Google, czytania skrzynki lub wysyłki. Bez nowego zatwierdzania
materiałów, zmiany OAuth/nadawcy i tokenu panelu. Nie uruchamiano AUTO_POLICY.

Wyszukiwarka **PASS** z potwierdzonym web_search. Cykl **COMPLETED**, **5 nowych
firm, 2 nowe pełne szkice**, zero przypadków błędów cyklu, źródeł lub modelu.
22 zapisane rekordy READ, 22 fetches, 1 cache hit, 26 HTTP i 4 przekierowania;
10 wywołań modelu w cyklu i osobny probe wyszukiwarki. Trzy pominięcia:
brak zaakceptowanego dowodu działalności powiązanego z tożsamością, kontakt
QUESTIONS_ONLY oraz brak potwierdzonego emaila. Nie zgadywano adresów ani nie
obchodzono blokad. Nie wymuszano większej liczby szkiców.

Readonly audyt: 5/5 analizy ponownie walidowane, 4/4 znalezione emaile literalnie
potwierdzone; 5 nowych, różnych domen i brak konfliktu z zapisaną lokalną historią.
Bez odczytu Gmaila wynik nie stanowi dowodu braku wcześniejszych kontaktów poza
tą historią. Oba szkice **kod PASS, review COMPLETED, supported=true, issues=[]**;
ponowna kontrola kodu i material binding bez problemów lub ostrzeżeń stylu.
Zapisane zastrzeżenia o niepotwierdzonych warunkach zachowane. Kontakt firmy
z otwartym zaproszeniem pozostaje GENERAL; formularz kariery nie dowodzi
przyjmowania CV na ten email. Szkic jest zapytaniem o współpracę.

Wykryto błąd opisu jednego pominięcia: GENERAL o literalnym przeznaczeniu
„Inne pytania” ma komunikat „Adres rekrutacyjny służy pytaniom”. Typ GENERAL
nie został zmieniony, szkicu nie utworzono. Przypadek zapisano do dalszego
przeglądu; zero błędów technicznych nie oznacza braku tej uwagi jakościowej.

Wszystkie tabele oryginalnej SQLite mają identyczne hashe przed/po, integrity=ok.
Chronione tabele kopii — profil/fakty/CV, historia/blokady, próby/outbox/liczniki
i shared records — też niezmienione. Zachowane 3 dawne SELF_TEST; zero nowych
rezerwacji/wysyłek. Program zatrzymany. Pełne dokładne teksty, firmy, adresy,
źródła, ostrzeżenia, audyt, log i spójny końcowy backup tej diagnostyki zapisano
wyłącznie w prywatnym katalogu poza Git. Treści raportu porównano z oboma
zapisanymi szkicami. Nie wykonywano ponownie pełnego check dla samej operacji
researchu i wpisu dokumentacji.

# Poprawki po nocnym researchu — 14 października 2026

Na polecenie „działaj” zmieniono kod po analizie zapisanych wyników. Literalne
zaproszenia do pracy/CV/resume nie tracą przeznaczenia przez odmianę czasownika;
negacja odnosi się do działania, a pytania do właściwego adresu. GENERAL przy
ACTIVE/OPEN pozostaje zapytaniem. Niedopasowana oferta zachowuje typ i warunki;
odrębne zapytanie wymaga aktualnej, niezależnej podstawy i właściwego kontaktu.
Odmowy, sprzedaż, niewłaściwy kanał i historia nadal blokują.

Badawcza paczka jest kwalifikowana przed wyborem szkiców. Trwała przyczyna
pominięcia odróżnia budżet od blokady; kolejny uprawniony cykl może dokończyć
szkic z cache, także bez ponownego zwrócenia firmy przez wyszukiwarkę. Zmiana
profilu/źródła/kontaktu wymaga kontroli. AUTO zachowuje osobny mechanizm małej,
wznawialnej kolejki i pracę ciągłą bez limitu użytkownika.

Świeżo sprawdzone NEW trafiają do kontekstu wyszukiwania, bez zmiany historii
kontaktowania. SIZE_LIMIT ma pomiar granicy/bajtów i sześciogodzinny cooldown,
z jawnym ponowieniem. Znana literalna podstrona może zastąpić za duży root,
jeśli sama identyfikuje firmę i dowody; błąd root jest zachowany w raporcie,
nie jest dowodem READ. Limit 1 MiB, TLS/SSRF i dekompresja pozostają chronione.
UNVERIFIED_COMPANY zapisuje ograniczoną nazwę/cytat/hash i powód odrzucenia.

Osiem godzin oznacza deadline; licznik ośmiu cykli nie skraca sesji. Deadline
także podczas operacji pozostawia checkpoint i stan zatrzymany. PARTIAL po
ukończonych pozycjach ma koniec; częściowa kolejka AUTO z PENDING pozostaje
wznawialna. Raport TXT/JSON obejmuje treści/wersje/kontakty/dowody/warunki,
powody pominięcia i powiązane błędy. Prywatny zapis jest atomowy, fizyczny
katalog poza repo sprawdzany, finał ma spójny backup. CLI `research:report`
używa readonly SQLite, bez konstruktora Store, migracji lub providerów.

Rzeczywisty Windows: przed zmianami brak aktywnego backendu, backup przez
SQLite backup API z uchwytu readonly, integrity=ok i zgodne hashe wszystkich
tabel. Oryginalna baza miała 60 firm oraz 3 wcześniejsze próby/outbox/liczniki.
Nowe testy używają katalogów tymczasowych, fikcyjnych firm, modeli i poczty;
nie wykonano nowych operacji Gmaila, OAuth, publicznego researchu lub Start.
Zależności i schemat bazy bez zmian. Zachowany styl i dawne prywatne teksty.

Celowane testy: **20/20 PASS**, szerszy wcześniejszy zestaw **131/131 PASS**.
Nowe scenariusze są w `research-night.test.ts`, rozszerzenia kontaktów w
`contact-invitations.test.ts` i `contact-intent.test.ts`. Podczas przygotowania
odtworzono negację zaproszenia oraz doprecyzowano niezależny dowód/odczyt
kontaktu w syntetycznych fixture; końcowe celowane przypadki przechodzą.
Pełny końcowy `npm run check` na fizycznym Windowsie: **457/457 backend,
12/12 performance Stop, 15/15 UI, typecheck/build PASS**, exit=0 i brak skipped.
Backend trwał 638771 ms; szeregowa część wydajności 15839 ms; Playwright 48,8 s.
Fingerprint 134 plików kodu/konfiguracji/testów identyczny przed i po check.
Doctor DEVELOPMENT/DEMO: win32 x64, Node 24.19.0, SQLite 3.53.4,
Codex CLI 0.162.0-alpha.17.2, build gotowy. Nie jest to ponowne uruchomienie
prywatnej instalacji lub nowy publiczny research. CLI eksportu wykonano osobnym
rzeczywistym procesem na fikcyjnej SQLite: pełny tekst, wszystkie tabele bez zmian.

Końcowy readonly audyt oryginalnej historii: wszystkie tabele identyczne z
backupem, integrity=ok, 9 APPROVED, zatwierdzony PDF z niezmienionym hashem,
3 dawne próby/outbox. Prywatny backend nie działa; zero nowej wysyłki, odczytu
poczty, zmian nadawcy/OAuth/liczników lub Start. Logi/backup/hashe poza repo.

Dwa wcześniejsze uruchomienia przerwano świadomie. Kolejny backend zakończył się 456/457:
regresja planera ujawniła zmianę odrzucenia niedopasowanej oferty na NEEDS_REVIEW.
Poprawka zachowuje REJECTED i oddzielnie ocenia podgląd COMPANY_INQUIRY;
syntetyczny generator rozróżnia teraz ten podgląd od kandydatury na wakat.
Końcowy zestaw planera/researchu/kontaktów/stylu: **79/79 PASS**, bez zmiany
dotychczasowych oczekiwań planera. Nie zaliczać nieudanego przebiegu jako check PASS.

# Nocny RESEARCH_ONLY — wynik, 13/14 października 2026

Po wyraźnym poleceniu użytkownika przygotowano jedną 8-godzinną próbę bez
Gmaila/wysyłki. Rzeczywisty Windows: istniejący doctor PASS, build gotowy,
history:local doctor integrity=ok, 3 wcześniejsze SELF_TEST i rezerwacje,
uncertain=0. Spójny backup przed zmianą trybu. Zatwierdzone 9 faktów i profil.

Istniejący ResearchJobHunter.probe('search') na tej instalacji: PASS,
ukończony **22:23:58 Europe/Warsaw**. Potwierdzone narzędzie web_search, kontrolowane
zapytanie o Node.js releases i oficjalny wynik; nie używano danych profilu
w probe. Search capability READY z fingerprintem obecnego CLI. Nie czytano
poczty ani magazynu Google, nie ponawiano OAuth.

Prywatny bootstrap używa niezmienionego createApp/ResearchJobHunter i
standardowych blokad/loopback/panelu obecnego builda. Dodaje wyłącznie
autoryzowany startDay(8) i raport operacyjny poza repo; kod produktu,
zależności, styl oraz generator niezmienione. RESEARCH_ONLY, WORKSTATION,
system CA, DisabledMailProvider i brak Gmail gateway. Nie pobierano lub
przekazywano tokenu panelu do Codexa; panel otwarto standardowym open.mjs.

Polityka wykonywania poleceń odrzuciła komendę ukrytego Start-Process
przed wykonaniem (`blocked by policy`, brak szczegółowego powodu). Kontrolowane
uruchomienie w utrzymywanej sesji terminala przeszło; bez eskalacji, zmiany
ustawień zasilania, autostartu lub automatycznego restartu.

Rzeczywisty Start **13 października 22:32:16 Europe/Warsaw**, planowany deadline
**14 października 06:32:16**, do 8 małych cykli około raz na godzinę. Health=ok,
mode=RESEARCH_ONLY, proces żywy. Początkowa kontrola: active=true, EXTRACT,
10 kandydatów, 10 zapisanych publicznych źródeł, jedna firma/jeden nowy szkic,
4 wywołania modelu i 0 zapisanych błędów. To snapshot początku, nie wynik nocy.

Raport TXT/JSON i status aktualizowane co 30 s poza repo. Zawierają firmy,
kandydatów, dokładne pełne teksty, rodzaj kontaktu, źródła, kontrole semantyczne,
uwagi oraz błędy runs/items/models/sources. Odczyt snapshotu sprawdzony na
readonly SQLite przed startem; składnia prywatnych helperów PASS. Nie jest to
regresja generatora ani nowy npm run check; ostatni pełny check niezmienionego
kodu pozostaje Windows 439/12/15 PASS.

Początkowe porównanie hashy: outbox/send_attempts/usage/history/suppressions/
shared records/profil/fakty/CV/granica kampanii identyczne; zero nowych wysyłek.
Watcher kończy autoryzowaną pracę na deadline, Stop, błędzie lub zmianie chronionego
stanu; zapisuje raport/backup i nie wznawia sesji. Właściwy tryb może zakończyć
się wcześniej po 8 cyklach lub limicie/błędzie; nie deklarujemy pełnych 8 godzin.

Heartbeat w tym czacie na **14 października 07:00 Europe/Warsaw** zapisany
ACTIVE, jednorazowy poranny raport. Bez dostępu do Gmaila lub sekretów,
wznowienia sesji, wysyłek lub AUTO_POLICY. Wymaga dostępnego komputera i app.
Powyższe opisuje stan uruchomienia; poniżej właściwy końcowy wynik.

## Zakończenie i weryfikacja po restartach Windowsa

Sesja zakończyła się **14 października 05:39:53 Europe/Warsaw** jako DAY_FINISHED,
po ośmiu zaplanowanych cyklach: **6 COMPLETED i 2 PARTIAL**. Ostatni cykl ukończony
05:39:47, raport/backup zapisane 05:39:53. Rzeczywisty czas od startu około
**7 godzin 8 minut**, nie pełne osiem godzin; istniejący RESEARCH_ONLY kończy
się także po maxCycles=8. Nie był to limit Codexa lub przerwanie przez restart.

Windows zapisał zamknięcie 05:44:54 i uruchomienie 05:45:12, następnie kolejne
zamknięcie/uruchomienie około 05:46. Zdarzenie User32 1074 o 05:46:35 wskazuje
TrustedInstaller.exe i planowaną aktualizację systemu (0x80020003). Końcowy raport
i backup są wcześniejsze. Bieżący backend nie działa, nie wznawiano sesji.
Nie zmieniano aktualizacji/zasilania Windowsa ani ustawień autostartu.

Wynik: **77 rekordów kandydatów, 63 różne URL, 58 firm, 21 nowych szkiców**
oraz jeden wcześniej zapisany wykorzystany w tej sesji — 22 wiadomości w raporcie.
222 zapisane źródła publiczne, 110 wywołań modelu; model errors=0. 11 zapisów
błędów: cztery UNAVAILABLE/NO_READABLE_SOURCE, dwa UNVERIFIED_COMPANY i pięć
SOURCE SIZE_LIMIT. Nie są to 11 niezależnych awarii; odczyt i element mogą
opisywać tę samą stronę. Błędne/niedostępne kandydatury zachowane, bez wymuszania
akceptacji, osłabiania limitu źródeł lub ponawiania całej próby do PASS.

Po restarcie read-only, istniejącymi draftMaterialIssues i checkDraft na dokładnych
zapisanych wersjach/źródłach: **22/22 bez STALE/UNVERIFIED i bez code issues**,
22/22 semantic supported=true, 22/22 literalny email w zachowanym dowodzie.
21 kontaktów GENERAL, 1 RECRUITMENT; nie zmieniano ich przeznaczenia. Warunki,
rekrutacja i przyjęcie ucznia/20 h pozostają takie, jak udokumentowano, często unknown.
To weryfikacja zapisanych danych, bez nowego modelu, publicznych fetchy lub Gmaila.

Powrót do 10 URL wygenerował 14 dodatkowych rekordów kandydatów. Nie było
powtórzonych company_id lub odbiorców w zestawie 22 szkiców. Reuse wcześniejszej
wersji rozróżniono od 21 nowych; nie przeniesiono dawnych propozycji do blokad.
Kwalifikacje w zakresie próby: 56 NEEDS_REVIEW i 3 REJECTED. Materiały są szkicami
bez zgody na przyszłą wysyłkę; historia Gmaila tych firm nie była sprawdzana.

Pełne integrity_check bieżącej SQLite i końcowego backupu: **ok**. Porównanie
chronionych tabel i trwałej granicy z początkiem oraz backupem: identyczne,
w tym profil/fakty/CV, outbox, send attempts, usage, ręczna historia, suppressions
i shared records. Fingoweb blokowany. Nadal tylko 3 wcześniejsze SELF_TEST,
zero nowych prób wysyłki i zero niepewnych wyników. Nie inicjalizowano Gmaila.

Pomocniczy odczyt weryfikacji początkowo użył nieistniejącego evidence.url;
poprawiono go na canonical_url po odczytaniu schematu. To błąd raportu operacyjnego,
bez zmian SQLite lub kodu produktu, odrębny od 11 zapisów błędów nocnej próby.

Raport TXT/JSON, pełne 22 wiadomości, kontakty i literalne dowody, warunki,
odrzucenia, błędy i kontrola po restarcie są poza repo. Raport przekazano w obecnej
sesji po powrocie użytkownika; automatycznego porannego turnu nie potwierdzono.
Jednorazowy heartbeat ustawiono PAUSED po wykonaniu raportu. Nie wznawiano
backendu ani pracy; firmowy pilot i AUTO_POLICY nadal niewłączone.

Niezmieniony kod produktu pozostaje 6409e09, ostatni pełny rzeczywisty Windows
check 439/12/15 PASS. Nie powtarzano suite dla raportu i odczytów operacyjnych.

# Domowy Windows — przygotowanie instalacji, 13 października 2026

Rzeczywisty host Windows win32/x64, Node 24.19.0, npm 11.17.0,
Codex CLI 0.162.0-alpha.17.2; testowany kod `ed23d96` na
`codex/local-windows-pilot`. Checkout przed fast-forward był czysty,
diagnostyka procesów/portów nie wykryła backendu JobHuntera.
Przed inicjalizacją rzeczywisty katalog produkcyjny nie istniał; odróżniono go
od przekierowanego LOCALAPPDATA sandboxa. WORKSTATION pozostaje nieoznaczony.

npm ci na hoście PASS: 119 pakietów, audyt 120, zero zgłoszonych podatności.
Pierwsza próba w sandboxie zakończyła się ENOTFOUND registry.npmjs.org;
nie przypisujemy tego błędu Windows TLS. Build i doctor DEVELOPMENT PASS,
SQLite 3.53.4. Pełny npm run check na tym fizycznym Windowsie **PASS, exit 0**:
typecheck/build, **434/434 backend** (1482,7 s), **12/12 performance Stop**
(25,9 s), **15/15 Playwright** (1,2 min). Zero skipped/cancelled w backendzie
i performance, bez zmiany progów lub ponowień do PASS. Trzy izolowane pomiary
odbioru Stop przy 10035 fikcyjnych firmach: 705,82 / 727,02 / 693,54 ms.
Testy używają fikcyjnych providerów, tymczasowych baz i lokalnych repo Git.
Nie jest to test natywnej poczty ani całodziennej pracy użytkownika.

Istniejący reader-preflight uruchomiony na hoście przez
`node --use-system-ca --import tsx scripts/reader-preflight.ts`: PASS,
Node.js/example.com/Wikipedia READ i HTTP 200, 4 żądania z przekierowaniem,
environmentFailure=null. Wynik potwierdza konfigurację z magazynem systemowym;
nie jest nowym pomiarem działania bez tej flagi. TLS i SSRF pozostały aktywne.

Istniejący ExecCodexRunner/ResearchJobHunter: login ChatGPT, wymagane flagi CLI,
stdin→JSONL→walidacja na fikcyjnych danych PASS; rzeczywisty probe web search
PASS ze zdarzeniem narzędzia i oficjalną stroną wydań Node.js. Jedna ekstrakcja
publicznej strony Node.js oraz kwalifikacja w nowej izolowanej diagnostyce
syntetycznej COMPLETED, bez błędów modelu/elementu. Kontakt niedopuszczony,
zero szkiców, approvals, outbox i prób. Nie jest to smoke z profilem użytkownika
ani kontrola gotowości do wysyłki. Nie inicjalizowano natywnego Gmaila.

Podgląd history:new na dokładnym istniejącym prywatnym CSV PASS: jeden CONTACTED,
scalenie z wbudowaną blokadą Fingoweb, brak dawnych nazw i zapisanych rekordów.
Podgląd pozostawił target nieutworzony. Wskazany PDF ma SHA zgodny z prywatną propozycją,
bez edycji pliku lub zatwierdzenia materiałów w produkcji. Dokładne ścieżki,
hashe i logi są wyłącznie w lokalnym prywatnym raporcie poza repo.
Po konkretnym potwierdzeniu dokładnej bazy oraz CSV/hash i po PASS check
wykonano history:new initialize, history:local doctor oraz osobny backup.
Integralność bazy ok; firmy 1, aliasy 1, ręczne rekordy 1, suppressions 1,
kontakty 0. Fingoweb CONTACTED zachowuje istniejące wykluczenie i deterministyczną
blokadę. Nie dodano 33 dawnych propozycji. Send attempts/outbox/usage/shared
records/approvals/auto sessions 0, SENDING/SEND_UNKNOWN 0. LOCAL_ONLY,
stopped=true, gmailSenderPaused=true. Granica kampanii zapisana raz.
Oba backupy sprawdzone read-only: quick_check=ok, identyczny hash plików,
zgodne liczniki i granica kampanii. Nie odtwarzano produkcji z backupu.
Materiały seed: 10 DRAFT, profil niezatwierdzony, CV jeszcze nieimportowane.
Po osobnym potwierdzeniu wykonano configure --confirm-new-campaign-history
--single-workstation istniejącym helperem, bez ręcznego tworzenia znacznika.
Backend nieuruchomiony, granica kampanii niezmieniona. Materiały, Gmail i pilotaż
mają dalsze odrębne decyzje. Pełny smoke z profilem użytkownika niewykonany.
Rzeczywiste wysyłki/SELF_TEST: **0**.

## Blocker dokładnego zestawu materiałów

Przed zmianą kodu bazowy pełny Windows check 434/12/15 PASS. Nowa fikcyjna
regresja: trzy FAIL INVALID_FACT, gdy profil pomija domyślny opis czwartego
projektu; przypadek niedozwolonego pomijania osobistych faktów PASS.
To uniemożliwiało konfigurację aktualnego zestawu trzech projektów bez kasowania
wiersza lub zatwierdzania niezamówionego opisu. Dane prywatne nie były używane
w tych testach.

Mała poprawka istniejącego updateProfile/profile/approveProfile: pominięty
opcjonalny projekt zachowany jako DEFERRED; wyłącznie wybrane fakty idą do
panelu/modelu/hasza/approve i approved-profile smoke. Późniejszy jawny wybór
istniejącego ID przywraca opis jako DRAFT i unieważnia aprobatę. Nieznane,
zdublowane ID lub pominięte fakty osobiste/dostępność nadal INVALID_FACT.
Odłożenie faktu osobistego w niespójnej bazie blokuje aprobatę i snapshot.
Panel pokazuje krótką informację o odłożonym opisie; bez zmiany stylu wiadomości.
Pierwszy typecheck wykrył brak pola w typie override; adnotację poprawiono.
Końcowy typecheck oraz **46/46** celowanych material-scope/public-diagnostic/
message-style PASS na Windows, bez skipped. Pełny nowy Windows check po poprawce
**PASS, exit 0**: **439/439 backend** (1652,0 s), **12/12 performance Stop**
(32,4 s), **15/15 UI** (1,0 min), typecheck/build. Zero skipped; źródła kodu
nie były edytowane podczas tego checku. Trzy izolowane odbiory Stop przy 10035
firmach: 925,85 / 852,24 / 891,64 ms; pełny zestaw 936,28 ms.
Progów nie podniesiono, nie ponawiano nieudanych pomiarów do PASS.

Po dodatkowym spójnym backupie zapisano wyłącznie DRAFT: 9 bieżących faktów,
trzy projekty i niezmienną kopię wskazanego PDF z prawidłowym SHA. Zachowano
dziesiąty odłożony opis w bazie; nie dodano faktów o egzaminach/praktykach
do materiałów wiadomości ani nie zatwierdzono niczego za użytkownika.
Historia ręczna i granica kampanii porównane przed/po — identyczne;
stopped=true, outbox/send attempts 0, Gmail/model/HTTP technicznie wyłączone
w helperze przygotowującym materiały. Backend czeka na końcowy build/check
i świadomy przegląd materiałów w panelu RESEARCH_ONLY.

Po sprawdzeniu 7 wychodzących plików kod opublikowano jako `6409e09`;
zdalny ref zweryfikowany, checkout czysty. Bez prywatnych plików w commicie.
Doctor WORKSTATION/RESEARCH_ONLY PASS; standardowy start.ps1 uruchomił zatrzymany
backend na loopback i otworzył domyślną przeglądarkę. NODE_USE_SYSTEM_CA=1 tylko
w środowisku tego procesu, bez ustawień zasilania/autostartu lub zmiany systemu.
Health PASS. Snapshot działającej SQLite wyłącznie do odczytu potwierdza
9 DRAFT, odłożony projekt DEFERRED, niezatwierdzone CV i nienaruszoną granicę;
stopped/paused/gmailSenderPaused=true, próby/outbox/usage/auto sessions 0.
Pierwszy sandboxowy odczyt aktywnego WAL miał CANTOPEN; host read-only PASS.
Nie wykonywano migracji lub naprawy aktywnej bazy.

Nie potwierdzono wizualnie prywatnego panelu przez automat: dostępna przeglądarka
automatyzacji nie miała tej karty. Automatyczny reviewer odrzucił transfer
lokalnego tokenu do panelu Codex z powodu braku jawnej zgody na ten konkretny
odbiornik; tokenu nie odczytano w odrzuconej operacji ani nie obchodzono blokady.
W tym checkpointcie przegląd/akceptacja materiałów pozostawały po stronie
użytkownika. Gmail, real-profile smoke, SELF_TEST i pilot nie były wykonane.

## Zatwierdzony profil i jednorazowy publiczny research Windows

Użytkownik potwierdził widoczność panelu w domyślnej Operze GX po użyciu
systemowego otwarcia Windows. Tokenu nie przekazano do Codexa. Profil i 9 faktów
zatwierdził w panelu o 18:38:36, a CV osobnym przyciskiem o 18:41:58
Europe/Warsaw. Read-only host potwierdził oba approved_at, 9 APPROVED,
FixDesk DEFERRED i SHA oryginalnego niezmiennego PDF. Program pozostawał Stop.

Jedna rzeczywista próba istniejącym smoke:public --approved-profile na fizycznym
Windowsie, kod aplikacji 6409e09, NODE_USE_SYSTEM_CA=1: 18:43:59–18:50:46
Europe/Warsaw (6 min 47 s), limit diagnostyki 5 firm/15 minut, exit 0.
Nowa osobna baza poza repo; gałąź kwalifikacji AUTO użyta przez diagnostykę
z DisabledMailProvider, bez gateway, natywnego Gmaila i produkcyjnej kolejki.
To nie jest uruchomienie rzeczywistej kampanii AUTO_POLICY.

COMPLETED: 5 firm, 25 READ, 5 ekstrakcji/kwalifikacji, 4 dopuszczone kontakty,
4 wygenerowane wersje i 4 w pełni sprawdzone szkice. Jeden kontakt pominięto:
SALES i brak literalnego emaila (zamaskowany adres). Pozostałe adresy GENERAL,
z literalnym dowodem w publicznym źródle; warunki i rekrutacja niepotwierdzone,
treści pozostają zapytaniami. Model/item errors, code/semantic rejections,
review errors i unverified drafts: 0. Bez napraw kodu lub drugiej próby publicznej.

Końcowe read-only kontrole wykonały istniejące draftMaterialIssues dwukrotnie
na tych samych zapisanych źródłach: 4 × brak STALE/UNVERIFIED, bez modelu/network
lub konstruktora modyfikującego bazę. Brak powtórzonych domen i szkiców dla firmy;
run duplicates=0. Istniejąca companyHistoryBlocks potwierdziła blokadę Fingoweb.
Hash porównania 11 tabel produkcyjnych przed/po identyczny; trwała granica kampanii
i Stop/gmailSenderPaused zachowane. Produkcyjne outbox/attempts/usage/shared/
auto sessions/model calls/research drafts oraz diagnostyczne outbox/attempts: 0.
To kontrola lokalnej historii i krótkiej próby, bez potwierdzenia historii Gmaila.

gmail:status z prawidłowym WORKSTATION/RESEARCH_ONLY odczytał wyłącznie lokalne
metadane: konto na tej instalacji jeszcze niepodłączone. Bez nativeSecretStore,
OAuth, wyboru nadawcy, zmiany scopes lub odczytu skrzynki. Prywatny raport
zawiera pełne wiadomości i warunkowy plan do 3 firm co 5 minut, bez utworzenia
kolejki. Przed send potrzebne osobne zgody, właściwe konto, historia i aktualne
wiązania źródeł/materiałów. SELF_TEST/pilot/ciągła AUTO niewykonane, wysyłki 0.
Kod i zależności aktywnego backendu niezmienione. Ostatni pełny check tego kodu
pozostaje Windows 439/12/15 PASS; nie ponawiano go dla samej dokumentacji.

## Przygotowanie SELF_TEST i nowych priorytetów — checkpoint OAuth

Ponowne gmail:status na domowym Windowsie: brak lokalnego account.json,
konto niepodłączone, backend health=ok w RESEARCH_ONLY. 9 APPROVED,
profil/PDF zatwierdzone, Stop i sender paused; próby/outbox/auto sessions 0.
Użytkownik wskazał inne konkretne konto i odbiorcę testu. Prywatna propozycja
SELF_TEST zachowuje przejrzany tekst, prefix testu i obecne zatwierdzone CV.
Nie jest natywnym frozen preview ani zgodą na jego wysłanie.

Nowe priorytety: 6 publicznych stron przez istniejący PublicSourceReader,
6 żądań, wszystkie READ/HTTP 200 na Windowsie z system CA. Bez dodatkowego
modelu lub Gmaila. Wstępna ocena źródeł: dwa literalne kanały rekrutacyjne,
jeden nadal GENERAL. Ogłoszone typowe role nie potwierdzają aktualnego naboru;
pełna zdalność jednej firmy zależy od rozmowy i roli. Nie potwierdzono 20 h.
Brak pasujących lokalnych firm/aliasów; historia skrzynki niesprawdzona.
Trzy wcześniejsze szkice zachowano w prywatnym raporcie i porównano
id/version/subject/body oraz hash całego oryginalnego raportu: identyczne.

Brak lokalnego Desktop JSON. Użytkownik zalogował się do Google Cloud;
po jednym Ponów po błędzie SPA odczytano istniejący projekt i klienta typu
Komputer, zgodnego z podanym przez użytkownika ID. UI Google potwierdziło,
że starych sekretów nie można już ponownie pobrać. Po osobnej konkretnej zgodzie
dodano drugi klucz, pozostawiając stary aktywny. Scopes przyszłego połączenia
identity/send/readonly opisano i zatwierdzono; sam helper OAuth nie został uruchomiony.

Pobierz JSON: event download timeout, pliku nie znaleziono; ręczny klik
użytkownika też nie pobrał pliku. Browser clipboard API po ikonie Copy puste,
więc nie zapisano konfiguracji z domniemanym sekretem. Automatyczny reviewer
odrzucił odczyt globalnego schowka jako możliwość pobrania niepowiązanych
wrażliwych danych; odrzucona komenda nie została wykonana. Potem browser policy
zablokowała dalszy dostęp do Google Cloud po odmowie zgody. Nie próbowano innych
powierzchni/API/surowego CDP ani odczytu schowka po odrzuceniu.

Do ręcznego wpisania powstał wyłącznie lokalny szablon JSON bez realnego
sekretu. Użytkownik potwierdził, że jednorazowe opcje nowego klucza zniknęły,
i osobno zatwierdził ręczne zastąpienie tylko tego niezapisanego klucza
w zwykłej Operze, zachowując stary. Na tym checkpointcie czekano na Desktop JSON;
wyniku ręcznej operacji jeszcze nie potwierdzono. Pełne identyfikatory, końcówki,
konto/odbiorca i data klucza są tylko w prywatnym raporcie. Ani JSON, ani
sekret/token/schowek nie trafiły do modelu lub Git; zapis szablonu nie oznacza
gotowości integracji. Brak połączenia, mailbox read, wysyłek/SELF_TEST/pilotażu
i AUTO sesji. Kod, generator, zależności i aktywny build bez zmian.

## Natywne połączenie i jeden SELF_TEST — Windows, 13 października 2026

Użytkownik dostarczył lokalny Desktop JSON po ręcznej operacji w zwykłej
przeglądarce. Walidacja potwierdziła właściwy typ/klienta/projekt i nowy sekret;
zawartość JSON, sekret i tokeny nie trafiły do modelu lub Git. Standardowy helper
gmail:enable-read nie ukończył otwarcia przeglądarki: explorer.exe zwrócił exit 1.
To samo odtworzono z niesekretnym adresem dokumentacji. Prywatny adapter użył
istniejącego connectGoogle, tego samego PKCE/state/loopback i systemowego vault,
ze standardowym Windows ShellExecute; bez zmiany produkcyjnego helpera/builda.
Nowy OAuth ukończony o 20:34:24 Europe/Warsaw, wskazane konto zgodne,
identity/send/readonly zgodne z wcześniejszą osobną zgodą. Użytkownik potwierdził
ukończenie logowania. Samo połączenie: zero odczytów poczty i wysyłek.

Oficjalny Stop zakończył poprzedni backend; brak listenera i zwolnione blokady.
Spójny backup oraz history:local doctor PASS, integrity=ok, niepewnych prób 0.
Jedna celowana publiczna para URL zaimportowana istniejącym RESEARCH_ONLY
do właściwej historii produkcyjnej, z wyłączoną pocztą. Zwykła ekstrakcja,
kwalifikacja i generacja: COMPLETED/DRAFTS_READY, semantic review supported=true,
issues/material issues puste. Jedna wersja szkicu; nie zmieniono generatora
lub wcześniejszych zachowanych wiadomości. Historia i granica kampanii identyczne.

Po dodatkowym spójnym backupie istniejący GmailJobHunter z natywnym runtime
WORKSTATION przygotował SELF_TEST w APPROVAL_REQUIRED, bez workerów/researchu.
Potwierdzono 9 APPROVED oraz zatwierdzony profil i PDF; FixDesk DEFERRED.
Pokazano dokładnego nadawcę, osobistego odbiorcę, cały tekst, temat i załącznik/hash.
Zamrożony EML oraz kopia właściwego CV zapisane wyłącznie w prywatnym raporcie.
Użytkownik osobno zatwierdził tę jedną wiadomość i celowane sprawdzenie tej próby
w Wysłanych. Użyto niewygasłego preview/hash bez odświeżania lub zmiany bajtów.

Rzeczywisty natywny sender na fizycznym Windowsie: rezerwacja o **21:12:14**,
**SENT_CONFIRMED o 21:12:16 Europe/Warsaw**. Jedna próba POST i jedna rezerwacja,
identyczny hash zatwierdzonego MIME, konto/odbiorca/CV zgodne; error_class=null.
Gmail przyjął wiadomość, istniejący reconcile potwierdził właściwy provider ID,
temat, konto, odbiorcę i czas w Wysłanych. To nie dowodzi folderu odbiorcy.
Nie odczytano historii firm ani innych wątków i nie ponawiano wysyłki.

Końcowy stan: stopped=true, gmailSenderPaused=true, jeden terminalny outbox
SELF_TEST, send_attempts=1, usage=1/10 bez resetu lub zmiany limitów. Firmowe
wysyłki 0, niepewne próby 0, AUTO_POLICY niewłączone. Ręczna historia, suppressions
i trwała granica kampanii identyczne przed/po. Program i sender zatrzymane.
Końcowy history:local doctor: integrity=ok, attempts=1, usage=1, uncertain=0;
istniejący helper utworzył i sprawdził spójny backup także po wysyłce.
Hash pierwotnego raportu i trzy odłożone szkice ponownie zweryfikowane: bez zmian.
Odbiorca następnie zgłosił **Spam**. Otwarcie CV nie zostało potwierdzone.
Nie ustalono przyczyny klasyfikacji i nie zmieniono generatora lub treści.
Użytkownik wskazał zmianę nadawcy na inne konkretne konto i jedną kolejną próbę
do tego samego odbiorcy. Przygotowano prywatny adapter istniejącego connectGoogle
z kontrolą tego konta i standardowym otwarciem przeglądarki; node --check PASS.
Nowy OAuth czeka na odpowiedź na konkretne pytanie o identity/send/readonly
i zastąpienie lokalnego połączenia. Samo wskazanie konta nie uruchomiło helpera.
Potem potrzebny nowy podgląd i osobne zatwierdzenie dokładnej kolejnej wysyłki;
pierwsza próba/rezerwacja pozostają zachowane, bez resetu limitów.
Pilot do firm czeka na udany wynik testu, osobną zgodę na celowany odczyt ich historii
i dokładny podgląd do trzech wiadomości; późniejsza wysyłka wymaga osobnej zgody.

Nie uruchamiano testów z rzeczywistą pocztą jako fikcyjnej regresji. Powyższe
jest osobno autoryzowaną operacją, nie npm run check. Kod produktu i zależności
pozostają 6409e09; ostatni pełny fizyczny Windows check nadal 439/12/15 PASS.
Stock opener wymaga osobnej poprawki z fikcyjnym URL; nie wymaga nowego OAuth.

## Drugi SELF_TEST i powrót do pierwszego nadawcy

Po osobnej konkretnej zgodzie użytkownika połączono drugie wskazane konto,
tym samym lokalnym klientem Desktop i zakresami identity/send/readonly.
Logowanie zakończone o 21:22:03 Europe/Warsaw; konto zgodne z oczekiwanym.
Sam OAuth nie odczytał poczty i nie wysłał maila. Poprzednie połączenie zastąpiono
lokalnie, bez kasowania historii testów lub cofania Google uprawnień innych kont.

Nowy podgląd zachował identyczny temat, cały tekst i zatwierdzony PDF.
Użytkownik osobno zatwierdził jedną drugą próbę i jej celowane potwierdzenie.
Windows **21:25:11–21:25:13 Europe/Warsaw: SENT_CONFIRMED**; jeden nowy POST
i rezerwacja. MIME zgodny z drugim zatwierdzonym podglądem, pierwsza próba
i jej bajty/identyfikatory niezmienione. Odbiorca potwierdził **Odebrane**
i prawidłowe otwarcie CV. Nie ustalono przyczyny różnicy folderu wobec pierwszego
testu; nie jest to gwarancja dalszej dostarczalności.

Końcowy doctor integrity=ok, attempts=2, usage=2, uncertain=0; spójny backup
po drugim teście. Sender Stop, firmowe wiadomości 0, AUTO niewłączone.
Trzy odłożone szkice i pierwotny raport ponownie porównane: bez zmian.

Następna celowana publiczna kwalifikacja zapisała pierwszy cel jako
COMPLETED/DRAFTS_READY i szkic wersji 1 na literalny kanał RECRUITMENT.
Potem prywatny helper raportujący zapytał o nieistniejące research_items.draft_id
i zakończył się przed drugim celem; bazowy generator i właściwa kwalifikacja
nie zgłosiły błędu. Dane zachowane w SQLite, blokada profilu zwolniona, brak
aktywnych runs lub kolejki; raport tej operacji wymaga odtworzenia z zapisanych
danych, bez ponawiania kwalifikacji. Następnie częściowy raport odtworzono
read-only z SQLite; drugiego celu nie uruchomiono. Pytanie o osobną zgodę na historię trzech
firm nie zostało jeszcze rozstrzygnięte; nie wykonano odczytu ich poczty.

Użytkownik następnie polecił wrócić do pierwszego nadawcy i wykonać jeden
kolejny test do tego samego odbiorcy. Otworzono ponowne logowanie istniejącym
klientem i wcześniej zatwierdzonymi zakresami, z kontrolą konkretnego konta.
OAuth ukończony o **21:33:03 Europe/Warsaw**, konto zgodne; użytkownik także
potwierdził zakończenie. Przygotowano nowy dokładny podgląd tej samej treści/CV.
W odpowiedzi na pytanie o trzeci test użytkownik jawnie zmienił osobistego
odbiorcę i polecił „wyślij teraz”. Podgląd poprzedniego odbiorcy pozostał niewysłany;
istniejące setTestRecipient unieważniło jego warunki polityki. Przygotowano
i pokazano nowy podgląd z dokładnie wskazanym odbiorcą, przy niezmienionym
temacie/tekście/PDF. Polecenie użytkownika zapisano w prywatnym dowodzie zgody.

**21:38:57–21:38:59 Europe/Warsaw: trzeci SELF_TEST SENT_CONFIRMED**,
jedna nowa próba POST i rezerwacja, MIME zgodny z nowym zamrożonym podglądem.
Istniejący reconcile potwierdził wyłącznie tę próbę w Wysłanych; bez historii
firm lub innych wątków. Obie wcześniejsze próby i identyfikatory zachowane.
Odbiorca zgłosił **Spam**, z poprawnie otwierającym się CV. Wynik porównawczy:
dwa testy pierwszego nadawcy Spam, jeden drugiego Odebrane. Nie ustalono
przyczyny i nie zmieniono generatora, materiałów, stylu lub transportu.

Końcowy doctor **integrity=ok, attempts=3, usage=3, uncertain=0**; spójny backup
po trzeciej wysyłce. Program Stop, sender paused, wykorzystanie 3/10 bez resetu,
firmowe wiadomości 0, AUTO_POLICY niewłączone. Ręczna historia, suppressions
i granica kampanii niezmienione. Trzy wcześniejsze odłożone wiadomości i hash
oryginalnego raportu zachowane. Pilotaż czeka na decyzję po wynikach testów,
osobny zakres historii firm i dokładne podglądy; kolejnej wysyłki nie zaplanowano.

---

# Spójność dowodów — 13 października 2026

macOS arm64, Node v24.11.0, CLI 0.162.0-alpha.17.2. Poprzednie CI 482f34a:
Windows i macOS success, hosted/fikcyjne usługi, nie domowy komputer.

Przed poprawką 3 FAIL: missing inquiryBasis mimo verified companyActivities;
PROSPECT ignoruje właściwe inquiryBasis; zmiana kolejności aktualnych źródeł
powtarza EXTRACT/DRAFT i unieważnia tekst. Po podstawowej poprawce 27/27 celowanych
PASS; po rozszerzeniu/race/Stop/B-podczas-A i licznikach 62/62 PASS.

Pośredni pełny check: 416 PASS / 12 FAIL. Przyczyny: brak wykluczenia słowa regulamin
w samym cytacie, test ponownego importu przed normalną kontynuacją partial, asercja
myliła historyczną opportunity starego szkicu z aktualną kwalifikacją, hold pozostawał
na już zakwalifikowanym backlog DRAFT, zegar syntetycznego readera nie podążał za
wirtualnym zegarem aplikacji, kolejne kontrole liczono jako nowe szkice w hourly trial.
Poprawiono kod i datowanie fixture; bez usunięcia asercji lub zwiększenia progów.
Kolejny check miał 431 PASS / 1 FAIL: fixture wybierała Company 1, której nie musiało
być w losowo uporządkowanej pierwszej trójce. Test teraz wybiera rzeczywiście przygotowaną
firmę A i nadal wymaga dispatch B przy wstrzymanej A. Check publicznego kodu 7803b9d:
432 backend / 12 performance / 15 UI PASS, typecheck/build/diff check PASS.

Po zamknięciu publicznej części: zbyt szerokie wykluczenie klienta i wymóg czasownika
w opisie usługi. Dokładny helper z 7803b9d na dwóch izolowanych przypadkach: 2 FAIL
(wynik null zamiast właściwego inquiryBasis). Pierwsze dwie asercje były zbyt słabe,
bo dopuszczały fallback; zaostrzono je do wyboru dokładnego priorytetowego cytatu.
Helper v2 / extraction policy v6: 24/24 konsystencji PASS, w tym negatywne przypadki.
Read-only aktualnych zapisanych danych: Sprint0/TwójSoftware mają właściwą podstawę,
Assistron nadal bez literalnego adresu. Bez zmiany oryginalnych decyzji, nowego szkicu,
HTTP lub modeli. Publiczna próba nie była ponawiana na późniejszym helperze.

Replay używa spójnej kopii znanej diagnostyki i jawnego FixtureRunner: 1 DRAFT
(PRODAUT), 2 nowe review (GOTOMA/PRODAUT), 0 rzeczywistych modeli/HTTP. GOTOMA:
nowa rewizja tego samego tematu/tekstu z aktualnym kontekstem; 7 wcześniejszych
poprawnych oryginalnych materiałów i ich pełne konteksty sprawdzone przed/po/restart,
bez zmian. Nie jest to nowe zewnętrzne review tych siedmiu. Oryginalny SQLite bez zmian.

Publiczne: 9.71 min, 29 HTTP/14 modeli; 2 kontrolne szkice supported=true/code PASS,
utrzymane po dalszych cyklach i restarcie. Dwa cykle ukończone; trzeci SEARCH
CODEX_TIMEOUT, bez retry/zmiany 120 s. BLOCKED_EXTERNAL. Harness pamiętał starszy
indeks: Sprint0 ponownie badany, nie nowy; nowa pamięć obejmuje oba poprzednie indeksy.
Celowy powrót w głównym loopie nieosiągnięty. Oddzielny cache-only replay po Stop
na spójnej kopii: prawdziwe wcześniejsze verdicts + bieżący binding, HTTP i model
rzucają błąd przy użyciu; 0 nowych wywołań, 2→2 aktualne, bez nowej generacji/mock PASS.

Końcowy kod dbd5a39: npm run check 434 backend / 12 performance / 15 UI PASS, typecheck/build/diff check PASS. CI finalnego SHA sprawdzane po pushu. Publiczny kod 7803b9d i późniejsza korekta offline mają osobne hashe i zakresy w pakiecie.
Historyczny niestabilny odbiór Stop nie jest wyjaśniony późniejszym PASS. Progów i
liczby iteracji nie zmieniono. Windows lokalnie/Gmail/dostarczalność bez weryfikacji.
Prawdziwe mail/SELF_TEST, OAuth, prywatny runtime/CV/liczniki: bez operacji.

---

# Runda samodzielnego researchu — 13 października 2026

macOS arm64, Node v24.11.0. Publiczna próba: f59ccb8; końcowy kod: 835a6d5; wyłącznie fikcyjni odbiorcy, katalogi
tymczasowe i lokalne repo Git w testach. `npm run check`: **410/410 backend,
12/12 performance, 15/15 UI**, typecheck/build PASS. `git diff --check` PASS.

Odtworzenie na poprzednim kodzie: 3 FAIL / 4 PASS — zaproszenie „chcesz do nas
dołączyć”, future OPEN bez bieżącego wakatu, REJECTED oferty z dopuszczonym
osobnym zapytaniem w planerze. Osobny test nawigacji: FAIL przed poprawką (mailbox
na stronie nie może uniemożliwić odczytu literalnego linku kariery). Po zmianach
celowane 44/44 oraz integracyjne 20/20 i późniejsze 9/9 PASS. Jeden pośredni wynik
43/44 wynikał z testowego literalnego tytułu PHP/Laravel, który prawidłowo wybierał
FixDesk; fixture zmieniono na Junior Developer, aby badała działalność API bez
trafnego tytułu. Nie zmieniano selektora projektu dla tej asercji.

Pierwszy pełny check: 408/409 backend, 1 FAIL — `research.test.ts` wymagał starej
instrukcji 150–220 słów. Dostosowano oczekiwanie do nowej preferencji, bez zmiany
bramek prawdziwości. Performance/build/UI nie wykonano w tym przerwanym check.
Końcowy check uruchomiono po tej poprawce; testy zachowano, bez skip lub poluzowania
zabezpieczeń. Długość sama nie tworzy NEEDS_REVIEW; profil/fakty/technologie nadal
podlegają kontroli. Pełne opisy projektów pozostają w kontekście generatora/review.

Stop końcowego check: max request_received 613.01 ms w pełnym zestawie;
large-history odwołanie po odbiorze 0.18 ms.
Trzy izolowane large-history: 308.23 / 266.82 / 208.92 ms.
Brak nowych POST po Stop PASS. Nie zmieniono progów; trzy iteracje są stałą częścią
check, bez powtarzania aż do PASS. Historyczny CI macOS 15198a6 z odbiorem 1458.72 ms
pozostaje niewyjaśniony. Oba udane check tej rundy nie ustalają jego przyczyny.

Współpraca etapów: zachowane istniejące auto-review-concurrency (RUNNING, retry
samego review, utrzymanie hash/wersji, Stop i spóźniony wynik), research/restart,
local-only/CV/sender/concurrency i soak. Nowy test planner→worker przechodzi przez
nieudaną witrynę, duplikaty i pusty kierunek; zachowuje badania/planer po restarcie,
bez outbox/attempts/approval/auto-session. UI auto.spec potwierdza pracę backendu po
zamknięciu karty. Nowy cykl diagnostyczny używa publicznego workera, bez sendera.

Po zamknięciu publicznej części odtworzono dodatkowy błąd metryki: positive review
z DRAFT_MATERIAL_STALE dawał checkedDrafts=1 zamiast 0. Bramka wysyłki już blokowała
materiał; poprawka dotyczy licznika i eksportu, używa istniejącej draftMaterialIssues.
Regresja 4 PASS / 1 FAIL przed, 19/19 integracyjnych PASS po. Pierwsza wersja fixture
użyła zwykłego AUTO ResearchJobHunter bez auto_run_scope i nie utworzyła szkicu;
zmieniono ją na rzeczywisty createPublicDiagnostic przed odtworzeniem 1 != 0.

Replay na spójnej read-only kopii zamkniętej diagnostyki (normalne metody planera,
0 HTTP / 0 modeli): cykl 4 daje checkedDrafts 2 → 1. Bieżący końcowy snapshot cyklu 3
ma 2 zamiast historycznych 3: GOTOMA była wcześniej sprawdzona, potem binding się
zmienił. Nie przepisano publicznego przebiegu lub oryginalnej bazy. Hashe plików
replay odpowiadają 835a6d5; publiczna próba nie była ponawiana na późniejszym kodzie.
Końcowy pełny check na tych zmianach: 410 backend / 12 performance / 15 UI PASS,
typecheck/build/diff check; wcześniejszy check na f59ccb8 miał 409/12/15 PASS.

Publiczna próba i CI finalnego SHA są raportowane osobno w nowym research-review.
Windows w tej rundzie lokalnie nie uruchomiony. Hosted CI nie potwierdza domowej
instalacji, Gmaila, dostarczalności ani całodziennej pracy. Prawdziwe maile: **0**.

---

# Weryfikacja — 12 października 2026

## 13 października 2026 — MacBook: research bez poczty

Bazowy `2aa3a1e`; osobny checkout, macOS darwin/arm64, Node v24.11.0,
CLI 0.162.0-alpha.17.2 i istniejący login ChatGPT. Bez full access/API key.
Pełny [pakiet](research-review/2026-10-13_08-10_macos-01a133d7/README.md)
zapisów, wszystkich wersji i identyfikatorów; stary raport niezmieniony.

Trzy mechanizmy odtworzone FAIL przed zmianą: brak projektu z opisu usług API,
UNKNOWN dla pytania o dołączenie do zespołu i odmowa całej firmy z zakresu OFFER.
Regresje po zmianie obejmują zmienione nazwy/domeny, negatywne AI/PDF, jawny/brak
warunku umowy, obowiązkowy kanał/zakaz maila, neutralny tytuł i literalny ACTIVE,
TLS bez retry storm, awarię jednego hosta i wspólną serię, transient retry, redirect/
budżet/cache, nowszą zmienioną wersję źródła, mapping generator/review i blokadę
snapshotowej bazy przed usługą Gmail nawet z WORKSTATION. Celowane: 21/21 PASS.
Produkcyjne sprawdzanie PDF i wcześniejsze kontrole sendera/Stop zachowane.

Końcowy `npm run check`: exit 0, typecheck/build PASS, **403/403 backend**
(101291,04 ms), **12/12 performance Stop** (6269,41 ms), **15/15 UI** (35,4 s).
Fikcyjni odbiorcy/providery, tymczasowe bazy i lokalne repozytoria Git; diff check PASS.
Bez zwiększenia timeoutów lub progów. CI finalnego SHA sprawdzane po publikacji.

Właściwy Node reader z procesowym --use-system-ca: 3/3 hosty preflight READ.
Publiczna sesja 33,59 min, 69 faktycznych HTTP (w tym redirecty i 1 powtórzony URL),
68 różnych żądanych URL, 58 różnych poprawnie odczytanych stron i 59 zapisanych READ.
4 nieudane odczyty; brak dowodu awarii całego środowiska macOS. Początkowy BizCode
EXTRACT przekroczył 120 s. Po usunięciu zduplikowanej wersji pakietu pojedyncze
wznowienie checkpointu zakończyło się po 52,36 s; przyczyna timeoutu nie jest dowiedziona.
Jedno review N-SOFT: CODEX_FAILED z oczyszczonym komunikatem „Selected model is at
capacity”; późniejsze pojedyncze review identycznego payloadu PASS, bez zmiany modelu,
tekstu lub faktów. Obydwa wcześniejsze błędy zachowane. 46 wywołań, bez zerowania budżetu.

10 nowych firm po analizie: 7 szkiców po pełnych kontrolach, 3 pominięcia za brak
właściwego kanału/dowodu. 6 kontroli: BizCode/OKE/Tukano/WizzDev ze szkicem,
Merixstudio pytania rekrutacyjne bez zgody na CV, Payarto brak treści/kontaktu.
Łącznie 13 zachowanych nowych wersji i 11 różnych szkiców po kontroli. Dwie dawne
wersje z Windowsa są osobno oznaczone i nie liczone jako sukcesy tej sesji.

AutoRelay w pełnym zatwierdzonym opisie dotarł do generatora BizCode/Tukano; CodeFabric
do nowej wersji OKE po świeżym odczycie usług AI. Projekty występują w tekstach.
Nie przypisano kandydatowi SAP, produkcji ani nowych projektów. Review PASS jest oceną
zgodności, nie gwarancją jakości: część tekstów wylicza zbyt obszerny stack. Stylu nie
przebudowano i nie poprawiono eksportu. Końcowy audyt skorygował dodatni licznik
checkpointu z 9 do rzeczywiście zapisanych 11 kontroli przez ReviewBudget.recordChecked,
bez zmiany HTTP/modeli/czasu lub wyników; zdarzenie w PRZEBIEG.

Nie zweryfikowano PDF (`cvVerifiedInThisRun=false`), magazynu CA domowego Windowsa,
Gmaila, prywatnej historii, gotowości wysyłek/dostarczalności ani pracy całodziennej.
Snapshot zachowuje zawodowe fakty/ID i hash opublikowanej wersji. Diagnostyka ma zero
approvals/outbox/send_attempts/auto sessions, DisabledMailProvider i brak gateway.
Zero prawdziwych maili, SELF_TEST, odczytów skrzynki/OAuth lub zmian prywatnego runtime.

### CI publikacji 15198a6 — faktyczne wyniki

[Run 38360438675](https://github.com/JakubLewosz/JobHunter/actions/runs/38360438675),
Node 24.19.0. Windows hosted: 403/403 backend (690940,55 ms), 12/12 performance
(24689,57 ms), build i 15/15 UI PASS. To izolowane fixture, nie domowy WORKSTATION.
macOS hosted: typecheck i 403/403 backend PASS, performance 11/12 FAIL. Pierwszy
odbiór Stop przy 10035 firmach: 1458,72 ms wobec 1000 ms; odwołanie uprawnienia
0,49 ms po odbiorze i brak nowych POST PASS. Pozostałe pomiary large-history
820,46 i 791,63 ms. Build/UI w tym jobie nie uruchomione po niezaliczonym gate.
Nie podniesiono progu, nie pominięto testu i nie przypisano przyczyny opóźnienia.
Jedno żądanie ponowienia joba odrzucone przez integrację GitHub (HTTP 403), zatem
nie ma drugiego wyniku tego SHA. Ta dokumentacja nie oznacza całego CI jako PASS.
Następny krok poza zakresem researchu: profilować zimny GET dashboard/companies
w tests/stop-scenario.ts na hosted macOS/Node 24.19 przy równoległych odświeżeniach.
Finalny commit dokumentacji ma ten sam kod runtime; jego CI sprawdzamy po pushu.

## Publiczny research na Windowsie — pakiet do weryfikacji

Research 23:29–23:40 Europe/Warsaw, bazowy HEAD `a3bc37b`, dirty.
Pełne identyfikatory i hashe faktycznie użytych trzech partii w
[pakiecie](research-review/2026-10-12_23-29_windows-01a1313a/README.md).
Node 24.19.0 / Codex CLI 0.162.0-alpha.17.2 / istniejący login ChatGPT.
Rzeczywisty probe JSON i web search PASS; wersja modelu nieustalona.
Nie użyto płatnego API, profilu syntetycznego jako użytkownika ani Gmaila.

Użytkownik zatwierdził dokładne korekty propozycji i wskazany oryginalny PDF;
hash sprawdzono bez edycji. Osobny diagnostic clone ma 9 faktów, bez fallbacku
do FixDesk. Dodatkowe aktywności CV nie są faktami generatora. Ograniczenia
statusu projektów są oddzielnie w template. Produkcyjna baza nie powstała.

Pierwsza partia: 30 rozpoczętych tożsamości, zero odczytanych źródeł.
Kontrolny odczyt odtworzył `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Node z
`--use-system-ca` odczytał tę stronę z HTTP 200, bez wyłączania TLS/SSRF.
Przyczyna wszystkich historycznych FETCH_FAILED nie została osobno ustalona.
Nie poprawiono wstecz ich statusów. Kolejne partie dokończyły tylko rozpoczęte
przypadki z tym samym niezerowanym budżetem; po 150 HTTP wyłączono ten transport.

Końcowo: 5 zweryfikowanych ekstrakcji i kwalifikacji, 5 literalnych kontaktów,
2 kwalifikujące się kontakty, 2 zachowane wersje/2 pełne kontrole, 3 pominięcia,
1 odrzucenie walidacji ekstrakcji (`UNVERIFIED_TITLE`). 15 wywołań modelu;
150 prób HTTP obejmuje błędy/retry/redirecty i dwie kontrole sieciowe.
23 zachowane READ obejmują kontrolny odczyt, nie 23 nowe firmy. Zero błędów
wykonania modelu. Dokładne liczniki i ograniczenia w MANIFEST.

Dwa pierwotne odrzucenia `UNAPPROVED_LINK` odtworzono minimalnym fixture FAIL:
kropka po URL w zatwierdzonym zdaniu była traktowana jako część adresu.
Mała normalizacja końcowej interpunkcji daje PASS; inny URL nadal blokowany.
Te same teksty sprawdzono ponownie, bez regeneracji i podmiany faktów.
Historia pierwszych kontroli pozostaje w pakiecie. Celowane diagnostic/review
tests **10/10 PASS** na fikcyjnych danych. Końcowy `npm run check`, Windows
win32/x64 i Node 24.19.0: **PASS, exit 0**. Typecheck/build PASS,
**382/382 backend** (522,2 s), **12/12 performance Stop** (15,4 s),
**15/15 Playwright** (48,0 s). Nie jest to test rzeczywistej poczty.

Audyt eksportu wszystkich rekordów/wersji/factIds/evidenceIds/sourceIds,
hashy, linków, danych prywatnych i zerowych approvals/outbox/send PASS.
Pakiet zawiera osiem plików UTF-8 i LATEST; SQLite/WAL/PDF/backupy i surowe
logi pozostają poza repo. Przykłady sprawdzono także dla pominięć i błędu.
Nadmierne contract=no w Tukano, wąska interpretacja celu kontaktu Merixstudio
i niepoparty tytuł Payarto są jawne; nie zmieniono kwalifikacji ręcznie.
Nie wykonano prawdziwego SELF_TEST, Gmail read/send, inicjalizacji WORKSTATION
lub importu do historii osobistej. Publikacja nie jest deploymentem.

## Lokalna nowa kampania — wyjątek wcześniejszych zgłoszeń

Baza kodu `a3bc37b` z lokalnymi niezacommitowanymi zmianami. Jawny nowy
initializer używa istniejącego CSV preview/import, bez sieci, modelu lub
Gmaila; odrzuca istniejący katalog, brak potwierdzenia i zmieniony hash.
Nie dodaje 33 dawnych nazw. Fingoweb i materiały DRAFT pozostają.
Nie wykonano inicjalizacji danych użytkownika, oznaczenia WORKSTATION lub
importu. Prawdziwy backend pozostaje wyłączony.

Decyzja o wcześniejszych aplikacjach jest zapisywana raz z ID/wersją/granicą
i związana z polityką. Nie odnawia się po Stop, Start, restarcie lub dniu.
Nowe własne/niepewne próby i blokady pozostają trwałe. Stara odpowiedź wymaga
lokalnej kontroli próśb o zaprzestanie kontaktu; UNKNOWN blokuje. Ograniczone
frazy PL/EN, kontrola plain/HTML, brak załączników i poczty w promptach modelu.
Migracja 018 jedynie dodaje status kontroli; nie usuwa historii.

FAIL → PASS odtworzone przed poprawką: nowy seed 34 firm zamiast jednej
blokady oraz stary SENT blokujący dozwoloną wiadomość. Nowe celowane testy:
25/25 PASS, potem dodatkowa odmiana „nie pisać”: reader 15/15 PASS.
Osobne public-diagnostic 4/4 PASS po pominięciu dawnego seed. Przypadki obejmują
restart z ponownym otwarciem SQLite/dzień, dokładnie jedną próbę, SEND_UNKNOWN,
późną odmowę, zachowanie ręcznych rekordów, niepełny odczyt, zakres adresów,
nieprzekazywanie poczty modelowi i trwałą blokadę po OPT_OUT.

Rzeczywisty `npm run check`, Windows win32/x64, Node 24.19.0:
typecheck PASS, **375/375 backend** (1612,2 s), następnie performance
**11/12**. Jedno FAIL: odbiór żądania Stop przy 10035 fikcyjnych firmach
1082,23 ms wobec progu 1000 ms; odwołanie prawa po odbiorze po 1,10 ms,
brak nowych POST. Nie podniesiono progu. Całe polecenie check zakończyło się
exit 1 przed build/UI — nie oznaczamy go jako PASS.

Jedno celowane powtórzenie `test:performance`: **12/12 PASS**, bez zmian
testu/progu lub optymalizacji kodu dla pomiaru. Przyczyny zmienności odbioru
HTTP nie ustalono. Oddzielnie końcowy build PASS i Playwright **15/15 PASS**
(49,7 s), w syntetycznych bazach i na fikcyjnych usługach. Nie jest to
rzeczywisty pilotaż Gmaila, pełny dzień lub gwarancja opóźnienia Stop na tym
komputerze.

Wskazany rzeczywisty PDF ma jedną stronę; treść i układ sprawdzono bez edycji,
hash źródła nie zmienił się. Użytkownik potwierdził właściwe CV i przekazał
doprecyzowania materiałów. Zmienione fragmenty propozycji czekają na końcową
akceptację; brak zatwierdzeń profilu/CV w bazie, bo baza nie została utworzona.
Pliki/propozycje/dane użytkownika poza repo. Zero prawdziwych send/SELF_TEST,
odczytów Gmaila, zmian OAuth/nadawcy lub publikacji danych.

## Domowy Windows — przygotowanie bez poczty

Sprawdzono zdalne refy i wybrano `a3bc37b2b9200a3b3c8435ee1046448716373ca4`
na `codex/local-windows-pilot`, zawierający wcześniejszy `810b860`. Main nadal
wskazuje starszy `4e6b864`. Początkowy checkout był czysty; przed aktualizacją
nie wykryto backendu JobHuntera. Nie zatrzymywano procesu użytkownika.

Windows win32/x64, Node **v24.19.0**, npm **11.17.0**. Po `npm ci` uzupełniono
brakujący przypięty `htmlparser2`; doctor potwierdził SQLite **3.53.4** i natywny
CLI **0.162.0-alpha.17.2**. Sprawdzono help/features i istniejące logowanie
ChatGPT przez `login status`, bez odczytu plików uwierzytelnienia. Nie jest to
potwierdzenie dostępności rzeczywistego wyszukiwania lub limitu modelu.

Rzeczywisty `npm run check`: **350/350 backend, 12/12 performance Stop,
15/15 UI**, typecheck/build PASS. Backend 553,1 s, performance 16,1 s,
Playwright 48,5 s. Wyłącznie fikcyjne providery, tymczasowe bazy i lokalne
repozytoria testowe; nie testowano prywatnej instalacji WORKSTATION.

Domyślny katalog danych roboczych nie istnieje; `history:local doctor` zakończył
się `ENOENT`, nie tworząc bazy. Brak zmiennej wskazującej inne miejsce danych.
Liczników, blokad i kompletności rzeczywistej historii nie ustalono. Poproszono
użytkownika o właściwy katalog albo informację, że oryginał pozostaje na Macu.
Backup, configure WORKSTATION/LOCAL_ONLY, odczyt materiałów/CV i publiczny smoke
pozostają niewykonane do ustalenia historii oraz wymaganych potwierdzeń.

Zero rzeczywistych wysyłek/SELF_TEST, odczytów Gmaila, zmian OAuth/nadawcy,
zatwierdzonych materiałów lub prywatnej historii. Nie publikowano danych.

### Poszerzone szukanie bazy i procedura ręcznej historii

Na prośbę użytkownika przeszukano metadane plików bieżącego profilu Windows
(AppData, Documents, Desktop, Downloads, OneDrive i pozostałe dostępne katalogi),
dostępnego D oraz ProgramData/xampp/inetpub. Poza Temp nie znaleziono bazy ani
znacznika JobHuntera. Odmowy dostępu do chronionych katalogów systemowych
zachowano jako ograniczenie; bez eskalacji lub zmiany uprawnień. Mac nie był
dostępny w tej sesji, więc brak oryginalnej historii na obu urządzeniach
pozostaje niepotwierdzony.

Przed nowym sprawdzeniem fixture znaleziono **73 jobhunter.sqlite** w Temp:
19 DEMO, 18 RESEARCH_ONLY, 17 APPROVAL_REQUIRED, 19 AUTO_POLICY. Odczyt
`readonly/fileMustExist` i quick_check: 73/73 integralne, zero workstation.json.
Wszystkie adresy w contacts/history_records/send_attempts mają domeny testowe
.test/.invalid; nie odczytywano treści wiadomości lub poświadczeń. Oficjalny
`history:local doctor` na najnowszym fixture RESEARCH_ONLY: 35 firm, 1 kontakt,
36 aliasów, 1 blokada, zero ręcznych rekordów/prób/rezerwacji/shared/niepewnych.
Te liczby opisują test, nie rzeczywistą historię użytkownika.

Oddzielny nowy katalog DEVELOPMENT, Windows win32/x64, Node 24.19.0:
jednorazowa kontrola procedury bootstrap z istniejącymi Store/ResearchJobHunter.
Tylko dwa fikcyjne kontakty CSV: CONTACTED i REJECTED. PASS: podgląd nie dodaje
rekordów, zmieniony tekst blokowany przez hash, import 2, reimport 0, scalenie
aliasu przez domenę, zachowane statusy, doctor i spójny backup. Configure
przetestowano wyłącznie na tej syntetycznej historii. Zero wywołań sieci,
Gmaila, prób/outbox/rezerwacji, zatwierdzonych faktów i CV; stopped=true.
Nie uruchamiano serwera lub workerów. Pełny check powyżej nadal dotyczy tego
samego kodu a3bc37b; teraz zmieniono wyłącznie dokumentację.

Nowa baza robocza/import/oznaczenie WORKSTATION nie zostały wykonane.
Następny krok: decyzja o Macu/źródle historii, rzeczywisty prywatny CSV,
lokalny podgląd i konkretna zgoda przed utworzeniem bazy oraz importem.

### Decyzja o nowej instalacji i pusty szablon CSV

Użytkownik potwierdził brak wcześniejszych wiadomości JobHuntera do firm
i wybrał nową instalację Windows bez historii SELF_TEST z Maca. To świadoma
decyzja o źródle nowej historii, nie usunięcie danych ani zatwierdzenie importu.

Przygotowano poza repo pusty CSV UTF-8 BOM z dokładnymi kolumnami istniejącego
importera: company,status,domain,email,date. Zero wierszy firm. Zgodność nagłówków
i zapisanych bajtów sprawdzona; podgląd nagłówków wyrenderowany i obejrzany.
Brak konkretnej listy ręcznych kontaktów: nie ma podglądu danych/hashu do
zatwierdzenia importu. Nie utworzono docelowego katalogu danych lub SQLite.
Nie zmieniono kodu, nie uruchomiono Gmaila/researchu, nie zatwierdzono profilu/CV.
Pełny check wcześniejszego etapu nadal dotyczy tego samego a3bc37b.

Użytkownik następnie podał listę obejmującą jeden ręczny kontakt. Prywatny CSV
uzupełniono jako CONTACTED, bez dopisywania nieznanego adresu/domeny/daty.
Istniejący previewHistory uruchomiono wyłącznie w nowym tymczasowym DEVELOPMENT,
bez importHistory, start/tick/probe, serwera i sieci. PASS: jeden poprawny wiersz,
zero zapisanych history_records, send_attempts i outbox. CSV i jego hash/podgląd
pozostają poza repo; baza docelowa nadal nie istnieje. Nie zatwierdzono importu
lub utworzenia bazy za użytkownika.

Podgląd nowej inicjalizacji wykazał dodatkowo 34 seedowane firmy, w tym 33 dawne
HISTORY_TO_VERIFY i jedną zachowaną blokadę. Proponowana mała korekta tylko
nowej inicjalizacji jest opisana w TASKS/URUCHOMIENIE_RANO, jeszcze niewdrożona.
Nie zmieniono kodu ani istniejącej historii.

## Zatwierdzone CV po szybkiej nawigacji — runda po 2f515ff

Punkt wyjścia 2f515ff, czysty codex/local-windows-pilot, git fetch origin,
HEAD/upstream 0/0. MacBook, DEVELOPMENT i oddzielne syntetyczne bazy testowe.
Nie zmieniono działającej poprawki review/sendera, backendu, parsera, schematów
Codexa, LOCAL_ONLY, prywatnego runtime/CV/nadawcy lub historii. Zero native Gmaila,
publicznego researchu i rzeczywistych maili/SELF_TEST.

**Mechanizm błędu potwierdzono pełnym testem przeglądarkowym przed poprawką.**
Po dodaniu fikcyjnego PDF zatrzymano żądanie zatwierdzenia, przełączono panel na
Wiadomości i dopiero wtedy przekazano żądanie do istniejącego backendu fixture.
Zatwierdzenie zwróciło 200; ponowny odczyt profilu potwierdził approved_at dla
dokładnie tego ID/pliku w testowej SQLite. Mimo tego select zawierał wyłącznie
placeholder, także po kilku cyklach pollingu. Test FAIL po 10 s asercji obecności
opcji, bez zwiększenia timeoutu. Oczyszczone dane syntetyczne: status/ID/profil/opcje
zachowane w prywatnym katalogu tymczasowym poza repo, bez dołączenia do artefaktów.

Przyczyna: act po sukcesie wykonywał load zależny od bieżącego widoku. Po nawigacji
drafts/outbox odświeżały się, ale profile nie; cached cvs zachowywało approved_at=null,
a GmailDelivery poprawnie wykluczał niezatwierdzony plik. Taki sam objaw wystąpił
na MacBooku, więc nie przypisujemy go wydajności Windowsa. Stary Windows CI
38251081308 potwierdza brak opcji/timeout, ale nie zawiera diagnostyki API/profile:
ten konkretny historyczny interleaving pozostaje nieudowodniony.

Minimalna poprawka w App.tsx: udane act invaliduje profil, a następny load pobiera
go niezależnie od aktualnego widoku. Generacja invalidacji jest konsumowana dopiero
przez zaakceptowany load zawierający profil. Jeśli loadVersion odrzuci starszą
odpowiedź, nowszy load/poll przejmuje nadal oczekującą invalidację. Starsza odpowiedź
nie nadpisuje nowszego stanu. Nie ustawiamy approved_at optymistycznie; zachowano
backendowe zatwierdzenia, CV hash/binding i unieważnianie podglądu po zmianie CV.
Nie przywrócono pełnego pobierania aplikacji co 2 s ani nie zmieniono timeoutów.

8 nowych testów UI: zatwierdzenie i upload po nawigacji; odmowa 403 i błąd sieci;
opóźniona stara odpowiedź profilu; odrzucenie mutation refresh przez nowszy poll
z zastępczym pobraniem profilu; kilka CV, dokładny wybór, polling i unieważnienie
podglądu/zgody; wspólna ścieżka PersonalMaterials w ustawieniach AUTO_POLICY.
Nowe testy nie wywołują sendera; przygotowanie podglądu nie tworzy outbox/POST.
AUTO pozostaje zatrzymane, a samo zatwierdzenie/wybór CV nie zmienia polityki.

Zwykły gmail.spec osobno zachowany: operacje potwierdzane rzeczywistą odpowiedzią
API i stanem UI, konkretne ID CV zamiast ogólnego przycisku. Nie zastępuje regresji
nawigacji. Trzy z góry zaplanowane przebiegi 9 testów każdy: **27/27 PASS**; każde
uruchomienie Playwright tworzy świeży root DEVELOPMENT i nowe bazy fixture.
Zegar Playwright służy do wyzwalania pollingu, nie sleep/reload maskującego błąd.
Pełny npm run check: typecheck/build PASS, **350/350 backend, 12/12 performance Stop,
15/15 UI**. git diff --check i formatowanie zmienionych plików TS/TSX PASS.
CI finalnego SHA na obu systemach zostanie sprawdzone po pushu i wskazane w raporcie
końcowym czatu, nie na podstawie wcześniejszego zielonego przebiegu.
To nie jest test rzeczywistej poczty ani instalacji domowego Windowsa.

## Współbieżność review i sendera — runda po c9b899f

Punkt wyjścia c9b899f, czysty codex/local-windows-pilot, po git fetch origin
HEAD/upstream 0/0. Wyłącznie istniejący fixture DEVELOPMENT/LOCAL_ONLY/AUTO_POLICY,
fikcyjni providerzy, syntetyczny profil/CV i osobne tymczasowe bazy. Bez publicznej
próby, native Gmaila, prawdziwej poczty/SELF_TEST, prywatnego runtime lub historii.

**Podejrzany błąd odtworzono przed poprawką.** Test zatrzymał SEMANTIC_REVIEW na
kontrolowanym Promise i potwierdził zapis szkicu, auto_draft_scope oraz RUNNING.
Sender uruchomiony w swoim terminie wykonał zero POST i zero trwałych pominięć,
ale przestawił sesję na WAITING, paused=true i anulował kontroler trwającego review.
Przyczyna: wybór niezweryfikowanego materiału → DRAFT_MATERIAL_UNVERIFIED z końcowej
bramki → domyślna decyzja o problemie sesji → wait/pause odwołujące research.

Minimalna poprawka ograniczona do auto-policy.ts, bez migracji, UI ani nowej kolejki:

- PENDING/RUNNING nie są pobierane przez sender. ERROR także nie jest gotowy:
  tekst pozostaje do jawnego review-only retry, nie oznacza supported=false.
- Nie ma globalnej blokady sendera podczas researchu: gotowy B może być obsłużony,
  gdy nowszy A nadal czeka na model.
- Gdy review rozpocznie się już po wyborze lub przygotowaniu pakietu, końcowa
  bramka nadal blokuje operację, ale sender odracza ją bez odwołania sesji,
  anulowania review albo trwałego pominięcia wersji. Zachowany termin polityki
  zapobiega intensywnemu ponawianiu.
- COMPLETED z false/null pozostaje odrzuceniem wersji; kodowe REJECTED/NOT_RUN
  i nieważny materiał DRAFT_MATERIAL_STALE także nie wstrzymują całej sesji.
  Nie dodano automatycznego ponawiania negatywnych kontroli ani supported=true.
- draftMaterialIssues, kontrola wersji/kontekstu/źródeł/profilu/kontaktu/CV,
  rezerwacje, deduplikacja i ostatnie sprawdzenie uprawnienia przed POST zachowane.

12 nowych testów sprawdza: RUNNING → ten sam tekst/wersja/hash → dokładnie jedna
fikcyjna wysyłka po pozytywnym review bez drugiego DRAFT lub ręcznej zgody na mail;
gotowy B obok A; PENDING; ERROR i jawny review-only retry; COMPLETED false i null
bez retry; pozytywną odpowiedź providera po Stop; edycję i zmianę źródeł w toku;
review rozpoczynające się po wyborze i na QUEUED przed rezerwacją; kodowe odrzucenie.
Dwie równoległe próby sendera dają jeden POST/rezerwację. 20 dodatkowych wywołań
przed odroczonym terminem nie odczytuje historii ani nie wykonuje POST.

Testy celowane: 24/24 PASS (12 nowych + research-materials). Pełny npm run check:
typecheck/build PASS, 350/350 backend, 12/12 performance Stop, 7/7 UI. Istniejące
testy AUTO_POLICY także PASS w pełnym zestawie. git diff --check PASS.
To testy fixture na MacBooku, nie publiczny research, replay ani domowy Windows smoke.
CI końcowego SHA zostanie sprawdzone po pushu i wskazane w raporcie końcowym.

## Diagnostyka i zachowanie materiałów — runda po fb8151e

Punkt wyjścia fb8151e, czysty codex/local-windows-pilot, git fetch origin i zgodność
HEAD/upstream 0/0. DEVELOPMENT/LOCAL_ONLY i blokada prawdziwej poczty bez zmian.
Natywny CLI 0.162.0-alpha.17.2, istniejące logowanie ChatGPT, ta sama izolacja/flag.

### Ustalone przyczyny i poprawki

- Utrata informacji o awarii: ExecCodexRunner redukował błąd do ogólnego kodu, a
  model_calls nie zachowywało wersji/exit status/sygnału/komunikatu. Teraz każde
  wywołanie ma ID, etap, początek/czas, wersję CLI, operację, exit code/sygnał,
  klasyfikację i ograniczony oczyszczony komunikat. SEARCH także zapisuje błędy.
  Diagnostyka błędu jest w lokalnej bazie i osobnym prywatnym katalogu tymczasowym,
  nie w repo; bez środowiska, args, danych logowania i niepotrzebnych zdarzeń modelu.
  Fixture prawdziwego procesu Node kończy się kodem 37: zachowano EFRAME37/cause,
  usunięto fikcyjne tokeny/API key/Bearer oraz całe zdarzenie agent_message.
- Utrata tekstu: zapis następował dopiero po checkDraft i review. Strukturalny
  DRAFT jest teraz utrwalany przed nimi jako NIEZWERYFIKOWANY: dokładny tekst,
  wersja/hash, payload z claims/factIds/evidenceIds i kontekst faktów/dowodów.
  Migracja 017 jest addytywna; backup przed migracją pozostaje aktywny. Błąd review
  zachowuje tekst, ERROR i null supported; retry sprawdza ten sam materiał bez DRAFT.
  REJECTED kodowo zachowuje powód/fragment, a UNSUPPORTED_TECHNOLOGY również
  technologię, claim i factIds. Zmiana tekstu/profilu/kontaktu/źródeł unieważnia
  kontrolę. Sender wymaga bieżącego powiązania i zakończonych kontroli, nie samego
  starego supported=true. Edycja podczas generowania nie jest nadpisywana; nowy
  wynik pozostaje osobnym niezweryfikowanym materiałem w historii wersji.
- Odtworzone negatywne review na realnych zapisanych materiałach: brak mapowania
  sourceId → evidence.id i brak inquiryBasis w fragmentach przekazanych do kontroli.
  Model żądał równości dwóch różnych przestrzeni identyfikatorów i oceniał hipotezy
  metadanych jako deklaracje w mailu, choć sam opisywał tekst jako poparty faktami.
  Pakiet ma teraz sourceId przy dowodzie i kodowo sprawdzone dodatkowe cytaty;
  niezweryfikowane inquiryBasis daje null/ostrzeżenie. Review ocenia twierdzenia
  tematu/treści/claims, nie niewybrane projekty w objaśnieniu analizy. Pytanie o
  dostępność nie potwierdza zatrudnienia zdalnego; instrukcja ekstrakcji rozdziela
  zdalną obsługę klientów/ceny usług od warunków współpracy kandydata.
- Odtworzony false positive technologii w fixture: „modele językowe” w deklaracji
  vs „modeli językowych” w zatwierdzonym fakcie. Dodano tylko tę odmianę do istniejącej
  grupy LLM. Nadal konieczny jest odpowiedni factId; samo występowanie technologii
  w firmie lub niepowiązanym fakcie nie wystarcza. FAIL → PASS, negatywna asercja
  obcego factId zachowana. Nie jest to dowód, że ten konkretny zwrot wystąpił w
  historycznym utraconym szkicu UNSUPPORTED_TECHNOLOGY.

Historyczne SEARCH/DRAFT/SEMANTIC_REVIEW / CODEX_FAILED z poprzedniej rundy nadal
mają **nieustaloną pierwotną przyczynę**: komunikaty i exit metadata nie istnieją.
Nie powróciły w tej rundzie. Nie przypisano im limitu, loginu ani błędu kontekstu
wyłącznie na podstawie kodu. Historyczny kwestionowany fragment technologii także
nie został odzyskany; utraconych tekstów nie przedstawiamy jako odzyskanych.

### Replay zapisanych źródeł

Odczytano wyłącznie poprzednią syntetyczną diagnostykę, read-only, i wykonano
spójne kopie SQLite poza repo. Oryginał identyczny bajtowo po backupie. Nie otwierano
prywatnej bazy roboczej. Replay ma wyłączone search/HTTP i brak klasy/gateway Gmaila.
Publiczny parser v1 jest jawnie historią tekstu, nie nowym odczytem parsera v2.

Jeden zachowany szkic: ponowiono wyłącznie review, dokładny tekst/wariant/hash
bez zmian. Trzy utracone teksty: 3 NOWE generacje na zachowanych analizach/źródłach,
nie rekonstrukcja poprzedniej treści. Ich początkowe review wykonały się poprawnie,
ale dały false przez opisany niepełny kontekst, nie przez awarię procesu.

Po poprawce kontekstu: **5 review-only** na kopiach (3 nowych materiałów replay +
2 z pierwszej świeżej próby), **5 supported=true/issues=[]**, **0 DRAFT i 0 HTTP/search**.
Porównano dokładny tekst, wersję i hash przed/po: wszystkie identyczne. Zachowano
prywatne wyniki false przed poprawką; nie przepisano wyników w oryginalnych bazach.

### Świeże próby publiczne

Dokładnie dwie próby tej rundy, osobne nowe dane, profil syntetyczny, każda <15 min
i ≤5 firm. Pierwsza istniejącym npm run smoke:public, druga celowo 1 wcześniej
odrzucona firma: świeży HTTP strony i kontaktu, bez powtarzania wyszukiwania.

| Wynik                                          | Próba 1: search/HTTP | Próba 2: celowany świeży HTTP |
| ---------------------------------------------- | -------------------: | ----------------------------: |
| Kandydaci/firmy                                |                    5 |                             1 |
| Strony READ                                    |                    6 |                             2 |
| Zakończone ekstrakcje                          |                    5 |                             1 |
| Dopuszczone kontakty GENERAL                   |                    4 |                             1 |
| Wygenerowane i zachowane wersje                |                    4 |                             1 |
| Odrzucenia kontaktu                            |                    1 |                             0 |
| Odrzucenia kodowe szkicu                       |                    0 |                             0 |
| Poprawnie wykonane review z false              |                    2 |                             0 |
| Błędy wykonania review                         |                    0 |                             0 |
| Szkice po pełnej kontroli treści               |                    2 |                             1 |
| Niezweryfikowane / niedopuszczone przez review |                    2 |                             0 |
| Attempts / outbox                              |                0 / 0 |                         0 / 0 |

Tabeli nie przepisano po replay: pierwsze dwa false były realnymi wynikami i nie
liczyły się jako szkice po kontroli. Ich późniejsze 2 PASS należą do replay, nie
do trzeciej próby publicznej. Niezweryfikowany materiał nie jest gotowy do wysyłki;
nawet pozytywny review w tym adapterze nigdy nie udziela prawa do wysyłki.

Próba 2 potwierdziła parser v2 na rzeczywistej wcześniej problematycznej stronie:
Email oddzielone od adresu, brak dawnego zlepienia, literalny kontakt i kontekst,
GENERAL bez promocji, ekstrakcja → kwalifikacja → zachowany szkic → code/review PASS.
Bez zgadywania, zmiany źródła lub ręcznego dopuszczania kontaktu. Nie było limitu/
braku logowania; test tych blokad pozostaje fixture, nie pozorowanym research.

### Stop i warunki CI

Ponownie odczytano log macOS fb8151e: large-history receipt **1131,73 ms**,
revoke **1132,63 ms** (różnica **0,90 ms**), odpowiedź **1139,52 ms**; brak POST
w toku w tym przypadku. Oddzielny przyjęty POST kończył się po **352,25 ms**,
nie był odwoływany przez Stop. FAIL dotyczył receipt <1000 ms, nie bramki wysyłki.

Izolowane 3 pomiary przed pełnym check: receipt **335,79 / 295,26 / 207,58 ms**;
revoke po kolejnych **0,12 / 0,12 / 0,10 ms**. Historia: 10 035 wierszy, **7 588 632
bajty** odpowiedzi, budowa danych **17,65–19,72 ms**, dodatkowo serializacja i obsługa
HTTP na tym samym event loop. Pełny zestaw wykonywał testy w kilku procesach wraz
z ciężkimi testami Git/SQLite; w kolejnych lokalnych check receipt **459,56 / 550,26 ms**.
Dokładnego opóźnienia 1131,73 ms na hostcie CI nie odtworzono lokalnie; obciążenie
współbieżnymi testami i dużą odpowiedzią jest rozpoznanym czynnikiem, nie dowodem
na każdy szczegół schedulera/GC tamtego przebiegu ani gwarancją SLA aplikacji.

Pełny zestaw nadal mierzy Stop i twardo sprawdza brak nowych POST **od chwili odwołania
prawa**, także przed odpowiedzią HTTP. Ten sam scenariusz i 10 000 firm/kontaktów
jest dodatkowo uruchamiany szeregowo 3 razy (12 przypadków) w test:performance,
automatycznie w npm run check / obu jobach CI. Progi **1000 ms receipt i 100 ms
revoke po receipt bez zmian**. To rozdzielenie testu funkcjonalnego pod konkurencyjnym
obciążeniem od powtarzalnego pomiaru; nie wyłączenie pomiaru lub zakazu POST.

Końcowy npm run check: **338/338 backend, 12/12 izolowanych pomiarów Stop, 7/7 UI**,
typecheck/build PASS, macOS arm64 / Node v24.11.0. Celowane nowe regresje 12/12 PASS.
git diff --check PASS. Ostatnia powtórka początkowo miała brak pliku Chromium w
cache: backend/performance przeszły, UI nie wystartowało. Odtworzono wyłącznie
zależność testową przez playwright install chromium i powtórzono cały check.
CI finalnego SHA jest sprawdzane po pushu; wynik będzie podany w czacie, bez
zakładania PASS na podstawie samego workflow lub wcześniejszego SHA. Szczegółowe źródła,
szkice i diagnostyka pozostają poza repo. **Zero** rzeczywistego Gmaila/skrzynek/
send/SELF_TEST, prywatnego runtime/CV/materiałów/liczników, repo historii lub zakupów.
Domowa instalacja Windows i jej profil/Gmail nadal nieweryfikowane; CI to fixture.

## Powtórzenie publicznego researchu po strictOutputSchema

Poniżej zapis poprzedniej rundy, nie aktualne liczniki.

Punkt wyjścia **a32d843**, codex/local-windows-pilot. git fetch origin wykonany;
HEAD zgodny z upstream (0/0), checkout czysty. Zachowano bieżącą gałąź. Natywny
Codex CLI **0.162.0-alpha.17.2**, istniejące logowanie ChatGPT. Bez płatnego API,
zmiany konfiguracji/uprawnień lub osłabienia izolacji. Domyślne smoke:public tworzy
nowy katalog diagnostyczny z zatwierdzonym wyłącznie syntetycznym profilem.

W tym zleceniu wykonano dokładnie **dwie** rzeczywiste próby, każdą z limitem
5 firm / 15 min, na odrębnej bazie. Pierwsza zatrzymana na SEARCH / CODEX_FAILED:
0 kandydatów/stron/ekstrakcji/kontaktów/szkiców. Probe modelu i web search PASS,
ale właściwe wyszukiwanie bez wyniku. Adapter zachował tylko ogólny kod; pierwotna
przyczyna CLI nieustalona. Nie przypisano jej schematowi, loginowi ani limitowi.

Druga próba: właściwy research 7 min 24,7 s, także z probe poniżej 15 min.

| Etap                                        | Rzeczywisty wynik drugiej próby                                  |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Kandydaci                                   | 5                                                                |
| HTML PUBLIC_HTTP / HTTP 200 / READ          | 9 stron                                                          |
| Ekstrakcje po schemacie i walidacji cytatów | 5 zakończonych                                                   |
| Kwalifikacje                                | 5 zakończonych, 4 dopuszczone kontakty GENERAL / COMPANY_INQUIRY |
| Generowanie                                 | 3 poprawne odpowiedzi DRAFT, 1 błąd wykonania DRAFT              |
| Kontrola kodowa szkiców                     | 2 PASS, 1 UNSUPPORTED_TECHNOLOGY                                 |
| Kontrola semantyczna                        | 1 supported=true/issues=[], 1 CODEX_FAILED                       |
| Zapisane szkice                             | 1 NEEDS_REVIEW                                                   |
| Send attempts / outbox / approvals          | 0 / 0 / 0                                                        |

**Wynik całości INCOMPLETE**, run PAUSED / ITEMS_NEED_REVIEW. Nie jest to pełny
PASS wszystkich kandydatów. Zapisany szkic przeszedł cały rzeczywisty proces:
search → publiczny HTML → ekstrakcja → kwalifikacja → szkic → kontrola kodowa
→ osobny semantyczny review. Ponowny lokalny checkDraft na niezmienionej treści
z odczytanej read-only bazy także PASS: 8 claims, 6 factIds, 1 evidenceId.
Nie potwierdzono rekrutacji lub warunków współpracy; szkic pyta, nie obiecuje
dopasowania. Nie przenosi do profilu technologii firmy ani produkcyjnych wdrożeń.
Szkic ma 74 słowa; zachowano ostrzeżenie o krótszym tekście zamiast wypełniaczy.

Przyczyny niezapisania pozostałych szkiców, w kolejności przetwarzania:

- DRAFT / CODEX_FAILED: brak poprawnie zakończonego wywołania modelu. Dokładny
  surowy komunikat nie był zachowywany; przyczyna natywnego błędu nieustalona.
- SEMANTIC_REVIEW / CODEX_FAILED: generowanie i kontrola kodowa przeszły, osobny
  review nie zakończył się poprawnie. research_items przechowuje etap DRAFT,
  dokładniejszy etap potwierdza model_calls. Treść nie została utrwalona.
- QUALIFY / odrzucenie literalnego adresu: parser v1 skleił etykietę Email z
  adresem. Regex traktował etykietę jako część adresu; analiza usunęła kontakt,
  a strukturalny kontekst strony był pusty. To błąd parsera, nie dowód, że adres
  miał przeznaczenie sprzedażowe. Nie dopuszczono go ręcznie dla uzyskania szkicu.
- DRAFT / UNSUPPORTED_TECHNOLOGY: kod nie potwierdził technologii w deklaracji
  CANDIDATE we wskazanych factIds. Nie poluzowano bramki. Odrzuconej treści/nazwy
  technologii nie zachowano; bez niej nie można wykluczyć false positive.

Odtworzone FAIL → PASS na fikcyjnych danych: zlepiona etykieta/adres inline oraz
diagnostyczny szablon zachowujący szkołę/miasto/portfolio z bazowego profilu.
Parser v2 oddziela widoczne adresy w elementach inline, zachowuje etykiety i
blokady sprzedaży/sprzeczności; sam href nie potwierdza adresu, a fragment innego
adresu nadal jest odrzucany. Cache v0/v1 wymaga ponownego odczytu i nowej wersji
źródła; poprzednie rekordy/MIME nie są przepisywane. Read/cache i ostatnia kontrola
źródeł używają tej samej stałej wersji. Pierwszy test v1 wykrył stałe `=== 1`
w cache; zastąpiono je wspólną wersją i powtórzono regresję.

Szablon diagnostyczny jest całkowicie syntetyczny, a instrukcja pierwszego akapitu
bierze tożsamość/edukację tylko z zatwierdzonych faktów, bez stałego nazwiska/szkoły.
Zapisany rzeczywisty szkic już wcześniej pominął niepotwierdzone dane ze wzoru.
Raport smoke zawiera liczniki ekstrakcji/kwalifikacji i osobne agregaty błędów
modelu/kandydatów. Regresja odtwarza zapisany przez worker limit: BLOCKED_EXTERNAL
z etapem/kodem, mimo braku wyjątku z tick. Nieznany CODEX_FAILED lub błędny schemat
nie są automatycznie oznaczane jako limit/brak logowania.

**Nie wykonano trzeciej publicznej próby.** Wyniki liczbowe dotyczą parsera v1 i
szablonu użytego podczas drugiej próby; świeży publiczny odczyt odrzuconej strony
po parserze v2 i publiczna generacja po poprawce szablonu pozostają nieweryfikowane.
Nie zastąpiono ich testem offline. Również ACTIVE/OPEN i kontakt RECRUITMENT nie mają
pozytywnego rzeczywistego przypadku w tym przebiegu. Dalszy smoke wymaga osobnego
zlecenia lub wykonania przez użytkownika na domowym Windowsie.

Testy celowane **101/101 PASS**. Końcowy npm run check: **326/326 backend, 7/7 UI**,
typecheck/build PASS na macOS arm64 / Node v24.11.0. Backend 111,6 s, UI 33,7 s.
Duży HTML 2000 adresów: 88,8 ms w pełnym check, bez zwiększenia progów. git diff
--check PASS. CI nowego SHA jest sprawdzane po pushu, nie zastępowane wcześniejszym CI.

Pełne pięć analiz i jedyny zapisany, niezmieniony szkic pokazano w prywatnym pliku
poza repo. Publiczny raport nie zawiera firm/adresów, surowych stron, pełnych wyników
lub prywatnych ścieżek. **Zero** inicjalizacji/odczytów Gmaila, send/SELF_TEST, zmian
prywatnej bazy/runtime/materiałów/CV/historii/liczników, repo danych lub zakupów.
Nie zatrzymano aplikacji użytkownika. Domowy Windows, jego zatwierdzony profil i
rzeczywista poczta nadal wymagają odrębnych prób; CI offline nie jest takim pilotem.

## LOCAL_ONLY i domowy Windows

Poniższe sekcje zachowują wcześniejszą weryfikację a32d843; aktualne powtórzenie
publiczne i końcowe liczniki są powyżej.

Pobrano aktualne refy GitHub; main 4e6b864 był o 5 commitów za overnight 810b860.
Czysty lokalny checkout, nowa gałąź codex/local-windows-pilot. Nie znaleziono aktywnego
backendu w tym checkoutcie. Bazowy check na macOS arm64 / Node v24.11.0:
282/282 backend, 7/7 Chromium, typecheck/build PASS.

Końcowy npm run check: **322/322 backend, 7/7 UI**, typecheck/build PASS.
Backend 100,8 s, Playwright 31,2 s. git diff --check PASS. Wszystkie dane testów
syntetyczne w katalogach tymczasowych, odbiorcy example.test / example.invalid.
To rzeczywiste testy macOS tego kodu, nie prywatnej konfiguracji użytkownika.
Nie wykonano lokalnej próby PowerShell/instalacji domowego Windowsa nowej wersji;
wynik CI finalnego SHA będzie podany po faktycznym zakończeniu.

LOCAL_ONLY: pełny search/read/qualify/draft/send na fikcyjnych providerach bez repo.
claim/assertOwner/checkpoint/status HistorySync są celowo zatrute błędem; sesja
przechodzi, bo nie korzysta z nich ani Gita. Start/Wznów/Stop/readiness i shutdown
pozostają lokalne. Dwa Start dają jedną sesję. Drugi rzeczywisty proces otwierający
ten sam profil na innym porcie dostaje PROFILE_LOCKED. Utrata lock w oknie przed
POST daje zero POST. Development nie ma natywnego gateway/metadanych konta; sam
Windows bez lokalnego markeru też nie upoważnia. Fikcyjne AUTO działa niezależnie od OS.

Przejście PRIVATE_GIT → LOCAL_ONLY wymaga Stop, potwierdzenia i zgodności zamkniętej
opublikowanej historii; niepowodzenie nie daje fallbacku. Istniejące testy opcjonalnego
PRIVATE_GIT zachowane. Restart i odtworzenie backupu nie przenoszą prawa do wysyłki.
Zmiana RESEARCH_ONLY ↔ AUTO zachowuje bazę i niezmienioną politykę, lecz odwołuje sesje
i zgody. Timeout/shared unknown po restarcie lub zmianie historii nadal blokuje.

Backup przez VACUUM INTO obejmuje WAL. Test odtworzenia i migracji syntetycznej bazy
poprzedniego schematu zachowuje pełny eksport firm/aliasów/manual records/blokad/
SENT/SEND_UNKNOWN/shared attempts/shared usage i liczników; brak aktywnych approvals.
Migracja 016 dodaje tylko strukturę kontekstu. Nie otwierano prywatnej bazy do migracji.

Końcowy przegląd wykrył, że pomocniczy backup/restore-copy otwierał również oryginalny
Store i mógł uruchomić jego migracje. Poprawka oddziela read-only backup oraz odtworzenie
kopii od migratora. Procesowa regresja sprawdza identyczne bajty starszej syntetycznej
bazy i brak migracji 016 w backupie. Niepoprawne configure jest odrzucane przed odczytem/
migracją bazy. Przed pierwszą aktualizacją helper można uruchomić z osobnego checkoutu.

HTML: reprodukcja FAIL przed poprawką na dokładnym przykładzie bez kropki między
sekcjami. Po poprawce prawdziwy PublicSourceReader/DOM → kwalifikacja → fikcyjny AUTO:
osobny GENERAL i sprzedaż, nagłówek Sprzedaż nad biuro, HR obok faktur/RODO, div/section,
lista/br/tabela, heading nad kartą/listą, minifikacja/wcięcia, sprzeczne etykiety,
marketing systemów sprzedażowych, globalna odmowa, zmiana celu i usunięcie adresu PASS.
GENERAL pozostaje GENERAL. Stary cache PUBLIC_HTTP bez struktury nie kwalifikuje
kontaktu; następuje realny ponowny odczyt i nowa wersja. compact nadal weryfikuje cytaty.
Hash obejmuje wersję parsera i surową treść; stare rekordy i wysłane MIME nieprzepisane.
Test MIME nadal porównuje identyczną treść, normalizując tylko nowe granice bloków.

UI: trzy widoki, brak origin/handoff w LOCAL_ONLY, stan developerski i syntetyczne dane,
lokalna gotowość, Start/Pauza/Stop, historia i ponowne otwarcie zamkniętej karty podczas
działającej sesji. Zrzuty 1440/390 px obejrzane, brak poziomego overflow. PNG tylko
w ignorowanym test-results. Dodatkowo końcowy scenariusz AUTO czeka na aktualny licznik.

## Pomiar Stop przez HTTP

Realny serwer Fastify na osobnym porcie, prawdziwe żądania HTTP/sesja/CSRF; fikcyjne
usługi. Od t0 wysłania Stop mierzymy odebranie request przez Node, odwołanie prawa do
nowego POST i odpowiedź. Fikcyjny POST już przyjęty kończy się niezależnie po 350 ms.

| Obciążenie                                         | Odebranie Stop | Odwołanie prawa | Odpowiedź | Zakończenie przyjętego POST |
| -------------------------------------------------- | -------------: | --------------: | --------: | --------------------------: |
| Powolny publiczny read                             |       31,99 ms |        33,43 ms |  37,70 ms |                        brak |
| Powolny model                                      |       27,96 ms |        28,13 ms |  31,58 ms |                        brak |
| 10 000 firm i kontaktów + 3 równoległe odświeżenia |      443,07 ms |       443,36 ms | 444,39 ms |                        brak |
| Przyjęty fikcyjny POST                             |       24,43 ms |        24,58 ms |  28,38 ms |                   350,85 ms |

Odtworzony wcześniejszy FAIL: 10 000 firm i 3 odświeżenia dashboardu dały 3269,64 ms
do odebrania Stop. Usunięto N+1 historii i pełną historię z normalnego dashboardu.
Końcowy test jest silniejszy: także 10 000 kontaktów i odczyt pełnej historii firm.
Po Stop żadnego nowego POST. To pomiary na tym macOS, nie SLA na każdym komputerze,
czas internetu/Google lub odwołanie już wysłanego żądania.

Duży HTML bez grup sekcji, 2000 adresów / 108,9 kB: odtworzono 6863,95 ms parsera.
Lokalny indeks kontekstów i etykiet oraz deduplikacja zbiorami usuwają powtarzane
skanowanie całego kontenera. Powtórka 45,15 ms, test celowany 65,30 ms, pełny check
107,88 ms pod równoległym obciążeniem. Etykiety każdego adresu i sprzeczności zachowane;
nie cache'ujemy tych wyników między różnymi odczytami strony. Regresja zachowuje próg
1000 ms, bez zwiększenia timeoutu lub poluzowania kwalifikacji.

CI pierwszego SHA f25621e: macOS 319/319 + 7/7 PASS, Windows 314/319 (5 FAIL).
Jeden FAIL był błędem zegara fixture: przy wolnym Windowsie realny fetched_at powstawał
kilka sekund po początkowym zegarze logicznym; +24h1s nie wykonywało odświeżenia.
Źródła fikcyjnego adaptera związano z jego zegarem logicznym, asercje bez zmian.
Cztery FAIL mierzyły odwołanie prawa dopiero po zapisach SQLite (123–164 ms po receipt),
zamiast faktycznej bramki. Kod ma teraz odrębne prawo sesji w pamięci, odwoływane na
wejściu Stop/Pauzy/wstrzymania, przed I/O. Test rejestruje tę bramkę, zachowuje próg
100 ms i dodatkowo wymusza błąd zapisu: nadal zero POST. Nie osłabiono ostatnich kontroli
SQLite, sesji, materiałów lub kontaktów. Po poprawkach pełny lokalny check 322/322 + 7/7.
CI nowego finalnego SHA jest sprawdzane po pushu; poprzedni PASS macOS go nie zastępuje.

Soak: **6/6 PASS** — LOCAL_ONLY i PRIVATE_GIT, seed 17/41/93. Każdy 96 kroków po
15 minut plus 6 godzin logicznego snu, 30 h logicznych. Lokalny wariant zatruwa wszystkie
operacje HistorySync także po restarcie. ≥9 kierunków, >5 wiadomości, queue≤3, brak
drugiego kontaktu/rezerwacji, Pauza/Stop/restart/dzień Warszawa, błędy odczytów i końcowy
timeout zachowany jako SEND_UNKNOWN. To symulacja zegara z fikcyjnymi usługami, nie
całodniowa praca z Google. Prawdziwy systemowy sleep/resume nadal nieweryfikowany.

## Ograniczona próba publiczna

Wykonano jedną smoke:public na macOS: nowy katalog tymczasowy, jawnie syntetyczny profil,
maksymalnie 5 firm/15 min. Brak GmailJobHunter/gateway/native poczty/zgód/outbox potwierdzony
w kodzie i testem przed uruchomieniem. Native CLI **0.162.0-alpha.17.2**, exec help i
login status ChatGPT sprawdzone; bez odczytu auth.json lub zmian konfiguracji globalnej.

Wynik **niepełny/FAILED_EXTRACTION**: 5 kandydatów, 5 odczytanych stron, 0 zakwalifikowanych
kontaktów, 0 szkiców i 0 prób/outbox. Pięć ekstrakcji zapisanych jako CODEX_FAILED.
Kontrolny syntetyczny proces ujawnił odrzucenie schematu (optional properties w strict
output); poprawka wymaga jawnych kluczy w schemacie CLI, bez zmiany walidatorów/izolacji.
Regresja offline i rzeczywisty Codex na fikcyjnym wejściu PASS, webSearches=0.

Nie powtarzano publicznej próby po poprawce. Nie ma szkiców do oceny zgodności treści
ze źródłami; próba nie rozstrzyga kontekstu kontaktów na realnych stronach lub skuteczności
kandydatury. Pełne źródła/wyniki są poza repo; raport nie publikuje firm/adresów/logów.
Gotowe polecenie Windows: npm run smoke:public, potem jawne --approved-profile KATALOG_BAZOWY
z już zatwierdzonymi materiałami (tylko odczyt oryginału). Brak loginu/uprawnień/limitu
da BLOCKED_EXTERNAL, nie fallback do paid API/full access.

**Zero prawdziwych send/SELF_TEST, odczytów skrzynki, zmian nadawcy/OAuth/CV/materiałów,
prywatnej bazy/liczników/runtime, repo historii lub zakupów.** Nie zatrzymano aplikacji
użytkownika i nie uruchomiono migracji na prywatnych danych. Publiczna próba była
wyraźnie diagnostyczna; nie przygotowuje kolejki do późniejszej produkcyjnej wysyłki.

## Wyniki historyczne

Kod nowego etapu: 3dfb49b8e4db92580fb3be735088b923f37d7e93, gałąź
[codex/local-windows-pilot](https://github.com/JakubLewosz/JobHunter/tree/codex/local-windows-pilot).
Osobny commit zachowuje ten raport. Zdalny ref i CI finalnego SHA są sprawdzane po
pushu i raportowane w czacie / Actions; main nie jest automatycznie scalany.

## Stabilizacja nocna — `codex/overnight-stabilization`

Windows win32/x64, Node **v24.19.0**, npm **11.17.0**. Czysty punkt wyjścia
`4e6b864c2623626cf319671ab3a83c8756dd6822`; `git fetch origin` wykonany.
Bazowy `npm run check`: **237/237 backend, 7/7 UI**, typecheck/build PASS.
Nie wykazano błędu bazowych kontroli. Późniejszy pełny etap P0:
**253/253 backend, 7/7 UI**, typecheck/build PASS.

**Końcowy `npm run check` po poprawce CI: 282/282 backend, 7/7 UI, typecheck/build PASS**,
Windows win32/x64, Node v24.19.0. Backend 623,7 s; Playwright około 1 minuty.
`git diff --check` PASS. Dodatkowy ostatni review obejmował całość diffu i pliki nowe.

Odtworzone FAIL → PASS: wcześniejsza korespondencja A (przed podglądem i przy ostatnim
scanie), zmiana kolejności A/B podczas kontroli, ręczne zatwierdzanie w oknie sendera.
Pierwszy test zmiany kolejności nie wykonywał świeżego odczytu z powodu poprawnego cache;
fixture zmieniono na przestarzałe źródło, aby faktycznie uruchomić badaną granicę await.
Niezależny przegląd odtworzył ponadto zmianę origin po fetch, zmianę gałęzi, Start podczas
handoff, niesymetryczne aliasy, odziedziczenie starego zakresu, restart kierunków po zmianie
limitu i cache ignorujący nową podstronę pominiętej firmy. Wszystkie dostały poprawki
oraz regresje w izolowanych danych. Podwójny Start i pojedyncza rezerwacja miały już
zabezpieczenia; dodano sprawdzenie równoległych wywołań sendera.

Testy kwalifikacji A–F oraz treści: active=no nie blokuje samego zapytania;
GENERAL zachowuje przeznaczenie; unknown daje pytanie; niedopasowanej oferty nie
przepisujemy na PROSPECT. Osobna podstawa działalności jest literalna, a odmowa firmy,
formularz, konflikt i niejednoznaczny zakres ograniczenia blokują. Cel konkretnego
adresu jest sprawdzany w jego zdaniu/linii, nie na podstawie innego adresu sprzedaży
w stopce. To nie jest gwarancja bezbłędnej interpretacji każdej strony.

Próba przyspieszenia bramki historii przez lokalne fingerprinty została wycofana:
niezależny przegląd odtworzył ominięcie przez commondir i zmianę efektywnego globalnego
origin. Końcowy kod zachowuje pełną kontrolę Git; nowe regresje używają wyłącznie plików
temp i przywracają zmienną GIT_CONFIG_GLOBAL w finally. Odrzucono niebezpieczny cache,
nie osłabiono asercji własności. Pomiar/optymalizacja Stop pozostają P2.

Gmail: najwyżej dwa kompletne scany na jedną kontrolę, ten sam scope, sprawdzenie
konta/paginacji; pozytywna wiadomość manualna blokuje kontakt. Niestabilny historyId
i błąd strony pozostają ERROR. Retry dotyczy wyłącznie bezpiecznego odczytu z backoffem,
nigdy POST. Zachowana niepewność i ostatnia bramka MIME/CV/konta/sesji.

Planer testowany po 10 wykonanych kierunkach, także przez ponowne utworzenie obiektu
i pełny restart AUTO w soak. Metryki/cursor/cooldown w SQLite; zmiana samego limitu
nie rozpoczyna listy od nowa. Kolejka pozostawia resztę kandydatów PENDING; nowa wersja
źródła/kontaktu unieważnia cache zależny od źródeł i materiałów.

`npx tsx --test tests/auto-soak.test.ts`: **3/3 PASS**, seed **17, 41, 93**.
Każdy przebieg ma 96 kroków po 15 minut oraz 6 godzin logicznego snu — **30 godzin**,
łącznie 90 godzin logicznych. Fikcyjne nowe/znane firmy i tracking URL, błędy źródeł
i historii, niepewny review, Pauza/Stop/restart, zmiana dnia Europe/Warsaw, brak limitu,
symulowany właściciel i transakcyjny transfer do osobnej bazy; na końcu timeout po
przyjęciu. Asercje: >8 kierunków, >5 maili, queue≤3, brak drugiego kontaktu/rezerwacji,
brak nadrabiania serią, zero POST po odwołaniu i zachowany SEND_UNKNOWN. Zegar źródeł
fixture został związany z czasem logicznym: wcześniejsza wersja fixture zwracała czas
rzeczywisty, więc po dobie kontrola słusznie blokowała przeterminowane dowody.

Soak używa podstawionego transportu właściciela bez sieci; **osobny** A→B→A używa dwóch
baz i dwóch realnych klonów lokalnego Git, aliasu prawnego, ręcznych rekordów i syntetycznych
zamrożonych prób/liczników FIRST_CONTACT/SELF_TEST. Nie jest to realna doba Google ani
pełna macierz awarii właściciela w tej samej symulacji. Testy limitów, OPEN/PROSPECT,
zmiany globalnej historii, paginacji i procesu CLI są osobnymi scenariuszami.

Pełny check w trakcie pracy: **273/274 backend**. Regresja własnej zmiany cache powodowała
nowe wersje tej samej firmy i przedwczesny koniec historycznej godzinnej sesji ręcznej.
Zależność od nowych źródeł ograniczono do AUTO_POLICY, zachowując dotychczasowy limit
i deduplikację RESEARCH_ONLY. Istniejąca asercja 10 kandydatów i 5 tur bez zmian;
celowany test PASS. Pełna kontrola końcowego kodu została ponowiona.

Regresja własnej zmiany UI: ograniczenie pobierania pominęło dane outbox raportu DEMO
i bezpieczne wartości przed pierwszym załadowaniem widoku. Dwa scenariusze Playwright
FAIL; uzupełniono wymagane dane aktywnego Raportu i ponowny kompletny przebieg **7/7 PASS**.
Nie usuwano asercji ani nie zwiększano timeoutów. AUTO UI sprawdza brak pobierania replies/reports,
blokadę ręcznego endpointu, wyszukiwarkę historii i zachowanie trybów. Zrzuty 1440/390 px
w ignorowanym test-results; wyłącznie fikcyjne treści.

CI: `.github/workflows/offline-check.yml`, Windows/macOS, Node 24.19.0,
`npm ci`, Chromium i `npm run check`. Oficjalne akcje checkout/setup-node/upload-artifact
v7 zweryfikowane 11 października w README upstream i przez odczyt tagów Git, przypięte SHA.
Permissions contents:read, brak zapisanych sekretów i płatnej infrastruktury, concurrency,
retencja fikcyjnych PNG/raportu po porażce 3 dni. Stan CI konkretnego SHA publikacji zostanie podany w końcowym raporcie czatu;
przebiegi są dostępne w [Actions](https://github.com/JakubLewosz/JobHunter/actions).
Nie uznawać przygotowania workflow za zakończony wynik macOS.

Publikacja kodu/UI: `d10e42f7989a2d3af5cc8bba0d1caf12fa6e67a6`, gałąź
[`codex/overnight-stabilization`](https://github.com/JakubLewosz/JobHunter/tree/codex/overnight-stabilization).
Dwa logiczne commity, rzeczywisty push i odczyt ref zgodny z lokalnym SHA.
Skan 31 wychodzących blobów obu commitów i plików: bez prywatnych artefaktów/sekretów.
Osobny końcowy commit zapisuje ten stan publikacji w dokumentacji. Main nie scalono.
Git nie miał autora: użyto wyłącznie per-command `Codex <codex@localhost>`, bez zmiany
globalnej konfiguracji lub kont aplikacji. Wynik CI konkretnego finalnego SHA w raporcie czatu.

CI `45c3a318ff2cac3a93365e7f5265e154accfc491`: macOS **PASS**, Windows **240/280**, 40
błędów tej samej kontroli ścieżki. Log pobrano istniejącym uwierzytelnieniem GitHub
wyłącznie dla tego repo, bez przekazania sekretu do modelu/logów i bez zmian uprawnień.
Odtworzono lokalnie FAIL: Git zwracał inną wielkość litery dysku niż konfiguracja
realpath. Poprawka porównuje tożsamość fizycznego katalogu (dev/ino BigInt), zamiast
uznawać różnicę litery dysku za inne repo. Negatywny test innego katalogu nadal blokuje.
Nie wyłączono kontroli origin, HEAD, gałęzi lub dowiązań. Obie nowe regresje PASS;
ponowny pełny lokalny check **282/282 + 7/7**. Poprawka i ten raport będą wypchnięte
na tę samą gałąź. Wynik obu zadań CI nowego SHA wymaga rzeczywistego zakończenia;
końcowy raport czatu podaje dokładny ref oraz link przebiegu.

**Zero** prawdziwych send/SELF_TEST, odczytów skrzynki, zmian nadawcy, OAuth/CV,
zatwierdzonych materiałów, prywatnych liczników i historii. Nie uruchamiano prywatnej
bazy do migracji i nie zatrzymano backendu użytkownika. Migracje tylko na tymczasowych
syntetycznych bazach. Nie wykonano optional live researchu ani nowego audytu native CLI.

Nieweryfikowane: macOS użytkownika, publiczny research/aktualne CLI login/limity,
całodzienne działanie z Gmail, dostarczalność, pełna izolacja OS, rzeczywisty prywatny
origin oraz kompletna macierz przerw handoff/utraty wyniku push. Dokładny następny
etap w TASKS; konfiguracja/pilotaż w URUCHOMIENIE_RANO.

## Poprzedni etap — AUTO_POLICY, źródła i prywatna historia

Rzeczywiście wykonany końcowy `npm run check` na Windows win32/x64, Node 24.19.0: **237/237 testów backendu, 7/7 scenariuszy Playwright, typecheck i build PASS**. `git diff --check` PASS. Testy używają tymczasowych SQLite, fikcyjnych źródeł/Gmaila, fikcyjnego procesu CLI oraz lokalnych repozytoriów Git. Nie wysyłano rzeczywistych maili, nie uruchamiano prawdziwej kampanii, nie zmieniano nadawcy, OAuth, prywatnej bazy lub jej liczników. Nie tworzono zdalnego repo historii.

Stan bazowy: 205/206 backend; jedyny błąd Windows dotyczył FIFO hooków cleanup zamykających drugą bazę dopiero po próbie usunięcia katalogu. Poprawiono kolejność zamknięcia. Dwie nowe regresje źródeł/kontaktów najpierw FAIL, potem PASS: niezmienna treść z nowym potwierdzeniem i aktualizacja/unieważnianie kontaktu. Próba ciągła wykryła też liczenie starych szkiców jako budżetu nowego cyklu; poprawiono trwały licznik generacji w konkretnym runie. Rozstrzygnięta lokalnie próba nie pozostaje globalnie zablokowana przez jej starszą przeniesioną kopię SEND_UNKNOWN, a firma nadal pozostaje skontaktowana.

Nowe testy obejmują:

- pełny search/read/extract/qualify/draft/send bez indywidualnej akceptacji, tylko konfiguracja i Start;
- GENERAL dopuszczony polityką, zachowanie przeznaczenia, niedopuszczony kontakt, brak promocji GENERAL na RECRUITMENT;
- unknown godzin i pytanie kontra zmyślone dopasowanie; niepewny review pominięty;
- stronę firmy i osobną stronę kontaktu, recheck niezmienionej treści starszej niż doba, zniknięcie/zmianę przeznaczenia;
- pełny literalny email, bez akceptacji samego fragmentu opublikowanego adresu;
- Pauzę/Stop podczas researchu i przed POST, długą pauzę z ponownym przygotowaniem niewysłanego pakietu;
- pojedynczy POST po możliwym przyjęciu, SEND_UNKNOWN/restart/reconcile bez drugiego send;
- limit sesji, tempo, pięć pierwszych kontaktów bez limitu i kolejkę maksymalnie trzech szkiców; brak odziedziczonej daty/czasu końca;
- limity Gmaila/Codexa, brak intensywnego retry, jawne wznowienie; SENDING własnego sendera nie zatrzymuje poprawnie pracującego researchu;
- zmianę profilu/CV/nadawcy, kontrolę publicznych dowodów przed prywatnym odczytem, snapshot konta przed HTTP odczytu;
- deduplikację/liczniki po przeniesieniu i zmianie nadawcy, domenę znanej firmy/wariantu prawnego, import domeny do istniejącego rekordu;
- właściciela, niedomknięte przekazanie, konflikt aliasów, staging przerwanego eksportu, usunięcie historii, pierwszą bazę wymagającą potwierdzenia;
- eksport bez aktywnej zgody, OAuth/loginu, CV/PDF i całej skrzynki; liczniki SELF_TEST odrębne od aplikowania;
- panel AUTO przy 1440 i 390 px, Start/Historię/Pauzę/Stop/przekazanie. Zrzuty obejrzano. Zakładka odpowiedzi ukryta, stare dane/API zachowane.

Windows instalacja/diagnostyka: `npm ci`, SQLite 3.53.4, doctor, native `codex --version`, `codex exec --help`, `codex features list` PASS (CLI 0.162.0-alpha.17.2). Pierwsza instalacja próbowała niepotrzebnej kompilacji SQLite i natrafiła na CA/Visual Studio. Pakiet zawiera gotową bibliotekę; .npmrc wyłącza zależnościowe lifecycle scripts, następne zwykłe npm ci i rzeczywiste ładowanie SQLite PASS. Chromium pobrano z systemowym CA, bez wyłączenia TLS.

Rzeczywisty smoke `scripts/start.ps1 -NoBrowser` → backend DEMO/health → `scripts/stop.ps1` → zwolnienie blokady PASS w oddzielnym katalogu tymczasowym ze spacjami i polskimi znakami. To nie jest próba prawdziwej sesji AUTO/Gmaila.

**Nie zweryfikowano:** nowego kodu na macOS, natywnego researchu/limitów rzeczywistego konta Codexa, jakości wszystkich ekstrakcji, niezależnej izolacji całego procesu OS, całego dnia pracy, prawdziwego repo historii, historii prawdziwych kont i dostarczalności Gmaila. Pierwszy rzeczywisty eksport powinien wykonać użytkownik na urządzeniu z oryginalną bazą przez przygotowanie historii bez sesji wysyłkowej. Rzeczywista wysyłka wymaga konfiguracji/polityki i świadomego Start użytkownika.

## Historyczne próby — 8–9 października 2026

## Publikacja do niezależnego przeglądu — 9 października

Na nowe polecenie użytkownika przygotowano publikację całego aktualnego kodu i dokumentacji do weryfikacji przez ChatGPT. Przejrzano diff poprawki blokad między kontami i jej pięciu syntetycznych regresji; kod/testy od ostatniego pełnego check niezmienione. Ostatni rzeczywiście wykonany check pozostaje **206 backend / 6 UI PASS** opisany niżej; pełnego zestawu przy samym przygotowaniu publikacji nie powtarzano. Dodano [materiał przeglądu](REVIEW_HANDOFF.md) z bieżącym stanem, kolejnością czytania, ograniczeniami źródeł i proponowanymi etapami. Skan 92 plików nie znalazł znanych adresów z lokalnych podglądów testowych, sprawdzanych wzorców sekretów ani plików EML/PDF/SQLite/kluczy; zbędny jawny adres konta projektu w opisie zastąpiono jego rolą. Prywatne podglądy/EML/CV/SQLite/OAuth pozostają poza repo, bez nowych operacji Gmail lub zmian runtime. `git diff --check` PASS.

## Blokady firm i diagnoza dawnych kontroli — 9 października

Punkt wyjścia: czyste `main` po opublikowanym `db12c29`; instrukcje, lokalny kod, istniejące regresje oraz SQLite odczytano bez mutacji rzeczywistej bazy. Nowy test zmiany nadawcy/restartu odtworzył lukę: zapisany wcześniejszy kontakt pierwszego konta nie blokował nowego podglądu FIRST_CONTACT drugiego konta. Pierwszy `node --import tsx --test --test-name-pattern='zmiana nadawcy i restart|odpowiedź w SELF_TEST' tests/gmail-delivery.test.ts`: 1 PASS / 1 FAIL, brak oczekiwanego odrzucenia.

Minimalna poprawka w service.ts usuwa filtr konta z blokady już znanej korespondencji firmy. Zgoda i pełna kontrola historii bieżącego konta nadal wymagane; nie zmieniono zdalnego zakresu odczytu. LEFT JOIN outbox wyklucza odpowiedzi przypisane do SELF_TEST, aby test nie oznaczał firmy jako skontaktowanej. Bez migracji, nowego stanu firmy lub kasowania historii. Dodano pięć testów na mockach/katalogach tymczasowych, obejmujących OUTGOING/INCOMING między kontami i restart, SELF_TEST, akceptację i ostatnią bramkę przed POST, alias/subdomenę w Cc/Bcc oraz podobną obcą domenę, brak/wygasłą zgodę i zmieniony zakres. Celowane uruchomienie pięciu regresji: 5/5 PASS. Istniejący test false/null semantic review wykonany ponownie wraz z dwiema nowymi regresjami: 3/3 PASS; nie dodano drugiego mechanizmu generowania.

Końcowy rzeczywiście uruchomiony **`npm run check`: 206/206 backend, 6/6 UI (25,9 s), typecheck/build PASS**. `git diff --check` PASS. Testy syntetyczne, bez rzeczywistego Gmaila. Na zakończenie tego etapu zmiany pozostawiono lokalnie, bez nowego commit/push lub restartu rzeczywistego runtime; późniejsze przygotowanie publikacji opisano na początku raportu.

Readonly diagnoza dwóch historycznych ERROR / DRAFT / SEMANTIC_REVIEW_FAILED: odpowiadające model_calls SEMANTIC_REVIEW mają OK w dokładnie tych samych chwilach, 7 października 13:21:40 i 13:42:15 Europe/Warsaw. To błąd po otrzymaniu poprawnej strukturalnie odpowiedzi, a nie zarejestrowany timeout/brak dostępu modelu. Zachowano po jednym źródle READ, lecz brak odrzuconych szkiców, draft_versions i odpowiedzi supported/issues dla tych prób. Nie można wskazać konkretnego zakwestionowanego zdania ani rozstrzygnąć false/null. Obecny generator już zachowuje negatywny/niepewny wynik w NEEDS_REVIEW; odrębna bramka Gmail wymaga supported=true. Nie zmieniono dawnych ERROR, nie ponawiano wywołań modelu i nie odtwarzano utraconych szkiców.

Poza repo przygotowano roboczy przegląd dwóch istniejących wersji wiadomości, z ich dokładną niezmienioną treścią. Odczytano jednorazowo dwa znane publiczne URL przez istniejący PublicSourceReader, bez automatycznego researchu lub modelu: oba READ, oba zapisane kontakty nadal literalnie obecne, wszystkie dawne cytaty analizy obecne dokładnie (9/9 i 8/8). Jest to kontrola obecności cytatów, nie pełna weryfikacja semantyczna lub potwierdzenie wakatu/warunków. Publiczne źródła: [Codapi](https://www.codapi.pl/), [PRODAUT](https://www.prodaut.pl/). Kopie źródeł i przeglądu lokalne, 0600 w prywatnym katalogu 0700; historycznych źródeł SQLite nie zastępowano. Kontakty GENERAL pozostają NEEDS_REVIEW; aplikacja nie ma jeszcze jawnej operacji użytkownika do ich rozstrzygnięcia. Nie jest to gotowa zatwierdzona paczka MIME.

Rzeczywisty Gmail nie był odczytywany, wysyłany ani rekonfigurowany. Dotąd brak zapisanych kontroli historii firm; nie zakładamy pustej skrzynki. Sender/research pozostają zatrzymane, 19 prób/rezerwacji i pusta aktywna kolejka. Wszystkie tabele prywatnej SQLite porównano readonly po odczycie źródeł z prywatnym zestawem hashy początku tego etapu: bez zmian. Windows smoke niewykonany.

## Kontrola przed zleconym pushem — 9 października

Na nowe wyraźne polecenie użytkownika przygotowano publikację wszystkich aktualnych zmian kodu, testów i dokumentacji. Pierwszy ponowny `npm run check`: 200/200 backend, 6/6 UI (27,6 s), typecheck/build PASS. Przegląd audytora wykrył, że kontrola leksykalnej ścieżki `--private --output` mogła dopuścić dowiązanie prowadzące do repo. Nowy syntetyczny test w całości tymczasowego repo najpierw FAIL (raport zapisany zamiast odrzucony), po użyciu fizycznej ścieżki rodzica PASS; objęto też przejście symlink/.. na bieżącym macOS. `node --import tsx --test tests/mime-inspection.test.ts`: 9/9 PASS.

Końcowy rzeczywiście uruchomiony **`npm run check`: 201/201 backend, 6/6 UI (26,2 s), typecheck/build PASS**. Testy używały syntetycznej poczty i katalogów tymczasowych; nie inicjowały rzeczywistej wysyłki, researchu lub odczytu prywatnej skrzynki. Windows smoke nadal niewykonany. Przegląd 91 plików repo (w tym nowych) nie znalazł znanych prywatnych adresów odbiorców/osobistego nadawcy, sprawdzanych wzorców rzeczywistych sekretów ani plików EML/CV/SQLite/kluczy. Dodano ignorowanie *.eml; prywatny runtime i źródła pozostają poza repo. `git diff --check` PASS; nie zmieniano konta, danych, liczników, zgód lub stanu sendera w przygotowaniu publikacji.

## Przełączenie bieżącego nadawcy na wybrane starsze konto

Na nową decyzję użytkownika zakończono istniejący OAuth i lokalnym normalnym API zsynchronizowano konto kampanii przez nowy niezatwierdzony SELF_TEST. From/To wskazują wybrane konto, pełny temat/plain/HTML/PDF/nazwa identyczne z referencją, hash/round-trip poprawne i Subject 48/52/29. Zero zatwierdzeń/send i zero odczytu wiadomości Gmail. Sender/research zatrzymane, schedule=false, kolejka pusta; nadal 19 prób/rezerwacji. Readonly porównanie wszystkich wierszy prób/ledger/outbox/szkiców/wersji/profilu/faktów/CV ze świeżym prywatnym snapshotem: bez zmian; integrity/foreign keys poprawne. Kod bez zmian, tylko konfiguracja/dokumentacja; `git diff --check` PASS, pełnego check nie powtarzano (ostatnie wcześniejsze 200 backend / 6 UI). Starsze konto pozostaje bieżącym nadawcą do nowej decyzji użytkownika.

## Wynik odbiorców serii 9 października

Użytkownik zgłosił **5/5 Odebrane starszego konta i 3/3 Spam projektu**. Na wspólnych mail2/mail4/mail5 każda para ma starsze Odebrane/projekt Spam przy tej samej aplikacji, transportowaniu Gmail API i dokładnie zgodnych pełnych częściach generowanych przed API/PDF. Wszystkie osiem pozostaje SENT_CONFIRMED. Foldery zapisano jako relację użytkownika, bez odczytu skrzynek odbiorców lub udawania weryfikacji nowych EML. Mocniejsza hipoteza czynnika związanego z nadawcą; sam wiek, reputacja i historia starszego konta nierozdzielone, kolejność starsze→projekt stała. Nie stwierdzono naprawy Spamu ani nowej usterki MIME.

Tylko dokumentacja i nowy prywatny raport odbiorców poza repo; SQLite readonly potwierdza 19 dawnych prób/rezerwacji, sender/research zatrzymane, brak kolejki, konto projektu aktywne. Zero nowych operacji Gmail/send. `git diff --check` PASS; pełnego check nie powtarzano, poprzednie 200 backend / 6 UI pozostają wcześniejszym wynikiem. Następny krok może wykorzystać istniejącą parę EML, bez nowej wysyłki. [Szczegóły](GMAIL_DELIVERABILITY_AUDIT.md).

## 9 października: pięć prób starszego nadawcy i trzy konta projektu

Na wyraźną listę i zlecenie użytkownika wysłano **8 wiadomości, wszystkie SENT_CONFIRMED**: starszy nadawca mail1–mail5 (10:37:43 oraz 10:40:41–48 Europe/Warsaw), konto projektu mail2/mail4/mail5 (10:43:41–47). Projekt mail1/mail3 pominięto na podstawie dawnych prób. Brak historii ręcznej projektu z mail2/mail4/mail5 potwierdził użytkownik; nie przeszukiwano całych skrzynek. Starsza historia odbiorców niezweryfikowana.

Każda próba użyła normalnego SELF_TEST, świeżego podglądu/hasha i jednej zgody; dokładne zapisane bajty zgodne z zatwierdzeniem, właściwy nadawca/adresat, ten sam temat/plain/HTML/PDF/nazwa jak referencja. Subject 48/52/29 i round-trip poprawne, brak Cc/Bcc/Reply-To. Początkowo martwy backend zatrzymał pracę przed send; uruchomiono istniejącą wersję bez nowych migracji. Pomocniczy odczyt pierwszego mail1 trafił na równoległe SENT_CONFIRMED (INVALID_STATE); wynik potwierdzono readonly i kontynuowano od mail2, bez ponowienia pierwszego send. Potem OAuth przełączono na konto projektu i wykonano trzy osobne podglądy/wysyłki.

`node --check` prywatnego skryptu PASS; dwa `npm run --silent audit:eml --` z prywatnym `--output` (referencja + pięć A / wszystkie osiem A) PASS, pełne części dokładnie zgodne. `git diff --check` PASS. Kod produktu bez nowych zmian; pełnego check nie powtarzano (poprzednio 200 backend / 6 UI). Readonly porównanie ze snapshotem potwierdziło wszystkie wcześniejsze wiersze prób/ledger/outbox/szkiców/wersji/profilu/faktów/CV bez zmian, SQLite integralne. Teraz 19 prób/rezerwacji, dzisiaj 8/10, kampania 19/50; bez resetu. Konto projektu przywrócone, sender/research zatrzymane, schedule=false, killSwitch=false, kolejka pusta. Osiem rzeczywistych send i celowane potwierdzenia Wysłanych; foldery były w tym etapie jeszcze nieznane, później użytkownik zgłosił 5/5 Odebrane starszego konta i 3/3 Spam projektu — wynik powyżej. [Szczegóły](GMAIL_DELIVERABILITY_AUDIT.md).

## Wynik Gmail 21:50: Spam; przerwa na prośbę użytkownika

Dostarczone Wysłane/odbiorca jednoznacznie odpowiadają próbie nr 11 (końcowy RFC ID/konto/adresat). Użytkownik zgłosił Spam; EML nie zawiera etykiety folderu. A/B całe zakodowane body i części identyczne, Subject 48/52/29; Date +86 s i RFC ID zmienione. C ma Subject 84/32, siedem spacji→CRLF i końcowy CRLF w plain, końcowy CRLF w HTML; PDF bajtowo identyczny. Dokładne i CRLF→LF porównanie B/C false, bez ukrywania białych znaków. C raportuje SPF/DKIM/DMARC/ARC PASS i zgodny body hash relaxed (bez pełnej weryfikacji podpisu/DNS). Pełne części i nazwa PDF tej kopii ze Spamu są dokładnie identyczne z pozytywną kopią WP. Nie wykazano przyczyny Spamu ani koniecznego wieku konta.

Nowy lokalny CLI A/B/C z prywatnym `--output` PASS, niezależne Python/email/difflib i inspection.ts; `git diff --check` PASS. Tylko dokumentacja zmieniona, pełnego check nie powtarzano (poprzednio 200 backend / 6 UI PASS). SQLite readonly; zero nowych operacji Gmail i wysyłek. Sender/research zatrzymane, kolejka pusta, schedule=false, killSwitch=false bez zmiany; 11 prób/rezerwacji zachowane. Dalsze próby wstrzymane na prośbę użytkownika, bez automatycznego wznowienia. [Szczegóły](GMAIL_DELIVERABILITY_AUDIT.md).

## Nowo zlecony reset dzienny i pojedynczy test Gmail — 21:50

Na wyraźne polecenie użytkownika dodano ręczny reset bieżącego wykorzystania dziennego przez baseline w istniejącym app_state, zamiast usuwania usage_ledger/prób. Endpoint wymaga lokalnej sesji/CSRF, potwierdzenia, pauzy, bieżącego dnia/licznika i braku oczekujących lub niepewnych prób. Nie zmienia limitu 10/3/50, nie zeruje historii ani limitu kampanii, nie uruchamia sendera i nie czyści kill switcha. Dzień/kampania baseline są sprawdzane; stan zachowuje zgodność ze starymi rekordami.

Rzeczywiste testy: pierwszy `node --import tsx --test tests/gmail-delivery.test.ts` 52/53 (błędna nowa asercja FAILED_NOT_SENT zamiast istniejącego BLOCKED przy limicie kampanii); poprawiono asercję. Pełny **`npm run check`: 200/200 backend, 6/6 UI (27,6 s), typecheck/build PASS**. Nowe regresje zachowania historii i blokad, nieaktualnego dnia/licznika, brak resetu przy aktywnych/niepewnych próbach, nowa zatwierdzona wysyłka po resecie, zachowany limit kampanii, nieprawidłowy baseline i brak endpointu w DEMO/RESEARCH_ONLY. Mock Gmail, syntetyczne dane, katalogi tymczasowe. `git diff --check` PASS; Windows nadal nieprzetestowany.

Po prywatnym snapshotcie i sprawdzeniu braku nowych migracji zrestartowano lokalny backend APPROVAL_REQUIRED. Reset normalnym API: 10→0 bieżącego wykorzystania, historyczne rekordy zachowane. Świeży podgląd miał ten sam temat/pełny tekst/HTML/PDF/nazwę co test WP, Subject 48/52/29 i zgodny hash. **Jedna próba na nowo wskazany adres Gmail o 21:50:51.859 Europe/Warsaw; SENT_CONFIRMED o 21:50:53.444**, Gmail id/thread id obecne, dokładnie zatwierdzony bufor. Bez retry. Sender ponownie zatrzymany, brak aktywnej kolejki/researchu, killSwitch=false. Teraz 11 historycznych prób/rezerwacji, po resecie 1/10 dziennie i 11/50 w kampanii. Dawne wiersze prób/ledger/outbox oraz szkice/wersje/profil/fakty/CV porównano ze snapshotem: bez zmian; SQLite integralne. Pomocniczy końcowy odczyt raportowy skorygowano z nieistniejącej confirmed_at na aktualny schemat, bez powtarzania send. W tym etapie folder odbiorcy był nieznany; później użytkownik zgłosił Spam i dostarczył oba EML — wynik oraz przerwa opisane powyżej. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Wynik kompletnej pary WP — aplikacja 20:41, ręcznie 20:45

Przeanalizowano cztery dostarczone EML Wysłanych/odbiorców, zachowany frozen A aplikacji i lokalną historię readonly. Użytkownik zgłosił **Odebrane od razu dla obu pierwszych kontaktów**; obie kopie odbiorców mają **X-WP-SPAM NO** oraz DKIM good według WP. Mail2 odpowiada jednoznacznie próbie nr 10; jego kopia Wysłanych jest identyczna z wcześniej celowo odczytanym RAW. Mail1 to ręczna wiadomość z 20:45:14 Europe/Warsaw. W obu parach RFC ID, adresy i rzeczywisty Date zachowane; po rozpoznaniu adresów Delivered-To odpowiada To.

Pełne zdekodowane plain, HTML i PDF wraz z nazwą są dokładnie identyczne **między obiema kopiami odbiorców**, bez normalizacji. Ręczna para Wysłane→odbiorca również dokładnie zgodna. Aplikacja A→Wysłane ma dokładnie identyczny zakodowany body i części. Na odcinku aplikacyjne Wysłane→odbiorca plain ma siedem spacji zastąpionych podziałem wiersza i jeden końcowy CRLF, HTML dostał końcowy CRLF; PDF identyczny. Zgodność dokładna oraz po wyłącznie CRLF→LF pozostaje false dla tej pary. Subject Q 48/52/29 w aplikacyjnym A/B, B 84/32 w obu odbiorczych i ręcznym B. Sam fragment 84 nie rozróżnia folderów; poprawnego generatora nie zmieniono.

DKIM body hashes relaxed zgodne; pełnego podpisu/DNS nie weryfikowano. WP nie podaje osobnych SPF/DMARC ani Authentication-Results. Oznaczenie (U9) występuje także przy NO, więc samo nie oznacza Spamu; jego znaczenie nieustalone. Podstawowe nagłówki pojedyncze, brak Cc/Bcc/Reply-To i samotnych CR/LF, base64url round-trip poprawny. Tolerancyjny parser nie zastępuje pełnej walidacji RFC.

Nowe komendy: trzy wywołania `npm run --silent audit:eml --` z prywatnymi lokalnymi ścieżkami i `--output` poza repo (ręczne B→C, aplikacja A→B→C, C ręczne→C aplikacyjne): **3/3 PASS**; niezależna analiza Python/email/difflib i inspection.ts, `git diff --check` PASS. Raporty 0600, katalog 0700; adresy i oryginały poza repo. Zmieniono wyłącznie dokumentację, więc pełnego check nie powtarzano: 197 backend / 6 UI to poprzednie uruchomienie. Windows, pełny DKIM/DNS, reguły WP i odbiorcza para Gmail nadal nieprzetestowane. **Zero nowych operacji Gmail i wysyłek w analizie wyników**; nadal 10 prób/rezerwacji, sender paused=true, brak aktywnych wysyłek, killSwitch=false bez zmiany. Wynik pokazuje udany pierwszy kontakt aplikacji na WP, bez dowodu ogólnej naprawy Spamu. Szczegóły i kolejny plan: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Nowa, osobno zlecona próba WP — 20:41 Europe/Warsaw

Po zakończeniu audytu offline użytkownik wyraźnie polecił jedną wysyłkę aplikacji na mail2 i przygotowanie wzoru na mail1. Użyto istniejącego backendu APPROVAL_REQUIRED: SELF_TEST z zatwierdzonym CV, dokładnie porównaną wersją tematu/body, nowym podglądem i kontrolą hasha. Jedno zatwierdzenie, **jedna próba**, **SENT_CONFIRMED** o 20:41:08.955; Gmail id/thread id obecne. Wysłany bufor identyczny z podglądem. Łącznie **10 prób i 10 rezerwacji**, wcześniejsze dziewięć zachowane, limit dzienny nadal 10. Sender ponownie paused=true, schedule_enabled=false, killSwitch=false bez zmiany. Nie uruchamiano researchu, migracji ani kolejnej wysyłki.

Zgoda obejmowała tę próbę i potwierdzenie w Wysłanych. Zachowano poza repo nowy zamrożony MIME i jednorazowo odczytany RAW dokładnie znanego Gmail id (bez listowania skrzynki). A/B: cały zakodowany body i wszystkie zdekodowane części/PDF identyczne, Subject 48/52/29; Google zmienił RFC ID i Date z 20:39:37 na 20:41:08 (+91 s), dodano Received. Wzór ręczny i identyczny PDF pod taką samą nazwą udostępniono w prywatnym pliku poza repo. W wyniku tego etapu wykonano rzeczywistą wysyłkę i celowane odczyty Gmaila; wcześniejszy audyt offline miał zero takich operacji.

W tym etapie foldery WP i wariant ręczny były jeszcze nieznane; później użytkownik dostarczył cztery EML i zgłosił Odebrane obu wiadomości — wynik powyżej. SENT_CONFIRMED nie oznacza Odebranych. Sprawdzono stan runtime i bufory oraz `git diff --check` PASS; kod bez zmian, pełnego npm check nie powtarzano. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Ręczna para Wysłane/odbiorca — 13:49:39 Europe/Warsaw

Właściwy najnowszy EML odbiorcy (90026 bajtów) powiązano z ręczną kopią Wysłanych (83499 bajtów) po identycznych RFC Message-ID, From, To, Date i Subject. Pełne zdekodowane plain (787), HTML (872) i PDF (58698 bajtów) wraz z nazwą załącznika są identyczne bez normalizacji. Zmieniły się granice MIME i dodano nagłówki transportu/odbiorcy; Date i RFC ID zachowano. Subject jest surowo identyczny, encoded-words 84/32 występują po obu stronach. Authentication-Results odbiorcy raportuje SPF/DKIM/DMARC/ARC PASS, DKIM body hash zgodny; pełnego podpisu/DNS nie weryfikowano.

Ręczna wiadomość oraz próba aplikacji nr 4 mają również identyczne pełne teksty i bajty PDF u odbiorcy, ale różne nazwy PDF. Wyniki Odebrane/Spam nadal pochodzą z wcześniejszej relacji użytkownika, ponieważ EML nie mają etykiet. Sam fragment 84 nie odróżnia zgłoszonych folderów. Para ręczna jest kompletna; nie wykazano przyczyny Spamu. Następny rekomendowany eksperyment to odrębne pierwsze kontakty ręczne/aplikacji na uzgodnionych skrzynkach bez historii, wyłącznie jako plan.

Nowe sprawdzenia: porównanie Pythonem i inspection.ts, `npm run --silent audit:eml --` z lokalnymi kopiami i prywatnym `--output` poza repo PASS; `git diff --check` PASS. Tylko dokumentacja zmieniona, pełnego check nie powtarzano; wcześniejsze 197 backend/6 UI pozostaje wynikiem poprzedniego uruchomienia. Zero rzeczywistych operacji Gmail i nowych wysyłek. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Nowy EML odbiorcy — próba aplikacji nr 4, 13:53:46 Europe/Warsaw

Końcowy RFC Message-ID tego EML jednoznacznie odpowiada próbie aplikacji nr 4 w lokalnej historii readonly. To osobna wiadomość od ręcznej kopii Wysłanych z 13:49:39. EML ma encoded-words Subject 84/32; pełny text/plain, text/html oraz bajty PDF są dokładnie zgodne z ręczną kopią Wysłanych, lecz nazwa PDF różni się. Według wcześniejszej relacji użytkownika próba 4 trafiła do Odebranych po ręcznej wiadomości; brak etykiet folderu w EML. Samo przekroczenie długości zakodowanego fragmentu tematu nie rozróżnia więc zgłoszonych wyników Spam/Odebrane. Brakujący wówczas odbiorczy EML ręcznej wiadomości 13:49:39 później dostarczono i porównano — wynik na początku raportu.

Authentication-Results nowej kopii raportuje SPF/DKIM/DMARC/ARC PASS, body hash DKIM zgodny (bez pełnej weryfikacji podpisu). Lokalne porównanie Pythonem i inspection.ts oraz `git diff --check` PASS; zero operacji Gmail i wysyłek. Zmieniono wyłącznie dokumentację, pełnego check nie powtarzano. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Kopia odbiorcy próby nr 3 — Subject zmieniony po Wysłanych

Nowo dostarczony EML odbiorcy dotyczy tej samej wiadomości co ostatnio porównane Wysłane (końcowy RFC ID, nadawca, odbiorca i Date zgodne). A i B mają encoded-words UTF-8/Q 48/52/29, C ma UTF-8/B 84/32. Dla tej konkretnej próby przekroczenie RFC 2047 jest więc widoczne dopiero w źródle odbiorcy, nie w generatorze lub kopii Wysłanych. Dokładnego etapu wewnątrz transportu Google nie ustalono; wynik nie dowodzi przyczyny Spamu.

PDF jest bajtowo identyczny. Text/plain ma siedem spacji zastąpionych CRLF i jeden końcowy CRLF (778→787 bajtów), HTML dostał końcowy CRLF (870→872 bajtów). Pozostałe znaki niezmienione; zgodność dokładna i po CRLF→LF jest fałszywa, bez ukrywania różnic przez usuwanie białych znaków. Granice multipart zmienione, topologia zachowana. C raportuje SPF/DKIM/DMARC/ARC PASS, DKIM body hash zgodny; pełnego podpisu nie weryfikowano. EML nie ma etykiety folderu — wynik Spam pochodzi z kontekstu dostarczenia i historii odbiorcy.

Lokalna analiza Pythonem/inspection.ts, SQLite readonly, `git diff --check` PASS. Bez zmian kodu/runtime oraz bez ponawiania pełnego check po samej analizie. Zero operacji Gmail i wysyłek. Następny plik: ręczny mail do tego samego odbiorcy pobrany z Odebranych. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Nowy EML Wysłanych — próba nr 3, 13:31:27 Europe/Warsaw

Nowo dostarczony plik ma tę samą nazwę co poprzedni EML pierwszego odbiorcy, lecz inne bajty/identyfikator i odpowiada próbie nr 3. Powiązano go zapisanym końcowym RFC Message-ID. Porównanie z zachowanym zamrożonym MIME: dokładnie identyczny zakodowany body oraz pełne text/plain, text/html i PDF, bez normalizacji. Hash frozen i PDF zgodne z próbą. Subject 48/52/29 identyczny przed API i w Wysłanych, bez przekroczenia RFC 2047. Jedynie Received dodano, Message-ID przepisano, a Date przesunięto o 2 s. Brak Cc/Bcc/Reply-To i duplikatów podstawowych nagłówków. Brak DKIM/Authentication-Results w tej kopii nie służy do oceny uwierzytelnienia u odbiorcy.

Wykonano lokalną analizę i odczyt SQLite readonly; zero operacji Gmail, bez zmian kodu/runtime. `git diff --check` PASS; pełnego check po samej analizie nie powtarzano. Następny potrzebny plik to ta sama wiadomość ze Spamu odbiorcy. Przyczyna Spamu i etap powstania Subject 84 pierwszej próby pozostają nieustalone. Szczegóły: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

## Aktualny audyt offline dostarczalności i reconcile

Pełny `npm run check`: **197/197 backend, 6/6 UI, typecheck/build PASS**; `git diff --check` PASS. Testy korzystały wyłącznie z fikcyjnych skrzynek i katalogów tymczasowych. Zero rzeczywistych operacji Gmail i nowych wysyłek, brak zmian prywatnego runtime. Windows nadal nieprzetestowany. Szczegóły, polecenia i konkretne brakujące A/B/C/D: [GMAIL_DELIVERABILITY_AUDIT.md](GMAIL_DELIVERABILITY_AUDIT.md).

Potwierdzono historyczny encoded-word Subject 84 znaki w odebranym EML Gmaila, limit RFC 2047 wynosi 75. Aktualny generator i cztery zachowane późniejsze MIME mają dla tego tematu 48/52/29; pierwotny MIME usunięto wcześniej. Nie wykazano błędu przed API ani przyczyny Spamu. Starsze określenia „poprawny MIME” w tym raporcie oznaczały kontrole opisane na danym etapie, nie pełną zgodność RFC. WP A↔C ma identyczne zdekodowane bajty tekstu, lecz Date przesunięte o 31 s oraz zmieniony RFC ID. Oba body hashes DKIM zgodne, bez pełnej weryfikacji podpisów.

Odtworzono lukę utraconej odpowiedzi send + zmienionego RFC ID (nowy test najpierw FAIL). Dodano ograniczony, paginowany odczyt pełnych RAW kandydatów z właściwego konta/adresata/okna czasu; podobieństwo, nawet pełne i pojedyncze, pozostawia SEND_UNKNOWN. Znany Gmail id zachowuje ścieżkę potwierdzania. Zgody, brak retry, pauza/kill switch i limity nadal obowiązują. Dodano audytor CLI offline bez sieci, bez zmiany generatora MIME, OAuth lub migracji. Lokalny odczyt bazy readonly potwierdził dziewięć SENT_CONFIRMED/rezerwacji i sender paused; bez ponownej weryfikacji skrzynki.

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

## Weryfikacja zewnętrznego audytu EML

Użytkownik dostarczył skrypt audytu i JSON wyników dla pierwszego maila z CV odebranego przez Gmail oraz drugiego krótkiego testu WP. Po przeczytaniu skryptu odtworzono audyt lokalnie na tych plikach, bez sieci, zapisywania kopii raportu lub wysyłki. Oba wyniki są dokładnie zgodne z dostarczonym JSON. Skrypt i pełny raport pozostają poza repo, ponieważ raport zawiera prywatne adresy z wcześniejszych prób.

Nowa obserwacja: w odebranym pierwszym EML pojedynczy encoded-word w Subject ma 84 znaki, drugi 32. Pierwszy przekracza limit 75 znaków z [RFC 2047 §2](https://www.rfc-editor.org/rfc/rfc2047.html#section-2). Wcześniejszy brak błędów zgłoszonych przez parser nie oznaczał pełnej walidacji RFC. Nie ustalono, na którym etapie powstał taki nagłówek; zamrożony MIME pierwszej próby został wcześniej usunięty na prośbę użytkownika i nie może służyć do porównania przed/po.

Sprawdzono zachowany zamrożony MIME późniejszej próby z tym samym tematem oraz wykonano nową próbę offline przez obecny prepareMime na fikcyjnych adresach, bez CV i bez transportu Gmail. Oba mają encoded-words długości 48, 52 i 29, mieszczące się w limicie. Temat odebranego krótkiego maila WP ma encoded-word długości 39 i mimo tego X-WP-SPAM YES (U9). Przekroczenie w pierwszym EML nie wyjaśnia więc wszystkich wyników Spamu ani nie wykazuje aktualnego błędu generatora.

Audyt potwierdza brak samotnych LF/CR i zgodność hashy kanonizowanego body z bh= DKIM w obu plikach. To porównanie body, nie pełna kryptograficzna weryfikacja podpisu i DNS; sam skrypt zaznacza to ograniczenie. Znaczenie U9, przyczyna klasyfikacji oraz wpływ konta/API pozostają nieustalone. Kod aplikacji i kontrola wysyłek bez zmian; nie wysłano nowego maila i nie uruchamiano ponownie pełnego npm run check po samej analizie dokumentacji. Ostatni pełny wynik pozostaje 157 backend / 6 UI PASS.

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

Użytkownik wykonał ręczną wysyłkę z Gmaila, dostarczył drugi EML i potwierdził trafienie do Odebranych. Adresy i temat są takie same; treść tekstowa jest zgodna po pominięciu białych znaków. Obie wiadomości mają SPF/DKIM/DMARC/ARC PASS. Ręczny mail ma nazwę nadawcy „Jakub Lewosz” oraz część HTML obok tekstu. Załącznik jest inny: JobHunter użył lokalnego zatwierdzonego PDF (58 698 bajtów), ręczny mail użył innego lokalnego PDF (78 467 bajtów); ich SHA-256 różnią się. Użytkownik potwierdził, że przed ręcznym testem nie oznaczał pierwszego maila jako „To nie jest spam” ani nie zmieniał kontaktów lub filtrów. Wynik nadal nie rozstrzyga, czy różnicę klasyfikacji spowodował sposób wysyłki, format, PDF czy inne sygnały Gmaila. Kolejne porównanie powinno zachować dokładnie ten sam załącznik. Ręczny test nie dopisuje prób ani zgód w JobHunterze; nie zmieniono kodu wysyłki ani zatwierdzonego CV.

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
