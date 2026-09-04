# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.2.0] - 2026-09-04

### Adicionado
- **Reformulação Visual Completa — Editorial Tech & Brutalismo Sofisticado Suíço**:
  - Incorporação das fontes tipográficas `Space Grotesk` (display/títulos), `Inter` (corpo editorial) e `JetBrains Mono` (metadados e números de benchmarks).
  - Nova arquitetura de narrativa técnica em 6 blocos numerados (`01 Statement`, `02 Selected Work`, `03 Core Engineering`, `04 Trajectory`, `05 Technical Toolbox`, `06 Contact`).
  - Posicionamento assertivo sobre a aplicação de IA no ciclo de desenvolvimento com SDD e RAG.
  - Apresentação de projetos como **Estudos de Caso (Case Studies)** estruturados em grid assimétrico com detalhamento de problema, arquitetura, métricas mensuradas e stack curada em linha.
  - Componente `Architecture.vue` apresentando disciplinas arquiteturais profundas (Strangler Fig Pattern, Event-Driven Architecture, IA Aplicada com SDD/RAG e Qualidade Determinística/TDD).
  - Componente `Toolbox.vue` com agrupamento semântico por domínios de engenharia, erradicando paredes de badges/pills repetitivas.
  - Redesenho do `Experience.vue` para formato ledger/tabela cronológica técnica.
  - Refatoração do `Header.vue` com masthead editorial, navegação por coordenadas numéricas e indicador de status operacional.
  - Redesenho do `AiAssistant.vue` para estética de terminal técnico RAG minimalista.

### Modificado
- **Alinhamento e Refatoração de Experiência e Clientes**:
  - Atribuição correta da modernização legada (56.400+ linhas, Laravel 12, 2.399 testes automatizados) para a cliente **Amura Sistemas**.
  - Padronização de referências a sistemas de energia para **ONS - Energia Pecém**.
  - Expansão do escopo técnico na experiência do **Grupo Paraíso**, cobrindo toda a infraestrutura têxtil do chão de fábrica (IoT, WebSockets) até o varejo (e-commerce, CRM e microsserviços ERP).
  - Refatoração do posicionamento de IA para destacar a aplicação direta no ciclo de desenvolvimento de software com SDD, RAG e integrações com LLMs.
  - Atualização do contexto factual e prompts no assistente conversacional RAG (`aiService.js` e `AiAssistant.vue`).

## [1.1.0] - 2026-09-04

### Adicionado
- **Feature Light Mode e Dark Mode**:
  - Implementação de alternância de temas com estratégia `darkMode: 'class'` no Tailwind CSS.
  - Componente `ThemeToggle.vue` acessível no cabeçalho com ícones animados de Sol e Lua e semântica ARIA (`role="switch"`).
  - Composable reativo `useTheme.js` com detecção de preferência do sistema operacional (`prefers-color-scheme`), persistência em `localStorage` e escuta de eventos em tempo real.
  - Script síncrono inline no `<head>` do `index.html` e meta tag `color-scheme` para prevenção absoluta de FOUC.

---

## [1.0.0] - 2026-03-01

### Adicionado
- Lançamento inicial da Single Page Application (SPA) em Vue.js 3 e Tailwind CSS.
- Assistente Virtual com IA conversacional integrado a LangChain e Google Gemini (`gemini-2.5-flash`).
- Containerização completa com Docker e Docker Compose.
- Automação de tarefas com GNU Makefile.
- Pipeline de integração e entrega contínua (CI/CD) no GitHub Actions com deploy automatizado no GitHub Pages.
