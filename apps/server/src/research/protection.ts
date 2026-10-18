import type Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { hash, normalizeName, companyDomain } from '../util.js';
import { domainProofHash } from './domain-enrichment.js';
import { compact } from './contracts.js';
import { canonicalPath, pathContains } from '../safe-paths.js';
import { sourceHasCompleteText } from './source-policy.js';
import type { Source } from './fetcher.js';

type Row = Record<string, any>;
export type ProtectedSnapshot = {
  schema: 2;
  capturedAt: string;
  tables: Record<string, string>;
  companies: Row[];
  aliases: Row[];
  versions: Record<string, string>;
  policyScope: string | null;
  draftScopes: Row[];
  events: Row[];
  sources: Row[];
  verifications: Row[];
};
const protectedTables = new Set([
  'migrations',
  'campaigns',
  'candidate_profiles',
  'candidate_facts',
  'portfolio_projects',
  'cv_assets',
  'contact_reviews',
  'draft_approvals',
  'outbox',
  'send_attempts',
  'usage_ledger',
  'mail_messages',
  'history_records',
  'suppressions',
  'mock_deliveries',
  'browser_deliveries',
]);
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
export function readProtectedSnapshot(
  db: Database.Database,
  at = new Date().toISOString(),
): ProtectedSnapshot {
  // Short deferred read transaction; never held across an await, timer or file read.
  return db.transaction(() => {
    const names = (
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all() as Row[]
    ).map((r) => r.name as string);
    const tables: Record<string, string> = {};
    const appendOnlyScopes = ['auto_run_scope'];
    for (const name of names.filter(
      (n) =>
        !appendOnlyScopes.includes(n) &&
        n !== 'auto_draft_scope' &&
        (protectedTables.has(n) || /^(gmail_|auto_|shared_)/.test(n)),
    )) {
      const records = (db.prepare('SELECT * FROM ' + quote(name)).all() as Row[])
        .map((r) => JSON.stringify(r))
        .sort();
      tables[name] = hash(JSON.stringify(records));
    }
    const state = (
      db.prepare('SELECT key,value FROM app_state ORDER BY key').all() as Row[]
    ).filter((r) =>
      /^(gmail|auto|shared|prior|history|localHistory|skipLegacy|newCampaign)/i.test(r.key),
    );
    tables.app_state = hash(JSON.stringify(state));
    const events = names.includes('company_domain_enrichments')
      ? (db.prepare('SELECT * FROM company_domain_enrichments ORDER BY id').all() as Row[])
      : [];
    return {
      schema: 2 as const,
      capturedAt: at,
      tables,
      companies: db
        .prepare(
          'SELECT id,canonical_name,normalized_key,primary_domain,history_status,suppression_reason,version FROM companies ORDER BY id',
        )
        .all() as Row[],
      aliases: db.prepare('SELECT * FROM company_aliases ORDER BY id').all() as Row[],
      versions: Object.fromEntries([
        ...(db.prepare('SELECT * FROM draft_versions ORDER BY id').all() as Row[]).map((r) => [
          r.id,
          hash(JSON.stringify(r)),
        ]),
        ...appendOnlyScopes.flatMap((table) =>
          (db.prepare('SELECT * FROM ' + table).all() as Row[]).map((r) => [
            table + ':' + (r.run_id ?? r.draft_id),
            hash(JSON.stringify(r)),
          ]),
        ),
      ]),
      policyScope:
        JSON.parse(state.find((r) => r.key === 'autoPolicy')?.value ?? 'null')?.scopeHash ?? null,
      draftScopes: db
        .prepare(
          `SELECT a.draft_id,a.scope_hash,d.version,
        EXISTS(SELECT 1 FROM draft_versions v WHERE v.draft_id=d.id AND v.version=d.version
          AND v.payload_hash=d.payload_hash AND v.subject=d.subject AND v.body=d.body) has_version_record
        FROM auto_draft_scope a JOIN drafts d ON d.id=a.draft_id ORDER BY a.draft_id`,
        )
        .all() as Row[],
      events,
      sources: events.length
        ? (db
            .prepare(
              'SELECT id,original_url,final_url,content_hash,parser_version,text,status,method,completeness FROM research_sources WHERE id IN (SELECT source_id FROM company_domain_enrichments)',
            )
            .all() as Row[])
        : [],
      verifications: events.length
        ? (db
            .prepare(
              'SELECT * FROM source_verifications WHERE id IN (SELECT verification_id FROM company_domain_enrichments)',
            )
            .all() as Row[])
        : [],
    };
  })();
}
export type MaterialProof = {
  valid: boolean;
  assets: { id: string; expected: string; observed: string; bytes: number }[];
};
export function fileMaterialProof(db: Database.Database, dir: string): MaterialProof {
  const assets: MaterialProof['assets'] = [];
  try {
    const root = resolve(dir, 'cv');
    for (const row of db
      .prepare(
        'SELECT id,stored_name,sha256,byte_size FROM cv_assets WHERE approved_at IS NOT NULL ORDER BY id',
      )
      .all() as Row[]) {
      const path = resolve(root, row.stored_name),
        rel = relative(root, path);
      if (
        !rel ||
        isAbsolute(rel) ||
        rel === '..' ||
        rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/'))
      )
        return { valid: false, assets: [] };
      if (!pathContains(canonicalPath(root), canonicalPath(path)))
        return { valid: false, assets: [] };
      const bytes = readFileSync(path),
        observed = hash(bytes);
      assets.push({ id: row.id, expected: row.sha256, observed, bytes: bytes.length });
      if (observed !== row.sha256 || bytes.length !== row.byte_size)
        return { valid: false, assets };
    }
    return { valid: true, assets };
  } catch {
    return { valid: false, assets: [] };
  }
}
export function compareProtectedSnapshots(
  before: ProtectedSnapshot,
  after: ProtectedSnapshot,
  files?: { before: MaterialProof; after: MaterialProof },
) {
  const codes = new Set<string>(),
    acceptedEvents: string[] = [];
  if (before.schema !== 2 || after.schema !== 2)
    return { ok: false, codes: ['SNAPSHOT_SCHEMA'], acceptedEvents };
  for (const [table, digest] of Object.entries(before.tables))
    if (after.tables[table] !== digest) codes.add('PROTECTED_TABLE_CHANGED');
  for (const [key, digest] of Object.entries(before.versions))
    if (after.versions[key] !== digest) codes.add('DRAFT_VERSION_CHANGED');
  for (const old of before.draftScopes) {
    const current = after.draftScopes.find((r) => r.draft_id === old.draft_id);
    if (
      !current ||
      current.version < old.version ||
      (current.scope_hash !== old.scope_hash &&
        !(
          current.version > old.version &&
          current.has_version_record === 1 &&
          current.scope_hash === before.policyScope &&
          after.policyScope === before.policyScope
        ))
    )
      codes.add('DRAFT_SCOPE_CHANGED');
  }
  for (const old of before.aliases)
    if (JSON.stringify(after.aliases.find((a) => a.id === old.id)) !== JSON.stringify(old))
      codes.add('OLD_ALIAS_CHANGED');
  for (const old of before.events)
    if (JSON.stringify(after.events.find((e) => e.id === old.id)) !== JSON.stringify(old))
      codes.add('DOMAIN_EVENT_CHANGED');
  for (const old of before.companies) {
    const current = after.companies.find((c) => c.id === old.id);
    if (!current) {
      codes.add('COMPANY_REMOVED');
      continue;
    }
    if (JSON.stringify(current) === JSON.stringify(old)) continue;
    const unchanged = [
      'id',
      'canonical_name',
      'normalized_key',
      'history_status',
      'suppression_reason',
    ].every((k) => current[k] === old[k]);
    const events = after.events.filter(
      (e) => e.company_id === old.id && e.previous_version === old.version,
    );
    const event = events[0],
      alias = event && after.aliases.find((a) => a.id === event.alias_id);
    const source = event && after.sources.find((s) => s.id === event.source_id);
    const verification = event && after.verifications.find((v) => v.id === event.verification_id);
    let sourceDomain: string | null = null;
    try {
      sourceDomain = source?.final_url ? companyDomain(new URL(source.final_url).hostname) : null;
    } catch {}
    const legalEmpty =
      old.primary_domain === null
        ? event?.previous_kind === 'NULL'
        : old.primary_domain === '' && event?.previous_kind === 'EMPTY_STRING';
    const owners = after.aliases
      .filter((a) => a.kind === 'DOMAIN' && a.verified_at && a.value === current.primary_domain)
      .map((a) => a.company_id);
    const nameOwners = after.aliases
      .filter(
        (a) =>
          a.kind === 'NAME' &&
          a.verified_at &&
          normalizeName(a.value) === normalizeName(event?.company_name ?? ''),
      )
      .map((a) => a.company_id);
    const valid =
      unchanged &&
      legalEmpty &&
      events.length === 1 &&
      event.previous_value === old.primary_domain &&
      event.domain === current.primary_domain &&
      event.previous_version === old.version &&
      event.resulting_version === old.version + 1 &&
      current.version === event.resulting_version &&
      event.proof_hash === domainProofHash(event) &&
      !before.events.some((e) => e.operation_id === event.operation_id) &&
      after.events.filter((e) => e.operation_id === event.operation_id).length === 1 &&
      !!alias &&
      alias.company_id === old.id &&
      alias.kind === 'DOMAIN' &&
      alias.value === event.domain &&
      !!alias.verified_at &&
      owners.every((owner) => owner === old.id) &&
      nameOwners.includes(old.id) &&
      !after.companies.some((c) => c.id !== old.id && c.primary_domain === event.domain) &&
      sourceDomain === event.domain &&
      !!source &&
      sourceHasCompleteText(source as Source) &&
      source?.content_hash === event.source_hash &&
      source?.parser_version === event.parser_version &&
      compact(source?.text ?? '').includes(compact(event.identity_quote)) &&
      normalizeName(event.identity_quote).includes(normalizeName(event.company_name)) &&
      !!verification &&
      verification.source_id === event.source_id &&
      verification.status === 'READ' &&
      verification.content_hash === event.source_hash &&
      verification.checked_at === event.verified_at &&
      verification.final_url === source?.final_url &&
      Number.isFinite(Date.parse(event.created_at)) &&
      Date.parse(event.created_at) - Date.parse(event.verified_at) >= -5000 &&
      Date.parse(event.created_at) - Date.parse(event.verified_at) <= 86400000;
    if (valid) acceptedEvents.push(event.id);
    else codes.add('COMPANY_IDENTITY_CHANGED');
  }
  if (
    files &&
    (!files.before.valid ||
      !files.after.valid ||
      JSON.stringify(files.before.assets) !== JSON.stringify(files.after.assets))
  )
    codes.add('APPROVED_FILES_CHANGED');
  return { ok: codes.size === 0, codes: [...codes], acceptedEvents };
}
