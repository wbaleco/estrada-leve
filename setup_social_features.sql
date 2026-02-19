-- 1. Add image_url column to social_posts table
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create the 'activity_images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('activity_images', 'activity_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for activity_images
-- Public can view images
DROP POLICY IF EXISTS "Imagens de Atividades sao publicas" ON storage.objects;
CREATE POLICY "Imagens de Atividades sao publicas" ON storage.objects FOR SELECT USING (bucket_id = 'activity_images');

-- Authenticated users can upload images
DROP POLICY IF EXISTS "Usuarios podem subir imagens de atividades" ON storage.objects;
CREATE POLICY "Usuarios podem subir imagens de atividades" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'activity_images');

-- Authenticated users can update their own images
DROP POLICY IF EXISTS "Usuarios podem atualizar suas imagens" ON storage.objects;
CREATE POLICY "Usuarios podem atualizar suas imagens" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'activity_images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can delete their own images
DROP POLICY IF EXISTS "Usuarios podem deletar suas imagens" ON storage.objects;
CREATE POLICY "Usuarios podem deletar suas imagens" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'activity_images' AND (storage.foldername(name))[1] = auth.uid()::text);
