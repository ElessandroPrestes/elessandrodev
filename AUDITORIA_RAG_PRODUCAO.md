# AUDITORIA_RAG_PRODUCAO.md

**Auditoria técnica do assistente RAG em produção**

| Campo | Valor |
|---|---|
| **Data da auditoria** | 2026-11-06 (UTC) |
| **Escopo** | Diagnóstico dos HTTP 503 e auditoria do fluxo RAG, frontend, Worker, segurança e observabilidade |
| **Modo** | Somente leitura. Nenhum código, configuração ou deploy foi alterado |
| **Governança** | Universal SDD do repositório (`AGENTS.md`). Esta auditoria é insumo para SPEC futura; não implementa correções |
| **Produção analisada** | GitHub Pages + Cloudflare Worker `elessandrodev-chat` |
| **Evidências externas** | API pública de modelos da OpenRouter, métricas agregadas do Cloudflare Workers (somente leitura) e artefatos públicos do GitHub Pages |

> **Limitação declarada:** não há retenção de logs por requisição no Worker (Workers Logs/observabilidade desativados, sem Logpush e sem Tail Worker). As conclusões sobre a causa do 503 combinam código, métricas agregadas e correlação temporal. O erro exato retornado pelo provedor na falha específica depende de log de produção e está marcado como hipótese.

---

## 1. Resumo executivo

O assistente **não usa LangChain** e **não usa banco vetorial externo**. A arquitetura real é um RAG próprio, implementado em JavaScript puro dentro do Cloudflare Worker, com índice JSON versionado no próprio bundle, embeddings do Workers AI (`@cf/baai/bge-m3`) e geração via OpenRouter com fallback para Workers AI.

O HTTP 503 observado **é gerado pelo próprio Worker**, não repassado de provedor. Ele é a resposta padrão para quatro situações: ausência de provedor de geração, ausência do binding `AI`/índice, falha no embedding e falha na geração que não seja cota (`429`).

A evidência mais forte aponta para **timeout de 20 s no fallback de geração do Workers AI**:

1. As três chamadas do navegador ocorreram em sequência de retry, com ~21 s entre si (`01:12:31`, `01:12:52` e `01:13:13` UTC).
2. Cada chamada gerou 3 subrequests e levou **~20,36 s** de wall time no Worker.
3. O embedding foi concluído com sucesso nas três chamadas (Neurons de `@cf/baai/bge-m3` registrados).
4. A tentativa de geração com `@cf/meta/llama-3.1-8b-instruct-fp8` aparece **exatamente 20 s depois**, com **0 Neurons**, ou seja, sem concluir inferência.
5. O Worker converte essa falha em `503` com a mensagem genérica exibida no navegador.

Como falhas não são cacheadas, cada retry do cliente repetiu embedding + OpenRouter + fallback. O resultado foram exatamente os três `503` vistos no console.

**Confiança:** alta para o mecanismo do 503 (timeout do Workers AI mapeado para 503). Média para a causa da falha da OpenRouter naquele instante (o código não registra logs persistidos). A OpenRouter falhou sem retornar `429`; se tivesse retornado `429`, o Worker responderia `429`, não `503`.

Problemas adicionais confirmados:

- O primeiro modelo configurado da OpenRouter, `minimax/minimax-m3.1-flash:free`, **não existe** no catálogo público; o modelo existente é `minimax/minimax-m3.1-flash` (pago). Toda requisição gasta uma tentativa inválida antes de chegar ao segundo modelo.
- O timeout do Worker (20 s por provedor) e o timeout do cliente (30 s) não estão alinhados com o pior caso da cadeia (até ~60 s).
- Não há circuit breaker, cache negativo, limite de requisições por IP, correlation ID nem logs estruturados persistidos.
- O prompt de sistema tem ~18,7 mil caracteres; com 4 chunks, o prompt total chega a ~20,9 mil caracteres, o que contribui para a latência do modelo 8B no fallback.

Nenhuma alteração foi feita no repositório além deste relatório.

---

## 2. Arquitetura identificada

### 2.1 Estrutura relevante

```text
.
├── .github/workflows/deploy.yml     # CI/CD: testes, build e deploy do Pages
├── knowledge/rag/*.md               # corpus canônico (4 arquivos)
├── knowledge/eval/questions.json    # conjunto de avaliação do retrieval
├── scripts/
│   ├── build-index.mjs              # chunking + embeddings + grava índice
│   ├── check-index.mjs              # valida sourceHash e consistência no CI
│   ├── eval-retrieval.mjs           # hit@4 / MRR
│   └── rag-lib.mjs                  # chunking, hash, cliente REST de embeddings
├── shared/retrieval.js              # cosine, BM25 e score híbrido
├── worker/
│   ├── index.js                     # HTTP, CORS, validação, cache, orquestração
│   ├── providers.js                 # OpenRouter + Workers AI
│   ├── cache.js                     # chave e I/O da Cache API
│   ├── prompt.js                    # prompt canônico, ficha e contato
│   └── rag/
│       ├── index.json               # índice vetorial versionado (36 chunks)
│       └── retrieve.js              # embedding da pergunta, retrieval e contexto
├── src/
│   ├── components/AiAssistant.vue   # interface do chat
│   ├── services/aiService.js        # fetch, retry e mensagens de erro
│   └── config/aiConfig.js           # VITE_*, retry/backoff e telemetria DEV
└── wrangler.toml                    # binding AI e variáveis do Worker
```

### 2.2 Diagrama real

```mermaid
flowchart TD
    U[Visitante] --> UI[Vue 3\nAiAssistant.vue]
    UI --> SVC[aiService.js\naskAssistant]
    SVC -->|POST {question, locale}| W[Cloudflare Worker\nworker/index.js]

    W --> V{Origin, método,\npayload e limites}
    V -->|inválido| E4[403/400/405/413/404]
    V -->|válido| C[Intenção de contato?]
    C -->|sim| CR[contactReply\nsem IA]
    C -->|não| K[Cache RAG-aware\nworker/cache.js]
    K -->|HIT| R200[200 + X-Assistant-Cache: HIT]
    K -->|MISS| P{AI + índice\ndisponíveis?}
    P -->|não| E503[503 unavailableMessage]
    P -->|sim| EMB[Workers AI\n@cf/baai/bge-m3]
    EMB -->|erro| E503
    EMB --> RET[Retrieval híbrido\ncosine + BM25\nshared/retrieval.js]
    RET --> TH{score >= MIN_SCORE?}
    TH -->|não| FB[200 safeFallback\nsem LLM]
    TH -->|sim| GEN[generateAnswer\nworker/index.js]
    GEN --> OR[OpenRouter\nMODELS em ordem]
    OR -->|falha| WAI[Workers AI\n@cf/meta/llama-3.1-8b-instruct-fp8]
    OR -->|sucesso| SAN[sanitizeAnswer + CJK]
    WAI -->|sucesso| SAN
    WAI -->|falha| ERR{rateLimited?}
    ERR -->|sim| E429[429 rateLimitMessage\n+ Retry-After]
    ERR -->|não| E503
    SAN --> BODY[{response, sources}]
    BODY --> CACHEW[Cache API\nsomente 200 com sources]
    CACHEW --> OUT[200 + sources]

    SVC -->|429| NO[exibe mensagem\ne NÃO retenta]
    SVC -->|503/5xx/timeout/rede| RT[retry 2x\nbackoff + jitter]
    RT --> W
```

### 2.3 Endpoints e comunicação

| Item | Valor |
|---|---|
| URL do Worker | `https://elessandrodev-chat.elessandrodev.workers.dev` |
| Rotas aceitas | `POST /` e `POST /chat` (`worker/index.js:205-208`) |
| Preflight | `OPTIONS` responde `204` com CORS (`worker/index.js:197-199`) |
| Contrato de entrada | `{ "question": string, "locale": "pt" \| "en" }` |
| Contrato de saída | `{ "response": string, "sources": [{ section, source, score }] }` |
| Erros | JSON `{ "error": string }` |
| CORS | Origin precisa estar em `ALLOWED_ORIGIN` (`worker/index.js:189-195`) |
| Build do frontend | `VITE_CHAT_API_URL` injetada no CI (`.github/workflows/deploy.yml:45,50`) |

### 2.4 O que **não** existe na arquitetura real

- **LangChain:** `package.json` não declara LangChain; `package-lock.json` tem **0** ocorrências. O SPEC-008 removeu LangChain por não ter uso real (`specs/SPEC-008-...md:51`). A menção a LangChain em `src/i18n/locales/pt.js:321` e `en.js:321` é texto de competência profissional, não dependência de runtime.
- **Banco vetorial externo:** não há Pinecone, Chroma, Weaviate, Supabase Vector, Qdrant, FAISS nem Vectorize. O “vector store” é `worker/rag/index.json`, carregado como módulo JSON no Worker.
- **Gemini em runtime:** a integração histórica foi substituída pela ADR-006/SPEC-008. Nenhuma chave `VITE_GEMINI_API_KEY` ou chamada ao Gemini existe no código atual.
- **Streaming real:** `streamAssistant` é apenas compatibilidade; o Worker devolve a resposta completa (`src/services/aiService.js:199-209`).

---

## 3. Tecnologias e dependências

### 3.1 Frontend

| Tecnologia | Versão instalada | Uso |
|---|---|---|
| Vue | `3.5.43` | Interface e reatividade |
| Vite | `6.4.5` | Build e dev server (porta 5212) |
| `@vitejs/plugin-vue` | `6.0.5` | Plugin Vue |
| Tailwind CSS | `3.4.19` | Estilos |
| marked | `18.0.10` | Renderização de Markdown no chat |

### 3.2 Worker

- Runtime: Cloudflare Workers, `compatibility_date = "2026-10-21"` (`wrangler.toml:3`).
- Sem dependências npm próprias: os módulos do Worker são locais (`worker/*.js`, `shared/retrieval.js`).
- Binding: `AI` (`wrangler.toml:6-7`).
- Cache: Cache API nativa, sem binding.
- Versão implantada no momento da auditoria: `269dcbb7-2a2b-43e6-a130-0c78ee5e80f3`, em `2026-11-05T13:01:55.936Z`.

### 3.3 Geração e embeddings

| Papel | Provedor | Modelo | Configuração |
|---|---|---|---|
| Geração primária | OpenRouter | `minimax/minimax-m3.1-flash:free` e `google/gemma-4-31b-it:free` | `wrangler.toml:11`; temperatura `0.2`; `max_tokens: 3000` (`worker/providers.js:81-82`) |
| Geração de fallback | Cloudflare Workers AI | `@cf/meta/llama-3.1-8b-instruct-fp8` | `wrangler.toml:12`; temperatura `0.2`; `max_tokens: 1024` (`worker/providers.js:162-163`) |
| Embeddings | Cloudflare Workers AI | `@cf/baai/bge-m3` | `wrangler.toml:10`, 1024 dimensões |

**Fato confirmado:** o modelo `minimax/minimax-m3.1-flash:free` não consta no catálogo público da OpenRouter consultado em 2026-11-06. O catálogo contém `minimax/minimax-m3.1-flash` (pago) e `google/gemma-4-31b-it:free`. Isso significa que a primeira tentativa de toda requisição tende a falhar por modelo inexistente.

### 3.4 Recuperação de documentos

| Item | Valor |
|---|---|
| Corpus | `knowledge/rag/00-perfil.md`, `10-experiencia.md`, `20-projetos.md`, `30-faq.md` |
| Chunking | por seção `##`, máximo **1600 caracteres**, overlap **200** (`scripts/build-index.mjs:10-11`) |
| Chunks | **36** chunks; média de **458** caracteres; mínimo 89, máximo 979 |
| Indexação | `npm run rag:index` → `scripts/build-index.mjs` → `worker/rag/index.json` |
| Embedding na ingestão | API REST do Workers AI (`scripts/rag-lib.mjs:268-315`) |
| Embedding em runtime | binding `AI` (`worker/rag/retrieve.js:17-20`) |
| Índice | `version: 1`, `sourceHash: a8ed790e...`, `dimensions: 1024`, `chunkCount: 36` |
| Retriever | cosseno + BM25 normalizado, `HYBRID_ALPHA=0.6` (`shared/retrieval.js:96-115`) |
| TopK | `4` (`worker/index.js:278`, `worker/rag/retrieve.js:22-38`) |
| Threshold | `MIN_SCORE=0.45` |
| Filtro por metadados | **não existe**; todos os chunks participam do ranking |
| Vector store externo | **não existe** |

### 3.5 CI/CD

`.github/workflows/deploy.yml`:

- Node.js **22**.
- `npm ci` → `npm run rag:check` → `npm test` → `npm run build`.
- `VITE_CHAT_API_URL` injetada no teste e no build (linhas 45 e 50).
- Deploy do GitHub Pages somente em push para `main` (linhas 54 e 62).
- Não há deploy automatizado do Worker no workflow; o Worker é publicado por `wrangler deploy` manual.

---

## 4. Fluxo completo da requisição

### 4.1 Fluxo real, etapa por etapa

| # | Etapa | Arquivo / função | Dados | Exceções possíveis | Tratamento | Gargalo |
|---|---|---|---|---|---|---|
| 1 | Envio da mensagem | `src/components/AiAssistant.vue:94-153` (`sendMessage`) | texto, locale | texto vazio; envio duplicado | `if (!content \|\| isLoading) return` (linha 96) | Nenhum relevante |
| 2 | Chamada do serviço | `src/services/aiService.js:101-197` (`askAssistant`) | pergunta, locale, opções | URL ausente; timeout; erro HTTP | loop de retry com backoff (linhas 124-159) | Até 3 tentativas contra um Worker lento |
| 3 | Fetch | `src/services/aiService.js:20-86` (`requestOnce`) | JSON `{question, locale}` | rede, DNS, CORS, timeout | `AbortController` de 30 s; converte timeout em `504` | Timeout do cliente (30 s) menor que o pior caso do Worker |
| 4 | Entrada no Worker | `worker/index.js:188-232` (`fetch`) | headers, body | Origin inválida, método, rota, payload, JSON | respostas `403/405/404/413/400` | Leitura do body é limitada após `request.text()` |
| 5 | Curto-circuito de contato | `worker/index.js:236-242` | pergunta | — | `contactReply`, `200`, sem IA | Nenhum |
| 6 | Chave de cache | `worker/index.js:244-256`, `worker/cache.js:12-34` | locale, pergunta, `sourceHash`, modelo | `crypto.subtle` indisponível | `readCachedAnswer` engole falhas | Hash SHA-256 por requisição (baixo custo) |
| 7 | Leitura do cache | `worker/index.js:258-265`, `worker/cache.js:42-58` | chave | JSON inválido | retorna `null` | Cache local ao data center |
| 8 | Pré-condições | `worker/index.js:267-276` | `env`, índice | sem provedor, sem `AI`, índice vazio | `503` genérico | Não distingue a causa no corpo |
| 9 | Embedding | `worker/rag/retrieve.js:17-20` | pergunta | Workers AI fora, timeout, resposta inválida | `try/catch` → `503` (`worker/index.js:282-288`) | Dependência externa obrigatória |
| 10 | Retrieval | `worker/rag/retrieve.js:22-38`, `shared/retrieval.js:96-115` | vetor, tokens, chunks | vetor com dimensão errada | **não há try/catch local** | Erro de dimensão vira exceção não tratada |
| 11 | Threshold | `worker/index.js:299-305` | chunks pontuados | — | `safeFallback` `200`, sem cache | Nenhum |
| 12 | Prompt | `worker/index.js:110-115`, `worker/prompt.js:34` | chunks, locale | — | prompt com ~18,7 mil caracteres + contexto | Prompt grande aumenta latência do 8B |
| 13 | Geração OpenRouter | `worker/index.js:123-144`, `worker/providers.js:61-138` | system, user, modelo | 401/403/404/429/5xx, timeout, resposta vazia | cadeia de modelos; `quotaExhausted` interrompe | Modelo inválido primeiro; timeout de 20 s por modelo |
| 14 | Fallback Workers AI | `worker/index.js:146-174`, `worker/providers.js:140-198` | system, user, modelo | timeout de 20 s, 5xx, resposta vazia | retorna `ok:false`; status vira `503` | **origem observada do 503** |
| 15 | Sanitização | `worker/index.js:75-87`, `worker/index.js:127-129` | texto | CJK, texto vazio | remove CJK; texto vazio → `502` | Baixo |
| 16 | Resposta e cache | `worker/index.js:332-360`, `worker/cache.js:60-84` | `{response, sources}` | falha de cache | `writeCachedAnswer` engole falhas | Cache só grava sucesso com `sources` |
| 17 | Renderização | `src/components/AiAssistant.vue:140-147` | resposta ou erro | Markdown inválido | fallback para texto; erro marcado em vermelho | Mensagem de erro genérica |

### 4.2 Diferenças em relação ao fluxo pressuposto no prompt

| Pressuposto | Realidade |
|---|---|
| LangChain orquestra o RAG | Não existe. Orquestração manual em `worker/index.js` |
| Embeddings/Vectory Store separados | Embeddings no Workers AI; “store” é JSON em memória |
| Retriever de framework | `retrieveChunks` próprio com cosseno + BM25 |
| Worker repassa status do LLM | Não. O Worker normaliza e devolve `503`/`429` próprios |
| Streaming de tokens | Não. Resposta completa |

---

## 5. Investigação do HTTP 503

### 5.1 O Worker retorna o 503? Sim

O `503` é sempre produzido por `jsonResponse(..., 503, ...)` em `worker/index.js`. Não há repasse do status do provedor LLM.

| Local | Condição | Corpo |
|---|---|---|
| `worker/index.js:270-272` | Sem `OPENROUTER_API_KEY` **e** sem `env.AI.run` | `unavailableMessage(locale)` |
| `worker/index.js:274-276` | Sem binding `AI` ou índice vazio | `unavailableMessage(locale)` |
| `worker/index.js:282-288` | Exceção em `embedQuestion` | `unavailableMessage(locale)` |
| `worker/index.js:314-330` | Geração falhou e `answer.status !== 429` | `unavailableMessage(locale)` |

A mensagem exata do navegador, “O assistente está temporariamente indisponível. Tente novamente em instantes.”, é `unavailableMessage` (`worker/index.js:95-99`). Portanto, o corpo do erro confirma que a resposta veio de um desses quatro ramos, e não de um proxy transparente.

### 5.2 O Worker repassa o status do provedor? Não

`generateAnswer` retorna um objeto interno com `status`, mas a rota HTTP só usa esse status para decidir entre `429` e `503`:

```js
// worker/index.js:314-329
if (!answer.ok) {
  if (answer.status === 429) {
    return jsonResponse({ error: rateLimitMessage(locale) }, 429, origin, {
      'Retry-After': String(answer.retryAfter || DEFAULT_RETRY_AFTER_SECONDS),
    })
  }
  console.error('[chat] generation failed with status:', answer.status)
  return jsonResponse({ error: unavailableMessage(locale) }, 503, origin)
}
```

Um `502`, `504`, `401`, `403` ou `404` de provedor vira `503` genérico. Isso dificulta o diagnóstico.

### 5.3 Timeout nas chamadas externas: sim

| Componente | Timeout | Local |
|---|---|---|
| Cliente (navegador) | `30.000 ms` | `src/config/aiConfig.js:19` |
| OpenRouter | `20.000 ms` por modelo | `worker/providers.js:7,63,135` |
| Workers AI | `20.000 ms` | `worker/providers.js:145-166` |
| Pior caso teórico do Worker | ~60 s (2 modelos × 20 s + 20 s) | `worker/index.js:123-174` |

O pior caso do Worker excede o timeout do cliente. Se a OpenRouter consumir tempo e o fallback também, o navegador aborta antes de receber a resposta.

### 5.4 Evidência de produção: o 503 observado

Consulta somente leitura às métricas agregadas do Worker (dataset `workersInvocationsAdaptive`) no intervalo de 2026-11-05T00:00Z a 2026-11-06T02:00Z:

| UTC | Status da invocação | Subrequests | Wall time aprox. | Leitura |
|---|---|---:|---:|---|
| 2026-11-06T01:12:31Z | success | 3 | 20,36 s | 1ª tentativa do navegador |
| 2026-11-06T01:12:52Z | success | 3 | 20,17 s | 2ª tentativa, ~21 s depois |
| 2026-11-06T01:13:13Z | success | 3 | 20,13 s | 3ª tentativa, ~21 s depois |

As três invocações têm exatamente o padrão de `maxRetries = 2` do cliente (`src/config/aiConfig.js:18`): três tentativas para uma única mensagem, porque `503` é transitório (`src/config/aiConfig.js:61`).

Consulta somente leitura ao dataset `aiInferenceAdaptiveGroups` no mesmo intervalo:

| UTC | Modelo | Total de Neurons |
|---|---|---:|
| 2026-11-06T01:12:31Z | `@cf/baai/bge-m3` | 0,0365 |
| 2026-11-06T01:12:51Z | `@cf/meta/llama-3.1-8b-instruct-fp8` | **0** |
| 2026-11-06T01:12:52Z | `@cf/baai/bge-m3` | 0,0365 |
| 2026-11-06T01:13:12Z | `@cf/meta/llama-3.1-8b-instruct-fp8` | **0** |
| 2026-11-06T01:13:13Z | `@cf/baai/bge-m3` | 0,0365 |
| 2026-11-06T01:13:33Z | `@cf/meta/llama-3.1-8b-instruct-fp8` | **0** |

**Interpretação:**

- O embedding funcionou nas três tentativas.
- A geração no Workers AI foi tentada 20 s após o início de cada requisição, com **zero Neurons**, indicando que a inferência não chegou a concluir.
- O `wall time` de ~20,36 s coincide com o timeout de `MODEL_TIMEOUT_MS = 20000` (`worker/providers.js:7,153`).
- O Worker então retorna `503` porque `rateLimited` é `false` (a OpenRouter não devolveu `429` naquela requisição).

Para comparação, no mesmo dia houve fallback bem-sucedido:

| UTC | Modelo | Total de Neurons | Wall time |
|---|---|---:|---:|
| 2026-11-06T00:32:19Z | `@cf/meta/llama-3.1-8b-instruct-fp8` | 95,82 | 9,83 s |
| 2026-11-06T00:32:49Z | `@cf/meta/llama-3.1-8b-instruct-fp8` | 85,13 | 15,24 s |

Ou seja, o mesmo modelo responde em 10–15 s em condições normais e ocasionalmente ultrapassa 20 s. A falha é intermitente e compatível com sobrecarga/latência do Workers AI.

### 5.5 O 503 é 429, autenticação ou timeout?

- **Não é 429:** o Worker teria retornado `429` com `rateLimitMessage` e `Retry-After` (`worker/index.js:315-325`). O corpo observado é `unavailableMessage`, do ramo `503`.
- **Não é erro de autenticação exposto:** o secret `OPENROUTER_API_KEY` existe no Worker; a API de settings confirma um binding `secret_text` com esse nome. O valor não foi lido. Se houvesse `401`, o código sairia da cadeia e cairia no Workers AI, ainda podendo responder `200`; o `503` só apareceria se o fallback também falhasse.
- **Não é timeout do cliente:** o `wall time` de ~20 s é menor que o timeout de 30 s do navegador, e o cliente recebeu corpo JSON com `error`, não um abort de rede.
- **É timeout do Worker/provedor:** o Worker corta o Workers AI em 20 s e converte a falha em `503`.

### 5.6 Configuração e bindings confirmados

Consulta somente leitura à API de settings do Worker confirmou:

- Binding `AI` presente.
- `OPENROUTER_API_KEY` presente como `secret_text` (valor não acessado).
- Variáveis `MODELS`, `WORKERS_AI_MODEL`, `EMBEDDING_MODEL`, `CACHE_TTL_SECONDS`, `ENABLE_CACHE`, `TOP_K`, `HYBRID_ALPHA`, `MIN_SCORE`, `ALLOWED_ORIGIN` e `SITE_URL` presentes.
- `compatibility_date = "2026-10-21"`.
- Último deploy: versão `269dcbb7...`, em `2026-11-05T13:01:55Z`.

Isso descarta como causa primária: binding ausente, variável ausente, índice vazio ou ausência de provedor.

### 5.7 O primeiro modelo da OpenRouter é inválido

Consulta ao catálogo público `GET https://openrouter.ai/api/v1/models` em 2026-11-06:

| Modelo configurado | Existe? |
|---|---|
| `minimax/minimax-m3.1-flash:free` | **Não** |
| `google/gemma-4-31b-it:free` | Sim |

Existe `minimax/minimax-m3.1-flash`, mas é pago. Portanto, a primeira tentativa de toda requisição tende a receber `404` e consumir tempo/subrequest antes do segundo modelo. Isso não explica sozinho o `503` (o código continua para o próximo modelo), mas reduz a resiliência e aumenta a latência.

### 5.8 O que é fato, hipótese e o que depende de logs

| Classificação | Afirmação |
|---|---|
| **Fato comprovado no código** | O `503` é gerado pelo Worker em quatro ramos; a mensagem observada é `unavailableMessage`; o timeout do Workers AI é 20 s; falhas não são cacheadas; o modelo `minimax/...:free` não existe no catálogo público. |
| **Fato comprovado nas métricas** | As três tentativas de 2026-11-06T01:12–01:13Z tiveram 3 subrequests, ~20 s de wall time, embedding com Neurons e geração Workers AI com 0 Neurons. |
| **Hipótese de alta confiança** | O `503` observado é o timeout do Workers AI no fallback, após falha da OpenRouter. Os três registros correspondem aos três retries do navegador. |
| **Hipótese de média confiança** | A OpenRouter falhou por modelo inválido (`404` no primeiro) e por indisponibilidade/erro no segundo modelo. A causa exata do segundo modelo não está registrada. |
| **Depende de logs de produção** | Status HTTP e corpo exatos retornados pela OpenRouter; se houve `401`, `404`, `429` ou `5xx`; se o Workers AI retornou timeout ou erro imediato (os 0 Neurons e o atraso de 20 s apontam timeout); latência interna por etapa. |

---

## 6. Auditoria LangChain e RAG

### 6.1 LangChain

**Não há LangChain no projeto.** Não há import, dependência, configuração ou uso efetivo. O RAG é implementado em código próprio. Qualquer investigação que assuma LangChain como causa partiria de premissa falsa.

### 6.2 Recuperação de documentos

| Pergunta | Resposta | Evidência |
|---|---|---|
| Como os documentos são carregados? | Markdown em `knowledge/rag/*.md`, lidos no build do índice | `scripts/rag-lib.mjs:82-117` |
| Como são divididos? | Por seção `##`; se a seção exceder 1600 caracteres, é cortada em janelas | `scripts/rag-lib.mjs:119-192` |
| Tamanho dos chunks | Máximo 1600 caracteres; média real 458; máximo real 979 | `worker/rag/index.json` |
| Overlap | 200 caracteres, ajustado para não cortar palavra | `scripts/rag-lib.mjs:184-188` |
| Embeddings | `@cf/baai/bge-m3`, 1024 dimensões | `scripts/build-index.mjs:65-99` |
| Indexação | JSON versionado com `sourceHash`, `hash` por chunk, vetor e norma | `scripts/build-index.mjs:95-105` |
| Retriever | Cosseno + BM25 normalizado, pesos `alpha=0.6` | `shared/retrieval.js:96-115` |
| TopK | 4 | `worker/index.js:278` |
| Filtro por metadados | Não existe | `worker/rag/retrieve.js:22-38` |
| Contexto ao LLM | 4 chunks formatados com seção/fonte e ids | `worker/rag/retrieve.js:48-55`; `worker/index.js:101-103` |
| Sem documentos relevantes | `safeFallback` determinístico, `200`, sem LLM e sem cache | `worker/index.js:299-305` |

### 6.3 Geração

| Item | Valor | Local |
|---|---|---|
| Modelo primário | `minimax/minimax-m3.1-flash:free` (inválido) e `google/gemma-4-31b-it:free` | `wrangler.toml:11` |
| Modelo de fallback | `@cf/meta/llama-3.1-8b-instruct-fp8` | `wrangler.toml:12` |
| Temperatura | `0.2` nos dois provedores | `worker/providers.js:81,162` |
| Limite de tokens | `3000` OpenRouter; `1024` Workers AI | `worker/providers.js:82,163` |
| Timeout | `20 s` por modelo/provedor | `worker/providers.js:7,63,153` |
| Prompt | `buildSystemPrompt` (~18,7 mil caracteres) + 4 chunks (~2,3 mil) | `worker/prompt.js:34`; `worker/index.js:110-115` |
| Controle de contexto | topK 4 e threshold 0.45; sem orçamento explícito de tokens | `worker/index.js:278-280` |
| Resposta sem base | `safeFallback` sem LLM | `worker/index.js:299-305` |
| Sanitização | Remove CJK e normaliza espaços | `worker/index.js:75-81` |

### 6.4 Resiliência

| Mecanismo | Existe? | Evidência |
|---|---|---|
| Retry no cliente | Sim, para 408/5xx/timeout/rede; não para 429 | `src/services/aiService.js:124-159`; `src/config/aiConfig.js:30-81` |
| Backoff exponencial + jitter | Sim | `src/config/aiConfig.js:90-95` |
| Fallback entre modelos OpenRouter | Sim, mas o primeiro é inválido | `worker/index.js:123-144` |
| Fallback entre provedores | Sim, OpenRouter → Workers AI | `worker/index.js:146-174` |
| Retry dentro do Worker | Não | `worker/index.js:123-174` |
| Circuit breaker | Não | — |
| Cache negativo | Não; só sucesso com `sources` | `worker/index.js:337-355` |
| Controle de concorrência | Não | — |
| Limite de requisições por IP | Não | — |
| Timeout alinhado ponta a ponta | Não (20 s + 20 s + 20 s vs 30 s do cliente) | `worker/providers.js:7,63,153`; `src/config/aiConfig.js:19` |

---

## 7. Auditoria Vue.js

### 7.1 Envio de mensagens

- Componente: `src/components/AiAssistant.vue:94-153`.
- Função: `sendMessage`.
- Chamada: `askAssistant(content, locale.value, { onStatus })` (linhas 134-138).
- Estado de loading: `isLoading` (linhas 121 e 148).
- Prevenção de envio duplicado: `if (!content || isLoading.value) return` (linha 96).
- A mensagem do usuário é adicionada imediatamente; um placeholder de assistente é criado antes da chamada (linhas 99-131).

### 7.2 URL e configuração

- URL: `AI_CONFIG.chatApiUrl`, lida de `VITE_CHAT_API_URL` (`src/config/aiConfig.js:16-21`).
- Produção: `.github/workflows/deploy.yml:45,50` injeta `https://elessandrodev-chat.elessandrodev.workers.dev`.
- Local: `.env.local` aponta para `http://127.0.0.1:8788` (não versionado). `wrangler dev` normalmente usa 8787; há risco de divergência local, mas não afeta produção.
- Se a URL estiver vazia, o cliente lança `MISSING_CHAT_API_URL` antes de qualquer fetch (`src/services/aiService.js:110-117`).

### 7.3 Tratamento de respostas e erros

- `response.json()` com fallback para `{}` (`src/services/aiService.js:40`).
- HTTP não-OK: cria `Error(data.error || HTTP status)` e anexa `status` (linhas 42-46).
- Resposta vazia ou sem `response` string: `502` (linhas 48-56).
- Timeout: `AbortController` de 30 s; converte em `504` com mensagem amigável (linhas 24-27, 64-72).
- Abort externo: `ABORTED` (linhas 74-79).
- Erro de rede (`TypeError: Failed to fetch`) é transitório e retentado.
- `429` não é mais transitório desde a SPEC-013 (`src/config/aiConfig.js:43`); a mensagem do Worker é preservada (`src/services/aiService.js:177-194`).
- `503` é transitório: o navegador tenta 3 vezes no total (`maxRetries=2`).

### 7.4 O frontend está ocultando a causa?

**Não no sentido de mascarar uma mensagem detalhada do Worker.** O Worker envia apenas `{ error: "O assistente está temporariamente indisponível..." }`; o frontend exibe exatamente essa mensagem. O problema é que **o Worker não envia detalhe técnico algum** para o cliente.

O console mostra `Erro na chamada do assistente: Error: ...` (`src/components/AiAssistant.vue:143`), mas sem código de etapa, provedor, request ID ou status interno. Para diagnóstico, seria útil o Worker retornar um header/campo interno não sensível, por exemplo `X-Assistant-Stage: embedding|openrouter|workers-ai|index` e um `X-Request-Id`, mantendo o corpo amigável. O navegador poderia registrar isso no console e a UI continuaria simples. Não implementar agora.

### 7.5 Tratamento de respostas inválidas

- `data.response` precisa ser string não vazia; caso contrário `502`.
- `data.sources` não-array vira `[]`.
- Markdown inválido cai para texto puro (`AiAssistant.vue:33-41`).
- HTML do Markdown é escapado (`AiAssistant.vue:15-31`), reduzindo risco de XSS.

---

## 8. Auditoria Cloudflare Workers

### 8.1 Runtime e configuração

- `compatibility_date = "2026-10-21"`.
- `workers_dev = true`.
- Binding `AI` presente.
- `usage_model = "standard"` (conforme settings do Worker).
- Último deploy: `269dcbb7...` em `2026-11-05T13:01:55Z`.

### 8.2 Limites de execução

- O Worker faz chamadas externas sequenciais: até 2 modelos OpenRouter (20 s cada) + 1 Workers AI (20 s).
- O pior caso teórico (~60 s) excede o timeout do cliente (30 s).
- Não há `ctx.waitUntil` para a geração; o cache usa `waitUntil` apenas para escrita (`worker/index.js:350-354`).
- O Worker não tem endpoint de saúde (`GET /health`). Um `GET /` sem Origin retorna `403`, o que não serve como health check para monitoramento.

### 8.3 Deploy do Worker x deploy do frontend

- O GitHub Actions publica apenas o GitHub Pages.
- O Worker é publicado manualmente via `wrangler deploy`.
- Não há versionamento/rollback automatizado do Worker no pipeline.
- No momento da auditoria, o Worker em produção correspondia ao código de `worker/` commitado (`011f77f`/`be2ed6e`) e o bundle do Pages era `index-DMlzXh_o.js`, gerado a partir do mesmo commit com `VITE_CHAT_API_URL` de produção.

### 8.4 Logs e observabilidade do Worker

- `console.error`/`console.log` existem (`worker/index.js:138,157,167,286,328`), mas:
  - não há `requestId`;
  - não há timing por etapa;
  - não há status HTTP do provedor no log de sucesso;
  - não há Workers Logs/observabilidade habilitados (settings: `observability: null`, `logpush: false`, `tail_consumers: []`);
  - não há Logpush nem Tail Worker.
- Resultado: os logs só existem durante um `wrangler tail` ao vivo e não são retidos.

---

## 9. Segurança

| Item | Situação | Evidência |
|---|---|---|
| API keys no bundle | **Não há**. Varredura do bundle de produção não encontrou `OPENROUTER_API_KEY`, `sk-or-`, `AIza`, `Bearer` | `/tmp` gerado a partir de `index-DMlzXh_o.js` |
| Chave da OpenRouter | Secret no Worker | Settings do Worker: `secret_text` `OPENROUTER_API_KEY` |
| Chave de ingestão | `.env.ingest`, não versionado | `.gitignore` |
| CORS | Restrito a origens explícitas | `worker/index.js:31-36,189-198`; `wrangler.toml:18` |
| Validação de entrada | Origin, método, rota, tamanho de payload, JSON, pergunta vazia, limite de 500 caracteres | `worker/index.js:189-231` |
| Limite de payload | 2000 bytes | `worker/index.js:37,210-213` |
| Limite de requisições por IP | **Não existe** | — |
| Proteção contra abuso | Apenas CORS e limites de tamanho | — |
| Stack traces ao cliente | Não. Erros são mensagens amigáveis | `worker/index.js:89-99` |
| Logs com dados sensíveis | Logs não incluem pergunta, prompt nem chave; incluem detalhe do erro do provedor truncado em 160 caracteres | `worker/providers.js:104,193`; `worker/index.js:138,167,286,328` |
| Cache | Armazena apenas `{response, sources}`; chave é hash | `worker/cache.js:12-34,60-84` |
| Diferença dev/prod | Build de produção injeta a URL via CI; local usa `.env.local` | `.github/workflows/deploy.yml:45,50`; `.env.local` |

**Risco relevante:** sem rate limiting, um visitante ou bot pode consumir a cota compartilhada da OpenRouter/Workers AI e derrubar o assistente para todos. O retry de `503` no cliente (3 tentativas) amplifica esse consumo quando o backend está lento.

---

## 10. Observabilidade

### 10.1 Estado atual

| Recurso | Existe? | Observação |
|---|---|---|
| Logs estruturados | Parcial | `console.*` com texto, sem JSON, sem request ID |
| Correlation ID | Não | Frontend gera `request_id` local apenas em DEV (`src/config/aiConfig.js:102-117`) e não o envia |
| Tempo total | Não no Worker | Só o cliente mede `performance.now()` em DEV |
| Tempo do retriever | Não | — |
| Tempo do embedding | Não | — |
| Tempo da chamada LLM | Não | — |
| Status HTTP do provedor | Parcial | Logado apenas em falha, truncado |
| Identificação da etapa que falhou | Parcial | Logs distintos (`openrouter failed`, `workers-ai failed`, `embedding failed`, `generation failed`) |
| Métricas de sucesso/falha | Externas | Cloudflare tem métricas agregadas de invocação, mas não por etapa |
| Retenção de logs | Não | Observability desativada, sem Logpush/Tail Worker |

### 10.2 Estratégia recomendada para Cloudflare Workers

1. **Habilitar Workers Logs (observability)** no `wrangler.toml` com amostragem adequada.
2. **Log estruturado em JSON** com campos estáveis:
   - `requestId` (gerado no Worker e devolvido em `X-Request-Id`);
   - `stage` (`validation|cache|embedding|retrieval|openrouter|workers-ai|response`);
   - `provider`, `model`, `providerStatus`;
   - `cache` (`HIT|MISS|OFF`);
   - `timings.embeddingMs`, `timings.retrievalMs`, `timings.generationMs`, `timings.totalMs`;
   - `outcome` (`ok|fallback|rate_limited|unavailable`);
   - `questionHash` (nunca a pergunta crua).
3. **Tail Worker** para encaminhar erros a um coletor (Logpush, R2 ou serviço externo) sem acoplar ao request do usuário.
4. **Analytics Engine ou dataset customizado** para contar `503` por etapa e por provedor.
5. **Alerta** quando a taxa de `503` por etapa exceder um limiar (ex.: >5% em 5 min) ou quando o p95 de geração passar de 15 s.
6. **Correlação com o frontend:** enviar `X-Request-Id` na resposta e logá-lo no console do navegador em caso de erro; exibir um código curto ao usuário (“ref: abc123”) para suporte.

---

## 11. Problemas identificados e classificação

| # | Severidade | Problema | Evidência | Local | Consequência | Causa provável | Solução recomendada | Prioridade |
|---|---|---|---|---|---|---|---|---|
| 1 | **ALTO** | Timeout de 20 s no fallback Workers AI gera `503` intermitente | 3 invocações com ~20,36 s, geração com 0 Neurons em 2026-11-06T01:12–01:13Z | `worker/providers.js:7,145-166`; `worker/index.js:314-329` | Usuário recebe 503 mesmo com OpenRouter esgotada; retries repetem o ciclo | Latência do modelo 8B ultrapassa 20 s sob carga | Aumentar timeout do Workers AI para ~25 s; reduzir `max_tokens`/prompt; alinhar timeout do cliente; considerar modelo menor/mais rápido | P0 |
| 2 | **ALTO** | Primeiro modelo da OpenRouter não existe | `minimax/minimax-m3.1-flash:free` ausente no catálogo público; existe a versão paga | `wrangler.toml:11` | Toda requisição gasta uma tentativa inválida, aumenta latência e reduz chance de sucesso | ID validado em outra data e depois removido/renomeado | Corrigir a lista de modelos; validar IDs no CI contra o catálogo público; manter ao menos 2 modelos `:free` válidos | P0 |
| 3 | **ALTO** | Sem logs persistidos/correlation ID; impossível saber a etapa e o status do provedor | Observability `null`, Logpush `false`, Tail consumers vazios; logs só ao vivo | `worker/index.js:138,157,167,286,328` | Diagnóstico depende de reprodução manual; MTTR alto | Logs tratados como console, sem retenção | Habilitar Workers Logs; log JSON com `requestId`, `stage`, `providerStatus` e timings; devolver `X-Request-Id` | P0 |
| 4 | **ALTO** | Timeouts desalinhados: cliente 30 s, Worker até ~60 s | `src/config/aiConfig.js:19`; `worker/providers.js:7,63,153` | Cliente aborta antes do fallback; ou o Worker continua após o cliente desistir | Configuração independente em camadas | Definir orçamento total (ex.: 25 s) e derivar timeouts; abortar cadeia ao estourar o orçamento | P1 |
| 5 | **MÉDIO** | `503` genérico não distingue a etapa que falhou | Quatro ramos retornam o mesmo `unavailableMessage` | `worker/index.js:95-99,271,275,287,329` | Usuário e suporte não sabem se falhou embedding, OpenRouter ou Workers AI | Erros internos normalizados sem código | Manter mensagem amigável, mas incluir `errorCode` não sensível e `X-Request-Id`; logar etapa | P1 |
| 6 | **MÉDIO** | Sem circuit breaker; cada requisição tenta modelo inválido e provedor lento | Loop sequencial sem estado de saúde | `worker/index.js:123-174` | Latência e carga desnecessárias; retries amplificam | Ausência de estado de falha por provedor | Circuit breaker simples por modelo/provedor com janela de exclusão; cache negativo curto | P1 |
| 7 | **MÉDIO** | Falhas não são cacheadas; retries repetem embedding + LLM | Cache grava só `200` com `sources` | `worker/index.js:337-355`; `worker/cache.js:60-84` | 3 tentativas do cliente = 3 embeddings + 3 gerações | Cache negativo não previsto na SPEC-013 | Cache negativo curto (ex.: 60 s) por chave, com header `X-Assistant-Cache: NEGATIVE`; não cachear 429 longo | P1 |
| 8 | **MÉDIO** | Retry do cliente em 503 causa até 3 requisições caras | `maxRetries=2`; 503 transitório; três invocações observadas | `src/config/aiConfig.js:18,61`; `src/services/aiService.js:124-159` | Amplifica cota e latência; piora a percepção | Retry genérico para todo 5xx | Diferenciar 503 de provedor (retry curto) de 503 de embedding/timeout longo; respeitar `Retry-After` quando houver | P1 |
| 9 | **MÉDIO** | Sem rate limiting por IP/sessão | Não há KV/DO/Rate Limiting | `worker/index.js` | Abuso pode esgotar cota compartilhada e derrubar todos | Proteção limitada a CORS/tamanho | Cloudflare Rate Limiting ou Durable Object/KV com janela; limite por IP e global | P1 |
| 10 | **MÉDIO** | Prompt grande (~20,9 mil caracteres) e `max_tokens` alto no fallback | `buildSystemPrompt` ~18,7 mil chars + 4 chunks ~2,3 mil; `max_tokens: 1024` | `worker/prompt.js:34`; `worker/providers.js:163` | Latência maior no modelo 8B; mais chance de timeout | Prompt canônico extenso (ficha + projetos + regras) | Avaliar prompt mais enxuto para o fallback ou reduzir `max_tokens`; medir tokens | P2 |
| 11 | **MÉDIO** | Erro de dimensão no retrieval não é tratado | `cosine` lança em dimensões incompatíveis | `shared/retrieval.js:33-35`; `worker/index.js:290-305` | Exceção não capturada vira 500 do runtime, não 503 amigável | Falta de try/catch em `retrieveChunks` | Envolver retrieval em try/catch e responder `503`/`500` controlado; teste de dimensão | P2 |
| 12 | **BAIXO** | `.env.local` aponta para porta diferente do `wrangler dev` padrão | `.env.local` com `127.0.0.1:8788` | `.env.local` (não versionado) | Falha de conexão no desenvolvimento local | Configuração local desalinhada | Documentar/porta fixa no `wrangler dev` | P3 |
| 13 | **BAIXO** | Texto de competência cita LangChain/Gemini, mas runtime não usa | `src/i18n/locales/pt.js:321` | Vitrine | Pode induzir auditorias futuras ao erro | Texto de competência histórica | Manter, mas deixar claro que são competências, não stack do assistente | P3 |
| 14 | **BAIXO** | Sem endpoint de saúde | `GET /` sem Origin retorna 403 | `worker/index.js:189-195` | Monitoramento externo difícil | Rota única de chat | Adicionar `GET /health` com checagem leve (sem IA) | P3 |

> **Observação:** não foi identificado problema **CRÍTICO** de segurança (nenhuma credencial exposta no bundle, CORS ativo, sem stack trace ao cliente). O item 1 é o de maior impacto funcional imediato.

---

## 12. Hipóteses que dependem de logs externos

| Hipótese | Por que depende de logs | Como confirmar |
|---|---|---|
| A OpenRouter retornou `404` no primeiro modelo e outro erro no segundo | O Worker só loga `status` e `detail` truncado em `console.error`, sem retenção | `wrangler tail` durante reprodução; ou habilitar Workers Logs e consultar |
| A OpenRouter retornou `401`/`403` (chave inválida) e por isso a cadeia foi interrompida | O secret existe, mas o valor não é acessível; não há log retido | Log do Worker com `providerStatus`; teste controlado da chave |
| O Workers AI falhou por timeout, e não por erro imediato | 0 Neurons + atraso de 20 s sugerem timeout, mas não há log do erro | `wrangler tail` mostrando `[chat] workers-ai failed` com status/detalhe |
| As três invocações de 01:12–01:13Z são os retries do navegador do usuário | Correlação temporal forte, mas sem request ID compartilhado | Correlation ID no próximo deploy; comparar horário local do usuário |
| Houve sobrecarga/latência regional do Workers AI | Métricas agregadas não mostram fila/erro por colo | Logs com `colo`, duração e status do Workers AI |
| O `wall time` de 20,36 s é exatamente o timeout e não uma resposta de erro rápida | A coincidência é forte, mas não é prova definitiva | Log de `AbortError`/timeout no Worker |
| O modelo `@cf/meta/llama-3.1-8b-instruct-fp8` é adequado ao volume | Há sucessos em 10–15 s e falhas em 20 s | Medir p50/p95 e taxa de timeout por modelo ao longo de dias |

---

## 13. Plano de correção recomendado

> **Nenhuma correção foi implementada.** O plano abaixo deve virar SPEC/TASK aprovada pelo PO, conforme o fluxo SDD (`AGENTS.md`).

### Fase 0 — Coleta de evidências (antes de mudar código)

1. Reproduzir com `npx wrangler tail --name elessandrodev-chat --format json` e capturar:
   - `[chat] openrouter failed` com status/detalhe;
   - `[chat] workers-ai failed` com status/detalhe;
   - tempo entre embedding e geração.
2. Confirmar o horário local exato dos três `503` do usuário.
3. Verificar no dashboard da OpenRouter o status da chave e os erros recentes.
4. Habilitar observabilidade do Worker (ou um Tail Worker temporário) para não depender de reprodução ao vivo.

### Fase 1 — Correções de disponibilidade (P0/P1)

1. **Corrigir a lista de modelos** em `wrangler.toml:11`:
   - remover `minimax/minimax-m3.1-flash:free` (inexistente);
   - manter ao menos dois modelos `:free` válidos;
   - adicionar validação no CI contra `https://openrouter.ai/api/v1/models` (sem chave).
2. **Alinhar timeouts:**
   - definir orçamento total do Worker (ex.: 25 s);
   - Workers AI com timeout menor ou igual ao restante do orçamento;
   - cliente com timeout maior que o orçamento do Worker (ex.: 35 s) ou Worker abortando antes.
3. **Melhorar o fallback:**
   - reduzir `max_tokens` do Workers AI (ex.: 512–768) e/ou enxugar o prompt no fallback;
   - considerar modelo de fallback mais rápido;
   - registrar `providerStatus` e `stage` no log.
4. **Adicionar circuit breaker e cache negativo curto** para evitar repetir modelo inválido/provedor lento a cada requisição.
5. **Diferenciar 503 de etapa** no log e em header interno (`X-Assistant-Stage`, `X-Request-Id`), mantendo o corpo amigável.
6. **Rate limiting** por IP/sessão e limite global.

### Fase 2 — Observabilidade e operação (P1/P2)

1. Habilitar Workers Logs e retenção.
2. Log JSON estruturado com timings por etapa.
3. Painel/alerta para taxa de `503` por etapa e p95 de geração.
4. Endpoint `GET /health` sem IA para monitoramento.
5. Documentar runbook: como identificar se a falha é OpenRouter, Workers AI, embedding ou cache.

### Fase 3 — Qualidade (P2/P3)

1. Teste que simula timeout do Workers AI e verifica `503` com log de etapa.
2. Teste que garante que modelo inválido não é tentado (lista validada).
3. Teste de dimensão incompatível no retrieval.
4. Teste de cache negativo e de `Retry-After` respeitado pelo cliente.
5. Revisar prompt do fallback para reduzir tokens.

### Encaminhamento SDD sugerido

| Artefato | Conteúdo sugerido |
|---|---|
| **SPEC-014** | Resiliência do fallback: timeouts alinhados, modelos válidos, circuit breaker, cache negativo, semântica de 503 e observabilidade |
| **ADR-009** | Política de timeouts, fallback e observabilidade do Worker |
| **TASK-014** | Implementação da SPEC-014 |
| **QA-014 / REVIEW-014** | Evidências de teste, carga e produção |

---

## 14. Perguntas pendentes para o responsável pelo projeto

1. Em que horário local os três `503` ocorreram? A sessão foi por volta de 22:12–22:13 (horário de Brasília) em 2026-11-05?
2. Qual pergunta foi enviada? Era uma pergunta sobre legado, projetos ou outro tema?
3. A chave da OpenRouter foi renovada, revogada ou trocada recentemente? Há erros no dashboard da OpenRouter?
4. Há autorização para habilitar Workers Logs/observabilidade e/ou um Tail Worker temporário?
5. Há orçamento para Workers AI pago ou para comprar créditos na OpenRouter (aumenta o limite diário)?
6. O requisito é sempre responder `200` quando a OpenRouter falhar? Ou é aceitável responder `429` quando a cota diária esgotar?
7. Podemos reduzir o prompt do fallback ou o `max_tokens` do Workers AI em troca de menor latência?
8. Qual é o limite aceitável de latência percebida pelo visitante (ex.: 10 s, 20 s, 30 s)?
9. O Worker deve ser incluído no pipeline de deploy automatizado com versionamento e rollback?
10. Quer que a próxima etapa seja uma SPEC-014 formal para implementar as correções?

---

## Apêndice A — Referências de código

| Tema | Arquivo:linha |
|---|---|
| Rotas e validação | `worker/index.js:188-232` |
| CORS | `worker/index.js:53-61,189-198` |
| Mensagem 503 | `worker/index.js:95-99` |
| Cache key | `worker/cache.js:12-34` |
| Leitura/escrita de cache | `worker/cache.js:42-84` |
| Orquestração de geração | `worker/index.js:110-185` |
| Cadeia OpenRouter | `worker/providers.js:61-138` |
| Fallback Workers AI | `worker/providers.js:140-198` |
| Timeout 20 s | `worker/providers.js:7,63,153` |
| Embedding | `worker/rag/retrieve.js:17-20` |
| Retrieval híbrido | `shared/retrieval.js:96-115` |
| Chunking | `scripts/rag-lib.mjs:154-192` |
| Índice | `worker/rag/index.json` |
| Prompt canônico | `worker/prompt.js:34` |
| Cliente HTTP | `src/services/aiService.js:20-197` |
| Retry/backoff | `src/config/aiConfig.js:18-20,90-95` |
| Classificação de erro | `src/config/aiConfig.js:30-81` |
| Chat UI | `src/components/AiAssistant.vue:94-153` |
| CI/CD | `.github/workflows/deploy.yml:34-73` |
| Configuração do Worker | `wrangler.toml:1-19` |

## Apêndice B — Método e limites da auditoria

- Leitura integral dos arquivos do frontend, Worker, RAG, scripts, configuração e CI.
- Verificação de dependências efetivas (`package.json` e `package-lock.json`).
- Consulta pública ao catálogo da OpenRouter (sem chave e sem consumo de créditos).
- Consulta somente leitura às métricas agregadas do Cloudflare Workers (`workersInvocationsAdaptive` e `aiInferenceAdaptiveGroups`).
- Consulta somente leitura às configurações/deploy do Worker (bindings e variáveis; nenhum valor de secret foi lido).
- Build de commits em worktrees temporárias fora do repositório para confirmar o hash do bundle servido em produção; as worktrees foram removidas.
- Nenhum deploy, nenhuma alteração de configuração e nenhuma chamada de geração/embedding foi executada durante esta auditoria.
- Limitação principal: ausência de retenção de logs por requisição; as causas de provedor permanecem parcialmente hipotéticas.
