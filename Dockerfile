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

# Modifica o script de build para usar o comando 'cp' do Linux em vez de 'copy' do Windows
RUN sed -i 's/copy .htaccess dist\\/cp .htaccess dist\//g' package.json

# Executa o build
RUN npm run build

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