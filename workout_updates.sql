-- 1. Add user_id to activities and social_posts for data isolation
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

-- 2. Add completed column to activities if not already there
ALTER TABLE activities ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- 3. Enable RLS on activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 4. Clean up old policies to be idempotent
DROP POLICY IF EXISTS "Users can view activities" ON activities;
DROP POLICY IF EXISTS "Users can manage their own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;

-- 5. Set up fresh policies
-- Allow everyone to see public activities (user_id IS NULL) and their own
CREATE POLICY "Users can view activities" ON activities
FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

-- Explicit policies for management
CREATE POLICY "Users can insert their own activities" ON activities
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON activities
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON activities
FOR DELETE USING (auth.uid() = user_id);
