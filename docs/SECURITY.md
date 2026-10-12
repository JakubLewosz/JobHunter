# Bezpieczeństwo JobHunter — 12 października 2026

## Lokalna instalacja

LOCAL_ONLY jest domyślną strategią, niezależną od trybu. Jedna SQLite na domowym Windowsie;
Start/bramki/sender/Stop/readiness nie wykonują Gita. Blokada profilu jest atomowa między
procesami i portami, sprawdzana przed POST. Utrata blokady, nieznana konfiguracja,
niespójna baza i SENDING/SEND_UNKNOWN blokują. PRIVATE_GIT niżej dotyczy wyłącznie
opcjonalnej już skonfigurowanej historii, bez automatycznego fallbacku po awarii.

Stop/Pauza odwołuje odrębne prawo sesji w pamięci przed synchronicznym zapisem SQLite.
Nawet błąd zapisu nie pozwala na następny POST. To nie zastępuje ostatniej bramki bazy,
sesji, kontaktu, materiałów lub rezerwacji. Ręczny backup nie inicjalizuje migratora;
restore-copy otwiera/migruje wyłącznie nową kopię, nigdy oryginał.

DEVELOPMENT domyślnie otwiera osobny JobHunter-development/DEMO. Nie inicjalizuje natywnego
Gmaila ani metadanych osobistego konta; częściowe wstrzyknięcie providera jest odrzucane.
Natywne połączenie i helper OAuth wymagają WORKSTATION, Windowsa, lokalnego workstation.json
powiązanego z istniejącym katalogiem oraz świadomie potwierdzonej historii. Oznaczenie
nie jest zgodą sesji i nie jest kopiowane/synchronizowane. Nie jest attestation sprzętu
i nie chroni przed użytkownikiem, który świadomie zmienia własny kod/pliki.

Przed migracją istniejącej bazy: VACUUM INTO z FULL i sprawdzeniem integralności, kopia
poza repo w katalogu backups. Uwzględnia WAL; nie jest kopiowaniem aktywnego pliku.
Odtworzenie kopii zachowuje historię/liczniki i terminalne MIME, odwołuje sesje/zgody,
zmienia SENDING na SEND_UNKNOWN i nie oznacza lokalnej historii jako kompletnej.
Podstawa: [SQLite VACUUM INTO](https://www.sqlite.org/lang_vacuum.html).

HTML jest parsowany htmlparser2 bez wykonywania skryptów. Konteksty adresów wynikają
z sekcji/kart/list/wierszy i są przechowywane z parser_version. Konflikt celu blokuje.
compact nadal służy literalnym cytatom, nie kasuje strukturalnego kontekstu decyzji.
Nowy hash źródła obejmuje wersję parsera i surową treść; stary cache PUBLIC_HTTP bez
struktury wymaga odczytu i nowej weryfikacji, nie jest nowym dowodem przez zmianę daty.
Wcześniejsze rekordy/MIME pozostają. Globalne odmowy/kanały niezależne od lokalnej etykiety.

Publiczny smoke tworzy nową bazę tymczasową i ResearchJobHunter z publiczną gałęzią AUTO,
bez GmailJobHunter/gateway/zgód/outbox. Domyślnie profil jest syntetyczny. Jawna opcja
--approved-profile wymaga skonfigurowanego Windowsa i kopiuje tylko już zatwierdzone
materiały z read-only transakcji; źródłowa baza nie jest migrowana lub zapisywana.
Brak CV bajtów, poczty i sekretów w kontekście modelu. Wyniki nie są przyszłą kolejką.
Schematy CLI wymagają jawnych pól opcjonalnych; walidatory domenowe/izolacja pozostają.
Dokumentacja: [CLI](https://learn.chatgpt.com/docs/developer-commands?surface=cli).

## Uprawnienia i tryby

Backend: wyłącznie 127.0.0.1, dokładny Host/Origin, HttpOnly/SameSite, CSRF, bez CORS/tunelu. Dane poza kodem, jeden backend z blokadą katalogu bazowego. Tryb wybierany przy starcie.

DEMO ma oddzielną bazę/fikcyjnych providerów. RESEARCH_ONLY nie inicjalizuje Gmaila/send. APPROVAL_REQUIRED zachowuje zgodę na dokładny MIME. AUTO_POLICY wymaga konfiguracji zatwierdzonej przez użytkownika i jawnego Start. Aktywna sesja jest lokalna; restart/Stop odwołuje uprawnienie. Model nie może uruchomić sesji lub zmienić nadawcy, limitów, CV i historii.

Materiały/CV/nadawca związane z wersją i hashami. Literalny dowód kontaktu, jego przeznaczenie i dopuszczenie przez politykę są osobne. GENERAL dopuszczony do zapytania nie zmienia rodzaju na RECRUITMENT. SALES, restricted mailboxes, ograniczenia kanału aplikacji, nieaktualne dowody i niepewna treść są blokowane. Kontrola modelu nie zastępuje reguł kodu i nie jest dowodem prawdziwości.

Przed jednym POST zapisujemy rezerwację, ID i zamrożone bajty. Callback bramki działa ponownie po uzyskaniu tokenu. Nie ma retry send. Timeout/awaria/restart zachowują SEND_UNKNOWN, blokadę i licznik. Reconcile potwierdza istniejącą próbę bez ponowienia. Bez gwarancji exactly-once i bez utożsamienia Wysłanych z Odebranymi.

## Gmail i historia

OAuth podłącza użytkownik przez osobny helper. Tokeny/klient w systemowym magazynie, metadane poza repo. PKCE/state, stałe endpointy Google i weryfikacja scopes/konta. Brak samoczynnego rozszerzania uprawnień. Celowany scan dotyczy wybranego adresu i potwierdzonych domen firmy, z paginacją i kontrolą historyId. Odczyt Wysłanych tylko istniejącej próby. Poczta nie trafia do modelu. Google readonly jest szerszy od filtrów aplikacji; użytkownik zatwierdza ten ograniczony zakres w polityce.

Błąd/limit/niepełna historia nie oznacza pustej historii. HTTP 429 odczytu wstrzymuje sender bez intensywnego retry. Przejściowe 5xx odczytu mają ograniczony backoff; send zawsze pojedynczy. SELF_TEST nie oznacza kontaktu z firmą; stare testy i dane odpowiedzi pozostają w SQLite.

`historyId` z getProfile opisuje całą skrzynkę. Po zmianie podczas celowanego odczytu
wykonujemy najwyżej jeden ponowny kompletny scan **tego samego zakresu firmy**, z
paginacją i kontrolą konta. Nie pobieramy globalnego history.list ani całej poczty.
Trwające zmiany nadal dają HISTORY_CHANGED, błąd strony/limit nie oznacza pustego wyniku.
Sender może ponowić bezpieczny odczyt w dwóch kolejnych terminach z backoffem,
potem wymaga jawnego wznowienia. Nie dotyczy to POST wysyłki.

Metoda nie zapewnia atomowego snapshotu Google: pozostaje możliwa nowa ręczna wiadomość
po ostatniej kontroli a przed POST. Słabsza gwarancja jest jawna; nie ma exactly-once.
Podstawa wyboru wynika z oficjalnych [sync](https://developers.google.com/workspace/gmail/api/guides/sync),
[getProfile](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/getProfile)
i [history.list](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list),
sprawdzonych 11 października 2026.

AUTO_POLICY nie udostępnia ręcznego preview/approve/test-recipient/resetu kwot ani
odczytu odpowiedzi przez stare endpointy. Reconcile konkretnej istniejącej próby
pozostaje dostępny. Wewnętrzna decyzja nie używa globalnej flagi uprawnień.

Prywatny Git: wskazany i potwierdzony osobny origin, wersjonowany JSON z transakcyjnego odczytu, atomowy plik, transakcyjny import. Właściciel publikowany przed Start; drugi komputer nie przejmuje niedomkniętej sesji. Przekazanie wymaga Stop, zakończenia operacji i udanego eksportu/push. Konflikt, dirty checkout, przerwany eksport, zdalna zmiana lub problem dostępu blokuje sender. Bez force-push, kasowania historii lub kopiowania aktywnej SQLite.

Eksport obejmuje tylko firmy/aliasy, ręczne kontakty, blokady, własne pierwsze próby z tematami/treścią/hashami i liczniki rezerwacji. Nie obejmuje OAuth, loginu Codexa, PDF, MIME załączników, całej skrzynki, profilu ani aktywnej zgody. Testy używają lokalnych repozytoriów i fikcyjnych danych. Odzyskanie niepewnej próby wymaga oryginalnego lokalnego zapisu; brak tego zapisu nie pozwala na ślepy retry.

## Research i runtime Codexa

Fetcher: tylko publiczne HTTP/HTTPS na 80/443, bez userinfo/auth/cookies/proxy. Kontrola DNS/IP i każdego redirectu, przypięte połączenie, blokada prywatnych/specjalnych IPv4/IPv6. Limity czasu, rozmiaru i dekompresji. 429 blokuje host; ograniczony retry błędu strony. Bez wykonania skryptów, omijania CAPTCHA/logowania/403. React renderuje tekst, CSV chroni formuły.

Źródła/model są danymi. Strict schematy odrzucają pola uprawnień/recipient/shell. Model dostaje minimalne zatwierdzone fakty/projekty i publiczne źródła; nie dostaje SQLite, prywatnej poczty, tokenów ani bajtów CV. Wynik ma odwołania i mapę deklaracji, sprawdzane regułami i osobnym review. Niepewny wynik zachowuje zapis i blokuje automat dla tej wiadomości.

Codex exec: stdin, osobny katalog tymczasowy, bez shellowej komendy, allowlista środowiska bez API key/tokenów/proxy; istniejący login ChatGPT. Read-only, approval never, ignore-user-config/rules, ephemeral, strict config i wyłączone narzędzia shell/apps/pluginy/hooks/browser/computer use/memory/multi-agent oraz funkcje administracyjne. Parser odrzuca niedozwolone zdarzenia narzędzi. CLI compat sprawdzamy przez rzeczywisty help/test konfiguracji, nie przez przyznanie full access. Windows używa natywnego exe i przerywa tylko własny proces/zadanie.

To ograniczenia narzędzi i sandboxu CLI, nie dowód niezależnej izolacji całego procesu OS. Nie badano wszystkich odczytów hosta przez CLI ani przyszłych wersji. Aktualizacja CLI unieważnia fingerprint testu integracji i wymaga ponownego testu. Nie obiecujemy pełnej izolacji OS lub bezbłędnej interpretacji źródeł.

## Granice prac

Rozwój nie upoważnia do prawdziwych maili, również testowych, resetu historii/kwot, zmiany nadawcy, publikacji prywatnej bazy lub rozszerzenia OAuth. Poświadczenia lokalne, CV poza publicznym repo. Gitignore nie usuwa już śledzonych danych. Sesja lokalna nie chroni przed innym procesem z pełnym dostępem do konta użytkownika.

Bez CRM, automatycznych odpowiedzi/follow-upów, AI do całej skrzynki, nowych płatnych usług, rotacji kont i obchodzenia limitów.
