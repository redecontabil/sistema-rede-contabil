-- Atualiza usuários existentes com permissões padrão
-- Este script garante que todos os usuários existentes tenham permissões definidas

-- Para administradores, define acesso a todas as páginas
UPDATE usuario 
SET paginas_permitidas = ARRAY['dashboard', 'proposta', 'custo', 'balanco', 'bonificacao', 'settings']
WHERE is_admin = true AND (paginas_permitidas IS NULL OR array_length(paginas_permitidas, 1) IS NULL);

-- Para usuários comuns, define acesso apenas ao dashboard por padrão
UPDATE usuario 
SET paginas_permitidas = ARRAY['dashboard']
WHERE is_admin = false AND (paginas_permitidas IS NULL OR array_length(paginas_permitidas, 1) IS NULL);

-- Adiciona log de execução da migração
INSERT INTO migration_log (name, executed_at, description)
VALUES (
  'update_existing_users_permissions', 
  NOW(), 
  'Atualização de permissões de acesso para usuários existentes'
)
ON CONFLICT (name) DO NOTHING; 