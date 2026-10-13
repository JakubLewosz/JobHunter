# Spójność dowodów, reanalizy i materiałów

Rodzaje dowodów są odrębne: oryginalne zapisane zwalidowane analizy/teksty źródeł; deterministyczne fixture; offline replay na spójnej kopii z jawnie fikcyjnym reviewerem; świeży PUBLIC_HTTP i rzeczywisty Codex tej rundy. Surowe odpowiedzi CLI i oryginalny HTML dawnych odczytów nie były zachowane; nie przedstawiamy rekonstrukcji jako odzyskanych oryginałów. Oryginalnej bazy ani historycznych raportów nie zmieniono.

## gotoma.pl

Przed: pierwszy szkic miał pozytywną kontrolę, druga ekstrakcja zgubiła inquiryBasis.

Dokładnie odtworzono stary hash: true. Zmieniły się qualification i sources; zestaw wersji źródeł był identyczny, kolejność kontakt/kariera inna. Wyszukiwarka zwróciła ponownie ten sam root URL, z innym contactUrl. Cache porównywał JSON source_ids w kolejności, więc uruchomił EXTRACT; zapis kwalifikacji nadpisał dane, a generate zakończyło się przed naprawą, bo kontakt stał się REJECTED. materialBinding zablokował nieaktualny pakiet prawidłowo. Nie zmienił się tekst witryny w użytym cache.

Oryginalne zachowane analizy i znaczące różnice (bez pełnych witryn):

~~~json
{
  "kind": "ORIGINAL_SAVED_VALIDATED_ANALYSES",
  "analyses": [
    {
      "itemId": "4aa44cca-1516-403e-990b-6da315bb22dc",
      "runId": "51d9165b-fa8f-437c-9a3c-34c4d6047c18",
      "url": "https://gotoma.pl/",
      "companyId": "74ec68dc-3f6b-42c6-8a5b-6e0b74e0a165",
      "opportunityId": "65d805e7-197f-478d-aba5-9211cbab1be7",
      "sourceIds": [
        "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
        "8ac42ad6-9267-44d6-bbc7-95521a8e0943",
        "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
        "741b6ced-857f-4a3e-a01e-38fc41162ac0",
        "7fe7818d-37aa-432b-98ed-511841870b59"
      ],
      "analysis": {
        "company": "GOTOMA Software House",
        "companyProof": {
          "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
          "quote": "Aplikacje, strony i sklepy internetowe | GOTOMA Software House",
          "explanation": "Tytuł strony potwierdza nazwę firmy."
        },
        "companyURL": "https://gotoma.pl/",
        "title": "Otwarta kandydatura",
        "titleProof": {
          "sourceId": null,
          "quote": null,
          "explanation": "Etykieta rodzaju kontaktu; bez deklarowanego wakatu."
        },
        "type": "OPEN",
        "typeProof": {
          "sourceId": "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
          "quote": "Jeśli cenisz sobie wysoki standard pracy, chcesz zachować równowagę między życiem zawodowym i prywatnym oraz czujesz, że praca w IT jest dla ciebie, to zapraszamy do kontaktu.",
          "explanation": "Firma zaprasza do kontaktu w sprawie dołączenia do zespołu mimo braku ogłoszeń."
        },
        "inquiryBasis": {
          "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
          "quote": "Projektujemy i rozwijamy aplikacje webowe dopasowane do procesów Twojej firmy.",
          "explanation": "Firma prowadzi działalność programistyczną."
        },
        "conditions": {
          "remote": {
            "sourceId": null,
            "quote": null,
            "explanation": "Brak informacji o pracy w pełni zdalnej.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "partTime": {
            "sourceId": null,
            "quote": null,
            "explanation": "Brak informacji o współpracy na część etatu.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "paid": {
            "sourceId": null,
            "quote": null,
            "explanation": "Brak informacji o wynagrodzeniu kandydatów.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "junior": {
            "sourceId": "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
            "quote": "Naszą firmę tworzą ludzie, dlatego nieustannie poszukujemy kolejnych osób, które dołączą do naszego profesjonalnego zespołu jako stażyści, programiści aplikacji internetowych, DevOpsi czy inżynierowie ds. jakości.",
            "explanation": "Firma zaprasza również stażystów, ale nie potwierdza osobno przyjmowania uczniów technikum.",
            "value": "yes",
            "scope": "COMPANY"
          },
          "hours": {
            "sourceId": null,
            "quote": null,
            "explanation": "Brak potwierdzenia około 20 godzin tygodniowo i pracy po lekcjach.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "contract": {
            "sourceId": null,
            "quote": null,
            "explanation": "Profil nie wymaga konkretnej umowy. Wymienione formy pozostają informacją firmy; akceptacja i dostępność do ustalenia.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "active": {
            "sourceId": "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
            "quote": "Niestety wygląda na to, że obecnie nie ma żadnych ogłoszeń 🙁",
            "explanation": "Strona kariery jawnie informuje o braku bieżących ogłoszeń.",
            "value": "no",
            "scope": "COMPANY"
          },
          "openInquiry": {
            "sourceId": "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
            "quote": "Jeśli cenisz sobie wysoki standard pracy, chcesz zachować równowagę między życiem zawodowym i prywatnym oraz czujesz, że praca w IT jest dla ciebie, to zapraszamy do kontaktu.",
            "explanation": "Zaproszenie do kontaktu pozostaje dostępne mimo braku konkretnych ofert.",
            "value": "yes",
            "scope": "COMPANY"
          }
        },
        "companyActivities": [
          {
            "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
            "quote": "Projektujemy i rozwijamy aplikacje webowe dopasowane do procesów Twojej firmy.",
            "explanation": "Firma tworzy i rozwija aplikacje webowe."
          },
          {
            "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
            "quote": "Automatyzujemy powtarzalne procesy w firmie, żeby zespół mógł skupić się na pracy wymagającej decyzji.",
            "explanation": "Firma automatyzuje procesy biznesowe."
          },
          {
            "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
            "quote": "Łączymy systemy, z których korzysta Twoja firma, żeby dane nie musiały być przepisywane ręcznie.",
            "explanation": "Firma realizuje integracje międzysystemowe."
          },
          {
            "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
            "quote": "Wdrażamy sprawdzone asystenty AI i automatyzacje wspierające sprzedaż, obsługę klienta, dokumenty i procesy biznesowe.",
            "explanation": "Firma wdraża asystentów AI i automatyzacje."
          }
        ],
        "requirements": [],
        "contact": {
          "email": "office@gotoma.pl",
          "kind": "GENERAL",
          "proof": {
            "sourceId": "8ac42ad6-9267-44d6-bbc7-95521a8e0943",
            "quote": "office@gotoma.pl",
            "explanation": "To publiczny adres ogólny firmy, bez przypisania do rekrutacji."
          }
        },
        "warnings": [
          "Brak konkretnego wakatu nie zamyka ogólnego zaproszenia do kontaktu.",
          "Nie potwierdzono płatnej współpracy w pełni zdalnej, około 20 godzin tygodniowo po lekcjach.",
          "Nie wskazano osobnego adresu rekrutacyjnego ani procedury przesyłania CV."
        ]
      }
    },
    {
      "itemId": "d1abea74-8860-4a13-9d4a-005283df88ca",
      "runId": "f8b29eec-5a5a-4a58-bcd3-b455c0a53659",
      "url": "https://gotoma.pl/",
      "companyId": "74ec68dc-3f6b-42c6-8a5b-6e0b74e0a165",
      "opportunityId": "65d805e7-197f-478d-aba5-9211cbab1be7",
      "sourceIds": [
        "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
        "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
        "8ac42ad6-9267-44d6-bbc7-95521a8e0943",
        "741b6ced-857f-4a3e-a01e-38fc41162ac0",
        "7fe7818d-37aa-432b-98ed-511841870b59"
      ],
      "analysis": {
        "company": "GOTOMA Software House",
        "companyProof": {
          "sourceId": "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
          "quote": "Kariera | GOTOMA Software House",
          "explanation": "Tytuł strony potwierdza nazwę firmy."
        },
        "companyURL": "https://gotoma.pl/",
        "title": "Otwarta kandydatura",
        "titleProof": {
          "sourceId": null,
          "quote": null,
          "explanation": "Etykieta rodzaju kontaktu; bez deklarowanego wakatu."
        },
        "type": "OPEN",
        "typeProof": {
          "sourceId": "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
          "quote": "Naszą firmę tworzą ludzie, dlatego nieustannie poszukujemy kolejnych osób, które dołączą do naszego profesjonalnego zespołu jako stażyści, programiści aplikacji internetowych, DevOpsi czy inżynierowie ds. jakości.",
          "explanation": "Firma zaprasza do kontaktu kandydatów mimo braku konkretnych ogłoszeń."
        },
        "inquiryBasis": null,
        "conditions": {
          "remote": {
            "sourceId": null,
            "quote": null,
            "explanation": "Nie podano możliwości w pełni zdalnej pracy.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "partTime": {
            "sourceId": null,
            "quote": null,
            "explanation": "Nie potwierdzono współpracy na część etatu ani około 20 godzin tygodniowo.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "paid": {
            "sourceId": null,
            "quote": null,
            "explanation": "Nie podano wynagrodzenia ani odpłatności stażu lub współpracy.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "junior": {
            "sourceId": "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
            "quote": "Naszą firmę tworzą ludzie, dlatego nieustannie poszukujemy kolejnych osób, które dołączą do naszego profesjonalnego zespołu jako stażyści, programiści aplikacji internetowych, DevOpsi czy inżynierowie ds. jakości.",
            "explanation": "Zaproszenie obejmuje stażystów, ale nie potwierdza przyjmowania uczniów technikum.",
            "value": "yes",
            "scope": "COMPANY"
          },
          "hours": {
            "sourceId": null,
            "quote": null,
            "explanation": "Nie określono godzin pracy ani dostępności po lekcjach.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "contract": {
            "sourceId": null,
            "quote": null,
            "explanation": "Profil nie wymaga konkretnej umowy. Wymienione formy pozostają informacją firmy; akceptacja i dostępność do ustalenia.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "active": {
            "sourceId": "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
            "quote": "Niestety wygląda na to, że obecnie nie ma żadnych ogłoszeń 🙁",
            "explanation": "Strona kariery jawnie informuje o braku bieżących ogłoszeń.",
            "value": "no",
            "scope": "COMPANY"
          },
          "openInquiry": {
            "sourceId": "f0116d03-dbf1-4f3e-adae-2ae987066ee1",
            "quote": "Jeśli cenisz sobie wysoki standard pracy, chcesz zachować równowagę między życiem zawodowym i prywatnym oraz czujesz, że praca w IT jest dla ciebie, to zapraszamy do kontaktu.",
            "explanation": "Firma pozostawia otwarte zaproszenie do kontaktu w sprawie dołączenia do zespołu.",
            "value": "yes",
            "scope": "COMPANY"
          }
        },
        "companyActivities": [
          {
            "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
            "quote": "Projektujemy i rozwijamy aplikacje webowe dopasowane do procesów Twojej firmy.",
            "explanation": "Firma tworzy i rozwija aplikacje webowe."
          },
          {
            "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
            "quote": "Automatyzujemy powtarzalne procesy w firmie, żeby zespół mógł skupić się na pracy wymagającej decyzji.",
            "explanation": "Firma automatyzuje procesy biznesowe."
          },
          {
            "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
            "quote": "Łączymy systemy, z których korzysta Twoja firma, żeby dane nie musiały być przepisywane ręcznie.",
            "explanation": "Firma realizuje integracje międzysystemowe."
          },
          {
            "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
            "quote": "Wdrażamy sprawdzone asystenty AI i automatyzacje wspierające sprzedaż, obsługę klienta, dokumenty i procesy biznesowe.",
            "explanation": "Firma wdraża asystentów AI i automatyzacje."
          }
        ],
        "requirements": [],
        "contact": {
          "email": "office@gotoma.pl",
          "kind": "GENERAL",
          "proof": {
            "sourceId": "8ac42ad6-9267-44d6-bbc7-95521a8e0943",
            "quote": "Znajdź nas!\n\nul. Mikołaja Reja 22\n33-300 Nowy Sącz\nPolska\n\noffice@gotoma.pl",
            "explanation": "Adres jest publicznym kontaktem ogólnym, bez przypisania do rekrutacji."
          }
        },
        "warnings": [
          "Brak bieżących ogłoszeń nie zamyka udokumentowanego zaproszenia do kontaktu.",
          "Należy zapytać o płatną, w pełni zdalną współpracę około 20 godzin tygodniowo po lekcjach oraz możliwość współpracy z uczniem technikum.",
          "Nie wskazano osobnego adresu rekrutacyjnego ani sposobu przesłania CV."
        ]
      }
    }
  ],
  "binding": {
    "reconstructedOld": "7c7f84a7dfd2154db95b43b018a3eb9fd4ca94aff952bb48c60ff750615ac987",
    "savedOld": "7c7f84a7dfd2154db95b43b018a3eb9fd4ca94aff952bb48c60ff750615ac987",
    "oldHashExactlyReconstructed": true,
    "current": "33db63e4ad2671dd90d05c91c24e301597e49d3e5e6b9763234776d3235f2245",
    "changedFields": [
      "qualification",
      "sources"
    ],
    "analysisDifferences": [
      {
        "path": "companyProof.sourceId",
        "before": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
        "after": "f0116d03-dbf1-4f3e-adae-2ae987066ee1"
      },
      {
        "path": "companyProof.quote",
        "before": "Aplikacje, strony i sklepy internetowe | GOTOMA Software House",
        "after": "Kariera | GOTOMA Software House"
      },
      {
        "path": "typeProof.quote",
        "before": "Jeśli cenisz sobie wysoki standard pracy, chcesz zachować równowagę między życiem zawodowym i prywatnym oraz czujesz, że praca w IT jest dla ciebie, to zapraszamy do kontaktu.",
        "after": "Naszą firmę tworzą ludzie, dlatego nieustannie poszukujemy kolejnych osób, które dołączą do naszego profesjonalnego zespołu jako stażyści, programiści aplikacji internetowych, DevOpsi czy inżynierowie ds. jakości."
      },
      {
        "path": "typeProof.explanation",
        "before": "Firma zaprasza do kontaktu w sprawie dołączenia do zespołu mimo braku ogłoszeń.",
        "after": "Firma zaprasza do kontaktu kandydatów mimo braku konkretnych ogłoszeń."
      },
      {
        "path": "inquiryBasis",
        "before": {
          "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
          "quote": "Projektujemy i rozwijamy aplikacje webowe dopasowane do procesów Twojej firmy.",
          "explanation": "Firma prowadzi działalność programistyczną."
        },
        "after": null
      },
      {
        "path": "conditions.remote.explanation",
        "before": "Brak informacji o pracy w pełni zdalnej.",
        "after": "Nie podano możliwości w pełni zdalnej pracy."
      },
      {
        "path": "conditions.partTime.explanation",
        "before": "Brak informacji o współpracy na część etatu.",
        "after": "Nie potwierdzono współpracy na część etatu ani około 20 godzin tygodniowo."
      },
      {
        "path": "conditions.paid.explanation",
        "before": "Brak informacji o wynagrodzeniu kandydatów.",
        "after": "Nie podano wynagrodzenia ani odpłatności stażu lub współpracy."
      },
      {
        "path": "conditions.junior.explanation",
        "before": "Firma zaprasza również stażystów, ale nie potwierdza osobno przyjmowania uczniów technikum.",
        "after": "Zaproszenie obejmuje stażystów, ale nie potwierdza przyjmowania uczniów technikum."
      },
      {
        "path": "conditions.hours.explanation",
        "before": "Brak potwierdzenia około 20 godzin tygodniowo i pracy po lekcjach.",
        "after": "Nie określono godzin pracy ani dostępności po lekcjach."
      },
      {
        "path": "conditions.openInquiry.explanation",
        "before": "Zaproszenie do kontaktu pozostaje dostępne mimo braku konkretnych ofert.",
        "after": "Firma pozostawia otwarte zaproszenie do kontaktu w sprawie dołączenia do zespołu."
      },
      {
        "path": "contact.proof.quote",
        "before": "office@gotoma.pl",
        "after": "Znajdź nas!\n\nul. Mikołaja Reja 22\n33-300 Nowy Sącz\nPolska\n\noffice@gotoma.pl"
      },
      {
        "path": "contact.proof.explanation",
        "before": "To publiczny adres ogólny firmy, bez przypisania do rekrutacji.",
        "after": "Adres jest publicznym kontaktem ogólnym, bez przypisania do rekrutacji."
      },
      {
        "path": "warnings",
        "before": [
          "Brak konkretnego wakatu nie zamyka ogólnego zaproszenia do kontaktu.",
          "Nie potwierdzono płatnej współpracy w pełni zdalnej, około 20 godzin tygodniowo po lekcjach.",
          "Nie wskazano osobnego adresu rekrutacyjnego ani procedury przesyłania CV."
        ],
        "after": [
          "Brak bieżących ogłoszeń nie zamyka udokumentowanego zaproszenia do kontaktu.",
          "Należy zapytać o płatną, w pełni zdalną współpracę około 20 godzin tygodniowo po lekcjach oraz możliwość współpracy z uczniem technikum.",
          "Nie wskazano osobnego adresu rekrutacyjnego ani sposobu przesłania CV."
        ]
      }
    ],
    "sameSourceSet": true,
    "sourceOrderChanged": true,
    "allSourceVersionsReused": true
  },
  "selected_from_saved_proofs": {
    "policyVersion": 1,
    "field": "companyActivities",
    "proof": {
      "sourceId": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
      "quote": "Projektujemy i rozwijamy aplikacje webowe dopasowane do procesów Twojej firmy.",
      "explanation": "Firma tworzy i rozwija aplikacje webowe."
    },
    "sourceVersion": {
      "id": "388b9198-d178-4c70-b4f2-c26bb15c4ed4",
      "contentHash": "23a4e4c9920cae1e351f06dc802988994031b4dd8319a4253a50c77032c61597",
      "parserVersion": 2,
      "fetchedAt": "2026-10-13T10:16:34.225Z"
    },
    "evidenceIds": [
      "addfbd35-4663-4f94-9e18-c9747c0f8bba"
    ],
    "reason": "VERIFIED_COMPANY_ACTIVITY_FALLBACK"
  }
}
~~~

Replay: [{"id":"3899a239-ea41-4e60-b8c6-5a22fce2eca7","company":"GOTOMA Software House","version":2,"textHash":"52176d681fcfc5855197854731da74f005cd672f29d7532e08e36794bdf98f2e","supported":true,"issues":[]}]. Jest to kontrola kodowa z fikcyjnym reviewerem, nie rzeczywisty semantyczny PASS.

Świeża próba: FULLY_CHECKED; GENERAL/GENERAL_INQUIRY; aktualna decyzja READY_COMPANY_INQUIRY; powód kontrole zakończone. To nowy odczyt i nie dowodzi identyczności dawnej strony.

Materiał cf74c59d-9b87-45c0-a7db-3ba93e9e0767:1: GENERATED_DRAFT, poprzednia wersja brak, textHash d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4, checked true.

~~~json
[
  {
    "step": 1,
    "at": "2026-10-13T12:33:45.970Z",
    "row": {
      "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
      "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
      "company": "GOTOMA Software House",
      "version": 1,
      "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
      "supported": true,
      "issues": []
    }
  },
  {
    "step": 2,
    "at": "2026-10-13T12:35:37.734Z",
    "row": {
      "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
      "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
      "company": "GOTOMA Software House",
      "version": 1,
      "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
      "supported": true,
      "issues": []
    }
  },
  {
    "step": 3,
    "at": "2026-10-13T12:37:03.738Z",
    "row": {
      "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
      "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
      "company": "GOTOMA Software House",
      "version": 1,
      "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
      "supported": true,
      "issues": []
    }
  },
  {
    "step": 4,
    "at": "2026-10-13T12:39:30.399Z",
    "row": {
      "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
      "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
      "company": "GOTOMA Software House",
      "version": 1,
      "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
      "supported": true,
      "issues": []
    }
  },
  {
    "step": 5,
    "at": "2026-10-13T12:41:30.516Z",
    "row": {
      "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
      "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
      "company": "GOTOMA Software House",
      "version": 1,
      "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
      "supported": true,
      "issues": []
    }
  },
  {
    "step": 6,
    "at": "2026-10-13T12:41:30.558Z",
    "row": {
      "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
      "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
      "company": "GOTOMA Software House",
      "version": 1,
      "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
      "supported": true,
      "issues": []
    }
  }
]
~~~

## prodaut.pl

Przed: istniało poprawne inquiryBasis, ale PROSPECT wybierał typeProof bez pasującej reguły językowej.

Oryginalne zachowane analizy i znaczące różnice (bez pełnych witryn):

~~~json
{
  "kind": "ORIGINAL_SAVED_VALIDATED_ANALYSES",
  "analyses": [
    {
      "itemId": "1ad45a43-0c54-47b4-b580-e2b76551f1ad",
      "runId": "f8b29eec-5a5a-4a58-bcd3-b455c0a53659",
      "url": "https://www.prodaut.pl/",
      "companyId": "79daf458-8ab4-44e7-8eeb-5c7c26eac5db",
      "opportunityId": "2a8dcf61-9c60-4053-af4a-4a97d3e14ce9",
      "sourceIds": [
        "7513e1b9-441c-471a-9d43-896784e20d61",
        "184b61b6-7124-4e54-96f0-21882d59105e",
        "ddc9b821-1fe2-4de1-841d-0dc9fbcebbdd",
        "d0dccf81-de29-4d92-8fc9-05f5495e946d",
        "a23461e8-c84d-47c5-b8c7-a10e93653cee"
      ],
      "analysis": {
        "company": "PRODAUT Sp. z o.o.",
        "companyProof": {
          "sourceId": "184b61b6-7124-4e54-96f0-21882d59105e",
          "quote": "PRODAUT Sp. z o.o.",
          "explanation": "Nazwa firmy podana w danych rejestrowych."
        },
        "companyURL": "https://www.prodaut.pl/",
        "title": "APLIKACJE",
        "titleProof": {
          "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
          "quote": "APLIKACJE\n\nWeb · Mobile · Dedicated\n\nDedykowane aplikacje webowe i mobilne, budowane pod konkretny proces biznesowy.",
          "explanation": "Nagłówek opisuje usługę firmy, nie stanowisko."
        },
        "type": "PROSPECT",
        "typeProof": {
          "sourceId": "d0dccf81-de29-4d92-8fc9-05f5495e946d",
          "quote": "Dwóch ludzi, jeden warsztat. Łączymy systemy, piszemy kod i automatyzujemy to, co powtarzalne - żeby firmy mogły zająć się tym, co naprawdę ważne.",
          "explanation": "Potwierdzono działalność programistyczną, lecz nie nabór ani otwartą kandydaturę."
        },
        "inquiryBasis": {
          "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
          "quote": "Dedykowane aplikacje webowe i mobilne, budowane pod konkretny proces biznesowy. Next.js, React, mobile cross-platform.",
          "explanation": "Tworzenie aplikacji stanowi podstawę zapytania o współpracę programistyczną."
        },
        "conditions": {
          "remote": {
            "sourceId": null,
            "quote": null,
            "explanation": "Wzmianki o pracy zdalnej firmy nie potwierdzają w pełni zdalnej współpracy kandydata.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "partTime": {
            "sourceId": null,
            "quote": null,
            "explanation": "Nie podano możliwości współpracy w części wymiaru.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "paid": {
            "sourceId": null,
            "quote": null,
            "explanation": "Nie podano wynagrodzenia za współpracę programistyczną.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "junior": {
            "sourceId": null,
            "quote": null,
            "explanation": "Nie potwierdzono przyjmowania początkujących ani uczniów technikum.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "hours": {
            "sourceId": null,
            "quote": null,
            "explanation": "Godziny kontaktu z klientami nie potwierdzają dostępności około 20 godzin tygodniowo po lekcjach.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "contract": {
            "sourceId": null,
            "quote": null,
            "explanation": "Profil nie wymaga konkretnej umowy. Wymienione formy pozostają informacją firmy; akceptacja i dostępność do ustalenia.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "active": {
            "sourceId": null,
            "quote": null,
            "explanation": "W podanych treściach nie ma konkretnego wakatu ani sposobu aplikowania.",
            "value": "unknown",
            "scope": "UNKNOWN"
          },
          "openInquiry": {
            "sourceId": null,
            "quote": null,
            "explanation": "Nie znaleziono zaproszenia do otwartej kandydatury.",
            "value": "unknown",
            "scope": "UNKNOWN"
          }
        },
        "companyActivities": [
          {
            "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
            "quote": "Eliminujemy manualne procesy w Twoich działach. OCR do faktur, chatboty do obsługi klienta, agenci LLM do analiz.",
            "explanation": "Firma automatyzuje procesy i tworzy rozwiązania OCR oraz LLM."
          },
          {
            "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
            "quote": "Łączymy systemy, które do tej pory ze sobą nie rozmawiały. Subiekt nexo ↔ WooCommerce ↔ CRM ↔ księgowość.",
            "explanation": "Firma integruje systemy biznesowe."
          },
          {
            "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
            "quote": "Dedykowane aplikacje webowe i mobilne, budowane pod konkretny proces biznesowy.",
            "explanation": "Firma tworzy dedykowane aplikacje."
          },
          {
            "sourceId": "ddc9b821-1fe2-4de1-841d-0dc9fbcebbdd",
            "quote": "Własny produkt: uczeń rozwiązuje prawdziwe arkusze, AI ocenia odpowiedzi otwarte jak egzaminator, a platforma pokazuje, czego jeszcze nie umie.",
            "explanation": "Firma rozwija platformę do nauki biologii z ocenianiem AI."
          }
        ],
        "requirements": [
          {
            "text": "Tworzenie aplikacji webowych w Next.js i React — zakres działalności, nie wymaganie wakatu.",
            "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
            "quote": "Aplikacje webowe (Next.js, React)"
          },
          {
            "text": "Automatyzacje przepływów pracy z n8n, Make i rozwiązaniami własnymi.",
            "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
            "quote": "Przepływy pracy (n8n, Make, custom)"
          },
          {
            "text": "Integracje i zadania w tle przy użyciu Node.js, Python i n8n.",
            "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
            "quote": "Node.js + Python + n8n\n\nAutomatyzacje / integracje\n\nDo łączenia systemów i pracy w tle: kolejki zamówień, synchronizacje, powiadomienia."
          },
          {
            "text": "Budowanie chatbotów i agentów korzystających z API modeli AI.",
            "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
            "quote": "Chatboty i agenci AI działają na modelach dostępnych przez API"
          }
        ],
        "contact": {
          "email": "kontakt@prodaut.pl",
          "kind": "GENERAL",
          "proof": {
            "sourceId": "184b61b6-7124-4e54-96f0-21882d59105e",
            "quote": "- EMAIL\nkontakt@prodaut.pl",
            "explanation": "Publiczny adres kontaktowy firmy bez potwierdzonego przeznaczenia rekrutacyjnego."
          }
        },
        "warnings": [
          "Brak potwierdzonej rekrutacji i zgodności warunków z profilem; możliwe jest zapytanie o współpracę.",
          "Strona główna przedstawia asystenta AI dla przychodni wśród wdrożeń, a portfolio oznacza go jako projekt w trakcie."
        ]
      }
    }
  ],
  "binding": null,
  "selected_from_saved_proofs": {
    "policyVersion": 1,
    "field": "inquiryBasis",
    "proof": {
      "sourceId": "7513e1b9-441c-471a-9d43-896784e20d61",
      "quote": "Dedykowane aplikacje webowe i mobilne, budowane pod konkretny proces biznesowy. Next.js, React, mobile cross-platform.",
      "explanation": "Tworzenie aplikacji stanowi podstawę zapytania o współpracę programistyczną."
    },
    "sourceVersion": {
      "id": "7513e1b9-441c-471a-9d43-896784e20d61",
      "contentHash": "1be93de181466b1fc8fa72975d806d9e703290bd4c0636b4b3288442b6521900",
      "parserVersion": 2,
      "fetchedAt": "2026-10-13T10:20:57.766Z"
    },
    "evidenceIds": [
      "2e6d2140-5a2b-474c-85b6-c2efdd20b10d"
    ],
    "reason": "EXPLICIT_VERIFIED_BASIS"
  }
}
~~~

Replay: [{"id":"43c58979-03c3-46c0-9674-c59f2682f30e","company":"PRODAUT Sp. z o.o.","version":1,"textHash":"5538e0ed1e2f5568819ebfc0bced0c86561bb059ce6920d57a5b7800234392fd","supported":true,"issues":[]}]. Jest to kontrola kodowa z fikcyjnym reviewerem, nie rzeczywisty semantyczny PASS.

Świeża próba: FULLY_CHECKED; GENERAL/GENERAL_INQUIRY; aktualna decyzja READY_COMPANY_INQUIRY; powód kontrole zakończone. To nowy odczyt i nie dowodzi identyczności dawnej strony.

Materiał bfb19e47-93b1-4257-a4ac-f01560bee90b:1: GENERATED_DRAFT, poprzednia wersja brak, textHash 4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee, checked true.

~~~json
[
  {
    "step": 1,
    "at": "2026-10-13T12:33:45.970Z",
    "row": null
  },
  {
    "step": 2,
    "at": "2026-10-13T12:35:37.734Z",
    "row": {
      "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
      "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
      "company": "PRODAUT Sp. z o.o.",
      "version": 1,
      "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
      "supported": true,
      "issues": []
    }
  },
  {
    "step": 3,
    "at": "2026-10-13T12:37:03.738Z",
    "row": {
      "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
      "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
      "company": "PRODAUT Sp. z o.o.",
      "version": 1,
      "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
      "supported": true,
      "issues": []
    }
  },
  {
    "step": 4,
    "at": "2026-10-13T12:39:30.399Z",
    "row": {
      "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
      "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
      "company": "PRODAUT Sp. z o.o.",
      "version": 1,
      "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
      "supported": true,
      "issues": []
    }
  },
  {
    "step": 5,
    "at": "2026-10-13T12:41:30.516Z",
    "row": {
      "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
      "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
      "company": "PRODAUT Sp. z o.o.",
      "version": 1,
      "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
      "supported": true,
      "issues": []
    }
  },
  {
    "step": 6,
    "at": "2026-10-13T12:41:30.558Z",
    "row": {
      "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
      "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
      "company": "PRODAUT Sp. z o.o.",
      "version": 1,
      "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
      "supported": true,
      "issues": []
    }
  }
]
~~~

## Utrzymanie siedmiu wcześniejszych materiałów i restart

Pełne konteksty istnieją w znanej dawnej diagnostyce. Sprawdzono faktycznie wszystkie siedem wcześniej aktualnych materiałów na spójnej kopii przed i po dwóch cyklach oraz po restarcie. To nie jest ponowne zewnętrzne review tych siedmiu maili. Ich teksty i wersje nie zmieniły się. GOTOMA dostała rewizję tego samego tekstu; PRODAUT pierwszy szkic w fixture replay. Koszt offline: 0 HTTP, 0 rzeczywistych modeli; 3 wywołania fixture (1 DRAFT, 2 review).

~~~json
{
  "before": [
    {
      "id": "c767c024-4399-4575-81e2-f2588165a7cc",
      "company": "Tervyxa Systems",
      "version": 1,
      "textHash": "2b9a800f5ddf7a1a835127327738a4a9135b8dea5550db2abfb9bdd58607bac1",
      "supported": true,
      "issues": []
    },
    {
      "id": "f8b97697-1942-4fdc-b2a4-24b9fa577d6c",
      "company": "JCD.PL sp. z o.o.",
      "version": 1,
      "textHash": "7d843cf2a3899031f49ca4f3c47585f16607c4d4a46c41346a7451bc9180d14f",
      "supported": true,
      "issues": []
    },
    {
      "id": "3899a239-ea41-4e60-b8c6-5a22fce2eca7",
      "company": "GOTOMA Software House",
      "version": 1,
      "textHash": "52176d681fcfc5855197854731da74f005cd672f29d7532e08e36794bdf98f2e",
      "supported": true,
      "issues": [
        "DRAFT_MATERIAL_STALE"
      ]
    },
    {
      "id": "724a3c2e-b3c0-4aef-9b30-77937fab147d",
      "company": "TARO Systems",
      "version": 1,
      "textHash": "b33ad9edff10a4f25f31cca8f95d7b54e074c54685f99401627762057bd88dbd",
      "supported": true,
      "issues": []
    },
    {
      "id": "636c677c-dac6-4f11-9343-da666c3dc712",
      "company": "GWISE",
      "version": 1,
      "textHash": "6c7c8be8db137a2d0ac3d51912753212aab8ba32f2cf7e64eacebfd420992e25",
      "supported": true,
      "issues": []
    },
    {
      "id": "4c5bcd4b-6fa7-4075-b3cd-78223a30ed5e",
      "company": "Sprint0 sp. z o.o.",
      "version": 1,
      "textHash": "d8a445dd7f529dd4214999a45fa9a20ff4600c5a8f72c25608e8252e8602c58f",
      "supported": true,
      "issues": []
    },
    {
      "id": "0311f832-029d-456a-8ae5-9f77cf55bbd5",
      "company": "kastahouse",
      "version": 1,
      "textHash": "bca25368fce1dee0aabba1fddc52c1357c8f2a10e622ccf1402f0f38747f7efb",
      "supported": true,
      "issues": []
    },
    {
      "id": "04fc5089-e8a4-4542-af8a-c14dc69af23e",
      "company": "UNSEEN",
      "version": 1,
      "textHash": "f9bdcbbcd09d05aa1c3a4f40447db2b7ca9a744fcdfc0e4736d9abada307a296",
      "supported": true,
      "issues": []
    }
  ],
  "after": [
    {
      "id": "43c58979-03c3-46c0-9674-c59f2682f30e",
      "company": "PRODAUT Sp. z o.o.",
      "version": 1,
      "textHash": "5538e0ed1e2f5568819ebfc0bced0c86561bb059ce6920d57a5b7800234392fd",
      "supported": true,
      "issues": []
    },
    {
      "id": "c767c024-4399-4575-81e2-f2588165a7cc",
      "company": "Tervyxa Systems",
      "version": 1,
      "textHash": "2b9a800f5ddf7a1a835127327738a4a9135b8dea5550db2abfb9bdd58607bac1",
      "supported": true,
      "issues": []
    },
    {
      "id": "f8b97697-1942-4fdc-b2a4-24b9fa577d6c",
      "company": "JCD.PL sp. z o.o.",
      "version": 1,
      "textHash": "7d843cf2a3899031f49ca4f3c47585f16607c4d4a46c41346a7451bc9180d14f",
      "supported": true,
      "issues": []
    },
    {
      "id": "3899a239-ea41-4e60-b8c6-5a22fce2eca7",
      "company": "GOTOMA Software House",
      "version": 2,
      "textHash": "52176d681fcfc5855197854731da74f005cd672f29d7532e08e36794bdf98f2e",
      "supported": true,
      "issues": []
    },
    {
      "id": "724a3c2e-b3c0-4aef-9b30-77937fab147d",
      "company": "TARO Systems",
      "version": 1,
      "textHash": "b33ad9edff10a4f25f31cca8f95d7b54e074c54685f99401627762057bd88dbd",
      "supported": true,
      "issues": []
    },
    {
      "id": "636c677c-dac6-4f11-9343-da666c3dc712",
      "company": "GWISE",
      "version": 1,
      "textHash": "6c7c8be8db137a2d0ac3d51912753212aab8ba32f2cf7e64eacebfd420992e25",
      "supported": true,
      "issues": []
    },
    {
      "id": "4c5bcd4b-6fa7-4075-b3cd-78223a30ed5e",
      "company": "Sprint0 sp. z o.o.",
      "version": 1,
      "textHash": "d8a445dd7f529dd4214999a45fa9a20ff4600c5a8f72c25608e8252e8602c58f",
      "supported": true,
      "issues": []
    },
    {
      "id": "0311f832-029d-456a-8ae5-9f77cf55bbd5",
      "company": "kastahouse",
      "version": 1,
      "textHash": "bca25368fce1dee0aabba1fddc52c1357c8f2a10e622ccf1402f0f38747f7efb",
      "supported": true,
      "issues": []
    },
    {
      "id": "04fc5089-e8a4-4542-af8a-c14dc69af23e",
      "company": "UNSEEN",
      "version": 1,
      "textHash": "f9bdcbbcd09d05aa1c3a4f40447db2b7ca9a744fcdfc0e4736d9abada307a296",
      "supported": true,
      "issues": []
    }
  ],
  "restart": [
    {
      "id": "43c58979-03c3-46c0-9674-c59f2682f30e",
      "version": 1,
      "textHash": "5538e0ed1e2f5568819ebfc0bced0c86561bb059ce6920d57a5b7800234392fd",
      "issues": []
    },
    {
      "id": "c767c024-4399-4575-81e2-f2588165a7cc",
      "version": 1,
      "textHash": "2b9a800f5ddf7a1a835127327738a4a9135b8dea5550db2abfb9bdd58607bac1",
      "issues": []
    },
    {
      "id": "f8b97697-1942-4fdc-b2a4-24b9fa577d6c",
      "version": 1,
      "textHash": "7d843cf2a3899031f49ca4f3c47585f16607c4d4a46c41346a7451bc9180d14f",
      "issues": []
    },
    {
      "id": "3899a239-ea41-4e60-b8c6-5a22fce2eca7",
      "version": 2,
      "textHash": "52176d681fcfc5855197854731da74f005cd672f29d7532e08e36794bdf98f2e",
      "issues": []
    },
    {
      "id": "724a3c2e-b3c0-4aef-9b30-77937fab147d",
      "version": 1,
      "textHash": "b33ad9edff10a4f25f31cca8f95d7b54e074c54685f99401627762057bd88dbd",
      "issues": []
    },
    {
      "id": "636c677c-dac6-4f11-9343-da666c3dc712",
      "version": 1,
      "textHash": "6c7c8be8db137a2d0ac3d51912753212aab8ba32f2cf7e64eacebfd420992e25",
      "issues": []
    },
    {
      "id": "4c5bcd4b-6fa7-4075-b3cd-78223a30ed5e",
      "version": 1,
      "textHash": "d8a445dd7f529dd4214999a45fa9a20ff4600c5a8f72c25608e8252e8602c58f",
      "issues": []
    },
    {
      "id": "0311f832-029d-456a-8ae5-9f77cf55bbd5",
      "version": 1,
      "textHash": "bca25368fce1dee0aabba1fddc52c1357c8f2a10e622ccf1402f0f38747f7efb",
      "issues": []
    },
    {
      "id": "04fc5089-e8a4-4542-af8a-c14dc69af23e",
      "version": 1,
      "textHash": "f9bdcbbcd09d05aa1c3a4f40447db2b7ca9a744fcdfc0e4736d9abada307a296",
      "issues": []
    }
  ],
  "original_unchanged": true
}
~~~

## Nowe cykle i celowy powrót w publicznym harnessie

Brak ręcznej listy nowych firm. Po trzech kierunkach normalny import wraca do obu kontroli; reuse nie jest nowym odkryciem. Nie wymuszono odczytu ani dodatkowej ekstrakcji, jeśli aktualne dane wystarczały. Wszystkie rewizje zachowują własną kontrolę; stary supported=true nie daje bieżącej gotowości.

~~~json
{
  "cycles": [
    {
      "plan": {
        "id": "7b704ccaa87705553b16b0b1b243d57d3b494bb3022d81673da0178340546065",
        "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nPolska: software house’y, agencje internetowe, SaaS, aplikacje webowe, automatyzacje, API, integracje, narzędzia AI i przetwarzanie dokumentów. Szukaj szeroko we wszystkich tych dziedzinach; bez ograniczenia do PHP/Laravel. Mogą to być firmy bez ogłoszonego wakatu, do zapytania o współpracę."
      },
      "run": {
        "id": "e962726e-bc2d-48f4-a26e-63975350a5f1",
        "campaign_id": "research",
        "cycle_key": "search-1353fd45-ca1c-4138-845e-931ca64a5696",
        "status": "COMPLETED",
        "stage": "DRAFTS_READY",
        "discovered": 1,
        "duplicates": 1,
        "started_at": "2026-10-13T12:35:37.805Z",
        "finished_at": "2026-10-13T12:37:03.723Z",
        "heartbeat": "2026-10-13T12:37:03.721Z",
        "lease_until": null,
        "error": null,
        "updated_at": "2026-10-13T12:37:03.723Z"
      },
      "metrics": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 1,
          "codefabric": 0,
          "elektroscan": 0
        },
        "newCompanies": 1,
        "duplicates": 1,
        "sourcesRead": 10,
        "contacts": 1,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 1,
        "checkedDrafts": 1,
        "rejected": 0,
        "missingData": 1,
        "errors": []
      }
    },
    {
      "plan": {
        "id": "4e7cbe1137d9c99a65a8478b7e91f19b9ecfe9c56219538cf278aa84456d8581",
        "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nMałe i średnie zespoły produktowe oraz SaaS: aplikacje, narzędzia wewnętrzne, backend, integracje, automatyzacje i AI. Nowe firmy z publicznym kontaktem, także bez rekrutacji."
      },
      "run": {
        "id": "dbcfeceb-fc00-4b12-bec7-541beaece820",
        "campaign_id": "research",
        "cycle_key": "search-e8ebd012-1623-4719-b181-bc94c7c5c898",
        "status": "COMPLETED",
        "stage": "DRAFTS_READY",
        "discovered": 2,
        "duplicates": 0,
        "started_at": "2026-10-13T12:37:03.758Z",
        "finished_at": "2026-10-13T12:39:30.380Z",
        "heartbeat": "2026-10-13T12:39:30.373Z",
        "lease_until": null,
        "error": null,
        "updated_at": "2026-10-13T12:39:30.380Z"
      },
      "metrics": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 0,
          "codefabric": 0,
          "elektroscan": 0
        },
        "newCompanies": 2,
        "duplicates": 0,
        "sourcesRead": 9,
        "contacts": 0,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 0,
        "checkedDrafts": 0,
        "rejected": 0,
        "missingData": 2,
        "errors": []
      }
    },
    {
      "plan": {
        "id": "7376a644987534165a9e98b83cac605639a5f4272d26f79ed6843ace045aac6f",
        "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nAgencje cyfrowe i firmy tworzące aplikacje dla klientów: web, e-commerce, backend, API, automatyzacje i narzędzia AI. Szukaj różnych technologii i możliwości zapytania o współpracę."
      },
      "run": {
        "id": "dbe31e04-916b-49e3-9c8d-c3b6a9cebca1",
        "campaign_id": "research",
        "cycle_key": "search-8946193b-1d26-4aae-a062-6ae4be35ba1d",
        "status": "PAUSED",
        "stage": "SEARCH",
        "discovered": 0,
        "duplicates": 0,
        "started_at": "2026-10-13T12:39:30.425Z",
        "finished_at": null,
        "heartbeat": "2026-10-13T12:39:30.426Z",
        "lease_until": null,
        "error": "CODEX_TIMEOUT",
        "updated_at": "2026-10-13T12:41:30.501Z"
      },
      "metrics": {}
    }
  ],
  "repeat_events": [],
  "snapshots": [
    {
      "at": "2026-10-13T12:33:45.970Z",
      "rows": [
        {
          "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
          "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
          "company": "GOTOMA Software House",
          "version": 1,
          "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
          "supported": true,
          "issues": []
        }
      ]
    },
    {
      "at": "2026-10-13T12:35:37.734Z",
      "rows": [
        {
          "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
          "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
          "company": "PRODAUT Sp. z o.o.",
          "version": 1,
          "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
          "supported": true,
          "issues": []
        },
        {
          "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
          "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
          "company": "GOTOMA Software House",
          "version": 1,
          "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
          "supported": true,
          "issues": []
        }
      ]
    },
    {
      "at": "2026-10-13T12:37:03.738Z",
      "rows": [
        {
          "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
          "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
          "company": "PRODAUT Sp. z o.o.",
          "version": 1,
          "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
          "supported": true,
          "issues": []
        },
        {
          "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
          "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
          "company": "GOTOMA Software House",
          "version": 1,
          "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
          "supported": true,
          "issues": []
        }
      ]
    },
    {
      "at": "2026-10-13T12:39:30.399Z",
      "rows": [
        {
          "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
          "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
          "company": "PRODAUT Sp. z o.o.",
          "version": 1,
          "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
          "supported": true,
          "issues": []
        },
        {
          "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
          "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
          "company": "GOTOMA Software House",
          "version": 1,
          "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
          "supported": true,
          "issues": []
        }
      ]
    },
    {
      "at": "2026-10-13T12:41:30.516Z",
      "rows": [
        {
          "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
          "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
          "company": "PRODAUT Sp. z o.o.",
          "version": 1,
          "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
          "supported": true,
          "issues": []
        },
        {
          "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
          "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
          "company": "GOTOMA Software House",
          "version": 1,
          "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
          "supported": true,
          "issues": []
        }
      ]
    },
    {
      "at": "2026-10-13T12:41:30.558Z",
      "rows": [
        {
          "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
          "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
          "company": "PRODAUT Sp. z o.o.",
          "version": 1,
          "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
          "supported": true,
          "issues": []
        },
        {
          "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
          "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
          "company": "GOTOMA Software House",
          "version": 1,
          "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
          "supported": true,
          "issues": []
        }
      ]
    }
  ],
  "restart": {
    "state": {
      "paused": true,
      "stopped": true,
      "killSwitch": false,
      "status": "STOPPED",
      "nextCycle": null,
      "heartbeat": null,
      "scenario": "NORMAL"
    },
    "rows": [
      {
        "draft_id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
        "company_id": "78b37446-df5a-4145-8d4f-060c3971e635",
        "version": 1,
        "text_hash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
        "supported": true,
        "issues": []
      },
      {
        "draft_id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
        "company_id": "86da6a63-eae5-48a6-9461-b11f81309f20",
        "version": 1,
        "text_hash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
        "supported": true,
        "issues": []
      }
    ],
    "outbox": 0,
    "approvals": 0,
    "attempts": 0,
    "auto_sessions": 0
  }
}
~~~

## Granice rzeczywistej próby

Trzecie wyszukiwanie CODEX_TIMEOUT: publiczna próba przerwana, bez retry, zmiany timeoutu lub mocków udających odpowiedź. Celowy powrót nie nastąpił wewnątrz publicznego loopa. Po Stop wykonano oddzielny cache-only replay na spójnej kopii: transport i model rzucają błąd przy próbie użycia, nie zwracają fikcyjnego PASS; zachowano rzeczywiste wcześniejsze verdicts i sprawdzono aktualne bindingi. Zero nowych HTTP/modeli.

Harness 7803b9d pamiętał raport 08:10, nie pełny raport 12:02. Sprint0 był już badany wcześniej: jest ALREADY_RESEARCHED, nie nową firmą. To korekta klasyfikacji eksportu oparta na zapisanym poprzednim indeksie, nie zmiana bazy/kwalifikacji. Po publicznym Stop pamięć przyszłych uruchomień rozszerzono o oba raporty; poprawka nie została ponownie sprawdzona nowym publicznym szukaniem.

~~~json
{
  "timestamp": "2026-10-13T12:47:56.921Z",
  "kind": "CACHE_ONLY_POST_BLOCK_ON_CONSISTENT_COPY",
  "not_new_public_research": true,
  "no_mock_verdict": true,
  "original_unchanged": true,
  "public_budget_unchanged": true,
  "model_calls": 0,
  "http": 0,
  "before": [
    {
      "id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
      "company": "PRODAUT Sp. z o.o.",
      "version": 1,
      "textHash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
      "supported": true,
      "issues": []
    },
    {
      "id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
      "company": "GOTOMA Software House",
      "version": 1,
      "textHash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
      "supported": true,
      "issues": []
    }
  ],
  "after": [
    {
      "id": "bfb19e47-93b1-4257-a4ac-f01560bee90b",
      "company": "PRODAUT Sp. z o.o.",
      "version": 1,
      "textHash": "4aed20f15124e00f23568bf553f5578d1bb236ad44b9010cff744d832f9802ee",
      "supported": true,
      "issues": []
    },
    {
      "id": "cf74c59d-9b87-45c0-a7db-3ba93e9e0767",
      "company": "GOTOMA Software House",
      "version": 1,
      "textHash": "d17d6d4621afd5b7a8e1e626baba724e49e796e6138b8e3c865e456ffca3e2a4",
      "supported": true,
      "issues": []
    }
  ],
  "restartState": {
    "paused": true,
    "stopped": true,
    "killSwitch": false,
    "status": "STOPPED",
    "nextCycle": null,
    "heartbeat": null,
    "scenario": "NORMAL"
  },
  "attempts": 0,
  "outbox": 0
}
~~~

## Korekta znaczenia dowodu po publicznym Stop — tylko offline

W publicznym kodzie 7803b9d Sprint0 odrzucono przez zbyt szeroki wzorzec obcego klienta: fraza o własnym wdrożeniu w infrastrukturze klienta została błędnie objęta regułą. TwójSoftware miał zweryfikowany opis usługi w formie rzeczownikowej, ale helper wymagał czasownika wykonawcy. To były błędy reguły, nie rzeczywisty brak dowodów. Dwa przypadki odtworzono na dokładnym helperze z 7803b9d (2 FAIL) i na fixture ze zmienionymi nazwami. Helper v2 rozróżnia trzecią osobę klienta od własnej pracy i dopuszcza rzeczownikowy opis na potwierdzonej stronie usług. Regulamin/obcy klient/wymagania wakatu nadal nie wystarczają. Polityka ekstrakcji v6 wymaga normalnej ponownej kwalifikacji zgodności starych zapisów, bez masowego przeliczania hashy.

Kontrola read-only tych samych źródeł po poprawce nie tworzy wiadomości ani nie zastępuje brakującego publicznego PASS. Aktualna kwalifikacja kontraktowa dopuszcza Sprint0/TwójSoftware; w bazie i CSV pozostają pierwotne decyzje publicznego kodu. Prawdziwy brak literalnego adresu Assistron nadal blokuje.

~~~json
{
  "timestamp": "2026-10-13T12:58:40.672Z",
  "kind": "POST_PUBLIC_READ_ONLY_QUALIFICATION_CHECK",
  "not_public_rerun": true,
  "new_messages": 0,
  "http": 0,
  "models": 0,
  "original_unchanged": true,
  "source_hashes": {
    "contracts": "ed59c628d559b3a8c20d54bcb1c9b416fea27b88ea5b68856841cec51b3ac4b5"
  },
  "results": [
    {
      "item_id": "d4c74b02-1b8e-49dd-97b6-b8e53ff2acd5",
      "url": "https://gotoma.pl/",
      "company": "GOTOMA Software House",
      "original_stored_decision": "READY_COMPANY_INQUIRY",
      "current_code_basis": {
        "policyVersion": 2,
        "field": "inquiryBasis",
        "proof": {
          "sourceId": "aeecb6cd-1db9-4dca-bbcf-0af403b08147",
          "quote": "Projektujemy i rozwijamy aplikacje webowe dopasowane do procesów Twojej firmy.",
          "explanation": "Firma tworzy i rozwija aplikacje webowe."
        },
        "sourceVersion": {
          "id": "aeecb6cd-1db9-4dca-bbcf-0af403b08147",
          "contentHash": "3d49ff444467fc846329addf738e8f4f3fdcf768334f9dcffe7350649f6e8b1a",
          "parserVersion": 2,
          "fetchedAt": "2026-10-13T12:32:15.988Z"
        },
        "evidenceIds": [],
        "reason": "EXPLICIT_VERIFIED_BASIS"
      },
      "current_code_eligibility": {
        "allowed": true,
        "intent": "COMPANY_INQUIRY",
        "reason": "Osobne zapytanie na podstawie działalności firmy; źródłowa oferta i jej niedopasowanie zachowane."
      }
    },
    {
      "item_id": "46c9d83e-d3e1-45fd-9967-39d3c54b8dfe",
      "url": "https://www.prodaut.pl/",
      "company": "PRODAUT Sp. z o.o.",
      "original_stored_decision": "READY_COMPANY_INQUIRY",
      "current_code_basis": {
        "policyVersion": 2,
        "field": "inquiryBasis",
        "proof": {
          "sourceId": "e82a6be2-6a9b-486f-ac45-6ae82b477a6c",
          "quote": "Łączymy systemy, piszemy kod i automatyzujemy to, co powtarzalne",
          "explanation": "Działalność firmy uzasadnia zapytanie o współpracę programistyczną."
        },
        "sourceVersion": {
          "id": "e82a6be2-6a9b-486f-ac45-6ae82b477a6c",
          "contentHash": "645ec78275661ebd61f7e451d8955a1ff8b2f697eb37f982a7937083a4e667e7",
          "parserVersion": 2,
          "fetchedAt": "2026-10-13T12:33:47.765Z"
        },
        "evidenceIds": [],
        "reason": "EXPLICIT_VERIFIED_BASIS"
      },
      "current_code_eligibility": {
        "allowed": true,
        "intent": "COMPANY_INQUIRY",
        "reason": "Osobne zapytanie na podstawie działalności firmy; źródłowa oferta i jej niedopasowanie zachowane."
      }
    },
    {
      "item_id": "892b1a60-9ee8-4ec7-827e-4eabcbf80df5",
      "url": "https://assistron.pl/",
      "company": "Assistron sp. z o.o.",
      "original_stored_decision": "REJECTED",
      "current_code_basis": {
        "policyVersion": 2,
        "field": "inquiryBasis",
        "proof": {
          "sourceId": "b23cee72-1240-48e1-a1fc-9f2d48bcbd31",
          "quote": "Od chatbotów AI po dedykowane systemy ERP — budujemy oprogramowanie dopasowane do Twojego biznesu. Aplikacje webowe, mobilne, automatyzacja procesów.",
          "explanation": "Potwierdzono działalność programistyczną, ale nie nabór ani otwartą kandydaturę."
        },
        "sourceVersion": {
          "id": "b23cee72-1240-48e1-a1fc-9f2d48bcbd31",
          "contentHash": "f9ad3d902b5eb7a7feee96d14ff63bf3cf0718593ee7e1c740b1da73afb66b96",
          "parserVersion": 2,
          "fetchedAt": "2026-10-13T12:36:04.771Z"
        },
        "evidenceIds": [],
        "reason": "EXPLICIT_VERIFIED_BASIS"
      },
      "current_code_eligibility": {
        "allowed": false,
        "intent": "COMPANY_INQUIRY",
        "reason": "Niepotwierdzone lub wykluczone przeznaczenie adresu."
      }
    },
    {
      "item_id": "56392826-6513-437d-98fc-1e99d31602f1",
      "url": "https://gotoma.pl/",
      "company": "GOTOMA Software House",
      "original_stored_decision": "READY_COMPANY_INQUIRY",
      "current_code_basis": {
        "policyVersion": 2,
        "field": "inquiryBasis",
        "proof": {
          "sourceId": "aeecb6cd-1db9-4dca-bbcf-0af403b08147",
          "quote": "Projektujemy i rozwijamy aplikacje webowe dopasowane do procesów Twojej firmy.",
          "explanation": "Firma tworzy i rozwija aplikacje webowe."
        },
        "sourceVersion": {
          "id": "aeecb6cd-1db9-4dca-bbcf-0af403b08147",
          "contentHash": "3d49ff444467fc846329addf738e8f4f3fdcf768334f9dcffe7350649f6e8b1a",
          "parserVersion": 2,
          "fetchedAt": "2026-10-13T12:32:15.988Z"
        },
        "evidenceIds": [],
        "reason": "EXPLICIT_VERIFIED_BASIS"
      },
      "current_code_eligibility": {
        "allowed": true,
        "intent": "COMPANY_INQUIRY",
        "reason": "Osobne zapytanie na podstawie działalności firmy; źródłowa oferta i jej niedopasowanie zachowane."
      }
    },
    {
      "item_id": "f9dab421-d813-49ab-b023-937e99809f02",
      "url": "https://sprint0.pl/o-firmie",
      "company": "Sprint0 sp. z o.o.",
      "original_stored_decision": "REJECTED",
      "current_code_basis": {
        "policyVersion": 2,
        "field": "inquiryBasis",
        "proof": {
          "sourceId": "dfa684f2-fe31-45dd-b5fe-acf5b618f59f",
          "quote": "Budujemy systemy AI (asystentów na dokumentach firmy, ekstrakcję danych, agenty), wdrażamy modele lokalnie w infrastrukturze klienta, szkolimy zespoły i tworzymy dedykowane CRM-y oraz integracje.",
          "explanation": "Działalność firmy stanowi podstawę zapytania o współpracę programistyczną."
        },
        "sourceVersion": {
          "id": "dfa684f2-fe31-45dd-b5fe-acf5b618f59f",
          "contentHash": "87b6d9d90c5c0ae4315cedc09af95affbc09b5ccad481aeb93b1f237365f3601",
          "parserVersion": 2,
          "fetchedAt": "2026-10-13T12:38:29.014Z"
        },
        "evidenceIds": [],
        "reason": "EXPLICIT_VERIFIED_BASIS"
      },
      "current_code_eligibility": {
        "allowed": true,
        "intent": "COMPANY_INQUIRY",
        "reason": "Osobne zapytanie na podstawie działalności firmy; źródłowa oferta i jej niedopasowanie zachowane."
      }
    },
    {
      "item_id": "64e38c34-ce3a-46fe-a41a-e8c42b826255",
      "url": "https://www.twojsoftware.pl/kontakt",
      "company": "TwójSoftware",
      "original_stored_decision": "REJECTED",
      "current_code_basis": {
        "policyVersion": 2,
        "field": "inquiryBasis",
        "proof": {
          "sourceId": "bf05b539-2a20-47e1-85da-d1efd2379ed7",
          "quote": "Integracje modeli językowych i automatyzacje oparte na konkretnym procesie.",
          "explanation": "Działalność firmy uzasadnia zapytanie o współpracę programistyczną."
        },
        "sourceVersion": {
          "id": "bf05b539-2a20-47e1-85da-d1efd2379ed7",
          "contentHash": "880ad349d60cb4b49dcbc893d03500d825211cf690e337345c9a4b26661755a6",
          "parserVersion": 2,
          "fetchedAt": "2026-10-13T12:37:43.521Z"
        },
        "evidenceIds": [],
        "reason": "EXPLICIT_VERIFIED_BASIS"
      },
      "current_code_eligibility": {
        "allowed": true,
        "intent": "COMPANY_INQUIRY",
        "reason": "Osobne zapytanie na podstawie działalności firmy; źródłowa oferta i jej niedopasowanie zachowane."
      }
    }
  ]
}
~~~

## Mechanizm i regresje

Jedna resolveInquiryBasis: poprawne inquiryBasis → zweryfikowane companyActivities → odpowiedni typeProof PROSPECT. Weryfikacja literalności, nazwy i oficjalnego hosta, wieku, wersji/parsera oraz znaczenia działalności; regulamin, obcy klient i wymagania wakatu nie wystarczają. Kanał/odmowa/konflikt są sprawdzane niezależnie i mają pierwszeństwo. Reuse policy v1 dowodzi identyczności lub podzbioru pełnego aktualnego pakietu i zachowuje jego źródłowy porządek; nie usuwa pól z materialBinding. Nowy kontekst oznacza nową wersję materiału i nowe review. Próba jest trwale ograniczona do jednej na firmę/profil/scope/zestaw wersji wejścia. Starsza operacja nie nadpisuje nowszej kwalifikacji; hold i STALE blokują użycie, bez zatrzymywania firmy B.
