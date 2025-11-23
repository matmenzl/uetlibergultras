-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_strava_credentials(uuid);
DROP FUNCTION IF EXISTS public.upsert_strava_credentials(uuid, text, text, timestamp with time zone);

-- Recreate get_strava_credentials without encryption
CREATE OR REPLACE FUNCTION public.get_strava_credentials(_user_id uuid)
RETURNS TABLE(
  strava_access_token text, 
  strava_refresh_token text, 
  strava_token_expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.strava_access_token,
    sc.strava_refresh_token,
    sc.strava_token_expires_at
  FROM public.strava_credentials sc
  WHERE sc.user_id = _user_id;
END;
$$;

-- Recreate upsert_strava_credentials without encryption
CREATE OR REPLACE FUNCTION public.upsert_strava_credentials(
  _user_id uuid, 
  _access_token text, 
  _refresh_token text, 
  _expires_at timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.strava_credentials (
    user_id, 
    strava_access_token, 
    strava_refresh_token, 
    strava_token_expires_at, 
    updated_at
  )
  VALUES (
    _user_id, 
    _access_token,
    _refresh_token,
    _expires_at, 
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    strava_access_token = _access_token,
    strava_refresh_token = _refresh_token,
    strava_token_expires_at = EXCLUDED.strava_token_expires_at,
    updated_at = now();
END;
$$;