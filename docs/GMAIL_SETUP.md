# Gmail — konfiguracja i bieżące granice

Stan 17 października: istniejące połączenie domowego Windowsa jest skonfigurowane;
wybrano GMAIL_BROWSER, ale sender pozostaje paused i RESEARCH_ONLY nie używa
Gmaila. Dwa osobno zatwierdzone SELF_TEST UI zakończyły się SENT_CONFIRMED;
odbiorcy zgłosili Odebrane i działające CV. Pilot do firm nie wystartował.
Nie ma potrzeby powtarzania OAuth tylko z powodu klonowania/analizy/aktualizacji.
Nadawcę ustala prywatna konfiguracja i świeży podgląd, nie stare opisy kont w repo.

## Środowiska i transporty

- DEVELOPMENT jest osobny, syntetyczny i nie inicjalizuje natywnego Gmaila.
- WORKSTATION wymaga istniejącej historii, lokalnego oznaczenia i Windowsa.
- GMAIL_API tworzy dokładny MIME i jeden POST. GMAIL_BROWSER wykorzystuje
  aktywną sesję przeglądarki Codexa; nadal potrzebuje celowanego API do receipt.
- Zmiana transportu wymaga zatrzymania i braku oczekujących/niepewnych prób;
  unieważnia stare podglądy/politykę, nie uruchamia wysyłki.
- Brak wykonawcy/UI nie wywołuje fallbacku API ani ponowienia send.

Szczegóły: [GMAIL_BROWSER](GMAIL_BROWSER.md), [SECURITY](SECURITY.md).

## Nowe połączenie lub zmiana uprawnień

To oddzielna operacja wymagająca decyzji użytkownika o koncie i zakresie.
Istniejący helper obsługuje klienta OAuth Desktop app, PKCE/state i logowanie
w standardowej przeglądarce. Klient JSON i sekrety pozostają poza repo,
tokeny w lokalnym systemowym magazynie. Nie wpisywać ich do czatu lub raportu.

Zakresy tożsamości i gmail.send/gmail.readonly należy pokazać przed zgodą.
Google readonly pozwala odczytywać całą skrzynkę; ograniczenie do adresów/domen
firm i własnych znanych prób jest kontrolą aplikacji. Poczta nie trafia do modelu.
Nie rozszerzać OAuth w celu obejścia błędu, nie zmieniać konta automatycznie.
Techniczne zmiany testerów/klienta Google Cloud też nie są częścią przeglądu kodu.

## Przed rzeczywistą wysyłką

1. Zweryfikować rzeczywiste konto, zatwierdzone wersje faktów/CV i dokładny PDF.
2. Właściwy kontakt, aktualne źródła, aliasy, historia, odmowy i niepewne próby.
3. Dla osobno zleconego SELF_TEST/pilota przedstawić konkretny podgląd i uzyskać
   zgodę zgodnie z zakresem polecenia użytkownika. Wysłane nie oznacza Odebrane.
4. AUTO_POLICY po konfiguracji i jawnym Start działa bez zgody na każdy zgodny mail.
   Obecna instalacja nie ma uprawnienia do rzeczywistej kampanii do firm.

Nie zgadywać folderu odbiorcy ani resetować kwot. SEND_UNKNOWN/porzucone SENDING
blokują ponowienie. Uzgodnienie sprawdza istniejącą próbę, nie wysyła drugi raz.
Przyczyna Spamu pozostaje nieustalona: [audyt](GMAIL_DELIVERABILITY_AUDIT.md).

[Historyczna instrukcja i przebieg dawnych połączeń](archive/2026-10-17/GMAIL_SETUP.md)
pozostały zachowane; opis innego konta/daty nie zmienia obecnej konfiguracji.
