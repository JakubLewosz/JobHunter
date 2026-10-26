# Niezależne odnowienie — limit cytatów i cache, 26.10.2026

Publiczne `runLibraryRefresh` zachowuje zapisany `AUTO_POLICY` i używa
`independentResearch=true`, bez sesji nadawania. Ten etap nie zmienia trybu,
uprawnień, polityki ani kontroli faktów/źródeł.

## Odtworzony błąd

Poprawna ekstrakcja może zawierać do ośmiu `companyActivities`.
`effectiveAnalysis` przenosi dodatkowe, nadal potwierdzone cytaty wcześniejszej
kwalifikacji. Suma mogła przekroczyć limit schematu, mimo że sam wynik modelu
był poprawny. Kolejna walidacja zatrzymywała przygotowanie z
`INVALID_MODEL_RESULT`, przed generowaniem i końcowym review szkicu.

Regresje używają fikcyjnych stron i istniejącej syntetycznej kampanii AUTO:
4 nowe + 6 wcześniejszych cytatów oraz graniczne 7/8 nowych + 2 wcześniejsze.
Przed poprawką przypadki przekraczające osiem kończą się odrzuceniem.

## Zmiana

- Zachowujemy kolejność aktualnej ekstrakcji. Starszy, zweryfikowany cytat
  można dołączyć tylko do limitu ośmiu; schemat nie został rozszerzony.
- Obie istniejące ścieżki cache pomijają analizę niespełniającą schematu
  i przechodzą do zwykłej ekstrakcji zweryfikowanych źródeł. Historyczny
  rekord pozostaje nienaruszony. Błędy dowodów inne niż błąd schematu nadal
  zatrzymują użycie danych; nie normalizujemy ani nie przycinamy starej analizy.
- Nie ponawiamy negatywnego/niepewnego review ani wywołania dostawcy.
  Nowa ekstrakcja jest etapem osobno uruchomionego, ograniczonego odnowienia;
  obowiązują jego dotychczasowe owner, Stop, deadline i budżety.

Nie zmieniono generowania wiadomości, selekcji ciągłego AUTO, kontaktów,
CV, faktów, limitów nadawania ani sposobu autoryzacji. Nie ma nowej API.

## Walidacja i wdrożenie

Regresja cache sprawdza jedną świeżą ekstrakcję i zachowanie historycznego
wadliwego rekordu. Pozostałe testy niezależnego odnowienia zachowują ochronę
kampanii/scope, A → lokalne B → C oraz anulowanie/utratę właściciela.
Dokładny wynik pełnego Windows check i CI finalnego SHA jest zapisywany
oddzielnie w dostawie; nie należy przypisywać jej wcześniejszych PASS.

Kod pozostaje DEVELOPMENT. Aktualizacja WORKSTATION i nowa operacja jej
odnowienia wymagają odrębnego zatwierdzenia; nie są wykonane przez push.
