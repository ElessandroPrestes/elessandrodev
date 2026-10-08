# SPEC-002 — Suporte a Currículos Bilíngues e Atualização de Informações Profissionais

| Campo         | Valor                                                                    |
|---------------|--------------------------------------------------------------------------|
| **ID**        | SPEC-002                                                                 |
| **Data**      | 2026-10-08                                                               |
| **Autor**     | Gemini / Antigravity                                                     |
| **Status**    | Aprovada                                                                 |
| **Versão**    | 1.0                                                                      |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)                    |

---

## 1. Contexto e Motivação

O portfólio profissional `elessandrodev` possui suporte bilingue a Português (pt-BR) e Inglês (en). Contudo, a funcionalidade de download de currículo disponibilizava unicamente o arquivo em formato monolíngue com caminho estático fixado no componente `Statement.vue` (`Elessandro_Prestes_Macedo_Software_Engineer.pdf`), sem reagir dinamicamente à troca de idioma efetuada pelo visitante.

Adicionalmente, uma auditoria comparativa entre o portfólio e as versões mais recentes e oficiais dos currículos em PDF identificou divergências cadastrais e cronológicas:
1. A posição atual como **Líder Técnico em Engenharia de Software – Full Stack & Arquitetura de Sistemas** na **EPM DEVTECH** (Jun/2026 – Atual) não estava refletida na trajetória cronológica do portfólio.
2. O projeto de modernização de plataforma monolítica para Laravel 12 com IA aplicada (56.400+ linhas legadas eliminadas, 2.399 testes automatizados) estava atribuído a outro cliente no portfólio, enquanto no currículo canônico está consolidado sob a **EPM DEVTECH**.
3. O conjunto de competências técnicas (Toolbox) apresentava pequenas lacunas em relação às stacks discriminadas nos novos PDFs (NestJS, MariaDB, MongoDB, Amazon MQ, Kubernetes, Vitest).
4. O contexto injetado no assistente virtual RAG (`src/services/aiService.js`) precisava ser sincronizado com os dados factuais mais recentes da carreira.

---

## 2. Objetivo

1. **Currículos Bilíngues Nativos:** Disponibilizar os dois currículos oficiais no diretório público do projeto:
   - Português: `Elessandro_Prestes_Macedo_Engenheiro_de_Software.pdf`
   - Inglês: `Elessandro_Prestes_Macedo_Software_Engineer.pdf`
2. **Reatividade por Idioma:** Fazer com que o botão/link de download de currículo reaja dinamicamente ao idioma ativo (`locale === 'pt'` -> currículo em Português; `locale === 'en'` -> currículo em Inglês), mantendo consistência absoluta em desktop e mobile.
3. **Resiliência e Acessibilidade:** Configurar atributos `download` com nome semântico e `target="_blank"` para garantir suporte tanto ao download direto quanto à visualização sem quebra de navegação no GitHub Pages.
4. **Alinhamento Factual Estrito:** Atualizar as seções de Declaração (Statement), Trajetória (Trajectory/Experience), Habilidades (Toolbox) e Contexto da IA (`aiService.js`) com base estrita nos dados dos novos currículos, sem extrapolações ou termos de marketing exagerados.
5. **Zero Quebra de Build:** Garantir compilação limpa pelo Vite e integridade dos assets estáticos na pasta `dist/`.

---

## 3. Escopo

### Está incluído (IN)
- Alocação dos arquivos PDF oficiais em `public/`:
  - `public/Elessandro_Prestes_Macedo_Engenheiro_de_Software.pdf`
  - `public/Elessandro_Prestes_Macedo_Software_Engineer.pdf` (corrigindo grafia da origem para `Software_Engineer.pdf`).
- Atualização de `src/components/Statement.vue` com propriedades computadas reativas (`cvFilename` e `cvPath`) que respeitam o `BASE_URL` do Vite e o estado do `useI18n`.
- Atualização dos dicionários de internacionalização `src/i18n/locales/pt.js` e `src/i18n/locales/en.js`:
  - Inclusão da nova posição de liderança técnica na EPM DEVTECH (Jun/2026 – Atual).
  - Atualização da posição de Engenheiro de Software com IA Aplicada na EPM DEVTECH (Out/2025 – Mai/2026).
  - Refinamento das métricas no Statement (amparadas na EPM DEVTECH).
  - Atualização do Toolbox com as stacks complementares constantes nos PDFs.
- Atualização do `ELESSANDRO_CONTEXT` em `src/services/aiService.js` para manter o assistente conversacional alinhado aos dados factuais.
- Execução de testes de regressão automatizados e validação de compilação com `npm run build`.
- Documentação de QA (`reviews/QA-002.md`) e Review (`reviews/REVIEW-002.md`).
- Atualização do `PROJECT.md` e `CHANGELOG.md`.

### Não está incluído (OUT)
- Redesenho de componentes visuais ou alteração da identidade tipográfica editorial.
- Instalação de novas dependências npm externas.
- Modificação dos PDFs de origem.

---

## 4. Requisitos Funcionais

1. **Download do Currículo em Português:**
   - Quando o idioma ativo for `pt`, o link de currículo deve apontar para `/elessandrodev/Elessandro_Prestes_Macedo_Engenheiro_de_Software.pdf` com nome de download correspondente.
2. **Download do Currículo em Inglês:**
   - Quando o idioma ativo for `en`, o link de currículo deve apontar para `/elessandrodev/Elessandro_Prestes_Macedo_Software_Engineer.pdf` com nome de download correspondente.
3. **Consistência Instantânea:**
   - A alternância de idioma no cabeçalho deve atualizar imediatamente o alvo de download do currículo, sem necessidade de recarregar a página.
4. **Compatibilidade GitHub Pages:**
   - Os caminhos devem obrigatoriamente utilizar `import.meta.env.BASE_URL` para funcionar tanto em `localhost:5173/elessandrodev/` quanto no GitHub Pages sob `/elessandrodev/`.
5. **Precisão de Conteúdo:**
   - O conteúdo em português deve estar 100% em português brasileiro culto.
   - O conteúdo em inglês deve estar 100% em inglês técnico profissional.
   - Nenhuma métrica ou data pode divergir dos PDFs fornecidos.

---

## 5. Requisitos Não-Funcionais

| Requisito        | Critério                                                                   |
|------------------|----------------------------------------------------------------------------|
| **Acessibilidade**| Atributos ARIA preservados e foco por teclado funcional no link de download |
| **Tamanho Asset**| Ambos os PDFs otimizados (~11 KB cada), sem impacto de payload no bundle JS |
| **Build**        | Compilação limpa pelo Vite (`npm run build`) com 0 erros                   |
| **Testes**       | 100% de aprovação na suíte `src/services/aiService.test.mjs` (12/12)       |

---

## 6. Critérios de Aceite

1. [ ] Os dois PDFs estão presentes em `public/` com nomenclatura canônica exata.
2. [ ] No idioma `pt`, o botão de currículo exibe texto em português e efetua download do PDF em português.
3. [ ] No idioma `en`, o botão de currículo exibe texto em inglês e efetua download do PDF em inglês.
4. [ ] A trajetória profissional reflete a liderança na EPM DEVTECH e a atuação com IA aplicada de forma sincronizada em ambos os idiomas.
5. [ ] O assistente de IA responde com base nos dados atualizados da EPM DEVTECH.
6. [ ] `npm run build` conclui com sucesso e inclui ambos os PDFs na pasta `dist/`.
