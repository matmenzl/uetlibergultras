-- Allow public read access to profiles for leaderboard functionality
CREATE POLICY "Profiles are viewable by everyone for leaderboards"
ON public.profiles
FOR SELECT
USING (true);

-- Allow public read access to segment efforts for leaderboard functionality
CREATE POLICY "Segment efforts are viewable by everyone for leaderboards"
ON public.segment_efforts
FOR SELECT
USING (true);