# Relatório de Migração — SPEC-015

| Campo | Valor |
|---|---|
| **Branch** | `feature/migrate-rag-node-langchain-kubernetes` |
| **Data** | 2026-11-07 |
| **Status** | Implementação aprovada pelo PO; sem merge ou deploy |
| **Produção** | Inalterada (GitHub Pages + Worker `elessandrodev-chat`) |

## 1. Entregue

### Backend (`backend/`)

- Node.js 24, TypeScript strict, Express 5.
- Loader do índice existente com 36 chunks, 1024 dimensões e `sourceHash`.
- Retrieval híbrido com paridade numérica e prompt grounded portado.
- Embeddings Cloudflare BGE-M3 e OpenAI-compatible.
- LLM OpenRouter via LangChain com fallback, retry, timeout e circuit breaker.
- Cache positivo/negativo, rate limit, CORS, Helmet, request-id e logs Pino.
- `/health`, `/ready`, `/api/chat` e `/chat`.
- 55 testes determinísticos, lint, typecheck e build verdes.

### Frontend

- `VITE_CHAT_API_URL` padrão `/api/chat`.
- `VITE_LLM_MAX_RETRIES` padrão `0`.
- Proxy do Vite para `127.0.0.1:3201`.
- Diagnóstico com `X-Assistant-Cache`.
- `npm test` 49/49 e `npm run build` verdes.

### Infraestrutura

- Backend multi-stage non-root com healthcheck.
- Frontend `nginx-unprivileged` com proxy `/api`.
- `docker-compose.yml` com backend + frontend e healthchecks.
- `k8s/base` + overlays `local` e `oracle` com Kustomize.
- Probes, resources, non-root, ConfigMap, Secret de exemplo e NetworkPolicy.
- Workflows `backend.yml`, `frontend.yml` e `infra.yml`, sem deploy.

### SDD

- SPEC-015, TASK-015, QA-015, REVIEW-015.
- ADR-010, ADR-011, ADR-012.
- Documentos de arquitetura, plano, segurança, dev local, K8s, testes e este
  relatório.

## 2. Evidências

### Backend

```
λ npm run lint && npm run typecheck && npm test && npm run build
Test Files  10 passed (10)
Tests       55 passed (55)
```

### Frontend

```
λ npm test
Resultado: 19/19 testes passaram.
Resultado: 10/10 testes do prompt passaram.
Resultado: 20/20 testes do Worker passaram.

λ npm run build
✓ built in 6.15s
```

### Imagens

```
λ docker build -f backend/Dockerfile -t elessandrodev-backend:ci .
λ docker build -t elessandrodev-frontend:ci .
λ docker run --rm --entrypoint id elessandrodev-backend:ci
uid=100(app) gid=101(app)
λ docker run --rm --entrypoint id elessandrodev-frontend:ci
uid=101(nginx) gid=101(nginx)
```

### Compose e Kustomize

```
λ docker compose config --quiet
exit 0

λ kustomize build k8s/overlays/local
exit 0

λ kustomize build k8s/overlays/oracle
exit 0
```

### Smoke do container

Com `LLM_MODE=mock` e `EMBEDDINGS_PROVIDER=none`:

- `GET /health` → 200, com `X-Request-Id` e headers Helmet.
- `GET /ready` → 503 esperado, com `index: true`, `embeddings: false`,
  `llm: true`, `chunkCount: 36`, `dimensions: 1024`.
- `POST /api/chat` com pergunta vazia → 400 localizado.
- `POST /api/chat` com origem não permitida → 403 antes de processar.

### Compose end-to-end

```
λ docker compose up -d --build
elessandrodev-backend-1    Up (healthy)   0.0.0.0:3201->3201/tcp
elessandrodev-frontend-1   Up (healthy)   0.0.0.0:5212->8080/tcp

λ curl http://127.0.0.1:5212/
200

λ curl http://127.0.0.1:5212/health
{"status":"ok","chunkCount":36,"sourceHash":"a8ed790e..."}
```

O proxy `/api` e `/health` do Nginx alcança o serviço `backend` na rede do
Compose. Sem credenciais, `/ready` responde 503, como esperado.

## 3. Fora do escopo / pendente

- Merge na `main`, deploy e troca de tráfego.
- Configuração de DNS, TLS e secrets reais.
- Desligamento do Worker (exige SPEC posterior).
- Regeneração de embeddings ou alteração de corpus (proibidas).
- Deploy real em cluster e teste de carga.

## 4. Riscos residuais

| Risco | Estado |
|---|---|
| Cache/rate limit por réplica | Aceito e documentado em ADR-012 |
| Host e TLS do Ingress são placeholders | Ajuste manual antes do deploy |
| Sem HPA/PDB | Volume atual não exige; avaliar em produção |
| Divergência sutil em produção | Paridade testada; comparar respostas antes do corte |
| Worker e Node evoluírem separados | Rollback mantido e documentado |

## 5. Rollback

Enquanto o Worker existir, o rollback é reverter `VITE_CHAT_API_URL` para a URL do
Worker e descartar os manifests. Nenhuma alteração desta branch toca produção.
