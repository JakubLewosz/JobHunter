CREATE TABLE shared_company_context (
 company_id TEXT PRIMARY KEY REFERENCES companies(id), description TEXT NOT NULL, sources TEXT NOT NULL
);
