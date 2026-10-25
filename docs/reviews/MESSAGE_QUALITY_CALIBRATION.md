# Kalibracja jakości i zgodność starszych materiałów — 25.10.2026

Decyzja: **nadal nie potwierdzono poprawy generatora**. Techniczne zamknięcie
dwóch luk nie jest dowodem jakości wiadomości na poziomie zaakceptowanych v5.
Brak wdrożenia WORKSTATION, Gmaila, Startu i zmian produkcyjnych materiałów.

## Porównanie i ograniczenia

Zamrożono 12 reprezentatywnych kontekstów z istniejących odnowień: 6 PROSPECT,
3 OPEN, 3 ACTIVE, z kontaktami GENERAL i RECRUITMENT. Dwa przebiegi rzeczywistej
ścieżki `tick → generate → checkDraft → reviewStoredDraft` użyły identycznych
profili, dowodów, źródeł, kontaktów i schematu oceny. Publiczne odczyty odtworzono
z zapisanych danych; odbiorcy i adresy źródeł są fikcyjni, a provider wyłączony.
Nie odczytywano poczty. To test tekstów i procesu, nie aktualności kontaktów.

**12/12 wejść DRAFT przed i po jest identycznych bajtowo.** Aktywny zapisany
szablon ma placeholdery, więc poprawka gałęzi bez placeholderów nie zmienia
tych wejść. Losowe różnice odpowiedzi modelu nie dowodzą wpływu tej poprawki.

| Pomiar natywnej ścieżki       |        Baza f26e4a8 |                 Po poprawce |
| ----------------------------- | ------------------: | --------------------------: |
| Pierwszy code PASS            |               11/12 |                       11/12 |
| Pierwszy editorial PASS       |               10/12 |                        9/12 |
| Pozostałe pierwsze werdykty   | 1 REVISE, 1 NOT_RUN | 1 REVISE, 1 HOLD, 1 NOT_RUN |
| Końcowy code i editorial PASS |               10/12 |                       10/12 |
| Wywołania modelu              |                  24 |                          25 |
| Mediana procesu przypadku     |             28,00 s |                     34,53 s |

Ślepa ocena porównawcza pierwszych tekstów preferowała bazę 3 razy, drugą
próbę 4 razy, remis 5 razy. Oceniający dostał odrębne zadanie bez klucza
wersji i ocen kontrolera; nie jest to niezależna architektura modelu.
Wszystkie 24 teksty otrzymały od niego PASS, co samo wymaga ostrożności.
Użytkownik wybrał B w trzech prywatnych parach; wszystkie B były drugą próbą.
To dowód preferencji tych tekstów, bez zgody na ich zapis lub wysyłkę i bez
przypisania różnic do zmiany kodu. Nie zmieniono prompta pod ocenione wyniki.

Osobno oceniono 3 pozytywne v5, 5 prywatnych P1 oraz 15 alfabetowych
substytutów dawnych szkiców. Brakujący oryginalny plik 15 przykładów nie
został zastąpiony pod tą samą etykietą. v5 były wcześniej użyte do kalibracji,
nie są nowym niezależnym holdoutem. W zamrożonych jednoznacznych etykietach:
5 pozytywnych zachowanych, 1 istotna wada wykryta, 0 fałszywych odrzuceń
i 0 fałszywych dopuszczeń. Dwa przypadki graniczne i 15 nieoznaczonych nie
wchodzą do tej macierzy; mała liczba negatywów nie dowodzi czułości rubryki.
PASS bez uwagi przepuszczał także słabsze graniczne teksty. Prywatny raport
pokazuje literalne fragmenty, znaczenie, rozbieżności i najmniejszą korektę.

Historyczny eksperyment 20 przypadków pozostaje: 20/20 vs 19/20 pierwszych
PASS + 1/1 po korekcie, 7 blokad kodowych po obu stronach, 40 vs 42 calls,
mediany 23,16 vs 27,02 s. Nie jest dowodem wzrostu jakości generowania.

## Szablon i jawne preferencje

`templateStyleGuidance()` przekazuje wskazówki z placeholderów i jednoznaczne
akapity preferencji. Bez placeholderów dopuszcza wyłącznie jawne instrukcje
stylu (np. „Pisz…” albo „Preferencje stylu: …”). Pełny list lub niejednoznaczna
proza daje `TEMPLATE_STYLE_PREFERENCES_REQUIRED`; nie jest automatycznie
streszczana ani zatwierdzana. Operator zachowuje dawny zapis, wydziela
preferencje i uzyskuje zwykłe zatwierdzenie zmiany profilu przed generowaniem.
Nie dopisujemy takiego zatwierdzenia w kodzie. To celowy kompromis zgodności.

Bieżący szablon 853 znaków sprawdzono readonly: dwa placeholdery, bez pełnego
listu, stałej wizytówki i aliasu `profile.approvedMessage` w wejściu generatora.
Nie ujawniono treści ani nie zmieniono profilu. Nowa poprawka nie usuwa tu
przyczyny powtarzalności: pełny szablon już wcześniej nie był przekazywany.
Gęste fakty projektu, podobne zadania i instrukcje także wpływają na powtórzenia.

## Starsza ocena nie udziela nowej gotowości

Materiał musi mieć aktualny binding/payload, code PASS, completed review,
poprawne fakty i **dokładnie bieżący** `messageQualityVersion` oraz quality PASS.
Brak materiału jest UNVERIFIED; brak lub obca wersja jakości daje
`EDITORIAL_REVIEW_REQUIRED`. Prepare wskazuje NEEDS_REPREPARATION, dispatch
pozostaje zablokowany. Nie migrujemy ani nie unieważniamy zbiorczo biblioteki.

Jawne odnowienie wybranego niewysłanego legacy przez istniejące verify/review
dopisuje wersję tego samego tekstu, odwołuje starą aprobatę i kontroluje dokładny
payload. Stara ocena materiału pozostaje bez zmian. Przy braku starego materiału
zachowujemy historyczny snapshot, bez wymyślania mu statusu PASS. Stale sources
wymagają istniejącego odnowienia kontekstu. Poprawka nie odświeża dat dowodów.
Wysłane wersje nie są ponownie otwierane. Nowy numer uwzględnia osierocone
historyczne wersje; restart i zachowanie tekstu nie odnawiają wydanego budżetu
jednej korekty. Stop, deadline, właściciel, wersja, profil i źródła nadal
blokują spóźniony wynik. Dobry tekst nie jest przepisywany.

To kontrola maszynowa wybranej wersji, nie ręczna zgoda na każdą wiadomość AUTO.
Odbiorca, fakty, policy, tempo, kolejność partii, historia, SEND_UNKNOWN,
CV, limity i Computer Use pozostają pod dotychczasowymi bramkami.

## Walidacja i dalszy krok

Odtworzenie na bazie: 0/3 PASS — wszystkie trzy regresje ujawniły luki.
Pierwsza poprawka: 60/64 PASS; zbyt wczesna obsługa starego bindingu pominęła
istniejące czyszczenie semantyki. Poprawiono zakres do legacy: 124/124 PASS.
Pełny backend: 980/981 PASS; dawny test podawał pełny list jako wzór.
Zastąpiono wyłącznie syntetyczne wartości fixture jawnymi preferencjami,
zachowując test tonu. Nowa bramka odrzuca też prozę bez rozpoznanego powitania.
Celowany zestaw szablonów/stylu/legacy: 73/73 PASS; po dodaniu scenariusza
braku materiału końcowy zestaw: 74/74 PASS. Wyniki końcowego
Windows check i CI dokładnego SHA są rozliczane oddzielnie w dostawie.

Najmniejsza następna hipoteza jakości: ograniczyć powielone, gęste przekazywanie
pełnego faktu projektu przy zachowaniu źródła prawdy i zakresu zatwierdzenia;
generatorowi wyeksponować jedną czynność związaną z konkretnym zadaniem firmy.
Zweryfikować na nowym holdoucie i wielu próbach z niezmienioną rubryką.
Nie dodano tej zmiany po obejrzeniu ocenionych tekstów. Techniczne PASS
nie zamykają zadania jakości generatora ani nie udzielają zgody na wdrożenie.
