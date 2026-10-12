ALTER TABLE model_calls ADD COLUMN diagnostic TEXT;
CREATE TABLE research_draft_materials (
 draft_id TEXT NOT NULL REFERENCES drafts(id), version INTEGER NOT NULL,
 payload_hash TEXT NOT NULL, context_hash TEXT NOT NULL,
 payload_json TEXT NOT NULL, context_json TEXT NOT NULL,
 code_status TEXT NOT NULL, code_error TEXT,
 review_status TEXT NOT NULL, review_error TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 PRIMARY KEY(draft_id,version)
);
