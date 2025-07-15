-- Configuração inicial do banco de dados
-- Execute os scripts na ordem apresentada

-- 1. Configuração de extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_crypto";

-- 2. Configuração de políticas de segurança (RLS)
alter table auth.users enable row level security;

-- 3. Criação de schemas
create schema if not exists public;
create schema if not exists auth;
create schema if not exists storage;

-- 4. Configuração de funções auxiliares
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- 5. Configuração de triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Criação de roles e permissões
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
  
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
end
$$;

-- 7. Configuração de políticas de acesso
create policy "Usuários podem ver seus próprios dados"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar seus próprios dados"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 8. Configuração inicial de usuário administrador (altere a senha)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'admin@exemplo.com',
  crypt('senha_segura', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrador"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 9. Configuração de índices para melhor performance
create index if not exists profiles_user_id_idx on public.profiles(id);
create index if not exists users_email_idx on auth.users(email);

-- 10. Configuração de backup automático (opcional)
-- Nota: Configure isso de acordo com suas necessidades específicas
-- Exemplo de comando para backup:
-- pg_dump -h [HOST] -U [USER] -d [DATABASE] -F c -b -v -f backup.sql

-- 11. Configuração de monitoramento (opcional)
-- Nota: Configure métricas e alertas conforme necessário
-- Exemplo de view para monitoramento:
create or replace view public.system_stats as
select 
  (select count(*) from auth.users) as total_users,
  (select count(*) from public.profiles) as total_profiles,
  current_timestamp as last_updated;

-- Fim da configuração inicial
-- Lembre-se de ajustar senhas, emails e outras configurações sensíveis
-- antes de executar em produção 