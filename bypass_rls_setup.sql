
-- SECURE PROFILE CREATION FUNCTION
-- This bypasses RLS (Row Level Security) safely to ensure onboarding always succeeds.

CREATE OR REPLACE FUNCTION create_profile_secure(profile_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the ID of the currently logged in user
  target_user_id := auth.uid();
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if profile already exists to avoid duplicates
  IF EXISTS (SELECT 1 FROM user_stats WHERE user_id = target_user_id) THEN
    RETURN; -- Already exists, do nothing or update? For onboarding, we assume new.
  END IF;

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
  ) VALUES (
      target_user_id,
      profile_data->>'nickname',
      (profile_data->>'current_weight')::numeric,
      (profile_data->>'start_weight')::numeric,
      (profile_data->>'goal_weight')::numeric,
      (profile_data->>'height')::numeric,
      (profile_data->>'bmi')::numeric,
      (profile_data->>'ideal_weight')::numeric,
      profile_data->>'avatar_url',
      COALESCE((profile_data->>'day')::int, 1),
      COALESCE((profile_data->>'total_days')::int, 30),
      COALESCE((profile_data->>'points')::int, 0),
      COALESCE((profile_data->>'weight_lost')::numeric, 0),
      COALESCE((profile_data->>'is_admin')::boolean, false)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_profile_secure TO authenticated;
