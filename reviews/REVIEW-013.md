# REVIEW-013 — Revisão Técnica da SPEC-013

| Campo        | Valor                                                                    |
|--------------|--------------------------------------------------------------------------|
| **ID**       | REVIEW-013                                                               |
| **SPEC**     | SPEC-013                                                                 |
| **TASK**     | TASK-013                                                                 |
| **QA**       | QA-013                                                                   |
| **ADR**      | ADR-008                                                                  |
| **Data**     | 2026-11-05                                                               |
| **Revisor**  | Elessandro Prestes Macedo (Product Owner & Tech Lead)                    |
| **Resultado**| ✅ Aprovado sem Ressalvas                                                |

---

## 1. Verificação de Escopo

- [x] Cache RAG-aware na Cache API com chave `SHA-256(locale + pergunta normalizada + sourceHash + embeddingModel)`.
- [x] Leitura do cache antes do embedding e da geração; hit não chama `env.AI.run` nem provedor.
- [x] Apenas respostas `200` com `sources.length > 0` são gravadas.
- [x] `sourceHash` invalida o cache automaticamente após reindexação.
- [x] `ENABLE_CACHE=false` desativa leitura e escrita sem quebrar o fluxo.
- [x] `CACHE_TTL_SECONDS` aplicado via `Cache-Control: max-age`, com padrão de 86400 s.
- [x] Fallback OpenRouter → Workers AI com o mesmo `system` e `user` prompt.
- [x] `429` com `X-RateLimit-Remaining: 0` ou detalhe de cota interrompe a cadeia OpenRouter.
- [x] Resposta final `429` inclui `Retry-After` derivado de `X-RateLimit-Reset`/`Retry-After`.
- [x] Worker não vaza status interno, modelo, chave ou corpo de erro do provedor.
- [x] `isTransientError(429) === false`; cliente não faz retry e preserva a mensagem do Worker.
- [x] Contrato `{ question, locale } → { response, sources }` inalterado.
- [x] Nenhuma mudança em corpus, chunking, retrieval, prompt ou modelo de embeddings.
- [x] Nenhum binding obrigatório novo; Workers AI já existia e Cache API é nativa.

---

## 2. Evidências

- `npm test`: **38/38** (16 cliente, 10 prompt, 12 Worker).
- `rag:check`: **36 chunks**, 365.0 KB, `sourceHash` consistente.
- `rag:eval`: hit@4 **100%**, MRR **0.975**, cobertura **100%**.
- `npm run build`: **211.06 kB**, sem erros; bundle sem segredos.
- Testes cobrem cache hit/miss, invalidação por `sourceHash`, cache desativado, interrupção da cadeia em cota esgotada, fallback Workers AI e `429` final.
- QA completo em `reviews/QA-013.md`.

---

## 3. Produção

- Worker: `elessandrodev-chat`.
- Deploy ativo: `269dcbb7-2a2b-43e6-a130-0c78ee5e80f3` (2026-11-05T13:01:55Z).
- Requisição inédita em EN: `200`, `X-Assistant-Cache: MISS`, `X-Assistant-Provider: workers-ai` — prova de fallback em produção com a OpenRouter esgotada.
- Repetição da pergunta: `200`, `X-Assistant-Cache: HIT` — prova de cache sem nova geração.
- CORS e corpo `{ response, sources }` preservados.

---

## 4. Decisão de Aprovação

A implementação cumpre a SPEC-013 e a ADR-008 sem expandir escopo. O assistente deixa de expor `429` ao visitante quando a cota gratuita da OpenRouter se esgota, e perguntas repetidas passam a ser atendidas pelo cache sem consumo de embedding ou LLM.

A release **1.12.0** está registrada em `CHANGELOG.md`, `PROJECT.md` e `ROADMAP.md`.

---

## 5. Riscos Residuais

- Cache por pergunta exata não cobre paráfrases; evolução para cache semântico fica para SPEC futura.
- O fallback consome a cota de Neurons do Workers AI, compartilhada com os embeddings.
- `X-RateLimit-Remaining` é contrato externo; a detecção é best-effort e o fallback continua sendo acionado em `429` sem cabeçalho.
- Quando a OpenRouter está com cota esgotada e o Workers AI também falha, o Worker responde `429` (causa dominante de cota), conforme o requisito 16 e o critério de aceitação da SPEC-013.
