CREATE TABLE campaigns_auto (
 id TEXT PRIMARY KEY, mode TEXT NOT NULL CHECK(mode IN ('DEMO','RESEARCH_ONLY','APPROVAL_REQUIRED','AUTO_POLICY')), account_email TEXT NOT NULL,
 cv_id TEXT REFERENCES cv_assets(id), policy_version INTEGER NOT NULL DEFAULT 1,
 daily_limit INTEGER NOT NULL, cycle_limit INTEGER NOT NULL, campaign_limit INTEGER NOT NULL,
 interval_minutes INTEGER NOT NULL, duration_minutes INTEGER NOT NULL, max_candidates INTEGER NOT NULL,
 window_start TEXT NOT NULL, window_end TEXT NOT NULL, timezone TEXT NOT NULL,
 schedule_enabled INTEGER NOT NULL DEFAULT 0, empty_cycles INTEGER NOT NULL DEFAULT 0,
 expires_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO campaigns_auto SELECT * FROM campaigns;
DROP TABLE campaigns;
ALTER TABLE campaigns_auto RENAME TO campaigns;
CREATE TABLE draft_approvals_auto (
 id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES drafts(id), draft_version INTEGER NOT NULL,
 payload_hash TEXT NOT NULL, binding_hash TEXT NOT NULL, actor TEXT NOT NULL CHECK(actor IN ('user','policy')),
 expires_at TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL
);
INSERT INTO draft_approvals_auto SELECT * FROM draft_approvals;
DROP TABLE draft_approvals;
ALTER TABLE draft_approvals_auto RENAME TO draft_approvals;
CREATE TABLE auto_sessions (
 id TEXT PRIMARY KEY, policy_hash TEXT NOT NULL, status TEXT NOT NULL,
 started_at TEXT NOT NULL, stopped_at TEXT, reason TEXT
);
CREATE TABLE auto_outbox (
 outbox_id TEXT PRIMARY KEY REFERENCES outbox(id), session_id TEXT NOT NULL REFERENCES auto_sessions(id)
);
CREATE TABLE shared_attempts (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), recipient TEXT NOT NULL,
 state TEXT NOT NULL, message_id TEXT NOT NULL, mime_hash TEXT NOT NULL, cv_hash TEXT,
 subject TEXT NOT NULL, body TEXT NOT NULL, day TEXT NOT NULL, created_at TEXT NOT NULL
);
