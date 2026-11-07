# Testes — Backend e Frontend

> Documento da SPEC-015.

## 1. Frontend

```bash
npm test
npm run build
```

- `node src/services/aiService.test.mjs` cobre sucesso, retry, 429, 400, resposta
  vazia, rede, timeout, URL ausente, retries padrão 0 e diagnóstico.
- `node worker/prompt.test.mjs` e `node worker/index.test.mjs` permanecem na
  suíte para garantir que o Worker de rollback não regrediu.

## 2. Backend

```bash
cd backend
npm run lint
npm run typecheck
npm test
npm run build
```

Suíte determinística com Vitest e Supertest, sem chamadas pagas por padrão.

| Arquivo | Cobertura |
|---|---|
| `hybrid-parity.test.ts` | Paridade numérica do retrieval híbrido com `shared/retrieval.js` |
| `prompt-parity.test.ts` | Paridade do prompt com `worker/prompt.js` |
| `rag.test.ts` | Loader, dimensões e `sourceHash` |
| `chat.http.test.ts` | `/api/chat`, `/health`, `/ready`, 400/403/413/405/429 e headers |
| `security.test.ts` | CORS, payload e respostas controladas |
| `llm.test.ts` | Cadeia de modelos, fallback, timeout e circuit breaker |
| `embeddings.test.ts` | Cloudflare, OpenAI-compatible e retry |
| `retry.test.ts` | Backoff, transient errors e orçamento |
| `cache.test.ts` | Cache positivo e negativo |
| `config.test.ts` | Defaults e parsing de ambiente |

## 3. Isolamento de provedores

- `LLM_MODE=mock` no ambiente de teste.
- `EMBEDDINGS_PROVIDER=none` quando o teste não injeta um cliente falso.
- `fetch` é mockado nos testes que simulam HTTP.
- Nenhum teste padrão consome créditos da OpenRouter ou Cloudflare.

## 4. Evidências atuais

```
λ npm run lint && npm run typecheck && npm test && npm run build
Test Files  10 passed (10)
Tests       55 passed (55)
```

Frontend:

```
λ npm test
Resultado: 20/20 testes do Worker passaram.

λ npm run build
✓ built in 6.15s
```

## 5. Infraestrutura

```bash
docker compose config --quiet
kubectl kustomize k8s/overlays/local
kubectl kustomize k8s/overlays/oracle
docker build -f backend/Dockerfile -t elessandrodev-backend:ci .
docker build -t elessandrodev-frontend:ci .
```

A CI executa os mesmos comandos sem deploy.
