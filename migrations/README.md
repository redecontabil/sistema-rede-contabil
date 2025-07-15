# Migrações do Banco de Dados

Este diretório contém scripts de migração para o banco de dados do sistema.

## Migrações disponíveis

- `add_nome_quem_indicou_column.sql`: Adiciona a coluna `nome_quem_indicou` à tabela de propostas para armazenar o nome completo de quem fez a indicação da proposta.

## Como aplicar as migrações

Para aplicar uma migração, execute o script SQL no seu banco de dados Supabase:

1. Acesse o painel do Supabase
2. Navegue até SQL Editor
3. Copie e cole o conteúdo do script SQL
4. Execute o script

Alternativamente, você pode usar a CLI do Supabase para aplicar as migrações. 