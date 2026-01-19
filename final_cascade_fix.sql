
-- FINAL CASCADE FIX: ADDING MISSING TABLES
-- This adds the missing CASCADE rule for 'resources' and other potential tables.

BEGIN;

-- 1. RESOURCES (The one causing the error)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'user_id') THEN
        ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_user_id_fkey;
        ALTER TABLE resources 
        ADD CONSTRAINT resources_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF; 
END $$;

-- 2. USER_MEDALS (Just in case)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_medals' AND column_name = 'user_id') THEN
        ALTER TABLE user_medals DROP CONSTRAINT IF EXISTS user_medals_user_id_fkey;
        ALTER TABLE user_medals 
        ADD CONSTRAINT user_medals_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF; 
END $$;


-- 3. FORCE DELETE AGAIN (Included here for convenience)
DELETE FROM auth.users 
WHERE email IN (
    'barbaraabaleco@gmail.com', 
    'walterbaleco@cooperativacootraur.com.br'
);

COMMIT;
