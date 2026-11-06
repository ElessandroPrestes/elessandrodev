# ADR-009 — Timeouts, Fallback e Observabilidade do Assistente

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | ADR-009                                    |
| **Data**      | 2026-11-06                                 |
| **Autor**     | Agente de IA (opencode)                    |
| **Status**    | Proposto — aguardando aprovação do PO      |
| **Decisores** | Elessandro Prestes Macedo                  |
| **Relacionadas** | ADR-008, SPEC-014                       |

---

## Contexto

A auditoria `AUDITORIA_RAG_PRODUCAO.md` (2026-11-06) confirmou que o `503`
intermitente do assistente é gerado pelo próprio Worker, não repassado de provedor.
A evidência mais forte aponta para o timeout de 20 s do fallback Workers AI:

- Três invocações com ~20,36 s de wall time e 3 subrequests cada.
- Embedding concluído com Neurons registrados nas três chamadas.
- Geração no Workers AI tentada ~20 s depois, com 0 Neurons.
- Worker converte a falha em `503` porque a OpenRouter não retornou `429`.

Agravantes:

1. O primeiro modelo da OpenRouter (`minimax/minimax-m3.1-flash:free`) não existe no
   catálogo público, desperdiçando uma tentativa por requisição.
2. O pior caso do Worker (~60 s) excede o timeout do cliente (30 s).
3. Falhas não são cacheadas; o retry do cliente repete embedding + geração.
4. Observabilidade desativada (`observability: null`, sem Logpush/Tail Worker).
5. Sem circuit breaker, cache negativo, rate limiting por IP ou endpoint de saúde.

---

## Decisão

Adotar quatro mudanças coordenadas, sem alterar o contrato
`{ question, locale } → { response, sources }` e sem mexer em corpus, chunking,
retrieval ou modelo de embeddings.

### 1. Orçamento de tempo único e timeouts derivados

- `WORKER_BUDGET_MS` (padrão 25000) define o teto total da geração.
- Cada chamada de provedor recebe o menor valor entre seu timeout específico e o
  tempo restante do orçamento.
- Se o tempo restante for menor que `MIN_CALL_BUDGET_MS` (padrão 2000), a chamada não
  é iniciada.
- O cliente passa a usar timeout maior que o orçamento (`VITE_LLM_TIMEOUT_MS`,
  padrão 35000), para nunca desistir antes do Worker.

**Por quê:** o desalinhamento atual entre 20 s + 20 s + 20 s (Worker) e 30 s
(cliente) produz aborto no navegador e trabalho desperdiçado no Worker.

### 2. Modelos válidos e fallback mais barato

- Corrigir `MODELS` para conter apenas IDs existentes no catálogo público.
- Validar os IDs no CI com `npm run models:check` (sem chave, sem créditos).
- Reduzir `max_tokens` do Workers AI para `WORKERS_AI_MAX_TOKENS` (padrão 768).
- Manter a ordem OpenRouter → Workers AI e o mesmo `system`/`user` prompt.

**Por quê:** um modelo inexistente queima tempo e subrequest em toda requisição; um
`max_tokens` menor reduz a latência do modelo 8B.

### 3. Circuit breaker e cache negativo

- Circuit breaker em memória do isolate por modelo/provedor:
  - abre após `CIRCUIT_BREAKER_THRESHOLD` (padrão 3) falhas consecutivas;
  - exclui o alvo por `CIRCUIT_BREAKER_MS` (padrão 60000);
  - expira sozinho e não é persistido.
- Cache negativo na Cache API para falhas `503`:
  - TTL padrão 60 s (`NEGATIVE_CACHE_TTL_SECONDS`);
  - cabeçalho `X-Assistant-Cache: NEGATIVE`;
  - `429` nunca é cacheado;
  - respeita `ENABLE_CACHE=false`.

**Por quê:** sem isso, cada retry do cliente repete embedding e geração contra um
alvo que acabou de falhar. O cache negativo é curto de propósito para não prolongar
uma indisponibilidade transitória.

### 4. Observabilidade e proteção na borda

- Habilitar Workers Logs (`[observability] enabled = true`) com amostragem
  configurável.
- Emitir log JSON de uma linha com `requestId`, `stage`, `provider`, `model`,
  `providerStatus`, `cache`, `timings`, `outcome` e `questionHash`.
- Devolver `X-Request-Id` em todas as respostas e `X-Assistant-Stage` em erros de
  geração.
- Registrar o `X-Request-Id` no console do navegador em caso de erro.
- Aplicar rate limit por IP com o binding `CHAT_RATE_LIMITER` (10 req/60 s),
  degradando sem bloquear se o binding não existir.
- Adicionar `GET /health` sem IA para monitoramento.
- Envolver o retrieval em `try/catch` para transformar erro de dimensão em resposta
  controlada.

**Por quê:** hoje é impossível saber, sem reprodução ao vivo, qual etapa falhou e
qual foi o status do provedor. Sem rate limit, abuso externo pode esgotar a cota
compartilhada.

---

## Consequências

### Positivas

- O `503` por timeout de fallback deixa de ser a causa dominante.
- O cliente nunca desiste antes do Worker.
- Modelos inválidos não chegam a produção.
- Falhas repetidas não custam embedding + geração a cada retry.
- Toda falha fica rastreável por `X-Request-Id` e log retido.
- A cota compartilhada fica protegida por rate limit por IP.
- Monitoramento externo passa a ter `GET /health`.

### Negativas / Trade-offs

- O circuit breaker em memória é local ao isolate; não é um estado global confiável.
- O cache negativo pode devolver `503` por até 60 s mesmo após o provedor se
  recuperar.
- Workers Logs e Rate Limiting podem ter custo/limite de plano; a amostragem e a
  degradação graciosa mitigam.
- Reduzir `max_tokens` do fallback pode encurtar respostas; a qualidade precisa ser
  medida no QA.
- O orçamento fixo de 25 s pode ser curto em cenários de latência extrema; é
  configurável.

---

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|---|---|---|---|
| Apenas aumentar o timeout do Workers AI | Mudança mínima | Piora a latência percebida e ainda estoura o cliente | Não resolve o desalinhamento ponta a ponta |
| Remover o fallback Workers AI | Menos complexidade | Volta a expor `429`/`503` quando a OpenRouter falha | Contraria a SPEC-013 |
| Trocar o modelo de fallback para um maior | Melhor qualidade | Mais latência e mais chance de timeout | Agrava o problema observado |
| Cache negativo longo | Menos chamadas | Prolonga indisponibilidade após recuperação | 60 s é o equilíbrio |
| Rate limiting com KV/Durable Object | Estado global | Novo binding, mais complexidade e custo | Cloudflare Rate Limiting é mais simples |
| Observabilidade via Tail Worker externo | Flexível | Operação adicional | Workers Logs nativo atende primeiro |
| **Orçamento de tempo + modelos válidos + circuit breaker + cache negativo + observabilidade + rate limit** | **Resolve causa e diagnóstico** | **Mais configuração e testes** | **Escolhida** |

---

## Conformidade e Validação

- `npm test` cobre orçamento, circuit breaker, cache negativo, cabeçalhos e health.
- `npm run models:check` valida os IDs contra o catálogo público.
- `npm run rag:check` e `npm run rag:eval` permanecem verdes.
- `npm run build` sem erros; bundle sem segredos.
- Deploy do Worker validado em produção com `/health`, timeout simulado e cache
  negativo.
- Evidências em `reviews/QA-014.md` e `reviews/REVIEW-014.md`.
- Revisão desta ADR se o plano do Cloudflare mudar, se os limites de Rate Limiting
  forem atingidos ou se o orçamento de 25 s se mostrar inadequado.
