# Istniejące szkice do AUTO — wynik techniczny 23.10.2026

Baza: d514ea797ccbdd73085c0574ee5ea19f70e61708. Rozwój w oddzielnej kopii kodu,
bez wdrożenia, odczytu poczty, OAuth lub uruchomienia rzeczywistego pilota.

Blokada przygotowania samych dawnych wersji była prawidłowym `SCOPE_CHANGED`:
RESEARCH_ONLY nie przypisuje szkicu do polityki AUTO. Po dopuszczeniu nowej
wersji istniejące publiczne operacje wystarczają. Regresja na niezmienionym
kodzie przeszła: prawdziwy import/read/draft RESEARCH_ONLY, zatwierdzona
konkretna polityka, rzeczywiste odnowienie wybranych źródeł w AUTO, nowa wersja
tego samego ID z identycznym tekstem, scope i zamknięta partia bez discovery.
Nie dodano nowej architektury lub operacji adopcji i nie wpisywano scope SQL-em.

Dodano minimalne bariery ujawnione przez testy współbieżności: brak edycji
polityki/szkicu podczas odnowienia, ponowna kontrola właściciela po await
czytnika/modelu, niezmienność polityki i wersji wybranej do odczytu, sprawdzenie
zatwierdzonych materiałów AUTO przed rozpoczęciem. Utrata właściciela nie
uprawnia do zapisania Stop za nowego właściciela. Przerwany materiał pozostaje
nieweryfikowany. Guard scope, generator, transport i limity nie zostały
poluzowane ani przebudowane.

Celowane Windows x64 / Node24.19.0: **45/45 PASS, FAIL0, SKIP0** — 16 nowych
regresji oraz istniejące library-refresh/closed-batch. Pierwsza macierz
ujawniła trzy rzeczywiste luki i jeden błąd formularza fixture. Późniejsze
44/45 miało błędne oczekiwanie zapisu STOPPED po utracie właściciela; fixture
sprząta jawnie dopiero po przywróceniu własnej syntetycznej blokady. Zachowano
wynik nieudany. Nie zmieniano progów lub bramek, żeby test przeszedł.

Pełny `npm run check` na Windows ma osobne syntetyczne HOME/USERPROFILE,
APPDATA/LOCALAPPDATA, TEMP i dane oraz komplet fikcyjnych providerów. Jego
dokładny wynik, testowane bajty oraz CI końcowego SHA są zapisywane w dowodach
dostawy. Wcześniejszy check d514ea7 nie jest wynikiem tej zmiany. Nie
powtarzano ośmiogodzinnego testu hosta.

Rzeczywiste wersje biblioteki pozostają niezmienione. Brakuje zatwierdzonej
polityki wymaganej przez configurePolicy; nie wpisano confirmed lub
targetedHistoryConsent na podstawie zlecenia rozwoju. Nie odnowiono rzeczywistych
szkiców do AUTO i nie utworzono partii/rezerwacji/uprawnień. Prywatna procedura,
dokładna lista ID, materiały i podglądy są poza Git. Następny krok to świadoma
decyzja o konkretnej polityce, potem wspierane odnowienie i podgląd finalnych
wersji przed osobną zgodą na pilota. Stan rzeczywisty: STOPPED, bez wysyłki.

[Procedura i ograniczenia](../EXISTING_DRAFTS_TO_AUTO.md).
