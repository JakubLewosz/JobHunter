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
Stop i identyczność z fikcyjnym MIME. Rzeczywiste wyniki pełnego check/CI i stan wdrożenia zapisano poniżej.

Pełny check wykazał także potrzebę obsługi schematu 028 w eksporcie i audytorze
snapshotów. Dopuszczono tę konkretną wersję bez poszerzania eksportu o prywatne
tabele. Audytor korzysta z tego samego odczytu katalogu i bindingu co serwis.
Odtwarzanie starszego schematu w testach usuwa również tabele 028; natywny
odczyt profilu E2 obsługuje brak katalogu, a jego brak w schemacie 028 jest błędem.
Starsze oczekiwanie dwóch projektów zastąpiono jawnym wymaganiem zero/jeden;
oczekiwania dotyczące faktów, historii, prywatności i bezpieczeństwa pozostają.

## Wynik końcowy

Stałe opisy projektów: **DONE_FIXED_PROJECT_DESCRIPTIONS_STOPPED**. Aplikacja
`ed6ad42aced1d8872b87cc052a0a68d59bd4b58e`, build `75d380e3-bf99-488b-bf9a-8ad4009c409b`;
pełny Windows check PASS: 1070 backend, 12 Stop, 26 UI, typecheck/build.
[CI dokładnego kodu PASS](https://github.com/JakubLewosz/JobHunter/actions/runs/40960775158). Sześć opisów v1
w katalogu, profil v12, FixDesk v3 i jeden nowy fakt gry v1;
natywny import idempotentny, backup/restore PASS, doktor i kontrola ochrony PASS.
Siedem kompletnych przykładów DEVELOPMENT: jedna generacja na kontekst, bez
parafraz; finalne oceny i kontrola końcowym buildem zachowane. Bez Gmaila,
Startu i wysyłki na WORKSTATION. Historyczne 7/16 i C11 pozostają FAIL.

Backup online uwzględniający WAL i odtworzenie z migracją 028 sprawdzono
w izolacji. Wybrano dokładny przetestowany build; backend pozostaje zatrzymany.
Profil v11 → v12; projekty 4 → 6, opisy 0 → 6 i dwa
snapshoty materiałów. Zachowano 15 pozostałych faktów oraz wszystkie
56 pozostałe tabele. Nadal 16 prób i 16 wpisów usage,
280 szkiców oraz 585 zapisanych wersji. CV, wysłane treści,
historia, blokady, aliasy, polityka i limity są niezmienione.
Pełne sześć prywatnych opisów, siedem kompletnych wiadomości i hashe ochrony
są w oddzielnej prywatnej paczce; kod nie zawiera nowego domyślnego profilu.
STOPPED, bez prawa wysyłki i bez nowej kampanii.
