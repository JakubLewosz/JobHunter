# Samodzielne odnowienie biblioteki bez wysyłki

23.10.2026. Wąskie wejście `runLibraryRefresh` zachowuje zapisany tryb
instalacji i politykę. Instancja researchu ma odrębną możliwość pracy
badawczej: nie tworzy zakresów AUTO dla odnawianych szkiców i nie
inicjalizuje usług Gmaila, listenera, harmonogramu ani sendera.

Istniejące szkice objęte zakresem AUTO oraz dodatkowe jawne wykluczenia
są chronione wraz z tekstami, wersjami, materiałami, kontaktami i źródłami.
Współdzielone źródło wyklucza pozycję z zapisu; przekierowanie na takie
źródło przerywa operację przed zapisem. Dotychczasowe kontrole historii,
profilu, CV i polityki pozostają aktywne.

Po zakończeniu własnego cyklu z jednoznacznym lokalnym błędem danych
odnowienie zapisuje PARTIAL i odłożenie, zachowując błąd, próby oraz
checkpoint. Rozliczenie wymaga dokładnego runId utworzonego przez tę
operację, braku aktywnego odczytu/modelu i braku obcego aktywnego cyklu.
Nie używa zbiorczego `finishPartial`. Nie nadaje błędnemu materiałowi PASS.
Stop, deadline, utrata właściciela, zmiana materiałów/polityki/wersji,
nieznany błąd oraz awaria dostawcy blokują kontynuację.

Checkpoint plikowy jest zastępowany atomowo. Opcjonalny bezwzględny
deadline ogranicza budżet bloku (maksymalnie 60 minut), nigdy go nie
przedłuża. Utrata właściciela nie pozwala usuwać cudzej blokady lub
zapisywać zakończenia w jego bazie.

Regresje syntetyczne: stan AUTO z wąskim wcześniejszym zakresem, nowe
generacje dawnych szkiców bez zakresu, A → odrzucone B → C, ochrona
wykluczeń i przekierowania, zmiany profilu/polityki/wersji podczas await,
obcy PAUSED, utrata właściciela, Stop, limit dostawcy, nieznany błąd,
nieprzedłużany deadline. Celowane 64/64 PASS na Windows/Node24, w tym
identyczność wszystkich tabel po utracie właściciela podczas review.
Pierwsze regresje przed poprawką i pierwsze celowane 47/48 FAIL pozostają
w prywatnych logach; nie są zastępowane późniejszym wynikiem. Pierwszy
nieukończony pełny check przerwano przed dodaniem ostatniej ochrony zapisu
błędu review po utracie właściciela; nie jest wynikiem PASS ani ukończonym FAIL.

Pełny check oraz ewentualne zastosowanie w zatrzymanej instalacji wymagają
oddzielnego rzeczywistego wyniku. Ten dokument nie udziela prawa wysyłki,
nie rozszerza polityki i nie rozpoczyna przyszłego pilota.

## Kontekst dostępności w nowych analizach

W rzeczywistych odczytach wykryto domyślną etykietę pory dnia w instrukcji
ekstrakcji, mimo zatwierdzonego profilu bez pór dnia. Po zakończeniu własnego
bloku, potwierdzeniu STOPPED i osobnym spójnym backupie zmieniono wyłącznie
instrukcję analizy: pory kandydata pochodzą z aktualnego faktu availability;
literalne ograniczenia firmy pozostają w dowodach. Nie zmieniono profilu,
treści istniejących analiz, szkiców ani polityki nadawania. Wewnętrzny marker
cache analizy ma wersję 9, aby przyszła kwalifikacja nie odziedziczyła dawnej
instrukcji. To inna oś wersjonowania niż zatwierdzona polityka wysyłkowa.

Trzy nowe regresje obejmują brak pór dnia, jawnie zatwierdzone pory oraz
zachowanie godzin wymaganych w źródle. Przed poprawką 0/3, po poprawce
celowane 67/67 PASS. Pełny check dokładnego nowego kodu jest osobnym wynikiem;
badawcze zapisy czekają na jego zakończenie. Nie zwiększono limitów parsera.

Regresja osobnego zapytania badawczego z GENERAL odtwarza też niedopasowaną
ofertę ACTIVE przy trwałym AUTO_POLICY: oferta pozostaje REJECTED, ale
udokumentowane niezależne zapytanie korzysta z możliwości researchu, a nie
literalnej nazwy trybu. Nie przyjmuje zakresu pilota ani prawa nadawania.
Przed tą korektą test zwracał DRAFT_MATERIAL_STALE; pierwszy fixture miał
oddzielny błąd schematu (INVALID_MODEL_RESULT), zachowany w logu. Nieukończony
check poprawki godzin przerwano przed tą uzupełniającą zmianą; nie jest PASS.
