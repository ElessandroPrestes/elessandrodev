# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.9.1] - 2026-10-08

### Corrigido
- **Remediação de Vulnerabilidades de Segurança do Dependabot (SPEC-007 / TASK-007)**:
  - Atualizado `vue` e `@vue/server-renderer` para `3.5.43`, sanando vulnerabilidade de XSS via missing CR (Alerta Dependabot #113 / GHSA-g2v6-rqmx-r4w6).
  - Atualizado `source-map-js` para `1.2.2` via `npm audit fix`, resolvendo vulnerabilidade de negação de serviço (DoS) no event-loop (Alerta Dependabot #115 / GHSA-68fv-2mgg-jv7q).
  - Configurados `"overrides"` no `package.json` para ancorar `postcss-selector-parser` em `^7.1.6` (resolvendo Alerta Dependabot #114 / GHSA-rj75-hqrm-r3gf) e `braces` em `^3.0.3`, prevenindo quebras e mantendo compatibilidade com Tailwind CSS v3.
  - Zero quebra na UI e aprovação total nos Quality Gates (`npm test` com 12/12 testes e `npm run build` com 0 erros).

---

## [1.9.0] - 2026-10-08

### Adicionado
- **Automação de Testes e Quality Gates no GitHub Actions (SPEC-006 / TASK-006)**:
  - Adicionado script `"test": "node src/services/aiService.test.mjs"` em `package.json`.
  - Configurada etapa bloqueante `Run automated tests` em `.github/workflows/deploy.yml` antes do `Build project`, garantindo validação dos 12 testes canônicos de resiliência e streaming de IA a cada push ou PR.
  - Implementada resolução resiliente de variáveis de ambiente em `src/services/aiService.test.mjs` para execução desacoplada em runners de CI e suporte a secrets.

---

## [1.8.0] - 2026-10-08

### Modificado
- **Atualização dos Estudos de Caso de Engenharia & Laboratórios Arquiteturais (SPEC-005 / TASK-005)**:
  - Redefinição do título e subtítulo da seção `02 / SELECTED WORK`: "Projetos em Destaque & Laboratórios Arquiteturais" (*Featured Case Studies & Architecture Labs*).
  - Inclusão do manifesto contextual conectando os repositórios públicos no GitHub aos desafios técnicos de alta concorrência, resiliência e escala vivenciados na carreira em produção.
  - Adição do campo **ORIGEM & CONTEXTO REAL** (*REAL-WORLD ORIGIN & CONTEXT*) em cada um dos 5 estudos de caso em `Projects.vue`, `pt.js` e `en.js`:
    - `universal-sdd`: Engenharia de Software Moderna & Liderança Técnica (EPM DevTech / Consultoria).
    - `elessandrodev`: Arquitetura de Dados & Interfaces Reativas (EPM DevTech).
    - `event-driven-processing-system`: Integrações críticas de missão em tempo real (Projeto GENIN / ONS via AMcom e Migrações CAPES).
    - `iot-mqtt-simulator`: Automação fabril e projetos industriais (Grupo Paraíso / Projetos IoT & Chão de Fábrica).
    - `fintech-wallet-solution`: Sistemas Críticos de Cobrança e Conciliação Financeira (SISCAD / CAPES via Datainfo e ERPs Corporativos).
  - Alinhamento analítico completo dos 5 projetos com problema e contexto aprofundados, soluções de engenharia, métricas de produção e stack técnica.
  - Sincronização do contexto RAG do assistente de IA conversacional (`aiService.js`).
  - Zero regressão: 100% de integridade em templates Vue 3, classes Tailwind CSS e aprovação com 12/12 testes automatizados e build de produção sem erros.

---

## [1.7.0] - 2026-10-08

### Modificado
- **Correção Factual e Atribuição de Modernização de Sistemas Legados (SPEC-004 / TASK-004)**:
  - Delimitação estrita de que a modernização de sistemas legados e o *Strangler Fig Pattern* em monólitos ocorreram exclusivamente na **CAPES** (Projeto SIPREC — modernização de sistema monolítico legado de avaliação da pós-graduação para microsserviços e BFF em Angular atendendo 448+ IES) e no **Grupo Paraíso** (ERP da Indústria Têxtil — migração gradual de ERP monolítico legado para microsserviços com Node.js via Strangler Fig Pattern, reduzindo custos em 40%, além de soluções de chão de fábrica e IoT).
  - Remoção completa de referências a sistemas legados, monólitos legados e "linhas legadas eliminadas" na **EPM DEVTECH**, reposicionando sua atuação para arquitetura e engenharia de plataformas web de alta performance em PHP 8.2 / Laravel 12 e Node.js, arquitetura modular, 2.399 testes automatizados com Pest/PHPUnit, APIs REST e IA aplicada com governança via SDD.
  - Correção do manifesto em `Statement.vue` (PT e EN) dissociando a modernização de legados do **Operador Nacional do Sistema Elétrico (ONS)** e da **Usina Termelétrica Energia Pecém**, consolidando suas atribuições corretas em sistemas distribuídos de alta concorrência e arquiteturas orientadas a eventos.
  - Atualização do princípio arquitetural ARCH-01 (*Strangler Fig Pattern*) para referenciar exclusivamente `SIPREC / CAPES (448+ IES)` e `Grupo Paraíso (ERP Indústria Têxtil)`.
  - Inclusão de `NOTA DE DOMÍNIO SOBRE MODERNIZAÇÃO DE SISTEMAS LEGADOS` no contexto do assistente de IA (`src/services/aiService.js`), assegurando fidelidade factual nas respostas interativas geradas pelo modelo.
  - Zero regressão: validação com 100% de sucesso na suíte de testes automatizados (12/12) e compilação limpa do Vite (`npm run build`).

---

## [1.6.0] - 2026-10-08

### Modificado
- **Revisão e Humanização da Prosa Editorial (SPEC-003 / TASK-003 / `/humanizer`)**:
  - Eliminação sistemática de 25 padrões e clichês de IA ("ecossistemas robustos", "blindar contratos", "pioneiro", "delve", "testament", "não é apenas X, é Y", tríades artificiais e excesso de travessões).
  - Adoção de tom de Engenheiro de Software Sênior & Tech Lead: técnico, direto, sóbrio e fundamentado em decisões arquiteturais, problemas reais e métricas mensuráveis de produção.
  - Alinhamento bilíngue completo em `src/i18n/locales/pt.js` e `src/i18n/locales/en.js`:
    - Eliminação de anglicismos descontextualizados na versão em português (ex.: "MÉTRICAS DE PRODUÇÃO", "PRÁTICAS TÉCNICAS", "IMPACTO EM PRODUÇÃO").
    - Redação em inglês técnico idiomático, conciso e natural para recrutadores e diretores de engenharia globais.
  - **Refinamento Factual do Setor de Energia (ONS vs. Usina Termelétrica Energia Pecém)**:
    - Correção e separação definitiva entre o **Operador Nacional do Sistema Elétrico (ONS)** (órgão coordenador e regulador do Sistema Interligado Nacional - SIN, fiscalizado pela Aneel, atuação via AMcom no projeto GENIN) e a **Usina Termelétrica Energia Pecém** (usina de geração térmica de energia no Ceará, atuação no projeto SIGMA), eliminando qualquer ambiguidade de vinculação ou alocação nos textos e no contexto RAG da IA.
  - Zero regressão visual: 100% de integridade preservada em templates Vue 3, classes Tailwind CSS, reatividade e suíte de testes automatizados (12/12).

---

## [1.5.0] - 2026-10-08

### Adicionado
- **Suporte a Currículos Bilíngues Nativos (SPEC-002 / TASK-002)**:
  - Disponibilização dos currículos oficiais em `public/`: `Elessandro_Prestes_Macedo_Engenheiro_de_Software.pdf` (Português) e `Elessandro_Prestes_Macedo_Software_Engineer.pdf` (Inglês).
  - Reatividade dinâmica de idioma no componente `Statement.vue` via `computed()` (`cvFilename` e `cvPath`), reagindo instantaneamente ao estado do `useI18n`.
  - Configuração segura de atributos `:download="cvFilename"`, `target="_blank"` e `rel="noopener noreferrer"`.
- **Atualização Cadastral e Cronológica da Trajetória**:
  - Inclusão da posição atual como **Líder Técnico em Engenharia de Software – Full Stack & Arquitetura de Sistemas** na **EPM DEVTECH** (Jun/2026 – Atual) em `pt.js` e `en.js`.
  - Consolidação da posição de **Engenheiro de Software com IA Aplicada** (Out/2025 – Mai/2026) sob a **EPM DEVTECH** (migração Laravel 12, 56.400+ linhas legadas eliminadas, 2.399 testes).
  - Sincronização rigorosa do contexto do assistente de IA (`src/services/aiService.js`) com os novos dados factuais.
  - Atualização do Toolbox com tecnologias complementares dos currículos oficiais (NestJS, MariaDB, MongoDB, Amazon MQ, Kubernetes, Vitest).

---

## [1.4.0] - 2026-10-08

### Adicionado
- **Adoção Integral do Framework Universal SDD (Spec-Driven Development)**:
  - Documentação canônica e governança: `UNIVERSAL_SDD_FRAMEWORK.md`, `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `COPILOT.md`, `ROADMAP.md`, `CONTRIBUTING.md` e `CODE_OF_CONDUCT.md`.
  - Templates executáveis de artefatos em `templates/`: `SPEC-TEMPLATE.md`, `TASK-TEMPLATE.md`, `QA-TEMPLATE.md`, `REVIEW-TEMPLATE.md` e `ADR-TEMPLATE.md`.
  - Padrões e quality gates em `standards/`: `ux-ui.md`, `design-system.md`, `accessibility.md`, `testing.md` e `quality-gates.md`.
  - Base de conhecimento em `knowledge/`: `stack.md`, `conventions.md` e `architecture.md`.
  - Workflows normativos em `workflows/`: `feature.md` e `bugfix.md`.
  - Perfis operacionais em `profiles/`: `development.md` e `qa.md`.
  - Missões e limites de agentes em `agents/`: `gemini.md`, `claude.md` e `po.md`.
  - Módulos de documentação em `docs/`: `getting-started.md`, `architecture.md`, `agents.md`, `workflows.md`, `knowledge-base.md`, `bootstrapping.md`, `governance.md`, `best-practices.md` e `faq.md`.
  - Registros de Decisões Arquiteturais em `adr/`: `ADR-001` a `ADR-005`.

### Corrigido
- **Resiliência e Eliminação de Erro 503 na IA (`aiService.js`)**:
  - Implementado failover multi-modelo com `gemini-3.5-flash` (primário), `gemini-3.6-flash`, `gemini-flash-latest` e `gemini-3.8-flash`, prevenindo interrupção do chat por sobrecarga de modelos.
- **Favicon Vetorial e Eliminação de Erro 404 (`public/favicon.svg`)**:
  - Criado favicon SVG vetorial com suporte dinâmico a modo escuro/claro via `prefers-color-scheme`, resolvendo falha de recurso não encontrado.

---

## [1.3.0] - 2026-09-04

### Adicionado
- **Internacionalização Bilíngue Completa (i18n PT-BR & EN)**:
  - Criação dos dicionários completos e tipados `src/i18n/locales/pt.js` e `src/i18n/locales/en.js`.
  - Implementação do composable reativo `src/composables/useI18n.js` com persistência em `localStorage`, detecção automática de preferência de idioma do navegador (`navigator.language`) e sincronização reativa de `<html lang>`.
  - Componente `LanguageToggle.vue` com UX-UI design editorial suíço (controle segmentado em monospace `[ PT / EN ]`, contraste WCAG 2.1 AA, acessibilidade com `role="group"` e `aria-pressed`).
  - Tradução técnica e editorial de 100% das seções: Statement, Selected Work (5 Case Studies), Architecture (4 pilares), Trajectory (6 posições com métricas X-Y-Z), Toolbox (8 domínios) e Footer.
  - Suporte a múltiplos idiomas no terminal do Assistente Virtual RAG (`AiAssistant.vue` e `aiService.js`), alternando prompts sugeridos, mensagens de sistema e instruindo a cadeia do Gemini a responder no idioma selecionado.

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
