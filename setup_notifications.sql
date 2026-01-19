
-- Tabela para Avisos e Notificações Gerais da Estrada
CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'urgent'
    icon TEXT DEFAULT 'notifications',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) + interval '7 days'
);

-- Habilitar RLS
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

-- Regras de Segurança
DROP POLICY IF EXISTS "Qualquer um pode ler avisos" ON app_notifications;
CREATE POLICY "Qualquer um pode ler avisos" ON app_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admin pode gerenciar avisos" ON app_notifications;
CREATE POLICY "Apenas admin pode gerenciar avisos" ON app_notifications FOR ALL USING (
    (SELECT is_admin FROM user_stats WHERE user_id = auth.uid()) = true
);

-- Inserir aviso de boas-vindas
INSERT INTO app_notifications (title, message, type, icon)
VALUES ('Bem-vindo à Estrada Leve!', 'Agora você tem o controle da sua saúde na palma da mão. Vamos rodar juntos!', 'success', 'beenhere')
ON CONFLICT DO NOTHING;
