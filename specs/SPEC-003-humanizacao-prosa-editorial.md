# SPEC-003 — Revisão e Humanização da Prosa Editorial

| Campo         | Valor                                                                    |
|---------------|--------------------------------------------------------------------------|
| **ID**        | SPEC-003                                                                 |
| **Data**      | 2026-10-08                                                               |
| **Autor**     | Gemini / Antigravity                                                     |
| **Status**    | Aprovada                                                                 |
| **Versão**    | 1.0                                                                      |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)                    |

---

## 1. Contexto e Motivação

O portfólio profissional `elessandrodev` reúne decisões de arquitetura, métricas de produção e histórico de mais de 9 anos de carreira. No entanto, parte da prosa textual acumulou termos clichês gerados por IA ("ecossistemas robustos", "pioneiro", "blindar contratos", "rastreabilidade determinística", "sem paredes de logotipos"), além de anglicismos desnecessários misturados na versão em português ("SYSTEM BENCHMARKS & METRICS", "CORE ENGINEERING") e tríades corporativas artificiais.

A proposta é aplicar o protocolo `/humanizer` com tom de **Engenheiro de Software Sênior**: direto, técnico, pragmático, sem adjetivação inflada e focado na arquitetura, no que foi construído e nos impactos mensuráveis.

---

## 2. Objetivo

1. **Tom de Engenheiro Sênior:** Substituir jargões vazios por explicações claras, focadas em problemas reais, escolhas arquiteturais e resultados.
2. **Eliminação dos 25 Padrões de IA:**
   - Remover fórmulas dramáticas ("Não é apenas X, é Y", "Esse é o verdadeiro diferencial").
   - Substituir adjetivos corporativos inflados ("robusto", "inovador", "ecossistema", "pioneiro", "missão crítica" quando excessivo).
   - Reduzir o uso artificial de travessões (`—`) conectando orações; utilizar pontuação direta e fluida.
   - Eliminar tríades forçadas de substantivos abstratos.
3. **Consistência Bilíngue Natural:**
   - Português brasileiro fluido, culto e sem anglicismos descontextualizados.
   - Inglês técnico idiomático e natural, sem vocabulário excessivamente formal ou artificial ("delve", "testament").
4. **Zero Regressão de Código:**
   - Preservar integralmente templates Vue, diretivas, classes do Tailwind CSS, scripts e reatividade.
   - Preservar integridade dos testes automatizados e compilação do Vite.

---

## 3. Escopo

### Está incluído (IN)
- Revisão da prosa em [src/i18n/locales/pt.js](file:///home/elessandro/Documentos/Projetos_Pessoais/Sandbox_Pessoal/Elessandro/elessandrodev/src/i18n/locales/pt.js) (Statement, Projetos, Arquitetura, Trajetória, Toolbox, Rodapé e Assistente de IA).
- Revisão da prosa em [src/i18n/locales/en.js](file:///home/elessandro/Documentos/Projetos_Pessoais/Sandbox_Pessoal/Elessandro/elessandrodev/src/i18n/locales/en.js) mantendo paridade idiomática.
- Revisão de textos literais e labels nos componentes [Statement.vue](file:///home/elessandro/Documentos/Projetos_Pessoais/Sandbox_Pessoal/Elessandro/elessandrodev/src/components/Statement.vue), [Architecture.vue](file:///home/elessandro/Documentos/Projetos_Pessoais/Sandbox_Pessoal/Elessandro/elessandrodev/src/components/Architecture.vue) e [AiAssistant.vue](file:///home/elessandro/Documentos/Projetos_Pessoais/Sandbox_Pessoal/Elessandro/elessandrodev/src/components/AiAssistant.vue).
- Revisão das diretrizes em `ELESSANDRO_CONTEXT` de [aiService.js](file:///home/elessandro/Documentos/Projetos_Pessoais/Sandbox_Pessoal/Elessandro/elessandrodev/src/services/aiService.js).
- Execução de testes de regressão automatizados e validação de compilação com `npm run build`.
- Evidências de QA em [reviews/QA-003.md](file:///home/elessandro/Documentos/Projetos_Pessoais/Sandbox_Pessoal/Elessandro/elessandrodev/reviews/QA-003.md) e [reviews/REVIEW-003.md](file:///home/elessandro/Documentos/Projetos_Pessoais/Sandbox_Pessoal/Elessandro/elessandrodev/reviews/REVIEW-003.md).

### Não está incluído (OUT)
- Modificação de estilos CSS ou classes utilitárias do Tailwind CSS.
- Alteração na estrutura de rotas ou componentes.
- Alteração de parâmetros dos modelos de IA ou dependências externas.

---

## 4. Critérios de Aceite

1. [x] A prosa de todas as seções transmite clareza, objetividade técnica e sobriedade.
2. [x] Clichês corporativos e de IA foram substituídos por descrições factuais de engenharia.
3. [x] Nenhuma classe Tailwind ou layout visual sofreu alterações.
4. [x] Interpolações do Vue 3 e reatividade do i18n mantidas 100% funcionais.
5. [x] Suíte de testes automatizados (`aiService.test.mjs`) aprovada com 12/12 testes.
6. [x] Build do Vite (`npm run build`) concluído com zero erros.
