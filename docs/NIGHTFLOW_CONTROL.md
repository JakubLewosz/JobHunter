# Nightflow Stop/status/report — kontrakt R14, 21.10.2026

Te komendy sterują istniejącym właścicielem. Nie otwierają Store, migratora,
workera ani nowego sendera. Nie są zgodą na Start lub aktualizację instalacji.

| Polecenie | Potwierdzona odpowiedź | Brak wiarygodnej odpowiedzi |
| --- | --- | --- |
| `stop` | exit 0, `source=LIVE_OWNER`, `stop.acknowledgement=AUTHORITY_REVOKED`, `current.authority=false` | exit 1, stderr `STOP_UNCONFIRMED`, przyczyna `CONTROL_*`, pusty stdout; bieżący właściciel i uprawnienie UNKNOWN |
| `status` | exit 0, `source=LIVE_OWNER`, `current` opisuje odpowiedź właściciela | exit 1, stderr `STATUS_UNAVAILABLE`, `CONTROL_*`, pusty stdout; brak wnioskowania o utracie właściciela |
| `report` | odpowiedź `LIVE_OWNER` | udany readonly daje exit 0 i `PERSISTED_SNAPSHOT`; brak/uszkodzenie raportu daje exit 1 `REPORT_UNAVAILABLE` |

`LIVE_OWNER` zawiera `observedAt`, `target={instanceId,jobId,generation}` oraz
`current`. Instancja to istniejący identyfikator backendu browser brokera;
job i generacja pochodzą z żywego koordynatora. Klient przypina deskryptor.
Przed Stop wykonuje celowany odczyt zakresu, potem serwer porównuje dokładny
zakres przed odwołaniem. Odpowiedź wiąże również requestId i operację.
Zmiana instancji, zadania, generacji, deskryptora lub błędna odpowiedź nie
przekierowuje Stop do nowej sesji. Nie ma retry mutacji lub sendera.

ACK potwierdza odwołanie prawa tej generacji. `stop.operations=MAY_BE_IN_FLIGHT`
i `stop.maintenanceReady=false` pozostają jawne: ACK nie cofa wcześniejszego
POST/kliknięcia, nie potwierdza zakończenia operacji ani zamknięcia backendu.
Stop nadal odwołuje prawo w pamięci przed zawodnymi zapisami. Gdy zapis lub
odpowiedź zawiedzie, polecenie może być już wykonane; wynik jest niepotwierdzony,
a nie „Stop nie został wykonany”. Nie wolno uznać UNKNOWN za potwierdzone false.

Offline przykład (historyczne SENDING nie zmienia się w STOPPED):

```json
{
  "source": "PERSISTED_SNAPSHOT",
  "readAt": "2026-10-21T08:00:00.000Z",
  "current": {"state":"UNKNOWN","authority":"UNKNOWN","owner":"UNKNOWN"},
  "snapshot": {
    "jobId":"synthetic-job",
    "state":"SENDING",
    "persistedAt":"2026-10-21T07:59:00.000Z"
  }
}
```

Przykład pomija pozostałe metadane snapshotu. `snapshot=null` oznacza brak
zapisanego zadania. Brak dawnego czasu zapisu daje `persistedAt=null`.
Historyczne STOPPED/COMPLETED też są wyłącznie zapisami, bez dowodu stanu
innego lub nowego procesu. SQLite jest odczytywane readonly w transakcji;
odczyt nie ustawia OWNER_LOST ani nowego uprawnienia i nie zmienia rekordów.

Codex powinien przekazywać użytkownikowi niepotwierdzony wynik bez deklaracji
zatrzymania. Przy niedostępności sterowania trzeba zachować niepewność;
nie zabijać nieustalonego procesu, usuwać jego locka lub zmieniać deskryptora.
Przed aktualizacją potrzebne są potwierdzone Stop, koniec operacji i zamknięcie
backendu, potem spójny backup i świadomie wybrana wersja/build/doctor/Start.

Regresje: `tests/nightflow-control-failures.test.ts`, `tests/nightflow.test.ts`.
Obejmują prawdziwe lokalne IPC i asynchroniczne CLI, odrzucenie poświadczenia,
brak/stary/zmieniony deskryptor, stare zadanie/generację, timeout przed/po
odwołaniu, uszkodzone ACK, aktywny/terminalny/pusty raport, błędną bazę,
rzeczywisty koordynator z fikcyjnym transportem i błąd zapisu po odwołaniu.

Nadzór testowego CLI ma osobny kontrakt: 30 s deadline i 2 s na łagodne
anulowanie. ENTRY potwierdza gotowość listenera; CANCEL_RECEIVED potwierdza
odbiór. Inicjalizacja fixture sprawdza sygnał także między etapami setupu.
Po wymuszonym zakończeniu Windows nie wykonuje finally, więc pozostawiona
blokada nie dowodzi aktywnego procesu ani poprawnego cleanup. Nadzorca jej
nie usuwa. Istniejące acquireProfileLock odzyskuje ją dopiero po ESRCH;
żywy lub niepewny właściciel nadal blokuje otwarcie. To mechanizm wyłącznie
lokalnego nadzoru fixture, bez zastępowania potwierdzonego Stop prawdziwej sesji.
