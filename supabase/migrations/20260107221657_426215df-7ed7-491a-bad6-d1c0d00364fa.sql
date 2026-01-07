-- segment_suggestions Constraints
ALTER TABLE segment_suggestions 
  ADD CONSTRAINT segment_suggestions_url_length 
  CHECK (char_length(strava_segment_url) <= 500);

ALTER TABLE segment_suggestions 
  ADD CONSTRAINT segment_suggestions_email_length 
  CHECK (char_length(email) <= 255);

ALTER TABLE segment_suggestions 
  ADD CONSTRAINT segment_suggestions_admin_notes_length 
  CHECK (char_length(admin_notes) <= 2000);

-- achievement_suggestions Constraints
ALTER TABLE achievement_suggestions 
  ADD CONSTRAINT achievement_suggestions_title_length 
  CHECK (char_length(title) <= 100);

ALTER TABLE achievement_suggestions 
  ADD CONSTRAINT achievement_suggestions_description_length 
  CHECK (char_length(description) <= 500);

ALTER TABLE achievement_suggestions 
  ADD CONSTRAINT achievement_suggestions_how_to_earn_length 
  CHECK (char_length(how_to_earn) <= 1000);

ALTER TABLE achievement_suggestions 
  ADD CONSTRAINT achievement_suggestions_email_length 
  CHECK (char_length(email) <= 255);

ALTER TABLE achievement_suggestions 
  ADD CONSTRAINT achievement_suggestions_admin_notes_length 
  CHECK (char_length(admin_notes) <= 2000);