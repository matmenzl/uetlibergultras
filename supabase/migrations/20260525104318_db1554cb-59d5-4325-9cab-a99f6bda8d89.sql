
-- Lock down user_achievements: only backend (service role) may insert achievements.
-- All client SELECTs continue to work; no client code inserts directly.
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;

-- Recreate webcam cron job (if currently scheduled) with service-role bearer,
-- because capture-webcam now requires authentication.
DO $$
DECLARE
  v_supabase_url text;
  v_service_key text;
  v_existed boolean := false;
  j record;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE command ILIKE '%capture-webcam%' LOOP
    v_existed := true;
    PERFORM cron.unschedule(j.jobid);
  END LOOP;

  IF v_existed THEN
    SELECT decrypted_secret INTO v_supabase_url
      FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
    SELECT decrypted_secret INTO v_service_key
      FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

    PERFORM cron.schedule(
      'webcam-screenshot-job',
      '*/30 6-20 * * *',
      format(
        'SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:=''{}''::jsonb) AS request_id;',
        v_supabase_url || '/functions/v1/capture-webcam',
        '{"Content-Type": "application/json", "Authorization": "Bearer ' || v_service_key || '"}'
      )
    );
  END IF;
END$$;

-- Update the webcam cron management function to schedule with the service-role key.
CREATE OR REPLACE FUNCTION public.webcam_cron_set_enabled(_enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  j record;
  v_supabase_url text;
  v_service_key text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  FOR j IN SELECT jobid FROM cron.job WHERE command ILIKE '%capture-webcam%' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;

  IF _enabled THEN
    SELECT decrypted_secret INTO v_supabase_url
      FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
    SELECT decrypted_secret INTO v_service_key
      FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

    PERFORM cron.schedule(
      'webcam-screenshot-job',
      '*/30 6-20 * * *',
      format(
        'SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:=''{}''::jsonb) AS request_id;',
        v_supabase_url || '/functions/v1/capture-webcam',
        '{"Content-Type": "application/json", "Authorization": "Bearer ' || v_service_key || '"}'
      )
    );
  END IF;
END;
$function$;

-- Recreate sitemap cron job (if currently scheduled) with service-role bearer.
DO $$
DECLARE
  v_supabase_url text;
  v_service_key text;
  v_existed boolean := false;
  j record;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE command ILIKE '%resubmit-sitemap%' LOOP
    v_existed := true;
    PERFORM cron.unschedule(j.jobid);
  END LOOP;

  IF v_existed THEN
    SELECT decrypted_secret INTO v_supabase_url
      FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
    SELECT decrypted_secret INTO v_service_key
      FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

    PERFORM cron.schedule(
      'sitemap-resubmit-job',
      '0 */6 * * *',
      format(
        'SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:=%L::jsonb) AS request_id;',
        v_supabase_url || '/functions/v1/resubmit-sitemap',
        '{"Content-Type": "application/json", "Authorization": "Bearer ' || v_service_key || '"}',
        '{"trigger":"cron"}'
      )
    );
  END IF;
END$$;

CREATE OR REPLACE FUNCTION public.sitemap_cron_set_enabled(_enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  j record;
  v_supabase_url text;
  v_service_key text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  FOR j IN SELECT jobid FROM cron.job WHERE command ILIKE '%resubmit-sitemap%' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;

  IF _enabled THEN
    SELECT decrypted_secret INTO v_supabase_url
      FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
    SELECT decrypted_secret INTO v_service_key
      FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

    PERFORM cron.schedule(
      'sitemap-resubmit-job',
      '0 */6 * * *',
      format(
        'SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:=%L::jsonb) AS request_id;',
        v_supabase_url || '/functions/v1/resubmit-sitemap',
        '{"Content-Type": "application/json", "Authorization": "Bearer ' || v_service_key || '"}',
        '{"trigger":"cron"}'
      )
    );
  END IF;
END;
$function$;
