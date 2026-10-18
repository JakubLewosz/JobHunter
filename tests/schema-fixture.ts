import { readFileSync } from 'node:fs';
import type { Store } from '../apps/server/src/db.js';
// Rebuild a real pre-parser source table. DROP COLUMN is invalid once the new
// versioned source UNIQUE key refers to parser_version/completeness.
export function makePreParserFixture(store: Store) {
  store.db.pragma('foreign_keys=OFF');
  try {
    store.atomic(() => {
      const sql = readFileSync('migrations/003_research.sql', 'utf8')
        .match(/CREATE TABLE research_sources \([\s\S]*?\);/)![0]
        .replace('research_sources', 'research_sources_old_fixture');
      store.db.exec(sql);
      store.db.exec(
        'INSERT INTO research_sources_old_fixture SELECT id,original_url,final_url,title,fetched_at,method,status,http_status,fragment,content_hash,text,error FROM research_sources;DROP TABLE research_sources;ALTER TABLE research_sources_old_fixture RENAME TO research_sources',
      );
      store.exec(
        "DELETE FROM migrations WHERE name IN ('016_address_context.sql','021_source_completeness.sql','025_source_versions.sql')",
      );
    });
  } finally {
    store.db.pragma('foreign_keys=ON');
  }
}
