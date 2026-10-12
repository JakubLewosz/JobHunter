import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDocument } from 'htmlparser2';
import type { StructuredRunner } from './codex.js';
import { CodexCallError, cleanDiagnostic } from './codex.js';
import { DomainError, hash } from '../util.js';
import { defaultMessageTemplate } from './drafting.js';
import type { Materials } from './diagnostic.js';

export const reviewLimits = {
  milliseconds: 4 * 3600000,
  firms: 30,
  checkedDrafts: 20,
  models: 120,
  http: 150,
};
export class ReviewBudget {
  readonly state: {
    sessionId: string;
    startedAt: string;
    firstPublicAt: string | null;
    models: number;
    http: number;
    identities: string[];
    checkedDrafts: number;
    checkedDraftIds?: string[];
    endedAt: string | null;
    stopReason: string | null;
  };
  constructor(
    readonly dir: string,
    sessionId: string,
    resumeExisting = false,
  ) {
    const path = join(dir, 'budget.json');
    this.state = existsSync(path)
      ? JSON.parse(readFileSync(path, 'utf8'))
      : {
          sessionId,
          startedAt: new Date().toISOString(),
          firstPublicAt: null,
          models: 0,
          http: 0,
          identities: [],
          checkedDrafts: 0,
          endedAt: null,
          stopReason: null,
        };
    if (this.state.sessionId !== sessionId || (this.state.endedAt && !resumeExisting))
      throw new Error('SESSION_MISMATCH_OR_ALREADY_ENDED');
    this.state.checkedDraftIds ??= Array.from(
      { length: this.state.checkedDrafts },
      (_, i) => `previous-positive-${i + 1}`,
    );
    if (resumeExisting) {
      this.assertModel();
      this.state.endedAt = null;
      this.state.stopReason = null;
    }
    this.save();
  }
  save() {
    const path = join(this.dir, 'budget.json');
    writeFileSync(path + '.tmp', JSON.stringify(this.state, null, 2));
    renameSync(path + '.tmp', path);
  }
  event(stage: string, outcome: string, extra: Record<string, unknown> = {}) {
    appendFileSync(
      join(this.dir, 'events.jsonl'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        session_id: this.state.sessionId,
        stage,
        outcome,
        ...extra,
      }) + '\n',
    );
  }
  reason(newFirm = false): string | null {
    if (
      this.state.firstPublicAt &&
      Date.now() - Date.parse(this.state.firstPublicAt) >= reviewLimits.milliseconds
    )
      return 'TIME_LIMIT';
    if (this.state.models >= reviewLimits.models) return 'MODEL_LIMIT';
    if (this.state.http >= reviewLimits.http) return 'HTTP_LIMIT';
    if (newFirm && this.state.identities.length >= reviewLimits.firms) return 'FIRM_LIMIT';
    if (newFirm && this.state.checkedDrafts >= reviewLimits.checkedDrafts)
      return 'CHECKED_DRAFT_LIMIT';
    return null;
  }
  assert(newFirm = false) {
    const reason = this.reason(newFirm);
    if (reason) {
      this.event('BUDGET', reason);
      throw new DomainError('RESEARCH_BUDGET', reason);
    }
  }
  assertModel() {
    const reason =
      this.state.firstPublicAt &&
      Date.now() - Date.parse(this.state.firstPublicAt) >= reviewLimits.milliseconds
        ? 'TIME_LIMIT'
        : this.state.models >= reviewLimits.models
          ? 'MODEL_LIMIT'
          : null;
    if (reason) throw new DomainError('RESEARCH_BUDGET', reason);
  }
  recordChecked(ids: string[]) {
    const known = this.state.checkedDraftIds ?? [];
    this.state.checkedDraftIds = [...new Set([...known, ...ids])];
    // A new database or replay cannot lower an already observed positive-control counter.
    this.state.checkedDrafts = Math.max(
      this.state.checkedDrafts,
      this.state.checkedDraftIds.length,
    );
    this.save();
  }
  publicStart() {
    this.state.firstPublicAt ??= new Date().toISOString();
    this.save();
  }
  company(identity: string) {
    if (this.state.identities.includes(identity)) return false;
    this.assert(true);
    this.state.identities.push(identity);
    this.save();
    return true;
  }
  http(url: string) {
    this.assert();
    this.publicStart();
    this.state.http++;
    this.save();
    this.event('HTTP', 'STARTED', {
      source_kind: 'PUBLIC_HTTP',
      url,
      request_number: this.state.http,
    });
  }
  wrap(runner: StructuredRunner): StructuredRunner {
    return {
      inspect: (signal) => runner.inspect(signal),
      run: async (prompt, schema, options) => {
        this.assertModel();
        if (options?.search) this.publicStart();
        this.state.models++;
        this.save();
        this.event(options?.stage ?? 'MODEL', 'STARTED', {
          call_id: options?.callId,
          source_kind: options?.search ? 'SEARCH_LEAD' : 'MODEL',
          model_call_number: this.state.models,
        });
        try {
          const result = await runner.run(prompt, schema, options);
          this.event(options?.stage ?? 'MODEL', 'OK', {
            call_id: options?.callId,
            elapsed_ms: result.meta.elapsedMs,
            model: result.meta.model,
          });
          return result;
        } catch (e) {
          this.event(options?.stage ?? 'MODEL', 'ERROR', {
            call_id: options?.callId,
            code: e instanceof DomainError ? e.code : 'UNKNOWN',
            diagnostic:
              e instanceof CodexCallError
                ? e.diagnostic
                : { message: cleanDiagnostic(e instanceof Error ? e.message : 'unknown') },
          });
          throw e;
        }
      },
    };
  }
}

// Explicit approval is supplied by the caller after the human approves the local proposal.
// This reader never opens WORKSTATION, stores a CV or derives facts from its contents.
export function proposalMaterials(
  path: string,
  approved: boolean,
): { materials: Materials; proposal: any; proposalHash: string; cvHash: string } {
  if (!approved)
    throw new DomainError('PROFILE_BLOCKED', 'Wymagana zgoda użytkownika na dokładną propozycję.');
  const raw = readFileSync(path, 'utf8'),
    p = JSON.parse(raw);
  if (typeof p.sourcePdf !== 'string' || !/^[a-f0-9]{64}$/.test(p.sourceSha256 ?? ''))
    throw new DomainError('PROFILE_BLOCKED', 'Brak powiązania propozycji z wersją PDF.');
  const cvHash = hash(readFileSync(p.sourcePdf));
  if (cvHash !== p.sourceSha256)
    throw new DomainError('PROFILE_BLOCKED', 'Hash PDF różni się od zatwierdzonej propozycji.');
  const required = ['identity', 'education', 'availability', 'contract', 'ai', 'portfolio'];
  const allowed = [...required, 'autorelay', 'elektroscan', 'codefabric'];
  if (
    !p.name ||
    !p.goal ||
    p.hoursApprox !== 20 ||
    !p.facts ||
    required.some((key) => typeof p.facts[key] !== 'string' || !p.facts[key].trim()) ||
    Object.keys(p.facts).some((key) => !allowed.includes(key))
  )
    throw new DomainError(
      'PROFILE_BLOCKED',
      'Propozycja nie zawiera zatwierdzonego zestawu faktów.',
    );
  const constraints = [
    ...(p.projectStatusConstraints ?? []),
    p.materialScope?.projectSelection,
    'FixDesk pozostaje poza obecnym zestawem; osobny opis oczekuje na zatwierdzenie, bez permanentnego wykluczenia.',
    'Dodatkowe aktywności z CV poza automatyczną treścią pierwszych wiadomości.',
  ];
  return {
    materials: {
      name: p.name,
      goal: p.goal,
      hoursApprox: p.hoursApprox,
      facts: p.facts,
      template:
        defaultMessageTemplate +
        '\n\nOgraniczenia zatwierdzonego zestawu materiałów:\n' +
        constraints.filter(Boolean).join('\n'),
    },
    proposal: p,
    proposalHash: hash(raw),
    cvHash,
  };
}

// Follow only literal same-site navigation, never invented mailbox or guessed page paths.
export function relevantPageLinks(html: string, base: string): string[] {
  const root = parseDocument(html),
    matches: { url: string; score: number }[] = [];
  const text = (node: any): string =>
    node.type === 'text' ? node.data : (node.children ?? []).map(text).join(' ');
  const visit = (node: any, depth = 0) => {
    if (depth > 128 || ['script', 'style', 'noscript', 'template'].includes(node.name)) return;
    if (node.name === 'a' && node.attribs?.href) {
      try {
        const url = new URL(node.attribs.href, base);
        url.hash = '';
        const label = (text(node) + ' ' + url.pathname).toLowerCase();
        if (
          url.origin === new URL(base).origin &&
          !url.search &&
          !/privacy|cookie|polityk|regulamin|terms|login|sign.?in/.test(label)
        ) {
          const score = /career|karier|rekrut|join-us|jobs/.test(label)
            ? 5
            : /contact|kontakt/.test(label)
              ? 4
              : /services|usługi|offer|oferta|products|produkt/.test(label)
                ? 3
                : /about|o-nas|case-stud|realizac/.test(label)
                  ? 2
                  : 0;
          if (score && !/\.(pdf|png|jpg|zip)$/i.test(url.pathname))
            matches.push({ url: url.href, score });
        }
      } catch {}
    }
    for (const child of node.children ?? []) visit(child, depth + 1);
  };
  visit(root);
  return [...new Set(matches.sort((a, b) => b.score - a.score).map((v) => v.url))].slice(0, 12);
}
