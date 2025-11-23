-- Add columns for geographical prioritization
ALTER TABLE public.uetliberg_segments 
  ADD COLUMN IF NOT EXISTS distance_to_center DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ends_at_uetliberg BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_priority_distance 
  ON public.uetliberg_segments(priority, distance_to_center);

CREATE INDEX IF NOT EXISTS idx_ends_at_uetliberg 
  ON public.uetliberg_segments(ends_at_uetliberg)
  WHERE ends_at_uetliberg = TRUE;

CREATE INDEX IF NOT EXISTS idx_segment_id 
  ON public.uetliberg_segments(segment_id);