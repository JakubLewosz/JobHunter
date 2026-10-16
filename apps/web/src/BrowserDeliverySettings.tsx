import { useEffect, useState } from 'react';
import { api } from './api';
import type { Row } from '../../../packages/shared/types';

export function BrowserDeliverySettings() {
  const [state, setState] = useState<Row>();
  const [transport, setTransport] = useState('GMAIL_API');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void api('gmail/state').then((s) => {
      setState(s);
      setTransport(s.sendTransport);
    });
    const timer = setInterval(
      () =>
        void api('gmail/state')
          .then(setState)
          .catch(() => {}),
      2500,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="browser-delivery-settings">
      <h3>Sposób wysyłania</h3>
      <label>
        Transport wiadomości{' '}
        <select
          aria-label="Transport wiadomości"
          value={transport}
          onChange={(e) => {
            setTransport(e.target.value);
            setConsent(false);
          }}
        >
          <option value="GMAIL_API">Gmail API</option>
          <option value="GMAIL_BROWSER">Gmail w przeglądarce Codexa</option>
        </select>
      </label>
      {transport === 'GMAIL_BROWSER' && (
        <>
          <p>
            Wymaga aktywnego wykonawcy w Codexie i zalogowanego Gmaila. Sam backend nie steruje
            przeglądarką. Zamknięcie Codexa zatrzyma obsługę kolejki; program nie przełączy się sam
            na Gmail API.
          </p>
          <label>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />{' '}
            Zezwalam wykonawcy na obsługę przygotowywanej wiadomości i jej wyniku w Gmailu.
            Pozostałej poczty nie należy odczytywać.
          </label>
          <p>
            Wykonawca: {state?.browserExecutor?.connected ? 'połączony' : 'niepołączony'}. Zmiana
            sposobu wysyłania wymaga zatrzymania programu i ponownego zatwierdzenia konfiguracji.
          </p>
        </>
      )}
      <button
        className="secondary"
        disabled={
          busy ||
          !state ||
          transport === state.sendTransport ||
          (transport === 'GMAIL_BROWSER' && !consent)
        }
        onClick={() =>
          void (async () => {
            setBusy(true);
            setMessage('');
            try {
              setState(
                await api('gmail/transport', {
                  transport,
                  confirmed: true,
                  outgoingViewConsent: consent,
                }),
              );
              setMessage('Zapisano sposób wysyłki. Program pozostaje zatrzymany.');
            } catch (e) {
              setMessage(e instanceof Error ? e.message : 'Nie udało się zapisać zmiany.');
            } finally {
              setBusy(false);
            }
          })()
        }
      >
        Zapisz sposób wysyłki
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
