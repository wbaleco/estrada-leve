
-- 1. Policies for User Stats (Perfís)
-- Everyone can view profiles (for ranking and feed)
-- Only Owner or Admin can update
-- Only Admin can delete

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON user_stats;
DROP POLICY IF EXISTS "Users can read own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Admin update access" ON user_stats;
DROP POLICY IF EXISTS "Admin delete access" ON user_stats;

-- Allow everyone to read user stats (nickname, avatar, points are needed for public feed)
CREATE POLICY "Public read access" ON user_stats FOR SELECT USING (true);

-- Allow users to insert their own stats on creation
CREATE POLICY "Users can insert own stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: Owner OR Admin
CREATE POLICY "Owner or Admin update access" ON user_stats FOR UPDATE USING (
    auth.uid() = user_id OR 
    (SELECT is_admin FROM user_stats WHERE user_id = auth.uid()) = true
);

-- Delete: Admin ONLY (Users usually don't delete their own full profile in this app logic, only admin)
CREATE POLICY "Admin delete access" ON user_stats FOR DELETE USING (
    (SELECT is_admin FROM user_stats WHERE user_id = auth.uid()) = true
);


-- 2. Policies for Social Posts (Feed)
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON social_posts;
DROP POLICY IF EXISTS "Users can create posts" ON social_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON social_posts;
DROP POLICY IF EXISTS "Admin delete posts" ON social_posts;

-- Everyone can see posts
CREATE POLICY "Public read access" ON social_posts FOR SELECT USING (true);

-- Authenticated users can create posts
CREATE POLICY "Users can create posts" ON social_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Owner or Admin can delete
CREATE POLICY "Owner or Admin delete posts" ON social_posts FOR DELETE USING (
    auth.uid() = user_id OR 
    (SELECT is_admin FROM user_stats WHERE user_id = auth.uid()) = true
);

-- 3. Policies for Workout Recordings (Videos)
ALTER TABLE workout_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON workout_recordings;
DROP POLICY IF EXISTS "Users can upload workouts" ON workout_recordings;

-- Everyone can see workouts (for the feed)
CREATE POLICY "Public read access" ON workout_recordings FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "Users can upload workouts" ON workout_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 4. Initial Admin Setup (Example: Make the first user admin if needed, or manual)
-- You can run this manually: UPDATE user_stats SET is_admin = true WHERE email = 'your@email.com'; 
-- But we can't select by email easily here without joining auth.users which is restricted.
-- So we rely on the Admin Panel finding a user and an existing Admin promoting them, 
-- or manual DB edit for the first Admin.
