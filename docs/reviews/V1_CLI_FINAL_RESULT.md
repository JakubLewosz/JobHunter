# Wynik kontynuacji V1 — 29.10.2026

**NOT_PRODUCTION_VERIFIED.** Nowy R1 zaliczony, R2 zakończony trzema
potwierdzonymi nadaniami, R3 zatrzymany przez pierwotny koniec zgody przed
pierwszą próbą. WORKSTATION **STOPPED**, operacje zakończone, bez ownera
i prawa nadawania. Nie uruchamiać Gmaila ani pozostałej partii na wygasłej zgodzie.

## Tożsamość i bramki

- Kod aplikacji: `ca5bd42df8b6addb8048e4906cfdbbc215c10cb8`.
- Build: `90e528ed-9018-442d-8e06-e71484443bb6`.
- sourceTreeHash: `212d4c620514d59c1591f008039a1ba88535efabcd6d43c4e1051430f2b96405`.
- loadedCodeHash: `7f15d7d0a567ef90aed986e3f7c5e2d123ec2721f2c81460bb83d120427ae017`.
- Domowy Windows/Node24.19.0, pełny `npm run check`: 1042/1042 backend,
  12/12 serial Stop, 26/26 UI, typecheck/build PASS. 28.10 19:28:41–19:42:28 UTC.
- [CI40754519704](https://github.com/JakubLewosz/JobHunter/actions/runs/40754519704),
  attempt1 SUCCESS, dokładny SHA kodu. Późniejsze commity dokumentacyjne
  nie są nowym przebadanym buildem; nie przebudowywano aplikacji po nich.
- Świeży rzeczywisty CUA na fikcyjnej stronie: A/C dwie fikcyjne akcje,
  B STALE_EVIDENCE; drugi przebieg tej samej historii 0 nowych akcji, cleanup PASS.
- Stop, spójny backup SQLite z WAL, odtworzenie 62 tabel, doctor i rzeczywista
  zgodność załadowanego kodu PASS. To samo wydanie we wszystkich nowych fazach.

Pierwsze niepowodzenia testów zachowano: synchronizacja nowego testu inspect,
wrapper PowerShell5 przerwany na ostrzeżeniu przed UI oraz 1040/1041 po
nieuzasadnionym założeniu fixture o bootstrapie w 350ms. Korekta testu wynikała
z kontrolowanej reprodukcji, bez zmiany 120s aplikacji lub progów Stop.

## CLI: rozstrzygnięcie ograniczone dowodami

Trzy dawne wywołania 1f41b55 zakończyły się przy lokalnym 120s. Brakowało
zdarzeń sprzed timeoutu; nie można wskazać ich przyczyny. Nie dowodzą awarii
dostawcy, limitu konta lub wadliwego modelu. Nowe obserwacje nie odtworzyły
problemu: 8 reprezentatywnych wywołań macierzy i 2 natywne deployment probes
zakończone normalnie, wykorzystanie 10/12 diagnostycznych wywołań tej rundy.
R1 i fazy odbioru są osobną pracą natywną. Nie wykonywano losowych powtórek,
próby 300s, zmiany konta, effort, modelu, CLI lub poszerzenia izolacji.

Dodano bezpieczne metadane lifecycle/JSONL i wczesne wykrywanie niedozwolonych
narzędzi. Timeout nadal120000ms, bez odnawiania stdout; turn.completed bez
normalnego close nadal nie zalicza wywołania. Wyeliminowano wykazane błędy
parsera adresów historii (Nodemailer10.1.4) i nadmiernych issues kolekcji
(Zod4.6.6). Nie wykazano ich związku z dawnymi timeoutami. Nadal dwa alerty
npm: moderate fast-uri i low Fastify, z oceną osiągalności. Nie jest audit clean.
[Szczegółowe pomiary i zakres](V1_CLI_DIAGNOSIS.md).

## Rzeczywiste fazy

| Faza | Wynik | Sprawdzone / partia | Próby / potwierdzone / niepewne |
|---|---|---|---|
| R1 | PASS, 3611s, DEADLINE | Biblioteka12/12, następnie4 cykle discovery | 0 / 0 / 0 |
| R2 | COMPLETED po dwóch jawnych natywnych Resume tego samego joba i partii | Odnowione3, sprawdzone3, partia3 | 3 / 3 / 0 |
| R3 | STOPPED / EXECUTION_DEADLINE | Odnowione2, sprawdzone2, partia2, pozostałe2 | 0 / 0 / 0 |

R1 28.10 19:54:15–20:54:26 UTC: 47/47 wywołań modelu OK
(EXTRACT26, SEMANTIC_REVIEW13, SEARCH4, DRAFT4), maksimum37431ms.
Raport zachował 18 błędów pozycji i 21 błędów źródeł, w tym odrzucony
UNVERIFIED_QUOTE. Nowe9firm/4szkice nie poszerzyły odbiorców. Końcowy guard,
chronione dane/poczta, backup i cleanup PASS. Cały R1 bez Gmaila.

R2 zachował odnowienie→kwalifikację→partię→historię→próbę→potwierdzenie,
bez ręcznych wysyłek lub napraw SQLite. Dwie przerwy operatora pomiędzy
segmentami CUA spowodowały BROWSER_HOST_LOST: pierwsza przed próbami, druga
po jednym SENT_CONFIRMED. To błąd obsługi aktywnego wykonania po stronie
agenta; nie przypisujemy go CLI. Oba Stop/cleanup i stany historii sprawdzono
przed Resume. Nie wznowiono nieznanego działania. Natywne Resume zachowały
job, zamkniętą partię, wcześniejsze potwierdzenie, limity i absolutny koniec;
nie ponowiono nadania do już wysłanego odbiorcy. Po powrocie do ciągłej obsługi
końcowy host R2 miał leaseValid=true, maxHeartbeatGap30232ms; R3 true/25815ms.
Lease nie zwiększano.

Trzy nowe potwierdzenia — po jednej wiadomości na dopuszczoną firmę.
Odbiorcy, dokładne czasy i własne finalne teksty pozostają w prywatnych dowodach.
Odstępy ACK→następny grant: 1028778ms i 618872ms, oba≥600s.
Natywna historia celowana COMPLETE dla tych trzech, konto/From/Reply-To
sprawdzone; wyłącznie Computer Use/GMAIL_BROWSER. Zatwierdzony PDF, jego hash,
nadawca i teksty zamrożonych preview zgodne w końcowym lokalnym audycie.

R3 pozostał GENERAL/COMPANY_INQUIRY. Obydwa teksty zachowano, utworzono nowe
wersje/mapowania i partię. Pierwszy natywny termin nadania: 11:14:01 Warsaw,
po pierwotnym końcu zgody **29.10 11:06:39.233 Warsaw**. Zatrzymanie nastąpiło
z EXECUTION_DEADLINE; 0 prób, historia celowana dla R3 nie została wykonana.
Jej stare ERROR nie oznaczają pustej historii. Nie oznaczamy pozostałych
pozycji jako wysłanych lub definitywnie nieodpowiednich. Gmail zamknięto;
po wygaśnięciu wykonywano tylko lokalne prace techniczne.

Oczekiwanie na okno nie uruchomiło działań o08:00: wywołanie oczekiwania
zostało przerwane, a bieżąca rozmowa wróciła do pracy o10:12 Warsaw.
Nie deklarujemy automatycznego wakeup. Dalszy czas zużyły opisane dwa
zatrzymania hosta i ponowne początkowe oczekiwanie natywnego sendera.
Nie skracano tempa, nie zmieniano maxItems, kryteriów ani terminu dla PASS.

## Ochrona i granica wyniku

Wspólny limit zadania: 3/5 prób, 3 potwierdzenia, 0 SELF_TEST, 0 niepewnych,
0 poza zakresem, 0 duplikatów. Oryginalne11 prób/outbox/usage i530 wersji
szkiców zachowane, profil/fakty/portfolio/CV, historia/shared i trwała granica
kampanii bez zmian. HOLD AtomStore trwały USER_HOLD_APPLICATION_REQUIREMENT.
BizCode/Tukano/Devise oraz nowe trzy wysłane firmy blokuje natywna deduplikacja.
Końcowy spójny backup: zgodne wszystkie tabele, integralnośćok/FK0.

Rzeczywiste nadawanie i nowy R1 zostały wykazane; pełny odbiór V1 nie został
spełniony, bo R3 nie ukończył rzeczywistego nadawania w tej samej zgodzie.
Potwierdzenie własnej wiadomości w Wysłanych nie dowodzi Inbox ani
zainteresowania firmy. Pozostałe dwa kontakty wymagają nowej świadomej decyzji
użytkownika; żadne prawo lub niewykorzystany limit nie odnawia się samo.
[Jedna instrukcja obsługi](../CODEX_OPERATION.md).
