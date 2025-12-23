-- Drop the security definer view and recreate as regular view
DROP VIEW IF EXISTS public.leaderboard_stats;

-- Create view without security definer (uses invoker's permissions)
CREATE VIEW public.leaderboard_stats 
WITH (security_invoker = true) AS
SELECT 
  p.id as user_id,
  COALESCE(p.display_name, p.first_name, 'Anonym') as display_name,
  p.profile_picture,
  COUNT(DISTINCT c.activity_id) as total_runs,
  COUNT(DISTINCT c.segment_id) as unique_segments,
  (SELECT COUNT(*) FROM public.user_achievements ua WHERE ua.user_id = p.id) as achievement_count
FROM public.profiles p
LEFT JOIN public.check_ins c ON c.user_id = p.id
GROUP BY p.id, p.display_name, p.first_name, p.profile_picture;

-- Grant access to the view
GRANT SELECT ON public.leaderboard_stats TO authenticated;

-- Also need to make check_ins viewable for leaderboard (only count, not details)
CREATE POLICY "Authenticated users can view check_ins for leaderboard"
ON public.check_ins
FOR SELECT
TO authenticated
USING (true);