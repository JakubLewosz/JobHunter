# Wynik zlecenia V1 — 28.10.2026

**NOT_PRODUCTION_VERIFIED**. Końcowy kod i build wdrożono po pełnych
bramkach, lecz rzeczywisty godzinny R1 tego wydania nie został ukończony.
R2 i R3 na nim NOT_RUN. Zero nowych rzeczywistych prób/nadań/stanów niepewnych.
Zakończono STOPPED, bez ownera, aktywnych operacji i prawa wysyłki.

## Tożsamość i dowody

- Kod: `1f41b550578751b68811c9628f4b915f2ea51c26`.
- Source tree: `ae245b64fb64a6912de79d84890154ed6155920422f6f6277032965f718839a7`.
- Build: `9580da4a-7cec-48ab-91ec-dbed71599bb6`.
- Loaded code: `0c0bc7c7dfafd7f162e7194b7d1afcdb20e876e25a42ba34bae2a1f0f85fe66b`.
- Windows/Node v24.19.0, `npm run check`: 1021 backend, 12 serial Stop,
  26 UI, typecheck/build PASS (1 656 631 ms). Pierwszy pełny check tego SHA.
- [CI dokładnego kodu, attempt 1 SUCCESS](https://github.com/JakubLewosz/JobHunter/actions/runs/40701484865).
- Świeży rzeczywisty Computer Use lokalnej fixture: A poprawne / B odłożone
  STALE_EVIDENCE / C poprawne, wersjonowane mapowania i dwa natywne fikcyjne
  nadania; restart tej samej historii na fikcyjnym kolejnym dniu bez nowych
  akcji. Profil tymczasowy i serwer fixture usunięte/zamknięte. Nie był to Gmail.
- Wdrożenie: Stop/zakończone operacje, backup SQLite z WAL, odtworzenie i
  zgodność wszystkich 62 tabel, rollback kodu zachowany, build/doctor i
  tożsamość załadowanego kodu. Nie cofano historii. Końcowy backup również PASS.

Dokumentacyjny commit po odbiorze nie zmienia kodu, zależności lub testowanego
buildu. Manifest dostawy rozróżnia codeSha i sourceSnapshotSha; dokumentacji
nie przypisuje się jako osobnego wykonania testów lub nowego wdrożenia.

## Wykonane naprawy

Odtworzono lukę zmiany adresu tego samego szkicu po zatwierdzeniu zamkniętej
listy. Plan przypina firmę, adres, rodzaj i cel; odnowienie, selekcja,
derywacja partii i dispatch ponownie je sprawdzają, również po restarcie.
Opcjonalny absolutny expiresAt ogranicza sesję i kolejne Starty. Stara zgoda
bez mapy nie uzyskuje nowego zakresu automatycznie. Nie dodano migracji.

Zamknięty plan filtruje ID przed kosztowną oceną biblioteki. Zwykły plan
oddaje sterowanie między ocenami i sprawdza anulowanie oraz aktualność planu.
Regresja Stop przed zmianą: pięć ocen zamiast jednej; po zmianie 44/44 PASS.
Nie podwyższono lease lub timeoutów ani nie dodano sztucznych heartbeatów.
Parser HTML nie skanuje wielokrotnie tego samego rodzica i poprzedniej linii;
wynik benchmarku identyczny bajtowo, 27/27 HTML PASS, zimny pomiar 485→145 ms.

Trwały autoryzowany HOLD użytkownika zapisano istniejącym suppress, z
USER_HOLD_APPLICATION_REQUIREMENT (nie OPT_OUT). Poprzednie blokady zachowano.
currentLiteral=false odtworzono jako złe wywołanie API w audytorze; sprawdzono
mapę i 31 rzeczywistych cytatów. Walidatora nie osłabiono. Jedną celowaną
korektę wiadomości zapisano i oceniono natywnie; treści i odbiorcy poza Git.

## Rzeczywisty odbiór i blokada

Pierwszy R1 końcowego kodu zakończył się po 258 s: SEMANTIC_REVIEW 120670 ms.
Po udanym małym probe druga próba zatrzymała się po 259 s: EXTRACT 120426 ms.
Po drugim udanym probe wykonano jedno natywne Resume tej samej sesji z tym
samym deadline. Biblioteka osiągnęła 12/12 CHECKED; discovery zakończyło się
SEARCH 120396 ms. Końcowe 1283 s od początku obejmuje przerwę, nie godzinę
aktywnej pracy. Żadnej z tych prób nie oznaczono R1_PASS.

CLI: codex-cli 0.165.0-alpha.1.2. Niezmieniony limit wywołania 120000 ms.
Przyczyna nieustalona; nie ma dowodu wyczerpania limitu, awarii logowania lub
provider outage. Małe probe 5422/4819 ms nie potwierdziły trwałego ustąpienia
problemu. Nie zmieniano konta, API key, modelu, izolacji lub uprawnień.
Po kolejnych porażkach zachowano dowody i zakończono ponawianie bez przesłanki.

Zaliczone 3617 s R1 starszego d222655 oraz jego R2 zatrzymany BROWSER_HOST_LOST
przed próbą/partią są wyłącznie historią tego wydania. Nie zastępują odbioru
1f41b55. Pierwsze niepowodzenia testów d222655 i a2cae88, CI a2cae88 oraz
roboczy błąd sygnału anulowania są zachowane w dowodach dostawy.

Końcowy guard, zgodność kodu, zachowanie chronionych rekordów i cleanup PASS.
Oryginalne 11 prób/rekordów użycia (w tym trzy historyczne pierwsze kontakty)
pozostaje niezmienione; wcześniejsze firmy są zablokowane dla kolejnego
pierwszego kontaktu. Oba CV zgodne z własnymi hashami, profil i fakty bez zmian.
Końcowe materiały pięciu firm wyeksportowano prywatnie jako **niewysłane**;
nie zastępują świeżej kontroli lub prawa wysyłki. Nie wykonano nowego SELF_TEST.

Pierwotna granica zgody: 2026-10-29T10:06:39.233Z. Nie została odnowiona.
Nie ma autostartu, następnej kampanii lub pracy w tle.
Następny bezpieczny krok zapisuje [TASKS](../TASKS.md); instrukcję sprawdzonej
syntetycznie ścieżki operatora zawiera [CODEX_OPERATION](../CODEX_OPERATION.md).

## Otwarty maintenance

Zapisany npm audit: 4 alerty (1 high, 2 moderate, 1 low), w tym Zod,
fast-uri, Nodemailer i Fastify. Zależności nie zmieniano w zamrożonym wydaniu;
nie deklarujemy czystego audytu ani związku alertów z timeoutami CLI.
Osobna aktualizacja wymaga własnej regresji i bramek wdrożenia.
