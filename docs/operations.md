# Operações — Assistente RAG

Runbook do Cloudflare Worker `elessandrodev-chat` sob a SPEC-016 / ADR-013.

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

## 2. Diagnóstico da resposta

| Cabeçalho | Uso |
|---|---|
| `X-Request-Id` | Correlaciona a resposta com o Workers Logs |
| `X-Assistant-Stage` | Etapa final: `cache`, `retrieval`, `openrouter`, `workers-ai` ou `contact` |
| `X-Assistant-Cache` | `HIT`, `MISS` ou `OFF` |
| `X-Assistant-Provider` | Provedor que gerou a resposta, inclusive no hit |

`origin` no corpo informa `llm`, `cache`, `retrieval-only` ou `contact`.
Uma resposta de contingência bem-sucedida usa HTTP 200. Um erro de validação
de entrada continua usando seu código HTTP próprio.

## 3. Logs e métricas

O Worker emite eventos JSON por decisão. Use `requestId` para correlacionar as etapas
da mesma consulta. Nos Workers Logs, agregue os seguintes campos:

| Métrica | Filtro e agrupamento |
|---|---|
| Cache | `stage = cache`, por `outcome` (`hit`, `miss`, `off`) |
| Geração | `stage = generation`, por `provider` e `outcome`. Use `durationMs` para latência |
| Breaker | `stage = breaker`, por `outcome` (`open`, `closed`, `probe`, `stale`, `unknown`) e `shared` |
| Degradação | Respostas finais com `origin = retrieval-only` ou `origin = contact` e `stage = retrieval` |
| Redis indisponível | `stage = redis`, `outcome = unavailable`, `level = warn` |
| Cota por visitante | `stage = rate-limit`, `outcome = limited` |

Se o breaker ficar aberto, confira `stage = generation` para identificar cota, timeout
ou falha do primário. Se a origem for `contact`, confira a etapa `retrieval` e
distinga `unavailable` de `no-results`. Para falhas de embeddings, confirme o
binding `AI` e rode `npm run rag:check`. A configuração de timeouts e variáveis
fica no [README](../README.md#2-variáveis-de-ambiente).

## 4. Simulações locais

Rode `node --test --test-name-pattern='<filtro>' worker/index.test.mjs`.
Os testes interceptam o transporte e usam o índice versionado. A tabela mostra
o filtro, a condição injetada e o resultado esperado, sem chamadas externas.

| Filtro | Condição | Resultado |
|---|---|---|
| `Cache: miss` | Redis vazio e OpenRouter saudável. Em seguida, 429 e consulta equivalente | `llm` no miss e `cache` no hit, sem novo embedding nem LLM |
| `Cota 429` | Resposta de cota do OpenRouter, com e sem alternativo | Workers AI ou `retrieval-only` |
| `Timeout do OpenRouter` | Requisição pendente até o abort | Workers AI dentro do orçamento |
| `5xx em ambos` | HTTP 503 e erro no alternativo | Trechos a cada miss |
| `Breaker:` | Três 429, relógio controlado e duas consultas após cooldown | Sem OpenRouter no cooldown. Uma única sondagem depois |
| `Redis fora do ar\|Timeout do Redis` | HTTP 503 ou Redis pendente até o abort | Aviso e fluxo segue sem cache |
| `Rate limit` | Contador excedido ou rejeição do binding em contingência | Hit ou trechos sem chamar geração |
| `Sem nenhum LLM` | Ambos os provedores desativados | Trechos com fontes |
| `Falha total\|Dimensão` | Embedding lança erro ou retorna vetor de dimensão inválida | LinkedIn e e-mail, sem erro técnico |

## 5. Checklist de deploy do Worker

```bash
npm run models:check
npm test
npm run rag:check
npx wrangler deploy --dry-run
npx wrangler deploy
curl -s https://elessandrodev-chat.elessandrodev.workers.dev/health
```

Com os secrets Redis e um modelo ativo configurados, valide uma pergunta inédita e a repetição dela:

```bash
curl -i -X POST https://elessandrodev-chat.elessandrodev.workers.dev/ \
  -H 'Origin: https://elessandroprestes.github.io' \
  -H 'Content-Type: application/json' \
  -d '{"question":"Qual a experiência com sistemas legados?","locale":"pt"}'
```

Espere `200`, `X-Request-Id`, `X-Assistant-Stage` e, na repetição,
`X-Assistant-Cache: HIT`.

---

## 6. Rollback

1. Reverta o commit problemático no repositório.
2. Rode os quality gates novamente.
3. Publique com `npx wrangler deploy`.
4. Confirme `GET /health` e uma pergunta real.

O deploy do Worker é manual; não há rollback automático no pipeline atual.
