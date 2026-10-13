import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAnalysis,
  contactEligibility,
  conditionKeys,
} from '../apps/server/src/research/contracts.js';
import { relevantProjectFacts } from '../apps/server/src/research/drafting.js';
import { hash, iso } from '../apps/server/src/util.js';
import type { Source } from '../apps/server/src/research/fetcher.js';

// Reconstructed excerpts from the published review, not the original HTML.
export function scenario(company = 'Changed Company', domain = 'changed.example.test') {
  const text = `${company}. Spontaneous Application. Tworzymy aplikacje webowe i usługi API. Wyślij CV na jobs@${domain}. Forma B2B lub umowa o pracę (UoP).`;
  const source: Source = {
    id: 'fixture-source',
    original_url: `https://${domain}/`,
    final_url: `https://${domain}/`,
    fetched_at: iso(),
    title: company,
    status: 'READ',
    method: 'TEST_FIXTURE_RECONSTRUCTED',
    http_status: 200,
    text,
    fragment: text,
    content_hash: hash(text),
    error: null,
  };
  const proof = (quote: string) => ({
    sourceId: source.id,
    quote,
    explanation: 'Published excerpt reconstructed as fixture.',
  });
  const analysis: any = {
    company,
    companyURL: source.final_url,
    companyProof: proof(company),
    title: 'Spontaneous Application',
    titleProof: proof('Spontaneous Application'),
    type: 'OPEN',
    typeProof: proof('Spontaneous Application'),
    inquiryBasis: proof('Tworzymy aplikacje webowe i usługi API.'),
    conditions: Object.fromEntries(
      conditionKeys.map((k) => [
        k,
        {
          value: k === 'openInquiry' ? 'yes' : 'unknown',
          ...proof('Spontaneous Application'),
          scope: 'COMPANY',
        },
      ]),
    ),
    requirements: [],
    contact: {
      email: `jobs@${domain}`,
      kind: 'RECRUITMENT',
      proof: proof(`Wyślij CV na jobs@${domain}.`),
    },
    warnings: [],
  };
  return { source, analysis, proof };
}
test('verified services select approved AutoRelay even without matching vacancy title', () => {
  for (const company of ['BizCode', 'Completely Changed Company']) {
    const { analysis } = scenario(company);
    assert.deepEqual(
      relevantProjectFacts(
        [
          {
            id: 'fact-autorelay',
            key: 'autorelay',
            content: 'Approved complete project description.',
          },
        ],
        analysis,
      ).map((f) => f.id),
      ['fact-autorelay'],
    );
  }
});
test('recruitment questions retain recruitment purpose but cannot authorize CV application', () => {
  const { source, analysis, proof } = scenario();
  const quote =
    'Do you want to be a part of our team? Apply! If in doubt, feel free to ask a question at jobs@changed.example.test';
  source.text = source.text.replace('Wyślij CV na jobs@changed.example.test.', '') + '\n' + quote;
  analysis.contact.proof = proof(quote);
  const v = validateAnalysis(analysis, [source]);
  assert.equal(v.contact.kind, 'RECRUITMENT');
  assert.equal(contactEligibility(v, [source]).allowed, false);
});
test('offer restrictions do not become a company refusal', () => {
  const { source, analysis, proof } = scenario();
  const quote = 'Readiness for full-time, on-site work between 8:00 AM and 4:00 PM.';
  source.text += '\n' + quote;
  analysis.type = 'ACTIVE';
  analysis.conditions.active = {
    value: 'yes',
    ...proof('Spontaneous Application'),
    scope: 'OFFER',
  };
  analysis.conditions.remote = { value: 'no', ...proof(quote), scope: 'OFFER' };
  assert.equal(contactEligibility(validateAnalysis(analysis, [source]), [source]).allowed, true);
});

import {
  PublicSourceReader,
  readFailure,
  retryableRead,
} from '../apps/server/src/research/fetcher.js';
import { applyCandidateConstraints, contactUsage } from '../apps/server/src/research/contracts.js';
import { projectSelection } from '../apps/server/src/research/drafting.js';
import { createPublicDiagnostic } from '../apps/server/src/research/diagnostic.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const resolvePublic: any = async () => [{ address: '93.184.215.14', family: 4 }];
test('TLS errors preserve code/stage and stop at three independent hosts; no retry storm', async () => {
  let http = 0;
  const r = new PublicSourceReader({
    resolve: resolvePublic,
    beforeRequest: () => {
      http++;
    },
    transport: async () => {
      throw Object.assign(new Error('secret path'), { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' });
    },
  });
  const first = await r.read('https://one.example.test/');
  assert.equal(retryableRead(first), false);
  assert.deepEqual(readFailure(first), {
    category: 'TLS',
    code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    stage: 'HTTP',
    retryable: false,
  });
  assert.doesNotMatch(first.error!, /secret/);
  await r.read('https://two.example.test/');
  await r.read('https://three.example.test/');
  assert.equal((await r.read('https://four.example.test/')).status, 'READER_ENVIRONMENT');
  assert.equal(http, 3);
});
test('one failing host does not block independent working hosts or preflight', async () => {
  const r = new PublicSourceReader({
    resolve: resolvePublic,
    transport: async (u) => {
      if (u.hostname.startsWith('bad')) throw Object.assign(new Error(), { code: 'ENOTFOUND' });
      return { status: 200, contentType: 'text/html', body: '<p>Public text</p>' };
    },
  });
  const p = await r.preflight([
    'https://bad.example.test',
    'https://good.example.test',
    'https://other.example.test',
  ]);
  assert.equal(p.ok, true);
  assert.equal(p.sources[0].status, 'DNS_FAILED');
});
test('budget counts redirect and retry; denied request does not reach transport', async () => {
  let http = 0,
    transports = 0;
  const r = new PublicSourceReader({
    resolve: resolvePublic,
    beforeRequest: () => {
      if (http >= 1) throw Object.assign(new Error(), { code: 'RESEARCH_BUDGET' });
      http++;
    },
    transport: async () => {
      transports++;
      return { status: 302, location: '/next', body: '' };
    },
  });
  await r.read('https://redirect.example.test/');
  assert.equal(http, 1);
  assert.equal(transports, 1);
});
test('transient retry is bounded, saved success is reused and saved-source imports validate references', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-round-'));
  const fixture = new FixtureReader();
  fixture.prospect = true;
  let calls = 0;
  const reader = {
    read: async (url: string) => {
      calls++;
      const s = await fixture.read(url);
      if (calls === 1)
        return {
          ...s,
          status: 'FETCH_FAILED',
          text: '',
          fragment: '',
          content_hash: null,
          error: JSON.stringify({
            category: 'NETWORK',
            code: 'ECONNRESET',
            stage: 'HTTP',
            retryable: true,
          }),
        };
      return s;
    },
  };
  const runner = new FixtureRunner();
  runner.prospect = true;
  const d = createPublicDiagnostic(dir, { reader, runner });
  t.after(() => {
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const source = await d.service.readSource('https://fixture.example.test/');
  assert.equal(source.status, 'READ');
  assert.equal(calls, 2);
  d.service.importSavedSources(source.original_url, [source.id]);
  await d.service.tick();
  assert.equal(calls, 2);
  assert.throws(
    () => d.service.importSavedSources(source.original_url, ['foreign']),
    (e: any) => e.code === 'STALE_EVIDENCE',
  );
  d.store.exec(
    'UPDATE research_sources SET fetched_at=? WHERE id=?',
    '2020-01-01T00:00:00Z',
    source.id,
  );
  assert.throws(
    () => d.service.importSavedSources(source.original_url, [source.id]),
    (e: any) => e.code === 'STALE_EVIDENCE',
  );
  assert.equal(d.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  assert.equal(d.store.one('SELECT count(*) n FROM outbox')!.n, 0);
  assert.equal(d.store.one('SELECT count(*) n FROM draft_approvals')!.n, 0);
});
test('forms listed by company are not an invented candidate restriction; explicit restriction still works', () => {
  const { analysis, proof } = scenario();
  analysis.conditions.contract = {
    value: 'no',
    ...proof('Forma B2B lub umowa o pracę (UoP).'),
    scope: 'COMPANY',
  };
  assert.equal(
    applyCandidateConstraints(structuredClone(analysis), {
      facts: [{ key: 'contract', content: 'Nie wskazano konkretnej stawki ani formy umowy.' }],
    }).conditions.contract.value,
    'unknown',
  );
  assert.equal(
    applyCandidateConstraints(structuredClone(analysis), {
      facts: [{ key: 'contract', content: 'Wyłącznie umowa zlecenie.' }],
    }).conditions.contract.value,
    'no',
  );
});
test('neutral non-vacancy title works; active vacancy title still needs literal proof with diagnostics', () => {
  const { analysis, source } = scenario();
  analysis.title = null;
  analysis.titleProof = { sourceId: null, quote: null, explanation: 'No vacancy.' };
  assert.equal(validateAnalysis(analysis, [source]).title, 'Otwarta kandydatura');
  analysis.type = 'ACTIVE';
  assert.throws(
    () => validateAnalysis(analysis, [source]),
    (e: any) => e.code === 'UNVERIFIED_TITLE' && e.details.result === 'MISSING_VACANCY_TITLE',
  );
});
test('PDF terms and AI banners do not select a project; invalid activities are removed before selection', () => {
  const { analysis, source, proof } = scenario();
  analysis.inquiryBasis = null;
  analysis.titleProof = proof('Spontaneous Application');
  analysis.companyActivities = [proof('PDF regulamin'), proof('AI banner')];
  const facts = [
    { id: 'a', key: 'elektroscan', content: 'Approved' },
    { id: 'b', key: 'codefabric', content: 'Approved' },
  ];
  assert.deepEqual(projectSelection(facts, validateAnalysis(analysis, [source])).selected, []);
  analysis.companyActivities = [proof('Analizujemy dokumenty PDF oraz obrazy.')];
  source.text += '\nAnalizujemy dokumenty PDF oraz obrazy.';
  assert.equal(
    relevantProjectFacts(facts, validateAnalysis(analysis, [source]))[0].key,
    'elektroscan',
  );
  analysis.companyActivities = [proof('Tworzymy narzędzia z lokalnymi modelami językowymi.')];
  source.text += '\nTworzymy narzędzia z lokalnymi modelami językowymi.';
  assert.equal(
    relevantProjectFacts(facts, validateAnalysis(analysis, [source]))[0].key,
    'codefabric',
  );
});
for (const text of [
  'Wyłącznie przez formularz.',
  'Nie przyjmujemy aplikacji e-mail.',
  'Do not send CV by email.',
])
  test('mandatory channel/refusal blocks CV: ' + text, () => {
    const { analysis, source } = scenario();
    source.text += '\n' + text;
    assert.equal(contactEligibility(validateAnalysis(analysis, [source]), [source]).allowed, false);
  });

test('redirect alias reuses the saved canonical source without a second HTTP call', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-alias-'));
  let requests = 0;
  const reader = new PublicSourceReader({
    resolve: resolvePublic,
    beforeRequest: () => {
      requests++;
    },
    transport: async (url) =>
      url.pathname === '/career'
        ? { status: 301, location: '/career/', body: '' }
        : { status: 200, contentType: 'text/html', body: '<p>Company career</p>' },
  });
  const d = createPublicDiagnostic(dir, { runner: new FixtureRunner(), reader });
  t.after(() => {
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const a = await d.service.readSource('https://alias.example.test/career');
  const b = await d.service.readSource('https://alias.example.test/career/');
  assert.equal(a.id, b.id);
  assert.equal(requests, 2, 'only initial request and redirect');
  const imported = await d.service.importURL('https://alias.example.test/career/');
  assert.equal(imported.queued, true);
  assert.equal(requests, 2);
  await assert.rejects(
    d.service.readSource('https://alias.example.test/career/', AbortSignal.abort()),
  );
});

import { snapshotMaterials, ReviewBudget } from '../apps/server/src/research/review-session.js';
import { writeFileSync } from 'node:fs';
test('snapshot preserves exact fact IDs/content and provenance without CV or sender privileges', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-snapshot-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const keys = [
    'identity',
    'education',
    'availability',
    'contract',
    'ai',
    'portfolio',
    'autorelay',
    'codefabric',
    'elektroscan',
  ];
  const text =
    'Cel: Synthetic diagnostic goal.\n' +
    keys.map((k) => `| fact-${k} | ${k} | Synthetic ${k}. |`).join('\n') +
    '\n~~~text\n' +
    'Synthetic template. '.repeat(10) +
    '\n~~~\n';
  const path = join(dir, 'snapshot.md');
  writeFileSync(path, text);
  const input = snapshotMaterials(path, {
    commit: 'a'.repeat(40),
    path: 'published/PROFIL_UZYTY.md',
  });
  assert.deepEqual(
    input.factIds,
    keys.map((k) => 'fact-' + k),
  );
  assert.equal(input.materials.facts.autorelay, 'Synthetic autorelay.');
  assert.equal(input.provenance.sha256, hash(text));
  assert.equal(input.provenance.cvVerifiedInThisRun, false);
  const d = createPublicDiagnostic(join(dir, 'diagnostic'), {
    materials: input.materials,
    reader: new FixtureReader(),
    runner: new FixtureRunner(),
  });
  assert.deepEqual(
    d.service
      .minimalProfile()
      .facts.map((f) => f.id)
      .sort(),
    input.factIds.sort(),
  );
  await assert.rejects(d.service.dispatchOne(), (e: any) => e.code === 'SEND_DISABLED');
  for (const table of ['cv_assets', 'draft_approvals', 'outbox', 'send_attempts', 'auto_sessions'])
    assert.equal(d.store.one(`SELECT count(*) n FROM ${table}`)!.n, 0);
  d.store.close();
});
test('custom round budget resumes with original time/counters instead of old session defaults', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-limits-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const limits = { milliseconds: 90 * 60000, firms: 16, checkedDrafts: 16, models: 80, http: 150 };
  const first = new ReviewBudget(dir, 'round', false, limits);
  first.http('https://example.test');
  first.state.models = 79;
  first.save();
  const second = new ReviewBudget(dir, 'round', false, limits);
  assert.equal(second.state.http, 1);
  assert.equal(second.state.models, 79);
  second.state.models++;
  assert.equal(second.reason(), 'MODEL_LIMIT');
});

test('a hiring inquiry and a separate literal CV invitation for the same mailbox keep correct application scope', () => {
  const { source, analysis, proof } = scenario();
  const quote = 'Zapytaj o aktualny nabór, pisząc na jobs@changed.example.test.';
  source.text += '\n' + quote;
  analysis.contact.proof = proof(quote);
  const v = validateAnalysis(analysis, [source]);
  assert.equal(v.contact.kind, 'RECRUITMENT');
  assert.equal(contactUsage(v, [source]), 'RECRUITMENT_APPLICATION');
  assert.equal(contactEligibility(v, [source]).allowed, true);
  assert.equal(
    contactUsage({ ...v, contact: { ...v.contact, kind: 'GENERAL' } }, [source]),
    'QUESTIONS_ONLY',
    'a question proof does not relabel GENERAL as a CV application',
  );
  source.text = source.text.replace('Wyślij CV na jobs@changed.example.test.', '');
  assert.equal(contactUsage(v, [source]), 'QUESTIONS_ONLY');
  assert.equal(contactEligibility(v, [source]).allowed, false);
});
test('generator and review receive identical full selected facts and concrete evidence mapping', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-project-context-'));
  const runner = new FixtureRunner(),
    reader = new FixtureReader();
  runner.prospect = reader.prospect = true;
  const original = runner.run.bind(runner);
  runner.run = async (prompt, schema, options) => {
    const r = await original(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const a: any = r.value;
      a.requirements = [];
      a.inquiryBasis = a.typeProof;
    }
    return r;
  };
  const d = createPublicDiagnostic(dir, { runner, reader });
  t.after(() => {
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await d.service.importURL('https://fixture.example.test/');
  await d.service.tick();
  const get = (marker: string) =>
    JSON.parse(
      runner.prompts
        .find((p) => p.includes(marker))!
        .split('Dane: ')
        .at(-1)!,
    );
  const draft = get('Przygotuj indywidualny'),
    review = get('Sprawdź KAŻDE');
  const project = draft.profile.facts.find((f: any) => f.key === 'autorelay');
  assert.ok(project);
  assert.deepEqual(review.profile.facts, draft.profile.facts);
  assert.equal(draft.profile.projectSelection.selected[0].fact.content, project.content);
  assert.ok(draft.profile.projectSelection.selected[0].proofs[0].evidenceIds.length > 0);
  assert.match(d.service.draftRows()[0].body, /FixtureRelay/);
});

test('documented data flow and private AI work match projects across changed names, not banner words', () => {
  const facts = [
    { id: 'relay', key: 'autorelay', content: 'Approved relay.' },
    { id: 'models', key: 'codefabric', content: 'Approved local model prototype.' },
  ];
  for (const company of ['Changed Company', 'Another Completely Different Company']) {
    const { source, analysis, proof } = scenario(company);
    analysis.inquiryBasis = null;
    analysis.titleProof = proof('Spontaneous Application');
    for (const [quote, key] of [
      ['Łączymy systemy, aby dane przepływały między nimi automatycznie.', 'autorelay'],
      [
        'We build secure, private AI environments that empower internal teams with intelligent knowledge access.',
        'codefabric',
      ],
    ]) {
      source.text += '\n' + quote;
      analysis.companyActivities = [proof(quote)];
      assert.equal(relevantProjectFacts(facts, validateAnalysis(analysis, [source]))[0].key, key);
    }
    source.text += '\nAI banner. PDF privacy terms.';
    analysis.companyActivities = [proof('AI banner. PDF privacy terms.')];
    assert.deepEqual(relevantProjectFacts(facts, validateAnalysis(analysis, [source])), []);
  }
});

test('a newer changed/failed source prevents reuse of an older still recent READ version', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-source-version-'));
  const reader = new FixtureReader();
  const d = createPublicDiagnostic(dir, { reader, runner: new FixtureRunner() });
  t.after(() => {
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const old = await d.service.readSource('https://fixture.example.test/');
  d.service.saveSource({
    ...old,
    id: 'new-source',
    fetched_at: new Date(Date.parse(old.fetched_at) + 1000).toISOString(),
    text: 'Changed company page.',
    fragment: 'Changed company page.',
    content_hash: hash('changed'),
  });
  assert.throws(
    () => d.service.importSavedSources(old.original_url, [old.id]),
    (e: any) => e.code === 'STALE_EVIDENCE',
  );
});

import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
test('a diagnostic snapshot database cannot be reopened as a WORKSTATION Gmail service', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-diagnostic-mail-'));
  const d = createPublicDiagnostic(dir, {
    reader: new FixtureReader(),
    runner: new FixtureRunner(),
  });
  t.after(() => {
    d.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  let nativeChecks = 0;
  assert.throws(
    () =>
      new GmailJobHunter(d.store, {
        runtime: {
          kind: 'WORKSTATION',
          assertNative: () => {
            nativeChecks++;
          },
        },
      }),
    (e: any) => e.code === 'DIAGNOSTIC_MAIL_DISABLED',
  );
  assert.equal(nativeChecks, 0);
  for (const table of ['draft_approvals', 'outbox', 'send_attempts', 'auto_sessions'])
    assert.equal(d.store.one(`SELECT count(*) n FROM ${table}`)!.n, 0);
});
