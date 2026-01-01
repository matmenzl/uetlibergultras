-- Add email and wants_updates columns to segment_suggestions
ALTER TABLE public.segment_suggestions 
  ADD COLUMN email text,
  ADD COLUMN wants_updates boolean DEFAULT false;

-- Add email and wants_updates columns to achievement_suggestions
ALTER TABLE public.achievement_suggestions 
  ADD COLUMN email text,
  ADD COLUMN wants_updates boolean DEFAULT false;