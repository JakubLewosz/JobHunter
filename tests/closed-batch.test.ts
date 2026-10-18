import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';

async function prepared(t: any, many = false) {
  const f = await setup(t, false, many, false, true);
  await f.service.startLibraryResearch(undefined, 8);
  await f.service.tick();
  f.service.control('stop');
  f.service.finishPartial();
  const drafts = f.service.draftRows();
  assert.ok(drafts.length > 0);
  const batch = f.service.prepareBatch({
    drafts: drafts.map((d) => ({ id: d.id, version: d.version })),
  });
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
  f.service.approveClosedBatch(batch.id, { approvalHash: batch.approvalHash, confirmed: true });
  return { ...f, batch };
}
test('closed AUTO batch: research without mail, frozen membership, one reservation and completion without discovery', async (t) => {
  const f = await prepared(t, true),
    count = f.batch.counts.total;
  assert.equal(count, 5);
  await f.service.startBatch(f.batch.id);
  const searchCalls = f.store.one("SELECT count(*) n FROM model_calls WHERE stage='SEARCH'")!.n;
  f.service.findOrCreateCompany('A new synthetic company', 'later.example.test');
  for (let i = 0; i < count; i++) {
    f.advance();
    await f.service.tick();
    await f.service.dispatchOne();
  }
  const result = f.service.batchSummary(f.batch.id);
  assert.equal(result.state, 'COMPLETED');
  assert.equal(result.counts.sent, count);
  assert.equal(f.gateway.posts.length, count);
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, count);
  assert.equal(f.store.one('SELECT count(*) n FROM auto_batch_outbox')!.n, count);
  assert.equal(
    f.store.one("SELECT count(*) n FROM model_calls WHERE stage='SEARCH'")!.n,
    searchCalls,
  );
  assert.equal(result.items.length, count);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, count);
});
test('closed batch: approval, version/material changes, explicit reprepare and fresh approval', async (t) => {
  const f = await prepared(t),
    d = f.service.draftRows()[0];
  f.store.exec('UPDATE drafts SET payload_hash=? WHERE id=?', 'synthetic-changed', d.id);
  await f.service.startBatch(f.batch.id);
  f.advance();
  await f.service.dispatchOne();
  let b = f.service.batchSummary(f.batch.id);
  assert.equal(b.state, 'NEEDS_REPREPARATION');
  assert.equal(f.gateway.posts.length, 0);
  f.store.exec('UPDATE drafts SET payload_hash=? WHERE id=?', d.payload_hash, d.id);
  b = f.service.reprepareBatch(b.id);
  assert.equal(b.revision, 2);
  assert.equal(b.approved_at, null);
  await assert.rejects(() => f.service.startBatch(b.id), { code: 'BATCH_APPROVAL_REQUIRED' });
  f.service.approveClosedBatch(b.id, { approvalHash: b.approvalHash, confirmed: true });
  await f.service.startBatch(b.id);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
});
test('closed batch: Stop/restart never resumes; persistent allowance covers previous sessions and days', async (t) => {
  const f = await setup(t, false, true, false, true);
  f.service.configurePolicy({ ...f.policy, sessionLimit: 1 });
  await f.service.startLibraryResearch(undefined, 8);
  await f.service.tick();
  f.service.control('stop');
  f.service.finishPartial();
  const b = f.service.prepareBatch({
    drafts: f.service.draftRows().map((d) => ({ id: d.id, version: d.version })),
  });
  f.service.approveClosedBatch(b.id, { approvalHash: b.approvalHash, confirmed: true });
  await f.service.startBatch(b.id);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  f.service.control('stop');
  f.advance(86400000);
  const restarted = new AutoPolicyJobHunter(f.store, f.options);
  await restarted.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  await restarted.startBatch(b.id);
  f.advance();
  await restarted.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(restarted.state().status, 'SESSION_LIMIT');
  restarted.control('stop');
});
test('closed batch: uncertain attempt stays visible and blocks explicit resume without repeating POST', async (t) => {
  const f = await prepared(t);
  f.gateway.send = async () => {
    throw Error('after-action-unknown');
  };
  await f.service.startBatch(f.batch.id);
  f.advance();
  await f.service.dispatchOne();
  const b = f.service.batchSummary(f.batch.id);
  assert.equal(b.state, 'NEEDS_RESOLUTION');
  assert.equal(b.counts.uncertain, 1);
  f.service.control('stop');
  await assert.rejects(() => f.service.startBatch(b.id), { code: 'SEND_UNKNOWN' });
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 1);
});
test('closed batch serializes concurrent Start and dispatch without losing its scope', async (t) => {
  const f = await prepared(t);
  const starts = await Promise.allSettled([
    f.service.startBatch(f.batch.id),
    f.service.startBatch(f.batch.id),
  ]);
  assert.equal(starts.filter((s) => s.status === 'fulfilled').length, 1);
  assert.equal(f.store.one('SELECT count(*) n FROM auto_sessions')!.n, 1);
  assert.equal(
    f.store.one('SELECT count(*) n FROM auto_batch_sessions WHERE batch_id=?', f.batch.id)!.n,
    1,
  );
  f.advance();
  await Promise.all([f.service.dispatchOne(), f.service.dispatchOne()]);
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 1);
});
test('cancelled packet is bound atomically to its batch; fresh resume keeps it and reserves only the new attempt', async (t) => {
  const f = await prepared(t),
    approve = GmailJobHunter.prototype.approveDelivery;
  GmailJobHunter.prototype.approveDelivery = async function (input) {
    const result = await approve.call(this, input);
    if (this === f.service) this.control('stop');
    return result;
  };
  try {
    await f.service.startBatch(f.batch.id);
    f.advance();
    await f.service.dispatchOne();
  } finally {
    GmailJobHunter.prototype.approveDelivery = approve;
  }
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
  const cancelled = f.service.batchSummary(f.batch.id).items[0].packets;
  assert.equal(cancelled.length, 1);
  assert.equal(cancelled[0].status, 'CANCELLED');
  await f.service.startBatch(f.batch.id);
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.batchSummary(f.batch.id).items[0].packets.length, 2);
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 1);
});
test('failed batch Start revokes all authority and cannot become continuous AUTO', async (t) => {
  const f = await prepared(t),
    exec = f.store.exec.bind(f.store),
    runs = f.store.one('SELECT count(*) n FROM runs')!.n;
  f.store.exec = (sql, ...args) => {
    if (sql.startsWith('INSERT INTO auto_batch_sessions'))
      throw Error('SYNTHETIC_BATCH_LINK_FAILURE');
    return exec(sql, ...args);
  };
  try {
    await assert.rejects(() => f.service.startBatch(f.batch.id), /SYNTHETIC_BATCH_LINK_FAILURE/);
  } finally {
    f.store.exec = exec;
  }
  assert.equal(f.service.state().stopped, true);
  assert.equal(f.service.deliveryAuthority().enabled, false);
  f.advance();
  await f.service.tick();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM runs')!.n, runs);
});
test('legacy material without a recorded control cannot be presented as a prepared ready item', async (t) => {
  const f = await prepared(t),
    d = f.service.draftRows()[0];
  f.store.exec('DELETE FROM research_draft_materials WHERE draft_id=?', d.id);
  const b = f.service.prepareBatch({ drafts: [{ id: d.id, version: d.version }] });
  assert.equal(b.counts.remaining, 0);
  assert.equal(b.counts.needsPreparation, 1);
  f.service.approveClosedBatch(b.id, { approvalHash: b.approvalHash, confirmed: true });
  await assert.rejects(() => f.service.startBatch(b.id), { code: 'BATCH_EMPTY' });
});
test('negative semantic review stays unready during preparation and cannot acquire a send reservation', async (t) => {
  const f = await prepared(t),
    d = f.service.draftRows()[0];
  f.store.exec(
    'UPDATE research_drafts SET semantic_review=? WHERE draft_id=?',
    JSON.stringify({ supported: false, issues: ['Synthetic unsupported claim'] }),
    d.id,
  );
  const b = f.service.prepareBatch({ drafts: [{ id: d.id, version: d.version }] });
  assert.equal(b.counts.remaining, 0);
  assert.equal(b.items[0].code, 'SEMANTIC_REVIEW_REQUIRED');
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 0);
});
test('batch preparation checks publication authority before any private history read', async (t) => {
  const f = await setup(t, true, false, true, true);
  f.service.search.search = async () => ({
    queries: ['synthetic directory'],
    urls: [
      {
        url: 'https://fixture.example.test/careers',
        contactUrl: 'https://directory.example.test/contact',
      },
    ],
  });
  await f.service.startLibraryResearch('Synthetic library contact provenance', 8);
  await f.service.tick();
  f.service.control('stop');
  f.service.finishPartial();
  const d = f.service.draftRows()[0],
    b = f.service.prepareBatch({ drafts: [{ id: d.id, version: d.version }] });
  assert.equal(b.counts.remaining, 0);
  assert.equal(b.items[0].code, 'CONTACT_POLICY');
  assert.equal(f.gateway.posts.length, 0);
});
test('a new consciously approved research scope creates a new draft version without a false protected-data stop', async (t) => {
  const f = await prepared(t),
    old = f.service.draftRows()[0],
    versions = f.store.all('SELECT * FROM draft_versions');
  f.service.configurePolicy({
    ...f.policy,
    searchScope: 'Nowy fikcyjny zakres: backend, integracje i dokumenty',
  });
  await f.service.startLibraryResearch('Drugi odrębny fikcyjny kierunek researchu', 8);
  await f.service.tick();
  assert.ok(f.service.draftRows()[0].version > old.version);
  assert.equal(f.service.researchController().check(), true);
  for (const version of versions)
    assert.deepEqual(f.store.one('SELECT * FROM draft_versions WHERE id=?', version.id), version);
  f.service.control('stop');
});
