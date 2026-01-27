-- SCRIPT DE CORREÇÃO MANUAL PARA BALECO
-- Força a inserção da pesagem de 101kg no dia 25/01

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Busca o ID do usuário pelo nickname
    SELECT user_id INTO target_user_id 
    FROM user_stats 
    WHERE nickname ILIKE 'BALECO'
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- Remove qualquer registro existente do dia 25 para evitar conflitos
        DELETE FROM measurement_history 
        WHERE user_id = target_user_id AND date = '2026-01-25';

        -- Insere a pesagem correta
        INSERT INTO measurement_history (user_id, weight, date)
        VALUES (target_user_id, 101.0, '2026-01-25');

        -- Atualiza o peso atual no perfil
        UPDATE user_stats
        SET current_weight = 101.0
        WHERE user_id = target_user_id;
        
        RAISE NOTICE 'Peso do Baleco corrigido para 101kg em 25/01';
    ELSE
        RAISE NOTICE 'Usuário Baleco não encontrado';
    END IF;
END $$;
