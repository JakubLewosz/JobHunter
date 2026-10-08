# JobHunter — docelowy sposób pracy

Ustalenia z rozmowy z Jakubem, 7 października 2026; stan wdrożenia zaktualizowany 8 października. Dokument służy jako kontekst do dalszego omawiania i rozwijania projektu, także po udostępnieniu repozytorium ChatGPT.

## Cel

JobHunter ma być prostym, osobistym narzędziem Jakuba do znajdowania płatnej współpracy. Jakub uruchamia program, a Codex szuka firm, poznaje ich działalność, przygotowuje spersonalizowane wiadomości i przechodzi do kolejnych firm. Docelowo aplikacja wysyła wiadomości przez Gmail z CV, zapisuje historię kontaktów i pokazuje odpowiedzi.

Panel ma pozostać prosty: Start, Pauza, Stop, moje materiały, firmy, wiadomości i odpowiedzi. Projekt jest przeznaczony dla jednej osoby.

## Materiały o Jakubie

GitHub ma być źródłem materiałów: CV, projektów, osiągnięć i portfolio. Aplikacja ma zebrać te informacje i przechowywać ich aktualną, lokalną wersję do przygotowywania wiadomości. Jakub przegląda i zatwierdza zebrane fakty przed ich użyciem. Aktualizacja materiałów wymaga sprawdzenia zmian; sama obecność technologii w repozytorium nie potwierdza kompetencji ani doświadczenia komercyjnego.

Aktualne preferencje pracy: płatna, regularna współpraca, w pełni zdalna, około 20 godzin tygodniowo, przede wszystkim po lekcjach; preferowana umowa zlecenie. Godziny są orientacyjne, bez deklarowania maksimum lub sztywnego przedziału.

## Główna treść wiadomości

Aktualny schemat: naturalne zgłoszenie do zespołu przedstawiające Jakuba, cel regularnej współpracy i konkretny związek z firmą. Programowanie z AI jest częścią zatwierdzonego profilu, ale nie jest obowiązkowym początkiem ani elementem każdego maila. Projekty pokazują konkretne efekty pracy. Wzór pozostaje edytowalnym punktem wyjścia, z różnymi tematami i pytaniami zależnymi od sytuacji. Szczegóły: [Styl wiadomości](MESSAGE_STYLE.md).

Jeśli projekt pasuje do technologii firmy albo do problemu, który firma rozwiązuje, Codex krótko opisuje jeden najlepiej dopasowany projekt i jego związek z możliwymi zadaniami. Dopasowanie nie wymaga identycznej technologii.

Jeśli żaden projekt nie pasuje, opis projektu jest pomijany. Wiadomość skupia się wtedy na programowaniu z AI, zainteresowaniu działalnością firmy i gotowości do poznania potrzebnych narzędzi. Sformułowania o szybkim uczeniu się powinny wynikać z zatwierdzonego opisu Jakuba; Codex nie dopisuje umiejętności ani osiągnięć.

Wiadomość pyta o możliwość współpracy w proponowanym modelu. Nie sugeruje istnienia wakatu ani zgody firmy na zdalność lub godziny, jeśli źródła tego nie potwierdzają.

## Obecny kierunek: firmy i zapytania o współpracę

Szukanie ma być szerokie: software house’y, agencje, SaaS, aplikacje webowe, backend, API, integracje, automatyzacje, narzędzia AI, przetwarzanie dokumentów i inne firmy z udokumentowanymi potrzebami pasującymi do tych obszarów.

Firma może być kandydatem do kontaktu bez ogłoszonej rekrutacji. Celem wiadomości jest zapytanie, czy potrzebuje pracownika lub pomocy przy zadaniach. Brak informacji o godzinach czy zdalności pozostaje nieznaną informacją, o którą można zapytać.

Jakub chce kontaktować się z dużą liczbą sensownie dobranych firm, licząc na znalezienie zespołu, który potrzebuje pomocy. Każda wiadomość nadal ma być indywidualna. Aplikacja weryfikuje publiczny kontakt, pamięta historię i pilnuje, żeby nie powtarzać pierwszego kontaktu z tą samą firmą.

## Późniejsze rozszerzenia

Do tego samego procesu mogą zostać dołączone kolejne źródła:

- konkretne oferty pracy i płatnych staży;
- dostępne ogłoszenia z Facebooka i innych społeczności;
- wpisy, w których ktoś potrzebuje aplikacji, integracji, automatyzacji albo wykonania konkretnego zadania.

W tych przypadkach wiadomość odpowiada na opisaną potrzebę. Dostęp do poszczególnych źródeł trzeba rozwiązać osobno. Te rozszerzenia są planem na później.

## Stan wdrożenia i najbliższe kroki

Obecna implementacja RESEARCH_ONLY szuka firm, czyta publiczne źródła i przygotowuje szkice z zatwierdzonych materiałów. Obsługuje również firmy PROSPECT bez potwierdzonego naboru. Ograniczona rzeczywista próba zakończyła się po osiągnięciu limitów: 10 kandydatów i 3 szkice, zero wysyłek w researchu. Zachowano dwie próby generowania zablokowane przez kontrolę zgodności. Styl późniejszych wiadomości został dopracowany i zaakceptowany przez Jakuba.

Gmail jest podłączony w osobnym trybie APPROVAL_REQUIRED. Dziewięć wyraźnie zleconych testów potwierdzono w Wysłanych; odbiorcy zgłaszali zarówno Odebrane, jak i Spam. Oba krótkie testy WP trafiły do Spamu, a dokładna przyczyna pozostaje nieustalona. Nie kontaktowano firm. Wysyłka wymaga akceptacji konkretnych wiadomości; automatyczna polityka wysyłania pozostaje niedostępna.

Najbliższe kroki po dotychczasowych próbach:

1. Utrzymywać aktualne zatwierdzone materiały z GitHuba; każdą zmianę faktów i CV przegląda Jakub.
2. Zachować zaakceptowany naturalny styl, z konkretną wzmianką o Codexie tam, gdzie pasuje do firmy.
3. Sprawdzać jakość nowych szkiców: zwykle jeden projekt, bez opisu przy braku dopasowania i warunki zgodne z profilem bez powtórzeń.
4. Zdiagnozować dostarczalność z konta projektu, następnie przetestować małą partię wiadomości wybraną i zatwierdzoną przez Jakuba.
5. Po sprawdzeniu wyników rozwinąć regularne szukanie i wysyłkę według ustalonych zasad, z historią, limitami i możliwością zatrzymania.
6. Później dołączyć oferty pracy i ogłoszenia o konkretnych zadaniach.

Szczegóły działającej wersji są w [README](../README.md), a bieżące zadania w [TASKS](TASKS.md). Niniejsza wizja nie stanowi zgody na rzeczywistą wysyłkę; RESEARCH_ONLY zachowuje blokadę wysyłania maili.
