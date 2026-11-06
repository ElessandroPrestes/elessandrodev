# Operações — Assistente RAG

Runbook do Cloudflare Worker `elessandrodev-chat` sob a SPEC-014 / ADR-009.

---

## 1. Superfície de operação

| Recurso | Valor |
|---|---|
| Worker | `elessandrodev-chat` |
| URL | `https://elessandrodev-chat.elessandrodev.workers.dev` |
| Rotas de chat | `POST /` e `POST /chat` |
| Saúde | `GET /health` (sem IA, sem Origin, sem rate limit) |
| Frontend | GitHub Pages via GitHub Actions |
| Deploy do Worker | manual com `npx wrangler deploy` |

### `GET /health`

```bash
curl -s https://elessandrodev-chat.elessandrodev.workers.dev/health
```

```json
{
  "status": "ok",
  "version": 1,
  "chunkCount": 36,
  "sourceHash": "a8ed790e...",
  "cacheEnabled": true,
  "modelsConfigured": 2
}
```

Esse endpoint não chama IA, não lê o cache e não aplica rate limit. Use-o em
monitoramento externo.

---

## 2. Cabeçalhos de diagnóstico

| Cabeçalho | Quando aparece | Uso |
|---|---|---|
| `X-Request-Id` | Toda resposta | Correlaciona a resposta com o log JSON |
| `X-Assistant-Stage` | Sucesso e erros de geração | Indica a etapa: `cache`, `embedding`, `retrieval`, `openrouter`, `workers-ai`, `rate-limit` |
| `X-Assistant-Cache` | Rotas de chat | `HIT`, `MISS`, `NEGATIVE` ou `OFF` |
| `X-Assistant-Provider` | Sucesso com geração | `openrouter`, `workers-ai` ou `cache` |

O cliente registra `X-Request-Id` e `X-Assistant-Stage` no console quando ocorre
erro. Peça esse `requestId` ao visitante para localizar o evento no Workers Logs.

---

## 3. Logs estruturados

O Worker emite uma linha JSON por requisição:

```json
{
  "event": "assistant",
  "requestId": "uuid",
  "questionHash": "sha256",
  "stage": "workers-ai",
  "outcome": "fallback",
  "provider": "workers-ai",
  "model": "@cf/meta/llama-3.1-8b-instruct-fp8",
  "providerStatus": 200,
  "cache": "MISS",
  "timings": {
    "embeddingMs": 120,
    "retrievalMs": 8,
    "generationMs": 4300,
    "totalMs": 4450
  },
  "attempts": []
}
```

`outcome` assume `ok`, `fallback`, `rate_limited` ou `unavailable`. A pergunta
crua, o prompt e o corpo de erro do provedor nunca são logados.

Workers Logs está habilitado em `wrangler.toml`:

```toml
[observability]
enabled = true
head_sampling_rate = 1
```

Reduza `head_sampling_rate` se o volume de logs crescer.

---

## 4. Diagnóstico por sintoma

### 4.1 `503` com `X-Assistant-Stage: workers-ai`

- O fallback estourou o timeout ou falhou.
- Verifique `timings.generationMs` e `attempts` no log.
- Se recorrente, aumente `WORKERS_AI_TIMEOUT_MS` ou reduza
  `WORKERS_AI_MAX_TOKENS`.
- O budget total (`WORKER_BUDGET_MS`) sempre prevalece sobre o timeout da etapa.

### 4.2 `503` com `X-Assistant-Stage: openrouter`

- Todos os modelos falharam antes do fallback, ou o orçamento acabou.
- Confira se `npm run models:check` está verde.
- Verifique `providerStatus` em `attempts`.
- Se o circuit breaker estiver aberto, aguarde `CIRCUIT_BREAKER_MS` ou faça deploy
  de uma correção.

### 4.3 `429` com `X-Assistant-Stage: rate-limit`

- O rate limit por IP (10 req/60 s) foi excedido.
- Não é cota de IA; a resposta não consumiu Workers AI nem OpenRouter.
- Ajuste o binding `CHAT_RATE_LIMITER` em `wrangler.toml` se necessário.

### 4.4 `429` com `X-Assistant-Stage: openrouter|workers-ai`

- Cota gratuita esgotada nos dois provedores.
- Respeite o `Retry-After` retornado.
- O cache negativo não se aplica a `429`.

### 4.5 `503` com `X-Assistant-Cache: NEGATIVE`

- Uma falha `503` recente foi cacheada por até 60 s.
- Aguarde o TTL ou use uma pergunta diferente para testar a recuperação.
- Desative o cache negativo com `ENABLE_CACHE=false` se precisar investigar ao vivo.

### 4.6 `503` com `X-Assistant-Stage: embedding` ou `retrieval`

- Falha no Workers AI de embeddings ou dimensão incompatível no índice.
- Rode `npm run rag:check`; se o índice estiver inconsistente, reindexe com
  `npm run rag:index`.
- Confirme que o binding `AI` está presente no Worker.

---

## 5. Variáveis operacionais

| Variável | Padrão | Efeito |
|---|---|---|
| `WORKER_BUDGET_MS` | `25000` | Teto total da geração no Worker |
| `MIN_CALL_BUDGET_MS` | `2000` | Margem mínima para iniciar uma chamada |
| `OPENROUTER_TIMEOUT_MS` | `8000` | Timeout por modelo OpenRouter |
| `WORKERS_AI_TIMEOUT_MS` | `12000` | Timeout do fallback Workers AI |
| `OPENROUTER_MAX_TOKENS` | `3000` | Tokens de saída da OpenRouter |
| `WORKERS_AI_MAX_TOKENS` | `768` | Tokens de saída do fallback |
| `CIRCUIT_BREAKER_THRESHOLD` | `3` | Falhas consecutivas para abrir o breaker |
| `CIRCUIT_BREAKER_MS` | `60000` | Janela de exclusão do breaker |
| `NEGATIVE_CACHE_TTL_SECONDS` | `60` | TTL máximo do cache negativo de `503` |
| `VITE_LLM_TIMEOUT_MS` | `35000` | Timeout do cliente; deve ser maior que o budget |

O timeout do cliente precisa ser maior que `WORKER_BUDGET_MS`; caso contrário, o
navegador desiste antes do Worker concluir.

---

## 6. Checklist de deploy do Worker

```bash
npm run models:check
npm test
npm run rag:check
npx wrangler deploy --dry-run
npx wrangler deploy
curl -s https://elessandrodev-chat.elessandrodev.workers.dev/health
```

Valide também uma pergunta inédita e a repetição dela:

```bash
curl -i -X POST https://elessandrodev-chat.elessandrodev.workers.dev/ \
  -H 'Origin: https://elessandroprestes.github.io' \
  -H 'Content-Type: application/json' \
  -d '{"question":"Qual a experiência com sistemas legados?","locale":"pt"}'
```

Espere `200`, `X-Request-Id`, `X-Assistant-Stage` e, na repetição,
`X-Assistant-Cache: HIT`.

---

## 7. Rollback

1. Reverta o commit problemático no repositório.
2. Rode os quality gates novamente.
3. Publique com `npx wrangler deploy`.
4. Confirme `GET /health` e uma pergunta real.

O deploy do Worker é manual; não há rollback automático no pipeline atual.
