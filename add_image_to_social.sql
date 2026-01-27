
-- Add image_url column to social_posts if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'image_url') THEN 
        ALTER TABLE social_posts ADD COLUMN image_url TEXT; 
    END IF; 
END $$;
