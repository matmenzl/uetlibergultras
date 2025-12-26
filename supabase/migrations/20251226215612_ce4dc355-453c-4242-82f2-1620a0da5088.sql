-- Secure cron management helpers (admin-only)

CREATE OR REPLACE FUNCTION public.webcam_cron_status()
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
  WHERE j.command ILIKE '%capture-webcam%'
  ORDER BY j.jobid;
END;
$$;

CREATE OR REPLACE FUNCTION public.webcam_cron_set_enabled(_enabled boolean)
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

  -- Always remove existing capture-webcam jobs first
  FOR j IN
    SELECT jobid
    FROM cron.job
    WHERE command ILIKE '%capture-webcam%'
  LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;

  IF _enabled THEN
    -- Get Supabase URL and anon key from vault
    SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
    SELECT decrypted_secret INTO v_anon_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY';
    
    -- Create a named job that runs every 30 minutes between 6-20
    PERFORM cron.schedule(
      'webcam-screenshot-job',
      '*/30 6-20 * * *',
      format(
        'SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:=''{}''::jsonb) AS request_id;',
        v_supabase_url || '/functions/v1/capture-webcam',
        '{"Content-Type": "application/json", "Authorization": "Bearer ' || v_anon_key || '"}'
      )
    );
  END IF;
END;
$$;