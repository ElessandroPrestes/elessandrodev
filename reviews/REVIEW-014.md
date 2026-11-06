# REVIEW-014 — Revisão Técnica da SPEC-014

| Campo        | Valor                                                                    |
|--------------|--------------------------------------------------------------------------|
| **ID**       | REVIEW-014                                                               |
| **SPEC**     | SPEC-014                                                                 |
| **TASK**     | TASK-014                                                                 |
| **QA**       | QA-014                                                                   |
| **ADR**      | ADR-009                                                                  |
| **Data**     | 2026-11-06                                                               |
| **Revisor**  | Elessandro Prestes Macedo (Product Owner & Tech Lead)                    |
| **Resultado**| ✅ Aprovado sem Ressalvas                                                |

---

## 1. Verificação de Escopo

- [x] `MODELS` corrigido para IDs existentes; `minimax/minimax-m3.1-flash:free` removido.
- [x] `npm run models:check` valida os IDs no catálogo público e roda no CI.
- [x] `WORKER_BUDGET_MS` limita o tempo total; cada chamada usa o menor valor entre seu timeout e o restante do orçamento.
- [x] `MIN_CALL_BUDGET_MS` impede chamadas sem margem.
- [x] `VITE_LLM_TIMEOUT_MS` padrão de 35000 ms, acima do orçamento do Worker.
- [x] `WORKERS_AI_MAX_TOKENS` configurável com padrão 768.
- [x] Circuit breaker abre após 3 falhas e expira em 60 s; não é acionado por `429`.
- [x] Cache negativo apenas para `503`, com TTL máximo de 60 s e `X-Assistant-Cache: NEGATIVE`.
- [x] `429` nunca é cacheado.
- [x] `X-Request-Id` em todas as respostas; `X-Assistant-Stage` em sucesso e erros de geração.
- [x] Log JSON com `requestId`, `stage`, `outcome`, `provider`, `model`, `providerStatus`, `cache`, `timings`, `questionHash` e `attempts`.
- [x] Workers Logs habilitado com `head_sampling_rate` configurável.
- [x] Rate limit por IP (10 req/60 s) sem aplicar em `GET /health`.
- [x] `GET /health` responde `200` sem IA, sem Origin e sem rate limit.
- [x] Retrieval em `try/catch`; dimensão incompatível retorna `503` com `X-Assistant-Stage: retrieval`.
- [x] Cliente registra `X-Request-Id`/`X-Assistant-Stage` no console em caso de erro.
- [x] Contrato `{ question, locale } → { response, sources }` inalterado.
- [x] Corpus, chunking, retrieval e modelo de embeddings inalterados.
- [x] Nenhuma credencial nova; `OPENROUTER_API_KEY` permanece como secret.

---

## 2. Evidências

- `npm test`: **48/48** (18 cliente, 10 prompt, 20 Worker).
- `models:check`: **2 modelos** válidos no catálogo público.
- `rag:check`: **36 chunks**, 365.0 KB, `sourceHash` consistente.
- `rag:eval`: hit@4 **100%**, MRR **0.975**, cobertura **100%**.
- `npm run build`: **211.55 kB**, sem erros; bundle sem segredos.
- `wrangler deploy --dry-run`: configuração aceita, incluindo o binding `CHAT_RATE_LIMITER`.
- QA completo em `reviews/QA-014.md`.

---

## 3. Produção

- Worker: `elessandrodev-chat`.
- Deploy ativo: `29c41a5d-c2ea-4a23-bdad-4cb756599caa` (2026-11-06).
- `GET /health`: `200`, `chunkCount: 36`, `sourceHash` consistente, `modelsConfigured: 2`.
- Pergunta inédita em PT: `200`, `X-Assistant-Cache: MISS`, `X-Assistant-Provider: workers-ai`, `X-Assistant-Stage: workers-ai`.
- Repetição da pergunta: `200`, `X-Assistant-Cache: HIT`, `X-Assistant-Stage: cache`.
- CORS e corpo `{ response, sources }` preservados.

---

## 4. Decisão de Aprovação

A implementação cumpre a SPEC-014 e a ADR-009 sem expandir escopo. O `503`
intermitente por timeout de 20 s deixa de ser a causa dominante, o primeiro modelo
da cadeia é válido, os timeouts estão alinhados ponta a ponta e a operação passa a
ter `X-Request-Id`, `X-Assistant-Stage`, log estruturado, `/health`, rate limit e
runbook.

A release **1.13.0** está registrada em `CHANGELOG.md`, `PROJECT.md` e `ROADMAP.md`.

---

## 5. Riscos Residuais

- O circuit breaker é local ao isolate; não substitui o alinhamento de timeouts.
- O cache negativo pode devolver `503` por até 60 s mesmo após a recuperação do provedor.
- O rate limit depende do binding `CHAT_RATE_LIMITER`; se indisponível, o chat degrada sem proteção.
- Workers Logs podem gerar custo conforme o volume; `head_sampling_rate` permite reduzir.
- Reduzir `max_tokens` do fallback pode encurtar respostas; a qualidade deve ser acompanhada.
- O deploy do Worker continua manual, sem rollback automatizado no pipeline.
