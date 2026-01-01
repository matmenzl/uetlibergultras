-- Create a public view with only safe fields for other users to see
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  profile_picture,
  is_founding_member,
  user_number
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- The "Users can view their own profile" policy remains, so users can see their full data