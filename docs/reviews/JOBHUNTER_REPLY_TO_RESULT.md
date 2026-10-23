# Reply-To — zakres zmiany, 23.10.2026

Baza: 22b540007696d6a1650f5f6d441dfc3bac2fc031. Zachowano istniejący model
jednego konta, browser-only, R1–R15, Node24 owner / lekki adapter oraz historię.

Dodano GET dokładnego Send-As z projekcją pięciu potrzebnych pól. Istniejące
gmail.readonly jest wystarczające według kontraktu Google; nie dodano scope,
zapisu ustawień, API send, SMTP lub fallbacku. Główny/domyslny adres i tożsamość
muszą odpowiadać prywatnej polityce. Opcjonalne puste/pominięte replyToAddress
w poprawnym zasobie oznacza potwierdzony brak nagłówka, a nie brak dowodu.
Błąd, niepełny zasób, obcy/niezweryfikowany adres lub sprzeczność UI blokują.

Native IPC odczytuje ustawienia przy autoryzacji i ponownie przed akcją.
Dowód w pamięci wiąże konto/subject, rewizję, backend, zakres/generację,
próbę/payload i composeId. Nie jest odtwarzany po restarcie ani przyjmowany
z raportu/od klienta. Zmiana dowodu blokuje nawet przejście między dwiema
bezpiecznymi wartościami. Stare synchroniczne wejścia native nie omijają
odczytu. Stop/anulowanie, utrata lease i zmiana operacji są sprawdzane po
await. Dowód wygasa po 5 s, także podczas końcowej obserwacji UI. Nie ma
atomowej blokady zmian w zewnętrznym Gmailu między odczytem i kliknięciem.

Nowe regresje obejmują NONE, zgodny/obcy Reply-To, brak pól/statusów, tożsamość,
API failure, zmianę konta/ustawień/rewizji, sprzeczność UI, expiry, Stop/cancel,
brak obejścia native, jeden click grant i odczyt przez prawdziwy fixture IPC.
Pierwsze 45/46 miało jeden błąd nowego testu (niewłaściwy workerId/BROWSER_BUSY);
po poprawie fixture: 46/46 PASS. Nie osłabiono produkcyjnej kontroli lease.
Pełny Windows npm run check oraz CI dokładnego SHA są w logach i metadanych
dostawy. Nie powtarzano testu 8 h, nie zmieniając lifecycle hosta.

Rzeczywisty odczyt konta i prywatny podgląd trzech istniejących kandydatów są
lokalnie poza GitHubem/ZIP-em. Nie utworzono partii, zgody, rezerwacji lub
wiadomości. Aktualne źródła publiczne nie są dowodem pustej historii poczty.
Pilot wymaga osobnej zgody na celowaną historię, dokładne materiały i warunki
wykonania oraz świadomego Start. Zatrzymanie nie jest znoszone przez odczyt.

[Kontrakt sendAs.get](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs/get),
[pola SendAs](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs),
[obsługa i granice](../SINGLE_ACCOUNT.md).
