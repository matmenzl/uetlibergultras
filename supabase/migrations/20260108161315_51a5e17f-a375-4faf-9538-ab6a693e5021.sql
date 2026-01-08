-- Add auth_password_hash column to strava_credentials
ALTER TABLE public.strava_credentials 
ADD COLUMN IF NOT EXISTS auth_password_hash text;

-- Update upsert_strava_credentials function to handle password hash
CREATE OR REPLACE FUNCTION public.upsert_strava_credentials(
  _user_id uuid, 
  _access_token text, 
  _refresh_token text, 
  _expires_at timestamp with time zone,
  _auth_password_hash text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.strava_credentials (
    user_id, 
    strava_access_token, 
    strava_refresh_token, 
    strava_token_expires_at,
    auth_password_hash,
    updated_at
  )
  VALUES (
    _user_id, 
    _access_token,
    _refresh_token,
    _expires_at,
    _auth_password_hash,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    strava_access_token = _access_token,
    strava_refresh_token = _refresh_token,
    strava_token_expires_at = EXCLUDED.strava_token_expires_at,
    auth_password_hash = COALESCE(_auth_password_hash, strava_credentials.auth_password_hash),
    updated_at = now();
END;
$$;