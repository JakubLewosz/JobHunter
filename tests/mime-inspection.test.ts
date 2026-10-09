import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  copyFileSync,
  symlinkSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepareMime } from '../apps/server/src/gmail/mime.js';
import {
  inspectMime,
  compareMime,
  mimeReport,
  decodeSubject,
} from '../apps/server/src/gmail/inspection.js';
import { GmailMailProvider } from '../apps/server/src/gmail/client.js';
import { hash } from '../apps/server/src/util.js';

for (const subject of [
  'Zażółć gęślą jaźń',
  '[Test JobHunter] Zapytanie o współpracę – integracje systemów',
  'Żółć 😀 współpraca '.repeat(100),
  'A'.repeat(160) + ' ó ' + 'B'.repeat(120),
])
  test(`MIME inspection: RFC 2047 i round-trip tematu (${subject.length} znaków)`, async () => {
    const pdf = Buffer.concat([
      Buffer.from('%PDF-1.4\n'),
      Buffer.from(Array.from({ length: 1024 }, (_, i) => i % 256)),
    ]);
    const body = 'Zażółć\n\nDwie  spacje, tab\t oraz & <>.\nKoniec\n\n';
    const p = await prepareMime({
      sender: 'owner@example.test',
      senderName: 'Fikcyjny Żółć',
      recipient: 'hr@example.test',
      subject,
      body,
      date: new Date('2026-10-08T10:00:00Z'),
      cv: { name: 'Żółć CV.pdf', bytes: pdf, sha256: hash(pdf), approved: true },
    });
    const m = inspectMime(p.mime),
      report = mimeReport(p.mime);
    assert.equal(decodeSubject(m.headers.subject[0]), subject);
    assert.ok(report.subject.encodedWordLengths.every((n) => n <= 75));
    assert.ok(report.subject.physicalLineLengths.every((n) => n <= 76));
    for (const name of [
      'from',
      'to',
      'date',
      'message-id',
      'mime-version',
      'subject',
      'content-type',
    ])
      assert.equal(m.headers[name].length, 1);
    assert.equal(m.headers.cc, undefined);
    assert.equal(m.headers.bcc, undefined);
    assert.equal(m.headers['reply-to'], undefined);
    assert.equal(m.parts.find((p) => p.type === 'text/plain')!.text!.replace(/\r\n/g, '\n'), body);
    assert.deepEqual(m.parts.find((p) => p.type === 'application/pdf')!.bytes, pdf);
    assert.equal(m.parts.find((p) => p.type === 'application/pdf')!.filename, 'Żółć CV.pdf');
    assert.ok(report.base64urlRoundTrip);
    let posts = 0;
    const provider = new GmailMailProvider(
      async () => 'fictional',
      async (_url, init) => {
        posts++;
        assert.deepEqual(Buffer.from(JSON.parse(String(init!.body)).raw, 'base64url'), p.mime);
        return Response.json({ id: 'fictional-id', threadId: 'fictional-thread' });
      },
    );
    await provider.sendFrozenMessage({ ...p, recipient: 'hr@example.test', scenario: 'NORMAL' });
    assert.equal(posts, 1);
    await assert.rejects(() =>
      provider.sendFrozenMessage({
        ...p,
        mime: Buffer.from('changed'),
        recipient: 'hr@example.test',
        scenario: 'NORMAL',
      }),
    );
    assert.equal(posts, 1);
  });

test('MIME comparison: tylko CRLF -> LF; spacje, końcowe puste wiersze i załączniki pozostają istotne', () => {
  const make = (text: string) =>
    Buffer.from(
      'From: owner@example.test\r\nTo: hr@example.test\r\nSubject: Fikcyjny\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n' +
        Buffer.from(text).toString('base64') +
        '\r\n',
    );
  assert.equal(compareMime(make('a\r\nb  c\r\n'), make('a\nb  c\n')).decodedPartsExact, false);
  assert.equal(compareMime(make('a\r\nb  c\r\n'), make('a\nb  c\n')).decodedPartsLF, true);
  for (const text of ['a\nb c\n', 'a\nb  c', 'a\nb  c\n\n', 'a\nb\tc\n'])
    assert.equal(compareMime(make('a\nb  c\n'), make(text)).decodedPartsLF, false);
});
test('MIME inspection: niekompletny multipart i wadliwe kodowanie nie są kompletnym porównaniem', () => {
  assert.throws(() =>
    inspectMime(
      Buffer.from(
        'Content-Type: multipart/mixed; boundary=x\r\n\r\n--x\r\nContent-Type: text/plain\r\n\r\ntext',
      ),
    ),
  );
  assert.throws(() =>
    inspectMime(
      Buffer.from('Content-Type: text/plain\r\nContent-Transfer-Encoding: base64\r\n\r\n!!!!'),
    ),
  );
  assert.throws(() =>
    inspectMime(Buffer.from('Content-Type: text/plain\r\nContent-Type: text/html\r\n\r\ntext')),
  );
});

test('MIME comparison: charset, BOM i tekstowe załączniki nie ukrywają różnic', () => {
  const make = (text: string, attachment = false) =>
    Buffer.from(
      'Content-Type: text/plain; charset=utf-8\r\n' +
        (attachment ? 'Content-Disposition: attachment; filename=Fictional.txt\r\n' : '') +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        Buffer.from(text).toString('base64') +
        '\r\n',
    );
  const utf8 = make('Żółć');
  const latin1 = Buffer.from(utf8.toString().replace('charset=utf-8', 'charset=iso-8859-1'));
  assert.equal(compareMime(utf8, latin1).decodedPartsExact, false);
  assert.equal(compareMime(utf8, latin1).decodedPartsLF, false);
  assert.equal(compareMime(make('Tekst'), make('\uFEFFTekst')).decodedPartsLF, false);
  assert.equal(compareMime(make('a\r\n', true), make('a\n', true)).decodedPartsLF, false);
});
test('audytor CLI: fikcyjne lokalne EML, porównanie, redakcja i prywatny raport poza repo', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-audit-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const p = await prepareMime({
    sender: 'owner@example.test',
    recipient: 'hr@example.test',
    subject: 'Fikcyjny Żółć',
    body: 'Prywatny fikcyjny tekst',
    cv: null,
  });
  const path = join(dir, 'test.eml');
  writeFileSync(path, p.mime);
  const run = (...args: string[]) =>
    spawnSync(process.execPath, ['--import', 'tsx', 'scripts/audit-eml.ts', ...args], {
      encoding: 'utf8',
    });
  const result = run(path, path);
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /owner@example.test|Prywatny fikcyjny tekst/);
  assert.equal(JSON.parse(result.stdout).comparisons[0].decodedPartsExact, true);
  assert.equal(run(path, '--private').status, 1);
  assert.equal(
    run(path, '--private', '--output', join(process.cwd(), 'private-report.json')).status,
    1,
  );
  const output = join(dir, 'report.json');
  assert.equal(run(path, '--private', '--output', output).status, 0);
  assert.match(readFileSync(output, 'utf8'), /owner@example.test|Prywatny fikcyjny tekst/);
});
test('audytor CLI: dowiązanie katalogu nie kieruje prywatnego raportu do repo', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-audit-path-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  // All output paths, including the simulated repository, stay in this temporary fixture.
  const repository = join(dir, 'repository');
  mkdirSync(join(repository, 'scripts'), { recursive: true });
  writeFileSync(join(repository, 'package.json'), '{"type":"module"}');
  copyFileSync('scripts/audit-eml.ts', join(repository, 'scripts', 'audit-eml.ts'));
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  symlinkSync(join(process.cwd(), 'apps'), join(repository, 'apps'), linkType);
  const alias = join(dir, 'repository-alias');
  symlinkSync(repository, alias, linkType);
  const input = join(dir, 'synthetic.eml');
  const message = await prepareMime({
    sender: 'owner@example.test',
    recipient: 'hr@example.test',
    subject: 'Fikcyjny audyt',
    body: 'Prywatny fikcyjny tekst',
    cv: null,
  });
  writeFileSync(input, message.mime);
  const run = (output: string) =>
    spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        join(repository, 'scripts', 'audit-eml.ts'),
        input,
        '--private',
        '--output',
        output,
      ],
      { encoding: 'utf8' },
    );
  const blocked = run(join(alias, 'private.json'));
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /--private wymaga/);
  assert.equal(existsSync(join(repository, 'private.json')), false);
  if (process.platform !== 'win32') {
    const nestedAlias = join(dir, 'nested-alias');
    symlinkSync(join(repository, 'scripts'), nestedAlias, linkType);
    const traversal = run(nestedAlias + '/../private-from-parent.json');
    assert.equal(traversal.status, 1);
    assert.equal(existsSync(join(repository, 'private-from-parent.json')), false);
  }
  const output = join(dir, 'allowed-private.json');
  const allowed = run(output);
  assert.equal(allowed.status, 0);
  assert.match(readFileSync(output, 'utf8'), /owner@example.test/);
});
