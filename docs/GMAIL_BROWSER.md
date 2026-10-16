# Gmail w przeglądarce Codexa

Pierwszy etap transportu przeglądarkowego. JobHunter nadal prowadzi kolejkę,
kontroluje materiały, odbiorcę, historię, blokady, tempo i prawo sesji. Osobny
wykonawca w aktywnej rozmowie Codexa redaguje wiadomość w zalogowanym Gmailu.
Nie zainstalowano samodzielnego demona sterującego przeglądarką ani autostartu.

## Zakres i uruchomienie

Domyślny transport pozostaje `GMAIL_API`. W ustawieniach połączenia można
wybrać `GMAIL_BROWSER`, gdy program jest zatrzymany i nie ma oczekujących
lub niepewnych prób. Wybór wymaga potwierdzenia dostępu do przygotowywanej
wiadomości i jej wyniku. Unieważnia stare podglądy oraz wersję polityki;
nie uruchamia wysyłki. AUTO_POLICY nadal wymaga konfiguracji i Start.
Kolejne zgodne wiadomości nie wymagają indywidualnej zgody. RESEARCH_ONLY
nie tworzy wykonawcy ani transportu Gmaila.

Natywne połączenie wykonawcy wymaga istniejącego WORKSTATION na Windowsie.
DEVELOPMENT korzysta z fikcyjnych providerów. Po zatrzymaniu operacji należy
wykonać backup, build/doctor wybranej wersji i uruchomić zatrzymany backend.
Migracja `020_browser_delivery.sql` dodaje wyłącznie tabelę pochodzenia
prób UI. Migrator zachowuje standardowy spójny backup przed aktualizacją.

Wykonawca korzysta z istniejących narzędzi przeglądarki Codexa, po ręcznym
logowaniu użytkownika. Nie korzysta z cookie, hasła, tokenu panelu/Codexa,
sekretów OAuth ani CDP. Izolowany runner CLI używany do researchu nadal
ma wyłączone UI. Jedna próba zainstalowanego CLI w odrębnej konfiguracji
readonly, bez wtyczek i z flagami Browser Use, nie udostępniła narzędzi
przeglądarki. Nie dowodzi to braku obsługi w każdej konfiguracji CLI;
wdrożony wykonawca używa zweryfikowanego narzędzia aktywnej sesji Codexa.
Nie poszerzamy dostępu runnera researchu.

Po buildzie punkt wejścia dla kodu wykonywanego **wewnątrz aktywnej sesji
narzędzia przeglądarki Codexa** to `scripts/browser-executor.mjs`:

```js
// Wymaga istniejącego, świadomie wskazanego uchwytu tab do Gmaila.
// Sam import i connect niczego nie wysyłają.
const executor = await import('/ABSOLUTE/REPO/scripts/browser-executor.mjs');
const client = await executor.connectBrowserExecutor('/ABSOLUTE/PROFILE');
// Dopiero przy autoryzowanej kolejce i aktywnym zadaniu wykonawcy:
// await executor.runBrowserDelivery(client, tab);
// albo bounded loop: await executor.serveBrowserDeliveries(client, tab, 60000);
```

Nie uruchamiać tego przykładu w zwykłym terminalu jako zamiennika narzędzia
przeglądarki. Backend przekazuje zadanie przez lokalny named pipe. Prywatny
`browser-executor.json` zawiera krótkotrwałe dane tego połączenia; czyta je
wyłącznie klient w pamięci. Nie drukować ani nie przekazywać jego zawartości
do modelu. To odrębny plik, niezwiązany z `launch.json`. Brak aktywnego
wykonawcy jest widoczny w panelu i blokuje przygotowanie/wysyłkę.
Po zamknięciu backendu opis połączenia jest usuwany. Restart nie wznawia
prób ani sesji. Zamknięcie Codexa nie powoduje przełączenia na API.

Dla fikcyjnych providerów Unix stosowany jest krótki socket w katalogu
tymczasowym z prawami 0600; długa ścieżka profilu może przekroczyć
[limit IPC opisany przez Node.js](https://nodejs.org/api/net.html#ipc-support).
Rzeczywistego testu na macOS w tym etapie nie wykonano.

## Wykonanie i wynik

1. Istniejący sender rezerwuje jedną próbę i limit. Broker tworzy zadanie
   z dokładnego zamrożonego materiału, literalnym odbiorcą i kopią PDF.
2. Wykonawca odmawia pracy przy istniejącym oknie redagowania, nieznanym
   układzie, niezgodnym koncie lub starym komunikacie wysłania. Obsługiwany
   zakres rozpoznawania kontrolek: Gmail w języku polskim/angielskim.
3. Sprawdza pola Do/DW/UDW, temat, pełny tekst, nazwę i zakończenie uploadu.
   Lokalny PDF jest sprawdzany po SHA-256. Nie czyta pozostałej poczty.
4. Broker sprawdza obserwację i ponownie wykonuje bramki programu. Po
   końcowym sprawdzeniu UI wydaje jedno uprawnienie bezpośrednio przed
   pojedynczym kliknięciem. Nie ma ponawiania kliknięcia.
5. Świeży komunikat Gmaila zapisuje przyjęcie przez UI. Identyfikator
   pobierany jest tylko z tego komunikatu lub jego linku do własnej
   wiadomości. Widoczne identyfikatory innych wiadomości nie są wynikiem.
6. Dotychczasowy celowany odczyt API, w granicach zapisanej zgody konkretnej
   próby, potwierdza nadawcę, odbiorcę, temat, czas, SENT i payload/PDF.
   Ten etap nadal wymaga istniejącej konfiguracji Gmail API; nie jest to
   wariant całkowicie bez API. Nie zmieniamy OAuth automatycznie.

W UI Gmail tworzy końcowy MIME i RFC Message-ID. Zachowany EML jest
materiałem odniesienia, nie kopią bajtów nadanych przez przeglądarkę.
Oddzielna kontrola payloadu dopuszcza układ białych znaków, lecz zachowuje
sekwencję słów, temat, linki, nazwę i bajty PDF oraz zgodność HTML z tekstem.
Nie zmienia dawnych MIME ani kontroli uzgadniania wysyłek API.

Brak jednoznacznego identyfikatora lub zgodności pozostawia SENT_PROVIDER
do rozstrzygnięcia, bez ponowienia. Błąd przed nadaniem uprawnienia to
FAILED_NOT_SENT; po jego nadaniu wynik jest konserwatywnie SEND_UNKNOWN.
Stop odwołuje oczekujące zadanie. Pozostaje nieusuwalny wyścig pomiędzy
odpowiedzią ostatniej bramki a zdalnym kliknięciem: Stop po przekroczeniu
tej granicy nie cofnie już przyjętej akcji. Bez obietnicy exactly-once.

## Granice przeprowadzonej próby

16 października sprawdzono prawdziwe logowanie i redagowanie w Gmailu
na fikcyjnym adresie .test, fikcyjnej treści oraz fikcyjnym PDF. Nie
kliknięto Wyślij w prawdziwym Gmailu. Kliknięcie, awarie i rozstrzyganie
wyniku testowano wyłącznie na syntetycznych providerach i imitacji UI.
Rzeczywistego komunikatu po wysyłce, identyfikatora własnej wiadomości,
dostarczalności i folderu odbiorcy jeszcze nie sprawdzono tym transportem.
Pełny zakres testów i ograniczenia: [TEST_REPORT](TEST_REPORT.md).

Przed produkcyjnym wyborem transportu potrzebny jest osobno zlecony
SELF_TEST z konkretnym podglądem, a potem mały pilot. Zalogowanie się i
rozwój aplikacji nie są zgodą na rzeczywistą wysyłkę. Adaptery portali pracy
i potencjalnych zleceń pozostają kolejnymi etapami.
