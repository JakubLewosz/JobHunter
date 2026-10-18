-- Redirect identity is part of a source version; historical proofs retain it.
CREATE TABLE research_sources_redirect_versioned (
 id TEXT PRIMARY KEY, original_url TEXT NOT NULL, final_url TEXT, title TEXT NOT NULL,
 fetched_at TEXT NOT NULL, method TEXT NOT NULL, status TEXT NOT NULL, http_status INTEGER,
 fragment TEXT NOT NULL, content_hash TEXT, text TEXT NOT NULL, error TEXT,
 parser_version INTEGER NOT NULL DEFAULT 0, address_contexts TEXT,
 completeness TEXT NOT NULL DEFAULT 'LEGACY_UNKNOWN', outbound_links TEXT NOT NULL DEFAULT '[]',
 UNIQUE(original_url,content_hash,parser_version,status,completeness,final_url)
);
INSERT INTO research_sources_redirect_versioned SELECT * FROM research_sources;
DROP TABLE research_sources;
ALTER TABLE research_sources_redirect_versioned RENAME TO research_sources;
CREATE INDEX research_source_url_time ON research_sources(original_url,fetched_at);
