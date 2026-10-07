import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Download,
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Pause,
  Play,
  PlugZap,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Terminal,
  Upload,
  UserRound,
  X,
  AlertTriangle,
  ExternalLink,
  CheckCheck,
  CircleCheck,
  Info,
} from 'lucide-react';
import { api, initialize } from './api';
import type { Dashboard, Row } from '../../../packages/shared/types';

type Screen =
  | 'dashboard'
  | 'companies'
  | 'drafts'
  | 'replies'
  | 'profile'
  | 'campaign'
  | 'integrations'
  | 'reports';
const nav = [
  ['dashboard', 'Dzisiaj', LayoutDashboard],
  ['companies', 'Firmy i oferty', Building2],
  ['drafts', 'Wiadomości', Mail],
  ['replies', 'Odpowiedzi', MessageSquare],
  ['profile', 'Profil i CV', UserRound],
  ['campaign', 'Kampania', SlidersHorizontal],
  ['integrations', 'Integracje', PlugZap],
  ['reports', 'Raporty', FileText],
] as const;
const titles: Record<Screen, [string, string]> = {
  dashboard: [
    'Twój kolejny krok zaczyna się tutaj.',
    'Przegląd poszukiwań, najważniejszych działań i spraw do decyzji.',
  ],
  companies: [
    'Znajdź właściwe miejsce.',
    'Firmy, oferty i dowody dopasowania. Każda decyzja ma swój powód.',
  ],
  drafts: [
    'Dobry kontakt zaczyna się od wiadomości.',
    'Przejrzyj treść, źródła i odbiorcę, zanim zatwierdzisz symulację.',
  ],
  replies: [
    'Rozmowy, które warto kontynuować.',
    'Sprawdź odpowiedzi i potwierdź ich klasyfikację.',
  ],
  profile: [
    'Twoje doświadczenie. Twoimi słowami.',
    'Sprawdź fakty, które mogą znaleźć się w wiadomościach.',
  ],
  campaign: ['Praca w Twoim rytmie.', 'Ustaw limity i harmonogram dla lokalnej kampanii demo.'],
  integrations: [
    'Wszystko pod kontrolą.',
    'Dostępność, konfiguracja i wykonany test to trzy osobne rzeczy.',
  ],
  reports: [
    'Zobacz, co zostało zrobione.',
    'Trwałe zdarzenia, wiadomości i wyniki cykli w jednym miejscu.',
  ],
};
const labels: Record<string, string> = {
  READY_APPLICATION: 'Gotowa do aplikacji',
  READY_OPEN_INQUIRY: 'Otwarta kandydatura',
  NEEDS_REVIEW: 'Do sprawdzenia',
  REJECTED: 'Odrzucona',
  NEW: 'Nowa firma',
  HISTORY_TO_VERIFY: 'Historia do sprawdzenia',
  CONTACTED: 'Kontaktowano',
  ACTIVE_CONVERSATION: 'Aktywna rozmowa',
  RECRUITMENT_ON_HOLD: 'Rekrutacja wstrzymana',
  ON_HOLD: 'Rekrutacja wstrzymana',
  APPROVED: 'Zatwierdzona',
  SENT: 'Wysłana w demo',
  SENT_PROVIDER: 'Przyjęta przez mock',
  SENT_CONFIRMED: 'Potwierdzona w Wysłanych',
  SEND_UNKNOWN: 'Niepewny wynik',
  QUEUED: 'W kolejce',
  SENDING: 'Wysyłanie',
  BLOCKED: 'Zablokowana',
  CANCELLED: 'Anulowana',
  FAILED_NOT_SENT: 'Nie wysłano',
  RUNNING: 'Pracuje',
  DISPATCHING: 'Symuluje wysyłki',
  PAUSED: 'Pauza',
  STOPPED: 'Zatrzymany',
  IDLE: 'Gotowy',
  WAITING_FOR_APPROVAL: 'Czeka na decyzję',
  NO_NEW_CANDIDATES: 'Brak nowych firm',
  DAILY_LIMIT: 'Limit dzienny',
  CYCLE_LIMIT: 'Limit cyklu',
  CAMPAIGN_LIMIT: 'Limit kampanii',
  ERROR: 'Błąd',
  COMPLETED: 'Zakończony',
  INTERESTED: 'Zainteresowanie',
  INVITATION: 'Zaproszenie',
  QUESTION: 'Pytanie',
  TASK: 'Zadanie',
  AUTORESPONDER: 'Autoresponder',
  BOUNCE: 'Zwrot',
  UNCLEAR: 'Niejasna',
  ACTIVE: 'Aktywna oferta',
  OPEN: 'Otwarty nabór',
  ARCHIVED: 'Archiwalna oferta',
  NORMAL: 'Normalny przebieg',
  TIMEOUT_AFTER_SEND: 'Timeout po przyjęciu',
  FAIL_BEFORE_SEND: 'Błąd przed wysyłką',
  PROVIDER_ONLY: 'Bez potwierdzenia w Wysłanych',
  BOUNCE_REPLY: 'Trwały zwrot adresu',
};
const label = (v: string) => labels[v] ?? v;
const date = (v?: string | null) =>
  v
    ? new Intl.DateTimeFormat('pl-PL', {
        timeZone: 'Europe/Warsaw',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(v))
    : '—';
function Badge({ value, children }: { value: string; children?: ReactNode }) {
  return (
    <span
      className={`badge ${['READY_APPLICATION', 'READY_OPEN_INQUIRY', 'SENT_CONFIRMED', 'INTERESTED', 'APPROVED', 'READY', 'COMPLETED'].includes(value) ? 'green' : ['REJECTED', 'BLOCKED', 'SEND_UNKNOWN', 'FAILED_NOT_SENT', 'ERROR', 'BOUNCE'].includes(value) ? 'red' : ['NEEDS_REVIEW', 'HISTORY_TO_VERIFY', 'QUESTION', 'WAITING_FOR_APPROVAL', 'ON_HOLD', 'RECRUITMENT_ON_HOLD', 'UNCONFIGURED', 'NOT_TESTED'].includes(value) ? 'amber' : 'gray'}`}
    >
      {children ?? label(value)}
    </span>
  );
}
function Empty({
  icon = Search,
  title,
  text,
  action,
}: {
  icon?: typeof Search;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={25} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Section({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
type Data = {
  dashboard: Dashboard;
  profile: Row;
  companies: Row[];
  drafts: Row[];
  replies: Row[];
  campaign: Row;
  capabilities: Row;
  reports: Row;
  outbox: Row[];
};
type Act = (fn: () => Promise<unknown>, message?: string) => Promise<void>;

export function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [data, setData] = useState<Data>();
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  async function load() {
    const paths = [
      'dashboard',
      'profile',
      'companies',
      'drafts',
      'replies',
      'campaign',
      'capabilities',
      'reports',
      'outbox',
    ] as const;
    const values = await Promise.all(paths.map((p) => api(p)));
    setData(Object.fromEntries(paths.map((p, i) => [p, values[i]])) as Data);
  }
  useEffect(() => {
    let alive = true;
    initialize()
      .then(() => {
        if (alive) {
          setReady(true);
          void load().catch((e) => setError(e.message));
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => void load().catch((e) => setError(e.message)), 2000);
    return () => clearInterval(t);
  }, [ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const act: Act = async (fn, message) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      if (message) setToast(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd operacji.');
    } finally {
      setBusy(false);
    }
  };
  if (!data)
    return (
      <div className="boot">
        <div className="brand-mark">
          J<span>•</span>
        </div>
        <h1>JobHunter</h1>
        <p>{error || 'Przygotowuję Twój panel…'}</p>
        {error && (
          <p className="muted">
            Uruchom backend, a potem otwórz panel poleceniem <code>npm run open</code>.
          </p>
        )}
      </div>
    );
  const d = data.dashboard;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setScreen('dashboard');
          }}
        >
          <div className="brand-mark">
            J<span>•</span>
          </div>
          <span>
            JobHunter<span className="brand-caption">MIEJSCE NA TWÓJ START</span>
          </span>
        </a>
        <div className="nav-label">TWOJA PRZESTRZEŃ</div>
        <nav>
          {nav.map(([key, name, Icon]) => (
            <button
              key={key}
              className={`nav-item ${screen === key ? 'active' : ''}`}
              aria-label={name}
              title={name}
              onClick={() => setScreen(key)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {key === 'drafts' && d.pending > 0 && <b>{d.pending}</b>}
              {key === 'replies' && data.replies.some((r) => !r.reviewed_at) && (
                <i className="nav-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Lokalnie i pod kontrolą</strong>
              <p>Twoje dane na tym komputerze</p>
            </div>
          </div>
          <div className="candidate">
            <div className="avatar">JL</div>
            <div>
              <strong>{data.profile.name}</strong>
              <span>Przestrzeń kandydata</span>
            </div>
            <Badge value="DEMO">DEMO</Badge>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Twoja przestrzeń <ChevronRight size={13} />
            <strong>{nav.find((n) => n[0] === screen)?.[1]}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-indicator">
              <i /> Lokalny panel
            </span>
            <span className="topdate">
              {new Intl.DateTimeFormat('pl-PL', {
                timeZone: 'Europe/Warsaw',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date())}
            </span>
            <div className="avatar small">JL</div>
          </div>
        </header>
        <main>
          <div className="demo-banner">
            <span>
              <Info size={16} />
              <strong>Tryb demonstracyjny</strong>
              <span className="banner-detail">
                Fikcyjne firmy, lokalne szkice i symulowane wiadomości.
              </span>
            </span>
            <span className="simulation-label">SYMULACJA · ZERO PRAWDZIWYCH WYSYŁEK</span>
          </div>
          {error && (
            <div className="error" role="alert">
              <AlertTriangle size={18} />
              <span>{error}</span>
              <button aria-label="Zamknij błąd" onClick={() => setError('')}>
                <X size={17} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {screen === 'dashboard'
                  ? 'DOBRZE CIĘ WIDZIEĆ, JAKUB'
                  : nav.find((n) => n[0] === screen)?.[1].toUpperCase()}
              </div>
              <h1>{titles[screen][0]}</h1>
              <p>{titles[screen][1]}</p>
            </div>
            {screen === 'dashboard' && (
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  d.profileApproved
                    ? void act(() => api('campaign/start', {}), 'Cykl demo uruchomiony.')
                    : setScreen('profile')
                }
              >
                <Play size={16} />
                {d.profileApproved ? 'Uruchom cykl demo' : 'Sprawdź profil'}
              </button>
            )}
          </div>
          {screen === 'dashboard' && (
            <DashboardView data={data} go={setScreen} act={act} busy={busy} />
          )}
          {screen === 'companies' && <CompaniesView data={data} act={act} />}
          {screen === 'drafts' && <DraftsView data={data} act={act} busy={busy} />}
          {screen === 'replies' && <RepliesView data={data} act={act} />}
          {screen === 'profile' && <ProfileView data={data} act={act} busy={busy} />}
          {screen === 'campaign' && <CampaignView data={data} act={act} busy={busy} />}
          {screen === 'integrations' && <IntegrationsView data={data} />}
          {screen === 'reports' && <ReportsView data={data} act={act} />}
          <footer>
            <span>
              JobHunter <span className="muted">/</span> krok po kroku do dobrej współpracy
            </span>
            <span>DEMO · E0–E2 · Dane z SQLite</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={19} />
          {toast}
        </div>
      )}
    </div>
  );
}

function DashboardView({
  data,
  go,
  act,
  busy,
}: {
  data: Data;
  go: (s: Screen) => void;
  act: Act;
  busy: boolean;
}) {
  const d = data.dashboard;
  const metrics = [
    ['Nowe firmy', d.stats.companies, Building2, 'Zweryfikowane źródła demo'],
    ['Lokalne szkice', d.stats.drafts, Mail, 'Wiadomości przygotowane dziś'],
    ['Wysyłki demo', d.stats.sent, SendIcon, 'Przyjęte przez adapter mock'],
    ['Odpowiedzi', d.stats.replies, MessageSquare, 'Symulowane wiadomości zwrotne'],
  ] as const;
  return (
    <>
      <div className="metrics">
        {metrics.map(([name, count, Icon, note]) => (
          <div className="metric" key={name}>
            <div className="metric-top">
              <span>{name}</span>
              <div className="metric-icon">
                <Icon size={18} />
              </div>
            </div>
            <strong>{count.toString().padStart(2, '0')}</strong>
            <p>{note}</p>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <Section
            title="Przebieg kampanii"
            subtitle="Od właściwej firmy do pierwszej rozmowy"
            action={<Badge value={d.state.status} />}
          >
            <div className="worker">
              <div className={`worker-symbol ${d.state.status === 'RUNNING' ? 'pulsing' : ''}`}>
                <Search size={26} />
              </div>
              <div>
                <h3>
                  {d.profileApproved
                    ? d.runs.length
                      ? 'Twoje poszukiwania są zapisane.'
                      : 'Gotowy na pierwszy cykl?'
                    : 'Zacznij od swojego profilu.'}
                </h3>
                <p>
                  {d.profileApproved
                    ? 'Uruchom cykl, sprawdź dopasowanie i zatwierdź wybrane wiadomości.'
                    : 'Przejrzyj propozycję faktów o Tobie. Demo nie wymaga CV ani konta Gmail.'}
                </p>
              </div>
            </div>
            <div className="pipeline">
              {[
                ['Research', d.stats.companies],
                ['Dopasowanie', d.stats.qualified],
                ['Szkice', d.stats.drafts],
                ['Wysyłki demo', d.stats.sent],
              ].map(([name, num], i) => (
                <div key={name}>
                  <span className={Number(num) > 0 ? 'done' : ''}>
                    {Number(num) > 0 ? <Check size={13} /> : i + 1}
                  </span>
                  <strong>{name}</strong>
                  <small>
                    {num} {i === 0 ? 'firm' : i === 2 ? 'szkiców' : 'wyników'}
                  </small>
                </div>
              ))}
            </div>
            <div className="worker-meta">
              <span>
                <i className="status-dot" />
                {label(d.state.status)}
              </span>
              <span>
                Następny cykl:{' '}
                {d.campaign.schedule_enabled ? date(d.state.nextCycle) : 'ręczne uruchomienie'}
              </span>
            </div>
            <div className="worker-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void act(() => api('pause', {}), 'Praca wstrzymana.')}
              >
                <Pause size={14} />
                Pauza
              </button>
              <button
                className="secondary danger-text"
                disabled={busy}
                onClick={() => void act(() => api('emergency-stop', {}), 'Wysyłka zatrzymana.')}
              >
                <ShieldCheck size={14} />
                Zatrzymaj wysyłkę
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => void act(() => api('stop', {}), 'Kampania zatrzymana.')}
              >
                <Square size={13} />
                Stop wszystko
              </button>
            </div>
            {d.state.killSwitch && (
              <div className="inline-warning">
                <AlertTriangle size={16} />
                Sender jest zatrzymany. Rozstrzygnij niepewne próby i wznów go w Kampanii.
              </div>
            )}
          </Section>
          <Section
            title="Firmy na Twoim radarze"
            subtitle="Najnowsze wyniki z uzasadnieniem"
            action={
              <button className="text-button" onClick={() => go('companies')}>
                Wszystkie firmy <ArrowUpRight size={15} />
              </button>
            }
          >
            {d.recentCompanies.length ? (
              <div className="company-preview">
                {d.recentCompanies.map((c) => (
                  <button className="company-line" key={c.id} onClick={() => go('companies')}>
                    <div className="company-logo">{c.canonical_name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{c.canonical_name}</strong>
                      <span>{c.title}</span>
                    </div>
                    <Badge value={c.decision} />
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <Empty
                title="Twój radar czeka na pierwszy cykl"
                text="Tutaj pojawią się firmy, źródła i powody dopasowania."
              />
            )}
          </Section>
        </div>
        <div className="stack">
          <section className="decision-card">
            <div className="decision-title">
              <span className="light-icon">
                <CheckCheck size={20} />
              </span>
              <span>TWÓJ RUCH</span>
            </div>
            <h2>
              {!d.profileApproved
                ? 'Sprawdź profil, zanim ruszymy.'
                : d.pending
                  ? `${d.pending} wiadomości czeka na Ciebie.`
                  : 'Wszystko na bieżąco.'}
            </h2>
            <p>
              {!d.profileApproved
                ? 'To Ty zatwierdzasz fakty, na których będą opierać się szkice.'
                : d.pending
                  ? 'Przejrzyj odbiorców, treść i źródła. Zatwierdzenie uruchomi wyłącznie symulację.'
                  : 'Po kolejnym cyklu znajdziesz tu sprawy wymagające Twojej decyzji.'}
            </p>
            <button onClick={() => go(!d.profileApproved ? 'profile' : 'drafts')}>
              {!d.profileApproved ? 'Przejrzyj profil' : 'Przejrzyj wiadomości'}
              <ArrowUpRight size={17} />
            </button>
          </section>
          <Section title="Dzisiaj, krok po kroku" subtitle="Jakość kontaktów ma znaczenie">
            <div className="daily-rows">
              {[
                ['Oferty zakwalifikowane', d.stats.qualified],
                ['Duplikaty pominięte', d.stats.duplicates],
                ['Dopasowania odrzucone', d.stats.rejected],
                ['Niepewne wysyłki', d.unknown],
                ['Zainteresowanie potwierdzone', d.stats.interested],
              ].map(([name, n]) => (
                <div key={name}>
                  <span>{name}</span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
            <div className="quota">
              <div>
                <span>Limit wysyłek demo na dziś</span>
                <strong>
                  {d.stats.reserved} / {d.campaign.daily_limit}
                </strong>
              </div>
              <progress
                max={d.campaign.daily_limit}
                value={Math.min(d.campaign.daily_limit, d.stats.reserved)}
              />
              <small>Rezerwacje i niepewne próby także zużywają limit.</small>
            </div>
          </Section>
        </div>
      </div>
      <Section
        title="Aktywność z ostatnich 7 dni"
        subtitle="Firmy i szkice z zapisanych zdarzeń"
        action={
          <div className="chart-legend">
            <span>
              <i />
              Firmy
            </span>
            <span>
              <i />
              Szkice
            </span>
          </div>
        }
      >
        <DailyChart data={d} />
      </Section>
      <Section
        title="Ostatnie działania"
        subtitle="Historia zapisana w lokalnej bazie"
        action={
          <button className="text-button" onClick={() => go('reports')}>
            Zobacz raport <ArrowUpRight size={15} />
          </button>
        }
      >
        <div className="activity">
          {d.events.slice(0, 5).map((e) => (
            <div className="activity-row" key={e.id}>
              <span
                className={`activity-icon ${e.action.includes('BLOCK') || e.action === 'ERROR' ? 'warn' : ''}`}
              >
                {e.action === 'DRAFTED' ? (
                  <Mail size={15} />
                ) : e.action === 'SENT' ? (
                  <SendIcon size={15} />
                ) : e.action === 'REPLY' ? (
                  <MessageSquare size={15} />
                ) : (
                  <Check size={15} />
                )}
              </span>
              <div>
                <strong>{e.message}</strong>
                <span>{e.actor === 'user' ? 'Twoja decyzja' : 'System lokalny'}</span>
              </div>
              <time>{date(e.created_at)}</time>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
function SendIcon({ size = 18 }: { size?: number }) {
  return <ArrowUpRight size={size} />;
}
function DailyChart({ data }: { data: Dashboard }) {
  const rows = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(`${data.day}T12:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() - 6 + i);
    const key = dt.toISOString().slice(0, 10);
    const values = data.daily.find((d) => d.day === key);
    return { day: key, dt, companies: values?.companies ?? 0, drafts: values?.drafts ?? 0 };
  });
  const max = Math.max(1, ...rows.flatMap((r) => [r.companies, r.drafts]));
  return (
    <div
      className="daily-chart"
      role="img"
      aria-label={`Wykres aktywności. ${rows.map((r) => `${r.day}: ${r.companies} firm, ${r.drafts} szkiców`).join('; ')}`}
    >
      {rows.map((r) => (
        <div className="chart-day" key={r.day}>
          <div className="chart-bars">
            <div
              className="chart-bar companies-bar"
              style={{ height: `${Math.max(2, (r.companies / max) * 100)}%` }}
              title={`${r.companies} firm`}
            >
              {r.companies > 0 && <span>{r.companies}</span>}
            </div>
            <div
              className="chart-bar drafts-bar"
              style={{ height: `${Math.max(2, (r.drafts / max) * 100)}%` }}
              title={`${r.drafts} szkiców`}
            >
              {r.drafts > 0 && <span>{r.drafts}</span>}
            </div>
          </div>
          <span>
            {new Intl.DateTimeFormat('pl-PL', {
              timeZone: 'Europe/Warsaw',
              day: 'numeric',
              month: 'short',
            }).format(r.dt)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CompaniesView({ data, act }: { data: Data; act: Act }) {
  const [filter, setFilter] = useState('results');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Row>();
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<Row>();
  const [importOpen, setImportOpen] = useState(false);
  const rows = data.companies.filter(
    (c) =>
      (filter === 'history'
        ? !c.opportunity_id
        : filter === 'results'
          ? !!c.opportunity_id
          : c.decision === filter) &&
      `${c.canonical_name} ${c.title ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  );
  const tri = (v: string) =>
    ({ yes: 'Tak', no: 'Nie', unknown: 'Nieznane', conflicting: 'Sprzeczne' })[v] ?? '—';
  return (
    <>
      <div className="toolbar">
        <div className="tabs">
          {[
            ['results', 'Wyniki researchu'],
            ['READY_APPLICATION', 'Gotowe'],
            ['NEEDS_REVIEW', 'Do sprawdzenia'],
            ['REJECTED', 'Odrzucone'],
            ['history', 'Historia'],
          ].map(([key, name]) => (
            <button
              className={filter === key ? 'selected' : ''}
              key={key}
              onClick={() => setFilter(key)}
            >
              {name}
            </button>
          ))}
        </div>
        <button className="secondary" onClick={() => setImportOpen(!importOpen)}>
          <Upload size={15} />
          Import historii CSV
        </button>
      </div>
      <Section
        title={filter === 'history' ? 'Historia do wyjaśnienia' : 'Firmy i oferty'}
        subtitle={`${rows.length} rekordów`}
        action={
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Szukaj firmy"
              placeholder="Szukaj firmy…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        }
      >
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Firma / oferta</th>
                  <th>Zdalnie</th>
                  <th>Niepełny etat</th>
                  <th>Decyzja / historia</th>
                  <th>Źródło</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)}>
                    <td>
                      <div className="table-company">
                        <div className="company-logo">
                          {c.canonical_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong>{c.canonical_name}</strong>
                          <small>{c.title ?? 'Historia z dostarczonej specyfikacji'}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`tri ${c.remote === 'yes' ? 'yes' : ''}`}>
                        {tri(c.remote)}
                      </span>
                    </td>
                    <td>{tri(c.part_time)}</td>
                    <td>
                      <Badge value={c.decision ?? c.history_status} />
                    </td>
                    <td>
                      {c.canonical_url ? (
                        <span className="source-tag">
                          <FileText size={13} /> Źródło demo
                        </span>
                      ) : (
                        <span className="muted">Do weryfikacji</span>
                      )}
                    </td>
                    <td>
                      <button className="icon-button" aria-label={`Szczegóły ${c.canonical_name}`}>
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Jeszcze nie ma wyników"
            text="Uruchom cykl demo na ekranie Dzisiaj, aby zobaczyć firmy i oferty."
          />
        )}
      </Section>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(undefined)}>
          <section className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">SZCZEGÓŁY FIRMY</div>
                <h2>{selected.canonical_name}</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Zamknij szczegóły"
                onClick={() => setSelected(undefined)}
              >
                <X size={20} />
              </button>
            </div>
            <Badge value={selected.decision ?? selected.history_status} />
            <h3>{selected.title ?? 'Historia do wyjaśnienia'}</h3>
            {selected.reasons && (
              <ul className="reason-list">
                {JSON.parse(selected.reasons).map((r: string) => (
                  <li key={r}>
                    <Check size={15} />
                    {r}
                  </li>
                ))}
              </ul>
            )}
            {selected.fragment && (
              <>
                <label>Fragment dowodu</label>
                <blockquote>{selected.fragment}</blockquote>
                <p className="break-word">{selected.canonical_url}</p>
                <p className="muted">
                  Odczyt: {date(selected.fetched_at)} · {label(selected.type)}
                  <br />
                  Kontakt: {selected.email}
                </p>
              </>
            )}
            {selected.suppression_reason && (
              <div className="inline-warning">
                <ShieldCheck size={16} />
                Blokada: {label(selected.suppression_reason)}
              </div>
            )}
            {!selected.opportunity_id && !selected.suppression_reason && (
              <div className="form-row">
                <label>
                  Rozstrzygnięcie historii
                  <select
                    defaultValue={selected.history_status}
                    onChange={(e) =>
                      void act(
                        () =>
                          api('history/review', { companyId: selected.id, status: e.target.value }),
                        'Historia zapisana.',
                      ).then(() => setSelected(undefined))
                    }
                  >
                    {[
                      'HISTORY_TO_VERIFY',
                      'NEW',
                      'CONTACTED',
                      'ACTIVE_CONVERSATION',
                      'REJECTED',
                    ].map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <p className="muted">
              Nazwy z wcześniejszych rozważań nie stanowią potwierdzenia wysyłki. Firmy z historii
              nie są kandydatami do nowego kontaktu.
            </p>
          </section>
        </div>
      )}
      {importOpen && (
        <Section
          title="Import historii DEMO"
          subtitle="Kolumny: company,status,domain,email,date. Status SUGGESTED oznacza sugestię, nie wysyłkę."
        >
          <p className="muted">W tej bazie używaj fikcyjnych adresów i domen .example.invalid.</p>
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="Plik historii CSV"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f)
                void f.text().then((text) => {
                  setCsv(text);
                  setPreview(undefined);
                });
            }}
          />
          <textarea
            aria-label="Treść historii CSV"
            rows={5}
            value={csv}
            onChange={(e) => {
              setCsv(e.target.value);
              setPreview(undefined);
            }}
            placeholder={
              'company,status,domain,email\nPrzykładowa Firma,SUGGESTED,firma.example.invalid,hr@firma.example.invalid'
            }
          />
          <div className="button-row">
            <button
              className="secondary"
              onClick={() =>
                void act(async () => setPreview(await api('history/preview', { text: csv })))
              }
            >
              Podgląd importu
            </button>
            {preview && (
              <button
                className="primary"
                disabled={preview.rows.some((r: Row) => !r.valid) || preview.alreadyImported}
                onClick={() =>
                  void act(
                    () => api('history/import', { text: csv, hash: preview.hash }),
                    'Historia zaimportowana.',
                  ).then(() => setImportOpen(false))
                }
              >
                Importuj zatwierdzony plik
              </button>
            )}
          </div>
          {preview && (
            <div className="import-preview">
              {preview.alreadyImported && <p>Ten plik już zaimportowano.</p>}
              {preview.rows.map((r: Row) => (
                <div key={r.index}>
                  <Badge value={r.valid ? 'READY' : 'BLOCKED'}>{r.valid ? 'OK' : 'Błąd'}</Badge>
                  <strong>{r.company}</strong>
                  <span>{r.reason}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </>
  );
}

function DraftsView({ data, act, busy }: { data: Data; act: Act; busy: boolean }) {
  const [active, setActive] = useState<string>();
  const [selected, setSelected] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [version, setVersion] = useState(0);
  const [versions, setVersions] = useState<Row[]>([]);
  const [editing, setEditing] = useState(false);
  const d = data.drafts.find((d) => d.id === active) ?? data.drafts[0];
  useEffect(() => {
    if (!d) return;
    setBody(d.body);
    setSubject(d.subject);
    setVersion(d.version);
    setEditing(false);
    void api(`drafts/${d.id}/versions`).then(setVersions);
  }, [d?.id, d?.version]);
  if (!d)
    return (
      <Section title="Lokalna biblioteka wiadomości">
        <Empty
          icon={Mail}
          title="Każda wiadomość ma swój powód"
          text="Szkice pojawią się po zatwierdzeniu profilu i wykonaniu pierwszego cyklu demo."
        />
      </Section>
    );
  return (
    <>
      <div className="toolbar">
        <span className="muted">
          {data.drafts.length} szkiców · {data.dashboard.pending} do sprawdzenia
        </span>
        <button
          className="primary"
          disabled={!selected.length || busy}
          onClick={() =>
            void act(
              () =>
                api('drafts/approve-batch', {
                  drafts: data.drafts
                    .filter((d) => selected.includes(d.id))
                    .map((d) => ({ id: d.id, version: d.version })),
                }),
              'Wybrane wersje zatwierdzone do symulacji.',
            ).then(() => setSelected([]))
          }
        >
          <CheckCheck size={16} />
          Zatwierdź i symuluj wysyłkę ({selected.length})
        </button>
      </div>
      <div className="draft-grid">
        <Section title="Twoje szkice" className="draft-list">
          <div>
            {data.drafts.map((x) => (
              <div className={`draft-item ${x.id === d.id ? 'current' : ''}`} key={x.id}>
                <input
                  type="checkbox"
                  aria-label={`Wybierz ${x.canonical_name}`}
                  checked={selected.includes(x.id)}
                  disabled={x.status !== 'NEEDS_REVIEW'}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? [...selected, x.id] : selected.filter((id) => id !== x.id),
                    )
                  }
                />
                <button onClick={() => setActive(x.id)}>
                  <strong>{x.canonical_name}</strong>
                  <span>{x.subject}</span>
                  <Badge value={x.status} />
                </button>
              </div>
            ))}
          </div>
        </Section>
        <Section
          title={d.canonical_name}
          subtitle={`Wersja ${version} · przygotowano ${date(d.created_at)}`}
          action={<Badge value={d.status} />}
        >
          <div className="mail-meta">
            <div>
              <span>OD</span>
              <strong>{data.campaign.account_email}</strong>
            </div>
            <div>
              <span>DO</span>
              <strong>{d.email}</strong>
            </div>
            <div>
              <span>CV</span>
              <strong>
                {data.campaign.cv_id
                  ? data.profile.cvs.find((c: Row) => c.id === data.campaign.cv_id)?.file_name
                  : 'Bez załącznika — dozwolone w DEMO'}
              </strong>
            </div>
          </div>
          <label>
            Temat
            <input
              aria-label="Temat wiadomości"
              disabled={!editing}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label>
            Treść
            <textarea
              aria-label="Treść wiadomości"
              className="mail-body"
              disabled={!editing}
              rows={18}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <div className="button-row">
            {editing ? (
              <>
                <button
                  className="primary"
                  onClick={() =>
                    void act(
                      () => api(`drafts/${d.id}`, { version, subject, body }, 'PATCH'),
                      'Zapisano nową wersję. Zgoda wymaga ponowienia.',
                    ).then(() => setEditing(false))
                  }
                >
                  Zapisz nową wersję
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    setBody(d.body);
                    setSubject(d.subject);
                    setEditing(false);
                  }}
                >
                  Anuluj
                </button>
              </>
            ) : (
              <button
                className="secondary"
                disabled={d.status === 'SENT'}
                onClick={() => setEditing(true)}
              >
                Edytuj szkic
              </button>
            )}
            <select
              aria-label="Przywróć wersję"
              value=""
              disabled={d.status === 'SENT'}
              onChange={(e) => {
                const v = versions.find((v) => v.version === +e.target.value);
                if (v) {
                  setBody(v.body);
                  setSubject(v.subject);
                  setEditing(true);
                }
              }}
            >
              <option value="">Wcześniejsze wersje…</option>
              {versions.map((v) => (
                <option key={v.id} value={v.version}>
                  Wersja {v.version} · {date(v.created_at)}
                </option>
              ))}
            </select>
          </div>
          <div className="proof-box">
            <ShieldCheck size={17} />
            <div>
              <strong>Źródła i zatwierdzone fakty</strong>
              <p>
                {JSON.parse(d.evidence_ids).length} dowód firmy · {JSON.parse(d.fact_ids).length}{' '}
                faktów profilu · odbiorca rekrutacyjny
              </p>
              <details>
                <summary>Zobacz pochodzenie treści</summary>
                {data.companies
                  .filter((c) => c.id === d.company_id)
                  .map((c) => (
                    <p key={c.id}>
                      {c.canonical_url}
                      <br />
                      {c.fragment}
                    </p>
                  ))}
                {data.profile.facts
                  .filter((f: Row) => JSON.parse(d.fact_ids).includes(f.id))
                  .map((f: Row) => (
                    <p key={f.id}>
                      <code>{f.id}</code> · {f.content}
                    </p>
                  ))}
              </details>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

function RepliesView({ data, act }: { data: Data; act: Act }) {
  return (
    <Section title="Odpowiedzi od firm" subtitle="Propozycja klasyfikacji wymaga Twojej oceny.">
      {data.replies.length ? (
        <div className="reply-list">
          {data.replies.map((r) => (
            <article className="reply" key={r.id}>
              <div className="reply-head">
                <div className="company-logo">{r.canonical_name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <h3>{r.canonical_name}</h3>
                  <span className="muted">{date(r.created_at)} · symulowany wątek</span>
                </div>
                <Badge value={r.category} />
              </div>
              <p>{r.body}</p>
              <div className="reply-controls">
                <label>
                  Klasyfikacja
                  <select
                    value={r.category}
                    aria-label={`Klasyfikacja ${r.canonical_name}`}
                    onChange={(e) =>
                      void act(
                        () => api(`replies/${r.id}/review`, { category: e.target.value }),
                        'Klasyfikacja zapisana.',
                      )
                    }
                  >
                    {[
                      'INTERESTED',
                      'INVITATION',
                      'QUESTION',
                      'TASK',
                      'REJECTED',
                      'ON_HOLD',
                      'AUTORESPONDER',
                      'BOUNCE',
                      'UNCLEAR',
                    ].map((c) => (
                      <option key={c} value={c}>
                        {label(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="secondary"
                  onClick={() =>
                    void act(
                      () => api(`replies/${r.id}/review`, { category: r.category }),
                      'Klasyfikacja potwierdzona.',
                    )
                  }
                >
                  <Check size={15} />
                  {r.reviewed_at ? 'Potwierdzono' : 'Potwierdź klasyfikację'}
                </button>
              </div>
              <small className="muted">
                Propozycja mock: {label(r.proposed_category)}. Autoresponder nie liczy się jako
                zainteresowanie.
              </small>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={MessageSquare}
          title="Tu zaczynają się rozmowy"
          text="Po zatwierdzeniu szkiców i symulowanej wysyłce pojawią się fikcyjne odpowiedzi."
        />
      )}
    </Section>
  );
}

function ProfileView({ data, act, busy }: { data: Data; act: Act; busy: boolean }) {
  const [form, setForm] = useState<Row>(data.profile);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setForm(data.profile);
    setDirty(false);
  }, [data.profile.version]);
  const change = (key: string, value: unknown) => {
    setForm({ ...form, [key]: value });
    setDirty(true);
  };
  return (
    <div className="profile-grid">
      <div className="stack">
        <Section
          title="Profil kandydata"
          subtitle="Zatwierdzenie dotyczy wyłącznie tej bazy DEMO."
          action={
            <Badge value={data.profile.approved_at ? 'APPROVED' : 'NEEDS_REVIEW'}>
              {data.profile.approved_at ? 'Zatwierdzony w demo' : 'Do zatwierdzenia'}
            </Badge>
          }
        >
          <div className="form-row">
            <label>
              Imię i nazwisko
              <input value={form.name} onChange={(e) => change('name', e.target.value)} />
            </label>
            <label>
              Cel współpracy
              <textarea
                rows={3}
                value={form.goal}
                onChange={(e) => change('goal', e.target.value)}
              />
            </label>
            <div className="two-col">
              <label>
                Godziny tygodniowo — minimum
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={form.hours_min}
                  onChange={(e) => change('hours_min', +e.target.value)}
                />
              </label>
              <label>
                Maksimum
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={form.hours_max}
                  onChange={(e) => change('hours_max', +e.target.value)}
                />
              </label>
            </div>
          </div>
          <h3 className="subheading">Fakty używane w wiadomościach</h3>
          <div className="fact-list">
            {form.facts.map((f: Row, i: number) => (
              <label key={f.id}>
                <span>
                  <code>{f.fact_key}</code>
                  <Badge value={f.approval_status === 'APPROVED' ? 'APPROVED' : 'NEEDS_REVIEW'}>
                    {f.approval_status === 'APPROVED' ? 'Zatwierdzony' : 'Propozycja'}
                  </Badge>
                </span>
                <textarea
                  rows={2}
                  value={f.content}
                  onChange={(e) => {
                    const facts = [...form.facts];
                    facts[i] = { ...f, content: e.target.value };
                    change('facts', facts);
                  }}
                />
                <small>{f.source}</small>
              </label>
            ))}
          </div>
          <div className="button-row">
            <button
              className="secondary"
              disabled={!dirty || busy}
              onClick={() =>
                void act(
                  () =>
                    api(
                      'profile',
                      {
                        name: form.name,
                        goal: form.goal,
                        hours_min: form.hours_min,
                        hours_max: form.hours_max,
                        version: form.version,
                        facts: form.facts.map((f: Row) => ({ id: f.id, content: f.content })),
                      },
                      'PUT',
                    ),
                  'Profil zapisany; wymaga zatwierdzenia.',
                )
              }
            >
              Zapisz zmiany profilu
            </button>
            <button
              className="primary"
              disabled={dirty || busy || !!data.profile.approved_at}
              onClick={() =>
                void act(
                  () => api('profile/approve', {}),
                  'Profil demo zatwierdzony. Możesz uruchomić cykl.',
                )
              }
            >
              <CheckCheck size={16} />
              Zatwierdź profil demo
            </button>
          </div>
          <p className="muted">
            Opisy projektów pochodzą ze specyfikacji i nie są audytem kompetencji. Zmienione fakty
            wymagają ponownej akceptacji; szablon mock używa tylko zgodnej propozycji początkowej.
          </p>
        </Section>
      </div>
      <div className="stack">
        <Section title="Twoje CV" subtitle="PDF do 5 MB. Demo działa także bez CV.">
          <label className="upload-zone">
            <Upload size={24} />
            <strong>Dodaj plik PDF</strong>
            <span>Utworzymy niezmienną kopię z hashem SHA-256</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              aria-label="Dodaj CV PDF"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void act(async () => {
                  if (f.size > 5 * 1024 * 1024) throw new Error('Maksymalny rozmiar CV to 5 MB.');
                  const reader = new FileReader();
                  const base64 = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(String(reader.result).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(f);
                  });
                  await api('cv', { fileName: f.name, base64 });
                }, 'PDF dodany. Sprawdź go przed zatwierdzeniem.');
              }}
            />
          </label>
          {data.profile.cvs.map((cv: Row) => (
            <div className="cv-card" key={cv.id}>
              <FileText size={24} />
              <div>
                <strong>{cv.file_name}</strong>
                <p>
                  {(cv.byte_size / 1024).toFixed(1)} KB ·{' '}
                  {cv.approved_at ? 'zatwierdzony' : 'do zatwierdzenia'}
                </p>
                <code title={cv.sha256}>{cv.sha256.slice(0, 20)}…</code>
              </div>
              <div className="button-row">
                <a
                  className="secondary"
                  href={`/api/cv/${cv.id}/preview`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Podgląd
                </a>
                {!cv.approved_at && (
                  <button
                    className="secondary"
                    onClick={() =>
                      void act(() => api(`cv/${cv.id}/approve`, {}), 'CV demo zatwierdzone.')
                    }
                  >
                    Zatwierdź
                  </button>
                )}
              </div>
            </div>
          ))}
        </Section>
        <Section title="Projekty portfolio">
          <div className="portfolio-list">
            {data.profile.projects.map((p: Row) => (
              <div key={p.id}>
                <strong>
                  {p.name}
                  <ExternalLink size={13} />
                </strong>
                <p>{p.description}</p>
                <small>{p.limitations}</small>
              </div>
            ))}
          </div>
        </Section>
        <div className="hint-card">
          <ShieldCheck size={20} />
          <p>
            Wiadomości opierają się na zatwierdzonych faktach. Zmiana profilu lub CV unieważnia
            oczekujące zgody.
          </p>
        </div>
      </div>
    </div>
  );
}

function CampaignView({ data, act, busy }: { data: Data; act: Act; busy: boolean }) {
  const keys = [
    'daily_limit',
    'cycle_limit',
    'campaign_limit',
    'interval_minutes',
    'duration_minutes',
    'max_candidates',
    'window_start',
    'window_end',
    'schedule_enabled',
  ];
  const pick = (c: Row) =>
    Object.fromEntries(keys.map((k) => [k, k === 'schedule_enabled' ? !!c[k] : c[k]]));
  const [form, setForm] = useState(pick(data.campaign));
  useEffect(() => setForm(pick(data.campaign)), [data.campaign.policy_version]);
  return (
    <div className="profile-grid">
      <div className="stack">
        <Section
          title="Konfiguracja pilotażu"
          subtitle="Limity zmienia użytkownik. Model nie może ich zwiększać."
        >
          <div className="mode-card">
            <Badge value="DEMO">DEMO</Badge>
            <strong>Symulacja lokalna</strong>
            <span>RESEARCH_ONLY, APPROVAL_REQUIRED i AUTO_POLICY czekają na kolejne etapy.</span>
          </div>
          <div className="two-col">
            {[
              ['daily_limit', 'Wysyłki dziennie'],
              ['cycle_limit', 'Wysyłki na cykl'],
              ['campaign_limit', 'Wysyłki na kampanię'],
              ['interval_minutes', 'Cykl co (minuty)'],
              ['duration_minutes', 'Czas pracy na cykl (minuty)'],
              ['max_candidates', 'Firmy do oceny na cykl'],
            ].map(([k, name]) => (
              <label key={k}>
                {name}
                <input
                  type="number"
                  min={1}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: +e.target.value })}
                />
              </label>
            ))}
            <label>
              Początek okna
              <input
                type="time"
                value={form.window_start}
                onChange={(e) => setForm({ ...form, window_start: e.target.value })}
              />
            </label>
            <label>
              Koniec okna
              <input
                type="time"
                value={form.window_end}
                onChange={(e) => setForm({ ...form, window_end: e.target.value })}
              />
            </label>
          </div>
          <p className="muted">
            Poniedziałek–piątek · Europe/Warsaw · zmiana czasu obsługiwana przez Intl
          </p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.schedule_enabled}
              onChange={(e) => setForm({ ...form, schedule_enabled: e.target.checked })}
            />
            Włącz kolejne cykle demo po ręcznym starcie
          </label>
          <div className="button-row">
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                void act(
                  () => api('campaign', form, 'PUT'),
                  'Konfiguracja zapisana. Oczekujące zgody unieważniono.',
                )
              }
            >
              Zapisz konfigurację
            </button>
          </div>
          <p className="muted">
            Po uśpieniu komputer uruchomi jeden kontrolowany cykl. Po trzech pustych cyklach praca
            się zatrzyma.
          </p>
        </Section>
        <Section
          title="Scenariusz demonstracyjny"
          subtitle="Sprawdź zachowanie przy błędach, bez prawdziwej poczty."
        >
          <label>
            Scenariusz adaptera
            <select
              value={data.dashboard.state.scenario}
              onChange={(e) =>
                void act(
                  () => api('demo/scenario', { scenario: e.target.value }),
                  'Scenariusz ustawiony.',
                )
              }
            >
              {[
                'NORMAL',
                'TIMEOUT_AFTER_SEND',
                'FAIL_BEFORE_SEND',
                'PROVIDER_ONLY',
                'BOUNCE_REPLY',
              ].map((v) => (
                <option key={v} value={v}>
                  {label(v)}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            Timeout po przyjęciu zapisuje SEND_UNKNOWN i zatrzymuje sender. Rozstrzygnięcie szuka
            istniejącej wiadomości; nie wykonuje ponownego send.
          </p>
        </Section>
      </div>
      <div className="stack">
        <Section title="Kontrola pracy">
          <div className="control-status">
            <Badge value={data.dashboard.state.status} />
            <p>Ostatni heartbeat: {date(data.dashboard.state.heartbeat)}</p>
            <p>Ważność kampanii: {date(data.campaign.expires_at)}</p>
          </div>
          <div className="control-buttons">
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                void act(() => api('campaign/start', {}), 'Uruchomiono lub wznowiono cykl.')
              }
            >
              <Play size={16} />
              Uruchom / wznów cykl
            </button>
            <button
              className="secondary"
              onClick={() => void act(() => api('pause', {}), 'Pauza zapisana.')}
            >
              <Pause size={16} />
              Pauza
            </button>
            <button
              className="secondary danger-text"
              onClick={() => void act(() => api('emergency-stop', {}), 'Wysyłka zatrzymana.')}
            >
              <ShieldCheck size={16} />
              Zatrzymaj wysyłkę
            </button>
            {data.dashboard.state.killSwitch && (
              <button
                className="secondary"
                onClick={() => void act(() => api('resume-sender', {}), 'Sender wznowiony.')}
              >
                <RefreshCw size={16} />
                Wznów sender demo
              </button>
            )}
            <button
              className="secondary"
              onClick={() => void act(() => api('stop', {}), 'Wszystkie zadania zatrzymane.')}
            >
              <Square size={16} />
              Stop wszystko
            </button>
            <button
              className="text-button"
              onClick={() =>
                void act(() => api('campaign/renew', {}), 'Kampania demo odnowiona na 7 dni.')
              }
            >
              Odnów kampanię demo
            </button>
          </div>
        </Section>
        <div className="hint-card">
          <Clock size={20} />
          <p>
            Zamknięcie przeglądarki nie zatrzymuje backendu. Uśpienie komputera lub zakończenie
            procesu przerywa pracę. Stop i blokady przetrwają restart.
          </p>
        </div>
      </div>
    </div>
  );
}
function IntegrationsView({ data }: { data: Data }) {
  return (
    <>
      <div className="integration-grid">
        {data.capabilities.items.map((c: Row) => (
          <Section title={c.name} key={c.name} action={<Badge value={c.status} />}>
            <div className="integration-icon">
              {c.name.includes('Codex') ? (
                <Terminal size={24} />
              ) : c.name.includes('Gmail') ? (
                <Mail size={24} />
              ) : (
                <PlugZap size={24} />
              )}
            </div>
            <p className="integration-detail">{c.detail}</p>
            <div className="capability-checks">
              {[
                ['Dostępność', c.available],
                ['Konfiguracja', c.configured],
                ['Test wykonany', c.tested],
              ].map(([name, value]) => (
                <div key={name as string}>
                  <span>{name}</span>
                  <strong>
                    {value === null ? (
                      'Nieznana'
                    ) : value ? (
                      <Check size={16} />
                    ) : (
                      <span className="muted">Nie</span>
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </Section>
        ))}
      </div>
      <div className="hint-card">
        <ShieldCheck size={20} />
        <p>
          DEMO nie czyta tokenów ani skrzynki i nie uruchamia modelu. Dane przekazane do
          zewnętrznego modelu w kolejnych etapach nie pozostaną wyłącznie na komputerze.
        </p>
      </div>
    </>
  );
}
function ReportsView({ data, act }: { data: Data; act: Act }) {
  return (
    <>
      <div className="toolbar">
        <p className="muted">Raport dnia: {data.dashboard.day} · Europe/Warsaw</p>
        <div className="button-row">
          <a className="secondary" href="/api/reports/export?format=md">
            <Download size={15} />
            Markdown
          </a>
          <a className="secondary" href="/api/reports/export?format=csv">
            <Download size={15} />
            CSV
          </a>
        </div>
      </div>
      <Section
        title="Wysyłki i rozstrzygnięcia"
        subtitle="Przyjęcie przez dostawcę i Wysłane to osobne stany; nie wykrywamy doręczenia ani odczytu."
      >
        {data.outbox.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Stan</th>
                  <th>Identyfikator próby</th>
                  <th>Decyzja</th>
                </tr>
              </thead>
              <tbody>
                {data.outbox.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.canonical_name}</strong>
                      <small className="muted">{date(o.created_at)}</small>
                    </td>
                    <td>
                      <Badge value={o.status} />
                      {o.reason && <small className="muted">{o.reason}</small>}
                    </td>
                    <td>
                      <code className="id-text">{o.message_id ?? 'Brak próby'}</code>
                    </td>
                    <td>
                      {['SEND_UNKNOWN', 'SENT_PROVIDER'].includes(o.status) && (
                        <button
                          className="secondary"
                          onClick={() =>
                            void act(async () => {
                              const result = await api(`outbox/${o.id}/reconcile`, {});
                              if (!result.confirmed)
                                throw new Error(
                                  'Brak pewnego potwierdzenia. Nie wykonano ponownej wysyłki.',
                                );
                            }, 'Potwierdzono istniejącą wiadomość.')
                          }
                        >
                          <RefreshCw size={14} />
                          Rozstrzygnij
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={Mail}
            title="Jeszcze nie ma prób wysyłki"
            text="Zatwierdź konkretne szkice, aby przejść przez proces demonstracyjny."
          />
        )}
      </Section>
      <Section title="Historia cykli">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Rozpoczęcie</th>
                <th>Stan</th>
                <th>Nowe firmy</th>
                <th>Duplikaty</th>
              </tr>
            </thead>
            <tbody>
              {data.reports.runs.map((r: Row) => (
                <tr key={r.id}>
                  <td>{date(r.started_at)}</td>
                  <td>
                    <Badge value={r.status} />
                  </td>
                  <td>{r.discovered}</td>
                  <td>{r.duplicates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.reports.runs.length && (
          <Empty
            icon={Clock}
            title="Pierwszy cykl przed Tobą"
            text="Historia jest trwała i pozostaje dostępna po restarcie."
          />
        )}
      </Section>
      <Section
        title="Podgląd raportu dziennego"
        subtitle="Koszt AI: brak danych · wywołania modelu w DEMO: 0"
      >
        <pre className="report-preview">{data.reports.markdown}</pre>
      </Section>
    </>
  );
}
