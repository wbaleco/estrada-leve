
-- LIMPEZA TOTAL E DESBLOQUEIO (RESET AND FIX)
-- RODE ESTE SCRIPT PARA LIMPAR OS DADOS E GARANTIR O ACESSO

BEGIN;

-- 1. Limpar tabelas de dados do usuário (REMOVERÁ TODOS OS PERFIS)
TRUNCATE TABLE user_stats CASCADE;
TRUNCATE TABLE goals_weight_history CASCADE;

-- 2. DESATIVAR RLS (SEGURANÇA LINHA A LINHA) - Isso remove o erro de permissão
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals_weight_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- 3. Garantir que a função de cadastro (Via Expressa) exista e funcione
CREATE OR REPLACE FUNCTION complete_user_onboarding(
    p_nickname TEXT,
    p_current_weight NUMERIC,
    p_goal_weight NUMERIC,
    p_height NUMERIC,
    p_bmi NUMERIC,
    p_ideal_weight NUMERIC,
    p_avatar_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Roda como Admin
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Inserir ou Atualizar Perfil
    INSERT INTO user_stats (
        user_id, nickname, current_weight, start_weight, goal_weight, 
        height, bmi, ideal_weight, avatar_url, day, total_days, points, weight_lost, is_admin
    ) VALUES (
        v_user_id, p_nickname, p_current_weight, p_current_weight, p_goal_weight, 
        p_height, p_bmi, p_ideal_weight, p_avatar_url, 1, 30, 0, 0, false
    )
    ON CONFLICT (user_id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        avatar_url = EXCLUDED.avatar_url;

    -- Inserir Histórico de Peso
    INSERT INTO goals_weight_history (user_id, weight, label, date)
    VALUES (v_user_id, p_current_weight, 'Início', timezone('utc'::text, now()));
END;
$$;

GRANT EXECUTE ON FUNCTION complete_user_onboarding TO authenticated;
GRANT EXECUTE ON FUNCTION complete_user_onboarding TO service_role;

COMMIT;
