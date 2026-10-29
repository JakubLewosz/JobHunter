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

## Ustalona przed wykonaniem macierz

| Etap | Wymagany dowód | Stan |
|---|---|---|
| A | Dokładny kod/reuse, Windows check i CI | w toku |
| A host | Natywne syntetyczne A / odłożone B / C, dwie pętle i restart, rzeczywisty lokalny Computer Use, release/cleanup | oczekuje |
| B | Stop, koniec operacji, backup z WAL i restore, instalacja, doctor, loaded hash, STOPPED | oczekuje |
| C | Ograniczone natywne odnowienie biblioteki bez poczty, aktualne źródła i review v3 | oczekuje |
| D | Dwa odrębne zatwierdzone przebiegi tego samego buildu; co najmniej jedno potwierdzone nadanie; druga pozycja nadana lub prawidłowo pominięta | oczekuje |
| Koniec | Deduplikacja po restarcie, chroniona historia, STOPPED, brak operacji/uprawnień i sprawdzone paczki | oczekuje |

Odbiór jeszcze nie jest zaliczony. Wykryto niezaliczone wcześniejsze CI
dokumentacyjnego HEAD `8ca0f3e` (run 40887353139), zachowane jako failure;
publiczna adnotacja podaje exit 1 bez nazwy testu, a pełny log wymaga dostępu
do zalogowanego konta. Bieżący pełny lokalny check trwa; przyczynę i finalne
wyniki rozliczamy osobno. Nie przenosimy wcześniejszego zielonego CI na ten
niezaliczony przebieg.

Nie dodajemy nowego koordynatora, schedulera lub frontendu. Zakres techniczny
na razie dotyczy przyjęcia istniejącego kodu i instrukcji operatora; źródła
aplikacji pozostają zgodne z wybranym kandydatem. Późniejsze wyniki i ich
ograniczenia będą dopisane po rzeczywistym wykonaniu, bez zmiany dawnych FAIL.
