import { useEffect, useState } from 'react';
import { Play, Pause, Square, Settings, Building2, Activity } from 'lucide-react';
import type { Row, Dashboard } from '../../../packages/shared/types';
import { api } from './api';
import { PersonalMaterials } from './PersonalMaterials';
import { GmailPreparation } from './GmailPreparation';

const stateLabels: Record<string, string> = {
  STOPPED: 'Zatrzymany',
  RUNNING: 'Pracuje',
  PAUSED: 'Pauza',
  SEARCH: 'Szuka firm',
  READ: 'Czyta źródła',
  EXTRACT: 'Poznaje firmę',
  QUALIFY: 'Sprawdza kontakt',
  DRAFT: 'Przygotowuje wiadomość',
  WAITING_FOR_REVIEW: 'Gotowy do kolejnej firmy',
  QUEUE_FULL: 'Kolejka pełna — czeka na sender',
  CODEX_LIMIT: 'Limit Codexa — postęp zapisany, wznów po odnowieniu',
  SEND_UNKNOWN: 'Niepewny wynik wysyłki — rozstrzygnij w Wysłanych',
  SESSION_LIMIT: 'Osiągnięto limit sesji',
  DAILY_LIMIT: 'Osiągnięto limit dzienny',
  WAITING_FOR_NEW_SOURCES: 'Czeka na nowe źródła',
  MATERIALS_CHANGED: 'Sprawdź zmienione materiały i zatwierdź politykę',
  ACCOUNT_CHANGED: 'Sprawdź konto nadawcy i zatwierdź politykę',
  HISTORY_OWNED: 'Zakończ przekazanie na poprzednim urządzeniu',
  HISTORY_UNCONFIGURED: 'Skonfiguruj prywatną historię',
  HANDED_OFF: 'Historia przekazana',
  OWNED: 'To urządzenie posiada historię',
  UNCONFIGURED: 'Wymaga konfiguracji',
};
type Act = (fn: () => Promise<unknown>, message?: string) => Promise<void>;
export function AutoWorkspace({
  data,
  act,
  busy,
}: {
  data: { dashboard: Dashboard; profile: Row; companies: Row[]; drafts: Row[]; outbox: Row[] };
  act: Act;
  busy: boolean;
}) {
  const [view, setView] = useState<'work' | 'history' | 'settings'>('work');
  const d = data.dashboard,
    auto = d.state.auto ?? {},
    p = auto.policy;
  const [form, setForm] = useState({
    senderEmail: p?.senderEmail ?? '',
    cvId: p?.cvId ?? '',
    general: p?.contactKinds?.includes('GENERAL') ?? true,
    searchScope:
      p?.searchScope ??
      'Firmy działające w Polsce: software house’y, agencje, SaaS, aplikacje webowe, backend, integracje i automatyzacje.',
    sessionLimit: p?.sessionLimit?.toString() ?? '',
    dailyLimit: p?.dailyLimit?.toString() ?? '',
    sendIntervalSeconds: p?.sendIntervalSeconds ?? 300,
    researchIntervalSeconds: p?.researchIntervalSeconds ?? 600,
  });
  const [directory, setDirectory] = useState(auto.sync?.directory ?? ''),
    [remote, setRemote] = useState(auto.sync?.remote ?? '');
  const [confirmed, setConfirmed] = useState(false),
    [privateConfirmed, setPrivateConfirmed] = useState(false);
  const [initialHistoryConfirmed, setInitialHistoryConfirmed] = useState(false);
  const [account, setAccount] = useState('');
  useEffect(() => {
    void api('research/gmail-preparation').then((r) => {
      setAccount(r.account?.email ?? '');
    });
  }, []);
  const current = d.state.items?.find((i: Row) => i.status === 'PENDING');
  const currentCompany =
    data.companies.find((c) => c.id === current?.company_id)?.canonical_name ?? current?.url;
  const cvs = data.profile.cvs?.filter((c: Row) => c.approved_at) ?? [];
  return (
    <div className="app-shell auto-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            J<span>•</span>
          </div>
          <span>JobHunter</span>
        </div>
        <nav>
          {(
            [
              ['work', 'Praca programu', Activity],
              ['history', 'Historia firm', Building2],
              ['settings', 'Ustawienia', Settings],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              className={`nav-item ${view === key ? 'active' : ''}`}
              onClick={() => setView(key)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          AUTO_POLICY · Gmail
          <br />
          Pierwszy kontakt z CV
        </div>
      </aside>
      <main className="main-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">JOBHUNTER / AUTO_POLICY</p>
            <h1>
              {view === 'work'
                ? 'Praca programu'
                : view === 'history'
                  ? 'Historia firm'
                  : 'Ustawienia'}
            </h1>
            <p>Odpowiedzi czytasz i obsługujesz sam w Gmailu.</p>
          </div>
        </div>
        {view === 'work' && (
          <>
            <section className="panel research-panel">
              <div className="button-row">
                <button
                  className="primary"
                  disabled={busy || !p || (auto.session?.status === 'RUNNING' && !d.state.paused)}
                  onClick={() =>
                    void act(() => api('auto/start', {}), 'Sesja uruchomiona zgodnie z polityką.')
                  }
                >
                  <Play size={16} />
                  {auto.session && d.state.paused
                    ? 'Wznów — szukaj i wysyłaj'
                    : 'Start — szukaj i wysyłaj'}
                </button>
                <button className="secondary" onClick={() => void act(() => api('pause', {}))}>
                  <Pause size={16} />
                  Pauza
                </button>
                <button className="secondary" onClick={() => void act(() => api('stop', {}))}>
                  <Square size={16} />
                  Stop
                </button>
              </div>
              <h2>{stateLabels[d.state.status] ?? d.state.status}</h2>
              <p>
                {currentCompany ? `Obecnie: ${currentCompany}` : 'Postęp jest zapisany lokalnie.'}
              </p>
              {auto.session?.reason && (
                <p role="status">
                  Powód: {stateLabels[auto.session.reason] ?? auto.session.reason}. Sprawdź
                  szczegóły poniżej i użyj jawnego Wznów po rozwiązaniu problemu.
                </p>
              )}
              <div className="stats-grid">
                {[
                  [d.stats.discovered ?? 0, 'Znalezione firmy'],
                  [d.stats.sent ?? 0, 'Pierwsze wiadomości'],
                  [d.stats.skipped ?? 0, 'Pominięcia'],
                ].map(([value, label]) => (
                  <div className="stat-card" key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p>Nadawca: {p?.senderEmail ?? (account || 'Wymaga konfiguracji')}</p>
              <p>
                CV:{' '}
                {cvs.find((c: Row) => c.id === p?.cvId)?.file_name ??
                  'Wybierz i zatwierdź w Ustawieniach'}
              </p>
              <p>
                Limit sesji: {p?.sessionLimit ?? 'bez limitu'} · dziennie:{' '}
                {p?.dailyLimit ?? 'bez limitu'} · odstęp: {p?.sendIntervalSeconds ?? '—'} s
              </p>
              <p>
                Historia:{' '}
                {stateLabels[auto.sync?.status] ?? auto.sync?.status ?? 'Wymaga konfiguracji'}
              </p>
              <button
                className="secondary"
                onClick={() =>
                  void act(() => api('auto/handoff', {}), 'Sesja zakończona i historia przekazana.')
                }
                disabled={busy || auto.sync?.status !== 'OWNED'}
              >
                Stop i przekaż historię drugiemu urządzeniu
              </button>
            </section>
            {!p && (
              <section className="panel">
                <p>
                  Zatwierdź materiały, CV, nadawcę i politykę w Ustawieniach. Start jest osobną
                  zgodą na pracę sesji.
                </p>
                <button className="secondary" onClick={() => setView('settings')}>
                  Otwórz ustawienia
                </button>
              </section>
            )}
            <section className="panel">
              <h2>Ostatnie działania</h2>
              {d.events.slice(0, 12).map((e: Row) => (
                <p key={e.id}>
                  <time>{new Date(e.created_at).toLocaleString('pl-PL')}</time> — {e.message}
                </p>
              ))}
            </section>
          </>
        )}
        {view === 'history' && (
          <section className="panel">
            <p>
              Potwierdzenie w Wysłanych oznacza zapis u nadawcy; nie potwierdza folderu odbiorcy.
              Testy do siebie są poza licznikiem firm.
            </p>
            {data.companies.map((c) => {
              const sent = data.outbox.find(
                  (o) => o.company_id === c.id && o.kind === 'FIRST_CONTACT',
                ),
                draft = data.drafts.find((d) => d.company_id === c.id),
                shared = c.sharedAttempt;
              return (
                <details className="auto-company" key={c.id}>
                  <summary>
                    <strong>{c.canonical_name}</strong> ·{' '}
                    {sent?.status ?? shared?.state ?? c.history_status}
                    {sent?.created_at &&
                      ` · ${new Date(sent.created_at).toLocaleDateString('pl-PL')}`}
                  </summary>
                  {c.primary_domain && (
                    <p>
                      <a href={`https://${c.primary_domain}`} target="_blank" rel="noreferrer">
                        {c.primary_domain}
                      </a>
                    </p>
                  )}
                  <p>{c.researchDetails?.title ?? c.description ?? c.title ?? ''}</p>
                  <p>{draft?.email ?? shared?.recipient ?? c.email ?? 'Kontakt niepotwierdzony'}</p>
                  <h3>{sent?.subject ?? shared?.subject ?? draft?.subject ?? 'Bez wiadomości'}</h3>
                  <pre className="message-preview">
                    {sent?.body ?? shared?.body ?? draft?.body ?? ''}
                  </pre>
                  {sent && ['SEND_UNKNOWN', 'SENT_PROVIDER'].includes(sent.status) && (
                    <button
                      className="secondary"
                      onClick={() =>
                        void act(
                          () => api(`gmail/outbox/${sent.id}/reconcile`, { consent: true }),
                          'Sprawdzono istniejącą próbę w Wysłanych, bez ponownego send.',
                        )
                      }
                    >
                      Sprawdź tę próbę w Wysłanych
                    </button>
                  )}
                  <p>{c.suppression_reason ?? sent?.reason ?? c.skipReason ?? c.reasons ?? ''}</p>
                  {c.sources?.map((s: Row) => (
                    <p key={s.canonical_url + s.fetched_at}>
                      <a href={s.canonical_url} target="_blank" rel="noreferrer">
                        Źródło
                      </a>{' '}
                      · {new Date(s.fetched_at).toLocaleString('pl-PL')}
                      <br />
                      {s.fragment}
                    </p>
                  ))}
                  {c.researchDetails && (
                    <div>
                      <h3>Warunki i podstawa kontaktu</h3>
                      <p>
                        Rodzaj:{' '}
                        {
                          (
                            {
                              ACTIVE: 'Aktywna oferta',
                              OPEN: 'Otwarte kandydatury',
                              PROSPECT: 'Zapytanie bez potwierdzonego naboru',
                              ARCHIVED: 'Archiwum',
                              UNKNOWN: 'Niepotwierdzony',
                            } as Record<string, string>
                          )[c.researchDetails.type]
                        }
                      </p>
                      {Object.entries(c.researchDetails.conditions).map(([key, value]) => {
                        const condition = value as Row;
                        return (
                          <p key={key}>
                            <strong>
                              {
                                (
                                  {
                                    remote: 'Zdalność',
                                    partTime: 'Część etatu',
                                    paid: 'Odpłatność',
                                    junior: 'Początkujący',
                                    hours: 'Godziny',
                                    contract: 'Umowa',
                                    active: 'Aktualny nabór',
                                    openInquiry: 'Otwarte zgłoszenia',
                                  } as Record<string, string>
                                )[key]
                              }
                              :
                            </strong>{' '}
                            {
                              (
                                {
                                  yes: 'potwierdzone',
                                  no: 'wykluczone',
                                  unknown: 'nieznane',
                                  conflicting: 'sprzeczne',
                                } as Record<string, string>
                              )[condition.value]
                            }{' '}
                            — {condition.explanation}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </details>
              );
            })}
          </section>
        )}
        {view === 'settings' && (
          <>
            <details className="panel" open={!data.profile.approved_at}>
              <summary>Moje materiały i CV</summary>
              <PersonalMaterials profile={data.profile} act={act} busy={busy} />
            </details>
            <details className="panel">
              <summary>Połączenie Gmaila i Codexa</summary>
              <GmailPreparation delivery />
              <div className="button-row">
                <button
                  className="secondary"
                  onClick={() => void act(() => api('integrations/codex/probe', {}))}
                >
                  Sprawdź Codexa
                </button>
                <button
                  className="secondary"
                  onClick={() => void act(() => api('integrations/search/probe', {}))}
                >
                  Sprawdź wyszukiwanie
                </button>
              </div>
            </details>
            <section className="panel">
              <h2>Polityka automatycznej sesji</h2>
              <label>
                Nadawca (bieżące konto: {account || 'brak'})
                <input
                  value={form.senderEmail}
                  onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                />
              </label>
              <label>
                Zatwierdzone CV
                <select
                  value={form.cvId}
                  onChange={(e) => setForm({ ...form, cvId: e.target.value })}
                >
                  <option value="">Wybierz CV</option>
                  {cvs.map((c: Row) => (
                    <option value={c.id} key={c.id}>
                      {c.file_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.general}
                  onChange={(e) => setForm({ ...form, general: e.target.checked })}
                />
                Dopuszczam rzeczywisty kontakt GENERAL do zapytania o współpracę
              </label>
              <label>
                Zakres poszukiwań
                <textarea
                  value={form.searchScope}
                  onChange={(e) => setForm({ ...form, searchScope: e.target.value })}
                />
              </label>
              <div className="form-grid">
                {(
                  [
                    ['sessionLimit', 'Limit wiadomości w sesji (puste = bez limitu)'],
                    ['dailyLimit', 'Limit dzienny (puste = bez limitu)'],
                    ['sendIntervalSeconds', 'Odstęp między wysyłkami, sekundy'],
                    ['researchIntervalSeconds', 'Odstęp między cyklami researchu, sekundy'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min={key.includes('Interval') ? 60 : 1}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [key]: key.includes('Interval') ? Number(e.target.value) : e.target.value,
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Zatwierdzam wskazane konto, aktualne fakty i CV, zakres, kontakty i tempo.
                Dopuszczam celowany odczyt nagłówków historii wyłącznie adresów i potwierdzonych
                domen wybranych firm. Po Start zgodne pierwsze wiadomości będą wysyłane
                automatycznie.
              </label>
              <button
                className="primary"
                disabled={busy || !confirmed || !d.state.stopped}
                onClick={() =>
                  void act(async () => {
                    await api('auto/policy', {
                      senderEmail: form.senderEmail,
                      cvId: form.cvId,
                      contactKinds: form.general ? ['RECRUITMENT', 'GENERAL'] : ['RECRUITMENT'],
                      contactTypes: ['ACTIVE', 'OPEN', 'PROSPECT'],
                      searchScope: form.searchScope,
                      sessionLimit: form.sessionLimit ? Number(form.sessionLimit) : null,
                      dailyLimit: form.dailyLimit ? Number(form.dailyLimit) : null,
                      sendIntervalSeconds: form.sendIntervalSeconds,
                      researchIntervalSeconds: form.researchIntervalSeconds,
                      confirmed: true,
                      targetedHistoryConsent: true,
                    });
                    setConfirmed(false);
                  }, 'Polityka zatwierdzona. Sesja wymaga Start.')
                }
              >
                Zatwierdź politykę
              </button>
            </section>
            <section className="panel">
              <h2>Prywatne repozytorium historii</h2>
              <p>
                Wskaż osobne, sklonowane prywatne repozytorium na gałęzi main. Po zakończeniu sesji
                użyj „Stop i przekaż historię”. Niedomknięta sesja blokuje drugie urządzenie.
              </p>
              <label>
                Katalog lokalny
                <input value={directory} onChange={(e) => setDirectory(e.target.value)} />
              </label>
              <label>
                Dokładny adres origin
                <input value={remote} onChange={(e) => setRemote(e.target.value)} />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={privateConfirmed}
                  onChange={(e) => setPrivateConfirmed(e.target.checked)}
                />
                Potwierdzam, że wskazany origin jest moim prywatnym repozytorium i zatwierdzam
                publikowanie tam minimalnej historii.
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={initialHistoryConfirmed}
                  onChange={(e) => setInitialHistoryConfirmed(e.target.checked)}
                />
                Przy pierwszym utworzeniu historii: ta lokalna baza zawiera dotychczasowe kontakty.
                Potwierdzam ją jako początkowe źródło historii.
              </label>
              <button
                className="secondary"
                disabled={busy || !privateConfirmed || !d.state.stopped}
                onClick={() =>
                  void act(
                    () =>
                      api('auto/history/configure', {
                        directory,
                        expectedRemote: remote,
                        confirmedPrivate: true,
                        confirmedInitialHistory: initialHistoryConfirmed,
                      }),
                    'Konfiguracja prywatnej historii zapisana.',
                  )
                }
              >
                Zapisz repozytorium historii
              </button>
              <button
                className="secondary"
                disabled={busy || !d.state.stopped || !auto.sync?.configured}
                onClick={() =>
                  void act(
                    () => api('auto/history/prepare', {}),
                    'Przygotowano i opublikowano historię bez uruchamiania sesji wysyłkowej.',
                  )
                }
              >
                Przygotuj historię bez uruchamiania sesji
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
