-- Drop and recreate public_profiles view with display_name fallback to first_name + last_name
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles AS
SELECT 
  id,
  COALESCE(
    display_name, 
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL THEN first_name
      ELSE NULL
    END
  ) as display_name,
  profile_picture,
  is_founding_member,
  user_number
FROM profiles;