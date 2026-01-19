
-- DISABLE RLS TEMPORARILY (THE HAMMER)
-- Use this if all else fails to confirm if RLS is the blocker.

BEGIN;

-- 1. DISABLE RLS ON BOTH TABLES
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals_weight_history DISABLE ROW LEVEL SECURITY;

COMMIT;
