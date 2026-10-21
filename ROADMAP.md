# ROADMAP.md — Evolução Planejada do Projeto

> Planejamento estratégico do **elessandrodev** sob o framework **Universal SDD**.

---

## Versão Atual: v1.10.0 (2026-10-21)

- [x] Arquitetura Vue 3 + Vite + Tailwind CSS.
- [x] Design editorial com tema Dark/Light persistido.
- [x] Internacionalização nativa PT/EN.
- [x] Currículos bilíngues em `public/`.
- [x] **SPEC-001:** chat resiliente com retries, timeout e fallback.
- [x] **SPEC-002:** currículos bilíngues e trajetória sincronizada.
- [x] **SPEC-003:** revisão editorial e humanização da prosa.
- [x] **SPEC-004:** correção factual de modernização de legados.
- [x] **SPEC-005:** estudos de caso e laboratórios arquiteturais.
- [x] **SPEC-006:** testes automatizados no GitHub Actions.
- [x] **SPEC-007:** remediação de vulnerabilidades do Dependabot.
- [x] **SPEC-008:** RAG real com Cloudflare Worker, corpus Markdown, embeddings, retrieval híbrido, fontes e remoção de LangChain/Gemini do cliente.

---

## Backlog Estratégico

> Execução futura somente mediante SPEC aprovada pelo Product Owner.

### 1. [Performance] SPEC-009: Code splitting e cache de embeddings
- **Contexto:** o bundle principal está em ~211 KB; o índice e as chamadas de embedding podem ser otimizados.
- **Objetivo:** avaliar `manualChunks`, lazy loading do chat e cache de embeddings para perguntas repetidas.
- **Impacto:** menor First Load JS e menor latência em consultas recorrentes.

### 2. [Experiência] SPEC-010: Histórico conversacional
- **Contexto:** cada pergunta é respondida de forma isolada.
- **Objetivo:** janela deslizante de 3 a 5 mensagens com teto de tokens e persistência opcional em `sessionStorage`.
- **Impacto:** diálogos mais naturais sem inflar custos.

### 3. [Integrações] MCP e métricas
- **Contexto:** o assistente cobre o corpus profissional, mas não consulta repositórios ou métricas em tempo real.
- **Objetivo:** avaliar MCP para consultas de repositório e telemetria de satisfação.
- **Impacto:** respostas mais verificáveis e visão de uso.

---

## Visão de Longo Prazo (v2.0+)

- [ ] Integração com MCP para dados de repositório e métricas.
- [ ] Painel analítico de telemetria e satisfação.
- [ ] Migração para Vectorize se o corpus crescer acima de ~1,5 MB.
