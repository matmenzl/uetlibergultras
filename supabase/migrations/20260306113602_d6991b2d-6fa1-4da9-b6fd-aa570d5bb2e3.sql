
-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can view check_ins for leaderboard" ON public.check_ins;

CREATE POLICY "Anyone can view check_ins for leaderboard"
  ON public.check_ins
  FOR SELECT
  USING (true);
