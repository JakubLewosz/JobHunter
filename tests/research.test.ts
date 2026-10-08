import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import { Store } from '../apps/server/src/db.js';
import { JobHunter } from '../apps/server/src/service.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import {
  ExecCodexRunner,
  parseJSONL,
  execArguments,
  childEnvironment,
} from '../apps/server/src/research/codex.js';
import {
  PublicSourceReader,
  publicIP,
  publicURL,
  textFromHTML,
} from '../apps/server/src/research/fetcher.js';
import {
  validateAnalysis,
  qualifyReal,
  analysisSchema,
  type Analysis,
} from '../apps/server/src/research/contracts.js';
import { DomainError } from '../apps/server/src/util.js';
import { z } from 'zod';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-research-'));
  const store = new Store(dir);
  const runner = new FixtureRunner(),
    reader = new FixtureReader();
  const service = new ResearchJobHunter(store, { runner, reader });
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { dir, store, service, runner, reader };
}
async function prepare(t: TestContext) {
  const f = setup(t);
  f.service.approveProfile();
  await f.service.importURL('https://fixture.example.test/careers');
  await f.service.tick();
  return f;
}
test('E3: import bez profilu/logowania zapisuje stronę; zatwierdzenie konieczne do analizy', async (t) => {
  const { service, store, runner } = setup(t);
  await assert.rejects(() => service.start(), /zatwierdź profil/);
  const r = await service.importURL('https://fixture.example.test/careers');
  assert.equal(r.queued, false);
  assert.equal(store.all('SELECT * FROM research_sources').length, 1);
  assert.equal(runner.prompts.length, 0);
});
test('E3: oddzielne bazy, profil i historia; bezwzględna blokada wysyłki i symulacji', async (t) => {
  const { service, store, dir } = await prepare(t);
  assert.equal(service.dashboard().mode, 'RESEARCH_ONLY');
  assert.equal(service.draftRows().length, 1);
  const d = service.draftRows()[0];
  assert.throws(() => service.approveBatch([{ id: d.id, version: 1 }]), /RESEARCH_ONLY/);
  await assert.rejects(() => service.dispatchOne(), /RESEARCH_ONLY/);
  await assert.rejects(() => service.reconcile('fake'), /RESEARCH_ONLY/);
  assert.throws(() => service.createReply({}, 'fake'), /RESEARCH_ONLY/);
  assert.equal(service.dashboard().stats.sent, 0);
  assert.equal(store.all('SELECT * FROM draft_approvals').length, 0);
  assert.equal(store.all('SELECT * FROM mock_deliveries').length, 0);
  service.reviewDraft(d.id, 1);
  assert.equal(store.all('SELECT * FROM draft_approvals').length, 0);
  const demo = new Store(join(dir, 'demo'));
  t.after(() => demo.close());
  const demoService = new JobHunter(demo);
  assert.equal(demoService.profile().approved_at, null);
  assert.equal(demoService.draftRows().length, 0);
  assert.throws(() => new JobHunter(store), /innego trybu/);
});
test('E3: migruje rzeczywistą bazę E2 z zależnymi rekordami bez utraty danych', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-migration-'));
  const old = new Database(join(dir, 'jobhunter.sqlite'));
  old.exec('CREATE TABLE migrations(name TEXT PRIMARY KEY,applied_at TEXT NOT NULL)');
  for (const name of ['001_initial.sql', '002_history_records.sql']) {
    old.exec(readFileSync(join('migrations', name), 'utf8'));
    old.prepare('INSERT INTO migrations VALUES (?,?)').run(name, new Date().toISOString());
  }
  const legacy = Object.assign(Object.create(Store.prototype), { db: old, dir }) as Store;
  const service = new JobHunter(legacy);
  service.approveProfile();
  await service.start();
  await service.tick();
  const draft = service.draftRows()[0];
  service.approveBatch([{ id: draft.id, version: draft.version }]);
  await service.tick();
  const snapshot = [
    'campaigns',
    'companies',
    'evidence',
    'contacts',
    'opportunities',
    'drafts',
    'draft_versions',
    'draft_approvals',
    'runs',
    'jobs',
    'outbox',
    'send_attempts',
    'usage_ledger',
  ].map((name) => ({ name, rows: old.prepare(`SELECT * FROM ${name} ORDER BY id`).all() }));
  old.close();
  const upgraded = new Store(dir);
  t.after(() => {
    upgraded.close();
    rmSync(dir, { recursive: true });
  });
  for (const s of snapshot) {
    const rows = upgraded.all(`SELECT * FROM ${s.name} ORDER BY id`);
    if (s.name === 'outbox') {
      assert.ok(rows.every((r) => r.kind === 'FIRST_CONTACT'));
      assert.deepEqual(
        rows.map(({ kind, ...row }) => row),
        s.rows,
        s.name,
      );
    } else assert.deepEqual(rows, s.rows, s.name);
  }
  assert.deepEqual(upgraded.db.pragma('foreign_key_check'), []);
  assert.equal(upgraded.db.pragma('foreign_keys', { simple: true }), 1);
});
test('E3: SSRF IPv4/IPv6, porty, protokoły, dane logowania i DNS mixed', async () => {
  for (const url of [
    'http://127.0.0.1',
    'http://localhost',
    'http://2130706433',
    'http://[::1]',
    'http://[::ffff:127.0.0.1]',
    'http://192.168.0.1',
    'http://169.254.169.254',
    'http://100.64.0.1',
    'file:///etc/passwd',
    'https://public.test:8443',
    'https://u:p@public.test',
  ])
    assert.throws(() => publicURL(url), url);
  for (const ip of [
    '0.0.0.0',
    '224.1.1.1',
    '192.0.2.1',
    '198.18.1.1',
    '203.0.113.1',
    'fc00::1',
    'fe80::1',
    '2001:db8::1',
    '2001:0db8::1',
    '2001::1',
    '2001:0000::1',
    '2002:808:808::1',
  ])
    assert.equal(publicIP(ip), false, ip);
  assert.equal(publicIP('8.8.8.8'), true);
  assert.equal(publicIP('2606:4700:4700::1111'), true);
  let calls = 0;
  const reader = new PublicSourceReader({
    resolve: async () =>
      [
        { address: '8.8.8.8', family: 4 },
        { address: '10.0.0.1', family: 4 },
      ] as any,
    transport: async () => {
      calls++;
      return { status: 200, contentType: 'text/html', body: 'x' };
    },
  });
  assert.equal((await reader.read('https://public.test')).status, 'SSRF_BLOCKED');
  assert.equal(calls, 0);
});
test('E3: sprawdzony DNS jest przypięty, każdy redirect kontrolowany, limity i 429', async () => {
  let resolutions = 0,
    calls = 0;
  const reader = new PublicSourceReader({
    resolve: async () => {
      resolutions++;
      return [{ address: resolutions === 1 ? '8.8.8.8' : '127.0.0.1', family: 4 }] as any;
    },
    transport: async (_url, address) => {
      calls++;
      assert.equal(address, '8.8.8.8');
      return { status: 302, location: 'https://other.test/' };
    },
  });
  assert.equal((await reader.read('https://public.test')).status, 'SSRF_BLOCKED');
  assert.equal(calls, 1);
  const privateRedirect = new PublicSourceReader({
    resolve: async () => [{ address: '8.8.8.8', family: 4 }] as any,
    transport: async () => ({ status: 302, location: 'http://[::1]/secret' }),
  });
  assert.equal((await privateRedirect.read('https://public.test')).status, 'SSRF_BLOCKED');
  const loop = new PublicSourceReader({
    maxRedirects: 1,
    resolve: async () => [{ address: '8.8.8.8', family: 4 }] as any,
    transport: async () => ({ status: 302, location: '/loop' }),
  });
  assert.equal((await loop.read('https://public.test')).status, 'REDIRECT_LIMIT');
  let rateCalls = 0;
  const rate = new PublicSourceReader({
    resolve: async () => [{ address: '8.8.8.8', family: 4 }] as any,
    transport: async () => {
      rateCalls++;
      return { status: 429, retryAfter: '60' };
    },
  });
  await rate.read('https://public.test');
  await rate.read('https://public.test');
  assert.equal(rateCalls, 1);
  const timeout = new PublicSourceReader({
    timeoutMs: 10,
    resolve: async () => new Promise(() => {}),
  });
  assert.equal((await timeout.read('https://public.test')).status, 'TIMEOUT');
  assert.equal(textFromHTML('<script>steal()</script><style>abc</style><p>A &amp; B</p>'), 'A & B');
});
test('E3: niepotwierdzone cytaty i zmyślone kontakty nie stają się VERIFIED', async (t) => {
  const { service, runner, reader } = setup(t);
  const source = await reader.read('https://fixture.example.test');
  const a = (
    await runner.run(
      'Wydobądź firmę Dane: ' +
        JSON.stringify([{ id: source.id, url: source.final_url, text: source.text }]),
      analysisSchema,
    )
  ).value;
  a.contact.email = 'guessed@fixture.example.test';
  a.conditions.hours.quote = 'Dowolne godziny całodobowo';
  const result = validateAnalysis(a, [source]);
  assert.equal(result.contact.email, null);
  assert.equal(result.conditions.hours.value, 'unknown');
  assert.equal(qualifyReal(result).decision, 'NEEDS_REVIEW');
  a.companyProof.quote = 'Invented Company';
  assert.throws(() => validateAnalysis(a, [source]));
  assert.equal(service.draftRows().length, 0);
});
test('E3: unknown i archived nie są aktywnymi dopasowanymi ofertami', async (t) => {
  const { runner, reader } = setup(t);
  const source = await reader.read('https://fixture.example.test');
  const a = (
    await runner.run(
      'Wydobądź firmę Dane: ' +
        JSON.stringify([{ id: source.id, url: source.final_url, text: source.text }]),
      analysisSchema,
    )
  ).value;
  a.conditions.hours.value = 'unknown';
  assert.equal(qualifyReal(a).decision, 'NEEDS_REVIEW');
  a.type = 'ARCHIVED';
  assert.equal(qualifyReal(a).decision, 'REJECTED');
});
test('szeroki research: firma bez wakatu, nieznane warunki i publiczny kontakt ogólny pozwalają na szkic zapytania', async (t) => {
  const { service, store, runner, reader } = setup(t);
  runner.prospect = reader.prospect = true;
  service.approveProfile();
  await service.importURL('https://fixture.example.test');
  await service.tick();
  const opportunity = store.one('SELECT * FROM opportunities')!;
  assert.equal(opportunity.type, 'PROSPECT');
  assert.equal(opportunity.decision, 'NEEDS_REVIEW');
  assert.equal(opportunity.remote, 'unknown');
  assert.equal(store.one('SELECT * FROM contacts')!.kind, 'GENERAL');
  const draft = service.draftRows()[0];
  assert.equal(draft.email, 'biuro@fixture.example.test');
  assert.match(draft.body, /automatyzacje i integracje API/);
  assert.doesNotMatch(draft.body, /znalazłem ofertę/);
  assert.match(draft.warnings, /rekrutacja i warunki niepotwierdzone/);
  assert.equal(store.all('SELECT * FROM send_attempts').length, 0);
  assert.equal(store.all('SELECT * FROM draft_approvals').length, 0);
});
test('szeroki research: kontakt sprzedaży i niepotwierdzony adres nadal blokują szkic', async (t) => {
  for (const kind of ['SALES', 'INVENTED']) {
    const { service, runner, reader } = setup(t);
    runner.prospect = reader.prospect = true;
    const original = runner.run.bind(runner);
    runner.run = async (prompt, schema, options) => {
      const result = await original(prompt, schema, options);
      if (prompt.includes('Wydobądź firmę')) {
        const analysis = result.value as Analysis;
        if (kind === 'SALES') analysis.contact.kind = 'SALES';
        else analysis.contact.email = 'invented@fixture.example.test';
      }
      return result;
    };
    service.approveProfile();
    await service.importURL('https://fixture.example.test');
    await service.tick();
    assert.equal(service.draftRows().length, 0);
  }
});
test('E3: deduplikacja firm/ofert/kontaktów; nowa oferta tej samej firmy bez nowego szkicu', async (t) => {
  const { service, store } = await prepare(t);
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  assert.equal(store.all('SELECT * FROM opportunities').length, 1);
  assert.equal(service.draftRows().length, 1);
  await service.importURL('https://fixture.example.test/two');
  await service.tick();
  assert.equal(store.all('SELECT * FROM opportunities').length, 2);
  assert.equal(store.all('SELECT * FROM contacts').length, 1);
  assert.equal(service.draftRows().length, 1);
});
test('E3: Fingoweb i HISTORY_TO_VERIFY blokują szkic', async (t) => {
  const { service, store } = setup(t);
  assert.equal(
    service.companies().find((c) => c.canonical_name === 'Fingoweb')!.suppression_reason,
    'RECRUITMENT_ON_HOLD',
  );
  assert.equal(
    service.companies().find((c) => c.canonical_name === 'Iyuno')!.history_status,
    'HISTORY_TO_VERIFY',
  );
  service.findOrCreateCompany('Fixture Company', 'fixture.example.test', 'HISTORY_TO_VERIFY');
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  assert.equal(service.draftRows().length, 0);
  assert.equal(store.all('SELECT * FROM opportunities').length, 1);
});
test('E3: zmieniony zatwierdzony profil generuje nową treść, zachowuje wersje i nie wysyła CV', async (t) => {
  const { service, runner } = await prepare(t);
  const p = service.profile();
  service.updateProfile({
    ...Object.fromEntries(
      ['name', 'goal', 'hours_min', 'hours_max', 'version'].map((k) => [k, p[k]]),
    ),
    name: 'Fikcyjny Kandydat',
    hours_min: 17,
    hours_max: 18,
    facts: p.facts.map((f) => ({
      id: f.id,
      content:
        f.fact_key === 'identity'
          ? 'Fikcyjny Kandydat'
          : f.fact_key === 'availability'
            ? 'Płatna praca w pełni zdalna, 17–18 godzin tygodniowo po lekcjach.'
            : f.content,
    })),
  });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/two');
  await service.tick();
  assert.match(service.draftRows()[0].body, /Fikcyjny Kandydat/);
  assert.match(service.draftRows()[0].body, /17–18/);
  assert.equal(service.draftRows()[0].version, 2);
  assert.ok(
    !runner.prompts.some(
      (p) => p.includes('sqlite') || p.includes('base64') || p.includes('auth.json'),
    ),
  );
});
test('E3: prompt injection nie zmienia uprawnień ani odbiorcy; ścisłe schematy', async (t) => {
  const { service, runner } = await prepare(t);
  assert.equal(service.draftRows()[0].email, 'hr@fixture.example.test');
  assert.ok(runner.prompts.some((p) => p.includes('NIEUFNYMI DANYMI')));
  const args = execArguments('/tmp/schema.json', true);
  assert.ok(!args.includes('danger-full-access'));
  assert.ok(!args.includes('resume'));
  assert.ok(args.includes('shell_tool'));
  assert.ok(args.includes('--ignore-user-config'));
  process.env.OPENAI_API_KEY = 'fictional-secret';
  assert.equal(childEnvironment().OPENAI_API_KEY, undefined);
  delete process.env.OPENAI_API_KEY;
});
test('E3: kontrolowana pauza i restart wznawiają trwały etap bez duplikatów', async (t) => {
  const { service, store, runner, reader } = setup(t);
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  runner.beforeCall = async (prompt) => {
    if (prompt.includes('Przygotuj indywidualny')) service.control('pause');
  };
  await service.tick();
  assert.equal(store.all('SELECT * FROM opportunities').length, 1);
  assert.equal(service.draftRows().length, 0);
  runner.beforeCall = undefined;
  const resumed = new ResearchJobHunter(store, { runner, reader });
  await resumed.start();
  await resumed.tick();
  assert.equal(store.all('SELECT * FROM opportunities').length, 1);
  assert.equal(resumed.draftRows().length, 1);
  assert.equal(reader.calls, 1);
});
test('E3: limit/login zatrzymuje etap; czas obejmuje model i nie oznacza COMPLETED', async (t) => {
  const { service, store, runner } = setup(t);
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  runner.beforeCall = async () => {
    throw new DomainError('CODEX_LIMIT', 'limit');
  };
  await service.tick();
  assert.equal(store.one('SELECT * FROM runs')!.status, 'PAUSED');
  assert.equal(store.one('SELECT * FROM runs')!.error, 'CODEX_LIMIT');
  assert.equal(service.draftRows().length, 0);
});
test('E3: JSONL oddziela końcowy JSON, wykrywa błędy i obce narzędzia', () => {
  const stream = [
    { type: 'item.completed', item: { type: 'agent_message', text: 'progress' } },
    { type: 'item.completed', item: { type: 'web_search' } },
    { type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } },
    { type: 'turn.completed', usage: { input_tokens: 10, output_tokens: 3 } },
  ]
    .map((x) => JSON.stringify(x))
    .join('\n');
  assert.deepEqual(parseJSONL(stream).value, { ok: true });
  assert.equal(parseJSONL(stream).meta.webSearches, 1);
  assert.throws(() => parseJSONL('{'));
  assert.throws(() => parseJSONL(stream.replace('{\\"ok\\":true}', '{')));
  assert.throws(
    () =>
      parseJSONL(
        JSON.stringify({ type: 'turn.failed', error: { message: 'usage limit reached' } }),
      ),
    /Limit Codexa/,
  );
  assert.throws(
    () =>
      parseJSONL(JSON.stringify({ type: 'item.completed', item: { type: 'command_execution' } })),
    /niedozwolone narzędzie/,
  );
});
test('E3: brak CLI bez mock fallbacku', async () => {
  await assert.rejects(
    () => new ExecCodexRunner({ binary: join(tmpdir(), 'missing-jh-cli') }).inspect(),
    /Nie można uruchomić/,
  );
});

test('E3: realny proces adaptera — brak logowania, timeout, limit, uszkodzony JSON i schema', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-cli-fixture-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const stub = join(dir, 'cli.mjs');
  for (const mode of ['login', 'timeout', 'limit', 'badjson', 'schema', 'ok', 'output']) {
    writeFileSync(
      stub,
      `const a=process.argv.slice(2); if(a.includes('--version'))console.log('codex-cli fixture'); else if(a[0]==='login'){${mode === 'login' ? "console.error('Not logged in');process.exitCode=1;" : "console.log('Logged in using ChatGPT');"}} else if(a.includes('--help'))console.log('--ignore-user-config --ignore-rules --output-schema --ephemeral --json --strict-config'); else { let input='';process.stdin.on('data',c=>input+=c);process.stdin.on('end',()=>{${mode === 'timeout' ? 'setTimeout(()=>{},10000);' : mode === 'limit' ? "console.error('usage limit reached');process.exitCode=1;" : mode === 'output' ? "console.log('x'.repeat(20000));" : `console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:${JSON.stringify(mode === 'badjson' ? '{' : mode === 'schema' ? '{"ok":"wrong"}' : '{"ok":true}')}}}));console.log(JSON.stringify({type:'turn.completed'}));`}});}`,
    );
    const runner = new ExecCodexRunner({
      binary: process.execPath,
      prefix: [stub],
      timeoutMs: mode === 'timeout' ? 20 : 2000,
      maxOutputBytes: 10000,
    });
    if (mode === 'ok')
      assert.deepEqual(
        (await runner.run('fictional fixture', z.object({ ok: z.boolean() }).strict())).value,
        { ok: true },
      );
    else
      await assert.rejects(
        () => runner.run('fictional fixture', z.object({ ok: z.boolean() }).strict()),
        (e: any) =>
          e.code ===
          (
            {
              login: 'CODEX_LOGIN',
              timeout: 'CODEX_TIMEOUT',
              limit: 'CODEX_LIMIT',
              badjson: 'CODEX_JSON',
              schema: 'CODEX_SCHEMA',
              output: 'CODEX_OUTPUT_LIMIT',
            } as any
          )[mode],
      );
  }
});
test('E3: gzip/brotli i limity po dekompresji — rzeczywiste strumienie offline', async () => {
  const { Readable } = await import('node:stream');
  const { gzipSync, brotliCompressSync } = await import('node:zlib');
  const { decodePage } = await import('../apps/server/src/research/fetcher.js');
  assert.equal(
    await decodePage(
      Readable.from([gzipSync('polski tekst ąę')]),
      'gzip',
      1000,
      AbortSignal.timeout(1000),
    ),
    'polski tekst ąę',
  );
  await assert.rejects(
    () =>
      decodePage(
        Readable.from([brotliCompressSync('a'.repeat(10000))]),
        'br',
        100,
        AbortSignal.timeout(1000),
      ),
    /Limit treści/,
  );
  await assert.rejects(
    () => decodePage(Readable.from([Buffer.alloc(200)]), undefined, 100, AbortSignal.timeout(1000)),
    /Limit pobierania/,
  );
});
test('DEMO: reconcile i wykres liczą tę samą jedną próbę bez drugiego send', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-reconcile-chart-'));
  const store = new Store(dir);
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true });
  });
  const service = new JobHunter(store);
  service.approveProfile();
  await service.start();
  await service.tick();
  const d = service.draftRows()[0];
  store.set('scenario', 'TIMEOUT_AFTER_SEND');
  service.approveBatch([{ id: d.id, version: d.version }]);
  await service.tick();
  assert.equal(service.dashboard().stats.sent, 0);
  await service.reconcile(service.outboxRows()[0].id);
  const dash = service.dashboard();
  assert.equal(dash.stats.sent, 1);
  assert.equal(dash.daily.find((r) => r.day === dash.day)!.sent, 1);
  assert.equal(store.one('SELECT count(*) n FROM mock_deliveries')!.n, 1);
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 1);
});

test('E3: pola godzin i fakt availability muszą być zgodne, bez generowania sprzecznych deklaracji', (t) => {
  const { service } = setup(t);
  const p = service.profile();
  service.updateProfile({
    name: p.name,
    goal: p.goal,
    hours_min: 10,
    hours_max: 12,
    version: p.version,
    facts: p.facts.map((f) => ({ id: f.id, content: f.content })),
  });
  service.approveProfile();
  assert.throws(() => service.minimalProfile(), /Godziny w polach/);
});
test('E3: po zmianie profilu wznowienie ponownie interpretuje wymagania, zachowując źródło', async (t) => {
  const { service, runner, store, reader } = setup(t);
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  runner.beforeCall = async (prompt) => {
    if (prompt.includes('Przygotuj indywidualny')) service.control('pause');
  };
  await service.tick();
  const p = service.profile();
  service.updateProfile({
    name: 'Fikcyjny Kandydat',
    goal: p.goal,
    hours_min: 17,
    hours_max: 18,
    version: p.version,
    facts: p.facts.map((f) => ({
      id: f.id,
      content:
        f.fact_key === 'availability'
          ? 'Płatna praca zdalna 17–18 godzin po lekcjach.'
          : f.fact_key === 'identity'
            ? 'Fikcyjny Kandydat'
            : f.content,
    })),
  });
  service.approveProfile();
  runner.beforeCall = undefined;
  await service.start();
  await service.tick();
  assert.match(service.draftRows()[0].body, /Fikcyjny Kandydat/);
  assert.equal(runner.prompts.filter((p) => p.includes('Wydobądź firmę')).length, 2);
  assert.equal(reader.calls, 1);
  assert.equal(store.all('SELECT * FROM opportunities').length, 1);
});
test('E3: przestarzały test konfiguracji nie jest prezentowany jako READY', async (t) => {
  const { service, store } = setup(t);
  store.set('searchCapability', { tested: true, status: 'READY', configurationHash: 'old' });
  assert.equal(service.capability('searchCapability').tested, false);
  service.approveProfile();
  await assert.rejects(() => service.start(), /Najpierw użyj/);
});

test('E3: alias domeny nie omija blokady Fingoweb dla nowej oferty', async (t) => {
  const { service, runner, reader } = setup(t);
  service.findOrCreateCompany('Inna Firma', 'fixture.example.test');
  const originalRead = reader.read.bind(reader);
  reader.read = async (url, signal) => {
    const source = await originalRead(url, signal);
    source.text += ' Fingoweb sp zoo.';
    return source;
  };
  const originalRun = runner.run.bind(runner);
  runner.run = async (prompt, schema, options) => {
    const result = await originalRun(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const a = result.value as any;
      a.company = 'Fingoweb sp zoo';
      a.companyProof.quote = 'Fingoweb sp zoo';
    }
    return result;
  };
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const firm = service
    .companies()
    .find((c) => c.canonical_name === 'Fingoweb' && c.opportunity_id)!;
  assert.equal(firm.suppression_reason, 'RECRUITMENT_ON_HOLD');
  assert.equal(service.draftRows().length, 0);
});

test('research: około 20 godzin nie przekazuje modelowi minimum/maksimum; jeden trafny projekt i wspólny wzór', async (t) => {
  const { service, runner } = await prepare(t);
  const p = service.minimalProfile();
  assert.equal(p.availabilityMode, 'APPROX');
  assert.equal(p.hoursApprox, 20);
  assert.equal(p.hoursMin, null);
  assert.equal(p.hoursMax, null);
  assert.match(service.draftRows()[0].body, /około 20 godzin/);
  assert.match(service.draftRows()[0].body, /FixDesk/);
  assert.doesNotMatch(service.draftRows()[0].body, /AutoRelay|CodeFabric|ElektroScan/);
  const prompt = runner.prompts.find((p) => p.includes('Przygotuj indywidualny'))!;
  assert.ok(prompt.includes(JSON.stringify(service.profile().message_template)));
  assert.ok(prompt.includes('JEDEN'));
  assert.ok(!prompt.includes('"key":"autorelay"'));
});
test('research: edytowany wzór i orientacyjna dostępność są zapisywane i wymagają ponownego zatwierdzenia', async (t) => {
  const { service } = setup(t);
  service.approveProfile();
  const p = service.profile();
  const template = p.message_template + '\nDodatkowe pytanie o sposób współpracy.';
  service.updateProfile({
    name: p.name,
    goal: p.goal,
    hours_approx: 22,
    message_template: template,
    version: p.version,
    facts: p.facts.map((f) => ({ id: f.id, content: f.content })),
  });
  assert.equal(service.profile().approved_at, null);
  assert.equal(service.profile().hours_approx, 22);
  assert.equal(service.profile().message_template, template);
  assert.match(
    service.profile().facts.find((f) => f.fact_key === 'availability')!.content,
    /około 22/,
  );
  service.approveProfile();
  assert.notEqual(service.profile().profile_hash, p.profile_hash);
  assert.equal(service.minimalProfile().hoursMax, null);
});
test('research: deklaracja maksimum lub kilku projektów nie przechodzi kontroli wzoru', async (t) => {
  const { service } = await prepare(t);
  const d = service.draftRows()[0];
  const base = {
    subject: d.subject,
    body: d.body,
    factIds: JSON.parse(d.fact_ids),
    evidenceIds: JSON.parse(d.evidence_ids),
    claims: JSON.parse(d.claims),
    warnings: [],
  };
  const evidence = service.store.all('SELECT * FROM evidence WHERE company_id=?', d.company_id);
  assert.throws(
    () =>
      service.checkDraft(
        { ...base, body: d.body + ' Maksymalnie 20 godzin tygodniowo.' },
        d.company_id,
        service.minimalProfile(),
        evidence,
      ),
    /Godziny/,
  );
  assert.throws(
    () =>
      service.checkDraft(
        { ...base, body: d.body + ' AutoRelay: drugi projekt.' },
        d.company_id,
        service.minimalProfile(),
        evidence,
      ),
    /więcej niż jeden/,
  );
});
test('research: brak dowodu dopasowania projektu pozwala na szkic bez projektu i nie dopisuje nauki', async (t) => {
  const { service, runner, reader } = setup(t);
  runner.prospect = reader.prospect = true;
  const original = runner.run.bind(runner);
  runner.run = async (prompt, schema, options) => {
    const result = await original(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const value = result.value as Analysis;
      value.title = 'Fixture Company';
      value.titleProof = value.companyProof;
      value.requirements = [];
    }
    return result;
  };
  service.approveProfile();
  await service.importURL('https://fixture.example.test');
  await service.tick();
  const draft = service.draftRows()[0];
  assert.ok(draft);
  assert.doesNotMatch(draft.body, /FixDesk|AutoRelay|CodeFabric|ElektroScan/);
  const prompt = runner.prompts.find((p) => p.includes('Przygotuj indywidualny'))!;
  assert.match(prompt, /150–220/);
  assert.match(prompt, /AI\/Codex są opcjonalnym narzędziem pracy/);
  assert.doesNotMatch(prompt, /"key":"autorelay"/);
  assert.match(prompt, /Fakty nadal pochodzą tylko z profile.facts/);
});
test('generator: niepewny lub negatywny review zachowuje szkic NEEDS_REVIEW z problemami zamiast odrzucenia', async (t) => {
  for (const supported of [null, false]) {
    const { service, runner, store } = setup(t);
    service.approveProfile();
    const original = runner.run.bind(runner);
    runner.run = async (prompt, schema, options) =>
      prompt.includes('Sprawdź KAŻDE')
        ? {
            value: schema.parse({
              supported,
              issues: ['Nie mam pewności co do znaczenia deklaracji.'],
            }),
            meta: { elapsedMs: 1 },
          }
        : original(prompt, schema, options);
    await service.importURL('https://fixture.example.test');
    await service.tick();
    const d = service.draftRows()[0];
    assert.ok(d);
    assert.equal(d.status, 'NEEDS_REVIEW');
    assert.equal(JSON.parse(d.semantic_review).supported, supported);
    assert.match(d.warnings, /Nie mam pewności/);
    assert.equal(store.one('SELECT * FROM research_items')!.status, 'DONE');
    assert.equal(store.all('SELECT * FROM draft_approvals').length, 0);
  }
});
test('generator: poprawny faktami lecz stylistycznie słaby szkic zostaje NEEDS_REVIEW z ostrzeżeniem', async (t) => {
  const { service, runner } = setup(t);
  service.approveProfile();
  const original = runner.run.bind(runner);
  runner.run = async (prompt, schema, options) => {
    const result = await original(prompt, schema, options);
    if (prompt.includes('Przygotuj indywidualny'))
      (result.value as any).body += ' To konkretny punkt wspólny między projektem a ofertą.';
    return result;
  };
  await service.importURL('https://fixture.example.test');
  await service.tick();
  const d = service.draftRows()[0];
  assert.ok(d);
  assert.equal(d.status, 'NEEDS_REVIEW');
  assert.match(d.warnings, /META/);
});
test('generator: ponowna generacja dopisuje wersję i zachowuje wcześniejszą historię', async (t) => {
  const { service, store } = await prepare(t);
  const first = service.draftRows()[0];
  const before = store.all('SELECT * FROM draft_versions WHERE draft_id=?', first.id);
  service.regenerateDraft(first.id, first.version);
  await service.tick();
  const next = service.draftRows()[0];
  assert.equal(next.version, first.version + 1);
  assert.deepEqual(
    store.all(
      'SELECT * FROM draft_versions WHERE draft_id=? AND version=?',
      first.id,
      first.version,
    ),
    before,
  );
  assert.equal(store.all('SELECT * FROM draft_versions WHERE draft_id=?', first.id).length, 2);
  assert.equal(next.reviewed_at, null);
  assert.equal(store.all('SELECT * FROM send_attempts').length, 0);
});
test('generator: edycja podczas ponownej generacji nie jest nadpisywana', async (t) => {
  const { service, runner, store } = await prepare(t);
  const first = service.draftRows()[0];
  service.regenerateDraft(first.id, first.version);
  runner.beforeCall = async (prompt) => {
    if (prompt.includes('Przygotuj indywidualny')) {
      runner.beforeCall = undefined;
      service.editDraft(first.id, {
        version: first.version,
        subject: 'Ręczna edycja',
        body: 'Treść zapisana przez fikcyjnego użytkownika w trakcie generacji.',
      });
    }
  };
  await service.tick();
  assert.equal(service.draftRows()[0].subject, 'Ręczna edycja');
  assert.equal(
    store.one("SELECT error FROM research_items WHERE status='ERROR'")!.error,
    'VERSION_CONFLICT',
  );
});

test('personal day: kolejne kierunki, brak lawiny zaległych cykli i ograniczenie do 8 godzin', async (t) => {
  const { service, store } = setup(t);
  service.approveProfile();
  await service.probe('search');
  await service.startDay();
  await service.tick();
  assert.equal(store.all('SELECT * FROM runs').length, 1);
  assert.equal(service.draftRows().length, 1);
  await service.tick();
  assert.equal(store.all('SELECT * FROM runs').length, 1);
  const work = store.get<any>('researchDay', {});
  store.set('researchDay', { ...work, nextAt: new Date(Date.now() - 4 * 3600000).toISOString() });
  await service.tick();
  assert.equal(store.all('SELECT * FROM runs').length, 2);
  await service.tick();
  assert.equal(store.all('SELECT * FROM runs').length, 2);
  assert.equal(service.draftRows().length, 1);
  store.set('researchDay', {
    ...store.get<any>('researchDay', {}),
    expiresAt: new Date(Date.now() - 1).toISOString(),
  });
  await service.tick();
  assert.equal(store.get<any>('researchDay', {}).active, false);
  assert.equal(service.state().status, 'DAY_FINISHED');
});
test('personal day: pauza/restart i limit Codexa zatrzymują kontynuację bez poczty', async (t) => {
  const { service, store, runner, reader } = setup(t);
  service.approveProfile();
  await service.probe('search');
  await service.startDay();
  service.control('pause');
  assert.equal(store.get<any>('researchDay', {}).active, false);
  const reopened = new ResearchJobHunter(store, { runner, reader });
  assert.equal(reopened.state().paused, true);
  assert.equal(store.get<any>('researchDay', {}).active, false);
  await reopened.startDay();
  runner.beforeCall = async () => {
    throw new DomainError('CODEX_LIMIT', 'Limit Codexa');
  };
  await reopened.tick();
  assert.equal(store.get<any>('researchDay', {}).active, false);
  assert.equal(store.one('SELECT * FROM runs')!.status, 'PAUSED');
  assert.equal(store.all('SELECT * FROM send_attempts').length, 0);
});
test('personal day: błędny kandydat zapisany jako PARTIAL pozwala kontynuować inne kierunki', async (t) => {
  const { service, store, runner } = setup(t);
  service.approveProfile();
  await service.probe('search');
  await service.startDay();
  runner.beforeCall = async (prompt) => {
    if (prompt.includes('Wydobądź'))
      throw new DomainError('UNVERIFIED_QUOTE', 'Niepotwierdzony cytat');
  };
  await service.tick();
  assert.equal(store.one('SELECT * FROM runs')!.status, 'PARTIAL');
  assert.equal(service.state().paused, false);
  assert.equal(store.get<any>('researchDay', {}).active, true);
  runner.beforeCall = undefined;
  store.set('researchDay', {
    ...store.get<any>('researchDay', {}),
    nextAt: new Date(Date.now() - 1).toISOString(),
  });
  await service.tick();
  assert.equal(store.all('SELECT * FROM runs').length, 2);
});

test('godzinny test: kierunki co 10 minut, maksymalnie 10 kandydatów łącznie i automatyczny stop', async (t) => {
  const { service, store } = setup(t);
  service.approveProfile();
  await service.probe('search');
  let cycle = 0;
  service.search.search = async () => ({
    queries: ['fictional trial search'],
    urls: Array.from({ length: 4 }, (_, index) => ({
      url: `https://fixture.example.test/trial-${cycle}-${index}`,
      contactUrl: null,
    })),
  });
  const before = Date.now();
  await service.startDay(undefined, 1);
  let work = store.get<any>('researchDay', {});
  assert.ok(new Date(work.expiresAt).getTime() - before >= 3600000);
  assert.ok(new Date(work.expiresAt).getTime() - before < 3601000);
  assert.ok(new Date(work.nextAt).getTime() - before >= 600000);
  for (; cycle < 5; cycle++) {
    if (cycle > 0) {
      work = store.get<any>('researchDay', {});
      store.set('researchDay', { ...work, nextAt: new Date(Date.now() - 1).toISOString() });
      await service.tick();
    }
    await service.tick();
    assert.equal(store.all('SELECT * FROM research_items').length, (cycle + 1) * 2);
    await service.tick();
  }
  assert.equal(store.all('SELECT * FROM research_items').length, 10);
  assert.equal(store.all('SELECT * FROM runs').length, 5);
  assert.equal(store.get<any>('researchDay', {}).active, false);
  assert.equal(service.state().status, 'TRIAL_FINISHED');
  assert.equal(store.all('SELECT * FROM send_attempts').length, 0);
  assert.equal(store.all('SELECT * FROM draft_approvals').length, 0);
});

test('godzinny test: deadline zatrzymuje dalsze kierunki, wcześniejszy szkic zużywa wspólny limit', async (t) => {
  const { service, store } = setup(t);
  service.approveProfile();
  await service.probe('search');
  await service.startDay(undefined, 1);
  await service.tick();
  assert.equal(service.draftRows().length, 1);
  store.set('researchDay', {
    ...store.get<any>('researchDay', {}),
    nextAt: new Date(Date.now() - 1).toISOString(),
  });
  await service.tick();
  assert.equal(
    store.one(
      "SELECT max_drafts FROM research_run_config WHERE run_id=(SELECT id FROM runs WHERE status='QUEUED')",
    )!.max_drafts,
    2,
  );
  await service.tick();
  store.set('researchDay', {
    ...store.get<any>('researchDay', {}),
    expiresAt: new Date(Date.now() - 1).toISOString(),
  });
  await service.tick();
  assert.equal(service.state().status, 'TRIAL_FINISHED');
  assert.equal(store.get<any>('researchDay', {}).active, false);
  assert.equal(store.all('SELECT * FROM runs').length, 2);
});

test('szeroki research: wznowienie po restarcie zachowuje termin i budżet godzinnego testu', async (t) => {
  const { service, store, runner, reader } = setup(t);
  service.approveProfile();
  await service.probe('search');
  await service.startDay(undefined, 1);
  await service.tick();
  const before = store.get<any>('researchDay', {});
  const reopened = new ResearchJobHunter(store, { runner, reader });
  assert.equal(store.get<any>('researchDay', {}).active, false);
  await reopened.resumeSession();
  const resumed = store.get<any>('researchDay', {});
  assert.equal(resumed.active, true);
  assert.equal(resumed.expiresAt, before.expiresAt);
  assert.equal(resumed.nextAt, before.nextAt);
  assert.equal(resumed.cycles, before.cycles);
  assert.deepEqual(resumed.runIds, before.runIds);
  assert.match(resumed.queries[0], /SaaS/);
  assert.match(resumed.queries[0], /automatyzacje/);
  assert.match(resumed.queries[0], /bez ogłoszonego wakatu/);
  store.set('researchDay', {
    ...resumed,
    active: false,
    expiresAt: new Date(Date.now() - 1).toISOString(),
  });
  await assert.rejects(() => reopened.resumeSession(), /Czas tej sesji już minął/);
  assert.equal(store.get<any>('researchDay', {}).active, false);
  assert.equal(service.draftRows().length, 1);
});
