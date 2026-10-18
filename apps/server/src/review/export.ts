import Database from 'better-sqlite3';
import { z } from 'zod';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  mkdtempSync,
  copyFileSync,
  mkdirSync,
  rmSync,
  readdirSync,
  renameSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { tables, schemas, codes, refSchema } from './schema.js';
import { reviewRedactor } from './redaction.js';
type Row = Record<string, any>;
export class ReviewExportError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
const fail = (code: string): never => {
  throw new ReviewExportError(code);
};
const sha = (v: string | Buffer) => createHash('sha256').update(v).digest('hex');
const readHash = (path: string) => sha(readFileSync(path));
const parse = (value: unknown): any => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};
const code = (value: unknown) =>
  typeof value === 'string' && (codes as readonly string[]).includes(value)
    ? value
    : typeof value === 'string' && (codes as readonly string[]).includes(value.toUpperCase())
      ? value.toUpperCase()
      : 'UNKNOWN';
const hashValue = (value: unknown) =>
  typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value) ? value : null;
export const provenanceSchema = z
  .object({
    schema: z.literal(1),
    kind: z.literal('USER_DESIGNATED_RECORDED_BACKUP'),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    snapshotAt: z.iso.datetime(),
    auditAt: z.iso.datetime().nullable(),
    recordedIntegrity: z.literal('ok'),
    recordedForeignKeyErrors: z.literal(0),
    recordedTableCount: z.number().int().positive(),
    creationMethod: z.literal('UNKNOWN'),
  })
  .strict();
const safeStateKeys = [
  'autoPolicy',
  'priorApplicationException',
  'historyStorageMode',
  'localHistoryConfirmed',
  'stopped',
  'paused',
  'gmailSenderPaused',
  'gmailSendTransport',
] as const;
const policyKeys = [
  'senderEmail',
  'cvId',
  'profileHash',
  'contactKinds',
  'contactTypes',
  'searchScope',
  'sessionLimit',
  'dailyLimit',
  'sendIntervalSeconds',
  'researchIntervalSeconds',
  'confirmed',
  'approvedAt',
] as const;
export const policySettingsSchema = z
  .object({
    present: z.boolean(),
    recordedApproval: z.boolean().nullable(),
    sender: z.literal('[SENDER]').nullable(),
    cv: refSchema,
    profileHash: z.string().nullable(),
    contactKinds: z.array(z.enum(['GENERAL', 'RECRUITMENT'])).nullable(),
    contactTypes: z.array(z.enum(['ACTIVE', 'OPEN', 'PROSPECT'])).nullable(),
    searchScope: z.string().nullable(),
    sessionLimit: z.number().nullable(),
    dailyLimit: z.number().nullable(),
    limitFieldsPresent: z.object({ session: z.boolean(), daily: z.boolean() }).strict(),
    sendIntervalSeconds: z.number().nullable(),
    researchIntervalSeconds: z.number().nullable(),
    approvedAt: z.string().nullable(),
    policyVersionKnowledge: z.literal('CURRENT_STATE_ONLY'),
    priorCampaignBoundary: z.string().nullable(),
    historyStorage: z.enum(['LOCAL_ONLY', 'PRIVATE_GIT', 'UNKNOWN']),
    localHistoryConfirmed: z.boolean().nullable(),
    stopped: z.boolean().nullable(),
    paused: z.boolean().nullable(),
    senderPaused: z.boolean().nullable(),
    transport: z.enum(['GMAIL_API', 'GMAIL_BROWSER', 'UNKNOWN']),
    futureNightSequenceApproval: z.literal('NOT_RECORDED'),
    missingBeforeRealStart: z.array(
      z.enum([
        'FUTURE_SEQUENCE_SELECTION_RULES',
        'FUTURE_SEQUENCE_APPROVAL',
        'SEND_WINDOW_CONFIRMATION',
        'CURRENT_WORKSTATION_STATE',
        'SENDER_CONFIGURATION',
        'TEMPO_CONFIGURATION',
        'LIMITS_CONFIGURATION',
      ]),
    ),
  })
  .strict();
const metaSchema = z
  .object({
    missingColumns: z.array(z.string()),
    originalSubjectSha256: z.string().nullable(),
    originalBodySha256: z.string().nullable(),
    redactedSubjectSha256: z.string().nullable(),
    redactedBodySha256: z.string().nullable(),
    currentVersion: z.boolean().nullable(),
    savedCheck: refSchema,
    attemptVersions: z.array(z.number()),
    historicalCvBinding: z.literal('NOT_RECORDED'),
  })
  .strict();
export type ExportInput = {
  snapshot: string;
  provenance: string;
  output: string;
  observeSql?: (sql: string) => void;
};
const count = z.number().int().nonnegative();
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const availabilitySchema = z.enum(['PRESENT', 'MISSING']);
const countsSchema = z.record(
  z.enum(Object.keys(tables) as [string, ...string[]]),
  z.object({ input: count, output: count, availability: availabilitySchema }).strict(),
);
const redactionsSchema = z.partialRecord(
  z.enum([
    'INVALID_TEXT',
    'SECRET',
    'SECRET_PARAMETER',
    'URL_AUTH',
    'URL_PARAMETERS',
    'URL_INVALID',
    'LOCAL_PATH',
    'PRIVATE_EMAIL',
    'PHONE',
    'CANDIDATE_IDENTITY',
  ]),
  count,
);
const sidecarSchema = z.object({ walBytes: count.nullable(), shmBytes: count.nullable() }).strict();
const limits = [
  'SINGLE_SNAPSHOT_NO_DELETION_PROOF',
  'HISTORICAL_FACT_VERSION_AND_APPROVAL_NOT_RECORDED',
  'HISTORICAL_CV_BINDING_NOT_RECORDED',
  'POLICY_HISTORY_NOT_VERSIONED',
  'NO_CURRENT_SEND_READINESS',
  'UNREDACTED_PAYLOAD_HASH_NOT_RECOMPUTABLE_PUBLICLY',
  'ORIGINAL_URL_PARAMETERS_REDACTED',
] as const;
const validationSchema = z
  .object({
    schema: z.literal(1),
    scope: z.literal('REVIEW_SNAPSHOT_ONLY'),
    productionReadiness: z.literal('NOT_ESTABLISHED'),
    inputIntegrity: z.literal('ok'),
    foreignKeyErrors: z.literal(0),
    schemaVersion: z.number().int().min(20).max(25),
    allRecordsSchemaValidated: z.literal(true),
    recordIdsUnique: z.literal(true),
    presentReferencesResolve: z.literal(true),
    presentReferences: count,
    explicitMissingReferences: count,
    counts: countsSchema,
    historicalProfileFacts: count,
    redactions: redactionsSchema,
    limitations: z.array(z.enum(limits)),
    inputHashBefore: digest,
    inputHashAfter: digest,
    sourceSidecarsBefore: sidecarSchema,
    sourceSidecarsAfter: sidecarSchema,
  })
  .strict();
const identitySchema = z
  .object({
    scope: z.literal('SINGLE_SNAPSHOT'),
    historicalDeletionCheck: z.literal(false),
    beforeSnapshot: z.literal('NOT_PROVIDED'),
    companyCount: count,
    domainEventsAvailability: availabilitySchema,
    duplicateDomainOwners: z.array(
      z.object({ domain: z.string(), companies: z.array(z.string()) }).strict(),
    ),
    sharedMailboxes: z.array(
      z.object({ address: z.string(), companies: z.array(z.string()) }).strict(),
    ),
    blockedCompanyIds: z.array(z.string()),
  })
  .strict();
const fileSchema = z
  .object({
    file: z.string().regex(/^[-a-z0-9]+\.(?:json|jsonl)$/),
    records: count,
    bytes: count,
    sha256: digest,
  })
  .strict();
const manifestSchema = z
  .object({
    schema: z.literal(1),
    scope: z.literal('REVIEW_SNAPSHOT_ONLY'),
    productionReadiness: z.literal('NOT_ESTABLISHED'),
    snapshotAt: z.iso.datetime(),
    exportedAt: z.iso.datetime(),
    schemaVersion: z.number().int().min(20).max(25),
    inputSha256: digest,
    creationMethod: z.literal('UNKNOWN'),
    recordedProvenance: provenanceSchema,
    propertiesObserved: z
      .object({
        expectedHashMatched: z.literal(true),
        emptyOrAbsentWal: z.literal(true),
        integrity: z.literal('ok'),
        foreignKeyErrors: z.literal(0),
        originalUnchanged: z.literal(true),
      })
      .strict(),
    toolFingerprint: digest,
    toolFiles: z
      .array(
        z
          .object({ file: z.enum(['export.ts', 'schema.ts', 'redaction.ts']), sha256: digest })
          .strict(),
      )
      .length(3),
    counts: countsSchema,
    files: z.array(fileSchema),
    omittedTables: z.array(z.string()),
    omittedFields: z.array(z.string()),
    redactions: redactionsSchema,
  })
  .strict();
export function exportReviewPackage(input: ExportInput) {
  try {
    return exportReviewPackageImpl(input);
  } catch (e) {
    if (e instanceof ReviewExportError) throw e;
    throw new ReviewExportError('EXPORT_FAILED');
  }
}
function exportReviewPackageImpl(input: ExportInput) {
  const snapshot = resolve(input.snapshot),
    output = resolve(input.output);
  if (existsSync(output)) fail('OUTPUT_EXISTS');
  if (output === snapshot || output === resolve(input.provenance)) fail('OUTPUT_INPUT_CONFLICT');
  const provenanceResult = provenanceSchema.safeParse(
    parse(readFileSync(input.provenance, 'utf8')),
  );
  if (!provenanceResult.success) fail('PROVENANCE_INVALID');
  const provenance = provenanceResult.data!;
  const sidecars = () => ({
    walBytes: existsSync(snapshot + '-wal') ? statSync(snapshot + '-wal').size : null,
    shmBytes: existsSync(snapshot + '-shm') ? statSync(snapshot + '-shm').size : null,
  });
  const before = sidecars();
  if (before.walBytes !== null && before.walBytes !== 0) fail('SNAPSHOT_WAL_HAS_DATA');
  const beforeHash = readHash(snapshot);
  if (beforeHash !== provenance.sha256) fail('SNAPSHOT_HASH_MISMATCH');
  const work = mkdtempSync(join(tmpdir(), 'jh-review-read-'));
  let db: Database.Database | undefined, staging: string | undefined;
  try {
    const copy = join(work, 'snapshot.sqlite');
    copyFileSync(snapshot, copy);
    if (
      readHash(copy) !== beforeHash ||
      readHash(snapshot) !== beforeHash ||
      sidecars().walBytes !== before.walBytes
    )
      fail('SNAPSHOT_CHANGED');
    db = new Database(copy, { readonly: true, fileMustExist: true });
    db.pragma('query_only=ON');
    if (
      db.pragma('integrity_check', { simple: true }) !== 'ok' ||
      (db.pragma('foreign_key_check') as Row[]).length
    )
      fail('SNAPSHOT_INVALID');
    const database = db;
    const rows: Record<string, Row[]> = {},
      availability: Record<string, string> = {},
      missingColumns: Record<string, string[]> = {},
      readColumns: Record<string, string[]> = {};
    const state: Record<string, any> = {};
    let schemaVersion = 0;
    const run = (sql: string, args: any[] = []) => {
      input.observeSql?.(sql);
      return database.prepare(sql).all(...args) as Row[];
    };
    database.transaction(() => {
      const names = new Set(
        run("SELECT name FROM sqlite_master WHERE type='table'").map((r) => r.name),
      );
      if (!names.has('migrations')) fail('UNSUPPORTED_SCHEMA');
      schemaVersion = Math.max(
        0,
        ...run('SELECT name FROM migrations').map((r) =>
          Number(String(r.name).match(/^\d+/)?.[0] ?? 0),
        ),
      );
      if (schemaVersion < 20 || schemaVersion > 25) fail('UNSUPPORTED_SCHEMA');
      for (const [name, table] of Object.entries(tables)) {
        if (!names.has(name)) {
          rows[name] = [];
          availability[name] = 'MISSING';
          missingColumns[name] = Object.keys(table.fields);
          readColumns[name] = [];
          continue;
        }
        const columns = new Set(
          (database.pragma('table_info("' + name + '")') as Row[]).map((r) => r.name),
        );
        const selected = Object.entries(table.fields).filter(([key, f]) =>
          f.sql ? columns.has('context_json') : columns.has(key),
        );
        missingColumns[name] = Object.keys(table.fields).filter(
          (k) => !selected.some(([s]) => s === k),
        );
        readColumns[name] = selected.map(([k, f]) => f.sql ?? k);
        availability[name] = 'PRESENT';
        rows[name] = selected.length
          ? run(
              'SELECT ' +
                selected
                  .map(([k, f]) => (f.sql ? '(' + f.sql + ') AS "' + k + '"' : '"' + k + '"'))
                  .join(',') +
                ' FROM "' +
                name +
                '" ORDER BY rowid',
            )
          : [];
      }
      if (names.has('app_state'))
        for (const key of safeStateKeys) {
          const query =
            key === 'autoPolicy'
              ? 'SELECT json_object(' +
                policyKeys.map((k) => "'" + k + "',json_extract(value,'$." + k + "')").join(',') +
                ") value,json_type(value,'$.confirmed') confirmed_type,json_type(value,'$.sessionLimit') session_present,json_type(value,'$.dailyLimit') daily_present FROM app_state WHERE key=? AND json_valid(value)"
              : key === 'priorApplicationException'
                ? "SELECT json_object('cutoffAt',json_extract(value,'$.cutoffAt')) value FROM app_state WHERE key=? AND json_valid(value)"
                : 'SELECT value FROM app_state WHERE key=?';
          const v = run(query, [key])[0];
          if (v) {
            state[key] = parse(v.value);
            if (key === 'autoPolicy') {
              state[key].confirmed =
                v.confirmed_type === 'true' ? true : v.confirmed_type === 'false' ? false : null;
              state.policyLimitPresence = {
                session: v.session_present !== null,
                daily: v.daily_present !== null,
              };
            }
          }
        }
    })();
    const maps = new Map<string, Map<string, string>>(),
      present = new Map<string, Set<string>>();
    for (const [table, list] of Object.entries(rows)) {
      const map = new Map<string, string>();
      for (const r of list)
        if (typeof r.id === 'string')
          map.set(r.id, table + '_' + String(map.size + 1).padStart(5, '0'));
      maps.set(table, map);
      present.set(table, new Set(map.keys()));
    }
    const idFor = (table: string, original: unknown) => {
      const map = maps.get(table) ?? new Map<string, string>();
      maps.set(table, map);
      const key = String(original);
      if (!map.has(key)) map.set(key, table + '_' + String(map.size + 1).padStart(5, '0'));
      return map.get(key)!;
    };
    const ref = (table: string, value: unknown) =>
      value === null || value === undefined
        ? { id: null, state: 'NOT_RECORDED' as const }
        : {
            id: idFor(table, value),
            state: present.get(table)?.has(String(value))
              ? ('PRESENT' as const)
              : ('MISSING' as const),
          };
    const notRecorded = { id: null, state: 'NOT_RECORDED' as const };
    const sourceById = new Map(rows.research_sources.map((r) => [r.id, r])),
      linkByEvidence = new Map(rows.research_evidence.map((r) => [r.evidence_id, r.source_id]));
    const publicEmails = new Set<string>();
    for (const c of rows.contacts) {
      const s = sourceById.get(linkByEvidence.get(c.evidence_id));
      if (
        s?.method === 'PUBLIC_HTTP' &&
        typeof c.email === 'string' &&
        [s.text, s.fragment, s.address_contexts].some(
          (t) => typeof t === 'string' && t.toLowerCase().includes(c.email.toLowerCase()),
        )
      )
        publicEmails.add(c.email.toLowerCase());
    }
    const profiles = rows.research_draft_materials
      .map((r) => parse(r.context_profile))
      .filter((p) => p && typeof p === 'object');
    const redactor = reviewRedactor(
      [...rows.candidate_profiles.map((r) => r.name), ...profiles.map((p) => p.name)].filter(
        (n) => typeof n === 'string',
      ),
      publicEmails,
    );
    const clean = redactor.text;
    const scopeIds = new Map<string, string>();
    const scope = (v: unknown) => {
      if (typeof v !== 'string') return null;
      if (!scopeIds.has(v)) scopeIds.set(v, 'scope_' + String(scopeIds.size + 1).padStart(4, '0'));
      return scopeIds.get(v)!;
    };
    const rowIds = new Map<Row, string>();
    for (const [table, list] of Object.entries(rows))
      list.forEach((r, i) =>
        rowIds.set(
          r,
          typeof r.id === 'string'
            ? idFor(table, r.id)
            : table + '_row_' + String(i + 1).padStart(5, '0'),
        ),
      );
    const materialByVersion = new Map(
      rows.research_draft_materials.map((r) => [r.draft_id + ':' + r.version, r]),
    );
    const draftById = new Map(rows.drafts.map((r) => [r.id, r]));
    const projected: Record<string, Row[]> = {};
    let historicalFactCount = 0;
    const review = (value: unknown) => {
      const v = parse(value);
      return {
        supported: typeof v?.supported === 'boolean' ? v.supported : null,
        issueCount: Array.isArray(v?.issues) ? v.issues.length : 0,
        code: code(v?.code),
      };
    };
    const list = (v: unknown) => {
      const value = parse(v);
      return Array.isArray(value) && value.every((s) => typeof s === 'string')
        ? (value as string[])
        : null;
    };
    for (const [table, { file, fields }] of Object.entries(tables))
      for (const r of rows[table]) {
        const out: Row = { table, recordId: rowIds.get(r) };
        for (const [name, field] of Object.entries(fields)) {
          const v = r[name];
          let value: any = null;
          if (field.kind === 'id') value = idFor(table, v);
          else if (field.kind === 'ref') value = ref(field.target!, v);
          else if (field.kind === 'refs')
            value = list(v)?.map((id) => ref(field.target!, id)) ?? null;
          else if (field.kind === 'code')
            value =
              v === undefined || v === null
                ? name === 'completeness'
                  ? 'LEGACY_UNKNOWN'
                  : null
                : code(v);
          else if (field.kind === 'number')
            value = typeof v === 'number' && Number.isFinite(v) ? v : null;
          else if (field.kind === 'boolean')
            value =
              typeof v === 'number'
                ? [0, 1].includes(v)
                  ? v === 1
                  : null
                : typeof v === 'boolean'
                  ? v
                  : null;
          else if (field.kind === 'hash') value = hashValue(v);
          else if (field.kind === 'date')
            value =
              typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v))
                ? v
                : null;
          else if (field.kind === 'private')
            value = name === 'name' ? (v == null ? null : '[CANDIDATE]') : scope(v);
          else if (field.kind === 'texts') value = list(v)?.map((s) => clean(s)!) ?? null;
          else if (field.kind === 'json') {
            if (name === 'address_contexts') {
              const parsed = parse(v);
              value = Array.isArray(parsed)
                ? parsed
                    .filter(
                      (context) =>
                        context &&
                        typeof context === 'object' &&
                        typeof context.email === 'string' &&
                        typeof context.text === 'string',
                    )
                    .map((context) => ({
                      address: clean(context.email)!,
                      contexts: [clean(context.text)!],
                      complete: typeof context.complete === 'boolean' ? context.complete : null,
                    }))
                : parsed && typeof parsed === 'object'
                  ? Object.entries(parsed)
                      .filter(
                        ([, contexts]) =>
                          Array.isArray(contexts) && contexts.every((c) => typeof c === 'string'),
                      )
                      .map(([address, contexts]) => ({
                        address: clean(address)!,
                        contexts: (contexts as string[]).map((c) => clean(c)!),
                        complete: null,
                      }))
                  : null;
            } else if (name === 'outbound_links') {
              const links = parse(v);
              value = Array.isArray(links)
                ? links
                    .filter(
                      (link) =>
                        link &&
                        typeof link === 'object' &&
                        typeof link.url === 'string' &&
                        typeof link.context === 'string',
                    )
                    .map((link) => ({
                      url: redactor.url(link.url)!,
                      context: clean(link.context)!,
                    }))
                : null;
            } else if (name === 'context_profile') {
              const p = parse(v);
              value =
                p && typeof p === 'object' && !Array.isArray(p)
                  ? {
                      id: 'profile_snapshot_' + rowIds.get(r),
                      profileHash: hashValue(p.hash),
                      goal: clean(p.goal),
                      facts: Array.isArray(p.facts)
                        ? p.facts
                            .filter(
                              (f: any) =>
                                f && typeof f === 'object' && typeof f.content === 'string',
                            )
                            .map((f: any) => ({
                              id:
                                'historical_fact_' + String(++historicalFactCount).padStart(6, '0'),
                              key: clean(f.key) ?? 'UNKNOWN',
                              content: clean(f.content)!,
                              currentFact: ref('candidate_facts', f.id),
                              version: null,
                              approvalStatus: 'NOT_RECORDED',
                            }))
                        : [],
                      versionKnowledge: 'NOT_RECORDED',
                      approvalKnowledge: 'NOT_RECORDED',
                    }
                  : null;
            } else value = v == null ? null : review(v);
          } else value = clean(v);
          if (
            table === 'candidate_facts' &&
            name === 'content' &&
            /^(?:name|email|phone|address|birth|contact)(?:_|$)/i.test(String(r.fact_key))
          )
            value = '[PERSONAL_FACT]';
          out[name] = value;
        }
        const d =
          table === 'drafts'
            ? r
            : table === 'draft_versions'
              ? draftById.get(r.draft_id)
              : undefined;
        const version = typeof r.version === 'number' ? r.version : null;
        const material =
          table === 'drafts' || table === 'draft_versions'
            ? materialByVersion.get((table === 'drafts' ? r.id : r.draft_id) + ':' + version)
            : undefined;
        out.reviewMetadata = metaSchema.parse({
          missingColumns: missingColumns[table],
          originalSubjectSha256: typeof r.subject === 'string' ? sha(r.subject) : null,
          originalBodySha256: typeof r.body === 'string' ? sha(r.body) : null,
          redactedSubjectSha256: typeof out.subject === 'string' ? sha(out.subject) : null,
          redactedBodySha256: typeof out.body === 'string' ? sha(out.body) : null,
          currentVersion: d && version !== null ? d.version === version : null,
          savedCheck: material ? { id: rowIds.get(material), state: 'PRESENT' } : notRecorded,
          attemptVersions:
            table === 'drafts' || table === 'draft_versions'
              ? ([
                  ...new Set(
                    rows.outbox
                      .filter((o) => o.draft_id === (table === 'drafts' ? r.id : r.draft_id))
                      .map((o) => o.draft_version),
                  ),
                ] as number[])
              : [],
          historicalCvBinding: 'NOT_RECORDED',
        });
        (projected[file] ??= []).push(schemas[table].parse(out));
      }
    for (const { file } of Object.values(tables)) projected[file] ??= [];
    const rawPolicy =
      state.autoPolicy && typeof state.autoPolicy === 'object' ? state.autoPolicy : {};
    const number = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const bool = (v: unknown) => (typeof v === 'boolean' ? v : null);
    const strings = (v: unknown, allowed: string[]) =>
      Array.isArray(v) && v.every((s) => allowed.includes(s)) ? v : null;
    const policy = policySettingsSchema.parse({
      present: !!state.autoPolicy,
      recordedApproval:
        bool(rawPolicy.confirmed) ?? (typeof rawPolicy.approvedAt === 'string' ? true : null),
      sender: typeof rawPolicy.senderEmail === 'string' ? '[SENDER]' : null,
      cv: ref('cv_assets', rawPolicy.cvId),
      profileHash: hashValue(rawPolicy.profileHash),
      contactKinds: strings(rawPolicy.contactKinds, ['GENERAL', 'RECRUITMENT']),
      contactTypes: strings(rawPolicy.contactTypes, ['ACTIVE', 'OPEN', 'PROSPECT']),
      searchScope: clean(rawPolicy.searchScope),
      sessionLimit: number(rawPolicy.sessionLimit),
      dailyLimit: number(rawPolicy.dailyLimit),
      limitFieldsPresent: {
        session: state.policyLimitPresence?.session ?? false,
        daily: state.policyLimitPresence?.daily ?? false,
      },
      sendIntervalSeconds: number(rawPolicy.sendIntervalSeconds),
      researchIntervalSeconds: number(rawPolicy.researchIntervalSeconds),
      approvedAt: typeof rawPolicy.approvedAt === 'string' ? clean(rawPolicy.approvedAt) : null,
      policyVersionKnowledge: 'CURRENT_STATE_ONLY',
      priorCampaignBoundary:
        typeof state.priorApplicationException?.cutoffAt === 'string'
          ? clean(state.priorApplicationException.cutoffAt)
          : null,
      historyStorage: ['LOCAL_ONLY', 'PRIVATE_GIT'].includes(state.historyStorageMode)
        ? state.historyStorageMode
        : 'UNKNOWN',
      localHistoryConfirmed: bool(state.localHistoryConfirmed),
      stopped: bool(state.stopped),
      paused: bool(state.paused),
      senderPaused: bool(state.gmailSenderPaused),
      transport: ['GMAIL_API', 'GMAIL_BROWSER'].includes(state.gmailSendTransport)
        ? state.gmailSendTransport
        : 'UNKNOWN',
      futureNightSequenceApproval: 'NOT_RECORDED',
      missingBeforeRealStart: [
        'FUTURE_SEQUENCE_SELECTION_RULES',
        'FUTURE_SEQUENCE_APPROVAL',
        'SEND_WINDOW_CONFIRMATION',
        'CURRENT_WORKSTATION_STATE',
        ...(!rawPolicy.senderEmail ? ['SENDER_CONFIGURATION'] : []),
        ...(!rawPolicy.sendIntervalSeconds ? ['TEMPO_CONFIGURATION'] : []),
        ...(!state.policyLimitPresence?.session || !state.policyLimitPresence?.daily
          ? ['LIMITS_CONFIGURATION']
          : []),
      ],
    });
    const owners = (list: Row[], field: string, owner: string) => {
      const groups = new Map<string, Set<string>>();
      for (const r of list)
        if (typeof r[field] === 'string' && r[field]) {
          const key = clean(r[field])!;
          if (!groups.has(key)) groups.set(key, new Set());
          groups.get(key)!.add(idFor('companies', r[owner]));
        }
      return [...groups].filter(([, v]) => v.size > 1);
    };
    const identity = identitySchema.parse({
      scope: 'SINGLE_SNAPSHOT',
      historicalDeletionCheck: false,
      beforeSnapshot: 'NOT_PROVIDED',
      companyCount: rows.companies.length,
      domainEventsAvailability: availability.company_domain_enrichments,
      duplicateDomainOwners: owners(rows.companies, 'primary_domain', 'id').map(
        ([domain, ids]) => ({ domain, companies: [...ids] }),
      ),
      sharedMailboxes: owners(rows.contacts, 'email', 'company_id').map(([address, ids]) => ({
        address,
        companies: [...ids],
      })),
      blockedCompanyIds: [
        ...new Set(rows.suppressions.map((r) => idFor('companies', r.company_id))),
      ],
    });
    const all = Object.values(projected).flat();
    const ids = new Set(all.map((r) => r.recordId));
    let missingRefs = 0,
      presentRefs = 0;
    const visit = (v: any) => {
      if (Array.isArray(v)) return v.forEach(visit);
      if (!v || typeof v !== 'object') return;
      if (
        Object.hasOwn(v, 'state') &&
        Object.hasOwn(v, 'id') &&
        ['PRESENT', 'MISSING', 'NOT_RECORDED', 'NOT_APPLICABLE'].includes(v.state)
      ) {
        refSchema.parse(v);
        if (v.state === 'PRESENT') {
          if (!ids.has(v.id)) fail('REFERENCE_INVALID');
          presentRefs++;
        }
        if (v.state === 'MISSING') missingRefs++;
      }
      for (const child of Object.values(v)) visit(child);
    };
    if (ids.size !== all.length) fail('DUPLICATE_RECORD');
    all.forEach(visit);
    visit(policy);
    if (readHash(snapshot) !== beforeHash || sidecars().walBytes !== before.walBytes)
      fail('SNAPSHOT_CHANGED');
    const toolFiles = ['export.ts', 'schema.ts', 'redaction.ts'].map((file) => ({
      file,
      sha256: readHash(join(dirname(fileURLToPath(import.meta.url)), file)),
    }));
    const toolFingerprint = sha(JSON.stringify(toolFiles));
    const schemaDoc = {
      schema: 1,
      exporter: 'review-package-v1',
      tables: Object.fromEntries(
        Object.entries(tables).map(([name, t]) => [
          name,
          {
            file: t.file,
            readColumns: readColumns[name],
            missingColumns: missingColumns[name],
            availability: availability[name],
            fields: Object.fromEntries(
              Object.entries(t.fields).map(([k, v]) => [
                k,
                { kind: v.kind, target: v.target ?? null, source: v.sql ?? k },
              ]),
            ),
          },
        ]),
      ),
      safeAppStateKeys: [...safeStateKeys],
      recordSchemas: Object.fromEntries(
        Object.entries(schemas).map(([name, s]) => [name, z.toJSONSchema(s)]),
      ),
      policySchema: z.toJSONSchema(policySettingsSchema),
      identitySchema: z.toJSONSchema(identitySchema),
    };
    const validation = {
      schema: 1,
      scope: 'REVIEW_SNAPSHOT_ONLY',
      productionReadiness: 'NOT_ESTABLISHED',
      inputIntegrity: 'ok',
      foreignKeyErrors: 0,
      schemaVersion,
      allRecordsSchemaValidated: true,
      recordIdsUnique: true,
      presentReferencesResolve: true,
      presentReferences: presentRefs,
      explicitMissingReferences: missingRefs,
      counts: Object.fromEntries(
        Object.entries(rows).map(([name, list]) => [
          name,
          {
            input: list.length,
            output: all.filter((r) => r.table === name).length,
            availability: availability[name],
          },
        ]),
      ),
      historicalProfileFacts: historicalFactCount,
      redactions: redactor.counts,
      limitations: [
        'SINGLE_SNAPSHOT_NO_DELETION_PROOF',
        'HISTORICAL_FACT_VERSION_AND_APPROVAL_NOT_RECORDED',
        'HISTORICAL_CV_BINDING_NOT_RECORDED',
        'POLICY_HISTORY_NOT_VERSIONED',
        'NO_CURRENT_SEND_READINESS',
        'UNREDACTED_PAYLOAD_HASH_NOT_RECOMPUTABLE_PUBLICLY',
        'ORIGINAL_URL_PARAMETERS_REDACTED',
      ],
      inputHashBefore: beforeHash,
      inputHashAfter: readHash(snapshot),
      sourceSidecarsBefore: before,
      sourceSidecarsAfter: sidecars(),
    };
    validationSchema.parse(validation);
    mkdirSync(dirname(output), { recursive: true });
    staging = mkdtempSync(join(dirname(output), '.review-staging-'));
    const files: { file: string; records: number; bytes: number; sha256: string }[] = [];
    const write = (file: string, value: string, records: number) => {
      writeFileSync(join(staging!, file), value, { flag: 'wx' });
      files.push({ file, records, bytes: Buffer.byteLength(value), sha256: sha(value) });
    };
    for (const [file, records] of Object.entries(projected)) {
      let buffer = '',
        n = 0,
        part = 1;
      for (const row of records) {
        const line = JSON.stringify(row) + '\n';
        if (file === 'sources' && Buffer.byteLength(buffer + line) > 1024 * 1024 && n) {
          write('sources-' + String(part++).padStart(3, '0') + '.jsonl', buffer, n);
          buffer = '';
          n = 0;
        }
        buffer += line;
        n++;
      }
      write(
        file === 'sources'
          ? 'sources-' + String(part).padStart(3, '0') + '.jsonl'
          : file + '.jsonl',
        buffer,
        n,
      );
    }
    write('policy-summary.json', JSON.stringify(policy, null, 2) + '\n', 1);
    write('identity-audit.json', JSON.stringify(identity, null, 2) + '\n', 1);
    write('schema.json', JSON.stringify(schemaDoc, null, 2) + '\n', 1);
    write('validation.json', JSON.stringify(validation, null, 2) + '\n', 1);
    const manifest = {
      schema: 1,
      scope: 'REVIEW_SNAPSHOT_ONLY',
      productionReadiness: 'NOT_ESTABLISHED',
      snapshotAt: provenance.snapshotAt,
      exportedAt: new Date().toISOString(),
      schemaVersion,
      inputSha256: beforeHash,
      creationMethod: 'UNKNOWN',
      recordedProvenance: provenance,
      propertiesObserved: {
        expectedHashMatched: true,
        emptyOrAbsentWal: true,
        integrity: 'ok',
        foreignKeyErrors: 0,
        originalUnchanged: true,
      },
      toolFingerprint,
      toolFiles,
      counts: validation.counts,
      files,
      omittedTables: [
        'mail_messages',
        'gmail_previews',
        'gmail_preview_items',
        'gmail_outbox',
        'audit_events',
        'model_calls',
        'research_queries',
        'research_items',
        'research_extractions',
        'research_qualifications',
        'shared_company_context',
        'auto_query_plan',
        'auto_skips',
        'mock_deliveries',
        'research_run_config',
        'jobs',
        'research_stage_timings',
        'research_work_items',
      ],
      omittedFields: [
        'credentials',
        'mail subject/body/headers/IDs',
        'MIME',
        'CV file bytes and paths',
        'lease/worker/compose secrets',
        'raw model prompts/results',
        'suppression quotes/reasons',
        'candidate identity',
        'unapproved app_state keys',
      ],
      redactions: redactor.counts,
    };
    manifestSchema.parse(manifest);
    writeFileSync(join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', {
      flag: 'wx',
    });
    validateReviewPackage(staging);
    if (existsSync(output)) fail('OUTPUT_EXISTS');
    renameSync(staging, output);
    staging = undefined;
    return {
      scope: manifest.scope,
      productionReadiness: manifest.productionReadiness,
      schemaVersion,
      counts: manifest.counts,
      historicalProfileFacts: historicalFactCount,
      explicitMissingReferences: missingRefs,
      toolFingerprint,
      files: files.length,
    };
  } catch (e) {
    if (e instanceof ReviewExportError) throw e;
    throw new ReviewExportError('EXPORT_FAILED');
  } finally {
    db?.close();
    if (staging) rmSync(staging, { recursive: true, force: true });
    rmSync(work, { recursive: true, force: true });
  }
}
export function validateReviewPackage(dir: string) {
  try {
    const manifest = manifestSchema.parse(parse(readFileSync(join(dir, 'manifest.json'), 'utf8')));
    const records: Row[] = [];
    const listedNames = new Set(manifest.files.map((f) => f.file));
    if (listedNames.size !== manifest.files.length) fail('PACKAGE_INVALID');
    for (const required of [
      'policy-summary.json',
      'identity-audit.json',
      'schema.json',
      'validation.json',
      ...new Set(
        Object.values(tables)
          .map((t) => t.file)
          .filter((f) => f !== 'sources')
          .map((f) => f + '.jsonl'),
      ),
    ])
      if (!listedNames.has(required)) fail('PACKAGE_INVALID');
    for (const entry of manifest.files) {
      if (typeof entry.file !== 'string' || !/^[-a-z0-9]+\.(json|jsonl)$/.test(entry.file))
        fail('PACKAGE_INVALID');
      const bytes = readFileSync(join(dir, entry.file));
      if (sha(bytes) !== entry.sha256 || bytes.length !== entry.bytes)
        fail('PACKAGE_HASH_MISMATCH');
      if (entry.file.endsWith('.jsonl')) {
        const lines = bytes.toString('utf8').split('\n').filter(Boolean);
        if (lines.length !== entry.records) fail('PACKAGE_COUNT_MISMATCH');
        for (const line of lines) {
          const row = parse(line);
          if (!schemas[row?.table]) fail('PACKAGE_INVALID');
          schemas[row.table].parse(row);
          records.push(row);
        }
      }
    }
    policySettingsSchema.parse(parse(readFileSync(join(dir, 'policy-summary.json'), 'utf8')));
    identitySchema.parse(parse(readFileSync(join(dir, 'identity-audit.json'), 'utf8')));
    const validation = validationSchema.parse(
      parse(readFileSync(join(dir, 'validation.json'), 'utf8')),
    );
    const schema = parse(readFileSync(join(dir, 'schema.json'), 'utf8'));
    if (
      !schema ||
      Object.keys(schema).sort().join(',') !==
        [
          'schema',
          'exporter',
          'tables',
          'safeAppStateKeys',
          'recordSchemas',
          'policySchema',
          'identitySchema',
        ]
          .sort()
          .join(',') ||
      schema.schema !== 1 ||
      schema.exporter !== 'review-package-v1'
    )
      fail('PACKAGE_SCHEMA_INVALID');
    if (JSON.stringify(schema.safeAppStateKeys) !== JSON.stringify(safeStateKeys))
      fail('PACKAGE_SCHEMA_INVALID');
    if (
      Object.keys(schema.tables).sort().join(',') !== Object.keys(tables).sort().join(',') ||
      Object.keys(schema.recordSchemas).sort().join(',') !== Object.keys(tables).sort().join(',')
    )
      fail('PACKAGE_SCHEMA_INVALID');
    for (const [table, definition] of Object.entries(tables)) {
      const s = schema.tables[table],
        expectedFields = Object.fromEntries(
          Object.entries(definition.fields).map(([k, v]) => [
            k,
            { kind: v.kind, target: v.target ?? null, source: v.sql ?? k },
          ]),
        );
      if (
        Object.keys(s).sort().join(',') !==
          ['file', 'readColumns', 'missingColumns', 'availability', 'fields'].sort().join(',') ||
        s.file !== definition.file ||
        !['PRESENT', 'MISSING'].includes(s.availability) ||
        JSON.stringify(s.fields) !== JSON.stringify(expectedFields) ||
        !Array.isArray(s.readColumns) ||
        s.readColumns.some(
          (v: any) =>
            !Object.values(definition.fields).some((f) => f.sql === v) &&
            !Object.hasOwn(definition.fields, v),
        ) ||
        !Array.isArray(s.missingColumns) ||
        s.missingColumns.some((v: any) => !Object.hasOwn(definition.fields, v)) ||
        JSON.stringify(schema.recordSchemas[table]) !==
          JSON.stringify(z.toJSONSchema(schemas[table]))
      )
        fail('PACKAGE_SCHEMA_INVALID');
      const n = records.filter((r) => r.table === table).length;
      if (
        n !== manifest.counts[table].output ||
        n !== validation.counts[table].output ||
        manifest.counts[table].input !== n
      )
        fail('PACKAGE_COUNT_MISMATCH');
    }
    if (
      JSON.stringify(schema.policySchema) !==
        JSON.stringify(z.toJSONSchema(policySettingsSchema)) ||
      JSON.stringify(schema.identitySchema) !== JSON.stringify(z.toJSONSchema(identitySchema))
    )
      fail('PACKAGE_SCHEMA_INVALID');
    const ids = new Set(records.map((r) => r.recordId));
    if (ids.size !== records.length) fail('DUPLICATE_RECORD');
    let present = 0,
      missing = 0;
    const visit = (v: any) => {
      if (Array.isArray(v)) return v.forEach(visit);
      if (!v || typeof v !== 'object') return;
      if (
        Object.hasOwn(v, 'state') &&
        Object.hasOwn(v, 'id') &&
        ['PRESENT', 'MISSING', 'NOT_RECORDED', 'NOT_APPLICABLE'].includes(v.state)
      ) {
        refSchema.parse(v);
        if (v.state === 'PRESENT') {
          if (!ids.has(v.id)) fail('REFERENCE_INVALID');
          present++;
        }
        if (v.state === 'MISSING') missing++;
      }
      Object.values(v).forEach(visit);
    };
    records.forEach(visit);
    visit(parse(readFileSync(join(dir, 'policy-summary.json'), 'utf8')));
    if (
      present !== validation.presentReferences ||
      missing !== validation.explicitMissingReferences
    )
      fail('REFERENCE_COUNT_MISMATCH');
    const listed = new Set([
      ...manifest.files.map((f: any) => f.file),
      'manifest.json',
      'README.md',
    ]);
    if (readdirSync(dir).some((f) => !listed.has(f))) fail('PACKAGE_UNLISTED_FILE');
    return { valid: true, files: manifest.files.length };
  } catch (e) {
    if (e instanceof ReviewExportError) throw e;
    throw new ReviewExportError('PACKAGE_INVALID');
  }
}
