# AGENTS.md — Protocolo Comum de Agentes e Colaboradores

> **Protocolo Universal SDD:** Aplicável a **todos os agentes de IA e colaboradores humanos** que interagem com o repositório `elessandrodev`.

---

## 1. Princípios Fundamentais

1. **A SPEC aprovada define o comportamento desejado de cada mudança.**
2. **O `PROJECT.md` registra o estado canônico do projeto.**
3. **Código e evidências de QA comprovam o comportamento entregue.**
4. **Toda implementação começa por uma SPEC assinada/aprovada.**
5. **Toda SPEC requer aprovação humana explícita do Product Owner (PO).**
6. **A IA implementa apenas o escopo aprovado** — sem expansão unilateral.
7. **Toda implementação deve passar pelos quality gates aplicáveis.**
8. **Mudanças arquiteturais exigem registro de ADR em `/adr/`.**
9. **A documentação evolui junto com o código.**
10. **Mensagens de commit devem ser sempre em Português do Brasil (pt-BR)** seguindo Conventional Commits.

---

## 2. Papéis e Responsabilidades

| Papel                  | Titular / Entidade          | Responsabilidade Principal                                                |
|------------------------|-----------------------------|---------------------------------------------------------------------------|
| **Product Owner (PO)** | Elessandro Prestes Macedo   | Criar/aprovar SPECs, priorizar backlog, revisar entregas, autorizar merge |
| **AI Agent (Primary)** | Antigravity / Gemini        | Análise do repositório, propor SPECs, implementar TASKs, coletar QA       |
| **AI Agent (Coder)**   | Claude Code / Copilot       | Implementações especializadas e revisões estáticas                        |
| **Reviewer**           | Elessandro Prestes Macedo   | Code Review, Design Review e aprovação final de QA                       |

---

## 3. Fluxo Obrigatório de Mudança

```
[SPEC (draft)] ──► [Aprovação PO] ──► [TASK Criada] ──► [Implementação] ──► [QA] ──► [Review] ──► [Docs] ──► [Release]
```

> **Aviso:** Nenhuma etapa deste fluxo pode ser omitida ou executada fora de ordem.

---

## 4. Convenções de Nomenclatura

| Artefato   | Padrão                | Exemplo                           | Localização   |
|------------|-----------------------|-----------------------------------|---------------|
| **SPEC**   | `SPEC-NNN-slug.md`    | `SPEC-001-resiliencia-ia.md`      | `/specs/`     |
| **TASK**   | `TASK-NNN-slug.md`    | `TASK-001-resiliencia-ia.md`      | `/tasks/`     |
| **QA**     | `QA-NNN.md`           | `QA-001.md`                       | `/reviews/`   |
| **REVIEW** | `REVIEW-NNN.md`       | `REVIEW-001.md`                   | `/reviews/`   |
| **ADR**    | `ADR-NNN-slug.md`     | `ADR-003-langchain-gemini.md`     | `/adr/`       |

---

## 5. Restrições Absolutas para Agentes de IA

- ❌ **Nunca** implementar sem SPEC aprovada pelo PO.
- ❌ **Nunca** expandir escopo além do que está delimitado na SPEC.
- ❌ **Nunca** resolver divergências entre SPEC e código de forma oculta — registrar e alertar o PO.
- ❌ **Nunca** commitar ou pushar diretamente em `main` sem passar pelo fluxo de revisão.
- ❌ **Nunca** escrever mensagens de commit em inglês — utilizar sempre **Português do Brasil (pt-BR)**.
- ❌ **Nunca** deixar de atualizar `PROJECT.md` e `CHANGELOG.md` após uma entrega concluída.
