# Stabilizacja V1 — 26.10.2026

Baza wykonania to faktycznie przygotowane wydanie `f184b2f21edf8320c4ce7f73055dff817973ea40`,
nie starszy `main`. Osobny DEVELOPMENT, komplet fikcyjnych providerów i tymczasowe
bazy. Nie wdrożono zmian na WORKSTATION i nie wykonano nowych rzeczywistych wysyłek.
Prywatne wyniki zamrożonego SHA, manifest i stan instalacji są dostarczane poza repo.
Ta dokumentacja nie przyznaje nowej polityki ani prawa Start.

## Problem i małe zmiany

REFRESHING przechodziło przez wszystkie niewysłane szkice przed discovery.
Regresja rzeczywistej natywnej selekcji na bibliotece ponad 15 pozycji wykazała
odnowienie 21 zamiast 15; powolne odczyty zużywały cały godzinny termin i discovery
w ogóle nie startowało. Pierwsze błędy przygotowania samej fixture zachowano
w prywatnych logach, oddzielnie od tej reprodukcji.

Koordynator utrwala teraz kolejkę: do 12 pozycji przy godzinie, do 15 przy 2–24 h.
To początkowe konserwatywne budżety pracy, niezależne od `maxItems`, dziennych
limitów i długości kampanii AUTO. Nie są pomiarem przepustowości prawdziwych firm.
Priorytet: aktualna gotowość według istniejących bramek, dopasowanie do oferty,
literalny kanał rekrutacyjny, najdawniejsza próba odnowienia, wiek i ID.
Firmy z blokującą historią oraz powielone firmy/adresy są pomijane. GENERAL
zachowuje swój rodzaj i nadal wymaga dopuszczającej polityki przed wysyłką.

Przy discovery odnowienia otrzymują pierwsze 40% pierwotnego budżetu researchu.
Discovery korzysta z pozostałego czasu do tego samego deadline. Bez discovery
odnowienia mogą użyć całego research deadline, nadal z ograniczoną kolejką.
Po każdej pozycji utrwalane są wynik, wersja, `sameText` i kod. Jawne Resume
zachowuje kolejkę i terminy; nie dobiera nowych pozycji w trakcie starego zadania.
Odczyt każdej pozycji przechodzi również guard koordynatora. Stop i utrata ownera
nie stają się lokalnym odłożeniem. Zabezpieczenia sendera pozostały bez zmian.

Test budżetu ujawnił odrębny problem: `startLibraryResearch(...,1)` dziedziczyło
limit 3 szkiców / 10 kandydatów dawnego godzinnego testu. Koordynowane sesje
i `research:session --hours 1` zapisują teraz `trial=false` i pracują do terminu.
Jawny dawny test godzinny UI zachowuje swój kontrakt; stare rekordy bez pola
`trial` zachowują dawną interpretację. Nie migrujemy historii i nie resetujemy
liczników. To uzasadniona testem zmiana kolejności prac względem proponowanych PR.

## Źródła i jakość

Publiczny smoke na syntetycznym profilu wykazał TLS_UNTRUSTED na trzech
niezależnych domenach, następnie prawidłowe READER_ENVIRONMENT. CLI probe
i discovery zadziałały; żadnego szkicu lub uprawnienia nie utworzono.
Zainstalowany Node24 domyślnie używa bundled CA. Sprawdzono jego help oraz
odczyt przez istniejący PublicSourceReader: z `--use-system-ca` oficjalna
strona zwróciła READ/COMPLETE. Dlatego operacyjne skrypty npm start, nightflow,
research:session, research:refresh i smoke:public włączają wspierany systemowy
magazyn CA Node24. Weryfikacja certyfikatów, przypięte DNS/IP, SSRF i zakaz
proxy pozostają. Nie importowano certyfikatów ani nie zmieniono ustawień OS;
nie używać NODE_TLS_REJECT_UNAUTHORIZED=0. Bezpośrednie uruchomienie pliku
Node musi użyć tej samej flagi; sama zmiana kodu nie aktualizuje sendera.

Powtórny publiczny smoke z walidacją TLS i systemowym CA: COMPLETED,
5 firm, 21 READ, 5 ekstrakcji/kwalifikacji, 4 zapisane szkice z code PASS,
ukończonym review i quality PASS; jedna odmowa/nieustalony zakres ograniczenia
odłożony. Zero outbox/prób/Gmaila. To realne publiczne źródła i natywny CLI
0.164.0-alpha.11.1, ale syntetyczny profil w osobnym DEVELOPMENT, przed freeze.
Nie jest R1 i nie dowodzi jakości przyszłych osobistych wiadomości.

Nie dodano kolejnego mechanizmu rewalidacji. Istniejący kod już tworzy nowy pakiet
i kontroluje ten sam tekst po zmianie hasha HTML. Nowe regresje sprawdzają:

- identyczny tekst przy zmienionym raw hash: nowa wersja, nowy context binding,
  nowe review dokładnego payloadu, bez kosmetycznej generacji;
- zmieniona treść lub adres na privacy: brak odziedziczenia starego PASS;
- timeout i INCOMPLETE: HOLD, bez nowej próby wysłania;
- historyczne wersje pozostają niezmienione.

Szersze istniejące regresje obejmują cache, limit ośmiu cytatów, GENERAL,
restrykcje kanałów, nieaktualny qualityVersion oraz A → lokalny błąd B → C.
Nie poprawiano parsera details bez dowodu szerszej potrzeby. Nie zmieniano
zatwierdzonych materiałów, CV, polityki historycznego pilota ani stylu generatora.

## Odtwarzalny odbiór

Po wybraniu SHA nie zmieniać kodu między tymi próbami:

```text
npm ci --no-audit --no-fund
npm run check
node scripts/v1-acceptance.mjs --out <NOWY_KATALOG_POZA_REPO>
```

`v1-acceptance` przyjmuje wyłącznie nowy katalog dowodów. Tworzy własną historię,
fikcyjnego właściciela i PDF, trzy firmy .test oraz stronę 127.0.0.1. Backend
działa w zwykłym Node24 i korzysta z istniejącego NightflowCoordinator oraz
RemoteNightflowHost; nie ma drugiego koordynatora produkcyjnego.

W rzeczywistym Computer Use dla kolejnych `T1-ready.json` i `T2-ready.json`:
otworzyć wskazany własny URL, zaimportować `scripts/browser-executor.mjs`, utworzyć
jedną `CodexNightflowAdapter(dir, taskId, tab, {fixtureOrigin})`, wykonać connect,
jeden Start i czekać na segmenty tej samej instancji aż do terminalnego wyniku.
Zakończyć `close`. Nie ponawiać Start po utracie ACK. Nie zastępować hosta
zwykłym Playwrightem i nie używać Gmaila. Syntetyczny plan w tej fixture sam
zatwierdza wyłącznie fikcyjne dane. Produkcyjny plan nie może być podany.

T1 wykonuje native research, odnowienie A i C do nowych wersji z nowym review,
odłożenie B z timeoutem, kwalifikację, zamkniętą partię w rzeczywistej kolejności,
dwie akcje lokalnego UI oraz STOPPED. Sprawdza trwałe próby, usage, grant i brak
udawanej ludzkiej akceptacji partii. Strona zwraca rzeczywisty ACK UI bez
fikcyjnego potwierdzenia API: oczekiwany stan to SENT_PROVIDER, nie SENT_CONFIRMED.
Zgodność pełnego pomocniczego receipt/payloadu ma odrębne regresje browser-delivery.

T2 zamyka poprzedni broker, odtwarza usługę z tej samej historii, przesuwa zegar
testowy o dobę i wykonuje nowy jawny Start nowego fikcyjnego zakresu. Oczekuje
NO_READY_ITEMS, zero nowych akcji/partii, tych samych dwóch prób i rezerwacji.
Kolejne odtworzenie usługi musi pozostać STOPPED bez prawa wysyłki. To symulacja
następnego dnia, nie oczekiwanie 24 h ani restart całego Codexa.

W razie potrzeby bezpieczne przerwanie fixture: utworzyć `STOP_FIXTURE` w jej
katalogu dowodów i odebrać końcowy raport. Własny timeout wynosi 10 minut.
Nie kasować locków lub ponawiać Start w celu odzyskania wyniku.

T3 to natywna macierz awarii:

```text
node node_modules/tsx/dist/cli.mjs --test tests/nightflow.test.ts tests/independent-refresh.test.ts tests/browser-startup-sequence.test.ts tests/browser-batch-task.test.ts tests/browser-crash.test.ts tests/nightflow-control-failures.test.ts tests/quality-legacy-gate.test.ts tests/reply-to.test.ts tests/single-account.test.ts tests/library-refresh.test.ts
```

Odróżnia lokalne błędy od Stop, guard/owner/host lost, zmiany polityki/materiałów,
utraconego ACK, SENDING/SEND_UNKNOWN, restartu i niezgodności konta/Reply-To.
Testy badają zapisane próby, wersje, powiązania i liczniki. Nie są deklaracją,
że każdy scenariusz awarii odtworzono w samym procesie aplikacji Codex.

Preflight przed zamrożeniem: 72/72 celowane testy, następnie 6/6 dodatkowych
testów kolejki/operatora oraz T1/T2 w rzeczywistym hoście PASS z pełnym cleanup.
Pełny Windows `npm run check`: 995 backend, 12 Stop, 26 UI, typecheck i build
PASS; 735760 ms, przed commitami. Nie jest to wynik CI finalnego SHA.
Nie zaliczać tych wyników jako końcowej walidacji wybranego później SHA.
Pełny Windows check, CI, T1/T2/T3 i package validation finalnego SHA mają osobne
polecenia, czasy i wyniki w prywatnej macierzy dostawy.

## Pozostała bramka

R1/R2/R3 tego wydania nie wykonano. Następna decyzja obejmuje dokładny SHA,
spójny backup SQLite przez online backup API z WAL, integrity/FK i porównaniem
chronionych rekordów, kontrolowany build/doctor i 1–2 h researchu bez Gmaila.
Nowa zgoda na wysyłanie, zamknięty plan i świadomy Start są późniejszym osobnym
zakresem. Nie ma potrzeby ponownej akceptacji każdego zgodnego maila AUTO.
Nie ogłaszać V1_PRODUCTION_VERIFIED na podstawie tych syntetycznych prób.
