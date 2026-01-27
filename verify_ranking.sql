-- Query to verify the ranking calculation
-- It recalculates the expected score based on the displayed columns and compares it with the stored combined_score

SELECT 
    nickname,
    weight_loss_percentage as "Peso %",
    waist_reduction_percentage as "Medida %",
    points as "XP",
    ROUND((points / 400.0), 2) as "XP Score",
    combined_score as "Score Final da View",
    ROUND((weight_loss_percentage + waist_reduction_percentage + (points / 400.0)), 2) as "Score Calculado (Baseado no Display)"
FROM winner_rankings
ORDER BY combined_score DESC;
