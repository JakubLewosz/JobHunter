import { mkdirSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Store } from '../db.js';
import type { Row } from '../../../../packages/shared/types.js';
import { DomainError } from '../util.js';
import { normalizeResearchURL } from './query-planner.js';

type ReportStore = Pick<Store, 'all' | 'one' | 'get'>;
const parse = (value: string | null, fallback: any = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};
const controllerResultSchema = z
  .object({
    phase: z.literal('FINISHED'),
    reason: z.string().regex(/^[A-Z][A-Z0-9_]{0,99}$/),
    at: z.iso.datetime(),
    sessionId: z.string().min(1).optional(),
    audit: z
      .object({ sessionId: z.string().min(1) })
      .passthrough()
      .optional(),
  })
  .passthrough();

export function researchReport(
  store: ReportStore,
  at = new Date().toISOString(),
  scope?: Row,
  controllerResult?: unknown,
) {
  const session = scope ?? store.get<Row>('researchDay', {});
  let controller: z.infer<typeof controllerResultSchema> | undefined;
  if (controllerResult !== undefined) {
    const parsed = controllerResultSchema.safeParse(controllerResult);
    if (!parsed.success)
      throw new DomainError(
        'INVALID_REPORT_RESULT',
        'Wymagany końcowy wynik kontrolera z kodem przyczyny i datą.',
      );
    controller = parsed.data;
    const ids = [controller.sessionId, controller.audit?.sessionId].filter(Boolean);
    if (
      session.active ||
      !session.sessionId ||
      !ids.length ||
      ids.some((id) => id !== session.sessionId)
    )
      throw new DomainError(
        'REPORT_SCOPE_MISMATCH',
        'Wynik kontrolera nie dotyczy tej zakończonej sesji.',
      );
  }
  // STOPPED/PAUSED can be cleanup states after an external controller failure.
  // Do not infer a transport failure (or an operator decision) from those states.
  const sessionReason =
    session.finalReason && !['STOPPED', 'PAUSED'].includes(session.finalReason)
      ? session.finalReason
      : null;
  const termination = {
    recordedState: session.finalReason ?? null,
    reason: controller?.reason ?? sessionReason,
    reasonSource: controller
      ? 'CONTROLLER_RESULT'
      : sessionReason
        ? 'SESSION_STATE'
        : 'UNAVAILABLE',
    controllerRecordedAt: controller?.at ?? null,
  };
  const ids =
    session.runIds ??
    store
      .all("SELECT id FROM runs WHERE campaign_id='research' ORDER BY started_at")
      .map((r) => r.id);
  const jsonIds = JSON.stringify(ids);
  const runs = store.all(
    'SELECT * FROM runs WHERE id IN (SELECT value FROM json_each(?)) ORDER BY started_at',
    jsonIds,
  );
  const items = store
    .all(
      'SELECT i.*,c.canonical_name,o.type,o.decision,o.reasons,t.email,t.kind,t.literal_verified FROM research_items i LEFT JOIN companies c ON c.id=i.company_id LEFT JOIN opportunities o ON o.id=i.opportunity_id LEFT JOIN contacts t ON t.id=o.contact_id WHERE i.run_id IN (SELECT value FROM json_each(?)) ORDER BY i.created_at,i.id',
      jsonIds,
    )
    .map(
      (
        i,
      ): Row & {
        sourceIds: string[];
        analysis: any;
        disposition: Row | null;
        extractionFailure: Row | null;
        sourceFallback: Row | null;
        contactIntent: Row | null;
      } => ({
        ...i,
        sourceIds: parse(i.source_ids, []),
        analysis: parse(i.analysis),
        reasons: parse(i.reasons, []),
        disposition: store.get<Row | null>(`draftDisposition:${i.id}`, null),
        extractionFailure: store.get<Row | null>(`extractionFailure:${i.id}`, null),
        sourceFallback: store.get<Row | null>(`sourceFallback:${i.id}`, null),
        contactIntent: store.get<Row | null>(`researchContactIntent:${i.id}`, null),
      }),
    );
  const sourceIds = JSON.stringify([
    ...new Set(
      items.flatMap((i) => [...i.sourceIds, ...(i.sourceFallback?.failedSourceIds ?? [])]),
    ),
  ]);
  const sources = store.all(
    'SELECT id,original_url,final_url,title,status,http_status,fetched_at,content_hash,error FROM research_sources WHERE id IN (SELECT value FROM json_each(?)) ORDER BY fetched_at',
    sourceIds,
  );
  const drafts = store
    .all(
      'SELECT DISTINCT d.id,d.company_id,d.version,d.subject,d.body,d.status,d.created_at,c.canonical_name,t.email,t.kind,t.literal_verified,q.details,m.code_status,m.review_status,r.semantic_review,r.warnings AS saved_warnings FROM drafts d JOIN research_items i ON i.opportunity_id=d.opportunity_id JOIN companies c ON c.id=d.company_id JOIN contacts t ON t.id=d.contact_id LEFT JOIN research_qualifications q ON q.opportunity_id=d.opportunity_id LEFT JOIN research_drafts r ON r.draft_id=d.id LEFT JOIN research_draft_materials m ON m.draft_id=d.id AND m.version=d.version WHERE i.run_id IN (SELECT value FROM json_each(?)) ORDER BY d.created_at,d.id',
      jsonIds,
    )
    .map(
      (
        d,
      ): Row & {
        analysis: any;
        semanticReview: any;
        warnings: string[];
        createdDuringSession: boolean;
      } => ({
        ...d,
        analysis: parse(d.details),
        semanticReview: parse(d.semantic_review),
        warnings: [...new Set<string>(parse(d.saved_warnings, []))],
        details: undefined,
        semantic_review: undefined,
        saved_warnings: undefined,
        createdDuringSession: !!session.startedAt && d.created_at >= session.startedAt,
      }),
    );
  const calls = store.all(
    'SELECT id,run_id,stage,status,error,elapsed_ms,input_tokens,output_tokens,cached_input_tokens FROM model_calls WHERE run_id IN (SELECT value FROM json_each(?))',
    jsonIds,
  );
  // An item failure and its source failures belong to one case, not several independent failures.
  const errors = items
    .filter((i) => i.error || ['ERROR', 'UNAVAILABLE'].includes(i.status))
    .map((i) => ({
      itemId: i.id,
      url: i.url,
      code: i.error,
      extraction: i.extractionFailure,
      sources: sources
        .filter((s) => i.sourceIds.includes(s.id) && s.status !== 'READ')
        .map((s) => ({ ...s, error: parse(s.error, s.error) })),
    }));
  const metrics = runs.map((r) => store.get<Row | null>(`readerMetrics:${r.id}`, null));
  const sum = (key: string) => metrics.reduce((n, m) => n + (m?.[key] ?? 0), 0);
  const transportMeasured = metrics.every((m) => m !== null && !(m.missingMeasurements ?? 0));
  const companies = [
    ...new Map(
      items
        .filter((i) => i.company_id)
        .map((i) => [i.company_id, { id: i.company_id, name: i.canonical_name }]),
    ).values(),
  ];
  return {
    schemaVersion: 1,
    generatedAt: at,
    mode: 'RESEARCH_ONLY',
    session,
    termination,
    stopped: store.get('stopped', true),
    paused: store.get('paused', true),
    lastProgressAt:
      runs
        .map((r) => r.heartbeat ?? r.updated_at)
        .sort()
        .at(-1) ?? null,
    summary: {
      cycles: runs.length,
      candidateEntries: items.length,
      distinctURLs: new Set(items.map((i) => normalizeResearchURL(i.url))).size,
      companies: companies.length,
      drafts: drafts.length,
      newDrafts: drafts.filter((d) => d.createdDuringSession).length,
      errorCases: errors.length,
      sourceErrors: sources.filter((s) => s.status !== 'READ').length,
      modelCalls: calls.length,
      modelErrors: calls.filter((c) => c.status === 'ERROR').length,
      sourceRecords: sources.length,
      fetches: sum('FETCH'),
      cacheHits: sum('CACHE'),
      failureCacheHits: sum('FAILURE_CACHE'),
      httpRequests: transportMeasured ? sum('httpRequests') : null,
      redirects: transportMeasured ? sum('redirects') : null,
      wireBytes: transportMeasured ? sum('wireBytes') : null,
      decodedBytes: transportMeasured ? sum('decodedBytes') : null,
      inputTokens: calls.reduce((n, c) => n + (c.input_tokens ?? 0), 0),
      outputTokens: calls.reduce((n, c) => n + (c.output_tokens ?? 0), 0),
      cachedInputTokens: calls.reduce((n, c) => n + (c.cached_input_tokens ?? 0), 0),
    },
    companies,
    runs,
    items,
    drafts,
    sources,
    errors,
    modelErrors: calls.filter((c) => c.status === 'ERROR'),
  };
}
export function researchReportText(report: ReturnType<typeof researchReport>) {
  const { summary: s, session } = report;
  const lines = [
    'JobHunter — raport RESEARCH_ONLY',
    `Stan: ${session.finalReason ?? (session.active ? 'W TRAKCIE' : 'ZATRZYMANY')}`,
    `Przyczyna zakończenia: ${report.termination.reason ?? 'brak osobno zapisanej przyczyny; sam stan nie rozstrzyga powodu'}; źródło: ${report.termination.reasonSource}`,
    `Początek: ${session.startedAt ?? 'brak danych'}; koniec: ${session.finishedAt ?? 'brak danych'}; deadline: ${session.expiresAt ?? 'brak danych'}`,
    `Ostatni postęp: ${report.lastProgressAt ?? 'brak danych'}; aktualizacja raportu: ${report.generatedAt}`,
    `Cykle: ${s.cycles}; wpisy kandydatów: ${s.candidateEntries}; różne URL: ${s.distinctURLs}; firmy: ${s.companies}`,
    `Szkice: ${s.drafts}; nowe w sesji: ${s.newDrafts}; przypadki błędów: ${s.errorCases}; błędy źródeł: ${s.sourceErrors}; błędy modeli: ${s.modelErrors}`,
    `Źródła zapisane: ${s.sourceRecords}; odczyty: ${s.fetches}; cache: ${s.cacheHits}; cache błędów: ${s.failureCacheHits}; HTTP: ${s.httpRequests ?? 'brak pomiaru'}; przekierowania: ${s.redirects ?? 'brak pomiaru'}`,
    'Szkice wymagają aktualnych kontroli i odrębnego uprawnienia do wysyłki. Niepotwierdzone warunki pozostają niepotwierdzone.',
    '',
    'FIRMY I PRZYCZYNY BRAKU SZKICU',
  ];
  for (const i of report.items) {
    lines.push(
      `${i.canonical_name ?? i.url} | ${i.type ?? 'nierozpoznana'} | ${i.status} | ${i.disposition?.reason ?? i.error ?? 'brak zapisanej przyczyny'}`,
    );
    if (i.reasons?.length) lines.push(`Kwalifikacja: ${JSON.stringify(i.reasons)}`);
    if (i.contactIntent)
      lines.push(
        `Przeznaczenie: ${i.contactIntent.intent}; dopuszczone=${i.contactIntent.allowed}; ${i.contactIntent.reason}`,
      );
    if (i.sourceFallback?.failedSourceIds?.length)
      lines.push(`Inne źródło: ${JSON.stringify(i.sourceFallback)}`);
  }
  lines.push('', 'PEŁNE WIADOMOŚCI');
  for (const d of report.drafts) {
    lines.push(
      '',
      `${d.canonical_name} — wersja ${d.version}`,
      `Odbiorca: ${d.email}; cel: ${d.kind}; status: ${d.status}`,
      `Kontrole zapisanej wersji: kod=${d.code_status ?? 'brak'}, review=${d.review_status ?? 'brak'}, semantyka=${JSON.stringify(d.semanticReview)}`,
      `Dowód kontaktu: ${JSON.stringify(d.analysis?.contact?.proof ?? null)}`,
      `Warunki: ${JSON.stringify(d.analysis?.conditions ?? null)}`,
      `Temat: ${d.subject}`,
      '',
      d.body,
    );
    if (d.warnings.length)
      lines.push('Zapisane zastrzeżenia:', ...d.warnings.map((warning) => `- ${warning}`));
  }
  lines.push('', 'PRZYPADKI BŁĘDÓW');
  for (const error of report.errors) lines.push(JSON.stringify(error));
  for (const error of report.modelErrors) lines.push(`Model: ${JSON.stringify(error)}`);
  lines.push('', 'CYKLE I ŹRÓDŁA');
  for (const run of report.runs)
    lines.push(
      `${run.id} | ${run.status} | ${run.stage} | koniec=${run.finished_at ?? 'brak'} | ${run.error ?? ''}`,
    );
  for (const source of report.sources)
    lines.push(
      `${source.id} | ${source.final_url ?? source.original_url} | ${source.status} | ${source.fetched_at} | SHA-256 ${source.content_hash ?? 'brak'}`,
    );
  return lines.join('\r\n') + '\r\n';
}
export function writeResearchReport(directory: string, report: ReturnType<typeof researchReport>) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const target = realpathSync(directory),
    repository = realpathSync(process.cwd());
  const rel = relative(repository, target);
  if (!rel || (!rel.startsWith('..') && !isAbsolute(rel)))
    throw new DomainError(
      'PRIVATE_REPORT_PATH',
      'Raport prywatny musi pozostać poza repozytorium.',
    );
  const paths = {
    json: join(target, 'Raport_research.json'),
    text: join(target, 'Raport_research.txt'),
  };
  for (const [path, content] of [
    [paths.json, JSON.stringify(report, null, 2) + '\n'],
    [paths.text, researchReportText(report)],
  ]) {
    const temp = join(dirname(path), `.${randomUUID()}.tmp`);
    writeFileSync(temp, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    renameSync(temp, path);
  }
  return paths;
}
