
-- Analyze social posts content
SELECT text, count(*) 
FROM social_posts 
GROUP BY text 
ORDER BY count(*) DESC;

-- specific check for automated posts
SELECT * FROM social_posts 
WHERE text LIKE '%Meta%' 
   OR text LIKE '%Peso%' 
   OR text LIKE '%Medida%' 
   OR text LIKE '%Treino%';

-- check for weight outliers
SELECT * FROM user_stats 
WHERE current_weight < 40 OR current_weight > 200;

-- check for users with no name or odd names
SELECT id, nickname, email FROM auth.users LEFT JOIN user_stats ON auth.users.id = user_stats.user_id WHERE user_stats.id IS NULL;
