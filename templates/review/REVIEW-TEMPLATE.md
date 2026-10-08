# REVIEW-XXX — [Título do Review]

| Campo          | Valor                                              |
|----------------|----------------------------------------------------|
| **ID**         | REVIEW-XXX                                         |
| **Referência** | TASK-XXX / SPEC-XXX                                |
| **Tipo**       | Code Review / Design Review / QA Review            |
| **Data**       | YYYY-MM-DD                                         |
| **Revisor**    | Elessandro Prestes Macedo                          |
| **Status**     | Aprovado / Aprovado com ressalvas / Reprovado      |

---

## Checklist de Code Review

- [ ] Vue 3: uso correto da Composition API e `<script setup>`
- [ ] Escopo: implementação respeita estritamente o aprovado na SPEC
- [ ] Nomenclatura: componentes em PascalCase, funções e variáveis em camelCase
- [ ] Sem código comentado, consoles de depuração ou dead code
- [ ] Acessibilidade: semântica HTML e foco visível
- [ ] i18n: ausência de strings hardcoded no template (tudo via `messages.*`)
- [ ] Tailwind CSS: classes limpas e sem estilos redundantes

---

## Checklist de Design Review

- [ ] Mobile First: 320px até 1440px
- [ ] Dark Mode e Light Mode consistentes
- [ ] Tipografia de acordo com o design system (Space Grotesk, Inter, JetBrains Mono)
- [ ] Espaçamento e grid alinhados ao layout editorial

---

## Decisão Final

| Campo              | Valor                                                  |
|--------------------|--------------------------------------------------------|
| **Decisão**        | ✅ Aprovado / ❌ Reprovado / ⚠️ Aprovado com ressalvas |
| **Aprovado por**   | Elessandro Prestes Macedo                              |
| **Data**           |                                                        |
| **Observações**    |                                                        |
