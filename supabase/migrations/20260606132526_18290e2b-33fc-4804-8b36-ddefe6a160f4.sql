
-- 1. Audit log table for retention runs (Section 6.2 compliance)
CREATE TABLE public.strava_retention_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  checkins_redacted integer NOT NULL DEFAULT 0,
  segments_refreshed integer NOT NULL DEFAULT 0,
  error text,
  triggered_by text NOT NULL DEFAULT 'cron'
);

GRANT SELECT, INSERT, UPDATE ON public.strava_retention_runs TO authenticated;
GRANT ALL ON public.strava_retention_runs TO service_role;

ALTER TABLE public.strava_retention_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view retention runs"
  ON public.strava_retention_runs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Audit table for account deletions (so we can prove deletion happened)
CREATE TABLE public.account_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deleted_user_id uuid NOT NULL,
  deleted_email text,
  reason text NOT NULL DEFAULT 'user_request',
  confirmation_sent boolean NOT NULL DEFAULT false
);

GRANT SELECT, INSERT ON public.account_deletions TO authenticated;
GRANT ALL ON public.account_deletions TO service_role;

ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view deletions"
  ON public.account_deletions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Index for fast retention scans
CREATE INDEX IF NOT EXISTS check_ins_checked_in_at_idx
  ON public.check_ins (checked_in_at);

-- 4. Section 5.4 fix: community_stats view should NOT expose aggregated distance
-- across users (analytics/insights). Counts of runs and runners are gameplay-OK.
DROP VIEW IF EXISTS public.community_stats;
CREATE VIEW public.community_stats
WITH (security_invoker = true) AS
SELECT
  count(DISTINCT activity_id) AS total_runs,
  count(DISTINCT user_id) AS total_runners
FROM public.check_ins
WHERE EXTRACT(year FROM checked_in_at) = EXTRACT(year FROM now());

GRANT SELECT ON public.community_stats TO anon, authenticated;
