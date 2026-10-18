import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicSourceReader } from '../apps/server/src/research/fetcher.js';
import { parsePublicHTML, parserVersion } from '../apps/server/src/research/html.js';
import {
  contactSourceAuthority,
  sourceComplete,
} from '../apps/server/src/research/source-policy.js';
import { setup } from './auto-fixture.js';

async function page(body: string, type = 'text/html', url = 'https://firm.example.test/') {
  return new PublicSourceReader({
    resolve: async () => [{ address: '93.184.216.34', family: 4 }] as any,
    transport: async () => ({ status: 200, contentType: type, body }),
  }).read(url);
}
test('identity conflict is detected before contacts, drafts or aliases can move to another owner', async (t) => {
  const f = await setup(t, true, false, false, true);
  const a = f.service.findOrCreateCompany('Fixture Company', null).company;
  const b = f.service.findOrCreateCompany('Company B', 'fixture.example.test').company;
  f.service.suppress(a.id, 'OPT_OUT', 'Synthetic block', 'user');
  const before = f.store.all('SELECT * FROM companies ORDER BY id');
  const aliases = f.store.all('SELECT * FROM company_aliases ORDER BY id');
  const blocks = f.store.all('SELECT * FROM suppressions ORDER BY id');
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.store.one('SELECT count(*) n FROM contacts WHERE company_id=?', b.id)!.n, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM drafts WHERE company_id=?', b.id)!.n, 0);
  assert.deepEqual(f.store.all('SELECT * FROM companies ORDER BY id'), before);
  assert.deepEqual(f.store.all('SELECT * FROM company_aliases ORDER BY id'), aliases);
  assert.deepEqual(f.store.all('SELECT * FROM suppressions ORDER BY id'), blocks);
  assert.equal(f.gateway.posts.length, 0);
});
for (const type of ['text/plain', 'text/html'])
  for (const length of [99999, 100000, 100001])
    test('source completeness boundary ' + type + ' ' + length, async () => {
      const s = await page(
        type === 'text/html' ? '<p>' + 'z'.repeat(length) + '</p>' : 'z'.repeat(length),
        type,
      );
      assert.equal(s.status, length > 100000 ? 'INCOMPLETE' : 'READ');
      assert.equal(sourceComplete(s), length <= 100000);
      assert.equal(s.text.length, Math.min(length, 100000));
    });
test('context and depth limits cannot leave complete READ evidence', async () => {
  const context = await page(
    '<section>Kontakt ' + 'x'.repeat(2100) + ' kontakt@firm.example.test</section>',
  );
  assert.equal(context.status, 'INCOMPLETE');
  assert.equal(context.completeness, 'CONTEXT_LIMIT');
  const depth = await page('<div>'.repeat(135) + 'hidden' + '</div>'.repeat(135));
  assert.equal(depth.status, 'INCOMPLETE');
  assert.equal(depth.completeness, 'DEPTH_LIMIT');
});
test('multi-address cells/cards preserve following purposes and isolate a valid HR', () => {
  for (const tag of ['li', 'div', 'tr']) {
    const cell = tag === 'tr' ? 'td' : 'p';
    const html =
      '<' +
      tag +
      '><' +
      cell +
      '>hr@firm.example.test Rekrutacja</' +
      cell +
      '><' +
      cell +
      '>kontakt@firm.example.test Faktury i rozliczenia</' +
      cell +
      '></' +
      tag +
      '>';
    const p = parsePublicHTML(html);
    assert.match(p.contexts.find((c) => c.email === 'kontakt@firm.example.test')!.text, /Faktury/);
    assert.doesNotMatch(
      p.contexts.find((c) => c.email === 'hr@firm.example.test')!.text,
      /Faktury/,
    );
  }
});
test('old parser and unmarked public source cannot gain current authorization', async () => {
  const s = await page('<p>Contact kontakt@firm.example.test</p>');
  assert.equal(sourceComplete(s), true);
  assert.equal(sourceComplete({ ...s, parser_version: parserVersion - 1 }), false);
  assert.equal(sourceComplete({ ...s, completeness: undefined }), false);
});
test('contact publication authority requires an official host, alias or exact official referral', async () => {
  const official = await page(
    '<h1>Firm</h1><a href="https://ats.example.test/jobs/firm">Rekrutacja — aplikuj tutaj</a>',
  );
  const contact = await page(
    '<p>Firm. Rekrutacja hr@firm.example.test</p>',
    'text/html',
    'https://ats.example.test/jobs/firm',
  );
  const a = { contact: { proof: { sourceId: contact.id } } } as any;
  assert.equal(contactSourceAuthority(a, [official, contact], ['firm.example.test']), true);
  assert.equal(contactSourceAuthority(a, [contact], ['firm.example.test']), false);
  assert.equal(
    contactSourceAuthority(
      a,
      [
        official,
        {
          ...contact,
          final_url: 'https://ats.example.test/jobs/other',
          original_url: 'https://ats.example.test/jobs/other',
        },
      ],
      ['firm.example.test'],
    ),
    false,
  );
  assert.equal(
    contactSourceAuthority(
      a,
      [{ ...official, parser_version: parserVersion - 1 }, contact],
      ['firm.example.test'],
    ),
    false,
  );
  assert.equal(contactSourceAuthority(a, [contact], ['ats.example.test']), true);
});
test('AUTO rejects a directory naming the firm and publishing its mailbox', async (t) => {
  const f = await setup(t, true, false, true, true);
  f.service.search.search = async () => ({
    queries: ['synthetic'],
    urls: [
      {
        url: 'https://fixture.example.test/careers',
        contactUrl: 'https://directory.example.test/contact',
      },
    ],
  });
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 0);
  assert.ok(f.store.one("SELECT draft_id FROM auto_skips WHERE reason_code='CONTACT_POLICY'"));
});
test('AUTO accepts a different-domain mailbox literally published by the official firm', async (t) => {
  const f = await setup(t, true, false, false, true);
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (...args) => {
    const s = await read(...args);
    s.text = s.text.replaceAll('biuro@fixture.example.test', 'team@other.example.test');
    s.fragment = s.text;
    return s;
  };
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (...args) => {
    const r = await run(...args);
    if (args[0].includes('Wydobądź firmę')) {
      const v = r.value as any;
      v.contact.email = 'team@other.example.test';
      v.contact.proof.quote = 'Kontakt: team@other.example.test.';
    }
    return r;
  };
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
});
