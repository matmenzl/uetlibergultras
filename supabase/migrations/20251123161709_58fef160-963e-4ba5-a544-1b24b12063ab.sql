-- Drop unnecessary tables
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.kudos CASCADE;
DROP TABLE IF EXISTS public.segment_efforts CASCADE;

-- Keep only profiles and strava_credentials tables
-- No changes needed to these tables