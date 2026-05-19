-- 1. State table
CREATE TABLE IF NOT EXISTS public.sitemap_submission_state (
  id text PRIMARY KEY,
  last_hash text,
  last_submitted_at timestamptz,
  last_status text,
  last_error text,
  last_trigger text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sitemap_submission_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read sitemap state"
  ON public.sitemap_submission_state
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Cron management helpers
CREATE OR REPLACE FUNCTION public.sitemap_cron_status()
RETURNS TABLE(jobid integer, jobname text, schedule text, active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT j.jobid::integer, j.jobname, j.schedule, j.active
  FROM cron.job j
  WHERE j.command ILIKE '%resubmit-sitemap%'
  ORDER BY j.jobid;
END;
$$;

CREATE OR REPLACE FUNCTION public.sitemap_cron_set_enabled(_enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  j record;
  v_supabase_url text;
  v_anon_key text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  FOR j IN
    SELECT jobid FROM cron.job WHERE command ILIKE '%resubmit-sitemap%'
  LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;

  IF _enabled THEN
    SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
    SELECT decrypted_secret INTO v_anon_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY';

    PERFORM cron.schedule(
      'sitemap-resubmit-job',
      '0 */6 * * *',
      format(
        'SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:=%L::jsonb) AS request_id;',
        v_supabase_url || '/functions/v1/resubmit-sitemap',
        '{"Content-Type": "application/json", "Authorization": "Bearer ' || v_anon_key || '"}',
        '{"trigger":"cron"}'
      )
    );
  END IF;
END;
$$;

-- 3. Enable cron by default (admin context needed; do it via raw cron.schedule here)
DO $$
DECLARE
  v_supabase_url text;
  v_anon_key text;
  j record;
BEGIN
  -- Clear any existing
  FOR j IN SELECT jobid FROM cron.job WHERE command ILIKE '%resubmit-sitemap%' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;

  SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
  SELECT decrypted_secret INTO v_anon_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY';

  IF v_supabase_url IS NOT NULL AND v_anon_key IS NOT NULL THEN
    PERFORM cron.schedule(
      'sitemap-resubmit-job',
      '0 */6 * * *',
      format(
        'SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:=%L::jsonb) AS request_id;',
        v_supabase_url || '/functions/v1/resubmit-sitemap',
        '{"Content-Type": "application/json", "Authorization": "Bearer ' || v_anon_key || '"}',
        '{"trigger":"cron"}'
      )
    );
  END IF;
END $$;