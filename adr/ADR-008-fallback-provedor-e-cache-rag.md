# ADR-008 — Fallback de Provedor e Cache RAG-Aware contra 429

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | ADR-008                                    |
| **Data**      | 2026-11-05                                 |
| **Autor**     | Elessandro Prestes Macedo                  |
| **Status**    | Aceito em 2026-11-05                       |
| **Decisores** | Elessandro Prestes Macedo                  |

---

## Contexto

O assistente em produção passou a retornar `429` para os visitantes:

```text
Failed to load resource: the server responded with a status of 429
O assistente atingiu o limite temporário de requisições. Tente novamente em alguns minutos.
```

A OpenRouter limita modelos `:free` a aproximadamente 20 requisições/minuto e 50/dia por conta. O limite é da conta, não do modelo, e vale para toda a cadeia gratuita configurada na ADR-006. Quando a cota diária zera, todos os modelos retornam `429`.

O desenho anterior tinha três agravantes:

1. **Cadeia sem troca de provedor:** esgotada a OpenRouter, não havia alternativa e o Worker devolvia `429`.
2. **Retry no cliente:** `src/config/aiConfig.js` classificava `429` como transitório e o navegador retentava até duas vezes, multiplicando requisições contra uma cota já zerada.
3. **Sem cache:** perguntas repetidas de portfólio consumiam embedding e geração sempre.

---

## Decisão

Adotar duas camadas independentes de resiliência, sem mudar o contrato `{ question, locale } → { response, sources }`:

### 1. Fallback de provedor para Cloudflare Workers AI

- A geração continua preferindo a OpenRouter (cadeia gratuita configurada em `MODELS`).
- Se todos os modelos OpenRouter falharem por `429`, `5xx`, timeout ou resposta inválida, o Worker usa `env.AI.run` com o mesmo `system` e `user` prompt.
- Modelo configurável em `WORKERS_AI_MODEL`, padrão `@cf/meta/llama-3.1-8b-instruct-fp8`.
- A resposta passa pela mesma sanitização, checagem de CJK e citação de fontes.
- Se o Workers AI também falhar, o Worker devolve `429` (cota) ou `503` (indisponibilidade), com mensagem amigável.

### 2. Cache RAG-aware na Cache API

- Chave: `SHA-256(locale + pergunta normalizada + index.sourceHash + index.embeddingModel)`.
- A leitura ocorre **antes** do embedding e da geração; em hit, nenhum provedor é chamado.
- Só respostas `200` com `sources.length > 0` são gravadas.
- TTL padrão de 24 h, configurável em `CACHE_TTL_SECONDS`.
- `ENABLE_CACHE=false` desativa a camada.
- Como `sourceHash` entra na chave, reindexar o corpus invalida respostas antigas automaticamente.
- A Cache API é nativa do runtime Workers; nenhum binding ou KV é necessário.

### 3. Semântica correta de 429

- `429` com `X-RateLimit-Remaining: 0` (ou mensagem de cota diária) interrompe a cadeia OpenRouter **imediatamente** e aciona o Workers AI.
- A resposta final `429` inclui `Retry-After` derivado de `X-RateLimit-Reset`/`Retry-After`, com fallback conservador de 3600 s.
- No cliente, `429` deixa de ser transitório: não há retry; a mensagem amigável do Worker é preservada.

---

## Consequências

### Positivas

- O assistente continua respondendo mesmo com a cota diária da OpenRouter esgotada.
- Perguntas repetidas não consomem cota nem elevam latência.
- A troca de corpus invalida o cache por `sourceHash`, sem intervenção manual.
- O frontend para de amplificar o problema com retries em `429`.
- Nenhuma credencial nova; Workers AI já era usado para embeddings.
- Nenhum binding novo; Cache API é nativa.

### Negativas / Trade-offs

- O Workers AI passa a consumir a mesma cota de 10.000 Neurons/dia usada pelos embeddings.
- A qualidade do modelo de fallback pode ser inferior à dos modelos da OpenRouter; o prompt e a sanitização são mantidos.
- O cache é por pergunta normalizada (não semântico): paráfrases não compartilham entrada.
- O cache é local ao data center; a taxa de acerto cresce com o tráfego.
- Respostas podem ficar até 24 h defasadas em relação a mudanças que não alterem o `sourceHash`.
- `X-RateLimit-Remaining` é um contrato externo e pode mudar; a detecção é best-effort.

---

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|-------------|------|---------|---------------------|
| Comprar créditos na OpenRouter | Limite de 1000/dia | Custo recorrente/único e dependência de um provedor | Pode ser feito depois; não resolve indisponibilidade do provedor |
| Aumentar a cadeia de modelos free | Nenhum código | Cota é da conta, não do modelo | Não resolve |
| Retry com backoff no Worker | Simples | Cota diária não recupera em segundos | Insuficiente |
| Rate limit por IP (KV/DO) | Protege a cota | Complexidade operacional e novo binding | Fase futura |
| Cache semântico por embeddings | Melhor taxa de acerto | Custo extra de embedding e complexidade | Evolução futura |
| Vectorize | Escala | Setup maior | Corpus pequeno |
| Workers AI como provedor principal | Menos dependências | Qualidade/limite de Neurons | OpenRouter continua preferencial |
| **OpenRouter + fallback Workers AI + Cache API RAG-aware** | **Disponibilidade, economia e baixo custo operacional** | **Consumo de Neurons no fallback** | **Escolhida** |

---

## Conformidade e Validação

- `npm test` cobre cache hit/miss, invalidação por `sourceHash`, cota esgotada, fallback Workers AI e `429` final.
- `src/services/aiService.test.mjs` prova que `429` não dispara retry.
- `npm run rag:check` e `npm run rag:eval` permanecem verdes.
- `npm run build` sem erros; bundle sem segredos.
- Deploy do Worker validado em produção com pergunta repetida e cota esgotada simulada.
- Evidências em `reviews/QA-013.md` e `reviews/REVIEW-013.md`.
- Revisão desta ADR se o modelo de fallback, o limite de Neurons ou a política de cache mudarem.
