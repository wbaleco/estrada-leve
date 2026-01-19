
-- 1. Garante que o bucket 'avatars' existe e é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Políticas de acesso para o Bucket de Avatares
-- Permitir que qualquer pessoa veja as fotos
CREATE POLICY "Avatares Públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir que usuários logados enviem fotos
CREATE POLICY "Upload de Avatares Logados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Permitir que o dono da foto a apague ou mude
CREATE POLICY "Dono pode deletar foto"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);
