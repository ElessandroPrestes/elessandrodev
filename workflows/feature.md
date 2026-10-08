# Fluxo de Feature — elessandrodev

> Processo canônico para desenvolvimento e entrega de novas funcionalidades segundo o Universal SDD.

---

## Fases do Fluxo

```
[1. Proposta] ──► [2. Aprovação] ──► [3. Planejamento] ──► [4. Execução] ──► [5. QA & Review] ──► [6. Release]
```

### 1. Proposta da SPEC
- Copie o template:
  ```bash
  cp templates/spec/SPEC-TEMPLATE.md specs/SPEC-NNN-nome-da-feature.md
  ```
- Preencha contexto, motivação, escopo (IN/OUT), requisitos e critérios de aceitação.
- Defina o status como `Em Revisão`.

### 2. Aprovação do Product Owner
- O PO (Elessandro Prestes Macedo) analisa a SPEC.
- Havendo alinhamento, assina o campo de aprovação formal.
- **Regra:** Nenhuma codificação de produção pode ocorrer antes deste passo.

### 3. Planejamento da TASK
- Copie o template:
  ```bash
  cp templates/task/TASK-TEMPLATE.md tasks/TASK-NNN-nome-da-feature.md
  ```
- Relacione os arquivos exatos a criar e modificar.

### 4. Execução / Implementação
- O agente de IA ou desenvolvedor implementa estritamente o escopo aprovado.
- Segue padrões de Vue 3, Tailwind CSS, i18n e Clean Code.

### 5. Validação de QA e Reviews
- Executa compilação: `npm run build`.
- Preenche `reviews/QA-NNN.md` a partir de `templates/qa/QA-TEMPLATE.md`.
- Conduz o Code & Design Review em `reviews/REVIEW-NNN.md`.

### 6. Documentação e Release
- Atualiza `PROJECT.md` e `CHANGELOG.md`.
- Realiza commit em Português do Brasil (`feat: ...`).
- Submete branch/PR para aprovação final.
