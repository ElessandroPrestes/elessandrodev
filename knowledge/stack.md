# Base de Conhecimento: Stack Tecnológica — elessandrodev

> Detalhamento de cada camada tecnológica adotada no projeto.

---

## 1. Vue.js 3
- Versão: 3.4+
- Paradigma: Composition API com sintaxe `<script setup>`.
- Reatividade: `ref`, `computed`, `reactive` e composables desacoplados (`useTheme`, `useI18n`).
- Vantagens: Desempenho excepcional de renderização, tamanho mínimo de runtime e ecossistema maduro.

---

## 2. Vite
- Versão: 6.2+
- Papel: Servidor de desenvolvimento rápido (ESM nativo) e bundler de produção via Rollup.
- Configuração (`vite.config.js`): plugin `@vitejs/plugin-vue`, base path relativo para GitHub Pages (`./`).

---

## 3. Tailwind CSS & PostCSS
- Versão: 3.4+
- Paradigma: Utility-first CSS com dark mode baseado na classe `.dark` no elemento raiz `<html>`.
- Tipografia: Integração com Google Fonts (Space Grotesk, Inter, JetBrains Mono).

---

## 4. LangChain.js & Google Gemini
- `@langchain/core` e `@langchain/google-genai`.
- Orquestração de PromptTemplate, LLM e StringOutputParser.
- Modelos: Primário `gemini-3.5-flash` com resiliência automática para `gemini-3.6-flash`, `gemini-flash-latest` e `gemini-3.8-flash` para mitigar picos temporários de sobrecarga (503).

---

## 5. Docker & Makefile
- Dockerfile: Base Node.js Alpine para desenvolvimento replicável.
- `Makefile`: Automação com comandos intuitivos (`make up`, `make down`, `make build`, `make logs`).
