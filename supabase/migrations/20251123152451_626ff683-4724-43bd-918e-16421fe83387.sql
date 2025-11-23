-- Add activity_id and activity_name columns to segment_efforts table
ALTER TABLE public.segment_efforts
ADD COLUMN IF NOT EXISTS activity_id bigint,
ADD COLUMN IF NOT EXISTS activity_name text;

-- Create index for faster activity grouping
CREATE INDEX IF NOT EXISTS idx_segment_efforts_activity_id ON public.segment_efforts(activity_id);
CREATE INDEX IF NOT EXISTS idx_segment_efforts_user_activity ON public.segment_efforts(user_id, activity_id);