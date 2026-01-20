# Usa uma imagem leve do Node Linux (Alpine)
FROM node:18-alpine

# Cria a pasta de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de dependências
COPY package.json .

# Instala as dependências
RUN npm install

# Copia o resto do código (que vamos criar)
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]