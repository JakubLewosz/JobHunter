import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nodemailer from 'nodemailer';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { Store } from './db.js';
import {
  companyDomain,
  csvCell,
  day,
  DomainError,
  hash,
  id,
  inWindow,
  iso,
  normalizeEmail,
  normalizeName,
} from './util.js';
import {
  fixtures,
  MockCodexRunner,
  MockMailProvider,
  DisabledMailProvider,
  MockResearchProvider,
  modelDraftSchema,
  mockReply,
  qualify,
} from './providers.js';
import type { MailProvider, ResearchResult } from './providers.js';
import type { Dashboard, Row, Mode } from '../../../packages/shared/types.js';

export const campaignSchema = z
  .object({
    daily_limit: z.number().int().min(1).max(100),
    cycle_limit: z.number().int().min(1).max(20),
    campaign_limit: z.number().int().min(1).max(500),
    interval_minutes: z.number().int().min(1).max(1440),
    duration_minutes: z.number().int().min(1).max(60),
    max_candidates: z.number().int().min(1).max(100),
    window_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    window_end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    schedule_enabled: z.boolean(),
  })
  .strict()
  .refine(
    (v) =>
      v.window_start < v.window_end &&
      v.cycle_limit <= v.daily_limit &&
      v.daily_limit <= v.campaign_limit,
    'Nieprawidłowe okno lub limity.',
  );
export const profileSchema = z
  .object({
    name: z.string().min(2).max(100),
    goal: z.string().min(10).max(1000),
    hours_min: z.number().int().min(1).max(40),
    hours_max: z.number().int().min(1).max(40),
    version: z.number().int().positive(),
    facts: z
      .array(z.object({ id: z.string(), content: z.string().min(1).max(2000) }).strict())
      .max(30),
  })
  .strict()
  .refine((v) => v.hours_min <= v.hours_max);
export const replyCategories = [
  'INTERESTED',
  'INVITATION',
  'QUESTION',
  'TASK',
  'REJECTED',
  'ON_HOLD',
  'AUTORESPONDER',
  'BOUNCE',
  'UNCLEAR',
] as const;

const initialFacts = [
  ['identity', 'Jakub Lewosz'],
  [
    'education',
    'Uczeń ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku; rok szkolny 2026/2027.',
  ],
  [
    'availability',
    'Płatna praca w pełni zdalna, około 15–20 godzin tygodniowo, przede wszystkim po lekcjach.',
  ],
  ['contract', 'Preferowana umowa zlecenie; płatna, regularna współpraca.'],
  ['ai', 'Korzysta z programowania wspomaganego AI, szczególnie Codex.'],
  ['portfolio', 'Portfolio: https://github.com/JakubLewosz'],
  [
    'fixdesk',
    'FixDesk: lokalne demo obsługi usterek w PHP/Laravel; nie publiczny system produkcyjny.',
  ],
  ['autorelay', 'AutoRelay: projekt portfolio automatyzacji opartych na webhookach.'],
  [
    'codefabric',
    'CodeFabric: prototyp z lokalnymi modelami językowymi do wspomagania tworzenia oprogramowania.',
  ],
  [
    'elektroscan',
    'ElektroScan: zespołowy projekt analizy planów elektrycznych w PDF; publiczne demo.',
  ],
];
const historyNames =
  'Iyuno|UX GIRL|Pirxey|Autooomate|Software Mind|EasyAutomate|Netwise|NAVIA|Formamind|Havenocode|Personit|SupportME|Finitec|Studio SKORPIUS|Automation House|EL Passion|dataplace.ai|Leaware|XPERTEO|BlockWise|From Poland With Dev|DataComplex|Vazco|wPraktyce.AI|Gorrion|NextApps|Cogitech|Oxido AI|LexAlpha|WebMakers|N-SOFT|BeroBasket|CONFILOGI'.split(
    '|',
  );

export class JobHunter {
  readonly research = new MockResearchProvider();
  readonly codex = new MockCodexRunner();
  readonly mail: MailProvider;
  private busy = false;
  private timer?: ReturnType<typeof setInterval>;
  readonly clock: () => Date;
  readonly mode: Mode;
  readonly campaignId: string;
  constructor(
    readonly store: Store,
    options: { clock?: () => Date; mail?: MailProvider; mode?: Mode } = {},
  ) {
    this.mode = options.mode ?? 'DEMO';
    this.campaignId = this.mode === 'DEMO' ? 'demo' : 'research';
    this.clock = options.clock ?? (() => new Date());
    this.mail =
      this.mode === 'DEMO'
        ? (options.mail ?? new MockMailProvider(store))
        : new DisabledMailProvider();
    const existing = store.get<string>('mode', this.mode);
    if (existing !== this.mode && (existing === 'DEMO' || this.mode === 'DEMO'))
      throw new DomainError('MODE_MISMATCH', 'Ten katalog zawiera dane innego trybu.');
    store.set('mode', this.mode);
    this.seed();
    this.recover();
    if (existing !== this.mode) {
      this.revokeApprovals('Zmiana trybu aplikacji');
      store.exec(
        'UPDATE campaigns SET mode=?,policy_version=policy_version+1 WHERE id=?',
        this.mode,
        this.campaignId,
      );
    }
  }
  now() {
    return iso(this.clock());
  }
  campaign() {
    return this.store.one('SELECT * FROM campaigns WHERE id=?', this.campaignId)!;
  }
  profile(): Row & { facts: Row[]; projects: Row[]; cvs: Row[] } {
    const p = this.store.one('SELECT * FROM candidate_profiles WHERE id=?', 'candidate')!;
    return {
      ...p,
      facts: this.store.all('SELECT * FROM candidate_facts ORDER BY created_at,id'),
      projects: this.store.all('SELECT * FROM portfolio_projects ORDER BY name'),
      cvs: this.store.all('SELECT * FROM cv_assets ORDER BY created_at DESC'),
    };
  }
  state() {
    return {
      paused: this.store.get('paused', false),
      stopped: this.store.get('stopped', true),
      killSwitch: this.store.get('killSwitch', false),
      status: this.store.get('workerStatus', 'STOPPED'),
      nextCycle: this.store.get<string | null>('nextCycle', null),
      heartbeat: this.store.get<string | null>('heartbeat', null),
      scenario: this.store.get('scenario', 'NORMAL'),
    };
  }
  event(action: string, message: string, entityId: string | null = null, actor = 'system') {
    this.store.exec(
      'INSERT INTO audit_events VALUES (?,?,?,?,?,?,?)',
      id(),
      actor,
      action,
      entityId,
      message,
      day(this.clock()),
      this.now(),
    );
  }
  seed() {
    if (this.store.one('SELECT id FROM campaigns LIMIT 1')) return;
    const at = this.now();
    this.store.atomic(() => {
      this.store.exec(
        'INSERT INTO candidate_profiles (id,name,goal,hours_min,hours_max,version,profile_hash,approved_at,created_at,updated_at) VALUES (?,?,?,?,?,1,?,NULL,?,?)',
        'candidate',
        'Jakub Lewosz',
        'Płatna, regularna współpraca programistyczna lub techniczna, całkowicie zdalna, przede wszystkim po lekcjach.',
        15,
        20,
        hash(JSON.stringify(initialFacts)),
        at,
        at,
      );
      for (const [key, content] of initialFacts)
        this.store.exec(
          "INSERT INTO candidate_facts VALUES (?,?,?,?,?,NULL,'DRAFT',1,?,?)",
          `fact-${key}`,
          'candidate',
          key,
          content,
          'Dostarczona specyfikacja — propozycja do zatwierdzenia',
          at,
          at,
        );
      for (const [key, name] of [
        ['fixdesk', 'FixDesk'],
        ['autorelay', 'AutoRelay'],
        ['codefabric', 'CodeFabric'],
        ['elektroscan', 'ElektroScan'],
      ]) {
        this.store.exec(
          'INSERT INTO portfolio_projects VALUES (?,?,?,?,?,?,?,?)',
          key,
          'candidate',
          name,
          `https://github.com/JakubLewosz/${name}`,
          initialFacts.find((f) => f[0] === key)![1],
          'Opis ze specyfikacji; repozytorium nie zostało zweryfikowane.',
          at,
          at,
        );
      }
      this.store.exec(
        'INSERT INTO campaigns VALUES (?,?,?,NULL,1,10,3,50,60,20,20,?,?,?,0,0,?,?,?)',
        this.campaignId,
        this.mode,
        'kandydat@demo.example.invalid',
        '08:00',
        '16:00',
        'Europe/Warsaw',
        iso(new Date(this.clock().getTime() + 7 * 86400000)),
        at,
        at,
      );
      for (const name of historyNames) this.findOrCreateCompany(name, null, 'HISTORY_TO_VERIFY');
      const fingoweb = this.findOrCreateCompany('Fingoweb', null, 'RECRUITMENT_ON_HOLD').company;
      this.suppress(
        fingoweb.id,
        'RECRUITMENT_ON_HOLD',
        'Specyfikacja: lokalna blokada, bez potwierdzania historii wysyłek.',
        'user',
      );
      this.store.set('paused', false);
      this.store.set('stopped', true);
      this.store.set('killSwitch', false);
      this.store.set('workerStatus', 'STOPPED');
      this.event('SETUP', `Utworzono osobną bazę ${this.mode}. Profil oczekuje na zatwierdzenie.`);
    });
  }
  recover() {
    this.store.atomic(() => {
      const abandoned = this.store.all("SELECT id FROM outbox WHERE status='SENDING'");
      for (const r of abandoned) {
        this.setOutbox(
          r.id,
          'SEND_UNKNOWN',
          'Proces przerwany podczas wysyłki. Wymagane rozstrzygnięcie.',
        );
        this.store.exec(
          "UPDATE send_attempts SET state='SEND_UNKNOWN',updated_at=? WHERE outbox_id=?",
          this.now(),
          r.id,
        );
      }
      this.store.exec(
        "UPDATE jobs SET status='QUEUED',lease_until=NULL,updated_at=? WHERE status='RUNNING'",
        this.now(),
      );
      this.store.exec(
        "UPDATE runs SET status='QUEUED',lease_until=NULL,updated_at=? WHERE status='RUNNING'",
        this.now(),
      );
      if (abandoned.length) {
        this.store.set('killSwitch', true);
        this.event('RECOVERY', `${abandoned.length} porzuconych wysyłek wymaga rozstrzygnięcia.`);
      }
    });
  }
  findOrCreateCompany(name: string, domain: string | null, historyStatus = 'NEW') {
    const normalized = normalizeName(name);
    const d = companyDomain(domain);
    const byAlias =
      d &&
      this.store.one(
        "SELECT c.* FROM company_aliases a JOIN companies c ON c.id=a.company_id WHERE a.kind='DOMAIN' AND a.value=?",
        d,
      );
    const found =
      byAlias ||
      this.store.one(
        'SELECT * FROM companies WHERE normalized_key=? OR (primary_domain IS NOT NULL AND primary_domain=?)',
        normalized,
        d,
      );
    if (found) {
      this.store.exec(
        "INSERT OR IGNORE INTO company_aliases VALUES (?,?,'NAME',?,?,?)",
        id(),
        found.id,
        name,
        this.now(),
        this.now(),
      );
      return { company: found, duplicate: true };
    }
    const companyId = id();
    const at = this.now();
    this.store.exec(
      'INSERT INTO companies VALUES (?,?,?,?,?,NULL,1,?,?)',
      companyId,
      name,
      d,
      normalized,
      historyStatus,
      at,
      at,
    );
    this.store.exec(
      "INSERT OR IGNORE INTO company_aliases VALUES (?,?,'NAME',?,?,?)",
      id(),
      companyId,
      name,
      at,
      at,
    );
    if (d)
      this.store.exec(
        "INSERT OR IGNORE INTO company_aliases VALUES (?,?,'DOMAIN',?,?,?)",
        id(),
        companyId,
        d,
        at,
        at,
      );
    return {
      company: this.store.one('SELECT * FROM companies WHERE id=?', companyId)!,
      duplicate: false,
    };
  }
  suppress(companyId: string, reason: string, source: string, actor = 'system') {
    this.store.exec(
      'INSERT OR IGNORE INTO suppressions VALUES (?,?,?,?,?,1,?)',
      id(),
      companyId,
      reason,
      actor,
      source,
      this.now(),
    );
    this.store.exec(
      'UPDATE companies SET suppression_reason=?,history_status=?,updated_at=?,version=version+1 WHERE id=?',
      reason,
      reason,
      this.now(),
      companyId,
    );
    this.store.exec(
      "UPDATE outbox SET status='BLOCKED',reason=?,updated_at=? WHERE company_id=? AND status='QUEUED'",
      reason,
      this.now(),
      companyId,
    );
  }
  approveProfile() {
    this.store.atomic(() => {
      const p = this.profile();
      const h = hash(
        JSON.stringify({
          name: p.name,
          goal: p.goal,
          hours:
            p.availability_mode === 'APPROX'
              ? { approximately: p.hours_approx }
              : [p.hours_min, p.hours_max],
          messageTemplate: p.message_template,
          facts: p.facts.map((f: Row) => [f.id, f.content]),
        }),
      );
      this.store.exec(
        "UPDATE candidate_profiles SET approved_at=?,profile_hash=?,updated_at=? WHERE id='candidate'",
        this.now(),
        h,
        this.now(),
      );
      this.store.exec(
        "UPDATE candidate_facts SET approval_status='APPROVED',checked_at=?,updated_at=?",
        this.now(),
        this.now(),
      );
      this.event(
        'PROFILE_APPROVED',
        `Użytkownik zatwierdził profil w bazie ${this.mode}.`,
        'candidate',
        'user',
      );
    });
  }
  updateProfile(input: unknown) {
    const v = profileSchema.parse(input);
    const p = this.profile();
    if (v.version !== p.version)
      throw new DomainError('VERSION_CONFLICT', 'Profil zmieniono w innym oknie. Odśwież dane.');
    if (
      v.facts.length !== p.facts.length ||
      new Set(v.facts.map((f) => f.id)).size !== p.facts.length ||
      v.facts.some((f) => !p.facts.some((x: Row) => x.id === f.id))
    )
      throw new DomainError('INVALID_FACT', 'Nieprawidłowy zestaw faktów.');
    this.store.atomic(() => {
      this.store.exec(
        "UPDATE candidate_profiles SET name=?,goal=?,hours_min=?,hours_max=?,version=version+1,profile_hash=?,approved_at=NULL,updated_at=? WHERE id='candidate'",
        v.name,
        v.goal,
        v.hours_min,
        v.hours_max,
        hash(JSON.stringify(v)),
        this.now(),
      );
      for (const f of v.facts)
        this.store.exec(
          "UPDATE candidate_facts SET content=?,approval_status='DRAFT',version=version+1,updated_at=? WHERE id=?",
          f.content,
          this.now(),
          f.id,
        );
      this.revokeApprovals('Zmiana profilu');
      this.event(
        'PROFILE_EDITED',
        'Profil zmieniono; zgody na oczekujące szkice unieważniono.',
        'candidate',
        'user',
      );
    });
  }
  uploadCV(fileName: string, base64: string) {
    const bytes = Buffer.from(base64, 'base64');
    if (bytes.length > 5 * 1024 * 1024 || !bytes.subarray(0, 5).equals(Buffer.from('%PDF-')))
      throw new DomainError('INVALID_PDF', 'Wybierz plik PDF do 5 MB.', 400);
    const h = hash(bytes);
    const stored = `${h}.pdf`;
    const dir = join(this.store.dir, 'cv');
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    if (!this.store.one('SELECT id FROM cv_assets WHERE sha256=?', h)) {
      writeFileSync(join(dir, stored), bytes, { mode: 0o600, flag: 'wx' });
      this.store.exec(
        'INSERT INTO cv_assets VALUES (?,?,?,?,?,1,NULL,?,?)',
        id(),
        h,
        bytes.length,
        fileName.replace(/[^\p{L}\p{N} ._\-]/gu, '_').slice(0, 100),
        stored,
        this.now(),
        this.now(),
      );
    }
    const cv = this.store.one('SELECT * FROM cv_assets WHERE sha256=?', h)!;
    this.store.atomic(() => {
      this.store.exec(
        'UPDATE campaigns SET cv_id=?,updated_at=? WHERE id=?',
        cv.id,
        this.now(),
        this.campaignId,
      );
      this.revokeApprovals('Zmiana CV');
      this.event(
        'CV_ADDED',
        'Dodano niezmienną kopię PDF. CV oczekuje na zatwierdzenie.',
        cv.id,
        'user',
      );
    });
    return cv;
  }
  cvBytes(cvId: string) {
    const cv = this.store.one('SELECT * FROM cv_assets WHERE id=?', cvId);
    if (!cv) throw new DomainError('CV_MISSING', 'Nie znaleziono CV.', 404);
    const bytes = readFileSync(join(this.store.dir, 'cv', cv.stored_name));
    if (hash(bytes) !== cv.sha256)
      throw new DomainError('CV_CHANGED', 'Hash pliku CV nie zgadza się z zatwierdzonym zasobem.');
    return { cv, bytes };
  }
  approveCV(cvId: string) {
    this.cvBytes(cvId);
    this.store.exec(
      'UPDATE cv_assets SET approved_at=?,updated_at=? WHERE id=?',
      this.now(),
      this.now(),
      cvId,
    );
    this.event('CV_APPROVED', 'Użytkownik zatwierdził CV.', cvId, 'user');
  }
  revokeApprovals(reason: string, draftId?: string) {
    const filter = draftId ? ' AND draft_id=?' : '';
    const args = draftId ? [draftId] : [];
    this.store.exec(
      `UPDATE draft_approvals SET revoked_at=? WHERE revoked_at IS NULL${filter}`,
      this.now(),
      ...args,
    );
    this.store.exec(
      `UPDATE outbox SET status='CANCELLED',reason=?,updated_at=? WHERE status='QUEUED'${filter}`,
      reason,
      this.now(),
      ...args,
    );
    this.store.exec(
      `UPDATE drafts SET status='NEEDS_REVIEW',updated_at=? WHERE status='APPROVED'${draftId ? ' AND id=?' : ''}`,
      this.now(),
      ...args,
    );
  }
  updateCampaign(input: unknown) {
    const c = campaignSchema.parse(input);
    this.store.atomic(() => {
      this.store.exec(
        "UPDATE campaigns SET daily_limit=?,cycle_limit=?,campaign_limit=?,interval_minutes=?,duration_minutes=?,max_candidates=?,window_start=?,window_end=?,schedule_enabled=?,policy_version=policy_version+1,updated_at=? WHERE id='demo'",
        c.daily_limit,
        c.cycle_limit,
        c.campaign_limit,
        c.interval_minutes,
        c.duration_minutes,
        c.max_candidates,
        c.window_start,
        c.window_end,
        Number(c.schedule_enabled),
        this.now(),
      );
      this.revokeApprovals('Zmiana polityki kampanii');
      this.event(
        'POLICY_EDITED',
        'Użytkownik zmienił konfigurację; oczekujące zgody unieważniono.',
        'demo',
        'user',
      );
    });
  }
  async start(cycleKey = `manual-${id()}`) {
    if (!this.profile().approved_at)
      throw new DomainError('PROFILE_NOT_APPROVED', 'Najpierw przejrzyj i zatwierdź profil demo.');
    if (this.store.one("SELECT id FROM runs WHERE status IN ('QUEUED','RUNNING','PAUSED')")) {
      this.store.set('paused', false);
      this.store.set('stopped', false);
      this.store.exec("UPDATE runs SET status='QUEUED' WHERE status='PAUSED'");
      this.store.set('workerStatus', 'QUEUED');
      return;
    }
    if (this.store.one('SELECT id FROM runs WHERE cycle_key=?', cycleKey)) return;
    if (this.campaign().expires_at <= this.now())
      throw new DomainError('CAMPAIGN_EXPIRED', 'Kampania demo wygasła. Odnów ją w ustawieniach.');
    const runId = id();
    const at = this.now();
    this.store.atomic(() => {
      this.store.exec(
        "INSERT INTO runs VALUES (?,?,?,'QUEUED','DISCOVERY',0,0,?,NULL,NULL,NULL,NULL,?)",
        runId,
        'demo',
        cycleKey,
        at,
        at,
      );
      this.store.exec(
        "INSERT INTO jobs VALUES (?,?,'RESEARCH','QUEUED',0,0,NULL,?,?)",
        id(),
        runId,
        at,
        at,
      );
      this.store.exec("UPDATE outbox SET run_id=?,updated_at=? WHERE status='QUEUED'", runId, at);
      this.store.set('stopped', false);
      this.store.set('paused', false);
      this.store.set('workerStatus', 'QUEUED');
      this.store.set(
        'nextCycle',
        iso(new Date(this.clock().getTime() + this.campaign().interval_minutes * 60000)),
      );
      this.event(
        'RUN_STARTED',
        'Uruchomiono cykl demonstracyjny. Wszystkie kontakty są fikcyjne.',
        runId,
        'user',
      );
    });
  }
  control(action: 'pause' | 'stop' | 'emergency-stop' | 'resume-sender') {
    this.store.atomic(() => {
      if (action === 'pause') {
        this.store.set('paused', true);
        this.store.set('workerStatus', 'PAUSED');
        this.store.exec(
          "UPDATE runs SET status='PAUSED',updated_at=? WHERE status IN ('QUEUED','RUNNING')",
          this.now(),
        );
      }
      if (action === 'stop') {
        this.store.set('stopped', true);
        this.store.set('workerStatus', 'STOPPED');
        this.store.set('nextCycle', null);
        this.store.exec(
          "UPDATE runs SET status='CANCELLED',finished_at=?,updated_at=? WHERE status IN ('QUEUED','RUNNING','PAUSED')",
          this.now(),
          this.now(),
        );
        this.store.exec(
          "UPDATE jobs SET status='CANCELLED',updated_at=? WHERE status IN ('QUEUED','RUNNING')",
          this.now(),
        );
        this.revokeApprovals('Stop wszystko');
      }
      if (action === 'emergency-stop') {
        this.store.set('killSwitch', true);
        this.event(
          'KILL_SWITCH',
          'Trwale zatrzymano wysyłkę. Operacji przekazanej dostawcy nie można cofnąć.',
          null,
          'user',
        );
      }
      if (action === 'resume-sender') {
        if (this.store.one("SELECT id FROM outbox WHERE status='SEND_UNKNOWN'"))
          throw new DomainError('SEND_UNKNOWN', 'Najpierw rozstrzygnij niepewne wysyłki.');
        this.store.set('killSwitch', false);
        this.event('SENDER_RESUMED', 'Użytkownik wznowił sender DEMO.', null, 'user');
      }
      if (action === 'pause' || action === 'stop')
        this.event(
          'CONTROL',
          action === 'pause' ? 'Wstrzymano pracę.' : 'Zatrzymano całą kampanię.',
          null,
          'user',
        );
    });
  }
  validateDraft(raw: unknown, companyId: string) {
    const v = modelDraftSchema.parse(raw);
    const facts = this.profile().facts;
    if (
      v.factIds.some(
        (fid) => !facts.some((f: Row) => f.id === fid && f.approval_status === 'APPROVED'),
      )
    )
      throw new DomainError(
        'INVALID_FACT',
        'Wiadomość odwołuje się do niezatwierdzonego lub nieistniejącego faktu.',
      );
    if (
      v.evidenceIds.some(
        (eid) =>
          !this.store.one('SELECT id FROM evidence WHERE id=? AND company_id=?', eid, companyId),
      )
    )
      throw new DomainError('INVALID_EVIDENCE', 'Nieistniejący dowód lub dowód innej firmy.');
    if (
      /(\d+\s+lat[ay]?\s+doświadczenia|doświadczenie\s+komercyjne|jestem\s+studentem|wdrożyłem.*produkc|pełną\s+dyspozycyjność|biegł[ya].*(Python|Java|React))/i.test(
        v.body,
      )
    )
      throw new DomainError(
        'UNSUPPORTED_CLAIM',
        'Wiadomość zawiera deklarację wymagającą sprawdzenia.',
      );
    const hours = v.body.match(/(\d+)\s*[–-]\s*(\d+)\s+godzin/);
    const p = this.profile();
    if (hours && (+hours[1] !== p.hours_min || +hours[2] !== p.hours_max))
      throw new DomainError(
        'UNSUPPORTED_CLAIM',
        'Godziny w wiadomości nie zgadzają się z profilem.',
      );
    for (const url of v.body.match(/https?:\/\/[^\s)]+/g) ?? [])
      if (!/^https:\/\/github\.com\/JakubLewosz(?:\/[A-Za-z0-9_-]+)?$/.test(url))
        throw new DomainError('UNAPPROVED_LINK', 'Wiadomość zawiera niezatwierdzony link.');
    return v;
  }
  async discoverOne(r: ResearchResult, runId: string) {
    const found = this.store.atomic(() => this.findOrCreateCompany(r.name, r.domain));
    const company = found.company;
    if (
      found.duplicate &&
      this.store.one('SELECT id FROM opportunities WHERE company_id=?', company.id)
    ) {
      this.store.exec(
        'UPDATE runs SET duplicates=duplicates+1,updated_at=? WHERE id=?',
        this.now(),
        runId,
      );
      this.event('DUPLICATE', `Pominięto duplikat: ${r.name}.`, company.id);
      return;
    }
    const evidenceId = id(),
      contactId = id(),
      opportunityId = id();
    const q = qualify(r);
    const at = this.now();
    this.store.atomic(() => {
      this.store.exec(
        'INSERT INTO evidence VALUES (?,?,?,?,?,?,?,?,?)',
        evidenceId,
        company.id,
        r.source,
        at,
        hash(r.fragment),
        r.fragment,
        'MOCK',
        at,
        at,
      );
      this.store.exec(
        'INSERT INTO contacts VALUES (?,?,?,?,?,?,?,?,?)',
        contactId,
        company.id,
        normalizeEmail(r.email),
        r.contactPurpose,
        evidenceId,
        'MOCK_VERIFIED',
        at,
        at,
        at,
      );
      this.store.exec(
        'INSERT INTO opportunities VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        opportunityId,
        company.id,
        evidenceId,
        contactId,
        r.title,
        r.type,
        r.type === 'ARCHIVED' ? 'ARCHIVED' : 'OPEN',
        r.remote,
        r.partTime,
        r.paid,
        r.junior,
        r.hours,
        q.decision,
        JSON.stringify(q.reasons),
        JSON.stringify(['remote', 'part_time', 'paid', 'junior', 'hours']),
        at,
        at,
      );
      this.store.exec(
        "UPDATE runs SET discovered=discovered+1,stage='QUALIFICATION',heartbeat=?,updated_at=? WHERE id=?",
        at,
        at,
        runId,
      );
      this.event('DISCOVERED', `Odczytano fikcyjne źródło: ${r.name}.`, company.id);
      this.event(
        q.decision === 'REJECTED'
          ? 'REJECTED'
          : q.decision === 'NEEDS_REVIEW'
            ? 'REVIEW'
            : 'QUALIFIED',
        `${r.name}: ${q.reasons.join(' ')}`,
        company.id,
      );
    });
    if (
      !q.decision.startsWith('READY_') ||
      company.suppression_reason ||
      company.history_status !== 'NEW'
    )
      return;
    const p = this.profile();
    const requiredFactIds = [
      'identity',
      'education',
      'availability',
      'ai',
      'portfolio',
      'fixdesk',
      'autorelay',
    ].map((x) => `fact-${x}`);
    // The E2 template uses only the supplied, approved initial facts. Changed facts require a future draft adapter or manual review.
    if (
      !p.approved_at ||
      requiredFactIds.some(
        (fid) =>
          !p.facts.some(
            (f: Row) =>
              f.id === fid &&
              f.approval_status === 'APPROVED' &&
              f.content === initialFacts.find((x) => `fact-${x[0]}` === fid)?.[1],
          ),
      ) ||
      p.name !== 'Jakub Lewosz' ||
      p.hours_min !== 15 ||
      p.hours_max !== 20
    ) {
      this.event(
        'DRAFT_BLOCKED',
        `${r.name}: zmieniony profil wymaga ręcznie przygotowanego szkicu. Szablon demo nie dopisuje faktów.`,
        company.id,
      );
      return;
    }
    const proposed = await this.codex.draft({
      profile: p,
      title: r.title,
      open: r.type === 'OPEN',
      factIds: requiredFactIds,
      evidenceId,
    });
    const v = this.validateDraft(proposed, company.id);
    const draftId = id();
    const payloadHash = hash(JSON.stringify(v));
    this.store.atomic(() => {
      this.store.exec(
        'INSERT INTO drafts VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?,?)',
        draftId,
        'demo',
        company.id,
        opportunityId,
        contactId,
        v.subject,
        v.body,
        JSON.stringify(v.factIds),
        JSON.stringify(v.evidenceIds),
        payloadHash,
        'NEEDS_REVIEW',
        at,
        at,
      );
      this.store.exec(
        'INSERT INTO draft_versions VALUES (?,?,?,?,?,?,?)',
        id(),
        draftId,
        1,
        v.subject,
        v.body,
        payloadHash,
        at,
      );
      this.event('DRAFTED', `Przygotowano lokalny szkic: ${r.name}.`, draftId);
    });
  }
  draftRows() {
    return this.store.all(
      'SELECT d.*,c.canonical_name,c.history_status,c.suppression_reason,t.email,o.decision FROM drafts d JOIN companies c ON c.id=d.company_id JOIN contacts t ON t.id=d.contact_id JOIN opportunities o ON o.id=d.opportunity_id ORDER BY d.created_at DESC',
    );
  }
  binding(draft: Row) {
    const c = this.campaign();
    const p = this.profile();
    const t = this.store.one('SELECT * FROM contacts WHERE id=?', draft.contact_id)!;
    const cv = c.cv_id ? this.store.one('SELECT * FROM cv_assets WHERE id=?', c.cv_id) : null;
    return hash(
      JSON.stringify({
        recipient: t.email,
        subject: draft.subject,
        body: draft.body,
        version: draft.version,
        payload: draft.payload_hash,
        profile: p.profile_hash,
        profileVersion: p.version,
        account: c.account_email,
        cv: cv?.sha256 ?? null,
        policy: c.policy_version,
        mode: c.mode,
      }),
    );
  }
  policy(draft: Row, approval?: Row, ignoreQuota = false, runId?: string): string[] {
    const problems: string[] = [];
    if (this.mode !== 'DEMO') return ['SEND_DISABLED'];
    const c = this.campaign();
    const p = this.profile();
    const state = this.state();
    if (c.mode !== 'DEMO') problems.push('LIVE_DISABLED');
    if (state.killSwitch) problems.push('KILL_SWITCH');
    if (state.stopped) problems.push('STOPPED');
    if (state.paused) problems.push('PAUSED');
    if (c.expires_at <= this.now()) problems.push('CAMPAIGN_EXPIRED');
    if (!p.approved_at) problems.push('PROFILE_NOT_APPROVED');
    const company = this.store.one('SELECT * FROM companies WHERE id=?', draft.company_id)!;
    if (
      company.suppression_reason ||
      this.store.one('SELECT id FROM suppressions WHERE company_id=?', company.id)
    )
      problems.push('SUPPRESSED');
    if (company.history_status !== 'NEW') problems.push('CONTACT_HISTORY');
    const opp = this.store.one('SELECT * FROM opportunities WHERE id=?', draft.opportunity_id)!;
    if (!['READY_APPLICATION', 'READY_OPEN_INQUIRY'].includes(opp.decision))
      problems.push('QUALIFICATION_REQUIRED');
    const contact = this.store.one('SELECT * FROM contacts WHERE id=?', draft.contact_id)!;
    if (
      this.store.one(
        "SELECT id FROM history_records WHERE lower(email)=? AND status!='SUGGESTED'",
        normalizeEmail(contact.email),
      )
    )
      problems.push('RECIPIENT_HISTORY');
    if (
      !z.email().safeParse(contact.email).success ||
      /[\r\n]/.test(contact.email) ||
      !contact.email.endsWith('.example.invalid')
    )
      problems.push('INVALID_RECIPIENT');
    if (contact.kind !== 'RECRUITMENT') problems.push('CONTACT_REVIEW');
    if (
      !c.account_email.endsWith('.example.invalid') ||
      !z.email().safeParse(c.account_email).success
    )
      problems.push('INVALID_SENDER');
    try {
      this.validateDraft(
        {
          subject: draft.subject,
          body: draft.body,
          factIds: JSON.parse(draft.fact_ids),
          evidenceIds: JSON.parse(draft.evidence_ids),
        },
        company.id,
      );
    } catch {
      problems.push('INVALID_DRAFT');
    }
    const evidence = this.store.one('SELECT * FROM evidence WHERE id=?', opp.evidence_id);
    if (!evidence || this.clock().getTime() - new Date(evidence.fetched_at).getTime() > 86400000)
      problems.push('STALE_EVIDENCE');
    if (this.clock().getTime() - new Date(contact.verified_at).getTime() > 7 * 86400000)
      problems.push('STALE_CONTACT');
    if (c.cv_id) {
      try {
        const { cv } = this.cvBytes(c.cv_id);
        if (!cv.approved_at) problems.push('CV_NOT_APPROVED');
      } catch {
        problems.push('CV_CHANGED');
      }
    }
    if (approval) {
      if (approval.revoked_at || approval.expires_at <= this.now())
        problems.push('APPROVAL_EXPIRED');
      if (
        approval.draft_version !== draft.version ||
        approval.payload_hash !== draft.payload_hash ||
        approval.binding_hash !== this.binding(draft)
      )
        problems.push('APPROVAL_CHANGED');
    }
    if (!ignoreQuota) {
      const today = day(this.clock(), c.timezone);
      if (
        this.store.one(
          'SELECT count(*) n FROM usage_ledger WHERE campaign_id=? AND day=?',
          'demo',
          today,
        )!.n >= c.daily_limit
      )
        problems.push('DAILY_LIMIT');
      if (
        this.store.one('SELECT count(*) n FROM usage_ledger WHERE campaign_id=?', 'demo')!.n >=
        c.campaign_limit
      )
        problems.push('CAMPAIGN_LIMIT');
      if (
        runId &&
        this.store.one('SELECT count(*) n FROM usage_ledger WHERE run_id=?', runId)!.n >=
          c.cycle_limit
      )
        problems.push('CYCLE_LIMIT');
    }
    return [...new Set(problems)];
  }
  editDraft(draftId: string, input: { version: number; subject: string; body: string }) {
    const d = this.store.one('SELECT * FROM drafts WHERE id=?', draftId);
    if (!d) throw new DomainError('NOT_FOUND', 'Brak szkicu.', 404);
    if (d.version !== input.version)
      throw new DomainError('VERSION_CONFLICT', 'Szkic zmieniono w innym oknie.');
    if (
      this.store.one(
        "SELECT id FROM outbox WHERE draft_id=? AND kind='FIRST_CONTACT' AND status IN ('SENDING','SEND_UNKNOWN','SENT_PROVIDER','SENT_CONFIRMED')",
        draftId,
      )
    )
      throw new DomainError('FROZEN', 'Wiadomość przekazano do wysyłki; zapis jest niezmienny.');
    const v = this.validateDraft(
      {
        subject: input.subject,
        body: input.body,
        factIds: JSON.parse(d.fact_ids),
        evidenceIds: JSON.parse(d.evidence_ids),
      },
      d.company_id,
    );
    const h = hash(JSON.stringify(v));
    this.store.atomic(() => {
      this.revokeApprovals('Edycja wiadomości', draftId);
      this.store.exec(
        "UPDATE drafts SET subject=?,body=?,version=version+1,payload_hash=?,status='NEEDS_REVIEW',updated_at=? WHERE id=?",
        v.subject,
        v.body,
        h,
        this.now(),
        draftId,
      );
      this.store.exec(
        'INSERT INTO draft_versions VALUES (?,?,?,?,?,?,?)',
        id(),
        draftId,
        d.version + 1,
        v.subject,
        v.body,
        h,
        this.now(),
      );
      this.event(
        'DRAFT_EDITED',
        'Zapisano nową wersję; poprzednia zgoda została unieważniona.',
        draftId,
        'user',
      );
    });
  }
  approveBatch(input: { id: string; version: number }[]) {
    this.requireDemo();
    if (!input.length || input.length > 20 || new Set(input.map((d) => d.id)).size !== input.length)
      throw new DomainError('INVALID_BATCH', 'Wybierz od 1 do 20 różnych szkiców.');
    const run = this.store.one('SELECT * FROM runs ORDER BY started_at DESC LIMIT 1');
    if (!run) throw new DomainError('NO_RUN', 'Najpierw uruchom cykl demo.');
    this.store.atomic(() => {
      for (const x of input) {
        const d = this.store.one('SELECT * FROM drafts WHERE id=?', x.id);
        if (!d || x.version !== d.version)
          throw new DomainError('VERSION_CONFLICT', 'Szkic zmienił się od chwili podglądu.');
        const issues = this.policy(d, undefined, true);
        if (issues.length)
          throw new DomainError(issues[0], `Wysyłka zablokowana: ${issues.join(', ')}`);
        if (
          this.store.one(
            "SELECT id FROM outbox WHERE company_id=? AND status IN ('QUEUED','SENDING','SENT_PROVIDER','SENT_CONFIRMED','SEND_UNKNOWN')",
            d.company_id,
          )
        )
          throw new DomainError(
            'DUPLICATE_CONTACT',
            'Firma już jest w kolejce lub została kontaktowana.',
          );
        const approvalId = id();
        this.store.exec(
          "INSERT INTO draft_approvals VALUES (?,?,?,?,?,'user',?,NULL,?)",
          approvalId,
          d.id,
          d.version,
          d.payload_hash,
          this.binding(d),
          iso(new Date(this.clock().getTime() + 3600000)),
          this.now(),
        );
        this.store.exec(
          "UPDATE drafts SET status='APPROVED',updated_at=? WHERE id=?",
          this.now(),
          d.id,
        );
        this.store.exec(
          'INSERT INTO outbox (id,submission_id,draft_id,draft_version,company_id,run_id,approval_id,status,lease_until,reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,NULL,NULL,?,?)',
          id(),
          id(),
          d.id,
          d.version,
          d.company_id,
          run.id,
          approvalId,
          'QUEUED',
          this.now(),
          this.now(),
        );
        this.event(
          'APPROVED',
          'Użytkownik zatwierdził konkretną wersję do symulacji wysyłki.',
          d.id,
          'user',
        );
      }
    });
  }
  setOutbox(outboxId: string, status: string, reason: string | null = null) {
    this.store.exec(
      'UPDATE outbox SET status=?,reason=?,lease_until=NULL,updated_at=? WHERE id=?',
      status,
      reason,
      this.now(),
      outboxId,
    );
  }
  requireDemo() {
    if (this.mode !== 'DEMO')
      throw new DomainError(
        'SEND_DISABLED',
        'RESEARCH_ONLY: wysyłka, zgody na wysyłkę i symulowana poczta są niedostępne.',
      );
  }
  async dispatchOne() {
    this.requireDemo();
    const o = this.store.one(
      "SELECT * FROM outbox WHERE status='QUEUED' ORDER BY created_at LIMIT 1",
    );
    if (!o) return;
    const d = this.store.one('SELECT * FROM drafts WHERE id=?', o.draft_id)!;
    const a = this.store.one('SELECT * FROM draft_approvals WHERE id=?', o.approval_id)!;
    const issues = this.policy(d, a, false, o.run_id);
    if (
      issues.some((x) =>
        [
          'PAUSED',
          'STOPPED',
          'KILL_SWITCH',
          'DAILY_LIMIT',
          'CYCLE_LIMIT',
          'CAMPAIGN_LIMIT',
        ].includes(x),
      )
    ) {
      this.store.set('workerStatus', issues[0]);
      return;
    }
    if (issues.length) {
      this.store.atomic(() => {
        this.setOutbox(o.id, 'BLOCKED', issues.join(', '));
        this.store.exec('UPDATE draft_approvals SET revoked_at=? WHERE id=?', this.now(), a.id);
        this.store.exec(
          "UPDATE drafts SET status='NEEDS_REVIEW',updated_at=? WHERE id=?",
          this.now(),
          d.id,
        );
        this.event('SEND_BLOCKED', `Blokada: ${issues.join(', ')}`, o.id);
      });
      return;
    }
    const recipient = this.store.one('SELECT email FROM contacts WHERE id=?', d.contact_id)!.email;
    const c = this.campaign();
    const messageId = `<${o.submission_id}@jobhunter.example.invalid>`;
    const cv = c.cv_id ? this.cvBytes(c.cv_id) : null;
    const composed = await nodemailer
      .createTransport({ streamTransport: true, buffer: true, newline: 'windows' })
      .sendMail({
        from: c.account_email,
        to: recipient,
        subject: d.subject,
        text: d.body,
        messageId,
        date: this.clock(),
        attachments: cv
          ? [{ filename: cv.cv.file_name, content: cv.bytes, contentType: 'application/pdf' }]
          : [],
      });
    const mime = composed.message as Buffer;
    const mimeHash = hash(mime);
    const attemptId = id();
    // Recheck inside the transaction after asynchronous MIME composition. No HTTP inside the transaction.
    const reserved = this.store.atomic(() => {
      const current = this.store.one('SELECT * FROM outbox WHERE id=?', o.id)!;
      const latest = this.store.one('SELECT * FROM drafts WHERE id=?', d.id)!;
      const latestApproval = this.store.one(
        'SELECT * FROM draft_approvals WHERE id=?',
        o.approval_id,
      )!;
      if (
        current.status !== 'QUEUED' ||
        this.policy(latest, latestApproval, false, o.run_id).length
      )
        return false;
      this.store.exec(
        "UPDATE outbox SET status='SENDING',lease_until=?,updated_at=? WHERE id=?",
        iso(new Date(this.clock().getTime() + 60000)),
        this.now(),
        o.id,
      );
      this.store.exec(
        "INSERT INTO usage_ledger VALUES (?,?,?,?,?,'RESERVED',?)",
        id(),
        o.id,
        'demo',
        o.run_id,
        day(this.clock(), c.timezone),
        this.now(),
      );
      this.store.exec(
        "INSERT INTO send_attempts VALUES (?,?,?,?,?,?,?,?,'SENDING',NULL,NULL,NULL,?,?)",
        attemptId,
        o.id,
        messageId,
        mime,
        mimeHash,
        c.account_email,
        recipient,
        cv?.cv.sha256 ?? null,
        this.now(),
        this.now(),
      );
      return true;
    });
    if (!reserved) return;
    try {
      const result = await this.mail.sendFrozenMessage({
        messageId,
        recipient,
        mime,
        mimeHash,
        scenario: this.store.get('scenario', 'NORMAL'),
      });
      this.store.atomic(() => {
        this.store.exec(
          'UPDATE send_attempts SET state=?,provider_id=?,provider_thread_id=?,updated_at=? WHERE id=?',
          result.confirmed ? 'SENT_CONFIRMED' : 'SENT_PROVIDER',
          result.id,
          result.threadId,
          this.now(),
          attemptId,
        );
        this.setOutbox(o.id, result.confirmed ? 'SENT_CONFIRMED' : 'SENT_PROVIDER');
        this.store.exec("UPDATE usage_ledger SET state='ACCEPTED' WHERE outbox_id=?", o.id);
        this.store.exec(
          "UPDATE drafts SET status='SENT',updated_at=? WHERE id=?",
          this.now(),
          d.id,
        );
        this.store.exec(
          "UPDATE companies SET history_status='CONTACTED',updated_at=? WHERE id=?",
          this.now(),
          d.company_id,
        );
        this.event(
          'SENT',
          `Mock przyjął wiadomość do ${recipient}. ${result.confirmed ? 'Potwierdzono w symulowanych Wysłanych.' : 'Oczekuje na potwierdzenie w Wysłanych.'}`,
          o.id,
        );
        if (result.confirmed) this.createReply(o, result.threadId);
      });
    } catch (error) {
      const definitelyNotSent = error instanceof Error && error.message === 'FAILED_NOT_SENT';
      this.store.atomic(() => {
        this.setOutbox(
          o.id,
          definitelyNotSent ? 'FAILED_NOT_SENT' : 'SEND_UNKNOWN',
          definitelyNotSent
            ? 'Mock: odrzucono przed wysyłką.'
            : 'Niepewny wynik. Nie ponawiaj; rozstrzygnij przez Message-ID.',
        );
        this.store.exec(
          'UPDATE send_attempts SET state=?,error_class=?,updated_at=? WHERE id=?',
          definitelyNotSent ? 'FAILED_NOT_SENT' : 'SEND_UNKNOWN',
          definitelyNotSent ? 'REJECTED_BEFORE_SEND' : 'TIMEOUT',
          this.now(),
          attemptId,
        );
        this.store.exec(
          'UPDATE usage_ledger SET state=? WHERE outbox_id=?',
          definitelyNotSent ? 'NOT_SENT' : 'UNKNOWN',
          o.id,
        );
        if (definitelyNotSent) {
          this.store.exec('UPDATE draft_approvals SET revoked_at=? WHERE id=?', this.now(), a.id);
          this.store.exec(
            "UPDATE drafts SET status='NEEDS_REVIEW',updated_at=? WHERE id=?",
            this.now(),
            d.id,
          );
        }
        // Conservative quota ledger includes failed attempts; only explicit future reconciliation may release reservations.
        if (!definitelyNotSent) this.store.set('killSwitch', true);
        this.event(
          definitelyNotSent ? 'SEND_FAILED' : 'SEND_UNKNOWN',
          definitelyNotSent
            ? 'Nie wysłano wiadomości. Próba zapisana.'
            : 'Wynik wysyłki niepewny; sender zatrzymany.',
          o.id,
        );
      });
    }
  }
  createReply(o: Row, threadId: string) {
    this.requireDemo();
    if (this.store.one('SELECT id FROM mail_messages WHERE outbox_id=?', o.id)) return;
    const company = this.store.one('SELECT * FROM companies WHERE id=?', o.company_id)!;
    const r = mockReply(company.canonical_name, this.store.get('scenario', 'NORMAL'));
    this.store.exec(
      'INSERT INTO mail_messages VALUES (?,?,?,?,?,?,?,?,NULL,?,?)',
      id(),
      o.id,
      company.id,
      `reply-${id()}`,
      threadId,
      r.category,
      r.category,
      r.body,
      this.now(),
      this.now(),
    );
    if (['REJECTED', 'ON_HOLD', 'BOUNCE'].includes(r.category))
      this.suppress(company.id, r.category, r.body);
    this.checkBounceStreak();
    this.event('REPLY', `Symulowana odpowiedź: ${company.canonical_name}.`, company.id);
  }
  checkBounceStreak() {
    const latest = this.store.all(
      'SELECT category FROM mail_messages ORDER BY created_at DESC,rowid DESC LIMIT 3',
    );
    if (
      latest.length === 3 &&
      latest.every((r) => r.category === 'BOUNCE') &&
      !this.state().killSwitch
    ) {
      this.store.set('killSwitch', true);
      this.event('BOUNCE_PAUSE', 'Trzy kolejne trwałe zwroty. Sender zatrzymany do przeglądu.');
    }
  }
  async reconcile(outboxId: string) {
    this.requireDemo();
    const o = this.store.one('SELECT * FROM outbox WHERE id=?', outboxId);
    if (!o || !['SEND_UNKNOWN', 'SENT_PROVIDER'].includes(o.status))
      throw new DomainError('INVALID_STATE', 'Ten rekord nie wymaga rozstrzygnięcia.');
    const a = this.store.one('SELECT * FROM send_attempts WHERE outbox_id=?', outboxId)!;
    const result = await this.mail.lookupSendResult(a.message_id);
    if (!result || !result.confirmed) {
      this.event(
        'RECONCILE_PENDING',
        'Nie znaleziono pewnego potwierdzenia. Bez ponownej wysyłki.',
        outboxId,
        'user',
      );
      return { confirmed: false };
    }
    this.store.atomic(() => {
      this.setOutbox(outboxId, 'SENT_CONFIRMED');
      this.store.exec(
        "UPDATE send_attempts SET state='SENT_CONFIRMED',provider_id=?,provider_thread_id=?,updated_at=? WHERE outbox_id=?",
        result.id,
        result.threadId,
        this.now(),
        outboxId,
      );
      this.store.exec("UPDATE usage_ledger SET state='ACCEPTED' WHERE outbox_id=?", outboxId);
      this.store.exec(
        "UPDATE companies SET history_status='CONTACTED',updated_at=? WHERE id=?",
        this.now(),
        o.company_id,
      );
      this.store.exec(
        "UPDATE drafts SET status='SENT',updated_at=? WHERE id=?",
        this.now(),
        o.draft_id,
      );
      this.event(
        'RECONCILED',
        'Potwierdzono istniejącą wiadomość po Message-ID. Nie wykonano kolejnego send.',
        outboxId,
        'user',
      );
      this.createReply(o, result.threadId);
    });
    return { confirmed: true };
  }
  reviewReply(replyId: string, category: string) {
    const r = this.store.one('SELECT * FROM mail_messages WHERE id=?', replyId);
    if (!r) throw new DomainError('NOT_FOUND', 'Brak odpowiedzi.', 404);
    this.store.atomic(() => {
      this.store.exec(
        'UPDATE mail_messages SET category=?,reviewed_at=?,updated_at=? WHERE id=?',
        category,
        this.now(),
        this.now(),
        replyId,
      );
      if (['REJECTED', 'ON_HOLD', 'BOUNCE'].includes(category))
        this.suppress(
          r.company_id,
          category,
          'Klasyfikacja zatwierdzona przez użytkownika.',
          'user',
        );
      this.checkBounceStreak();
      this.event(
        'REPLY_REVIEWED',
        `Użytkownik zatwierdził klasyfikację: ${category}.`,
        replyId,
        'user',
      );
    });
  }
  previewHistory(text: string) {
    let raw: Row[];
    try {
      raw = parse(text, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        trim: true,
        max_record_size: 10000,
      });
    } catch {
      throw new DomainError('INVALID_CSV', 'Nieprawidłowy plik CSV.', 400);
    }
    if (raw.length > 1000 || !raw.length)
      throw new DomainError('INVALID_CSV', 'CSV musi zawierać od 1 do 1000 wierszy.', 400);
    const schema = z
      .object({
        company: z.string().min(1).max(200),
        status: z.enum([
          'SUGGESTED',
          'CONTACTED',
          'REJECTED',
          'ACTIVE_CONVERSATION',
          'RECRUITMENT_ON_HOLD',
        ]),
        domain: z.string().max(200).optional(),
        email: z.string().max(200).optional(),
        date: z.string().max(40).optional(),
      })
      .strict();
    const seen = new Set<string>();
    const rows = raw.map((r, index) => {
      const parsed = schema.safeParse(r);
      if (!parsed.success)
        return {
          index: index + 2,
          company: r.company ?? '',
          valid: false,
          reason: 'Wymagane company i status. Dozwolone: domain, email, date.',
        };
      const v = parsed.data;
      if (v.date && Number.isNaN(Date.parse(v.date)))
        return { ...v, index: index + 2, valid: false, reason: 'Nieprawidłowa data.' };
      if (
        (v.domain &&
          (this.mode === 'DEMO'
            ? !v.domain.endsWith('.example.invalid')
            : !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v.domain) || v.domain.endsWith('.invalid'))) ||
        (v.email &&
          (!z.email().safeParse(v.email).success ||
            (this.mode === 'DEMO'
              ? !v.email.endsWith('.example.invalid')
              : v.email.endsWith('.invalid'))))
      )
        return {
          ...v,
          index: index + 2,
          valid: false,
          reason:
            this.mode === 'DEMO'
              ? 'Import DEMO przyjmuje wyłącznie fikcyjne domeny i adresy .example.invalid.'
              : 'Wymagany rzeczywisty adres i domena; dane demo nie należą do historii researchu.',
        };
      const key = normalizeName(v.company);
      const d = companyDomain(v.domain);
      const duplicate =
        seen.has(key) ||
        !!this.store.one(
          'SELECT id FROM companies WHERE normalized_key=? OR (primary_domain IS NOT NULL AND primary_domain=?)',
          key,
          d,
        );
      seen.add(key);
      return {
        ...v,
        index: index + 2,
        valid: true,
        duplicate,
        reason: duplicate ? 'Scalenie z istniejącą firmą' : 'Nowy rekord',
      };
    });
    return {
      hash: hash(text),
      rows,
      alreadyImported: this.store.get(`import-${hash(text)}`, false),
    };
  }
  importHistory(text: string, expectedHash: string) {
    const preview = this.previewHistory(text);
    if (preview.hash !== expectedHash)
      throw new DomainError('IMPORT_CHANGED', 'Plik zmieniono od podglądu.');
    if (preview.rows.some((r) => !r.valid))
      throw new DomainError(
        'INVALID_CSV',
        'Popraw wszystkie nieprawidłowe wiersze przed importem.',
        400,
      );
    if (preview.alreadyImported) return { imported: 0, duplicate: true };
    this.store.atomic(() => {
      for (const r of preview.rows as Row[]) {
        const found = this.findOrCreateCompany(r.company, r.domain ?? null);
        const status = r.status === 'SUGGESTED' ? 'HISTORY_TO_VERIFY' : r.status;
        this.store.exec(
          'INSERT INTO history_records VALUES (?,?,?,?,?,?,?,?,?,?)',
          id(),
          preview.hash,
          r.index,
          found.company.id,
          r.company,
          r.email ?? null,
          r.domain ?? null,
          r.status,
          r.date ? iso(new Date(r.date)) : null,
          this.now(),
        );
        if (status !== 'HISTORY_TO_VERIFY' || found.company.history_status === 'NEW')
          this.store.exec(
            'UPDATE companies SET history_status=?,updated_at=? WHERE id=?',
            status,
            this.now(),
            found.company.id,
          );
        if (['REJECTED', 'RECRUITMENT_ON_HOLD', 'ACTIVE_CONVERSATION'].includes(status))
          this.suppress(found.company.id, status, 'Import historii CSV użytkownika.', 'user');
      }
      this.store.set(`import-${preview.hash}`, true);
      this.event(
        'HISTORY_IMPORTED',
        `Zaimportowano ${preview.rows.length} wierszy historii ${this.mode}. Sugestie nie oznaczają wysyłek.`,
        null,
        'user',
      );
    });
    return { imported: preview.rows.length };
  }
  companies() {
    return this.store.all(
      `SELECT c.*,o.id opportunity_id,o.title,o.type,o.remote,o.part_time,o.paid,o.junior,o.hours,o.decision,o.reasons,e.canonical_url,e.fetched_at,e.fragment,t.email FROM companies c LEFT JOIN opportunities o ON o.company_id=c.id LEFT JOIN evidence e ON e.id=o.evidence_id LEFT JOIN contacts t ON t.id=o.contact_id ORDER BY CASE WHEN o.id IS NULL THEN 1 ELSE 0 END,c.created_at DESC`,
    );
  }
  outboxRows() {
    return this.store.all(
      'SELECT o.*,c.canonical_name,a.message_id,a.mime_hash,a.provider_id,a.state attempt_state FROM outbox o JOIN companies c ON c.id=o.company_id LEFT JOIN send_attempts a ON a.outbox_id=o.id ORDER BY o.created_at DESC',
    );
  }
  replies() {
    return this.store.all(
      'SELECT m.*,c.canonical_name FROM mail_messages m JOIN companies c ON c.id=m.company_id ORDER BY m.created_at DESC',
    );
  }
  dashboard(): Dashboard {
    const today = day(this.clock());
    const count = (sql: string, ...args: any[]) => this.store.one(sql, ...args)!.n;
    const actionCount = (action: string) =>
      count('SELECT count(*) n FROM audit_events WHERE day=? AND action=?', today, action);
    const stats = {
      companies: actionCount('DISCOVERED'),
      qualified: actionCount('QUALIFIED'),
      duplicates: actionCount('DUPLICATE'),
      rejected: actionCount('REJECTED'),
      drafts: actionCount('DRAFTED'),
      sent: 0,
      replies: 0,
      interested: 0,
      reserved: count('SELECT count(*) n FROM usage_ledger WHERE day=?', today),
    };
    // Day membership is derived from the persistent Warsaw quota ledger, including DST/midnight.
    stats.sent = count(
      "SELECT count(*) n FROM send_attempts a JOIN usage_ledger u ON u.outbox_id=a.outbox_id WHERE u.day=? AND a.state IN ('SENT_PROVIDER','SENT_CONFIRMED')",
      today,
    );
    stats.replies = this.replies().filter((r) => day(new Date(r.created_at)) === today).length;
    stats.interested = this.replies().filter(
      (r) =>
        ['INTERESTED', 'INVITATION'].includes(r.category) &&
        r.reviewed_at &&
        day(new Date(r.created_at)) === today,
    ).length;
    return {
      mode: this.mode,
      day: today,
      stats,
      daily: this.store
        .all(
          `SELECT e.day,sum(e.action='DISCOVERED') companies,sum(e.action='DRAFTED') drafts,
           (SELECT count(*) FROM send_attempts a JOIN usage_ledger u ON u.outbox_id=a.outbox_id
            WHERE u.day=e.day AND a.state IN ('SENT_PROVIDER','SENT_CONFIRMED')) sent
           FROM audit_events e GROUP BY e.day ORDER BY e.day DESC LIMIT 7`,
        )
        .reverse(),
      state: this.state(),
      campaign: this.campaign(),
      events: this.store.all(
        'SELECT * FROM audit_events ORDER BY created_at DESC,rowid DESC LIMIT 40',
      ),
      runs: this.store.all('SELECT * FROM runs ORDER BY started_at DESC LIMIT 15'),
      recentCompanies: this.companies()
        .filter((c) => c.opportunity_id)
        .slice(0, 4),
      profileApproved: !!this.profile().approved_at,
      pending: count("SELECT count(*) n FROM drafts WHERE status='NEEDS_REVIEW'"),
      unknown: count("SELECT count(*) n FROM outbox WHERE status='SEND_UNKNOWN'"),
    };
  }
  report(format: 'md' | 'csv') {
    const d = this.dashboard();
    const events = this.store.all(
      'SELECT * FROM audit_events WHERE day=? ORDER BY created_at',
      d.day,
    );
    const sends = this.outboxRows();
    if (format === 'csv')
      return [
        'typ,firma,status,czas,opis',
        ...events.map((e) =>
          ['zdarzenie', '', e.action, e.created_at, e.message].map(csvCell).join(','),
        ),
        ...sends.map((o) =>
          ['wysyłka', o.canonical_name, o.status, o.created_at, o.reason ?? o.message_id ?? '']
            .map(csvCell)
            .join(','),
        ),
      ].join('\r\n');
    return (
      `# JobHunter — raport ${d.day}\n\n**SYMULACJA / DEMO. Żadnych rzeczywistych wysyłek.**\n\n` +
      Object.entries(d.stats)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n') +
      `\n\nZużycie: adapter mock-local; wywołania modelu: 0; koszt: brak danych.\n\n## Firmy i dowody\n\n` +
      this.companies()
        .filter((c) => c.opportunity_id)
        .map(
          (c) =>
            `- ${c.canonical_name}: ${c.decision}; źródło: ${c.canonical_url}; odczyt: ${c.fetched_at}; powody: ${JSON.parse(c.reasons).join(' ')}`,
        )
        .join('\n') +
      `\n\n## Wiadomości\n\n` +
      this.draftRows()
        .map((d) => `### ${d.canonical_name} — ${d.status}\n\nTemat: ${d.subject}\n\n${d.body}\n`)
        .join('\n') +
      `\n## Wysyłki\n\n` +
      sends
        .map(
          (o) =>
            `- ${o.canonical_name}: ${o.status}; ${o.message_id ?? 'brak próby'}; ${o.reason ?? ''}`,
        )
        .join('\n') +
      `\n\n## Działania\n\n` +
      events.map((e) => `- ${e.created_at}: ${e.message}`).join('\n')
    );
  }
  async tick() {
    if (this.busy) return;
    this.busy = true;
    try {
      this.store.set('heartbeat', this.now());
      if (this.state().stopped || this.state().paused) return;
      const job = this.store.one(
        "SELECT * FROM jobs WHERE status='QUEUED' ORDER BY created_at LIMIT 1",
      );
      if (job) {
        this.store.exec(
          "UPDATE jobs SET status='RUNNING',attempts=attempts+1,lease_until=?,updated_at=? WHERE id=?",
          iso(new Date(this.clock().getTime() + 60000)),
          this.now(),
          job.id,
        );
        this.store.exec(
          "UPDATE runs SET status='RUNNING',heartbeat=?,updated_at=? WHERE id=?",
          this.now(),
          this.now(),
          job.run_id,
        );
        this.store.set('workerStatus', 'RUNNING');
        const rows = (await this.research.discover()).slice(0, this.campaign().max_candidates);
        const started = this.clock().getTime();
        for (let i = job.cursor; i < rows.length; i++) {
          if (this.state().stopped || this.state().paused) {
            if (!this.state().stopped)
              this.store.exec(
                "UPDATE jobs SET status='QUEUED',updated_at=? WHERE id=?",
                this.now(),
                job.id,
              );
            return;
          }
          if (this.clock().getTime() - started > this.campaign().duration_minutes * 60000) {
            this.event('BUDGET_EXCEEDED', 'Cykl osiągnął limit czasu.', job.run_id);
            break;
          }
          await this.discoverOne(rows[i], job.run_id);
          this.store.exec(
            'UPDATE jobs SET cursor=?,lease_until=?,updated_at=? WHERE id=?',
            i + 1,
            iso(new Date(this.clock().getTime() + 60000)),
            this.now(),
            job.id,
          );
          this.store.exec(
            'UPDATE runs SET heartbeat=?,updated_at=? WHERE id=?',
            this.now(),
            this.now(),
            job.run_id,
          );
        }
        this.store.atomic(() => {
          this.store.exec(
            "UPDATE jobs SET status='DONE',lease_until=NULL,updated_at=? WHERE id=?",
            this.now(),
            job.id,
          );
          const run = this.store.one('SELECT * FROM runs WHERE id=?', job.run_id)!;
          this.store.exec(
            "UPDATE runs SET status='COMPLETED',stage='DRAFTS_READY',finished_at=?,lease_until=NULL,updated_at=? WHERE id=?",
            this.now(),
            this.now(),
            job.run_id,
          );
          this.store.exec(
            "UPDATE campaigns SET empty_cycles=?,updated_at=? WHERE id='demo'",
            run.discovered ? 0 : this.campaign().empty_cycles + 1,
            this.now(),
          );
          this.event(
            'RUN_COMPLETED',
            `Cykl zakończony: ${run.discovered} nowych firm, ${run.duplicates} duplikatów.`,
            job.run_id,
          );
        });
      }
      if (!this.state().killSwitch && !this.state().paused && !this.state().stopped)
        await this.dispatchOne();
      if (this.store.one("SELECT id FROM outbox WHERE status='SEND_UNKNOWN'"))
        this.store.set('workerStatus', 'SEND_UNKNOWN');
      else if (this.store.one("SELECT id FROM outbox WHERE status='QUEUED'")) {
        if (
          !this.state().killSwitch &&
          !['DAILY_LIMIT', 'CYCLE_LIMIT', 'CAMPAIGN_LIMIT'].includes(this.state().status)
        )
          this.store.set('workerStatus', 'DISPATCHING');
      } else
        this.store.set(
          'workerStatus',
          this.store.one("SELECT id FROM drafts WHERE status='NEEDS_REVIEW'")
            ? 'WAITING_FOR_APPROVAL'
            : 'IDLE',
        );
      const c = this.campaign();
      const next = this.state().nextCycle;
      if (c.empty_cycles >= 3) {
        this.store.set('nextCycle', null);
        this.store.set('workerStatus', 'NO_NEW_CANDIDATES');
      } else if (
        c.schedule_enabled &&
        next &&
        next <= this.now() &&
        inWindow(this.clock(), c.window_start, c.window_end, c.timezone)
      ) {
        // One due cycle only after sleep. Never enqueue all missed intervals.
        await this.start(`scheduled-${next}`);
      }
    } catch (error) {
      this.store.set('workerStatus', 'ERROR');
      this.store.set('killSwitch', true);
      this.store.exec(
        "UPDATE jobs SET status='ERROR',lease_until=NULL,updated_at=? WHERE status='RUNNING'",
        this.now(),
      );
      this.store.exec(
        "UPDATE runs SET status='ERROR',error=?,finished_at=?,updated_at=? WHERE status='RUNNING'",
        error instanceof DomainError ? error.code : 'INTERNAL_ERROR',
        this.now(),
        this.now(),
      );
      this.event(
        'ERROR',
        `Worker zatrzymany: ${error instanceof DomainError ? error.code : 'błąd wewnętrzny; sprawdź log lokalny'}.`,
      );
    } finally {
      this.busy = false;
    }
  }
  startWorker() {
    this.timer = setInterval(() => void this.tick(), 750);
  }
  async stopWorker() {
    if (this.timer) clearInterval(this.timer);
    while (this.busy) await new Promise((r) => setTimeout(r, 10));
  }
}
