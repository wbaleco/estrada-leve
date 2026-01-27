-- SCRIPT DE CORREÇÃO E LIMPEZA DE DADOS
-- Este script corrige duplicatas e resgata pesagens perdidas

BEGIN;

-- 1. Limpar duplicatas na tabela nova (mantendo a mais recente de cada dia)
DELETE FROM measurement_history a USING (
    SELECT MIN(ctid) as ctid, user_id, date
    FROM measurement_history 
    GROUP BY user_id, date HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
AND a.date = b.date 
AND a.ctid <> b.ctid;

-- 2. Adicionar proteção para não permitir mais duplicatas no futuro
ALTER TABLE measurement_history 
ADD CONSTRAINT measurement_history_user_date_unique UNIQUE (user_id, date);

-- 3. Resgatar dados da tabela antiga que porventura não vieram
-- (Insere apenas se a data ainda não existir para aquele usuário)
INSERT INTO measurement_history (user_id, weight, date, created_at)
SELECT 
    gh.user_id,
    gh.weight,
    gh.date,
    gh.created_at
FROM goals_weight_history gh
WHERE NOT EXISTS (
    SELECT 1 FROM measurement_history mh 
    WHERE mh.user_id = gh.user_id AND mh.date = gh.date
)
AND gh.weight IS NOT NULL;

-- 4. Forçar atualização do peso atual no perfil (user_stats)
-- Baseado na medição mais recente (data mais nova) de cada usuário
UPDATE user_stats us
SET current_weight = mh.weight,
    weight_lost = (us.start_weight - mh.weight) -- Recalcula perda total
FROM (
    SELECT DISTINCT ON (user_id) user_id, weight, date
    FROM measurement_history
    ORDER BY user_id, date DESC
) mh
WHERE us.user_id = mh.user_id
AND mh.date >= CURRENT_DATE - 1; -- Só atualiza se a medição for recente (ontem ou hoje) para não sobrescrever dados errados

COMMIT;

-- Confirmação
SELECT 'Correção concluída com sucesso!' as status;
