# SPEC-015 — Migração do RAG para Node.js, LangChain.js e Kubernetes

| Campo         | Valor                                                        |
|---------------|--------------------------------------------------------------|
| **ID**        | SPEC-015                                                     |
| **Data**      | 2026-11-06                                                   |
| **Autor**     | Agente de IA (opencode)                                      |
| **Status**    | Aprovada pelo PO em 2026-11-06                               |
| **Versão**    | 1.0                                                          |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)        |
| **Origem**    | Missão de migração aprovada pelo PO                          |

---

## 1. Contexto e Motivação

O assistente RAG está em produção no Cloudflare Worker `elessandrodev-chat`, com
resiliência, cache e observabilidade entregues pela SPEC-014. A operação atual
funciona, mas limita a evolução do backend: runtime proprietário, acoplamento ao
Wrangler e dificuldade de portar o serviço para ambientes containerizados.

A migração deve preservar o comportamento factual do assistente, o índice RAG
existente e o frontend, substituindo apenas a camada de execução do backend por
Node.js + TypeScript + Express + LangChain.js, com empacotamento Docker e
implantação Kubernetes.

### Restrições absolutas

- Não fazer merge na `main`, deploy de produção ou alteração do Worker nesta branch.
- Não alterar DNS, secrets de produção ou o tráfego do site publicado.
- Não regenerar embeddings nem alterar corpus, chunking, retrieval ou prompt factual.
- Não simular testes, builds, deploys ou evidências de QA.

---

## 2. Objetivo

Entregar uma implementação paralela e verificável do backend RAG em Node.js,
mantendo o contrato `{ question, locale } → { response, sources }`, com paridade
de recuperação híbrida, testes determinísticos, Docker, manifests Kubernetes,
CI independente e documentação SDD.

---

## 3. Escopo

### Está incluído (IN)

**Backend**

- Node.js 24 + TypeScript strict + Express 5.
- LangChain.js para embeddings, retriever e geração.
- Leitura do índice existente `worker/rag/index.json` sem regeneração.
- Paridade com `shared/retrieval.js` e `worker/prompt.js`.
- Embeddings Cloudflare BGE-M3 e endpoint OpenAI-compatible (Ollama/vLLM).
- LLM OpenRouter via `ChatOpenAI`, fallback, retry, timeout, circuit breaker.
- Cache positivo/negativo, rate limit, CORS, Helmet, request-id, logs Pino.
- Endpoints `/health`, `/ready`, `/api/chat` e alias `/chat`.

**Frontend**

- Cliente HTTP apontando para o backend Node por padrão (`/api/chat`).
- Sem retries duplicados por padrão; resiliência fica no backend.
- Proxy local do Vite para `http://127.0.0.1:3201`.
- Compatibilidade com `VITE_CHAT_API_URL` para ambientes externos.

**Infraestrutura**

- Dockerfile multi-stage do backend e do frontend.
- `docker-compose` local para frontend + backend.
- Manifests Kubernetes em `k8s/base` e overlays `local`/`oracle` com Kustomize.
- Probes, resources, non-root, ConfigMap/Secret examples, NetworkPolicy.
- Workflow de CI para backend, frontend e validação de manifests, sem deploy.

**Documentação e SDD**

- SPEC, TASK, QA, REVIEW e ADRs da migração.
- `docs/ARCHITECTURE.md`, `MIGRATION_PLAN.md`, `SECURITY.md`,
  `LOCAL_DEVELOPMENT.md`, `KUBERNETES.md`, `TESTING.md`, `MIGRATION_REPORT.md`.
- Atualização de `PROJECT.md`, `CHANGELOG.md`, `README.md` e `ROADMAP.md`.

### Não está incluído (OUT)

- Merge na `main`, deploy em produção ou alteração do Worker ativo.
- Remoção do Cloudflare Worker ou do fluxo de fallback atual.
- Regeneração de embeddings, troca de modelo BGE-M3 ou mudança de corpus.
- Criação de secrets reais em repositório, cluster ou CI.

---

## 4. Critérios de Aceite

1. `backend` passa em `lint`, `typecheck`, `test` e `build`.
2. A suíte backend cobre RAG, paridade híbrida, prompt, HTTP, segurança, LLM,
   embeddings, retry, cache e configuração.
3. Nenhum teste padrão chama provedor externo pago.
4. Índice existente é lido com 36 chunks e 1024 dimensões, sem regeneração.
5. Frontend usa `/api/chat` por padrão e não duplica retries.
6. `npm test` e `npm run build` do frontend passam.
7. Dockerfiles constroem imagens não-root e `docker compose config` é válido.
8. Kustomize gera manifests válidos para `local` e `oracle`.
9. CI cobre backend, frontend e validação de infraestrutura sem deploy.
10. Documentação e artefatos SDD registram decisões, riscos e evidências.
11. Nenhum secret ou credencial real aparece em arquivos versionados.
12. Produção permanece inalterada durante a branch.

---

## 5. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Divergência entre retrieval Node e Worker | Teste de paridade numérico com o índice real |
| Custo de chamadas LLM nos testes | Provedores mockados e `LLM_MODE=mock` |
| Índice incompatível com o novo runtime | Loader valida dimensões e `sourceHash` |
| Frontend com retries duplicados | `maxRetries` padrão 0 e documentação explícita |
| Deploy acidental em produção | Workflow sem deploy; branch isolada; revisão humana |
| Secrets em manifests | Apenas `*.example`, `secretKeyRef` e documentação |

---

## 6. Aprovação

Aprovação explícita do PO registrada na mensagem “aprovado, continue próximo passo”
em 2026-11-06. A implementação deve permanecer estritamente dentro do escopo acima.
