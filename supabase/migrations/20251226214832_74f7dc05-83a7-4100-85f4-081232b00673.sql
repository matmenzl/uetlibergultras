-- Fix security vulnerability: get_strava_credentials should verify the caller
-- Either they're requesting their own credentials, or the call is from a service role

CREATE OR REPLACE FUNCTION public.get_strava_credentials(_user_id uuid)
RETURNS TABLE(strava_access_token text, strava_refresh_token text, strava_token_expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Security check: only allow users to get their own credentials
  -- Edge functions with service role bypass this check because auth.uid() returns NULL
  -- and they pass the correct _user_id
  IF auth.uid() IS NOT NULL AND auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Access denied: You can only access your own credentials';
  END IF;

  RETURN QUERY
  SELECT 
    sc.strava_access_token,
    sc.strava_refresh_token,
    sc.strava_token_expires_at
  FROM public.strava_credentials sc
  WHERE sc.user_id = _user_id;
END;
$$;