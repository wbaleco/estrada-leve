-- SCRIPT DE CORREÇÃO DE PESOS V2 - SEM TRAVA DE DATA ÚNICA
-- Permite múltiplas pesagens no mesmo dia para o start inicial

DO $$
DECLARE
    r RECORD;
    v_start_weight NUMERIC;
    v_current_weight NUMERIC;
BEGIN
    -- 0. REMOVER A RESTRIÇÃO DE UNICIDADE (SE EXISTIR) PARA PERMITIR DUAS PESAGENS ONTEM
    -- (Ignora erro se não existir)
    BEGIN
        ALTER TABLE measurement_history DROP CONSTRAINT measurement_history_user_date_unique;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- 1. APAGAR DADOS ANTIGOS (Anteriores a 25/01) PARA TODOS
    DELETE FROM measurement_history 
    WHERE date < '2026-01-25';

    -- 2. CORREÇÃO ESPECÍFICA PARA 'BALECO'
    -- Removemos primeiro para garantir
    DELETE FROM measurement_history WHERE user_id IN (SELECT user_id FROM user_stats WHERE nickname ILIKE 'BALECO');
    
    -- Insere Start (Manhã)
    INSERT INTO measurement_history (user_id, weight, date, created_at)
    SELECT user_id, 101.2, '2026-01-25', '2026-01-25 08:00:00+00'
    FROM user_stats WHERE nickname ILIKE 'BALECO';

    -- Insere Current (Tarde)
    INSERT INTO measurement_history (user_id, weight, date, created_at)
    SELECT user_id, 100.75, '2026-01-25', '2026-01-25 18:00:00+00'
    FROM user_stats WHERE nickname ILIKE 'BALECO';

    -- Atualiza Profile Baleco
    UPDATE user_stats
    SET start_weight = 101.2,
        current_weight = 100.75,
        weight_lost = (101.2 - 100.75)
    WHERE nickname ILIKE 'BALECO';


    -- 3. RECALCULAR PARA TODOS OS OUTROS
    FOR r IN SELECT user_id FROM user_stats WHERE nickname NOT ILIKE 'BALECO' LOOP
        
        -- Busca Start
        SELECT weight INTO v_start_weight
        FROM measurement_history
        WHERE user_id = r.user_id AND date >= '2026-01-25'
        ORDER BY created_at ASC, weight DESC
        LIMIT 1;

        -- Busca Current
        SELECT weight INTO v_current_weight
        FROM measurement_history
        WHERE user_id = r.user_id AND date >= '2026-01-25'
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_start_weight IS NOT NULL THEN
            IF v_current_weight IS NULL THEN v_current_weight := v_start_weight; END IF;

            UPDATE user_stats
            SET start_weight = v_start_weight,
                current_weight = v_current_weight,
                weight_lost = (v_start_weight - v_current_weight)
            WHERE user_id = r.user_id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Pesos corrigidos e trava de data removida.';
END $$;
