-- Atualizar a view winner_rankings para incluir pontos (XP) no cálculo do score
-- Fórmula: Score = %Peso + %Cintura + (Pontos / 500)
-- 500 pontos (2.5 treinos) = 1 ponto de score (equivalente a 1% de perda)

CREATE OR REPLACE VIEW winner_rankings AS
SELECT 
    us.user_id,
    us.nickname,
    us.avatar_url,
    us.current_weight,
    us.start_weight,
    us.goal_weight,
    us.weight_lost,
    us.waist_cm,
    us.start_waist_cm,
    us.waist_lost,
    COALESCE(us.points, 0) as points,
    -- Cálculo de percentual de peso perdido
    CASE 
        WHEN us.start_weight > 0 THEN 
            ROUND(((us.start_weight - us.current_weight) / us.start_weight * 100)::numeric, 2)
        ELSE 0
    END as weight_loss_percentage,
    -- Cálculo de percentual de cintura reduzida
    CASE 
        WHEN us.start_waist_cm > 0 THEN 
            ROUND(((us.start_waist_cm - us.waist_cm) / us.start_waist_cm * 100)::numeric, 2)
        ELSE 0
    END as waist_reduction_percentage,
    -- Score combinado (Peso% + Cintura% + XP Score)
    -- XP Score: Pontos / 400 (ex: 4000 pts = 10.0 score)
    CASE 
        WHEN us.start_weight > 0 THEN
            ROUND((
                -- Peso %
                ((us.start_weight - us.current_weight) / us.start_weight * 100) +
                -- Cintura % (se existir)
                (CASE WHEN us.start_waist_cm > 0 THEN ((us.start_waist_cm - us.waist_cm) / us.start_waist_cm * 100) ELSE 0 END) +
                -- XP Score (Pontos / 400) - Cada 400pts = 1% evolução
                (COALESCE(us.points, 0) / 400.0)
            )::numeric, 2)
        ELSE 0
    END as combined_score
FROM user_stats us
WHERE us.start_weight IS NOT NULL
ORDER BY combined_score DESC;

COMMENT ON VIEW winner_rankings IS 'Ranking considerando Peso (%), Medidas (%) e XP (Pontos/400)';
