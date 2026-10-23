# Zapisane szkice RESEARCH_ONLY → zamknięta partia AUTO

Istniejąca ścieżka to zatwierdzona polityka → `refreshLibraryDrafts` w
`AutoPolicyJobHunter` → podgląd wynikowych wersji → osobno autoryzowana historia
i zamknięta partia. Nie wymaga discovery, nowego generatora ani nowego typu
zgody. Przygotowanie nie jest Startem i nie tworzy prawa nadawania.

## Dlaczego sam prepareBatch nie wystarcza

RESEARCH_ONLY zapisuje rzeczywiste źródła, kwalifikację, szkic, kontrolę kodową
i semantyczną oraz historię wersji. Nie dopisuje `auto_run_scope` lub
`auto_draft_scope`. `prepareBatch` sprawdza `inScope`: brak przypisania do
aktualnej polityki daje `SCOPE_CHANGED`, nawet gdy tekst i materiały mają PASS.

Rzeczywiste odnowienie wybranych ID przez `AutoPolicyJobHunter` używa czytnika
tych źródeł i zwykłej kwalifikacji. Jego run ma klucz `refresh-…`, a enqueue
wiąże go z zatwierdzonym scope. Nie jest fikcyjnym researchem ani odkryciem firmy.
Nie wywołuje wyszukiwania nowych firm. `sameScope` i `draftResearchBinding`
celowo uniemożliwiają uznanie dawnej wersji za już sprawdzoną w nowym zakresie.
Normalna ścieżka tworzy nową wersję tego samego ID i dopiero wtedy zapisuje
`auto_draft_scope`; stare wersje i źródła pozostają. Nowy temat i tekst mogą być
identyczne ze starymi. Nie deklarujemy identyczności przyszłego wyniku modelu:
każdy wynik trzeba porównać i pokazać przed zatwierdzeniem wysyłki.

Guard chronionych danych nie został poluzowany. Zmiana istniejącego wskaźnika
scope jest dozwolona tylko z nową zgodną niezmienną wersją i do już
zatwierdzonego, niezmienionego scope polityki. Powtórzenie poprawnego odnowienia
nie powinno tworzyć zbędnej wersji. Negatywne lub przerwane kontrole pozostają
blokujące; samo przypisanie scope nie jest PASS.

## Procedura zatrzymanego WORKSTATION

1. Sprawdzić właściciela, zakończenie operacji, wersję rzeczywiście używanego
   backendu, istniejącą historię, profil, PDF, blokady i niepewne próby. Przed
   pierwszym zapisem wykonać i sprawdzić spójny backup SQLite z WAL poza repo.
2. Pokazać konkretną politykę. `configurePolicy` wymaga świadomego
   `confirmed` oraz `targetedHistoryConsent`; nie wolno wypełniać ich na
   podstawie samego zlecenia rozwoju. Konfiguracja nie odczytuje korespondencji,
   ale przyznanej zgody nie można przedstawiać jako nieudzielonej. Przy braku
   tej decyzji kończymy na plikowym podglądzie i STOPPED.
3. Po wymaganej zgodzie użyć zatrzymanego backendu **AUTO_POLICY** i publicznego
   `POST /api/library/refresh` z `{ draftIds: [dokładna zamknięta lista ID] }`,
   czyli `service.refreshLibraryDrafts(...)`. Nie używać Start, nightflow,
   discovery ani SQL do przypisania zakresu. `research:refresh` konstruuje
   `ResearchJobHunter` bez AUTO i nie zastępuje tej kwalifikacji do polityki.
4. Odczytać wynikowe ID/wersje, `sameText`, payloady, materiały i rzeczywiste
   źródła. Sprawdzić `auto_draft_scope` oraz brak prawa nadawania. Pokazać pełne
   finalne wiadomości; dla różnic podać dokładny tekst i przyczynę. Nie
   zatwierdzać automatycznie kosmetycznej zmiany. Nieweryfikowalną pozycję
   pozostawić z jej kodem, bez zastępowania inną firmą.
5. Dopiero w ramach późniejszej zgody na konkretny pilot: celowana historia
   dozwolonego konta/adresów/domen, następnie `prepareBatch` wyłącznie z
   przechodzących kontrolę finalnych wersji, `approveClosedBatch` i świadomy
   `startBatch`. Zamknięta lista nie przechodzi w ciągłe AUTO. Wysyłka natywna
   wyłącznie Computer Use, bez API send/SMTP/fallbacku/retry SEND_UNKNOWN.
6. Zakończyć Stop i odebraniem prawa; zachować historię i rzeczywiste wyniki.

Odstęp jest niezależny od maksimum wiadomości. Natywne pakiety wygasają po
15 minutach, zgoda celowanej historii po 60 minutach; AUTO tworzy pojedynczy
pakiet przy użyciu i sprawdza aktualną historię. Nie wydłużamy tych terminów
ani nie podnosimy limitów, by wypełnić partię. Dodatkowe okno pilota wymaga
osobnego świadomego zakresu; nie wynika z kwalifikacji materiału.

## Regresje

`tests/existing-drafts-to-auto.test.ts` zaczyna od prawdziwych metod
RESEARCH_ONLY, tego samego zatwierdzonego profilu i źródeł fixture, bez
wcześniejszych scope AUTO. Politykę zapisuje dopiero później publiczną metodą.
Żaden scope nie jest dopisywany ręcznie. Przebieg obejmuje powtórzenie,
zamknięte trzy pozycje z wykluczeniem czwartej, odrzucenie rodzaju kontaktu,
stare źródła, profil/PDF/blokadę, zmianę wersji/polityki, Stop, utratę
właściciela podczas czytnika i modelu oraz brak historii/wysyłki przed
fikcyjną zgodą i Start. Pełna partia korzysta wyłącznie z fikcyjnego gatewaya.
