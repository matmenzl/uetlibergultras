-- Enable Row Level Security on strava_credentials if not already enabled
ALTER TABLE public.strava_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own credentials
CREATE POLICY "Users can view their own strava credentials"
ON public.strava_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own credentials
CREATE POLICY "Users can insert their own strava credentials"
ON public.strava_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own credentials
CREATE POLICY "Users can update their own strava credentials"
ON public.strava_credentials
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own credentials
CREATE POLICY "Users can delete their own strava credentials"
ON public.strava_credentials
FOR DELETE
USING (auth.uid() = user_id);