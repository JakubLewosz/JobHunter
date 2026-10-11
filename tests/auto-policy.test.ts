import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../apps/server/src/db.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';
import { exportHistory, importHistory, HistorySync } from '../apps/server/src/history-sync.js';
import { FixtureGmail } from './gmail-fixture.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { z } from 'zod';
import { hash, DomainError } from '../apps/server/src/util.js';
class ManyReader extends FixtureReader {
  override async read(url: string, signal?: AbortSignal) {
    const source = await super.read(url, signal),
      n = new URL(url).hostname.match(/fixture(\d+)/)?.[1];
    source.text = source.text
      .replaceAll('Fixture Company', `Fixture Company ${n}`)
      .replaceAll('fixture.example.test', `fixture${n}.example.test`);
    source.fragment = source.text;
    source.content_hash = hash(source.text + url);
    return source;
  }
}
class ManyRunner extends FixtureRunner {
  override async run<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: { signal?: AbortSignal; search?: boolean },
  ) {
    const result = await super.run(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const sources = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6)),
        n = new URL(sources[0].url).hostname.match(/fixture(\d+)/)[1];
      const v = result.value as any;
      v.company = `Fixture Company ${n}`;
      v.companyURL = `https://fixture${n}.example.test`;
      v.companyProof.quote = v.company;
      v.contact.email = `hr@fixture${n}.example.test`;
      v.contact.proof.quote = `Rekrutacja: hr@fixture${n}.example.test.`;
      result.value = schema.parse(v);
    }
    return result;
  }
}
class SplitContactRunner extends FixtureRunner {
  override async run<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: { signal?: AbortSignal; search?: boolean },
  ) {
    const result = await super.run(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const sources = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
      (result.value as any).contact.proof.sourceId = sources[1].id;
    }
    return result;
  }
}

function git(dir: string, ...args: string[]) {
  return execFileSync('git', ['-C', dir, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
async function setup(t: TestContext, prospect = false, many = false, split = false) {
  const root = mkdtempSync(join(tmpdir(), 'jh-auto-')),
    dir = join(root, 'data'),
    repo = join(root, 'history'),
    remote = join(root, 'remote.git');
  execFileSync('git', ['init', '--bare', remote], { stdio: 'ignore', windowsHide: true });
  execFileSync('git', ['clone', remote, repo], { stdio: 'ignore', windowsHide: true });
  git(repo, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  const store = new Store(dir),
    gateway = new FixtureGmail(),
    runner = many ? new ManyRunner() : split ? new SplitContactRunner() : new FixtureRunner(),
    reader = many ? new ManyReader() : new FixtureReader();
  let time = Date.now();
  runner.prospect = reader.prospect = prospect;
  const search = many
    ? {
        search: async () => ({
          urls: Array.from({ length: 5 }, (_, i) => ({
            url: `https://fixture${i + 1}.example.test/careers`,
            contactUrl: null,
          })),
          queries: ['fictional companies'],
        }),
      }
    : split
      ? {
          search: async () => ({
            urls: [
              {
                url: 'https://fixture.example.test/careers',
                contactUrl: 'https://fixture.example.test/contact',
              },
            ],
            queries: ['fictional split contact'],
          }),
        }
      : undefined;
  const options = {
    gateway,
    accountInfo: () => gateway.info,
    runner,
    reader,
    search,
    clock: () => new Date(time),
  };
  const service = new AutoPolicyJobHunter(store, options);
  const extraStores: Store[] = [];
  t.after(async () => {
    await service.stopWorker();
    for (const s of extraStores) s.close();
    store.close();
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  service.approveProfile();
  const cv = service.uploadCV(
    'Fixture.pdf',
    Buffer.from('%PDF-1.4\nfictional\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  const policy = {
    senderEmail: gateway.info.email,
    cvId: cv.id,
    contactKinds: ['RECRUITMENT', 'GENERAL'],
    contactTypes: ['ACTIVE', 'OPEN', 'PROSPECT'],
    searchScope: 'Firmy działające w Polsce, web, SaaS, integracje i automatyzacje',
    sessionLimit: null,
    dailyLimit: null,
    sendIntervalSeconds: 60,
    researchIntervalSeconds: 60,
    confirmed: true,
    targetedHistoryConsent: true,
  };
  service.configurePolicy(policy);
  service.historySync.configure({
    directory: repo,
    expectedRemote: remote,
    confirmedPrivate: true,
    confirmedInitialHistory: true,
  });
  await service.probe('codex');
  await service.probe('search');
  return {
    root,
    dir,
    repo,
    remote,
    store,
    service,
    gateway,
    runner,
    reader,
    cv,
    policy,
    options,
    extraStores,
    advance: (n = 61000) => {
      time += n;
    },
  };
}
async function send(t: TestContext, prospect = false) {
  const f = await setup(t, prospect);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  return f;
}
test('AUTO: full fictional search/read/draft/send needs only policy and Start', async (t) => {
  const f = await send(t);
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.dashboard().stats.sent, 1);
  assert.equal(f.store.one('SELECT actor FROM draft_approvals')?.actor, 'policy');
  assert.equal(f.store.one('SELECT reviewed_at FROM research_drafts')?.reviewed_at, null);
  assert.equal(f.service.dashboard().state.auto.session.status, 'RUNNING');
  f.advance();
  await f.service.tick();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.ok(
    f.runner.prompts.some(
      (p) => p.includes('AutoRelay') && p.includes('Aktualny zatwierdzony cel'),
    ),
  );
});
test('AUTO: GENERAL keeps its purpose, unknown hours and a question; SALES is skipped', async (t) => {
  const f = await send(t, true);
  assert.equal(f.gateway.posts.length, 1);
  const contact = f.store.one('SELECT * FROM contacts')!;
  assert.equal(contact.kind, 'GENERAL');
  assert.equal(contact.verification_status, 'NEEDS_REVIEW');
  const analysis = JSON.parse(f.store.one('SELECT details FROM research_qualifications')!.details);
  assert.equal(analysis.conditions.hours.value, 'unknown');
  assert.match(f.service.draftRows()[0].body, /Czy/);
  const g = await setup(t, true);
  g.store.set('autoPolicy', { ...g.service.policyConfig(), contactKinds: ['RECRUITMENT'] });
  await g.service.startAuto();
  await g.service.tick();
  g.advance();
  await g.service.dispatchOne();
  assert.equal(g.gateway.posts.length, 0);
  assert.equal(g.service.dashboard().stats.skipped, 1);
});
test('AUTO: manual GENERAL review verifies exact proof without relabeling', async (t) => {
  const f = await setup(t, true);
  await f.service.startAuto();
  await f.service.tick();
  const c = f.store.one('SELECT * FROM contacts')!;
  f.service.reviewContact(c.id, true);
  assert.equal(f.store.one('SELECT kind FROM contacts')?.kind, 'GENERAL');
  assert.equal(
    f.store.one('SELECT verification_status FROM contacts')?.verification_status,
    'VERIFIED_PUBLIC',
  );
  f.store.exec("UPDATE contacts SET literal_verified=0,verification_status='INVALIDATED'");
  assert.throws(() => f.service.reviewContact(c.id, true));
});
test('AUTO: separate company and contact pages both participate in sender verification', async (t) => {
  const f = await setup(t, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.store.all('SELECT * FROM research_sources').length, 2);
});
test('AUTO: Codex quota saves progress and waits for explicit resume', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  let calls = 0;
  f.runner.beforeCall = async () => {
    calls++;
    throw new DomainError('CODEX_LIMIT', 'fictional quota');
  };
  await f.service.tick();
  f.advance();
  await f.service.tick();
  await f.service.dispatchOne();
  assert.equal(calls, 1);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.service.state().status, 'CODEX_LIMIT');
  assert.ok(f.store.one("SELECT id FROM runs WHERE status='PAUSED'"));
});
test('AUTO: unverified purpose after migration is checked from literal sources', async (t) => {
  const f = await setup(t, true);
  await f.service.startAuto();
  await f.service.tick();
  f.store.exec('UPDATE contacts SET literal_verified=0');
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.store.one('SELECT kind FROM contacts')?.kind, 'GENERAL');
  assert.equal(
    f.store.one('SELECT verification_status FROM contacts')?.verification_status,
    'NEEDS_REVIEW',
  );
});
test('AUTO: semantic review uncertainty is skipped and does not authorize a send', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  f.store.exec(
    'UPDATE research_drafts SET semantic_review=?',
    JSON.stringify({ supported: null, issues: ['fictional uncertainty'] }),
  );
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.service.dashboard().stats.skipped, 1);
  assert.equal(f.service.state().paused, false);
});
test('AUTO: invalid public recipient evidence is blocked before private history reads', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  f.store.exec("UPDATE contacts SET email='unpublished@example.test'");
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.gateway.historyQueries.length, 0);
});
test('history: a confirmed domain is retained for an existing name and after import', async (t) => {
  const f = await setup(t),
    known = f.service.findOrCreateCompany('Known Company', null).company;
  const csv =
    'company,status,domain,email,date\nKnown Company,CONTACTED,known.example.test,old@known.example.test,2026-10-01';
  const preview = f.service.previewHistory(csv);
  f.service.importHistory(csv, preview.hash);
  const alias = f.service.findOrCreateCompany(
    'Known Company sp. z o.o.',
    'known.example.test',
  ).company;
  assert.equal(alias.id, known.id);
  assert.equal(alias.history_status, 'CONTACTED');
  const second = new Store(join(f.root, 'import-data'));
  f.extraStores.push(second);
  const target = new AutoPolicyJobHunter(second, f.options);
  target.findOrCreateCompany('Known Company', null);
  importHistory(second, exportHistory(f.store));
  assert.equal(
    second.one("SELECT primary_domain FROM companies WHERE canonical_name='Known Company'")
      ?.primary_domain,
    'known.example.test',
  );
});
test('AUTO: Pause and Stop during research cancel work and revoke sends', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  let release!: () => void, entered!: () => void;
  const waiting = new Promise<void>((r) => {
    entered = r;
  });
  f.runner.beforeCall = async () => {
    entered();
    await new Promise<void>((r) => {
      release = r;
    });
  };
  const research = f.service.tick();
  await waiting;
  f.service.control('pause');
  assert.equal(f.service.state().paused, true);
  release();
  await research;
  assert.equal(f.gateway.posts.length, 0);
  f.runner.beforeCall = undefined;
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  f.gateway.beforePost = async () => {
    f.service.control('stop');
  };
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.service.dashboard().state.auto.session, null);
});
test('AUTO: a long pause cancels only queued policy packets and resume prepares a fresh one', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  const marker = f.gateway.marker;
  let markers = 0;
  f.gateway.marker = async () => {
    if (++markers === 3) f.service.control('pause');
    return marker();
  };
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.service.outboxRows()[0].status, 'CANCELLED');
  f.advance(3600000);
  await f.service.startAuto();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.state().paused, false);
  assert.equal(f.service.outboxRows().length, 2);
});
test('AUTO: possible acceptance timeout has one POST; restart cannot authorize a resend', async (t) => {
  const f = await setup(t);
  f.gateway.timeout = true;
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.outboxRows()[0].status, 'SEND_UNKNOWN');
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  const restarted = new AutoPolicyJobHunter(f.store, f.options);
  assert.equal(restarted.state().stopped, true);
  await assert.rejects(
    () => restarted.startAuto(),
    (e: any) => e.code === 'SEND_UNKNOWN',
  );
  await f.service.historySync.checkpoint();
  importHistory(f.store, exportHistory(f.store));
  f.service.renewReadConsent(f.service.outboxRows()[0].id);
  assert.equal((await f.service.reconcile(f.service.outboxRows()[0].id)).confirmed, true);
  await restarted.startAuto();
  assert.equal(restarted.state().stopped, false);
  assert.equal(f.gateway.posts.length, 1);
  restarted.control('stop');
});
test('AUTO: explicit session limit, pacing and no hidden campaign expiration', async (t) => {
  const f = await setup(t);
  f.service.configurePolicy({ ...f.policy, sessionLimit: 1 });
  f.store.exec("UPDATE campaigns SET expires_at='2020-01-01T00:00:00.000Z',duration_minutes=0");
  f.runner.beforeCall = async () => {
    await new Promise((r) => setTimeout(r, 5));
  };
  await f.service.startAuto();
  await f.service.tick();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.state().status, 'SESSION_LIMIT');
});
test('AUTO: no user limit continues past three mails with a bounded queue', async (t) => {
  const f = await setup(t, false, true);
  await f.service.startAuto();
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 3);
  for (let i = 0; i < 3; i++) {
    f.advance();
    await f.service.dispatchOne();
  }
  await f.service.tick();
  for (let i = 0; i < 2; i++) {
    f.advance();
    await f.service.dispatchOne();
  }
  assert.equal(f.gateway.posts.length, 5);
  assert.equal(f.service.state().paused, false);
  assert.equal(f.service.dashboard().state.auto.session.status, 'RUNNING');
});
test('AUTO: unchanged sources older than a day are reverified before sending', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  for (const table of ['research_sources', 'evidence'])
    f.store.exec(`UPDATE ${table} SET fetched_at='2020-01-01T00:00:00.000Z'`);
  f.store.exec("UPDATE contacts SET verified_at='2020-01-01T00:00:00.000Z'");
  const calls = f.reader.calls;
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.ok(f.reader.calls > calls);
  assert.ok(f.store.all('SELECT * FROM source_verifications').length >= 2);
});
test('AUTO: provider limits pause once, with no intensive retry', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  let calls = 0;
  f.gateway.scan = async () => {
    calls++;
    throw new DomainError('GMAIL_RATE_LIMIT', 'fictional 429');
  };
  f.advance();
  await f.service.dispatchOne();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(calls, 1);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.service.state().status, 'GMAIL_RATE_LIMIT');
});
test('AUTO: a sender in flight does not make research invent SEND_UNKNOWN', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  let release!: () => void, entered!: () => void;
  const waiting = new Promise<void>((r) => {
    entered = r;
  });
  f.gateway.beforePost = async () => {
    entered();
    await new Promise<void>((r) => {
      release = r;
    });
  };
  const send = f.service.dispatchOne();
  await waiting;
  await f.service.tick();
  assert.equal(f.service.state().paused, false);
  release();
  await send;
  assert.equal(f.gateway.posts.length, 1);
});
for (const change of ['profile', 'cv', 'account'])
  test(`AUTO: ${change} change stops using old policy`, async (t) => {
    const f = await setup(t);
    await f.service.startAuto();
    await f.service.tick();
    if (change === 'profile')
      f.store.exec("UPDATE candidate_profiles SET approved_at=NULL,profile_hash='changed'");
    if (change === 'cv') f.store.exec('UPDATE cv_assets SET approved_at=NULL');
    if (change === 'account')
      f.gateway.info = { ...f.gateway.info, email: 'changed@example.test', subject: 'different' };
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.service.state().paused, true);
  });
test('history: owner blocks second device before handoff, then preserves dedup and counts', async (t) => {
  const f = await send(t, true);
  const repo2 = join(f.root, 'history2'),
    store2 = new Store(join(f.root, 'data2'));
  f.extraStores.push(store2);
  execFileSync('git', ['clone', '--branch', 'main', f.remote, repo2], {
    stdio: 'ignore',
    windowsHide: true,
  });
  const second = new AutoPolicyJobHunter(store2, f.options);
  second.historySync.configure({
    directory: repo2,
    expectedRemote: f.remote,
    confirmedPrivate: true,
  });
  await assert.rejects(
    () => second.historySync.claim(),
    (e: any) => e.code === 'HISTORY_OWNED',
  );
  await f.service.handoff();
  await second.historySync.claim();
  assert.equal(
    store2.one("SELECT history_status FROM companies WHERE canonical_name='Fixture Company'")
      ?.history_status,
    'CONTACTED',
  );
  assert.equal(store2.all('SELECT * FROM shared_attempts').length, 1);
  assert.equal(store2.all('SELECT * FROM shared_usage').length, 1);
  assert.ok(second.companies().find((c) => c.canonical_name === 'Fixture Company')?.sources.length);
  assert.equal(second.policyConfig(), null);
  assert.equal(second.state().stopped, true);
  const exported = readFileSync(join(repo2, 'history.json'), 'utf8');
  assert.ok(!exported.includes('fictional-account'));
  assert.ok(!exported.includes('candidate_facts'));
  assert.ok(!exported.includes('%PDF'));
  assert.ok(!exported.includes('autoPolicy'));
  assert.ok(!exported.includes('gmail_messages'));
  gatewayChange(f.gateway);
  second.approveProfile();
  const cv2 = second.uploadCV(
    'Fixture2.pdf',
    Buffer.from('%PDF-1.4\nfictional\n%%EOF').toString('base64'),
  );
  second.approveCV(cv2.id);
  second.configurePolicy({
    ...f.policy,
    senderEmail: f.gateway.info.email,
    cvId: cv2.id,
    dailyLimit: 1,
  });
  await second.probe('codex');
  await second.probe('search');
  await second.startAuto();
  await second.tick();
  f.advance();
  await second.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(second.dashboard().stats.sent, 1);
  assert.equal(second.state().status, 'DAILY_LIMIT');
  await second.handoff();
});
function gatewayChange(g: FixtureGmail) {
  g.info = { ...g.info, email: 'second-sender@example.test', subject: 'second-account' };
}
test('history: initial authority requires confirmation and can export with no send permission', async (t) => {
  const f = await setup(t);
  f.service.historySync.configure({
    directory: f.repo,
    expectedRemote: f.remote,
    confirmedPrivate: true,
  });
  await assert.rejects(
    () => f.service.prepareHistory(),
    (e: any) => e.code === 'INITIAL_HISTORY_REQUIRED',
  );
  f.service.historySync.configure({
    directory: f.repo,
    expectedRemote: f.remote,
    confirmedPrivate: true,
    confirmedInitialHistory: true,
  });
  await f.service.prepareHistory();
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.service.dashboard().state.auto.session, null);
  const state = JSON.parse(readFileSync(join(f.repo, 'history.json'), 'utf8'));
  assert.equal(state.closed, true);
  assert.equal(state.owner, null);
});
test('history: deleted state is a conflict, never a replacement empty history', async (t) => {
  const f = await send(t);
  rmSync(join(f.repo, 'history.json'));
  git(f.repo, 'add', '--', 'history.json');
  git(
    f.repo,
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.test',
    'commit',
    '-m',
    'fictional accidental deletion',
  );
  await assert.rejects(
    () => f.service.historySync.claim(),
    (e: any) => e.code === 'HISTORY_CONFLICT',
  );
});
test('history: interrupted export and conflicting aliases block without partial import', async (t) => {
  const f = await send(t);
  writeFileSync(join(f.repo, 'history.pending'), 'interrupted');
  await assert.rejects(
    () => f.service.historySync.checkpoint(),
    (e: any) => e.code === 'HISTORY_DIRTY',
  );
  rmSync(join(f.repo, 'history.pending'));
  const snapshot = exportHistory(f.store),
    prior = JSON.stringify(f.store.all('SELECT * FROM companies'));
  snapshot.aliases.push({
    ...snapshot.aliases[0],
    id: 'conflict',
    company_id: snapshot.companies.find((c) => c.id !== snapshot.aliases[0].company_id)!.id,
  });
  assert.throws(() => importHistory(f.store, snapshot));
  assert.equal(JSON.stringify(f.store.all('SELECT * FROM companies')), prior);
});
