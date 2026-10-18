import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { hash } from '../apps/server/src/util.js';
import {
  researchReport,
  researchReportText,
  writeResearchReport,
} from '../apps/server/src/research/report.js';
import { PublicSourceReader, decodePage } from '../apps/server/src/research/fetcher.js';
import { Readable } from 'node:stream';
import { gzipSync } from 'node:zlib';
import { sessionQueries } from '../apps/server/src/research/session-plan.js';
import { normalizeQuery } from '../apps/server/src/research/query-planner.js';

class CompaniesReader extends FixtureReader {
  override async read(url: string, signal?: AbortSignal) {
    this.prospect = true;
    const s = await super.read(url, signal);
    const domain = new URL(url).hostname;
    s.text = s.text
      .replaceAll('Fixture Company', domain)
      .replaceAll('fixture.example.test', domain);
    s.text += `\nWyślij CV na hr@${domain}.`;
    s.text += '\nSenior Python. Rekrutacja otwarta.';
    s.title = domain;
    s.fragment = s.text;
    s.content_hash = hash(s.text);
    return s;
  }
}
class CompaniesRunner extends FixtureRunner {
  recruitment = new Set<string>();
  invalidIdentity = false;
  offerMismatch = false;
  override async run<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: { signal?: AbortSignal; search?: boolean },
  ) {
    this.prospect = true;
    const r = await super.run(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const sources = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
      const domain = new URL(sources[0].url).hostname;
      const a = r.value as any;
      a.company = domain;
      a.companyURL = `https://${domain}/`;
      a.companyProof.quote = domain;
      if (this.invalidIdentity) a.companyProof.quote = 'Identity absent from source';
      a.contact.email = `biuro@${domain}`;
      a.contact.proof.quote = `Kontakt: biuro@${domain}.`;
      if (this.offerMismatch) {
        a.companyActivities = [a.typeProof];
        a.type = 'ACTIVE';
        a.title = 'Senior Python';
        a.titleProof.quote = 'Senior Python';
        a.conditions.active = {
          ...a.titleProof,
          quote: 'Rekrutacja otwarta.',
          value: 'yes',
          scope: 'OFFER',
        };
        a.conditions.junior = { ...a.titleProof, value: 'no', scope: 'OFFER' };
      }
      if (this.recruitment.has(domain)) {
        a.type = 'OPEN';
        a.contact.kind = 'RECRUITMENT';
        a.contact.email = `hr@${domain}`;
        a.contact.proof.quote = `Wyślij CV na hr@${domain}.`;
        a.conditions.openInquiry = { ...a.contact.proof, value: 'yes', scope: 'COMPANY' };
      }
    } else if (this.offerMismatch && prompt.includes('Przygotuj indywidualny')) {
      const d = r.value as any;
      d.subject = 'Zapytanie o współpracę';
      d.body = d.body.replace(
        'na stronie znalazłem ofertę Junior PHP Laravel.',
        'na stronie opisują Państwo automatyzacje i integracje API.',
      );
      for (const c of d.claims)
        c.text = c.text.replace(
          'na stronie znalazłem ofertę Junior PHP Laravel.',
          'na stronie opisują Państwo automatyzacje i integracje API.',
        );
    }
    return r;
  }
}
function setup(t: TestContext, clock?: () => Date) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-night-'));
  const store = new Store(dir),
    reader = new CompaniesReader(),
    runner = new CompaniesRunner();
  const service = new ResearchJobHunter(store, { reader, runner, clock });
  service.approveProfile();
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { store, reader, runner, service };
}
test('long research expands unique regional directions using only approved project topics', () => {
  const first = sessionQueries(['Broad official companies'], 'Custom scope', [
    'autorelay',
    'elektroscan',
    'codefabric',
  ]);
  assert.equal(first.queries.length, 128);
  assert.equal(new Set(first.queries.map(normalizeQuery)).size, 128);
  assert.ok(first.queries.some((q) => q.includes('podlaskie')));
  assert.ok(first.queries.some((q) => q.includes('mazowieckie')));
  assert.ok(first.queries.every((q) => !q.includes('obsługa zgłoszeń')));
  for (const topic of ['webhooki', 'analiza obrazu', 'lokalne modele'])
    assert.ok(
      first.queries.slice(1, 16).some((q) => q.includes(topic)),
      'early cycles rotate approved projects',
    );
  const second = sessionQueries(
    ['Broad official companies'],
    'Custom scope',
    ['autorelay', 'elektroscan', 'codefabric'],
    first.cursor,
    64,
  );
  assert.equal(second.queries.length, 64);
  assert.equal(new Set([...first.queries, ...second.queries].map(normalizeQuery)).size, 192);
  const entire = sessionQueries(
    ['Broad official companies'],
    undefined,
    ['autorelay', 'elektroscan', 'codefabric'],
    0,
    10000,
  );
  assert.equal(entire.queries.length, 1537);
  assert.equal(new Set(entire.queries.map(normalizeQuery)).size, 1537);
});
test('15-hour research schedules 60 distinct cycles with five draft places and an immutable deadline', async (t) => {
  let time = Date.now();
  const f = setup(t, () => new Date(time));
  f.service.search = {
    async search() {
      return { urls: [], queries: ['offline search'] };
    },
  };
  await f.service.probe('search');
  await f.service.startDay('Fictional long research scope', 15);
  const initial = f.store.get<any>('researchDay', {});
  assert.equal(Date.parse(initial.expiresAt) - time, 15 * 3600000);
  assert.equal(initial.intervalMinutes, 15);
  assert.equal(initial.maxDraftsPerCycle, 5);
  assert.ok(initial.queries.length >= 60);
  for (let cycle = 0; cycle < 60; cycle++) {
    if (cycle) {
      time += 15 * 60000;
      await f.service.tick();
    }
    await f.service.tick();
    assert.equal(f.store.all('SELECT * FROM runs').length, cycle + 1);
    assert.equal(f.store.get<any>('researchDay', {}).expiresAt, initial.expiresAt);
    await f.service.tick();
    assert.equal(f.store.all('SELECT * FROM runs').length, cycle + 1);
  }
  assert.equal(
    new Set(
      f.store
        .all('SELECT search_input FROM research_run_config')
        .map((r) => normalizeQuery(r.search_input)),
    ).size,
    60,
  );
  assert.ok(
    f.store.all('SELECT max_drafts FROM research_run_config').every((r) => r.max_drafts === 5),
  );
  time = Date.parse(initial.expiresAt);
  await f.service.tick();
  assert.equal(f.store.get<any>('researchDay', {}).finalReason, 'DEADLINE');
  assert.equal(f.store.get<any>('researchDay', {}).active, false);
  assert.equal(f.service.state().stopped, true);
  assert.equal(f.service.mail.constructor.name, 'DisabledMailProvider');
  assert.equal(f.store.all('SELECT * FROM outbox').length, 0);
  assert.equal(f.store.all('SELECT * FROM send_attempts').length, 0);
  assert.equal(f.store.all('SELECT * FROM draft_approvals').length, 0);
  const reopened = new ResearchJobHunter(f.store, {
    reader: f.reader,
    runner: f.runner,
    clock: () => new Date(time),
  });
  await reopened.tick();
  assert.equal(f.store.all('SELECT * FROM runs').length, 60);
  assert.equal(reopened.state().stopped, true);
});
test('long session extends its saved plan instead of ending after its last prepared direction', async (t) => {
  let time = Date.now();
  const f = setup(t, () => new Date(time));
  f.service.search = {
    async search() {
      return { urls: [], queries: ['offline'] };
    },
  };
  await f.service.probe('search');
  await f.service.startDay(undefined, 15);
  await f.service.tick();
  const before = f.store.get<any>('researchDay', {});
  f.store.set('researchDay', { ...before, nextTopic: before.queries.length });
  time += 15 * 60000;
  await f.service.tick();
  const after = f.store.get<any>('researchDay', {});
  assert.equal(after.active, true);
  assert.equal(after.queries.length, before.queries.length + 64);
  assert.equal(after.queryCursor, before.queryCursor + 64);
  assert.equal(after.expiresAt, before.expiresAt);
  f.service.control('stop');
  const count = f.store.all('SELECT * FROM runs').length;
  time += 3600000;
  await f.service.tick();
  assert.equal(f.store.all('SELECT * FROM runs').length, count);
});
test('five-place long-session budget drains deferred drafts across cycles without duplicated companies', async (t) => {
  let time = Date.now();
  const f = setup(t, () => new Date(time));
  const originalCompanies = f.store.one('SELECT count(*) n FROM companies')!.n;
  for (let i = 0; i < 6; i++) {
    const queued = await f.service.importURL(`https://deferred-${i}.example.test/`);
    f.store.exec('UPDATE research_run_config SET max_drafts=0 WHERE run_id=?', queued.runId);
    await f.service.tick();
  }
  f.service.search = {
    async search() {
      return { urls: [], queries: ['offline'] };
    },
  };
  await f.service.probe('search');
  await f.service.startDay(undefined, 15);
  const work = f.store.get<any>('researchDay', {});
  assert.equal(
    f.store.one('SELECT count(*) n FROM research_items WHERE run_id=?', work.runIds[0])!.n,
    5,
  );
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 5);
  time += 15 * 60000;
  await f.service.tick();
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 6);
  assert.equal(f.store.one('SELECT count(*) n FROM companies')!.n, originalCompanies + 6);
  assert.equal(
    f.store.all('SELECT company_id FROM drafts GROUP BY company_id HAVING count(*)>1').length,
    0,
  );
  assert.equal(f.store.all('SELECT * FROM outbox').length, 0);
});
test('interrupted 15-hour session stays idle after restart and an explicit resume retains its deadline', async (t) => {
  let time = Date.now();
  const f = setup(t, () => new Date(time));
  f.service.search = {
    async search() {
      return { urls: [], queries: ['offline'] };
    },
  };
  await f.service.probe('search');
  await f.service.startDay(undefined, 15);
  await f.service.tick();
  const before = f.store.get<any>('researchDay', {});
  const reopened = new ResearchJobHunter(f.store, {
    reader: f.reader,
    runner: f.runner,
    clock: () => new Date(time),
  });
  time += 31 * 60000;
  await reopened.tick();
  assert.equal(f.store.get<any>('researchDay', {}).active, false);
  assert.equal(f.store.get<any>('researchDay', {}).finalReason, 'PROCESS_RESTART');
  assert.equal(f.store.all('SELECT * FROM runs').length, 1);
  await reopened.resumeSession();
  await reopened.tick();
  const after = f.store.get<any>('researchDay', {});
  assert.equal(after.expiresAt, before.expiresAt);
  assert.equal(after.maxDraftsPerCycle, 5);
  assert.equal(f.store.all('SELECT * FROM runs').length, 2);
  await reopened.tick();
  assert.equal(f.store.all('SELECT * FROM runs').length, 2);
  assert.equal(f.store.all('SELECT * FROM outbox').length, 0);
  reopened.control('stop');
});
test('invalid long research durations do not create or activate a session', async (t) => {
  const f = setup(t);
  await f.service.probe('search');
  for (const hours of [0, 25, 1.5, NaN])
    await assert.rejects(() => f.service.startDay(undefined, hours));
  assert.equal(f.store.all('SELECT * FROM runs').length, 0);
  assert.equal(f.store.get<any>('researchDay', {}).active, false);
});
test('cached analysis without a draft reaches generation in the next authorized cycle', async (t) => {
  const f = setup(t);
  const first = await f.service.importURL('https://one.example.test/');
  f.store.exec('UPDATE research_run_config SET max_drafts=0 WHERE run_id=?', first.runId);
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 0);
  const item = f.store.one('SELECT * FROM research_items')!;
  assert.equal(f.store.get<any>(`draftDisposition:${item.id}`, {}).reason, 'BUDGET_DEFERRED');
  const calls = f.runner.prompts.filter((p) => p.includes('Wydobądź firmę')).length;
  await f.service.importURL('https://one.example.test/');
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 1);
  assert.equal(f.runner.prompts.filter((p) => p.includes('Wydobądź firmę')).length, calls);
  assert.equal(f.store.get(`researchDeferred:${item.company_id}`, null), null);
  assert.deepEqual(f.service.draftMaterialIssues(f.service.draftRows()[0]), []);
  assert.equal(f.store.all('SELECT * FROM outbox').length, 0);
});
test('bounded batch prioritizes a literal recruitment channel over earlier general contacts', async (t) => {
  const f = setup(t);
  f.runner.recruitment.add('three.example.test');
  f.service.search = {
    async search() {
      return {
        urls: ['one', 'two', 'three'].map((n) => ({
          url: `https://${n}.example.test/`,
          contactUrl: null,
        })),
        queries: ['test'],
      };
    },
  };
  await f.service.probe('search');
  await f.service.start('Distinct bounded batch with three companies');
  f.store.exec('UPDATE research_run_config SET max_drafts=1');
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 1);
  assert.equal(f.service.draftRows()[0].canonical_name, 'three.example.test');
  assert.equal(
    f.store.all("SELECT value FROM app_state WHERE key LIKE 'researchDeferred:%' AND value<>'null'")
      .length,
    2,
  );
});
test('deferred analysis never bypasses a history block', async (t) => {
  const f = setup(t);
  const first = await f.service.importURL('https://one.example.test/');
  f.store.exec('UPDATE research_run_config SET max_drafts=0 WHERE run_id=?', first.runId);
  await f.service.tick();
  const item = f.store.one('SELECT * FROM research_items')!;
  f.store.exec("UPDATE companies SET history_status='CONTACTED' WHERE id=?", item.company_id);
  await f.service.importURL('https://one.example.test/');
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 0);
  assert.equal(f.store.get(`researchDeferred:${item.company_id}`, null), null);
  assert.equal(f.store.all('SELECT * FROM send_attempts').length, 0);
});
test('changed approved profile cannot reuse an old deferred extraction', async (t) => {
  const f = setup(t);
  const first = await f.service.importURL('https://one.example.test/');
  f.store.exec('UPDATE research_run_config SET max_drafts=0 WHERE run_id=?', first.runId);
  await f.service.tick();
  const p = f.service.profile();
  f.service.updateProfile({
    name: p.name,
    goal: p.goal + ' Nowy zakres.',
    hours_approx: 20,
    message_template: p.message_template,
    version: p.version,
    facts: p.facts.map((f) => ({ id: f.id, content: f.content })),
  });
  f.service.approveProfile();
  const calls = f.runner.prompts.filter((p) => p.includes('Wydobądź firmę')).length;
  await f.service.importURL('https://one.example.test/');
  await f.service.tick();
  assert.equal(f.runner.prompts.filter((p) => p.includes('Wydobądź firmę')).length, calls + 1);
  assert.equal(f.service.draftRows().length, 1);
});
test('authorized search carries deferred work even when search no longer returns the company', async (t) => {
  const f = setup(t);
  const first = await f.service.importURL('https://one.example.test/');
  f.store.exec('UPDATE research_run_config SET max_drafts=0 WHERE run_id=?', first.runId);
  await f.service.tick();
  f.service.search = {
    async search() {
      return { urls: [], queries: ['no new firms'] };
    },
  };
  await f.service.probe('search');
  await f.service.start('New explicit search also completes its saved research backlog');
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 1);
  assert.equal(f.store.all('SELECT * FROM outbox').length, 0);
});
test('deferred pre-identity item keeps one stable key and age until completed in a later empty-search cycle', async (t) => {
  const f = setup(t);
  const first = await f.service.importURL('https://one.example.test/');
  const original = f.store.one('SELECT * FROM research_items WHERE run_id=?', first.runId)!;
  const key = 'researchDeferred:' + original.id;
  const queuedAt = new Date(Date.now() - 3600000).toISOString();
  f.store.set(key, {
    itemId: original.id,
    companyId: null,
    queuedAt,
    attempts: 1,
    reason: 'TIME_BUDGET',
  });
  f.store.exec("UPDATE runs SET status='PARTIAL' WHERE id=?", first.runId);
  f.store.exec("UPDATE jobs SET status='DONE' WHERE run_id=?", first.runId);
  f.service.search = { search: async () => ({ urls: [], queries: ['fictional empty search'] }) };
  await f.service.probe('search');
  await f.service.start('Carry prior timed out pre-identity work');
  const resumed = f.store.one('SELECT * FROM research_items WHERE run_id<>?', first.runId)!;
  assert.equal(f.store.get(`researchDeferredKey:${resumed.id}`, null), key);
  assert.equal(f.store.get<any>(key, {}).queuedAt, queuedAt);
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 1);
  assert.equal(f.store.get(key, null), null);
  const outstanding = f.store
    .all("SELECT value FROM app_state WHERE key LIKE 'researchDeferred:%'")
    .map((r) => JSON.parse(r.value))
    .filter(Boolean);
  assert.equal(outstanding.length, 0);
});
test('eight-hour session survives the eighth cycle and finishes at its immutable deadline', async (t) => {
  let time = Date.now();
  const f = setup(t, () => new Date(time));
  await f.service.probe('search');
  await f.service.startDay();
  const work = f.store.get<any>('researchDay', {});
  f.store.exec("UPDATE runs SET status='COMPLETED'");
  f.store.exec("UPDATE jobs SET status='DONE'");
  f.store.set('researchDay', { ...work, cycles: 8, nextAt: work.expiresAt });
  time += 7 * 3600000 + 8 * 60000;
  await f.service.tick();
  assert.equal(f.store.get<any>('researchDay', {}).active, true);
  time = Date.parse(work.expiresAt);
  await f.service.tick();
  const final = f.store.get<any>('researchDay', {});
  assert.equal(final.active, false);
  assert.equal(final.finalReason, 'DEADLINE');
  assert.equal(final.expiresAt, work.expiresAt);
  const saved = f.store.get<any>('researchLastReport', {});
  assert.ok(existsSync(saved.backup));
  assert.equal(JSON.parse(readFileSync(saved.json, 'utf8')).session.finalReason, 'DEADLINE');
  const reopened = new ResearchJobHunter(f.store, {
    reader: f.reader,
    runner: f.runner,
    clock: () => new Date(time),
  });
  assert.equal(reopened.state().stopped, true);
  assert.equal(f.store.get<any>('researchLastReport', {}).json, saved.json);
  assert.equal(f.store.all('SELECT * FROM send_attempts').length, 0);
});
test('deadline during an operation stops the session and preserves its checkpoint', async (t) => {
  let time = Date.now();
  const f = setup(t, () => new Date(time));
  await f.service.probe('search');
  await f.service.startDay();
  const work = f.store.get<any>('researchDay', {});
  const abort = new AbortController(),
    timeout = AbortSignal.timeout;
  AbortSignal.timeout = () => abort.signal;
  t.after(() => {
    AbortSignal.timeout = timeout;
  });
  f.runner.beforeCall = async () => {
    time = Date.parse(work.expiresAt) + 1;
    abort.abort();
  };
  await f.service.tick();
  assert.equal(f.service.state().stopped, true);
  assert.equal(f.store.get<any>('researchDay', {}).finalReason, 'DEADLINE');
  assert.equal(f.store.one('SELECT status FROM runs')!.status, 'PAUSED');
  assert.equal(f.service.draftRows().length, 0);
});
test('oversize cooldown survives reopen, expires and never marks incomplete content READ', async (t) => {
  let time = Date.now();
  const f = setup(t, () => new Date(time));
  f.reader.read = async (url) => {
    f.reader.calls++;
    return {
      id: `failure-${f.reader.calls}`,
      original_url: url,
      final_url: null,
      title: '',
      fetched_at: new Date(time).toISOString(),
      method: 'TEST_FIXTURE',
      status: 'SIZE_LIMIT',
      http_status: null,
      fragment: '',
      content_hash: null,
      text: '',
      error: JSON.stringify({ category: 'LIMIT', code: 'SIZE_LIMIT', retryable: false }),
    };
  };
  await f.service.readSource('https://one.example.test/large');
  const reopened = new ResearchJobHunter(f.store, {
    reader: f.reader,
    runner: f.runner,
    clock: () => new Date(time),
  });
  assert.equal((await reopened.readSource('https://one.example.test/large')).status, 'SIZE_LIMIT');
  assert.equal(f.reader.calls, 1);
  time += 6 * 3600000 + 1;
  await reopened.readSource('https://one.example.test/large');
  assert.equal(f.reader.calls, 2);
  assert.equal(f.store.all("SELECT * FROM research_sources WHERE status='READ'").length, 0);
});
test('oversize transport records its exact limiter; compressed content remains bounded', async () => {
  const reader = new PublicSourceReader({
    maxBytes: 32,
    resolve: async () => [{ address: '93.184.216.34', family: 4 }] as any,
    transport: async () => ({ status: 200, contentType: 'text/html', body: 'x'.repeat(64) }),
  });
  const source = await reader.read('https://one.example.test/');
  assert.equal(source.status, 'SIZE_LIMIT');
  assert.equal(source.text, '');
  assert.deepEqual(JSON.parse(source.error!).size, {
    limiter: 'BODY',
    limitBytes: 32,
    wireBytes: 0,
    decodedBytes: 64,
  });
  const compressed = gzipSync('x'.repeat(10000));
  await assert.rejects(
    () => decodePage(Readable.from([compressed]), 'gzip', 100, new AbortController().signal),
    (e: any) =>
      e.code === 'SIZE_LIMIT' &&
      e.details.limiter === 'DECOMPRESSED' &&
      e.details.decodedBytes > 100,
  );
});
test('read-only report explains deferred drafts and groups item/source errors without touching history', async (t) => {
  const f = setup(t);
  const first = await f.service.importURL('https://one.example.test/');
  f.store.exec('UPDATE research_run_config SET max_drafts=0 WHERE run_id=?', first.runId);
  await f.service.tick();
  const before = JSON.stringify(f.store.all('SELECT * FROM app_state'));
  const report = researchReport(f.store);
  assert.equal(report.items[0].disposition.reason, 'BUDGET_DEFERRED');
  assert.equal(report.summary.httpRequests, null, 'fixture does not claim measured HTTP');
  assert.match(researchReportText(report), /BUDGET_DEFERRED/);
  assert.equal(JSON.stringify(f.store.all('SELECT * FROM app_state')), before);
  assert.throws(
    () => writeResearchReport(process.cwd(), report),
    (e: any) => e.code === 'PRIVATE_REPORT_PATH',
  );
});

test('report includes saved warnings and concrete contact reasons for its own exact drafts', async (t) => {
  const f = setup(t);
  const first = await f.service.importURL('https://one.example.test/');
  await f.service.tick();
  const firstItem = f.store.one('SELECT * FROM research_items WHERE run_id=?', first.runId)!;
  const firstDraft = f.store.one(
    'SELECT * FROM drafts WHERE opportunity_id=?',
    firstItem.opportunity_id,
  )!;
  const warning = 'Kontakt ogólny; nie potwierdzono przyjmowania CV pod tym adresem.';
  f.store.exec(
    'UPDATE research_drafts SET warnings=? WHERE draft_id=?',
    JSON.stringify([warning, warning]),
    firstDraft.id,
  );
  f.store.set(`researchContactIntent:${firstItem.id}`, {
    allowed: true,
    intent: 'COMPANY_INQUIRY',
    reason: 'Osobne zapytanie; warunki firmy pozostają niepotwierdzone.',
  });
  const second = await f.service.importURL('https://two.example.test/');
  await f.service.tick();
  const secondItem = f.store.one('SELECT * FROM research_items WHERE run_id=?', second.runId)!;
  const secondDraft = f.store.one(
    'SELECT * FROM drafts WHERE opportunity_id=?',
    secondItem.opportunity_id,
  )!;
  f.store.exec(
    'UPDATE research_drafts SET warnings=? WHERE draft_id=?',
    JSON.stringify(['UNRELATED_WARNING']),
    secondDraft.id,
  );
  const before = f.store.one('SELECT total_changes() n')!.n;
  const report = researchReport(f.store, f.service.now(), { runIds: [first.runId] });
  assert.equal(report.drafts.length, 1);
  assert.deepEqual(report.drafts[0].warnings, [warning]);
  const text = researchReportText(report);
  assert.match(text, /Osobne zapytanie; warunki firmy pozostają niepotwierdzone\./);
  assert.ok(text.includes(warning));
  assert.ok(text.includes(firstDraft.subject));
  assert.ok(text.includes(firstDraft.body));
  assert.doesNotMatch(text, /UNRELATED_WARNING/);
  assert.equal(f.store.one('SELECT total_changes() n')!.n, before);
});
test('identity rejection records the literal failure and completed PARTIAL has an end time', async (t) => {
  const f = setup(t);
  f.runner.invalidIdentity = true;
  f.service.search = {
    async search() {
      return { urls: [{ url: 'https://one.example.test/' }], queries: ['fixture'] };
    },
  };
  await f.service.probe('search');
  await f.service.startDay();
  await f.service.tick();
  const run = f.store.one('SELECT * FROM runs')!;
  assert.equal(run.status, 'PARTIAL');
  assert.ok(run.finished_at);
  const item = f.store.one('SELECT * FROM research_items')!;
  const failure = f.store.get<any>(`extractionFailure:${item.id}`, {});
  assert.equal(failure.validation, 'QUOTE_NOT_IN_SOURCE');
  assert.equal(failure.company, 'one.example.test');
  assert.ok(failure.contentHash);
  const report = f.service.researchReport();
  assert.equal(report.summary.modelErrors, 0);
  assert.equal(report.summary.errorCases, 1);
  assert.equal(report.errors[0].extraction?.validation, 'QUOTE_NOT_IN_SOURCE');
});
test('search novelty context includes researched NEW domains without changing contact history', async (t) => {
  const f = setup(t);
  await f.service.importURL('https://one.example.test/');
  await f.service.tick();
  let prompt = '';
  f.service.search = {
    async search(query) {
      prompt = query;
      return { urls: [], queries: ['fixture'] };
    },
  };
  await f.service.probe('search');
  await f.service.start('A distinct direction prefers firms not checked in the last day');
  await f.service.tick();
  assert.match(prompt, /Już sprawdzone domeny: one.example.test/);
  assert.equal(
    f.store.one("SELECT history_status FROM companies WHERE primary_domain='one.example.test'")!
      .history_status,
    'NEW',
  );
  assert.equal(f.store.all('SELECT * FROM history_records').length, 0);
});
test('a literal known contact page can identify the company when its main page is too large', async (t) => {
  const f = setup(t);
  const original = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    if (url.endsWith('/large')) {
      const source = await original(url, signal);
      return {
        ...source,
        text: '',
        content_hash: null,
        status: 'SIZE_LIMIT',
        error: JSON.stringify({ category: 'LIMIT', code: 'SIZE_LIMIT', retryable: false }),
      };
    }
    return original(url, signal);
  };
  await f.service.importURL('https://one.example.test/large', 'https://one.example.test/contact');
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 1);
  assert.deepEqual(f.service.draftMaterialIssues(f.service.draftRows()[0]), []);
  assert.equal(f.store.all('SELECT * FROM outbox').length, 0);
});
test('research preview preserves a mismatched ACTIVE offer while making only an independently proven company inquiry', async (t) => {
  const f = setup(t);
  f.runner.offerMismatch = true;
  await f.service.importURL('https://one.example.test/');
  await f.service.tick();
  const opportunity = f.store.one(
    "SELECT * FROM opportunities WHERE company_id IN (SELECT id FROM companies WHERE primary_domain='one.example.test')",
  )!;
  assert.equal(opportunity.type, 'ACTIVE');
  assert.equal(opportunity.junior, 'no');
  assert.equal(opportunity.decision, 'REJECTED');
  const draft = f.service.draftRows()[0];
  assert.ok(draft);
  assert.equal(
    f.store.one('SELECT kind FROM contacts WHERE id=?', draft.contact_id)!.kind,
    'GENERAL',
  );
  assert.deepEqual(f.service.draftMaterialIssues(draft), []);
  const item = f.store.one('SELECT id FROM research_items')!;
  const intent = f.store.get<any>(`researchContactIntent:${item.id}`, {});
  assert.equal(intent.intent, 'COMPANY_INQUIRY');
  assert.equal(intent.offerDecision, 'REJECTED');
  assert.equal(f.store.all('SELECT * FROM outbox').length, 0);
});
