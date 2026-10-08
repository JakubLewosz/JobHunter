import { useEffect, useState } from 'react';
import { api } from './api';
import type { Dashboard, Row } from '../../../packages/shared/types';
type Act = (fn: () => Promise<unknown>, message?: string) => Promise<void>;
export function ResearchPanel({
  dashboard,
  act,
  busy,
}: {
  dashboard: Dashboard;
  act: Act;
  busy: boolean;
}) {
  const [url, setURL] = useState(''),
    [contactURL, setContactURL] = useState(''),
    [query, setQuery] = useState('');
  const [sources, setSources] = useState<Row[]>([]);
  useEffect(() => {
    void api('research/sources').then(setSources);
  }, [dashboard.stats.sources]);
  const work = dashboard.state.dayWork ?? {};
  const names: Record<string, string> = {
    SEARCH: 'Szuka firm',
    READ: 'Czyta strony',
    EXTRACT: 'Sprawdza ofertę',
    QUALIFY: 'Wybiera firmy',
    DRAFT: 'Pisze wiadomość',
    QUEUED: 'Rozpoczyna pracę',
    WAITING_FOR_REVIEW: work.active ? 'Czeka na kolejny kierunek szukania' : 'Wiadomości gotowe',
    STOPPED: 'Zatrzymany',
    PAUSED: 'Pauza',
    DAY_FINISHED: 'Praca na dziś zakończona',
    TRIAL_FINISHED: 'Test zakończony',
    NO_NEW_QUERIES: 'Sprawdzone wszystkie kierunki',
    CODEX_LIMIT: 'Limit Codexa — praca wstrzymana',
    CODEX_LOGIN: 'Wymagane logowanie do Codexa',
    TIME_BUDGET: 'Praca przerwana — zapisane wyniki',
  };
  const state = names[dashboard.state.status] ?? 'Gotowy do pracy';
  const u = dashboard.state.usage;
  return (
    <div className="stack">
      <section className="panel research-panel">
        <div className="panel-head">
          <div>
            <h2>Praca Codexa</h2>
            <p>
              {work.active
                ? `${work.hours === 1 ? 'Test' : 'Praca'} do ${new Date(work.expiresAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}. Wyniki możesz sprawdzić później.`
                : 'Szuka firm i przygotowuje wiadomości na podstawie Twojej wiadomości bazowej.'}
            </p>
          </div>
          <strong>{state}</strong>
        </div>
        <div className="research-metrics">
          {[
            ['Nowe firmy', dashboard.stats.companies],
            ['Wiadomości gotowe', dashboard.stats.drafts],
            ['Do sprawdzenia', dashboard.stats.review],
          ].map(([name, value]) => (
            <div key={name}>
              <span>{name}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="button-row">
          <button
            className="primary"
            disabled={busy || !dashboard.profileApproved || !!work.active}
            onClick={() =>
              void act(
                () => api('research/trial', query ? { query } : {}),
                'Rozpoczęto godzinny test — do 10 kandydatów i 3 szkiców.',
              )
            }
          >
            Test na godzinę
          </button>
          <button
            className="secondary"
            disabled={busy || !dashboard.profileApproved || !!work.active}
            onClick={() =>
              void act(
                () => api('research/day', query ? { query } : {}),
                'Codex będzie szukał firm przez najbliższe 8 godzin.',
              )
            }
          >
            Start na 8 godzin
          </button>
          <button
            className="secondary"
            onClick={() => void act(() => api('pause', {}), 'Praca wstrzymana. Wyniki zapisane.')}
          >
            Pauza
          </button>
          <button
            className="secondary"
            onClick={() => void act(() => api('stop', {}), 'Praca zatrzymana. Wyniki zapisane.')}
          >
            Stop
          </button>
        </div>
        {!dashboard.profileApproved && (
          <p className="inline-warning">
            Najpierw przejrzyj wiadomość i projekty w „Moje materiały”, a potem zatwierdź je jednym
            przyciskiem.
          </p>
        )}
        <p className="muted">
          Wiadomości znajdziesz w „Wiadomościach”. Gmail jeszcze nie jest podłączony; ta próba
          przygotowuje szkice.
        </p>
        {dashboard.events.length > 0 && <p className="muted">{dashboard.events[0].message}</p>}
      </section>
      <details className="panel research-panel personal-details">
        <summary>Dodaj firmę ręcznie</summary>
        <label>
          Strona firmy lub ogłoszenia
          <input
            aria-label="Publiczny URL"
            value={url}
            onChange={(e) => setURL(e.target.value)}
            placeholder="https://firma.pl/kariera"
          />
        </label>
        <label>
          Strona z kontaktem (opcjonalnie)
          <input
            aria-label="URL kontaktu"
            value={contactURL}
            onChange={(e) => setContactURL(e.target.value)}
          />
        </label>
        <button
          className="secondary"
          disabled={!url || busy}
          onClick={() =>
            void act(
              () => api('research/url', { url, ...(contactURL ? { contactUrl: contactURL } : {}) }),
              'Firma dodana do sprawdzenia.',
            ).then(() => setURL(''))
          }
        >
          Dodaj URL
        </button>
      </details>
      <details className="panel research-panel personal-details">
        <summary>Szczegóły pracy i źródła</summary>
        <label>
          Inny kierunek wyszukiwania (opcjonalnie)
          <textarea
            aria-label="Kierunek wyszukiwania"
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <p>
          Test na godzinę: kolejne kierunki co 10 minut, do 10 kandydatów i 3 szkiców łącznie. Praca
          na 8 godzin: do 8 cykli, najwyżej jeden nowy cykl na godzinę. Limit Codexa lub brak
          logowania wstrzymuje pracę.
        </p>
        <p>
          Wywołania: {u?.calls ?? 0} · tokeny wejścia: {u?.inputTokens ?? 'brak danych'} · tokeny
          wyjścia: {u?.outputTokens ?? 'brak danych'} · koszt: brak danych.
        </p>
        {dashboard.runs.map((run) => (
          <div className="research-row" key={run.id}>
            <strong>
              {run.stage} · {run.status}
            </strong>
            <span>{run.error ?? ''}</span>
          </div>
        ))}
        {dashboard.state.items
          ?.filter((i: Row) => ['ERROR', 'UNAVAILABLE'].includes(i.status))
          .map((i: Row) => (
            <div className="research-row" key={i.id}>
              <span className="break-word">
                {i.url} · {i.error}
              </span>
              <button
                className="secondary"
                onClick={() =>
                  void act(() => api('research/retry', { id: i.id }), 'Przygotowano ponowienie.')
                }
              >
                Ponów etap
              </button>
            </div>
          ))}
        <div className="button-row">
          <button
            className="secondary"
            onClick={() =>
              void act(
                () => api('research/search', query ? { query } : {}),
                'Uruchomiono jeden cykl.',
              )
            }
          >
            Szukaj firm — jeden cykl
          </button>
          <button
            className="secondary"
            onClick={() => void act(() => api('research/finish', {}), 'Zakończono niepełny cykl.')}
          >
            Zakończ niepełny cykl
          </button>
          <a className="secondary" href="/api/reports/export">
            Pobierz raport
          </a>
        </div>
        {sources.map((source) => (
          <details className="research-source" key={source.id}>
            <summary>
              {source.title || source.original_url} · {source.status}
            </summary>
            <p className="break-word">
              <a href={source.original_url} target="_blank" rel="noreferrer">
                Pierwotny URL
              </a>{' '}
              →{' '}
              <a href={source.final_url ?? source.original_url} target="_blank" rel="noreferrer">
                {source.final_url ?? source.original_url}
              </a>
            </p>
            <p>
              Odczyt: {source.fetched_at} · {source.method} · HTTP {source.http_status ?? 'brak'}
            </p>
            <blockquote>{source.fragment || 'Brak odczytanego fragmentu.'}</blockquote>
            {source.status === 'READ' && (
              <button
                className="secondary"
                disabled={busy || !dashboard.profileApproved}
                onClick={() =>
                  void act(
                    () => api('research/url', { url: source.original_url }),
                    'Źródło przekazano do analizy.',
                  )
                }
              >
                Analizuj zapisane źródło
              </button>
            )}
            <p className="break-word">SHA-256: {source.content_hash ?? 'brak treści'}</p>
          </details>
        ))}
      </details>
    </div>
  );
}
export function ResearchProof({ details }: { details: Row }) {
  const tri: Record<string, string> = {
    yes: 'tak',
    no: 'nie',
    unknown: 'nieznane',
    conflicting: 'sprzeczne',
  };
  const names: Record<string, string> = {
    remote: 'W pełni zdalnie',
    partTime: 'Część etatu',
    paid: 'Płatna',
    junior: 'Początkujący / uczeń',
    hours: 'Godziny po lekcjach',
    contract: 'Umowa zlecenie',
    active: 'Aktualność',
    openInquiry: 'Otwarte kandydatury',
  };
  return (
    <div>
      <h3>Wymagania i dowody</h3>
      {Object.entries(details.conditions).map(([key, v]) => {
        const proof = v as Row;
        return (
          <details key={key}>
            <summary>
              {names[key] ?? key}: {tri[proof.value]}
            </summary>
            <p>{proof.explanation}</p>
            <blockquote>{proof.quote ?? 'Brak potwierdzenia w źródle.'}</blockquote>
            <small>Źródło: {proof.sourceId ?? 'brak'}</small>
          </details>
        );
      })}
      <h3>Wymagania oferty</h3>
      {details.requirements.map((r: Row, i: number) => (
        <p key={i}>
          {r.text}
          <br />
          <q>{r.quote}</q>
        </p>
      ))}
      <p>
        Kontakt: {details.contact.kind} · {details.contact.email ?? 'brak potwierdzonego adresu'}
      </p>
      <blockquote>{details.contact.proof.quote}</blockquote>
      {details.warnings.map((w: string, i: number) => (
        <p className="muted" key={i}>
          {w}
        </p>
      ))}
    </div>
  );
}
