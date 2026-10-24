# Utrzymanie Computer Use — 24 października 2026

Baza: `3803a612f425852b7d720e80979c236f5559ba27`. Windows / Node24.
Przerwa między wywołaniami ręcznego kontrolera przekraczała 45 s. Regresja
odtwarza to na prawdziwym brokerze IPC z fikcyjnym zegarem; lease nadal
wygasa i nie jest naprawiany przez ponowne przejęcie sesji.

Nowy `BrowserBatchTask.run()` wykonuje jedną ciągłą, oczekiwaną operację w aktywnym runtime
Computer Use. Odczyt postępu nie zatrzymuje pętli. Każdy odcinek sprawdza
rzeczywistą kartę przed IPC, a istniejący kontroler zachowuje scope i bramki
UI. Termin jest zamrożony. Nie zmieniono brokera, progu 45 s, AUTO discovery,
polityki, limitów, deduplikacji, SEND_UNKNOWN, historii lub transportu.
Abort zatrzymuje również heartbeat oczekującej akcji; brak automatycznego
Startu, nowego klienta, fallbacku lub ponownego kliknięcia.

Pierwszy typecheck wykrył użycie `Promise.withResolvers` poza docelowym ES2023. Zastąpiono je
zwykłym konstruktorem Promise, bez zmiany targetu lub zależności. Pierwsze
14 nowych regresji PASS. Zestaw celowany w pierwszej wersji: 57/57 PASS.
Nie przypisujemy tego wyniku całemu końcowemu diffowi.

Pierwsze dwie próby rzeczywistego hosta bez oczekiwania na cały przebieg
zakończyły się po około 1–2 s. Potwierdzono ograniczenie `cua_repl`: po
powrocie wywołania narzędzia dalszy odczyt karty z odłączonej obietnicy daje
brak aktywnego kontekstu wykonania. Obie próby zachowały zero Start/prób/
rezerwacji i release. Zmieniono publiczne wejście na oczekiwane `run()`;
nie próbowano omijać kontroli kontekstu lub zastępować jej heartbeat'em IPC.
Przy native COMPLETED zmiana zakresu może wyprzedzić następny odczyt IPC:
kontroler zwraca wtedy terminalne STOPPED/BROWSER_SESSION_CHANGED. Regresja
akceptuje wyłącznie te dwa bezpieczne zakończenia i sprawdza release.

Rzeczywisty test używa osobnej tymczasowej SQLite, loopback HTTP i fikcyjnego
kontekstu brokera. Brak Startu i AUTO sessions/batches, pakietów, rezerwacji,
akcji Wyślij oraz Gmail API. Cel: co najmniej 660000 ms nieprzerwanej
gotowości bez konieczności kolejnych wywołań segmentów przez agenta. Jest
to test utrzymania hosta, nie dowód wysłania, dostarczenia ani odczytu maila.

## Zakończone wykonanie Windows / Node24.19.0 / Computer Use

- **17/17 końcowych nowych regresji PASS**, FAIL0/SKIP0/cancel0, exit0.
  Zawierają także abort heartbeat podczas nierozstrzygniętego oczekiwania UI.
  Zachowano wcześniejsze FAIL oczekiwań fixture dotyczących wyścigów native
  COMPLETED i zamknięcia odpowiedzi IPC. Dozwolone odmowy pozostają terminalne;
  nie zmieniano produkcyjnych progów ani protokołu w celu zaliczenia fixture.
- **660529,7027 ms** ciągłego utrzymania (11 min 0,5297 s), bez utraty lease.
  611 próbek natywnego ownera, 521 kontroli karty, maksymalny odstęp kontroli
  **4769 ms**. Po syntetycznym STOPPED: release potwierdzony, task closed,
  broker/strona zamknięte i katalog usunięty. Wszystkie liczniki AUTO batch,
  AUTO session, outbox, browser delivery, usage i send attempt równe **0**.
- Okno faktycznej aktywności około **11:43:57–11:54:58 UTC**
  (**13:43:57–13:54:58 Europe/Warsaw**, 24.10.2026). To czas rzeczywisty,
  bez przyspieszania zegara. Runtime zgłosił timeout odpowiedzi MCP po 300 s;
  ta sama oczekiwana operacja nadal działała i sama zakończyła się po Stop.
  Monitor pliku nie odnawiał lease, nie wykonywał UI i nie restartował taska.
- Załadowane bajty testu: sourceTreeHash
  `3a164cf3625a8d45155aa8d83d9f3e80c527164f32a88d248d2075c4d3f32101`,
  loadedCodeHash
  `e87a7152bca81f676bc61863a45f12fac27137b5e7a02fde34712355553279fa`.
  To build roboczych bajtów przed nowym commitem; nie utożsamiać pola bazowego
  sourceSha z zatwierdzonym później commitem. Końcowa dostawa porównuje hash
  kodu wykonania z wybranym buildem.

Pełny Windows check i CI mają osobne logi/manifesty w dostawie. Powyższy
PASS dotyczy wymienionego zakresu; nie zastępuje wyniku pełnej regresji.
Nie uruchamiano rzeczywistego Startu ani Gmail messages/history/send.
