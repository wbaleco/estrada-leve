-- CLEANUP SCRIPT
-- Run this in Supabase SQL Editor to clean up data and fix inconsistencies

-- 1. Remove automated/spam posts from the social feed
DELETE FROM social_posts 
WHERE text LIKE '%Meta de%'
   OR text LIKE '%Acabei de bater um rangaço%'
   OR text LIKE '%Atualizei meu peso%'
   OR text LIKE '%Peso registrado%'
   OR text LIKE '%Medidas registradas%'
   OR text LIKE '%Medidas atualizadas%'
   OR text LIKE '%Acabei de validar meu treino%'
   OR text ILIKE '%test%'
   OR text ILIKE '%lorem%'
   OR length(trim(text)) < 3;

-- 2. Fix inconsistent weight data
-- If start_weight is missing, assume current_weight was the start
UPDATE user_stats
SET start_weight = current_weight
WHERE start_weight IS NULL OR start_weight = 0;

-- If current_weight is missing, assume start_weight is current
UPDATE user_stats
SET current_weight = start_weight
WHERE (current_weight IS NULL OR current_weight = 0) AND start_weight > 0;

-- 3. Fix inconsistent waist data
UPDATE user_stats
SET start_waist_cm = waist_cm
WHERE (start_waist_cm IS NULL OR start_waist_cm = 0) AND waist_cm > 0;

-- 4. Ensure every user has at least one history entry for their current state
INSERT INTO measurement_history (user_id, weight, waist_cm, date)
SELECT user_id, current_weight, waist_cm, CURRENT_DATE
FROM user_stats
WHERE current_weight > 0
AND NOT EXISTS (
    SELECT 1 FROM measurement_history WHERE user_id = user_stats.user_id AND date = CURRENT_DATE
);

-- 5. Recalculate lost stats
UPDATE user_stats SET waist_lost = start_waist_cm - waist_cm WHERE start_waist_cm IS NOT NULL AND waist_cm IS NOT NULL;
UPDATE user_stats SET weight_lost = start_weight - current_weight WHERE start_weight IS NOT NULL AND current_weight IS NOT NULL;
