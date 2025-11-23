-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop the direct SELECT policy - users should NEVER query this table directly
DROP POLICY IF EXISTS "Users can view their own strava credentials" ON public.strava_credentials;

-- Update security definer functions to use encryption
-- The functions are now the ONLY way to access credentials (vault-like approach)

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
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from secret (using client secret as encryption key)
  encryption_key := current_setting('app.settings.strava_client_secret', true);
  
  -- If no encryption key is set, use a default (should be configured via secrets)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'default_encryption_key_change_me';
  END IF;

  -- Insert or update with encrypted tokens
  INSERT INTO public.strava_credentials (
    user_id, 
    strava_access_token, 
    strava_refresh_token, 
    strava_token_expires_at, 
    updated_at
  )
  VALUES (
    _user_id, 
    encode(encrypt(_access_token::bytea, encryption_key, 'aes'), 'base64'),
    encode(encrypt(_refresh_token::bytea, encryption_key, 'aes'), 'base64'),
    _expires_at, 
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    strava_access_token = encode(encrypt(_access_token::bytea, encryption_key, 'aes'), 'base64'),
    strava_refresh_token = encode(encrypt(_refresh_token::bytea, encryption_key, 'aes'), 'base64'),
    strava_token_expires_at = EXCLUDED.strava_token_expires_at,
    updated_at = now();
END;
$$;

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
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from secret
  encryption_key := current_setting('app.settings.strava_client_secret', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'default_encryption_key_change_me';
  END IF;

  -- Return decrypted tokens
  RETURN QUERY
  SELECT 
    convert_from(decrypt(decode(sc.strava_access_token, 'base64'), encryption_key, 'aes'), 'utf8') as strava_access_token,
    convert_from(decrypt(decode(sc.strava_refresh_token, 'base64'), encryption_key, 'aes'), 'utf8') as strava_refresh_token,
    sc.strava_token_expires_at
  FROM public.strava_credentials sc
  WHERE sc.user_id = _user_id;
END;
$$;