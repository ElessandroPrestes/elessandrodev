# TASK-015 — Migração do RAG para Node.js, LangChain.js e Kubernetes

| Campo                | Valor                                                        |
|----------------------|--------------------------------------------------------------|
| **ID**               | TASK-015                                                     |
| **SPEC**             | SPEC-015                                                     |
| **ADRs**             | ADR-010, ADR-011, ADR-012                                    |
| **Data de início**   | 2026-11-06                                                   |
| **Data de conclusão**| 2026-11-07                                                   |
| **Agente**           | opencode / deepseek-v4.1-flash-free                          |
| **Status**           | ✅ Concluída (branch isolada; REVIEW-015 aprovada)            |

---

## Escopo da Implementação

> Baseado na SPEC-015 aprovada, esta TASK implementa estritamente:

- Backend Node.js + TypeScript + Express + LangChain.js.
- Paridade de retrieval híbrido e prompt com o Worker.
- Embeddings Cloudflare/OpenAI-compatible e LLM OpenRouter.
- Resiliência, cache, segurança, observabilidade e health checks.
- Cliente frontend apontando para o backend Node.
- Docker, Docker Compose e Kubernetes com Kustomize.
- CI independente, documentação, QA e revisão.

---

## Arquivos Criados

| Arquivo | Descrição |
|---|---|
| `backend/package.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js` | Base do backend |
| `backend/src/config/env.ts` | Configuração Zod |
| `backend/src/modules/rag/*` | Loader, híbrido, retriever e contexto |
| `backend/src/modules/embeddings/*` | Cloudflare, OpenAI-compatible e factory |
| `backend/src/modules/llm/*` | Prompt, LangChain/OpenRouter e mock |
| `backend/src/modules/chat/*` | Schema, service, controller, rotas e cache |
| `backend/src/middleware/*` | Request-id, logs, erros, rate limit e 404 |
| `backend/src/security/*` | CORS e headers |
| `backend/src/shared/*` | Erros, retry, circuit breaker, timeout, hash e texto |
| `backend/tests/*` | 55 testes determinísticos |
| `backend/Dockerfile`, `.env.example`, `.dockerignore` | Empacotamento |
| `specs/SPEC-015-*`, `tasks/TASK-015-*` | SDD |

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/config/aiConfig.js` | URL padrão `/api/chat`, retries padrão 0 e telemetria Node |
| `src/services/aiService.js` | Diagnóstico do backend Node e cache header |
| `src/services/aiService.test.mjs` | Testes do cliente Node e ausência de retry padrão |
| `vite.config.js` | Proxy `/api` para `127.0.0.1:3201` |
| `.env.example` | Variáveis do backend Node |
| `PROJECT.md`, `CHANGELOG.md`, `README.md`, `ROADMAP.md` | Documentação |
| `.github/workflows/*` | CI do backend/frontend/infra sem deploy |

---

## Checklist de Implementação

### Backend

- [x] Configuração Zod e variáveis documentadas
- [x] Loader do índice existente + validação de dimensões
- [x] Retrieval híbrido com paridade numérica
- [x] Prompt portado com regras de segurança
- [x] Embeddings Cloudflare BGE-M3 e OpenAI-compatible
- [x] LLM OpenRouter com fallback, retry, timeout e circuit breaker
- [x] Cache positivo/negativo e rate limit
- [x] CORS, Helmet, request-id e logs Pino
- [x] `/health`, `/ready`, `/api/chat` e `/chat`
- [x] 55 testes, lint, typecheck e build verdes

### Frontend

- [x] URL padrão `/api/chat`
- [x] Retries padrão 0 (backend é a fonte de resiliência)
- [x] Proxy Vite para a API local
- [x] Testes atualizados e verdes
- [x] Build de produção verde

### Infraestrutura

- [x] Dockerfile backend non-root
- [x] Dockerfile frontend non-root com proxy `/api`
- [x] `docker-compose` local
- [x] K8s base + overlays `local` e `oracle`
- [x] Probes, resources, secrets examples e NetworkPolicy
- [x] Validação com Kustomize

### CI e Documentação

- [x] Workflow de CI do backend
- [x] Workflow de CI do frontend
- [x] Validação de manifests no CI
- [x] ADR-010, ADR-011 e ADR-012
- [x] Documentos de arquitetura, migração, segurança, K8s e testes
- [x] QA-015 e REVIEW-015
- [x] `PROJECT.md`, `CHANGELOG.md`, `README.md` e `ROADMAP.md`

---

## Checklist de Validação

- [x] `backend`: `npm run lint`
- [x] `backend`: `npm run typecheck`
- [x] `backend`: `npm test` (55/55)
- [x] `backend`: `npm run build`
- [x] Frontend: `npm test` (49/49)
- [x] Frontend: `npm run build`
- [x] `docker compose config`
- [x] `kubectl kustomize k8s/overlays/local`
- [x] `kubectl kustomize k8s/overlays/oracle`
- [x] Build das imagens e verificação non-root
- [x] Smoke do container (`/health`, `/ready`, 400 e 403)
- [x] Varredura de segredos
- [x] Confirmação de que produção/Worker permanecem intactos

---

## Notas do Agente

- A branch `feature/migrate-rag-node-langchain-kubernetes` é independente.
- Nenhum merge, deploy ou alteração de produção será feito nesta TASK.
- O índice RAG e o corpus não são regenerados.
- O Worker atual permanece como rollback até a validação da nova stack.
- Evidências locais em `reviews/QA-015.md`; aprovação do PO em
  `reviews/REVIEW-015.md`.
- Relatório consolidado em `docs/MIGRATION_REPORT.md`.
