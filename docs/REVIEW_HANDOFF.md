# JobHunter — materiał do weryfikacji i planowania

Stan na 9 października 2026. Celem przeglądu jest niezależna ocena aktualnego kodu i wybór kolejnych kroków. Dokumentacja opisuje również wcześniejsze etapy; stare wyniki testów i konfiguracje nie są bieżącym stanem.

## Od czego zacząć

1. [README](../README.md) — uruchomienie, tryby i ograniczenia.
2. [AGENTS](../AGENTS.md) i [specyfikacja](../JobHunter_SPEC.md) — wymagania oraz granice uprawnień.
3. [TASKS](TASKS.md), [CAPABILITY_REPORT](CAPABILITY_REPORT.md), początek [TEST_REPORT](TEST_REPORT.md) — aktualne zadania, możliwości i ostatnia weryfikacja.
4. [Wizja projektu](WIZJA_PROJEKTU.md) i [styl wiadomości](MESSAGE_STYLE.md) — docelowy produkt i zaakceptowany sposób pisania.
5. [Audyt dostarczalności](GMAIL_DELIVERABILITY_AUDIT.md) — obserwacje, rzeczywiste źródła, ograniczenia i nierozstrzygnięte hipotezy.

## Aktualny stan

- DEMO używa fikcyjnych danych. RESEARCH_ONLY szuka firm i przygotowuje szkice, bez wysyłki. APPROVAL_REQUIRED ma Gmail, dokładny podgląd z CV, zamrożony MIME/hash, osobną zgodę, limity, pojedynczy send i reconcile. AUTO_POLICY zablokowany.
- W lokalnym runtime wybrane starsze konto pozostaje bieżącym nadawcą na decyzję użytkownika. Sender i automatyczny research zatrzymane, aktywna kolejka pusta. Nie należy automatycznie zmieniać konta lub wznawiać pracy.
- Historia zawiera 19 zleconych prób SELF_TEST/rezerwacji, bez kontaktowania firm. SENT_CONFIRMED dotyczy Wysłanych nadawcy, nie folderu odbiorcy. W ostatniej serii użytkownik zgłosił 5/5 Odebrane starszego konta i 3/3 Spam projektu; sam wiek konta nie został wyizolowany jako przyczyna.
- Obecny generator MIME przechodzi testy polskich i długich tematów. Fragment Subject o długości 84 wystąpił po przetworzeniu przez Google również w wiadomościach zgłoszonych jako Odebrane. Brak dowodu, że zmiana generatora naprawi Spam.
- Reconcile po utracie odpowiedzi i zmianie RFC Message-ID wskazuje ograniczonych kandydatów z pełnego RAW. Sama identyczna treść nie wystarcza do potwierdzenia próby; ręczna wiadomość może być identyczna. Niepewność zachowuje SEND_UNKNOWN, bez ponownego send.
- Najnowsza poprawka zachowuje blokadę znanego kontaktu z firmą przy zmianie konta nadawcy; odpowiedzi przypisane do SELF_TEST są wyłączone. Regresja najpierw odtworzyła błąd, po poprawce PASS. Bez migracji i zmian prywatnej SQLite.
- Dwa dawne SEMANTIC_REVIEW_FAILED nastąpiły po poprawnych strukturalnie odpowiedziach modelu. Odrzucone szkice i issues nie zostały zachowane; konkretnej przyczyny nie da się odzyskać. Obecny kod już zapisuje false/null jako NEEDS_REVIEW, a wysyłka wymaga supported=true. Nie odtwarzano starych danych ani nie ponawiano prób.
- Roboczy przegląd dwóch istniejących szkiców i świeżych publicznych źródeł przygotowano prywatnie. Kontakty GENERAL nadal NEEDS_REVIEW; nie powstała zatwierdzona paczka do wysyłki. W runtime nie przeprowadzono jeszcze celowanych kontroli historii firm.

## Weryfikacja

Ostatnie pełne, rzeczywiście wykonane `npm run check`: **206/206 backend, 6/6 UI**, typecheck/build PASS, macOS / Node 24.11.0. `git diff --check` PASS. Testy używają mocków i katalogów tymczasowych; ich przejście nie dowodzi dostarczalności lub działania rzeczywistej historii firm. Windows smoke niewykonany. Przy przygotowaniu tej publikacji nie zmieniano ponownie kodu/testów i nie powtarzano pełnego check.

## Proponowana kolejność do oceny

1. Domknąć jawny przegląd kontaktu ogólnego w backendzie i UI. Zachować źródło/aktualność, rzeczywiste GENERAL oraz odrębną zgodę na dokładny MIME. Sam publiczny adres nie potwierdza naboru. Obecnie brak operacji użytkownika rozstrzygającej ten stan.
2. Sprawdzić celowaną historię dwóch wybranych firm na bieżącym koncie, z konkretną i ważną zgodą użytkownika. Błąd/limit/paginacja nie mogą oznaczać pustej historii; zachować blokady między kontami i kampaniami.
3. Po aktualizacji dowodów i kontroli treści przygotować małą paczkę do osobnego zatwierdzenia. Rozwój aplikacji, ten dokument i push nie upoważniają do rzeczywistej wysyłki.
4. Dopiero po rzeczywistej próbie procesu ocenić dalszy research, odpowiedzi, przenoszenie prywatnego stanu i Windows. Dostarczalność nadal oceniać oddzielnie od poprawności MIME i potwierdzenia Wysłanych.

Przegląd powinien wskazać konkretne luki z plikami/liniami i testami, rozróżnić wymagania już wdrożone od brakujących oraz zaproponować małe etapy z kryteriami odbioru. Nie budować planu na z góry przyjętej diagnozie Spamu.

## Czego GitHub nie zawiera

Prywatnej SQLite, tokenów/OAuth, CV/PDF, oryginalnych EML/RAW, adresów odbiorców testowych i lokalnych podglądów. Kod, syntetyczne testy i opis obserwacji są w repo; pełne źródła historycznych wiadomości pozostają lokalnie. Brak prywatnych materiałów w checkout nie upoważnia do ich odtwarzania lub uznania niezweryfikowanych faktów za zatwierdzone. Nie resetować liczników, nie wysyłać wiadomości ani nie uruchamiać kampanii w celu weryfikacji kodu.
