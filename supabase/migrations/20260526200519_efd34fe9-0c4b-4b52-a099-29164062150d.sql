
DROP POLICY IF EXISTS "Authenticated users can view monthly challenge winners" ON public.monthly_challenge_winners;
DROP POLICY IF EXISTS "Anyone can view monthly challenge winners" ON public.monthly_challenge_winners;
GRANT SELECT ON public.monthly_challenge_winners TO anon;
CREATE POLICY "Anyone can view monthly challenge winners"
ON public.monthly_challenge_winners
FOR SELECT
TO anon, authenticated
USING (true);

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own badge-notifier topic" ON realtime.messages;
CREATE POLICY "Authenticated can read own badge-notifier topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'badge-notifier:' || (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Public can read community-counter topic" ON realtime.messages;
CREATE POLICY "Public can read community-counter topic"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (
  realtime.topic() = 'community-counter'
);
