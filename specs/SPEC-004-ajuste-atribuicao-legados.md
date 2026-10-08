# SPEC-004 — Correção e Atribuição Factual de Modernização de Sistemas Legados

| Campo         | Valor                                                                    |
|---------------|--------------------------------------------------------------------------|
| **ID**        | SPEC-004                                                                 |
| **Data**      | 2026-10-08                                                               |
| **Autor**     | Gemini / Antigravity                                                     |
| **Status**    | Aprovada                                                                 |
| **Versão**    | 1.0                                                                      |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)                    |

---

## 1. Contexto e Motivação

Durante as revisões editoriais do portfólio `elessandrodev`, certas atribuições de modernização de sistemas legados, uso do *Strangler Fig Pattern* e eliminação de código legado foram indevidamente associadas à **EPM DEVTECH**, ao **Operador Nacional do Sistema Elétrico (ONS)** ou à **Usina Termelétrica Energia Pecém**.

O Product Owner e autor do portfólio estabeleceu a diretriz factual estrita de domínio:
> **"Legados foi somente na CAPES, projeto SIPREC e no Grupo Paraíso, ERP da Indústria Têxtil e outros projetos da indústria."**

Portanto:
1. **CAPES (Projeto SIPREC):** Modernização de sistema monolítico legado de avaliação da pós-graduação para microsserviços e BFF em Angular, atendendo 448+ Instituições de Ensino Superior (IES) e suportando 2.500 RPS.
2. **Grupo Paraíso (ERP da Indústria Têxtil e outros projetos industriais):** Modernização gradual de ERP monolítico legado para microsserviços em Node.js com *Strangler Fig Pattern* (-40% em custos de manutenção), além de projetos industriais (telemetria, IoT fabril, e-commerce e CRM).
3. **EPM DEVTECH:** Arquitetura e liderança de plataformas web completas, APIs REST escaláveis em PHP/Laravel e Node.js (Express, NestJS), interfaces reativas em Vue.js/Angular/React, arquitetura modular, 2.399 testes automatizados com Pest/PHPUnit e engenharia assistida por IA (SDD, RAG, MCP). **Não houve migração de monólito legado ou eliminação de código legado na EPM DEVTECH.**
4. **ONS e Usina Termelétrica Energia Pecém:** Atuações de alta criticidade no setor elétrico brasileiro (processamento regulatório nacional no ONS/GENIN via AMcom; telemetria em tempo real no projeto SIGMA da Energia Pecém). **Nenhum dos dois envolveu modernização de legados.**

---

## 2. Objetivo

1. **Correção Factual Rigorosa:** Restringir toda e qualquer menção a modernização de sistemas legados, monólitos legados e eliminação de código legado exclusivamente a:
   - **CAPES (Projeto SIPREC)**
   - **Grupo Paraíso (ERP da Indústria Têxtil e projetos industriais)**
2. **Desassociação em EPM DEVTECH:** Substituir termos como "migração de monólito legado", "56.400+ linhas legadas eliminadas" e "refatoração de bases legadas" por descrições exatas de engenharia de plataforma, arquitetura modular em Laravel 12, suíte de 2.399 testes automatizados e esteiras de CI/CD.
3. **Desassociação em ONS e Energia Pecém:** Ajustar o manifesto/bio em `Statement.vue` para que a modernização de plataformas legadas não seja atribuída ao ONS ou à Usina Termelétrica Energia Pecém.
4. **Alinhamento do Princípio Arquitetural ARCH-01:** No princípio de *Strangler Fig Pattern*, citar como casos em produção exclusivamente `SIPREC / CAPES (448+ IES)` e `Grupo Paraíso (ERP Indústria Têxtil)`.
5. **Atualização do Contexto RAG do Assistente de IA (`aiService.js`):** Inserir nota explícita de domínio e alinhar os resumos profissionais para garantir que o assistente de IA responda com 100% de precisão factual sobre onde ocorreram as modernizações de legados.
6. **Paridade Bilíngue Integral:** Aplicar as correções de forma idêntica e idiomática em português (`pt.js`) e inglês (`en.js`).
7. **Zero Regressão:** Garantir 100% de integridade visual, sem alterar classes Tailwind ou sintaxe Vue 3, e assegurar aprovação na suíte de testes (12/12) e no build.

---

## 3. Escopo

### Está incluído (IN)
- `src/components/Statement.vue`: Ajuste do manifesto bio em PT e EN separando a experiência em sistemas distribuídos de alta concorrência (ONS e Energia Pecém) da modernização de legados (CAPES e Grupo Paraíso).
- `src/i18n/locales/pt.js`:
  - `statement.highlights`: Atualizar a métrica de destaque para `2.399` Testes Automatizados na EPM DEVTECH (removendo "Código Legado Eliminado").
  - `architecture.principles` (ARCH-01): Atualizar casos de aplicação para `SIPREC / CAPES (448+ IES) · Grupo Paraíso (ERP Indústria Têxtil)`.
  - `experience.trajectory`:
    - EPM DEVTECH (2026 - Atual): Remover menções a legados/Strangler Fig; destacar engenharia de performance, confiabilidade e arquitetura modular.
    - EPM DEVTECH (2025 - 2026): Remover menções a monólito legado e linhas legadas eliminadas; destacar arquitetura modular em Laravel 12, 2.399 testes automatizados e SDD com IA.
    - Datainfo / CAPES: Reforçar explicitamente a modernização do monolito legado SIPREC para microsserviços e BFF em Angular.
    - Grupo Paraíso: Reforçar a modernização do ERP legado da indústria têxtil para microsserviços em Node.js com Strangler Fig Pattern e projetos industriais.
- `src/i18n/locales/en.js`: Sincronização espelhada e fluida de todas as seções acima em inglês.
- `src/services/aiService.js`: Sincronização do prompt `ELESSANDRO_CONTEXT`, incluindo a diretriz explícita de domínio sobre sistemas legados.
- Testes automatizados (`node src/services/aiService.test.mjs`) e build (`npm run build`).
- Artefatos SDD: `TASK-004`, `QA-004`, `REVIEW-004`, `PROJECT.md` e `CHANGELOG.md`.

### Não está incluído (OUT)
- Alterações em estilos visuais, classes Tailwind, cores ou diagramação.
- Adição de bibliotecas externas ou alterações de dependências.

---

## 4. Critérios de Aceite

1. [ ] A modernização de legados é mencionada única e exclusivamente em associação à CAPES (SIPREC) e ao Grupo Paraíso (ERP da indústria têxtil).
2. [ ] Nenhuma menção a "legado", "monólito legado", "eliminação de código legado" ou "Strangler Fig" permanece vinculada à EPM DEVTECH, ao ONS ou à Energia Pecém.
3. [ ] A métrica de destaque em `statement.highlights` reflete fielmente a engenharia de qualidade da EPM DEVTECH (2.399 testes automatizados).
4. [ ] O princípio ARCH-01 referencia os casos de produção da CAPES e do Grupo Paraíso.
5. [ ] O assistente de IA possui contexto de domínio explícito orientando que legados ocorreram apenas na CAPES e no Grupo Paraíso.
6. [ ] A paridade em inglês (`en.js`) e português (`pt.js`) é 100% preservada.
7. [ ] A suíte de testes (`node src/services/aiService.test.mjs`) é executada com 12/12 testes aprovados.
8. [ ] O build de produção (`npm run build`) conclui com 0 erros.
