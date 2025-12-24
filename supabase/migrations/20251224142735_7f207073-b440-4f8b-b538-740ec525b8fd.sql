-- Fix leaderboard_stats to count unique activities (runs) instead of check_ins
-- A single run can have multiple segment check-ins, so we need to count distinct activity_ids

DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE VIEW public.leaderboard_stats 
WITH (security_invoker = true)
AS
SELECT 
  p.id as user_id,
  COUNT(DISTINCT c.activity_id) as total_runs,
  COUNT(DISTINCT c.segment_id) as unique_segments,
  COUNT(DISTINCT a.achievement) as achievement_count,
  p.display_name,
  p.profile_picture
FROM public.profiles p
LEFT JOIN public.check_ins c ON c.user_id = p.id
LEFT JOIN public.user_achievements a ON a.user_id = p.id
GROUP BY p.id, p.display_name, p.profile_picture;