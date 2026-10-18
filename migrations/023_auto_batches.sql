CREATE TABLE auto_batches (
 id TEXT PRIMARY KEY, state TEXT NOT NULL, prepared_at TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1, policy_hash TEXT NOT NULL, policy_json TEXT NOT NULL,
 scope_hash TEXT NOT NULL, approved_hash TEXT, approved_at TEXT, reason TEXT,
 updated_at TEXT NOT NULL
);
CREATE TABLE auto_batch_items (
 id TEXT PRIMARY KEY, batch_id TEXT NOT NULL REFERENCES auto_batches(id),
 ordinal INTEGER NOT NULL, company_id TEXT NOT NULL REFERENCES companies(id),
 contact_id TEXT NOT NULL REFERENCES contacts(id), recipient TEXT NOT NULL,
 draft_id TEXT NOT NULL REFERENCES drafts(id), draft_version INTEGER NOT NULL,
 payload_hash TEXT NOT NULL, binding TEXT NOT NULL, contact_binding TEXT NOT NULL,
 material_binding TEXT NOT NULL, state TEXT NOT NULL, code TEXT, qualified_at TEXT NOT NULL,
 UNIQUE(batch_id,draft_id), UNIQUE(batch_id,ordinal)
);
CREATE TABLE auto_batch_sessions (
 batch_id TEXT NOT NULL REFERENCES auto_batches(id), session_id TEXT PRIMARY KEY REFERENCES auto_sessions(id)
);
CREATE TABLE auto_batch_outbox (
 item_id TEXT NOT NULL REFERENCES auto_batch_items(id), outbox_id TEXT PRIMARY KEY REFERENCES outbox(id)
);
CREATE INDEX batch_items_order ON auto_batch_items(batch_id,ordinal);
