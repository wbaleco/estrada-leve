-- 1. Update social_posts table to include user_id
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS user_avatar_url TEXT;

-- 2. Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- 3. Set up Policies
DROP POLICY IF EXISTS "Anyone can read social posts" ON social_posts;
CREATE POLICY "Anyone can read social posts" ON social_posts
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own posts" ON social_posts;
CREATE POLICY "Users can insert their own posts" ON social_posts
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own posts" ON social_posts;
CREATE POLICY "Users can update their own posts" ON social_posts
FOR UPDATE USING (user_id = auth.uid());

-- 4. Clean up old sample data if necessary (optional)
-- DELETE FROM social_posts WHERE user_id IS NULL;
