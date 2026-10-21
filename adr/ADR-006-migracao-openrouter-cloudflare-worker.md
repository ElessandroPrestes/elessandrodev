# ADR-006 — Migração para OpenRouter com Proxy em Cloudflare Worker e RAG Real

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | ADR-006                                    |
| **Data**      | 2026-10-21                                 |
| **Autor**     | Elessandro Prestes Macedo                  |
| **Status**    | Aceito em 2026-10-21                       |
| **Decisores** | Elessandro Prestes Macedo                  |

---

## Contexto

O assistente conversacional do portfólio chamava o Google Gemini diretamente do navegador, usando `VITE_GEMINI_API_KEY`. Esse desenho produziu quatro problemas:

1. **Indisponibilidade em produção:** erros `503` do Gemini por alta demanda, sem fallback efetivo após a remoção do modelo de contingência.
2. **Exposição de credencial:** a chave era embutida no bundle estático publicado no GitHub Pages.
3. **Proxy incompatível com a hospedagem:** a tentativa de proxy em Netlify Functions não funciona no GitHub Pages, que serve apenas artefatos estáticos.
4. **Dívida técnica local:** o `aiService.js` da working tree tinha a template literal de `ELESSANDRO_CONTEXT` aberta da linha 13 à 136, engolindo as funções de RAG e gerando `ReferenceError`.

Além disso, o “RAG” existente não era real: consistia em busca lexical por substring sobre um único blob, com o currículo inteiro já injetado no prompt. Não havia embeddings, índice vetorial, score de similaridade, threshold, citação de fonte nem avaliação de recall.

O site continuará hospedado no GitHub Pages. A credencial e o pipeline de recuperação precisam viver em um backend separado do frontend.

---

## Decisão

Adotar **Cloudflare Worker** como Backend-for-Frontend e **OpenRouter** como provedor de geração, implementando **RAG real** com embeddings, índice vetorial e recuperação semântica.

### Contrato

- O cliente envia apenas `POST { question, locale }` para o Worker.
- O Worker mantém as regras de prompt, o índice RAG, a credencial e a lógica de fallback de modelos.
- O Worker valida `Origin` contra `ALLOWED_ORIGIN`, limita o corpo a 2000 caracteres e a pergunta a 500 caracteres.
- Resposta de sucesso: `{ response, sources: [{ id, source, section, score }] }`. Sem streaming nesta fase.

### Pipeline RAG

1. **Fonte de verdade:** arquivos Markdown em `knowledge/rag/` (perfil, experiências, projetos, FAQ). O PDF continua apenas como download; o Markdown é o corpus canônico.
2. **Ingestão offline:** `scripts/build-index.mjs` lê o corpus, faz chunking por seção, gera embeddings e escreve `worker/rag/index.json` com `id`, `source`, `section`, `text`, `hash`, `vector` e `norm`.
3. **Embeddings:** Cloudflare Workers AI, modelo multilíngue `@cf/baai/bge-m3`, via binding `AI` no Worker e via API REST na ingestão local. Dimensões descobertas na geração e gravadas no índice, sem hardcode.
4. **Retrieval:** embedding da pergunta em runtime, similaridade de cosseno sobre o índice, `topK = 4` e `MIN_SCORE` configurável.
5. **Threshold:** se o melhor score ficar abaixo de `MIN_SCORE`, o Worker responde a mensagem padrão de ausência de informação **sem chamar o LLM**.
6. **Augmentation:** o prompt recebe apenas as regras, um bloco mínimo de perfil/contato e os chunks recuperados com rótulo de fonte. O currículo completo **não** vai no prompt.
7. **Geração:** OpenRouter com cadeia de modelos gratuitos.
8. **Citação:** a resposta inclui `sources`, e o modelo é instruído a citar a origem dos fatos.
9. **Avaliação:** `knowledge/eval/questions.json` + `scripts/eval-retrieval.mjs` medem `hit@4` e MRR. O alvo é `hit@4 >= 0.80`; o threshold é calibrado com esse conjunto.

### Alternativa descartada para embeddings

A OpenRouter também oferece embeddings gratuitos (`nvidia/nemotron-3.5-embed-1b:free`), mas cada pergunta passaria a consumir duas requisições (embedding + chat), reduzindo o limite efetivo de 50/dia para cerca de 25/dia. Workers AI mantém a cota de chat intacta e roda na edge.

### Modelos de geração

Cadeia de fallback, sem duplicar IDs:

```
[ env.MODEL || "google/gemma-4-31b-it:free",
  "minimax/minimax-m3.1-flash:free",
  "nvidia/nemotron-3-super-120b-a12b:free" ]
```

IDs validados na API pública da OpenRouter em 2026-10-21. A disponibilidade pode mudar; o modelo é configurável por variável de ambiente.

### Credenciais

- Produção: secret `OPENROUTER_API_KEY` no Worker; binding `AI` sem chave explícita.
- Desenvolvimento local do Worker: `.dev.vars`, não versionado.
- Ingestão local: `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` em `.env.ingest`, não versionado.
- Frontend, GitHub Actions, `wrangler.toml` e repositório: **nenhuma chave**.

### Limites conhecidos

- OpenRouter gratuito: 20 requisições/minuto e 50/dia; 1000/dia após compra única de US$ 10 em créditos.
- Workers AI: 10.000 Neurons/dia no plano gratuito.
- Respostas `429` e indisponibilidade de embedding devem gerar mensagem amigável em PT/EN.

### Origens permitidas

- `https://elessandroprestes.github.io`
- `http://localhost:5212`

### Remoção de dependências

- Remover `@langchain/google-genai`, `@langchain/core`, `@langchain/openai` e `langchain`. O pipeline real usa `fetch` e cosseno; LangChain não é requisito de RAG e não terá uso real no projeto.
- Não recriar `netlify/functions/chat.js` nem o mock `test-api.js`.

---

## Consequências

### Positivas

- RAG semanticamente real: embeddings, similaridade, threshold, citação e avaliação de recall.
- Nenhuma chave de API no bundle ou no Git.
- Cota de chat da OpenRouter preservada, porque os embeddings ficam no Workers AI.
- Respostas fundamentadas apenas nos chunks recuperados, reduzindo alucinação.
- Perguntas fora do corpus não gastam chamada de LLM.
- Índice versionado e auditável, com hash por chunk.
- Fallback entre três modelos gratuitos reduz indisponibilidade por modelo.
- Contrato pequeno e testável, sem confiar no cliente para montar prompt.
- Remoção de LangChain reduz bundle, superfície de dependência e manutenção.

### Negativas / Trade-offs

- Pipeline de ingestão adicional e necessidade de reindexar quando o currículo mudar.
- Dependência de Cloudflare Workers AI e OpenRouter.
- Limite gratuito de 50 req/dia na OpenRouter e 10.000 Neurons/dia na Workers AI.
- Sem streaming nesta fase.
- Threshold precisa de calibração com o conjunto de avaliação; valor fixo pode gerar falsos negativos.
- Índice embutido no Worker aumenta o bundle; corpus grande exigirá Vectorize.
- CPU do Worker no plano gratuito é limitado; cosseno em memória só é viável para corpus pequeno.
- `Origin` não é autenticação; rate limit próprio fica para fase futura.
- A narrativa “LangChain” sai do portfólio; a narrativa passa a ser “RAG real com embeddings e citação”, tecnicamente mais forte.

---

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|-------------|------|---------|---------------------|
| Manter o “RAG” lexical atual | Zero infraestrutura | Sem embeddings, sem score, currículo inteiro no prompt, sem citação | Não é RAG real |
| Manter Gemini direto no navegador | Menos infraestrutura | Chave exposta, 503 sem fallback | Risco de segurança e indisponibilidade |
| OpenRouter direto no navegador | Simples | Chave exposta no bundle | Mesmo problema de segurança |
| Netlify/Vercel Functions | Ecossistema conhecido | Não executam no GitHub Pages | Quebra o deploy atual |
| OpenRouter para embeddings e chat | Uma chave, um provedor | 2 req/pergunta; cota efetiva ~25/dia; 2 chamadas de rede | Consome a cota de chat |
| LangChain + Vectorize no Worker | Narrativa “LangChain” | Bundle e dependências maiores; sem ganho para este corpus | Complexidade sem retorno |
| Vectorize desde o início | Escala e metadados | Setup maior; desnecessário para dezenas de chunks | Pode migrar depois |
| **Worker + Workers AI (`bge-m3`) + OpenRouter + índice JSON** | **RAG real, cota de chat preservada, edge, auditável** | **Ingestão e reindexação; limite de corpus** | **Escolhida** |

---

## Conformidade e Validação

- `npm run rag:index` gera o índice de forma determinística, com hash e dimensões.
- `npm run rag:eval` reporta `hit@4` e MRR; alvo `hit@4 >= 0.80`.
- `npm test` exercita chunking, cosseno, threshold, fallback sem LLM e o `streamAssistant` real com `fetch` mockado; falha deve resultar em exit code diferente de zero.
- `npm run build` sem erros e `grep` no `dist/` sem `VITE_GEMINI`, `OPENROUTER_API_KEY` ou chave em texto claro.
- Matriz de `curl` no Worker: origem válida, origem inválida, payload grande, pergunta vazia, `429`, `503` de embedding e fallback de modelo.
- Code review e evidências em `reviews/QA-008.md` e `reviews/REVIEW-008.md`.
- Documentação alinhada em `README.md`, `PROJECT.md`, `docs/` e `CHANGELOG.md`.
- Revisão desta ADR caso o modelo de embedding, o provedor, o limite gratuito ou o tamanho do corpus mudem.
