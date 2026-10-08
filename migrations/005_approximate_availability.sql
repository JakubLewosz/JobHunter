ALTER TABLE candidate_profiles ADD COLUMN availability_mode TEXT NOT NULL DEFAULT 'RANGE' CHECK(availability_mode IN ('RANGE','APPROX'));
ALTER TABLE candidate_profiles ADD COLUMN hours_approx INTEGER NOT NULL DEFAULT 20 CHECK(hours_approx BETWEEN 1 AND 80);
-- Research availability is approximate, never a maximum. Preserve historical range columns for DEMO.
UPDATE candidate_profiles SET availability_mode='APPROX',hours_approx=20,approved_at=NULL,version=version+1
 WHERE EXISTS (SELECT 1 FROM campaigns WHERE mode='RESEARCH_ONLY');
UPDATE candidate_facts SET approval_status='DRAFT',version=version+1
 WHERE EXISTS (SELECT 1 FROM campaigns WHERE mode='RESEARCH_ONLY');
UPDATE candidate_facts SET content='Płatna praca w pełni zdalna, około 20 godzin tygodniowo, przede wszystkim po lekcjach.'
 WHERE fact_key='availability' AND EXISTS (SELECT 1 FROM campaigns WHERE mode='RESEARCH_ONLY');
