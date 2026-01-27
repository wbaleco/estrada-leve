-- SCRIPT DE CORREÇÃO DE PESOS - TODOS OS USUÁRIOS
-- Regra: Considerar apenas pesagens a partir de 25/01/2026
-- Start = Primeira pesagem do dia 25 (ou a maior)
-- Current = Última pesagem do dia 25 (ou a menor)

DO $$
DECLARE
    r RECORD;
    v_start_weight NUMERIC;
    v_current_weight NUMERIC;
BEGIN
    -- 1. APAGAR DADOS ANTIGOS (Anteriores a 25/01) PARA TODOS
    DELETE FROM measurement_history 
    WHERE date < '2026-01-25';

    -- 2. CORREÇÃO ESPECÍFICA PARA 'BALECO'
    -- Vamos garantir seus valores exatos
    UPDATE user_stats
    SET start_weight = 101.2,   -- "Pouco mais de 101kg"
        current_weight = 100.75, -- "Segunda pesagem"
        weight_lost = (101.2 - 100.75)
    WHERE nickname ILIKE 'BALECO';

    -- Inserir histórico limpo para Baleco se não existir
    -- Removemos primeiro para garantir
    DELETE FROM measurement_history WHERE user_id IN (SELECT user_id FROM user_stats WHERE nickname ILIKE 'BALECO');
    
    INSERT INTO measurement_history (user_id, weight, date, created_at)
    SELECT user_id, 101.2, '2026-01-25', '2026-01-25 08:00:00+00' -- Manhã
    FROM user_stats WHERE nickname ILIKE 'BALECO';

    INSERT INTO measurement_history (user_id, weight, date, created_at)
    SELECT user_id, 100.75, '2026-01-25', '2026-01-25 18:00:00+00' -- Tarde
    FROM user_stats WHERE nickname ILIKE 'BALECO';


    -- 3. RECALCULAR PARA TODOS OS OUTROS
    FOR r IN SELECT user_id FROM user_stats WHERE nickname NOT ILIKE 'BALECO' LOOP
        
        -- Busca pesagem inicial (mais antiga ou maior do dia 25 em diante)
        SELECT weight INTO v_start_weight
        FROM measurement_history
        WHERE user_id = r.user_id AND date >= '2026-01-25'
        ORDER BY created_at ASC, weight DESC -- Tenta pegar a primeira cronológica ou a maior
        LIMIT 1;

        -- Busca pesagem atual (mais recente)
        SELECT weight INTO v_current_weight
        FROM measurement_history
        WHERE user_id = r.user_id AND date >= '2026-01-25'
        ORDER BY created_at DESC
        LIMIT 1;

        -- Se encontrou dados válidos, atualiza o perfil
        IF v_start_weight IS NOT NULL THEN
            -- Se só tiver uma pesagem, start = current
            IF v_current_weight IS NULL THEN 
                v_current_weight := v_start_weight; 
            END IF;

            UPDATE user_stats
            SET start_weight = v_start_weight,
                current_weight = v_current_weight,
                weight_lost = (v_start_weight - v_current_weight)
            WHERE user_id = r.user_id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Pesos corrigidos. Baleco: 101.2 -> 100.75. Outros recalculados desde 25/01.';
END $$;
