
-- FIX ONBOARDING RLS ISSUE (CORRECTED)
-- Run this in Supabase SQL Editor

BEGIN;

--------------------------------------------------------------------------------
-- 1. GARANTIR EXISTÊNCIA DA TABELA DE HISTÓRICO DE PESO
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goals_weight_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    weight NUMERIC NOT NULL,
    label TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--------------------------------------------------------------------------------
-- 2. CORRIGIR POLÍTICAS NA TABELA DE PERFIL (user_stats)
--------------------------------------------------------------------------------
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas antigas para evitar conflitos de nomes
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_stats;
DROP POLICY IF EXISTS "Public read access" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Owner or Admin update access" ON user_stats;
DROP POLICY IF EXISTS "Admin delete access" ON user_stats; -- Adicionado para evitar erro 42710
DROP POLICY IF EXISTS "Admin update access" ON user_stats;

-- Permissão: TODOS PODEM LER (necessário para social/ranking)
CREATE POLICY "Public read access" 
ON user_stats FOR SELECT 
USING (true);

-- Permissão: USUÁRIO LOGADO PODE CRIAR SEU PRÓPRIO PERFIL
CREATE POLICY "Users can insert own stats" 
ON user_stats FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permissão: DONO OU ADMIN PODE ATUALIZAR
CREATE POLICY "Owner or Admin update access" 
ON user_stats FOR UPDATE 
USING (
    auth.uid() = user_id OR 
    (SELECT is_admin FROM user_stats WHERE user_id = auth.uid()) = true
);

-- Permissão: ADMIN PODE DELETAR
CREATE POLICY "Admin delete access" 
ON user_stats FOR DELETE 
USING (
    (SELECT is_admin FROM user_stats WHERE user_id = auth.uid()) = true
);

--------------------------------------------------------------------------------
-- 3. CORRIGIR POLÍTICAS NA TABELA DE HISTÓRICO DE PESO
--------------------------------------------------------------------------------
ALTER TABLE goals_weight_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own weight history" ON goals_weight_history;
DROP POLICY IF EXISTS "Users can read own weight history" ON goals_weight_history;
DROP POLICY IF EXISTS "Public read access" ON goals_weight_history;

-- Permissão: USUÁRIO LOGADO PODE INSERIR SEU PESO
CREATE POLICY "Users can insert own weight history" 
ON goals_weight_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permissão: USUÁRIO LOGADO PODE LER SEU HISTÓRICO
CREATE POLICY "Users can read own weight history" 
ON goals_weight_history FOR SELECT 
USING (auth.uid() = user_id);

COMMIT;
