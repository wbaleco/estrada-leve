-- Create tables for Estrada Leve

-- User Stats
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    day INTEGER DEFAULT 1,
    total_days INTEGER DEFAULT 30,
    weight_lost NUMERIC DEFAULT 0,
    points INTEGER DEFAULT 0,
    current_weight NUMERIC,
    start_weight NUMERIC,
    goal_weight NUMERIC,
    height NUMERIC,
    bmi NUMERIC,
    ideal_weight NUMERIC,
    nickname TEXT,
    avatar_url TEXT,
    gender TEXT DEFAULT 'male',
    age INTEGER DEFAULT 40,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    time_label TEXT,
    duration TEXT,
    icon TEXT,
    color TEXT,
    type TEXT CHECK (type IN ('cabin', 'external', 'rest', 'all')),
    completed BOOLEAN DEFAULT FALSE,
    image TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Meals
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    calories INTEGER,
    time_prep TEXT,
    tags TEXT[],
    image TEXT,
    category TEXT CHECK (category IN ('breakfast', 'lunch', 'snack', 'dinner')),
    day_week TEXT,
    is_suggestion BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Goals / Weight History
CREATE TABLE IF NOT EXISTS goals_weight_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    label TEXT,
    weight NUMERIC,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Social Feed
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    time_ago TEXT,
    color TEXT,
    stats TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Resources / Dicas
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('article', 'podcast', 'video', 'tip')),
    category TEXT,
    duration TEXT,
    image TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Shopping List
CREATE TABLE IF NOT EXISTS shopping_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    label TEXT NOT NULL,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing public read for demo purposes, but ideally should be authenticated)
CREATE POLICY "Public read access" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Public read access" ON activities FOR SELECT USING (true);
CREATE POLICY "Public read access" ON meals FOR SELECT USING (true);
CREATE POLICY "Public read access" ON goals_weight_history FOR SELECT USING (true);
CREATE POLICY "Public read access" ON social_posts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON resources FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shopping_list FOR SELECT USING (true);


-- Insert Sample Data
INSERT INTO user_stats (day, total_days, weight_lost, points, current_weight, start_weight, goal_weight)
VALUES (5, 30, 1.2, 350, 115, 120, 100);

INSERT INTO activities (title, description, time_label, duration, icon, color, type, image, is_locked)
VALUES 
('Alongamento na Cabine', 'Pescoço, ombros e lombar.', 'Acordar', '5 min', 'wb_sunny', 'orange', 'cabin', 'https://picsum.photos/200/200?random=1', false),
('Caminhada Ativa', '3 voltas no caminhão.', 'Parada Rápida', '10 min', 'local_gas_station', 'blue', 'external', 'https://picsum.photos/200/200?random=2', false),
('Subida no Degrau', '3 séries de 12 reps.', 'Parada Rápida', '10 min', 'fitness_center', 'blue', 'external', 'https://picsum.photos/200/200?random=3', false),
('Relaxamento', 'Preparação para o sono.', 'Pernoite', '20 min', 'bedtime', 'purple', 'rest', 'https://picsum.photos/200/200?random=4', true);

INSERT INTO meals (name, description, calories, time_prep, tags, image, category, day_week)
VALUES
('Aveia de Pernoite', 'Rica em fibras para saciedade longa.', 320, '5 min', ARRAY['Sem Cozinha'], 'https://picsum.photos/400/250?random=10', 'breakfast', 'Café'),
('Ovos na Chapa', 'Opção ideal no restaurante do posto.', 410, '15 min', ARRAY['Parada Rápida'], 'https://picsum.photos/400/250?random=11', 'lunch', 'Almoço');

INSERT INTO goals_weight_history (label, weight)
VALUES 
('Sem 1', 120),
('Sem 2', 118),
('Sem 3', 116.5),
('Sem 4', 115);

INSERT INTO social_posts (name, text, time_ago, color, stats)
VALUES
('Rafael Mendes', 'Bati a meta da semana, parceiros! 30 min de caminhada todo dia.', '2h atrás', 'blue', '112kg'),
('Carlos Silva', 'Acabei de atualizar o peso inicial. Vamo que vamo!', '5h atrás', 'orange', NULL);

INSERT INTO resources (title, description, type, category, duration, image)
VALUES
('A importância da água', 'Beber água regularmente combate o cansaço.', 'article', 'Nutrição', '3m', 'https://picsum.photos/600/300?random=20'),
('Alongamento Lombar', 'Alivie a tensão das costas em 5 min.', 'video', 'Movimento', '5m', 'https://picsum.photos/200/200?random=31'),
('Ombros e Pescoço', 'Exercícios rápidos na cabine.', 'video', 'Movimento', '3m', 'https://picsum.photos/200/200?random=32');

INSERT INTO shopping_list (label, checked)
VALUES ('500g Peito de Frango', true), ('1 Pote Aveia em Flocos', false), ('Dúzia de Bananas Prata', false);
