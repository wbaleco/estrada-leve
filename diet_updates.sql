-- 1. Update meals table for user isolation and tracking
ALTER TABLE meals ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE meals ADD COLUMN IF NOT EXISTS consumed BOOLEAN DEFAULT false;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS is_suggestion BOOLEAN DEFAULT false;

-- 2. Update shopping_list table
ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

-- 3. Enable RLS
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- 4. Clean up old policies
DROP POLICY IF EXISTS "Users can view meals" ON meals;
DROP POLICY IF EXISTS "Users can manage their own meals" ON meals;
DROP POLICY IF EXISTS "Users can view their shopping list" ON shopping_list;
DROP POLICY IF EXISTS "Users can manage their shopping list" ON shopping_list;

-- 5. Set up fresh policies for meals
CREATE POLICY "Users can view meals" ON meals
FOR SELECT USING (is_suggestion = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their own meals" ON meals
FOR ALL USING (user_id = auth.uid());

-- 6. Set up fresh policies for shopping_list
CREATE POLICY "Users can view their shopping list" ON shopping_list
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their shopping list" ON shopping_list
FOR ALL USING (user_id = auth.uid());
