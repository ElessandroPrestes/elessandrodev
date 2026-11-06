# SPEC-013 — Resiliência do Assistente contra 429 da OpenRouter (Fallback de Provedor e Cache RAG-Aware)

| Campo         | Valor                                                       |
|---------------|-------------------------------------------------------------|
| **ID**        | SPEC-013                                                    |
| **Data**      | 2026-11-05                                                  |
| **Autor**     | Agente de IA (opencode)                                     |
| **Status**    | Aprovada pelo PO em 2026-11-05                              |
| **Versão**    | 1.0                                                         |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)       |

---

## 1. Contexto e Motivação

Em produção, o assistente em `https://elessandrodev-chat.elessandrodev.workers.dev/` passou a responder `429`:

```text
Failed to load resource: the server responded with a status of 429
Erro na chamada do assistente: O assistente atingiu o limite temporário de requisições.
```

O comportamento é esperado pelo desenho atual, mas não é aceitável para o portfólio.

### Causa raiz

1. A OpenRouter limita modelos `:free` a **20 requisições/minuto e 50 requisições/dia** por conta (sem créditos vitalícios de US$ 10). O limite é **da conta**, não do modelo.
2. O Worker usa uma cadeia de modelos gratuitos; quando a cota diária zera, **todos** os modelos `:free` retornam `429`. Trocar de modelo não resolve e ainda consome tempo.
3. O Worker não possui **provedor alternativo**: ou OpenRouter responde, ou o usuário recebe `429`.
4. O frontend trata `429` como erro transitório e tenta novamente até 2 vezes, **multiplicando** requisições contra uma cota já esgotada.
5. Perguntas repetidas (comuns em portfólio: "experiência com legado?", "contato") sempre geram embedding + chamada de LLM, consumindo cota sem necessidade.

### Impacto

- O assistente fica indisponível para todos os visitantes até o reset diário da OpenRouter.
- A mensagem exibida ("tente novamente em alguns minutos") é enganosa para uma cota diária.
- Há risco reputacional: o principal diferencial técnico do portfólio falha justamente na demonstração.

A decisão arquitetural será registrada em **ADR-008**.

---

## 2. Objetivo

Tornar o assistente resiliente à exaustão de cota da OpenRouter, sem expor chave, sem quebrar o contrato `{ question, locale } → { response, sources }` e sem aumentar o escopo do RAG:

1. **Fallback de provedor**: quando a OpenRouter estiver esgotada, gerar a resposta com Cloudflare Workers AI (`env.AI`), preservando grounding, prompt e citação de fontes.
2. **Cache RAG-aware**: respostas fundamentadas bem-sucedidas passam a ser cacheadas por pergunta normalizada + locale + `sourceHash` do índice, reduzindo consumo de cota e latência.
3. **Semântica correta de 429**: detectar cota de conta esgotada e parar de tentar modelos `:free`, em vez de insistir na cadeia.
4. **Frontend sem retry inútil**: `429` deixa de ser retryable no cliente; apenas erros transitórios reais (rede, timeout, 5xx) continuam com backoff.
5. **Mensagem honesta**: informar quando o limite é de cota e sugerir tentar mais tarde, sem prometer "alguns minutos" quando o reset pode ser diário.

---

## 3. Escopo

### Está incluído (IN)

**Worker**

- `worker/cache.js`: chave de cache determinística (`SHA-256` de locale + pergunta normalizada + `sourceHash` + `embeddingModel`), leitura/escrita via Cache API injetável para testes.
- Cache de respostas `200` com `sources.length > 0`, TTL configurável (`CACHE_TTL_SECONDS`, padrão 86400).
- Invalidação automática por `sourceHash`: reindexação muda a chave.
- `worker/providers.js` (ou equivalente em `index.js`): geração com dois provedores.
  - OpenRouter (cadeia gratuita existente).
  - Cloudflare Workers AI (`env.AI`), modelo configurável `WORKERS_AI_MODEL`, padrão `@cf/meta/llama-3.1-8b-instruct-fp8`.
- Detecção de cota esgotada: `429` com `X-RateLimit-Remaining: 0` ou metadados equivalentes interrompe a cadeia OpenRouter e aciona o fallback imediatamente.
- Resposta final: se um provedor funcionar, `200`; se todos falharem, `429` (quando a causa dominante for cota) ou `503`, com mensagem amigável PT/EN.
- Cabeçalho `Retry-After` na resposta `429`, derivado de `X-RateLimit-Reset`/`Retry-After` quando disponível.
- Telemetria de provedor usado e cache hit/miss via `console.log` estruturado, sem segredo, prompt ou dado sensível.

**Frontend**

- `src/config/aiConfig.js`: `429` deixa de ser classificado como transitório; retries ficam restritos a rede, timeout e `5xx`.
- `src/services/aiService.js`: respeita a mensagem amigável do Worker para `429` e não a substitui por mensagem genérica.
- Testes do cliente atualizados para provar que `429` **não** dispara retry.

**Configuração**

- `wrangler.toml`: `WORKERS_AI_MODEL`, `CACHE_TTL_SECONDS` e `ENABLE_CACHE` como variáveis não sensíveis.
- `.dev.vars.example` e `.env.example`: documentação das novas variáveis, sem segredo.
- Nenhum binding novo obrigatório: Workers AI já existe; Cache API é nativa.

**Qualidade e documentação**

- Testes do Worker: cache hit sem AI/OpenRouter; cache miss grava; 429 de conta não tenta o segundo modelo e cai no Workers AI; Workers AI responde `200` com fontes; todos falhando retorna `429` amigável; `sourceHash` invalida cache.
- `README.md`, `PROJECT.md`, `docs/architecture.md`, `CHANGELOG.md`, `ROADMAP.md` atualizados.
- ADR-008, SPEC-013, TASK-013, QA-013 e REVIEW-013 registrados.

### Não está incluído (OUT)

- Rate limiting próprio por IP (KV/Durable Objects/Cloudflare Rate Limiting).
- Cache semântico por similaridade de embeddings (apenas chave exata normalizada nesta fase).
- Histórico conversacional (SPEC-011).
- Streaming de tokens.
- Migração para Vectorize.
- Compra de créditos na OpenRouter.
- Alterações no corpus, no chunking, no retrieval ou no prompt.
- Mudança de provedor de embeddings (`@cf/baai/bge-m3` permanece).

---

## 4. Requisitos Funcionais

### 4.1 Cache RAG-aware

1. A chave de cache deve ser `SHA-256(locale + "\n" + normalize(question) + "\n" + index.sourceHash + "\n" + index.embeddingModel)`.
2. `normalize(question)` deve aplicar `trim`, colapso de espaços e `toLowerCase`; não deve remover acentos nem alterar semântica.
3. A leitura de cache deve ocorrer **antes** do embedding e da geração.
4. Em cache hit, o Worker deve responder `200` com o corpo original e cabeçalho `X-Assistant-Cache: HIT`, sem chamar `env.AI.run` para embedding nem provedor de geração.
5. Em cache miss, o Worker segue o fluxo normal e grava a resposta apenas se `sources.length > 0`.
6. O TTL deve ser configurável por `CACHE_TTL_SECONDS` (padrão 86400) e aplicado via `Cache-Control: max-age`.
7. `ENABLE_CACHE=false` deve desativar leitura e escrita sem quebrar o fluxo.
8. Mudança de `sourceHash` (reindexação) deve invalidar todas as chaves anteriores.

### 4.2 Fallback de provedor

9. A ordem de geração deve ser: modelos configurados em `MODELS` (OpenRouter) e, em seguida, `WORKERS_AI_MODEL` (Cloudflare Workers AI).
10. O fallback para Workers AI deve ocorrer quando **todos** os modelos OpenRouter falharem por `429`, `5xx`, timeout ou resposta inválida.
11. Se a OpenRouter retornar `429` com `X-RateLimit-Remaining: 0`, o Worker deve interromper a cadeia imediatamente e acionar o Workers AI, sem tentar os demais modelos gratuitos.
12. O Workers AI deve receber o mesmo `system` e `user` prompt usados na OpenRouter.
13. O Workers AI deve ser chamado apenas se `env.AI.run` estiver disponível.
14. A resposta do Workers AI deve ser sanitizada com `sanitizeAnswer` e passar pela mesma checagem de CJK.
15. Nenhum provedor deve receber `question` crua sem o prompt construído pelo Worker.

### 4.3 Erros e mensagens

16. Se OpenRouter e Workers AI falharem e a causa dominante for cota, o Worker deve responder `429` com mensagem amigável PT/EN.
17. Se falharem por outros motivos, o Worker deve responder `503` com mensagem genérica.
18. A resposta `429` deve incluir `Retry-After` (segundos) quando a OpenRouter fornecer `X-RateLimit-Reset` ou `Retry-After`; caso contrário, usar valor conservador de 3600 s.
19. As mensagens não devem vazar status interno, modelo, chave ou corpo de erro do provedor.
20. O Worker deve registrar em log apenas: provedor vencedor, status, se houve cache hit e latência aproximada.

### 4.4 Frontend

21. `isTransientError` deve retornar `false` para `status === 429`.
22. Em `429`, o cliente deve exibir a mensagem amigável enviada pelo Worker, sem retry.
23. Retries continuam válidos para rede, `408`, `5xx` e timeout, com backoff exponencial e jitter.
24. O contrato permanece `{ question, locale }`.

---

## 5. Requisitos Não-Funcionais

| Requisito | Critério |
|---|---|
| Disponibilidade | Resposta `200` quando ao menos um provedor de geração estiver operacional |
| Economia de cota | Perguntas repetidas dentro do TTL não consomem embedding nem LLM |
| Segurança | Nenhuma chave nova no bundle; Cache API não armazena prompt cru nem credencial |
| Privacidade | Cache key usa hash da pergunta; conteúdo cacheado contém apenas resposta e fontes públicas |
| Latência | Cache hit abaixo de 100 ms no edge; fallback Workers AI não deve exceder o timeout total de 25 s |
| Custo | Workers AI só é acionado quando necessário; TTL e `ENABLE_CACHE` configuráveis |
| Testabilidade | Cache e provedores injetáveis; suíte roda em Node sem Cloudflare |
| Observabilidade | Log estruturado de provedor e cache, sem dados sensíveis |
| Compatibilidade | Nenhuma mudança no contrato do cliente ou na estrutura do índice |
| Documentação | README e PROJECT.md explicam fallback, cache e reindexação |

---

## 6. Comportamento Esperado

### Cenário 1: Cota diária da OpenRouter esgotada
**Dado** que a OpenRouter retorna `429` com `X-RateLimit-Remaining: 0`  
**Quando** o Worker tenta gerar a resposta  
**Então** interrompe a cadeia OpenRouter, aciona o Workers AI e responde `200` com `sources`, se o Workers AI funcionar.

### Cenário 2: Todos os provedores esgotados
**Dado** que OpenRouter e Workers AI falham por cota  
**Quando** o Worker conclui a geração  
**Então** responde `429` com mensagem amigável no locale, `Retry-After` e sem detalhes internos.

### Cenário 3: Pergunta repetida
**Dado** que a mesma pergunta normalizada foi respondida com fontes dentro do TTL  
**Quando** o visitante envia novamente  
**Então** o Worker responde do cache com `X-Assistant-Cache: HIT`, sem embedding nem LLM.

### Cenário 4: Reindexação do corpus
**Dado** que `sourceHash` do índice mudou  
**Quando** a mesma pergunta é enviada  
**Então** a chave de cache muda e a resposta é regenerada.

### Cenário 5: Cache desativado
**Dado** `ENABLE_CACHE=false`  
**Quando** qualquer pergunta é enviada  
**Então** o Worker ignora leitura/escrita de cache e mantém o comportamento normal.

### Cenário 6: Frontend recebe 429
**Dado** que o Worker responde `429` com mensagem amigável  
**Quando** o cliente processa a resposta  
**Então** exibe a mensagem do Worker e **não** faz retry.

### Cenário 7: Workers AI indisponível
**Dado** que a OpenRouter está esgotada e `env.AI` falha na geração  
**Quando** o Worker esgota os provedores  
**Então** responde `503` amigável, sem quebrar a página.

### Cenário 8: Resposta não fundamentada
**Dado** que nenhum chunk atinge `MIN_SCORE`  
**Quando** o retrieval termina  
**Então** o Worker mantém o fallback determinístico sem LLM e **não** grava cache.

---

## 7. Critérios de Aceitação

- [ ] `worker/cache.js` com chave determinística e Cache API injetável.
- [ ] Cache hit comprovado por teste sem chamada a `env.AI.run` de embedding nem a provedores.
- [ ] Cache miss com `sources` grava resposta com TTL correto.
- [ ] `sourceHash` diferente gera chave diferente (teste unitário).
- [ ] `ENABLE_CACHE=false` desativa cache.
- [ ] `429` com `X-RateLimit-Remaining: 0` não tenta o próximo modelo OpenRouter e aciona Workers AI.
- [ ] Workers AI responde `200` com `{ response, sources }` quando OpenRouter esgota.
- [ ] Todos os provedores falhando retornam `429` amigável com `Retry-After`.
- [ ] `isTransientError({ status: 429 })` é `false` e o cliente não faz retry.
- [ ] Mensagem do Worker para `429` é preservada no cliente.
- [ ] `npm test` passa e falha se a resiliência for quebrada de propósito.
- [ ] `npm run rag:check` e `npm run rag:eval` continuam verdes.
- [ ] `npm run build` sem erros.
- [ ] `wrangler.toml` com `WORKERS_AI_MODEL`, `CACHE_TTL_SECONDS` e `ENABLE_CACHE`.
- [ ] README, `PROJECT.md`, `docs/architecture.md`, `CHANGELOG.md` e `ROADMAP.md` atualizados.
- [ ] ADR-008, TASK-013, QA-013 e REVIEW-013 registrados.
- [ ] Commits em Português do Brasil no padrão Conventional Commits.
- [ ] Deploy do Worker validado em produção com pergunta repetida e cenário de cota esgotada simulado.

---

## 8. Impactos e Dependências

### Arquivos a criar

- `worker/cache.js`
- `worker/providers.js` (se a geração for extraída de `index.js`)
- `specs/SPEC-013-resiliencia-429-assistente-rag.md`
- `tasks/TASK-013-resiliencia-429-assistente-rag.md`
- `reviews/QA-013.md`
- `reviews/REVIEW-013.md`
- `adr/ADR-008-fallback-provedor-e-cache-rag.md`

### Arquivos a modificar

- `worker/index.js`
- `worker/index.test.mjs`
- `src/config/aiConfig.js`
- `src/services/aiService.js`
- `src/services/aiService.test.mjs`
- `wrangler.toml`
- `.dev.vars.example`
- `.env.example`
- `package.json` (apenas se necessário para expor script de teste)
- `README.md`
- `PROJECT.md`
- `docs/architecture.md`
- `CHANGELOG.md`
- `ROADMAP.md`

### Dependências

- Cloudflare Workers AI já habilitado (binding `AI` da SPEC-008).
- Modelo de geração do Workers AI disponível na conta; `WORKERS_AI_MODEL` permite trocar sem código.
- Cache API nativa do runtime Workers (sem binding).
- Nenhuma credencial nova.

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Modelo do Workers AI indisponível ou descontinuado | Média | `WORKERS_AI_MODEL` configurável; testar no deploy |
| Cota de Neurons do Workers AI consumida por geração | Média | Acionar só quando OpenRouter falha; cache; TTL |
| Cache servir resposta obsoleta após mudança de corpus | Baixa | `sourceHash` na chave; TTL de 24 h |
| Cache por pergunta exata ter baixa taxa de acerto | Média | Normalização robusta; evolução para cache semântico fica para SPEC futura |
| `X-RateLimit-Remaining` mudar de contrato | Média | Detecção best-effort; timeout e fallback preservados |
| Resposta do Workers AI com qualidade inferior | Média | Mesmo prompt, temperatura 0.2, sanitização e fontes; OpenRouter continua preferencial |
| Cache API não disponível em ambiente de teste | Alta | Cache injetável; Node usa stub; Miniflare cobre localmente |
| Retry do cliente ainda consumir cota | Baixa | 429 marcado como não transitório e coberto por teste |
| Vazamento de prompt no cache | Baixa | Cache armazena apenas resposta e fontes públicas |

---

## 10. Referências

- OpenRouter — limites e rate limits: https://openrouter.ai/docs/api-reference/limits
- OpenRouter — headers de rate limit: https://openrouter.ai/docs/api-reference/limits#rate-limits
- Cloudflare Workers — Cache API: https://developers.cloudflare.com/workers/runtime-apis/cache/
- Cloudflare Workers AI — modelos de texto: https://developers.cloudflare.com/workers-ai/models/
- Cloudflare Workers — `ctx.waitUntil`: https://developers.cloudflare.com/workers/runtime-apis/context/
- ADR relacionado: `adr/ADR-006-migracao-openrouter-cloudflare-worker.md`

> IDs de modelo, limites gratuitos e comportamento do Cache API devem ser confirmados na documentação oficial antes do deploy.

---

## 11. Aprovação Humana Obrigatória

| Campo | Valor |
|---|---|
| **Aprovado por** | Elessandro Prestes Macedo |
| **Data** | 2026-11-05 |
| **Assinatura** | [x] Aprovado [ ] Rejeitado |
| **Observações** | |
