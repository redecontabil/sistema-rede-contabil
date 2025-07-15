# Guia de Instalação - Sistema Rede Contábil Digital

Este guia fornece instruções detalhadas para instalar e configurar o Sistema Rede Contábil Digital em um novo ambiente.

## Requisitos do Sistema

- Node.js versão 18 ou superior
- NPM (Node Package Manager) ou Yarn
- Banco de dados Supabase

## Passo a Passo para Instalação

### 1. Clonando o Repositório

```bash
git clone [URL_DO_REPOSITORIO]
cd [NOME_DA_PASTA_DO_PROJETO]
```

### 2. Instalando Dependências

```bash
npm install
# ou
yarn install
```

### 3. Configuração do Ambiente

1. Crie um arquivo `.env` na raiz do projeto
2. Copie o conteúdo do arquivo `.env.example` para o `.env`
3. Configure as variáveis de ambiente necessárias:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Configuração do Banco de Dados

1. Acesse o [Supabase](https://supabase.com)
2. Crie uma nova organização (se necessário)
3. Crie um novo projeto
4. Na seção SQL Editor, execute os scripts de migração encontrados na pasta `migrations/`

### 5. Iniciando o Sistema

Para ambiente de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

Para build de produção:
```bash
npm run build
npm run preview
# ou
yarn build
yarn preview
```

## Configurando Nova Base de Dados

Para configurar o sistema em uma nova base de dados, siga estes passos:

1. Crie um novo projeto no Supabase
2. Atualize as variáveis de ambiente no arquivo `.env`:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

3. Execute os scripts de migração na nova base:
   - Acesse o SQL Editor do novo projeto Supabase
   - Execute todos os scripts da pasta `migrations/` em ordem cronológica

4. Verifique se todas as tabelas foram criadas corretamente
5. Configure os usuários iniciais e permissões necessárias

## Estrutura do Banco de Dados

Os scripts de migração estão organizados na pasta `migrations/` e devem ser executados na seguinte ordem:

1. Tabelas base (usuários, permissões)
2. Tabelas de negócio
3. Dados iniciais

## Suporte

Em caso de dúvidas ou problemas durante a instalação, entre em contato com:
[CONTATO_SUPORTE]

## Observações Importantes

- Mantenha sempre backups da base de dados
- Realize testes após qualquer migração
- Verifique as permissões de usuários após a configuração
- Mantenha o sistema e suas dependências atualizadas 