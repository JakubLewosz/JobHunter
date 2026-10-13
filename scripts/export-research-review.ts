import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { parse } from 'csv-parse/sync';
import { hash } from '../apps/server/src/util.js';
import { contactUsage, qualifyReal } from '../apps/server/src/research/contracts.js';
import { projectSelection } from '../apps/server/src/research/drafting.js';
import { cleanDiagnostic } from '../apps/server/src/research/codex.js';

const dir = resolve(process.argv[2] ?? '');
if (!existsSync(join(dir, 'result.json')) || existsSync(join(dir, 'run.lock')))
  throw new Error('STOPPED_RESEARCH_REQUIRED');
const read = (file: string) => JSON.parse(readFileSync(join(dir, file), 'utf8'));
const result = read('result.json'),
  budget = read('budget.json'),
  materials = read('materials-used.json');
const round = result.round === true;
const privacy = existsSync(join(dir, 'redactions.json'))
  ? read('redactions.json')
  : { emails: [], phones: [] };
const redact = (text: string) => {
  for (const email of privacy.emails) text = text.replaceAll(email, '[EMAIL_KANDYDATA_USUNIĘTY]');
  for (const phone of privacy.phones) text = text.replaceAll(phone, '[TELEFON_KANDYDATA_USUNIĘTY]');
  return text;
};
const md = (value: unknown) =>
  redact(String(value ?? 'nieznane'))
    .replaceAll('|', '\\|')
    .replaceAll('\n', '<br>');
const cell = (value: unknown) => {
  const plain = redact(String(value ?? 'nieznane'));
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(plain) ? "'" + plain : plain;
  return '"' + safe.replaceAll('"', '""') + '"';
};
const events: any[] = readFileSync(join(dir, 'events.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((s) => JSON.parse(s));
const paths = [
  ...new Set(
    readdirSync(dir)
      .filter((f) => /^database-path(?:-batch-\d+)?\.txt$/.test(f))
      .map((f) => readFileSync(join(dir, f), 'utf8').trim()),
  ),
];
const tables: Record<string, any[]> = {};
const tableNames = [
  'companies',
  'research_items',
  'research_sources',
  'research_extractions',
  'research_qualifications',
  'opportunities',
  'contacts',
  'evidence',
  'research_evidence',
  'research_draft_materials',
  'research_drafts',
  'drafts',
  'model_calls',
  'send_attempts',
  'outbox',
  'draft_approvals',
  'auto_sessions',
  'audit_events',
  'app_state',
];
for (const path of paths) {
  const db = new Database(join(path, 'jobhunter.sqlite'), { readonly: true, fileMustExist: true });
  try {
    for (const name of tableNames)
      (tables[name] ??= []).push(...db.prepare(`SELECT * FROM ${name}`).all());
  } finally {
    db.close();
  }
}
if (
  tables.send_attempts.length ||
  tables.outbox.length ||
  tables.draft_approvals.length ||
  tables.auto_sessions.length
)
  throw new Error('ZERO_SEND_INVARIANT_FAILED');
const sources = new Map(tables.research_sources.map((s) => [s.id, s]));
if (existsSync(join(dir, 'system-ca-probe.json'))) {
  const source = read('system-ca-probe.json');
  sources.set(source.id, { ...source, diagnostic_only: true });
}
const reviews = read('reviews.json');
const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'nieznane';
  }
};
const rows: any[] = budget.identities.map((domain: string) => {
  const items = tables.research_items.filter((i) => domainOf(i.url) === domain);
  const completed = items.filter((i) => i.company_id && i.analysis?.startsWith('{'));
  const last = completed.at(-1) ?? items.at(-1);
  const analysis = completed.length ? JSON.parse(completed.at(-1).analysis) : null;
  const company = analysis ? tables.companies.find((c) => c.id === last.company_id) : null;
  const cid = company?.id ?? 'candidate-' + (last?.id ?? hash(domain).slice(0, 12));
  const sourceIds = [...new Set(items.flatMap((i) => JSON.parse(i.source_ids)))];
  // Include reads that were retained before a budget stop or failed import.
  for (const source of sources.values())
    if (domainOf(source.original_url) === domain && !sourceIds.includes(source.id))
      sourceIds.push(source.id);
  const drafts = tables.research_draft_materials.filter((m) =>
    tables.drafts.some((d) => d.id === m.draft_id && d.company_id === company?.id),
  );
  const qualifications = tables.research_qualifications
    .filter((q) => items.some((i) => i.opportunity_id === q.opportunity_id))
    .map((q) => {
      const o = tables.opportunities.find((o) => o.id === q.opportunity_id);
      return {
        analysis: JSON.parse(q.details),
        decision: o?.decision,
        reasons: JSON.parse(o?.reasons ?? '[]'),
      };
    });
  const opportunity = tables.opportunities.find((o) => o.id === last?.opportunity_id);
  const projects = [
    ...new Set(
      drafts.flatMap((d) =>
        JSON.parse(d.context_json)
          .profile.facts.filter((f: any) =>
            ['autorelay', 'elektroscan', 'codefabric'].includes(f.key),
          )
          .map((f: any) => f.key),
      ),
    ),
  ];
  const conditions = analysis?.conditions ?? {};
  const known = Object.entries(conditions)
    .filter(([, v]: any) => v.value !== 'unknown')
    .map(([k, v]: any) => `${k}=${v.value}; scope=${v.scope ?? 'UNKNOWN'}; ${v.explanation}`);
  const unknown = Object.entries(conditions)
    .filter(([, v]: any) => v.value === 'unknown')
    .map(([k]) => k);
  const matched = drafts.filter(
    (d) =>
      d.code_status === 'PASS' &&
      d.review_status === 'COMPLETED' &&
      reviews[d.draft_id + ':' + d.version]?.semantic?.supported === true &&
      !reviews[d.draft_id + ':' + d.version]?.semantic?.issues?.length,
  );
  const skip = !analysis
    ? (last?.error ?? 'Odczyt niedokończony; brak zweryfikowanej analizy.')
    : opportunity?.decision === 'REJECTED'
      ? [
          ...(qualifications.at(-1)?.reasons ?? [opportunity.decision]).slice(0, 2),
          ...(qualifications.at(-1)?.reasons ?? []).filter((r: string) =>
            /^\w+: (no|conflicting)/.test(r),
          ),
        ].join('; ')
      : !drafts.length
        ? `Nie wygenerowano: ${opportunity?.decision ?? 'brak kwalifikacji'}`
        : matched.length
          ? ''
          : drafts
              .map(
                (d) =>
                  d.code_error ??
                  JSON.stringify(
                    reviews[d.draft_id + ':' + d.version]?.semantic ?? { supported: null },
                  ),
              )
              .join('; ');
  return {
    company_id: cid,
    name: analysis?.company ?? 'Nazwa niezweryfikowana',
    domain,
    url: last?.url ?? events.find((e) => e.stage === 'COMPANY' && e.identity === domain)?.url,
    scope:
      events.find((e) => e.stage === 'COMPANY' && e.identity === domain && e.scope)?.scope ?? 'NEW',
    usage: analysis
      ? contactUsage(analysis, sourceIds.map((sid) => sources.get(sid)).filter(Boolean))
      : 'UNVERIFIED',
    offerDecision: analysis ? qualifyReal(analysis).decision : 'UNVERIFIED',
    calls: tables.model_calls.filter((c) => items.some((i) => i.run_id === c.run_id)).length,
    requests: events.filter((e) => e.stage === 'HTTP' && domainOf(e.url) === domain).length,
    type: analysis
      ? (({ ACTIVE: 'A', OPEN: 'B', PROSPECT: 'C' } as any)[analysis.type] ?? 'nieznany')
      : 'nieznany',
    business: analysis?.inquiryBasis?.quote
      ? 'Dowód źródłowy: ' + analysis.inquiryBasis.quote.slice(0, 180)
      : 'Działalność nieustalona w zapisanej analizie; ' +
        (analysis ? 'udokumentowano ' + analysis.title : 'brak zweryfikowanej ekstrakcji'),
    email: analysis?.contact.email ?? 'brak potwierdzonego adresu',
    purpose: analysis?.contact.kind ?? 'UNKNOWN',
    source_ids: sourceIds,
    known,
    unknown: analysis ? unknown : ['wszystkie warunki niezweryfikowane'],
    projects,
    result: matched.length
      ? 'FULLY_CHECKED'
      : drafts.length
        ? 'DRAFT_UNVERIFIED_OR_REJECTED'
        : analysis
          ? 'QUALIFIED_NO_DRAFT_OR_REJECTED'
          : 'READ_BLOCKED_OR_INCOMPLETE',
    skip,
    draft_ids: [...new Set(drafts.map((d) => d.draft_id))],
    analysis,
    drafts,
    items,
    qualifications,
    matched,
    duplicate_of: null,
  };
});
const canonical = new Map<string, string>();
for (const row of rows) {
  if (canonical.has(row.company_id)) row.duplicate_of = canonical.get(row.company_id);
  else canonical.set(row.company_id, row.company_id);
}
const factMap = new Map(
  Object.entries(materials.materials.facts).map(([key, content]) => [
    'fact-' + key,
    { key, content },
  ]),
);
const evidenceMap = new Map(tables.research_evidence.map((r) => [r.evidence_id, r]));
const missing: any[] = [];
const stageErrors: any[] = [];
const versions = tables.research_draft_materials.map((m) => {
  const payload = JSON.parse(m.payload_json),
    context = JSON.parse(m.context_json);
  const d = tables.drafts.find((d) => d.id === m.draft_id)!;
  const r = reviews[m.draft_id + ':' + m.version] ?? {
    semantic: { supported: null, issues: ['Brak zachowanej oceny tej wersji.'] },
  };
  for (const id of payload.factIds)
    if (!factMap.has(id)) missing.push({ draft_id: m.draft_id, fact_id: id });
  for (const id of payload.evidenceIds)
    if (!evidenceMap.has(id)) missing.push({ draft_id: m.draft_id, evidence_id: id });
  const original = payload.subject + '\n' + payload.body,
    exported = redact(original);
  const checked =
    m.code_status === 'PASS' &&
    m.review_status === 'COMPLETED' &&
    r.semantic.supported === true &&
    !r.semantic.issues.length;
  return {
    ...m,
    payload,
    context,
    company_id: d.company_id,
    email: r.email ?? tables.contacts.find((c) => c.id === d.contact_id)?.email,
    review: r.semantic,
    warnings: r.warnings ?? [],
    checked,
    original_text_hash: hash(original),
    exported_text_hash: hash(exported),
    redacted: original !== exported,
  };
});
const checkHistory = existsSync(join(dir, 'checks-history.json'))
  ? read('checks-history.json')
  : [];
for (const call of tables.model_calls.filter((c) => c.status === 'ERROR')) {
  const item = tables.research_items.find((i) => i.run_id === call.run_id);
  stageErrors.push({
    company_id:
      item?.company_id ??
      rows.find((r) => r.items.some((i: any) => i.id === item?.id))?.company_id ??
      null,
    call_id: call.id,
    stage: call.stage,
    code: call.error,
    diagnostic: call.diagnostic
      ? JSON.parse(call.diagnostic)
      : { message: 'Przyczyna nieustalona.' },
    attempts: 1,
  });
}
for (const item of tables.research_items.filter((i) => i.status === 'ERROR')) {
  const call = tables.model_calls
    .filter((c) => c.run_id === item.run_id && c.stage === item.stage)
    .at(-1);
  stageErrors.push({
    company_id:
      item.company_id ?? rows.find((r) => r.items.some((i: any) => i.id === item.id))?.company_id,
    call_id: call?.id ?? null,
    item_id: item.id,
    stage: item.stage,
    code: item.error,
    attempts: item.attempts,
    validation: tables.app_state.find((s) => s.key === `extractionFailure:${item.id}`)?.value
      ? JSON.parse(tables.app_state.find((s) => s.key === `extractionFailure:${item.id}`).value)
      : null,
    reason:
      item.error === 'UNVERIFIED_TITLE'
        ? 'Tytuł nie ma sprawdzonego literalnego cytatu; ograniczona diagnostyka jest w validation, jeśli została zachowana.'
        : 'Szczegółowa przyczyna poza zapisanym kodem nieustalona.',
    impact:
      item.error === 'UNAPPROVED_LINK'
        ? 'Pierwotne odrzucenie kodowe; późniejsza rzeczywista kontrola tego samego tekstu po poprawce w WIADOMOSCI.'
        : 'Brak zatwierdzonej ekstrakcji/wiadomości tego etapu; pozostałe firmy kontynuowano.',
  });
}
const sourceFailures = [...sources.values()].filter((s) => s.status !== 'READ');
const httpURLs = events.filter((e) => e.stage === 'HTTP').map((e) => e.url);
const counts = {
  unique_requested_pages: new Set(httpURLs).size,
  unique_read_pages: new Set(
    [...sources.values()]
      .filter((s) => s.status === 'READ')
      .map((s) => s.final_url ?? s.original_url),
  ).size,
  repeat_http_requests: httpURLs.length - new Set(httpURLs).size,
  new_firms_started: rows.filter((r) => r.scope === 'NEW').length,
  new_firms_analyzed: rows.filter((r) => r.scope === 'NEW' && r.analysis).length,
  controls_analyzed: rows.filter((r) => r.scope === 'CONTROL' && r.analysis).length,
  technically_blocked_firms: rows.filter((r) => !r.analysis).length,
  versions_with_selected_project: versions.filter(
    (v) => v.context.profile.projectSelection?.selected?.length,
  ).length,
  versions_mentioning_selected_project: versions.filter((v) =>
    v.context.profile.projectSelection?.selected?.some((p: any) =>
      new RegExp(p.fact.key, 'i').test(v.payload.body),
    ),
  ).length,
  proposed_identities: budget.identities.length,
  analyzed_unique_firms: new Set(rows.filter((r) => r.analysis).map((r) => r.company_id)).size,
  index_rows: rows.length,
  http_requests: budget.http,
  fresh_reads_retained: [...sources.values()].filter((s) => s.status === 'READ').length,
  extraction_calls: tables.model_calls.filter((c) => c.stage === 'EXTRACT').length,
  extractions_completed: tables.research_extractions.length,
  qualifications_completed: tables.research_qualifications.length,
  public_contacts_literal: rows.filter((r) => r.analysis?.contact?.email).length,
  contacts_qualified: rows.filter((r) =>
    r.qualifications.some((q: any) => q.decision?.startsWith('READY_')),
  ).length,
  retained_versions: versions.length,
  fully_checked_drafts: new Set(versions.filter((v) => v.checked).map((v) => v.draft_id)).size,
  code_rejected_versions: versions.filter((v) => v.code_status === 'REJECTED').length,
  historical_code_rejections: new Set(
    checkHistory
      .filter((h: any) => h.code_status === 'REJECTED')
      .map((h: any) => h.draft_id + ':' + h.version),
  ).size,
  extraction_validation_errors: tables.research_items.filter(
    (i) => i.stage === 'EXTRACT' && i.status === 'ERROR',
  ).length,
  semantic_rejected_versions: versions.filter(
    (v) => v.review_status === 'COMPLETED' && v.review.supported === false,
  ).length,
  unverified_versions: versions.filter((v) => !v.checked).length,
  rejected_firms: rows.filter((r) => r.analysis && r.qualifications.at(-1)?.decision === 'REJECTED')
    .length,
  historical_rejected_firm_decisions: rows.filter(
    (r) => r.analysis && r.qualifications.some((q: any) => q.decision === 'REJECTED'),
  ).length,
  source_failures_retained: sourceFailures.length,
  model_errors: tables.model_calls.filter((c) => c.status === 'ERROR').length,
  model_calls_total: budget.models,
  duplicates: events.filter((e) => /DUPLICATE/.test(e.outcome)).length,
  replay_batches: events.filter((e) =>
    [
      'RESUME_EXISTING_ONLY',
      'SINGLE_REPLAY_AFTER_PACKET_DEDUP',
      'FINAL_CONTROL_CORRECTION',
    ].includes(e.outcome),
  ).length,
  real_sends: 0,
  outbox: 0,
  send_attempts: 0,
  send_approvals: 0,
  active_auto_sessions: 0,
};
const status =
  result.outcome === 'BLOCKED_EXTERNAL'
    ? 'BLOCKED_EXTERNAL'
    : counts.analyzed_unique_firms
      ? 'PARTIAL'
      : 'BLOCKED_EXTERNAL';
const dateParts = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
}).format(new Date(budget.startedAt));
const name = dateParts.replace(' ', '_').replace(':', '-') + '_' + budget.sessionId;
const output = resolve('docs/research-review', name);
mkdirSync(output, { recursive: true });
const write = (name: string, text: string) =>
  writeFileSync(join(output, name), redact(text), 'utf8');
const header = [
  'company_id',
  'nazwa',
  'domena',
  'url',
  'A_B_C',
  'dzialalnosc',
  'adres',
  'przeznaczenie',
  'source_ids',
  'znane_warunki',
  'nieznane_warunki',
  'projekt',
  'wynik',
  'powod_pominiecia',
  'draft_ids',
  'duplicate_of',
  'zakres_proby',
  'zakres_adresu',
  'decyzja_oferta',
  'model_calls',
  'http_requests',
];
write(
  'FIRMY.csv',
  header.map(cell).join(',') +
    '\n' +
    rows
      .map((r) =>
        [
          r.company_id,
          r.name,
          r.domain,
          r.url,
          r.type,
          r.business,
          r.email,
          r.purpose,
          r.source_ids.join(';'),
          r.known.join('; '),
          r.unknown.join('; '),
          r.projects.join(';') || 'brak',
          r.result,
          r.skip,
          r.draft_ids.join(';'),
          r.duplicate_of ?? '',
          r.scope,
          r.usage,
          r.offerDecision,
          r.calls,
          r.requests,
        ]
          .map(cell)
          .join(','),
      )
      .join('\n') +
    '\n',
);
let messages =
  '# Zachowane wiadomości\n\nWysyłki: 0. Są to rzeczywiste wyniki generatora; pozytywna kontrola nie udziela zgody na kontakt. Kopie publiczne nie są poprawiane stylistycznie.\n\n';
for (const v of versions) {
  messages += `## ${v.company_id} — ${v.draft_id}, wersja ${v.version}\n\nOdbiorca: ${v.email ?? 'brak potwierdzonego adresu'}. Generacja: ${v.created_at}.\n\nKod: **${v.code_status}**; review: **${v.review_status}**, supported=${v.review.supported}. Pełne przejście kontroli: **${v.checked}**.\n\nUwagi: ${md(JSON.stringify({ code_error: v.code_error, review_error: v.review_error, review: v.review, warnings: v.warnings }))}.\n\nTemat: **${redact(v.payload.subject)}**\n\n~~~text\n${redact(v.payload.body)}\n~~~\n\nHash tekstu oryginalnego (temat + LF + treść): ${v.original_text_hash}. Hash kopii publicznej: ${v.exported_text_hash}. Redakcje: ${v.redacted ? 'telefon/prywatny email kandydata; znaczniki jawne' : 'brak; tekst zachowany'}; hash całego payloadu: ${v.payload_hash}.\n\nGenerator otrzymał factIds: ${v.context.profile.facts.map((f: any) => f.id).join(', ')}.\n\n| Deklaracja | Rodzaj | factIds | evidenceIds → sourceIds |\n| --- | --- | --- | --- |\n`;
  for (const claim of v.payload.claims)
    messages += `| ${md(claim.text)} | ${claim.kind} | ${claim.factIds.join(', ')} | ${claim.evidenceIds.map((id: string) => id + ' → ' + (evidenceMap.get(id)?.source_id ?? 'BRAK')).join(', ')} |\n`;
  messages +=
    '\nDobór projektu faktycznie przekazany generatorowi i review:\n\n~~~json\n' +
    JSON.stringify(
      v.context.profile.projectSelection ?? { reason: 'OLD_SELECTOR_NO_AUDIT' },
      null,
      2,
    ) +
    '\n~~~\n\nGenerator otrzymał evidenceIds → sourceIds: ' +
    v.context.evidence.map((e: any) => e.id + ' → ' + e.sourceId).join(', ') +
    '\n\n';
  messages +=
    '\nHistoria kontroli tego samego tekstu (wcześniejszego odrzucenia nie nadpisujemy w raporcie):\n\n| Czas | Etap | Kod | Review | code_id |\n| --- | --- | --- | --- | --- |\n' +
    checkHistory
      .filter((h: any) => h.draft_id === v.draft_id && h.version === v.version)
      .map(
        (h: any) =>
          `| ${h.timestamp} | ${h.stage} | ${h.code_status}: ${md(h.code_error ?? 'brak')} | ${h.review_status}: ${md(JSON.stringify(h.semantic))} | ${h.code_id} |`,
      )
      .join('\n') +
    '\n\n';
  if (v.code_status === 'REJECTED' || v.review.supported === false || v.review_status === 'ERROR')
    stageErrors.push({
      company_id: v.company_id,
      draft_id: v.draft_id,
      version: v.version,
      stage: v.code_status === 'REJECTED' ? 'CODE_CHECK' : 'SEMANTIC_REVIEW',
      code: v.code_error ?? v.review_error ?? 'SEMANTIC_FALSE',
      reason: v.review,
      attempts: 1,
    });
}
messages +=
  '\n## Firmy bez szkicu\n\n' +
  rows
    .filter((r) => !r.draft_ids.length)
    .map((r) => `- ${r.company_id} (${r.name}; ${r.domain}): **niewygenerowany**. ${md(r.skip)}.`)
    .join('\n') +
  '\n';
write('WIADOMOSCI.md', messages);
const sourceCompany = (source: any) =>
  rows.filter((r) => r.source_ids.includes(source.id)).map((r) => r.company_id);
let sourceText =
  '# Źródła i mapowanie dowodów\n\nŚwieży PUBLIC_HTTP oznacza rzeczywisty odczyt parserem aplikacji. FETCH_FAILED nie potwierdza zawartości witryny. Trop z web search nie jest dowodem. Pierwsza partia sprzed użycia systemowego CA zachowuje pierwotne statusy; późniejsze odczyty są osobnymi źródłami. Nie udostępniamy pełnych kopii stron.\n\n';
for (const source of sources.values()) {
  const quotes: string[] = [];
  for (const row of rows.filter((r) => r.analysis && r.source_ids.includes(source.id))) {
    const a = row.analysis;
    for (const proof of [
      a.companyProof,
      a.titleProof,
      a.typeProof,
      a.inquiryBasis,
      ...(a.companyActivities ?? []),
      ...Object.values(a.conditions),
      ...a.requirements,
      a.contact.proof,
    ].filter(Boolean))
      if ((proof as any).sourceId === source.id && (proof as any).quote)
        quotes.push((proof as any).quote);
  }
  const unique = [...new Set(quotes)];
  sourceText += `## ${source.id}\n\nFirmy: ${sourceCompany(source).join(', ') || 'brak przypisania — diagnostyka sieciowa lub przerwany odczyt'}.\n\nURL: [${source.original_url}](${source.original_url}). Końcowy URL: ${source.final_url ?? 'brak'}.\n\nTytuł: ${md(source.title || 'brak odczytanego tytułu')}. Czas: ${source.fetched_at}; metoda: ${source.method}; status: **${source.status}**; HTTP: ${source.http_status ?? 'null'}; parser: ${source.parser_version ?? 'null'}; błąd: ${source.error ?? 'brak'}.\n\n`;
  let quoteBudget = 1000;
  for (const quote of unique) {
    if (quoteBudget <= 0) {
      sourceText +=
        'Pozostałe fragmenty pominięte z limitu krótkich cytatów; nie są przedstawiane jako opublikowane w całości.\n\n';
      break;
    }
    const excerpt = quote.slice(0, Math.min(260, quoteBudget));
    quoteBudget -= excerpt.length;
    sourceText +=
      '> ' +
      excerpt.replaceAll('\n', '\n> ') +
      '\n\n' +
      (excerpt.length < quote.length
        ? '(Dosłowny początek fragmentu; dalsza część nieopublikowana.)\n\n'
        : '');
  }
  if (!unique.length)
    sourceText += 'Brak zweryfikowanych cytatów użytych do analizy lub personalizacji.\n\n';
  const contacts = rows.filter(
    (r) => r.analysis?.contact?.proof?.sourceId === source.id && r.analysis.contact.email,
  );
  for (const row of contacts) {
    const context = JSON.parse(source.address_contexts ?? '[]').find(
      (c: any) => c.email.toLowerCase() === row.analysis.contact.email.toLowerCase(),
    );
    sourceText += `Kontakt: **${row.analysis.contact.email}**, przeznaczenie **${row.purpose}**. Literalny kontekst adresu wskazany w analizie:\n\n> ${row.analysis.contact.proof.quote.slice(0, 220).replaceAll('\n', '\n> ')}\n\nKontekst parsera i cytat modelu kontrolowano osobno; nie zmieniamy UNKNOWN w RECRUITMENT podczas eksportu.\n\n`;
  }
}
sourceText +=
  '## evidence_id → source_id\n\n| evidence_id | source_id | Krótki dosłowny fragment |\n| --- | --- | --- |\n';
for (const r of tables.research_evidence)
  sourceText += `| ${r.evidence_id} | ${r.source_id} | ${md(JSON.parse(r.facts).join('\n').slice(0, 100))} (początek; dalsze krótkie cytaty przy source_id wyżej) |\n`;
sourceText += '\n## Tropy wyszukiwarki\n\n';
for (const e of events.filter((e) => ['LEADS_SAVED', 'SEARCH_CACHE_REPLAY'].includes(e.outcome))) {
  sourceText +=
    `### ${e.timestamp} — ${e.outcome}\n\n` +
    e.candidates
      .map(
        (c: any) =>
          `- ${c.url}; podpowiedziany contactUrl: ${c.contactUrl ?? 'brak'}; **trop, bez potwierdzenia treści**.`,
      )
      .join('\n') +
    '\n\n';
}
write('ZRODLA.md', sourceText.replace(/[ \t]+$/gm, '').trimEnd() + '\n');
write(
  'PROFIL_UZYTY.md',
  (round
    ? '# Zatwierdzone materiały rzeczywiście użyte\n\nPochodzenie: publiczny snapshot zatwierdzonego profilu. cvVerifiedInThisRun=false; w tej próbie nie odczytano PDF.\n\n~~~json\n' +
      JSON.stringify(materials.provenance, null, 2) +
      '\n~~~\n\n'
    : '# Zatwierdzone materiały rzeczywiście użyte\n\nUżytkownik zatwierdził zestaw do tej diagnostyki i publikacji. Hash PDF sprawdzono bez edycji; PDF pozostaje poza repo. Podczas ekstrakcji użyto poniższego zestawu; generator dostawał podzbiór projektów wybrany przez istniejący kod. Dokładne ID podzbioru są przy każdej wersji wiadomości. Dodatkowe aktywności CV nie zostały przekazane jako fakty.\n\n') +
    `Cel: ${materials.materials.goal}\n\n| ID | Klucz | Dokładna treść |\n| --- | --- | --- |\n` +
    [...factMap].map(([id, f]: any) => `| ${id} | ${f.key} | ${md(f.content)} |`).join('\n') +
    '\n\n## Schemat i ograniczenia przekazane jako template\n\n~~~text\n' +
    materials.materials.template +
    '\n~~~\n',
);
let errors =
  '# Błędy i odrzucenia\n\n## Wykonanie\n\nPierwsza partia: wszystkie odczyty FETCH_FAILED. Kontrolny odczyt tej samej strony BizCode odtworzył UNABLE_TO_VERIFY_LEAF_SIGNATURE. Dla pozostałych wcześniejszych żądań szczegółowej przyczyny nie zapisano — nie przypisujemy im wstecz potwierdzonego kodu TLS. Node 24 obsługuje --use-system-ca; kontrolny odczyt z magazynem Windows dał 200/READ bez wyłączania TLS, DNS/SSRF lub sandboxa Codexa. Następna partia jest rzeczywistym ponowieniem rozpoczętych przypadków w niezerowanym budżecie.\n\n';
errors +=
  'Mała poprawka kontroli linków: kropka kończąca zdanie w zatwierdzonym fakcie portfolio była porównywana jako część URL. Fixture odtworzył UNAPPROVED_LINK przed zmianą; po normalizacji wyłącznie końcowej interpunkcji test przechodzi, a inny docelowy URL pozostaje blokowany. Dwa zachowane teksty sprawdzono ponownie bez nowej generacji i bez zmiany faktów. Wyniki przed i po są jawne w historii kontroli.\n\n';
if (round)
  errors =
    '# Błędy i odrzucenia\n\nBłędy transportu, walidacji i wynik review są odrębne. Historycznego UNVERIFIED_TITLE Payarto nie rekonstruujemy: dawny payload nie został zachowany. Nowe błędy tytułu zachowują ograniczoną diagnostykę.\n\n';
errors += checkHistory
  .filter((h: any) => h.stage === 'BEFORE_CODE_FIX_RECHECK' && h.code_error)
  .map((h: any) => '~~~json\n' + JSON.stringify(h, null, 2) + '\n~~~\n')
  .join('\n');
errors += stageErrors.map((e) => '~~~json\n' + JSON.stringify(e, null, 2) + '\n~~~\n').join('\n');
errors +=
  '\n### Nieudane odczyty publiczne\n\n| source_id | Firma | Status | Oczyszczony kod | Próby |\n| --- | --- | --- | --- | --- |\n' +
  sourceFailures
    .map(
      (s) =>
        `| ${s.id} | ${sourceCompany(s).join(', ')} | ${s.status} | ${s.error ?? 'przyczyna nieustalona'} | 1 |`,
    )
    .join('\n');
errors +=
  '\n\n## Wyniki merytoryczne\n\n' +
  rows
    .filter((r) => r.skip)
    .map((r) => `- ${r.company_id} (${r.domain}): ${md(r.skip)}.`)
    .join('\n') +
  '\n\nNiepoprawne/niepewne szkice nie zostały zatwierdzone. Brak szkicu nie jest odrzuceniem treści. Dawne CODEX_FAILED nie były ponownie diagnozowane.\n';
write('BLEDY.md', errors);
const timeline = events.map((e) => {
  const enriched = {
    ...e,
    company_id:
      e.company_id ??
      rows.find((r) => r.domain === e.identity || (e.url && domainOf(e.url) === r.domain))
        ?.company_id ??
      null,
  };
  if (enriched.diagnostic?.message)
    enriched.diagnostic.message = cleanDiagnostic(enriched.diagnostic.message);
  return enriched;
});
for (const call of tables.model_calls) {
  const item = tables.research_items.find((i) => i.run_id === call.run_id);
  timeline.push({
    timestamp: call.created_at,
    session_id: budget.sessionId,
    stage: call.stage,
    outcome: call.status,
    call_id: call.id,
    company_id:
      item?.company_id ??
      rows.find((r) => r.items.some((i: any) => i.id === item?.id))?.company_id ??
      null,
    source_kind: 'MODEL_RECORDED_IN_DATABASE',
    code: call.error,
  });
}
write(
  'PRZEBIEG.jsonl',
  timeline
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((e) => JSON.stringify(e))
    .join('\n') + '\n',
);
const top = rows
  .filter((r) => r.analysis && r.matched.length)
  .sort((a, b) => b.matched.length - a.matched.length)
  .slice(0, 5);
const batches = events.filter(
  (e) => ['STARTED', 'RESUME_EXISTING_ONLY'].includes(e.outcome) && e.stage === 'SESSION',
);
write(
  'README.md',
  `# Publiczna diagnostyka JobHuntera — ${name}\n\nStatus: **${status}**. Początek: ${budget.startedAt}; pierwszy publiczny query: ${budget.firstPublicAt}; koniec researchu: ${budget.endedAt} (UTC; katalog według Europe/Warsaw). Powód zatrzymania: **${budget.stopReason}**.\n\nKod bazowy: ${result.code.head}; podczas badań **dirty**. Partie i hashe faktycznie użytych źródeł są w MANIFEST; poprawka nie zmienia wstecz wyników. Pierwsza partia nie potwierdziła źródeł i nie oznacza udanego researchu mimo technicznego COMPLETED cykli. Dalsza partia dokańczała wcześniej rozpoczęte przypadki, bez nowych firm i bez zerowania limitu.\n\n` +
    '| Licznik | Wartość |\n| --- | ---: |\n' +
    Object.entries(counts)
      .map(([k, v]) => `| ${k} | ${v} |`)
      .join('\n') +
    '\n\nLimity: 4 h od pierwszego publicznego query / 30 tożsamości firm / 20 szkiców po kontroli / 120 wywołań modelu / 150 żądań HTTP (także błędne, redirecty i kontrola sieci). Limit firm zastosowano konserwatywnie do rozpoczętych tożsamości: samo nieudane pobranie nie jest właściwą analizą firmy. Wyszukiwanie, świeży HTTP i replay mają oddzielne zdarzenia.\n\n## Firmy do dalszej oceny\n\n' +
    (top.length
      ? top
          .map(
            (r) =>
              `- **${r.name}** (${r.type}; ${r.domain}): ${r.business}. Wynik: ${r.result}. Nieznane: ${r.unknown.join(', ') || 'brak oznaczonych nieznanych'}. Ocena kolejności jest propozycją autora raportu, nie informacją od pracodawcy.`,
          )
          .join('\n')
      : 'Brak firmy po właściwej analizie; nie tworzymy zastępczego rankingu z niezweryfikowanych tropów.') +
    '\n\n## Zakres i ograniczenia\n\nPrawdziwe wysyłki **0**, Gmail nieinicjalizowany, brak transportu, approvals/outbox/auto sessions. Nic nie otrzymało CONTACTED z powodu researchu. Nie utworzono produkcyjnej historii, WORKSTATION lub backupu produkcyjnego. Fingoweb wykluczony; nie importowano 33 dawnych nazw. Materiały zatwierdzone tylko w odrębnej bazie diagnostycznej. Nie sprawdzono Gmaila ani gotowości do całodziennej wysyłki.\n\nCSV: apostrof jest ochroną komórek zaczynających się od znaku formuły; nie jest częścią danych źródłowych. Cytaty mogą być jawnie skrócone; nie publikujemy witryn w całości. Wszystkie zachowane wersje, także negatywne, są w WIADOMOSCI.\n\n## Pliki\n\n' +
    [
      'FIRMY.csv',
      'WIADOMOSCI.md',
      'ZRODLA.md',
      'PROFIL_UZYTY.md',
      'BLEDY.md',
      'PRZEBIEG.jsonl',
      'MANIFEST.json',
    ]
      .map((f) => `- [${f}](${f})`)
      .join('\n') +
    '\n',
);
if (round) {
  const historical = resolve('docs/research-review/2026-10-12_23-29_windows-01a1313a');
  const before = parse(readFileSync(join(historical, 'FIRMY.csv'), 'utf8'), { columns: true });
  let comparison =
    '# Porównanie przypadków kontrolnych\n\nHistoryczny raport pozostaje niezmieniony. Fixture jest rekonstrukcją opublikowanych skróconych cytatów, nie dawnym HTML. Świeży odczyt ma nowe sourceIds i czas; nie dowodzi, że dawna strona była identyczna. Żadnej dawnej utraconej odpowiedzi nie odtwarzamy.\n\n';
  for (const r of rows.filter((r) => r.scope === 'CONTROL')) {
    const old = before.find((b: any) => b.domena === r.domain);
    const selection = r.drafts.at(-1)
      ? JSON.parse(r.drafts.at(-1).context_json).profile.projectSelection
      : r.analysis
        ? projectSelection(
            [...factMap].map(([id, f]: any) => ({ id, ...f })),
            r.analysis,
            tables.evidence
              .filter((e) => e.company_id === r.company_id)
              .map((e) => ({ ...e, sourceId: evidenceMap.get(e.id)?.source_id })),
          )
        : null;
    comparison += `## ${r.name} (${r.domain})\n\nPrzed: ${old?.wynik}; ${old?.powod_pominiecia || 'kontrole PASS'}. Projekt przed: ${old?.projekt}.\n\nTeraz: ${r.result}; decyzja oferty ${r.offerDecision}; kontakt ${r.purpose}/${r.usage}; ${r.skip || 'nowy tekst przeszedł kontrole'}. Warunki nieznane: ${r.unknown.join(', ')}.\n\nŹródła nowego wyniku: ${r.source_ids.join(', ')}. Nowa generacja: ${r.draft_ids.join(', ') || 'brak'}.\n\n~~~json\n${JSON.stringify(selection, null, 2)}\n~~~\n\n`;
  }
  comparison +=
    'Mechanizmy: dobór z literalnych usług/produktów zamiast samego tytułu; brak preferencji umowy pozostaje unknown, nie zgodą na B2B; rekrutacyjne pytanie nie dopuszcza CV; OFFER nie jest odmową COMPANY; OPEN/PROSPECT nie potrzebuje wymyślonego wakatu. Payarto: utracona historyczna wartość tytułu pozostaje nieustalona. OKE: dawny opis usług nie był opublikowany, dlatego podstawą jest świeży odczyt.\n';
  comparison +=
    '\n## Zachowane etapy tej sesji\n\n| itemId | URL | etap | status | kod | typ | kontakt |\n| --- | --- | --- | --- | --- | --- | --- |\n' +
    tables.research_items
      .map((i) => {
        const a = i.analysis?.startsWith('{') ? JSON.parse(i.analysis) : null;
        return `| ${i.id} | ${i.url} | ${i.stage} | ${i.status} | ${i.error ?? 'brak'} | ${a?.type ?? 'brak'} | ${a?.contact?.kind ?? 'brak'} |`;
      })
      .join('\n') +
    '\n';
  write('POROWNANIE.md', comparison);
  const historicalMessages = readFileSync(join(historical, 'WIADOMOSCI.md'), 'utf8').split(
    '## Firmy bez szkicu',
  )[0];
  write(
    'WIADOMOSCI.md',
    messages +
      '\n## Wersje historyczne — osobny raport, nie nowe generacje\n\nPoniższe dwie wersje zachowano bez zmiany; nie są w licznikach tej sesji.\n\n' +
      historicalMessages,
  );
  write(
    'README.md',
    `# Publiczna diagnostyka macOS — ${name}\n\nStatus **${status}**, zakończenie zakresu: ${budget.stopReason}. ${budget.firstPublicAt}–${budget.endedAt} UTC; Europe/Warsaw = UTC+02:00. Czas publicznej części: ${((Date.parse(budget.endedAt) - Date.parse(budget.firstPublicAt)) / 60000).toFixed(2)} min.\n\nBazowy commit: ${result.code.head}; badania używały zmienionego kodu o hashach w MANIFEST. DEVELOPMENT, osobna diagnostyczna SQLite poza repo. Profil: publiczny zatwierdzony snapshot z ${materials.provenance.commit}; cvVerifiedInThisRun=false.\n\nPreflight wykonano tym samym PublicSourceReader i procesem Node ${process.version} z --use-system-ca. Oficjalna dokumentacja: [Node 24.11.0](https://nodejs.org/download/release/v24.11.0/docs/api/cli.html#--use-system-ca). Bez zmian magazynu certyfikatów lub ustawień konta.\n\n| Licznik | Wynik |\n| --- | ---: |\n` +
      Object.entries(counts)
        .map(([k, v]) => `| ${k} | ${v} |`)
        .join('\n') +
      '\n\nBudżet: 90 minut od pierwszej operacji publicznej, 150 HTTP (redirecty, retry i błędy wliczone), 80 modeli, 10 nowych firm i 6 wskazanych kontroli. Nie zerowano liczników. Dokumentacja Node i GitHub/code fetch to czynności developerskie poza publicznym researchem firm.\n\nHTTP i modele przypisano do każdej firmy w CSV. Liczba wersji po kontroli jest osobna od liczby wersji z trafnym projektem. Personalizacja nie oznacza szansy zatrudnienia. Dwie stare wiadomości w WIADOMOSCI mają status historyczny i nie są nowymi sukcesami.\n\nPróba używała opublikowanych tropów, bez uzupełniającego wyszukiwania. Nieznane warunki pozostają pytaniem; pominięcie i awaria techniczna są odrębne. Historyczne błędy TLS innych firm i dawny payload Payarto pozostają nieustalone.\n\nPrawdziwe maile **0**; DisabledMailProvider, brak gateway/Gmail, approvals/outbox/send_attempts/auto_sessions. Research nie nadaje CONTACTED ani prawa do późniejszej wysyłki. Nie odczytano prywatnego runtime, CV, skrzynki lub OAuth. Push nie wdraża kodu na Windowsie. Nie sprawdzono domowego magazynu certyfikatów, Gmaila, prywatnej historii, dostarczalności ani pracy całodziennej. Windows CI dotyczy wyłącznie fixture.\n\n' +
      [
        'POROWNANIE.md',
        'FIRMY.csv',
        'WIADOMOSCI.md',
        'ZRODLA.md',
        'PROFIL_UZYTY.md',
        'BLEDY.md',
        'PRZEBIEG.jsonl',
        'MANIFEST.json',
      ]
        .map((f) => `- [${f}](${f})`)
        .join('\n') +
      '\n',
  );
}
const exportedFiles = readdirSync(output).filter((f) => f !== 'MANIFEST.json');
const batchMaterials = readdirSync(dir)
  .filter((f) => /^materials-used(?:-batch-\d+)?\.json$/.test(f))
  .map(read);
const tests = existsSync(join(dir, 'test-results.json'))
  ? read('test-results.json')
  : { status: 'NOT_YET_RUN' };
if (round)
  writeFileSync(
    join(output, 'README.md'),
    readFileSync(join(output, 'README.md'), 'utf8') +
      '\n## Weryfikacja kodu\n\n~~~json\n' +
      JSON.stringify(tests, null, 2) +
      '\n~~~\n',
    'utf8',
  );
const manifest: any = {
  format_version: 1,
  session_id: budget.sessionId,
  status,
  start: budget.startedAt,
  first_public_query: budget.firstPublicAt,
  end: budget.endedAt,
  stop_reason: budget.stopReason,
  code_versions: batchMaterials.map((b) => ({
    batch_id: b.batchId ?? 'live-1',
    head: b.code.head,
    dirty: b.code.dirty,
    source_hash: b.codeId,
    files: b.code.sourceHashes,
  })),
  cli_version:
    tables.model_calls
      .map((c) => (c.diagnostic ? JSON.parse(c.diagnostic).cliVersion : null))
      .find(Boolean) ?? null,
  model: tables.model_calls.map((c) => c.model).find(Boolean) ?? null,
  tokens: null,
  cv_sha256: materials.cvHash ?? null,
  profile_provenance: materials.provenance ?? null,
  cvVerifiedInThisRun: !round,
  proposal_sha256: materials.proposalHash,
  profile_sha256: events.find((e) => e.stage === 'MATERIALS')?.profile_hash,
  counts,
  limits: result.limits ?? {
    milliseconds: 4 * 3600000,
    firms: 30,
    checkedDrafts: 20,
    models: 120,
    http: 150,
  },
  redactions: versions
    .filter((v) => v.redacted)
    .map((v) => ({
      draft_id: v.draft_id,
      version: v.version,
      original_hash: v.original_text_hash,
      exported_hash: v.exported_text_hash,
      scope: 'candidate phone/email',
    })),
  missing_data: missing,
  limitations: [
    round
      ? 'macOS DEVELOPMENT: nie sprawdzono magazynu CA/Gmaila/prywatnej historii domowego Windowsa'
      : 'Pierwsza partia bez potwierdzonych źródeł',
    'Nieznane warunki nie są dowodem elastyczności',
    'Nie sprawdzono Gmaila lub produkcyjnej historii',
    'Model nie ujawnił wersji; brak pełnych danych tokenów dla audytu',
  ],
  tests,
  files: Object.fromEntries(exportedFiles.map((f) => [f, hash(readFileSync(join(output, f)))])),
};
manifest.files['MANIFEST.json'] = null;
manifest.self_hash_note =
  'Hash własnego manifestu pominięty, aby uniknąć rekursji; plik jest w wykazie. Pozostałe hashe dotyczą bajtów UTF-8.';
write('MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(
  resolve('docs/research-review/LATEST.md'),
  `# Ostatnia diagnostyka\n\n[${name}](${name}/README.md) — ${status}; ${budget.startedAt}. ${counts.analyzed_unique_firms} firm po analizie, ${counts.retained_versions} wersji, ${counts.fully_checked_drafts} szkiców po pełnych kontrolach. Prawdziwe maile: 0.\n`,
);
// Precommit audit: rows/versions/references/privacy/relative links/zero mail are checked against actual stored stages.
const csv = parse(readFileSync(join(output, 'FIRMY.csv'), 'utf8'), { columns: true });
if (
  csv.length !== counts.index_rows ||
  versions.some((v) => !messages.includes(v.draft_id)) ||
  missing.length
)
  throw new Error('REPORT_COMPLETENESS_FAILED');
for (const row of rows)
  for (const sourceId of row.source_ids)
    if (!sources.has(sourceId)) throw new Error('UNRESOLVED_SOURCE');
for (const source of sources.values())
  if (!sourceText.includes(source.id)) throw new Error('UNEXPORTED_SOURCE');
for (const file of readdirSync(output)) {
  const content = readFileSync(join(output, file), 'utf8');
  for (const value of [...privacy.emails, ...privacy.phones])
    if (content.includes(value)) throw new Error('CANDIDATE_PRIVATE_DATA');
  if (
    /C:\\\\Users\\|C:\\Users\\|Bearer\s+[^\s\[]|\bgh[pousr]_[A-Za-z0-9]{20,}|\bsk-[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9]{20,}/.test(
      content,
    )
  )
    throw new Error('PRIVATE_PATH_OR_SECRET');
}
for (const link of readFileSync(join(output, 'README.md'), 'utf8').matchAll(/\]\(([^)]+)\)/g))
  if (!/^https?:/.test(link[1]) && !existsSync(join(output, link[1])))
    throw new Error('BROKEN_REPORT_LINK');
writeFileSync(
  join(dir, 'export-audit.json'),
  JSON.stringify(
    {
      status: 'PASS',
      output,
      counts,
      versions: versions.length,
      sources: sources.size,
      missing,
      checked_at: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ output, status, counts, audit: 'PASS' }));
