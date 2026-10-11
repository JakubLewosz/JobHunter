CREATE TABLE auto_skips (
 draft_id TEXT NOT NULL REFERENCES drafts(id), draft_version INTEGER NOT NULL,
 company_id TEXT NOT NULL REFERENCES companies(id), session_id TEXT REFERENCES auto_sessions(id),
 outbox_id TEXT REFERENCES outbox(id), reason_code TEXT NOT NULL, message TEXT NOT NULL,
 created_at TEXT NOT NULL, PRIMARY KEY(draft_id,draft_version)
);
