# Desenvolvimento Local

> Documento da SPEC-015. Portas seguem o padrão do repositório: frontend 5212 e
> backend 3201, ambas em modo estrito.

## 1. Pré-requisitos

- Node.js 24 (frontend e backend).
- npm.
- Docker e Docker Compose (opcional para a stack completa).
- kubectl e Kustomize (opcional para validar manifests).

## 2. Backend

```bash
cd backend
cp .env.example .env
npm ci
npm run dev
```

O backend sobe em `http://127.0.0.1:3201`. Para desenvolvimento sem provedores
externos:

```bash
LLM_MODE=mock EMBEDDINGS_PROVIDER=none npm run dev
```

`EMBEDDINGS_PROVIDER=none` mantém `/ready` em 503, mas permite testar rotas e
erros controlados. Para RAG real, preencha `CLOUDFLARE_ACCOUNT_ID`,
`CLOUDFLARE_API_TOKEN` e `OPENROUTER_API_KEY`.

Verificações:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 3. Frontend

```bash
cp .env.example .env
npm ci
npm run dev
```

O Vite serve em `http://localhost:5212` e faz proxy de `/api` para
`http://127.0.0.1:3201`. O padrão de `VITE_CHAT_API_URL` é `/api/chat` e
`VITE_LLM_MAX_RETRIES` é `0`: o backend é a fonte de resiliência.

## 4. Stack completa com Docker Compose

```bash
cp backend/.env.example backend/.env
# preencha as chaves em backend/.env
docker compose build
docker compose up
```

- Frontend: `http://localhost:5212`
- Backend: `http://localhost:3201`
- Health: `http://localhost:3201/health` e `/ready`

O Compose não exige `backend/.env` para validar a configuração, mas sem as chaves
os provedores ficam indisponíveis e `/ready` responde 503.

## 5. Kubernetes local

```bash
docker build -f backend/Dockerfile -t elessandrodev-backend:local .
docker build -t elessandrodev-frontend:local .
kubectl kustomize k8s/overlays/local | kubectl apply -f -
kubectl get pods -l app.kubernetes.io/part-of=elessandrodev
```

Em clusters locais, carregue as imagens no runtime (por exemplo,
`minikube image load` ou `kind load docker-image`) antes de aplicar.

## 6. Problemas comuns

| Sintoma | Causa provável | Ação |
|---|---|---|
| `/ready` 503 | Sem chaves de embeddings/LLM | Configurar `backend/.env` |
| Frontend sem resposta | Backend fora do ar | `docker compose ps` e logs do backend |
| CORS 403 | Origem fora da allowlist | Ajustar `CORS_ORIGINS` |
| Porta ocupada | Serviço anterior ativo | Encerrar processo ou usar a porta registrada |
| Imagem não encontrada no cluster | Imagem só no host | Carregar no runtime local |
