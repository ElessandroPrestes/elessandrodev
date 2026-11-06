# SPEC-014 — Resiliência do Fallback, Timeouts Alinhados e Observabilidade do Assistente

| Campo         | Valor                                                       |
|---------------|-------------------------------------------------------------|
| **ID**        | SPEC-014                                                    |
| **Data**      | 2026-11-06                                                  |
| **Autor**     | Agente de IA (opencode)                                     |
| **Status**    | Rascunho — aguardando aprovação do PO                       |
| **Versão**    | 1.0                                                         |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)       |
| **Origem**    | `AUDITORIA_RAG_PRODUCAO.md` (2026-11-06)                    |

---

## 1. Contexto e Motivação

Em 2026-11-06 o assistente em produção retornou `503` intermitente:

```text
O assistente está temporariamente indisponível. Tente novamente em instantes.
```

A auditoria técnica `AUDITORIA_RAG_PRODUCAO.md` confirmou, por código e por métricas
agregadas do Cloudflare Workers, o seguinte encadeamento:

1. As três chamadas do navegador ocorreram em sequência de retry, com ~21 s entre si.
2. Cada invocação teve 3 subrequests e ~20,36 s de wall time.
3. O embedding terminou com sucesso nas três chamadas.
4. A tentativa de geração no Workers AI aparece ~20 s depois, com **0 Neurons**,
   compatível com timeout de `MODEL_TIMEOUT_MS = 20000` (`worker/providers.js:7`).
5. O Worker converte a falha em `503`, porque `rateLimited` é `false`.

Fatores agravantes confirmados:

- O primeiro modelo configurado da OpenRouter, `minimax/minimax-m3.1-flash:free`,
  **não existe** no catálogo público consultado em 2026-11-06. Toda requisição gasta
  uma tentativa inválida antes de chegar ao segundo modelo.
- O timeout do Worker (~60 s no pior caso) não está alinhado com o timeout do
  cliente (30 s).
- Falhas não são cacheadas; cada retry do cliente repete embedding + OpenRouter +
  fallback.
- Não há `requestId`, observabilidade persistida, circuit breaker, cache negativo,
  rate limiting por IP nem endpoint de saúde.

### Impacto

- Visitantes recebem `503` justamente quando a OpenRouter falha, mesmo com o
  Workers AI operacional na maior parte do tempo.
- Diagnóstico depende de reprodução ao vivo, porque não há retenção de logs.
- Retries do cliente amplificam consumo de cota e latência em um backend já lento.
- Sem rate limiting, abuso externo pode esgotar a cota compartilhada e derrubar o
  assistente para todos.

A decisão arquitetural será registrada em **ADR-009**.

---

## 2. Objetivo

Eliminar o `503` intermitente e tornar o assistente diagnosticável e protegido,
sem alterar o contrato `{ question, locale } → { response, sources }` e sem mudar
corpus, chunking, retrieval ou modelo de embeddings:

1. **Modelos válidos:** corrigir a lista da OpenRouter e impedir regressão no CI.
2. **Timeouts alinhados:** definir orçamento total do Worker e derivar timeouts por
   etapa, garantindo que o cliente espere o Worker terminar.
3. **Fallback mais rápido e observável:** reduzir custo do fallback e registrar a
   etapa e o status do provedor.
4. **Proteção contra repetição de falha:** circuit breaker e cache negativo curto.
5. **Observabilidade real:** Workers Logs, log JSON estruturado, `X-Request-Id` e
   `X-Assistant-Stage`.
6. **Proteção contra abuso:** rate limiting por IP na borda.
7. **Saúde e operação:** `GET /health` sem IA, runbook e alertas.

---

## 3. Escopo

### Está incluído (IN)

**Modelos e configuração**

- Corrigir `MODELS` em `wrangler.toml` para conter apenas modelos existentes.
- Manter ao menos dois modelos `:free` válidos na cadeia OpenRouter.
- Criar `scripts/check-models.mjs` e o script `npm run models:check` para validar os
  IDs contra `https://openrouter.ai/api/v1/models` (sem chave, sem créditos).
- Adicionar `models:check` ao workflow de CI, sem bloquear o build em falha de rede
  (apenas em ID inexistente ou formato inválido).

**Timeouts e orçamento**

- Definir `WORKER_BUDGET_MS` (padrão 25000) como orçamento total de geração.
- Derivar timeouts por chamada a partir do tempo restante do orçamento.
- `VITE_LLM_TIMEOUT_MS` do cliente deve ser maior que o orçamento do Worker
  (padrão 35000).
- Abortar a cadeia quando o orçamento estourar e responder de forma controlada.

**Fallback**

- Reduzir `max_tokens` do Workers AI para um valor configurável (padrão 768).
- Registrar `provider`, `model`, `providerStatus` e `stage` em log estruturado.
- Retornar `X-Assistant-Stage` (`embedding|retrieval|openrouter|workers-ai|response`)
  e `X-Request-Id` em todas as respostas de erro e de sucesso.
- Manter o corpo amigável sem detalhe interno.

**Circuit breaker e cache negativo**

- Circuit breaker em memória do isolate por modelo/provedor, com janela de exclusão
  configurável (`CIRCUIT_BREAKER_MS`, padrão 60000).
- Cache negativo curto via Cache API para falhas `503` (TTL padrão 60 s,
  `NEGATIVE_CACHE_TTL_SECONDS`), com `X-Assistant-Cache: NEGATIVE`.
- Nunca cachear `429`; `429` continua imediato e com `Retry-After`.
- Estado do circuit breaker não pode impedir recuperação: expira sozinho e não é
  compartilhado entre isolates.

**Observabilidade**

- Habilitar Workers Logs em `wrangler.toml` (`[observability] enabled = true`) com
  `head_sampling_rate` configurável.
- Log JSON com campos estáveis: `requestId`, `stage`, `provider`, `model`,
  `providerStatus`, `cache`, `timings`, `outcome`, `questionHash`.
- Nunca logar pergunta crua, prompt, chave ou corpo completo de provedor.
- Incluir `X-Request-Id` no console do navegador em caso de erro (frontend).

**Rate limiting**

- Aplicar Cloudflare Rate Limiting por IP na rota de chat, com binding
  `CHAT_RATE_LIMITER` e configuração em `wrangler.toml`.
- Responder `429` com `Retry-After` quando o limite for excedido.
- Não aplicar rate limit em `GET /health`.
- Se o binding não estiver disponível, o Worker deve degradar para o comportamento
  atual, sem quebrar o chat.

**Saúde e robustez**

- Adicionar `GET /health` (sem IA, sem secret) com `status`, `version`,
  `chunkCount`, `sourceHash`, `cacheEnabled` e `modelsConfigured`.
- Envolver `retrieveChunks` em `try/catch` para tratar dimensão incompatível e
  falha inesperada com resposta controlada.
- Documentar runbook de diagnóstico em `docs/operations.md`.

**Qualidade e documentação**

- Testes de: modelo inválido bloqueado, orçamento estourado, fallback com
  `max_tokens` reduzido, circuit breaker abrindo/fechando, cache negativo,
  `X-Request-Id`/`X-Assistant-Stage`, `GET /health` e retrieval com dimensão errada.
- `README.md`, `PROJECT.md`, `docs/architecture.md`, `docs/operations.md`,
  `CHANGELOG.md`, `ROADMAP.md`, `.dev.vars.example` e `.env.example` atualizados.
- ADR-009, TASK-014, QA-014 e REVIEW-014 registrados.

### Não está incluído (OUT)

- Cache semântico por similaridade de embeddings.
- Histórico conversacional (SPEC-011).
- Streaming de tokens.
- Migração para Vectorize (SPEC-010).
- Compra de créditos na OpenRouter.
- Alterações no corpus, chunking, retrieval ou no modelo de embeddings.
- Troca do provedor primário de geração: OpenRouter continua preferencial.
- Deploy automatizado do Worker no pipeline (fica para SPEC futura).

---

## 4. Requisitos Funcionais

### 4.1 Modelos

1. `MODELS` não deve conter modelo ausente no catálogo público da OpenRouter.
2. `npm run models:check` deve falhar se um ID configurado não existir; falha de rede
   deve produzir aviso, não falha.
3. O CI deve executar `models:check` antes de `npm test`.
4. A cadeia deve manter ao menos dois modelos `:free` válidos.

### 4.2 Timeouts e orçamento

5. `WORKER_BUDGET_MS` deve ser lido do ambiente, com padrão 25000 e limites seguros.
6. Antes de cada chamada de provedor, o Worker deve calcular o tempo restante do
   orçamento e abortar se não houver margem mínima (`MIN_CALL_BUDGET_MS`, padrão 2000).
7. Nenhuma chamada de provedor pode ultrapassar `WORKER_BUDGET_MS` no total.
8. O cliente deve usar timeout maior que `WORKER_BUDGET_MS` (padrão 35000).
9. Timeout de etapa deve ser registrado no log com `stage` correspondente.

### 4.3 Fallback

10. `WORKERS_AI_MAX_TOKENS` deve ser configurável, com padrão 768.
11. O fallback deve continuar recebendo o mesmo `system` e `user` prompt.
12. O fallback deve registrar `provider=workers-ai`, `providerStatus` e latência.
13. Resposta do fallback continua sujeita a `sanitizeAnswer` e checagem de CJK.

### 4.4 Circuit breaker

14. Após `N` falhas consecutivas (`CIRCUIT_BREAKER_THRESHOLD`, padrão 3) do mesmo
    modelo/provedor, novas tentativas devem ser evitadas por
    `CIRCUIT_BREAKER_MS` (padrão 60000).
15. O estado deve expirar automaticamente e não pode ser persistido.
16. O circuit breaker não pode ser acionado por `429` de cota, que já interrompe a
    cadeia e aciona o fallback.

### 4.5 Cache negativo

17. Apenas falhas `503` podem ser cacheadas negativamente, por no máximo 60 s.
18. `429` nunca é cacheado.
19. Cache negativo deve responder `503` com `X-Assistant-Cache: NEGATIVE`.
20. `ENABLE_CACHE=false` desativa também o cache negativo.

### 4.6 Semântica de erro e cabeçalhos

21. Toda resposta deve incluir `X-Request-Id` (UUID v4 gerado no Worker).
22. Respostas de erro de geração devem incluir `X-Assistant-Stage`.
23. O corpo de erro continua amigável, sem status interno, modelo, chave ou corpo do
    provedor.
24. `429` de cota continua com `Retry-After`.
25. O cliente deve preservar a mensagem do Worker e não retentar `429`.

### 4.7 Observabilidade

26. Logs devem ser JSON de uma linha, com os campos definidos no escopo.
27. `questionHash` deve ser `SHA-256` da pergunta normalizada, nunca a pergunta crua.
28. `timings` deve conter ao menos `embeddingMs`, `retrievalMs`, `generationMs` e
    `totalMs`.
29. `outcome` deve assumir `ok`, `fallback`, `rate_limited` ou `unavailable`.
30. O frontend deve registrar `X-Request-Id` no console em caso de erro.

### 4.8 Rate limiting e saúde

31. Rate limit por IP deve ser aplicado apenas em `POST /` e `POST /chat`.
32. Limite padrão: 10 requisições por 60 s por IP, configurável no binding.
33. Excesso de limite deve retornar `429` com `Retry-After`.
34. `GET /health` deve responder `200` sem Origin, sem IA e sem cache.
35. `GET /health` não deve expor segredo, prompt ou pergunta.
36. Falha de retrieval por dimensão incompatível deve retornar erro controlado
    (`503`) com `X-Assistant-Stage: retrieval`, não exceção do runtime.

---

## 5. Requisitos Não-Funcionais

| Requisito | Critério |
|---|---|
| Disponibilidade | Nenhum `503` por timeout de fallback em condições normais; fallback responde dentro do orçamento |
| Latência | p95 de geração abaixo de 20 s; orçamento total do Worker em 25 s |
| Diagnóstico | Toda falha rastreável por `X-Request-Id` e log JSON retido |
| Segurança | Nenhuma chave no bundle; logs sem pergunta crua, prompt ou corpo de provedor |
| Abuso | Rate limit por IP ativo na rota de chat |
| Custo | Circuit breaker e cache negativo reduzem chamadas repetidas |
| Testabilidade | Timeouts, circuit breaker e cache injetáveis; suíte roda em Node |
| Compatibilidade | Contrato do cliente e estrutura do índice inalterados |
| Operação | `GET /health` e runbook permitem monitoramento externo |
| Documentação | README, PROJECT, architecture, operations, CHANGELOG e ROADMAP atualizados |

---

## 6. Comportamento Esperado

### Cenário 1: Timeout do Workers AI dentro do orçamento
**Dado** que a OpenRouter falhou e o Workers AI demora mais que o esperado  
**Quando** o orçamento total está próximo do fim  
**Então** o Worker aborta a chamada restante, registra `stage=workers-ai` e responde
`503` controlado com `X-Request-Id`, sem exceder `WORKER_BUDGET_MS`.

### Cenário 2: Modelo inválido configurado
**Dado** que `MODELS` contém um ID inexistente  
**Quando** o CI executa `npm run models:check`  
**Então** o job falha antes do deploy, com mensagem indicando o ID inválido.

### Cenário 3: Falha repetida do mesmo modelo
**Dado** que um modelo falhou 3 vezes consecutivas  
**Quando** uma nova requisição chega dentro da janela de exclusão  
**Então** o Worker não tenta esse modelo e segue para o próximo da cadeia.

### Cenário 4: Falha transitória repetida
**Dado** que a geração falhou com `503` e a mesma pergunta chega em até 60 s  
**Quando** o Worker consulta o cache negativo  
**Então** responde `503` com `X-Assistant-Cache: NEGATIVE`, sem repetir embedding e
provedores.

### Cenário 5: Rate limit excedido
**Dado** que um IP excedeu 10 requisições em 60 s  
**Quando** envia nova pergunta  
**Então** recebe `429` com `Retry-After`, sem consumir cota de IA.

### Cenário 6: Health check
**Dado** que um monitor chama `GET /health` sem Origin  
**Quando** o Worker responde  
**Então** retorna `200` com `status`, versão e estado do índice, sem chamar IA.

### Cenário 7: Dimensão incompatível no retrieval
**Dado** que o vetor da pergunta tem dimensão diferente do índice  
**Quando** o retrieval é executado  
**Então** o Worker responde `503` controlado com `X-Assistant-Stage: retrieval`.

### Cenário 8: Diagnóstico de erro no navegador
**Dado** que o Worker responde com erro  
**Quando** o cliente exibe a mensagem amigável  
**Então** registra `X-Request-Id` no console para suporte.

---

## 7. Critérios de Aceitação

- [ ] `MODELS` contém apenas IDs existentes no catálogo público da OpenRouter.
- [ ] `npm run models:check` valida os IDs e está no CI.
- [ ] `WORKER_BUDGET_MS` limita o pior caso e o cliente espera mais que o Worker.
- [ ] Nenhuma chamada de provedor ultrapassa o orçamento total.
- [ ] `WORKERS_AI_MAX_TOKENS` configurável com padrão 768.
- [ ] Circuit breaker abre após 3 falhas e fecha após a janela.
- [ ] Cache negativo de `503` por 60 s; `429` nunca é cacheado.
- [ ] Toda resposta inclui `X-Request-Id`; erros de geração incluem `X-Assistant-Stage`.
- [ ] Logs JSON com `requestId`, `stage`, `providerStatus`, `cache`, `timings`,
      `outcome` e `questionHash`.
- [ ] Workers Logs habilitado em `wrangler.toml`.
- [ ] Rate limit por IP responde `429` com `Retry-After`.
- [ ] `GET /health` responde `200` sem IA e sem Origin.
- [ ] Retrieval com dimensão errada retorna erro controlado.
- [ ] `npm test` passa e falha se a resiliência for quebrada de propósito.
- [ ] `npm run rag:check` e `npm run rag:eval` continuam verdes.
- [ ] `npm run build` sem erros.
- [ ] README, `PROJECT.md`, `docs/architecture.md`, `docs/operations.md`,
      `CHANGELOG.md` e `ROADMAP.md` atualizados.
- [ ] ADR-009, TASK-014, QA-014 e REVIEW-014 registrados.
- [ ] Commits em Português do Brasil no padrão Conventional Commits.
- [ ] Deploy do Worker validado em produção com `/health`, cache negativo e
      simulação de timeout.

---

## 8. Impactos e Dependências

### Arquivos a criar

- `scripts/check-models.mjs`
- `docs/operations.md`
- `specs/SPEC-014-resiliencia-fallback-timeouts-observabilidade.md`
- `adr/ADR-009-timeouts-fallback-observabilidade.md`
- `tasks/TASK-014-resiliencia-fallback-timeouts-observabilidade.md` (após aprovação)
- `reviews/QA-014.md` e `reviews/REVIEW-014.md` (após implementação)

### Arquivos a modificar

- `worker/index.js`
- `worker/providers.js`
- `worker/cache.js`
- `worker/index.test.mjs`
- `src/config/aiConfig.js`
- `src/services/aiService.js`
- `src/services/aiService.test.mjs`
- `wrangler.toml`
- `package.json` (script `models:check`)
- `.github/workflows/deploy.yml`
- `.dev.vars.example` e `.env.example`
- `README.md`, `PROJECT.md`, `docs/architecture.md`, `CHANGELOG.md`, `ROADMAP.md`

### Dependências

- Cloudflare Workers Logs disponível no plano atual (item a confirmar antes do deploy).
- Cloudflare Rate Limiting binding disponível na conta; se indisponível, degradar sem
  bloquear o chat.
- Catálogo público da OpenRouter acessível no CI para `models:check`.
- Binding `AI` já existente; Cache API nativa.
- Nenhuma credencial nova.

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Rate Limiting binding indisponível no plano | Média | Degradação graciosa; documentar alternativa com KV/DO em SPEC futura |
| Workers Logs gerar custo acima do esperado | Baixa | `head_sampling_rate` configurável; revisar volume após deploy |
| Circuit breaker memória local não refletir outros isolates | Alta | Aceitável como mitigação parcial; responsabilidade principal é o alinhamento de timeouts |
| Cache negativo servir falha após recuperação do provedor | Baixa | TTL de 60 s; `ENABLE_CACHE=false` desativa |
| `models:check` falhar por indisponibilidade do catálogo | Média | Falha de rede gera aviso, não bloqueio |
| Redução de `max_tokens` piorar respostas | Média | Valor configurável; medir qualidade no QA |
| `GET /health` virar alvo de abuso | Baixa | Sem IA e sem custo; rate limit opcional futuro |
| Timeout do cliente ainda menor que o Worker | Baixa | Teste explícito de configuração no CI |

---

## 10. Referências

- `AUDITORIA_RAG_PRODUCAO.md` — auditoria de origem (2026-11-06).
- `specs/SPEC-013-resiliencia-429-assistente-rag.md` — fallback e cache atuais.
- `adr/ADR-008-fallback-provedor-e-cache-rag.md` — decisão anterior.
- OpenRouter — catálogo público: https://openrouter.ai/api/v1/models
- Cloudflare Workers — Logs/observability: https://developers.cloudflare.com/workers/observability/logs/
- Cloudflare Workers — Rate Limiting: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- Cloudflare Workers — Cache API: https://developers.cloudflare.com/workers/runtime-apis/cache/

> IDs de modelo, limites do Rate Limiting e comportamento do Workers Logs devem ser
> confirmados na documentação oficial antes do deploy.

---

## 11. Aprovação Humana Obrigatória

| Campo | Valor |
|---|---|
| **Aprovado por** | |
| **Data** | |
| **Assinatura** | [ ] Aprovado [ ] Rejeitado |
| **Observações** | |
