# Estágio de desenvolvimento
FROM node:lts-alpine AS dev

WORKDIR /app

# Instala dependências primeiro (cache de camadas)
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
