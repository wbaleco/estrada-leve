-- Inspect raw data for the top users to debug ranking issues
SELECT 
    nickname,
    start_weight,
    current_weight,
    start_waist_cm,
    waist_cm,
    points
FROM user_stats
ORDER BY points DESC
LIMIT 10;
