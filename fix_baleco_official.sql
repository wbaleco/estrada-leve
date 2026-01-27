-- SCRIPT DE LIMPEZA DE TESTES E CORREÇÃO DE START (BALECO)

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Busca o ID do usuário Baleco
    SELECT user_id INTO target_user_id 
    FROM user_stats 
    WHERE nickname ILIKE 'BALECO'
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- 1. Apagar pesagens de teste específicas (valores incorretos mencionados/vistos)
        DELETE FROM measurement_history 
        WHERE user_id = target_user_id 
        AND weight IN (98, 100.75); -- Remove os valores de teste

        -- 2. Garantir que exite o registro oficial de 101kg
        -- (Removemos qualquer registro do dia 25 antes para reinserir limpo)
        DELETE FROM measurement_history 
        WHERE user_id = target_user_id AND date = '2026-01-25';
        
        INSERT INTO measurement_history (user_id, weight, date, notes)
        VALUES (target_user_id, 101.0, '2026-01-25', 'Pesagem Oficial Inicial');

        -- 3. Corrigir o PERFIL (User Stats) para refletir o novo início
        UPDATE user_stats
        SET 
            start_weight = 101.0,      -- Define o marco inicial correto
            current_weight = 101.0,    -- Define o peso atual correto
            weight_lost = 0,           -- Zera a perda (reinício)
            waist_lost = 0,            -- Zera medidas
            points = GREATEST(points, 0) -- Mantém pontos positivos
        WHERE user_id = target_user_id;

        RAISE NOTICE 'Histórico limpo. Peso Inicial e Atual definidos para 101kg.';
    ELSE
        RAISE NOTICE 'Usuário não encontrado.';
    END IF;
END $$;
