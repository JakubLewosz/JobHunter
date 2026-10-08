ALTER TABLE gmail_previews ADD COLUMN diagnostic INTEGER NOT NULL DEFAULT 0
 CHECK(diagnostic IN (0,1) AND (diagnostic=0 OR kind='SELF_TEST'));
