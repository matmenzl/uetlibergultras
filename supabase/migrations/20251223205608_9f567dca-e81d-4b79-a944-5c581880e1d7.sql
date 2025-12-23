-- Add activity metadata columns to check_ins table
ALTER TABLE public.check_ins 
ADD COLUMN IF NOT EXISTS activity_distance double precision,
ADD COLUMN IF NOT EXISTS activity_elapsed_time integer;