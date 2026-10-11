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
import { setup, git } from './auto-fixture.js';
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

for (const late of [false, true])
  test(`AUTO regression: known Gmail correspondence skips A and sends B (late=${late})`, async (t) => {
    const f = await setup(t, false, true);
    await f.service.startAuto();
    await f.service.tick();
    const a = f.service.draftRows()[0];
    const scan = f.gateway.scan.bind(f.gateway);
    let scans = 0;
    f.gateway.scan = async (query, onPage) => {
      if (++scans >= (late ? 2 : 1))
        f.gateway.previous = [
          {
            id: 'prior-a',
            threadId: 'prior-thread',
            labels: ['SENT'],
            from: [f.gateway.info.email],
            to: [a.email],
            subject: 'Zwykła korespondencja',
            messageId: '<prior-a@example.test>',
            at: '2026-10-01T12:00:00.000Z',
            body: '',
            category: 'UNCLEAR',
          },
        ];
      await scan(query, onPage);
    };
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.service.state().paused, false, 'kontakt jednej firmy nie kończy sesji');
    assert.equal(f.store.get(`autoSkipped:${a.id}:${a.version}`, false), true);
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 1);
    assert.notEqual(f.gateway.posts[0].recipient, a.email);
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.filter((p) => p.recipient === a.email).length, 0);
    assert.equal(
      f.store.all("SELECT * FROM audit_events WHERE action='AUTO_SKIPPED' AND entity_id=?", a.id)
        .length,
      1,
    );
  });

test('AUTO regression: error retains selected A when concurrent work moves B to the front', async (t) => {
  const f = await setup(t, false, true);
  await f.service.startAuto();
  await f.service.tick();
  const [a, b] = f.service.draftRows();
  f.store.exec("UPDATE research_sources SET fetched_at='2020-01-01T00:00:00.000Z'");
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    f.store.exec("UPDATE drafts SET created_at='2099-01-01T00:00:00.000Z' WHERE id=?", b.id);
    f.store.exec(
      'UPDATE research_drafts SET semantic_review=? WHERE draft_id=?',
      JSON.stringify({ supported: null, issues: ['Niepewny A'] }),
      a.id,
    );
    return read(url, signal);
  };
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.store.get(`autoSkipped:${a.id}:${a.version}`, false), true);
  assert.equal(f.store.get(`autoSkipped:${b.id}:${b.version}`, false), false);
  assert.equal(f.gateway.posts.length, 0);
});

test('AUTO regression: manual approval cannot borrow the internal sender authorization', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  const account = f.gateway.account;
  let attempted = false;
  f.gateway.account = async () => {
    if (f.store.one('SELECT id FROM gmail_previews') && !attempted) {
      attempted = true;
      const preview = f.service.preview(f.store.one('SELECT id FROM gmail_previews')!.id);
      await assert.rejects(
        () =>
          f.service.approveDelivery({
            previewId: preview.id,
            previewHash: preview.previewHash,
            confirmed: true,
          }),
        (e: any) => e.code === 'AUTO_POLICY_ONLY',
      );
    }
    return account();
  };
  f.advance();
  await f.service.dispatchOne();
  assert.equal(attempted, true);
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.outboxRows().length, 1);
});

test('AUTO: queue leaves unprocessed candidates pending and completes the original run later', async (t) => {
  const f = await setup(t, false, true);
  await f.service.startAuto();
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 3);
  assert.equal(f.store.one("SELECT count(*) n FROM research_items WHERE status='PENDING'")!.n, 2);
  const run = f.store.one("SELECT id FROM research_items WHERE status='PENDING'")!;
  for (let i = 0; i < 3; i++) {
    f.advance();
    await f.service.dispatchOne();
  }
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 5);
  assert.equal(f.store.one("SELECT count(*) n FROM research_items WHERE status='PENDING'")!.n, 0);
  assert.equal(f.store.all('SELECT * FROM auto_query_plan').length, 1);
});

test('AUTO: editing selected A during history skips only the checked version', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  const a = f.service.draftRows()[0],
    scan = f.gateway.scan.bind(f.gateway);
  f.gateway.scan = async (q, page) => {
    await scan(q, page);
    f.gateway.scan = scan;
    f.service.editDraft(a.id, { version: a.version, subject: a.subject, body: a.body });
  };
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.get(`autoSkipped:${a.id}:${a.version}`, false), true);
  assert.equal(f.store.get(`autoSkipped:${a.id}:${a.version + 1}`, false), false);
  assert.equal(f.store.one('SELECT draft_version FROM auto_skips')?.draft_version, a.version);
});

test('AUTO: Start remains blocked throughout handoff and history preparation', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  let release!: () => void, entered!: () => void;
  const waiting = new Promise<void>((r) => {
    entered = r;
  });
  const checkpoint = f.service.historySync.checkpoint.bind(f.service.historySync);
  f.service.historySync.checkpoint = async (releaseOwner = false) => {
    entered();
    await new Promise<void>((r) => {
      release = r;
    });
    return checkpoint(releaseOwner);
  };
  const handoff = f.service.handoff();
  await waiting;
  await assert.rejects(
    () => f.service.startAuto(),
    (e: any) => e.code === 'BUSY',
  );
  release();
  await handoff;
  assert.equal(f.service.state().stopped, true);
});

test('AUTO: concurrent sender calls reserve one contact and Stop during history preserves STOPPED', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await Promise.all([f.service.dispatchOne(), f.service.dispatchOne()]);
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.store.all('SELECT * FROM send_attempts').length, 1);
  const g = await setup(t);
  await g.service.startAuto();
  await g.service.tick();
  g.advance();
  g.gateway.scan = async () => {
    g.service.control('stop');
    throw new DomainError('GMAIL_READ', 'Cancelled fixture read');
  };
  await g.service.dispatchOne();
  assert.equal(g.gateway.posts.length, 0);
  assert.equal(g.service.state().status, 'STOPPED');
});
test('AUTO: changed scope cancels old paused/backlog runs and prevents old drafts inheriting permission', async (t) => {
  const f = await setup(t, false, true);
  await f.service.startAuto();
  await f.service.tick();
  const oldRun = f.store.one('SELECT run_id FROM auto_run_scope')!.run_id,
    oldScope = f.service.policyConfig()!.scopeHash;
  f.service.control('stop');
  f.service.configurePolicy({
    ...f.policy,
    searchScope: 'Polska, wyłącznie firmy tworzące oprogramowanie dla edukacji',
  });
  assert.notEqual(f.service.policyConfig()!.scopeHash, oldScope);
  await f.service.startAuto();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  await f.service.tick();
  assert.equal(
    f.store.one('SELECT scope_hash FROM auto_run_scope WHERE run_id=?', oldRun)?.scope_hash,
    oldScope,
  );
  assert.notEqual(
    f.store.one(
      'SELECT run_id FROM auto_run_scope WHERE scope_hash=?',
      f.service.policyConfig()!.scopeHash,
    )?.run_id,
    oldRun,
  );
  assert.ok(
    f.store
      .all('SELECT scope_hash FROM auto_draft_scope')
      .some((r) => r.scope_hash === f.service.policyConfig()!.scopeHash),
  );
});
test('AUTO: limit/pacing changes retain research progress; legacy policy needs explicit approval', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  f.service.control('stop');
  const scope = f.service.policyConfig()!.scopeHash;
  f.service.configurePolicy({ ...f.policy, dailyLimit: 5, sendIntervalSeconds: 120 });
  assert.equal(f.service.policyConfig()!.scopeHash, scope);
  await f.service.startAuto();
  f.advance(180000);
  await f.service.tick();
  assert.notEqual(f.service.state().status, 'QUERY_ALREADY_RUN');
  assert.equal(f.store.all('SELECT * FROM auto_query_plan').length, 2);
  f.service.control('stop');
  const legacy = { ...f.service.policyConfig() };
  delete legacy.scopeHash;
  f.store.set('autoPolicy', legacy);
  await assert.rejects(
    () => f.service.startAuto(),
    (e: any) => e.code === 'POLICY_SCOPE_REQUIRED',
  );
  assert.equal(f.gateway.posts.length, 0);
});
test('AUTO: a new verified source creates a new version after skipping the old draft', async (t) => {
  const f = await setup(t);
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  f.store.exec(
    'UPDATE research_drafts SET semantic_review=?',
    JSON.stringify({ supported: null, issues: ['Fixture uncertain'] }),
  );
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.store.get(`autoSkipped:${d.id}:${d.version}`, false), true);
  await f.service.importURL('https://fixture.example.test/current-careers');
  await f.service.tick();
  assert.equal(f.service.draftRows()[0].version, d.version + 1);
  assert.equal(f.store.get(`autoSkipped:${d.id}:${d.version}`, false), true);
  assert.equal(f.store.get(`autoSkipped:${d.id}:${d.version + 1}`, false), false);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
});
