CREATE TABLE campaigns_e3 (
 id TEXT PRIMARY KEY, mode TEXT NOT NULL CHECK(mode IN ('DEMO','RESEARCH_ONLY')), account_email TEXT NOT NULL,
 cv_id TEXT REFERENCES cv_assets(id), policy_version INTEGER NOT NULL DEFAULT 1,
 daily_limit INTEGER NOT NULL, cycle_limit INTEGER NOT NULL, campaign_limit INTEGER NOT NULL,
 interval_minutes INTEGER NOT NULL, duration_minutes INTEGER NOT NULL, max_candidates INTEGER NOT NULL,
 window_start TEXT NOT NULL, window_end TEXT NOT NULL, timezone TEXT NOT NULL,
 schedule_enabled INTEGER NOT NULL DEFAULT 0, empty_cycles INTEGER NOT NULL DEFAULT 0,
 expires_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO campaigns_e3 SELECT * FROM campaigns;
DROP TABLE campaigns;
ALTER TABLE campaigns_e3 RENAME TO campaigns;
CREATE TABLE research_sources (
 id TEXT PRIMARY KEY, original_url TEXT NOT NULL, final_url TEXT, title TEXT NOT NULL,
 fetched_at TEXT NOT NULL, method TEXT NOT NULL, status TEXT NOT NULL, http_status INTEGER,
 fragment TEXT NOT NULL, content_hash TEXT, text TEXT NOT NULL, error TEXT,
 UNIQUE(original_url,content_hash)
);
CREATE TABLE research_items (
 id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), url TEXT NOT NULL,
 stage TEXT NOT NULL DEFAULT 'READ', status TEXT NOT NULL DEFAULT 'PENDING',
 source_ids TEXT NOT NULL DEFAULT '[]', analysis TEXT, company_id TEXT REFERENCES companies(id),
 opportunity_id TEXT REFERENCES opportunities(id), error TEXT, attempts INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(run_id,url)
);
CREATE TABLE research_queries (
 id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), query TEXT NOT NULL, profile_hash TEXT NOT NULL,
 status TEXT NOT NULL, result_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE research_evidence (
 evidence_id TEXT PRIMARY KEY REFERENCES evidence(id), source_id TEXT NOT NULL REFERENCES research_sources(id),
 facts TEXT NOT NULL
);
CREATE TABLE research_qualifications (
 opportunity_id TEXT PRIMARY KEY REFERENCES opportunities(id), details TEXT NOT NULL
);
CREATE UNIQUE INDEX research_offer_source ON opportunities(company_id,evidence_id,title);
CREATE TABLE research_drafts (
 draft_id TEXT PRIMARY KEY REFERENCES drafts(id), profile_hash TEXT NOT NULL, claims TEXT NOT NULL,
 warnings TEXT NOT NULL, semantic_review TEXT NOT NULL, reviewed_at TEXT
);
CREATE TABLE model_calls (
 id TEXT PRIMARY KEY, run_id TEXT REFERENCES runs(id), stage TEXT NOT NULL, status TEXT NOT NULL,
 elapsed_ms INTEGER NOT NULL, input_tokens INTEGER, output_tokens INTEGER, cached_input_tokens INTEGER,
 model TEXT, error TEXT, created_at TEXT NOT NULL
);
CREATE TABLE research_run_config (
 run_id TEXT PRIMARY KEY REFERENCES runs(id), profile_hash TEXT NOT NULL, max_drafts INTEGER NOT NULL,
 elapsed_ms INTEGER NOT NULL DEFAULT 0, search_input TEXT
);
