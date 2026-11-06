# TASK-013 — Resiliência contra 429: Fallback de Provedor e Cache RAG-Aware

| Campo              | Valor                                            |
|--------------------|--------------------------------------------------|
| **ID**             | TASK-013                                         |
| **SPEC**           | SPEC-013                                         |
| **ADR**            | ADR-008                                          |
| **Data de início** | 2026-11-05                                       |
| **Data de conclusão** | 2026-11-05                                    |
| **Agente**         | opencode / deepseek-v4.1-flash-free              |
| **Status**         | ✅ Concluída e deployada em produção              |

---

## Escopo da Implementação

> Baseado na SPEC-013 aprovada, esta TASK implementa estritamente:

- Cache RAG-aware de respostas fundamentadas (Cache API, chave com `sourceHash`).
- Fallback de geração da OpenRouter para Cloudflare Workers AI.
- Detecção de cota de conta esgotada (`429` + `X-RateLimit-Remaining: 0`).
- `Retry-After` e mensagem honesta em `429`.
- Frontend sem retry em `429`.
- Testes, documentação, QA e revisão.

---

## Arquivos a Criar

| Arquivo                                            | Descrição                          |
|----------------------------------------------------|------------------------------------|
| `worker/cache.js`                                  | Chave e I/O de cache injetável     |
| `worker/providers.js`                              | Geração OpenRouter + Workers AI    |
| `specs/SPEC-013-resiliencia-429-assistente-rag.md` | SPEC aprovada                      |
| `adr/ADR-008-fallback-provedor-e-cache-rag.md`     | Decisão arquitetural               |
| `tasks/TASK-013-resiliencia-429-assistente-rag.md` | Esta TASK                          |
| `reviews/QA-013.md`                                | Evidências de QA                   |
| `reviews/REVIEW-013.md`                            | Revisão técnica                    |

---

## Arquivos a Modificar

| Arquivo                          | Mudança                                        |
|----------------------------------|------------------------------------------------|
| `worker/index.js`                | Integrar cache, fallback e semântica de 429    |
| `worker/index.test.mjs`          | Testes de cache, fallback e 429                |
| `src/config/aiConfig.js`         | `429` deixa de ser transitório                 |
| `src/services/aiService.test.mjs`| Provar que `429` não dispara retry             |
| `wrangler.toml`                  | `WORKERS_AI_MODEL`, `CACHE_TTL_SECONDS`, `ENABLE_CACHE` |
| `.dev.vars.example`              | Documentar variáveis locais                    |
| `.env.example`                   | Documentar comportamento do cliente            |
| `README.md`                      | Arquitetura e operação                         |
| `PROJECT.md`                     | Estado canônico e quality gates                |
| `docs/architecture.md`           | Topologia e decisões                           |
| `CHANGELOG.md`                   | Registro da correção                           |
| `ROADMAP.md`                     | Versão e backlog                               |

---

## Checklist de Implementação

- [x] `worker/cache.js` com `buildCacheKey`, `readCachedAnswer`, `writeCachedAnswer`
- [x] Chave `SHA-256(locale + pergunta normalizada + sourceHash + embeddingModel)`
- [x] Cache somente de `200` com `sources.length > 0`
- [x] `ENABLE_CACHE=false` desativa leitura/escrita
- [x] `worker/providers.js` com cadeia OpenRouter + Workers AI
- [x] Cota esgotada interrompe a cadeia OpenRouter
- [x] `429` final com `Retry-After`
- [x] `isTransientError(429) === false`
- [x] Documentação atualizada

---

## Checklist de Validação & QA

- [x] `npm test` verde e sensível a regressão (38/38)
- [x] `npm run rag:check` consistente (36 chunks, `sourceHash` estável)
- [x] `npm run rag:eval` com hit@4 >= 0.80 (100%, MRR 0.975)
- [x] `npm run build` sem erros
- [x] Varredura do bundle sem segredos
- [x] Deploy do Worker validado em produção (`269dcbb7`, cache HIT e fallback Workers AI)

---

## Notas do Agente

- Nenhum binding novo é necessário: Workers AI já existe e Cache API é nativa.
- O corpus, o chunking, o retrieval e o prompt não são alterados.
- Mudanças no corpus continuam exigindo `npm run rag:index`; a chave de cache invalida automaticamente por `sourceHash`.
