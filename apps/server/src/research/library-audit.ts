import Database from 'better-sqlite3';
import { z } from 'zod';
import {
  readFileSync,
  existsSync,
  copyFileSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { hash } from '../util.js';
import { sourceComplete } from './source-policy.js';
import { contactSourceAuthority } from './source-policy.js';
import { validateAnalysis, verifyQuote } from './contracts.js';
import { materialBinding, materialRecordIssues } from './material-binding.js';
import { readProtectedSnapshot, compareProtectedSnapshots } from './protection.js';

const count = z.number().int().nonnegative();
const counters = z
  .object({
    companies: count,
    aliases: count,
    contacts: count,
    drafts: count,
    versions: count,
    attempts: count,
    ownerConflicts: count,
    sharedMailboxes: count,
    missingLiteral: count,
    missingProvenance: count,
    staleSources: count,
    oldParserSources: count,
    incompleteSources: count,
    materialMismatches: count,
    blockedCompanies: count,
    uncertainAttempts: count,
    reservationMismatches: count,
    removedRecords: count,
    protectedDifferences: count,
  })
  .strict();
const codes = z.enum([
  'OWNER_CONFLICT',
  'SHARED_MAILBOX',
  'LITERAL_MISSING',
  'PROVENANCE_MISSING',
  'SOURCE_STALE',
  'PARSER_OLD',
  'SOURCE_INCOMPLETE',
  'MATERIAL_MISMATCH',
  'UNCERTAIN',
  'RESERVATION_MISMATCH',
  'REMOVED_RECORD',
  'PROTECTED_DIFFERENCE',
]);
export const libraryAuditSchema = z
  .object({
    schema: z.literal(1),
    scope: z.literal('SNAPSHOT_ONLY'),
    production_readiness: z.literal('NOT_ESTABLISHED'),
    supported: z.boolean(),
    integrity: z.boolean(),
    foreignKeys: z.boolean(),
    schemaVersion: count,
    comparedBefore: z.boolean(),
    historicalDeletionCheck: z.boolean(),
    counts: counters,
    limitations: z.array(z.enum(['UNSUPPORTED_SCHEMA', 'NO_BEFORE_SNAPSHOT'])).max(2),
    anomalies: z
      .array(z.object({ code: codes, pseudonym: z.string().regex(/^R[0-9]{4}$/) }).strict())
      .max(20),
  })
  .strict();
export const snapshotProvenanceSchema = z
  .object({
    schema: z.literal(1),
    method: z.enum(['VACUUM_INTO', 'SQLITE_BACKUP']),
    createdAt: z.iso.datetime(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    standalone: z.literal(true),
  })
  .strict();
export class LibraryAuditError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
const requirements: Record<string, string[]> = {
  migrations: ['name'],
  companies: [
    'id',
    'canonical_name',
    'normalized_key',
    'primary_domain',
    'history_status',
    'suppression_reason',
    'version',
  ],
  company_aliases: ['id', 'company_id', 'kind', 'value', 'verified_at'],
  contacts: [
    'id',
    'company_id',
    'email',
    'kind',
    'literal_verified',
    'evidence_id',
    'verification_status',
  ],
  drafts: [
    'id',
    'opportunity_id',
    'contact_id',
    'subject',
    'body',
    'fact_ids',
    'evidence_ids',
    'version',
    'payload_hash',
  ],
  research_drafts: ['draft_id', 'profile_hash', 'claims'],
  draft_versions: ['id', 'draft_id', 'version', 'payload_hash'],
  research_sources: [
    'id',
    'status',
    'method',
    'text',
    'fetched_at',
    'parser_version',
    'completeness',
    'original_url',
    'final_url',
    'content_hash',
    'address_contexts',
    'outbound_links',
  ],
  research_evidence: ['evidence_id', 'source_id'],
  evidence: ['id'],
  research_draft_materials: [
    'draft_id',
    'version',
    'payload_hash',
    'context_hash',
    'review_status',
    'code_status',
  ],
  source_verifications: ['source_id', 'status'],
  research_qualifications: ['opportunity_id', 'details'],
  research_items: ['opportunity_id', 'source_ids', 'analysis', 'updated_at'],
  candidate_profiles: ['id', 'profile_hash', 'approved_at'],
  candidate_facts: ['id', 'created_at', 'approval_status'],
  opportunities: ['id', 'company_id', 'contact_id', 'updated_at'],
  send_attempts: ['id', 'outbox_id', 'state'],
  outbox: ['id', 'status', 'run_id'],
  usage_ledger: ['id', 'outbox_id', 'campaign_id', 'run_id', 'state'],
  suppressions: ['company_id'],
  app_state: ['key', 'value'],
  auto_run_scope: ['run_id', 'scope_hash'],
  auto_draft_scope: ['draft_id', 'scope_hash'],
};

// Only proven standalone backups are copied. Never Store, migrations, restore, discovery or an app profile.
function openSnapshot(path: string, proofPath: string) {
  let proof;
  try {
    proof = snapshotProvenanceSchema.parse(JSON.parse(readFileSync(proofPath, 'utf8')));
  } catch {
    throw new LibraryAuditError('PROVENANCE_INVALID');
  }
  if (Date.parse(proof.createdAt) > Date.now() + 300000)
    throw new LibraryAuditError('PROVENANCE_INVALID');
  if (existsSync(path + '-wal') || existsSync(path + '-shm'))
    throw new LibraryAuditError('SNAPSHOT_NOT_STANDALONE');
  let bytes: Buffer;
  try {
    bytes = readFileSync(path);
  } catch {
    throw new LibraryAuditError('SNAPSHOT_UNREADABLE');
  }
  if (hash(bytes) !== proof.sha256) throw new LibraryAuditError('SNAPSHOT_HASH_MISMATCH');
  const dir = mkdtempSync(join(tmpdir(), 'jh-snapshot-audit-')),
    copy = join(dir, 'snapshot.sqlite');
  try {
    copyFileSync(path, copy);
    if (hash(readFileSync(copy)) !== proof.sha256) throw new LibraryAuditError('SNAPSHOT_CHANGED');
    const db = new Database(copy, { readonly: true, fileMustExist: true });
    db.pragma('query_only=ON');
    return {
      db,
      close() {
        db.close();
        rmSync(dir, { recursive: true, force: true });
      },
    };
  } catch {
    rmSync(dir, { recursive: true, force: true });
    throw new LibraryAuditError('SNAPSHOT_INVALID');
  }
}
function supported(db: Database.Database) {
  const shape = Object.entries(requirements).every(([table, cols]) => {
    const present = db.prepare('PRAGMA table_info("' + table + '")').all() as any[];
    return cols.every((c) => present.some((p) => p.name === c));
  });
  return shape && schemaVersion(db) >= 21 && schemaVersion(db) <= 25;
}
function schemaVersion(db: Database.Database) {
  try {
    return Number(
      (db.prepare('SELECT max(CAST(substr(name,1,3) AS INTEGER)) n FROM migrations').get() as any)
        ?.n ?? 0,
    );
  } catch {
    return 0;
  }
}
export function analyzeLibrarySnapshot(
  db: Database.Database,
  before?: Database.Database,
  now = Date.now(),
) {
  const n = (sql: string) => Number((db.prepare(sql).get() as any)?.n ?? 0);
  const result = {
    schema: 1 as const,
    scope: 'SNAPSHOT_ONLY' as const,
    production_readiness: 'NOT_ESTABLISHED' as const,
    supported: supported(db),
    integrity: db.pragma('integrity_check', { simple: true }) === 'ok',
    foreignKeys: (db.pragma('foreign_key_check') as unknown[]).length === 0,
    schemaVersion: schemaVersion(db),
    comparedBefore: !!before,
    historicalDeletionCheck: !!before,
    counts: Object.fromEntries(Object.keys(counters.shape).map((k) => [k, 0])) as z.infer<
      typeof counters
    >,
    limitations: [] as ('UNSUPPORTED_SCHEMA' | 'NO_BEFORE_SNAPSHOT')[],
    anomalies: [] as { code: z.infer<typeof codes>; pseudonym: string }[],
  };
  if (!before) result.limitations.push('NO_BEFORE_SNAPSHOT');
  if (!result.supported) {
    result.limitations.push('UNSUPPORTED_SCHEMA');
    result.historicalDeletionCheck = false;
    return libraryAuditSchema.parse(result);
  }
  const add = (code: z.infer<typeof codes>, amount: number) => {
    for (let i = 0; i < amount && result.anomalies.length < 20; i++)
      result.anomalies.push({
        code,
        pseudonym: 'R' + String(result.anomalies.length + 1).padStart(4, '0'),
      });
  };
  result.schemaVersion = n('SELECT max(CAST(substr(name,1,3) AS INTEGER)) n FROM migrations');
  for (const [key, table] of Object.entries({
    companies: 'companies',
    aliases: 'company_aliases',
    contacts: 'contacts',
    drafts: 'drafts',
    versions: 'draft_versions',
    attempts: 'send_attempts',
  }))
    (result.counts as any)[key] = n('SELECT count(*) n FROM ' + table);
  result.counts.ownerConflicts = n(
    "SELECT count(*) n FROM (SELECT value FROM company_aliases WHERE kind='DOMAIN' AND verified_at IS NOT NULL GROUP BY value HAVING count(DISTINCT company_id)>1)",
  );
  result.counts.ownerConflicts += n(
    "SELECT count(*) n FROM company_aliases a JOIN companies c ON c.primary_domain=a.value WHERE a.kind='DOMAIN' AND a.verified_at IS NOT NULL AND a.company_id<>c.id",
  );
  result.counts.sharedMailboxes = n(
    'SELECT count(*) n FROM (SELECT lower(email) FROM contacts GROUP BY lower(email) HAVING count(DISTINCT company_id)>1)',
  );
  result.counts.missingLiteral = n('SELECT count(*) n FROM contacts WHERE literal_verified<>1');
  result.counts.missingProvenance = n(
    "SELECT count(*) n FROM contacts t WHERE NOT EXISTS(SELECT 1 FROM research_evidence r JOIN research_sources s ON s.id=r.source_id JOIN source_verifications v ON v.source_id=s.id WHERE r.evidence_id=t.evidence_id AND v.status='READ')",
  );
  const sources = db.prepare('SELECT * FROM research_sources').all() as any[];
  const one = (sql: string, ...args: any[]) => db.prepare(sql).get(...args) as any;
  result.counts.missingLiteral = 0;
  result.counts.missingProvenance = 0;
  for (const t of db.prepare('SELECT * FROM contacts').all() as any[]) {
    const qualification = one(
      'SELECT q.details FROM research_qualifications q JOIN opportunities o ON o.id=q.opportunity_id WHERE o.contact_id=? ORDER BY o.updated_at DESC LIMIT 1',
      t.id,
    );
    try {
      const analysis = validateAnalysis(JSON.parse(qualification?.details ?? 'null'), sources);
      if (
        t.literal_verified !== 1 ||
        analysis.contact.email?.toLowerCase() !== t.email.toLowerCase() ||
        analysis.contact.kind !== t.kind ||
        !verifyQuote(analysis.contact.proof, sources)
      )
        result.counts.missingLiteral++;
      const company = one('SELECT primary_domain FROM companies WHERE id=?', t.company_id),
        aliases = db
          .prepare(
            "SELECT value FROM company_aliases WHERE company_id=? AND kind='DOMAIN' AND verified_at IS NOT NULL",
          )
          .all(t.company_id) as any[];
      if (
        !contactSourceAuthority(
          analysis,
          sources,
          [company?.primary_domain, ...aliases.map((a) => a.value)].filter(Boolean),
        )
      )
        result.counts.missingProvenance++;
    } catch {
      result.counts.missingLiteral++;
      result.counts.missingProvenance++;
    }
  }
  result.counts.staleSources = sources.filter(
    (s) => !Number.isFinite(Date.parse(s.fetched_at)) || now - Date.parse(s.fetched_at) > 86400000,
  ).length;
  result.counts.oldParserSources = sources.filter(
    (s) => s.method === 'PUBLIC_HTTP' && s.parser_version !== 3,
  ).length;
  result.counts.incompleteSources = sources.filter((s) => !sourceComplete(s)).length;
  const profile = {
    ...one("SELECT * FROM candidate_profiles WHERE id='candidate'"),
    facts: (
      db.prepare('SELECT * FROM candidate_facts ORDER BY created_at,id').all() as any[]
    ).filter((f) => f.approval_status !== 'DEFERRED'),
  };
  result.counts.materialMismatches = 0;
  for (const d of db.prepare('SELECT * FROM drafts').all() as any[]) {
    try {
      const item = one(
        'SELECT * FROM research_items WHERE opportunity_id=? AND analysis IS NOT NULL ORDER BY updated_at DESC LIMIT 1',
        d.opportunity_id,
      );
      const selected = item
        ? JSON.parse(item.source_ids)
        : (
            db
              .prepare(
                'SELECT r.source_id FROM research_evidence r WHERE r.evidence_id IN (SELECT value FROM json_each(?)) OR r.evidence_id=(SELECT evidence_id FROM contacts WHERE id=?)',
              )
              .all(d.evidence_ids, d.contact_id) as any[]
          ).map((r) => r.source_id);
      const selectedSources = selected
        .map((id: string) => sources.find((s) => s.id === id))
        .filter(Boolean);
      const binding = materialBinding({
        draft: d,
        profile,
        contact: one(
          'SELECT email,kind,evidence_id,verification_status,literal_verified FROM contacts WHERE id=?',
          d.contact_id,
        ),
        qualification: one(
          'SELECT details FROM research_qualifications WHERE opportunity_id=?',
          d.opportunity_id,
        ),
        claims: one('SELECT claims FROM research_drafts WHERE draft_id=?', d.id)?.claims,
        sources: selectedSources,
      });
      const material = one(
        'SELECT * FROM research_draft_materials WHERE draft_id=? AND version=?',
        d.id,
        d.version,
      );
      if (
        !material ||
        materialRecordIssues(material, d, binding).length ||
        selectedSources.length !== selected.length
      )
        result.counts.materialMismatches++;
    } catch {
      result.counts.materialMismatches++;
    }
  }
  result.counts.blockedCompanies = n(
    "SELECT count(*) n FROM companies c WHERE c.history_status<>'NEW' OR EXISTS(SELECT 1 FROM suppressions s WHERE s.company_id=c.id)",
  );
  result.counts.uncertainAttempts = n(
    "SELECT count(*) n FROM send_attempts WHERE state IN ('SENDING','SEND_UNKNOWN')",
  );
  result.counts.reservationMismatches = n(`SELECT count(*) n FROM (
    SELECT a.outbox_id id FROM send_attempts a LEFT JOIN usage_ledger u ON u.outbox_id=a.outbox_id LEFT JOIN outbox o ON o.id=a.outbox_id
      WHERE u.outbox_id IS NULL OR o.id IS NULL OR a.state<>o.status OR u.state<>CASE a.state WHEN 'SENDING' THEN 'RESERVED' WHEN 'SEND_UNKNOWN' THEN 'UNKNOWN' WHEN 'FAILED_NOT_SENT' THEN 'NOT_SENT' ELSE 'ACCEPTED' END
    UNION SELECT o.id FROM outbox o WHERE o.status IN ('SENDING','SEND_UNKNOWN','SENT_PROVIDER','SENT_CONFIRMED') AND (NOT EXISTS(SELECT 1 FROM send_attempts a WHERE a.outbox_id=o.id) OR NOT EXISTS(SELECT 1 FROM usage_ledger u WHERE u.outbox_id=o.id))
    UNION SELECT u.outbox_id FROM usage_ledger u LEFT JOIN outbox o ON o.id=u.outbox_id WHERE o.id IS NULL OR o.run_id<>u.run_id OR NOT EXISTS(SELECT 1 FROM send_attempts a WHERE a.outbox_id=u.outbox_id)
  )`);
  if (before) {
    if (!supported(before)) throw new LibraryAuditError('BEFORE_SCHEMA_UNSUPPORTED');
    result.counts.protectedDifferences = compareProtectedSnapshots(
      readProtectedSnapshot(before),
      readProtectedSnapshot(db),
    ).codes.length;
    for (const table of [
      'companies',
      'company_aliases',
      'contacts',
      'drafts',
      'draft_versions',
      'send_attempts',
      'usage_ledger',
    ]) {
      const ids = new Set((db.prepare('SELECT id FROM ' + table).all() as any[]).map((r) => r.id));
      result.counts.removedRecords += (
        before.prepare('SELECT id FROM ' + table).all() as any[]
      ).filter((r) => !ids.has(r.id)).length;
    }
  }
  for (const [key, code] of Object.entries({
    ownerConflicts: 'OWNER_CONFLICT',
    sharedMailboxes: 'SHARED_MAILBOX',
    missingLiteral: 'LITERAL_MISSING',
    missingProvenance: 'PROVENANCE_MISSING',
    staleSources: 'SOURCE_STALE',
    oldParserSources: 'PARSER_OLD',
    incompleteSources: 'SOURCE_INCOMPLETE',
    materialMismatches: 'MATERIAL_MISMATCH',
    uncertainAttempts: 'UNCERTAIN',
    reservationMismatches: 'RESERVATION_MISMATCH',
    removedRecords: 'REMOVED_RECORD',
    protectedDifferences: 'PROTECTED_DIFFERENCE',
  }))
    add(code as z.infer<typeof codes>, (result.counts as any)[key]);
  return libraryAuditSchema.parse(result);
}
export function auditLibrary(input: {
  snapshot: string;
  provenance: string;
  before?: string;
  beforeProvenance?: string;
  output?: string;
}) {
  if (input.before && !input.beforeProvenance)
    throw new LibraryAuditError('BEFORE_PROVENANCE_REQUIRED');
  if (
    input.output &&
    [input.snapshot, input.provenance, input.before, input.beforeProvenance]
      .filter(Boolean)
      .some((p) => resolve(p!) === resolve(input.output!))
  )
    throw new LibraryAuditError('OUTPUT_CONFLICT');
  if (input.output && existsSync(input.output)) throw new LibraryAuditError('OUTPUT_EXISTS');
  const current = openSnapshot(input.snapshot, input.provenance);
  let previous: ReturnType<typeof openSnapshot> | undefined;
  try {
    if (input.before) previous = openSnapshot(input.before, input.beforeProvenance!);
    const report = libraryAuditSchema.parse(analyzeLibrarySnapshot(current.db, previous?.db));
    const safe = JSON.stringify(report, null, 2) + '\n';
    if (input.output) writeFileSync(input.output, safe, { flag: 'wx', mode: 0o600 });
    return report;
  } catch (e) {
    if (e instanceof LibraryAuditError) throw e;
    throw new LibraryAuditError('AUDIT_FAILED');
  } finally {
    previous?.close();
    current.close();
  }
}
