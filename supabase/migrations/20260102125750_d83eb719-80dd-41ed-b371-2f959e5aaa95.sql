-- Drop and recreate leaderboard_stats with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE VIEW public.leaderboard_stats
WITH (security_invoker = true)
AS
SELECT 
  p.id AS user_id,
  COUNT(DISTINCT c.activity_id) AS total_runs,
  COUNT(DISTINCT c.segment_id) AS unique_segments,
  COUNT(DISTINCT a.achievement) AS achievement_count,
  p.display_name,
  p.profile_picture
FROM public.profiles p
LEFT JOIN public.check_ins c 
  ON c.user_id = p.id 
  AND EXTRACT(year FROM c.checked_in_at) = EXTRACT(year FROM CURRENT_DATE)
LEFT JOIN public.user_achievements a 
  ON a.user_id = p.id
GROUP BY p.id, p.display_name, p.profile_picture;

-- Grant access to authenticated users
GRANT SELECT ON public.leaderboard_stats TO authenticated;

-- Drop and recreate public_profiles with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  profile_picture,
  is_founding_member,
  user_number
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;