-- Extraction interprets requirements against a specific approved profile.
-- Old rows deliberately have no binding and are not reused as current analyses.
CREATE TABLE research_extractions (
 item_id TEXT PRIMARY KEY REFERENCES research_items(id), profile_hash TEXT NOT NULL
);
ALTER TABLE research_run_config ADD COLUMN total_ms INTEGER NOT NULL DEFAULT 0;
