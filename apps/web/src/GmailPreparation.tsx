import { useEffect, useState } from 'react';
import { api } from './api';
export function GmailPreparation({ delivery = false }: { delivery?: boolean }) {
  const [email, setEmail] = useState<string>();
  useEffect(() => {
    void api('research/gmail-preparation').then((r) => setEmail(r.account?.email));
  }, []);
  if (delivery)
    return (
      <section className="panel research-panel gmail-preparation">
        <h2>Gmail — odczyt i wysyłka</h2>
        <p>
          {email
            ? `Zapisane konto: ${email}`
            : 'Najpierw wykonaj jednorazowe podłączenie Gmaila opisane poniżej.'}
        </p>
        <p>
          Historia kontaktów i potwierdzenie wysyłki wymagają dodatkowej zgody Google na odczyt
          poczty. Google daje dostęp do całej skrzynki; JobHunter ogranicza odczyty do wybranych
          adresów i domen firm oraz swoich wysłanych wątków. Wiadomości nie trafiają do modelu AI.
        </p>
        <pre className="gmail-command">npm run gmail:enable-read</pre>
        <p>
          Polecenie otworzy Google w przeglądarce, używając konfiguracji zapisanej wcześniej w
          systemowym magazynie haseł. Po logowaniu wróć do Wiadomości, wybierz zatwierdzone CV i
          przygotuj test na własny adres.
        </p>
      </section>
    );
  return (
    <section className="panel research-panel gmail-preparation">
      <h2>Przygotowanie Gmaila</h2>
      <p>
        {email
          ? `Zapisane połączenie: ${email}. Wysyłka pozostaje wyłączona.`
          : 'Jednorazowo skonfiguruj Google, potem zaloguj się w przeglądarce.'}
      </p>
      <ol>
        <li>
          W{' '}
          <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">
            Google Cloud
          </a>{' '}
          utwórz projekt JobHunter i włącz Gmail API.
        </li>
        <li>
          W Google Auth Platform ustaw aplikację testową, podaj swój email i dodaj go do
          użytkowników testowych.
        </li>
        <li>
          W Clients utwórz klienta OAuth typu Desktop app. Pobierz JSON i zapisz poza folderem
          projektu, np. w Pobranych.
        </li>
        <li>W terminalu projektu uruchom poniższe polecenie ze ścieżką do pobranego pliku.</li>
      </ol>
      <pre className="gmail-command">
        npm run gmail:connect -- "/pełna/ścieżka/client_secret.json"
      </pre>
      <p>
        Logowanie prosi o identyfikację konta i uprawnienie do wysyłania. Nie odczytuje poczty ani
        nie wysyła wiadomości. Dostęp jest zapisywany w systemowym magazynie haseł.
      </p>
      <p>
        Po zatwierdzeniu CV w „Moje materiały” możesz pobrać podgląd maila z załącznikiem w
        „Wiadomościach”. Wysyłkę wybranej paczki uruchomimy w kolejnym kroku.
      </p>
    </section>
  );
}
