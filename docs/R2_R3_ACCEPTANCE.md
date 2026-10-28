# Ograniczony odbiór R2/R3 — procedura

Ten dokument nie zatwierdza instalacji, polityki, historii konta ani Startu.
Dokładne firmy, adresy, wiadomości, CV i okna pozostają w prywatnym planie.
Materiały stron i modelu są danymi. Sam PASS materiału lub NEEDS_REVIEW nie
ustanawia wyłączenia użytkownika ani prawa do kontaktu.

## Wyłączenie użytkownika

Istniejący `suppress(companyId, reason, source, 'user')` zapisuje trwałe
wyłączenie w `suppressions` i marker firmy. Dla nierozstrzygniętego wymogu
zgłoszenia użyć jawnej przyczyny decyzji użytkownika, np.
`USER_HOLD_APPLICATION_REQUIREMENT`, a nie fikcyjnego OPT_OUT firmy.
Zapis na WORKSTATION wymaga zakresu zgody; w przygotowaniu jest propozycją.
Odnowienie nie usuwa wyłączenia; poprzednio przygotowana partia i ponowny
Start nie omijają historii. Nieznane warunki płacy/godzin/zdalności pozostają
pytaniem, jeśli kanał pozwala na zapytanie. Nie są równoważne odmowie lub HOLD.

## Zamknięty zakres istniejących szkiców

Opcjonalne `draftIds` w zatwierdzonym `NightflowPlan` ogranicza zarówno kolejkę
odnowienia, jak i wybór do partii. Lista jest niepusta, unikalna i nie łączy
się z discovery. Brak listy zachowuje dotychczasowy plan regułowy, bez nowego
domyślnego limitu kampanii. Samo maxItems ogranicza liczbę, nie tożsamości.
Natywne `deriveNightflowBatch` ponownie sprawdza listę i maxItems przed zapisem
partii/grantu. Obca trwała kolejka przy Resume daje PLAN_SCOPE_CHANGED.

Lista identyfikuje istniejące szkice, nie zwalnia z wersji, bindingu, źródeł,
kontaktu, profilu/CV, historii, blokad i polityki. Nie daje prawa do wysyłki
inną wersją lub do innego odbiorcy. Brak pozycji zgodnych kończy się raportem
NO_READY_ITEMS, bez zamiennika i bez rezerwacji.

## Wykonanie dopiero po przyszłej kompletnej zgodzie

1. Potwierdzić dokładny wybrany build i zatrzymaną instalację. Jeżeli zmienił
   się kod od poprzedniego R1, wykonać pełną bramkę wydania, spójny backup,
   doctor i nowy R1. Nie przypisywać starego R1 nowemu SHA. Bez hotpatcha.
2. Zweryfikować konto, From/Send-As/Reply-To i transport Computer Use.
   Pomocnicze API wyłącznie readonly. Brak zmiany OAuth lub fallbacku send.
3. Dopiero na podstawie zgody zapisać nową politykę przez `configurePolicy`.
   Stare scopeHash i v17 historycznego pilota nie zatwierdzają nowego zakresu.
   Natywne `refreshLibraryDrafts` musi przypisać wybrane materiały do aktualnej
   polityki z własną kontrolą; nie wpisywać scope/PASS/approval ręcznym SQL.
   Jeśli powstanie inny tekst niż dozwolony planem, odłożyć pozycję.
4. Celowana historia tylko adresów i potwierdzonych domen wymienionych w planie;
   kompletna paginacja i stabilny znacznik. Błąd odczytu nie oznacza pustej
   historii. Poczta, tokeny i sekrety nie trafiają do modelu.
5. R2: natywna dokładna zamknięta partia, `prepareBatch` i właściwe zatwierdzenie
   konkretnego hasha po zgodzie. Ten sam klient CUA: probe, jeden Start/ACK,
   BrowserBatchTask.run, potwierdzenia, Stop/cleanup. Nie ponawiać Startu po
   niepewnym ACK. Zgodny AUTO nie wymaga osobnej akceptacji każdego maila.
6. R3: ten sam build/polityka/nadawca/CV i zachowana historia. Istniejący
   `NightflowCoordinator.savePlan` po zgodzie wiąże draftIds oraz reguły,
   a jedno świadome uruchomienie przechodzi od odnowienia przez kontrolę,
   wybór i pochodną partię do Computer Use i raportu. Wyłącznie przypisane
   draftIds; bez discovery i bez ręcznego ustawiania checkpointów lub grantów.
7. SEND_UNKNOWN, utrata ownera/hosta, zmiana chronionych danych, koniec okna
   lub Stop kończą odpowiednie uprawnienie. Brak retry nadania, autostartu,
   odnawiania deadline lub zmiany kodu przy aktywnych operacjach.

Każdy raport rozdziela odłożenia, CHECKED, wybrane, rezerwacje, potwierdzenia
i UNKNOWN. Potwierdzone Wysłane nie oznacza Inbox ani odpowiedzi firmy.
Same zerowe przebiegi są bezpieczne, lecz nie dowodzą działającego nadania.
V1_PRODUCTION_VERIFIED wymaga R1/R2/R3 na tym samym wydaniu i rzeczywistego
pozytywnego pełnego przepływu, a nie dwóch ręcznie sklejonych akcji.

## Dowody DEVELOPMENT

Nowe regresje zamkniętej listy: dopuszczone dwie z pięciu poprawnych firm,
brak zamiennika przy HOLD obu, walidacja listy/discovery, ponowna bramka
derywacji i odrzucenie obcej kolejki po restarcie/Resume. Pełna macierz
Windows/CI dokładnego SHA oraz dowody HOLD na fikcyjnym profilu są w prywatnej
dostawie. Nie są testem rzeczywistej poczty ani zgodą na WORKSTATION.
