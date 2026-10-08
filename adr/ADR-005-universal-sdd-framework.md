# ADR-005 — Adoção do Universal SDD como Framework de Governança e Engenharia

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | ADR-005                                    |
| **Data**      | 2026-10-08                                 |
| **Autor**     | Elessandro Prestes Macedo                  |
| **Status**    | Aprovado                                   |
| **Decisores** | Elessandro Prestes Macedo                  |

---

## Contexto
O desenvolvimento assistido por agentes de inteligência artificial (Gemini/Antigravity, Claude Code, Copilot) exige um método disciplinado para blindar o escopo, evitar divergências silenciosas entre código e documentação e permitir auditoria e previsibilidade em cada entrega.

## Decisão
Adotar formalmente o **Universal SDD (Spec-Driven Development)** em sua totalidade no repositório `elessandrodev`, estabelecendo a hierarquia tripartite soberana: SPEC aprovada > `PROJECT.md` > Código e Evidências de QA.

## Consequências
### Positivas
- Rastreabilidade ponta a ponta de cada mudança.
- Eliminação de retrabalho e desvios de escopo por IAs.
- Padronização idêntica entre projetos pessoais e profissionais do autor.
