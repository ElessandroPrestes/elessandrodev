# Arquitetura do Sistema — elessandrodev

> Visão arquitetural do portfólio e do assistente RAG.

---

## 1. Topologia da Solução

```
[Navegador / Visitante]
         │
         ├───► GitHub Pages (SPA Vue 3 + Vite)
         │         └─── AiAssistant.vue
         │                   │ POST { question, locale }
         │                   ▼
         └───► Cloudflare Worker (elessandrodev-chat)
                   ├─── Cache RAG-aware (Cache API, chave com sourceHash)
                   ├─── Workers AI: embedding da pergunta (@cf/baai/bge-m3)
                   ├─── Índice RAG versionado (worker/rag/index.json)
                   ├─── Recuperação híbrida: cosseno + BM25
                   ├─── Threshold de relevância e fontes
                   ├─── OpenRouter: geração com cadeia de modelos free
                   └─── Workers AI: fallback de geração em 429/5xx
```

O frontend é estático. A chave da OpenRouter existe apenas como secret do Worker; nunca é embutida no bundle do GitHub Pages.

---

## 2. Decisões Arquiteturais

1. **Frontend estático no GitHub Pages:** SPA Vue 3 sem servidor próprio, com deploy via GitHub Actions.
2. **Backend no Cloudflare Worker:** concentra a chave do provedor de LLM, o índice RAG e as regras de segurança.
3. **RAG real com corpus Markdown:** o conteúdo profissional fica em `knowledge/rag/`, é dividido em chunks por seção e indexado com embeddings multilíngues.
4. **Recuperação híbrida:** combina similaridade de cosseno com BM25 lexical (`HYBRID_ALPHA=0.6`), reduzindo falhas em perguntas com termos exatos.
5. **Threshold e fallback:** se nenhum chunk atinge `MIN_SCORE=0.45`, o Worker responde sem chamar o LLM. Se a cadeia OpenRouter falha, o Worker tenta o Workers AI com o mesmo prompt.
6. **Cache RAG-aware:** respostas fundamentadas são cacheadas por `SHA-256(locale + pergunta normalizada + sourceHash + embeddingModel)`. Cache hit não gera embedding nem chamada de LLM; reindexar o corpus invalida a chave.
7. **Citação de fontes:** a resposta retorna `{ response, sources }`; a UI mostra seção e score de cada fonte.
8. **Composables nativos:** tema e idioma sem stores globais.

---

## 3. Ciclo do Índice RAG

```bash
npm run rag:index   # gera worker/rag/index.json com embeddings
npm run rag:eval    # mede hit@4, MRR e cobertura do threshold
npm run rag:check   # valida sourceHash e consistência sem chamar APIs
```

O `rag:check` roda no CI e falha se o índice divergir do corpus.

Uma mudança de `sourceHash` também invalida automaticamente as entradas de cache, porque o hash do índice entra na chave.

---

## 4. Resiliência e Limites de Provedor

A OpenRouter aplica o limite gratuito por conta (~20 req/min e ~50 req/dia), compartilhado entre todos os modelos `:free`. Desde a SPEC-014, o fluxo é:

1. O Worker valida Origin, rota, payload e rate limit por IP (`CHAT_RATE_LIMITER`).
2. Consulta o cache positivo antes do embedding; em miss, consulta o cache negativo de `503`.
3. Tenta os modelos válidos de `MODELS` em ordem, respeitando `WORKER_BUDGET_MS`.
4. Se receber `429` com `X-RateLimit-Remaining: 0`, interrompe a cadeia e aciona o Workers AI.
5. O circuit breaker exclui temporariamente modelo/provedor que falhou em sequência.
6. Se o Workers AI também falhar, responde `429` com `Retry-After` ou `503` com
   `X-Assistant-Stage` e `X-Request-Id`.
7. O cliente não retenta `429`; retries ficam restritos a rede, timeout e `5xx`.

Cada chamada de provedor usa o menor valor entre seu timeout específico e o tempo
restante do orçamento total. O cliente usa timeout maior que o orçamento do Worker
para não desistir antes do fim da cadeia.

O cache positivo é opt-out (`ENABLE_CACHE=false`) e tem TTL configurável
(`CACHE_TTL_SECONDS`). O cache negativo é exclusivo para `503`, dura no máximo 60 s
e expõe `X-Assistant-Cache: NEGATIVE`; `429` nunca é cacheado.

### Observabilidade

O Worker emite um log JSON por requisição com `requestId`, `questionHash`, `stage`,
`outcome`, `provider`, `model`, `providerStatus`, `cache`, `timings` e `attempts`.
Workers Logs está habilitado em `wrangler.toml`. `GET /health` permite monitoramento
sem IA. O runbook está em [`operations.md`](operations.md).

---

## 5. Segurança

- `OPENROUTER_API_KEY` é configurada via `wrangler secret put`, nunca em `.env` de produção.
- `CLOUDFLARE_API_TOKEN` de ingestão fica em `.env.ingest` (ignorado pelo Git).
- CORS restrito a `https://elessandroprestes.github.io`, `http://localhost:5212`, `http://127.0.0.1:5212` e `http://elessandrodev.localhost`.
- Limites de payload (2000 bytes) e pergunta (500 caracteres).
- Rate limit por IP na rota de chat (10 req/60 s), sem aplicar em `GET /health`.
- Logs usam `questionHash`, nunca a pergunta crua, e não incluem prompt ou chave.
- Prompt instrui o modelo a usar apenas o contexto recuperado e a recusar informações ausentes.
- O cache armazena apenas resposta e fontes públicas; a chave usa hash da pergunta e nunca guarda prompt, chave ou dados sensíveis.
