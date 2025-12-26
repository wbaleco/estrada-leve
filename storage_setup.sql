-- 1. Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Clean up old policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- 3. Set up fresh policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects 
FOR SELECT USING ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own avatars" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'avatars' AND (owner = auth.uid() OR auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Users can delete own avatars" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'avatars' AND (owner = auth.uid() OR auth.uid()::text = (storage.foldername(name))[1])
);
