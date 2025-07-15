# Instruções para Criar a Tabela de Eventos de Log

Este documento contém instruções para administradores do sistema sobre como criar manualmente a tabela de eventos de log no banco de dados Supabase.

## Opção 1: Executar SQL no Editor SQL do Supabase

1. Acesse o painel de administração do Supabase
2. Navegue até a seção "SQL Editor"
3. Crie uma nova consulta e cole o seguinte SQL:

```sql
-- Verificar se a extensão uuid-ossp está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar a tabela de eventos de log
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

-- Adicionar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS eventos_log_usuario_id_idx ON eventos_log(usuario_id);
CREATE INDEX IF NOT EXISTS eventos_log_tipo_evento_idx ON eventos_log(tipo_evento);
CREATE INDEX IF NOT EXISTS eventos_log_entidade_idx ON eventos_log(entidade);
CREATE INDEX IF NOT EXISTS eventos_log_criado_em_idx ON eventos_log(criado_em);

-- Adicionar comentários para documentação
COMMENT ON TABLE eventos_log IS 'Registros de eventos e ações realizadas pelos usuários no sistema';
COMMENT ON COLUMN eventos_log.usuario_email IS 'Email do usuário que realizou a ação';
COMMENT ON COLUMN eventos_log.usuario_id IS 'ID do usuário que realizou a ação';
COMMENT ON COLUMN eventos_log.tipo_evento IS 'Tipo de evento (criação, edição, exclusão, etc)';
COMMENT ON COLUMN eventos_log.entidade IS 'Entidade afetada (proposta, usuário, etc)';
COMMENT ON COLUMN eventos_log.entidade_id IS 'ID da entidade afetada';
COMMENT ON COLUMN eventos_log.descricao IS 'Descrição legível do evento';
COMMENT ON COLUMN eventos_log.dados IS 'Dados adicionais do evento em formato JSON';
COMMENT ON COLUMN eventos_log.criado_em IS 'Data e hora em que o evento foi registrado';
```

4. Execute a consulta clicando em "Run"

## Opção 2: Criar a Função exec_sql

Se você deseja permitir que a aplicação crie a tabela automaticamente, você pode criar a função `exec_sql` que permite executar SQL diretamente:

```sql
-- Função para executar SQL diretamente (requer permissões de administrador)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar comentário para documentação
COMMENT ON FUNCTION exec_sql IS 'Função para executar comandos SQL diretamente (requer permissões de administrador)';
```

## Opção 3: Criar a Função criar_tabela_eventos_log

Alternativamente, você pode criar uma função específica para criar a tabela:

```sql
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
```

## Verificação

Para verificar se a tabela foi criada corretamente, execute:

```sql
SELECT * FROM eventos_log LIMIT 10;
```

Se a consulta for executada sem erros, a tabela foi criada com sucesso. 