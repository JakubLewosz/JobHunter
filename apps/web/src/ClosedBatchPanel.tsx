import { useEffect, useState } from 'react';
import { api } from './api';
import type { Dashboard, Row } from '../../../packages/shared/types';
type Act = (fn: () => Promise<unknown>, message?: string) => Promise<void>;
export function ClosedBatchPanel({
  dashboard,
  act,
  busy,
}: {
  dashboard: Dashboard;
  act: Act;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false),
    [rows, setRows] = useState<Row[]>([]),
    [total, setTotal] = useState(0),
    [offset, setOffset] = useState(0),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState<Record<string, number>>({}),
    [batch, setBatch] = useState<Row | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [hours, setHours] = useState(8),
    [query, setQuery] = useState(''),
    [error, setError] = useState('');
  const auto = dashboard.state.auto ?? {},
    work = dashboard.state.dayWork ?? {};
  async function load(preferredBatchId?: string) {
    const page = await api(
      `library/drafts?offset=${offset}&limit=50&search=${encodeURIComponent(search)}`,
    );
    setRows(page.items);
    setTotal(page.total);
    const batchId = preferredBatchId ?? batch?.id ?? auto.latestBatch?.id;
    if (batchId) setBatch(await api(`auto/batches/${batchId}`));
  }
  useEffect(() => {
    if (open) void load().catch((e) => setError(e.message));
  }, [open, offset, search, dashboard.events[0]?.id]);
  const action = (fn: () => Promise<unknown>) =>
    void act(async () => {
      setError('');
      const result = await fn();
      await load((result as Row)?.policy_json ? (result as Row).id : undefined);
      return result;
    });
  const selectedIds = Object.keys(selected),
    policy = batch ? JSON.parse(batch.policy_json) : null;
  return (
    <section className="panel">
      <h2>Research, biblioteka i zamknięta partia</h2>
      <button className="secondary" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Zwiń bibliotekę' : 'Otwórz bibliotekę i partie'}
      </button>
      {open && (
        <div className="stack">
          {error && <p role="alert">{error}</p>}
          <label>
            Zakres researchu
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label>
            Czas researchu w godzinach
            <input
              type="number"
              min={1}
              max={24}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </label>
          <div className="button-row">
            <button
              disabled={busy || !dashboard.state.stopped}
              onClick={() =>
                action(() => api('auto/library-research', { hours, ...(query ? { query } : {}) }))
              }
            >
              Start researchu bez wysyłki
            </button>
            {work.expiresAt && !work.active && (
              <button
                disabled={busy}
                onClick={() =>
                  action(() =>
                    api('auto/library-research', { hours: work.hours ?? hours, resume: true }),
                  )
                }
              >
                Wznów research z tym samym terminem
              </button>
            )}
            <button onClick={() => void act(() => api('stop', {}))}>Stop</button>
            <button
              disabled={busy || !dashboard.state.stopped}
              onClick={() => action(() => api('research/finish', {}))}
            >
              Zakończ częściowy cykl researchu
            </button>
            <button
              disabled={busy || !dashboard.state.stopped}
              onClick={() => action(() => api('research/reader-probe', {}))}
            >
              Sprawdź poprawę czytnika
            </button>
          </div>
          {work.expiresAt && (
            <p>
              Termin researchu: {new Date(work.expiresAt).toLocaleString('pl-PL')} ·{' '}
              {work.finalReason ?? (work.active ? 'pracuje' : 'zatrzymany')}
            </p>
          )}
          <p>
            Zapisane szkice: {total}. Kontrole dotyczą wskazanej wersji i chwili. Każda pozycja
            przechodzi ponowną kontrolę przed wysyłką.
          </p>
          <label>
            Szukaj szkiców firmy
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
            />
          </label>
          {rows.map((d) => (
            <label key={d.id} className="auto-company">
              <input
                type="checkbox"
                checked={!!selected[d.id]}
                onChange={(e) =>
                  setSelected((old) => {
                    const next = { ...old };
                    if (e.target.checked) next[d.id] = d.version;
                    else delete next[d.id];
                    return next;
                  })
                }
              />
              {d.canonical_name} · {d.email} · wersja {d.version} ·{' '}
              {d.code_status ?? 'brak kontroli'} / {d.review_status ?? 'brak review'}
              <small>
                Stan materiałów:{' '}
                {d.material_issues?.length ? d.material_issues.join(', ') : 'zgodne w chwili oceny'}{' '}
                · {d.assessed_at ? new Date(d.assessed_at).toLocaleString('pl-PL') : 'brak oceny'}
              </small>
              <small>
                {d.subject} · kontrola:{' '}
                {d.checked_at ? new Date(d.checked_at).toLocaleString('pl-PL') : 'brak'}
              </small>
            </label>
          ))}
          <div className="button-row">
            <button disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 50))}>
              Poprzednia strona szkiców
            </button>
            <span>
              {offset + 1}–{Math.min(total, offset + rows.length)} / {total}
            </span>
            <button disabled={offset + 50 >= total} onClick={() => setOffset(offset + 50)}>
              Następna strona szkiców
            </button>
          </div>
          <div className="button-row">
            <button
              disabled={busy || !selectedIds.length || !dashboard.state.stopped}
              onClick={() =>
                action(async () => {
                  const b = await api('auto/batches', {
                    drafts: selectedIds.map((id) => ({ id, version: selected[id] })),
                  });
                  setBatch(b);
                  setConfirmed(false);
                  return b;
                })
              }
            >
              Przygotuj zamkniętą partię ({selectedIds.length})
            </button>
            <button
              disabled={
                busy || !selectedIds.length || selectedIds.length > 10 || !dashboard.state.stopped
              }
              onClick={() =>
                action(async () => {
                  const result = await api('library/refresh', { draftIds: selectedIds });
                  setSelected({});
                  return result;
                })
              }
            >
              Odnów wybrane szkice (maks. 10)
            </button>
          </div>
          {batch && (
            <section aria-label="Podsumowanie partii">
              <h3>Partia · {batch.state}</h3>
              <p>
                Wersja zakresu {batch.revision} · przygotowano{' '}
                {new Date(batch.prepared_at).toLocaleString('pl-PL')}. Nadawca: {policy.senderEmail}
                ; CV: {policy.cvId}; tempo: jedna wiadomość co {policy.sendIntervalSeconds} s. Limit
                partii: {policy.sessionLimit ?? 'bez dodatkowego limitu'}, dzienny:{' '}
                {policy.dailyLimit ?? 'bez dodatkowego limitu'}.
              </p>
              <p>Zakres: {policy.searchScope}. Nowe firmy nie są dopisywane do tej partii.</p>
              <p>
                Łącznie: {batch.counts.total} · wysłane: {batch.counts.sent} · pozostałe:{' '}
                {batch.counts.remaining} · pominięte: {batch.counts.skipped} · do przygotowania:{' '}
                {batch.counts.needsPreparation} · niepewne: {batch.counts.uncertain}
              </p>
              <p>
                Transport: {auto.sendTransport}. Wykonawca browser:{' '}
                {auto.browser?.connected
                  ? 'połączony'
                  : auto.sendTransport === 'GMAIL_BROWSER'
                    ? 'niepołączony — wymagany przed Start'
                    : 'nie jest wymagany dla API'}
                . Powód: {batch.reason ?? 'brak'}.
              </p>
              <details>
                <summary>Odbiorcy, wersje i powody pozycji</summary>
                {batch.items.map((i: Row) => (
                  <p key={i.id}>
                    {i.ordinal + 1}. {i.recipient} · wersja {i.draft_version} · {i.state}{' '}
                    {i.code ?? ''}
                    {i.packets
                      ?.filter((p: Row) => ['SEND_UNKNOWN', 'SENT_PROVIDER'].includes(p.status))
                      .map((p: Row) => (
                        <button
                          key={p.id}
                          onClick={() =>
                            action(() => api(`gmail/outbox/${p.id}/reconcile`, { consent: true }))
                          }
                        >
                          Sprawdź istniejącą próbę
                        </button>
                      ))}
                  </p>
                ))}
              </details>
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Zatwierdzam ten zakres, odbiorców, wersje, materiały, nadawcę i tempo.
              </label>
              <div className="button-row">
                <button
                  disabled={busy || !confirmed || !dashboard.state.stopped}
                  onClick={() =>
                    action(async () => {
                      const b = await api(`auto/batches/${batch.id}/approve`, {
                        approvalHash: batch.approvalHash,
                        confirmed: true,
                      });
                      setBatch(b);
                      return b;
                    })
                  }
                >
                  Zatwierdź zakres partii
                </button>
                <button
                  disabled={
                    busy ||
                    !batch.approved_at ||
                    !dashboard.state.stopped ||
                    !batch.counts.remaining
                  }
                  onClick={() => action(() => api(`auto/batches/${batch.id}/start`, {}))}
                >
                  Start / wznów pozostałe pozycje partii
                </button>
                <button onClick={() => void act(() => api('stop', {}))}>Stop</button>
                <button
                  disabled={busy || !dashboard.state.stopped || !!batch.counts.uncertain}
                  onClick={() =>
                    action(async () => {
                      const b = await api(`auto/batches/${batch.id}/reprepare`, {});
                      setBatch(b);
                      setConfirmed(false);
                      return b;
                    })
                  }
                >
                  Przygotuj ponownie pozostały zakres
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
