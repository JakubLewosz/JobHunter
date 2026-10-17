# Dostarczalność — stan wiedzy 17 października 2026

Przyczyna klasyfikacji części wiadomości jako Spam pozostaje nieustalona.
Użytkownik dostarczył wiadomości odebrane u różnych odbiorców; ręczne
wiadomości trafiały do Odebranych, część prób aplikacji do Spamu.
Uwierzytelnienie i poprawny PDF nie gwarantują folderu. Różne konta, odbiorcy,
kolejność oraz historia kontaktu ograniczają wnioski przyczynowe.

16 października dwa osobno autoryzowane SELF_TEST przez Gmail UI uzyskały
SENT_CONFIRMED; użytkownik potwierdził 2/2 Odebrane i otwierane CV.
To dobry wynik małej próby, bez dowodu, że sam Gmail API był przyczyną
Spamu lub że transport UI rozwiązuje problem dla wszystkich odbiorców.
Obecny transport UI nadal używa celowanego odczytu API do potwierdzenia.
Opis wykonawcy: [GMAIL_BROWSER](GMAIL_BROWSER.md).

W obecnej lokalnej historii zachowano 8 prób/outbox/liczników. Wcześniejsze
liczby dotyczą innych etapów/historii; nie wolno ich sumować, resetować lub
przenosić jako bieżącej zgody. Szczegóły prób i EML są prywatne poza Git.

Kolejnym etapem może być osobno zatwierdzony mały pilot do firm, po źródłach,
historii i aktualnych bramkach. Przygotowane szkice nie są zgodą na wysyłkę.
Nie zmieniać generatora stylu, konta, OAuth lub limitów na podstawie hipotezy.

[Pełna wcześniejsza analiza i historia](archive/2026-10-17/GMAIL_DELIVERABILITY_AUDIT.md)
została zachowana. Jej dawne decyzje o koncie i licznikach nie są aktualną
instrukcją operacyjną. Wyniki testów: [TEST_REPORT](TEST_REPORT.md).
