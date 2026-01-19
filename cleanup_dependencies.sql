
-- LIMPEZA PROFUNDA DE DEPENDÊNCIAS (DEEP CLEANUP)
-- Rode este script para apagar TODOS os dados das tabelas públicas.
-- Isso vai liberar as travas (Foreign Keys) e permitir excluir os usuários no painel.

BEGIN;

-- Limpar todas as tabelas que podem ter referências a usuários
-- O CASCADE garante que se houver sub-dependências, elas também vão embora.

TRUNCATE TABLE user_stats CASCADE;
TRUNCATE TABLE goals_weight_history CASCADE;
TRUNCATE TABLE user_medals CASCADE;
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE meals CASCADE;
TRUNCATE TABLE social_posts CASCADE;
TRUNCATE TABLE workout_recordings CASCADE;
TRUNCATE TABLE shopping_list CASCADE;

-- (Opcional) Limpar notificações ou outras tabelas se existirem
-- TRUNCATE TABLE notifications CASCADE;

COMMIT;

-- Reafirmando o desligamento do RLS para garantir o próximo cadastro
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals_weight_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts DISABLE ROW LEVEL SECURITY;
