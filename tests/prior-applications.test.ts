import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';
import { setup } from './auto-fixture.js';
import {
  confirmPriorApplications,
  manualHistoryBlocks,
  gmailHistoryBlocks,
  companyHistoryBlocks,
} from '../apps/server/src/prior-applications.js';
import {
  previewNewLocalHistory,
  initializeNewLocalHistory,
} from '../apps/server/src/initialize-local.js';
import { hash } from '../apps/server/src/util.js';

function permitEarlierApplications(f: Awaited<ReturnType<typeof setup>>) {
  const policy = confirmPriorApplications(f.store, true, f.options.clock());
  f.service.configurePolicy(f.policy);
  return policy;
}

test('new personal initialization omits legacy suggestions and retains Fingoweb', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-new-history-fixture-'));
  const store = new Store(root);
  t.after(() => {
    store.close();
    rmSync(root, { recursive: true, force: true });
  });
  store.set('skipLegacyHistorySeed', true);
  new ResearchJobHunter(store);
  assert.equal(store.one('SELECT count(*) n FROM companies')!.n, 1);
  assert.equal(
    store.one("SELECT count(*) n FROM companies WHERE history_status='HISTORY_TO_VERIFY'")!.n,
    0,
  );
  assert.ok(
    store.one(
      "SELECT id FROM suppressions WHERE company_id=(SELECT id FROM companies WHERE canonical_name='Fingoweb')",
    ),
  );
  assert.equal(
    store.one("SELECT count(*) n FROM candidate_facts WHERE approval_status='APPROVED'")!.n,
    0,
  );
});

test('preview and initializer require a fresh target, exact hash and explicit decisions; no native mail', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-init-fixture-'));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }));
  const base = join(root, 'new-private-profile');
  const text =
    'company,status,domain,email,date\nFixture Manual,CONTACTED,manual.example.test,hr@manual.example.test,2026-10-01';
  const plan = previewNewLocalHistory(base, text);
  assert.equal(plan.legacyNamesAdded, 0);
  assert.equal(plan.historyRecordsWritten, 0);
  assert.equal(existsSync(base), false);
  assert.equal(plan.preview.rows[0].valid, true);
  const input = {
    base,
    text,
    approvedHash: hash(text),
    confirmedNewDatabase: true,
    confirmedPriorApplications: true,
  };
  assert.throws(
    () => initializeNewLocalHistory({ ...input, confirmedNewDatabase: false }),
    (e: any) => e.code === 'INITIALIZATION_CONFIRMATION',
  );
  assert.throws(
    () => initializeNewLocalHistory({ ...input, text: text + '\n' }),
    (e: any) => e.code === 'IMPORT_CHANGED',
  );
  assert.equal(existsSync(base), false);
  const initialized = initializeNewLocalHistory(input);
  assert.equal(initialized.imported.imported, 1);
  assert.equal(initialized.stopped, true);
  assert.equal(initialized.attempts, 0);
  assert.equal(initialized.outbox, 0);
  assert.ok(existsSync(initialized.backup));
  assert.equal(
    existsSync(join(base, 'workstation.json')),
    false,
    'installation designation is a separate confirmation',
  );
  const store = new Store(join(base, 'research-only'));
  try {
    const before = JSON.stringify(store.all('SELECT * FROM history_records'));
    assert.equal(store.one('SELECT count(*) n FROM companies')!.n, 2);
    assert.equal(
      store.one("SELECT count(*) n FROM candidate_facts WHERE approval_status='APPROVED'")!.n,
      0,
    );
    assert.ok(
      companyHistoryBlocks(
        store,
        store.one("SELECT * FROM companies WHERE canonical_name='Fingoweb'")!,
      ),
    );
    assert.throws(
      () => initializeNewLocalHistory(input),
      (e: any) => e.code === 'INITIALIZATION_TARGET_EXISTS',
    );
    assert.throws(
      () => confirmPriorApplications(store, true, new Date(Date.now() + 86400000)),
      (e: any) => e.code === 'PRIOR_APPLICATION_ALREADY_SET',
    );
    assert.equal(JSON.stringify(store.all('SELECT * FROM history_records')), before);
    assert.deepEqual(store.get('priorApplicationException', null), initialized.priorApplications);
  } finally {
    store.close();
  }
});

test('new seed option never deletes history or changes an existing profile', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-existing-seed-fixture-'));
  const store = new Store(root);
  t.after(() => {
    store.close();
    rmSync(root, { recursive: true, force: true });
  });
  new ResearchJobHunter(store);
  const before = JSON.stringify(store.all('SELECT * FROM companies'));
  store.set('skipLegacyHistorySeed', true);
  new ResearchJobHunter(store);
  assert.equal(JSON.stringify(store.all('SELECT * FROM companies')), before);
});

for (const afterBoundary of [false, true])
  test(`legacy mail exception still blocks ${afterBoundary ? 'post-boundary SENT' : 'an explicit incoming opt-out'}`, async (t) => {
    const f = await setup(t, false, false, false, true);
    const policy = permitEarlierApplications(f);
    await f.service.startAuto();
    await f.service.tick();
    const d = f.service.draftRows()[0];
    f.gateway.previous = [
      {
        id: 'blocking-mail',
        threadId: 'blocking-thread',
        labels: afterBoundary ? ['SENT'] : ['INBOX'],
        from: [afterBoundary ? f.gateway.info.email : d.email],
        to: [afterBoundary ? d.email : f.gateway.info.email],
        subject: afterBoundary ? 'Nowe zgłoszenie' : 'Proszę nie kontaktować się ponownie',
        messageId: '<blocking-mail@example.test>',
        at: afterBoundary ? policy.cutoffAt : '2026-10-01T12:00:00.000Z',
        body: afterBoundary ? '' : 'Proszę zaprzestać kontaktu.',
        category: afterBoundary ? 'UNCLEAR' : 'REJECTED',
      },
    ];
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
    assert.equal(f.store.one('SELECT count(*) n FROM gmail_messages')!.n, 1);
  });

test('old CONTACTED CSV records remain intact and allow a new draft only once', async (t) => {
  const f = await setup(t, false, false, false, true);
  const csv =
    'company,status,domain,email,date\nFixture Company,CONTACTED,fixture.example.test,hr@fixture.example.test,2026-10-01';
  f.service.importHistory(csv, f.service.previewHistory(csv).hash);
  const before = JSON.stringify(f.store.all('SELECT * FROM history_records'));
  permitEarlierApplications(f);
  await f.service.startAuto();
  await f.service.tick();
  assert.equal(f.service.draftRows().length, 1);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(JSON.stringify(f.store.all('SELECT * FROM history_records')), before);
});

test('prior application exception never bypasses SEND_UNKNOWN after timeout', async (t) => {
  const f = await setup(t, false, false, false, true);
  const boundary = permitEarlierApplications(f);
  f.gateway.timeout = true;
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(
    f.store.one("SELECT count(*) n FROM send_attempts WHERE state='SEND_UNKNOWN'")!.n,
    1,
  );
  f.service.control('stop');
  const restarted = new AutoPolicyJobHunter(f.store, f.options);
  f.advance(86400000);
  await assert.rejects(
    () => restarted.startAuto(),
    (e: any) => e.code === 'SEND_UNKNOWN',
  );
  await restarted.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.deepEqual(f.store.get('priorApplicationException', null), boundary);
});

test('policy binding rejects a changed cutoff; unknown dates, registered mail and refusals stay blocking', async (t) => {
  const f = await setup(t, false, false, false, true);
  const policy = permitEarlierApplications(f);
  const old = '2026-10-01T00:00:00.000Z';
  assert.equal(
    gmailHistoryBlocks(f.store, {
      direction: 'OUTGOING',
      outbox_id: null,
      category: 'UNCLEAR',
      sent_at: old,
    }),
    false,
  );
  assert.equal(
    gmailHistoryBlocks(f.store, {
      direction: 'OUTGOING',
      outbox_id: 'registered-first-contact',
      category: 'UNCLEAR',
      sent_at: old,
    }),
    true,
  );
  assert.equal(
    gmailHistoryBlocks(f.store, {
      direction: 'OUTGOING',
      outbox_id: null,
      category: 'UNCLEAR',
      sent_at: 'invalid-date',
    }),
    true,
  );
  assert.equal(
    manualHistoryBlocks(f.store, {
      status: 'REJECTED',
      original_name: 'Fixture',
      occurred_at: old,
    }),
    true,
  );
  assert.equal(
    manualHistoryBlocks(f.store, {
      status: 'CONTACTED',
      original_name: 'Fingoweb',
      occurred_at: old,
    }),
    true,
  );
  assert.equal(
    manualHistoryBlocks(f.store, {
      status: 'CONTACTED',
      original_name: 'Fixture',
      occurred_at: null,
      created_at: policy.cutoffAt,
    }),
    true,
  );
  f.store.set('priorApplicationException', {
    ...policy,
    cutoffAt: new Date(Date.parse(policy.cutoffAt) + 86400000).toISOString(),
  });
  await assert.rejects(
    () => f.service.startAuto(),
    (e: any) => e.code === 'POLICY_PRIOR_APPLICATIONS_CHANGED',
  );
  assert.equal(f.gateway.posts.length, 0);
});

for (const incoming of [false, true])
  test(`last pre-send scan ${incoming ? 'blocks a newly discovered incoming refusal' : 'still permits an earlier application'}`, async (t) => {
    const f = await setup(t, false, false, false, true);
    permitEarlierApplications(f);
    await f.service.startAuto();
    await f.service.tick();
    const d = f.service.draftRows()[0];
    const scan = f.gateway.scan.bind(f.gateway);
    let scans = 0;
    f.gateway.scan = async (query, page, expected) => {
      if (++scans === 2)
        f.gateway.previous = [
          {
            id: 'late-mail',
            threadId: 'late-thread',
            labels: incoming ? ['INBOX'] : ['SENT'],
            from: [incoming ? d.email : f.gateway.info.email],
            to: [incoming ? f.gateway.info.email : d.email],
            subject: incoming ? 'Prosimy nie kontaktować się ponownie' : 'Wcześniejsze zgłoszenie',
            messageId: '<late-mail@example.test>',
            at: '2026-10-01T12:00:00.000Z',
            body: '',
            category: incoming ? 'REJECTED' : 'UNCLEAR',
          },
        ];
      await scan(query, page);
    };
    f.advance();
    await f.service.dispatchOne();
    assert.equal(scans, 2);
    assert.equal(f.gateway.posts.length, incoming ? 0 : 1);
    assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, incoming ? 0 : 1);
  });

test('explicit prior-application exception allows old SENT once and survives restart/day change', async (t) => {
  const f = await setup(t, false, false, false, true);
  const boundary = {
    version: 1,
    id: 'fixture-new-campaign',
    cutoffAt: f.options.clock().toISOString(),
    confirmed: true,
  };
  f.store.set('priorApplicationException', boundary);
  f.service.configurePolicy(f.policy);
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  f.gateway.previous = [
    {
      id: 'old-application',
      threadId: 'old-thread',
      labels: ['SENT'],
      from: [f.gateway.info.email],
      to: [d.email],
      subject: 'Dawne zgłoszenie',
      messageId: '<old-application@example.test>',
      at: '2026-10-01T12:00:00.000Z',
      body: '',
      category: 'UNCLEAR',
    },
  ];
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(
    f.store.one('SELECT count(*) n FROM gmail_messages')!.n,
    1,
    'prior history retained',
  );
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 1);
  f.service.control('stop');
  await f.service.stopWorker();
  const reopened = new Store(f.dir);
  f.extraStores.push(reopened);
  const restarted = new AutoPolicyJobHunter(reopened, f.options);
  assert.deepEqual(reopened.get('priorApplicationException', null), boundary);
  assert.equal(restarted.state().stopped, true);
  f.advance(86400000);
  await restarted.startAuto();
  await restarted.tick();
  await restarted.dispatchOne();
  assert.equal(
    f.gateway.posts.length,
    1,
    'new send blocks a second one despite old-message exception',
  );
  assert.equal(reopened.one('SELECT count(*) n FROM send_attempts')!.n, 1);
  restarted.control('stop');
  await restarted.stopWorker();
});
