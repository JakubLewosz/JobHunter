import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  openSync,
  closeSync,
  unlinkSync,
  readdirSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'csv-parse/sync';
import {
  createPublicDiagnostic,
  diagnosticOutcome,
} from '../apps/server/src/research/diagnostic.js';
import { AutonomousDiagnostic } from '../apps/server/src/research/autonomous-diagnostic.js';
import { ReviewBudget, snapshotMaterials } from '../apps/server/src/research/review-session.js';
import {
  ExecCodexRunner,
  type StructuredRunner,
  cleanDiagnostic,
} from '../apps/server/src/research/codex.js';
import { PublicSourceReader } from '../apps/server/src/research/fetcher.js';
import { DomainError, hash } from '../apps/server/src/util.js';

// An explicit bounded diagnostic, not a campaign, and not the ordinary 5-company smoke.
const dir = resolve(process.argv[2] ?? '');
if (!process.argv[2] || dir.startsWith(resolve('.') + '/'))
  throw new Error('SESSION_OUTSIDE_REPOSITORY_REQUIRED');
mkdirSync(dir, { recursive: true });
const lock = join(dir, 'run.lock');
closeSync(openSync(lock, 'wx'));
const sessionId = 'macos_autonomous';
const limits = { milliseconds: 90 * 60000, firms: 24, checkedDrafts: 24, models: 100, http: 180 };
const budget = new ReviewBudget(dir, sessionId, false, limits);
const snapshotPath = 'docs/research-review/2026-10-12_23-29_windows-01a1313a/PROFIL_UZYTY.md';
const commit = '2aa3a1eef3fdbb1939adc6e710d80a76badb945c';
const original = execFileSync('git', ['show', `${commit}:${snapshotPath}`]);
if (hash(original) !== hash(readFileSync(snapshotPath)))
  throw new Error('APPROVED_SNAPSHOT_CHANGED');
const materials = snapshotMaterials(snapshotPath, { commit, path: snapshotPath });
const walk = (p: string): string[] =>
  readdirSync(p, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? walk(join(p, f.name)) : f.name.endsWith('.ts') ? [join(p, f.name)] : [],
  );
const files = [
  ...walk('apps/server/src'),
  ...walk('packages/shared'),
  'scripts/public-autonomous-review.ts',
];
const code = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
  sourceHashes: Object.fromEntries(files.sort().map((f) => [f, hash(readFileSync(f))])),
};
const codeId = hash(JSON.stringify(code.sourceHashes));
writeFileSync(
  join(dir, 'materials-used.json'),
  JSON.stringify({ ...materials, code, codeId, sessionId, batchId: 'autonomous-live-1' }, null, 2),
);
writeFileSync(join(dir, 'redactions.json'), JSON.stringify({ emails: [], phones: [] }));
const prior = parse(
  readFileSync('docs/research-review/2026-10-13_08-10_macos-01a133d7/FIRMY.csv', 'utf8'),
  { columns: true },
) as any[];
const known = new Set(prior.map((r) => r.domena));
const domainOf = (u: string) => new URL(u).hostname.replace(/^www\./, '').toLowerCase();
const leads = new Map<string, { scope: string; url: string }>();
let control = false;
const raw = new ExecCodexRunner();
const wrapped = budget.wrap(raw);
const runner: StructuredRunner = {
  inspect: (signal) => wrapped.inspect(signal),
  run: async (prompt, schema, options) => {
    let identity: string | null = null;
    try {
      const data = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
      identity = domainOf(Array.isArray(data) ? data[0].url : data.analysis.companyURL);
    } catch {}
    budget.event('MODEL_ATTRIBUTION', 'STARTED', {
      call_id: options?.callId,
      stage_name: options?.stage,
      identity,
    });
    const result = await wrapped.run(prompt, schema, options);
    budget.event('MODEL_ATTRIBUTION', 'RECORDED', {
      call_id: options?.callId,
      stage_name: options?.stage,
      identity,
      web_search_actions: result.meta.webSearches,
      search_queries: result.meta.searchQueries ?? [],
    });
    if (options?.search && (result.value as any)?.candidates) {
      const v = result.value as any;
      const kept = [];
      const seen = new Set<string>();
      for (const c of v.candidates) {
        let domain: string;
        try {
          domain = domainOf(c.url);
        } catch {
          continue;
        }
        if (known.has(domain) || domain.includes('fingoweb')) {
          budget.event(
            'LEAD',
            domain.includes('fingoweb') ? 'USER_EXCLUDED' : 'ALREADY_RESEARCHED',
            { url: c.url, identity: domain, memory_only: true },
          );
          continue;
        }
        if (
          /justjoin|nofluff|pracuj|linkedin|useme|greenhouse|lever\.co|teamtailor|workable|recruitee/.test(
            domain,
          )
        ) {
          budget.event('LEAD', 'PORTAL_NEEDS_COMPANY_IDENTITY', { url: c.url });
          continue;
        }
        if (!seen.has(domain) && kept.length < 4) {
          kept.push(c);
          seen.add(domain);
          leads.set(domain, { scope: 'NEW', url: c.url });
        }
      }
      v.candidates = kept;
      budget.event('SEARCH', 'LEADS_SAVED', {
        lead_origin: 'PROGRAM_WEB_SEARCH',
        candidates: kept,
        actual_search_queries: result.meta.searchQueries ?? [],
        web_search_actions: result.meta.webSearches,
      });
    }
    return result;
  },
};
const rawReader = new PublicSourceReader({ beforeRequest: (u) => budget.http(u) });
const reader = {
  relatedURLs: (url: string) => rawReader.relatedURLs(url),
  read: async (url: string, signal?: AbortSignal) => {
    const domain = domainOf(url),
      lead = leads.get(domain);
    if (lead && budget.company(domain))
      budget.event('COMPANY', 'STARTED', {
        identity: domain,
        url: lead.url,
        scope: lead.scope,
        code_id: codeId,
      });
    const s = await rawReader.read(url, signal);
    budget.event('READ', s.status, {
      source_id: s.id,
      url: s.original_url,
      final_url: s.final_url,
      code: s.error,
      source_kind: 'PUBLIC_HTTP',
    });
    return s;
  },
};
const d = createPublicDiagnostic(join(dir, 'diagnostic-data'), {
  materials: materials.materials,
  maxCompanies: 4,
  runner,
  reader,
});
writeFileSync(join(dir, 'database-path.txt'), d.store.dir);
// Domain memory only: no production import, CONTACTED, outbox or eligibility granted.
for (const r of prior) d.service.findOrCreateCompany(r.nazwa, r.domena, 'ALREADY_RESEARCHED');
const policy = {
  scopeHash: hash('AUTONOMOUS_DIAGNOSTIC_ONLY:' + materials.provenance.sha256),
  profileHash: d.service.minimalProfile().hash,
  searchScope:
    'Firmy działające w Polsce; płatna regularna współpraca programistyczna, w pełni zdalnie około 20 godzin po lekcjach. Aplikacje, integracje, automatyzacje, dokumenty i narzędzia z modelami. Warunki nieznane są pytaniem. Wykluczenie Fingoweb. Bez wymogu wakatu i bez konkretnej formy umowy.',
};
const autonomous = new AutonomousDiagnostic(d.store, d.service, policy);
const reviews: Record<string, any> = {};
const capture = () => {
  for (const row of d.service.draftRows())
    reviews[row.id + ':' + row.version] = {
      semantic: JSON.parse(row.semantic_review),
      warnings: JSON.parse(row.warnings),
      materialIssues: d.service.draftMaterialIssues(row),
      email: row.email,
      company_id: row.company_id,
    };
  writeFileSync(join(dir, 'reviews.json'), JSON.stringify(reviews, null, 2));
  budget.recordChecked(
    d.service
      .draftRows()
      .filter(
        (row) =>
          JSON.parse(row.semantic_review).supported === true &&
          !JSON.parse(row.semantic_review).issues.length &&
          !d.service.draftMaterialIssues(row).length,
      )
      .map((row) => row.id),
  );
  writeFileSync(join(dir, 'summary.json'), JSON.stringify(d.summary(), null, 2));
};
let outcome = 'PARTIAL',
  stopReason = 'UNKNOWN';
const cycles: any[] = [];
const timer = setInterval(() => {
  if (budget.reason() === 'TIME_LIMIT') d.service.control('stop');
}, 1000);
budget.event('SESSION', 'STARTED', {
  code_head: code.head,
  code_id: codeId,
  limits,
  diagnostic: true,
});
budget.event('MATERIALS', 'APPROVED', {
  profile_hash: d.service.minimalProfile().hash,
  provenance: materials.provenance,
  factIds: materials.factIds,
});
budget.event('MEMORY', 'ALREADY_RESEARCHED', { domains: [...known], contacted: 0 });
try {
  const preflight = await rawReader.preflight();
  for (const s of preflight.sources) {
    d.service.saveSource(s);
    budget.event('PREFLIGHT_READ', s.status, {
      source_id: s.id,
      url: s.original_url,
      code: s.error,
    });
  }
  writeFileSync(join(dir, 'preflight.json'), JSON.stringify(preflight, null, 2));
  if (!preflight.ok)
    throw new DomainError(
      'READER_ENVIRONMENT',
      'Preflight failed with current reader/CA configuration.',
    );
  await d.service.probe('codex');
  await d.service.probe('search');
  // Only the existing planner chooses these queries. The worker performs each entire discovery cycle.
  for (let i = 0; i < 4 && !budget.reason(true); i++) {
    budget.event('PLANNER', 'NEXT', { cycle: i + 1 });
    const cycle = await autonomous.cycle();
    cycles.push(cycle);
    capture();
    budget.event('PLANNER', 'CYCLE_COMPLETED', {
      cycle: i + 1,
      query: cycle.plan.query,
      plan_id: cycle.plan.id,
      run_id: cycle.run?.id,
      run_status: cycle.run?.status,
      metrics: cycle.metrics,
      next_at: cycle.plan.nextAt,
      manual_intervention: false,
    });
    console.log(
      JSON.stringify({
        cycle: i + 1,
        status: cycle.run?.status,
        metrics: cycle.metrics,
        models: budget.state.models,
        http: budget.state.http,
      }),
    );
    if (cycle.run?.error)
      throw new DomainError(cycle.run.error, 'Provider failure; no blind retries.');
    if (!cycle.run) {
      stopReason = 'PLANNER_COOLDOWN';
      break;
    }
  }
  // Separate controls from autonomous discovery; never injected into the planner or its queue.
  control = true;
  const controls = [
    'https://bizcode.pl/kariera',
    'https://oke.pl/careers/spontaneous-application',
    'https://apifamily.pl/',
    'https://transparentdata.pl/career',
  ];
  for (const url of controls) {
    if (budget.reason()) break;
    const domain = domainOf(url);
    leads.set(domain, { scope: 'CONTROL', url });
    // Control histories are diagnostic memory, not contact exclusions; use fresh isolated control DB.
    // The shared budget/runner/reader remain unchanged across all four control databases.
    const c = createPublicDiagnostic(join(dir, 'control-' + domain), {
      materials: materials.materials,
      maxCompanies: 1,
      runner,
      reader,
    });
    writeFileSync(
      join(dir, 'database-path-batch-' + (controls.indexOf(url) + 1) + '.txt'),
      c.store.dir,
    );
    try {
      const primary = await c.service.readSource(url);
      const saved = [primary];
      const extra =
        domain === 'oke.pl'
          ? ['https://oke.pl/services', ...rawReader.relatedURLs(primary.final_url ?? url)]
          : rawReader.relatedURLs(primary.final_url ?? url);
      for (const next of [...new Set(extra)]) {
        if (saved.length >= 5 || budget.reason()) break;
        if (
          new URL(next).origin !== new URL(primary.final_url ?? url).origin ||
          saved.some((s) => s.original_url === next || s.final_url === next)
        )
          continue;
        saved.push(await c.service.readSource(next));
      }
      const readable = saved.filter((s) => s.status === 'READ');
      if (primary.status === 'READ') {
        c.service.importSavedSources(
          url,
          readable.map((s) => s.id),
        );
        await c.service.tick();
      }
      for (const row of c.service.draftRows())
        reviews[row.id + ':' + row.version] = {
          semantic: JSON.parse(row.semantic_review),
          warnings: JSON.parse(row.warnings),
          materialIssues: c.service.draftMaterialIssues(row),
          email: row.email,
          company_id: row.company_id,
        };
      budget.event('CONTROL', 'COMPLETED', {
        identity: domain,
        source_kind: 'FRESH_CONTROL',
        summary: c.summary(),
      });
      const r = c.store.one('SELECT * FROM runs ORDER BY started_at DESC LIMIT 1');
      if (r?.error) throw new DomainError(r.error, 'Control provider failure; no retry.');
    } finally {
      c.service.control('stop');
      await c.service.stopWorker();
      c.store.close();
    }
    writeFileSync(join(dir, 'reviews.json'), JSON.stringify(reviews, null, 2));
  }
  outcome = cycles.some((c) => c.metrics?.errors?.length) ? 'PARTIAL' : 'COMPLETE';
  stopReason = budget.reason() ?? 'BOUNDED_SCOPE_COMPLETED';
} catch (e) {
  stopReason = e instanceof DomainError ? e.code : 'SESSION_ERROR';
  outcome =
    stopReason === 'READER_ENVIRONMENT' || diagnosticOutcome(stopReason) === 'BLOCKED_EXTERNAL'
      ? 'BLOCKED_EXTERNAL'
      : 'PARTIAL';
  budget.event('SESSION', outcome, {
    code: stopReason,
    reason: cleanDiagnostic(e instanceof Error ? e.message : 'unknown'),
    during_controls: control,
  });
} finally {
  clearInterval(timer);
  d.service.control('stop');
  await d.service.stopWorker();
  capture();
  d.store.close();
  budget.state.endedAt = new Date().toISOString();
  budget.state.stopReason = stopReason;
  budget.save();
  budget.event('SESSION', outcome, {
    stop_reason: stopReason,
    real_sends: 0,
    manual_interventions: 0,
  });
  writeFileSync(
    join(dir, 'result.json'),
    JSON.stringify(
      {
        outcome,
        stopReason,
        budget: budget.state,
        limits,
        code,
        codeId,
        autonomous: true,
        round: false,
        cycles,
        newCompanyLimit: 20,
        controlLimit: 4,
        manualInterventions: 0,
      },
      null,
      2,
    ),
  );
  unlinkSync(lock);
  console.log(JSON.stringify({ outcome, stopReason, budget: budget.state }));
}
