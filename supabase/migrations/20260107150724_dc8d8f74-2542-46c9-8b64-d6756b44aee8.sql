-- Create a public view for community statistics
-- This view only exposes aggregate counts, no personal data
CREATE VIEW public.community_stats AS
SELECT 
  COUNT(DISTINCT activity_id) as total_runs,
  COUNT(DISTINCT user_id) as total_runners
FROM public.check_ins;

-- Grant public access to this view (no RLS needed for views)
GRANT SELECT ON public.community_stats TO anon;
GRANT SELECT ON public.community_stats TO authenticated;