CREATE TABLE candidate_profiles (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, goal TEXT NOT NULL,
 hours_min INTEGER NOT NULL, hours_max INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1,
 profile_hash TEXT NOT NULL, approved_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE candidate_facts (
 id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES candidate_profiles(id), fact_key TEXT NOT NULL,
 content TEXT NOT NULL, source TEXT NOT NULL, checked_at TEXT, approval_status TEXT NOT NULL DEFAULT 'DRAFT',
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(profile_id,fact_key)
);
CREATE TABLE portfolio_projects (
 id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES candidate_profiles(id), name TEXT NOT NULL,
 url TEXT NOT NULL, description TEXT NOT NULL, limitations TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE cv_assets (
 id TEXT PRIMARY KEY, sha256 TEXT NOT NULL UNIQUE, byte_size INTEGER NOT NULL, file_name TEXT NOT NULL,
 stored_name TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, approved_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE campaigns (
 id TEXT PRIMARY KEY, mode TEXT NOT NULL CHECK(mode='DEMO'), account_email TEXT NOT NULL,
 cv_id TEXT REFERENCES cv_assets(id), policy_version INTEGER NOT NULL DEFAULT 1,
 daily_limit INTEGER NOT NULL, cycle_limit INTEGER NOT NULL, campaign_limit INTEGER NOT NULL,
 interval_minutes INTEGER NOT NULL, duration_minutes INTEGER NOT NULL, max_candidates INTEGER NOT NULL,
 window_start TEXT NOT NULL, window_end TEXT NOT NULL, timezone TEXT NOT NULL,
 schedule_enabled INTEGER NOT NULL DEFAULT 0, empty_cycles INTEGER NOT NULL DEFAULT 0,
 expires_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE companies (
 id TEXT PRIMARY KEY, canonical_name TEXT NOT NULL, primary_domain TEXT UNIQUE,
 normalized_key TEXT NOT NULL UNIQUE, history_status TEXT NOT NULL DEFAULT 'NEW',
 suppression_reason TEXT, version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE company_aliases (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), kind TEXT NOT NULL,
 value TEXT NOT NULL, verified_at TEXT, created_at TEXT NOT NULL, UNIQUE(kind,value)
);
CREATE TABLE evidence (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), canonical_url TEXT NOT NULL,
 fetched_at TEXT NOT NULL, content_hash TEXT NOT NULL, fragment TEXT NOT NULL, availability TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE contacts (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), email TEXT NOT NULL,
 kind TEXT NOT NULL, evidence_id TEXT NOT NULL REFERENCES evidence(id), verification_status TEXT NOT NULL,
 verified_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(company_id,email)
);
CREATE TABLE opportunities (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), evidence_id TEXT NOT NULL REFERENCES evidence(id),
 contact_id TEXT REFERENCES contacts(id), title TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL,
 remote TEXT NOT NULL, part_time TEXT NOT NULL, paid TEXT NOT NULL, junior TEXT NOT NULL, hours TEXT NOT NULL,
 decision TEXT NOT NULL, reasons TEXT NOT NULL, required_conditions TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE drafts (
 id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id), company_id TEXT NOT NULL REFERENCES companies(id),
 opportunity_id TEXT NOT NULL REFERENCES opportunities(id), contact_id TEXT NOT NULL REFERENCES contacts(id),
 subject TEXT NOT NULL, body TEXT NOT NULL, fact_ids TEXT NOT NULL, evidence_ids TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1, payload_hash TEXT NOT NULL, status TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(campaign_id,company_id)
);
CREATE TABLE draft_versions (
 id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES drafts(id), version INTEGER NOT NULL,
 subject TEXT NOT NULL, body TEXT NOT NULL, payload_hash TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(draft_id,version)
);
CREATE TABLE draft_approvals (
 id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES drafts(id), draft_version INTEGER NOT NULL,
 payload_hash TEXT NOT NULL, binding_hash TEXT NOT NULL, actor TEXT NOT NULL CHECK(actor='user'),
 expires_at TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL
);
CREATE TABLE runs (
 id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id), cycle_key TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL, stage TEXT NOT NULL, discovered INTEGER NOT NULL DEFAULT 0, duplicates INTEGER NOT NULL DEFAULT 0,
 started_at TEXT NOT NULL, finished_at TEXT, heartbeat TEXT, lease_until TEXT, error TEXT, updated_at TEXT NOT NULL
);
CREATE TABLE jobs (
 id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), kind TEXT NOT NULL, status TEXT NOT NULL,
 cursor INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, lease_until TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX single_active_run ON runs(campaign_id) WHERE status IN ('QUEUED','RUNNING','PAUSED');
CREATE TABLE outbox (
 id TEXT PRIMARY KEY, submission_id TEXT NOT NULL UNIQUE, draft_id TEXT NOT NULL REFERENCES drafts(id),
 draft_version INTEGER NOT NULL, company_id TEXT NOT NULL REFERENCES companies(id), run_id TEXT NOT NULL REFERENCES runs(id),
 approval_id TEXT NOT NULL REFERENCES draft_approvals(id), status TEXT NOT NULL, lease_until TEXT, reason TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX first_contact ON outbox(company_id) WHERE status IN ('QUEUED','SENDING','SENT_PROVIDER','SENT_CONFIRMED','SEND_UNKNOWN');
CREATE TABLE send_attempts (
 id TEXT PRIMARY KEY, outbox_id TEXT NOT NULL UNIQUE REFERENCES outbox(id), message_id TEXT NOT NULL UNIQUE,
 mime BLOB NOT NULL, mime_hash TEXT NOT NULL, account_email TEXT NOT NULL, recipient TEXT NOT NULL,
 cv_hash TEXT, state TEXT NOT NULL, provider_id TEXT, provider_thread_id TEXT, error_class TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE usage_ledger (
 id TEXT PRIMARY KEY, outbox_id TEXT NOT NULL UNIQUE REFERENCES outbox(id), campaign_id TEXT NOT NULL REFERENCES campaigns(id),
 run_id TEXT NOT NULL REFERENCES runs(id), day TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE mail_messages (
 id TEXT PRIMARY KEY, outbox_id TEXT NOT NULL UNIQUE REFERENCES outbox(id), company_id TEXT NOT NULL REFERENCES companies(id),
 provider_message_id TEXT NOT NULL UNIQUE, provider_thread_id TEXT NOT NULL, category TEXT NOT NULL,
 proposed_category TEXT NOT NULL, body TEXT NOT NULL, reviewed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE suppressions (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), reason TEXT NOT NULL,
 actor TEXT NOT NULL, source TEXT NOT NULL, permanent INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
 UNIQUE(company_id,reason)
);
CREATE TABLE audit_events (
 id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, entity_id TEXT,
 message TEXT NOT NULL, day TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE mock_deliveries (
 message_id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, recipient TEXT NOT NULL,
 mime_hash TEXT NOT NULL, scenario TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX event_day ON audit_events(day);
CREATE INDEX job_state ON jobs(status);
CREATE INDEX outbox_state ON outbox(status);
