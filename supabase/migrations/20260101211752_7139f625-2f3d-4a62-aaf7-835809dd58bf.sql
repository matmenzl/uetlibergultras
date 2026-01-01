-- Drop and recreate leaderboard_stats view with year filter
DROP VIEW IF EXISTS leaderboard_stats;

CREATE VIEW leaderboard_stats AS
SELECT 
  p.id AS user_id,
  COUNT(DISTINCT c.activity_id) AS total_runs,
  COUNT(DISTINCT c.segment_id) AS unique_segments,
  COUNT(DISTINCT a.achievement) AS achievement_count,
  p.display_name,
  p.profile_picture
FROM profiles p
LEFT JOIN check_ins c ON c.user_id = p.id 
  AND EXTRACT(YEAR FROM c.checked_in_at) = EXTRACT(YEAR FROM CURRENT_DATE)
LEFT JOIN user_achievements a ON a.user_id = p.id
GROUP BY p.id, p.display_name, p.profile_picture;