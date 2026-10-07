CREATE TABLE history_records (
 id TEXT PRIMARY KEY, import_hash TEXT NOT NULL, row_number INTEGER NOT NULL,
 company_id TEXT NOT NULL REFERENCES companies(id), original_name TEXT NOT NULL,
 email TEXT, domain TEXT, status TEXT NOT NULL, occurred_at TEXT, created_at TEXT NOT NULL,
 UNIQUE(import_hash,row_number)
);
