-- Fix missing start_waist_cm
-- If a user has a current waist_cm but no start_waist_cm, set start = current to establish a baseline.
-- This ensures that future updates will calculate a percentage change correctly.

UPDATE user_stats
SET start_waist_cm = waist_cm
WHERE (start_waist_cm IS NULL OR start_waist_cm = 0)
AND waist_cm IS NOT NULL
AND waist_cm > 0;

-- Same for weight, just in case (though unlikely given the onboarding flow)
UPDATE user_stats
SET start_weight = current_weight
WHERE (start_weight IS NULL OR start_weight = 0)
AND current_weight IS NOT NULL
AND current_weight > 0;

-- Recalculate 'waist_lost' just to be consistent
UPDATE user_stats
SET waist_lost = start_waist_cm - waist_cm
WHERE start_waist_cm IS NOT NULL AND waist_cm IS NOT NULL;
