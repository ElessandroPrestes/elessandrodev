# Base de Conhecimento: Stack Tecnológica — elessandrodev

> Detalhamento de cada camada tecnológica adotada no projeto.

---

## 1. Vue.js 3
- Versão: 3.4+
- Paradigma: Composition API com sintaxe `<script setup>`.
- Reatividade: `ref`, `computed`, `reactive` e composables desacoplados (`useTheme`, `useI18n`).

---

## 2. Vite
- Versão: 6.2+
- Papel: servidor de desenvolvimento e bundler de produção.
- Configuração (`vite.config.js`): plugin `@vitejs/plugin-vue`, `base: '/elessandrodev/'`, porta local `5212` com `strictPort`.

---

## 3. Tailwind CSS & PostCSS
- Versão: 3.4+
- Paradigma: utility-first CSS com dark mode baseado na classe `.dark` no elemento raiz `<html>`.
- Tipografia: Google Fonts (Space Grotesk, Inter, JetBrains Mono).

---

## 4. Cloudflare Worker, Workers AI e OpenRouter
- **Cloudflare Worker:** backend HTTP do assistente, com CORS, limites de payload e prompt grounded.
- **Workers AI:** binding `AI` usado para gerar embeddings com `@cf/baai/bge-m3`.
- **OpenRouter:** geração de texto com fallback entre modelos gratuitos.
- **Índice RAG:** `worker/rag/index.json`, gerado a partir de `knowledge/rag/*.md`.
- **Recuperação:** cosseno + BM25, `TOP_K=4`, `HYBRID_ALPHA=0.6`, `MIN_SCORE=0.45`.
- **Segurança:** `OPENROUTER_API_KEY` somente como secret do Worker.

---

## 5. Docker & Makefile
- Dockerfile: base Node.js Alpine para desenvolvimento replicável.
- `Makefile`: automação com comandos (`make up`, `make down`, `make build`, `make logs`).
