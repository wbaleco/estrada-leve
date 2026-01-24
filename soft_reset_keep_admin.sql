-- SCRIPT DE LIMPEZA SUAVE (SOFT RESET V2)
-- Limpa dados de uso, interações, e RESETA PESOS/MEDIDAS de TODOS (incluindo Admin).
-- Mantém apenas login, senha, nome, idade e gênero.

BEGIN;

-- 1. LIMPAR INTERAÇÕES SOCIAIS (Posts, Curtidas e Comentários)
TRUNCATE TABLE post_comments, post_likes, social_posts CASCADE;

-- 2. LIMPAR TREINOS E VALIDAÇÕES (Vídeos e Curtidas de Treino)
TRUNCATE TABLE workout_comments, workout_likes, workout_recordings CASCADE;

-- 3. LIMPAR PROGRESSO INDIVIDUAL (Metas Diárias e Medalhas)
TRUNCATE TABLE daily_goals, user_medals, shopping_list CASCADE;

-- 4. LIMPAR HISTÓRICO DE PESO E MEDIDAS (Zera gráfico de evolução)
TRUNCATE TABLE goals_weight_history CASCADE;

-- 5. LIMPAR REFEIÇÕES LOGADAS (Mantendo apenas as sugestões do sistema)
DELETE FROM meals WHERE is_suggestion = false;

-- 6. LIMPAR RECURSOS DE TESTE (Artigos/Vídeos com 'teste' no nome)
DELETE FROM resources WHERE title ILIKE '%teste%';

-- 7. RESETAR PERFIL DE TODOS OS USUÁRIOS (INCLUSIVE ADMIN)
-- Zera pontos, dias, quilos perdidos e apaga medida da barriga.
-- Restaura o peso atual para o peso inicial cadastrado.
UPDATE user_stats 
SET 
    points = 0, 
    weight_lost = 0, 
    day = 1,
    current_weight = start_weight, -- Volta pro peso inicial
    waist_cm = NULL, -- Apaga medida da barriga
    total_days = 30; -- Reseta duração do desafio

-- OBS: Idade e Gênero (age, gender) são mantidos porque são dados cadastrais fixos.

COMMIT;

SELECT 'Reset Completo Realizado! Todos os motoristas (e Admin) voltaram para a largada.' as status;
