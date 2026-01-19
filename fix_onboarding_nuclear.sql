
-- NUCLEAR OPTION: RESET ALL POLICIES FOR USER_STATS and GOALS_WEIGHT_HISTORY
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. USER_STATS
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY; -- Temporarily disable
DROP POLICY IF EXISTS "Public read access" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;
DROP POLICY IF EXISTS "Owner or Admin update access" ON user_stats;
DROP POLICY IF EXISTS "Admin delete access" ON user_stats;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_stats;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_stats;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_stats;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_stats;

-- Re-enable and add clean policies
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_stats_select_policy" ON user_stats FOR SELECT USING (true);

CREATE POLICY "user_stats_insert_policy" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_stats_update_policy" ON user_stats FOR UPDATE USING (auth.uid() = user_id OR (SELECT is_admin FROM user_stats WHERE user_id = auth.uid()) = true);

CREATE POLICY "user_stats_delete_policy" ON user_stats FOR DELETE USING ((SELECT is_admin FROM user_stats WHERE user_id = auth.uid()) = true);


-- 2. GOALS_WEIGHT_HISTORY
ALTER TABLE goals_weight_history DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own weight history" ON goals_weight_history;
DROP POLICY IF EXISTS "Users can read own weight history" ON goals_weight_history;
DROP POLICY IF EXISTS "Public read access" ON goals_weight_history;

ALTER TABLE goals_weight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weight_history_insert_policy" ON goals_weight_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weight_history_select_policy" ON goals_weight_history FOR SELECT USING (auth.uid() = user_id);

COMMIT;
