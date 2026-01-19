
-- Melhorias para a galeria de vídeos
ALTER TABLE workout_recordings ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE workout_recordings ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Tabela para curtidas em treinos
CREATE TABLE IF NOT EXISTS workout_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES workout_recordings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(workout_id, user_id)
);

-- RLS
ALTER TABLE workout_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de curtidas em treinos" ON workout_likes;
CREATE POLICY "Leitura pública de curtidas em treinos" ON workout_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem curtir treinos" ON workout_likes;
CREATE POLICY "Usuários podem curtir treinos" ON workout_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem descurtir treinos" ON workout_likes;
CREATE POLICY "Usuários podem descurtir treinos" ON workout_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
