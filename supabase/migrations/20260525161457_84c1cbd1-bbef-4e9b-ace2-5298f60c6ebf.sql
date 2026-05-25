
CREATE TABLE public.resync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id bigint,
  status text NOT NULL DEFAULT 'queued',
  total_users integer NOT NULL DEFAULT 0,
  processed_user_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  current_user_id uuid,
  check_ins_created integer NOT NULL DEFAULT 0,
  rate_limit_short integer,
  rate_limit_long integer,
  rate_limit_short_max integer DEFAULT 100,
  rate_limit_long_max integer DEFAULT 1000,
  last_heartbeat_at timestamptz,
  resume_after timestamptz,
  last_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX idx_resync_jobs_status_resume ON public.resync_jobs (status, resume_after);

ALTER TABLE public.resync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view resync jobs"
  ON public.resync_jobs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert resync jobs"
  ON public.resync_jobs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update resync jobs"
  ON public.resync_jobs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
