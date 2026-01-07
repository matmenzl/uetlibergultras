-- Drop and recreate leaderboard_stats view with display_name fallback
DROP VIEW IF EXISTS leaderboard_stats;

CREATE VIEW leaderboard_stats AS
SELECT 
    p.id AS user_id,
    count(DISTINCT c.activity_id) AS total_runs,
    count(DISTINCT c.segment_id) AS unique_segments,
    count(DISTINCT a.achievement) AS achievement_count,
    COALESCE(
        p.display_name, 
        CASE 
            WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN p.first_name || ' ' || p.last_name
            WHEN p.first_name IS NOT NULL THEN p.first_name
            ELSE NULL
        END
    ) as display_name,
    p.profile_picture
FROM profiles p
LEFT JOIN check_ins c ON c.user_id = p.id AND EXTRACT(year FROM c.checked_in_at) = EXTRACT(year FROM CURRENT_DATE)
LEFT JOIN user_achievements a ON a.user_id = p.id
GROUP BY p.id, p.display_name, p.first_name, p.last_name, p.profile_picture;