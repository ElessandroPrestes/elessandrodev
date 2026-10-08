# ADR-002 — Design System Editorial com Tailwind CSS

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | ADR-002                                    |
| **Data**      | 2026-08-15                                 |
| **Autor**     | Elessandro Prestes Macedo                  |
| **Status**    | Aprovado                                   |
| **Decisores** | Elessandro Prestes Macedo                  |

---

## Contexto
O portfólio necessitava de uma identidade visual técnica e sóbria que demonstrasse senioridade em arquitetura de software, fugindo de templates genéricos e garantindo acessibilidade WCAG 2.1 AA e Dark/Light Mode.

## Decisão
Implementar um Design System editorial baseado em utilitários do Tailwind CSS, tipografia mista (Space Grotesk, Inter, JetBrains Mono) e alternância de temas via classe `.dark`.

## Consequências
### Positivas
- Estética exclusiva, limpa e técnica.
- Alto contraste e conformidade estrita com WCAG 2.1 AA.
- Zero dependências pesadas de bibliotecas de componentes externas.
