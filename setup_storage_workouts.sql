
-- 1. Criar buckets de storage se não existirem
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workouts', 'workouts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas do Bucket de Treinos (Videos)
DROP POLICY IF EXISTS "Videos de Treino sao publicos" ON storage.objects;
CREATE POLICY "Videos de Treino sao publicos" ON storage.objects FOR SELECT USING (bucket_id = 'workouts');

DROP POLICY IF EXISTS "Usuarios podem subir seus treinos" ON storage.objects;
CREATE POLICY "Usuarios podem subir seus treinos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'workouts');

-- 3. Políticas para deletar (opcional, mas bom ter)
DROP POLICY IF EXISTS "Usuarios podem deletar seus treinos" ON storage.objects;
CREATE POLICY "Usuarios podem deletar seus treinos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'workouts' AND (storage.foldername(name))[1] = auth.uid()::text);
