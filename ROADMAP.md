# ROADMAP.md — Evolução Planejada do Projeto

> Este documento registra o planejamento estratégico e a evolução do projeto **elessandrodev** sob o framework **Universal SDD**.

---

## 📌 Versão Atual: v1.5.0 (Concluída em 2026-10-08)

- [x] Arquitetura Vue 3 + Vite + Tailwind CSS.
- [x] Design System editorial com tema Dark e Light persistido.
- [x] Internacionalização nativa (Português e Inglês) via `useI18n`.
- [x] Favicon vetorial (`public/favicon.svg`) eliminando erro 404.
- [x] Bootstrap integral do framework **Universal SDD** (documentos canônicos, templates, standards, workflows, adr e docs).
- [x] **SPEC-001 (Refatoração do Chat):**
  - [x] Streaming reativo em tempo real via LangChain (`streamAssistant`) com renderização token a token.
  - [x] Eliminação do alias instável `gemini-flash-latest`.
  - [x] Resiliência multicamadas com modelo primário (`gemini-3.5-flash`) e fallback automático (`gemini-3.5-flash-lite`).
  - [x] Retries restritos a erros transitórios com backoff exponencial + jitter.
  - [x] Timeout controlado de 30s com `AbortController`.
  - [x] Proteção contra geração duplicada em interrupções após o 1º token.
  - [x] UX informativa com estados transitórios.
  - [x] Observabilidade estruturada e suíte de testes com 12/12 cenários aprovados.
- [x] **SPEC-002 (Currículos Bilíngues & Atualização Cadastral):**
  - [x] Alocação dos currículos oficiais em `public/`: `Elessandro_Prestes_Macedo_Engenheiro_de_Software.pdf` (PT) e `Elessandro_Prestes_Macedo_Software_Engineer.pdf` (EN).
  - [x] Reatividade dinâmica de download por idioma via `computed()` em `Statement.vue`.
  - [x] Atributos seguros de download e visualização sem perda de navegação (`:download`, `target="_blank"`).
  - [x] Atualização cronológica da trajetória profissional com a EPM DEVTECH (Tech Lead Jun/2026 – Atual e Engenheiro de Software com IA Out/2025 – Mai/2026).
  - [x] Sincronização estrita de dados factuais em `pt.js`, `en.js`, `aiService.js` e Toolbox.

---

## ⏳ Próximos Passos Recomendados (Backlog Estratégico — Não em Execução no Momento)

> **Status:** Anotado e planejado no SDD para execução futura mediante aprovação de SPEC pelo Product Owner.

### 1. [Segurança] SPEC-003: Backend-for-Frontend (BFF) Serverless para Proteção da API Key
- **Contexto:** Atualmente, a aplicação é uma SPA estática no GitHub Pages que realiza chamadas diretamente ao Gemini via `VITE_GEMINI_API_KEY`.
- **Objetivo:**
  - Criar um endpoint serverless leve (Cloudflare Workers, Vercel Edge Function ou AWS Lambda) para intermediar o chat.
  - Remover totalmente a API key do bundle do cliente.
  - Aplicar rate limiting por IP e cabeçalhos de CORS restritos para blindar as cotas contra abuso.
- **Impacto:** Eliminação do débito técnico de segurança sem encarecer a infraestrutura.

### 2. [Performance] SPEC-004: Code Splitting e Otimização de Chunks no Vite
- **Contexto:** O build de produção do Vite emite alerta de chunk superior a 500 kB devido ao empacotamento conjunto de LangChain, Marked e Vue (`index.js ~833 kB`).
- **Objetivo:**
  - Configurar `build.rollupOptions.output.manualChunks` no `vite.config.js`.
  - Separar os módulos pesados de fornecedor em chunks independentes: `vendor-langchain`, `vendor-vue`, `vendor-markdown`.
  - Habilitar importação dinâmica (`lazy loading`) do modal do terminal de IA para não impactar o LCP da página principal.
- **Impacto:** Redução drástica do First Load JS e melhoria nas métricas de Core Web Vitals (LCP, FID/INP).

### 3. [Experiência de Usuário] SPEC-005: Histórico Conversacional com Janela Deslizante
- **Contexto:** O assistente atualmente responde a cada pergunta de forma isolada, sem manter memória contextual de mensagens anteriores na mesma sessão.
- **Objetivo:**
  - Implementar janela deslizante de contexto enviando as últimas 3 a 5 mensagens anteriores no prompt.
  - Estabelecer teto rígido de tokens para não inflar custos ou tempo de resposta.
  - Opcional: Persistência temporária da conversa no `sessionStorage` ou `localStorage`.
- **Impacto:** Diálogos mais ricos e naturais com recrutadores e líderes técnicos.

### 4. [Qualidade & CI/CD] SPEC-006: Automação de Quality Gates no GitHub Actions
- **Contexto:** Os testes em `src/services/aiService.test.mjs` são executados manualmente antes do deploy.
- **Objetivo:**
  - Configurar workflow no GitHub Actions para executar a suíte de testes automatizados e o build estrito em cada Pull Request ou push na branch `develop`.
  - Bloquear automaticamente merges que não atendam aos Quality Gates do Universal SDD.
- **Impacto:** Garantia determinística de zero regressões em produção.

---

## 🔮 Visão de Longo Prazo (v2.0+)

- [ ] Integração com MCP (Model Context Protocol) para consultas de repositório e métricas em tempo real.
- [ ] Painel analítico de telemetria e satisfação das consultas de visitantes.
