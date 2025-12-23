-- Create achievements enum
CREATE TYPE public.achievement_type AS ENUM (
  'first_run',           -- Erster Uetli Run
  'runs_5',              -- 5 Uetli Runs
  'runs_10',             -- 10 Uetli Runs
  'runs_25',             -- 25 Uetli Runs
  'runs_50',             -- 50 Uetli Runs
  'runs_100',            -- 100 Uetli Runs
  'all_segments',        -- Alle Segmente gelaufen
  'streak_2',            -- 2 Wochen Streak
  'streak_4',            -- 4 Wochen Streak
  'streak_8',            -- 8 Wochen Streak
  'early_bird',          -- Run vor 7 Uhr
  'night_owl'            -- Run nach 20 Uhr
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement achievement_type NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view all achievements (for leaderboard)
CREATE POLICY "Authenticated users can view all achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (true);

-- Users can only insert their own achievements (via edge function)
CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add display_name to profiles for leaderboard
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update profiles RLS to allow authenticated users to view all profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Create a view for leaderboard stats
CREATE OR REPLACE VIEW public.leaderboard_stats AS
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