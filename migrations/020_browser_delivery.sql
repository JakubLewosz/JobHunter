-- Additive provenance only. Existing MIME, attempts, quotas and suppression history stay intact.
CREATE TABLE browser_deliveries (
 id TEXT PRIMARY KEY,
 outbox_id TEXT NOT NULL UNIQUE REFERENCES outbox(id),
 state TEXT NOT NULL CHECK(state IN ('WAITING','CLAIMED','COMMITTING','ACKNOWLEDGED','FAILED_NOT_SENT','SEND_UNKNOWN')),
 payload_hash TEXT NOT NULL,
 payload_json TEXT NOT NULL,
 worker_id TEXT,
 compose_id TEXT,
 committed_at TEXT,
 click_granted_at TEXT,
 receipt_json TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
