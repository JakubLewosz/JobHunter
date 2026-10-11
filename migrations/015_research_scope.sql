CREATE TABLE auto_run_scope (run_id TEXT PRIMARY KEY REFERENCES runs(id), scope_hash TEXT NOT NULL);
CREATE TABLE auto_draft_scope (draft_id TEXT PRIMARY KEY REFERENCES drafts(id), scope_hash TEXT NOT NULL);
