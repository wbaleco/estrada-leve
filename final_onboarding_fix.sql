
-- FINAL ONBOARDING FIX (MEGA FUNCTION)
-- Creates both profile and history in one secure transaction.

CREATE OR REPLACE FUNCTION complete_user_onboarding(
    p_nickname TEXT,
    p_current_weight NUMERIC,
    p_goal_weight NUMERIC,
    p_height NUMERIC,
    p_bmi NUMERIC,
    p_ideal_weight NUMERIC,
    p_avatar_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges, bypassing RLS
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get Current User ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN 
        RAISE EXCEPTION 'User not authenticated'; 
    END IF;

    -- 1. Insert or Update User Stats (Profile)
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
        day, 
        total_days, 
        points, 
        weight_lost, 
        is_admin
    )
    VALUES (
        v_user_id, 
        p_nickname, 
        p_current_weight, 
        p_current_weight, 
        p_goal_weight,
        p_height, 
        p_bmi, 
        p_ideal_weight, 
        p_avatar_url,
        1,  -- Day 1
        30, -- 30 Days Challenge
        0,  -- 0 Points
        0,  -- 0 Weight Lost
        false -- Not Admin by default
    )
    ON CONFLICT (user_id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        current_weight = EXCLUDED.current_weight,
        goal_weight = EXCLUDED.goal_weight,
        height = EXCLUDED.height,
        bmi = EXCLUDED.bmi,
        ideal_weight = EXCLUDED.ideal_weight,
        avatar_url = EXCLUDED.avatar_url;

    -- 2. Insert Weight History Entry
    INSERT INTO goals_weight_history (user_id, weight, label, date)
    VALUES (v_user_id, p_current_weight, 'Início', timezone('utc'::text, now()));

END;
$$;

-- Grant functionality to authenticated users
GRANT EXECUTE ON FUNCTION complete_user_onboarding TO authenticated;
