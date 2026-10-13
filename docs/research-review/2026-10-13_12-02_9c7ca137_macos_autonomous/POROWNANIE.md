# Porównanie wiadomości i mechanizmów

Przed: zapisany raport macOS, bez ponownego generowania historycznych tekstów. Po: świeże źródła kontrolne; żadnego ręcznego skracania maili. Fixture HTML jest rekonstrukcją opublikowanego cytatu, nie oryginalną stroną. Szczegóły walidacji i pomiarów offline: TEST_REPORT.

## BizCode (bizcode.pl)

Przed: kontakt RECRUITMENT, wynik FULLY_CHECKED, projekt autorelay. Po: RECRUITMENT/RECRUITMENT_APPLICATION, FULLY_CHECKED; oferta NEEDS_REVIEW, decyzja kontaktowa READY_OPEN_APPLICATION; projekt autorelay.

Słowa: 150 → 91. Status kontroli nowej wersji: true.

Przed (zapisany tekst):

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

Po (nowa generacja):

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

Ocena redakcyjna: AutoRelay i nawiązanie do integracji SAP pozostały trafne. Zniknęła lista SQLAlchemy/Alembic/Docker/Actions, zostały webhooki, retry HTTP i historia. Jedna dostępność i pytanie; bez deklaracji własnej znajomości SAP. Nie dopisano doświadczenia lub produkcji.

## OKE POLAND (oke.pl)

Przed: kontakt RECRUITMENT, wynik FULLY_CHECKED, projekt codefabric. Po: RECRUITMENT/RECRUITMENT_APPLICATION, FULLY_CHECKED; oferta NEEDS_REVIEW, decyzja kontaktowa READY_OPEN_APPLICATION; projekt codefabric.

Słowa: 143 → 117. Status kontroli nowej wersji: true.

Przed (zapisany tekst):

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

Po (nowa generacja):

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

Ocena redakcyjna: CodeFabric pozostał prototypem z lokalnymi modelami, planami i plikami. Skrócono listę bibliotek i czynności Codexa. Pochodzenie UKNF jest faktem praktyk, bez obietnicy oficjalnego produktu lub produkcyjnego wdrożenia. Jeden cel, dostępność i pytanie; związek firmy z AI pochodzi ze źródła, nie używania Codexa przez kandydata.

## ApiFamily (apifamily.pl)

Przed: kontakt GENERAL, wynik FULLY_CHECKED, projekt autorelay. Po: GENERAL/GENERAL_INQUIRY, FULLY_CHECKED; oferta NEEDS_REVIEW, decyzja kontaktowa READY_COMPANY_INQUIRY; projekt autorelay.

Słowa: 151 → 85. Status kontroli nowej wersji: true.

Przed (zapisany tekst):

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

Po (nowa generacja):

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

Ocena redakcyjna: zwykłe zapytanie bez wakatu zachowuje GENERAL. Usunięto powtórzenie płatnej regularnej współpracy i wyliczenie czynności Codexa. AutoRelay opisuje trzy funkcje; React/PostgreSQL są krótkim konkretem, bez dalszej listy stacku. Jedna dostępność i pytanie, bez wymyślonego naboru.

## Transparent Data (transparentdata.pl)

Przed: kontakt UNKNOWN, wynik QUALIFIED_NO_DRAFT_OR_REJECTED, projekt brak. Po: RECRUITMENT/RECRUITMENT_CONTACT, FULLY_CHECKED; oferta READY_OPEN_INQUIRY, decyzja kontaktowa READY_OPEN_APPLICATION; projekt autorelay.

Słowa: brak historycznego maila → 96. Status kontroli nowej wersji: true.

Po (nowa generacja):

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

Ocena: nowy szkic nawiązuje do API i danych, zawiera AutoRelay z HTTP/retry/historią. Nie wymyśla stanowiska, stawki lub godzin firmy; dostępność jest pytaniem. Nie ma wcześniejszego maila do porównania długości.

## Transparent Data: miejsce utraty przeznaczenia

Parser fixture zachowuje literalny adres i kontekst bez niezwiązanej sprzedaży. Przed poprawką validateAnalysis degraduje zaproponowany RECRUITMENT do UNKNOWN, bo whitelist nie rozpoznaje „chcesz do nas dołączyć? Napisz…”. Po poprawce rozpoznaje ten język także przy fikcyjnej firmie/adresie hello@. Dawny raw payload modelu nie jest w publicznym raporcie, więc nie dowodzimy, jaką pierwotną etykietę wybrał model. To odtworzenie wystarczającej przyczyny w kodzie, a świeża próba osobno sprawdza cały ciąg. Pytania nie dają prawa do CV, prefiks nie dowodzi przeznaczenia; zostaw CV jest oddzielnie rozpoznawane. Brak bieżącej roli nie wygasza OPEN; jawna odmowa nadal blokuje. Nie dodano wymogu zlecenia.

## Planer: test przed/po i rzeczywiste cykle

Fixture: oferta pozostaje REJECTED; osobne udokumentowane COMPANY_INQUIRY. Kontakty 0 → 1, matchedOffers=0, companyInquiries=1, rejected=0. Temat AutoRelay wynika z tej samej projectSelection co szkic, z literalnej działalności; brak trafnego tytułu/wymagań nie usuwa sygnału. Jedna firma/licznik mimo kolejnych wersji. Puste/duplikatowe wyniki zmieniają kierunek i zachowują cooldown; awaria czytnika nie zwiększa licznika wyczerpania rynku.

~~~json
[
  {
    "plan": {
      "id": "99d520e52fa3f1968efa5615bbc209d86bb5dadd4ad005b36a0f9550d5052fe2",
      "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nPolska: software house’y, agencje internetowe, SaaS, aplikacje webowe, automatyzacje, API, integracje, narzędzia AI i przetwarzanie dokumentów. Szukaj szeroko we wszystkich tych dziedzinach; bez ograniczenia do PHP/Laravel. Mogą to być firmy bez ogłoszonego wakatu, do zapytania o współpracę."
    },
    "run": {
      "id": "e2842ca7-390f-47ed-bc7a-9ce3c0c98575",
      "campaign_id": "research",
      "cycle_key": "search-0302dafc-eff2-465e-bb60-6b937ff26fc7",
      "status": "COMPLETED",
      "stage": "DRAFTS_READY",
      "discovered": 4,
      "duplicates": 0,
      "started_at": "2026-10-13T10:03:12.680Z",
      "finished_at": "2026-10-13T10:07:54.240Z",
      "heartbeat": "2026-10-13T10:07:54.235Z",
      "lease_until": null,
      "error": null,
      "updated_at": "2026-10-13T10:07:54.240Z"
    },
    "metrics": {
      "topicCounts": {
        "fixdesk": 0,
        "autorelay": 0,
        "codefabric": 0,
        "elektroscan": 0
      },
      "newCompanies": 4,
      "duplicates": 0,
      "sourcesRead": 14,
      "contacts": 0,
      "matchedOffers": 0,
      "openApplications": 0,
      "companyInquiries": 0,
      "checkedDrafts": 0,
      "rejected": 1,
      "missingData": 3,
      "errors": []
    }
  },
  {
    "plan": {
      "id": "c6c905b77c3779a2acb4c85096e7c0b13f3e3315ec149088f76abfe92c1528df",
      "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nMałe i średnie zespoły produktowe oraz SaaS: aplikacje, narzędzia wewnętrzne, backend, integracje, automatyzacje i AI. Nowe firmy z publicznym kontaktem, także bez rekrutacji."
    },
    "run": {
      "id": "2ce3644f-a5f4-469d-9439-61668492d769",
      "campaign_id": "research",
      "cycle_key": "search-35669911-e44b-432f-affb-62f2914d97c5",
      "status": "COMPLETED",
      "stage": "DRAFTS_READY",
      "discovered": 4,
      "duplicates": 0,
      "started_at": "2026-10-13T10:07:54.273Z",
      "finished_at": "2026-10-13T10:14:31.223Z",
      "heartbeat": "2026-10-13T10:13:51.649Z",
      "lease_until": null,
      "error": null,
      "updated_at": "2026-10-13T10:14:31.223Z"
    },
    "metrics": {
      "topicCounts": {
        "fixdesk": 0,
        "autorelay": 3,
        "codefabric": 1,
        "elektroscan": 1
      },
      "newCompanies": 4,
      "duplicates": 0,
      "sourcesRead": 14,
      "contacts": 4,
      "matchedOffers": 0,
      "openApplications": 0,
      "companyInquiries": 4,
      "checkedDrafts": 4,
      "rejected": 0,
      "missingData": 0,
      "errors": []
    }
  },
  {
    "plan": {
      "id": "6da24fdce44cb8fb3cd150e9882c8b75f84857c07ac04b04c5b87b6d1dd43b61",
      "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nAgencje cyfrowe i firmy tworzące aplikacje dla klientów: web, e-commerce, backend, API, automatyzacje i narzędzia AI. Szukaj różnych technologii i możliwości zapytania o współpracę."
    },
    "run": {
      "id": "51d9165b-fa8f-437c-9a3c-34c4d6047c18",
      "campaign_id": "research",
      "cycle_key": "search-ffdb5a54-5af0-4305-89b8-b959d51ac0c9",
      "status": "COMPLETED",
      "stage": "DRAFTS_READY",
      "discovered": 4,
      "duplicates": 0,
      "started_at": "2026-10-13T10:14:31.277Z",
      "finished_at": "2026-10-13T10:20:20.493Z",
      "heartbeat": "2026-10-13T10:20:20.488Z",
      "lease_until": null,
      "error": null,
      "updated_at": "2026-10-13T10:20:20.493Z"
    },
    "metrics": {
      "topicCounts": {
        "fixdesk": 0,
        "autorelay": 3,
        "codefabric": 1,
        "elektroscan": 0
      },
      "newCompanies": 4,
      "duplicates": 0,
      "sourcesRead": 16,
      "contacts": 3,
      "matchedOffers": 0,
      "openApplications": 0,
      "companyInquiries": 3,
      "checkedDrafts": 3,
      "rejected": 0,
      "missingData": 1,
      "errors": []
    }
  },
  {
    "plan": {
      "id": "e870165207de1e8e15aa8b306d96b02f53072c075d2c411bdf88ccb9fdce61dd",
      "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nFirmy automatyzujące pracę biznesową, wdrażające integracje, webhooki, API, dokumenty/PDF, analizę obrazu i AI. Szukaj nowych zespołów z publicznym kontaktem."
    },
    "run": {
      "id": "f8b29eec-5a5a-4a58-bcd3-b455c0a53659",
      "campaign_id": "research",
      "cycle_key": "search-b72c2bb9-bff7-4817-a0f6-9659d5e1af75",
      "status": "COMPLETED",
      "stage": "DRAFTS_READY",
      "discovered": 3,
      "duplicates": 1,
      "started_at": "2026-10-13T10:20:20.566Z",
      "finished_at": "2026-10-13T10:24:32.405Z",
      "heartbeat": "2026-10-13T10:24:32.400Z",
      "lease_until": null,
      "error": null,
      "updated_at": "2026-10-13T10:24:32.405Z"
    },
    "metrics": {
      "topicCounts": {
        "fixdesk": 0,
        "autorelay": 1,
        "codefabric": 0,
        "elektroscan": 0
      },
      "newCompanies": 3,
      "duplicates": 1,
      "sourcesRead": 13,
      "contacts": 1,
      "matchedOffers": 0,
      "openApplications": 0,
      "companyInquiries": 1,
      "checkedDrafts": 2,
      "rejected": 0,
      "missingData": 3,
      "errors": []
    }
  }
]
~~~

## Replay metryk po zamknięciu publicznej części

Oryginalny przebieg f59ccb8 pozostaje zachowany. Późniejsza poprawka używa tej samej kontroli materialBinding co bramka aplikacji. GOTOMA miała wcześniej pozytywny review; późniejsza analiza bez inquiryBasis unieważniła binding. W cyklu 4 pierwotny checkedDrafts=2 obejmował ten stary szkic. Poprawka daje 1 w bieżącym snapshotcie; cykl 3 w tym samym końcowym snapshotcie daje 2 zamiast dawnych 3, ponieważ jest to stan obecny, nie cofnięcie historycznej pozytywnej kontroli. Nie poprawiano oryginalnej bazy, decyzji lub wiadomości: spójna kopia po Stop i normalne metody planera, 0 HTTP/0 modeli. Regresja stale-material FAIL→PASS jest w TEST_REPORT.

~~~json
{
  "timestamp": "2026-10-13T10:32:49.008Z",
  "kind": "OFFLINE_METRICS_REPLAY_CURRENT_SNAPSHOT",
  "public_code_commit": "f59ccb89f301d762ebd50c4eead8c758353c8116",
  "replay_code_head": "f59ccb89f301d762ebd50c4eead8c758353c8116",
  "replay_code_dirty": true,
  "source_hashes": {
    "apps/server/src/research/query-planner.ts": "004bfa88469bff58b4d7d3b8a1a49421d41c0356a4d3fc94a87a21c86ed9ab30",
    "apps/server/src/research/autonomous-diagnostic.ts": "9c7cc83c991c9a85a18dec1b773032397572d43ac2a9e82923c59fce38904603",
    "apps/server/src/auto-policy.ts": "2689282004b4d622769af92907e6d5b3d637d17931b6ca5d8798b953c05806ee",
    "scripts/replay-planner-metrics.ts": "348507f0b352ae06fc24c3aee8b36e0c35911adfe877b604c088a9589ea31456"
  },
  "original_database_unchanged": true,
  "original_database_sha256": "8692f3020c9c8585332c24807c394f2300dd4cf1633480659be263e16c2a289e",
  "models": 0,
  "http": 0,
  "real_sends": 0,
  "note": "Current final bindings, not historical success at each earlier cycle. Public events remain unchanged; stale GOTOMA was verified earlier and invalidated by later analysis.",
  "cycles": [
    {
      "plan_id": "99d520e52fa3f1968efa5615bbc209d86bb5dadd4ad005b36a0f9550d5052fe2",
      "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nPolska: software house’y, agencje internetowe, SaaS, aplikacje webowe, automatyzacje, API, integracje, narzędzia AI i przetwarzanie dokumentów. Szukaj szeroko we wszystkich tych dziedzinach; bez ograniczenia do PHP/Laravel. Mogą to być firmy bez ogłoszonego wakatu, do zapytania o współpracę.",
      "original_metrics": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 0,
          "codefabric": 0,
          "elektroscan": 0
        },
        "newCompanies": 4,
        "duplicates": 0,
        "sourcesRead": 14,
        "contacts": 0,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 0,
        "checkedDrafts": 0,
        "rejected": 1,
        "missingData": 3,
        "errors": []
      },
      "replay_current_snapshot": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 0,
          "codefabric": 0,
          "elektroscan": 0
        },
        "newCompanies": 4,
        "duplicates": 0,
        "sourcesRead": 14,
        "contacts": 0,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 0,
        "checkedDrafts": 0,
        "rejected": 1,
        "missingData": 3,
        "errors": []
      }
    },
    {
      "plan_id": "c6c905b77c3779a2acb4c85096e7c0b13f3e3315ec149088f76abfe92c1528df",
      "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nMałe i średnie zespoły produktowe oraz SaaS: aplikacje, narzędzia wewnętrzne, backend, integracje, automatyzacje i AI. Nowe firmy z publicznym kontaktem, także bez rekrutacji.",
      "original_metrics": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 3,
          "codefabric": 1,
          "elektroscan": 1
        },
        "newCompanies": 4,
        "duplicates": 0,
        "sourcesRead": 14,
        "contacts": 4,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 4,
        "checkedDrafts": 4,
        "rejected": 0,
        "missingData": 0,
        "errors": []
      },
      "replay_current_snapshot": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 3,
          "codefabric": 1,
          "elektroscan": 1
        },
        "newCompanies": 4,
        "duplicates": 0,
        "sourcesRead": 14,
        "contacts": 4,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 4,
        "checkedDrafts": 4,
        "rejected": 0,
        "missingData": 0,
        "errors": []
      }
    },
    {
      "plan_id": "6da24fdce44cb8fb3cd150e9882c8b75f84857c07ac04b04c5b87b6d1dd43b61",
      "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nAgencje cyfrowe i firmy tworzące aplikacje dla klientów: web, e-commerce, backend, API, automatyzacje i narzędzia AI. Szukaj różnych technologii i możliwości zapytania o współpracę.",
      "original_metrics": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 3,
          "codefabric": 1,
          "elektroscan": 0
        },
        "newCompanies": 4,
        "duplicates": 0,
        "sourcesRead": 16,
        "contacts": 3,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 3,
        "checkedDrafts": 3,
        "rejected": 0,
        "missingData": 1,
        "errors": []
      },
      "replay_current_snapshot": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 3,
          "codefabric": 1,
          "elektroscan": 0
        },
        "newCompanies": 4,
        "duplicates": 0,
        "sourcesRead": 16,
        "contacts": 3,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 3,
        "checkedDrafts": 2,
        "rejected": 0,
        "missingData": 1,
        "errors": []
      }
    },
    {
      "plan_id": "e870165207de1e8e15aa8b306d96b02f53072c075d2c411bdf88ccb9fdce61dd",
      "query": "Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.\nFirmy automatyzujące pracę biznesową, wdrażające integracje, webhooki, API, dokumenty/PDF, analizę obrazu i AI. Szukaj nowych zespołów z publicznym kontaktem.",
      "original_metrics": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 1,
          "codefabric": 0,
          "elektroscan": 0
        },
        "newCompanies": 3,
        "duplicates": 1,
        "sourcesRead": 13,
        "contacts": 1,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 1,
        "checkedDrafts": 2,
        "rejected": 0,
        "missingData": 3,
        "errors": []
      },
      "replay_current_snapshot": {
        "topicCounts": {
          "fixdesk": 0,
          "autorelay": 1,
          "codefabric": 0,
          "elektroscan": 0
        },
        "newCompanies": 3,
        "duplicates": 1,
        "sourcesRead": 13,
        "contacts": 1,
        "matchedOffers": 0,
        "openApplications": 0,
        "companyInquiries": 1,
        "checkedDrafts": 1,
        "rejected": 0,
        "missingData": 3,
        "errors": []
      }
    }
  ],
  "verified_code_commit": "835a6d53bc3267c8fe29bd54c706bdacfc5415ce"
}
~~~
