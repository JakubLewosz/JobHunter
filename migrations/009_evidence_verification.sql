CREATE TABLE source_verifications (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES research_sources(id),
 checked_at TEXT NOT NULL, status TEXT NOT NULL, final_url TEXT, content_hash TEXT
);
CREATE INDEX source_verification_time ON source_verifications(source_id,checked_at);
ALTER TABLE contacts ADD COLUMN literal_verified INTEGER NOT NULL DEFAULT 0;
CREATE TABLE contact_reviews (
 contact_id TEXT PRIMARY KEY REFERENCES contacts(id), evidence_id TEXT NOT NULL REFERENCES evidence(id),
 kind TEXT NOT NULL, reviewed_at TEXT NOT NULL
);
