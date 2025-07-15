-- Função para executar SQL diretamente (requer permissões de administrador)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar comentário para documentação
COMMENT ON FUNCTION exec_sql IS 'Função para executar comandos SQL diretamente (requer permissões de administrador)'; 