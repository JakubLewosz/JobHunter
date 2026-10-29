# Przyjęcie ograniczonego wydania V1 — 29.10.2026

`STYLE_RELEASE_DECISION=ACCEPTED_WITH_LIMITATIONS`: bezpośrednia decyzja
użytkownika w zleceniu `JobHunter_DOMKNIECIE_V1_WDROZENIE_I_ODBIOR.md`.
Kandydat aplikacji `69a5b235e00629285f683f48720e91da8f7acfe3` zawiera jako
przodka niezależną poprawkę reuse `c905b7ee9eefd978848204b0bbba8bb6c2852104`.
Nie nakładamy jej drugi raz, nie zmieniamy builderów i nie stroimy recenzenta.

Zakończone badanie pozostaje: 7 wygranych / 9 remisów / 0 przegranych, 16/16
tekstów kandydata READY według modelowego sędziego, próg >=8/16 FAIL.
Kalibracja nadal FAIL: 5/5 dobrych zachowanych, 6/7 wad wykrytych, C11
przeoczone. Pierwszy błędnie skopiowany zestaw pozostaje INVALID_INPUT_ASSEMBLY;
starszy wynik 1/16 pozostaje FAIL. Suplement dobrano po poznaniu pierwszej
części. Mała próba i sporne oceny nie dowodzą niezawodności recenzenta.

Decyzja dopuszcza kontrolowane wdrożenie po bramkach technicznych. Nie jest
pozytywnym wynikiem historycznego eksperymentu i nie nadaje ogólnego prawa
wysyłki. Prywatne odbiorcy, terminy, profil, CV i źródło nowej ograniczonej
zgody są w lokalnym checkpointcie poza repo. Nie kopiujemy ich do GitHuba.

## Wynik odbioru

DONE_V1_CONTROLLED_BATCHES, wyłącznie aktywny Codex na Windows i zamknięte
partie. Aplikacja bc40fac233f31daf82d4987a45c7a65c8ebaafce, build
1fdfb176-cb6f-4ff0-91a3-5391ce13091a, loadedCodeHash
99c13dc4ddfb86f6a3fd576cfe0aded0b50839914f192e8fbe6ff1c432133d4a.
Późniejszy HEAD dokumentacyjny nie zmienia tego buildu lub źródeł aplikacji.

| Etap z macierzy zapisanej przed wykonaniem | Dowód końcowego wydania                                                                                                                                                                                              | Wynik                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| A                                          | Reuse już w przodkach; minimalna poprawka jawnego odnowienia scope; pełny Windows check 1051/12/26, typecheck/build; CI40922050436 dokładnego bc40fac                                                                | PASS                                                      |
| A host                                     | Rzeczywisty lokalny CUA: A i C po odnowieniu ukończone, B STALE_EVIDENCE; drugi cykl bez nowych prób; release/cleanup                                                                                                | PASS                                                      |
| B                                          | Stop i brak obcego ownera/niepewnych prób; online backup z WAL; wszystkie62 tabele po odtworzeniu identyczne; integrity/FK; doctor, loaded hash, instalacja STOPPED; stary kod zachowany do rollbacku                | PASS                                                      |
| C                                          | Cztery ID zamrożone przed wynikiem: dwa cele i dwie najstarsze kwalifikujące się pozycje; 18 weryfikacji źródeł; dwa CHECKED v2→v3 z nowym review v3 i zachowaną treścią, dwa STALE_EVIDENCE; bez Gmaila i discovery | PASS                                                      |
| D1                                         | Pierwszy Start STOPPED/BROWSER_HOST_LOST przed próbą; jedno jawnie zarejestrowane natywne Resume tego samego joba ukończyło plan                                                                                     | PASS po jednym Resume, pierwszy Start pozostaje przerwany |
| D2                                         | Osobny jednoelementowy plan na tym samym buildzie bez napraw kodu; ciągła obsługa tej samej instancji do końca                                                                                                       | PASS bez Resume                                           |
| Nadanie                                    | Dwa nowe FIRST_CONTACT, oba SENT_CONFIRMED; odstęp755.876s; pierwsze oczekiwania624.229s i622.036s; zero niepewnych i duplikatów                                                                                     | PASS                                                      |
| Restart                                    | Nowa natywna instancja zwróciła CONTACT_HISTORY dla obu obsłużonych pozycji bez odczytów źródeł, ocen, zmian materiału lub prób                                                                                      | PASS                                                      |
| Koniec                                     | Stare próby, zużycie, wysłane materiały, wersje, profil/CV i blokady zachowane; końcowy backup; STOPPED, brak ownera i odwołane prawo                                                                                | PASS                                                      |

## Wykazana poprawka techniczna

Niezależne odnowienie domyślnie chroniło wszystkie auto_draft_scope, także
stare zatrzymane wpisy dla nowych jawnie zleconych ID. Regresja przed poprawką
wykazała PROTECTED_DRAFT zamiast CHECKED. Opcjonalne renewScopedDraftIds /
--renew-scoped-ids-file jest ścisłym podzbiorem wybranych ID, wymaga zatrzymanej
pracy i nie udziela żadnego scope wysyłkowego. Domyślna ochrona pozostaje;
jawna lista chronionych szkiców, blokady historii i cały guard materiałów,
polityki, starej historii oraz CV nadal obowiązują. Stary scope nie jest kasowany
ani przepisywany przez tę operację. Dziewięć testów ścieżki PASS (podzbiór1051).
Nie zmieniono wzorców, recenzenta, kryteriów, modelu, limitu CLI, lease,
discovery, timerów ani procesu uruchamiania CLI. Nie był potrzebny nowy godzinny
discovery: rzeczywisty test dotyczył zmienionego wejścia odnowienia.

## Pierwsze porażki i ograniczenie wykonawcy

Pierwszy rzeczywisty Start utracił host po przerwaniu RPC po300s, mimo
większego parametru narzędzia. Najpierw ustalono stan tej samej instancji:
natywny Stop, zero prób i brak niepewności, cleanup właściciela. Nie kliknięto
ponownie. Dodatkowy11-minutowy test idle zachowuje FAIL: aktywność630.590s,
następnie przerwa operatora na analizę spowodowała utratę lease przed wymaganym
końcem660s. Nie nazywamy tego PASS ani nie zmieniamy progu testu.

Istniejący CodexNightflowAdapter obsługiwany natychmiast kolejnymi oczekiwanymi
krótkimi RPC (ta sama instancja, bez odłączonej obietnicy) ukończył dopuszczone
Resume oraz drugi plan. Maksymalne rzeczywiste odstępy hosta15.249s i14.463s
pozostały poniżej niezmienionego lease45s. To dowód tych zakończonych odcinków,
nie dowód nieprzerwanego pierwszego Startu lub działania po uśpieniu/zakończeniu
Codexa. Instrukcja operatora opisuje tę faktycznie wykonaną ścieżkę.

Wcześniejsze CI8ca0f3e run40887353139 pozostaje failure. Publiczna adnotacja
podaje wyłącznie exit1, pełne logi nie były dostępne przez podłączony interfejs
ani niezalogowany widok. Przyczyna jest nieustalona; nie przypisujemy jej
poprawce scope ani awarii zewnętrznej. Końcowy kod ma własne pozytywne CI i
pełny lokalny check. Wcześniejszy lokalny check świadomie przerwano po
wykazaniu koniecznej zmiany; nie zaliczono go jako sukcesu.

Nie obiecujemy pracy bez aktywnego wykonawcy, automatycznego obudzenia,
dostarczenia do Inbox, niezawodności recenzenta, dowolnej biblioteki lub
nieograniczonej kampanii. Zakończono ten zakres V1; dalsze zwykłe użycie wymaga
nowego właściwego upoważnienia, nie kolejnego projektu strojenia.

Pełne własne wiadomości, odbiorcy, nowe terminy, źródła, bindingi, historia
prób i dowody prywatne pozostają poza repo. Nie publikujemy SQLite, PDF,
sekretów, obcej poczty ani surowych prywatnych logów.
