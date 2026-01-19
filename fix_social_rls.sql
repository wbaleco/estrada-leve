
-- Garantir que as tabelas existem e têm as políticas corretas
-- 1. Social Posts (Onde vão as mensagens da galera)
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer um pode ler posts" ON social_posts;
CREATE POLICY "Qualquer um pode ler posts" ON social_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem inserir posts" ON social_posts;
CREATE POLICY "Usuários podem inserir posts" ON social_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Workout Recordings (Onde vão os vídeos)
ALTER TABLE workout_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer um pode ler treinos" ON workout_recordings;
CREATE POLICY "Qualquer um pode ler treinos" ON workout_recordings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem inserir treinos" ON workout_recordings;
CREATE POLICY "Usuários podem inserir treinos" ON workout_recordings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Workout Likes (Curtidas em vídeos)
ALTER TABLE workout_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer um pode ler curtidas de treinos" ON workout_likes;
CREATE POLICY "Qualquer um pode ler curtidas de treinos" ON workout_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem curtir treinos" ON workout_likes;
CREATE POLICY "Usuários podem curtir treinos" ON workout_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. User Medals (Medalhas ganhas)
ALTER TABLE user_medals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer um pode ler medalhas ganhas" ON user_medals;
CREATE POLICY "Qualquer um pode ler medalhas ganhas" ON user_medals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sistema pode conceder medalhas" ON user_medals;
CREATE POLICY "Sistema pode conceder medalhas" ON user_medals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. Garantir que as colunas obrigatórias existem
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE workout_recordings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
