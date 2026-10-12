import test from 'node:test';
import assert from 'node:assert/strict';
import { GmailApi, parseGmailMessage } from '../apps/server/src/gmail/reader.js';
import { FixtureGmail } from './gmail-fixture.js';
import { setup } from './auto-fixture.js';
import {
  confirmPriorApplications,
  companyHistoryBlocks,
} from '../apps/server/src/prior-applications.js';

const email = 'hr@fixture.example.test';
const info = new FixtureGmail().info;
const cutoff = '2026-10-12T00:00:00.000Z';
function message(part: object, sent = false, recipient = email) {
  return {
    id: 'prior-message',
    threadId: 'prior-thread',
    labelIds: sent ? ['SENT'] : ['INBOX'],
    internalDate: String(Date.parse('2026-10-01T12:00:00.000Z')),
    payload: {
      headers: [
        { name: 'From', value: sent ? info.email : recipient },
        { name: 'To', value: sent ? recipient : info.email },
        { name: 'Subject', value: 'Wcześniejsza korespondencja' },
        { name: 'Message-ID', value: '<prior@example.test>' },
      ],
      ...part,
    },
  };
}
const plain = (text: string) => ({
  mimeType: 'text/plain',
  body: { data: Buffer.from(text).toString('base64url') },
});

for (const [name, part, expected] of [
  ['complete Polish reply', plain('Dziękujemy za przesłane zgłoszenie.'), 'CLEAR'],
  ['Polish opt-out', plain('Proszę nie kontaktować się z nami ponownie.'), 'OPT_OUT'],
  ['Polish request not to write again', plain('Proszę już do nas nie pisać.'), 'OPT_OUT'],
  ['English opt-out', plain('Please stop contacting us.'), 'OPT_OUT'],
  [
    'HTML alternative opt-out',
    {
      mimeType: 'multipart/alternative',
      parts: [
        plain('Dziękujemy.'),
        {
          mimeType: 'text/html',
          body: {
            data: Buffer.from('<p>Prosimy o zaprzestanie dalszego kontaktu.</p>').toString(
              'base64url',
            ),
          },
        },
      ],
    },
    'OPT_OUT',
  ],
  ['overlong reply', plain('Fikcyjny tekst '.repeat(3000)), 'UNKNOWN'],
  [
    'attachment only',
    { mimeType: 'application/pdf', filename: 'reply.pdf', body: { attachmentId: 'never-fetch' } },
    'UNKNOWN',
  ],
  ['invalid base64', { mimeType: 'text/plain', body: { data: '???' } }, 'UNKNOWN'],
  ['missing body', { mimeType: 'text/plain', body: {} }, 'UNKNOWN'],
] as const)
  test(`private opt-out parser: ${name}`, () => {
    assert.equal(parseGmailMessage(message(part), true, true).priorContactCheck, expected);
  });

for (const mode of ['old-incoming', 'old-outgoing', 'unrelated', 'no-exception'] as const)
  test(`targeted reader bounds body access: ${mode}`, async () => {
    const calls: URL[] = [];
    const raw = message(
      plain('Dziękujemy za zgłoszenie.'),
      mode === 'old-outgoing',
      mode === 'unrelated' ? 'other@unrelated.example.test' : email,
    );
    const reader = new GmailApi(
      async () => ({ account: info, bearer: 'fictional' }),
      async (url) => {
        const u = new URL(String(url));
        calls.push(u);
        if (u.pathname.endsWith('/messages'))
          return Response.json({ messages: [{ id: raw.id, threadId: raw.threadId }] });
        return Response.json(
          u.searchParams.get('format') === 'full'
            ? raw
            : { ...raw, payload: { headers: raw.payload.headers } },
        );
      },
    );
    const rows: any[] = [];
    await reader.scan(
      `from:${email} OR to:${email}`,
      (page) => rows.push(...page),
      info,
      mode === 'no-exception'
        ? 1000
        : { priorApplicationsBefore: cutoff, email, domains: ['fixture.example.test'] },
    );
    assert.equal(
      calls.filter((u) => u.searchParams.get('format') === 'full').length,
      mode === 'old-incoming' ? 1 : 0,
    );
    assert.equal(calls.filter((u) => /attachments/.test(u.pathname)).length, 0);
    assert.equal(rows[0].priorContactCheck, mode === 'old-incoming' ? 'CLEAR' : undefined);
    assert.ok(calls.filter((u) => u.searchParams.get('format') === 'metadata').length === 1);
  });

test('old complete reply allows one contact; private message never enters model prompts', async (t) => {
  const f = await setup(t, false, false, false, true);
  confirmPriorApplications(f.store, true, f.options.clock());
  f.service.configurePolicy(f.policy);
  const prompts: string[] = [];
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    prompts.push(prompt);
    return run(prompt, schema, options);
  };
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  f.gateway.previous = [
    {
      id: 'old-reply',
      threadId: 'old-thread',
      labels: ['INBOX'],
      from: [d.email],
      to: [f.gateway.info.email],
      subject: 'Wcześniejsza odpowiedź',
      messageId: '<old-reply@example.test>',
      at: '2026-10-01T12:00:00.000Z',
      body: 'PrivateFixtureContentNeverSentToModel',
      category: 'UNCLEAR',
      priorContactCheck: 'CLEAR',
    },
  ];
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(
    prompts.some((p) => p.includes('PrivateFixtureContentNeverSentToModel')),
    false,
  );
  assert.equal(
    f.store.one('SELECT prior_contact_check FROM gmail_messages')!.prior_contact_check,
    'CLEAR',
  );
});

test('explicit opt-out creates a durable suppression that a later clear reply cannot erase', async (t) => {
  const f = await setup(t, false, false, false, true);
  confirmPriorApplications(f.store, true, f.options.clock());
  f.service.configurePolicy(f.policy);
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  f.gateway.previous = [
    {
      id: 'old-refusal',
      threadId: 'old-thread',
      labels: ['INBOX'],
      from: [d.email],
      to: [f.gateway.info.email],
      subject: 'Prośba o zaprzestanie kontaktu',
      messageId: '<old-refusal@example.test>',
      at: '2026-10-01T12:00:00.000Z',
      body: 'Proszę nie pisać ponownie.',
      category: 'UNCLEAR',
      priorContactCheck: 'OPT_OUT',
    },
  ];
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(
    f.store.one('SELECT suppression_reason FROM companies WHERE id=?', d.company_id)!
      .suppression_reason,
    'DO_NOT_CONTACT',
  );
  f.gateway.previous[0] = {
    ...f.gateway.previous[0],
    body: 'Fikcyjny inny tekst.',
    priorContactCheck: 'CLEAR',
  };
  await f.service.checkHistory({ drafts: [{ id: d.id, version: d.version }], consent: true });
  assert.equal(
    f.store.one('SELECT prior_contact_check FROM gmail_messages')!.prior_contact_check,
    'OPT_OUT',
  );
  assert.equal(
    companyHistoryBlocks(f.store, f.store.one('SELECT * FROM companies WHERE id=?', d.company_id)!),
    true,
  );
  assert.equal(f.gateway.posts.length, 0);
});
