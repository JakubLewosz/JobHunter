CREATE TABLE campaigns_e4 (
 id TEXT PRIMARY KEY, mode TEXT NOT NULL CHECK(mode IN ('DEMO','RESEARCH_ONLY','APPROVAL_REQUIRED')), account_email TEXT NOT NULL,
 cv_id TEXT REFERENCES cv_assets(id), policy_version INTEGER NOT NULL DEFAULT 1,
 daily_limit INTEGER NOT NULL, cycle_limit INTEGER NOT NULL, campaign_limit INTEGER NOT NULL,
 interval_minutes INTEGER NOT NULL, duration_minutes INTEGER NOT NULL, max_candidates INTEGER NOT NULL,
 window_start TEXT NOT NULL, window_end TEXT NOT NULL, timezone TEXT NOT NULL,
 schedule_enabled INTEGER NOT NULL DEFAULT 0, empty_cycles INTEGER NOT NULL DEFAULT 0,
 expires_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO campaigns_e4 SELECT * FROM campaigns;
DROP TABLE campaigns;
ALTER TABLE campaigns_e4 RENAME TO campaigns;
ALTER TABLE outbox ADD COLUMN kind TEXT NOT NULL DEFAULT 'FIRST_CONTACT' CHECK(kind IN ('FIRST_CONTACT','SELF_TEST'));
DROP INDEX first_contact;
CREATE UNIQUE INDEX first_contact ON outbox(company_id) WHERE kind='FIRST_CONTACT' AND status IN ('QUEUED','SENDING','SENT_PROVIDER','SENT_CONFIRMED','SEND_UNKNOWN');
CREATE TABLE gmail_previews (
 id TEXT PRIMARY KEY, account_subject TEXT NOT NULL, account_email TEXT NOT NULL,
 cv_id TEXT NOT NULL REFERENCES cv_assets(id), cv_hash TEXT NOT NULL, profile_hash TEXT NOT NULL,
 policy_version INTEGER NOT NULL, kind TEXT NOT NULL, expires_at TEXT NOT NULL, approved_at TEXT, created_at TEXT NOT NULL
);
CREATE TABLE gmail_preview_items (
 id TEXT PRIMARY KEY, preview_id TEXT NOT NULL REFERENCES gmail_previews(id), draft_id TEXT NOT NULL REFERENCES drafts(id),
 draft_version INTEGER NOT NULL, binding_hash TEXT NOT NULL, recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
 message_id TEXT NOT NULL UNIQUE, mime BLOB NOT NULL, mime_hash TEXT NOT NULL, outbox_id TEXT UNIQUE REFERENCES outbox(id)
);
CREATE TABLE gmail_history_checks (
 company_id TEXT NOT NULL REFERENCES companies(id), account_subject TEXT NOT NULL,
 scope_hash TEXT NOT NULL, status TEXT NOT NULL, page_cursor TEXT, history_id TEXT, checked_at TEXT,
 consent_expires_at TEXT NOT NULL, error TEXT, PRIMARY KEY(company_id,account_subject)
);
CREATE TABLE gmail_messages (
 id TEXT PRIMARY KEY, account_subject TEXT NOT NULL, provider_id TEXT NOT NULL, provider_thread_id TEXT NOT NULL,
 company_id TEXT NOT NULL REFERENCES companies(id), outbox_id TEXT REFERENCES outbox(id), direction TEXT NOT NULL,
 sender TEXT NOT NULL, recipients TEXT NOT NULL, subject TEXT NOT NULL, message_id TEXT NOT NULL,
 sent_at TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'UNCLEAR',
 reviewed_at TEXT, created_at TEXT NOT NULL, UNIQUE(account_subject,provider_id,company_id)
);
CREATE TABLE gmail_outbox (
 outbox_id TEXT PRIMARY KEY REFERENCES outbox(id), item_id TEXT NOT NULL UNIQUE REFERENCES gmail_preview_items(id),
 account_subject TEXT NOT NULL, read_consent_expires_at TEXT NOT NULL
);
CREATE INDEX gmail_reply_company ON gmail_messages(company_id,direction,sent_at);
