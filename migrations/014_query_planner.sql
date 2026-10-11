CREATE TABLE auto_query_plan (
 id TEXT PRIMARY KEY, scope_hash TEXT NOT NULL, query TEXT NOT NULL, normalized_query TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'PENDING', run_id TEXT REFERENCES runs(id), next_at TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, metrics TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL,
 UNIQUE(scope_hash,normalized_query)
);
CREATE INDEX auto_query_due ON auto_query_plan(scope_hash,status,next_at);
