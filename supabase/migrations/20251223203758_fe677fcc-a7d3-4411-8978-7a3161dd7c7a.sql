-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone for leaderboards" ON public.profiles;

-- Create a more restrictive policy: only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep the existing policy for users viewing their own profile (already exists)
-- "Users can view their own profile" policy remains unchanged