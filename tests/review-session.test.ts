import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ReviewBudget,
  proposalMaterials,
  relevantPageLinks,
  reviewLimits,
} from '../apps/server/src/research/review-session.js';
import { createPublicDiagnostic } from '../apps/server/src/research/diagnostic.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { hash } from '../apps/server/src/util.js';
import { PublicSourceReader } from '../apps/server/src/research/fetcher.js';

test('approved diagnostic subset has no default project fallback or Gmail transport', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-approved-subset-'));
  const d = createPublicDiagnostic(dir, {
    runner: new FixtureRunner(),
    reader: new FixtureReader(),
    materials: {
      name: 'Fixture Candidate',
      goal: 'Płatna, regularna współpraca na fikcyjnych danych.',
      hoursApprox: 20,
      template: 'Fikcyjny zatwierdzony wzór, bez osobistych materiałów. '.repeat(3),
      facts: Object.fromEntries(
        ['identity', 'education', 'availability', 'contract', 'ai', 'portfolio', 'autorelay'].map(
          (k) => [
            k,
            k === 'availability'
              ? 'Około 20 godzin tygodniowo, po lekcjach.'
              : 'Fikcyjny zatwierdzony fakt ' + k,
          ],
        ),
      ),
    },
  });
  t.after(async () => {
    await d.service.stopWorker();
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const p = d.service.minimalProfile();
  assert.equal(p.facts.length, 7);
  assert.ok(!p.facts.some((f) => ['fixdesk', 'codefabric', 'elektroscan'].includes(f.key)));
  assert.equal('gateway' in d.service, false);
  await assert.rejects(d.service.dispatchOne(), (e: any) => e.code === 'SEND_DISABLED');
  assert.equal(d.summary().outbox, 0);
  assert.equal(d.summary().attempts, 0);
});
test('proposal reader verifies actual PDF hash and explicit human approval', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-proposal-fixture-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const pdf = join(dir, 'fixture.pdf'),
    profile = join(dir, 'fixture.json');
  writeFileSync(pdf, 'synthetic PDF bytes; not user CV');
  const p = {
    name: 'Fixture Candidate',
    goal: 'Fixture approved goal',
    hoursApprox: 20,
    sourcePdf: pdf,
    sourceSha256: hash('synthetic PDF bytes; not user CV'),
    facts: Object.fromEntries(
      ['identity', 'education', 'availability', 'contract', 'ai', 'portfolio'].map((k) => [
        k,
        'Fixture ' + k,
      ]),
    ),
  };
  writeFileSync(profile, JSON.stringify(p));
  assert.throws(() => proposalMaterials(profile, false), /Wymagana zgoda/);
  assert.equal(proposalMaterials(profile, true).cvHash, p.sourceSha256);
  writeFileSync(pdf, 'changed fixture');
  assert.throws(() => proposalMaterials(profile, true), /Hash PDF/);
});
test('review budget survives reopen, includes all model attempts and HTTP redirects, expires from first public call', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-budget-fixture-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const a = new ReviewBudget(dir, 'fixture-session');
  a.company('example.test');
  a.http('https://example.test');
  a.http('https://example.test/redirect');
  a.state.models = 119;
  a.save();
  const b = new ReviewBudget(dir, 'fixture-session');
  assert.equal(b.state.http, 2);
  b.recordChecked(['fixture-draft-1']);
  b.recordChecked([]);
  assert.equal(b.state.checkedDrafts, 1);
  assert.equal(new ReviewBudget(dir, 'fixture-session').state.checkedDrafts, 1);
  assert.equal(b.company('example.test'), false);
  b.state.models++;
  b.save();
  assert.equal(b.reason(), 'MODEL_LIMIT');
  assert.throws(() => b.assert(), /MODEL_LIMIT/);
  b.state.models = 0;
  b.state.firstPublicAt = new Date(Date.now() - reviewLimits.milliseconds - 1).toISOString();
  assert.equal(b.reason(), 'TIME_LIMIT');
});
test('public page plan follows literal same-origin relevant links, excludes login and private context', () => {
  const links = relevantPageLinks(
    '<nav><a href="/careers">Careers</a><a href="/contact">Contact</a><a href="/services">Services</a><a href="/privacy">Privacy</a><a href="https://other.test/careers">Other</a></nav><script><a href="/fake">Careers</a></script>',
    'https://example.test/',
  );
  assert.deepEqual(links, [
    'https://example.test/careers',
    'https://example.test/contact',
    'https://example.test/services',
  ]);
});
test('link sentence punctuation does not reject approved GitHub, but another target remains blocked', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-link-fixture-'));
  const runner = new FixtureRunner(),
    reader = new FixtureReader();
  runner.prospect = reader.prospect = true;
  const d = createPublicDiagnostic(dir, { runner, reader });
  t.after(async () => {
    await d.service.stopWorker();
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await d.service.probe('codex');
  await d.service.probe('search');
  await d.service.start();
  await d.service.tick();
  const material = d.store.one('SELECT * FROM research_draft_materials')!;
  const payload = JSON.parse(material.payload_json),
    context = JSON.parse(material.context_json);
  const portfolio = context.profile.facts.find((f: any) => f.key === 'portfolio');
  const approvedUrl = portfolio.content.match(/https?:\/\/[^\s)]+/)[0];
  payload.body += '\n\nGitHub: ' + approvedUrl;
  portfolio.content += '.';
  assert.doesNotThrow(() =>
    d.service.checkDraft(
      payload,
      d.service.draftRows()[0].company_id,
      context.profile,
      context.evidence,
      context.analysis,
    ),
  );
  const changed = {
    ...payload,
    body: payload.body.replace(approvedUrl, 'https://github.com/UnapprovedFixture'),
  };
  assert.throws(
    () =>
      d.service.checkDraft(
        changed,
        d.service.draftRows()[0].company_id,
        context.profile,
        context.evidence,
        context.analysis,
      ),
    (e: any) => e.code === 'UNAPPROVED_LINK',
  );
});
test('TLS trust failure is explicit without persisting raw error or weakening transport', async () => {
  const reader = new PublicSourceReader({
    resolve: async () => [{ address: '8.8.8.8', family: 4 }] as any,
    transport: async () => {
      throw Object.assign(new Error('fixture-private-detail'), {
        code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      });
    },
  });
  const source = await reader.read('https://fixture.example.test');
  assert.equal(source.status, 'TLS_UNTRUSTED');
  assert.equal(source.error, 'TLS_UNTRUSTED');
  assert.doesNotMatch(JSON.stringify(source), /fixture-private-detail/);
});
