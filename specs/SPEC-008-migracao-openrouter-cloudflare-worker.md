# SPEC-008 — Migração para OpenRouter com Proxy em Cloudflare Worker e RAG Real

| Campo         | Valor                                                       |
|---------------|-------------------------------------------------------------|
| **ID**        | SPEC-008                                                    |
| **Data**      | 2026-10-21                                                  |
| **Autor**     | Agente de IA (opencode)                                     |
| **Status**    | Aprovada pelo PO em 2026-10-21                              |
| **Versão**    | 2.0                                                         |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)       |

---

## 1. Contexto e Motivação

O chat do portfólio está em produção com Google Gemini chamado diretamente pelo navegador. Isso gerou:

1. **Erros 503 do Gemini** ("model is currently experiencing high demand") sem contingência confiável.
2. **Chave `VITE_GEMINI_API_KEY` exposta no bundle** estático do GitHub Pages, já revogada.
3. **Proxy Netlify inutilizável** no GitHub Pages, que não executa funções serverless.
4. **Bug de escopo em `aiService.js`**: a template literal de `ELESSANDRO_CONTEXT` abre na linha 13 e fecha na 136, absorvendo `chunkText`, `retrieveChunks` e `limparTravessoes`; qualquer chamada real falha com `ReferenceError`.
5. **Testes com verde falso**: os 12 primeiros cenários testam uma cópia da lógica (`simulateStreamOrchestration`), e o `process.exit(1)` ocorre antes dos testes de integração com `fetch` mockado; 3 testes falham e o processo termina com código 0.
6. **“RAG” que não é RAG**: a recuperação atual é busca lexical por substring sobre um blob único, com o currículo inteiro já injetado no prompt. Não há embeddings, índice vetorial, score, threshold, citação ou avaliação de recall.
7. **Documentação e rótulos desatualizados**: README, `PROJECT.md`, `docs/architecture.md`, `knowledge/stack.md` e o status do chat em `pt.js`/`en.js` ainda descrevem Gemini e LangChain.

A decisão arquitetural está registrada em **ADR-006**.

---

## 2. Objetivo

Migrar o assistente para um modelo gratuito da OpenRouter, acessado exclusivamente por um **Cloudflare Worker** que guarda a credencial em secret, e implementar **RAG real**:

- corpus canônico em Markdown;
- chunking com metadados;
- embeddings multilíngues via Cloudflare Workers AI;
- índice vetorial versionado;
- retrieval híbrido (similaridade de cosseno + BM25 lexical) com threshold;
- prompt contendo **apenas os chunks recuperados**;
- citação de fontes na resposta;
- avaliação de `hit@4` e MRR;
- fallback entre modelos gratuitos da OpenRouter.

Adicionalmente:

- eliminar a dívida técnica do `aiService.js`;
- fazer a suíte de testes falhar de verdade;
- alinhar documentação, rótulos e CI ao estado real;
- remover LangChain, que não terá uso real.

---

## 3. Escopo

### Está incluído (IN)

**RAG e ingestão**

- `knowledge/rag/` como fonte de verdade: perfil, experiências, projetos e FAQ.
- `scripts/build-index.mjs`: chunking por seção, embeddings em lote, escrita de `worker/rag/index.json`.
- Índice com `version`, `embeddingModel`, `dimensions`, `createdAt`, `sourceHash` e chunks (`id`, `source`, `section`, `text`, `hash`, `norm`, `vector`).
- `scripts/eval-retrieval.mjs` e `knowledge/eval/questions.json` com `hit@4` e MRR.
- `scripts/check-index.mjs` para verificar em CI se o índice está sincronizado com o corpus, sem chamar API.
- Scripts npm: `rag:index`, `rag:eval`, `rag:check`.

**Worker**

- `worker/index.js` com `fetch` direto para `https://openrouter.ai/api/v1/chat/completions`.
- Binding `AI` (`@cf/baai/bge-m3`) para embedding da pergunta.
- Retrieval híbrido (cosseno + BM25 lexical), `topK = 4`, `HYBRID_ALPHA` e `MIN_SCORE` configuráveis.
- Fallback sem LLM quando o melhor score ficar abaixo do threshold.
- `wrangler.toml` com `MODELS`, `EMBEDDING_MODEL`, `TOP_K`, `HYBRID_ALPHA`, `MIN_SCORE`, `ALLOWED_ORIGIN` e `SITE_URL` como variáveis não sensíveis.
- Secret `OPENROUTER_API_KEY` via Wrangler/Dashboard.
- `.dev.vars.example`, `.env.ingest.example`, `.dev.vars`, `.env.ingest` e `.wrangler/` no `.gitignore`.
- Validação de `Origin`, payload máximo de 2000 caracteres e pergunta máxima de 500 caracteres.
- CORS com `OPTIONS` e cabeçalhos para as origens permitidas.
- Cadeia de modelos: `env.MODEL || google/gemma-4-31b-it:free`, `minimax/minimax-m3.1-flash:free`, `nvidia/nemotron-3-super-120b-a12b:free`.
- Tratamento de `429`, `503` de embedding e timeout com mensagem amigável em PT/EN.

**Frontend**

- Reescrita de `src/services/aiService.js` para chamar o Worker com `{ question, locale }`, mantendo timeout, backoff, retry e telemetria.
- Ajustes em `AiAssistant.vue`, `aiConfig.js` e rótulos em `pt.js`/`en.js`.
- Exibição opcional das fontes retornadas pelo Worker.

**Qualidade e entrega**

- Reescrita de `src/services/aiService.test.mjs` para testar `streamAssistant` real com `fetch` mockado; `process.exit` no final.
- Testes unitários de chunking, cosseno, threshold e fallback sem LLM.
- CI sem `VITE_GEMINI_API_KEY`, usando `VITE_CHAT_API_URL` e `rag:check`.
- Remoção de `@langchain/google-genai`, `@langchain/core`, `@langchain/openai` e `langchain`.
- Atualização de README, `PROJECT.md`, `docs/`, `knowledge/stack.md` e `CHANGELOG.md`.
- ADR-006, SPEC-008, TASK-008, QA-008 e REVIEW-008.

### Não está incluído (OUT)

- Streaming token-a-token (SSE/`ReadableStream`) nesta fase.
- Rate limiting próprio por IP (KV/Durable Objects) nesta fase.
- Autenticação de visitantes.
- Cloudflare Vectorize nesta fase; o índice JSON é suficiente para dezenas de chunks.
- Compra de créditos na OpenRouter.
- Migração de hospedagem do GitHub Pages.
- Parsing automático do PDF em runtime; o Markdown é a fonte canônica.
- Recriação de `netlify/functions/chat.js` ou `test-api.js`.
- Mudanças de layout editorial fora da exibição de fontes do chat.

---

## 4. Requisitos Funcionais

### 4.1 Ingestão e índice

1. O script de ingestão deve ler apenas `knowledge/rag/**/*.md`.
2. O chunking deve respeitar títulos de seção (`#`, `##`, `###`), com tamanho alvo de até 1600 caracteres e overlap de 200, sem cortar no meio de uma palavra.
3. Cada chunk deve ter `id` estável, `source`, `section`, `text`, `hash` e metadados de origem.
4. Cada chunk deve ter vetor e norma pré-calculada.
5. O índice deve registrar `embeddingModel`, `dimensions`, `createdAt` e `sourceHash` do corpus.
6. A ingestão deve falhar de forma explícita se o corpus estiver vazio, se um arquivo não tiver seção ou se a API de embeddings retornar erro.
7. A ingestão deve ser determinística para o mesmo corpus e modelo: mesmo `sourceHash` e mesmos `id`s.

### 4.2 Retrieval

8. O Worker deve gerar o embedding da pergunta com o mesmo modelo e dimensões registrados no índice.
9. O Worker deve calcular similaridade de cosseno e score lexical BM25 entre a pergunta e todos os chunks, combinando-os por `HYBRID_ALPHA`.
10. O Worker deve ordenar por score decrescente e selecionar `TOP_K` chunks, com `TOP_K` padrão 4.
11. O Worker deve descartar chunks com score híbrido abaixo de `MIN_SCORE` (calibrado em 0.45).
12. Se nenhum chunk atingir `MIN_SCORE`, o Worker deve responder a mensagem padrão de ausência de informação **sem chamar a OpenRouter**.
13. Se o índice estiver ausente, vazio, com modelo divergente ou dimensões incompatíveis, o Worker deve responder `503` com mensagem amigável, sem tentar adivinhar.

### 4.3 Prompt e geração

14. O prompt deve conter apenas: regras de comportamento, bloco mínimo de perfil/contato, chunks recuperados com rótulo de fonte e a pergunta.
15. O currículo completo **não** deve ser enviado ao LLM.
16. O prompt deve instruir o modelo a responder somente com base nos chunks, citar a fonte e usar a mensagem padrão quando a evidência for insuficiente.
17. O Worker deve tentar os modelos da cadeia em ordem, sem duplicar IDs, em caso de erro de modelo, `429`, `5xx` ou timeout.
18. Se todos os modelos retornarem `429`, o Worker deve responder `429` com mensagem amigável.
19. Se todos falharem por outros motivos, o Worker deve responder `502` com mensagem genérica, sem vazar detalhes internos ou credencial.
20. A resposta de sucesso deve ser `{ response, sources }`, com `sources` contendo `id`, `source`, `section` e `score` dos chunks usados.

### 4.4 Contrato e segurança

21. O frontend deve enviar ao Worker somente `{ question, locale }`, sem prompt, contexto, chave ou parâmetros de modelo.
22. O Worker deve rejeitar `Origin` ausente ou não permitida com `403`.
23. O Worker deve responder ao preflight `OPTIONS` com os cabeçalhos CORS corretos.
24. O Worker deve rejeitar corpo acima de 2000 caracteres com `413` e pergunta vazia ou acima de 500 caracteres com `400`.
25. O Worker não deve registrar chave, prompt completo ou dados sensíveis em log.
26. O frontend deve exibir mensagem amigável para `429`, falha de rede, timeout e erro permanente, respeitando o locale.
27. O Worker deve responder no idioma solicitado (`pt` ou `en`), com fallback para `pt` em valores inválidos.

### 4.5 Avaliação e manutenção

28. O conjunto de avaliação deve ter pelo menos 12 perguntas com `expectedSource` e `expectedSection`.
29. O script de avaliação deve calcular `hit@4` e MRR e falhar se `hit@4 < 0.80`.
30. O script de verificação deve falhar em CI se o `sourceHash` do índice divergir do corpus.
31. O README deve documentar o fluxo de reindexação quando o currículo mudar.

---

## 5. Requisitos Não-Funcionais

| Requisito | Critério |
|---|---|
| Segurança | Nenhuma chave no bundle; secret apenas no Worker; validação de origem e limite de payload |
| Privacidade | Prompt e currículo não trafegam do cliente; cliente envia apenas pergunta e locale |
| Qualidade de retrieval | `hit@4 >= 0.80` no conjunto de avaliação; threshold calibrado |
| Performance | Timeout total de 25 s; embedding + chat sem bloquear a UI; sem streaming nesta fase |
| Resiliência | Até 2 retries com backoff no cliente; fallback de 3 modelos no Worker; fallback sem LLM por threshold |
| Disponibilidade | Falha do Worker ou do embedding não deve quebrar a página; apenas o chat exibe erro |
| Testes | `npm test` deve falhar com exit code diferente de zero quando o serviço quebrar |
| Build | `npm run build` sem erros; `rag:check` sem divergências |
| Acessibilidade | UI existente preservada; nenhuma regressão de teclado, foco ou contraste |
| Internacionalização | Mensagens de erro, status e fontes em `pt.js` e `en.js` |
| Observabilidade | Telemetria estruturada sem segredo, apenas em `DEV`; registrar `retrievalTopScore` e `retrievalHits` |
| Tamanho do índice | Índice JSON abaixo de 1,5 MB nesta fase |
| CPU do Worker | Cosseno viável para o corpus atual; migrar para Vectorize se o corpus crescer ou a CPU estourar |

---

## 6. Comportamento Esperado

### Cenário 1: Pergunta coberta pelo corpus
**Dado** que a pergunta tem evidência no índice  
**Quando** o Worker gera o embedding, recupera chunks acima do threshold e chama a OpenRouter  
**Então** responde com conteúdo fundamentado, cita as fontes e retorna `sources`.

### Cenário 2: Pergunta fora do corpus
**Dado** que nenhum chunk atinge `MIN_SCORE`  
**Quando** o Worker conclui o retrieval  
**Então** responde a mensagem padrão de ausência de informação, com `sources: []`, sem chamar a OpenRouter.

### Cenário 3: Origem inválida
**Dado** que a requisição parte de uma origem não listada  
**Quando** o Worker recebe o `POST`  
**Então** responde `403` e não chama embeddings nem OpenRouter.

### Cenário 4: Payload acima do limite
**Dado** um corpo com mais de 2000 caracteres  
**Quando** o Worker recebe o `POST`  
**Então** responde `413` sem chamar embeddings nem OpenRouter.

### Cenário 5: Pergunta vazia ou longa
**Dado** `question` vazia, composta só de espaços ou com mais de 500 caracteres  
**Quando** o Worker valida o corpo  
**Então** responde `400`.

### Cenário 6: Rate limit da OpenRouter
**Dado** que a OpenRouter responde `429`  
**Quando** o Worker esgota a cadeia de modelos  
**Então** responde `429` com mensagem amigável no locale solicitado.

### Cenário 7: Modelo de chat indisponível
**Dado** que o primeiro modelo retorna erro de modelo ou `5xx`  
**Quando** o Worker tenta o próximo da cadeia  
**Então** usa o primeiro modelo que responder com conteúdo.

### Cenário 8: Embedding indisponível
**Dado** que o Workers AI falha ou estoura a cota  
**Quando** o Worker tenta gerar o embedding da pergunta  
**Então** responde `503` com mensagem amigável, sem cair silenciosamente para busca lexical.

### Cenário 9: Índice divergente
**Dado** que o índice foi gerado com modelo ou dimensões diferentes do configurado  
**Quando** o Worker inicia o retrieval  
**Então** responde `503` com mensagem amigável e registra telemetria de erro.

### Cenário 10: Índice desatualizado
**Dado** que o corpus mudou e o índice não foi regerado  
**Quando** `npm run rag:check` roda em CI  
**Então** falha com exit code diferente de zero, indicando reindexação.

### Cenário 11: Teste quebrado
**Dado** uma regressão intencional em `streamAssistant`, no cosseno ou no threshold  
**Quando** `npm test` é executado  
**Então** o processo termina com código diferente de zero.

### Cenário 12: Worker indisponível
**Dado** que o Worker está fora do ar ou o cliente perde a rede  
**Quando** o visitante envia uma mensagem  
**Então** o chat exibe erro amigável e a página continua funcional.

---

## 7. Critérios de Aceitação

- [ ] `knowledge/rag/` criado com corpus canônico.
- [ ] `npm run rag:index` gera `worker/rag/index.json` com metadados, hashes e vetores.
- [ ] `npm run rag:eval` reporta `hit@4 >= 0.80` e MRR.
- [ ] `npm run rag:check` passa e falha quando o corpus muda sem reindexação.
- [ ] `worker/index.js` e `wrangler.toml` criados e funcionais.
- [ ] `OPENROUTER_API_KEY` configurado como secret; ausente do repositório e do bundle.
- [ ] Binding `AI` configurado e embedding `@cf/baai/bge-m3` funcionando.
- [ ] `curl` com `Origin` válido retorna `200` e `{ response, sources }`.
- [ ] `curl` com `Origin` inválido retorna `403`.
- [ ] `curl` com corpo acima de 2000 caracteres retorna `413`.
- [ ] `curl` com `question` vazia ou acima de 500 caracteres retorna `400`.
- [ ] `429` retorna mensagem amigável no idioma solicitado.
- [ ] Fallback entre modelos funciona quando o primeiro falha.
- [ ] Pergunta fora do corpus retorna fallback sem chamar a OpenRouter (comprovado por mock).
- [ ] O prompt não contém o currículo completo (comprovado por teste/inspeção).
- [ ] `npm test` passa e falha quando o serviço é quebrado de propósito.
- [ ] `npm run build` compila sem erros.
- [ ] `grep` no `dist/` não encontra `VITE_GEMINI`, `OPENROUTER_API_KEY` ou chave em texto claro.
- [ ] Chat responde em produção no GitHub Pages e exibe fontes.
- [ ] `netlify/` e `test-api.js` não fazem parte da solução.
- [ ] `@langchain/google-genai`, `@langchain/core`, `@langchain/openai` e `langchain` removidos.
- [ ] README, `PROJECT.md`, `docs/architecture.md`, `docs/faq.md`, `knowledge/stack.md`, `pt.js`, `en.js` e `CHANGELOG.md` alinhados.
- [ ] Commits em Português do Brasil no padrão Conventional Commits.
- [ ] QA-008 e REVIEW-008 registrados.

---

## 8. Impactos e Dependências

### Arquivos a criar

- `knowledge/rag/00-perfil.md`
- `knowledge/rag/10-experiencia.md`
- `knowledge/rag/20-projetos.md`
- `knowledge/rag/30-faq.md`
- `knowledge/eval/questions.json`
- `scripts/build-index.mjs`
- `scripts/eval-retrieval.mjs`
- `scripts/check-index.mjs`
- `worker/index.js`
- `worker/rag/index.json` (gerado)
- `worker/rag/retrieve.js`
- `wrangler.toml`
- `.dev.vars.example`
- `.env.ingest.example`
- `adr/ADR-006-migracao-openrouter-cloudflare-worker.md`
- `specs/SPEC-008-migracao-openrouter-cloudflare-worker.md`
- `tasks/TASK-008-migracao-openrouter-cloudflare-worker.md`
- `reviews/QA-008.md`
- `reviews/REVIEW-008.md`

### Arquivos a modificar

- `src/services/aiService.js`
- `src/services/aiService.test.mjs`
- `src/config/aiConfig.js`
- `src/components/AiAssistant.vue`
- `src/i18n/locales/pt.js`
- `src/i18n/locales/en.js`
- `.env.example`
- `.gitignore`
- `.github/workflows/deploy.yml`
- `package.json`
- `package-lock.json`
- `README.md`
- `PROJECT.md`
- `docs/architecture.md`
- `docs/faq.md`
- `knowledge/stack.md`
- `CHANGELOG.md`

### Dependências

- Depende de: revogação da chave Gemini e criação da chave OpenRouter (Passo 0, concluído).
- Depende de: conta Cloudflare com Workers e Workers AI habilitados.
- Depende de: token Cloudflare local para ingestão (`CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN`).
- Bloqueia: atualização de documentação e release.

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Threshold mal calibrado gera falsos negativos | Alta | Calibrar com `rag:eval` e perguntas negativas; valor atual 0.45 |
| Índice desatualizado após mudança no currículo | Alta | `rag:check` no CI; documentar reindexação |
| Modelo de embedding muda ou é descontinuado | Média | `EMBEDDING_MODEL` configurável; `dimensions` no índice; reindexar |
| Cota do Workers AI (10k Neurons/dia) | Média | Consultas curtas; monitorar; Vectorize/plano pago se necessário |
| Limite de 50 req/dia da OpenRouter | Média | Fallback sem LLM por threshold; mensagem amigável para 429; avaliar créditos |
| Threshold baixo traz chunk irrelevante | Média | `MIN_SCORE` + prompt instruindo a ignorar evidência fraca; avaliação |
| Índice grande estoura bundle/CPU do Worker | Média | Limitar corpus; medir; migrar para Vectorize se necessário |
| Modelo gratuito indisponível | Média | Cadeia de 3 modelos; `MODEL` configurável |
| `ALLOWED_ORIGIN` mal configurado | Média | Matriz de `curl` no Passo 4 e teste em produção no Passo 10 |
| Chave vazada novamente | Baixa | Secret no Worker, `.dev.vars`/`.env.ingest` ignorados, revisão de bundle |
| `Origin` spoofável fora do navegador | Média | Documentar que não é autenticação; rate limit próprio em fase futura |
| Testes continuarem com verde falso | Baixa | Mock de `fetch` no serviço real; exit code no final; prova de falha intencional |

---

## 10. Referências

- ADR relacionado: `adr/ADR-006-migracao-openrouter-cloudflare-worker.md`
- OpenRouter — chat completions: https://openrouter.ai/docs
- OpenRouter — modelos: https://openrouter.ai/models
- OpenRouter — embeddings: https://openrouter.ai/docs/api/reference/embeddings
- Cloudflare Workers — documentação: https://developers.cloudflare.com/workers/
- Cloudflare Workers AI — `@cf/baai/bge-m3`: https://developers.cloudflare.com/workers-ai/models/bge-m3/
- Cloudflare Workers AI — pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Wrangler — documentação: https://developers.cloudflare.com/workers/wrangler/

> Versões, comandos do Wrangler, IDs de modelo, dimensões de embedding e limites gratuitos devem ser confirmados na documentação oficial antes da execução.

---

## 11. Aprovação Humana Obrigatória

| Campo | Valor |
|---|---|
| **Aprovado por** | Elessandro Prestes Macedo |
| **Data** | |
| **Assinatura** | [ ] Aprovado [ ] Rejeitado |
| **Observações** | |
