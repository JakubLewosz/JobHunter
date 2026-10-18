import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicSourceReader, textFromHTML } from '../apps/server/src/research/fetcher.js';
import {
  analysisSchema,
  contactEligibility,
  validateAnalysis,
} from '../apps/server/src/research/contracts.js';
import { FixtureRunner } from './research-fixture.js';
import { setup } from './auto-fixture.js';
import type { TestContext } from 'node:test';
import { hash } from '../apps/server/src/util.js';
import { parsePublicHTML, parserVersion } from '../apps/server/src/research/html.js';
import { performance } from 'node:perf_hooks';

const activity =
  '<p>Fixture Company. Tworzymy aplikacje webowe, automatyzacje i integracje API.</p>';
const sections =
  '<section><h2>Kontakt ogólny</h2><a href="mailto:kontakt@fixture.example.test">kontakt@fixture.example.test</a></section><section><h2>Sprzedaż</h2><a href="mailto:sales@fixture.example.test">sales@fixture.example.test</a></section>';
export async function htmlDecision(
  html: string,
  email: string,
  kind: 'GENERAL' | 'RECRUITMENT' = 'GENERAL',
) {
  const reader = new PublicSourceReader({
    resolve: async () => [{ address: '93.184.216.34', family: 4 }] as any,
    transport: async () => ({ status: 200, contentType: 'text/html', body: activity + html }),
  });
  const source = await reader.read('https://fixture.example.test');
  const runner = new FixtureRunner();
  runner.prospect = true;
  const analysis = (
    await runner.run(
      'Wydobądź firmę Dane: ' + JSON.stringify([{ id: source.id, url: source.final_url }]),
      analysisSchema,
    )
  ).value;
  analysis.contact = {
    email,
    kind,
    proof: {
      sourceId: source.id,
      quote: kind === 'RECRUITMENT' ? 'Rekrutacja ' + email : email,
      explanation: 'Literalna treść fixture.',
    },
  };
  const verified = validateAnalysis(analysis, [source]);
  return { source, analysis: verified, decision: contactEligibility(verified, [source]) };
}
test('real HTML parser → public source → qualification: unrelated sales section does not reject GENERAL', async () => {
  assert.ok(textFromHTML(sections).includes('kontakt@fixture.example.test'));
  const general = await htmlDecision(sections, 'kontakt@fixture.example.test');
  assert.equal(general.decision.allowed, true);
  assert.equal(general.analysis.contact.kind, 'GENERAL');
  assert.equal(
    (await htmlDecision(sections, 'sales@fixture.example.test')).decision.allowed,
    false,
  );
});
test('HTML: an inline email label cannot merge into the literal mailbox or lose its purpose', async () => {
  const email = 'hello@fixture.example.test';
  for (const tag of ['a', 'span']) {
    const html = `<div><span>Email</span><${tag}>${email}</${tag}></div>`;
    for (const variant of [html, html.replace(/></g, '>\n<')]) {
      const result = await htmlDecision(variant, email);
      assert.match(result.source.text, /Email\s+hello@fixture\.example\.test/);
      assert.equal(result.analysis.contact.email, email);
      assert.equal(result.analysis.contact.kind, 'GENERAL');
      assert.equal(result.decision.allowed, true);
    }
    assert.equal(
      (await htmlDecision(`<div><span>Sprzedaż</span><${tag}>${email}</${tag}></div>`, email))
        .decision.allowed,
      false,
    );
  }
  assert.equal(
    (await htmlDecision('<a href="mailto:hello@fixture.example.test">Napisz do nas</a>', email))
      .decision.allowed,
    false,
  );
  assert.equal(
    (await htmlDecision('<span>Email</span><a>nothello@fixture.example.test</a>', email)).decision
      .allowed,
    false,
  );
});
test('HTML: Sales heading above biuro remains bound to that mailbox', async () => {
  assert.equal(
    (
      await htmlDecision(
        '<section><h2>Sprzedaż</h2><p><a>biuro@fixture.example.test</a></p></section>',
        'biuro@fixture.example.test',
      )
    ).decision.allowed,
    false,
  );
});

const mailbox = 'biuro@fixture.example.test';
const cases = [
  [
    'billing table heading row',
    '<table><tr><th>Faktury i rozliczenia</th></tr><tr><td>Pomoc: pomoc@fixture.example.test</td></tr><tr><td>Kontakt: ' +
      mailbox +
      '</td></tr></table>',
    false,
  ],
  [
    'shared billing heading with neutral labels',
    '<section><h2>Faktury i rozliczenia</h2><p>Kontakt: ' +
      mailbox +
      '</p><p>Pomoc: pomoc@fixture.example.test</p></section>',
    false,
  ],
  [
    'shared billing heading second address',
    '<section><h2>Faktury i rozliczenia</h2><p>Pomoc: pomoc@fixture.example.test</p><p>Kontakt: ' +
      mailbox +
      '</p></section>',
    false,
  ],
  [
    'nested shared billing',
    '<section><h2>Faktury i rozliczenia</h2><div><p>Pomoc: pomoc@fixture.example.test</p><p>Kontakt: ' +
      mailbox +
      '</p></div></section>',
    false,
  ],
  [
    'shared billing list',
    '<section><h2>Faktury i rozliczenia</h2><ul><li>Pomoc: pomoc@fixture.example.test</li><li>Kontakt: ' +
      mailbox +
      '</li></ul></section>',
    false,
  ],
  [
    'shared billing table',
    '<section><h2>Faktury i rozliczenia</h2><table><tr><td>Pomoc: pomoc@fixture.example.test</td><td>Kontakt: ' +
      mailbox +
      '</td></tr></table></section>',
    false,
  ],
  [
    'shared following heading',
    '<section><p>Pomoc: pomoc@fixture.example.test</p><p>Kontakt: ' +
      mailbox +
      '</p><h2>Faktury i rozliczenia</h2></section>',
    false,
  ],
  [
    'div',
    '<div><h2>Kontakt ogólny</h2><p>' +
      mailbox +
      '</p></div><div><h2>Sprzedaż</h2><p>sales@fixture.example.test</p></div>',
    true,
  ],
  [
    'list',
    '<ul><li>Kontakt ogólny ' + mailbox + '</li><li>Sprzedaż sales@fixture.example.test</li></ul>',
    true,
  ],
  [
    'br',
    '<footer>Kontakt ogólny<br>' + mailbox + '<br>Sprzedaż<br>sales@fixture.example.test</footer>',
    true,
  ],
  [
    'table',
    '<table><tr><td>Kontakt ogólny</td><td>' +
      mailbox +
      '</td></tr><tr><td>Sprzedaż</td><td>sales@fixture.example.test</td></tr></table>',
    true,
  ],
  ['sales table', '<table><tr><td>Sprzedaż</td><td>' + mailbox + '</td></tr></table>', false],
  ['heading above a card', '<h2>Sprzedaż</h2><section>' + mailbox + '</section>', false],
  [
    'heading above a list',
    '<h2>Sprzedaż</h2><ul><li>' + mailbox + '</li><li>sales@fixture.example.test</li></ul>',
    false,
  ],
  [
    'heading above nested footer card',
    '<footer><h2>Sprzedaż</h2><div>' + mailbox + '</div></footer>',
    false,
  ],
  [
    'contradiction',
    '<section>Kontakt ogólny ' +
      mailbox +
      '</section><section><h2>Sprzedaż</h2>' +
      mailbox +
      '</section>',
    false,
  ],
  [
    'marketing',
    '<p>Tworzymy systemy sprzedażowe i integracje API</p><section><h2>Kontakt ogólny</h2>' +
      mailbox +
      '</section>',
    true,
  ],
  [
    'global refusal',
    '<section>Kontakt ogólny ' + mailbox + '</section><p>Nie przyjmujemy kandydatur</p>',
    false,
  ],
] as const;
async function autoHTML(
  t: TestContext,
  html: string,
  email: string,
  kind: 'GENERAL' | 'RECRUITMENT' = 'GENERAL',
) {
  const f = await setup(t, true, false, false, true);
  let page = html;
  const publicReader = new PublicSourceReader({
    resolve: async () => [{ address: '93.184.216.34', family: 4 }] as any,
    transport: async () => ({ status: 200, contentType: 'text/html', body: activity + page }),
  });
  f.reader.read = async (url, signal) => {
    const source = await publicReader.read(url, signal);
    source.fetched_at = f.options.clock().toISOString();
    return source;
  };
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    const result = await run(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const v = result.value as any;
      v.contact.email = email;
      v.contact.kind = kind;
      v.contact.proof.quote = kind === 'RECRUITMENT' ? 'Rekrutacja ' + email : email;
    }
    return result;
  };
  await f.service.startAuto();
  await f.service.tick();
  return {
    ...f,
    change: (value: string) => {
      page = value;
    },
  };
}
for (const [name, html, allowed] of cases)
  test('HTML → qualification → AUTO: ' + name, async (t) => {
    for (const variant of [html, html.replace(/></g, '>\n  <')]) {
      const result = await htmlDecision(variant, mailbox);
      assert.equal(result.decision.allowed, allowed);
      const f = await autoHTML(t, variant, mailbox);
      f.advance();
      await f.service.dispatchOne();
      assert.equal(f.gateway.posts.length, allowed ? 1 : 0);
    }
  });
test('HTML → AUTO: HR unaffected by unrelated billing/privacy', async (t) => {
  const html =
    '<section><h2>Rekrutacja</h2>hr@fixture.example.test</section><section><h2>Faktury i RODO</h2>iod@fixture.example.test</section>';
  const f = await autoHTML(t, html, 'hr@fixture.example.test', 'RECRUITMENT');
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
});
for (const changed of [
  '<section><h2>Sprzedaż</h2>' + mailbox + '</section>',
  '<section>Kontakt usunięty</section>',
])
  test('HTML refresh revokes old classification: ' + changed, async (t) => {
    const f = await autoHTML(t, '<section>Kontakt ogólny ' + mailbox + '</section>', mailbox);
    const d = f.service.draftRows()[0];
    assert.ok(d);
    f.change(changed);
    f.advance(86401000);
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(
      f.store.one('SELECT verification_status FROM contacts')?.verification_status,
      'INVALIDATED',
    );
    assert.equal(f.store.one('SELECT reason_code FROM auto_skips')?.reason_code, 'STALE_EVIDENCE');
  });
for (const previousVersion of [0, 1])
  test(`old public cache v${previousVersion} is re-read, versioned and cannot authorize a contact`, async (t) => {
    const f = await setup(t, true, false, false, true);
    const html = '<section>Kontakt ogólny ' + mailbox + '</section>';
    const read = new PublicSourceReader({
      resolve: async () => [{ address: '93.184.216.34', family: 4 }] as any,
      transport: async () => ({ status: 200, contentType: 'text/html', body: activity + html }),
    });
    f.reader.read = read.read.bind(read);
    const fresh = await read.read('https://fixture.example.test');
    const old = f.service.saveSource({
      ...fresh,
      parser_version: previousVersion,
      address_contexts: previousVersion ? fresh.address_contexts : undefined,
      content_hash: hash(JSON.stringify({ parserVersion: previousVersion, body: activity + html })),
      text: fresh.text.replace(/\s+/g, ' '),
    });
    const runner = new FixtureRunner();
    runner.prospect = true;
    const a = (
      await runner.run(
        'Wydobądź firmę Dane: ' + JSON.stringify([{ id: old.id, url: old.final_url }]),
        analysisSchema,
      )
    ).value;
    a.contact = {
      email: mailbox,
      kind: 'GENERAL',
      proof: { sourceId: old.id, quote: mailbox, explanation: 'Stary literalny dowód.' },
    };
    assert.equal(contactEligibility(validateAnalysis(a, [old]), [old]).allowed, false);
    const refreshed = await f.service.readSource(old.original_url);
    assert.notEqual(refreshed.id, old.id);
    assert.equal(refreshed.parser_version, parserVersion);
    assert.equal(
      f.store.one('SELECT parser_version FROM research_sources WHERE id=?', old.id)?.parser_version,
      previousVersion,
    );
  });
test('HTML: 2000-address container is parsed once per context and preserves its labels', (t) => {
  const html =
    '<footer>' +
    Array.from(
      { length: 2000 },
      (_, i) =>
        `${i === 1999 ? 'Sprzedaż' : 'Kontakt ogólny'}<br>kontakt${i}@fixture.example.test<br>`,
    ).join('') +
    '</footer>';
  const started = performance.now(),
    parsed = parsePublicHTML(html),
    elapsed = performance.now() - started;
  assert.equal(parsed.contexts.length, 2000);
  assert.match(
    parsed.contexts.find((c) => c.email === 'kontakt1999@fixture.example.test')!.text,
    /Sprzedaż/,
  );
  assert.doesNotMatch(
    parsed.contexts.find((c) => c.email === 'kontakt0@fixture.example.test')!.text,
    /Sprzedaż/,
  );
  t.diagnostic(JSON.stringify({ parserAddresses: 2000, parserMs: elapsed }));
  assert.ok(elapsed < 1000, 'bounded HTML must not hold the event loop for multiple seconds');
});
