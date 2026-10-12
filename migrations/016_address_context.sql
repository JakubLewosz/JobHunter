ALTER TABLE research_sources ADD COLUMN parser_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE research_sources ADD COLUMN address_contexts TEXT;
