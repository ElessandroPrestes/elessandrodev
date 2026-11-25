# Arquitetura do Sistema — elessandrodev

> Visão arquitetural do portfólio e do assistente RAG.

---

## 1. Topologia da Solução

```
[Navegador / Visitante]
         │
         ├───► GitHub Pages (SPA Vue 3 + Vite)
         │         └─── AiAssistant.vue
         │                   │ POST { question, locale }
         │                   ▼
         └───► Cloudflare Worker (elessandrodev-chat)
                   ├─── Upstash Redis: cache por revisão, breaker e rate limit
                   ├─── Workers AI: embedding da pergunta (@cf/baai/bge-m3)
                   ├─── Índice RAG versionado (worker/rag/index.json)
                   ├─── Recuperação híbrida: cosseno + BM25
                   ├─── Threshold de relevância e fontes
                   ├─── OpenRouter: geração com cadeia de modelos free
                   ├─── Workers AI: fallback de geração
                   └─── Trechos do currículo ou canais de contato
```

O frontend é estático. A chave da OpenRouter existe apenas como secret do Worker; nunca é embutida no bundle do GitHub Pages.

---

## 2. Decisões Arquiteturais

1. **Frontend estático no GitHub Pages:** SPA Vue 3 sem servidor próprio, com deploy via GitHub Actions.
2. **Backend no Cloudflare Worker:** concentra a chave do provedor de LLM, o índice RAG e as regras de segurança.
3. **RAG real com corpus Markdown:** o conteúdo profissional fica em `knowledge/rag/`, é dividido em chunks por seção e indexado com embeddings multilíngues.
4. **Recuperação híbrida:** combina similaridade de cosseno com BM25 lexical (`HYBRID_ALPHA=0.6`), reduzindo falhas em perguntas com termos exatos.
5. **Threshold e fallback:** se nenhum chunk atinge `MIN_SCORE=0.45`, o Worker responde sem chamar o LLM. Se a cadeia OpenRouter falha, o Worker tenta o Workers AI com o mesmo prompt.
6. **Cache RAG-aware:** respostas completas são cacheadas em Redis por revisão do índice, idioma e SHA-256 da pergunta normalizada. Um hit pula embedding e LLM. Cada reindexação muda o prefixo.
7. **Citação de fontes:** a resposta retorna `{ response, sources, origin, provider, timestamp }`. A interface mostra origem, seção e score.
8. **Composables nativos:** tema e idioma sem stores globais.

---

## 3. Ciclo do Índice RAG

```bash
npm run rag:index   # gera worker/rag/index.json com embeddings
npm run rag:eval    # mede hit@4, MRR e cobertura do threshold
npm run rag:check   # valida sourceHash e consistência sem chamar APIs
```

O `rag:check` roda no CI e falha se o índice divergir do corpus.

O prefixo de cache inclui `sourceHash` e `createdAt`. Reindexar o corpus e publicar o índice muda o prefixo. As chaves antigas expiram por TTL.

---

## 4. Resiliência e Limites de Provedor

O Worker valida a requisição e consulta o cache. Em miss, verifica o limite por
visitante, recupera os trechos e tenta o OpenRouter se o breaker permitir. Na
falha do primário, o Workers AI pode gerar com o mesmo contexto. Se a geração
estiver indisponível, devolve os trechos recuperados. Se a busca falhar ou não
encontrar trechos relevantes, devolve os canais de contato.

O breaker e o contador usam operações atômicas no Redis. Na falha do Redis,
o Worker usa o breaker por instância e o binding nativo `CHAT_RATE_LIMITER`.
O cache só recebe gerações completas, com TTL configurável. Os eventos do Worker
usam `requestId` para correlacionar as etapas. O [runbook](operations.md) descreve
as métricas, a configuração e os cenários de falha.

---

## 5. Segurança

- `OPENROUTER_API_KEY` é configurada via `wrangler secret put`, nunca em `.env` de produção.
- `CLOUDFLARE_API_TOKEN` de ingestão fica em `.env.ingest` (ignorado pelo Git).
- CORS restrito a `https://elessandroprestes.github.io`, `http://localhost:5212`, `http://127.0.0.1:5212` e `http://elessandrodev.localhost`.
- Limites de payload (2000 bytes) e pergunta (500 caracteres).
- Rate limit de geração por IP pseudonimizado (10 consultas/60 s).
- Logs usam `requestId` e metadados de etapa. O Worker não registra perguntas, IPs, prompts ou chaves.
- Prompt instrui o modelo a usar apenas o contexto recuperado e a recusar informações ausentes.
- O cache armazena apenas resposta e fontes públicas; a chave usa hash da pergunta e nunca guarda prompt, chave ou dados sensíveis.
