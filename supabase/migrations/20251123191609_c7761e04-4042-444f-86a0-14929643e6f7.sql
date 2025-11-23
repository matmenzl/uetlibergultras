-- Create table for Uetliberg segments
CREATE TABLE public.uetliberg_segments (
  segment_id bigint PRIMARY KEY,
  name text NOT NULL,
  distance float NOT NULL,
  avg_grade float NOT NULL,
  elevation_high float NOT NULL,
  elevation_low float NOT NULL,
  climb_category integer NOT NULL,
  start_latlng point NOT NULL,
  end_latlng point NOT NULL,
  polyline text NOT NULL,
  effort_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uetliberg_segments ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view segments (public data)
CREATE POLICY "Segments are viewable by everyone"
ON public.uetliberg_segments
FOR SELECT
USING (true);

-- Only authenticated users can insert/update segments
CREATE POLICY "Authenticated users can insert segments"
ON public.uetliberg_segments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update segments"
ON public.uetliberg_segments
FOR UPDATE
TO authenticated
USING (true);

-- Add index for faster queries
CREATE INDEX idx_uetliberg_segments_segment_id ON public.uetliberg_segments(segment_id);

-- Add trigger for updated_at
CREATE TRIGGER update_uetliberg_segments_updated_at
BEFORE UPDATE ON public.uetliberg_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();