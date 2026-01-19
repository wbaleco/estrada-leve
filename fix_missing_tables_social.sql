
-- 1. Tabelas de suporte para Social e Ranking
CREATE TABLE IF NOT EXISTS workout_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id UUID,
    video_url TEXT NOT NULL,
    points_earned INTEGER DEFAULT 200,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_avatar_url TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Sistema de Medalhas
CREATE TABLE IF NOT EXISTS medals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    requirement_type TEXT, -- 'points', 'weight_lost', 'days', 'workouts'
    requirement_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS user_medals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    medal_id UUID REFERENCES medals(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, medal_id)
);

-- 3. Habilitar RLS em tudo
ALTER TABLE workout_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_medals ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Leitura Pública
DROP POLICY IF EXISTS "Leitura pública de treinos" ON workout_recordings;
CREATE POLICY "Leitura pública de treinos" ON workout_recordings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de curtidas" ON post_likes;
CREATE POLICY "Leitura pública de curtidas" ON post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de comentários" ON post_comments;
CREATE POLICY "Leitura pública de comentários" ON post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de medalhas" ON medals;
CREATE POLICY "Leitura pública de medalhas" ON medals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de medalhas ganhas" ON user_medals;
CREATE POLICY "Leitura pública de medalhas ganhas" ON user_medals FOR SELECT USING (true);

-- 5. Políticas de Inserção para usuários logados
DROP POLICY IF EXISTS "Usuários podem postar treinos" ON workout_recordings;
CREATE POLICY "Usuários podem postar treinos" ON workout_recordings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem curtir" ON post_likes;
CREATE POLICY "Usuários podem curtir" ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem comentar" ON post_comments;
CREATE POLICY "Usuários podem comentar" ON post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. Adicionar medalhas iniciais se não existirem
INSERT INTO medals (name, description, icon, requirement_type, requirement_value)
VALUES 
('Primeiro Frete', 'Completou seu primeiro dia na estrada.', 'local_shipping', 'days', 1),
('Tanque Cheio', 'Alcançou 500 pontos de saúde.', 'ev_station', 'points', 500),
('Carga Aliviada', 'Perdeu seus primeiros 2kg.', 'weight', 'weight_lost', 2),
('Fera do Trecho', 'Gravou seu primeiro vídeo de treino.', 'fitness_center', 'workouts', 1),
('Bruto no Treino', 'Completou 10 treinos gravados.', 'military_tech', 'workouts', 10)
ON CONFLICT DO NOTHING;

-- 7. Adicionar colunas extras em social_posts se faltarem
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS user_avatar_url TEXT;

-- 8. Garantir política de leitura em social_posts e user_stats
DROP POLICY IF EXISTS "Public read access" ON social_posts;
CREATE POLICY "Public read access" ON social_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON user_stats;
CREATE POLICY "Public read access" ON user_stats FOR SELECT USING (true);
