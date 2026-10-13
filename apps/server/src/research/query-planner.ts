import { Store } from '../db.js';
import { companyHistoryBlocks } from '../prior-applications.js';
import { hash, iso } from '../util.js';
import type { Row } from '../../../../packages/shared/types.js';
import { dayQueries } from './service.js';
import { contactEligibility, qualifyReal, validateAnalysis } from './contracts.js';
import { projectSelection } from './drafting.js';
import type { Source } from './fetcher.js';

export const normalizeQuery = (query: string) =>
  query
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
export function normalizeResearchURL(value: string) {
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()])
    if (/^(utm_|fbclid$|gclid$|ref$)/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
  return url.href;
}
const companies = [
  'zespoły produktowe SaaS',
  'małe software house’y',
  'agencje internetowe',
  'firmy z własnym oprogramowaniem',
];
const sectors = [
  'logistyka',
  'edukacja',
  'handel internetowy',
  'finanse',
  'produkcja',
  'usługi biznesowe',
];
const places = ['Polska', 'Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Białystok', 'Łódź'];
const signals = [
  'działalność i kontakt',
  'kariera i otwarte kandydatury',
  'produkty i zespół techniczny',
];
const topics: Record<string, string> = {
  fixdesk: 'aplikacje webowe PHP Laravel',
  autorelay: 'integracje API i automatyzacje',
  codefabric: 'narzędzia LLM',
  elektroscan: 'przetwarzanie dokumentów PDF',
};

// Queries are proposals, never evidence about a company. State belongs to the local policy.
export class QueryPlanner {
  constructor(
    private store: Store,
    private clock: () => Date,
    private materialIssues: (draft: Row) => string[] = () => ['DRAFT_CHECK_UNAVAILABLE'],
  ) {}
  private now() {
    return iso(this.clock());
  }
  reconcile(scopeHash: string) {
    for (const row of this.store.all(
      "SELECT * FROM auto_query_plan WHERE scope_hash=? AND status='RUNNING'",
      scopeHash,
    )) {
      const run = this.store.one('SELECT * FROM runs WHERE id=?', row.run_id);
      if (!run || !['COMPLETED', 'PARTIAL'].includes(run.status)) continue;
      const items = this.store.all('SELECT * FROM research_items WHERE run_id=?', run.id);
      const topicCounts: Record<string, number> = {
        fixdesk: 0,
        autorelay: 0,
        codefabric: 0,
        elektroscan: 0,
      };
      const allowed = new Map<string, string>(),
        offers = new Set<string>(),
        rejected = new Set<string>(),
        missing = new Set<string>(),
        checked = new Set<string>();
      const facts = this.store.all(
        "SELECT id,fact_key AS key,content,approval_status FROM candidate_facts WHERE approval_status='APPROVED'",
      );
      for (const item of items) {
        if (!item.analysis || !item.company_id || !item.opportunity_id) {
          if (!['ERROR', 'UNAVAILABLE'].includes(item.status)) missing.add(item.id);
          continue;
        }
        try {
          const sources = this.store.all(
            'SELECT * FROM research_sources WHERE id IN (SELECT value FROM json_each(?))',
            item.source_ids,
          ) as Source[];
          const a = validateAnalysis(JSON.parse(item.analysis), sources);
          const fit = qualifyReal(a),
            contact = contactEligibility(a, sources);
          const company = this.store.one('SELECT * FROM companies WHERE id=?', item.company_id)!;
          if (fit.decision === 'READY_APPLICATION') offers.add(item.company_id);
          if (companyHistoryBlocks(this.store, company)) continue;
          if (contact.allowed) {
            if (!allowed.has(item.company_id)) {
              allowed.set(item.company_id, contact.intent);
              // The same verified task selector used by drafting; no second title/stack matcher.
              for (const p of projectSelection(facts, a).selected) topicCounts[p.fact.key]++;
            }
          } else if (
            fit.decision === 'NEEDS_REVIEW' &&
            /Niepotwierdzone|Brak osobnego|Sprzeczne/.test(contact.reason)
          )
            missing.add(item.company_id);
          else rejected.add(item.company_id);
          const draft = this.store.one(
            'SELECT d.*,r.semantic_review,m.code_status,m.review_status FROM drafts d JOIN research_drafts r ON r.draft_id=d.id JOIN research_draft_materials m ON m.draft_id=d.id AND m.version=d.version WHERE d.opportunity_id=? ORDER BY d.version DESC LIMIT 1',
            item.opportunity_id,
          );
          if (draft) {
            const review = JSON.parse(draft.semantic_review);
            if (
              draft.code_status === 'PASS' &&
              draft.review_status === 'COMPLETED' &&
              review.supported === true &&
              !review.issues.length &&
              !this.materialIssues(draft).length
            )
              checked.add(item.company_id);
          }
        } catch {
          missing.add(item.id);
        }
      }
      for (const key of allowed.keys()) {
        rejected.delete(key);
        missing.delete(key);
      }
      const metrics = {
        topicCounts,
        newCompanies: run.discovered,
        duplicates: run.duplicates,
        sourcesRead: this.store.one(
          "SELECT count(DISTINCT s.id) n FROM research_items i,json_each(i.source_ids) j JOIN research_sources s ON s.id=j.value WHERE i.run_id=? AND s.status='READ'",
          run.id,
        )!.n,
        contacts: allowed.size,
        matchedOffers: offers.size,
        openApplications: [...allowed.values()].filter((i) => i === 'OPEN_APPLICATION').length,
        companyInquiries: [...allowed.values()].filter(
          (i) => i === 'COMPANY_INQUIRY' || i === 'CONDITIONS_INQUIRY',
        ).length,
        checkedDrafts: checked.size,
        rejected: rejected.size,
        missingData: missing.size,
        errors: items
          .filter((i) => ['ERROR', 'UNAVAILABLE'].includes(i.status))
          .map((i) => i.error),
      };
      this.store.exec(
        "UPDATE auto_query_plan SET status='DONE',metrics=?,updated_at=? WHERE id=?",
        JSON.stringify(metrics),
        this.now(),
        row.id,
      );
      const key = `plannerEmpty:${scopeHash}`;
      const technicalFailure = !!run.error || metrics.errors.length > 0;
      const empty = technicalFailure
        ? 0
        : run.discovered === 0
          ? this.store.get<number>(key, 0) + 1
          : 0;
      this.store.set(key, empty);
      if (empty >= 3)
        this.store.set(
          `plannerCooldown:${scopeHash}`,
          iso(
            new Date(
              this.clock().getTime() +
                Math.min(3600000 * 2 ** (Math.floor(empty / 3) - 1), 86400000),
            ),
          ),
        );
    }
  }
  next(policy: Row, facts: Row[]): { query?: string; id?: string; nextAt?: string } {
    const scopeHash = policy.scopeHash ?? policy.policyHash;
    this.reconcile(scopeHash);
    const cooldown = this.store.get<string>(`plannerCooldown:${scopeHash}`, '');
    if (cooldown > this.now()) return { nextAt: cooldown };
    const directions = Object.keys(topics).filter((k) =>
      facts.some((f) => f.key === k && f.approval_status !== 'DRAFT'),
    );
    let technology = directions.length
      ? directions.map((k) => topics[k])
      : ['aplikacje i narzędzia programistyczne'];
    const outcomes = this.store.all(
      "SELECT query,metrics FROM auto_query_plan WHERE scope_hash=? AND status='DONE' ORDER BY updated_at DESC LIMIT 100",
      scopeHash,
    );
    technology.sort((a, b) => {
      const score = (topic: string) =>
        outcomes.reduce((sum, r) => {
          const m = JSON.parse(r.metrics);
          const key = Object.keys(topics).find((k) => topics[k] === topic)!;
          return sum + (m.topicCounts?.[key] ?? 0) * 3;
        }, 0);
      return score(b) - score(a);
    });
    const count = this.store.one(
      'SELECT count(*) n FROM auto_query_plan WHERE scope_hash=?',
      scopeHash,
    )!.n;
    const cursorKey = `plannerCursor:${scopeHash}`;
    let cursor = this.store.get<number>(cursorKey, 0);
    if (cursor >= 8) {
      const key = `plannerTopics:${scopeHash}`;
      const selected = this.store.get<string[] | null>(key, null);
      if (selected) technology = selected;
      else this.store.set(key, technology);
    }
    // Bounded expansion; after exhausting the combinations only due old directions can repeat.
    const combinations =
      companies.length * sectors.length * places.length * signals.length * technology.length;
    if (count < 8 + combinations) {
      let query: string;
      if (cursor < 8) query = `${policy.searchScope}\n${dayQueries[cursor]}`;
      else {
        let n = cursor - 8;
        const pick = (values: string[]) => {
          const v = values[n % values.length];
          n = Math.floor(n / values.length);
          return v;
        };
        const topic = pick(technology),
          sector = pick(sectors),
          company = pick(companies),
          place = pick(places),
          signal = pick(signals);
        query = `${policy.searchScope}\nPolska, wiadomości po polsku. ${company}; ${sector}; ${topic}; ${place}; ${signal}. Szukaj publicznych stron firm z dowodem działalności; bez wymogu wakatu. Te słowa są kierunkiem wyszukiwania, nie faktami o firmie.`;
      }
      this.store.exec(
        'INSERT OR IGNORE INTO auto_query_plan (id,scope_hash,query,normalized_query,next_at,updated_at) VALUES (?,?,?,?,?,?)',
        hash(scopeHash + normalizeQuery(query)),
        scopeHash,
        query,
        normalizeQuery(query),
        this.now(),
        this.now(),
      );
      const completed = this.store.one(
        "SELECT id FROM research_queries WHERE profile_hash=? AND query=? AND status='DONE' AND updated_at>?",
        policy.profileHash ?? '',
        query,
        iso(new Date(this.clock().getTime() - 86400000)),
      );
      if (completed)
        this.store.exec(
          "UPDATE auto_query_plan SET status='DONE',updated_at=? WHERE scope_hash=? AND normalized_query=?",
          this.now(),
          scopeHash,
          normalizeQuery(query),
        );
      this.store.set(cursorKey, cursor + 1);
    }
    const planned = this.store.one(
      "SELECT * FROM auto_query_plan WHERE scope_hash=? AND (status='PENDING' OR (status='DONE' AND updated_at<=?)) ORDER BY CASE status WHEN 'PENDING' THEN 0 ELSE 1 END,updated_at,rowid LIMIT 1",
      scopeHash,
      iso(new Date(this.clock().getTime() - 86400000)),
    );
    return planned
      ? { id: planned.id, query: planned.query }
      : { nextAt: iso(new Date(this.clock().getTime() + 3600000)) };
  }
  started(planId: string, runId: string) {
    this.store.exec(
      "UPDATE auto_query_plan SET status='RUNNING',run_id=?,attempts=attempts+1,updated_at=? WHERE id=?",
      runId,
      this.now(),
      planId,
    );
  }
}
