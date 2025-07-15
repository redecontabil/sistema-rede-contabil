-- Criar tabela de bonificações
CREATE TABLE IF NOT EXISTS bonificacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario TEXT NOT NULL,
    data_bonificacao DATE NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    motivo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aprovado',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar políticas RLS (Row Level Security)
ALTER TABLE bonificacao ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura para usuários autenticados" 
ON bonificacao FOR SELECT 
TO authenticated 
USING (true);

-- Criar política para permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção para usuários autenticados" 
ON bonificacao FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Criar política para permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização para usuários autenticados" 
ON bonificacao FOR UPDATE 
TO authenticated 
USING (true);

-- Criar política para permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão para usuários autenticados" 
ON bonificacao FOR DELETE 
TO authenticated 
USING (true);

-- Criar trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_bonificacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bonificacao_updated_at
BEFORE UPDATE ON bonificacao
FOR EACH ROW
EXECUTE FUNCTION update_bonificacao_updated_at();
