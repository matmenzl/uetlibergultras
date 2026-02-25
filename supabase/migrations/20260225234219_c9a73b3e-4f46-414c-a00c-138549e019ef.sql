CREATE OR REPLACE VIEW public.community_stats AS
SELECT 
  count(DISTINCT activity_id) AS total_runs,
  count(DISTINCT user_id) AS total_runners,
  COALESCE(
    (SELECT sum(unique_activities.activity_distance) / 1000.0::double precision
     FROM (
       SELECT DISTINCT ON (check_ins_1.activity_id) 
         check_ins_1.activity_id,
         check_ins_1.activity_distance
       FROM check_ins check_ins_1
       WHERE EXTRACT(YEAR FROM check_ins_1.checked_in_at) = EXTRACT(YEAR FROM now())
     ) unique_activities
    ), 0::double precision
  ) AS total_distance_km
FROM check_ins
WHERE EXTRACT(YEAR FROM checked_in_at) = EXTRACT(YEAR FROM now());