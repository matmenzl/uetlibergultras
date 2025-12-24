-- Recreate leaderboard_stats view with SECURITY INVOKER
-- This ensures the view uses the querying user's permissions instead of the view creator's

DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE VIEW public.leaderboard_stats 
WITH (security_invoker = true)
AS
SELECT 
  p.id as user_id,
  COUNT(DISTINCT c.id) as total_runs,
  COUNT(DISTINCT c.segment_id) as unique_segments,
  COUNT(DISTINCT a.achievement) as achievement_count,
  p.display_name,
  p.profile_picture
FROM public.profiles p
LEFT JOIN public.check_ins c ON c.user_id = p.id
LEFT JOIN public.user_achievements a ON a.user_id = p.id
GROUP BY p.id, p.display_name, p.profile_picture;