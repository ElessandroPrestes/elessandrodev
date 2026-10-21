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
                   ├─── Workers AI: embedding da pergunta (@cf/baai/bge-m3)
                   ├─── Índice RAG versionado (worker/rag/index.json)
                   ├─── Recuperação híbrida: cosseno + BM25
                   ├─── Threshold de relevância e fontes
                   └─── OpenRouter: geração com fallback entre modelos
```

O frontend é estático. A chave da OpenRouter existe apenas como secret do Worker; nunca é embutida no bundle do GitHub Pages.

---

## 2. Decisões Arquiteturais

1. **Frontend estático no GitHub Pages:** SPA Vue 3 sem servidor próprio, com deploy via GitHub Actions.
2. **Backend no Cloudflare Worker:** concentra a chave do provedor de LLM, o índice RAG e as regras de segurança.
3. **RAG real com corpus Markdown:** o conteúdo profissional fica em `knowledge/rag/`, é dividido em chunks por seção e indexado com embeddings multilíngues.
4. **Recuperação híbrida:** combina similaridade de cosseno com BM25 lexical (`HYBRID_ALPHA=0.6`), reduzindo falhas em perguntas com termos exatos.
5. **Threshold e fallback:** se nenhum chunk atinge `MIN_SCORE=0.45`, o Worker responde sem chamar o LLM. Se o modelo principal falha, tenta o próximo modelo configurado.
6. **Citação de fontes:** a resposta retorna `{ response, sources }`; a UI mostra seção e score de cada fonte.
7. **Composables nativos:** tema e idioma sem stores globais.

---

## 3. Ciclo do Índice RAG

```bash
npm run rag:index   # gera worker/rag/index.json com embeddings
npm run rag:eval    # mede hit@4, MRR e cobertura do threshold
npm run rag:check   # valida sourceHash e consistência sem chamar APIs
```

O `rag:check` roda no CI e falha se o índice divergir do corpus.

---

## 4. Segurança

- `OPENROUTER_API_KEY` é configurada via `wrangler secret put`, nunca em `.env` de produção.
- `CLOUDFLARE_API_TOKEN` de ingestão fica em `.env.ingest` (ignorado pelo Git).
- CORS restrito a `https://elessandroprestes.github.io`, `http://localhost:5212`, `http://127.0.0.1:5212` e `http://elessandrodev.localhost`.
- Limites de payload (2000 bytes) e pergunta (500 caracteres).
- Prompt instrui o modelo a usar apenas o contexto recuperado e a recusar informações ausentes.
