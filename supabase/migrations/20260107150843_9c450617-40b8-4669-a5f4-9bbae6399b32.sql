-- Drop and recreate the view with total distance
DROP VIEW IF EXISTS public.community_stats;

CREATE VIEW public.community_stats AS
SELECT 
  COUNT(DISTINCT activity_id) as total_runs,
  COUNT(DISTINCT user_id) as total_runners,
  COALESCE(
    (SELECT SUM(activity_distance) / 1000.0 
     FROM (
       SELECT DISTINCT ON (activity_id) activity_id, activity_distance 
       FROM public.check_ins
     ) unique_activities
    ), 0
  ) as total_distance_km
FROM public.check_ins;

-- Grant public access
GRANT SELECT ON public.community_stats TO anon;
GRANT SELECT ON public.community_stats TO authenticated;