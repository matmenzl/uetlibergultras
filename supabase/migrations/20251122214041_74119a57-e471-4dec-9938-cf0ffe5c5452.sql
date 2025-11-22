-- Create a secure table for Strava credentials that is only accessible server-side
CREATE TABLE IF NOT EXISTS public.strava_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  strava_access_token text NOT NULL,
  strava_refresh_token text NOT NULL,
  strava_token_expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS but with NO policies that allow direct client access
ALTER TABLE public.strava_credentials ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to get tokens (only callable from edge functions)
CREATE OR REPLACE FUNCTION public.get_strava_credentials(_user_id uuid)
RETURNS TABLE (
  strava_access_token text,
  strava_refresh_token text,
  strava_token_expires_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT strava_access_token, strava_refresh_token, strava_token_expires_at
  FROM public.strava_credentials
  WHERE user_id = _user_id;
$$;

-- Create a security definer function to upsert tokens (only callable from edge functions)
CREATE OR REPLACE FUNCTION public.upsert_strava_credentials(
  _user_id uuid,
  _access_token text,
  _refresh_token text,
  _expires_at timestamp with time zone
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.strava_credentials (user_id, strava_access_token, strava_refresh_token, strava_token_expires_at, updated_at)
  VALUES (_user_id, _access_token, _refresh_token, _expires_at, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    strava_access_token = EXCLUDED.strava_access_token,
    strava_refresh_token = EXCLUDED.strava_refresh_token,
    strava_token_expires_at = EXCLUDED.strava_token_expires_at,
    updated_at = now();
$$;

-- Migrate existing token data from profiles to strava_credentials
INSERT INTO public.strava_credentials (user_id, strava_access_token, strava_refresh_token, strava_token_expires_at)
SELECT id, strava_access_token, strava_refresh_token, strava_token_expires_at
FROM public.profiles
WHERE strava_access_token IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Drop token columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS strava_access_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS strava_refresh_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS strava_token_expires_at;

-- Add trigger for updated_at on strava_credentials
CREATE TRIGGER update_strava_credentials_updated_at
  BEFORE UPDATE ON public.strava_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();