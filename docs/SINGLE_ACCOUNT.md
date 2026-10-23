# Jedno konto i pomocnicze API — 23.10.2026

WORKSTATION wymaga `mailPolicy` w istniejącym prywatnym `workstation.json`:
oczekiwany email, stabilny subject zweryfikowany u Google, `GMAIL_BROWSER`
i rewizja. Adres i subject pozostają poza repo. Brak konfiguracji blokuje;
historia innych tożsamości nie jest listą aktywnych połączeń. Nie przepisujemy
historycznych nadawców, SELF_TEST, MIME, prób, blokad lub liczników.

Wysyłka tej instalacji odbywa się wyłącznie przez Computer Use w przeglądarce
Codexa. Natywny gateway odrzuca API send przed poświadczeniami i HTTP,
a konfiguracja i bramki odrzucają GMAIL_API przed rezerwacją. Nie ma SMTP,
zdalnych draftów ani fallbacku po utracie karty, timeout lub SEND_UNKNOWN.
Starszy adapter API pozostaje do regresji, bez czynnej ścieżki w WORKSTATION.

Pomocniczy OAuth żąda `openid email gmail.readonly`. Nie żąda send, compose,
modify, pełnego mail.google.com lub zapisu ustawień. Stary grant może nadal
zawierać send: zmiana żądanych scope nie cofa uprawnienia u Google. Backend
blokuje nadawanie również z takim tokenem. Zdalne revoke jest odrębną decyzją,
ponieważ może dotyczyć szerszej zgody tego klienta.

Tożsamość, możliwość odczytu API i wykonawca UI to osobne kontrole. Identity-only
nie wystarcza do historii; readonly nie potwierdza konta karty. Google udziela
szerszego odczytu Gmaila, a filtry odbiorców/domen i zgody na celowaną historię
egzekwuje dodatkowo aplikacja. Niepełna historia pozostaje błędem.

## Przygotowanie zatrzymanej instalacji

Po testach wybranego kodu oraz potwierdzonym końcu procesu i operacji:

```powershell
$env:JOBHUNTER_RUNTIME = 'WORKSTATION'
# JOBHUNTER_DATA_DIR wskazuje istniejący katalog bazowy poza repo.
node scripts/gmail.mjs configure owner@example.test
node scripts/gmail.mjs verify
# Gdy potrzebne logowanie: użytkownik obsługuje hasło/2FA/zgodę Google.
node scripts/gmail.mjs reconnect
# Pierwsze połączenie: connect <prywatny plik klienta Desktop app poza repo>
```

Adres przykładowy jest fikcyjny. Configure wymaga zgodności z jawnie wybranym
nadawcą kampanii; nie zmienia go według odpowiedzi dostawcy. Helper nie otwiera
usługi, workera, brokera lub sendera. Blokuje żywego/niepewnego właściciela
i nierozstrzygnięte operacje, sprawdza integralność/FK oraz komplet migracji,
wykonuje spójny backup VACUUM INTO z WAL, odwołuje zgody i pozostawia STOPPED.
Nie wykonuje migracji. Utrzymuje blokady przez cały OAuth. Timeout/przerwanie
nie uruchamia programu. Sekrety zapisuje dotychczasowy magazyn systemowy.

Verify dopuszcza tylko token POST, userinfo GET i profile GET z emailAddress.
Nie wywołuje messages/threads/history, syncCompany lub odczytu korespondencji
jako efektu ubocznego. Zwraca wynik zgodności, scope i bezpieczny ślad etapów.
Status odczytuje lokalne metadane, bez dowodu bieżącego logowania.

Niezgodność konfiguracji, subject, dostawcy lub kampanii odwołuje prawo
w pamięci przed zawodnym zapisem i unieważnia zgody. Zmiana rewizji podczas
await blokuje starą operację. Naprawa wymaga ponownego otwarcia zatrzymanej
instalacji. Połączenie nie przywraca zgód; zmiana wersji polityki unieważnia
stare bindingi planów/partii. Brak nowej zgody lub Start w helperze.

## Oddzielna karta i końcowa bramka

Właściwą kartę wskazuje użytkownik. login_hint, `/u/0` lub profil przeglądarki
nie dowodzą konta. Wykonawca sprawdza widoczne konto przed Utwórz. Obserwacja
redagowania niezależnie wiąże konto, From, Reply-To, odbiorcę, pełną treść
i PDF; ponawia obserwację po ostatnim await, przed pojedynczym kliknięciem.

Brak dowodu Reply-To jest UNKNOWN. Aktualny adapter przy braku widocznego
pola Reply-To blokuje natywną bramkę. Przed pilotem potrzebny jest wiarygodny,
obsługiwany sposób obserwacji efektywnego Reply-To. Odczyt ustawień w dawnej
sesji nie odblokowuje kliknięcia. Podpis zmieniający treść jest odrzucany
przez dokładne porównanie pustej i gotowej wiadomości. Ustawienia niesprawdzone
bez tworzenia wiadomości raportujemy jako nieweryfikowane.

Kontrola konta nie używa runNightflowTask/Start. Diagnostyka bez poczty nie
tworzy Gmail draftów, outbox, rezerwacji, prób lub nowych zgód. Pilot i celowana
historia wymagają osobnego upoważnienia. AUTO_POLICY nadal ma jedną politykę
i świadomy Start, bez przeglądu każdego zgodnego pierwszego maila.

Kontrakty Google: [scope Gmaila](https://developers.google.com/workspace/gmail/api/auth/scopes),
[Desktop OAuth i PKCE](https://developers.google.com/identity/protocols/oauth2/native-app).
Zmiana transportu nie jest dowodem poprawy dostarczalności.
