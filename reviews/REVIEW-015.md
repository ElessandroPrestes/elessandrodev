# REVIEW-015 — Revisão Técnica da SPEC-015

| Campo        | Valor                                                              |
|--------------|--------------------------------------------------------------------|
| **ID**       | REVIEW-015                                                         |
| **SPEC**     | SPEC-015                                                           |
| **TASK**     | TASK-015                                                           |
| **QA**       | QA-015                                                             |
| **ADRs**     | ADR-010, ADR-011, ADR-012                                          |
| **Data**     | 2026-11-07                                                         |
| **Revisor**  | Elessandro Prestes Macedo (Product Owner & Tech Lead)              |
| **Resultado**| ✅ Aprovado pelo PO em 2026-11-07 (branch isolada, sem deploy)      |

> Este documento registra a verificação técnica feita pelo agente. A aprovação
> final é humana e não foi presumida nesta branch.

---

## 1. Verificação de Escopo

### Backend

- [x] Node.js 24 + TypeScript strict + Express 5.
- [x] Configuração Zod validada na inicialização.
- [x] Loader do índice existente sem regeneração.
- [x] Paridade de retrieval híbrido com `shared/retrieval.js`.
- [x] Paridade de prompt com `worker/prompt.js`.
- [x] Embeddings Cloudflare BGE-M3 e OpenAI-compatible.
- [x] LLM OpenRouter via LangChain com fallback, retry, timeout e circuit breaker.
- [x] Cache positivo/negativo e rate limit.
- [x] CORS, Helmet, request-id, logs Pino e shutdown gracioso.
- [x] `/health`, `/ready`, `/api/chat` e `/chat`.
- [x] 55 testes determinísticos sem chamadas pagas.

### Frontend

- [x] `VITE_CHAT_API_URL` padrão `/api/chat`.
- [x] `VITE_LLM_MAX_RETRIES` padrão `0`.
- [x] Proxy do Vite para `127.0.0.1:3201`.
- [x] Diagnóstico com `X-Assistant-Cache`.
- [x] `npm test` e `npm run build` verdes.

### Infraestrutura

- [x] Dockerfile backend multi-stage non-root.
- [x] Dockerfile frontend `nginx-unprivileged` com proxy `/api`.
- [x] `docker-compose.yml` com backend + frontend e healthchecks.
- [x] `k8s/base` + overlays `local` e `oracle`.
- [x] Probes, resources, non-root, ConfigMap, Secret de exemplo e NetworkPolicy.
- [x] `docker compose config` válido.
- [x] Kustomize válido nos dois overlays.
- [x] Build local das duas imagens e UID diferente de zero.

### CI e SDD

- [x] Workflow backend com lint, typecheck, test e build.
- [x] Workflow frontend com test e build.
- [x] Workflow de infraestrutura com Compose, Kustomize e builds.
- [x] Nenhum workflow com deploy ou secrets de produção.
- [x] SPEC-015, TASK-015, QA-015 e ADR-010/011/012.
- [x] Documentação de arquitetura, migração, segurança, dev local, K8s e testes.
- [x] `PROJECT.md`, `CHANGELOG.md`, `README.md` e `ROADMAP.md` atualizados.

---

## 2. Evidências

- Backend: `lint`, `typecheck`, **55/55** testes e `build`.
- Frontend: **49/49** testes e `npm run build`.
- Imagens: backend UID 100, frontend UID 101.
- `docker compose config --quiet`: exit 0.
- `kustomize build`: exit 0 em `local` e `oracle`.
- Smoke: `/health` 200, `/ready` 503 esperado sem credenciais, 400 para pergunta
  vazia e 403 para origem inválida.
- QA completo em `reviews/QA-015.md`.

---

## 3. Restrições Absolutas da SPEC

- [x] Sem merge na `main`.
- [x] Sem deploy de produção.
- [x] Sem alteração do Worker, DNS ou secrets de produção.
- [x] Sem regeneração de embeddings nem alteração de corpus/chunking/retrieval.
- [x] Sem simulação de testes, builds ou evidências.

---

## 4. Pendências Antes da Aprovação

- [x] Revisão humana do diff completo pelo PO.
- [x] Decisão de aprovação registrada em 2026-11-07, restrita à branch.
- [ ] Validação em cluster real (fora desta branch).
- [ ] Definição de host, TLS e secrets do overlay `oracle`.
- [ ] Confirmação operacional em produção antes de qualquer corte.
- [ ] Decisão sobre desligamento do Worker em SPEC posterior.

---

## 5. Decisão

Status: **aprovado pelo PO em 2026-11-07**, dentro do escopo da SPEC-015 e da
branch `feature/migrate-rag-node-langchain-kubernetes`. A aprovação não autoriza
merge, deploy, troca de tráfego ou desligamento do Worker; essas ações continuam
condicionadas a validação em cluster e SPEC posterior.
