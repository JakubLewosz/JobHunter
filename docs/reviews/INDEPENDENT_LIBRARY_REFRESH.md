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
nieprzedłużany deadline. Celowane 63/63 PASS na Windows/Node24.
Pierwsze regresje przed poprawką i pierwsze celowane 47/48 FAIL pozostają
w prywatnych logach; nie są zastępowane późniejszym wynikiem.

Pełny check oraz ewentualne zastosowanie w zatrzymanej instalacji wymagają
oddzielnego rzeczywistego wyniku. Ten dokument nie udziela prawa wysyłki,
nie rozszerza polityki i nie rozpoczyna przyszłego pilota.
