-- Drop the unique constraint that blocks ties
ALTER TABLE public.monthly_challenge_winners
  DROP CONSTRAINT IF EXISTS monthly_challenge_winners_year_month_rank_key;

-- Ensure one entry per user per month (prevents duplicates)
ALTER TABLE public.monthly_challenge_winners
  ADD CONSTRAINT monthly_challenge_winners_year_month_user_key
  UNIQUE (year, month, user_id);

-- Recompute past months with tie-aware ranking
DO $$
DECLARE
  v_year int;
  v_month int;
  v_earned_at timestamptz;
  v_achievement text;
  rec record;
BEGIN
  FOR v_year, v_month IN
    SELECT y, m FROM (VALUES (2026,1),(2026,2),(2026,3),(2026,4)) AS t(y,m)
  LOOP
    v_earned_at := make_timestamptz(v_year, v_month, 1, 23, 0, 0, 'UTC')
                   + interval '1 month' - interval '1 day';

    DELETE FROM public.monthly_challenge_winners
    WHERE year = v_year AND month = v_month;

    FOR rec IN
      WITH monthly AS (
        SELECT user_id, COUNT(DISTINCT activity_id) AS total_runs
        FROM public.check_ins
        WHERE checked_in_at >= make_timestamptz(v_year, v_month, 1, 0, 0, 0, 'UTC')
          AND checked_in_at <  make_timestamptz(v_year, v_month, 1, 0, 0, 0, 'UTC') + interval '1 month'
        GROUP BY user_id
      ),
      ranked AS (
        SELECT user_id, total_runs,
               RANK() OVER (ORDER BY total_runs DESC) AS rnk
        FROM monthly
      )
      SELECT user_id, total_runs, rnk
      FROM ranked
      WHERE rnk <= 3
    LOOP
      INSERT INTO public.monthly_challenge_winners (user_id, year, month, rank, total_runs)
      VALUES (rec.user_id, v_year, v_month, rec.rnk, rec.total_runs);

      v_achievement := CASE rec.rnk
        WHEN 1 THEN 'monthly_gold'
        WHEN 2 THEN 'monthly_silver'
        WHEN 3 THEN 'monthly_bronze'
      END;

      IF NOT EXISTS (
        SELECT 1 FROM public.user_achievements
        WHERE user_id = rec.user_id
          AND achievement::text = v_achievement
          AND earned_at = v_earned_at
      ) THEN
        INSERT INTO public.user_achievements (user_id, achievement, earned_at)
        VALUES (rec.user_id, v_achievement::public.achievement_type, v_earned_at);
      END IF;
    END LOOP;
  END LOOP;
END $$;