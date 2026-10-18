import { hash } from '../util.js';
import type { Row } from '../../../../packages/shared/types.js';
import type { Source } from './fetcher.js';
export function materialBinding(input: {
  draft: Row;
  profile: Row;
  contact: Row | undefined;
  qualification: Row | undefined;
  claims: unknown;
  sources: Source[];
}) {
  const { draft: d, profile, contact, qualification } = input;
  return hash(
    JSON.stringify({
      version: d.version,
      payload: d.payload_hash,
      subject: d.subject,
      body: d.body,
      facts: d.fact_ids,
      evidence: d.evidence_ids,
      claims: input.claims,
      profileHash: profile.profile_hash,
      approved: profile.approved_at,
      factsHash: hash(JSON.stringify(profile.facts)),
      contact,
      qualification,
      sources: input.sources.map((s) => ({
        id: s.id,
        hash: s.content_hash,
        url: s.final_url,
        method: s.method,
        parser: s.parser_version,
        text: hash(s.text),
        contexts: hash(s.address_contexts ?? ''),
        completeness: s.completeness,
        links: hash(s.outbound_links ?? '[]'),
      })),
    }),
  );
}
export function materialRecordIssues(material: Row, draft: Row, currentBinding: string) {
  if (material.context_hash !== currentBinding || material.payload_hash !== draft.payload_hash)
    return ['DRAFT_MATERIAL_STALE'];
  return material.code_status === 'PASS' && material.review_status === 'COMPLETED'
    ? []
    : ['DRAFT_MATERIAL_UNVERIFIED'];
}
