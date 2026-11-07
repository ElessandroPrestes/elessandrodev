# Contexto de build: raiz do repositório.
# docker build -f backend/Dockerfile -t elessandrodev-backend:local .

FROM node:24-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

FROM deps AS build
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3201
ENV RAG_INDEX_PATH=/app/data/rag-index.json

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY backend/package.json ./package.json
COPY worker/rag/index.json ./data/rag-index.json

USER app
EXPOSE 3201

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3201/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
