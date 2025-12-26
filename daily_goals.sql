-- 1. Create daily_goals table
CREATE TABLE IF NOT EXISTS daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    date DATE DEFAULT CURRENT_DATE,
    type TEXT NOT NULL, -- 'hydration', 'movement', 'sleep'
    label TEXT NOT NULL,
    current NUMERIC DEFAULT 0,
    target NUMERIC DEFAULT 0,
    unit TEXT,
    icon TEXT,
    color TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, date, type)
);

-- 2. Enable RLS
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

-- 3. Set up Policies
DROP POLICY IF EXISTS "Users can manage their own daily goals" ON daily_goals;
CREATE POLICY "Users can manage their own daily goals" ON daily_goals
FOR ALL USING (user_id = auth.uid());

-- 4. Initial Seed for the current user if they don't have goals today (usually handled by app logic)
-- But we can add a function or trigger if we want. For now, we'll handle it in the API.
