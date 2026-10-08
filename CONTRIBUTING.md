# CONTRIBUTING.md — Guia de Contribuição

Obrigado pelo interesse em contribuir com o **elessandrodev**!  
Este projeto segue rigorosamente a metodologia **Universal SDD (Spec-Driven Development)**.

---

## 1. Princípio Fundamental de Contribuição

**Nenhuma linha de código de produção é aceita sem uma SPEC previamente aprovada.**

Se você deseja propor uma melhoria, correção ou nova funcionalidade:
1. Abra uma Issue ou proponha um rascunho de **SPEC** baseado no modelo em `templates/spec/SPEC-TEMPLATE.md`.
2. Aguarde a revisão e aprovação explícita do Product Owner (Elessandro Prestes Macedo).
3. Após a aprovação da SPEC, crie a correspondente **TASK** e proceda com a implementação.

---

## 2. Padrão de Commits

Todos os commits devem seguir a convenção **Conventional Commits** e ser escritos obrigatoriamente em **Português do Brasil (pt-BR)**:

- `feat: adiciona componente X`
- `fix: corrige problema de overflow no header`
- `docs: atualiza PROJECT.md e roadmap`
- `refactor: modulariza serviço de inteligência artificial`
- `chore: atualiza dependências do npm`

---

## 3. Quality Gates para Pull Requests

Antes de submeter um Pull Request:
1. O comando `npm run build` deve passar sem qualquer erro.
2. Não deve haver strings hardcoded nos templates (utilizar internacionalização).
3. As diretrizes de acessibilidade e design system devem ser preservadas.
4. O `PROJECT.md` e o `CHANGELOG.md` devem ser atualizados.
