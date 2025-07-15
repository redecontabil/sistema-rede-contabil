# Tutorial de Configuração do Banco de Dados - Sistema Rede Contábil Digital

Este documento fornece um guia detalhado para configurar o banco de dados do Sistema Rede Contábil Digital em um novo projeto Supabase.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial do Supabase](#configuração-inicial-do-supabase)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Scripts SQL](#scripts-sql)
5. [Configuração das APIs](#configuração-das-apis)
6. [Sincronização com o Sistema](#sincronização-com-o-sistema)

## Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Acesso administrativo ao projeto
- Cliente SQL (opcional, pode usar o editor SQL do Supabase)

## Configuração Inicial do Supabase

1. Crie uma nova organização no Supabase (se necessário)
2. Crie um novo projeto
3. Anote as credenciais fornecidas:
   - URL do projeto
   - Chave anônima (anon key)
   - Chave de serviço (service_role key)

## Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

### Tabelas do Sistema
- `auth.users`: Gerenciamento de usuários
- `public.profiles`: Perfis de usuários
- `public.propostas`: Propostas de entrada
- `public.propostas_saida`: Propostas de saída
- `public.custos`: Registro de custos e despesas
- `public.fluxo_caixa`: Registros financeiros
- `public.balanco`: Relatórios de balanço

## Scripts SQL

### 1. Configuração Inicial

```sql
-- Configuração inicial do banco de dados
create extension if not exists "uuid-ossp";
create extension if not exists "pg_crypto";

-- Configuração de schemas
create schema if not exists public;
create schema if not exists auth;
create schema if not exists storage;

-- Configuração de políticas de segurança (RLS)
alter table auth.users enable row level security;
```

### 2. Criação das Tabelas

```sql
-- Tabela de perfis
create table public.profiles (
    id uuid references auth.users primary key,
    full_name text,
    avatar_url text,
    updated_at timestamp with time zone
);

-- Tabela de propostas
create table public.propostas (
    id uuid default uuid_generate_v4() primary key,
    data date default current_date,
    cliente text,
    tipo_publico text check (tipo_publico in ('PF', 'PJ')),
    origem text,
    quem_indicou text,
    nome_quem_indicou text,
    comissao text,
    responsavel text,
    abertura_gratuita boolean default false,
    tributacao text,
    honorario numeric,
    funcionarios integer,
    tipo_cliente text,
    status text default 'pendente',
    data_fechamento date,
    data_inicio date,
    reajuste_anual text default 'IPCA',
    observacoes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Tabela de custos
create table public.custos (
    id text primary key,
    vencimento date,
    competencia text,
    previsto_para date,
    data_pagamento date,
    cpf_cnpj text,
    nome text,
    descricao text,
    referencia text,
    categoria text,
    detalhamento text,
    centro_custo text,
    valor_categoria numeric,
    identificador text,
    conta text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Tabela de fluxo de caixa
create table public.fluxo_caixa (
    id uuid default uuid_generate_v4() primary key,
    data date,
    tipo text check (tipo in ('entrada', 'saida')),
    descricao text,
    valor numeric,
    categoria text,
    conta text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Tabela de balanço
create table public.balanco (
    id uuid default uuid_generate_v4() primary key,
    mes integer,
    ano integer,
    tipo text,
    categoria text,
    descricao text,
    valor numeric,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
```

### 3. Funções e Triggers

```sql
-- Função para atualizar timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para atualização de timestamp
create trigger handle_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- Repita o trigger para outras tabelas que precisam de updated_at
```

### 4. Políticas de Segurança (RLS)

```sql
-- Políticas para profiles
create policy "Usuários podem ver seus próprios dados"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar seus próprios dados"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Políticas para propostas
create policy "Usuários autenticados podem ver todas as propostas"
  on public.propostas
  for select
  using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem inserir propostas"
  on public.propostas
  for insert
  with check (auth.role() = 'authenticated');

-- Adicione políticas similares para outras tabelas
```

## Configuração das APIs

1. No painel do Supabase, vá para "Settings" > "API"
2. Configure as seguintes configurações:
   - Habilite "Row Level Security (RLS)"
   - Configure as políticas de CORS para seu domínio
   - Anote a URL da API e as chaves

## Sincronização com o Sistema

1. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

2. Atualize o arquivo `src/lib/supabaseClient.ts` com suas credenciais:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  },
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
```

## Verificação da Instalação

1. Execute os scripts SQL na ordem apresentada
2. Verifique se todas as tabelas foram criadas:
   ```sql
   select table_name 
   from information_schema.tables 
   where table_schema = 'public';
   ```
3. Teste a conexão através do sistema
4. Verifique se as políticas de RLS estão funcionando corretamente

## Manutenção

- Faça backups regulares do banco de dados
- Monitore o desempenho através do painel do Supabase
- Mantenha os scripts de migração organizados na pasta `migrations/`
- Documente todas as alterações no esquema do banco de dados

## Solução de Problemas

### Erros Comuns

1. **Erro de Conexão**
   - Verifique as credenciais no arquivo `.env`
   - Confirme se o projeto está ativo no Supabase
   - Verifique as configurações de CORS

2. **Erro de Permissão**
   - Verifique as políticas RLS
   - Confirme se o usuário está autenticado
   - Verifique os roles e permissões

3. **Erro de Schema**
   - Execute `\dt` no SQL Editor para listar todas as tabelas
   - Verifique se todas as extensões necessárias estão instaladas
   - Confirme se todas as migrations foram aplicadas

Para suporte adicional, consulte a [documentação do Supabase](https://supabase.com/docs) ou entre em contato com a equipe de desenvolvimento.