-- Melhorias no sistema de vencedores
-- Adiciona campos para cálculo de vencedor baseado em peso e medidas

-- 1. Adicionar campos de medida inicial de cintura na tabela user_stats
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS start_waist_cm NUMERIC,
ADD COLUMN IF NOT EXISTS waist_lost NUMERIC DEFAULT 0;

-- 2. Criar tabela de histórico de medidas (peso + cintura)
CREATE TABLE IF NOT EXISTS measurement_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL,
    waist_cm NUMERIC,
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_measurement_history_user_id ON measurement_history(user_id);
CREATE INDEX IF NOT EXISTS idx_measurement_history_date ON measurement_history(date DESC);

-- 4. Habilitar RLS
ALTER TABLE measurement_history ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de segurança
CREATE POLICY "Users can view their own measurement history"
    ON measurement_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own measurements"
    ON measurement_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read access for measurement_history"
    ON measurement_history FOR SELECT
    USING (true);

-- 6. Criar view para ranking de vencedores
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
    us.points,
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
    -- Score combinado (peso 60% + cintura 40%)
    CASE 
        WHEN us.start_weight > 0 AND us.start_waist_cm > 0 THEN
            ROUND((
                (((us.start_weight - us.current_weight) / us.start_weight * 100) * 0.6) +
                (((us.start_waist_cm - us.waist_cm) / us.start_waist_cm * 100) * 0.4)
            )::numeric, 2)
        WHEN us.start_weight > 0 THEN
            ROUND(((us.start_weight - us.current_weight) / us.start_weight * 100)::numeric, 2)
        ELSE 0
    END as combined_score
FROM user_stats us
WHERE us.start_weight IS NOT NULL
ORDER BY combined_score DESC, weight_loss_percentage DESC, waist_reduction_percentage DESC;

-- 7. Função para atualizar medidas e calcular perdas
CREATE OR REPLACE FUNCTION update_user_measurements(
    p_weight NUMERIC,
    p_waist_cm NUMERIC DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_start_weight NUMERIC;
    v_start_waist NUMERIC;
    v_weight_lost NUMERIC;
    v_waist_lost NUMERIC;
    v_points_awarded INTEGER := 0;
BEGIN
    v_user_id := auth.uid();
    
    -- Buscar dados iniciais
    SELECT start_weight, start_waist_cm 
    INTO v_start_weight, v_start_waist
    FROM user_stats 
    WHERE user_id = v_user_id;
    
    -- Se não tem peso inicial, definir agora
    IF v_start_weight IS NULL THEN
        v_start_weight := p_weight;
    END IF;
    
    -- Se não tem cintura inicial e está sendo fornecida, definir agora
    IF v_start_waist IS NULL AND p_waist_cm IS NOT NULL THEN
        v_start_waist := p_waist_cm;
    END IF;
    
    -- Calcular perdas
    v_weight_lost := GREATEST(v_start_weight - p_weight, 0);
    v_waist_lost := CASE 
        WHEN v_start_waist IS NOT NULL AND p_waist_cm IS NOT NULL 
        THEN GREATEST(v_start_waist - p_waist_cm, 0)
        ELSE 0
    END;
    
    -- Atualizar user_stats
    UPDATE user_stats 
    SET 
        current_weight = p_weight,
        waist_cm = COALESCE(p_waist_cm, waist_cm),
        start_weight = v_start_weight,
        start_waist_cm = COALESCE(v_start_waist, start_waist_cm),
        weight_lost = v_weight_lost,
        waist_lost = v_waist_lost,
        points = points + v_points_awarded
    WHERE user_id = v_user_id;
    
    -- Inserir no histórico
    INSERT INTO measurement_history (user_id, weight, waist_cm)
    VALUES (v_user_id, p_weight, p_waist_cm);
    
    -- Premiar pontos se houve progresso
    IF v_weight_lost > 0 OR v_waist_lost > 0 THEN
        v_points_awarded := 20;
        UPDATE user_stats 
        SET points = points + v_points_awarded
        WHERE user_id = v_user_id;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'points_awarded', v_points_awarded,
        'weight_lost', v_weight_lost,
        'waist_lost', v_waist_lost
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Migrar dados existentes de goals_weight_history para measurement_history
INSERT INTO measurement_history (user_id, weight, date, created_at)
SELECT 
    user_id,
    weight,
    date,
    created_at
FROM goals_weight_history
WHERE weight IS NOT NULL
ON CONFLICT DO NOTHING;

COMMENT ON TABLE measurement_history IS 'Histórico completo de medidas (peso e cintura) dos usuários';
COMMENT ON VIEW winner_rankings IS 'Ranking de vencedores baseado em percentual de peso perdido e redução de medidas';
COMMENT ON FUNCTION update_user_measurements IS 'Atualiza medidas do usuário e calcula automaticamente as perdas';
