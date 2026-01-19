
-- Permitir que usuários autenticados atualizem os contadores de likes e comentários nos treinos
-- Isso é necessário para o incremento via API funcionar
DROP POLICY IF EXISTS "Permitir update de contadores nos treinos" ON workout_recordings;
CREATE POLICY "Permitir update de contadores nos treinos" 
ON workout_recordings 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Garantir que os contadores não sejam NULL
UPDATE workout_recordings SET likes_count = 0 WHERE likes_count IS NULL;
UPDATE workout_recordings SET comments_count = 0 WHERE comments_count IS NULL;

-- Adicionar política para deletar likes (Un-like)
DROP POLICY IF EXISTS "Usuarios deletam proprias curtidas de treinos" ON workout_likes;
CREATE POLICY "Usuarios deletam proprias curtidas de treinos" 
ON workout_likes 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
