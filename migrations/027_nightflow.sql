-- A plan approval is distinct from reviewing the eventual closed batch.
CREATE TABLE nightflow_plans (
 id TEXT PRIMARY KEY, version INTEGER NOT NULL, content TEXT NOT NULL,
 content_hash TEXT NOT NULL, approved_hash TEXT, approved_at TEXT,
 UNIQUE(id,version)
);
CREATE TABLE nightflow_jobs (
 id TEXT PRIMARY KEY, plan_id TEXT NOT NULL REFERENCES nightflow_plans(id),
 plan_version INTEGER NOT NULL, state TEXT NOT NULL, reason TEXT,
 generation TEXT NOT NULL, deadline TEXT NOT NULL, end_at TEXT NOT NULL,
 research_session_id TEXT, batch_id TEXT REFERENCES auto_batches(id),
 checkpoint TEXT NOT NULL DEFAULT '{}', code_identity TEXT NOT NULL,
 started_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX nightflow_one_active ON nightflow_jobs((1))
 WHERE state IN ('PREPARING','REFRESHING','RESEARCHING','VALIDATING','CLOSING','WAITING_WINDOW','SENDING');
CREATE TABLE auto_batch_plan_grants (
 batch_id TEXT PRIMARY KEY REFERENCES auto_batches(id),
 job_id TEXT NOT NULL UNIQUE REFERENCES nightflow_jobs(id),
 plan_id TEXT NOT NULL REFERENCES nightflow_plans(id),
 plan_hash TEXT NOT NULL, batch_hash TEXT NOT NULL, derived_at TEXT NOT NULL
);
