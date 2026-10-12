ALTER TABLE gmail_messages ADD COLUMN prior_contact_check TEXT NOT NULL DEFAULT 'UNKNOWN'
CHECK(prior_contact_check IN ('UNKNOWN','CLEAR','OPT_OUT'));
