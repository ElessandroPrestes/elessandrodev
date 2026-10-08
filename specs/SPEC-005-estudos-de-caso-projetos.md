# SPEC-005 — Atualização Editorial dos Estudos de Caso de Engenharia (Selected Work)

| Campo         | Valor                                                                    |
|---------------|--------------------------------------------------------------------------|
| **ID**        | SPEC-005                                                                 |
| **Data**      | 2026-10-08                                                               |
| **Autor**     | Gemini / Antigravity                                                     |
| **Status**    | Aprovada                                                                 |
| **Versão**    | 1.0                                                                      |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)                    |

---

## 1. Contexto e Motivação

A seção `02 / SELECTED WORK` do portfólio `elessandrodev` apresenta os projetos de destaque e laboratórios arquiteturais de Elessandro Prestes Macedo no GitHub. Esses repositórios funcionam como implementações de referência (PoCs e Blueprints Arquiteturais), sintetizando desafios técnicos de alta concorrência, tolerância a falhas, resiliência e fluxos de IA vivenciados em produção.

O Product Owner solicitou a atualização integral do conteúdo da seção com:
1. Novo título da seção: **Projetos em Destaque & Laboratórios Arquiteturais**.
2. Novo manifesto contextual da seção conectando os repositórios à trajetória profissional de produção.
3. Inclusão do campo **ORIGEM & CONTEXTO REAL** para cada estudo de caso, vinculando cada laboratório arquitetural às experiências reais de carreira (EPM DevTech, ONS/AMcom, CAPES/Datainfo e Grupo Paraíso).
4. Reestruturação editorial detalhada dos 5 projetos (`universal-sdd`, `elessandrodev`, `event-driven-processing-system`, `iot-mqtt-simulator` e `fintech-wallet-solution`) com problema, solução de engenharia, métricas de produção e stack técnica refinadas.

---

## 2. Objetivo

1. Atualizar o cabeçalho e a descrição da seção `02 / SELECTED WORK` em português e inglês.
2. Adicionar o rótulo e o campo `origin` (*ORIGEM & CONTEXTO REAL* / *REAL-WORLD ORIGIN & CONTEXT*) no modelo de dados e na renderização do componente `Projects.vue`.
3. Inserir a redação canônica completa fornecida pelo PO para os 5 projetos em `src/i18n/locales/pt.js`.
4. Traduzir e sincronizar com fluidez e precisão idiomática em `src/i18n/locales/en.js`.
5. Sincronizar o contexto do assistente de IA conversacional (`src/services/aiService.js`) com as origens reais e detalhes dos 5 projetos.
6. Manter zero regressão de layout, garantindo aprovação na suíte de testes (12/12) e no build do Vite.

---

## 3. Escopo

### Está incluído (IN)
- `src/components/Projects.vue`: Suporte à renderização condicional do campo `cs.origin` com o label `messages.projects.labels.origin`, além de ajuste de responsividade no parágrafo do cabeçalho da seção.
- `src/i18n/locales/pt.js`:
  - `title`: 'Projetos em Destaque & Laboratórios Arquiteturais'
  - `description`: Manifesto dos projetos de referência no GitHub.
  - `labels.origin`: 'ORIGEM & CONTEXTO REAL'
  - Conteúdo integral dos 5 projetos com `origin`, `problem`, `solution`, `metrics` e `stack`.
- `src/i18n/locales/en.js`: Paridade bilíngue completa de todas as atualizações acima em inglês técnico idiomático.
- `src/services/aiService.js`: Atualização de `ELESSANDRO_CONTEXT` com as origens reais dos 5 projetos.
- Testes automatizados (`node src/services/aiService.test.mjs`) e build (`npm run build`).
- Artefatos SDD: `TASK-005`, `QA-005`, `REVIEW-005`, `PROJECT.md` e `CHANGELOG.md` (v1.8.0).

### Não está incluído (OUT)
- Alterações em outros componentes da aplicação além de `Projects.vue`.
- Criação de novas rotas ou inclusão de novos repositórios além dos 5 especificados.

---

## 4. Critérios de Aceite

1. [ ] A seção exibe o título "Projetos em Destaque & Laboratórios Arquiteturais" e a descrição canônica.
2. [ ] Cada um dos 5 projetos exibe claramente a sua "ORIGEM & CONTEXTO REAL".
3. [ ] Todos os textos de problema, solução, métricas e stack correspondem com precisão à redação fornecida pelo PO.
4. [ ] A versão em inglês possui tradução técnica equivalente, fluida e natural.
5. [ ] O assistente de IA responde com precisão sobre a origem real e propósito arquitetural de cada repositório.
6. [ ] A suíte de testes automatizados (`aiService.test.mjs`) é executada com 12/12 testes aprovados.
7. [ ] O build de produção (`npm run build`) conclui com 0 erros.
