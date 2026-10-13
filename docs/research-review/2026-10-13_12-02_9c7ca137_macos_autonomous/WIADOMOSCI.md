# Zachowane wiadomości

Wysyłki: 0. Są to rzeczywiste wyniki generatora; pozytywna kontrola nie udziela zgody na kontakt. Kopie publiczne nie są poprawiane stylistycznie.

## 3fe75f1e-1492-4e3c-b2c0-5b0e92b6833e — bf74d19f-89f4-4bb7-8149-808b130686c5, wersja 1 (NAJNOWSZA)

Słów: 91. Odbiorca: praca@bizcode.pl. Generacja: 2026-10-13T10:25:41.382Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Otwarte kandydatury nie potwierdzają aktualnego wakatu. Pełna zdalność, około 20 godzin tygodniowo i praca po lekcjach wymagają uzgodnienia.","Typowe role nie potwierdzają bieżącego wakatu.","Pełna zdalność, około 20 godzin tygodniowo i praca po lekcjach wymagają uzgodnienia.","Rola juniorska nie potwierdza przyjmowania uczniów technikum."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – integracje systemów**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej. Piszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury.

Na Państwa stronie zwróciłem uwagę na integracje SAP Business One z innymi systemami klientów. Mój projekt AutoRelay umożliwia uruchamianie automatyzacji przez webhooki, ponawianie akcji HTTP i przeglądanie historii wykonań.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo współpracę z osobą o takim profilu i dostępności?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): be00026159e8f13113d3d7c79ffca237c2776f3a924b7c4890bb8d07c5b6db7f. Hash kopii publicznej: be00026159e8f13113d3d7c79ffca237c2776f3a924b7c4890bb8d07c5b6db7f. Redakcje: brak; tekst zachowany; hash całego payloadu: 16cbcfa74892efd7f9d4164121dd50e49607909c666eba729ea25faf1613d538.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam regularnej, płatnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
| Piszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury. | COMPANY |  | b5013c85-23ea-4f6c-bf62-141f9857f3b6 → 6b18df42-7d4b-42b6-8d9e-b9ea02a6cf77 |
| Na Państwa stronie zwróciłem uwagę na integracje SAP Business One z innymi systemami klientów. | COMPANY |  | b5013c85-23ea-4f6c-bf62-141f9857f3b6 → 6b18df42-7d4b-42b6-8d9e-b9ea02a6cf77 |
| Mój projekt AutoRelay umożliwia uruchamianie automatyzacji przez webhooki, ponawianie akcji HTTP i przeglądanie historii wykonań. | CANDIDATE | fact-autorelay |  |
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
          "sourceId": "6b18df42-7d4b-42b6-8d9e-b9ea02a6cf77",
          "quote": "Pracujemy z SAP Business One: wdrażamy system, tworzymy integracje i wspieramy użytkowników.",
          "evidenceIds": [
            "b5013c85-23ea-4f6c-bf62-141f9857f3b6"
          ]
        },
        {
          "sourceId": "6b18df42-7d4b-42b6-8d9e-b9ea02a6cf77",
          "quote": "Łączymy SAP Business One z innymi systemami klientów.",
          "evidenceIds": [
            "b5013c85-23ea-4f6c-bf62-141f9857f3b6"
          ]
        },
        {
          "sourceId": "6b18df42-7d4b-42b6-8d9e-b9ea02a6cf77",
          "quote": "Wdrożenia SAP B1, integracje i rozwój istniejących systemów.",
          "evidenceIds": [
            "b5013c85-23ea-4f6c-bf62-141f9857f3b6"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: b5013c85-23ea-4f6c-bf62-141f9857f3b6 → 6b18df42-7d4b-42b6-8d9e-b9ea02a6cf77, c2d0e85d-ff16-4272-bb98-c2b234f9d104 → e69fac04-1542-40b2-b425-cb7f7f8c52e6, da088dfe-1bbf-4c80-ad0b-145c1af5af5a → 7efd1049-a6a0-43d4-a0fe-3181f0ae1c8d, 5d365e65-48ac-4b97-bfa1-450273b7b407 → 0a0d7ba3-0b9d-448f-b6ef-463d459b3a0d, d716623d-2363-491f-8665-2d2cd6a01764 → 8f647632-c499-42b7-83d9-cc13b8c72165


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## e6268b7c-df01-4998-a4c8-dd2ba6e3f1fa — 863118e9-2669-4cd2-a2fd-48b832dfed2c, wersja 1 (NAJNOWSZA)

Słów: 117. Odbiorca: rekrutacja@oke.pl. Generacja: 2026-10-13T10:27:05.025Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Firma prosi o CV w języku angielskim.","Otwarte kandydatury nie potwierdzają konkretnego wakatu ani płatnej współpracy z uczniem technikum przez około 20 godzin tygodniowo, w pełni zdalnie i po lekcjach.","Brak terminu zamknięcia; stałe zaproszenie i sposób aplikowania potwierdzają OPEN, ale nie konkretny wakat.","Należy zapytać o pełną zdalność, płatną współpracę około 20 godzin tygodniowo po lekcjach oraz możliwość współpracy z uczniem technikum.","Daty zakończenia projektów R&D nie oznaczają zamknięcia otwartej kandydatury."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – narzędzia AI**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam płatnej, regularnej współpracy programistycznej w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury.

Na Państwa stronie zwróciłem uwagę na tworzenie prywatnych środowisk AI zapewniających zespołom dostęp do wiedzy. Mój projekt CodeFabric to samodzielny prototyp wykorzystujący lokalne modele językowe, z zatwierdzaniem planów oraz generowaniem i edycją plików. Przygotowałem go podczas praktyk zawodowych w UKNF, a później udoskonalałem samodzielnie. Przy pracy nad kodem korzystam z Codexa do planowania, implementacji i debugowania.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo współpracę z osobą o takim profilu i dostępności?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): 42ea4c0e48f67073bd7c648692ccd5a9cd4d355d9b3f5901c30cc4011f4bb477. Hash kopii publicznej: 42ea4c0e48f67073bd7c648692ccd5a9cd4d355d9b3f5901c30cc4011f4bb477. Redakcje: brak; tekst zachowany; hash całego payloadu: 7767b0b46c6627b53ba0602a361db70fa4b6de64094ab27129c65fecb4831609.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-codefabric, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam płatnej, regularnej współpracy programistycznej | CANDIDATE | fact-contract |  |
| przyjmują Państwo otwarte kandydatury | COMPANY |  | e885e734-56a7-40a8-8815-b60e82534792 → 6ff66b1c-8938-4787-b8a9-a7a2dd0f7357 |
| Na Państwa stronie zwróciłem uwagę na tworzenie prywatnych środowisk AI zapewniających zespołom dostęp do wiedzy. | COMPANY |  | 3b4b6778-79a1-4c18-add9-63abd5797916 → 8d99af38-7420-4845-9fcd-791982728aca |
| Mój projekt CodeFabric to samodzielny prototyp wykorzystujący lokalne modele językowe, z zatwierdzaniem planów oraz generowaniem i edycją plików. | CANDIDATE | fact-codefabric |  |
| Przygotowałem go podczas praktyk zawodowych w UKNF, a później udoskonalałem samodzielnie. | CANDIDATE | fact-codefabric |  |
| Przy pracy nad kodem korzystam z Codexa do planowania, implementacji i debugowania. | CANDIDATE | fact-ai |  |
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
        "id": "fact-codefabric",
        "key": "codefabric",
        "content": "CodeFabric: ukończony samodzielny prototyp przygotowany podczas praktyk zawodowych w UKNF, później udoskonalany samodzielnie. Streamlit, LangGraph i modele Ollama; zatwierdzanie planów, generowanie i edycja plików, trwałe workspace, backupy i kontrola LLM. Projekt praktyk, nie oficjalny produkt UKNF."
      },
      "score": 10,
      "proofs": [
        {
          "sourceId": "8d99af38-7420-4845-9fcd-791982728aca",
          "quote": "We build secure, private AI environments that empower internal teams with intelligent knowledge access while enabling customer-facing AI agents that enhance engagement and service performance.",
          "evidenceIds": [
            "3b4b6778-79a1-4c18-add9-63abd5797916"
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
      "score": 8,
      "proofs": [
        {
          "sourceId": "d4111905-4372-46a0-846f-1b0dc5b1c603",
          "quote": "The Chamberlain, which is the company's original project of home automation software, automates many household activities, alerts you when it detects danger and reduces electricity consumption.",
          "evidenceIds": [
            "63609dbd-e9d8-4200-bcbd-e94ab2db98d2"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: e885e734-56a7-40a8-8815-b60e82534792 → 6ff66b1c-8938-4787-b8a9-a7a2dd0f7357, 3b4b6778-79a1-4c18-add9-63abd5797916 → 8d99af38-7420-4845-9fcd-791982728aca, c030b712-45e0-42dd-8f9d-86084d9a6ad3 → 0e03a23e-c633-4e72-b4ef-a5f42d6fd9c9, c95b719c-d676-4050-b33a-885473a176f0 → c3e242a6-e584-4091-bb08-e01baf06b335, 63609dbd-e9d8-4200-bcbd-e94ab2db98d2 → d4111905-4372-46a0-846f-1b0dc5b1c603


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## f064cea4-6551-4e2f-b687-3707015c9f51 — db6b294b-069f-4c53-ae95-920ae0c84eda, wersja 1 (NAJNOWSZA)

Słów: 85. Odbiorca: kontakt@apifamily.pl. Generacja: 2026-10-13T10:28:13.937Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Brak potwierdzonego naboru. Wiadomość jest zapytaniem o współpracę; jej możliwość i warunki pozostają niepotwierdzone.","Brak potwierdzonego naboru; możliwość współpracy i wszystkie warunki wymagają zapytania.","Requirements opisują zadania i technologie firmy, nie wymagania nieistniejącego ogłoszenia.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – integracje i automatyzacja**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej.

Na Państwa stronie zwróciłem uwagę na integracje API oraz automatyzację procesów. Mój projekt AutoRelay umożliwia uruchamianie automatyzacji webhookami, ponawianie akcji HTTP i przeglądanie historii wykonań. Tworzyłem go samodzielnie jako aplikację full-stack z panelem w React i historią zapisywaną w PostgreSQL.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo obecnie możliwość takiej współpracy?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): 80f6cec1dd1e32f6a5da1a43b2d3407b91607647d093fc691bbdfe7105ba8520. Hash kopii publicznej: 80f6cec1dd1e32f6a5da1a43b2d3407b91607647d093fc691bbdfe7105ba8520. Redakcje: brak; tekst zachowany; hash całego payloadu: 8c8d28dcbc3812c46e48660fcf6e7b947432ed3b0b594134936c47a5b41cce5d.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam regularnej, płatnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
| Na Państwa stronie zwróciłem uwagę na integracje API oraz automatyzację procesów. | COMPANY |  | 8b1af0a4-8aa4-4e5f-9997-f099c9a46c62 → eccf7e1d-d573-4df0-a7fd-8244ce058f8e |
| Mój projekt AutoRelay umożliwia uruchamianie automatyzacji webhookami, ponawianie akcji HTTP i przeglądanie historii wykonań. | CANDIDATE | fact-autorelay |  |
| Tworzyłem go samodzielnie jako aplikację full-stack z panelem w React i historią zapisywaną w PostgreSQL. | CANDIDATE | fact-autorelay |  |
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
      "score": 13,
      "proofs": [
        {
          "sourceId": "eccf7e1d-d573-4df0-a7fd-8244ce058f8e",
          "quote": "Usługi programistyczne dla firm: dedykowane aplikacje webowe, systemy CRM i ERP, integracje API oraz automatyzacja procesów.",
          "evidenceIds": [
            "8b1af0a4-8aa4-4e5f-9997-f099c9a46c62"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 8b1af0a4-8aa4-4e5f-9997-f099c9a46c62 → eccf7e1d-d573-4df0-a7fd-8244ce058f8e, f3616ba4-dd45-40f9-b13e-b6fe4ae5348f → 3265436d-a642-4ccc-a9f4-b0f782b42b6f, 970b51f2-c448-44e6-9ea7-7981c2618c92 → 7b55bb90-0b0a-4c3a-ba9a-cb507bb263bd, 4024675c-4950-4407-9d7f-82f6c90299cc → 13563ae9-7386-440a-8054-1926e461e639, 750050c0-84d0-4dcf-b7d6-34d465124df4 → 31b9351e-4124-43a7-9e5f-6634f5439707


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## 4d269d9b-650e-4268-8171-043bd87579b0 — c5b7e59b-2336-4605-87b3-978eef81c005, wersja 1 (NAJNOWSZA)

Słów: 96. Odbiorca: kariera@transparentdata.pl. Generacja: 2026-10-13T10:29:46.675Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Nie potwierdzono możliwości współpracy z uczniem technikum przez około 20 godzin tygodniowo, głównie po lekcjach. Wiadomość pyta o jej możliwość.","Należy zapytać o około 20 godzin tygodniowo, pracę po lekcjach i możliwość współpracy z uczniem technikum.","Ogólne korzyści firmowe nie gwarantują warunków konkretnej współpracy."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – API i automatyzacje**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej. Piszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury.

Na Państwa stronie zwróciłem uwagę na budowanie API i agregowanie danych z różnych źródeł. Mój projekt AutoRelay to aplikacja do automatyzacji uruchamianych webhookami. Obsługuje akcje HTTP z ponawianiem oraz zapisuje historię wykonań w PostgreSQL.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo współpracę z osobą o takim profilu i dostępności?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): cb8b48395ed33696312d3d98253ba78ac9e128fe24b9c35e412f8b73414efd77. Hash kopii publicznej: cb8b48395ed33696312d3d98253ba78ac9e128fe24b9c35e412f8b73414efd77. Redakcje: brak; tekst zachowany; hash całego payloadu: 7695ee8c44e8b2e10c1757be199c3d24ab4db580c774eb7e07d8f80b3adca22f.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam regularnej, płatnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
| Piszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury. | COMPANY |  | 48f98b2f-5ca9-45ae-9a6b-2fc7d3a10b49 → 0a0c9d67-c12b-496d-a20a-38b32a3edfed |
| Na Państwa stronie zwróciłem uwagę na budowanie API i agregowanie danych z różnych źródeł. | COMPANY |  | d0f32766-614e-468c-9fa1-dba239ebbc6d → 4c529c88-69a5-4dea-8f59-e4a2adfc811c |
| Mój projekt AutoRelay to aplikacja do automatyzacji uruchamianych webhookami. Obsługuje akcje HTTP z ponawianiem oraz zapisuje historię wykonań w PostgreSQL. | CANDIDATE | fact-autorelay |  |
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
      "score": 5,
      "proofs": [
        {
          "sourceId": "4c529c88-69a5-4dea-8f59-e4a2adfc811c",
          "quote": "Od ponad dekady sami tworzymy własne platformy danych oceny ryzyka, budujemy API i agregujemy dane z rozmaitych trudnych źródeł.",
          "evidenceIds": [
            "d0f32766-614e-468c-9fa1-dba239ebbc6d"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 48f98b2f-5ca9-45ae-9a6b-2fc7d3a10b49 → 0a0c9d67-c12b-496d-a20a-38b32a3edfed, 4b42110f-a268-495e-889b-ca122ef39b89 → d3448008-bcf8-4aed-937c-d417cb711413, d0f32766-614e-468c-9fa1-dba239ebbc6d → 4c529c88-69a5-4dea-8f59-e4a2adfc811c, b8e0517c-0d54-4cb2-9e17-cd6747ae028c → f9e437b6-99bd-4b9d-8c4f-6586f4957bf0, 5f498038-83f8-4e8d-b380-2a23c90f1352 → ae3a4f5c-c6a2-4648-90da-e39b9b274eb2


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## c743b853-18d4-4e1c-8bd9-8e2cfdebe54c — 04fc5089-e8a4-4542-af8a-c14dc69af23e, wersja 1 (NAJNOWSZA)

Słów: 83. Odbiorca: kontakt@unseen.com.pl. Generacja: 2026-10-13T10:09:49.912Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["To zapytanie do firmy typu PROSPECT, nie zgłoszenie na potwierdzony wakat. Adres kontaktowy jest ogólny; rekrutacja i warunki współpracy pozostają niepotwierdzone.","Nie potwierdzono rekrutacji ani zgodności warunków z profilem; możliwe jest zapytanie o współpracę.","Requirements opisują zakres usług firmy, nie wymagania wakatu.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – integracje i aplikacje webowe**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej.

Na Państwa stronie zwróciłem uwagę na integracje systemów i automatyczny przepływ danych między nimi. Mój projekt AutoRelay pozwala uruchamiać automatyzacje webhookami, wykonywać akcje HTTP z ponawianiem oraz przeglądać historię wykonań. Zbudowałem go samodzielnie jako aplikację z panelem webowym.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo obecnie możliwość takiej współpracy?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): f9bdcbbcd09d05aa1c3a4f40447db2b7ca9a744fcdfc0e4736d9abada307a296. Hash kopii publicznej: f9bdcbbcd09d05aa1c3a4f40447db2b7ca9a744fcdfc0e4736d9abada307a296. Redakcje: brak; tekst zachowany; hash całego payloadu: 61d27a8ae64b4d6a312c02369c2f5484b562c3f15e88b7163bad5e90a12c37e6.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam regularnej, płatnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
| Na Państwa stronie zwróciłem uwagę na integracje systemów i automatyczny przepływ danych między nimi. | COMPANY |  | 4f92199c-5bd4-4939-990d-5c144521045f → a34f3ce8-37a6-4109-82a8-4e9ea821ad1c |
| Mój projekt AutoRelay pozwala uruchamiać automatyzacje webhookami, wykonywać akcje HTTP z ponawianiem oraz przeglądać historię wykonań. | CANDIDATE | fact-autorelay |  |
| Zbudowałem go samodzielnie jako aplikację z panelem webowym. | CANDIDATE | fact-autorelay |  |
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
      "score": 13,
      "proofs": [
        {
          "sourceId": "a34f3ce8-37a6-4109-82a8-4e9ea821ad1c",
          "quote": "Budujemy CRM, aplikacje webowe i integracje AI pod proces Twojej firmy.",
          "evidenceIds": [
            "4f92199c-5bd4-4939-990d-5c144521045f"
          ]
        },
        {
          "sourceId": "a34f3ce8-37a6-4109-82a8-4e9ea821ad1c",
          "quote": "Budujemy CRM, aplikacje webowe i integracje AI pod proces Twojej firmy.",
          "evidenceIds": [
            "4f92199c-5bd4-4939-990d-5c144521045f"
          ]
        },
        {
          "sourceId": "a34f3ce8-37a6-4109-82a8-4e9ea821ad1c",
          "quote": "Łączymy Twoje systemy w jeden ekosystem, w którym dane przepływają automatycznie.",
          "evidenceIds": [
            "4f92199c-5bd4-4939-990d-5c144521045f"
          ]
        },
        {
          "sourceId": "a34f3ce8-37a6-4109-82a8-4e9ea821ad1c",
          "quote": "Połączenia z innymi systemami (API)",
          "evidenceIds": [
            "4f92199c-5bd4-4939-990d-5c144521045f"
          ]
        },
        {
          "sourceId": "a34f3ce8-37a6-4109-82a8-4e9ea821ad1c",
          "quote": "Automatyzacja procesów z AI",
          "evidenceIds": [
            "4f92199c-5bd4-4939-990d-5c144521045f"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: e2ee2c0b-3109-4bcb-814c-03550f2a452c → e6a8db67-959a-427e-8612-bfbc4503ce81, e8a1cf4e-5f4e-438e-bd6a-36c8c998309a → 0d3fcd88-c113-467e-838c-745bb4757374, 4f92199c-5bd4-4939-990d-5c144521045f → a34f3ce8-37a6-4109-82a8-4e9ea821ad1c, b9a31c31-4ea2-4a38-9540-7d4ca57b5488 → a26e8dc4-1eef-4ebb-bb9c-974ee270689f


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## 60b85327-7da3-40dd-98a2-64b8cee067d9 — 0311f832-029d-456a-8ae5-9f77cf55bbd5, wersja 1 (NAJNOWSZA)

Słów: 81. Odbiorca: biuro@kastahouse.pl. Generacja: 2026-10-13T10:11:15.485Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Źródło potwierdza działalność firmy, ale nie nabór ani warunki współpracy; wiadomość jest zapytaniem.","Brak potwierdzonej rekrutacji; można zapytać o możliwość współpracy bez deklarowania zgodności warunków.","Deklaracje zdalności dotyczą działalności i obsługi klientów, a nie potwierdzonych warunków zatrudnienia.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – automatyzacja procesów**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam płatnej, regularnej współpracy przy tworzeniu oprogramowania.

Na Państwa stronie zwróciłem uwagę na łączenie codziennych narzędzi i automatyzację procesów. Mój projekt AutoRelay uruchamia automatyzacje przez webhooki, ponawia akcje HTTP i zapisuje historię wykonań. Stworzyłem go samodzielnie, wraz z panelem do obsługi automatyzacji.

Mogę pracować w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy obecnie rozważają Państwo taką współpracę?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): bca25368fce1dee0aabba1fddc52c1357c8f2a10e622ccf1402f0f38747f7efb. Hash kopii publicznej: bca25368fce1dee0aabba1fddc52c1357c8f2a10e622ccf1402f0f38747f7efb. Redakcje: brak; tekst zachowany; hash całego payloadu: e0362baf0f63e320e63be51df3f6a9d4cdb9435a991749fc4acc848f21b613b1.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam płatnej, regularnej współpracy przy tworzeniu oprogramowania. | CANDIDATE | fact-contract |  |
| Na Państwa stronie zwróciłem uwagę na łączenie codziennych narzędzi i automatyzację procesów. | COMPANY |  | 34b7f230-5cb8-4d20-8c50-9a0fcdd2c71d → 448cf993-c007-43e7-8ff7-744ac4d61a2a |
| Mój projekt AutoRelay uruchamia automatyzacje przez webhooki, ponawia akcje HTTP i zapisuje historię wykonań. Stworzyłem go samodzielnie, wraz z panelem do obsługi automatyzacji. | CANDIDATE | fact-autorelay |  |
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
        "id": "fact-autorelay",
        "key": "autorelay",
        "content": "AutoRelay: samodzielny projekt full-stack automatyzacji uruchamianych webhookami, z opcjonalnymi warunkami JSON, akcjami HTTP/Discord z ponawianiem, historią wykonań PostgreSQL, workerem w tle i panelem React. Wskazany w CV stack: Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, React, TypeScript, Docker Compose i GitHub Actions. Projekt portfolio."
      },
      "score": 8,
      "proofs": [
        {
          "sourceId": "448cf993-c007-43e7-8ff7-744ac4d61a2a",
          "quote": "Tworzymy dedykowane chatboty, konfigurujemy asystentów (Custom GPT), łączymy Wasze codzienne narzędzia w jeden ekosystem i automatyzujemy procesy w MS Office za pomocą makr VBA.",
          "evidenceIds": [
            "34b7f230-5cb8-4d20-8c50-9a0fcdd2c71d"
          ]
        },
        {
          "sourceId": "448cf993-c007-43e7-8ff7-744ac4d61a2a",
          "quote": "Tworzymy dedykowane chatboty, konfigurujemy asystentów (Custom GPT), łączymy Wasze codzienne narzędzia w jeden ekosystem i automatyzujemy procesy w MS Office za pomocą makr VBA.",
          "evidenceIds": [
            "34b7f230-5cb8-4d20-8c50-9a0fcdd2c71d"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 34b7f230-5cb8-4d20-8c50-9a0fcdd2c71d → 448cf993-c007-43e7-8ff7-744ac4d61a2a


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## 6a32f837-bfeb-4805-9ba6-d5e16d2f3e9e — 4c5bcd4b-6fa7-4075-b3cd-78223a30ed5e, wersja 1 (NAJNOWSZA)

Słów: 104. Odbiorca: kontakt@sprint0.pl. Generacja: 2026-10-13T10:12:54.549Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Ogólny kontakt firmy nie potwierdza rekrutacji ani przyjmowania otwartych kandydatur; wiadomość jest zapytaniem o współpracę.","Płatność, regularność, praca zdalna i proponowany wymiar godzin wymagają potwierdzenia przez firmę.","Brak potwierdzonej rekrutacji; kontakt stanowi podstawę zapytania o możliwość współpracy.","Warunki zgodne z dostępnością kandydata wymagają potwierdzenia przez firmę.","Requirements opisują technologie i zadania firmy, nie wymagania wakatu.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – lokalne modele językowe**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam płatnej, regularnej współpracy programistycznej.

Na Państwa stronie zwróciłem uwagę na wdrażanie lokalnych modeli językowych w infrastrukturze klientów. Mój projekt CodeFabric to samodzielny prototyp wykorzystujący modele Ollama, z zatwierdzaniem planów oraz generowaniem i edycją plików. Przygotowałem go podczas praktyk zawodowych w UKNF, a później samodzielnie udoskonalałem. Przy pracy nad kodem korzystam z Codexa do planowania, implementacji i testowania; uruchamiam, sprawdzam i poprawiam otrzymane rozwiązania.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy widzą Państwo obecnie możliwość takiej współpracy?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): d8a445dd7f529dd4214999a45fa9a20ff4600c5a8f72c25608e8252e8602c58f. Hash kopii publicznej: d8a445dd7f529dd4214999a45fa9a20ff4600c5a8f72c25608e8252e8602c58f. Redakcje: brak; tekst zachowany; hash całego payloadu: 91d20bd5193b4400dd1fa15c2c866687c07c0beb4e33edc451a34927d0dece80.

Generator otrzymał factIds: fact-ai, fact-availability, fact-codefabric, fact-contract, fact-education, fact-elektroscan, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam płatnej, regularnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
| Na Państwa stronie zwróciłem uwagę na wdrażanie lokalnych modeli językowych w infrastrukturze klientów. | COMPANY |  | 09ecdf01-fd2c-4f12-8a18-36e5aceb6cd4 → d2b264f0-9a60-44a9-8d02-6fe5a03ade6f, 6a17dab4-9e36-4432-a3fc-914b6b241a71 → ea70e909-4e37-4f62-9ebc-701c72b550d6 |
| Mój projekt CodeFabric to samodzielny prototyp wykorzystujący modele Ollama, z zatwierdzaniem planów oraz generowaniem i edycją plików. | CANDIDATE | fact-codefabric |  |
| Przygotowałem go podczas praktyk zawodowych w UKNF, a później samodzielnie udoskonalałem. | CANDIDATE | fact-codefabric |  |
| Przy pracy nad kodem korzystam z Codexa do planowania, implementacji i testowania; uruchamiam, sprawdzam i poprawiam otrzymane rozwiązania. | CANDIDATE | fact-ai |  |
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
        "id": "fact-codefabric",
        "key": "codefabric",
        "content": "CodeFabric: ukończony samodzielny prototyp przygotowany podczas praktyk zawodowych w UKNF, później udoskonalany samodzielnie. Streamlit, LangGraph i modele Ollama; zatwierdzanie planów, generowanie i edycja plików, trwałe workspace, backupy i kontrola LLM. Projekt praktyk, nie oficjalny produkt UKNF."
      },
      "score": 14,
      "proofs": [
        {
          "sourceId": "d2b264f0-9a60-44a9-8d02-6fe5a03ade6f",
          "quote": "Budujemy systemy AI (asystentów na dokumentach firmy, ekstrakcję danych, agenty), wdrażamy modele lokalnie w infrastrukturze klienta, szkolimy zespoły i tworzymy dedykowane CRM-y oraz integracje.",
          "evidenceIds": [
            "09ecdf01-fd2c-4f12-8a18-36e5aceb6cd4"
          ]
        },
        {
          "sourceId": "ea70e909-4e37-4f62-9ebc-701c72b550d6",
          "quote": "AI w Twojej infrastrukturze: lokalne modele językowe, środowiska air-gapped, zgodność z RODO, NIS2 i AI Act, zero-trust.",
          "evidenceIds": [
            "6a17dab4-9e36-4432-a3fc-914b6b241a71"
          ]
        }
      ]
    },
    {
      "fact": {
        "id": "fact-elektroscan",
        "key": "elektroscan",
        "content": "ElektroScan: projekt w dwuosobowym zespole, aplikacja webowa analizująca plany elektryczne w PDF, wykrywająca i zliczająca symbole oraz umożliwiająca ręczną kontrolę wyników. Współodpowiedzialność za backend, frontend, computer vision, testy i dokumentację. Publiczne repozytorium zawiera kod wcześniejszej wersji; znacznie ulepszona wersja jest rozwijana prywatnie."
      },
      "score": 7,
      "proofs": [
        {
          "sourceId": "d2b264f0-9a60-44a9-8d02-6fe5a03ade6f",
          "quote": "Python w warstwie modeli i przetwarzania danych. Architektura RAG dla asystentów na dokumentach, ekstrakcja danych z dokumentów, agenty z minimalnymi uprawnieniami.",
          "evidenceIds": [
            "09ecdf01-fd2c-4f12-8a18-36e5aceb6cd4"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 09ecdf01-fd2c-4f12-8a18-36e5aceb6cd4 → d2b264f0-9a60-44a9-8d02-6fe5a03ade6f, c06ee97f-e8fd-45dc-845a-975178cd217c → 6c174c5f-4b7c-4a08-8f7d-80deda49037e, 6a17dab4-9e36-4432-a3fc-914b6b241a71 → ea70e909-4e37-4f62-9ebc-701c72b550d6, b1c8ada4-ac37-4a7e-8adc-be55dd7fdb27 → d01542f7-0769-443e-9aec-347f3be0dff3


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## 0bce09d6-6cbb-45b5-9b7f-b57f729150ef — 636c677c-dac6-4f11-9343-da666c3dc712, wersja 1 (NAJNOWSZA)

Słów: 74. Odbiorca: kontakt@gwise.pl. Generacja: 2026-10-13T10:14:10.917Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Materiały potwierdzają działalność firmy, ale nie aktualny wakat ani przyjmowanie otwartych kandydatur. Szkic jest zapytaniem o współpracę.","Płatność, zdalność, wymiar i godziny współpracy pozostają niepotwierdzone po stronie firmy.","Brak potwierdzonego wakatu lub zaproszenia do otwartej kandydatury.","Warunki współpracy wymagają zapytania; źródła nie potwierdzają zgodności z dostępnością kandydata.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – integracje systemów**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam płatnej, regularnej współpracy przy tworzeniu oprogramowania.

Na Państwa stronie zwróciłem uwagę na łączenie systemów przez REST i webhooki. Mój projekt AutoRelay pozwala uruchamiać automatyzacje webhookami, ponawiać akcje HTTP i przeglądać historię wykonań.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy braliby Państwo obecnie pod uwagę taką współpracę?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): 6c7c8be8db137a2d0ac3d51912753212aab8ba32f2cf7e64eacebfd420992e25. Hash kopii publicznej: 6c7c8be8db137a2d0ac3d51912753212aab8ba32f2cf7e64eacebfd420992e25. Redakcje: brak; tekst zachowany; hash całego payloadu: 41c22cc1570e69b4457c234f6a4039c23bb8d396f14b8ed404c57f55d894b681.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam płatnej, regularnej współpracy przy tworzeniu oprogramowania. | CANDIDATE | fact-contract |  |
| Na Państwa stronie zwróciłem uwagę na łączenie systemów przez REST i webhooki. | COMPANY |  | 76fba60f-6232-4642-bffd-34172e1e1684 → 600cbf35-6317-4688-a2bd-d186a0af9c4b |
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
      "score": 13,
      "proofs": [
        {
          "sourceId": "600cbf35-6317-4688-a2bd-d186a0af9c4b",
          "quote": "Łączymy systemy, które nigdy ze sobą nie współpracowały. ERP, CRM, sklep, narzędzia branżowe - REST, webhooki, kolejki.",
          "evidenceIds": [
            "76fba60f-6232-4642-bffd-34172e1e1684"
          ]
        },
        {
          "sourceId": "600cbf35-6317-4688-a2bd-d186a0af9c4b",
          "quote": "Łączymy systemy, które nigdy ze sobą nie współpracowały. ERP, CRM, sklep, narzędzia branżowe - REST, webhooki, kolejki.",
          "evidenceIds": [
            "76fba60f-6232-4642-bffd-34172e1e1684"
          ]
        },
        {
          "sourceId": "600cbf35-6317-4688-a2bd-d186a0af9c4b",
          "quote": "Łączymy systemy, które nigdy ze sobą nie współpracowały. ERP, CRM, sklep, narzędzia branżowe - REST, webhooki, kolejki.",
          "evidenceIds": [
            "76fba60f-6232-4642-bffd-34172e1e1684"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 76fba60f-6232-4642-bffd-34172e1e1684 → 600cbf35-6317-4688-a2bd-d186a0af9c4b, b09b4843-e0fb-4971-977a-3b61974c7121 → 6ef2b7b6-549f-4fe3-9844-40acf942adae, d92c4d5c-1734-49af-8a19-71e3bcaa5bf1 → 572e18f7-7856-40be-803a-deb1d4a7ce48, cda8f396-1231-431c-aac4-173f07f095cc → 41568059-400a-4f17-bc0c-a91c1426712a, 1941f622-eaad-4efb-b88c-eb9f33f0339a → 0e570e6e-5748-4bb0-af91-0a2a6b9c3e41


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## 083b7821-13b3-4ce9-a709-aea934a4caf1 — 724a3c2e-b3c0-4aef-9b30-77937fab147d, wersja 1 (NAJNOWSZA)

Słów: 85. Odbiorca: info@tarosystems.pl. Generacja: 2026-10-13T10:16:28.481Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Źródło potwierdza działalność firmy, ale nie nabór. Wiadomość jest zapytaniem o współpracę.","Możliwość płatnej pracy zdalnej około 20 godzin tygodniowo, głównie po lekcjach, wymaga ustalenia z firmą.","Brak potwierdzonej rekrutacji; możliwe jest jedynie zapytanie o współpracę.","Zdalność, płatność, wymiar i dostępność po lekcjach wymagają ustalenia.","Requirements opisują realizowane zadania i technologie, nie wymagania wakatu.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – integracje i automatyzacje**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej przy integracjach i automatyzacjach.

Na Państwa stronie zwróciłem uwagę na łączenie odrębnych systemów i usprawnianie przepływu danych. Mój projekt AutoRelay pozwala uruchamiać automatyzacje webhookami, ponawiać akcje HTTP i przeglądać historię wykonań. Samodzielnie stworzyłem w nim także panel do obsługi automatyzacji.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo obecnie możliwość takiej współpracy?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): b33ad9edff10a4f25f31cca8f95d7b54e074c54685f99401627762057bd88dbd. Hash kopii publicznej: b33ad9edff10a4f25f31cca8f95d7b54e074c54685f99401627762057bd88dbd. Redakcje: brak; tekst zachowany; hash całego payloadu: fda27ee637decdbb253b056534cd22a565790f58fce6110c11011189e7cf2eda.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam regularnej, płatnej współpracy programistycznej przy integracjach i automatyzacjach. | CANDIDATE | fact-contract, fact-autorelay |  |
| Na Państwa stronie zwróciłem uwagę na łączenie odrębnych systemów i usprawnianie przepływu danych. | COMPANY |  | a80ad6cf-71b6-4ae0-a57d-c52e7d6e7f77 → 411bbed2-1db2-402d-87c4-6fcea10cbbd0 |
| Mój projekt AutoRelay pozwala uruchamiać automatyzacje webhookami, ponawiać akcje HTTP i przeglądać historię wykonań. | CANDIDATE | fact-autorelay |  |
| Samodzielnie stworzyłem w nim także panel do obsługi automatyzacji. | CANDIDATE | fact-autorelay |  |
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
          "sourceId": "411bbed2-1db2-402d-87c4-6fcea10cbbd0",
          "quote": "Integrujemy i łączymy odrębne systemy w spójną i wydajną całość, ze sprawnym przepływem danych.",
          "evidenceIds": [
            "a80ad6cf-71b6-4ae0-a57d-c52e7d6e7f77"
          ]
        },
        {
          "sourceId": "411bbed2-1db2-402d-87c4-6fcea10cbbd0",
          "quote": "Integrujemy i łączymy odrębne systemy w spójną i wydajną całość, ze sprawnym przepływem danych.",
          "evidenceIds": [
            "a80ad6cf-71b6-4ae0-a57d-c52e7d6e7f77"
          ]
        },
        {
          "sourceId": "411bbed2-1db2-402d-87c4-6fcea10cbbd0",
          "quote": "Backend: Laravel jako framework PHP do obsługi API oraz MySQL jako baza danych.",
          "evidenceIds": [
            "a80ad6cf-71b6-4ae0-a57d-c52e7d6e7f77"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: a80ad6cf-71b6-4ae0-a57d-c52e7d6e7f77 → 411bbed2-1db2-402d-87c4-6fcea10cbbd0


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## 74ec68dc-3f6b-42c6-8a5b-6e0b74e0a165 — 3899a239-ea41-4e60-b8c6-5a22fce2eca7, wersja 1 (NAJNOWSZA)

Słów: 91. Odbiorca: office@gotoma.pl. Generacja: 2026-10-13T10:17:53.289Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **false**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Strona kariery informuje o braku bieżących ogłoszeń, ale zawiera zaproszenie do kontaktu.","Nie potwierdzono płatnej współpracy w pełni zdalnej, około 20 godzin tygodniowo po lekcjach.","Podany adres jest kontaktem ogólnym; nie potwierdzono procedury przesyłania CV.","Brak konkretnego wakatu nie zamyka ogólnego zaproszenia do kontaktu.","Nie potwierdzono płatnej współpracy w pełni zdalnej, około 20 godzin tygodniowo po lekcjach.","Nie wskazano osobnego adresu rekrutacyjnego ani procedury przesyłania CV."],"material_issues":["DRAFT_MATERIAL_STALE"]}.

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

Hash tekstu oryginalnego (temat + LF + treść): 52176d681fcfc5855197854731da74f005cd672f29d7532e08e36794bdf98f2e. Hash kopii publicznej: 52176d681fcfc5855197854731da74f005cd672f29d7532e08e36794bdf98f2e. Redakcje: brak; tekst zachowany; hash całego payloadu: 2397fa1cc91eeabb0c6a5833de515a4cf6c8548004990a6e3d5c6c09be0a39af.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam regularnej, płatnej współpracy programistycznej | CANDIDATE | fact-contract |  |
| piszę w związku z Państwa zaproszeniem do kontaktu na stronie kariery. | COMPANY |  | ae53cb6b-b850-495b-99a9-e85bf521ef08 → f0116d03-dbf1-4f3e-adae-2ae987066ee1 |
| Na Państwa stronie zwróciłem uwagę na łączenie systemów i automatyzację powtarzalnych procesów. | COMPANY |  | addfbd35-4663-4f94-9e18-c9747c0f8bba → 388b9198-d178-4c70-b4f2-c26bb15c4ed4 |
| Mój projekt AutoRelay uruchamia automatyzacje przez webhooki, ponawia akcje HTTP i zapisuje historię wykonań. Zbudowałem go samodzielnie, wraz z panelem do obsługi automatyzacji. | CANDIDATE | fact-autorelay |  |
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
          "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
          "quote": "Łączymy systemy, z których korzysta Twoja firma, żeby dane nie musiały być przepisywane ręcznie.",
          "evidenceIds": [
            "addfbd35-4663-4f94-9e18-c9747c0f8bba"
          ]
        },
        {
          "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
          "quote": "Wdrażamy sprawdzone asystenty AI i automatyzacje wspierające sprzedaż, obsługę klienta, dokumenty i procesy biznesowe.",
          "evidenceIds": [
            "addfbd35-4663-4f94-9e18-c9747c0f8bba"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: addfbd35-4663-4f94-9e18-c9747c0f8bba → 388b9198-d178-4c70-b4f2-c26bb15c4ed4, 80e10ca0-7bce-4fa7-aa3d-9bc4dcec4c67 → 8ac42ad6-9267-44d6-bbc7-95521a8e0943, ae53cb6b-b850-495b-99a9-e85bf521ef08 → f0116d03-dbf1-4f3e-adae-2ae987066ee1, 0e6ea233-e5c2-412a-a950-92ced520023d → 741b6ced-857f-4a3e-a01e-38fc41162ac0, 1d417656-44c7-47f7-8c57-205c3cadc5ea → 7fe7818d-37aa-432b-98ed-511841870b59


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## 9ed0fd4d-5da2-403f-82ea-659912ef8158 — f8b97697-1942-4fdc-b2a4-24b9fa577d6c, wersja 1 (NAJNOWSZA)

Słów: 103. Odbiorca: biuro@jcd.pl. Generacja: 2026-10-13T10:19:31.128Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Nie potwierdzono rekrutacji ani otwartych kandydatur; szkic jest zapytaniem o współpracę.","Możliwość płatnej pracy w pełni zdalnej około 20 godzin tygodniowo, głównie po lekcjach, pozostaje niepotwierdzona.","Nie potwierdzono rekrutacji ani zaproszenia do przesłania CV.","Można zapytać o płatną współpracę zdalną około 20 godzin tygodniowo po lekcjach, lecz zgodność tych warunków pozostaje niepotwierdzona.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – narzędzia AI**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam płatnej, regularnej współpracy programistycznej przy narzędziach AI.

Na Państwa stronie zwróciłem uwagę na budowanie asystentów AI i wykorzystanie lokalnych modeli językowych. Mój projekt CodeFabric to samodzielny prototyp wykorzystujący lokalne modele, z zatwierdzaniem planów oraz generowaniem i edycją plików. Przygotowałem go podczas praktyk zawodowych w UKNF, a następnie samodzielnie udoskonalałem. Przy pracy nad kodem korzystam z Codexa do planowania, implementacji i debugowania.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy są Państwo obecnie otwarci na taką współpracę?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): 7d843cf2a3899031f49ca4f3c47585f16607c4d4a46c41346a7451bc9180d14f. Hash kopii publicznej: 7d843cf2a3899031f49ca4f3c47585f16607c4d4a46c41346a7451bc9180d14f. Redakcje: brak; tekst zachowany; hash całego payloadu: f9028ab89627c9b9c9d73712c3294aafc7b7d73812e66480171756bfdd6b4790.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-codefabric, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam płatnej, regularnej współpracy programistycznej przy narzędziach AI. | CANDIDATE | fact-contract, fact-codefabric |  |
| Na Państwa stronie zwróciłem uwagę na budowanie asystentów AI i wykorzystanie lokalnych modeli językowych. | COMPANY |  | 51b0da33-502d-4e49-bc9d-78ae22d3a3e7 → 2c4ed78d-14a3-4ddf-91ed-0128de940316 |
| Mój projekt CodeFabric to samodzielny prototyp wykorzystujący lokalne modele, z zatwierdzaniem planów oraz generowaniem i edycją plików. | CANDIDATE | fact-codefabric |  |
| Przygotowałem go podczas praktyk zawodowych w UKNF, a następnie samodzielnie udoskonalałem. | CANDIDATE | fact-codefabric |  |
| Przy pracy nad kodem korzystam z Codexa do planowania, implementacji i debugowania. | CANDIDATE | fact-ai |  |
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
        "id": "fact-codefabric",
        "key": "codefabric",
        "content": "CodeFabric: ukończony samodzielny prototyp przygotowany podczas praktyk zawodowych w UKNF, później udoskonalany samodzielnie. Streamlit, LangGraph i modele Ollama; zatwierdzanie planów, generowanie i edycja plików, trwałe workspace, backupy i kontrola LLM. Projekt praktyk, nie oficjalny produkt UKNF."
      },
      "score": 14,
      "proofs": [
        {
          "sourceId": "2c4ed78d-14a3-4ddf-91ed-0128de940316",
          "quote": "Szkolimy zespół, a potem budujemy asystentów AI, agentów i integracje.",
          "evidenceIds": [
            "51b0da33-502d-4e49-bc9d-78ae22d3a3e7"
          ]
        },
        {
          "sourceId": "2c4ed78d-14a3-4ddf-91ed-0128de940316",
          "quote": "AI łączymy przez API z modelami największych dostawców albo uruchamiamy lokalne modele językowe zgodne z RODO.",
          "evidenceIds": [
            "51b0da33-502d-4e49-bc9d-78ae22d3a3e7"
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
      "score": 8,
      "proofs": [
        {
          "sourceId": "49333c5f-567a-4865-81cb-20b8cfbd07db",
          "quote": "Łączymy systemy firmy i usuwamy ręczne przepisywanie danych . Automatyzujemy obieg dokumentów, raporty i powiadomienia. Tam, gdzie trzeba zrozumieć tekst, dokładamy AI.",
          "evidenceIds": [
            "e32c4cf3-42d3-4f5c-b13c-3e08f958339a"
          ]
        },
        {
          "sourceId": "2c4ed78d-14a3-4ddf-91ed-0128de940316",
          "quote": "Szkolimy zespół, a potem budujemy asystentów AI, agentów i integracje.",
          "evidenceIds": [
            "51b0da33-502d-4e49-bc9d-78ae22d3a3e7"
          ]
        },
        {
          "sourceId": "2c4ed78d-14a3-4ddf-91ed-0128de940316",
          "quote": "AI łączymy przez API z modelami największych dostawców albo uruchamiamy lokalne modele językowe zgodne z RODO.",
          "evidenceIds": [
            "51b0da33-502d-4e49-bc9d-78ae22d3a3e7"
          ]
        },
        {
          "sourceId": "49333c5f-567a-4865-81cb-20b8cfbd07db",
          "quote": "Łączymy systemy firmy i usuwamy ręczne przepisywanie danych . Automatyzujemy obieg dokumentów, raporty i powiadomienia.",
          "evidenceIds": [
            "e32c4cf3-42d3-4f5c-b13c-3e08f958339a"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 51b0da33-502d-4e49-bc9d-78ae22d3a3e7 → 2c4ed78d-14a3-4ddf-91ed-0128de940316, e32c4cf3-42d3-4f5c-b13c-3e08f958339a → 49333c5f-567a-4865-81cb-20b8cfbd07db, 72a25770-e46f-44b7-80dd-40aa7b233a73 → 09b81c51-6bfb-41ef-b185-a9ffcca4cff4, 953687a0-6974-4c42-9b5a-63e259970c92 → 078dbbf5-b16a-4345-8943-dc61e1c27021, c0c58ee3-2bdb-4756-8f9b-da3276ec65ac → ed939fa4-4d6c-4b5e-a400-07d4f6d12c5c


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |


## 0814e74b-a120-48cf-a4d6-3ccb43669072 — c767c024-4399-4575-81e2-f2588165a7cc, wersja 1 (NAJNOWSZA)

Słów: 95. Odbiorca: kontakt@tervyxa.pl. Generacja: 2026-10-13T10:22:46.714Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Źródła potwierdzają działalność firmy i kontakt ogólny, ale nie nabór. Wiadomość jest zapytaniem o współpracę.","Zdalność, płatność, wymiar i godziny współpracy po stronie firmy pozostają niepotwierdzone.","Brak potwierdzonej rekrutacji; możliwe jest zapytanie o współpracę bez obietnicy zgodności z profilem.","Zdalność, płatność, wymiar i godziny współpracy wymagają ustalenia.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."],"material_issues":[]}.

Temat: **Zapytanie o współpracę – integracje API**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Piszę z pytaniem o regularną, płatną współpracę programistyczną.

Na Państwa stronie zwróciłem uwagę na automatyzację procesów biznesowych i integracje API, a także projektowanie ponowień. Mój projekt AutoRelay uruchamia automatyzacje przez webhooki, ponawia akcje HTTP i zapisuje historię wykonań. Przy tworzeniu oprogramowania korzystam z Codexa do planowania, implementacji i testowania; uruchamiam, sprawdzam i poprawiam otrzymane rozwiązania.

Mogę pracować w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy widzą Państwo obecnie możliwość takiej współpracy?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): 2b9a800f5ddf7a1a835127327738a4a9135b8dea5550db2abfb9bdd58607bac1. Hash kopii publicznej: 2b9a800f5ddf7a1a835127327738a4a9135b8dea5550db2abfb9bdd58607bac1. Redakcje: brak; tekst zachowany; hash całego payloadu: 36f583af406b0ac4804d9d19a4ad5ca21d3a420e45e48a8a27e80a0628ecd535.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Piszę z pytaniem o regularną, płatną współpracę programistyczną. | CANDIDATE | fact-contract |  |
| Na Państwa stronie zwróciłem uwagę na automatyzację procesów biznesowych i integracje API, a także projektowanie ponowień. | COMPANY |  | b9aba505-1b6e-45dc-aa81-3cd2499b5f99 → d3f7025c-f6ff-42a8-ac3c-9296b269fb2f |
| Mój projekt AutoRelay uruchamia automatyzacje przez webhooki, ponawia akcje HTTP i zapisuje historię wykonań. | CANDIDATE | fact-autorelay |  |
| Przy tworzeniu oprogramowania korzystam z Codexa do planowania, implementacji i testowania; uruchamiam, sprawdzam i poprawiam otrzymane rozwiązania. | CANDIDATE | fact-ai |  |
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
        "id": "fact-autorelay",
        "key": "autorelay",
        "content": "AutoRelay: samodzielny projekt full-stack automatyzacji uruchamianych webhookami, z opcjonalnymi warunkami JSON, akcjami HTTP/Discord z ponawianiem, historią wykonań PostgreSQL, workerem w tle i panelem React. Wskazany w CV stack: Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, React, TypeScript, Docker Compose i GitHub Actions. Projekt portfolio."
      },
      "score": 13,
      "proofs": [
        {
          "sourceId": "d3f7025c-f6ff-42a8-ac3c-9296b269fb2f",
          "quote": "Tervyxa Systems projektuje systemy AI dla firm, automatyzację procesów biznesowych, dedykowane oprogramowanie, integracje API i infrastrukturę AI.",
          "evidenceIds": [
            "b9aba505-1b6e-45dc-aa81-3cd2499b5f99"
          ]
        },
        {
          "sourceId": "d3f7025c-f6ff-42a8-ac3c-9296b269fb2f",
          "quote": "Tervyxa Systems projektuje systemy AI dla firm, automatyzację procesów biznesowych, dedykowane oprogramowanie, integracje API i infrastrukturę AI.",
          "evidenceIds": [
            "b9aba505-1b6e-45dc-aa81-3cd2499b5f99"
          ]
        },
        {
          "sourceId": "d3f7025c-f6ff-42a8-ac3c-9296b269fb2f",
          "quote": "Tervyxa Systems projektuje systemy AI dla firm, automatyzację procesów biznesowych, dedykowane oprogramowanie, integracje API i infrastrukturę AI.",
          "evidenceIds": [
            "b9aba505-1b6e-45dc-aa81-3cd2499b5f99"
          ]
        },
        {
          "sourceId": "d3f7025c-f6ff-42a8-ac3c-9296b269fb2f",
          "quote": "Rozdzielamy to, co powinno być regułą, kodem, integracją lub AI.",
          "evidenceIds": [
            "b9aba505-1b6e-45dc-aa81-3cd2499b5f99"
          ]
        },
        {
          "sourceId": "d3f7025c-f6ff-42a8-ac3c-9296b269fb2f",
          "quote": "Tervyxa Systems projektuje systemy AI dla firm, automatyzację procesów biznesowych, dedykowane oprogramowanie, integracje API i infrastrukturę AI.",
          "evidenceIds": [
            "b9aba505-1b6e-45dc-aa81-3cd2499b5f99"
          ]
        },
        {
          "sourceId": "d3f7025c-f6ff-42a8-ac3c-9296b269fb2f",
          "quote": "SYSTEMY AI I AUTOMATYZACJA,\nKTÓRE WYKONUJĄ PRACĘ.",
          "evidenceIds": [
            "b9aba505-1b6e-45dc-aa81-3cd2499b5f99"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: b9aba505-1b6e-45dc-aa81-3cd2499b5f99 → d3f7025c-f6ff-42a8-ac3c-9296b269fb2f, db6079f0-e413-4e46-bd7c-11276992ad6e → b2d536e8-c038-4833-9dd5-9fe483cb1a06


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |



## Firmy bez szkicu

- 83174621-938f-4fc6-a066-39efe1329f13 (Take Group Sp. z o.o.; takegroup.pl): **niewygenerowany**. Niepotwierdzone lub wykluczone przeznaczenie adresu.; remote: yes — Oferta potwierdza pełną pracę zdalną w Polsce.; partTime: no — Wakat przewiduje pełny etat zamiast około 20 godzin tygodniowo.; hours: no — Stałe godziny 9:00–17:00 nie odpowiadają dostępności głównie po lekcjach..
- bb66efc4-1dda-496a-88b7-9a8c85572d1b (Softech.app; softech.app): **niewygenerowany**. Niepotwierdzone lub wykluczone przeznaczenie adresu.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- a1967e85-07bb-4e60-beb8-f23f32c486be (SolutionSpace; solutionspace.pl): **niewygenerowany**. Niepotwierdzone lub wykluczone przeznaczenie adresu.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- 8cf2f751-4fa6-4b4f-8b5f-05a3deac4a88 (React Poland; reactpoland.com): **niewygenerowany**. Brak osobnego dowodu działalności programistycznej do zapytania.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- 202d91de-849f-4bec-95c9-cd7ad776411e (Just Site sp. z o.o.; justsite.pl): **niewygenerowany**. Niepotwierdzone lub wykluczone przeznaczenie adresu.; Firma do zapytania o współpracę. Rekrutacja i warunki niepotwierdzone..
- 79daf458-8ab4-44e7-8eeb-5c7c26eac5db (PRODAUT Sp. z o.o.; prodaut.pl): **niewygenerowany**. Brak osobnego dowodu działalności programistycznej do zapytania.; Firma do zapytania o współpracę. Rekrutacja i warunki niepotwierdzone..
- 3b7dffc5-01fc-4e0a-b6f5-dc8e25ef14df (TOBIT sp. z o.o.; tobit.pl): **niewygenerowany**. Niepotwierdzone lub wykluczone przeznaczenie adresu.; Firma do zapytania o współpracę. Rekrutacja i warunki niepotwierdzone..

## Wersje historyczne kontrolnych firm

Poniższe wersje pozostają historyczne, poza licznikami nowych wersji. Ich source/evidence IDs odnoszą się do [poprzedniego pakietu](../2026-10-13_08-10_macos-01a133d7/README.md). Zachowano tematy, treści, hashe i kontrole.

## c4c94e3e-bfe2-4f65-b3bf-f323792def40 — 5ce4a1fd-1c4f-4766-8907-c2068dc474a8, wersja 1

Odbiorca: praca@bizcode.pl. Generacja: 2026-10-13T06:42:14.819Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Otwarte kandydatury nie potwierdzają aktualnego wakatu; strona zachęca do zapytania o aktualny nabór.","Pełna zdalność, około 20 godzin tygodniowo i praca po lekcjach wymagają uzgodnienia z firmą.","Opisane role są typowe; brak potwierdzenia aktualnego wakatu i terminów naboru.","Pełna zdalność, około 20 godzin tygodniowo oraz praca po lekcjach wymagają uzgodnienia.","Studia wskazano jako atut; uczeń technikum nie jest studentem uczelni."]}.

Temat: **Zapytanie o współpracę – integracje systemów biznesowych**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej. Piszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury.

Na Państwa stronie zwróciłem uwagę na aplikacje webowe i usługi API oraz wymianę danych między SAP Business One a innymi systemami biznesowymi. Mój projekt AutoRelay służy do automatyzacji uruchamianych webhookami. Samodzielnie stworzyłem w nim obsługę opcjonalnych warunków JSON, akcje HTTP i Discord z ponawianiem oraz historię wykonań zapisywaną w PostgreSQL. Projekt obejmuje również worker działający w tle i panel w React oraz TypeScript. Część serwerową oparłem na Pythonie i FastAPI, a do obsługi bazy wykorzystałem SQLAlchemy i Alembic. W projekcie korzystam też z Docker Compose i GitHub Actions.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo współpracę z osobą o takim profilu i dostępności?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): fc1494ae4b87b33725676e14cad13113b1081203bf1dd88dc4491933ff3de8ea. Hash kopii publicznej: fc1494ae4b87b33725676e14cad13113b1081203bf1dd88dc4491933ff3de8ea. Redakcje: brak; tekst zachowany; hash całego payloadu: e23e2ee670d576ab7bf76cc1c2e92fb886378228f5b94aed1c7d0fb08ba07f66.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam regularnej, płatnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
| Piszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury. | COMPANY |  | c782cced-58df-4fbb-b316-3a9358779421 → f6d7204c-412e-4e61-b220-9653eb8c228d |
| Na Państwa stronie zwróciłem uwagę na aplikacje webowe i usługi API oraz wymianę danych między SAP Business One a innymi systemami biznesowymi. | COMPANY |  | 71c91c97-7d9d-4ef6-b2c4-4ffb94010ba0 → db8c5632-dcfe-4033-aa5f-aca8849f04d9 |
| Mój projekt AutoRelay służy do automatyzacji uruchamianych webhookami. Samodzielnie stworzyłem w nim obsługę opcjonalnych warunków JSON, akcje HTTP i Discord z ponawianiem oraz historię wykonań zapisywaną w PostgreSQL. Projekt obejmuje również worker działający w tle i panel w React oraz TypeScript. Część serwerową oparłem na Pythonie i FastAPI, a do obsługi bazy wykorzystałem SQLAlchemy i Alembic. W projekcie korzystam też z Docker Compose i GitHub Actions. | CANDIDATE | fact-autorelay |  |
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
          "sourceId": "db8c5632-dcfe-4033-aa5f-aca8849f04d9",
          "quote": "Dodatki do SAP Business One, aplikacje webowe i usługi API. Tworzymy rozwiązania dla uzgodnionych potrzeb, których nie pokrywa standardowy system.",
          "evidenceIds": [
            "71c91c97-7d9d-4ef6-b2c4-4ffb94010ba0"
          ]
        },
        {
          "sourceId": "db8c5632-dcfe-4033-aa5f-aca8849f04d9",
          "quote": "Dodatki do SAP Business One, aplikacje webowe i usługi API.",
          "evidenceIds": [
            "71c91c97-7d9d-4ef6-b2c4-4ffb94010ba0"
          ]
        },
        {
          "sourceId": "db8c5632-dcfe-4033-aa5f-aca8849f04d9",
          "quote": "Wymiana danych między SAP B1 a e-commerce, CRM, systemami magazynowymi lub KSeF.",
          "evidenceIds": [
            "71c91c97-7d9d-4ef6-b2c4-4ffb94010ba0"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: c782cced-58df-4fbb-b316-3a9358779421 → f6d7204c-412e-4e61-b220-9653eb8c228d, 2a371d40-4288-4d4b-b35f-b84e6cf751c9 → 1ff4a283-a87f-444c-8708-91cc532c135b, 71c91c97-7d9d-4ef6-b2c4-4ffb94010ba0 → db8c5632-dcfe-4033-aa5f-aca8849f04d9, a22c0b4e-f011-44fa-9acb-25638f9acd17 → 7e62cc8a-1165-4559-be72-97e3b399462e


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |
| 2026-10-13T06:43:57.919Z | BEFORE_CAPACITY_REVIEW_REPLAY | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:44:05.802Z | AFTER_CAPACITY_REVIEW_REPLAY | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:44:05.840Z | FINAL_CONTROL_CORRECTION | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |

## acc0f11b-5510-44d8-a2c9-ca16442583c4 — e86aa203-3759-43f3-8868-6945c83f4c34, wersja 1

Odbiorca: rekrutacja@oke.pl. Generacja: 2026-10-13T06:19:33.155Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Szkic jest krótszy niż 150 słów: brak zatwierdzonego opisu dopasowanego projektu, a wydłużenie wymagałoby powtórzeń lub wypełniaczy.","Otwarte kandydatury nie potwierdzają konkretnego wakatu ani zgodności warunków. Odpłatność, pełna zdalność, około 20 godzin tygodniowo po lekcjach i możliwość współpracy z uczniem technikum wymagają ustalenia.","Dla mieszkańców Trójmiasta wskazano: „For the residents of Tricity, hybrid type of work”.","Brak daty publikacji, terminu i informacji o zamknięciu; zaproszenie jest również wymienione na stronie Careers.","Przed ustaleniem zgodności trzeba potwierdzić odpłatność, pełną zdalność, około 20 godzin tygodniowo po lekcjach oraz możliwość współpracy z uczniem technikum."]}.

Temat: **Zapytanie o współpracę programistyczną – Jakub Lewosz**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej. Piszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury.

Na Państwa stronie zwróciłem uwagę na tworzenie prywatnych środowisk AI, które pomagają zespołom korzystać z wiedzy, oraz agentów obsługujących klientów. Przy tworzeniu oprogramowania korzystam z Codexa: podczas planowania, implementacji, debugowania, testowania i dokumentowania. Otrzymane rozwiązania uruchamiam, sprawdzam i poprawiam. Zainteresował mnie również opis Państwa pracy nad aplikacjami webowymi i mobilnymi, obejmującej ich projektowanie, rozwój, wdrażanie i utrzymanie.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy rozważają Państwo współpracę z uczniem technikum o takim profilu i dostępności?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): 6ec954613fa0796189c285998c79a735ad31178386f201ea8b131c07e48d2be9. Hash kopii publicznej: 6ec954613fa0796189c285998c79a735ad31178386f201ea8b131c07e48d2be9. Redakcje: brak; tekst zachowany; hash całego payloadu: 437fead32782cd1e1ba3cea7c34d508a3a2fee2c2e521be15e1e1e827a4923a0.

Generator otrzymał factIds: fact-ai, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam regularnej, płatnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
| Piszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury. | COMPANY |  | 5aad2236-aca9-42b3-9142-b0eb6c6233ac → 3a3109a3-b8d4-4269-8c60-f53bef8173b5 |
| Na Państwa stronie zwróciłem uwagę na tworzenie prywatnych środowisk AI, które pomagają zespołom korzystać z wiedzy, oraz agentów obsługujących klientów. | COMPANY |  | b6fa679b-e713-4a82-9a5b-9ee736ad92d3 → ee745a04-1f5e-49a0-8488-00ef100c3731 |
| Przy tworzeniu oprogramowania korzystam z Codexa: podczas planowania, implementacji, debugowania, testowania i dokumentowania. Otrzymane rozwiązania uruchamiam, sprawdzam i poprawiam. | CANDIDATE | fact-ai |  |
| Zainteresował mnie również opis Państwa pracy nad aplikacjami webowymi i mobilnymi, obejmującej ich projektowanie, rozwój, wdrażanie i utrzymanie. | COMPANY |  | 646a5413-0093-41da-9de3-c4f7c6e7b9c5 → 9aa62051-6870-4052-8cd6-c89be6432592 |
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
  "selected": [],
  "reason": "NO_PROJECT_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 5aad2236-aca9-42b3-9142-b0eb6c6233ac → 3a3109a3-b8d4-4269-8c60-f53bef8173b5, b6fa679b-e713-4a82-9a5b-9ee736ad92d3 → ee745a04-1f5e-49a0-8488-00ef100c3731, 646a5413-0093-41da-9de3-c4f7c6e7b9c5 → 9aa62051-6870-4052-8cd6-c89be6432592, dafa9d06-fea8-4053-a48d-85ea1378b2fd → 3afea193-db00-42df-a1de-7bb23934c3c6, 99f9a690-6fe4-4670-9f82-6dfc130f066d → 2983fa3f-7275-465d-bda2-2caa95a12e33


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |
| 2026-10-13T06:39:57.621Z | SNAPSHOT_BEFORE_CORRECTION | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:43:57.919Z | BEFORE_CAPACITY_REVIEW_REPLAY | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:44:05.802Z | AFTER_CAPACITY_REVIEW_REPLAY | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:44:05.840Z | FINAL_CONTROL_CORRECTION | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |


## acc0f11b-5510-44d8-a2c9-ca16442583c4 — e86aa203-3759-43f3-8868-6945c83f4c34, wersja 2

Odbiorca: rekrutacja@oke.pl. Generacja: 2026-10-13T06:42:58.396Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Otwarte kandydatury nie potwierdzają konkretnego aktualnego wakatu; w dostarczonych treściach brak daty publikacji i terminu zamknięcia.","Odpłatność, pełna zdalność, około 20 godzin tygodniowo po lekcjach oraz możliwość współpracy z uczniem technikum wymagają potwierdzenia.","Strona wskazuje CV w języku angielskim; szkic nie deklaruje dołączenia CV.","Dla mieszkańców Trójmiasta wskazano: „For the residents of Tricity, hybrid type of work”.","Brak daty publikacji, terminu i informacji o zamknięciu; zaproszenie jest również wymienione na stronie Careers.","Przed ustaleniem zgodności trzeba potwierdzić odpłatność, pełną zdalność, około 20 godzin tygodniowo po lekcjach oraz możliwość współpracy z uczniem technikum."]}.

Temat: **Zapytanie o współpracę – prywatne środowiska AI**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam płatnej, regularnej współpracy programistycznej. Kontaktuję się z Państwem w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury.

Na Państwa stronie zwróciłem uwagę na tworzenie prywatnych środowisk AI dla zespołów wewnętrznych oraz agentów obsługujących klientów. Mój projekt CodeFabric to samodzielny prototyp wykorzystujący lokalne modele językowe Ollama, Streamlit i LangGraph. Przygotowałem go podczas praktyk zawodowych w UKNF, a później samodzielnie udoskonalałem. Obejmuje zatwierdzanie planów, generowanie i edycję plików, trwałe przestrzenie robocze oraz kopie zapasowe. Przy tworzeniu oprogramowania korzystam z Codexa do planowania, implementacji, debugowania, testowania i dokumentowania. Uruchamiam, sprawdzam i poprawiam otrzymane rozwiązania.

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

Czy wśród otwartych kandydatur biorą Państwo pod uwagę osobę o moim profilu i takiej dostępności?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): 9be4b898217d7d418784ec93df00ca4b8952536d15dc4f5a418a68305d7ad6f6. Hash kopii publicznej: 9be4b898217d7d418784ec93df00ca4b8952536d15dc4f5a418a68305d7ad6f6. Redakcje: brak; tekst zachowany; hash całego payloadu: e7d81e07994e9a5bfd00b6922d5146ef125b320275d8c48b3ab829d50bf0c94a.

Generator otrzymał factIds: fact-ai, fact-availability, fact-codefabric, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam płatnej, regularnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
| Kontaktuję się z Państwem w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury. | COMPANY |  | 5aad2236-aca9-42b3-9142-b0eb6c6233ac → 3a3109a3-b8d4-4269-8c60-f53bef8173b5 |
| Na Państwa stronie zwróciłem uwagę na tworzenie prywatnych środowisk AI dla zespołów wewnętrznych oraz agentów obsługujących klientów. | COMPANY |  | b6fa679b-e713-4a82-9a5b-9ee736ad92d3 → ee745a04-1f5e-49a0-8488-00ef100c3731 |
| Mój projekt CodeFabric to samodzielny prototyp wykorzystujący lokalne modele językowe Ollama, Streamlit i LangGraph. Przygotowałem go podczas praktyk zawodowych w UKNF, a później samodzielnie udoskonalałem. Obejmuje zatwierdzanie planów, generowanie i edycję plików, trwałe przestrzenie robocze oraz kopie zapasowe. | CANDIDATE | fact-codefabric |  |
| Przy tworzeniu oprogramowania korzystam z Codexa do planowania, implementacji, debugowania, testowania i dokumentowania. Uruchamiam, sprawdzam i poprawiam otrzymane rozwiązania. | CANDIDATE | fact-ai |  |
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
        "id": "fact-codefabric",
        "key": "codefabric",
        "content": "CodeFabric: ukończony samodzielny prototyp przygotowany podczas praktyk zawodowych w UKNF, później udoskonalany samodzielnie. Streamlit, LangGraph i modele Ollama; zatwierdzanie planów, generowanie i edycja plików, trwałe workspace, backupy i kontrola LLM. Projekt praktyk, nie oficjalny produkt UKNF."
      },
      "score": 10,
      "proofs": [
        {
          "sourceId": "ee745a04-1f5e-49a0-8488-00ef100c3731",
          "quote": "We build secure, private AI environments that empower internal teams with intelligent knowledge access while enabling customer-facing AI agents that enhance engagement and service performance.",
          "evidenceIds": [
            "b6fa679b-e713-4a82-9a5b-9ee736ad92d3"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 5aad2236-aca9-42b3-9142-b0eb6c6233ac → 3a3109a3-b8d4-4269-8c60-f53bef8173b5, b6fa679b-e713-4a82-9a5b-9ee736ad92d3 → ee745a04-1f5e-49a0-8488-00ef100c3731, 646a5413-0093-41da-9de3-c4f7c6e7b9c5 → 9aa62051-6870-4052-8cd6-c89be6432592, dafa9d06-fea8-4053-a48d-85ea1378b2fd → 3afea193-db00-42df-a1de-7bb23934c3c6, 99f9a690-6fe4-4670-9f82-6dfc130f066d → 2983fa3f-7275-465d-bda2-2caa95a12e33


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |
| 2026-10-13T06:43:57.919Z | BEFORE_CAPACITY_REVIEW_REPLAY | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:44:05.802Z | AFTER_CAPACITY_REVIEW_REPLAY | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:44:05.840Z | FINAL_CONTROL_CORRECTION | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |

## a1efc801-8df8-4197-98bc-1f220b5fd82a — 4f8aaa69-338a-4684-a5cf-7bd54fc44ffa, wersja 1

Odbiorca: kontakt@apifamily.pl. Generacja: 2026-10-13T06:36:01.192Z.

Kod: **PASS**; review: **COMPLETED**, supported=true. Pełne przejście kontroli: **true**.

Uwagi: {"code_error":null,"review_error":null,"review":{"supported":true,"issues":[]},"warnings":["Brak potwierdzonego naboru. Szkic jest zapytaniem o współpracę; wynagrodzenie, zdalność, wymiar i godziny pracy po stronie firmy pozostają niepotwierdzone.","Brak potwierdzonego naboru; możliwe jest zapytanie o współpracę bez obiecywania zgodności warunków.","Opis outsourcingu dotyczy usług dla klientów, nie zatrudniania programistów.","Requirements opisują działalność i technologie firmy, nie wymagania wakatu.","Zapytanie o współpracę: rekrutacja i warunki niepotwierdzone; kontakt ogólny może wymagać przekierowania."]}.

Temat: **Zapytanie o współpracę – aplikacje webowe i API**

~~~text
Dzień dobry,

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam płatnej, regularnej współpracy przy tworzeniu oprogramowania. Piszę do Państwa ze względu na opisane na stronie integracje API i automatyzację procesów.

Na Państwa stronie zwróciłem uwagę na automatyzacje z logami, ponawianiem zadań i alertami. Mój projekt AutoRelay uruchamia automatyzacje przez webhooki, obsługuje opcjonalne warunki JSON oraz akcje HTTP i Discord z ponawianiem. Historię wykonań zapisuje w PostgreSQL, a panel w React pozwala ją przeglądać. To samodzielny projekt full-stack z workerem działającym w tle; wykorzystałem w nim także Python, FastAPI i TypeScript. Przy tworzeniu oprogramowania korzystam z Codexa do planowania, implementacji, debugowania, testowania i dokumentowania. Otrzymane rozwiązania uruchamiam, sprawdzam i poprawiam.

Mogę pracować w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach. Zależy mi na regularnej, płatnej współpracy programistycznej.

Czy rozważają Państwo obecnie możliwość współpracy w takim wymiarze i godzinach?

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz
~~~

Hash tekstu oryginalnego (temat + LF + treść): 5ba25478c102eff2bed306e3c633ea96bbcb1212ad043c97818e37a53f4699f7. Hash kopii publicznej: 5ba25478c102eff2bed306e3c633ea96bbcb1212ad043c97818e37a53f4699f7. Redakcje: brak; tekst zachowany; hash całego payloadu: 3963d43bb712cef205b7ecb5c33b1d5732098140f7357854200dcbfd9a6c739d.

Generator otrzymał factIds: fact-ai, fact-autorelay, fact-availability, fact-contract, fact-education, fact-identity, fact-portfolio.

| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |
| --- | --- | --- | --- |
| Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. | CANDIDATE | fact-identity, fact-education |  |
| Szukam płatnej, regularnej współpracy przy tworzeniu oprogramowania. | CANDIDATE | fact-contract |  |
| Piszę do Państwa ze względu na opisane na stronie integracje API i automatyzację procesów. | COMPANY |  | 1a12494a-f31f-4f44-82f1-25213ddf9e75 → 6d5d9f7b-5f55-4eb9-93e6-0798bd825fff |
| Na Państwa stronie zwróciłem uwagę na automatyzacje z logami, ponawianiem zadań i alertami. | COMPANY |  | c81e5b8c-84de-4f5a-bee0-dc9884e9f025 → 46d0f64d-8ebe-4456-afb6-53c66471039d |
| Mój projekt AutoRelay uruchamia automatyzacje przez webhooki, obsługuje opcjonalne warunki JSON oraz akcje HTTP i Discord z ponawianiem. | CANDIDATE | fact-autorelay |  |
| Historię wykonań zapisuje w PostgreSQL, a panel w React pozwala ją przeglądać. | CANDIDATE | fact-autorelay |  |
| To samodzielny projekt full-stack z workerem działającym w tle; wykorzystałem w nim także Python, FastAPI i TypeScript. | CANDIDATE | fact-autorelay |  |
| Przy tworzeniu oprogramowania korzystam z Codexa do planowania, implementacji, debugowania, testowania i dokumentowania. Otrzymane rozwiązania uruchamiam, sprawdzam i poprawiam. | CANDIDATE | fact-ai |  |
| Mogę pracować w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach. | CANDIDATE | fact-availability |  |
| Zależy mi na regularnej, płatnej współpracy programistycznej. | CANDIDATE | fact-contract |  |
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
      "score": 13,
      "proofs": [
        {
          "sourceId": "6d5d9f7b-5f55-4eb9-93e6-0798bd825fff",
          "quote": "Usługi programistyczne dla firm: dedykowane aplikacje webowe, systemy CRM i ERP, integracje API oraz automatyzacja procesów.",
          "evidenceIds": [
            "1a12494a-f31f-4f44-82f1-25213ddf9e75"
          ]
        },
        {
          "sourceId": "46d0f64d-8ebe-4456-afb6-53c66471039d",
          "quote": "Automatyzacja powinna być cicha wtedy, gdy działa, i głośna wtedy, gdy się nie udało. Dlatego każde zadanie ma log, ponawianie i alert do konkretnej osoby — a nie „chyba się nie wykonało\".",
          "evidenceIds": [
            "c81e5b8c-84de-4f5a-bee0-dc9884e9f025"
          ]
        },
        {
          "sourceId": "46d0f64d-8ebe-4456-afb6-53c66471039d",
          "quote": "To warstwa, która musi przetrwać awarię cudzego API, zmianę wersji, limity zapytań i dane w nieoczekiwanym formacie — i nie zgubić przy tym ani jednego zamówienia.",
          "evidenceIds": [
            "c81e5b8c-84de-4f5a-bee0-dc9884e9f025"
          ]
        }
      ]
    }
  ],
  "reason": "VERIFIED_TASK_MATCH"
}
~~~

Generator otrzymał evidenceIds → sourceIds: 1a12494a-f31f-4f44-82f1-25213ddf9e75 → 6d5d9f7b-5f55-4eb9-93e6-0798bd825fff, c441292c-82ea-4673-91b5-276acb03427c → 89a11005-3728-4cbe-b50d-b1c35db4b519, c81e5b8c-84de-4f5a-bee0-dc9884e9f025 → 46d0f64d-8ebe-4456-afb6-53c66471039d


Historia kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):

| Czas | Etap | Kod | Review | code_id |
| --- | --- | --- | --- | --- |
| 2026-10-13T06:39:57.621Z | SNAPSHOT_BEFORE_CORRECTION | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:43:57.919Z | BEFORE_CAPACITY_REVIEW_REPLAY | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:44:05.802Z | AFTER_CAPACITY_REVIEW_REPLAY | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
| 2026-10-13T06:44:05.840Z | FINAL_CONTROL_CORRECTION | PASS: brak | COMPLETED: {"supported":true,"issues":[]} | 8eb62d9b3028b37aeaf42d01fd448b412bef0065e10f347390d24b6671e2b77f |
