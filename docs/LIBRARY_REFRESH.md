# Odnowienie istniejących szkiców bez poczty

`npm run research:refresh -- --data-dir PROFIL --ids-file PLIK --minutes 60 --workstation`

PROFIL to istniejący katalog `research-only` pod lokalnym znacznikiem WORKSTATION.
PLIK to prywatna tablica JSON istniejących ID szkiców. Brak historii, zatwierdzonego
profilu/PDF, aktywny lub PAUSED cykl i konflikt właściciela blokują operację.
Przed migracją obowiązuje spójny backup i próba odtworzenia. Ta komenda nie
wybiera materiałów ani nie interpretuje propozycji jako zgody użytkownika.

Punkt wejścia używa wyłącznie ResearchJobHunter.refreshLibraryDrafts, po jednym
ID na wywołanie (natywne API dopuszcza do dziesięciu). Nie inicjalizuje Gmaila,
transportu, workera wysyłki ani koordynatora nightflow. Zachowuje istniejący tryb
i politykę przyszłej kampanii. Discovery i dalsza wysyłka nie są etapami tej komendy.

Blokada profilu, chronione snapshoty i dokładne bajty zatwierdzonych CV są
sprawdzane przed i po pracy. Stare wersje oraz wszystkie tabele pocztowe pozostają
chronione. Nie ma odnowienia deadline po błędzie. Czas 0 < minutes <= 60 jest
jednym budżetem operacji; zapis raportu i cleanup mają osobne znaczniki czasu.

`stop` w stdin lub SIGINT/SIGTERM przerywa własną operację przez publiczne Stop.
Komenda czeka na zakończenie, zamyka Store i zwalnia własny lock. Nie usuwa blokady
obcego właściciela i nie przyznaje prawa wysyłki. Niepewny wynik procesu wymaga
odczytu tego samego raportu i sprawdzenia właściciela, bez ponownego uruchamiania.

Prywatny raport `reports/library-refresh-<operationId>.private.json` jest zapisywany
po każdym zwróconym wyniku. `unreturnedBatch` oznacza przerwaną pozycję, nie sukces.
Zachowane pending invalidation nadal blokuje dawny PASS. Lista wyników zawiera
rzeczywiste kody kontroli, wersje i sameText; COMPLETED oznacza zakończenie zakresu,
nie gotowość wszystkich pozycji do wysyłki. Kolejny zakres powinien pomijać już
ukończone odnowienia i zachowywać kolejność niezakończonej kolejki.

Przed późniejszym pilotem pozostają osobno zatwierdzone: odbiorcy i wiadomości,
PDF, rzeczywisty nadawca, celowana kontrola poczty oraz tempo/limity/okno i Start.
Nie wykonywano tych czynności przez uruchomienie tej komendy.
