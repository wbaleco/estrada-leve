
-- Garantir que a relação entre as tabelas está clara para o Supabase
-- 1. Tornar o user_id único em user_stats para permitir joins
ALTER TABLE user_stats DROP CONSTRAINT IF EXISTS user_stats_user_id_key;
ALTER TABLE user_stats ADD CONSTRAINT user_stats_user_id_key UNIQUE (user_id);

-- 2. Adicionar Foreign Key explícita de workout_recordings para user_stats
-- Isso ajuda o PostgREST (API do Supabase) a entender o join automático
ALTER TABLE workout_recordings DROP CONSTRAINT IF EXISTS fk_workout_user_stats;
ALTER TABLE workout_recordings 
ADD CONSTRAINT fk_workout_user_stats 
FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE;

-- 3. Adicionar Foreign Key explícita para os Posts Sociais também
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS fk_social_user_stats;
ALTER TABLE social_posts 
ADD CONSTRAINT fk_social_user_stats 
FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE;

-- 4. Garantir que as tabelas de suporte para curtidas também funcionem
ALTER TABLE workout_likes DROP CONSTRAINT IF EXISTS fk_likes_user_stats;
ALTER TABLE workout_likes 
ADD CONSTRAINT fk_likes_user_stats 
FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE;
