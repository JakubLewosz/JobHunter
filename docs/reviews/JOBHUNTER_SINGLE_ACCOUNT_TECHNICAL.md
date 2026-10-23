# Jedno konto — zakres implementacji, 23.10.2026

Baza: `4cd344e9fa96ed5cffe89a372f1024dc71663d8d`, gałąź dostawy
`codex/windows-nightflow-fixes`. Bez zmiany modelu AUTO_POLICY, R1–R15,
Node24 ownera, lekkiego adaptera, zatwierdzonych materiałów lub stylu.

Wspólna kontrola prywatnej tożsamości obejmuje OAuth przed zapisem,
metadane przed odświeżeniem, bieżącego dostawcę i profil Gmaila, konfigurację
polityki, podgląd, historię, uzgadnianie prób i końcową bramkę. Subject pochodzi
od Google. Email nie jest źródłem sztucznego identyfikatora. Zmiana/utrata
zgodności odwołuje prawo w pamięci i bindingi przed zawodnymi zapisami.

WORKSTATION odrzuca API send przed poświadczeniami/HTTP oraz wybór API przed
rezerwacją. Readonly wystarcza do pomocniczej ścieżki browser; identity-only
nie daje odczytu. API nadal realizuje celowaną historię i potwierdzenie
istniejącej próby. Brak fallbacku lub retry możliwego kliknięcia.

Helper maintenance zajmuje istniejący backend.lock i profile.lock, respektuje
żywego/niepewnego właściciela, sprawdza integralność/FK oraz wersje migracji,
wykonuje VACUUM INTO przed zmianami. Nie tworzy service/worker/sender/broker.
Nie migruje bazy i nie rozstrzyga SEND_UNKNOWN. Zmienia tylko konfigurację,
wersję polityki, stan zatrzymania, odwołania zgód i zdarzenie audytowe.
Usuwa dawny launcher tak jak shutdown main.ts; token panelu jest losowy
w pamięci instancji, a nie wczytywany przy restarcie z launch.json.

## Dowody syntetyczne

| Wymaganie | Testy |
| --- | --- |
| Readonly bez send, identity-only, brak metadanych/obcy subject | single-account.test.ts |
| Callback z obcym email/subject/profile, PKCE/state/replay/Stop | single-account.test.ts, gmail.test.ts |
| Zmiana w await, błąd zapisu, zero aktywnego prawa | single-account.test.ts, send-authority.test.ts |
| Oddzielne konto karty, From, aliasy, Reply-To i końcowy await | single-account.test.ts, browser-delivery.test.ts, e2e/browser-delivery.spec.ts |
| API odrzucone przed tokenem/HTTP/rezerwacją, stary szeroki grant | single-account.test.ts, browser-delivery.test.ts |
| Utrata karty/lease/Stop/restart/SEND_UNKNOWN, brak retry/fallbacku | browser-delivery.test.ts, browser-crash.test.ts, browser-batch-controller.test.ts, regresje R14/R15 |
| Celowana historia i własne potwierdzenie z readonly | browser-delivery.test.ts, gmail-delivery.test.ts, gmail-reconcile-reader.test.ts |
| Zachowanie niepustego SELF_TEST/unknown, historycznych subject i blokady | browser-delivery.test.ts |
| Backup z WAL, blokady, brak nowych artefaktów i zgodność materiałów | single-account.test.ts, istniejące regresje migracji/historii |
| Allowlista diagnostyki, bez poczty i ujawniania sentinel-secret | single-account.test.ts, gmail.test.ts |
| Jedna zgodna akcja UI i normalny AUTO bez przeglądu każdego maila | browser-delivery.test.ts, e2e/browser-delivery.spec.ts, auto-policy.test.ts |

Pierwsza seria istniejących regresji miała jeden FAIL przez nowy tekst błędu,
który przestał zawierać dotychczasowe „Połącz odczyt”. Zachowano znaczenie
i kompatybilny prefiks komunikatu. Pierwsze nowe testy miały cztery błędy
Windows cleanup: hook usuwał katalog przed zamknięciem SQLite. Poprawiono
kolejność cleanup, bez zmiany wymagań produkcyjnych. Następnie 99/99 celowanych
PASS i dodatkowe 29/29 integracyjnych PASS, w tym nowy readonly przebieg.
To serie częściowo pokrywające się; nie sumujemy ich jako liczby różnych testów.

Pełny Windows check i CI dokładnego finalnego SHA mają osobne wyniki w
TEST_REPORT oraz bezpiecznych dowodach dostawy. Prywatne potwierdzenie
rzeczywistego konta jest poza repo/ZIP. Test syntetyczny nie dowodzi logowania
Gmaila, aktualnego From, historii firmy lub dostarczalności.

## Pozostała granica pilota

Pierwszy pełny lokalny check 808e9fa przeszedł 806/12/26, ale CI zachowało
CONTROL_TIMEOUT w istniejącym teście waiting-owner. Poprawka dotyczy wyłącznie
synchronizacji tego testu do rzeczywistego WAITING_WINDOW; nie zmienia
deadline5 s IPC, progów Stop, lifecycle lub produkcyjnego koordynatora.
Osobno systemowy handler Windows zastąpił nieskuteczne otwarcie przez Explorer.
Wygaśnięty callback zachowano jako OAUTH_TIMEOUT, bez pozornego sukcesu.
Powtórne logowanie użytkownika przeszło pełne sprawdzenie provider/profile
z readonly. Rzeczywiste dane konta i incydenty zakresu diagnostyki są wyłącznie
w prywatnym wyniku, bez treści korespondencji w dostawie.

Native gate wymaga osobnej obserwacji konta i dowodu Reply-To. Brak widocznego
pola Reply-To w obecnym rozpoznawaniu UI daje UNKNOWN i blokadę. Trzeba
potwierdzić obsługiwany sposób uzyskania efektywnego Reply-To; nie wystarczy
zmienić flagę lub odtworzyć stare ustawienia z raportu. Podpis jest sprawdzany
przez dokładną treść. Prawdziwa karta i połączenie OAuth wymagają udziału
użytkownika, jeśli nie są zalogowane. Pilot wymaga osobnego upoważnienia na
materiały, odbiorców/domeny, celowaną historię i tempo/limit, a potem Start.
