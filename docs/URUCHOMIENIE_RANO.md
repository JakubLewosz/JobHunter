# Uruchomienie i aktualizacja — jeden domowy Windows

Stan 17 października: instalacja jest skonfigurowana; główna historia,
zatwierdzone materiały i konto są poza Git. Research i sender zatrzymane,
pozostaje PAUSED checkpoint ostatniej sesji. Przed kolejnym długim startem
rozwiązać [znane problemy](KNOWN_ISSUES.md); nie wznawiać go automatycznie.

## Analiza lub development w nowym klonie

```powershell
npm ci
npm run check
npm run doctor
npm start
# drugi terminal, opcjonalnie:
npm run open
```

Domyślnie DEVELOPMENT/DEMO z osobną syntetyczną bazą. Nie wskazywać prywatnego
katalogu jako development, nie kopiować markerów, OAuth, CV lub bazy do repo.
Nie uruchamiać smoke:public/Gmaila w ramach zwykłego przeglądu.

## Aktualizacja istniejącej instalacji roboczej

1. Stop, poczekać na zakończenie operacji i zwolnienie właściciela profilu.
   Nie zmieniać kodu, dependencies lub builda pod aktywnym senderem.
2. Zweryfikować oryginalną historię i utworzyć spójny backup przez helper
   SQLite, obejmujący WAL. Samego aktywnego pliku .sqlite nie kopiować.
3. Wybrać sprawdzoną wersję kodu, zainstalować dependencies, wykonać build/check/
   doctor zgodnie z zakresem aktualizacji. Nie resetować historii lub kwot.
4. Uruchomić backend w świadomie wybranym trybie, ale pozostawić sesję zatrzymaną.
   WORKSTATION nie nadaje prawa do researchu lub wysyłki.
5. Dopiero osobne zlecenie/Start uruchamia właściwy zakres. Restart nie wznawia.

Dla istniejącej historii dostępne są `npm run history:local -- doctor KATALOG`
i `npm run history:local -- backup KATALOG`; nie inicjalizują nowej kampanii.
Nie powtarzać configure ani initialize jako rutynowego kroku aktualizacji.

## Świadomie zlecony RESEARCH_ONLY

Istniejący Windows i właściwa historia, bez aktywnego procesu: tryb
RESEARCH_ONLY, reader/search preflight z system CA, już zatwierdzone fakty/CV,
konkretny czas/zakres, pierwotny deadline i raport. Nie inicjalizować Gmaila,
transportu browser lub sendera tylko dlatego, że wybrano go wcześniej.
Natywne sesje: 1–24 h; długie co 15 min, do 10 propozycji i 5 szkiców/cykl.
Pauza/Stop/limit/awaria nie upoważnia do samoczynnego wznowienia.

Raportowanie bez backendu i migracji:

```powershell
npm run research:report -- "C:\prywatny-katalog\jobhunter.sqlite" "C:\prywatny-raport"
# Opcjonalny końcowy wynik kontrolera tej samej sesji:
npm run research:report -- "C:\prywatny-katalog\jobhunter.sqlite" "C:\prywatny-raport" --controller-result "C:\prywatny-katalog\result.json"
```

STOPPED jest stanem, nie automatyczną diagnozą sieci. generatedAt odróżniać
od finishedAt oraz czasu oceny źródeł. Sam kontaktUrl nie jest kwalifikacją.
Prywatny raport zapisuje się poza repo. Pełny kontekst: [REVIEW_HANDOFF](REVIEW_HANDOFF.md).

## Gmail i automatyzacja

Gmail pozostaje wyłączony podczas RESEARCH_ONLY. SELF_TEST/pilot do firm
wymagają osobnego zlecenia. AUTO_POLICY po zatwierdzonej polityce i Start
nie wymaga akceptacji każdego zgodnego maila. Przeglądarkowy wykonawca
wymaga aktywnego Codexa; nie ma autostartu lub fallbacku po niepewnej próbie.
Odpowiedzi obsługuje użytkownik. Nie zmieniać konta lub OAuth bez decyzji.

Komputer/sieć/proces muszą działać; nie zmieniać zasilania, zapory lub ustawień
uśpienia automatycznie. Zamknięcie karty panelu nie zatrzymuje backendu.
Push kodu nie jest deploymentem, nie zmienia bazy ani nie uruchamia sesji.

[Pełne wcześniejsze procedury A/B/C i ich historyczne założenia](archive/2026-10-17/URUCHOMIENIE_RANO.md)
pozostały zachowane. Nie są poleceniem ponownego tworzenia historii.
