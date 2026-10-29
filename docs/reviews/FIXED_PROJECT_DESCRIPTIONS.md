# Stałe opisy projektów — 29.10.2026

Wąska zmiana po przyjęciu V1: zero albo jeden projekt, a jego zatwierdzone
zdanie jest wstawiane dosłownie przez kod przed zapisem i pełnym review.
Nie jest to nowa kalibracja stylu; wcześniejsze FAIL, wzorce i poprawka reuse
pozostają zachowane. Nie udziela prawa do Gmaila, Startu ani wysyłki.

Migracja 028 dodaje wersjonowane opisy powiązane z istniejącymi projektami
i wersją/hashem zatwierdzonego faktu oraz źródłem zgody. Nie ma prywatnego
katalogu domyślnego. `importProjectDescriptions` jest natywną, atomową,
idempotentną operacją zatrzymanego serwisu; zachowuje istniejące ID oraz
snapshoty przed i po zmianie. `revokeProjectDescription` dopisuje wersję
REVOKED, bez cofania do starszego APPROVED. Ponowne wczytanie dawnej zgody
nie odtwarza cofniętego materiału. Zmiana profilu nie rozszerza starych zgód.

Istniejący selektor korzysta z literalnych dowodów z analizy; wybiera jeden
najwyższy wynik, remis rozstrzyga rosnącym kluczem logicznym. Zapisuje dowody,
powód i wersję w kontekście oraz podglądzie. Sam Codex, polityka PDF lub
interaktywna strona nie uzasadniają odpowiednio CodeFabric, ElektroScan lub
gry. Szczegółowa obowiązkowa odpowiedź o doświadczeniu wymaga osobnej treści.
Kwalifikacja, przeznaczenie adresu i blokady pozostają niezależne.

Model zwraca wybrany ID i jedno osobne miejsce na projekt. Kod odrzuca zmianę
ID, duplikaty i brak miejsca, wstawia pełne zdanie oraz właściwy claim.
Kontrola całego listu wykrywa dodatkowy opis, niezgodne bajty, metadane,
odwołania i niepoparte deklaracje. Review nadal obejmuje cały finalny temat,
body i claims; treść nie jest później dopisywana w transporcie. Jedyna
korekta ponownie przechodzi składanie, kontrolę zakresu i pełne review.
Ręczna edycja nie jest automatycznie naprawiana przez podmianę tekstu.

Nowa wersja kontraktu jest niezależna od niezmienionej wersji jakości v3.
Material binding obejmuje katalog i aktualne fakty. Stare PASS/sameText nie
omijają kontraktu. Odnowienie tworzy nową wersję, gdy stary opis jest
niezgodny; aktualnego poprawnego tekstu nie regeneruje bez potrzeby.
Unieważnienie gotowości jest leniwe przy przyszłym użyciu, bez hurtowej
modyfikacji biblioteki, wysłanych wersji, historii, CV lub liczników.

Regresja początkowa potwierdziła dopuszczanie swobodnej parafrazy.
Po zmianie celowane testy sprawdzają sześć projektów i brak projektu,
odnowienie, edycję, jedną korektę, restart, cofnięcie zgody, utratę ownera,
Stop i identyczność z fikcyjnym MIME. Wyniki pełnego check/CI i faktyczny
stan wdrożenia zostaną zapisane po ich rzeczywistym zakończeniu.
