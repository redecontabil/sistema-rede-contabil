-- Adiciona coluna paginas_permitidas na tabela usuario
-- Esta coluna armazenará um array de strings com os nomes das páginas que o usuário tem permissão para acessar
-- Por padrão, usuários administradores têm acesso a todas as páginas

ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS paginas_permitidas TEXT[] DEFAULT NULL;

-- Atualiza usuários existentes:
-- Para administradores, define acesso a todas as páginas
UPDATE usuario 
SET paginas_permitidas = ARRAY['dashboard', 'proposta', 'custo', 'balanco', 'bonificacao', 'settings']
WHERE is_admin = true AND paginas_permitidas IS NULL;

-- Para usuários comuns, define acesso apenas ao dashboard por padrão
UPDATE usuario 
SET paginas_permitidas = ARRAY['dashboard']
WHERE is_admin = false AND paginas_permitidas IS NULL;

-- Adiciona um comentário na coluna para documentação
COMMENT ON COLUMN usuario.paginas_permitidas IS 'Array de strings com os nomes das páginas que o usuário tem permissão para acessar'; 