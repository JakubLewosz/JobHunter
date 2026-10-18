-- Existing evidence retains its original parser, dates and content.
ALTER TABLE research_sources ADD COLUMN completeness TEXT NOT NULL DEFAULT 'LEGACY_UNKNOWN';
ALTER TABLE research_sources ADD COLUMN outbound_links TEXT NOT NULL DEFAULT '[]';
