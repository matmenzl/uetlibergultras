DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id,
         COALESCE(display_name,
           CASE
             WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
             WHEN first_name IS NOT NULL THEN first_name
             ELSE NULL
           END) AS display_name,
         profile_picture,
         is_founding_member,
         user_number,
         strava_id
    FROM public.profiles
   WHERE is_test_account IS NOT TRUE;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

DROP VIEW IF EXISTS public.leaderboard_stats;
CREATE VIEW public.leaderboard_stats AS
  SELECT p.id AS user_id,
         COUNT(DISTINCT c.activity_id) AS total_runs,
         COUNT(DISTINCT c.segment_id) AS unique_segments,
         COUNT(DISTINCT a.achievement) AS achievement_count,
         COALESCE(p.display_name,
           CASE
             WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN p.first_name || ' ' || p.last_name
             WHEN p.first_name IS NOT NULL THEN p.first_name
             ELSE NULL
           END) AS display_name,
         p.profile_picture
    FROM public.profiles p
    LEFT JOIN public.check_ins c
      ON c.user_id = p.id AND EXTRACT(year FROM c.checked_in_at) = EXTRACT(year FROM CURRENT_DATE)
    LEFT JOIN public.user_achievements a ON a.user_id = p.id
   WHERE p.is_test_account IS NOT TRUE
   GROUP BY p.id, p.display_name, p.first_name, p.last_name, p.profile_picture;
GRANT SELECT ON public.leaderboard_stats TO anon, authenticated;