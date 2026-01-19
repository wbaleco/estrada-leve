
-- 1. Melhorar Privacidade do USER_STATS
-- Queremos que o nickname seja público (pro social), mas o PESO seja privado.
-- Como o RLS é por linha, a melhor prática é exigir autenticação para ver o perfil.
DROP POLICY IF EXISTS "user_stats_select_policy" ON user_stats;
CREATE POLICY "user_stats_select_authenticated" ON user_stats 
FOR SELECT TO authenticated 
USING (true); -- Nickname e Pontos são públicos para logados

-- 2. Proteção do Painel Administrativo (Notificações e Gestão)
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Qualquer um vê notificações" ON app_notifications;
CREATE POLICY "Qualquer um vê notificações" ON app_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admins mandam avisos" ON app_notifications;
CREATE POLICY "Apenas admins mandam avisos" ON app_notifications 
FOR ALL TO authenticated 
USING (
  (SELECT is_admin FROM user_stats WHERE user_id = auth.uid()) = true
);

-- 3. Correção de Políticas de Storage (Meals e Workouts)
-- Vamos organizar os arquivos em pastas por UID: /meals/UID/foto.jpg
DROP POLICY IF EXISTS "Users can delete their own meal images" ON storage.objects;
CREATE POLICY "Users can delete their own meal images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meals'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can upload meal images" ON storage.objects;
CREATE POLICY "Authenticated users can upload meal images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meals' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
