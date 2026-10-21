# Styl zgłoszeń JobHunter

Aktualizacja 16 października 2026 na wyraźne życzenie użytkownika: list ma
wynikać z konkretnej firmy i celu kontaktu. Zastępuje wcześniejszy sztywny
schemat „pytanie → edukacja/dostępność → firma/projekt → pytanie”. Nie
wprowadza losowego parafrazowania ani rotacji gotowych wariantów.

## Konstrukcja i kompletność

Generator najpierw rozpoznaje cel, najmocniejszy udokumentowany powód
napisania do firmy oraz nierozstrzygniętą kwestię dla odbiorcy. Dobiera do
nich początek i kolejność informacji. Nie ma obowiązkowego pierwszego
zdania, liczby akapitów ani pytania na końcu. Powitanie i podpis mogą być
wspólne; podobny kontekst może uzasadniać podobny tok listu. Różnorodność
nie jest celem samym w sobie i nie polega na podmianie synonimów.

Kod wyznacza cel redakcyjny z rodzaju kontaktu i zweryfikowanych warunków:
wykonalność nieustalonych godzin w ofercie, dopasowanie projektu, dopasowanie
profilu do otwartej kandydatury albo samą możliwość współpracy bez naboru.
To priorytet decyzji odbiorcy, bez gotowych zdań i rotacji wariantów. W tym
samym rodzaju kontaktu potwierdzenie godzin może zmienić priorytet. Przy
nieznanym wymiarze w ofercie lub samym zapytaniu bez naboru prośba jest
krótka, a dostępność podana osobno. Nie ma nakazu prośby we wprowadzeniu.
Tok i granice akapitów dobiera model do konkretnej sytuacji.

Prośba lub pytanie o współpracę/aplikowanie występuje raz. „Piszę z pytaniem,
czy…” jest prośbą także z kropką. Jeśli pojawia się na początku, nie należy
powtarzać jej w zakończeniu. Początek dotyczący oferty lub rzeczowego
związku z firmą może prowadzić do jednego konkretnego pytania o nieznany
warunek. Zdanie „szukam płatnej pracy” samo opisuje cel, nie prośbę odbiorcy.

Zachowujemy edukację, cel płatnej regularnej pracy, pełną zdalność,
dostępność, rzeczowe dopasowanie, zatwierdzony GitHub i podpis. Można łączyć
informacje i umieszczać je w różnych miejscach. Dostępność i ewentualne pory
dnia pochodzą wyłącznie z aktualnego zatwierdzonego profilu. Nowa propozycja
z 21.10 usuwa dopisek o lekcjach; brak pór dnia nie oznacza pełnej
dyspozycyjności i nie zmienia około 20 h w dokładnie 20 h. Nazwa szkoły, miasto i ostatnia klasa także
wymagają zatwierdzonych faktów. Nie dopisujemy roku szkolnego.

Orientacyjne 80–130 słów to wskazówka redakcyjna, nie minimum, maksimum ani
kontrola wysyłki. Nie obcinamy istotnych informacji dla długości i nie
wydłużamy listu powtórzeniami.

## Firma i projekt jako jeden wątek

Związek wynika z konkretnego zadania, problemu lub obszaru potwierdzonego
w źródłach. Nie narzucamy konstrukcji „Na Państwa stronie… Mój projekt…”.
Opis projektu może poprzedzać nawiązanie, rozwijać zadanie z oferty albo być
z nim połączony w akapicie. Nie wymyślamy zainteresowań, emocji ani historii
obserwowania firmy. Bez ogólników o liderze branży, tłumaczenia oczywistości
dopasowania i komentarzy o procesie tworzenia maila.
Nie oceniamy za pracodawcę przydatności doświadczenia lub korzyści dla firmy.
Pokazujemy konkretne wykonane zadanie i chęć pracy przy podobnych zadaniach.

Zwykle jeden projekt, wyjątkowo dwa przy odrębnych potwierdzonych obszarach
z wyjaśnieniem w warnings; przy braku związku opis jest pomijany. Nie ma
minimalnej liczby funkcji ani technologii. Wystarczy istotny szczegół;
stack jest potrzebny tylko wtedy, gdy rzeczywiście objaśnia dopasowanie.
Technologia firmy nie staje się kompetencją kandydata.

Kod dobiera projekty z literalnych dowodów i zatwierdzonych faktów:

- PHP/Laravel lub obsługa usterek: FixDesk, tylko jeśli zatwierdzony.
- API, webhooki, integracje i automatyzacja: AutoRelay.
- Lokalne modele, LLM, narzędzia AI: CodeFabric, w zakresie prototypu.
- PDF, dokumenty, analiza obrazu i plany elektryczne: ElektroScan.
- Udokumentowane tworzenie stron/interfejsów: Sęk i Forma, tylko z zatwierdzonym faktem.

„Stworzyłem”, „pracowałem w zespole nad” i „rozwijam” nie są zamienne.
Samodzielność, liczba osób, udział i trwający rozwój wymagają faktów.
CodeFabric nie jest oficjalnym produktem UKNF. Publiczny GitHub ani dawna
etykieta „publiczne demo” nie potwierdzają działającej aplikacji; potrzeba
potwierdzenia działającej wersji i adresu poza repo. Neutralne „projekt”,
„aplikacja”, „prototyp” nie oznaczają produkcji. Nie dodajemy też niepopartego
braku wdrożenia. Bez etykiety „projekt portfolio” i domyślnego słowa demo.
To ograniczenia prawdziwości dla generatora i kontroli, nie obowiązkowe
zastrzeżenia w mailu. Precyzyjny opis prototypu z praktyk nie wymaga dopisku
o braku oficjalnego statusu. Poprawiamy mylącą sugestię w samym opisie.

## Cel i ton kontaktu

ACTIVE_JOB wymaga potwierdzonego wakatu. Temat i treść odnoszą się do
rzeczywistego stanowiska, bez deklaracji spełniania nieznanych wymagań.
OPEN_APPLICATION oznacza rzeczywiste przyjmowanie otwartych kandydatur,
nie ofertę konkretnej roli. GENERAL_RECRUITMENT_CONTACT jest konstrukcją
ostrożnego zapytania bez oferty; nie zmienia GENERAL w RECRUITMENT.
Przeznaczenie i uprawnienie do użycia adresu kontroluje kod.

Język jest profesjonalny, prosty i swobodny: bez przesadnych formalności,
marketingu, sprzedaży usług i deklaracji eksperckości. Imię wystarczy
w podpisie. Bez „niniejszym”, „pragnę wyrazić zainteresowanie”, „z pasją”,
„innowacyjnych rozwiązań”, propozycji prezentowania projektu lub portfolio.
GitHub wystarczy. Temat wynika z faktycznego celu, bez clickbaitu.

Pierwszy kontakt domyślnie używa „Państwo” i trzeciej osoby liczby mnogiej.
„Wy” dopuszczalne tylko przy wyraźnej podstawie w odczytanej oficjalnej
komunikacji firmy. Sam młody zespół, branża IT lub pojedyncze „Ty” w ofercie
nie wystarczają. W razie niepewności „Państwo”; bez mieszania obu form
i kopiowania swobodnego tonu poprzednich listów bez podstawy.

Jedno krótkie pytanie nie musi otwierać listu. Edukacja i dostępność są
osobnymi stwierdzeniami, bez wciskania wszystkich warunków do pytania.
Nazwy firm muszą pasować gramatycznie do zdania. Skrótowy opis faktu nie
jest gotowym zdaniem: istotne działanie objaśniamy prostym językiem,
zachowując sens. Nie dopisujemy komentarza o podobieństwie projektu,
jeśli związek jest już jasny. Podobne konteksty mogą mieć podobne otwarcia.

AI/Codex są opcjonalnym narzędziem pracy, tylko przy istotnym kontekście
i w zatwierdzonym zakresie. Samodzielne testy, planowanie, debugowanie
i weryfikacja wymagają własnych faktów; przykład stylistyczny ich nie dodaje.
Umowa zlecenie tylko przy ACTIVE_JOB z jej potwierdzeniem w ofercie;
akceptacja tej formy wymaga osobnego faktu kandydata. Bez niezatwierdzonej
stawki, negocjacji lub dokładnej daty startu.

## Kontrole i wersje

Generator sprawdza cały tok listu, powtórzoną prośbę (także oznajmującą),
rzeczowy związek projektu, naturalność polskich zdań i kompletność przed
pierwszym wynikiem. Claims odnoszą się do ostatecznie zwróconej treści.
Nie dodajemy automatycznego zastępowania fraz po generacji. Każda późniejsza
korekta zapisanego szkicu wymaga osobnej wersji i kontroli końcowej treści.
recent zawiera ostatnie tematy,
otwarcia, pytania i pełny tok akapitów trzech poprzednich szkiców: pomaga
zauważyć powielanie, nie jest źródłem faktów ani
nakazem odmienności za wszelką cenę. Dane firm i wyniki modeli nie udzielają
uprawnień.

Natywne kontrole nadal blokują obce fakty/dowody, niepoparte technologie,
status studenta, komercję, eksperckość AI, stawki, błędną dostępność i wakat
bez źródła. Formalność, prezentacja, sprzedażowe CTA, powtórzenia i umowa
bez kontekstu dają uwagi oraz NEEDS_REVIEW. Dodano REPEATED_REQUEST dla
kilku próśb, także zakończonych kropką. To pomocnicza heurystyka redakcyjna,
nie pełna analiza znaczenia; nie wymaga pytania końcowego. Kontrola
semantyczna pozostaje true/false/null, z zachowaniem wszystkich issues.

Zasady dotyczą nowych generacji. Nie przepisujemy starych szkiców, ich
wersji ani zatwierdzonego profilu i CV. Nowy domyślny wzór zawiera wskazówki,
a nie sztywne zdania do wypełnienia; zapisany dawny wzór nie wymusza
kolejności lub podwójnego pytania w nowej instrukcji. Zatwierdzone pole
wzoru w bazie pozostaje bez automatycznej zmiany. Ręczna zmiana materiałów
nadal wymaga zwykłego zatwierdzenia. Nowa wersja szkicu dopisuje historię,
a konflikt równoległej edycji blokuje spóźniony zapis.

Testy developmentu używają fikcyjnych firm, odbiorców i danych tymczasowych.
Rzeczywiste podglądy modelu z zatwierdzonymi faktami wymagają jawnego
WORKSTATION na Windowsie i właściwego katalogu danych. Wyniki zapisujemy
poza Git, bez Gmaila/send i zapisu fikcyjnych danych do głównej bazy.
Ocena sześciu wiadomości obejmuje funkcję otwarcia, kolejność informacji,
prośby, połączenie firmy/projektu i kompletność; sam inny tekst lub hash
nie dowodzi odmiennej konstrukcji.
