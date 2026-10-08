// Explicit content-only control run. Fictional companies/recipients; no live DB writes or Gmail.
import Database from 'better-sqlite3';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { ExecCodexRunner } from '../apps/server/src/research/codex.js';
import { relevantProjectFacts } from '../apps/server/src/research/drafting.js';
import {
  messagePrompt,
  messageContactType,
  semanticReviewPrompt,
} from '../apps/server/src/research/message-policy.js';
import {
  conditionKeys,
  validateAnalysis,
  realDraftSchema,
  reviewSchema,
  researchInstructions,
  type Analysis,
} from '../apps/server/src/research/contracts.js';
import type { Source } from '../apps/server/src/research/fetcher.js';
import { hash } from '../apps/server/src/util.js';
const live = new Database(
  join(
    homedir(),
    'Library',
    'Application Support',
    'JobHunter',
    'research-only',
    'jobhunter.sqlite',
  ),
  { readonly: true, fileMustExist: true },
);
let profile: any;
let template: string;
try {
  const p = live.prepare("SELECT * FROM candidate_profiles WHERE id='candidate'").get() as any;
  const facts = live
    .prepare(
      "SELECT id,fact_key AS key,content,approval_status FROM candidate_facts WHERE profile_id='candidate'",
    )
    .all() as any[];
  if (!p.approved_at || facts.some((f) => f.approval_status !== 'APPROVED'))
    throw new Error('Approved profile required for preview.');
  profile = {
    name: p.name,
    goal: p.goal,
    availabilityMode: p.availability_mode,
    hoursApprox: p.hours_approx,
    hoursMin: p.availability_mode === 'APPROX' ? null : p.hours_min,
    hoursMax: p.availability_mode === 'APPROX' ? null : p.hours_max,
    facts,
    hash: p.profile_hash,
  };
  template = JSON.parse(
    (live.prepare("SELECT value FROM app_state WHERE key='messageTemplate'").get() as any).value,
  );
} finally {
  live.close();
}
const directory = mkdtempSync(join(tmpdir(), 'jh-content-control-'));
const store = new Store(directory),
  checker = new ResearchJobHunter(store);
const runner = new ExecCodexRunner();
const definitions = [
  {
    company: 'Firma Kontrolna PHP',
    host: 'php.example.test',
    type: 'ACTIVE',
    title: 'Junior PHP Developer',
    activity: 'Rozwijamy aplikacje do obsługi usterek w PHP i Laravel.',
    requirements: ['PHP i Laravel', 'obsługa usterek'],
  },
  {
    company: 'Firma Kontrolna Integracje',
    host: 'integracje.example.test',
    type: 'OPEN',
    title: 'Integracje i automatyzacje',
    activity: 'Łączymy systemy przez API i automatyzujemy procesy z użyciem webhooków.',
    requirements: ['integracje systemów przez API', 'automatyzacje z użyciem webhooków'],
  },
  {
    company: 'Firma Kontrolna LLM',
    host: 'llm.example.test',
    type: 'PROSPECT',
    title: 'Narzędzia z lokalnymi modelami językowymi',
    activity:
      'Tworzymy narzędzia wspomagające tworzenie oprogramowania z lokalnymi modelami językowymi.',
    requirements: [
      'lokalne modele językowe LLM',
      'narzędzia AI wspomagające tworzenie oprogramowania',
    ],
  },
  {
    company: 'Firma Kontrolna Web',
    host: 'web.example.test',
    type: 'PROSPECT',
    title: 'Aplikacje webowe PHP/Laravel',
    activity: 'Tworzymy aplikacje webowe w PHP i Laravel do obsługi zgłoszeń i usterek.',
    requirements: ['PHP Laravel', 'obsługa zgłoszeń i usterek'],
  },
  {
    company: 'Firma Kontrolna Dokumenty',
    host: 'pdf.example.test',
    type: 'ACTIVE',
    title: 'Junior Developer — dokumenty PDF',
    activity: 'Rozwijamy narzędzia do analizy planów elektrycznych w PDF.',
    requirements: ['analiza planów elektrycznych', 'dokumenty PDF'],
    contractConfirmed: false,
  },
];
const output = join(homedir(), 'Library', 'Application Support', 'JobHunter', 'content-previews');
mkdirSync(output, { recursive: true, mode: 0o700 });
const only = process.argv[2];
const previews: any[] =
  only && existsSync(join(output, 'message-style-previews.json'))
    ? JSON.parse(readFileSync(join(output, 'message-style-previews.json'), 'utf8')).filter(
        (p: any) => p.company !== definitions[Number(only)]?.company,
      )
    : [];
try {
  for (const [index, c] of definitions.entries()) {
    if (only !== undefined && Number(only) !== index) continue;
    const sid = `control-source-${index}`,
      email = `kontakt@${c.host}`;
    const contractConfirmed =
      c.type === 'ACTIVE' && (!('contractConfirmed' in c) || c.contractConfirmed !== false);
    const terms = `Płatna, regularna współpraca, w pełni zdalnie, około ${profile.hoursApprox} godzin tygodniowo po lekcjach, dla początkującego programisty.${contractConfirmed ? ' Dostępna umowa zlecenie.' : ''}`;
    const invitation =
      c.type === 'ACTIVE'
        ? 'Rekrutacja jest otwarta do 31 grudnia 2026.'
        : c.type === 'OPEN'
          ? 'Zapraszamy do otwartych kandydatur początkujących programistów.'
          : c.activity;
    const text = [
      c.company,
      c.title,
      c.activity,
      ...c.requirements,
      invitation,
      ...(c.type === 'ACTIVE' ? [terms] : []),
      `${c.type === 'PROSPECT' ? 'Kontakt' : 'Kontakt do rekrutacji'}: ${email}.`,
    ].join('\n');
    const source: Source = {
      id: sid,
      original_url: `https://${c.host}`,
      final_url: `https://${c.host}`,
      title: c.title,
      fetched_at: new Date().toISOString(),
      method: 'FICTIONAL_CONTENT_CONTROL',
      status: 'READ',
      http_status: 200,
      fragment: text,
      text,
      content_hash: hash(text),
      error: null,
    };
    const proof = (quote: string) => ({
      sourceId: sid,
      quote,
      explanation: 'Kontrolne fikcyjne źródło.',
    });
    const analysis = validateAnalysis(
      {
        company: c.company,
        companyProof: proof(c.company),
        companyURL: `https://${c.host}`,
        title: c.title,
        titleProof: proof(c.title),
        type: c.type,
        typeProof: proof(invitation),
        conditions: Object.fromEntries(
          conditionKeys.map((k) => [
            k,
            c.type === 'ACTIVE' && k !== 'openInquiry' && (k !== 'contract' || contractConfirmed)
              ? { ...proof(k === 'active' ? invitation : terms), value: 'yes' }
              : c.type === 'OPEN' && k === 'openInquiry'
                ? { ...proof(invitation), value: 'yes' }
                : {
                    sourceId: null,
                    quote: null,
                    explanation: 'Nie podano warunków.',
                    value: 'unknown',
                  },
          ]),
        ),
        requirements: c.requirements.map((text) => ({ text, sourceId: sid, quote: text })),
        contact: {
          email,
          kind: c.type === 'PROSPECT' ? 'GENERAL' : 'RECRUITMENT',
          proof: proof(`${c.type === 'PROSPECT' ? 'Kontakt' : 'Kontakt do rekrutacji'}: ${email}.`),
        },
        warnings: [],
      },
      [source],
    );
    const chosen = relevantProjectFacts(profile.facts, analysis);
    const filtered = {
      ...profile,
      facts: profile.facts.filter(
        (f: any) =>
          !['fixdesk', 'autorelay', 'codefabric', 'elektroscan'].includes(f.key) ||
          chosen.some((p) => p.id === f.id),
      ),
    };
    const evidence = [
      { id: `control-evidence-${index}`, fragment: text, canonical_url: source.final_url },
    ];
    console.log(`Generating content preview ${index + 1}/${definitions.length}: ${c.company}.`);
    const generated = await runner.run(
      researchInstructions +
        '\n' +
        messagePrompt({
          profile: filtered,
          analysis,
          qualification: 'NEEDS_REVIEW',
          evidence,
          history: 'NEW',
          template,
          recent: previews.map((p) => ({
            subject: p.subject,
            opening: p.body.split('\n\n').slice(1, 2).join(' '),
            question: p.body.split('\n').find((s: string) => s.endsWith('?')) ?? '',
          })),
        }),
      realDraftSchema,
      { search: false },
    );
    mkdirSync('test-results', { recursive: true });
    writeFileSync(
      join(output, 'message-style-preview-last.json'),
      JSON.stringify({ company: c.company, draft: generated.value, profile: filtered }, null, 2),
    );
    const styleWarnings = checker.checkDraft(
      generated.value,
      c.company,
      filtered,
      evidence,
      analysis,
    );
    const reviewed = await runner.run(
      semanticReviewPrompt({
        draft: generated.value,
        profile: filtered,
        evidence,
        analysis,
        contactType: messageContactType(analysis),
      }),
      reviewSchema,
      { search: false },
    );
    previews.push({
      company: c.company,
      contactType: messageContactType(analysis),
      ...generated.value,
      semanticReview: reviewed.value,
      styleWarnings,
      words: generated.value.body.trim().split(/\s+/).length,
    });
    mkdirSync('test-results', { recursive: true });
    writeFileSync(join(output, 'message-style-previews.json'), JSON.stringify(previews, null, 2));
    console.log(
      `Saved ${c.company}: ${previews.at(-1).words} words; semantic supported=${reviewed.value.supported}.`,
    );
  }
  const md = previews
    .map((p) => `## ${p.company} (${p.contactType})\n\n${p.subject}\n\n${p.body}\n`)
    .join('\n');
  writeFileSync(join(output, 'message-style-previews.md'), md);
  console.log(
    `Saved ${previews.length} content previews. Fictional recipients, unchanged live drafts, zero sends.`,
  );
} finally {
  store.close();
  rmSync(directory, { recursive: true, force: true });
}
