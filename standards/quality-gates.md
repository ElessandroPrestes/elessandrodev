# Quality Gates — elessandrodev

> Critérios determinísticos de entrada, saída e release para mudanças no projeto.

---

## 1. Quality Gate 1: Definition of Ready (DoR) — Entrada

Antes de qualquer implementação ter início:
- [ ] A **SPEC** foi redigida utilizando o template canônico em `/templates/spec/SPEC-TEMPLATE.md`.
- [ ] O escopo está claramente delimitado com divisões explícitas de **IN** e **OUT**.
- [ ] Os critérios de aceitação são mensuráveis e testáveis.
- [ ] A SPEC recebeu aprovação formal do **Product Owner** (Elessandro Prestes Macedo).
- [ ] A **TASK** correspondente foi criada em `/tasks/TASK-NNN-slug.md`.

---

## 2. Quality Gate 2: Definition of Done (DoD) — Saída Técnica

Para que uma TASK seja considerada finalizada:
- [ ] O código implementa estritamente o escopo aprovado na SPEC.
- [ ] O comando `npm run build` executa com sucesso sem erros.
- [ ] Todos os novos textos estão internacionalizados em `src/i18n/locales/pt.js` e `src/i18n/locales/en.js`.
- [ ] O design responde adequadamente nos breakpoints mobile e desktop.
- [ ] Ambos os temas (Dark e Light) foram validados.
- [ ] O arquivo `reviews/QA-NNN.md` foi preenchido com as evidências do teste.
- [ ] O arquivo `reviews/REVIEW-NNN.md` foi preenchido e assinado.

---

## 3. Quality Gate 3: Release Gate — Publicação

Para que uma versão seja publicada ou mergeada em `main`:
- [ ] `PROJECT.md` atualizado com o novo estado canônico.
- [ ] `CHANGELOG.md` atualizado seguindo o padrão Keep a Changelog.
- [ ] Mensagens de commit padronizadas em Português do Brasil.
- [ ] Aprovação explícita do mantenedor.
