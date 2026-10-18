CREATE TABLE research_stage_timings (
 run_id TEXT NOT NULL REFERENCES runs(id), stage TEXT NOT NULL,
 elapsed_ms REAL NOT NULL DEFAULT 0, segments INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(run_id,stage)
);
CREATE TABLE research_work_items (
 item_id TEXT PRIMARY KEY REFERENCES research_items(id), category TEXT NOT NULL CHECK(category IN ('DISCOVERY','REFRESH','REUSE')),
 queued_at TEXT NOT NULL, elapsed_ms REAL NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0
);
