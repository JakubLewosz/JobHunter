# Gmail z CV w JobHunter

Tryb `APPROVAL_REQUIRED` ma przegląd konkretnych wiadomości, test do siebie, sprawdzanie historii i wysyłkę paczki do trzech firm. RESEARCH_ONLY nadal nie czyta Gmaila i nie wysyła. Dodanie tej możliwości nie upoważnia do rzeczywistych wysyłek podczas kodowania.

## Konto już podłączone

Konto połączono 7 października z zakresem send; 8 października użytkownik zakończył rozszerzenie o readonly/send. Nie trzeba ponownie pobierać JSON-a ani powtarzać udanego rozszerzenia. Jeśli odczyt nie jest jeszcze podłączony, w katalogu projektu uruchom:

```sh
npm run gmail:enable-read
```

Helper używa klienta zapisanego w systemowym magazynie haseł i otwiera Google w przeglądarce. Prosi o tożsamość, `gmail.send` i `gmail.readonly`, bez compose/modify/full mail. Google daje readonly do całej skrzynki; aplikacja ogranicza odczyty do wybranych adresów i domen firm oraz swoich wysłanych wątków. Poczta nie jest przekazywana do modelu AI. [Zakresy Gmail](https://developers.google.com/workspace/gmail/api/auth/scopes).

Status bez odczytu tokenów: `npm run gmail:status`. Odłączenie i cofnięcie zgody: `npm run gmail:disconnect`. Żadne z tych poleceń nie wysyła maila.

Projekt korzysta wyłącznie z konta przeznaczonego do JobHuntera. Tymczasowe konto osobiste po zakończonym teście odłączono, usunięto z testerów i cofnięto jego zgodę Google. Jego adres i lokalne kopie MIME usunięto; zachowano anonimowe terminalne stany i wykorzystane limity. Nie należy ponownie podłączać tego konta ani używać go jako odbiorcy prób.

## Dostarczalność przy świeżym koncie

Użytkownik chce docelowo używać pierwotnego konta utworzonego dla JobHuntera. Udane porównanie z innym kontem jest wskazówką diagnostyczną, nie wymogiem zmiany adresu. Wiek konta jako samodzielna przyczyna Spamu pozostaje hipotezą; SPF/DKIM/DMARC w dotychczas sprawdzonych EML były poprawne.

Zalecane jest korzystanie z konta do rzeczywistej korespondencji, mała liczba trafnych kandydatur na wskazane kontakty rekrutacyjne oraz stopniowe zwiększanie liczby wiadomości po ocenie wyników. Google zaleca mały, równomierny wolumen i unikanie nagłych skoków, ale nie podaje gwarantowanego okresu ani liczby wiadomości, które naprawią dostarczalność tego konta. [Zalecenia Google](https://support.google.com/mail/answer/81126?hl=en).

Odbiorca oczekiwanej, prawidłowej wiadomości może użyć „To nie jest spam”; ten sygnał pomaga Gmailowi uwzględnić jego preferencje. Poprawa na tej skrzynce nie dowodzi poprawy pierwszego kontaktu na nowych adresach. Kolejne testy muszą rozróżniać wcześniejszą historię i działania odbiorcy. Bez fikcyjnych rozmów, automatycznych dubletów lub gwarancji „rozgrzania” konta. [Pomoc Gmaila](https://support.google.com/mail/answer/1366858?hl=en&co=GENIE.Platform%3DDesktop).

Research i przygotowywanie szkiców mogą działać niezależnie od liczby zatwierdzonych wysyłek. Nie zmieniono generatora ani limitów aplikacji; nowe wiadomości nadal wymagają własnego zlecenia i dokładnego podglądu.

## 403 access_denied przy zmianie konta

Jeśli Google pokazuje, że JobHunter jest testowany i dostępny tylko dla zatwierdzonych testerów, wybierz projekt JobHunter w Google Cloud, a następnie Google Auth Platform → Audience/Odbiorcy → Test users/Użytkownicy testowi → Add users/Dodaj użytkowników. Dodaj konto, które ma podłączyć Gmail jako nadawca, i zapisz. To konfiguracja kont logujących się do aplikacji, nie lista odbiorców maili. [Instrukcja Google](https://developers.google.com/workspace/guides/configure-oauth-consent).

Po zapisaniu uruchom ponownie `npm run gmail:enable-read` i wybierz właściwe konto. Nie używaj starego callbacku po wygaśnięciu logowania. Helper ponownie użyje klienta z systemowego magazynu haseł; nowy JSON nie jest potrzebny. Przed przygotowaniem wysyłki sprawdź `npm run gmail:status` i dokładny nadawca w nowym podglądzie. Dodanie testera nie rozstrzyga problemu Spamu.

## Jednorazowe podłączenie od początku

1. W [Google Cloud](https://console.cloud.google.com/) utwórz projekt JobHunter i włącz Gmail API.
2. W Google Auth Platform ustaw External/Testing, nazwę i swój email, dodaj swój adres do Test users.
3. Utwórz klienta OAuth Desktop app i zapisz JSON poza repo, np. w Pobranych. Nie wklejaj zawartości do czatu.
4. `npm run gmail:connect -- "/pełna/ścieżka/client_secret.json"`, a następnie `npm run gmail:enable-read`.

PKCE S256, state, losowy callback 127.0.0.1 i limit pięciu minut. Konto musi mieć potwierdzony adres; odrzucone uprawnienia nie oznaczają gotowego połączenia. [OAuth dla aplikacji desktopowych](https://developers.google.com/identity/protocols/oauth2/native-app).

## Uruchomienie i pierwszy test

Zatrzymaj dotychczasowy backend, zbuduj kod i uruchom osobny tryb:

```sh
npm run build
npm run start:approval
```

W drugim terminalu otwórz panel:

```sh
JOBHUNTER_MODE=APPROVAL_REQUIRED npm run open
```

PowerShell: `$env:JOBHUNTER_MODE = 'APPROVAL_REQUIRED'`, potem `npm run open`. Windows nieprzetestowany. Zatrzymanie: `node scripts/stop.mjs` z ustawionym APPROVAL_REQUIRED.

Dane są w istniejącym katalogu research-only; DEMO pozostaje osobno. Zmiana trybu i restart unieważniają kolejkę zgód. SENDING po awarii staje się SEND_UNKNOWN.

1. W Moje materiały obejrzyj i zatwierdź aktualny PDF.
2. W Wiadomościach wybierz CV. Po ręcznej edycji użyj Sprawdź zgodność treści, a następnie oznacz aktualną wersję jako przejrzaną. Kontrola odtwarza odwołania do zatwierdzonych faktów i źródeł, bez przepisywania maila; odtworzenie tworzy wersję do ponownego przeglądu.
3. Kliknij Podgląd testu do siebie. Sprawdź dokładny adres, temat, treść i CV. Możesz pobrać EML z załącznikiem.
4. Zaznacz zgodę na tę konkretną wiadomość i jej sprawdzenie w Wysłanych, potem Wyślij test do siebie. Domyślnie odbiorcą jest potwierdzony adres konta Google. Użytkownik może wyraźnie wskazać i zapisać swój dodatkowy adres osobisty do prób; zmiana adresu unieważnia stare podglądy i zgody. Model nie wybiera tego adresu.
5. Poczekaj na Potwierdzona w Wysłanych. Test nie oznacza firmy jako skontaktowanej.

Podgląd używa nazwy nadawcy z zatwierdzonego profilu oraz wersji tekstowej i prostej wersji HTML tej samej treści. HTML powstaje z escapowanego tekstu; nie zawiera obrazów ani śledzenia. Całość wraz z PDF jest zamrożona przed zatwierdzeniem. Taki format nie gwarantuje trafienia do Odebranych; odbiorca ocenia faktyczną dostawę i Spam.

## Krótki test dostarczalności

„Podgląd krótkiego testu bez CV” przygotowuje jedną neutralną wiadomość „Wiadomość testowa” z podpisem, bez linków i załącznika. Wariant jest dostępny wyłącznie dla SELF_TEST na zapisany przez użytkownika adres prób. Korzysta z istniejącego przeglądu i zatwierdzenia dokładnego MIME oraz zwykłych limitów i ochrony SEND_UNKNOWN. Nie przepisuje szkiców ani generatora rekrutacyjnego. Nadal wymaga zatwierdzonych materiałów i wybranego zatwierdzonego CV jako zachowanych warunków kontroli; tego PDF nie załącza. Potwierdzenie krótkiego testu nie zastępuje testu załącznika wymaganego przed kontaktem z firmami.

API preview obsługuje `diagnostic: true` dla krótkiego testu i opcjonalne `textOnly: true` wyłącznie razem z diagnostyką. Ten drugi wariant zachowuje krótki temat i tekst, ale pomija HTML; jego bajty są objęte hashem podglądu. Standardowe maile z CV zachowują swój format. Po każdej próbie odbiorca zgłasza Odebrane/Spam/brak dostawy przed wyborem kolejnego testu. Powtórna próba na tym samym adresie zmienia również historię korespondencji, więc poprawy nie należy automatycznie przypisywać samemu formatowi.

## Kontakt z firmami

Wybierz do trzech szkiców. Wymagane są zatwierdzone materiały/CV, zgodny profil, aktualne źródła i kontakt (do doby), pozytywna kontrola treści oraz przegląd aktualnej wersji. PROSPECT może używać publicznego kontaktu ogólnego; nie udaje wakatu. Fingoweb, odmowy i inne blokady pozostają aktywne.

Sprawdź historię wybranych firm to jawna zgoda na godzinę na odczyt nagłówków korespondencji z wybranymi adresami i zweryfikowanymi domenami, także w Spamie/Koszu. Wszystkie strony muszą być ukończone. Znaleziona korespondencja, błąd, zmiana skrzynki podczas odczytu albo limit 1000 wiadomości/45 sekund blokują wysyłkę. Błąd nie oznacza pustej historii. Przed send wykonywany jest nowy pełny celowany scan. Nie używamy inkrementalnego History API. [messages.list](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list), [messages.get](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get).

Przygotuj podgląd wiadomości do firm, sprawdź każdy adres i dokładny tekst, zatwierdź CV i kliknij Wyślij te wiadomości. Sam przegląd ani Google OAuth nie są zgodą na wysyłkę. Podgląd i zgoda wygasają po 15 minutach. Zmiana treści, wersji, nadawcy, adresu, profilu, polityki lub CV unieważnia zgodę.

Limity początkowej próby: 3 w paczce, 10 dziennie, 50 w kampanii. Każda próba, w tym test do siebie i wynik niepewny, zajmuje limit. Pauza zatrzymuje sender; stop unieważnia kolejkę. Po restarcie przygotuj nowy podgląd i akceptację.

## Wynik i odpowiedzi

Gmail przyjął oznacza wynik API z provider ID; Potwierdzona w Wysłanych to potwierdzenie konta, odbiorcy, tematu, identyfikatora i czasu. Nie oznacza dostarczenia ani przeczytania. Gmail API nadawcy nie udostępnia folderu Odebrane/Spam ani stanu przeczytania w skrzynce odbiorcy. Wynik testu sprawdza odbiorca; odpowiedź potwierdza kontakt, lecz nie pierwotny folder, a brak odpowiedzi lub zwrotu nie rozstrzyga dostawy. [Zakres users.messages.send](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send), [wiadomości w skrzynce zalogowanego użytkownika](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages). SEND_UNKNOWN zatrzymuje wysyłkę i blokuje ponowienie. Sprawdź tę próbę w Wysłanych odczytuje istniejącą próbę; nie wysyła ponownie. Brak jednoznacznego dopasowania pozostawia wynik niepewny.

Odczytaj odpowiedzi w tym wątku pobiera wyłącznie znany wątek wybranej wysłanej wiadomości. Bez pobierania załączników, klikania linków i przesyłania korespondencji do AI. HTML jest tekstem; odpowiedzi wymagają własnej klasyfikacji. Zwroty oraz zatwierdzone odmowy blokują dalszy kontakt.

Tokeny i klient OAuth są wyłącznie w systemowym magazynie haseł. Poza repo znajdują się metadane konta i prywatna baza/CV/MIME, bez tokenów. Nie ma plaintext fallbacku ani sekretów w argv, logach i danych modelu. AUTO_POLICY nadal zablokowany.

W External/Testing token z Gmail może wygasnąć po siedmiu dniach; potrzebne jest ponowne logowanie. Production nie potwierdza automatycznie publicznej dystrybucji. [Wygaśnięcie tokenów](https://developers.google.com/identity/protocols/oauth2#expiration).

Kod sprawdzono na fikcyjnej skrzynce oraz dziewięciu wyraźnie zleconych rzeczywistych testach, potwierdzonych w Wysłanych: siedem z CV oraz dwa krótkie bez załącznika. Użytkownik zgłosił Spam obu krótkich testów na WP; drugi zachował tekst i temat, ale był pojedynczą częścią text/plain. EML drugiej próby ma zgodny identyfikator i treść, poprawny MIME, DKIM good według WP i X-WP-SPAM YES (U9); nie zawiera osobnych wyników SPF/DMARC odbiorcy. Usunięcie HTML nie rozwiązało problemu w tej próbie; znaczenie U9 i dokładna przyczyna pozostają niepotwierdzone. Następny krok to sprawdzenie reguł odbiorcy bez zmiany ustawień. 157 backend / 6 UI PASS. Odbiorcy zgłaszali zarówno Spam, jak i Odebrane. Sprawdzone wcześniejsze EML z Gmaila miały poprawne SPF/DKIM/DMARC/ARC i MIME oraz zgodny PDF. Porównania wskazują na możliwy wpływ konta/kontekstu nadawcy, bez ustalonej przyczyny ani gwarancji kolejnych dostaw. Dane tymczasowego konta osobistego usunięto; dalsza praca odbywa się wyłącznie z kontem projektu. Historia firm, odpowiedzi i Windows nadal oczekują na rzeczywistą próbę. Szczegóły: TEST_REPORT.md.
