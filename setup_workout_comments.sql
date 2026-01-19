
-- 1. Adicionar contador de comentários nos treinos
ALTER TABLE workout_recordings ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 2. Criar tabela de comentários para treinos (separada para manter FKs limpas)
CREATE TABLE IF NOT EXISTS workout_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES workout_recordings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    user_avatar_url TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. RLS para comentários de treinos
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer um vê comentários de treinos" ON workout_comments;
CREATE POLICY "Qualquer um vê comentários de treinos" ON workout_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados comentam treinos" ON workout_comments;
CREATE POLICY "Usuarios autenticados comentam treinos" ON workout_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. Ajustar as Foreign Keys de user_stats para garantir que os joins funcionem
-- (Já fizemos isso, mas reforçando para garantir)
ALTER TABLE workout_recordings DROP CONSTRAINT IF EXISTS fk_workout_user_stats;
ALTER TABLE workout_recordings 
ADD CONSTRAINT fk_workout_user_stats 
FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE;
