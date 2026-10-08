import { useEffect, useState } from 'react';
import type { Row } from '../../../packages/shared/types';
import { api } from './api';

function download(item: Row) {
  const bytes = Uint8Array.from(atob(item.base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'message/rfc822' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = item.fileName;
  a.click();
  URL.revokeObjectURL(url);
}
export function GmailDelivery({
  drafts,
  cvs,
  current,
  editing,
  act,
  busy,
}: {
  drafts: Row[];
  cvs: Row[];
  current: Row;
  editing: boolean;
  act: (fn: () => Promise<any>, message: string) => Promise<any>;
  busy: boolean;
}) {
  const [state, setState] = useState<Row>();
  const [cvId, setCvId] = useState('');
  const [preview, setPreview] = useState<Row>();
  const [confirmed, setConfirmed] = useState(false);
  const chosen = drafts.length ? drafts : [current];
  const selection = chosen.map((d) => `${d.id}:${d.version}:${d.payload_hash}`).join('|');
  useEffect(() => {
    setPreview(undefined);
    setConfirmed(false);
  }, [selection, cvId, editing]);
  useEffect(() => {
    void api('gmail/state').then(setState);
    const timer = setInterval(() => void api('gmail/state').then(setState), 2500);
    return () => clearInterval(timer);
  }, []);
  const selected = chosen.map((d) => ({ id: d.id, version: d.version }));
  const prepare = (kind: 'SELF_TEST' | 'FIRST_CONTACT', diagnostic = false) =>
    void act(async () => {
      const p = await api('gmail/preview', {
        drafts: kind === 'SELF_TEST' ? [{ id: current.id, version: current.version }] : selected,
        cvId,
        kind,
        diagnostic,
      });
      setConfirmed(false);
      setPreview(p);
    }, 'Przygotowano dokładny podgląd; jeszcze nie wysłano wiadomości.');
  return (
    <section className="panel gmail-delivery">
      <h2>Gmail z moim CV</h2>
      <p>
        {state?.account
          ? `Nadawca: ${state.account.email}`
          : 'Najpierw podłącz Gmail w Połączeniach.'}
      </p>
      {state?.testRecipient && <p className="muted">Adres do testu: {state.testRecipient}</p>}
      {!state?.readReady && (
        <p className="inline-note">
          Do sprawdzenia wcześniejszych kontaktów i potwierdzenia wysyłki potrzebna jest zgoda na
          odczyt Gmaila. W Połączeniach znajdziesz polecenie logowania.
        </p>
      )}
      <label>
        CV do wysyłki{' '}
        <select
          aria-label="CV do wysyłki Gmail"
          value={cvId}
          onChange={(e) => setCvId(e.target.value)}
        >
          <option value="">Wybierz zatwierdzone CV</option>
          {cvs
            .filter((c) => c.approved_at)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.file_name}
              </option>
            ))}
        </select>
      </label>
      <p>
        Wybrano {chosen.length} {chosen.length === 1 ? 'wiadomość' : 'wiadomości'}. Pierwszy krok to
        test na własny adres. Po ręcznej edycji sprawdź zgodność treści, a następnie oznacz aktualną
        wersję jako przejrzaną.
      </p>
      <div className="button-row">
        <button
          className="secondary"
          disabled={busy || editing || !cvId || !state?.readReady}
          onClick={() => prepare('SELF_TEST')}
        >
          Podgląd testu do siebie
        </button>
        <button
          className="secondary"
          disabled={busy || editing || !cvId || !state?.readReady}
          onClick={() => prepare('SELF_TEST', true)}
        >
          Podgląd krótkiego testu bez CV
        </button>
        <button
          className="secondary"
          disabled={busy || editing || !state?.readReady || chosen.length > 3}
          onClick={() =>
            void act(async () => {
              const s = await api('gmail/history', { drafts: selected, consent: true });
              setState(s);
            }, 'Ukończono sprawdzanie historii wybranych firm.')
          }
        >
          Sprawdź historię wybranych firm
        </button>
        <button
          className="primary"
          disabled={
            busy ||
            editing ||
            !cvId ||
            !state?.readReady ||
            !state?.selfTestConfirmed ||
            chosen.length > 3
          }
          onClick={() => prepare('FIRST_CONTACT')}
        >
          Podgląd wiadomości do firm ({chosen.length})
        </button>
      </div>
      <p className="muted">
        Sprawdzenie historii odczytuje nagłówki wcześniejszej korespondencji dla wybranych adresów i
        domen firm, także w Koszu i Spamie. Zgoda aplikacji obowiązuje godzinę. Poczta pozostaje
        poza modelem AI.
      </p>
      {state?.history?.map((h: Row) => (
        <div key={`${h.company_id}:${h.account_subject}`}>
          <p className="muted">
            {h.canonical_name}:{' '}
            {h.status === 'COMPLETE'
              ? 'historia sprawdzona'
              : h.status === 'CHECKING'
                ? 'odczyt w toku'
                : 'odczyt nieukończony'}
            {h.error ? ` — ${h.error}` : ''}
          </p>
          {!!h.messages?.length && (
            <details className="personal-details">
              <summary>Zobacz zapisaną historię kontaktu</summary>
              {h.messages.map((m: Row) => (
                <p key={m.id}>
                  {m.direction === 'OUTGOING' ? 'Wysłana' : 'Otrzymana'}: {m.subject} — {m.sender} (
                  {new Date(m.sent_at).toLocaleDateString('pl-PL')})
                </p>
              ))}
            </details>
          )}
        </div>
      ))}
      {preview && (
        <div className="gmail-preview" role="dialog" aria-label="Podgląd wysyłki Gmail">
          <h3>
            {preview.kind === 'SELF_TEST'
              ? 'Test na zapisany adres osobisty'
              : 'Te wiadomości zostaną wysłane do firm'}
          </h3>
          <p>
            Nadawca: <strong>{preview.account_email}</strong> ·{' '}
            {preview.diagnostic ? (
              'Bez załącznika'
            ) : (
              <>
                CV: <strong>{preview.cvName}</strong>
              </>
            )}
          </p>
          {preview.items.map((item: Row) => (
            <article key={item.id}>
              <p>
                <strong>Do: {item.recipient}</strong>
              </p>
              <p>
                <strong>Temat: {item.subject}</strong>
              </p>
              <pre className="gmail-preview-body">{item.body}</pre>
              <button className="secondary" onClick={() => download(item)}>
                {preview.diagnostic ? 'Pobierz mail (EML)' : 'Pobierz mail z CV (EML)'}
              </button>
            </article>
          ))}
          <label className="gmail-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Sprawdziłem odbiorców, nadawcę, treść{preview.diagnostic ? '' : ' i CV'}. Zgadzam się na
            jednorazową wysyłkę tych wiadomości oraz sprawdzenie ich w Wysłanych.
          </label>
          <div className="button-row">
            <button
              className="primary"
              disabled={busy || !confirmed || editing}
              onClick={() =>
                void act(async () => {
                  await api('gmail/approve', {
                    previewId: preview.id,
                    previewHash: preview.previewHash,
                    confirmed: true,
                  });
                  setPreview(undefined);
                  setConfirmed(false);
                }, 'Te konkretne wiadomości zapisano w kolejce Gmaila.')
              }
            >
              {preview.kind === 'SELF_TEST'
                ? 'Wyślij test do siebie'
                : `Wyślij te wiadomości (${preview.items.length})`}
            </button>
            <button className="secondary" onClick={() => setPreview(undefined)}>
              Zamknij podgląd
            </button>
          </div>
        </div>
      )}
      {!!state?.outbox?.length && (
        <div className="gmail-attempts">
          <h3>Próby wysyłki</h3>
          {state.outbox.map((o: Row) => (
            <article key={o.id}>
              <strong>{o.kind === 'SELF_TEST' ? 'Test do siebie' : o.canonical_name}</strong>
              <p>
                {(
                  {
                    QUEUED: 'W kolejce',
                    SENDING: 'Wysyłanie',
                    SENT_PROVIDER: 'Gmail przyjął wiadomość; czeka na potwierdzenie',
                    SENT_CONFIRMED: 'Potwierdzona w Wysłanych',
                    SEND_UNKNOWN: 'Niepewny wynik — nie ponawiamy wysyłki',
                    FAILED_NOT_SENT: 'Nie wysłano',
                    BLOCKED: 'Zablokowana',
                    CANCELLED: 'Anulowana',
                  } as Record<string, string>
                )[o.status] ?? o.status}
                {o.reason ? ` — ${o.reason}` : ''}
              </p>
              <div className="button-row">
                {['SENT_PROVIDER', 'SEND_UNKNOWN'].includes(o.status) && (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      void act(async () => {
                        const result = await api(`gmail/outbox/${o.id}/reconcile`, {
                          consent: true,
                        });
                        setState(await api('gmail/state'));
                        return result;
                      }, 'Sprawdzono Wysłane; nie ponowiono wysyłki.')
                    }
                  >
                    Sprawdź tę próbę w Wysłanych
                  </button>
                )}
                {['SENT_CONFIRMED', 'SENT_PROVIDER'].includes(o.status) &&
                  o.kind === 'FIRST_CONTACT' && (
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          () => api(`gmail/outbox/${o.id}/replies`, { consent: true }),
                          'Odczytano odpowiedzi w tym wątku.',
                        )
                      }
                    >
                      Odczytaj odpowiedzi w tym wątku
                    </button>
                  )}
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="button-row">
        <button
          className="secondary"
          disabled={busy}
          onClick={() => void act(() => api('pause', {}), 'Wstrzymano research i wysyłkę.')}
        >
          Wstrzymaj
        </button>
        {state?.paused && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              void act(
                () => api('resume-sender', {}),
                'Wznowiono wcześniej zatwierdzone wiadomości.',
              )
            }
          >
            Wznów zatwierdzone wiadomości
          </button>
        )}
      </div>
    </section>
  );
}
