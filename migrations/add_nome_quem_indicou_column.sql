-- Adiciona a coluna nome_quem_indicou à tabela propostas
ALTER TABLE public.propostas 
ADD COLUMN IF NOT EXISTS nome_quem_indicou TEXT;

-- Adiciona um comentário à coluna para documentação
COMMENT ON COLUMN public.propostas.nome_quem_indicou IS 'Nome completo da pessoa que indicou a proposta'; 