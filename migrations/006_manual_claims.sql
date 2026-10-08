-- A human edit invalidates the old model's claim map as well as its review.
UPDATE research_drafts SET claims='[]'
WHERE json_type(semantic_review,'$.supported')='null';
