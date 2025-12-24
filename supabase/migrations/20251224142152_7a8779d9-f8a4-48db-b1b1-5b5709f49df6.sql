-- Add SELECT policy for strava_credentials so users can only view their own tokens
CREATE POLICY "Users can view their own strava credentials" 
ON public.strava_credentials 
FOR SELECT 
USING (auth.uid() = user_id);