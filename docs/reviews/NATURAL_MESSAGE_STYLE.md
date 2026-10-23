# Naturalny styl wiadomości — 23 października 2026

Krótki, bezpośredni mail z uprzejmym „Państwo”, jednym powodem kontaktu
i krótkim opisem projektu pozostaje zgodny z dotychczasową kontrolą faktów.
Przy konkretnym powodzie kontaktu projekt można pominąć. Nie ma wymuszonej
kolejności akapitów ani rotacji synonimów. CV jest warunkiem przyszłego
pakietu z zatwierdzonym PDF, nie fikcyjnym faktem o firmie lub kandydacie.

Usunięto pomocniczą heurystykę CLOSING, która odrzucała każdą linię pytania
z określeniem początkującego programisty. Jedno uczciwe pytanie o możliwość
współpracy jest dopuszczalne. Nadal działają REPEATED_REQUEST, sprzedażowe
CTA oraz kontrole technologii, edukacji, doświadczenia, dostępności,
warunków firmy, kontaktu i załącznika. Instrukcje generatora/review nie
zmieniają zatwierdzonego profilu, faktów, CV lub zakresu polityki.

Nowa regresja publicznej ścieżki editDraft → verifyDraft wykazała możliwość
utrwalenia spóźnionego wyniku po Stop. Weryfikator sprawdza teraz generację
operacji, właściciela oraz niezmienność wersji i materiałów po mapowaniu,
po semantycznym review i przed zapisaniem błędu. Nie wymaga aktywnego prawa
wysyłki do samego przygotowania tekstu.

Pierwsze celowane testy: 71/73 PASS; dwie nowe regresje Stop ujawniły błąd.
Po poprawce: 140/140 PASS, zero FAIL/SKIP/cancel. Fikcyjne dane i odbiorcy,
katalogi tymczasowe. Test zachowuje ID, stare wersje i scope już
zakwalifikowanego szkicu AUTO, usuwa stare review i odtwarza claims dla
dokładnego tekstu. Kolejna kontrola nie dokłada identycznej wersji. Brak
projektu jest dozwolony, a zdanie o CV nie zastępuje kontroli PDF i nie
udziela prawa wysyłki. Konflikt wersji, Stop i utrata właściciela blokują
spóźniony zapis zarówno mapowania, jak i review.

Wynik pełnego Windows check i tożsamość finalnej dostawy są zapisane
w TEST_REPORT oraz manifeście paczki. Wynik syntetyczny nie jest testem
poczty, dostarczalności ani zgodą na pilota. Prywatne treści, identyfikatory
i odczyty instalacji pozostają poza Git. Wdrożenie wymaga zatrzymania
i spójnego backupu; przygotowanie kończy się STOPPED, bez Start.
