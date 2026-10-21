# TASK-008 — Migração para OpenRouter com Proxy em Cloudflare Worker e RAG Real

| Campo              | Valor                                                  |
|--------------------|--------------------------------------------------------|
| **ID**             | TASK-008                                               |
| **SPEC**           | SPEC-008                                               |
| **Data de início** | 2026-10-21                                             |
| **Agente**         | Agente de IA (opencode)                                |
| **Status**         | Em Andamento — Fase D concluída, Fase E/F (testes e CI) |

---

## Escopo da Implementação

> Baseado na SPEC-008 aprovada, esta TASK implementa estritamente:

1. **Corpus canônico** em `knowledge/rag/` (perfil, experiências, projetos, FAQ).
2. **Ingestão offline** (`scripts/build-index.mjs`) com chunking por seção, embeddings `@cf/baai/bge-m3` e geração de `worker/rag/index.json`.
3. **Avaliação de retrieval** (`scripts/eval-retrieval.mjs` + `knowledge/eval/questions.json`) com `hit@4` e MRR.
4. **Verificação de índice** (`scripts/check-index.mjs`) para CI, sem chamar API.
5. **Worker** (`worker/index.js`) com binding `AI`, retrieval por cosseno, threshold, prompt enxuto, fallback de modelos e resposta `{ response, sources }`.
6. **Configuração** (`wrangler.toml`, `.dev.vars.example`, `.env.ingest.example`, `.gitignore`).
7. **Deploy** do Worker via Wrangler.
8. **Validação** com matriz de `curl`.
9. **Frontend** (`aiService.js`, `aiConfig.js`) sem Gemini/LangChain, enviando apenas `{ question, locale }`.
10. **UI e i18n** (`AiAssistant.vue`, `pt.js`, `en.js`) com fontes e mensagens de erro.
11. **Testes** (`aiService.test.mjs` e testes unitários de retrieval) com exit code correto.
12. **CI e dependências** (`.github/workflows/deploy.yml`, `package.json`).
13. **Documentação** (README, `PROJECT.md`, `docs/`, `knowledge/stack.md`, `CHANGELOG.md`).
14. **Fechamento** com build, testes, deploy, produção, QA-008 e REVIEW-008.

---

## Arquivos a Criar

| Arquivo | Descrição |
|---|---|
| `knowledge/rag/00-perfil.md` | Perfil, título, especialidades e contato |
| `knowledge/rag/10-experiencia.md` | Experiências com métricas e contexto |
| `knowledge/rag/20-projetos.md` | Projetos e laboratórios arquiteturais |
| `knowledge/rag/30-faq.md` | Perguntas frequentes e notas de domínio |
| `knowledge/eval/questions.json` | Conjunto de avaliação com fonte esperada |
| `scripts/build-index.mjs` | Chunking, embeddings e geração do índice |
| `scripts/eval-retrieval.mjs` | Cálculo de `hit@4` e MRR |
| `scripts/check-index.mjs` | Verificação de sincronia do índice |
| `shared/retrieval.js` | Cosseno, tokenização, BM25 e score híbrido compartilhados |
| `worker/index.js` | Proxy + RAG no Cloudflare Worker |
| `worker/rag/retrieve.js` | Cosseno, top-k e threshold |
| `worker/rag/index.json` | Índice gerado (versionado) |
| `wrangler.toml` | Configuração do Worker e bindings |
| `.dev.vars.example` | Placeholder de `OPENROUTER_API_KEY` |
| `.env.ingest.example` | Placeholder de `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` |
| `reviews/QA-008.md` | Evidências de QA |
| `reviews/REVIEW-008.md` | Revisão final |

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/services/aiService.js` | Remover Gemini/LangChain, corrigir template literal, chamar o Worker |
| `src/config/aiConfig.js` | URL do Worker e parâmetros de resiliência |
| `src/services/aiService.test.mjs` | Testar o serviço real com `fetch` mockado |
| `src/components/AiAssistant.vue` | Ajustar chamada, fontes e mensagens de erro |
| `src/i18n/locales/pt.js` | Rótulos, status, erros e fontes em PT-BR |
| `src/i18n/locales/en.js` | Rótulos, status, erros e fontes em EN |
| `.env.example` | `VITE_CHAT_API_URL`; remover variáveis Gemini |
| `.gitignore` | `.dev.vars`, `.env.ingest`, `.wrangler/` |
| `.github/workflows/deploy.yml` | Remover `VITE_GEMINI_API_KEY`; adicionar `VITE_CHAT_API_URL` e `rag:check` |
| `package.json` / `package-lock.json` | Scripts RAG; remover os quatro pacotes LangChain |
| `README.md` | Arquitetura, setup, ingestão, deploy e limites |
| `PROJECT.md` | Estado canônico |
| `docs/architecture.md` | Topologia Worker + Workers AI + OpenRouter |
| `docs/faq.md` | Respostas sobre RAG, Worker e limites |
| `knowledge/stack.md` | Stack real |
| `CHANGELOG.md` | Release da migração |

---

## Checklist de Implementação

### Fase 0 — Governança
- [x] ADR-006 criado
- [x] SPEC-008 criada
- [x] TASK-008 criada
- [x] SPEC-008 aprovada explicitamente pelo PO

### Fase A — Corpus, ingestão e avaliação
- [x] `knowledge/rag/00-perfil.md` criado
- [x] `knowledge/rag/10-experiencia.md` criado
- [x] `knowledge/rag/20-projetos.md` criado
- [x] `knowledge/rag/30-faq.md` criado
- [x] Notas de domínio preservadas (ONS ≠ Energia Pecém; legados só CAPES e Grupo Paraíso)
- [x] `scripts/build-index.mjs` implementado
- [x] Chunking por seção com overlap e `id` estável
- [x] Embeddings em lote com `@cf/baai/bge-m3`
- [x] Retrieval híbrido (cosseno + BM25) com `HYBRID_ALPHA = 0.6`
- [x] `shared/retrieval.js` com funções puras para Node e Worker
- [x] `worker/rag/index.json` gerado com metadados, hashes, vetores e normas
- [x] Índice determinístico para o mesmo corpus/modelo
- [x] `knowledge/eval/questions.json` com pelo menos 12 perguntas
- [x] `scripts/eval-retrieval.mjs` calcula `hit@4` e MRR
- [x] `hit@4 >= 0.80` atingido (100%)
- [x] `MIN_SCORE` calibrado em 0.45 com perguntas positivas e negativas
- [x] `scripts/check-index.mjs` implementado
- [x] Scripts npm `rag:index`, `rag:eval` e `rag:check` adicionados

### Fase B — Worker
- [x] `worker/index.js` criado
- [x] `worker/rag/retrieve.js` criado (cosseno, BM25, top-k, threshold)
- [x] `wrangler.toml` criado com `MODELS`, `EMBEDDING_MODEL`, `TOP_K`, `HYBRID_ALPHA`, `MIN_SCORE`, `ALLOWED_ORIGIN` e `SITE_URL`
- [x] Binding `[ai]` configurado
- [x] `ALLOWED_ORIGIN` inclui `https://elessandroprestes.github.io` e `http://localhost:5212`
- [x] `.dev.vars.example` e `.env.ingest.example` criados
- [x] `.dev.vars`, `.env.ingest` e `.wrangler/` no `.gitignore`
- [x] Prompt com regras + perfil mínimo + chunks recuperados + pergunta
- [x] Currículo completo ausente do prompt
- [x] `OPTIONS` e cabeçalhos CORS implementados
- [x] Limites de 2000/500 caracteres implementados
- [x] Cadeia de modelos sem duplicatas
- [x] `429` amigável em PT/EN
- [x] `503` amigável para falha de embedding e índice inválido
- [x] Fallback sem LLM quando nenhum chunk atinge o threshold
- [x] Resposta `{ response, sources }`
- [x] Nenhum log de chave/prompt
- [x] `wrangler deploy --dry-run` validado (373.82 KiB / gzip 123.46 KiB)
- [x] Caminhos de sucesso, CORS, limites, `429`, `503` e fallback testados com `fetch`/`AI` mockados

### Fase C — Deploy e validação do Worker
- [x] `wrangler login`
- [x] `wrangler secret put OPENROUTER_API_KEY`
- [x] `wrangler deploy`
- [x] URL do Worker anotada: `https://elessandrodev-chat.elessandrodev.workers.dev`
- [x] Origem válida → `200` + `{ response, sources }`
- [x] Origem inválida → `403`
- [x] Payload > 2000 → `413`
- [x] Pergunta vazia → `400`
- [x] Pergunta > 500 → `400`
- [x] `429` → mensagem amigável (validado com mock local)
- [x] Pergunta fora do corpus → fallback sem chamada de chat
- [x] Fallback entre modelos validado (mock local)

### Fase D — Frontend
- [x] Bug da template literal corrigido
- [x] Gemini removido do `aiService.js`
- [x] LangChain removido do cliente
- [x] Envio apenas de `{ question, locale }`
- [x] Timeout, backoff, retry e `429` mantidos
- [x] Telemetria sem segredo, com `retrievalTopScore` e `retrievalHits`
- [x] `AiAssistant.vue` ajustado
- [x] `aiConfig.js` ajustado
- [x] Rótulos "GEMINI 2.5 FLASH" e "LANGCHAIN" substituídos
- [x] Exibição de fontes implementada
- [x] Mensagens de erro em PT e EN

### Fase E — Testes
- [ ] Testes unitários de chunking
- [ ] Testes unitários de cosseno
- [ ] Testes de threshold e fallback sem LLM
- [x] `fetch` mockado no serviço real
- [x] Cenários de sucesso, `429`, `5xx`, erro permanente e timeout
- [x] `process.exit` movido para o final
- [ ] Prova de falha intencional registrada

### Fase F — CI e dependências
- [x] `VITE_GEMINI_API_KEY` removida do workflow
- [x] `VITE_CHAT_API_URL` configurada no workflow
- [x] `rag:check` adicionado ao CI
- [x] `@langchain/google-genai` removido
- [x] `@langchain/core` removido
- [x] `@langchain/openai` removido
- [x] `langchain` removido

### Fase G — Documentação
- [x] README atualizado com arquitetura RAG real
- [x] `PROJECT.md` atualizado
- [x] `docs/architecture.md` atualizado
- [x] `docs/faq.md` atualizado
- [x] `knowledge/stack.md` atualizado
- [x] `CHANGELOG.md` atualizado

### Fase H — Fechamento
- [x] `npm run rag:index`
- [x] `npm run rag:eval`
- [x] `npm run rag:check`
- [x] `npm test`
- [x] `npm run build`
- [x] Build publicado no GitHub Pages
- [x] Chat testado em produção com fontes
- [x] QA-008 e REVIEW-008 registrados
- [x] Commits em pt-BR

---

## Checklist de Validação & QA

- [x] `npm run rag:check` sem divergências
- [x] `npm run rag:eval` com `hit@4 >= 0.80`
- [x] `npm run build` sem erros
- [x] `npm test` com exit code 0 no estado correto
- [x] `grep` no `dist/` sem `VITE_GEMINI`, `OPENROUTER_API_KEY` ou chave em texto claro
- [x] Chat funcional em `http://localhost:5212`
- [x] Deploy em `https://elessandroprestes.github.io/elessandrodev/` com bundle apontando para o Worker
- [ ] Interação visual manual no chat publicado (checklist de UI)
- [x] Fontes exibidas no chat
- [ ] Dark/Light Mode preservados
- [ ] Alternância PT/EN preservada
- [ ] Navegação por teclado e foco preservados
- [ ] Erro do Worker/embedding não quebra a página

---

## Evidências de Conclusão

### Ingestão

```text
Arquivos: 4 | Seções: 34 | Chunks: 34
  knowledge/rag/00-perfil.md: 12 chunk(s)
  knowledge/rag/10-experiencia.md: 7 chunk(s)
  knowledge/rag/20-projetos.md: 6 chunk(s)
  knowledge/rag/30-faq.md: 9 chunk(s)
sourceHash: 236a53398ade3c11eac9d915ea3a7b12a562559ae6fcc1b9b6c4940677b29350
Dimensões: 1024 | Tamanho: 344.6 KB
```

### Avaliação de Retrieval

```text
Resumo:
  hit@4: 100.0% (20/20)
  MRR: 0.975
  cobertura do threshold: 100.0% (20/20)
```

### Verificação do Índice

```text
Índice consistente com o corpus.
Arquivo: worker/rag/index.json (344.6 KB)
Chunks: 34 | Modelo: @cf/baai/bge-m3 | Dimensões: 1024
sourceHash: 236a53398ade3c11eac9d915ea3a7b12a562559ae6fcc1b9b6c4940677b29350
```

### Resultado dos Testes

```text
Resultado: 16/16 testes passaram.
```

### Resultado do Build

```text
dist/assets/index-L8Dz2nt2.js   211.09 kB │ gzip: 69.96 kB
✓ built in 6.64s
```

### Validação do Worker

```text
valid:          200 (9.09s) — 569 chars, 3 fontes
invalid origin: 403 — {"error":"Origem não permitida."}
empty:          400 — {"error":"Pergunta obrigatória."}
out of corpus:  200 (0.30s) — fallback sem LLM, sources: []
bundle scan:    clean
```

### Verificação do Bundle

```text
clean
```

---

## Notas do Agente

- A SPEC-008 precisa de aprovação explícita do PO antes de qualquer implementação.
- Decisão de embeddings: Cloudflare Workers AI `@cf/baai/bge-m3` (multilíngue), para preservar a cota de chat da OpenRouter.
- Decisão de índice: JSON versionado com cosseno em memória; Vectorize fica para quando o corpus crescer.
- LangChain será removido: não é requisito de RAG e não terá uso real após a migração.
- O currículo completo não pode ir no prompt; o teste deve provar isso.
- O threshold inicial de 0.35 é um chute informado; a calibração real vem do `rag:eval`.
- A ingestão precisa de `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` apenas no ambiente local; nenhum dos dois vai para o Worker ou para o repositório.
- Se o índice crescer acima de ~1,5 MB ou o cosseno estourar a CPU do Worker, migrar para Vectorize em SPEC própria.
- Limites da OpenRouter, Workers AI, IDs de modelos e dimensões devem ser revalidados na documentação oficial durante a execução.
