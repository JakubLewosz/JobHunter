import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { Store } from './db.js';
import { JobHunter, replyCategories } from './service.js';
import { DomainError, hash, id } from './util.js';

export async function createApp(options: {
  dir: string;
  port: number;
  launchToken?: string;
  worker?: boolean;
  shutdown?: () => Promise<void>;
}) {
  const app = Fastify({ logger: false, bodyLimit: 7 * 1024 * 1024, requestTimeout: 30000 });
  const store = new Store(options.dir);
  const service = new JobHunter(store);
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
      return reply
        .code(400)
        .send({
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
  app.get('/api/health', async () => ({ ok: true, mode: 'DEMO', instance: 'JobHunter' }));
  app.post('/api/session', async (request, reply) => {
    const v = z
      .object({ token: z.string().max(128) })
      .strict()
      .parse(request.body);
    const a = Buffer.from(hash(v.token));
    const b = Buffer.from(hash(token));
    if (!timingSafeEqual(a, b))
      return reply
        .code(403)
        .send({
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
  app.get('/api/dashboard', async () => service.dashboard());
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
  app.get('/api/companies', async () => service.companies());
  app.get<{ Params: { id: string } }>('/api/companies/:id', async (request) => ({
    company: service.companies().find((c) => c.id === request.params.id),
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
  app.get('/api/capabilities', async () => ({
    mode: 'DEMO',
    liveEnabled: false,
    items: [
      {
        name: 'SQLite i kolejka',
        available: true,
        configured: true,
        tested: true,
        status: 'READY',
        detail: 'Baza trwała, migracje, jeden worker i dispatcher; dane DEMO oddzielone od live.',
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
          'CLI sprawdzono podczas budowy; brak testu strukturalnego wywołania modelu w runtime. Etap E3.',
      },
      {
        name: 'Rzeczywiste wyszukiwanie',
        available: null,
        configured: false,
        tested: false,
        status: 'UNCONFIGURED',
        detail: 'Brak skonfigurowanego SearchProvider. Tryb RESEARCH_ONLY zostanie dodany w E3.',
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
        detail: 'Granice dostępu agenta runtime niezweryfikowane. Etap E5 pozostaje niedostępny.',
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
  }));
  app.get('/api/runs', async () => store.all('SELECT * FROM runs ORDER BY started_at DESC'));
  app.get<{ Querystring: { format?: string } }>('/api/reports/export', async (request, reply) => {
    const format = request.query.format === 'csv' ? 'csv' : 'md';
    return reply
      .type(format === 'csv' ? 'text/csv; charset=utf-8' : 'text/markdown; charset=utf-8')
      .header(
        'Content-Disposition',
        `attachment; filename="JobHunter-demo-${service.dashboard().day}.${format}"`,
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
    await service.stopWorker();
    store.close();
  });
  return { app, service, store, launchToken: token };
}
