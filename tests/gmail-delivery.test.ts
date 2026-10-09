import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { GmailApi, parseGmailMessage, decodeSubject } from '../apps/server/src/gmail/reader.js';
import { DomainError, hash } from '../apps/server/src/util.js';
import { gmailReadScope, grantedScopes, gmailSendScope } from '../apps/server/src/gmail/oauth.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { FixtureGmail } from './gmail-fixture.js';
import { createApp } from '../apps/server/src/app.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { prepareMime } from '../apps/server/src/gmail/mime.js';

async function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-e4-')),
    store = new Store(dir),
    gateway = new FixtureGmail(),
    runner = new FixtureRunner(),
    reader = new FixtureReader();
  const options = { gateway, accountInfo: () => gateway.info, runner, reader };
  const service = new GmailJobHunter(store, options);
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const d = service.draftRows()[0];
  assert.ok(d);
  service.reviewDraft(d.id, d.version);
  const cv = service.uploadCV(
    'Fictional_CV.pdf',
    Buffer.from('%PDF-1.4\nFictional CV\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  const drafts = [{ id: d.id, version: d.version }];
  return { dir, store, gateway, runner, reader, service, d, cv, drafts, options };
}
async function selfTest(f: Awaited<ReturnType<typeof setup>>) {
  const p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  assert.equal(f.service.outboxRows()[0].status, 'SENT_CONFIRMED');
  return p;
}
async function ready(t: TestContext) {
  const f = await setup(t);
  await selfTest(f);
  await f.service.checkHistory({ drafts: f.drafts, consent: true });
  return f;
}
test('E4: jawny reset dzienny zachowuje historię i pozwala na nową zatwierdzoną próbę', async (t) => {
  const f = await setup(t);
  for (let i = 0; i < 10; i++) await selfTest(f);
  f.service.control('pause');
  const history = ['send_attempts', 'usage_ledger', 'outbox', 'drafts', 'cv_assets'].map((table) =>
    f.store.all(`SELECT * FROM ${table} ORDER BY rowid`),
  );
  const quota = f.service.dailyQuota();
  assert.equal(quota.used, 10);
  assert.throws(
    () =>
      f.service.resetDailyQuota({
        confirmed: false,
        day: quota.day,
        expectedTotalUsed: 10,
      }),
    (e: any) => e.code === 'QUOTA_CONFIRMATION_REQUIRED',
  );
  f.store.set('killSwitch', true);
  const reset = f.service.resetDailyQuota({
    confirmed: true,
    day: quota.day,
    expectedTotalUsed: 10,
  });
  assert.equal(reset.used, 0);
  assert.equal(reset.totalUsed, 10);
  assert.equal(reset.limit, 10);
  assert.equal(f.service.dashboard().stats.reserved, 0);
  assert.equal(f.service.dashboard().stats.sent, 10);
  assert.equal(f.store.get('gmailSenderPaused', false), true);
  assert.equal(f.store.get('killSwitch', false), true);
  assert.equal(f.gateway.posts.length, 10);
  assert.deepEqual(
    ['send_attempts', 'usage_ledger', 'outbox', 'drafts', 'cv_assets'].map((table) =>
      f.store.all(`SELECT * FROM ${table} ORDER BY rowid`),
    ),
    history,
  );
  assert.equal(
    f.store.one("SELECT count(*) n FROM audit_events WHERE action='GMAIL_DAILY_QUOTA_RESET'")!.n,
    1,
  );
  f.store.set('killSwitch', false);
  await selfTest(f);
  assert.equal(f.gateway.posts.length, 11);
  assert.equal(f.service.dailyQuota().used, 1);
  assert.equal(f.service.dailyQuota().totalUsed, 11);
});
test('E4: reset odrzuca nieaktualny licznik/dzień i niepewne lub oczekujące próby', async (t) => {
  const f = await setup(t);
  await selfTest(f);
  f.service.control('pause');
  const quota = f.service.dailyQuota();
  for (const input of [
    { confirmed: true, day: '1900-01-01', expectedTotalUsed: 1 },
    { confirmed: true, day: quota.day, expectedTotalUsed: 0 },
  ])
    assert.throws(
      () => f.service.resetDailyQuota(input),
      (e: any) => e.code === 'QUOTA_CHANGED',
    );
  for (const status of ['QUEUED', 'SENDING', 'SEND_UNKNOWN', 'SENT_PROVIDER']) {
    f.store.exec('UPDATE outbox SET status=?', status);
    assert.throws(
      () =>
        f.service.resetDailyQuota({
          confirmed: true,
          day: quota.day,
          expectedTotalUsed: 1,
        }),
      (e: any) => e.code === 'QUOTA_BUSY',
    );
  }
  f.store.exec("UPDATE outbox SET status='SENT_CONFIRMED'");
  f.store.set('gmailSenderPaused', false);
  assert.throws(
    () =>
      f.service.resetDailyQuota({
        confirmed: true,
        day: quota.day,
        expectedTotalUsed: 1,
      }),
    (e: any) => e.code === 'QUOTA_BUSY',
  );
  assert.equal(f.store.get('gmailDailyQuotaReset', null), null);
  assert.equal(f.gateway.posts.length, 1);
});
test('E4: reset nie obchodzi limitu kampanii; obcy, dawny lub uszkodzony reset nie daje kredytu', async (t) => {
  const f = await setup(t);
  f.store.exec('UPDATE campaigns SET daily_limit=1,campaign_limit=2');
  await selfTest(f);
  f.service.control('pause');
  const quota = f.service.dailyQuota();
  for (const marker of [
    { campaignId: 'other', day: quota.day, baseline: 1 },
    { campaignId: 'research', day: '1900-01-01', baseline: 1 },
    { campaignId: 'research', day: quota.day, baseline: 2 },
    { campaignId: 'research', day: quota.day, baseline: -1 },
    { campaignId: 'research', day: quota.day, baseline: 0.5 },
  ]) {
    f.store.set('gmailDailyQuotaReset', marker);
    assert.equal(f.service.dailyQuota().used, 1);
  }
  f.service.resetDailyQuota({ confirmed: true, day: quota.day, expectedTotalUsed: 1 });
  await selfTest(f);
  f.service.control('pause');
  f.service.resetDailyQuota({ confirmed: true, day: quota.day, expectedTotalUsed: 2 });
  const p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 2);
  assert.equal(f.service.outboxRows()[0].status, 'BLOCKED');
  assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, 2);
});
test('E4: wskazany osobisty adres testu jest zamrożony w podglądzie; wiadomość nie kontaktuje firmy', async (t) => {
  const f = await setup(t);
  f.service.setTestRecipient('personal@example.test');
  const p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
  assert.equal(p.items[0].recipient, 'personal@example.test');
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.gateway.posts[0].recipient, 'personal@example.test');
  assert.equal(f.service.outboxRows()[0].status, 'SENT_CONFIRMED');
  assert.equal(
    f.store.one('SELECT history_status FROM companies WHERE id=?', f.d.company_id)!.history_status,
    'NEW',
  );
});
test('E4: zmiana osobistego adresu po podglądzie unieważnia starszy podgląd', async (t) => {
  const f = await setup(t),
    p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
  f.service.setTestRecipient('personal@example.test');
  await assert.rejects(() =>
    f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true }),
  );
  assert.equal(f.gateway.posts.length, 0);
});
test('E4: krótki test ma zamrożoną treść bez linków i CV, wymaga zgody i zużywa limit', async (t) => {
  const f = await setup(t);
  f.service.setTestRecipient('diagnostic@example.test');
  const original = f.store.all('SELECT * FROM drafts');
  const p = await f.service.prepareDelivery({
    drafts: f.drafts,
    cvId: f.cv.id,
    kind: 'SELF_TEST',
    diagnostic: true,
  });
  assert.equal(p.diagnostic, 1);
  assert.equal(p.cvName, null);
  assert.equal(p.items[0].recipient, 'diagnostic@example.test');
  assert.doesNotMatch(p.items[0].body, /https?:|www\./i);
  const bytes = Buffer.from(p.items[0].base64, 'base64');
  assert.doesNotMatch(
    bytes.toString(),
    /application\/pdf|Content-Disposition: attachment|multipart\/mixed/i,
  );
  assert.equal(f.gateway.posts.length, 0);
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.deepEqual(f.gateway.posts[0].mime, bytes);
  assert.equal(f.service.outboxRows()[0].status, 'SENT_CONFIRMED');
  assert.equal(f.store.all('SELECT * FROM usage_ledger').length, 1);
  assert.equal(f.store.one('SELECT cv_hash FROM send_attempts')!.cv_hash, null);
  assert.equal(f.service.deliveryState().selfTestConfirmed, false);
  assert.equal(
    f.store.one('SELECT history_status FROM companies WHERE id=?', f.d.company_id)!.history_status,
    'NEW',
  );
  assert.deepEqual(f.store.all('SELECT * FROM drafts'), original);
});
test('E4: krótki test nie jest dozwolony do firm, a zmiana wariantu unieważnia podgląd', async (t) => {
  const f = await setup(t);
  await assert.rejects(() =>
    f.service.prepareDelivery({
      drafts: f.drafts,
      cvId: f.cv.id,
      kind: 'FIRST_CONTACT',
      diagnostic: true,
    }),
  );
  assert.equal(f.store.all('SELECT * FROM gmail_previews').length, 0);
  const p = await f.service.prepareDelivery({
    drafts: f.drafts,
    cvId: f.cv.id,
    kind: 'SELF_TEST',
    diagnostic: true,
  });
  f.store.exec('UPDATE gmail_previews SET diagnostic=0 WHERE id=?', p.id);
  await assert.rejects(() =>
    f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true }),
  );
  assert.equal(f.gateway.posts.length, 0);
});
test('E4: timeout krótkiego testu zachowuje SEND_UNKNOWN i jedną próbę bez ponowienia', async (t) => {
  const f = await setup(t);
  f.gateway.timeout = true;
  const p = await f.service.prepareDelivery({
    drafts: f.drafts,
    cvId: f.cv.id,
    kind: 'SELF_TEST',
    diagnostic: true,
  });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  await f.service.dispatchOne();
  assert.equal(f.service.outboxRows()[0].status, 'SEND_UNKNOWN');
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.store.all('SELECT * FROM usage_ledger').length, 1);
});
test('E4: wariant samego tekstu jest tylko diagnostyczny i zachowuje treść oraz kontrolę bajtów', async (t) => {
  const f = await setup(t);
  await assert.rejects(() =>
    f.service.prepareDelivery({
      drafts: f.drafts,
      cvId: f.cv.id,
      kind: 'SELF_TEST',
      textOnly: true,
    }),
  );
  const base = await f.service.prepareDelivery({
    drafts: f.drafts,
    cvId: f.cv.id,
    kind: 'SELF_TEST',
    diagnostic: true,
  });
  const p = await f.service.prepareDelivery({
    drafts: f.drafts,
    cvId: f.cv.id,
    kind: 'SELF_TEST',
    diagnostic: true,
    textOnly: true,
  });
  assert.equal(p.items[0].body, base.items[0].body);
  assert.equal(p.items[0].subject, base.items[0].subject);
  const mime = Buffer.from(p.items[0].base64, 'base64');
  assert.match(mime.toString(), /Content-Type: text\/plain/);
  assert.doesNotMatch(mime.toString(), /text\/html|application\/pdf|multipart\//);
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  assert.deepEqual(f.gateway.posts[0].mime, mime);
  assert.equal(f.service.outboxRows()[0].status, 'SENT_CONFIRMED');
});
test('E4: test do siebie, zamrożony MIME/CV, potem ręcznie zatwierdzony rzeczywisty przepływ na fikcyjnym Gmailu', async (t) => {
  const f = await ready(t);
  assert.equal(f.service.draftRows()[0].status, 'NEEDS_REVIEW');
  assert.equal(
    f.store.one('SELECT history_status FROM companies WHERE id=?', f.d.company_id)!.history_status,
    'NEW',
  );
  const p = await f.service.prepareDelivery({
    drafts: f.drafts,
    cvId: f.cv.id,
    kind: 'FIRST_CONTACT',
  });
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.store.all('SELECT * FROM outbox').length, 1);
  assert.equal(p.items[0].recipient, 'hr@fixture.example.test');
  const prepared = f.store.one('SELECT mime FROM gmail_preview_items WHERE preview_id=?', p.id)!
    .mime as Buffer;
  assert.match(prepared.toString(), /multipart\/alternative/);
  assert.ok(
    prepared.toString().includes(`From: ${f.service.minimalProfile().name} <owner@example.test>`),
  );
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await Promise.all([f.service.dispatchOne(), f.service.dispatchOne()]);
  assert.equal(f.gateway.posts.length, 2);
  assert.equal(f.gateway.posts[1].mimeHash, p.items[0].mime_hash);
  assert.equal(hash(f.gateway.posts[1].mime), p.items[0].mime_hash);
  assert.ok(f.gateway.posts[1].mime.toString().includes('application/pdf'));
  assert.equal(f.service.outboxRows()[0].status, 'SENT_CONFIRMED');
  assert.equal(f.service.draftRows()[0].status, 'SENT');
  assert.equal(f.service.dashboard().stats.sent, 2);
  await assert.rejects(() =>
    f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' }),
  );
});
for (const mutation of ['draft', 'cv', 'account', 'profile', 'recipient', 'payload'] as const)
  test(`E4: ${mutation} zmienione po podglądzie unieważnia konkretną paczkę`, async (t) => {
    const f = await ready(t),
      p = await f.service.prepareDelivery({
        drafts: f.drafts,
        cvId: f.cv.id,
        kind: 'FIRST_CONTACT',
      });
    if (mutation === 'draft')
      f.service.editDraft(f.d.id, {
        version: f.d.version,
        subject: f.d.subject,
        body: f.d.body + ' Zmieniony tekst.',
      });
    if (mutation === 'cv') {
      const cv = f.service.uploadCV(
        'Other.pdf',
        Buffer.from('%PDF-1.4\nOther\n%%EOF').toString('base64'),
      );
      f.service.approveCV(cv.id);
    }
    if (mutation === 'account')
      f.gateway.info = { ...f.gateway.info, subject: 'other', email: 'other@example.test' };
    if (mutation === 'profile')
      f.store.exec(
        "UPDATE candidate_profiles SET approved_at=NULL,version=version+1 WHERE id='candidate'",
      );
    if (mutation === 'recipient')
      f.store.exec(
        'UPDATE contacts SET email=? WHERE id=?',
        'other@fixture.example.test',
        f.d.contact_id,
      );
    if (mutation === 'payload')
      f.store.exec(
        'UPDATE gmail_preview_items SET mime=? WHERE preview_id=?',
        Buffer.from('tampered'),
        p.id,
      );
    await assert.rejects(() =>
      f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true }),
    );
    assert.equal(f.gateway.posts.length, 1);
  });
test('E4: timeout po przyjęciu blokuje ponowienie, niezgodne Wysłane nie rozstrzygają, poprawne potwierdzenie zachowuje jedną próbę', async (t) => {
  const f = await setup(t);
  f.gateway.timeout = true;
  const p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  const o = f.service.outboxRows()[0];
  assert.equal(o.status, 'SEND_UNKNOWN');
  assert.equal(f.service.state().killSwitch, true);
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  const sent = f.gateway.sentMessages[0];
  sent.to = ['wrong@example.test'];
  assert.deepEqual(await f.service.reconcile(o.id), { confirmed: false });
  sent.to = ['owner@example.test'];
  assert.deepEqual(await f.service.reconcile(o.id), { confirmed: true });
  assert.equal(f.store.get('gmailSenderPaused', false), true);
  assert.equal(f.store.get('killSwitch', false), true);
  assert.equal(f.store.all('SELECT * FROM send_attempts').length, 1);
  assert.equal(f.store.all('SELECT * FROM usage_ledger').length, 1);
  assert.equal(f.service.dashboard().stats.sent, 1);
});
test('E4: Gmail zmienia RFC Message-ID, potwierdzenie wymaga znanego ID dostawcy oraz poprawnego wątku i odbiorcy', async (t) => {
  const f = await setup(t),
    p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
  const original = f.gateway.sent.bind(f.gateway);
  f.gateway.sent = async () => [];
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  const o = f.service.outboxRows()[0],
    m = f.gateway.sentMessages[0];
  assert.equal(o.status, 'SENT_PROVIDER');
  f.gateway.sent = original;
  m.messageId = '<gmail-rewritten@mail.gmail.com>';
  m.threadId = 'wrong-thread';
  assert.deepEqual(await f.service.reconcile(o.id), { confirmed: false });
  m.threadId = 'thread-1';
  m.to = ['wrong@example.test'];
  assert.deepEqual(await f.service.reconcile(o.id), { confirmed: false });
  m.to = ['owner@example.test'];
  assert.deepEqual(await f.service.reconcile(o.id), { confirmed: true });
  assert.equal(
    f.store.one('SELECT message_id FROM send_attempts')!.message_id,
    p.items[0].message_id,
  );
  assert.equal(f.store.get(`gmailProviderMessageId:${o.id}`, ''), m.messageId);
  assert.equal(f.gateway.posts.length, 1);
});
test('E4: znana odmowa i pauza między tokenem a POST nie tworzą dostawy', async (t) => {
  for (const kind of ['reject', 'pause']) {
    const f = await setup(t),
      p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
    await f.service.approveDelivery({
      previewId: p.id,
      previewHash: p.previewHash,
      confirmed: true,
    });
    if (kind === 'reject') f.gateway.reject = true;
    else f.gateway.beforePost = async () => f.service.control('pause');
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.service.outboxRows()[0].status, 'FAILED_NOT_SENT');
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
  }
});
test('E4: restart zachowuje SEND_UNKNOWN, a zatwierdzona kolejka wymaga nowego przeglądu', async (t) => {
  for (const stage of ['QUEUED', 'SENDING']) {
    const f = await setup(t),
      p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
    await f.service.approveDelivery({
      previewId: p.id,
      previewHash: p.previewHash,
      confirmed: true,
    });
    if (stage === 'SENDING') f.store.exec("UPDATE outbox SET status='SENDING'");
    const reopened = new GmailJobHunter(f.store, f.options);
    assert.equal(
      reopened.outboxRows()[0].status,
      stage === 'SENDING' ? 'SEND_UNKNOWN' : 'CANCELLED',
    );
    await reopened.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
  }
});
test('E4: stary kontakt, niepełna historia i zmiana skrzynki blokują uznanie historii za pustą', async (t) => {
  for (const kind of ['previous', 'error', 'marker']) {
    const f = await setup(t);
    await selfTest(f);
    if (kind === 'previous')
      f.gateway.previous = [
        {
          id: 'prior',
          threadId: 'prior-thread',
          labels: ['SENT'],
          from: ['owner@example.test'],
          to: ['hr@fixture.example.test'],
          subject: 'Previous contact',
          messageId: '<prior@example.test>',
          at: new Date().toISOString(),
          body: '',
          category: 'UNCLEAR',
        },
      ];
    if (kind === 'error') f.gateway.errorHistory = true;
    if (kind === 'marker') f.gateway.changeMarker = true;
    if (kind === 'previous') await f.service.checkHistory({ drafts: f.drafts, consent: true });
    else await assert.rejects(() => f.service.checkHistory({ drafts: f.drafts, consent: true }));
    await assert.rejects(() =>
      f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' }),
    );
    assert.equal(f.gateway.posts.length, 1);
    const h = f.store.one('SELECT * FROM gmail_history_checks')!;
    assert.equal(h.status, kind === 'previous' ? 'COMPLETE' : 'ERROR');
    if (kind === 'error') assert.equal(h.page_cursor, 'fictional-next');
  }
});
test('E4: historia jest ponownie sprawdzana tuż przed wysłaniem i blokuje kontakt dodany po podglądzie', async (t) => {
  const f = await ready(t),
    p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  f.gateway.previous = [
    {
      id: 'new-mail',
      threadId: 'new-thread',
      labels: [],
      from: ['hr@fixture.example.test'],
      to: ['owner@example.test'],
      subject: 'Reply',
      messageId: '<new@example.test>',
      at: new Date().toISOString(),
      body: '',
      category: 'UNCLEAR',
    },
  ];
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.outboxRows()[0].status, 'BLOCKED');
});
test('E4: zmiana nadawcy i restart nie usuwają znanej historii kontaktu z firmą', async (t) => {
  for (const direction of ['OUTGOING', 'INCOMING']) {
    const f = await ready(t);
    f.gateway.previous = [
      {
        id: 'earlier-contact',
        threadId: 'earlier-thread',
        labels: direction === 'OUTGOING' ? ['SENT'] : [],
        from: [direction === 'OUTGOING' ? 'owner@example.test' : 'hr@fixture.example.test'],
        to: [direction === 'OUTGOING' ? 'hr@fixture.example.test' : 'owner@example.test'],
        subject: 'Earlier correspondence',
        messageId: '<earlier@example.test>',
        at: new Date().toISOString(),
        body: '',
        category: 'UNCLEAR',
      },
    ];
    await f.service.checkHistory({ drafts: f.drafts, consent: true });
    const history = f.store.all('SELECT * FROM gmail_messages');
    f.gateway.info = { ...f.gateway.info, subject: 'second-account', email: 'second@example.test' };
    f.gateway.previous = [];
    await selfTest(f);
    await f.service.checkHistory({ drafts: f.drafts, consent: true });
    const reopened = new GmailJobHunter(f.store, f.options);
    const attempts = f.store.all('SELECT * FROM send_attempts');
    await assert.rejects(
      () => reopened.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' }),
      (e: any) => e.code === 'GMAIL_CONTACT_HISTORY',
    );
    assert.deepEqual(f.store.all('SELECT * FROM gmail_messages'), history);
    assert.deepEqual(f.store.all('SELECT * FROM send_attempts'), attempts);
    assert.equal(f.gateway.posts.length, 2); // Only the two fictional self tests.
    assert.equal(reopened.deliveryState().paused, true);
  }
});
test('E4: odpowiedź w SELF_TEST starszego nadawcy nie jest kontaktem z firmą', async (t) => {
  const f = await ready(t);
  const o = f.service.outboxRows()[0];
  f.gateway.incoming = [
    {
      id: 'self-test-reply',
      threadId: 'thread-1',
      labels: [],
      from: ['test-recipient@example.test'],
      to: ['owner@example.test'],
      subject: 'Test reply',
      messageId: '<test-reply@example.test>',
      at: new Date().toISOString(),
      body: 'Fictional reply to the test.',
      category: 'UNCLEAR',
    },
  ];
  await f.service.syncReplies(o.id);
  f.gateway.info = { ...f.gateway.info, subject: 'second-account', email: 'second@example.test' };
  await selfTest(f);
  await f.service.checkHistory({ drafts: f.drafts, consent: true });
  const p = await f.service.prepareDelivery({
    drafts: f.drafts,
    cvId: f.cv.id,
    kind: 'FIRST_CONTACT',
  });
  assert.equal(p.kind, 'FIRST_CONTACT');
  assert.equal(f.gateway.posts.length, 2);
  assert.equal(
    f.store.one('SELECT * FROM companies WHERE id=?', f.d.company_id)!.history_status,
    'NEW',
  );
});
test('E4: wcześniejszy kontakt innego konta blokuje zgodę i bramkę bezpośrednio przed POST', async (t) => {
  for (const stage of ['approval', 'post']) {
    const f = await ready(t);
    const p = await f.service.prepareDelivery({
      drafts: f.drafts,
      cvId: f.cv.id,
      kind: 'FIRST_CONTACT',
    });
    const addEarlierContact = () => {
      f.store.exec(
        `INSERT INTO gmail_messages (id,account_subject,provider_id,provider_thread_id,company_id,direction,sender,recipients,subject,message_id,sent_at,created_at)
         VALUES ('earlier','different-account','earlier-provider','earlier-thread',?,'OUTGOING','different@example.test','["hr@fixture.example.test"]','Earlier contact','<earlier@example.test>',?,?)`,
        f.d.company_id,
        new Date().toISOString(),
        new Date().toISOString(),
      );
    };
    if (stage === 'approval') {
      addEarlierContact();
      await assert.rejects(
        () =>
          f.service.approveDelivery({
            previewId: p.id,
            previewHash: p.previewHash,
            confirmed: true,
          }),
        (e: any) => e.code === 'GMAIL_CONTACT_HISTORY',
      );
      assert.equal(
        f.store.one('SELECT approved_at FROM gmail_previews WHERE id=?', p.id)!.approved_at,
        null,
      );
    } else {
      await f.service.approveDelivery({
        previewId: p.id,
        previewHash: p.previewHash,
        confirmed: true,
      });
      f.gateway.beforePost = async () => addEarlierContact();
      await f.service.dispatchOne();
      const firstContact = f.service.outboxRows().find((o) => o.kind === 'FIRST_CONTACT')!;
      assert.equal(firstContact.status, 'FAILED_NOT_SENT');
      await f.service.dispatchOne();
    }
    assert.equal(f.gateway.posts.length, 1);
    assert.equal(
      f.store.one('SELECT history_status FROM companies WHERE id=?', f.d.company_id)!
        .history_status,
      'NEW',
    );
    assert.equal(f.store.one('SELECT count(*) n FROM gmail_messages')!.n, 1);
  }
});
test('E4: historia obejmuje alias i subdomenę w Cc/Bcc, ale odrzuca podobną obcą domenę', async (t) => {
  for (const recipient of [
    'jobs@alias.example.test',
    'jobs@team.alias.example.test',
    'jobs@alias.example.test.other.test',
  ]) {
    const f = await ready(t);
    f.store.exec(
      "INSERT INTO company_aliases VALUES ('alias-domain',?,'DOMAIN','alias.example.test',?,?)",
      f.d.company_id,
      new Date().toISOString(),
      new Date().toISOString(),
    );
    f.gateway.previous = [
      parseGmailMessage({
        id: 'copied-contact',
        threadId: 'copied-thread',
        labelIds: ['SENT'],
        internalDate: String(Date.now()),
        payload: {
          headers: [
            { name: 'From', value: 'owner@example.test' },
            { name: 'To', value: 'unrelated@example.test' },
            { name: recipient.includes('team.') ? 'Bcc' : 'Cc', value: recipient },
            { name: 'Subject', value: 'Earlier correspondence' },
            { name: 'Message-ID', value: '<copied@example.test>' },
          ],
        },
      }),
    ];
    await f.service.checkHistory({ drafts: f.drafts, consent: true });
    assert.match(
      f.gateway.historyQueries.at(-1)!,
      /from:alias\.example\.test to:alias\.example\.test/,
    );
    const prepare = () =>
      f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' });
    if (recipient.endsWith('.other.test')) {
      await prepare();
      assert.equal(f.store.one('SELECT count(*) n FROM gmail_messages')!.n, 0);
    } else {
      await assert.rejects(prepare, (e: any) => e.code === 'GMAIL_CONTACT_HISTORY');
      assert.equal(f.store.one('SELECT count(*) n FROM gmail_messages')!.n, 1);
    }
    assert.equal(f.gateway.posts.length, 1);
  }
});
test('E4: brak zgody, wygasła zgoda i zmiana zakresu firmy blokują odczyt lub podgląd', async (t) => {
  const f = await setup(t);
  await selfTest(f);
  await assert.rejects(
    () => f.service.checkHistory({ drafts: f.drafts, consent: false }),
    (e: any) => e.code === 'READ_CONSENT_REQUIRED',
  );
  assert.equal(f.gateway.historyQueries.length, 0);
  await f.service.checkHistory({ drafts: f.drafts, consent: true });
  const saved = f.store.all('SELECT * FROM gmail_history_checks');
  f.store.exec("UPDATE gmail_history_checks SET consent_expires_at='2000-01-01T00:00:00.000Z'");
  await assert.rejects(
    () => f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' }),
    (e: any) => e.code === 'HISTORY_REQUIRED',
  );
  f.store.exec('UPDATE gmail_history_checks SET consent_expires_at=?', saved[0].consent_expires_at);
  f.store.exec(
    "INSERT INTO company_aliases VALUES ('new-scope',?,'DOMAIN','new-domain.example.test',?,?)",
    f.d.company_id,
    new Date().toISOString(),
    new Date().toISOString(),
  );
  await assert.rejects(
    () => f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' }),
    (e: any) => e.code === 'HISTORY_REQUIRED',
  );
  assert.equal(f.gateway.historyQueries.length, 1);
  assert.equal(f.gateway.posts.length, 1);
});
test('E4: brak uprawnienia, niepewna kontrola faktów i stary dowód blokują wysyłkę do firmy', async (t) => {
  const f = await ready(t);
  f.gateway.info.scopes = f.gateway.info.scopes.filter((s) => s !== gmailReadScope);
  await assert.rejects(
    () => f.service.checkHistory({ drafts: f.drafts, consent: true }),
    /Połącz odczyt/,
  );
  f.gateway.info.scopes.push(gmailReadScope);
  for (const supported of [false, null]) {
    f.store.exec(
      'UPDATE research_drafts SET semantic_review=?',
      JSON.stringify({ supported, issues: [] }),
    );
    await assert.rejects(() =>
      f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' }),
    );
  }
  await f.service.verifyDraft(f.d.id, f.d.version);
  f.store.exec("UPDATE evidence SET fetched_at='2020-01-01T00:00:00Z'");
  await assert.rejects(() =>
    f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' }),
  );
  assert.equal(f.gateway.posts.length, 1);
});
test('E4: quota obejmuje test do siebie i znane/niepewne próby, bez równoległych powtórzeń', async (t) => {
  const f = await ready(t);
  f.store.exec('UPDATE campaigns SET daily_limit=1');
  const p = await f.service.prepareDelivery({
    drafts: f.drafts,
    cvId: f.cv.id,
    kind: 'FIRST_CONTACT',
  });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(f.service.outboxRows()[0].status, 'BLOCKED');
});
test('E4: odpowiedzi tylko w znanym wątku, deduplikacja, ręczna klasyfikacja i blokada odmowy', async (t) => {
  const f = await ready(t),
    p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  const o = f.service.outboxRows()[0],
    sent = f.gateway.sentMessages.at(-1)!;
  f.gateway.incoming = [
    {
      ...sent,
      id: 'reply-1',
      labels: ['INBOX'],
      from: ['hr@fixture.example.test'],
      to: ['owner@example.test'],
      subject: 'Re: ' + sent.subject,
      messageId: '<reply@fixture.example.test>',
      body: 'Fictional reply <script>untrusted data</script>',
    },
  ];
  await f.service.syncReplies(o.id);
  await f.service.syncReplies(o.id);
  assert.equal(f.service.replies().length, 1);
  f.service.reviewReply(f.service.replies()[0].id, 'REJECTED');
  assert.ok(
    f.store.one(
      "SELECT id FROM suppressions WHERE company_id=? AND reason='REJECTED'",
      f.d.company_id,
    ),
  );
  assert.equal(
    f.runner.prompts.some((p) => p.includes('untrusted data')),
    false,
  );
});
test('E4: nowe endpointy są odcięte w DEMO i RESEARCH_ONLY, bez uruchamiania native Gmaila', async (t) => {
  for (const mode of ['DEMO', 'RESEARCH_ONLY'] as const) {
    const dir = mkdtempSync(join(tmpdir(), 'jh-e4-api-')),
      a = await createApp({ dir, port: 4350, mode, worker: false, launchToken: 'fictional-token' });
    t.after(async () => {
      await a.app.close();
      rmSync(dir, { recursive: true, force: true });
    });
    const session = await a.app.inject({
      method: 'POST',
      url: '/api/session',
      headers: { host: '127.0.0.1:4350', origin: 'http://127.0.0.1:4350' },
      payload: { token: 'fictional-token' },
    });
    const headers = {
      host: '127.0.0.1:4350',
      origin: 'http://127.0.0.1:4350',
      cookie: session.headers['set-cookie']!.toString().split(';')[0],
      'x-csrf-token': session.json().csrf,
    };
    const response = await a.app.inject({
      method: 'POST',
      url: '/api/gmail/preview',
      headers,
      payload: {
        drafts: [{ id: 'fictional', version: 1 }],
        cvId: 'fictional-cv',
        kind: 'SELF_TEST',
        diagnostic: true,
      },
    });
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'SEND_DISABLED');
    const quotaReset = await a.app.inject({
      method: 'POST',
      url: '/api/gmail/quota/reset',
      headers,
      payload: { confirmed: true, day: '2026-10-08', expectedTotalUsed: 0 },
    });
    assert.equal(quotaReset.statusCode, 409);
    assert.equal(quotaReset.json().code, 'SEND_DISABLED');
  }
});
test('E4 reader: strony dopiero po kompletnych metadanych, dokładne ID i brak pobierania załączników', async () => {
  const info = new FixtureGmail().info,
    calls: string[] = [],
    pages: any[] = [];
  const message = (id: string) => ({
    id,
    threadId: 'thread',
    labelIds: ['SENT'],
    internalDate: String(Date.now()),
    payload: {
      headers: [
        { name: 'From', value: 'Owner <owner@example.test>' },
        { name: 'To', value: 'HR <hr@example.test>' },
        { name: 'Subject', value: '=?UTF-8?B?SmFuxbxlZw==?=' },
        { name: 'Message-ID', value: `<${id}@example.test>` },
      ],
    },
  });
  const g = new GmailApi(
    async () => ({ account: info, bearer: 'fictional-token' }),
    async (url) => {
      const u = new URL(String(url));
      calls.push(u.pathname + u.search);
      if (u.pathname.endsWith('/messages'))
        return Response.json(
          u.searchParams.has('pageToken')
            ? { messages: [{ id: 'second', threadId: 'thread' }] }
            : { messages: [{ id: 'first', threadId: 'thread' }], nextPageToken: 'next' },
        );
      return Response.json(message(u.pathname.split('/').at(-1)!));
    },
  );
  await g.scan('to:hr@example.test', (messages, next) => pages.push({ messages, next }));
  assert.equal(pages.length, 2);
  assert.equal(pages[0].next, 'next');
  assert.equal(pages[1].next, null);
  assert.equal(
    calls.some((c) => c.includes('/attachments')),
    false,
  );
  assert.ok(calls.filter((c) => c.includes('format=metadata')).length === 2);
  assert.equal(decodeSubject('=?UTF-8?Q?Jakub_=C5=81ewosz?='), 'Jakub Łewosz');
  assert.deepEqual(parseGmailMessage(message('first')).to, ['hr@example.test']);
});
test('E4 OAuth: dodatkowy odczyt tylko w jawnym rozszerzeniu, nadal bez modify/compose', () => {
  const scopes = `openid email ${gmailSendScope} ${gmailReadScope}`;
  assert.throws(() => grantedScopes(scopes));
  assert.ok(grantedScopes(scopes, true).includes(gmailReadScope));
  assert.throws(() =>
    grantedScopes(scopes + ' https://www.googleapis.com/auth/gmail.modify', true),
  );
});
test('E4: ręczna edycja odtwarza deklaracje dla dokładnej treści, nowa wersja wymaga ponownego przeglądu', async (t) => {
  const f = await ready(t),
    body = f.d.body + ' Dopisany tekst w fikcyjnym teście.';
  f.service.editDraft(f.d.id, { version: 1, subject: f.d.subject, body });
  const edited = f.service.draftRows()[0];
  await f.service.verifyDraft(edited.id, edited.version);
  const verified = f.service.draftRows()[0];
  assert.equal(verified.body, body);
  assert.equal(verified.version, 3);
  assert.equal(verified.reviewed_at, null);
  assert.ok(JSON.parse(verified.claims).length);
  const drafts = [{ id: verified.id, version: verified.version }];
  await assert.rejects(() =>
    f.service.prepareDelivery({ drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' }),
  );
  f.service.reviewDraft(verified.id, verified.version);
  const p = await f.service.prepareDelivery({ drafts, cvId: f.cv.id, kind: 'FIRST_CONTACT' });
  assert.equal(p.items[0].body, body);
});
test('E4: zmiana trybu zachowuje profil, wersje i próby, a RESEARCH_ONLY nadal nie wysyła', async (t) => {
  const f = await ready(t),
    profile = f.service.profile(),
    versions = f.store.all('SELECT * FROM draft_versions'),
    attempts = f.store.all('SELECT * FROM send_attempts');
  const research = new ResearchJobHunter(f.store, { runner: f.runner, reader: f.reader });
  assert.equal(research.profile().profile_hash, profile.profile_hash);
  assert.equal(research.profile().approved_at, profile.approved_at);
  assert.deepEqual(f.store.all('SELECT * FROM draft_versions'), versions);
  assert.deepEqual(f.store.all('SELECT * FROM send_attempts'), attempts);
  await assert.rejects(() => research.dispatchOne());
  assert.equal(research.dashboard().stats.sent, 1);
  new GmailJobHunter(f.store, f.options);
  assert.equal(f.gateway.posts.length, 1);
});
test('E4 reader: znany provider ID omija opóźniony indeks wyszukiwarki Wysłanych', async () => {
  const info = new FixtureGmail().info,
    calls: string[] = [];
  const g = new GmailApi(
    async () => ({ account: info, bearer: 'fictional' }),
    async (url) => {
      calls.push(String(url));
      return Response.json({
        id: 'known',
        threadId: 'thread',
        labelIds: ['SENT'],
        internalDate: String(Date.now()),
        payload: {
          headers: [
            { name: 'Message-ID', value: '<fictional@jobhunter.local>' },
            { name: 'From', value: info.email },
            { name: 'To', value: 'hr@example.test' },
            { name: 'Subject', value: 'Kandydatura' },
          ],
        },
      });
    },
  );
  assert.equal(
    (await g.sent({ messageId: '<fictional@jobhunter.local>', providerId: 'known' })).length,
    1,
  );
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes('/messages/known?'));
});
test('E4 reader: powtórzony cursor i nieprawidłowe metadane nie kończą odczytu jako pusta historia', async () => {
  const info = new FixtureGmail().info;
  const g = new GmailApi(
    async () => ({ account: info, bearer: 'fictional' }),
    async () => Response.json({ messages: [], nextPageToken: 'repeated' }),
  );
  let pages = 0;
  await assert.rejects(() => g.scan('to:hr@example.test', () => pages++), /stronicowania/);
  assert.equal(pages, 1);
});
test('E4 reader: HTML odpowiedzi jest tekstem, bez skryptów i bez załącznika PDF w treści', () => {
  const m = parseGmailMessage(
    {
      id: 'reply',
      threadId: 'thread',
      internalDate: String(Date.now()),
      payload: {
        headers: [{ name: 'From', value: 'hr@example.test' }],
        mimeType: 'multipart/mixed',
        parts: [
          {
            mimeType: 'text/html',
            body: {
              data: Buffer.from(
                '<p>Dziękujemy &amp; zapraszamy.</p><script>run()</script>',
              ).toString('base64url'),
            },
          },
          {
            mimeType: 'application/pdf',
            filename: 'file.pdf',
            body: { data: Buffer.from('private attachment').toString('base64url') },
          },
        ],
      },
    },
    true,
  );
  assert.equal(m.body, 'Dziękujemy & zapraszamy.');
  assert.doesNotMatch(m.body, /run|attachment/);
});

for (const scenario of [
  'rewritten',
  'none',
  'many',
  'manual-identical',
  'body',
  'html',
  'attachment',
  'recipient',
  'from',
  'not-sent',
  'time',
] as const)
  test(`reconcile fallback: ${scenario} pozostaje UNKNOWN bez fałszywego potwierdzenia i ponowienia`, async (t) => {
    const f = await setup(t);
    f.gateway.timeout = true;
    const p = await f.service.prepareDelivery({
      drafts: f.drafts,
      cvId: f.cv.id,
      kind: 'SELF_TEST',
    });
    await f.service.approveDelivery({
      previewId: p.id,
      previewHash: p.previewHash,
      confirmed: true,
    });
    await f.service.dispatchOne();
    const o = f.service.outboxRows()[0],
      m = f.gateway.sentMessages[0];
    m.raw = Buffer.from(m.raw!.toString().replace(m.messageId, '<rewritten@mail.gmail.com>'));
    m.messageId = '<rewritten@mail.gmail.com>';
    if (scenario === 'none') f.gateway.sentMessages = [];
    if (scenario === 'many')
      f.gateway.sentMessages.push({
        ...m,
        id: 'manual-copy',
        messageId: '<manual@mail.gmail.com>',
      });
    if (scenario === 'manual-identical') {
      m.id = 'manual-copy';
      m.messageId = '<manual@mail.gmail.com>';
    }
    if (scenario === 'body' || scenario === 'attachment') {
      const bytes = Buffer.from(
        '%PDF-1.4\n' + (scenario === 'attachment' ? 'Different' : 'Fictional CV') + '\n%%EOF',
      );
      const different = await prepareMime({
        sender: f.gateway.info.email,
        senderName: f.service.minimalProfile().name,
        recipient: m.to[0],
        subject: m.subject,
        body: f.d.body + (scenario === 'body' ? '\nDifferent' : ''),
        cv: { name: 'Fictional_CV.pdf', bytes, sha256: hash(bytes), approved: true },
      });
      m.raw = different.mime;
    }
    if (scenario === 'html') {
      const raw = m.raw!.toString();
      assert.match(raw, /dir=3D"ltr"/);
      m.raw = Buffer.from(raw.replace('dir=3D"ltr"', 'dir=3D"rtl"'));
    }
    if (scenario === 'recipient') m.to = ['other@example.test'];
    if (scenario === 'from') m.from = ['other@example.test'];
    if (scenario === 'not-sent') m.labels = ['INBOX'];
    if (scenario === 'time') m.at = '2000-01-01T00:00:00Z';
    assert.deepEqual(await f.service.reconcile(o.id), { confirmed: false });
    assert.equal(f.service.outboxRows()[0].status, 'SEND_UNKNOWN');
    const details = f.store.get<any>(`gmailReconcileCandidates:${o.id}`, null);
    assert.equal(details.complete, true);
    const exact = details.candidates.filter((c: any) => c.comparison?.decodedPartsLF).length;
    assert.equal(
      exact,
      scenario === 'many' ? 2 : ['rewritten', 'manual-identical'].includes(scenario) ? 1 : 0,
    );
    if (exact) assert.match(f.service.outboxRows()[0].reason, /Ręczna identyczna/);
    assert.equal(f.store.get('gmailSenderPaused', false), true);
    assert.equal(f.store.get('killSwitch', false), true);
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 1);
    assert.equal(f.store.all('SELECT * FROM usage_ledger').length, 1);
    assert.equal(f.store.all('SELECT * FROM send_attempts').length, 1);
    assert.equal(f.store.one('SELECT provider_id FROM send_attempts')!.provider_id, null);
  });

for (const scenario of [
  'expired',
  'no-read-scope',
  'changed-account',
  'read-timeout',
  'read-limit',
  'incomplete-pages',
  'deleted-mime',
] as const)
  test(`reconcile: ${scenario} zachowuje historię, UNKNOWN i blokady`, async (t) => {
    const f = await setup(t);
    f.gateway.timeout = true;
    const p = await f.service.prepareDelivery({
      drafts: f.drafts,
      cvId: f.cv.id,
      kind: 'SELF_TEST',
    });
    await f.service.approveDelivery({
      previewId: p.id,
      previewHash: p.previewHash,
      confirmed: true,
    });
    await f.service.dispatchOne();
    const o = f.service.outboxRows()[0];
    let reads = 0;
    const original = f.gateway.sent.bind(f.gateway);
    f.gateway.sent = async (input) => {
      reads++;
      if (['read-timeout', 'read-limit', 'incomplete-pages'].includes(scenario))
        throw new DomainError('GMAIL_READ', 'Fikcyjny niekompletny odczyt.');
      return original(input);
    };
    if (scenario === 'expired')
      f.store.exec("UPDATE gmail_outbox SET read_consent_expires_at='2000-01-01T00:00:00Z'");
    if (scenario === 'no-read-scope')
      f.gateway.info.scopes = f.gateway.info.scopes.filter((s) => s !== gmailReadScope);
    if (scenario === 'changed-account') f.gateway.info.subject = 'another-account';
    if (scenario === 'deleted-mime') f.store.exec("UPDATE send_attempts SET mime=x''");
    if (scenario === 'deleted-mime')
      assert.deepEqual(await f.service.reconcile(o.id), { confirmed: false });
    else await assert.rejects(() => f.service.reconcile(o.id));
    assert.equal(
      reads,
      ['read-timeout', 'read-limit', 'incomplete-pages'].includes(scenario) ? 1 : 0,
    );
    assert.equal(f.service.outboxRows()[0].status, 'SEND_UNKNOWN');
    assert.equal(f.store.get('gmailSenderPaused', false), true);
    assert.equal(f.store.get('killSwitch', false), true);
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 1);
    assert.equal(f.store.all('SELECT * FROM usage_ledger').length, 1);
  });

test('reconcile: tej samej wiadomości Gmaila nie można przypisać dwóm próbom jednego konta', async (t) => {
  const f = await setup(t);
  await selfTest(f);
  const p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  const original = f.gateway.sent.bind(f.gateway);
  f.gateway.sent = async () => [];
  await f.service.dispatchOne();
  f.gateway.sent = original;
  const o = f.service.outboxRows().find((o) => o.status === 'SENT_PROVIDER')!;
  f.store.exec(
    "UPDATE send_attempts SET provider_id='fixture-1',provider_thread_id='thread-1' WHERE outbox_id=?",
    o.id,
  );
  await assert.rejects(
    () => f.service.reconcile(o.id),
    (e: any) => e.code === 'GMAIL_MESSAGE_ASSIGNED',
  );
  assert.equal(f.service.outboxRows().find((row) => row.id === o.id)!.status, 'SENT_PROVIDER');
  assert.equal(f.gateway.posts.length, 2);
});

test('reconcile: zgoda wygasająca podczas odczytu nie pozwala potwierdzić wyniku', async (t) => {
  const f = await setup(t);
  f.gateway.timeout = true;
  const p = await f.service.prepareDelivery({ drafts: f.drafts, cvId: f.cv.id, kind: 'SELF_TEST' });
  await f.service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  await f.service.dispatchOne();
  const o = f.service.outboxRows()[0];
  const original = f.gateway.sent.bind(f.gateway);
  f.gateway.sent = async (input) => {
    f.store.exec("UPDATE gmail_outbox SET read_consent_expires_at='2000-01-01T00:00:00Z'");
    return original(input);
  };
  await assert.rejects(
    () => f.service.reconcile(o.id),
    (e: any) => e.code === 'READ_CONSENT_REQUIRED',
  );
  assert.equal(f.service.outboxRows()[0].status, 'SEND_UNKNOWN');
  assert.equal(f.store.get('killSwitch', false), true);
  assert.equal(f.store.get('gmailSenderPaused', false), true);
  assert.equal(f.gateway.posts.length, 1);
});
