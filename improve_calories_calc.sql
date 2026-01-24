-- Adiciona campos para cálculo preciso de TMB (Taxa Metabólica Basal)
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male', -- 'male' (Masculino) ou 'female' (Feminino)
ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 40; -- Idade padrão se não informada

-- Atualiza a função de onboarding para aceitar idade e gênero (opcional, mas bom ter)
-- Por enquanto, vamos deixar o update via Perfil para não quebrar o fluxo atual.
