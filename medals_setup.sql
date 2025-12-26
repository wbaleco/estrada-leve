
-- Tabela de Medalhas
CREATE TABLE IF NOT EXISTS medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirement_type TEXT NOT NULL, -- 'points', 'weight_lost', 'days', 'workouts'
    requirement_value NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela de Medalhas do Usuário (Relacionamento)
CREATE TABLE IF NOT EXISTS user_medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    medal_id UUID REFERENCES medals(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, medal_id)
);

-- Inserir Medalhas Iniciais
INSERT INTO medals (name, description, icon, requirement_type, requirement_value) VALUES
('Primeiro Frete', 'Completou seu primeiro registro de treino.', 'local_shipping', 'workouts', 1),
('Tanque Cheio', 'Alcançou 500 pontos em atividades.', 'water_drop', 'points', 500),
('Carga Aliviada', 'Eliminou seus primeiros 2kg.', 'monitor_weight', 'weight_lost', 2),
('Fera do Trecho', 'Chegou ao 5º dia de jornada saudável.', 'military_tech', 'days', 5),
('Bruto da Estrada', 'Acumulou 2000 pontos totais.', 'workspace_premium', 'points', 2000);

-- Habilitar RLS
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_medals ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Medalhas visíveis para todos" ON medals FOR SELECT USING (true);
CREATE POLICY "Usuários veem suas próprias medalhas" ON user_medals FOR SELECT USING (auth.uid() = user_id);
