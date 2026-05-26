
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test_account boolean NOT NULL DEFAULT false;

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
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

CREATE OR REPLACE VIEW public.leaderboard_stats
WITH (security_invoker = true) AS
SELECT p.id AS user_id,
  count(DISTINCT c.activity_id) AS total_runs,
  count(DISTINCT c.segment_id) AS unique_segments,
  count(DISTINCT a.achievement) AS achievement_count,
  COALESCE(p.display_name,
    CASE
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN p.first_name || ' ' || p.last_name
      WHEN p.first_name IS NOT NULL THEN p.first_name
      ELSE NULL
    END) AS display_name,
  p.profile_picture
FROM public.profiles p
LEFT JOIN public.check_ins c ON c.user_id = p.id AND EXTRACT(year FROM c.checked_in_at) = EXTRACT(year FROM CURRENT_DATE)
LEFT JOIN public.user_achievements a ON a.user_id = p.id
WHERE p.is_test_account IS NOT TRUE
GROUP BY p.id, p.display_name, p.first_name, p.last_name, p.profile_picture;
