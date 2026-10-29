CREATE TABLE project_descriptions (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES portfolio_projects(id),
 logical_key TEXT NOT NULL, version INTEGER NOT NULL, text TEXT NOT NULL, text_hash TEXT NOT NULL,
 fact_id TEXT NOT NULL REFERENCES candidate_facts(id), fact_version INTEGER NOT NULL, fact_hash TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('APPROVED','REVOKED')), approval_source TEXT NOT NULL,
 approved_at TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(project_id,version)
);
CREATE TABLE profile_material_snapshots (
 id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES candidate_profiles(id),
 version INTEGER NOT NULL, phase TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL
);
