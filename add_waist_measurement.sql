
-- Add waist measurement to user_stats and history
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS waist_cm NUMERIC;

-- Add waist to history
ALTER TABLE goals_weight_history ADD COLUMN IF NOT EXISTS waist NUMERIC;

-- Update RPC to handle waist
CREATE OR REPLACE FUNCTION complete_user_onboarding(
    p_nickname TEXT,
    p_current_weight NUMERIC,
    p_goal_weight NUMERIC,
    p_height NUMERIC,
    p_bmi NUMERIC,
    p_ideal_weight NUMERIC,
    p_avatar_url TEXT,
    p_waist_cm NUMERIC DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_stats (
        user_id, 
        nickname, 
        current_weight, 
        start_weight, 
        goal_weight, 
        height, 
        bmi, 
        ideal_weight, 
        avatar_url,
        waist_cm
    )
    VALUES (
        auth.uid(), 
        p_nickname, 
        p_current_weight, 
        p_current_weight, 
        p_goal_weight, 
        p_height, 
        p_bmi, 
        p_ideal_weight, 
        p_avatar_url,
        p_waist_cm
    )
    ON CONFLICT (user_id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        current_weight = EXCLUDED.current_weight,
        goal_weight = EXCLUDED.goal_weight,
        height = EXCLUDED.height,
        bmi = EXCLUDED.bmi,
        ideal_weight = EXCLUDED.ideal_weight,
        avatar_url = EXCLUDED.avatar_url,
        waist_cm = EXCLUDED.waist_cm;

    -- Add to history
    INSERT INTO goals_weight_history (user_id, label, weight, waist, date)
    VALUES (auth.uid(), 'Medida Inicial', p_current_weight, p_waist_cm, CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
