CREATE OR REPLACE VIEW leaderboard_stats AS
SELECT p.id AS user_id,
    COALESCE(p.display_name, p.first_name, 'Anonym'::text) AS display_name,
    p.profile_picture,
    count(DISTINCT c.activity_id) AS total_runs,
    count(DISTINCT c.segment_id) AS unique_segments,
    (SELECT count(*) 
     FROM user_achievements ua
     WHERE ua.user_id = p.id 
       AND EXTRACT(YEAR FROM ua.earned_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    ) AS achievement_count
FROM profiles p
LEFT JOIN check_ins c ON c.user_id = p.id 
    AND EXTRACT(YEAR FROM c.checked_in_at) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY p.id, p.display_name, p.first_name, p.profile_picture;