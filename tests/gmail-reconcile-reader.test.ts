import test from 'node:test';
import assert from 'node:assert/strict';
import { GmailApi } from '../apps/server/src/gmail/reader.js';
import { FixtureGmail } from './gmail-fixture.js';
import { prepareMime } from '../apps/server/src/gmail/mime.js';

test('reconcile reader: utrata odpowiedzi i zmiana RFC ID nadal wskazuje ograniczonego kandydata', async () => {
  const info = new FixtureGmail().info;
  const now = Date.now();
  const prepared = await prepareMime({
    sender: info.email,
    recipient: 'hr@example.test',
    subject: 'Próba Żółć',
    body: 'Dokładny tekst',
    cv: null,
  });
  const rewritten = Buffer.from(
    prepared.mime.toString().replace(prepared.messageId, '<rewritten@mail.gmail.com>'),
  );
  const calls: URL[] = [];
  const g = new GmailApi(
    async () => ({ account: info, bearer: 'fictional' }),
    async (url) => {
      const u = new URL(String(url));
      calls.push(u);
      if (u.pathname.endsWith('/messages'))
        return Response.json(
          u.searchParams.get('q')?.includes('after:')
            ? { messages: [{ id: 'candidate', threadId: 'thread' }] }
            : { messages: [] },
        );
      if (u.searchParams.get('format') === 'raw')
        return Response.json({
          id: 'candidate',
          threadId: 'thread',
          labelIds: ['SENT'],
          internalDate: String(now),
          raw: rewritten.toString('base64url'),
        });
      return Response.json({
        id: 'candidate',
        threadId: 'thread',
        labelIds: ['SENT'],
        internalDate: String(now),
        payload: {
          headers: [
            { name: 'From', value: info.email },
            { name: 'To', value: 'hr@example.test' },
            { name: 'Subject', value: 'Próba Żółć' },
            { name: 'Message-ID', value: '<rewritten@mail.gmail.com>' },
          ],
        },
      });
    },
  );
  const result = await g.sent({
    messageId: prepared.messageId,
    scope: {
      accountSubject: info.subject,
      accountEmail: info.email,
      recipient: 'hr@example.test',
      after: now - 120000,
      before: now + 600000,
    },
  });
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].raw, rewritten);
  assert.ok(calls.some((u) => u.searchParams.get('q')?.includes('to:hr@example.test')));
});

for (const scenario of [
  'two-pages',
  'second-page-error',
  'repeat-cursor',
  'message-limit',
  'incomplete-list',
  'missing-raw',
  'read-timeout',
  'read-limit',
  'account-switch',
  'no-read-scope',
] as const)
  test(`reconcile reader: ${scenario}, pełny odczyt lub jawny błąd`, async () => {
    const info = new FixtureGmail().info,
      now = Date.now();
    const p = await prepareMime({
      sender: info.email,
      recipient: 'hr@example.test',
      subject: 'Fikcyjny',
      body: 'Cały tekst '.repeat(4000),
      cv: null,
    });
    const headers = [
      { name: 'From', value: info.email },
      { name: 'To', value: 'hr@example.test' },
      { name: 'Subject', value: 'Fikcyjny' },
      { name: 'Message-ID', value: p.messageId },
    ];
    let requests = 0,
      rawReads = 0,
      credentials = 0;
    const g = new GmailApi(
      async () => ({
        account:
          scenario === 'account-switch' && ++credentials > 2
            ? { ...info, subject: 'another-account' }
            : scenario === 'no-read-scope'
              ? { ...info, scopes: [] }
              : info,
        bearer: 'fictional',
      }),
      async (url) => {
        requests++;
        const u = new URL(String(url));
        if (scenario === 'read-timeout')
          throw new DOMException('fictional timeout', 'TimeoutError');
        if (scenario === 'read-limit')
          return new Response('', { status: 429, headers: { 'Retry-After': '2' } });
        if (u.pathname.endsWith('/messages')) {
          if (scenario === 'incomplete-list') return Response.json({});
          if (scenario === 'message-limit')
            return Response.json({
              messages: Array.from({ length: 51 }, (_, i) => ({
                id: `id-${i}`,
                threadId: 'thread',
              })),
            });
          if (u.searchParams.has('pageToken') && scenario === 'second-page-error')
            return new Response('', { status: 403 });
          return Response.json({
            messages: [
              { id: u.searchParams.has('pageToken') ? 'second' : 'first', threadId: 'thread' },
            ],
            ...(scenario === 'repeat-cursor' || !u.searchParams.has('pageToken')
              ? { nextPageToken: 'next' }
              : {}),
          });
        }
        const id = u.pathname.split('/').at(-1)!;
        if (u.searchParams.get('format') === 'raw') {
          rawReads++;
          return Response.json({
            id,
            threadId: 'thread',
            labelIds: ['SENT'],
            internalDate: String(now),
            ...(scenario === 'missing-raw' ? {} : { raw: p.mime.toString('base64url') }),
          });
        }
        return Response.json({
          id,
          threadId: 'thread',
          labelIds: ['SENT'],
          internalDate: String(now),
          payload: { headers },
        });
      },
    );
    const call = () =>
      g.sent({
        messageId: p.messageId,
        scope: {
          accountEmail: info.email,
          accountSubject: info.subject,
          recipient: 'hr@example.test',
          after: now - 120000,
          before: now + 600000,
        },
      });
    if (scenario === 'two-pages') {
      const candidates = await call();
      assert.equal(candidates.length, 2);
      assert.deepEqual(candidates[1].raw, p.mime);
      assert.equal(rawReads, 2);
    } else {
      await assert.rejects(call);
      if (scenario !== 'missing-raw') assert.equal(rawReads, 0);
      if (scenario === 'no-read-scope') assert.equal(requests, 0);
    }
  });

test('reconcile reader: pełny RAW z PDF większym niż limit dawnego odczytu metadanych', async () => {
  const info = new FixtureGmail().info,
    now = Date.now();
  const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(4 * 1024 * 1024, 65)]);
  const { hash } = await import('../apps/server/src/util.js');
  const p = await prepareMime({
    sender: info.email,
    recipient: 'hr@example.test',
    subject: 'Fikcyjny',
    body: 'Pełny PDF',
    cv: { name: 'Synthetic.pdf', bytes: pdf, sha256: hash(pdf), approved: true },
  });
  const g = new GmailApi(
    async () => ({ account: info, bearer: 'fictional' }),
    async (url) => {
      const u = new URL(String(url));
      if (u.pathname.endsWith('/messages'))
        return Response.json({ messages: [{ id: 'candidate', threadId: 'thread' }] });
      return Response.json({
        id: 'candidate',
        threadId: 'thread',
        labelIds: ['SENT'],
        internalDate: String(now),
        ...(u.searchParams.get('format') === 'raw'
          ? { raw: p.mime.toString('base64url') }
          : {
              payload: {
                headers: [
                  { name: 'From', value: info.email },
                  { name: 'To', value: 'hr@example.test' },
                  { name: 'Subject', value: 'Fikcyjny' },
                  { name: 'Message-ID', value: p.messageId },
                ],
              },
            }),
      });
    },
  );
  const result = await g.sent({
    messageId: p.messageId,
    scope: {
      accountEmail: info.email,
      accountSubject: info.subject,
      recipient: 'hr@example.test',
      after: now - 120000,
      before: now + 600000,
    },
  });
  assert.deepEqual(result[0].raw, p.mime);
});
