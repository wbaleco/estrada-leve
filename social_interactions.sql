
-- Tabela para Curtidas (Likes)
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(post_id, user_id) -- Garante que um usuário só curta uma vez cada post
);

-- Tabela para Comentários
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar_url TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para Curtidas
CREATE POLICY "Qualquer um pode ver curtidas" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem curtir" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem descurtir seus próprios likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Comentários
CREATE POLICY "Qualquer um pode ver comentários" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem comentar" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios comentários" ON post_comments FOR DELETE USING (auth.uid() = user_id);
