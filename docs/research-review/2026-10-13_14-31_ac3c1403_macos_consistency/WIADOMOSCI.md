# Zachowane wiadomości

Wysyłki: 0. Są to rzeczywiste wyniki generatora; pozytywna kontrola nie udziela zgody na kontakt. Kopie publiczne nie są poprawiane stylistycznie.

## 86da6a63-eae5-48a6-9461-b11f81309f20 — cf74c59d-9b87-45c0-a7db-3ba93e9e0767, wersja 1 (NAJNOWSZA)

Słów: 71. Odbiorca: office@gotoma.pl. Zapis: 2026-10-13T12:33:34.808Z. Pochodzenie: GENERATED_DRAFT; poprzednia wersja: brak.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Nie potwierdzono płatnej, w pełni zdalnej współpracy około 20 godzin tygodniowo po lekcjach.","Firma zaprasza do kontaktu mimo braku bieżących ogłoszeń; wiadomość jest zapytaniem o współpracę.","Podany adres jest kontaktem ogólnym; brak potwierdzonego sposobu przesłania CV.","Brak bieżących ogłoszeń nie zamyka udokumentowanego zaproszenia do kontaktu.","Nie potwierdzono płatnej, w pełni zdalnej współpracy około 20 godzin tygodniowo po lekcjach.","Zaproszenie dla stażystów nie potwierdza przyjmowania uczniów technikum.","Nie wskazano dedykowanego adresu rekrutacyjnego ani sposobu przesłania CV."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – integracje i automatyzacje**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej.

Na Państwa stronie zwróciłem uwagę na łączenie systemów i automatyzację powtarzalnych procesów. Mój projekt AutoRelay pozwala uruchamiać automatyzacje webhookami, ponawiać akcje HTTP i przeglądać historię wykonań.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo obecnie możliwość takiej współpracy?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4. Hash kopii publicznej: d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4. Redakcje: brak; tekst zachowany; hash całego payloadu: 3ebf7f5d84ca51a88afe726cd3ab585f474cb37eb9b1a0782e3741da8ed334fb.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam regularnej, płatnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
| Na Państwa stronie zwróciłem uwagę na łączenie systemów i automatyzację powtarzalnych procesów. | COMPANY |  | 035ba332-877b-4f9f-8cf8-d4ff07b5c6dc → aeecb6cd-1db9-4dca-bbcf-0af403b08147 |
| Mój projekt AutoRelay pozwala uruchamiać automatyzacje webhookami, ponawiać akcje HTTP i przeglądać historię wykonań. | CANDIDATE | fact-autorelay |  |
| Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach. | CANDIDATE | fact-availability |  |
| GitHub: https://github.com/JakubLewosz | CANDIDATE | fact-portfolio |  |

Dobór projektu faktycznie przekazany generatorowi i review:

~~~json
{
  "considered": [
    {
      "factId": "fact-autorelay",
      "project": "autorelay"
    },
    {
      "factId": "fact-codefabric",
      "project": "codefabric"
    },
    {
      "factId": "fact-elektroscan",
      "project": "elektroscan"
    }
  ],
  "selected": [
    {
      "fact": {
        "id": "fact-autorelay",
        "key": "autorelay",
        "content": "AutoRelay: samodzielny projekt full-stack automatyzacji uruchamianych webhookami, z opcjonalnymi warunkami JSON, akcjami HTTP/Discord z ponawianiem, historią wykonań PostgreSQL, workerem w tle i panelem React. Wskazany w CV stack: Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, React, TypeScript, Docker Compose i GitHub Actions. Projekt portfolio."
      },
      "score": 8,
      "proofs": [
        {
          "sourceId": "aeecb6cd-1db9-4dca-bbcf-0af403b08147",
          "quote": "Łączymy systemy, z których korzysta Twoja firma, żeby dane nie musiały być przepisywane ręcznie.",
          "evidenceIds": [
            "035ba332-877b-4f9f-8cf8-d4ff07b5c6dc"
          ]
        },
        {
          "sourceId": "aeecb6cd-1db9-4dca-bbcf-0af403b08147",
          "quote": "Wdrażamy sprawdzone asystenty AI i automatyzacje wspierające sprzedaż, obsługę klienta, dokumenty i procesy biznesowe.",
          "evidenceIds": [
            "035ba332-877b-4f9f-8cf8-d4ff07b5c6dc"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 035ba332-877b-4f9f-8cf8-d4ff07b5c6dc → aeecb6cd-1db9-4dca-bbcf-0af403b08147, 37f8c539-7176-4edd-bbbc-e61a64c42b83 → 1568872f-c8f8-4f47-b8b0-ba63b7ab17ea, 90ff28d8-0cc4-441f-b9dd-30053891a7bc → 3b18f6ee-91d7-4c12-aa9b-3a9f700b90c1, bfed730b-ab73-47de-bd68-02ff71322491 → 489f2a7f-2135-4bc7-9748-284fb544a08a, 63787a57-6644-4995-a2c3-f804f729e1c9 → 22c08988-f189-4965-8323-cd6c1ee5fb69


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## 78b37446-df5a-4145-8d4f-060c3971e635 — bfb19e47-93b1-4257-a4ac-f01560bee90b, wersja 1 (NAJNOWSZA)

Słów: 89. Odbiorca: kontakt@prodaut.pl. Zapis: 2026-10-13T12:35:26.420Z. Pochodzenie: GENERATED_DRAFT; poprzednia wersja: brak.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["To zapytanie do firmy bez potwierdzonego naboru. Płatność, pełna zdalność i możliwość pracy około 20 godzin tygodniowo po lekcjach pozostają do ustalenia.","Brak potwierdzonej rekrutacji; możliwość płatnej współpracy zdalnej około 20 godzin tygodniowo po lekcjach wymaga zapytania.","Requirements opisują działalność i technologie firmy, nie wymagania wakatu.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – integracje systemów**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam płatnej, regularnej współpracy przy tworzeniu oprogramowania.

Na Państwa stronie zwróciłem uwagę na integracje systemów oraz automatyzację powtarzalnych procesów. Mój projekt AutoRelay pozwala uruchamiać automatyzacje webhookami, ponawiać akcje HTTP i przeglądać historię wykonań. Przygotowałem go samodzielnie, wraz z panelem w React i workerem działającym w tle.

Mogę pracować w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo obecnie taką współpracę przy integracjach i automatyzacjach?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): 4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee. Hash kopii publicznej: 4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee. Redakcje: brak; tekst zachowany; hash całego payloadu: 87f747007a58f0e4cd3c583b5fcbbe89c5e34305a730bcf275a9bd1e0cf17720.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-codefabric, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam płatnej, regularnej współpracy przy tworzeniu oprogramowania. | CANDIDATE | fact-contract |  |
| Na Państwa stronie zwróciłem uwagę na integracje systemów oraz automatyzację powtarzalnych procesów. | COMPANY |  | ca15a927-b0dd-4b7b-bba9-bef79c9d2f27 → e82a6be2-6a9b-486f-ac45-6ae82b477a6c |
| Mój projekt AutoRelay pozwala uruchamiać automatyzacje webhookami, ponawiać akcje HTTP i przeglądać historię wykonań. | CANDIDATE | fact-autorelay |  |
| Przygotowałem go samodzielnie, wraz z panelem w React i workerem działającym w tle. | CANDIDATE | fact-autorelay |  |
| Mogę pracować w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach. | CANDIDATE | fact-availability |  |
| GitHub: https://github.com/JakubLewosz | CANDIDATE | fact-portfolio |  |

Dobór projektu faktycznie przekazany generatorowi i review:

~~~json
{
  "considered": [
    {
      "factId": "fact-autorelay",
      "project": "autorelay"
    },
    {
      "factId": "fact-codefabric",
      "project": "codefabric"
    },
    {
      "factId": "fact-elektroscan",
      "project": "elektroscan"
    }
  ],
  "selected": [
    {
      "fact": {
        "id": "fact-codefabric",
        "key": "codefabric",
        "content": "CodeFabric: ukończony samodzielny prototyp przygotowany podczas praktyk zawodowych w UKNF, później udoskonalany samodzielnie. Streamlit, LangGraph i modele Ollama; zatwierdzanie planów, generowanie i edycja plików, trwałe workspace, backupy i kontrola LLM. Projekt praktyk, nie oficjalny produkt UKNF."
      },
      "score": 14,
      "proofs": [
        {
          "sourceId": "8b80e1f3-9a62-4735-a16d-19bd83a6762d",
          "quote": "OCR do faktur, chatboty do obsługi klienta, agenci LLM do analiz.",
          "evidenceIds": [
            "f7d53c0d-4e71-4453-9c6e-90634bda8329"
          ]
        }
      ]
    },
    {
      "fact": {
        "id": "fact-autorelay",
        "key": "autorelay",
        "content": "AutoRelay: samodzielny projekt full-stack automatyzacji uruchamianych webhookami, z opcjonalnymi warunkami JSON, akcjami HTTP/Discord z ponawianiem, historią wykonań PostgreSQL, workerem w tle i panelem React. Wskazany w CV stack: Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, React, TypeScript, Docker Compose i GitHub Actions. Projekt portfolio."
      },
      "score": 13,
      "proofs": [
        {
          "sourceId": "e82a6be2-6a9b-486f-ac45-6ae82b477a6c",
          "quote": "Łączymy systemy, piszemy kod i automatyzujemy to, co powtarzalne",
          "evidenceIds": [
            "ca15a927-b0dd-4b7b-bba9-bef79c9d2f27"
          ]
        },
        {
          "sourceId": "e82a6be2-6a9b-486f-ac45-6ae82b477a6c",
          "quote": "Łączymy systemy, piszemy kod i automatyzujemy to, co powtarzalne",
          "evidenceIds": [
            "ca15a927-b0dd-4b7b-bba9-bef79c9d2f27"
          ]
        },
        {
          "sourceId": "e82a6be2-6a9b-486f-ac45-6ae82b477a6c",
          "quote": "Łączymy systemy, piszemy kod i automatyzujemy to, co powtarzalne",
          "evidenceIds": [
            "ca15a927-b0dd-4b7b-bba9-bef79c9d2f27"
          ]
        },
        {
          "sourceId": "7a179b49-6417-4c37-a5a4-174ea17ebc55",
          "quote": "Aplikacja React + Symfony wprost na Allegro REST API, bez pośrednika.",
          "evidenceIds": [
            "ac4444ae-3091-48a7-9172-cd466219c4b8"
          ]
        },
        {
          "sourceId": "8b80e1f3-9a62-4735-a16d-19bd83a6762d",
          "quote": "Do łączenia systemów i pracy w tle: kolejki zamówień, synchronizacje, powiadomienia.",
          "evidenceIds": [
            "f7d53c0d-4e71-4453-9c6e-90634bda8329"
          ]
        },
        {
          "sourceId": "7a179b49-6417-4c37-a5a4-174ea17ebc55",
          "quote": "Aplikacja React + Symfony wprost na Allegro REST API, bez pośrednika.",
          "evidenceIds": [
            "ac4444ae-3091-48a7-9172-cd466219c4b8"
          ]
        },
        {
          "sourceId": "5d71b735-ec54-4642-82ed-6c16f8038302",
          "quote": "warstwa w .NET 8 stoi obok Subiekta i pracuje na jego danych przez Sferę, a Node.js wystawia API dla aplikacji, portalu i chatbota.",
          "evidenceIds": [
            "dcd59bd0-a099-47aa-a4b6-8f098c1abbd7"
          ]
        },
        {
          "sourceId": "8b80e1f3-9a62-4735-a16d-19bd83a6762d",
          "quote": "Automatyzacja procesów dla firm - integracje, chatboty AI",
          "evidenceIds": [
            "f7d53c0d-4e71-4453-9c6e-90634bda8329"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: f7d53c0d-4e71-4453-9c6e-90634bda8329 → 8b80e1f3-9a62-4735-a16d-19bd83a6762d, 167bebe6-035f-49bb-93a8-5194f2226ff6 → f1fc8ce8-573e-46d7-b854-d6b94813b0c8, ac4444ae-3091-48a7-9172-cd466219c4b8 → 7a179b49-6417-4c37-a5a4-174ea17ebc55, ca15a927-b0dd-4b7b-bba9-bef79c9d2f27 → e82a6be2-6a9b-486f-ac45-6ae82b477a6c, dcd59bd0-a099-47aa-a4b6-8f098c1abbd7 → 5d71b735-ec54-4642-82ed-6c16f8038302


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |



## Firmy bez szkicu

- a078b7ec-5875-441e-afc3-43fc60d888cb (Assistron sp. z o.o.; assistron.pl): **niewygenerowany**. Niepotwierdzone lub wykluczone przeznaczenie adresu.; Firma do zapytania o współpracę. Rekrutacja i warunki niepotwierdzone..
- 86e40641-2a3f-47d6-b9a8-19e7e1c0703d (TwójSoftware; twojsoftware.pl): **niewygenerowany**. Brak zweryfikowanej, aktualnej podstawy działalności tej firmy do zapytania.; Firma do zapytania o współpracę. Rekrutacja i warunki niepotwierdzone..
- ea920540-bf05-4d92-b6cb-84c2abca47fa (Sprint0 sp. z o.o.; sprint0.pl): **niewygenerowany**. Brak zweryfikowanej, aktualnej podstawy działalności tej firmy do zapytania.; Firma do zapytania o współpracę. Rekrutacja i warunki niepotwierdzone..

## Historyczny materiał GOTOMA (osobny stary kontekst)

Nie jest to aktualny nowy wynik ani nowa generacja. Dokładny zachowany temat i tekst z oryginalnej diagnostyki:

Temat: **Zapytanie o współpracę – automatyzacja procesów**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej i piszę w związku z Państwa zaproszeniem do kontaktu na stronie kariery.

Na Państwa stronie zwróciłem uwagę na łączenie systemów i automatyzację powtarzalnych procesów. Mój projekt AutoRelay uruchamia automatyzacje przez webhooki, ponawia akcje HTTP i zapisuje historię wykonań. Zbudowałem go samodzielnie, wraz z panelem do obsługi automatyzacji.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo obecnie taką współpracę?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash: 52176d681fcfc5855197854731da74f005cd672f29d7532e08e36794bdf98f2e; stary contextHash: 7c7f84a7dfd2154db95b43b018a3eb9fd4ca94aff952bb48c60ff750615ac987.
