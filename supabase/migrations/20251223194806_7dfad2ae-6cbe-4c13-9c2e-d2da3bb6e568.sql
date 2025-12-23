-- Create check_ins table to track when users complete segments
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment_id BIGINT NOT NULL,
  activity_id BIGINT NOT NULL,
  activity_name TEXT,
  elapsed_time INTEGER, -- in seconds
  distance DOUBLE PRECISION,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate check-ins for the same activity+segment
  UNIQUE (user_id, segment_id, activity_id)
);

-- Enable RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Users can view their own check-ins
CREATE POLICY "Users can view their own check-ins"
ON public.check_ins
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own check-ins
CREATE POLICY "Users can insert their own check-ins"
ON public.check_ins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX idx_check_ins_segment_id ON public.check_ins(segment_id);
CREATE INDEX idx_check_ins_checked_in_at ON public.check_ins(checked_in_at DESC);