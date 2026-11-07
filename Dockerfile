# Imagem do frontend (Vue + Vite) servida por Nginx non-root.
# Contexto de build: raiz do repositório.
# docker build -t elessandrodev-frontend:local .

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src

# No container a SPA é servida na raiz, sem o prefixo do GitHub Pages.
RUN npm run build -- --base=/

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
