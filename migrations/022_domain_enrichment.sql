CREATE TABLE company_domain_enrichments (
 id TEXT PRIMARY KEY,
 operation_id TEXT NOT NULL UNIQUE,
 company_id TEXT NOT NULL REFERENCES companies(id),
 previous_value TEXT,
 previous_kind TEXT NOT NULL CHECK(previous_kind IN ('NULL','EMPTY_STRING')),
 previous_version INTEGER NOT NULL,
 resulting_version INTEGER NOT NULL,
 domain TEXT NOT NULL,
 alias_id TEXT NOT NULL REFERENCES company_aliases(id),
 source_id TEXT NOT NULL REFERENCES research_sources(id),
 verification_id TEXT NOT NULL REFERENCES source_verifications(id),
 source_hash TEXT NOT NULL,
 parser_version INTEGER NOT NULL,
 verified_at TEXT NOT NULL,
 company_name TEXT NOT NULL,
 identity_quote TEXT NOT NULL,
 proof_hash TEXT NOT NULL,
 created_at TEXT NOT NULL,
 UNIQUE(company_id,previous_version)
);
CREATE TRIGGER company_domain_enrichment_no_update BEFORE UPDATE ON company_domain_enrichments
BEGIN SELECT RAISE(ABORT,'DOMAIN_ENRICHMENT_IMMUTABLE'); END;
CREATE TRIGGER company_domain_enrichment_no_delete BEFORE DELETE ON company_domain_enrichments
BEGIN SELECT RAISE(ABORT,'DOMAIN_ENRICHMENT_IMMUTABLE'); END;
