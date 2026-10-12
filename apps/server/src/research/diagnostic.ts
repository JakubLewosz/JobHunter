import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Store } from '../db.js';
import { ResearchJobHunter, CodexSearchProvider } from './service.js';
import { DisabledMailProvider } from '../providers.js';
import { ExecCodexRunner, type StructuredRunner } from './codex.js';
import type { SourceReader } from './fetcher.js';
import { contactEligibility, validateAnalysis } from './contracts.js';
import { hash } from '../util.js';
import Database from 'better-sqlite3';
import { workstationRuntime } from '../runtime.js';

type Materials = {
  name: string;
  goal: string;
  hoursApprox: number;
  template: string;
  facts: Record<string, string>;
};
export function diagnosticOutcome(code: string | null) {
  return code &&
    [
      'CODEX_LOGIN',
      'CODEX_LIMIT',
      'CLI_MISSING',
      'CLI_START',
      'CODEX_TIMEOUT',
      'SEARCH_UNAVAILABLE',
    ].includes(code)
    ? 'BLOCKED_EXTERNAL'
    : 'FAILED';
}
export function approvedDiagnosticMaterials(base: string): Materials {
  workstationRuntime(join(base, 'research-only')).assertNative();
  const db = new Database(join(base, 'research-only', 'jobhunter.sqlite'), {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return db.transaction(() => {
      const profile = db
        .prepare("SELECT * FROM candidate_profiles WHERE id='candidate'")
        .get() as any;
      const facts = db
        .prepare(
          "SELECT fact_key,content,approval_status FROM candidate_facts WHERE profile_id='candidate'",
        )
        .all() as any[];
      if (
        !profile?.approved_at ||
        profile.availability_mode !== 'APPROX' ||
        !facts.length ||
        facts.some((f) => f.approval_status !== 'APPROVED')
      )
        throw new Error('APPROVED_MATERIALS_REQUIRED');
      const template = db
        .prepare("SELECT value FROM app_state WHERE key='messageTemplate'")
        .get() as any;
      return {
        name: profile.name,
        goal: profile.goal,
        hoursApprox: profile.hours_approx,
        template: JSON.parse(template.value),
        facts: Object.fromEntries(facts.map((f) => [f.fact_key, f.content])),
      };
    })();
  } finally {
    db.close();
  }
}

class DiagnosticResearch extends ResearchJobHunter {
  protected override enqueue(key: string, query: string | null, maxDrafts: number) {
    const run = super.enqueue(key, query, maxDrafts);
    this.store.exec('INSERT INTO auto_run_scope VALUES (?,?)', run, hash('DIAGNOSTIC_ONLY'));
    return run;
  }
}

export function createPublicDiagnostic(
  dir: string,
  options: {
    runner?: StructuredRunner;
    reader?: SourceReader;
    maxCompanies?: number;
    materials?: Materials;
  } = {},
) {
  if (existsSync(join(dir, 'jobhunter.sqlite')))
    throw new Error('DIAGNOSTIC_REQUIRES_NEW_DIRECTORY');
  const store = new Store(dir),
    runner = options.runner ?? new ExecCodexRunner();
  const search = new CodexSearchProvider(runner);
  const maximum = Math.min(10, Math.max(1, options.maxCompanies ?? 5));
  // AUTO's public qualification/drafting branch, instantiated without GmailJobHunter or a gateway.
  const service = new DiagnosticResearch(store, {
    mode: 'AUTO_POLICY',
    runner,
    reader: options.reader,
    search: {
      search: async (query, signal) => {
        const r = await search.search(query, signal);
        return { ...r, urls: r.urls.slice(0, maximum) };
      },
    },
  });
  if (!(service.mail instanceof DisabledMailProvider) || 'gateway' in service)
    throw new Error('DIAGNOSTIC_MAIL_DISABLED_REQUIRED');
  const synthetic: Record<string, string> = {
    identity:
      'Alex Testowy — fikcyjny kandydat do technicznej diagnostyki, nie rzeczywisty użytkownik.',
    education: 'Fikcyjny uczeń technikum programistycznego.',
    contract: 'Fikcyjny cel: płatna, regularna współpraca programistyczna.',
    ai: 'W fikcyjnym projekcie korzysta z Codexa przy kodowaniu i samodzielnie sprawdza kod.',
    portfolio: 'Fikcyjne portfolio: https://github.com/FixtureExample',
    fixdesk:
      'FixtureDesk: fikcyjny lokalny projekt obsługi usterek PHP/Laravel, bez wdrożenia produkcyjnego.',
    autorelay:
      'FixtureRelay: fikcyjny lokalny projekt webhooków i integracji API, bez wdrożenia produkcyjnego.',
    codefabric:
      'FixtureModels: fikcyjny prototyp lokalnych modeli językowych, bez wdrożenia produkcyjnego.',
    elektroscan:
      'FixturePDF: fikcyjny lokalny projekt analizy dokumentów PDF, bez wdrożenia produkcyjnego.',
  };
  const syntheticTemplate = `Dzień dobry,

Nazywam się Alex Testowy i jestem fikcyjnym uczniem technikum programistycznego. Szukam regularnej, płatnej współpracy programistycznej.

[Konkretny fakt o firmie i jeden pasujący projekt wyłącznie z zatwierdzonych faktów fikcyjnego profilu.]

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

[Jedno krótkie pytanie o możliwość takiej współpracy.]

GitHub: https://github.com/FixtureExample

Pozdrawiam
Alex Testowy`;
  const p = service.profile();
  if (options.materials && p.facts.some((f) => !options.materials!.facts[f.fact_key])) {
    store.close();
    throw new Error('APPROVED_FACTS_INCOMPLETE');
  }
  service.updateProfile({
    name: options.materials?.name ?? 'Alex Testowy',
    goal:
      options.materials?.goal ??
      'Fikcyjny kandydat: płatna zdalna współpraca około 20 godzin po lekcjach.',
    hours_approx: options.materials?.hoursApprox ?? 20,
    version: p.version,
    message_template: options.materials?.template ?? syntheticTemplate,
    facts: p.facts.map((f) => ({
      id: f.id,
      content:
        (options.materials?.facts ?? synthetic)[f.fact_key] ??
        'Fikcyjna dostępność około 20 godzin tygodniowo, po lekcjach.',
    })),
  });
  service.approveProfile();
  store.set('diagnosticOnly', true);
  store.exec('UPDATE campaigns SET max_candidates=? WHERE id=?', maximum, service.campaignId);
  const summary = () => {
    const run = store.one('SELECT status,stage,error FROM runs ORDER BY started_at DESC LIMIT 1');
    const decisions = store.all('SELECT * FROM research_items').map((item) => {
      if (typeof item.analysis !== 'string' || !item.analysis.startsWith('{'))
        return { allowed: false, reason: item.error ?? item.status };
      try {
        const sources = service.sourcesFor(item);
        return contactEligibility(validateAnalysis(JSON.parse(item.analysis), sources), sources);
      } catch {
        return { allowed: false, reason: 'Niepotwierdzony wynik analizy źródła.' };
      }
    });
    const skipped: Record<string, number> = {};
    for (const decision of decisions.filter((r) => !r.allowed))
      skipped[decision.reason] = (skipped[decision.reason] ?? 0) + 1;
    return {
      outcome:
        run?.status === 'COMPLETED'
          ? 'COMPLETED'
          : run?.error
            ? diagnosticOutcome(run.error)
            : run
              ? 'INCOMPLETE'
              : 'NOT_STARTED',
      stage: run?.stage ?? null,
      error: run?.error ?? null,
      synthetic: !options.materials,
      mailDisabled: true,
      firms: decisions.length,
      pagesRead: store.one("SELECT count(*) n FROM research_sources WHERE status='READ'")!.n,
      extractionsCompleted: store.one('SELECT count(*) n FROM research_extractions')!.n,
      qualificationsCompleted: store.one('SELECT count(*) n FROM research_qualifications')!.n,
      contactsQualified: decisions.filter((r) => r.allowed).length,
      drafts: service.draftRows().length,
      skipped,
      itemErrors: store.all(
        "SELECT stage,error AS code,count(*) AS count FROM research_items WHERE status='ERROR' GROUP BY stage,error ORDER BY stage,error",
      ),
      modelErrors: store.all(
        "SELECT stage,error AS code,count(*) AS count FROM model_calls WHERE status='ERROR' GROUP BY stage,error ORDER BY stage,error",
      ),
      reviews: service.draftRows().map((d) => JSON.parse(d.semantic_review)),
      attempts: store.one('SELECT count(*) n FROM send_attempts')!.n,
      outbox: store.one('SELECT count(*) n FROM outbox')!.n,
    };
  };
  return { service, store, summary };
}
