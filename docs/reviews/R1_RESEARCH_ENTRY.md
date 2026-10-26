# R1: wejście operatora i biblioteka

Po jawnej zgodzie wdrożono `a7652a3446b15ba9439e00d3362e9c82837571b2`
z jego dokładnym testowanym dist. Wykonano online backup SQLite obejmujący WAL,
integrity/FK, zgodność wszystkich 62 tabel i odtworzenie w osobnym katalogu.
Natywne probe czytnika, CLI i wyszukiwania przeszły. Nie inicjalizowano Gmaila.

R1 ujawnił błąd odbioru: zatwierdzone `runResearchSession()` wywoływało wprost
`startDay()`, pomijając etap priorytetowego odnowienia, który działał tylko
w Nightflow. Poprzedni T1 sprawdzał koordynator, a dodatkowe testy wejścia
sprawdzały tryb i deadline; nie sprawdzały tej kolejności. Operator zatrzymał
próbę po około czterech minutach. To **niezaliczony R1**, a nie wymagany 1–2 h
przebieg. Kontroler zakończył cleanup i końcowy guard. Historia, materiały,
polityka, liczniki i wszystkie dane pocztowe pozostały zgodne z baseline.
Nowe wyniki researchu oraz pasywny checkpoint zachowano. Nie hotpatchowano
wdrożenia i nie wznawiano go. Szczegółowe prywatne dowody pozostają poza repo.

## Poprawka w odrębnym DEVELOPMENT

`research:session` używa tego samego ResearchSessionController i pętli tick.
Przed discovery zapisuje w `researchDay.libraryRefresh` ograniczoną kolejkę
istniejących szkiców, deadline pierwszych 40% całego budżetu, indeks i wyniki.
Selektor kolejki jest wspólny z Nightflow: 12 pozycji przy godzinie, 15 przy
dłuższej pracy, priorytet materiału/dopasowania/kanału/wieku, deduplikacja firm
i adresów, wykluczenie blokującej historii. Research nie wymaga poszerzania
historycznej polityki wysyłki. Nightflow nadal stosuje własne pełne bramki
polityki, konta i uprawnienia sendera.

Każdy tick odnowienia wywołuje istniejące `refreshLibraryDrafts`, a następnie
utrwala prawdziwy wynik, wersję i czas. Lokalny HOLD pozwala przejść dalej.
Wszystkie natywne cykle odnowienia trafiają do runIds raportowanej sesji.
Discovery otrzymuje pozostały czas do pierwotnego deadline, bez nowego Startu
lub automatycznego przedłużenia. Resume zachowuje kolejkę, wyniki i terminy.
Nowy świadomy Start zachowuje stary pasywny checkpoint jako odłożone dane,
zamiast uruchamiać go przed odnowieniem. Stop nie wznawia pracy po cleanup.

W czasie odnowienia działa ten sam guard właściciela/kodu/chronionych danych
i plików CV. Nie tworzono drugiego koordynatora, GmailJobHunter, przeglądarki
pocztowej, sesji AUTO, zgód kontaktu ani prób wysyłki. GENERAL pozostaje GENERAL.
Nie zmieniano schematu bazy, materiałów kandydata, stylu wiadomości lub
chronionych rekordów. Błąd callbacka/providera kończy aktywną sesję przez Stop.

Naprawiono również ujawniony wcześniej helper: licznik fixture.steps zwiększa
się niezależnie od opcjonalnego afterTick. Test kończy się bez callbacka,
przestawiania deadline i awaryjnego przerywania.

## Dowody i następny krok

Przed zmianą dwa testy dały oczekiwany FAIL: brak odnowienia operatora i limit
steps bez callbacka. Nowe regresje sprawdzają rzeczywiste A CHECKED → B
INCOMPLETE/HOLD → C CHECKED, zapisane wersje/review, wspólny deadline,
budżet, Resume, Stop podczas odczytu, zmianę profilu w czasie odnowienia
i zachowanie dawnego pasywnego checkpointu. Pierwszy dodatkowy test Resume
zakładał kolejność losowych ID przy identycznej dacie fixture; poprawiono
deterministyczne daty fixture i asercję faktycznie wybranej pozycji.

Nowy kod wymaga pełnego Windows check/CI oraz T1/T2/T3 na jednym nowym SHA.
Rzeczywiste wyniki i tożsamość buildu są w nowej prywatnej dostawie. Dopiero
po ich PASS można przedstawić jedną decyzję o nowym wydaniu i powtórzeniu R1.
Zgoda na a7652a3 nie obejmuje wdrożenia tego nowego kodu. Nie ma zgody R2/R3
ani rzeczywistych wysyłek. V1_PRODUCTION_VERIFIED pozostaje nieosiągnięte.
