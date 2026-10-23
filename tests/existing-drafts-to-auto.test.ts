import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { FixtureGmail } from './gmail-fixture.js';
import { ManyReader, ManyRunner } from './auto-fixture.js';
import { DomainError } from '../apps/server/src/util.js';
import { acquireProfileLock } from '../apps/server/src/backend-lock.js';
import {
  readProtectedSnapshot,
  compareProtectedSnapshots,
} from '../apps/server/src/research/protection.js';

async function fixture(t: TestContext, many = false) {
  const root = mkdtempSync(join(tmpdir(), 'jh-existing-to-auto-')),
    dir = join(root, 'data'),
    lock = acquireProfileLock(dir),
    store = new Store(dir),
    reader = many ? new ManyReader() : new FixtureReader(),
    runner = many ? new ManyRunner() : new FixtureRunner(),
    gateway = new FixtureGmail();
  store.assertExclusive = lock.assert;
  let time = Date.now();
  const read = reader.read.bind(reader);
  reader.read = async (url, signal) => ({
    ...(await read(url, signal)),
    fetched_at: new Date(time).toISOString(),
  });
  const options = { reader, runner, clock: () => new Date(time) };
  const research = new ResearchJobHunter(store, options);
  research.approveProfile();
  const profile = research.profile();
  const cv = research.uploadCV(
    'Fixture.pdf',
    Buffer.from('%PDF-1.4\nSynthetic\n%%EOF').toString('base64'),
  );
  research.approveCV(cv.id);
  for (const url of many
    ? [1, 2, 3, 4].map((n) => `https://fixture${n}.example.test/careers`)
    : ['https://fixture.example.test/careers']) {
    await research.importURL(url);
    await research.tick();
  }
  research.control('stop');
  research.finishPartial();
  const originals = research.draftRows(),
    old = originals[0];
  assert.ok(old);
  assert.equal(store.one('SELECT count(*) n FROM auto_draft_scope')!.n, 0);
  assert.equal(store.one('SELECT count(*) n FROM auto_run_scope')!.n, 0);
  assert.equal(store.get('autoPolicy', null), null);
  const service = new AutoPolicyJobHunter(store, {
    ...options,
    gateway,
    accountInfo: () => gateway.info,
  });
  const policy = {
    senderEmail: gateway.info.email,
    cvId: cv.id,
    contactKinds: ['RECRUITMENT', 'GENERAL'],
    contactTypes: ['ACTIVE', 'OPEN', 'PROSPECT'],
    searchScope: 'Fikcyjne firmy IT w Polsce, płatna zdalna współpraca programistyczna',
    sessionLimit: 3,
    dailyLimit: 10,
    sendIntervalSeconds: 600,
    researchIntervalSeconds: 60,
    confirmed: true,
    targetedHistoryConsent: true,
  };
  service.configurePolicy(policy);
  await service.configureLocalHistory({ confirmedHistory: true, confirmedSingleWorkstation: true });
  t.after(async () => {
    await service.stopWorker();
    await service.browserDelivery.close();
    store.close();
    lock.release();
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  assert.equal(service.profile().profile_hash, profile.profile_hash);
  return {
    root,
    dir,
    store,
    service,
    reader,
    runner,
    gateway,
    old,
    originals,
    policy,
    profile,
    advance: (ms = 601000) => {
      time += ms;
    },
  };
}

function noSend(f: Awaited<ReturnType<typeof fixture>>) {
  for (const table of [
    'auto_sessions',
    'draft_approvals',
    'outbox',
    'send_attempts',
    'usage_ledger',
  ])
    assert.equal(f.store.one('SELECT count(*) n FROM ' + table)!.n, 0, table);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.gateway.historyQueries.length, 0);
  assert.equal(f.service.state().stopped, true);
  assert.equal(f.service.deliveryAuthority().enabled, false);
}

test('existing RESEARCH_ONLY draft enters an explicit AUTO policy through real refresh, then a closed batch without discovery', async (t) => {
  const f = await fixture(t),
    versions = f.store.all('SELECT * FROM draft_versions'),
    calls = f.reader.calls;
  const initial = f.service.prepareBatch({ drafts: [{ id: f.old.id, version: f.old.version }] });
  assert.equal(initial.items[0].code, 'SCOPE_CHANGED');
  const transition = readProtectedSnapshot(f.store.db);
  const result = await f.service.refreshLibraryDrafts({ draftIds: [f.old.id] });
  assert.equal(result.results[0].code, 'CHECKED');
  assert.ok(f.reader.calls > calls);
  const current = f.service.draftRows()[0];
  assert.equal(current.id, f.old.id);
  assert.ok(current.version > f.old.version);
  assert.equal(current.subject, f.old.subject);
  assert.equal(current.body, f.old.body);
  assert.equal(
    f.store.one('SELECT scope_hash FROM auto_draft_scope WHERE draft_id=?', current.id)!.scope_hash,
    f.service.policyConfig()!.scopeHash,
  );
  for (const old of versions)
    assert.deepEqual(f.store.one('SELECT * FROM draft_versions WHERE id=?', old.id), old);
  assert.equal(compareProtectedSnapshots(transition, readProtectedSnapshot(f.store.db)).ok, true);
  noSend(f);
  const stable = readProtectedSnapshot(f.store.db);
  await f.service.refreshLibraryDrafts({ draftIds: [current.id] });
  assert.equal(f.service.draftRows()[0].version, current.version);
  assert.equal(compareProtectedSnapshots(stable, readProtectedSnapshot(f.store.db)).ok, true);
  const batch = f.service.prepareBatch({ drafts: [{ id: current.id, version: current.version }] });
  assert.equal(batch.counts.remaining, 1);
  await f.service.dispatchOne();
  noSend(f);
  const search = f.store.one("SELECT count(*) n FROM model_calls WHERE stage='SEARCH'")!.n;
  f.service.approveClosedBatch(batch.id, { approvalHash: batch.approvalHash, confirmed: true });
  await f.service.dispatchOne();
  noSend(f);
  await f.service.startBatch(batch.id);
  f.advance();
  await f.service.tick();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.batchSummary(batch.id).state, 'COMPLETED');
  assert.equal(f.service.state().stopped, true);
  assert.equal(f.store.one("SELECT count(*) n FROM model_calls WHERE stage='SEARCH'")!.n, search);
});

test('selected existing drafts close into exactly three items; an unselected fourth never enters AUTO or discovery', async (t) => {
  const f = await fixture(t, true),
    selected = f.originals.slice(0, 3),
    outside = f.originals[3];
  assert.equal(f.originals.length, 4);
  await f.service.refreshLibraryDrafts({ draftIds: selected.map((d) => d.id) });
  const drafts = f.service.draftRows().filter((d) => selected.some((s) => s.id === d.id));
  assert.equal(
    f.store.one('SELECT scope_hash FROM auto_draft_scope WHERE draft_id=?', outside.id),
    undefined,
  );
  const batch = f.service.prepareBatch({
    drafts: drafts.map((d) => ({ id: d.id, version: d.version })),
  });
  assert.equal(batch.counts.remaining, 3);
  noSend(f);
  f.service.approveClosedBatch(batch.id, { approvalHash: batch.approvalHash, confirmed: true });
  await f.service.startBatch(batch.id);
  for (let n = 0; n < 4; n++) {
    f.advance();
    await f.service.tick();
    await f.service.dispatchOne();
  }
  assert.equal(f.gateway.posts.length, 3);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 3);
  assert.equal(f.service.batchSummary(batch.id).state, 'COMPLETED');
  assert.ok(f.service.draftRows().find((d) => d.id === outside.id)!.status !== 'SENT');
  assert.equal(f.store.one("SELECT count(*) n FROM model_calls WHERE stage='SEARCH'")!.n, 0);
});

test('a policy excluding the saved contact kind never makes the draft eligible for a closed batch', async (t) => {
  const f = await fixture(t);
  f.service.configurePolicy({ ...f.policy, contactKinds: ['GENERAL'] });
  await f.service.refreshLibraryDrafts({ draftIds: [f.old.id] });
  const d = f.service.draftRows()[0];
  const batch = f.service.prepareBatch({ drafts: [{ id: d.id, version: d.version }] });
  assert.equal(batch.counts.remaining, 0);
  assert.equal(batch.counts.needsPreparation, 1);
  noSend(f);
});

test('stale refreshed sources cannot admit an existing draft', async (t) => {
  const f = await fixture(t),
    read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => ({
    ...(await read(url, signal)),
    fetched_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  });
  const result = await f.service.refreshLibraryDrafts({ draftIds: [f.old.id] });
  assert.notEqual(result.results[0].code, 'CHECKED');
  assert.equal(f.store.one('SELECT count(*) n FROM auto_draft_scope')!.n, 0);
  noSend(f);
});

test('an unapproved candidate profile cannot admit an existing draft', async (t) => {
  const f = await fixture(t),
    p = f.service.profile();
  f.service.updateProfile({
    name: p.name,
    goal: p.goal + ' Nowy cel.',
    version: p.version,
    hours_approx: 20,
    message_template: p.message_template,
    facts: p.facts.map((x: any) => ({ id: x.id, content: x.content })),
  });
  f.service.control('stop');
  await assert.rejects(() => f.service.refreshLibraryDrafts({ draftIds: [f.old.id] }));
  assert.equal(f.store.one('SELECT count(*) n FROM auto_draft_scope')!.n, 0);
  noSend(f);
});

test('a local suppression blocks renewal without any history read or attempt', async (t) => {
  const f = await fixture(t),
    reads = f.reader.calls;
  f.service.suppress(f.old.company_id, 'DO_NOT_CONTACT', 'Synthetic refusal', 'user');
  const result = await f.service.refreshLibraryDrafts({ draftIds: [f.old.id] });
  assert.equal(result.results[0].code, 'CONTACT_HISTORY');
  assert.equal(f.reader.calls, reads);
  noSend(f);
});

test('a changed approved PDF blocks qualification before any source or model operation', async (t) => {
  const f = await fixture(t),
    calls = f.reader.calls;
  const cv = f.store.one('SELECT stored_name FROM cv_assets WHERE id=?', f.policy.cvId)!;
  writeFileSync(join(f.dir, 'cv', cv.stored_name), '%PDF-1.4\nChanged synthetic bytes\n%%EOF');
  await assert.rejects(() => f.service.refreshLibraryDrafts({ draftIds: [f.old.id] }));
  assert.equal(f.reader.calls, calls);
  assert.equal(f.store.one('SELECT count(*) n FROM auto_draft_scope')!.n, 0);
  noSend(f);
});

test('preparation without an approved AUTO policy cannot invent consent or a scope', async (t) => {
  const f = await fixture(t);
  f.store.set('autoPolicy', null); // Synthetic missing configuration, never a fabricated grant.
  await assert.rejects(() => f.service.refreshLibraryDrafts({ draftIds: [f.old.id] }), {
    code: 'POLICY_REQUIRED',
  });
  assert.equal(f.store.one('SELECT count(*) n FROM auto_draft_scope')!.n, 0);
  noSend(f);
});

async function holdReader(f: Awaited<ReturnType<typeof fixture>>) {
  let release!: () => void, entered!: () => void;
  const held = new Promise<void>((r) => (release = r)),
    ready = new Promise<void>((r) => (entered = r));
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    entered();
    await held;
    return read(url, signal);
  };
  const work = f.service.refreshLibraryDrafts({ draftIds: [f.old.id] });
  await Promise.race([
    ready,
    work.then(() => {
      throw Error('READER_STAGE_NOT_ENTERED');
    }),
  ]);
  return { work, release };
}

test('policy changes are refused while the selected refresh awaits its reader', async (t) => {
  const f = await fixture(t),
    held = await holdReader(f);
  try {
    assert.throws(
      () =>
        f.service.configurePolicy({
          ...f.policy,
          searchScope: f.policy.searchScope + ' Nowy zakres.',
        }),
      { code: 'SESSION_ACTIVE' },
    );
  } finally {
    f.service.control('stop');
    held.release();
    await assert.rejects(() => held.work);
  }
  noSend(f);
});

test('public version edits are refused during the selected read', async (t) => {
  const f = await fixture(t),
    held = await holdReader(f);
  try {
    assert.throws(
      () =>
        f.service.editDraft(f.old.id, {
          version: f.old.version,
          subject: f.old.subject,
          body: f.old.body,
        }),
      { code: 'BUSY' },
    );
  } finally {
    f.service.control('stop');
    held.release();
    await assert.rejects(() => held.work);
  }
  noSend(f);
});

test('a conflicting version from another writer invalidates the selected read', async (t) => {
  const f = await fixture(t),
    held = await holdReader(f);
  // Fault injection only: no scope, approval, PASS or send record is forged.
  f.store.exec('UPDATE drafts SET version=version+1 WHERE id=?', f.old.id);
  held.release();
  await assert.rejects(() => held.work, { code: 'VERSION_CONFLICT' });
  assert.equal(f.store.one('SELECT count(*) n FROM auto_draft_scope')!.n, 0);
  noSend(f);
});

test('Stop cancels existing-draft qualification after an awaited read', async (t) => {
  const f = await fixture(t),
    held = await holdReader(f);
  f.service.control('stop');
  held.release();
  await assert.rejects(() => held.work);
  assert.equal(f.store.one('SELECT count(*) n FROM auto_draft_scope')!.n, 0);
  noSend(f);
});

test('lost profile ownership cannot commit a scope after an awaited read', async (t) => {
  const f = await fixture(t),
    held = await holdReader(f),
    assertOwner = f.store.assertExclusive;
  f.store.assertExclusive = () => {
    throw new DomainError('PROFILE_LOCK_LOST', 'Synthetic lost owner');
  };
  held.release();
  try {
    await assert.rejects(() => held.work, { code: 'PROFILE_LOCK_LOST' });
  } finally {
    f.store.assertExclusive = assertOwner;
  }
  assert.equal(f.store.one('SELECT count(*) n FROM auto_draft_scope')!.n, 0);
  noSend(f);
});

async function holdModel(f: Awaited<ReturnType<typeof fixture>>, text: string) {
  let release!: () => void, entered!: () => void;
  const held = new Promise<void>((r) => (release = r)),
    ready = new Promise<void>((r) => (entered = r));
  f.runner.beforeCall = async (prompt) => {
    if (prompt.includes(text)) {
      entered();
      await held;
    }
  };
  const work = f.service.refreshLibraryDrafts({ draftIds: [f.old.id] });
  await Promise.race([
    ready,
    work.then(() => {
      throw Error('MODEL_STAGE_NOT_ENTERED');
    }),
  ]);
  return { work, release };
}

test('a changed persisted policy during model preparation cannot commit an obsolete qualification', async (t) => {
  const f = await fixture(t),
    held = await holdModel(f, 'POPRAW ISTNIEJĄCY SZKIC');
  f.store.set('autoPolicy', { ...f.service.policyConfig(), scopeHash: 'synthetic-conflict' });
  held.release();
  await assert.rejects(() => held.work, { code: 'POLICY_CHANGED' });
  assert.equal(f.store.one('SELECT count(*) n FROM auto_draft_scope')!.n, 0);
  noSend(f);
});

test('owner loss while semantic review awaits cannot accept its late PASS', async (t) => {
  const f = await fixture(t),
    held = await holdModel(f, 'Sprawdź KAŻDE'),
    assertOwner = f.store.assertExclusive;
  f.store.assertExclusive = () => {
    throw new DomainError('PROFILE_LOCK_LOST', 'Synthetic owner loss');
  };
  held.release();
  try {
    await assert.rejects(() => held.work, { code: 'PROFILE_LOCK_LOST' });
  } finally {
    f.store.assertExclusive = assertOwner;
  }
  const d = f.service.draftRows()[0];
  assert.ok(f.service.draftMaterialIssues(d).length > 0);
  assert.notEqual(JSON.parse(d.semantic_review).supported, true);
  // Lost ownership cannot persist Stop on behalf of the replacement owner.
  // Cleanup is explicit only after this fictional owner has been restored.
  f.service.control('stop');
  noSend(f);
});

test('Stop during semantic review leaves the new version unverified with no send authority', async (t) => {
  const f = await fixture(t),
    held = await holdModel(f, 'Sprawdź KAŻDE');
  f.service.control('stop');
  held.release();
  await assert.rejects(() => held.work);
  assert.ok(f.service.draftMaterialIssues(f.service.draftRows()[0]).length > 0);
  noSend(f);
});
