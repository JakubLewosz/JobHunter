# Rozwój E3 — 7 października 2026

Punkt wyjścia: czyste `main`, commit `109effa`. Bazowe `npm run check`: 44 testy i 4 scenariusze UI, PASS. Bez zastępowania istniejącej aplikacji.

1. A — przegląd specyfikacji, backendu, schematu SQLite, adapterów, panelu i testów: wykonany.
2. B — jawne tryby DEMO/RESEARCH_ONLY, osobne katalogi, migracja 003 zachowująca zależności, transport disabled w researchu: wykonany.
3. C — publiczny fetcher z przypiętym DNS, SSRF IPv4/IPv6, przekierowaniami, limitami strumieni i 429; import i trwałe źródła: wykonany.
4. D — rzeczywisty `codex exec`, stdin/JSONL/schema, istniejące logowanie ChatGPT, kontrolowane argumenty, osobny katalog zadania, wyłączone narzędzia lokalne. Próby strukturalna i web search: wykonane na macOS.
5. E — ekstrakcja z kontrolą dosłownych cytatów, jawne unknown/conflicting, kwalifikacja w kodzie, indywidualny szkic i osobna pomocnicza kontrola semantyczna: zaimplementowane; scenariusze offline zweryfikowane.
6. F — trwałe etapy i checkpointy według URL/źródeł, pauza/stop/wznów, panel i kopiowanie: wykonane.
7. G — regresje, UI i dokumentacja: wykonane. Ograniczona rzeczywista próba z zatwierdzonym profilem: 10 kandydatów, 3 szkice i automatyczny stop; dwie nieudane generacje zachowane. Wynik w TEST_REPORT.md.

Rzeczywiste przejście firma → szkic potwierdzone w ograniczonej próbie. Windows i pełna izolacja OS pozostają niezweryfikowane.

Aktualizacja z 8 października: E4 obejmuje logowanie Google, APPROVAL_REQUIRED, celowaną historię, sender i reconcile. Dziewięć zleconych testów Gmaila potwierdzono w Wysłanych; foldery odbiorców mają mieszane wyniki, a problem Spamu pozostaje do diagnozy. Materiały są zatwierdzone, styl wiadomości zaakceptowany; kontakt do firm, rzeczywiste historie firm i odpowiedzi nadal wymagają próby. E5 nie rozpoczęte; AUTO_POLICY zablokowany. Bieżące wyniki: TEST_REPORT.md i GMAIL_SETUP.md.
