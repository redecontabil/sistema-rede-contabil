-- Script para corrigir a tabela eventos_log e criar funções auxiliares
-- Este script deve ser executado no SQL Editor do Supabase

-- 1. Verificar se a extensão uuid-ossp está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar a tabela eventos_log se não existir
CREATE TABLE IF NOT EXISTS eventos_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_email TEXT NOT NULL,
  usuario_id UUID NOT NULL,
  tipo_evento TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id TEXT,
  descricao TEXT NOT NULL,
  dados JSONB,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS eventos_log_usuario_id_idx ON eventos_log(usuario_id);
CREATE INDEX IF NOT EXISTS eventos_log_tipo_evento_idx ON eventos_log(tipo_evento);
CREATE INDEX IF NOT EXISTS eventos_log_entidade_idx ON eventos_log(entidade);
CREATE INDEX IF NOT EXISTS eventos_log_criado_em_idx ON eventos_log(criado_em);

-- 4. Adicionar comentários para documentação
COMMENT ON TABLE eventos_log IS 'Registros de eventos e ações realizadas pelos usuários no sistema';
COMMENT ON COLUMN eventos_log.usuario_email IS 'Email do usuário que realizou a ação';
COMMENT ON COLUMN eventos_log.usuario_id IS 'ID do usuário que realizou a ação';
COMMENT ON COLUMN eventos_log.tipo_evento IS 'Tipo de evento (criação, edição, exclusão, etc)';
COMMENT ON COLUMN eventos_log.entidade IS 'Entidade afetada (proposta, usuário, etc)';
COMMENT ON COLUMN eventos_log.entidade_id IS 'ID da entidade afetada';
COMMENT ON COLUMN eventos_log.descricao IS 'Descrição legível do evento';
COMMENT ON COLUMN eventos_log.dados IS 'Dados adicionais do evento em formato JSON';
COMMENT ON COLUMN eventos_log.criado_em IS 'Data e hora em que o evento foi registrado';

-- 5. Criar a função exec_sql para permitir a execução de SQL diretamente
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Adicionar comentário para documentação da função
COMMENT ON FUNCTION exec_sql IS 'Função para executar comandos SQL diretamente (requer permissões de administrador)';

-- 7. Criar a função criar_tabela_eventos_log para criar a tabela (alternativa)
CREATE OR REPLACE FUNCTION criar_tabela_eventos_log()
RETURNS void AS $$
BEGIN
  -- Cria tabela para armazenar logs de eventos do sistema
  CREATE TABLE IF NOT EXISTS eventos_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_email TEXT NOT NULL,
    usuario_id UUID NOT NULL,
    tipo_evento TEXT NOT NULL,
    entidade TEXT NOT NULL,
    entidade_id TEXT,
    descricao TEXT NOT NULL,
    dados JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Adiciona índices para melhorar a performance das consultas
  CREATE INDEX IF NOT EXISTS eventos_log_usuario_id_idx ON eventos_log(usuario_id);
  CREATE INDEX IF NOT EXISTS eventos_log_tipo_evento_idx ON eventos_log(tipo_evento);
  CREATE INDEX IF NOT EXISTS eventos_log_entidade_idx ON eventos_log(entidade);
  CREATE INDEX IF NOT EXISTS eventos_log_criado_em_idx ON eventos_log(criado_em);

  -- Adiciona comentários para documentação
  COMMENT ON TABLE eventos_log IS 'Registros de eventos e ações realizadas pelos usuários no sistema';
  COMMENT ON COLUMN eventos_log.usuario_email IS 'Email do usuário que realizou a ação';
  COMMENT ON COLUMN eventos_log.usuario_id IS 'ID do usuário que realizou a ação';
  COMMENT ON COLUMN eventos_log.tipo_evento IS 'Tipo de evento (criação, edição, exclusão, etc)';
  COMMENT ON COLUMN eventos_log.entidade IS 'Entidade afetada (proposta, usuário, etc)';
  COMMENT ON COLUMN eventos_log.entidade_id IS 'ID da entidade afetada';
  COMMENT ON COLUMN eventos_log.descricao IS 'Descrição legível do evento';
  COMMENT ON COLUMN eventos_log.dados IS 'Dados adicionais do evento em formato JSON';
  COMMENT ON COLUMN eventos_log.criado_em IS 'Data e hora em que o evento foi registrado';
END;
$$ LANGUAGE plpgsql;

-- 8. Adicionar comentário para documentação da função
COMMENT ON FUNCTION criar_tabela_eventos_log IS 'Função para criar a tabela eventos_log e seus índices';

-- 9. Inserir um registro inicial para testar a tabela
INSERT INTO eventos_log (usuario_email, usuario_id, tipo_evento, entidade, descricao, dados)
VALUES (
  'sistema@redecontabil.com',
  '00000000-0000-0000-0000-000000000000',
  'outro',
  'sistema',
  'Inicialização da tabela de eventos',
  '{"info": "Registro inicial para testar a tabela"}'
);

-- 10. Verificar se a inserção funcionou
SELECT * FROM eventos_log LIMIT 10; 