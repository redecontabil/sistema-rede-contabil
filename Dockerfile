# Estágio de Build
FROM node:20-alpine AS builder

# Diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências para aproveitar o cache
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm ci

# Copia o restante do código
COPY . .

# Não vamos mais modificar o package.json, em vez disso executaremos cada comando separadamente

# Executa a verificação do TypeScript
RUN ./node_modules/.bin/tsc

# Executa o build do Vite
RUN ./node_modules/.bin/vite build

# Copia o arquivo .htaccess para a pasta dist (não falha se o arquivo não existir)
RUN cp .htaccess dist/ || true

# Estágio de Produção
FROM nginx:stable-alpine

# Copia os arquivos de build do estágio anterior para o diretório do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia o arquivo de configuração do Nginx para suportar roteamento SPA
# Você precisará criar este arquivo separadamente
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"] 