# Błędy i odrzucenia

## Wykonanie

Pierwsza partia: wszystkie odczyty FETCH_FAILED. Kontrolny odczyt tej samej strony BizCode odtworzył UNABLE_TO_VERIFY_LEAF_SIGNATURE. Dla pozostałych wcześniejszych żądań szczegółowej przyczyny nie zapisano — nie przypisujemy im wstecz potwierdzonego kodu TLS. Node 24 obsługuje --use-system-ca; kontrolny odczyt z magazynem Windows dał 200/READ bez wyłączania TLS, DNS/SSRF lub sandboxa Codexa. Następna partia jest rzeczywistym ponowieniem rozpoczętych przypadków w niezerowanym budżecie.

Mała poprawka kontroli linków: kropka kończąca zdanie w zatwierdzonym fakcie portfolio była porównywana jako część URL. Fixture odtworzył UNAPPROVED_LINK przed zmianą; po normalizacji wyłącznie końcowej interpunkcji test przechodzi, a inny docelowy URL pozostaje blokowany. Dwa zachowane teksty sprawdzono ponownie bez nowej generacji i bez zmiany faktów. Wyniki przed i po są jawne w historii kontroli.

~~~json
{
  "timestamp": "2026-10-12T21:39:33.864Z",
  "stage": "BEFORE_CODE_FIX_RECHECK",
  "code_id": "56c878f721eec56bcc01c88b9eb953670e95ae6c7fa76e16b0aecb43163492bc",
  "draft_id": "ba5a9c3c-be6b-4264-bb01-be5c1e3728f6",
  "version": 1,
  "code_status": "REJECTED",
  "code_error": "{\"code\":\"UNAPPROVED_LINK\",\"message\":\"Niepotwierdzony link w szkicu.\",\"fragment\":\"Dzień dobry,\\n\\nNazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej. Piszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury.\\n\\nNa Państwa stronie zwróciłem uwagę na tworzenie aplikacji webowych, usług API i dodatków do SAP Business One dla potrzeb, których nie pokrywa standardowy system. Zainteresował mnie również opis roli Junior Konsultant / Developer, skierowanej do osób rozpoczynających pracę z SAP Business One i narzędziami integracyjnymi.\\n\\nJestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.\\n\\nCzy rozważają Państwo współpracę z osobą o takim profilu i dostępności?\\n\\nGitHub: https://github.com/JakubLewosz\\n\\nPozdrawiam\\nJakub Lewosz\"}",
  "review_status": "NOT_RUN",
  "review_error": null,
  "semantic": {
    "supported": null,
    "issues": [
      "Odrzucenie przez kontrolę kodową: UNAPPROVED_LINK"
    ]
  }
}
~~~

~~~json
{
  "timestamp": "2026-10-12T21:39:33.868Z",
  "stage": "BEFORE_CODE_FIX_RECHECK",
  "code_id": "56c878f721eec56bcc01c88b9eb953670e95ae6c7fa76e16b0aecb43163492bc",
  "draft_id": "be38882b-112d-4a16-b10e-51c73af82d7a",
  "version": 1,
  "code_status": "REJECTED",
  "code_error": "{\"code\":\"UNAPPROVED_LINK\",\"message\":\"Niepotwierdzony link w szkicu.\",\"fragment\":\"Dzień dobry,\\n\\nNazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam płatnej, regularnej współpracy programistycznej.\\n\\nPiszę w związku z informacją na Państwa stronie, że przyjmują Państwo otwarte kandydatury. Zwróciłem też uwagę na elastyczne godziny pracy oraz oznaczenie „Hybrid & Remote” przy tym zaproszeniu.\\n\\nJestem dostępny około 20 godzin tygodniowo, w pełni zdalnie, głównie po lekcjach.\\n\\nCzy w ramach otwartych kandydatur rozważają Państwo współpracę z osobą o takim profilu i dostępności?\\n\\nGitHub: https://github.com/JakubLewosz\\n\\nPozdrawiam\\nJakub Lewosz\"}",
  "review_status": "NOT_RUN",
  "review_error": null,
  "semantic": {
    "supported": null,
    "issues": [
      "Odrzucenie przez kontrolę kodową: UNAPPROVED_LINK"
    ]
  }
}
~~~
~~~json
{
  "company_id": "810b5d55-d2da-404d-b5b2-892edea5df40",
  "call_id": "08508334-7811-495d-9bb3-2d91619a08f7",
  "item_id": "9495366e-bfe0-4c07-a850-47e5253d0285",
  "stage": "DRAFT",
  "code": "UNAPPROVED_LINK",
  "attempts": 1,
  "reason": "Szczegółowa przyczyna poza zapisanym kodem nieustalona.",
  "impact": "Pierwotne odrzucenie kodowe; późniejsza rzeczywista kontrola tego samego tekstu po poprawce w WIADOMOSCI."
}
~~~

~~~json
{
  "company_id": "candidate-6ada1ac9-4eec-452f-998c-9fe9f962add4",
  "call_id": "f6bcdf9a-b44b-4dad-9016-63c93d57d768",
  "item_id": "6ada1ac9-4eec-452f-998c-9fe9f962add4",
  "stage": "EXTRACT",
  "code": "UNVERIFIED_TITLE",
  "attempts": 1,
  "reason": "Tytuł nie ma sprawdzonego literalnego cytatu w źródłach. Surowego niepoprawnego payloadu ekstrakcji nie zachowano.",
  "impact": "Brak zatwierdzonej ekstrakcji/wiadomości tego etapu; pozostałe firmy kontynuowano."
}
~~~

~~~json
{
  "company_id": "9cd2f4f1-c768-47c6-a571-2b571e6b8374",
  "call_id": "63ac355b-152e-4774-8d2f-c7c3898e00f7",
  "item_id": "f9d3a9eb-8685-46d9-a017-da1a2b517368",
  "stage": "DRAFT",
  "code": "UNAPPROVED_LINK",
  "attempts": 1,
  "reason": "Szczegółowa przyczyna poza zapisanym kodem nieustalona.",
  "impact": "Pierwotne odrzucenie kodowe; późniejsza rzeczywista kontrola tego samego tekstu po poprawce w WIADOMOSCI."
}
~~~

### Nieudane odczyty publiczne

| source_id | Firma | Status | Oczyszczony kod | Próby |
| --- | --- | --- | --- | --- |
| bf907a70-c22a-41da-bdd2-ec6fd8a4b8d0 | 810b5d55-d2da-404d-b5b2-892edea5df40 | FETCH_FAILED | FETCH_FAILED | 1 |
| a8795dae-febf-496a-ba85-5e918e37ecc3 | 810b5d55-d2da-404d-b5b2-892edea5df40 | FETCH_FAILED | FETCH_FAILED | 1 |
| 92adcb39-d000-4dbe-9740-9087489d2e7f | 810b5d55-d2da-404d-b5b2-892edea5df40 | FETCH_FAILED | FETCH_FAILED | 1 |
| be6a01e8-4b9b-45f5-baa0-8994fa1d27ca | 810b5d55-d2da-404d-b5b2-892edea5df40 | FETCH_FAILED | FETCH_FAILED | 1 |
| 675e991e-aab1-4bea-8d7e-2f14a1645409 | candidate-6ada1ac9-4eec-452f-998c-9fe9f962add4 | FETCH_FAILED | FETCH_FAILED | 1 |
| 0242429e-2017-4af4-b7f3-85819b287fe7 | candidate-6ada1ac9-4eec-452f-998c-9fe9f962add4 | FETCH_FAILED | FETCH_FAILED | 1 |
| cadd0d6a-97b5-47e1-9e24-c96480e36678 | candidate-6ada1ac9-4eec-452f-998c-9fe9f962add4 | FETCH_FAILED | FETCH_FAILED | 1 |
| 492edb30-afe2-4da7-b856-632e200446bc | candidate-6ada1ac9-4eec-452f-998c-9fe9f962add4 | FETCH_FAILED | FETCH_FAILED | 1 |
| a4ad1086-d588-422a-b282-ebba6a6b66b5 | 9cd2f4f1-c768-47c6-a571-2b571e6b8374 | FETCH_FAILED | FETCH_FAILED | 1 |
| c19a21a3-05ab-482b-8c7e-15b05372f2f9 | 9cd2f4f1-c768-47c6-a571-2b571e6b8374 | FETCH_FAILED | FETCH_FAILED | 1 |
| efb5475d-270d-4c68-bc1b-19871e5e9120 | 9cd2f4f1-c768-47c6-a571-2b571e6b8374 | FETCH_FAILED | FETCH_FAILED | 1 |
| 529cb4bf-e604-4c6f-8b05-64491c839fec | 9cd2f4f1-c768-47c6-a571-2b571e6b8374 | FETCH_FAILED | FETCH_FAILED | 1 |
| dafc5122-499a-458a-981e-6cfbc7f5d0f8 | b3c58a14-67b2-4e57-882e-6ae8e0aa4154 | FETCH_FAILED | FETCH_FAILED | 1 |
| 019a21e1-c76c-4560-bb02-19be9c3969db | b3c58a14-67b2-4e57-882e-6ae8e0aa4154 | FETCH_FAILED | FETCH_FAILED | 1 |
| a80da25e-d554-4e00-85da-138690d5ad44 | b3c58a14-67b2-4e57-882e-6ae8e0aa4154 | FETCH_FAILED | FETCH_FAILED | 1 |
| 91d11689-1175-494b-b45e-c21392219100 | b3c58a14-67b2-4e57-882e-6ae8e0aa4154 | FETCH_FAILED | FETCH_FAILED | 1 |
| dbe9a368-8deb-499d-9034-678c3d2d71e8 | d888de52-4f70-448d-ab93-ad0e5157e6ba | FETCH_FAILED | FETCH_FAILED | 1 |
| 963a8f85-8c5f-45e7-af6e-2d629910be62 | d888de52-4f70-448d-ab93-ad0e5157e6ba | FETCH_FAILED | FETCH_FAILED | 1 |
| 31b3d93b-149d-43e8-9d2e-b17291c4aa2a | d888de52-4f70-448d-ab93-ad0e5157e6ba | FETCH_FAILED | FETCH_FAILED | 1 |
| 6739a8ad-2e0b-407b-a935-6b67f7f8ca99 | d888de52-4f70-448d-ab93-ad0e5157e6ba | FETCH_FAILED | FETCH_FAILED | 1 |
| 578e3124-397c-4e05-9ce5-60ebbd4e5816 | 4546c412-e2c4-41dc-b399-5a2dc17ede3a | FETCH_FAILED | FETCH_FAILED | 1 |
| 3aaaf0ba-71a6-4819-8c2e-43b4efc1ee8e | 4546c412-e2c4-41dc-b399-5a2dc17ede3a | FETCH_FAILED | FETCH_FAILED | 1 |
| aa4855eb-0c49-42af-8f4a-d8a8657a5c1b | 4546c412-e2c4-41dc-b399-5a2dc17ede3a | FETCH_FAILED | FETCH_FAILED | 1 |
| de6cfe3e-3193-4488-9223-26f6c0be6a03 | 4546c412-e2c4-41dc-b399-5a2dc17ede3a | FETCH_FAILED | FETCH_FAILED | 1 |
| eb3000de-2f37-4691-8ccb-5d257fb09c11 | candidate-bbc07fa4-200b-4084-bc2d-f46fbd70df82 | FETCH_FAILED | FETCH_FAILED | 1 |
| 04f0ca2b-991d-4c27-b172-2d4c43d786e8 | candidate-bbc07fa4-200b-4084-bc2d-f46fbd70df82 | FETCH_FAILED | FETCH_FAILED | 1 |
| 754fd29c-7b14-4a48-9d17-251e3e26b2d1 | candidate-bbc07fa4-200b-4084-bc2d-f46fbd70df82 | FETCH_FAILED | FETCH_FAILED | 1 |
| 0841da39-ac60-42f2-a5ef-969b9104d59c | candidate-bbc07fa4-200b-4084-bc2d-f46fbd70df82 | FETCH_FAILED | FETCH_FAILED | 1 |
| 4bfd0f72-1745-492c-bd7a-7776e44f83fb | candidate-e6375262-16b4-4889-aa73-caea44e59c37 | FETCH_FAILED | FETCH_FAILED | 1 |
| be04468e-5baa-4f76-be98-309bc6c37399 | candidate-e6375262-16b4-4889-aa73-caea44e59c37 | FETCH_FAILED | FETCH_FAILED | 1 |
| dc7dec4f-54f3-4bb0-81cc-0b6551cee06a | candidate-e6375262-16b4-4889-aa73-caea44e59c37 | FETCH_FAILED | FETCH_FAILED | 1 |
| 446cc9b6-d473-4c2f-8aeb-65818c120648 | candidate-e6375262-16b4-4889-aa73-caea44e59c37 | FETCH_FAILED | FETCH_FAILED | 1 |
| c9eb4b78-e1c6-4c4c-8b67-38b289b869b2 | candidate-b5f109a9-c8e4-4325-8839-01f4c85795ca | FETCH_FAILED | FETCH_FAILED | 1 |
| ac856c39-df47-401e-ab5e-d8c7da833097 | candidate-b5f109a9-c8e4-4325-8839-01f4c85795ca | FETCH_FAILED | FETCH_FAILED | 1 |
| e7d187f1-ea6c-4d1a-8069-6384b60844bd | candidate-b5f109a9-c8e4-4325-8839-01f4c85795ca | FETCH_FAILED | FETCH_FAILED | 1 |
| e9523190-68e3-4807-8d3b-a57e617cea6a | candidate-b5f109a9-c8e4-4325-8839-01f4c85795ca | FETCH_FAILED | FETCH_FAILED | 1 |
| 8b54898e-7cbe-41f8-80cd-07c05f377ca0 | candidate-7c380dcc-31b3-44d4-864c-62af22e5d0e8 | FETCH_FAILED | FETCH_FAILED | 1 |
| 07fc5cbc-a90d-44f5-9d0b-8df927a980eb | candidate-7c380dcc-31b3-44d4-864c-62af22e5d0e8 | FETCH_FAILED | FETCH_FAILED | 1 |
| 167014ee-e149-419a-b6e6-1a7dfb2dd648 | candidate-7c380dcc-31b3-44d4-864c-62af22e5d0e8 | FETCH_FAILED | FETCH_FAILED | 1 |
| e16fd3aa-7d18-4c64-beb4-e6d20aad617f | candidate-7c380dcc-31b3-44d4-864c-62af22e5d0e8 | FETCH_FAILED | FETCH_FAILED | 1 |
| d3d6639d-045f-45c2-8dba-dad7e8507d48 | candidate-7a4a88e2-e3f3-45cc-9226-9453f4c39051 | FETCH_FAILED | FETCH_FAILED | 1 |
| 1c8c2046-4c03-4eb0-a386-9d22438008ef | candidate-7a4a88e2-e3f3-45cc-9226-9453f4c39051 | FETCH_FAILED | FETCH_FAILED | 1 |
| 05b23f98-329e-47d5-b14d-54c98abde047 | candidate-7a4a88e2-e3f3-45cc-9226-9453f4c39051 | FETCH_FAILED | FETCH_FAILED | 1 |
| e5727662-2bfd-4638-be44-90385932aecf | candidate-7a4a88e2-e3f3-45cc-9226-9453f4c39051 | FETCH_FAILED | FETCH_FAILED | 1 |
| e831299d-0ca9-446f-8182-0f4a0c28245a | candidate-2816702f-3e58-4504-b614-f5e730caaeb5 | FETCH_FAILED | FETCH_FAILED | 1 |
| e5d88c82-69d5-4d8a-922a-543ce53442a6 | candidate-2816702f-3e58-4504-b614-f5e730caaeb5 | FETCH_FAILED | FETCH_FAILED | 1 |
| 96e3116a-5bc3-4651-bf99-f91bbfbf2b0d | candidate-2816702f-3e58-4504-b614-f5e730caaeb5 | FETCH_FAILED | FETCH_FAILED | 1 |
| 4fb3ec96-a259-42b5-9b53-1e0fe780adbf | candidate-2816702f-3e58-4504-b614-f5e730caaeb5 | FETCH_FAILED | FETCH_FAILED | 1 |
| 2363bf15-9989-44bb-88fc-f3ac95d2ab9d | candidate-ea9229d0-ac54-4252-b6bd-7b097a769d38 | FETCH_FAILED | FETCH_FAILED | 1 |
| a5029850-95da-46c6-a199-52ac595dd69c | candidate-ea9229d0-ac54-4252-b6bd-7b097a769d38 | FETCH_FAILED | FETCH_FAILED | 1 |
| 7b07e12a-f1cd-4304-826d-d9f55f69f3f4 | candidate-ea9229d0-ac54-4252-b6bd-7b097a769d38 | FETCH_FAILED | FETCH_FAILED | 1 |
| 161b444b-2055-4a08-bcf4-c818ffebf21b | candidate-ea9229d0-ac54-4252-b6bd-7b097a769d38 | FETCH_FAILED | FETCH_FAILED | 1 |
| 5bec8d01-3102-4c54-b42e-32adee396293 | candidate-d07a6955-e643-41b9-9a73-e4a327fb9570 | FETCH_FAILED | FETCH_FAILED | 1 |
| 68d6fdf1-da71-4ba2-98f4-d45a505d28b1 | candidate-d07a6955-e643-41b9-9a73-e4a327fb9570 | FETCH_FAILED | FETCH_FAILED | 1 |
| 108ab066-ea0b-4b18-93c1-ab0a5b9b755f | candidate-d07a6955-e643-41b9-9a73-e4a327fb9570 | FETCH_FAILED | FETCH_FAILED | 1 |
| b2c2fa3b-df92-45f5-8042-f2adc649c516 | candidate-d07a6955-e643-41b9-9a73-e4a327fb9570 | FETCH_FAILED | FETCH_FAILED | 1 |
| 5bf5fa89-541e-4430-b201-27d993b1f3fe | candidate-ba7c81ed-d154-4545-85aa-1da3b3618e7c | FETCH_FAILED | FETCH_FAILED | 1 |
| fda36c8b-dc49-4b87-b913-5a26b466c6e4 | candidate-ba7c81ed-d154-4545-85aa-1da3b3618e7c | FETCH_FAILED | FETCH_FAILED | 1 |
| 1cc7cae5-569a-4333-84d9-293d7ee8b849 | candidate-ba7c81ed-d154-4545-85aa-1da3b3618e7c | FETCH_FAILED | FETCH_FAILED | 1 |
| 19f0086a-f175-403c-830f-c775593ce2d9 | candidate-ba7c81ed-d154-4545-85aa-1da3b3618e7c | FETCH_FAILED | FETCH_FAILED | 1 |
| 811211b3-7e2e-46a6-8b82-bc45051932ce | candidate-4733eba8-b8db-4aa6-8a2e-a98fe239125c | FETCH_FAILED | FETCH_FAILED | 1 |
| 25114035-edad-47f3-8559-9857de13aa8f | candidate-4733eba8-b8db-4aa6-8a2e-a98fe239125c | FETCH_FAILED | FETCH_FAILED | 1 |
| a16c8fd6-51d5-4e82-a4bd-6d66da9e4229 | candidate-4733eba8-b8db-4aa6-8a2e-a98fe239125c | FETCH_FAILED | FETCH_FAILED | 1 |
| 2a2e51ae-7968-46e2-813d-93850b620d15 | candidate-4733eba8-b8db-4aa6-8a2e-a98fe239125c | FETCH_FAILED | FETCH_FAILED | 1 |
| c94ed359-a5ae-4af2-a492-261505d7dad6 | candidate-4733eba8-b8db-4aa6-8a2e-a98fe239125c | FETCH_FAILED | FETCH_FAILED | 1 |
| 61fdb50b-0cb6-4570-af05-ee3f87992c4b | candidate-4733eba8-b8db-4aa6-8a2e-a98fe239125c | FETCH_FAILED | FETCH_FAILED | 1 |
| 9765c812-d7e5-4c1f-98d1-c64398c7a984 | candidate-4733eba8-b8db-4aa6-8a2e-a98fe239125c | FETCH_FAILED | FETCH_FAILED | 1 |
| 7ae47035-052b-447d-8d95-82aaf4d4d2dc | candidate-4733eba8-b8db-4aa6-8a2e-a98fe239125c | FETCH_FAILED | FETCH_FAILED | 1 |
| 5b89aca5-d212-48c5-b4ba-5c81e974a4ba | candidate-99ccbf50-beaf-4092-ac4a-abe28e68d844 | FETCH_FAILED | FETCH_FAILED | 1 |
| 06219a02-ed28-41a2-9e4f-84bd0ce6114c | candidate-99ccbf50-beaf-4092-ac4a-abe28e68d844 | FETCH_FAILED | FETCH_FAILED | 1 |
| dd41d43d-6f87-471f-8793-5da1f2b96cd3 | candidate-99ccbf50-beaf-4092-ac4a-abe28e68d844 | FETCH_FAILED | FETCH_FAILED | 1 |
| e69a65e8-ced4-4e0d-8922-f585accadf66 | candidate-99ccbf50-beaf-4092-ac4a-abe28e68d844 | FETCH_FAILED | FETCH_FAILED | 1 |
| 0a529d3b-e817-4fa4-97c9-cd78d52e577e | candidate-6b291718-189e-4aff-a023-30b77c4d613b | FETCH_FAILED | FETCH_FAILED | 1 |
| 8f779fbf-f50b-4a3f-b23d-e08b169b58d7 | candidate-6b291718-189e-4aff-a023-30b77c4d613b | FETCH_FAILED | FETCH_FAILED | 1 |
| 3fe1dc46-1966-4aba-90f4-b08ab3390263 | candidate-6b291718-189e-4aff-a023-30b77c4d613b | FETCH_FAILED | FETCH_FAILED | 1 |
| 71e159d4-41bd-40e1-97e6-c7aed78bb6df | candidate-6b291718-189e-4aff-a023-30b77c4d613b | FETCH_FAILED | FETCH_FAILED | 1 |
| df6ee1fe-72a5-466c-9dfc-05c3ce78741a | candidate-f05d6ef1-8f9b-4f13-a5dc-2a4fe423fab3 | FETCH_FAILED | FETCH_FAILED | 1 |
| ff938c21-89a6-48a5-8dff-0115253aa22c | candidate-f05d6ef1-8f9b-4f13-a5dc-2a4fe423fab3 | FETCH_FAILED | FETCH_FAILED | 1 |
| 16197db3-1ddd-4b6a-ae4b-7c6800f14c00 | candidate-f05d6ef1-8f9b-4f13-a5dc-2a4fe423fab3 | FETCH_FAILED | FETCH_FAILED | 1 |
| 8723b10c-e872-40fe-8635-d4963b9e3012 | candidate-f05d6ef1-8f9b-4f13-a5dc-2a4fe423fab3 | FETCH_FAILED | FETCH_FAILED | 1 |
| 134beb5d-e5f7-4d06-91e7-a82ad2bbc520 | candidate-e8c34f5a-ddd7-4af6-a1f3-b32f27ec13c3 | FETCH_FAILED | FETCH_FAILED | 1 |
| 1417ebbc-d50e-4a60-84a9-74819dfd6c30 | candidate-e8c34f5a-ddd7-4af6-a1f3-b32f27ec13c3 | FETCH_FAILED | FETCH_FAILED | 1 |
| 43d672ed-3200-4816-bfc3-ff9a46668256 | candidate-e8c34f5a-ddd7-4af6-a1f3-b32f27ec13c3 | FETCH_FAILED | FETCH_FAILED | 1 |
| dce72d31-1e8a-474f-85bf-092a30059fa5 | candidate-e8c34f5a-ddd7-4af6-a1f3-b32f27ec13c3 | FETCH_FAILED | FETCH_FAILED | 1 |
| 30062a2b-8beb-4b60-acb0-4de2ffa5dff1 | candidate-882b9bf1-dd2d-4928-8acf-2f51a0d6ba88 | FETCH_FAILED | FETCH_FAILED | 1 |
| c10ae59a-44fb-4411-ae37-027b6c4d7802 | candidate-882b9bf1-dd2d-4928-8acf-2f51a0d6ba88 | FETCH_FAILED | FETCH_FAILED | 1 |
| da5c07d8-e458-48df-8bd7-71ac60d6a236 | candidate-882b9bf1-dd2d-4928-8acf-2f51a0d6ba88 | FETCH_FAILED | FETCH_FAILED | 1 |
| c6d18bf3-8b9a-44ce-8a22-9b49aa9ad2fb | candidate-882b9bf1-dd2d-4928-8acf-2f51a0d6ba88 | FETCH_FAILED | FETCH_FAILED | 1 |
| a1c1b35d-2ab4-4c74-a117-0454c9fce68b | candidate-ae6e68d2-a376-40a4-bd1e-37818fc53247 | FETCH_FAILED | FETCH_FAILED | 1 |
| 7d45b28b-ed6f-4b4c-9e0d-1232dd7c9e9e | candidate-ae6e68d2-a376-40a4-bd1e-37818fc53247 | FETCH_FAILED | FETCH_FAILED | 1 |
| da900711-302c-4b7a-95c2-bab16a8cb907 | candidate-ae6e68d2-a376-40a4-bd1e-37818fc53247 | FETCH_FAILED | FETCH_FAILED | 1 |
| 7344ff38-d511-452b-bb28-f673bcc0021e | candidate-ae6e68d2-a376-40a4-bd1e-37818fc53247 | FETCH_FAILED | FETCH_FAILED | 1 |
| 23d49bd9-7d26-4481-99af-b4c7a3a749c3 | candidate-a86cb5c5-9dc3-42ea-af5b-f5bde3f63c0c | FETCH_FAILED | FETCH_FAILED | 1 |
| f24a9d82-ccf4-4edd-a022-549960d1a959 | candidate-a86cb5c5-9dc3-42ea-af5b-f5bde3f63c0c | FETCH_FAILED | FETCH_FAILED | 1 |
| 25b3ac67-f1f2-4ac8-b32f-8b677c3e9801 | candidate-a86cb5c5-9dc3-42ea-af5b-f5bde3f63c0c | FETCH_FAILED | FETCH_FAILED | 1 |
| 70d219b9-f593-43fa-a133-60553c61573c | candidate-a86cb5c5-9dc3-42ea-af5b-f5bde3f63c0c | FETCH_FAILED | FETCH_FAILED | 1 |
| a3f18501-a813-4b27-b716-36c295139694 | candidate-1635318c-06b6-4e98-94f3-473800c6f6a8 | FETCH_FAILED | FETCH_FAILED | 1 |
| b43b7c78-205f-4d87-942a-add8f1548ba2 | candidate-1635318c-06b6-4e98-94f3-473800c6f6a8 | FETCH_FAILED | FETCH_FAILED | 1 |
| c2edb588-abdc-4772-bb05-72af452374e5 | candidate-1635318c-06b6-4e98-94f3-473800c6f6a8 | FETCH_FAILED | FETCH_FAILED | 1 |
| 0fd0d07b-774b-4180-93c1-ea32fa399207 | candidate-1635318c-06b6-4e98-94f3-473800c6f6a8 | FETCH_FAILED | FETCH_FAILED | 1 |
| 725bf36e-2539-40b8-8dcf-73cfafdf9ecb | candidate-4020f8b0-daa7-4535-a919-a0ae6840ad8c | FETCH_FAILED | FETCH_FAILED | 1 |
| 877cc4c6-4e04-4307-aa76-496f676e25b8 | candidate-4020f8b0-daa7-4535-a919-a0ae6840ad8c | FETCH_FAILED | FETCH_FAILED | 1 |
| f1fb0367-01af-4907-9053-c4358c48ab70 | candidate-4020f8b0-daa7-4535-a919-a0ae6840ad8c | FETCH_FAILED | FETCH_FAILED | 1 |
| a70cf4dc-5816-4a6b-b75e-18ee4626675c | candidate-4020f8b0-daa7-4535-a919-a0ae6840ad8c | FETCH_FAILED | FETCH_FAILED | 1 |
| 89b194af-2488-4a52-bcf7-be9b70eafc3c | candidate-4383097f-2a3a-4d19-b8ed-a816a75810f5 | FETCH_FAILED | FETCH_FAILED | 1 |
| 198d17ee-7e9c-4b8b-8d09-89194cd12cc2 | candidate-4383097f-2a3a-4d19-b8ed-a816a75810f5 | FETCH_FAILED | FETCH_FAILED | 1 |
| 9c73f3a6-2227-4aec-9cdc-b5d1c5754f68 | candidate-4383097f-2a3a-4d19-b8ed-a816a75810f5 | FETCH_FAILED | FETCH_FAILED | 1 |
| 3e744504-a989-40c5-bd7b-106c7bb4306a | candidate-4383097f-2a3a-4d19-b8ed-a816a75810f5 | FETCH_FAILED | FETCH_FAILED | 1 |
| a16d77cf-44cc-4572-a633-76937ff8ffd9 | candidate-f4214818-b39f-45bf-a9ae-98870e7efd1e | FETCH_FAILED | FETCH_FAILED | 1 |
| dd0fb328-2938-4857-ab21-9d723cc1b2e5 | candidate-f4214818-b39f-45bf-a9ae-98870e7efd1e | FETCH_FAILED | FETCH_FAILED | 1 |
| 4e03b223-ae1b-4cf8-9bd1-06693f03f495 | candidate-f4214818-b39f-45bf-a9ae-98870e7efd1e | FETCH_FAILED | FETCH_FAILED | 1 |
| 0f5d614b-11c6-44af-8c37-f453fb2dcc9f | candidate-f4214818-b39f-45bf-a9ae-98870e7efd1e | FETCH_FAILED | FETCH_FAILED | 1 |
| a70f9fd2-48c0-414a-84a5-c23cd91f8365 | candidate-fa88964e-295c-48f7-804a-8ea882f947ea | FETCH_FAILED | FETCH_FAILED | 1 |
| 1d2f2882-06e0-4cc1-8a55-9d6200041fa2 | candidate-fa88964e-295c-48f7-804a-8ea882f947ea | FETCH_FAILED | FETCH_FAILED | 1 |
| 08b08140-0405-458e-bf94-b93de88618ca | candidate-fa88964e-295c-48f7-804a-8ea882f947ea | FETCH_FAILED | FETCH_FAILED | 1 |
| 6e603935-b1de-488d-aeda-37a8fa31d0ad | candidate-fa88964e-295c-48f7-804a-8ea882f947ea | FETCH_FAILED | FETCH_FAILED | 1 |
| db82d937-f59c-44ce-800c-86a38a74f281 | candidate-dc5a42a8-beb2-4b35-be50-0c5bb12c5965 | FETCH_FAILED | FETCH_FAILED | 1 |
| ddf88db4-9de0-4492-b3e7-5c7f2b18467a | candidate-dc5a42a8-beb2-4b35-be50-0c5bb12c5965 | FETCH_FAILED | FETCH_FAILED | 1 |
| 2c4e3d9c-ff5c-42d4-b953-1473372c69f9 | candidate-dc5a42a8-beb2-4b35-be50-0c5bb12c5965 | FETCH_FAILED | FETCH_FAILED | 1 |
| 449fda33-c1c9-41b3-ad36-9509d80ad9ff | candidate-dc5a42a8-beb2-4b35-be50-0c5bb12c5965 | FETCH_FAILED | FETCH_FAILED | 1 |
| 3b1a7ad6-9ddb-4821-ba61-a36adf16a994 | candidate-c3af83f0-6b79-49d2-852d-164c3d90a157 | FETCH_FAILED | FETCH_FAILED | 1 |
| 82d7f230-a0aa-42f8-99f9-43a5f120fbec | candidate-c3af83f0-6b79-49d2-852d-164c3d90a157 | FETCH_FAILED | FETCH_FAILED | 1 |
| 108c3d20-012e-41aa-87db-fa4e51784d34 | candidate-c3af83f0-6b79-49d2-852d-164c3d90a157 | FETCH_FAILED | FETCH_FAILED | 1 |
| 10d052de-b7ee-4c28-a464-0c1412ca86bf | candidate-c3af83f0-6b79-49d2-852d-164c3d90a157 | FETCH_FAILED | FETCH_FAILED | 1 |
| 24e6a04e-72e0-4dab-8c5b-52f9a6061f3a | d888de52-4f70-448d-ab93-ad0e5157e6ba | NOT_FOUND | przyczyna nieustalona | 1 |
| f9223b5e-5b81-4c6c-9471-d94902839592 | d888de52-4f70-448d-ab93-ad0e5157e6ba | NOT_FOUND | przyczyna nieustalona | 1 |

## Wyniki merytoryczne

- candidate-6ada1ac9-4eec-452f-998c-9fe9f962add4 (payarto.com): UNVERIFIED_TITLE.
- b3c58a14-67b2-4e57-882e-6ae8e0aa4154 (tukano.com.pl): Odmowa firmy/działu lub nieustalony zakres ograniczenia.; Braki informacji lub kontakt wymagają ręcznej decyzji.; contract: no — Wskazane formy zatrudnienia nie obejmują umowy zlecenia..
- d888de52-4f70-448d-ab93-ad0e5157e6ba (careers.merixstudio.com): Niepotwierdzone lub wykluczone przeznaczenie adresu.; Braki informacji lub kontakt wymagają ręcznej decyzji..
- 4546c412-e2c4-41dc-b399-5a2dc17ede3a (wizzdev.com): Odmowa firmy/działu lub nieustalony zakres ograniczenia.; remote: no — Oferta wymaga pracy stacjonarnej. Ogólne firmowe możliwości pracy zdalnej nie zmieniają tego wymogu.; remote: no — Oferta wymaga pracy stacjonarnej. Ogólne firmowe możliwości pracy zdalnej nie zmieniają tego wymogu.; partTime: no — Wymagany pełen etat nie odpowiada około 20 godzinom tygodniowo.; junior: no — Stanowisko wymaga doświadczenia na poziomie Mid lub Senior; wzmianki o praktykantach dotyczą ich nadzorowania.; hours: no — Wskazane godziny 8:00–16:00 nie odpowiadają dostępności głównie po lekcjach..
- candidate-bbc07fa4-200b-4084-bc2d-f46fbd70df82 (econnect4u.pl): NO_READABLE_SOURCE.
- candidate-e6375262-16b4-4889-aa73-caea44e59c37 (septsite.pl): NO_READABLE_SOURCE.
- candidate-b5f109a9-c8e4-4325-8839-01f4c85795ca (n-soft.pl): NO_READABLE_SOURCE.
- candidate-7c380dcc-31b3-44d4-864c-62af22e5d0e8 (flatlogic.com): NO_READABLE_SOURCE.
- candidate-7a4a88e2-e3f3-45cc-9226-9453f4c39051 (trans-house.com): NO_READABLE_SOURCE.
- candidate-2816702f-3e58-4504-b614-f5e730caaeb5 (assistron.pl): NO_READABLE_SOURCE.
- candidate-ea9229d0-ac54-4252-b6bd-7b097a769d38 (baluarte.pl): NO_READABLE_SOURCE.
- candidate-d07a6955-e643-41b9-9a73-e4a327fb9570 (rothcor.pl): NO_READABLE_SOURCE.
- candidate-ba7c81ed-d154-4545-85aa-1da3b3618e7c (bespokesoft.pl): NO_READABLE_SOURCE.
- candidate-4733eba8-b8db-4aa6-8a2e-a98fe239125c (sprint0.pl): NO_READABLE_SOURCE.
- candidate-99ccbf50-beaf-4092-ac4a-abe28e68d844 (codiyo.com): NO_READABLE_SOURCE.
- candidate-6b291718-189e-4aff-a023-30b77c4d613b (gradienthouse.pl): NO_READABLE_SOURCE.
- candidate-f05d6ef1-8f9b-4f13-a5dc-2a4fe423fab3 (en.aisp.pl): NO_READABLE_SOURCE.
- candidate-e8c34f5a-ddd7-4af6-a1f3-b32f27ec13c3 (nexome.eu): NO_READABLE_SOURCE.
- candidate-882b9bf1-dd2d-4928-8acf-2f51a0d6ba88 (weastronauts.com): NO_READABLE_SOURCE.
- candidate-ae6e68d2-a376-40a4-bd1e-37818fc53247 (transparentdata.pl): NO_READABLE_SOURCE.
- candidate-a86cb5c5-9dc3-42ea-af5b-f5bde3f63c0c (controlsystem.com.pl): NO_READABLE_SOURCE.
- candidate-1635318c-06b6-4e98-94f3-473800c6f6a8 (ecom.software): NO_READABLE_SOURCE.
- candidate-4020f8b0-daa7-4535-a919-a0ae6840ad8c (codapi.pl): NO_READABLE_SOURCE.
- candidate-4383097f-2a3a-4d19-b8ed-a816a75810f5 (apifamily.pl): NO_READABLE_SOURCE.
- candidate-f4214818-b39f-45bf-a9ae-98870e7efd1e (mobileon.pl): NO_READABLE_SOURCE.
- candidate-fa88964e-295c-48f7-804a-8ea882f947ea (matcode.pl): NO_READABLE_SOURCE.
- candidate-dc5a42a8-beb2-4b35-be50-0c5bb12c5965 (devdock.pl): NO_READABLE_SOURCE.
- candidate-c3af83f0-6b79-49d2-852d-164c3d90a157 (jirasoft.pl): NO_READABLE_SOURCE.

Niepoprawne/niepewne szkice nie zostały zatwierdzone. Brak szkicu nie jest odrzuceniem treści. Dawne CODEX_FAILED nie były ponownie diagnozowane.
