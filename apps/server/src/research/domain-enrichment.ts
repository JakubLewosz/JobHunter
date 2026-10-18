import { Store } from '../db.js';
import { companyDomain, normalizeName, id, hash, DomainError } from '../util.js';
import { compact, verifyQuote } from './contracts.js';
import { sourceComplete } from './source-policy.js';
import type { Source } from './fetcher.js';

export function domainProofHash(event: Record<string, any>) {
  return hash(
    JSON.stringify([
      event.operation_id,
      event.company_id,
      event.previous_value,
      event.previous_kind,
      event.previous_version,
      event.resulting_version,
      event.domain,
      event.alias_id,
      event.source_id,
      event.verification_id,
      event.source_hash,
      event.parser_version,
      event.verified_at,
      event.company_name,
      event.identity_quote,
      event.created_at,
    ]),
  );
}
// Only native qualification supplies this input. Models never receive an event or
// a mutation capability; their proposed quote still has to pass literal checks.
export function enrichCompanyDomain(
  store: Store,
  input: {
    companyId: string;
    expectedVersion: number;
    domain: string;
    operationId: string;
    companyName: string;
    sourceId: string;
    quote: string;
    now: string;
    allowLegacyEmptyString?: boolean;
  },
) {
  store.assertExclusive();
  return store.atomic(() => {
    const c = store.one('SELECT * FROM companies WHERE id=?', input.companyId);
    const domain = companyDomain(input.domain);
    if (!c || c.version !== input.expectedVersion || !domain)
      throw new DomainError(
        'COMPANY_IDENTITY_CONFLICT',
        'Wersja lub tożsamość firmy zmieniła się.',
      );
    if (
      c.primary_domain !== null &&
      !(input.allowLegacyEmptyString === true && c.primary_domain === '')
    )
      throw new DomainError(
        'DOMAIN_NOT_EMPTY',
        'Domena nie jest pustym polem dopuszczonym do uzupełnienia.',
      );
    const owners = store.all(
      "SELECT id FROM companies WHERE primary_domain=? AND id<>? UNION SELECT company_id id FROM company_aliases WHERE kind='DOMAIN' AND value=? AND verified_at IS NOT NULL AND company_id<>?",
      domain,
      c.id,
      domain,
      c.id,
    );
    if (owners.length)
      throw new DomainError('COMPANY_IDENTITY_CONFLICT', 'Domena ma innego właściciela.');
    const source = store.one('SELECT * FROM research_sources WHERE id=?', input.sourceId) as
      Source | undefined;
    const verification = store.one(
      "SELECT * FROM source_verifications WHERE source_id=? AND status='READ' ORDER BY checked_at DESC,rowid DESC LIMIT 1",
      input.sourceId,
    );
    let host: string | null = null;
    try {
      host = source?.final_url ? companyDomain(new URL(source.final_url).hostname) : null;
    } catch {}
    const names = [
      c.canonical_name,
      ...store
        .all(
          "SELECT value FROM company_aliases WHERE company_id=? AND kind='NAME' AND verified_at IS NOT NULL",
          c.id,
        )
        .map((r) => r.value),
    ].map(normalizeName);
    if (
      !source ||
      !sourceComplete(source) ||
      host !== domain ||
      !source.content_hash ||
      !names.includes(normalizeName(input.companyName)) ||
      !verifyQuote({ sourceId: source.id, quote: input.quote }, [source]) ||
      !normalizeName(input.quote).includes(normalizeName(input.companyName)) ||
      !verification ||
      verification.content_hash !== source.content_hash ||
      verification.final_url !== source.final_url ||
      Date.parse(input.now) - Date.parse(verification.checked_at) > 86400000 ||
      !Number.isFinite(Date.parse(verification.checked_at)) ||
      Date.parse(verification.checked_at) > Date.parse(input.now) + 5000
    )
      throw new DomainError(
        'DOMAIN_EVIDENCE_REQUIRED',
        'Brak aktualnego, zgodnego dowodu uzupełnienia domeny.',
      );
    const updated = store.exec(
      'UPDATE companies SET primary_domain=?,version=version+1,updated_at=? WHERE id=? AND version=? AND primary_domain IS ?',
      domain,
      input.now,
      c.id,
      input.expectedVersion,
      c.primary_domain,
    );
    if (updated.changes !== 1) throw new DomainError('VERSION_CONFLICT', 'Firma zmieniła się.');
    store.exec(
      "INSERT OR IGNORE INTO company_aliases VALUES (?,?,'DOMAIN',?,?,?)",
      id(),
      c.id,
      domain,
      verification.checked_at,
      input.now,
    );
    const alias = store.one(
      "SELECT * FROM company_aliases WHERE company_id=? AND kind='DOMAIN' AND value=?",
      c.id,
      domain,
    )!;
    if (!alias.verified_at)
      throw new DomainError('DOMAIN_EVIDENCE_REQUIRED', 'Alias nie jest potwierdzony.');
    const event = {
      id: id(),
      operation_id: input.operationId,
      company_id: c.id,
      previous_value: c.primary_domain,
      previous_kind: c.primary_domain === null ? 'NULL' : 'EMPTY_STRING',
      previous_version: c.version,
      resulting_version: c.version + 1,
      domain,
      alias_id: alias.id,
      source_id: source.id,
      verification_id: verification.id,
      source_hash: source.content_hash,
      parser_version: source.parser_version ?? 0,
      verified_at: verification.checked_at,
      company_name: input.companyName,
      identity_quote: input.quote,
      created_at: input.now,
    };
    store.exec(
      'INSERT INTO company_domain_enrichments (id,operation_id,company_id,previous_value,previous_kind,previous_version,resulting_version,domain,alias_id,source_id,verification_id,source_hash,parser_version,verified_at,company_name,identity_quote,proof_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      event.id,
      event.operation_id,
      event.company_id,
      event.previous_value,
      event.previous_kind,
      event.previous_version,
      event.resulting_version,
      event.domain,
      event.alias_id,
      event.source_id,
      event.verification_id,
      event.source_hash,
      event.parser_version,
      event.verified_at,
      event.company_name,
      event.identity_quote,
      domainProofHash(event),
      event.created_at,
    );
    return event.id;
  });
}
