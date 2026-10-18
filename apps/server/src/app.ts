import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { Store } from './db.js';
import { JobHunter, replyCategories } from './service.js';
import { ResearchJobHunter } from './research/service.js';
import type { StructuredRunner } from './research/codex.js';
import type { SourceReader } from './research/fetcher.js';
import { DomainError, hash, id } from './util.js';
import { prepareMime } from './gmail/mime.js';
import { GmailJobHunter } from './gmail/service.js';
import type { GmailGateway } from './gmail/reader.js';
import type { AccountInfo } from './gmail/oauth.js';
import type { Mode } from '../../../packages/shared/types.js';
import { AutoPolicyJobHunter } from './auto-policy.js';
import { acquireProfileLock } from './backend-lock.js';
import { developmentRuntime, type Runtime } from './runtime.js';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { companySelection } from './company-query.js';

export async function createApp(options: {
  dir: string;
  port: number;
  launchToken?: string;
  worker?: boolean;
  mode?: Mode;
  gmailOptions?: { gateway?: GmailGateway; accountInfo?: () => AccountInfo | null };
  researchOptions?: { runner?: StructuredRunner; reader?: SourceReader; clock?: () => Date };
  shutdown?: () => Promise<void>;
  runtime?: Runtime;
}) {
  const profileLock = acquireProfileLock(options.dir);
  let opened: Store | undefined;
  let browser: GmailJobHunter['browserDelivery'] | undefined;
  try {
    const app = Fastify({ logger: false, bodyLimit: 7 * 1024 * 1024, requestTimeout: 30000 });
    const store = new Store(options.dir);
    opened = store;
    store.assertExclusive = profileLock.assert;
    store.assertHealthy();
    const eventLoop = monitorEventLoopDelay({ resolution: 10 });
    eventLoop.enable();
    app.addHook('onClose', async () => eventLoop.disable());
    const measurements: Record<string, number | string | null>[] = [];
    const requestMetrics = new WeakMap<
      object,
      {
        started: number;
        sql: number;
        prepare: number;
        serialize?: number;
        handlerMs?: number;
        driverMs?: number;
        prepareMs?: number;
      }
    >();
    app.addHook('onRequest', async (request) => {
      if (['/api/companies', '/api/dashboard'].includes(request.url.split('?')[0]))
        requestMetrics.set(request, {
          started: performance.now(),
          sql: store.timings.sqlDriverMs,
          prepare: store.timings.prepareMs,
        });
    });
    app.addHook('preSerialization', async (request, _reply, payload) => {
      const m = requestMetrics.get(request);
      if (m) {
        m.serialize = performance.now();
        m.handlerMs = m.serialize - m.started;
        m.driverMs = store.timings.sqlDriverMs - m.sql;
        m.prepareMs = store.timings.prepareMs - m.prepare;
      }
      return payload;
    });
    app.addHook('onSend', async (request, _reply, payload) => {
      const m = requestMetrics.get(request);
      if (m?.serialize) {
        measurements.push({
          route: request.url.split('?')[0],
          at: new Date().toISOString(),
          sqlDriverMs: m.driverMs!,
          sqlPrepareMs: m.prepareMs!,
          materializationAndRulesMs: Math.max(0, m.handlerMs! - m.driverMs! - m.prepareMs!),
          serializationMs: performance.now() - m.serialize,
          eventLoopP99Ms: eventLoop.percentile(99) / 1e6,
          eventLoopMaxMs: eventLoop.max / 1e6,
          healthMs: store.healthStatus().elapsedMs,
        });
        if (measurements.length > 50) measurements.shift();
      }
      return payload;
    });
    const service =
      options.mode === 'AUTO_POLICY'
        ? new AutoPolicyJobHunter(store, {
            ...options.researchOptions,
            ...options.gmailOptions,
            runtime: options.runtime,
          })
        : options.mode === 'APPROVAL_REQUIRED'
          ? new GmailJobHunter(store, {
              ...options.researchOptions,
              ...options.gmailOptions,
              runtime: options.runtime,
            })
          : options.mode === 'RESEARCH_ONLY'
            ? new ResearchJobHunter(store, options.researchOptions)
            : new JobHunter(store);
    if (service instanceof GmailJobHunter) {
      browser = service.browserDelivery;
      if (
        service.sendTransport() === 'GMAIL_BROWSER' &&
        !service.fictionalProviders &&
        options.runtime?.kind === 'WORKSTATION'
      ) {
        options.runtime.assertNative();
        await browser.listen();
      }
    }
    const token = options.launchToken ?? randomBytes(32).toString('hex');
    const sessions = new Map<string, { csrf: string; expires: number }>();
    const allowedHost = `127.0.0.1:${options.port}`;
    const origin = `http://${allowedHost}`;
    await app.register(cookie);
    app.addHook('onRequest', async (request, reply) => {
      if (request.headers.host !== allowedHost)
        return reply.code(403).send({ code: 'INVALID_HOST', error: 'Niedozwolony Host.' });
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('Referrer-Policy', 'no-referrer');
      reply.header('X-Frame-Options', 'DENY');
      reply.header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      );
      if (!request.url.startsWith('/api/')) return;
      reply.header('Cache-Control', 'no-store');
      if (request.url === '/api/health' && request.method === 'GET') return;
      if (request.headers.origin && request.headers.origin !== origin)
        return reply
          .code(403)
          .send({ code: 'INVALID_ORIGIN', error: 'Żądanie pochodzi z obcej strony.' });
      if (request.headers['sec-fetch-site'] === 'cross-site')
        return reply
          .code(403)
          .send({ code: 'CROSS_SITE', error: 'Obca strona nie ma dostępu do aplikacji.' });
      if (!['GET', 'HEAD'].includes(request.method) && request.headers.origin !== origin)
        return reply.code(403).send({ code: 'ORIGIN_REQUIRED', error: 'Wymagany lokalny Origin.' });
      if (request.url === '/api/session' && request.method === 'POST') return;
      const session = sessions.get(request.cookies.jh_session ?? '');
      if (!session || session.expires < Date.now())
        return reply
          .code(401)
          .send({ code: 'SESSION_REQUIRED', error: 'Otwórz panel poleceniem npm run open.' });
      if (
        !['GET', 'HEAD'].includes(request.method) &&
        request.headers['x-csrf-token'] !== session.csrf
      )
        return reply.code(403).send({ code: 'CSRF_REQUIRED', error: 'Nieprawidłowy token CSRF.' });
    });
    app.setErrorHandler((error, request, reply) => {
      if (error instanceof z.ZodError)
        return reply.code(400).send({
          code: 'INVALID_INPUT',
          error: 'Nieprawidłowe dane formularza.',
          details: error.issues.map((x) => ({ path: x.path, message: x.message })),
        });
      if (error instanceof DomainError)
        return reply.code(error.status).send({ code: error.code, error: error.message });
      if ((error as any).statusCode === 400 || (error as any).statusCode === 413)
        return reply
          .code((error as any).statusCode)
          .send({ code: 'INVALID_REQUEST', error: 'Nieprawidłowe lub zbyt duże żądanie.' });
      console.error('JobHunter:', error instanceof Error ? error.message : 'internal error');
      return reply
        .code(500)
        .send({ code: 'INTERNAL_ERROR', error: 'Błąd aplikacji. Szczegóły w lokalnym logu.' });
    });
    app.get('/api/health', async () => ({ ok: true, mode: service.mode, instance: 'JobHunter' }));
    app.post('/api/session', async (request, reply) => {
      const v = z
        .object({ token: z.string().max(128) })
        .strict()
        .parse(request.body);
      const a = Buffer.from(hash(v.token));
      const b = Buffer.from(hash(token));
      if (!timingSafeEqual(a, b))
        return reply.code(403).send({
          code: 'INVALID_TOKEN',
          error: 'Link dostępu jest nieprawidłowy. Uruchom npm run open.',
        });
      if (sessions.size >= 100) sessions.clear();
      const key = randomBytes(32).toString('hex');
      const csrf = randomBytes(32).toString('hex');
      sessions.set(key, { csrf, expires: Date.now() + 12 * 3600000 });
      reply.setCookie('jh_session', key, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 12 * 3600,
      });
      return { csrf };
    });
    app.get('/api/session', async (request) => ({
      csrf: sessions.get(request.cookies.jh_session!)!.csrf,
    }));
    app.get('/api/dashboard', async () => {
      const dashboard = service.dashboard();
      dashboard.state.runtime = (options.runtime ?? developmentRuntime).kind;
      return dashboard;
    });
    app.get('/api/performance', async () => ({
      measurements,
      databaseHealth: store.healthStatus(),
    }));
    app.get('/api/profile', async () => service.profile());
    app.put('/api/profile', async (request) => {
      service.updateProfile(request.body);
      return service.profile();
    });
    app.post('/api/profile/approve', async () => {
      service.approveProfile();
      return service.profile();
    });
    app.post('/api/cv', async (request) => {
      const v = z
        .object({ fileName: z.string().min(1).max(200), base64: z.string().max(7 * 1024 * 1024) })
        .strict()
        .parse(request.body);
      return service.uploadCV(v.fileName, v.base64);
    });
    app.post<{ Params: { id: string } }>('/api/cv/:id/approve', async (request) => {
      service.approveCV(request.params.id);
      return { ok: true };
    });
    app.get<{ Params: { id: string } }>('/api/cv/:id/preview', async (request, reply) => {
      const { bytes } = service.cvBytes(request.params.id);
      return reply
        .type('application/pdf')
        .header('Content-Disposition', 'inline; filename="CV.pdf"')
        .send(bytes);
    });
    app.get('/api/companies', async (request, reply) => {
      const query = z
        .object({
          limit: z.coerce.number().int().min(1).max(200).default(100),
          offset: z.coerce.number().int().min(0).default(0),
          search: z.string().max(200).optional(),
          status: z.string().max(80).optional(),
          filter: z.string().max(80).optional(),
        })
        .strict()
        .parse(request.query);
      const selection = companySelection(query);
      reply.header(
        'X-Total-Count',
        store.one('SELECT count(*) n FROM companies c WHERE ' + selection.where, ...selection.args)!
          .n,
      );
      return service.companies(query);
    });
    app.get<{ Params: { id: string } }>('/api/companies/:id', async (request) => ({
      company: service.companies({ id: request.params.id, limit: 1 })[0],
      opportunities: store.all(
        'SELECT * FROM opportunities WHERE company_id=? ORDER BY updated_at DESC,id',
        request.params.id,
      ),
      aliases: store.all('SELECT * FROM company_aliases WHERE company_id=?', request.params.id),
      suppressions: store.all('SELECT * FROM suppressions WHERE company_id=?', request.params.id),
      evidence: store.all('SELECT * FROM evidence WHERE company_id=?', request.params.id),
    }));
    app.post('/api/history/preview', async (request) => {
      const v = z
        .object({ text: z.string().max(1024 * 1024) })
        .strict()
        .parse(request.body);
      return service.previewHistory(v.text);
    });
    app.post('/api/history/import', async (request) => {
      const v = z
        .object({ text: z.string().max(1024 * 1024), hash: z.string().length(64) })
        .strict()
        .parse(request.body);
      return service.importHistory(v.text, v.hash);
    });
    app.post('/api/history/review', async (request) => {
      const v = z
        .object({
          companyId: z.string(),
          status: z.enum([
            'NEW',
            'CONTACTED',
            'HISTORY_TO_VERIFY',
            'ACTIVE_CONVERSATION',
            'REJECTED',
          ]),
        })
        .strict()
        .parse(request.body);
      const c = store.one('SELECT * FROM companies WHERE id=?', v.companyId);
      if (!c) throw new DomainError('NOT_FOUND', 'Brak firmy.', 404);
      if (c.suppression_reason)
        throw new DomainError('SUPPRESSED', 'Blokady kontaktu pozostają aktywne.');
      store.atomic(() => {
        store.exec(
          'UPDATE companies SET history_status=?,version=version+1,updated_at=? WHERE id=?',
          v.status,
          service.now(),
          v.companyId,
        );
        if (['REJECTED', 'ACTIVE_CONVERSATION'].includes(v.status))
          service.suppress(c.id, v.status, 'Rozstrzygnięcie historii przez użytkownika.', 'user');
        service.event('HISTORY_REVIEWED', `${c.canonical_name}: ${v.status}`, c.id, 'user');
      });
      return { ok: true };
    });
    app.get('/api/drafts', async () => service.draftRows());
    app.get<{ Params: { id: string } }>('/api/drafts/:id/versions', async (request) =>
      store.all(
        'SELECT * FROM draft_versions WHERE draft_id=? ORDER BY version DESC',
        request.params.id,
      ),
    );
    app.post<{ Params: { id: string } }>('/api/research/drafts/:id/preview', async (request) => {
      if (service.mode === 'DEMO')
        throw new DomainError(
          'RESEARCH_MODE_REQUIRED',
          'Podgląd przygotowania dotyczy RESEARCH_ONLY.',
        );
      const input = z
        .object({ sender: z.email(), version: z.number().int().positive(), cvId: z.string() })
        .strict()
        .parse(request.body);
      const draft = service.draftRows().find((d) => d.id === request.params.id);
      if (!draft || draft.version !== input.version)
        throw new DomainError('VERSION_CONFLICT', 'Odśwież wersję wiadomości.');
      if (!service.profile().approved_at)
        throw new DomainError('PROFILE_NOT_APPROVED', 'Zatwierdź swoje materiały.');
      if (draft.profile_hash !== service.profile().profile_hash)
        throw new DomainError(
          'PROFILE_CHANGED',
          'Wiadomość powstała z innych materiałów. Odśwież jej treść.',
        );
      const { cv, bytes } = service.cvBytes(input.cvId);
      const message = await prepareMime({
        sender: input.sender,
        senderName: service.profile().name,
        recipient: draft.email,
        subject: draft.subject,
        body: draft.body,
        cv: { name: cv.file_name, bytes, sha256: cv.sha256, approved: !!cv.approved_at },
      });
      return {
        fileName: 'JobHunter-podglad.eml',
        base64: message.mime.toString('base64'),
        mimeHash: message.mimeHash,
        cvName: cv.file_name,
        cvHash: cv.sha256,
        recipient: draft.email,
        version: draft.version,
        sent: false,
      };
    });
    app.get('/api/research/gmail-preparation', async () => {
      if (service.mode === 'DEMO')
        throw new DomainError('RESEARCH_MODE_REQUIRED', 'Przygotowanie dotyczy RESEARCH_ONLY.');
      return {
        account: service instanceof GmailJobHunter ? service.deliveryState().account : null,
        sendingEnabled:
          service instanceof GmailJobHunter &&
          (service.fictionalProviders || service.runtime.kind === 'WORKSTATION'),
        runtime: (options.runtime ?? developmentRuntime).kind,
      };
    });
    const gmailService = (manual = false) => {
      if (manual && service.mode === 'AUTO_POLICY')
        throw new DomainError(
          'AUTO_POLICY_ONLY',
          'Ta ręczna operacja wymaga osobnego trybu APPROVAL_REQUIRED.',
        );
      if (!(service instanceof GmailJobHunter))
        throw new DomainError(
          'SEND_DISABLED',
          'Uruchom osobny tryb APPROVAL_REQUIRED. RESEARCH_ONLY i DEMO nie mają dostępu do Gmaila.',
        );
      return service;
    };
    const selectedDrafts = z
      .array(z.object({ id: z.string(), version: z.number().int().positive() }).strict())
      .min(1)
      .max(3);
    app.get('/api/gmail/state', async () => gmailService().deliveryState());
    app.post('/api/gmail/transport', async (request) =>
      gmailService().setSendTransport(request.body),
    );
    app.post('/api/gmail/quota/reset', async (request) =>
      gmailService(true).resetDailyQuota(
        z
          .object({
            confirmed: z.literal(true),
            day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            expectedTotalUsed: z.number().int().nonnegative(),
          })
          .strict()
          .parse(request.body),
      ),
    );
    app.post('/api/gmail/test-recipient', async (request) => {
      const input = z
        .object({ email: z.email(), confirmed: z.literal(true) })
        .strict()
        .parse(request.body);
      return gmailService(true).setTestRecipient(input.email);
    });
    app.post('/api/gmail/history', async (request) =>
      gmailService(true).checkHistory(
        z
          .object({ drafts: selectedDrafts, consent: z.literal(true) })
          .strict()
          .parse(request.body),
      ),
    );
    app.post('/api/gmail/preview', async (request) =>
      gmailService(true).prepareDelivery(
        z
          .object({
            drafts: selectedDrafts,
            cvId: z.string(),
            kind: z.enum(['FIRST_CONTACT', 'SELF_TEST']),
            diagnostic: z.boolean().optional(),
            textOnly: z.boolean().optional(),
          })
          .strict()
          .parse(request.body),
      ),
    );
    app.post('/api/gmail/approve', async (request) =>
      gmailService(true).approveDelivery(
        z
          .object({
            previewId: z.string(),
            previewHash: z.string().length(64),
            confirmed: z.literal(true),
          })
          .strict()
          .parse(request.body),
      ),
    );
    app.post<{ Params: { id: string } }>('/api/gmail/drafts/:id/verify', async (request) => {
      const v = z.object({ version: z.number().int().positive() }).strict().parse(request.body);
      return gmailService(true).verifyDraft(request.params.id, v.version);
    });
    app.post<{ Params: { id: string } }>('/api/gmail/outbox/:id/reconcile', async (request) => {
      z.object({ consent: z.literal(true) })
        .strict()
        .parse(request.body);
      gmailService().renewReadConsent(request.params.id);
      return gmailService().reconcile(request.params.id);
    });
    app.post<{ Params: { id: string } }>('/api/gmail/outbox/:id/replies', async (request) => {
      z.object({ consent: z.literal(true) })
        .strict()
        .parse(request.body);
      gmailService().renewReadConsent(request.params.id);
      return gmailService(true).syncReplies(request.params.id);
    });
    app.patch<{ Params: { id: string } }>('/api/drafts/:id', async (request) => {
      const v = z
        .object({
          version: z.number().int().positive(),
          subject: z.string().max(200),
          body: z.string().max(5000),
        })
        .strict()
        .parse(request.body);
      service.editDraft(request.params.id, v);
      return { ok: true };
    });
    app.post('/api/drafts/approve-batch', async (request) => {
      const v = z
        .object({
          drafts: z
            .array(z.object({ id: z.string(), version: z.number().int().positive() }).strict())
            .min(1)
            .max(20),
        })
        .strict()
        .parse(request.body);
      service.approveBatch(v.drafts);
      return { ok: true };
    });
    app.get('/api/outbox', async () => service.outboxRows());
    app.post<{ Params: { id: string } }>('/api/outbox/:id/reconcile', async (request) =>
      service.reconcile(request.params.id),
    );
    app.get('/api/replies', async () => service.replies());
    app.post<{ Params: { id: string } }>('/api/replies/:id/review', async (request) => {
      const v = z
        .object({ category: z.enum(replyCategories) })
        .strict()
        .parse(request.body);
      service.reviewReply(request.params.id, v.category);
      return { ok: true };
    });
    app.get('/api/campaign', async () => ({ ...service.campaign(), state: service.state() }));
    app.put('/api/campaign', async (request) => {
      service.updateCampaign(request.body);
      return service.campaign();
    });
    app.post('/api/campaign/renew', async () => {
      service.requireDemo();
      store.exec(
        "UPDATE campaigns SET expires_at=?,policy_version=policy_version+1 WHERE id='demo'",
        new Date(Date.now() + 7 * 86400000).toISOString(),
      );
      service.revokeApprovals('Odnowienie kampanii');
      service.event('CAMPAIGN_RENEWED', 'Użytkownik odnowił kampanię DEMO na 7 dni.', null, 'user');
      return { ok: true };
    });
    app.post('/api/campaign/start', async () => {
      await service.start();
      return { ok: true };
    });
    for (const action of ['pause', 'stop', 'emergency-stop', 'resume-sender'] as const)
      app.post(`/api/${action}`, async () => {
        service.control(action);
        return { ok: true };
      });
    app.post('/api/demo/scenario', async (request) => {
      service.requireDemo();
      const v = z
        .object({
          scenario: z.enum([
            'NORMAL',
            'TIMEOUT_AFTER_SEND',
            'FAIL_BEFORE_SEND',
            'PROVIDER_ONLY',
            'BOUNCE_REPLY',
          ]),
        })
        .strict()
        .parse(request.body);
      store.set('scenario', v.scenario);
      service.event('SCENARIO_CHANGED', `Scenariusz mock: ${v.scenario}`, null, 'user');
      return { ok: true };
    });
    app.get('/api/capabilities', async () =>
      service instanceof ResearchJobHunter
        ? {
            mode: service.mode,
            liveEnabled:
              service instanceof GmailJobHunter &&
              service.deliveryState().readReady &&
              service.deliveryState().sendReady,
            items: [
              {
                name: 'Codex runtime',
                ...service.capability('codexCapability'),
              },
              {
                name: 'Rzeczywiste wyszukiwanie',
                ...service.capability('searchCapability'),
              },
              {
                name: 'Import publicznego URL',
                available: true,
                configured: true,
                tested: !!store.get<any>('readerProbe', null)?.ok,
                status: store.get<any>('readerProbe', null)?.ok ? 'TESTED' : 'AVAILABLE_NOT_TESTED',
                detail:
                  'Bezpieczny odczyt stron; zapis źródeł przed analizą. To odrębne wejście od wyszukiwarki.',
              },
              {
                name: 'Gmail',
                available: service instanceof GmailJobHunter,
                configured: service instanceof GmailJobHunter && service.deliveryState().readReady,
                tested: false,
                status:
                  service instanceof AutoPolicyJobHunter
                    ? 'AUTO_POLICY'
                    : service instanceof GmailJobHunter
                      ? 'MANUAL_APPROVAL'
                      : 'BLOCKED',
                detail:
                  service instanceof AutoPolicyJobHunter
                    ? 'Zatwierdzona polityka i świadomy Start uprawniają zgodne pierwsze wiadomości. Konto, historia, materiały i wykonawca są sprawdzane przed każdą próbą.'
                    : service instanceof GmailJobHunter
                      ? 'Dokładny podgląd z CV, zgoda na konkretną wersję i celowany odczyt historii. Rzeczywista próba wymaga połączenia Google oraz Twojej akceptacji.'
                      : 'Brak transportu, odczytu poczty i zgód na wysyłkę w RESEARCH_ONLY.',
              },
              {
                name: 'Izolacja / AUTO_POLICY',
                available: service instanceof AutoPolicyJobHunter,
                configured: service instanceof AutoPolicyJobHunter && !!service.policyConfig(),
                tested: false,
                status:
                  service instanceof AutoPolicyJobHunter
                    ? 'EXPLICIT_START_REQUIRED'
                    : 'SEPARATE_MODE',
                detail:
                  'Runner researchu nie otrzymuje poczty ani sekretów. Browser to osobny wykonawca aktywnego zadania Codexa. Dostępność kodu nie potwierdza rzeczywistej integracji tej instalacji.',
              },
            ],
          }
        : {
            mode: 'DEMO',
            liveEnabled: false,
            items: [
              {
                name: 'SQLite i kolejka',
                available: true,
                configured: true,
                tested: true,
                status: 'READY',
                detail:
                  'Baza trwała, migracje, jeden worker i dispatcher; dane DEMO oddzielone od live.',
              },
              {
                name: 'Research DEMO',
                available: true,
                configured: true,
                tested: true,
                status: 'MOCK',
                detail: 'Fikcyjne źródła example.invalid. Bez pobierania stron.',
              },
              {
                name: 'Poczta DEMO',
                available: true,
                configured: true,
                tested: true,
                status: 'MOCK',
                detail: 'Lokalna symulacja przyjęcia, Wysłanych, timeoutu i odpowiedzi.',
              },
              {
                name: 'Codex runtime',
                available: null,
                configured: false,
                tested: false,
                status: 'UNCONFIGURED',
                detail:
                  'DEMO nie uruchamia modelu. Adapter i testy Codexa są dostępne w osobnym RESEARCH_ONLY.',
              },
              {
                name: 'Rzeczywiste wyszukiwanie',
                available: null,
                configured: false,
                tested: false,
                status: 'UNCONFIGURED',
                detail:
                  'DEMO używa fikcyjnych wyników. Rzeczywisty SearchProvider jest dostępny po udanym teście w RESEARCH_ONLY.',
              },
              {
                name: 'Gmail: odczyt',
                available: null,
                configured: false,
                tested: false,
                status: 'UNCONFIGURED',
                detail: 'OAuth i zakres historii wymagają konfiguracji w E4.',
              },
              {
                name: 'Gmail: wysyłka',
                available: null,
                configured: false,
                tested: false,
                status: 'BLOCKED',
                detail: 'Brak transportu live. Żadnych prawdziwych wiadomości w tej wersji.',
              },
              {
                name: 'Izolacja / AUTO_POLICY',
                available: null,
                configured: false,
                tested: false,
                status: 'BLOCKED',
                detail:
                  'Granice dostępu agenta runtime niezweryfikowane. Etap E5 pozostaje niedostępny.',
              },
              {
                name: 'Windows smoke test',
                available: null,
                configured: false,
                tested: false,
                status: 'NOT_TESTED',
                detail: 'Budowa i testy wykonane na macOS. Uruchom doctor.ps1 na Windowsie.',
              },
            ],
          },
    );
    const researchService = () => {
      if (!(service instanceof ResearchJobHunter))
        throw new DomainError(
          'RESEARCH_MODE_REQUIRED',
          'Uruchom aplikację jawnie w RESEARCH_ONLY.',
        );
      return service;
    };
    const autoService = () => {
      if (!(service instanceof AutoPolicyJobHunter))
        throw new DomainError('AUTO_MODE_REQUIRED', 'Uruchom osobny tryb AUTO_POLICY.');
      return service;
    };
    app.get('/api/auto/state', async () => autoService().dashboard().state.auto);
    app.post('/api/auto/policy', async (request) => autoService().configurePolicy(request.body));
    app.post('/api/auto/start', async () => {
      await autoService().startAuto();
      return { ok: true };
    });
    app.post('/api/auto/library-research', async (request) => {
      const v = z
        .object({
          query: z.string().min(10).max(3000).optional(),
          hours: z.number().int().min(1).max(24).default(8),
          resume: z.boolean().default(false),
        })
        .strict()
        .parse(request.body);
      await autoService().startLibraryResearch(v.query, v.hours, v.resume);
      return { ok: true };
    });
    app.get('/api/auto/batches', async () => autoService().batches());
    app.post('/api/auto/batches', async (request) => autoService().prepareBatch(request.body));
    app.get<{ Params: { id: string } }>('/api/auto/batches/:id', async (request) =>
      autoService().batchSummary(request.params.id),
    );
    app.post<{ Params: { id: string } }>('/api/auto/batches/:id/approve', async (request) =>
      autoService().approveClosedBatch(request.params.id, request.body),
    );
    app.post<{ Params: { id: string } }>('/api/auto/batches/:id/reprepare', async (request) =>
      autoService().reprepareBatch(request.params.id),
    );
    app.post<{ Params: { id: string } }>('/api/auto/batches/:id/start', async (request) => {
      await autoService().startBatch(request.params.id);
      return { ok: true };
    });
    app.get('/api/library/drafts', async (request) => {
      researchService();
      const v = z
        .object({
          offset: z.coerce.number().int().min(0).default(0),
          limit: z.coerce.number().int().min(1).max(100).default(50),
          search: z.string().max(200).default(''),
        })
        .strict()
        .parse(request.query);
      const search = `%${v.search}%`;
      const selected = store.all(
        `SELECT d.*,r.profile_hash,r.claims,r.warnings,r.semantic_review,c.canonical_name,t.email,m.code_status,m.review_status,m.updated_at checked_at FROM drafts d JOIN companies c ON c.id=d.company_id JOIN contacts t ON t.id=d.contact_id LEFT JOIN research_drafts r ON r.draft_id=d.id LEFT JOIN research_draft_materials m ON m.draft_id=d.id AND m.version=d.version WHERE c.canonical_name LIKE ? ORDER BY d.created_at DESC,d.id LIMIT ? OFFSET ?`,
        search,
        v.limit,
        v.offset,
      );
      return {
        items: selected.map((d) => {
          let issues: string[];
          try {
            issues = researchService().draftMaterialIssues(d);
            if (!d.code_status || !d.review_status) issues.push('DRAFT_MATERIAL_UNVERIFIED');
            const review = JSON.parse(d.semantic_review ?? 'null');
            if (review?.supported !== true || review.issues?.length)
              issues.push('SEMANTIC_REVIEW_REQUIRED');
          } catch {
            issues = ['DRAFT_MATERIAL_UNVERIFIED'];
          }
          return {
            id: d.id,
            company_id: d.company_id,
            version: d.version,
            subject: d.subject,
            status: d.status,
            canonical_name: d.canonical_name,
            email: d.email,
            code_status: d.code_status,
            review_status: d.review_status,
            checked_at: d.checked_at,
            material_issues: [...new Set(issues)],
            assessed_at: service.now(),
          };
        }),
        total: store.one(
          'SELECT count(*) n FROM drafts d JOIN companies c ON c.id=d.company_id WHERE c.canonical_name LIKE ?',
          search,
        )!.n,
        offset: v.offset,
        limit: v.limit,
      };
    });
    app.post('/api/library/refresh', async (request) =>
      researchService().refreshLibraryDrafts(request.body),
    );
    app.post('/api/research/reader-probe', async (request) => {
      const v = z
        .object({ urls: z.array(z.string().max(2000)).min(2).max(3).optional() })
        .strict()
        .parse(request.body ?? {});
      return researchService().probeReader(v.urls);
    });
    app.post('/api/auto/handoff', async () => autoService().handoff());
    app.post('/api/auto/history/prepare', async () => autoService().prepareHistory());
    app.post('/api/auto/history/local', async (request) =>
      autoService().configureLocalHistory(
        z
          .object({
            confirmedHistory: z.literal(true),
            confirmedSingleWorkstation: z.literal(true),
          })
          .strict()
          .parse(request.body),
      ),
    );
    app.post('/api/auto/history/configure', async (request) => {
      const input = z
        .object({
          directory: z.string().min(1).max(2000),
          expectedRemote: z.string().min(1).max(2000),
          confirmedPrivate: z.literal(true),
          confirmedInitialHistory: z.boolean().optional(),
        })
        .strict()
        .parse(request.body);
      const auto = autoService();
      if (!auto.state().stopped)
        throw new DomainError(
          'SESSION_ACTIVE',
          'Zatrzymaj sesję przed zmianą repozytorium historii.',
        );
      return auto.historySync.configure(input);
    });
    app.post<{ Params: { id: string } }>('/api/research/contacts/:id/review', async (request) => {
      const input = z.object({ confirmed: z.boolean() }).strict().parse(request.body);
      researchService().reviewContact(request.params.id, input.confirmed);
      return { ok: true };
    });
    app.post('/api/integrations/codex/probe', async () => researchService().probe('codex'));
    app.post('/api/integrations/search/probe', async () => researchService().probe('search'));
    app.post('/api/research/search', async (request) => {
      const v = z
        .object({ query: z.string().min(10).max(3000).optional() })
        .strict()
        .parse(request.body);
      await researchService().start(v.query);
      return { ok: true };
    });
    app.post('/api/research/day', async (request) => {
      const v = z
        .object({
          query: z.string().min(10).max(3000).optional(),
          hours: z.number().int().min(2).max(24).default(8),
        })
        .strict()
        .parse(request.body);
      await researchService().startDay(v.query, v.hours);
      return { ok: true };
    });
    app.post('/api/research/trial', async (request) => {
      const v = z
        .object({ query: z.string().min(10).max(3000).optional() })
        .strict()
        .parse(request.body);
      await researchService().startDay(v.query, 1);
      return { ok: true };
    });
    app.post('/api/research/resume-session', async () => {
      await researchService().resumeSession();
      return { ok: true };
    });
    app.post('/api/research/url', async (request) => {
      const v = z
        .object({ url: z.string().max(2000), contactUrl: z.string().max(2000).optional() })
        .strict()
        .parse(request.body);
      return researchService().importURL(v.url, v.contactUrl);
    });
    app.post('/api/research/retry', async (request) => {
      const v = z.object({ id: z.string() }).strict().parse(request.body);
      researchService().retryItem(v.id);
      return { ok: true };
    });
    app.post('/api/research/finish', async () => {
      researchService().finishPartial();
      return { ok: true };
    });
    app.get('/api/research/sources', async () => {
      researchService();
      return store.all('SELECT * FROM research_sources ORDER BY fetched_at DESC LIMIT 100');
    });
    app.get('/api/research/report', async () => researchService().researchReport());
    app.post<{ Params: { id: string } }>('/api/drafts/:id/review', async (request) => {
      const v = z.object({ version: z.number().int().positive() }).strict().parse(request.body);
      researchService().reviewDraft(request.params.id, v.version);
      return { ok: true };
    });
    app.post<{ Params: { id: string } }>('/api/research/drafts/:id/regenerate', async (request) => {
      const input = z.object({ version: z.number().int().positive() }).strict().parse(request.body);
      return researchService().regenerateDraft(request.params.id, input.version);
    });
    app.get('/api/runs', async () => store.all('SELECT * FROM runs ORDER BY started_at DESC'));
    app.get<{ Querystring: { format?: string } }>('/api/reports/export', async (request, reply) => {
      if (
        service.mode === 'RESEARCH_ONLY' &&
        ['txt', 'json'].includes(request.query.format ?? '')
      ) {
        const json = request.query.format === 'json';
        return reply
          .type(json ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8')
          .header(
            'Content-Disposition',
            `attachment; filename="JobHunter-research.${json ? 'json' : 'txt'}"`,
          )
          .send(json ? researchService().researchReport() : researchService().report('md'));
      }
      const format = request.query.format === 'csv' ? 'csv' : 'md';
      return reply
        .type(format === 'csv' ? 'text/csv; charset=utf-8' : 'text/markdown; charset=utf-8')
        .header(
          'Content-Disposition',
          `attachment; filename="JobHunter-${service.mode === 'DEMO' ? 'demo' : 'research-only'}-${service.dashboard().day}.${format}"`,
        )
        .send(service.report(format));
    });
    app.get('/api/reports', async () => ({
      markdown: service.report('md'),
      outbox: service.outboxRows(),
      runs: store.all('SELECT * FROM runs ORDER BY started_at DESC'),
    }));
    app.post('/api/shutdown', async () => {
      setTimeout(() => void options.shutdown?.(), 100);
      return { ok: true };
    });
    const webRoot = resolve('dist/web');
    if (existsSync(webRoot)) {
      await app.register(staticFiles, { root: webRoot });
      app.setNotFoundHandler(async (request, reply) =>
        request.url.startsWith('/api/')
          ? reply.code(404).send({ error: 'Nie ma takiej operacji.' })
          : reply.sendFile('index.html'),
      );
    } else
      app.get('/', async (_, reply) =>
        reply.type('text/plain').send('Najpierw wykonaj npm run build.'),
      );
    if (options.worker !== false) service.startWorker();
    app.addHook('onClose', async () => {
      if (service instanceof GmailJobHunter) await service.browserDelivery.close();
      await service.stopWorker();
      store.close();
      profileLock.release();
    });
    return { app, service, store, launchToken: token };
  } catch (error) {
    await browser?.close();
    opened?.close();
    profileLock.release();
    throw error;
  }
}
