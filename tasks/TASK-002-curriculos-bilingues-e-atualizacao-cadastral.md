# TASK-002 — Execução da Atualização de Currículos Bilíngues e Conteúdo Profissional

| Campo              | Valor                                                  |
|--------------------|--------------------------------------------------------|
| **ID**             | TASK-002                                               |
| **SPEC**           | SPEC-002                                               |
| **Data de início** | 2026-10-08                                             |
| **Data de término**| 2026-10-08                                             |
| **Agente**         | Gemini / Antigravity                                   |
| **Status**         | Concluída                                              |

---

## Escopo da Implementação

Baseado na **SPEC-002**:
1. Copiar os novos PDFs oficiais da pasta de carreira para o diretório `public/`:
   - `Elessandro_Prestes_Macedo_Engenheiro_de_Software.pdf`
   - `Elessandro_Prestes_Macedo_Software_Engineer.pdf` (corrigindo o erro ortográfico do nome de origem)
2. Atualizar `src/components/Statement.vue`:
   - Transformar `cvFilename` e `cvPath` em propriedades computadas baseadas no `locale.value` de `useI18n`.
   - Adicionar atributos `:download="cvFilename"`, `target="_blank"` e `rel="noopener noreferrer"`.
3. Atualizar os dicionários de internacionalização em `src/i18n/locales/pt.js` e `src/i18n/locales/en.js`:
   - **Statement:** Atualizar métrica de linhas eliminadas referenciando EPM DEVTECH.
   - **Trajectory / Experience:** Adicionar a posição de Tech Lead (Jun/2026 – Atual) e atualizar a posição de Engenheiro de Software com IA Aplicada (Out/2025 – Mai/2026) sob a EPM DEVTECH.
   - **Architecture:** Atualizar referências em casos de estudo para EPM DEVTECH.
   - **Toolbox:** Sincronizar competências complementares mencionadas nos currículos oficiais (NestJS, MariaDB, MongoDB, Amazon MQ, Kubernetes, Vitest).
4. Atualizar `ELESSANDRO_CONTEXT` em `src/services/aiService.js` com o histórico profissional atualizado.
5. Validar compilação com `npm run build` e execução da suíte de testes `node src/services/aiService.test.mjs`.
6. Validar acessibilidade e disponibilidade dos PDFs no servidor local.
7. Produzir evidências de QA em `reviews/QA-002.md` e revisão em `reviews/REVIEW-002.md`.
8. Atualizar `PROJECT.md` e `CHANGELOG.md`.

---

## Arquivos a Criar / Alocar

| Arquivo                                                         | Descrição                                            |
|-----------------------------------------------------------------|------------------------------------------------------|
| `public/Elessandro_Prestes_Macedo_Engenheiro_de_Software.pdf`   | Currículo oficial em Português                       |
| `public/Elessandro_Prestes_Macedo_Software_Engineer.pdf`        | Currículo oficial em Inglês (substituindo obsoleto)  |
| `specs/SPEC-002-curriculos-bilingues-e-atualizacao-cadastral.md`| Especificação técnica da mudança                     |
| `tasks/TASK-002-curriculos-bilingues-e-atualizacao-cadastral.md`| Registro de tarefa e acompanhamento                  |
| `reviews/QA-002.md`                                             | Evidências de testes e quality gate                  |
| `reviews/REVIEW-002.md`                                         | Relatório de revisão técnica                         |

---

## Arquivos a Modificar

| Arquivo                             | Mudança                                                          |
|-------------------------------------|------------------------------------------------------------------|
| `src/components/Statement.vue`      | Reatividade do link de download de currículo via `computed`      |
| `src/i18n/locales/pt.js`            | Atualização das seções de Statement, Experiência, Arquitetura e Toolbox |
| `src/i18n/locales/en.js`            | Versão em inglês das seções atualizadas                          |
| `src/services/aiService.js`         | Sincronização do contexto de conhecimento da IA                  |
| `PROJECT.md`                        | Registro das mudanças e atualização da versão                    |
| `CHANGELOG.md`                      | Registro do changelog na versão 1.5.0                            |
| `ROADMAP.md`                        | Atualização do backlog e marcos atingidos                        |

---

## Checklist de Execução

- [x] SPEC-002 documentada
- [x] TASK-002 registrada
- [x] PDFs alocados em `public/`
- [x] `Statement.vue` atualizado com reatividade de idioma
- [x] `pt.js` e `en.js` atualizados com dados factuais dos currículos
- [x] `aiService.js` sincronizado com os dados da EPM DEVTECH
- [x] Testes de regressão aprovados (12/12)
- [x] `npm run build` concluído com sucesso
- [x] Validação de links HTTP de ambos os PDFs em localhost
- [x] QA-002 e REVIEW-002 documentados
- [x] `PROJECT.md` e `CHANGELOG.md` atualizados
