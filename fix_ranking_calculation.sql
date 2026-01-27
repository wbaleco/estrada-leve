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
    -- Cálculos auxiliares para depuração, se necessário
    CASE 
        WHEN us.start_weight > 0 THEN 
            ROUND(((us.start_weight - us.current_weight) / us.start_weight * 100)::numeric, 2)
        ELSE 0
    END as weight_loss_percentage,
    CASE 
        WHEN us.start_waist_cm > 0 THEN 
            ROUND(((us.start_waist_cm - us.waist_cm) / us.start_waist_cm * 100)::numeric, 2)
        ELSE 0
    END as waist_reduction_percentage,
    -- Score combinado: (Peso% + Medidas% + XP/400), independente de ter peso inicial ou não para os pontos contarem
    ROUND((
        -- Peso % (Se não tiver peso inicial, é 0)
        (CASE WHEN us.start_weight > 0 THEN ((us.start_weight - us.current_weight) / us.start_weight * 100) ELSE 0 END) +
        -- Cintura % (Se não tiver medida inicial, é 0)
        (CASE WHEN us.start_waist_cm > 0 THEN ((us.start_waist_cm - us.waist_cm) / us.start_waist_cm * 100) ELSE 0 END) +
        -- XP Score (Pontos / 400) - Sempre conta
        (COALESCE(us.points, 0) / 400.0)
    )::numeric, 2) as combined_score
FROM user_stats us
ORDER BY combined_score DESC;

COMMENT ON VIEW winner_rankings IS 'Ranking corrigido: Pontos contam mesmo sem peso inicial registrado.';
