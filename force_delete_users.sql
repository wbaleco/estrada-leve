
-- FORÇAR EXCLUSÃO DE USUÁRIOS (VIA SQL)
-- Use este script se o botão de excluir do painel continuar falhando.
-- IMPORTANTE: Rode o script 'fix_foreign_keys.sql' ANTES deste!

BEGIN;

-- Tenta excluir os usuários problemáticos diretamente do banco de autenticação
DELETE FROM auth.users 
WHERE email IN (
    'barbaraabaleco@gmail.com', 
    'walterbaleco@cooperativacootraur.com.br'
);

COMMIT;
