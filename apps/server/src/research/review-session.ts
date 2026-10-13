import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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
  readonly limits: typeof reviewLimits;
  readonly state: {
    sessionId: string;
    startedAt: string;
    firstPublicAt: string | null;
    models: number;
    http: number;
    identities: string[];
    checkedDrafts: number;
    checkedDraftIds?: string[];
    limits?: typeof reviewLimits;
    endedAt: string | null;
    stopReason: string | null;
  };
  constructor(
    readonly dir: string,
    sessionId: string,
    resumeExisting = false,
    limits?: typeof reviewLimits,
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
    if (limits && this.state.limits && JSON.stringify(limits) !== JSON.stringify(this.state.limits))
      throw new Error('SESSION_LIMITS_MISMATCH');
    this.limits = this.state.limits ?? limits ?? reviewLimits;
    this.state.limits = this.limits;
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
      Date.now() - Date.parse(this.state.firstPublicAt) >= this.limits.milliseconds
    )
      return 'TIME_LIMIT';
    if (this.state.models >= this.limits.models) return 'MODEL_LIMIT';
    if (this.state.http >= this.limits.http) return 'HTTP_LIMIT';
    if (newFirm && this.state.identities.length >= this.limits.firms) return 'FIRM_LIMIT';
    if (newFirm && this.state.checkedDrafts >= this.limits.checkedDrafts)
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
      Date.now() - Date.parse(this.state.firstPublicAt) >= this.limits.milliseconds
        ? 'TIME_LIMIT'
        : this.state.models >= this.limits.models
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

// Explicit diagnostic input: public approved snapshot only, never a CV/material approval in WORKSTATION.
export function snapshotMaterials(path: string, provenance: { commit: string; path: string }) {
  if (!/^[a-f0-9]{40}$/.test(provenance.commit)) throw new Error('SNAPSHOT_COMMIT_REQUIRED');
  const raw = readFileSync(path, 'utf8');
  const rows = raw
    .split('\n')
    .filter((l) => l.startsWith('| fact-'))
    .map((l) =>
      l
        .split('|')
        .slice(1, -1)
        .map((v) => v.trim()),
    );
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
  if (
    rows.length !== 9 ||
    keys.some((k) => rows.filter((r) => r[1] === k && r[0] === 'fact-' + k && r[2]).length !== 1)
  )
    throw new Error('SNAPSHOT_FACTS_REQUIRED');
  const template = raw.match(/~~~text\n([\s\S]*?)\n~~~/)?.[1];
  const goal = raw.match(/^Cel: (.+)$/m)?.[1];
  if (!template || !goal) throw new Error('SNAPSHOT_TEMPLATE_REQUIRED');
  return {
    materials: {
      name: rows.find((r) => r[1] === 'identity')![2].replace(/\.$/, ''),
      goal,
      hoursApprox: 20,
      facts: Object.fromEntries(rows.map((r) => [r[1], r[2]])),
      template,
    },
    factIds: rows.map((r) => r[0]),
    provenance: {
      ...provenance,
      sha256: hash(raw),
      kind: 'PUBLIC_APPROVED_SNAPSHOT',
      cvVerifiedInThisRun: false,
    },
  };
}

export { relevantPageLinks } from './html.js';
