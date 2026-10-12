import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createPublicDiagnostic } from '../apps/server/src/research/diagnostic.js';
import { ExecCodexRunner, cleanDiagnostic } from '../apps/server/src/research/codex.js';
import { PublicSourceReader, publicURL } from '../apps/server/src/research/fetcher.js';
import {
  ReviewBudget,
  proposalMaterials,
  relevantPageLinks,
} from '../apps/server/src/research/review-session.js';
import { DomainError, hash } from '../apps/server/src/util.js';
import { JobHunter } from '../apps/server/src/service.js';

const args = process.argv.slice(2);
const argument = (key: string) => args[args.indexOf(key) + 1];
if (
  !args.includes('--profile') ||
  !args.includes('--session-dir') ||
  !args.includes('--approved-profile')
)
  throw new Error(
    'Wymagane: --profile PLIK --approved-profile --session-dir PRYWATNY_KATALOG [--session-id ID].',
  );
const dir = resolve(argument('--session-dir'));
if (dir.startsWith(resolve('.') + '\\') || dir.startsWith(resolve('.') + '/'))
  throw new Error('SESSION_DIRECTORY_OUTSIDE_REPOSITORY_REQUIRED');
mkdirSync(dir, { recursive: true });
const lock = join(dir, 'run.lock');
const descriptor = openSync(lock, 'wx');
writeFileSync(descriptor, String(process.pid));
closeSync(descriptor);
const old = existsSync(join(dir, 'budget.json'))
  ? JSON.parse(readFileSync(join(dir, 'budget.json'), 'utf8'))
  : null;
const resumeExisting = args.includes('--resume-existing');
const previousResults = readdirSync(dir).filter((f) => /^result-batch-\d+\.json$/.test(f)).length;
if (old?.endedAt) {
  for (const name of ['result', 'summary', 'materials-used'])
    if (existsSync(join(dir, name + '.json')))
      writeFileSync(
        join(dir, name + `-batch-${previousResults + 1}.json`),
        readFileSync(join(dir, name + '.json')),
      );
  if (existsSync(join(dir, 'database-path.txt')))
    writeFileSync(
      join(dir, `database-path-batch-${previousResults + 1}.txt`),
      readFileSync(join(dir, 'database-path.txt')),
    );
}
const sessionId =
  old?.sessionId ??
  (args.includes('--session-id') ? argument('--session-id') : randomUUID().slice(0, 8));
const budget = new ReviewBudget(dir, sessionId, resumeExisting);
const batchId = 'live-' + (previousResults + 1 + (old?.endedAt ? 1 : 0));
const walk = (path: string): string[] =>
  readdirSync(path, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? walk(join(path, f.name)) : f.name.endsWith('.ts') ? [join(path, f.name)] : [],
  );
const files = [
  ...walk('apps/server/src'),
  ...walk('packages/shared'),
  'scripts/public-research-review.ts',
];
const code = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
  sourceHashes: Object.fromEntries(
    files.sort().map((file) => [file.replaceAll('\\', '/'), hash(readFileSync(file))]),
  ),
};
const codeId = hash(JSON.stringify(code.sourceHashes));
budget.event('SESSION', resumeExisting ? 'RESUME_EXISTING_ONLY' : 'STARTED', {
  batch_id: batchId,
  code_id: codeId,
  code_head: code.head,
  dirty: code.dirty,
  node_options: process.execArgv.filter((s) => s === '--use-system-ca'),
});
// Adopt the actual preflight probe once; reopening this directory never resets the counter.
if (!old && existsSync(join(dir, 'probe.json'))) {
  const probe = JSON.parse(readFileSync(join(dir, 'probe.json'), 'utf8'));
  budget.state.models++;
  budget.save();
  budget.event('PROBE', probe.status, {
    call_id: probe.meta?.diagnostic?.callId,
    original_timestamp: probe.startedAt,
    adopted_preflight: true,
  });
}
let diagnostic: ReturnType<typeof createPublicDiagnostic> | undefined;
let outcome = 'PARTIAL',
  stopReason = 'UNKNOWN';
let timer: ReturnType<typeof setInterval> | undefined;
const reviews: Record<string, unknown> = existsSync(join(dir, 'reviews.json'))
  ? JSON.parse(readFileSync(join(dir, 'reviews.json'), 'utf8'))
  : {};
const snapshot = () => {
  if (!diagnostic) return;
  for (const d of diagnostic.service.draftRows()) {
    reviews[d.id + ':' + d.version] = {
      semantic: JSON.parse(d.semantic_review),
      warnings: JSON.parse(d.warnings),
      materialIssues: diagnostic.service.draftMaterialIssues(d),
      email: d.email,
      company_id: d.company_id,
    };
  }
  writeFileSync(join(dir, 'reviews.json'), JSON.stringify(reviews, null, 2));
  budget.recordChecked(
    diagnostic.service
      .draftRows()
      .filter(
        (d) =>
          JSON.parse(d.semantic_review).supported === true &&
          !JSON.parse(d.semantic_review).issues.length &&
          !diagnostic.service.draftMaterialIssues(d).length,
      )
      .map((d) => d.id),
  );
  writeFileSync(
    join(dir, 'summary.json'),
    JSON.stringify({ ...diagnostic.summary(), budget: budget.state }, null, 2),
  );
};
try {
  const materials = proposalMaterials(argument('--profile'), true);
  writeFileSync(
    join(dir, 'materials-used.json'),
    JSON.stringify(
      {
        ...materials,
        proposal: undefined,
        code,
        codeId,
        sessionId,
        batchId,
      },
      null,
      2,
    ),
  );
  const links = new Map<string, string[]>();
  const rawReader = new PublicSourceReader({
    beforeRequest: (url) => budget.http(url),
    onHTML: (url, html) => links.set(url, relevantPageLinks(html, url)),
  });
  const reader = {
    read: async (url: string, signal?: AbortSignal) => {
      const source = await rawReader.read(url, signal);
      budget.event('READ', source.status, {
        source_kind: 'PUBLIC_HTTP',
        source_id: source.id,
        url: source.final_url ?? source.original_url,
        http_status: source.http_status,
        code: source.error,
      });
      return source;
    },
  };
  diagnostic = createPublicDiagnostic(join(dir, 'batch-' + Date.now()), {
    materials: materials.materials,
    runner: budget.wrap(new ExecCodexRunner()),
    reader,
  });
  writeFileSync(join(dir, 'database-path.txt'), diagnostic.store.dir);
  budget.event('MATERIALS', 'APPROVED', {
    profile_hash: diagnostic.service.minimalProfile().hash,
    proposal_hash: materials.proposalHash,
    cv_hash: materials.cvHash,
    facts: Object.keys(materials.materials.facts),
    code_id: codeId,
  });
  timer = setInterval(() => {
    if (budget.reason() === 'TIME_LIMIT') diagnostic?.service.control('stop');
  }, 1000);
  if (!resumeExisting) await diagnostic.service.probe('search');
  const queries = [
    'Polskie software house’y i zespoły SaaS: backend, integracje API, webhooki i automatyzacje. Priorytet udokumentowane otwarte kandydatury, juniorzy lub płatne staże. Wybierz do 10 różnych firm działających w Polsce, każda z oficjalną stroną i odpowiednim kontaktem. Około 20 godzin zdalnie po lekcjach jest pytaniem, nie potwierdzonym warunkiem. Bez Fingoweb. Nie zgaduj emaili.',
    'Nowe polskie zespoły produktowe i software house’y: PDF, computer vision, narzędzia wewnętrzne, LLM i automatyzacja. Także uczciwe zapytanie bez wakatu, ale z podstawą w działalności i odpowiednim kanałem kontaktu. Do 10 oficjalnych różnych stron firm, bez Fingoweb i bez wcześniej sprawdzonych domen.',
    'Polska: małe i średnie firmy programistyczne tworzące SaaS, web/backend i integracje API. Udokumentowane otwarte kandydatury lub płatne staże, ewentualnie zapytanie o regularną zdalną współpracę około 20 godzin po lekcjach. Do 10 nowych firm. Bez Fingoweb. Wymagany formularz i senior full-time nie są pasującą ofertą.',
  ];
  for (let qi = 0; qi < queries.length && !budget.reason(!resumeExisting); qi++) {
    const leads = resumeExisting
      ? JSON.parse(readFileSync(join(dir, `leads-${qi + 1}.json`), 'utf8'))
      : await diagnostic.service.search.search(
          queries[qi] + '\nJuż poddane analizie domeny: ' + budget.state.identities.join(', '),
        );
    if (!resumeExisting)
      writeFileSync(join(dir, `leads-${qi + 1}.json`), JSON.stringify(leads, null, 2));
    budget.event('SEARCH', resumeExisting ? 'SEARCH_CACHE_REPLAY' : 'LEADS_SAVED', {
      batch_id: batchId,
      query_number: qi + 1,
      candidates: leads.urls,
    });
    for (const lead of leads.urls) {
      if (budget.reason(!resumeExisting)) break;
      const url = publicURL(lead.url),
        domain = url.hostname.replace(/^www\./, '').toLowerCase();
      if (/fingoweb/.test(domain)) {
        budget.event('LEAD', 'USER_EXCLUDED', { url: url.href });
        continue;
      }
      if (
        /justjoin|nofluff|pracuj|linkedin|useme|greenhouse|lever\.co|teamtailor|workable|recruitee/.test(
          domain,
        )
      ) {
        budget.event('LEAD', 'PORTAL_NEEDS_COMPANY_IDENTITY', { url: url.href });
        continue;
      }
      if (resumeExisting && !budget.state.identities.includes(domain)) {
        budget.event('LEAD', 'NEW_FIRM_FORBIDDEN_AFTER_LIMIT', { url: url.href });
        continue;
      }
      if (!resumeExisting && !budget.company(domain)) {
        budget.event('LEAD', 'DUPLICATE_DOMAIN', { url: url.href, duplicate_of_domain: domain });
        continue;
      }
      budget.event('COMPANY', resumeExisting ? 'REPLAY_STARTED' : 'STARTED', {
        batch_id: batchId,
        url: url.href,
        identity: domain,
        code_id: codeId,
      });
      const primary = await diagnostic.service.readSource(url.href);
      const sources = [primary];
      const extra = [
        ...new Set(
          [lead.contactUrl, ...(links.get(primary.final_url ?? url.href) ?? [])].filter(
            Boolean,
          ) as string[],
        ),
      ];
      const categories = new Set<string>();
      for (const extraURL of extra) {
        if (sources.length >= 5 || budget.reason()) break;
        let u: URL;
        try {
          u = publicURL(extraURL);
        } catch {
          continue;
        }
        if (
          u.hostname.replace(/^www\./, '') !== domain ||
          sources.some((s) => s.original_url === u.href)
        )
          continue;
        const category = /career|karier|rekrut|jobs|join-us/.test(u.pathname)
          ? 'career'
          : /contact|kontakt/.test(u.pathname)
            ? 'contact'
            : /service|usług|offer|oferta|product|produkt/.test(u.pathname)
              ? 'service'
              : 'other';
        if (categories.has(category)) continue;
        categories.add(category);
        sources.push(await diagnostic.service.readSource(u.href));
      }
      if (budget.reason()) {
        stopReason = budget.reason()!;
        break;
      }
      const imported = await diagnostic.service.importURL(url.href, lead.contactUrl ?? undefined);
      if (imported.queued) {
        // The ordinary pipeline receives all the actual, saved public sources; no invented extraction/decision.
        const merged = [
          ...new Set([...sources.map((s) => s.id), ...imported.sources.map((s) => s.id)]),
        ];
        diagnostic.store.exec(
          "UPDATE research_items SET source_ids=?,stage='EXTRACT' WHERE run_id=?",
          JSON.stringify(merged),
          imported.runId,
        );
        await diagnostic.service.tick();
        snapshot();
        const run = diagnostic.store.one('SELECT * FROM runs WHERE id=?', imported.runId)!;
        const item = diagnostic.store.one(
          'SELECT * FROM research_items WHERE run_id=?',
          imported.runId,
        );
        budget.event('COMPANY', run.status, {
          batch_id: batchId,
          run_id: run.id,
          company_id: item?.company_id,
          item_id: item?.id,
          identity: domain,
          stage_reached: item?.stage,
          code: item?.error ?? run.error,
          source_ids: merged,
          code_id: codeId,
        });
        console.log(
          JSON.stringify({
            domain,
            status: run.status,
            ...diagnostic.summary(),
            budget: budget.state,
          }),
        );
        if (
          run.error &&
          [
            'CODEX_LOGIN',
            'CODEX_LIMIT',
            'CLI_MISSING',
            'CODEX_CONFIGURATION',
            'ISOLATION_FAILED',
            'CODEX_TOOLS',
            'CLI_START',
            'CODEX_TIMEOUT',
          ].includes(run.error)
        )
          throw new DomainError(run.error, 'Wspólna blokada integracji; zapisane etapy pozostają.');
        // A terminal batch stop archives incomplete checkpoints and permits other firms; never alters their result.
        if (run.status === 'PAUSED') {
          JobHunter.prototype.control.call(diagnostic.service, 'stop');
          budget.event('BATCH_STOP', 'INCOMPLETE_CHECKPOINTS_RETAINED', {
            run_id: run.id,
            code_id: codeId,
          });
        }
      }
    }
  }
  stopReason =
    budget.reason(!resumeExisting) ??
    (stopReason === 'UNKNOWN' ? 'SEARCH_SCOPE_EXHAUSTED' : stopReason);
  const summary = diagnostic.summary();
  outcome =
    summary.pagesRead === 0 && summary.firms > 0
      ? 'BLOCKED_EXTERNAL'
      : summary.itemErrors.length || Object.keys(summary.skipped).length
        ? 'PARTIAL'
        : 'COMPLETE';
} catch (e) {
  stopReason = e instanceof DomainError ? e.code : 'SESSION_ERROR';
  outcome = [
    'CODEX_LOGIN',
    'CODEX_LIMIT',
    'CLI_MISSING',
    'CODEX_CONFIGURATION',
    'ISOLATION_FAILED',
    'CODEX_TOOLS',
    'CLI_START',
    'CODEX_TIMEOUT',
    'SEARCH_UNAVAILABLE',
  ].includes(stopReason)
    ? 'BLOCKED_EXTERNAL'
    : 'PARTIAL';
  budget.event('SESSION', outcome, {
    code: stopReason,
    reason: cleanDiagnostic(e instanceof Error ? e.message : 'unknown'),
    code_id: codeId,
  });
  console.log(JSON.stringify({ outcome, stopReason }));
} finally {
  if (timer) clearInterval(timer);
  diagnostic?.service.control('stop');
  if (diagnostic) {
    await diagnostic.service.stopWorker();
    snapshot();
    diagnostic.store.close();
  }
  budget.state.endedAt = new Date().toISOString();
  budget.state.stopReason = stopReason;
  budget.save();
  budget.event('SESSION', outcome, { stop_reason: stopReason, code_id: codeId, real_sends: 0 });
  writeFileSync(
    join(dir, 'result.json'),
    JSON.stringify({ outcome, stopReason, budget: budget.state, code, codeId }, null, 2),
  );
  unlinkSync(lock);
  console.log(JSON.stringify({ outcome, stopReason, sessionId, budget: budget.state }));
}
