CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id,
    COALESCE(display_name,
        CASE
            WHEN ((first_name IS NOT NULL) AND (last_name IS NOT NULL)) THEN ((first_name || ' '::text) || last_name)
            WHEN (first_name IS NOT NULL) THEN first_name
            ELSE NULL::text
        END) AS display_name,
    profile_picture,
    is_founding_member,
    user_number,
    strava_id
FROM profiles;