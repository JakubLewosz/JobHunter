# Obowiązkowa treść wiadomości ze źródła

Wykazany błąd: źródło wymagało klauzuli w mailu, ale ekstrakcja jej nie
zawierała. Recenzent uznał klauzulę za zbędną, korekta ją usunęła, a kolejny
review zwrócił PASS. Ocena modelu nie zapewniała zgodności finalnego tekstu
z rzeczywistym wymaganiem.

Wąska poprawka rozpoznaje jawny marker „Nie zapomnij dołączyć klauzuli w
mailu” w kompletnym źródle. Dosłowny fragment jest danymi generatora,
recenzenta i korekty. Kod sprawdza finalną treść również przy reuse i przed
przyjęciem korekty. Brak klauzuli blokuje materiał niezależnie od PASS.
Checkbox formularza nie jest takim wymaganiem. Dodatkowa zgoda na przyszłe
rekrutacje lub marketing wymaga decyzji; źródło nie przyznaje uprawnienia.

Nie zmieniono kryteriów stylu, katalogu projektów, schematu historii ani
uprawnień nadawania. Rozpoznawanie jest celowo ograniczone do wykazanego
jednoznacznego wzorca; nie zastępuje kontroli innych wymagań aplikacji.

Regresja na syntetycznej bazie odtworzyła usunięcie klauzuli przed poprawką.
Po poprawce cztery testy sprawdzają dane generowania/review, blokadę braku
treści mimo modelowego PASS, odróżnienie formularza/dodatkowej zgody oraz
zablokowanie redakcyjnego usunięcia. Testy nie używają Gmaila ani rzeczywistych
odbiorców. Weryfikacja wydania i ewentualne wdrożenie są osobnymi etapami.
