-- Função para criar a tabela eventos_log
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