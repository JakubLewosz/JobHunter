# Granice bezpieczeństwa E2

## Obecnie egzekwowane

- Backend tylko na 127.0.0.1, pojedyncza instancja z blokadą katalogową i identyfikatorem właściciela. Po żywej blokadzie nie zabija cudzego procesu.
- Dokładny Host i Origin; odrzucanie cross-site. Sesja z losowym tokenem uruchomienia, HttpOnly/SameSite=Strict, 12 godzin; CSRF dla mutacji. Brak CORS i tunelu. Link uruchomienia i plik launch.json pozostają lokalne, poza repo.
- Dane SQLite/CV poza repo. Katalogi i pliki mają ograniczone prawa na macOS; Windows ACL/DPAPI nie zostały przetestowane. E2 nie przechowuje żadnych tokenów dostawców.
- Transport poczty jest lokalnym mockiem. Compose MIME używa nodemailer streamTransport, bez SMTP. Odbiorca i nadawca muszą być poprawnymi adresami example.invalid. Nie ma endpointu dowolnej wysyłki ani trybu live.
- Adapter researchu nie pobiera żadnej strony, a MockCodexRunner nie uruchamia modelu/shella. Dostęp do Gmaila nie istnieje. Konta w otwartej przeglądarce nie są używane.
- Walidacja Zod strict, limit długości/tablic, istniejące i zatwierdzone fact IDs, evidence IDs bieżącej firmy; odrzucanie nieznanych pól, CRLF i określonych niepopartych deklaracji. Propozycja nie może zatwierdzić sama siebie.
- Zgoda jest ograniczona do konkretnego hasha i wersji profilu, CV, konta, odbiorcy, treści i polityki. Dispatcher ponownie sprawdza stan w transakcji przed rezerwacją. Żadne operacje HTTP nie zachodzą w transakcji.
- Jedna rezerwacja na outbox, jeden Message-ID/próba, niezmienny MIME, unikalność pierwszego kontaktu. Timeout i porzucone SENDING nie są ponownie kolejkowane.
- React renderuje tekst; brak aktywnego HTML, śledzących obrazków i wykonywania źródeł. Nie pobiera się załączników. Eksport CSV zabezpiecza formuły i cytuje pola.
- Stop/pauza/kill switch i blokady w bazie. Odmowa, wstrzymanie rekrutacji i zwrot blokują kolejne kontakty.

## Ograniczenia i bramki kolejnych etapów

- Lokalna sesja nie chroni przed procesem z pełnym dostępem do konta użytkownika. E2 nie wykazuje izolacji agenta runtime ani produkcyjnego bezpieczeństwa.
- Reguły prawdziwości tekstu są ograniczone; nie rozpoznają każdego możliwego zmyślenia. Wymagany przegląd użytkownika. AUTO_POLICY pozostaje zablokowany.
- Brak fetchera w E2. Ochrona SSRF/DNS rebinding i sanitizacja publicznych źródeł muszą zostać zaimplementowane oraz przetestowane przed E3. Nie udaje się ich działających na podstawie braku dostępu do sieci w mocku.
- Gmail/OAuth, Credential Manager/DPAPI, ograniczony import historii i zewnętrzna klasyfikacja korespondencji niezaimplementowane. Gmail readonly to szeroki zakres konta, który trzeba wyjaśnić użytkownikowi w E4.
- E2 nie oferuje backupu/retencji. Nie kopiuj pojedynczego pliku aktywnego SQLite/WAL; przyszły backup powinien używać API SQLite. Raporty nie są pełną kopią bazy.
- Windows i ograniczenia uprawnień runtime pozostają niezweryfikowane. Testy na macOS tego nie zastępują.
- Kwoty są konserwatywne: także jednoznacznie nieudane próby pozostają w ledgerze. Sam restart, zmiana konfiguracji ani daty nie usuwa historii rezerwacji.
