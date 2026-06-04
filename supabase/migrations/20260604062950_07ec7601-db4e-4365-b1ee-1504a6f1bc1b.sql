-- Recreate public_profiles as SECURITY DEFINER view exposing only Strava-public data
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  p.id,
  COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
    p.display_name
  ) AS display_name,
  p.profile_picture,
  p.is_founding_member,
  p.user_number,
  p.strava_id
FROM public.profiles p
WHERE p.is_test_account IS NOT TRUE;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Recreate leaderboard_stats as SECURITY DEFINER view with safe aggregates
DROP VIEW IF EXISTS public.leaderboard_stats CASCADE;

CREATE VIEW public.leaderboard_stats
WITH (security_invoker = false) AS
SELECT
  p.id AS user_id,
  COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
    p.display_name
  ) AS display_name,
  p.profile_picture,
  COALESCE(runs.total_runs, 0)::int AS total_runs,
  COALESCE(runs.unique_segments, 0)::int AS unique_segments,
  COALESCE(ach.achievement_count, 0)::int AS achievement_count
FROM public.profiles p
LEFT JOIN (
  SELECT
    user_id,
    COUNT(DISTINCT activity_id) AS total_runs,
    COUNT(DISTINCT segment_id) AS unique_segments
  FROM public.check_ins
  WHERE checked_in_at >= date_trunc('year', now())
  GROUP BY user_id
) runs ON runs.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS achievement_count
  FROM public.user_achievements
  GROUP BY user_id
) ach ON ach.user_id = p.id
WHERE p.is_test_account IS NOT TRUE;

GRANT SELECT ON public.leaderboard_stats TO anon, authenticated;