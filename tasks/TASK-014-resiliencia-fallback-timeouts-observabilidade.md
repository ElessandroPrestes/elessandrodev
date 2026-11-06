# TASK-014 — Resiliência do Fallback, Timeouts Alinhados e Observabilidade

| Campo              | Valor                                            |
|--------------------|--------------------------------------------------|
| **ID**             | TASK-014                                         |
| **SPEC**           | SPEC-014                                         |
| **ADR**            | ADR-009                                          |
| **Data de início** | 2026-11-06                                       |
| **Data de conclusão** | 2026-11-06                                    |
| **Agente**         | opencode / deepseek-v4.1-flash-free              |
| **Status**         | ✅ Concluída e deployada em produção              |

---

## Escopo da Implementação

> Baseado na SPEC-014 aprovada, esta TASK implementa estritamente:

- Correção da lista de modelos da OpenRouter e validação no CI.
- Orçamento total de geração (`WORKER_BUDGET_MS`) com timeouts derivados.
- Redução configurável de `max_tokens` no fallback Workers AI.
- Circuit breaker por modelo/provedor.
- Cache negativo curto para `503`, sem cachear `429`.
- `X-Request-Id` e `X-Assistant-Stage` nas respostas.
- Log estruturado JSON com timings e `questionHash`.
- Workers Logs habilitado em `wrangler.toml`.
- Rate limiting por IP na rota de chat.
- `GET /health` sem IA.
- Tratamento controlado de falha no retrieval.
- Testes, documentação, QA e revisão.

---

## Arquivos a Criar

| Arquivo                                                          | Descrição                          |
|------------------------------------------------------------------|------------------------------------|
| `worker/circuit.js`                                              | Circuit breaker injetável          |
| `scripts/check-models.mjs`                                       | Validação dos IDs da OpenRouter    |
| `docs/operations.md`                                             | Runbook de diagnóstico e operação  |
| `reviews/QA-014.md`                                              | Evidências de QA                   |
| `reviews/REVIEW-014.md`                                          | Revisão técnica                    |

---

## Arquivos a Modificar

| Arquivo                              | Mudança                                            |
|--------------------------------------|----------------------------------------------------|
| `worker/index.js`                    | Orçamento, rate limit, health, headers, logs, cache negativo |
| `worker/providers.js`                | Timeout e `max_tokens` por chamada                 |
| `worker/cache.js`                    | Cache negativo e `hashQuestion`                    |
| `worker/index.test.mjs`              | Testes dos novos comportamentos                    |
| `src/config/aiConfig.js`             | Timeout padrão do cliente alinhado ao Worker       |
| `src/services/aiService.js`          | Log de `X-Request-Id`/`X-Assistant-Stage` em erro  |
| `src/services/aiService.test.mjs`    | Testes dos cabeçalhos de diagnóstico               |
| `wrangler.toml`                      | Modelos válidos, vars, observability e rate limit  |
| `package.json`                       | Script `models:check`                              |
| `.github/workflows/deploy.yml`       | Etapa `models:check`                               |
| `.dev.vars.example` e `.env.example` | Documentar variáveis novas                         |
| `README.md`, `PROJECT.md`, `docs/architecture.md`, `CHANGELOG.md`, `ROADMAP.md` | Documentação |

---

## Checklist de Implementação

- [x] `MODELS` corrigido e `models:check` no CI
- [x] `WORKER_BUDGET_MS` e timeouts derivados
- [x] `WORKERS_AI_MAX_TOKENS` configurável
- [x] Circuit breaker com janela de exclusão
- [x] Cache negativo de `503` e bloqueio de cache de `429`
- [x] `X-Request-Id` e `X-Assistant-Stage`
- [x] Log JSON estruturado com timings
- [x] Workers Logs habilitado
- [x] Rate limit por IP
- [x] `GET /health`
- [x] Retrieval em `try/catch`
- [x] Documentação atualizada
- [x] QA-014 e REVIEW-014 registrados

---

## Checklist de Validação & QA

- [x] `npm test` verde e sensível a regressão (48/48)
- [x] `npm run models:check` verde (2 modelos)
- [x] `npm run rag:check` consistente (36 chunks)
- [x] `npm run rag:eval` com hit@4 >= 0.80 (100%, MRR 0.975)
- [x] `npm run build` sem erros
- [x] Varredura do bundle sem segredos
- [x] `wrangler deploy --dry-run` aceita a configuração
- [x] Deploy do Worker validado em produção (`29c41a5d`, 2026-11-06)

---

## Notas do Agente

- Nenhum binding obrigatório novo além do Rate Limiting; se indisponível, o chat
  degrada para o comportamento anterior.
- O corpus, o chunking, o retrieval e o prompt não são alterados.
- O circuit breaker é local ao isolate e expira sozinho; não substitui o
  alinhamento de timeouts.
