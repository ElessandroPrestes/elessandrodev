# SPEC-007 — Remediação de Vulnerabilidades de Dependências (Dependabot #113, #114 e #115)

| Campo         | Valor                                                                    |
|---------------|--------------------------------------------------------------------------|
| **ID**        | SPEC-007                                                                 |
| **Data**      | 2026-10-08                                                               |
| **Autor**     | Gemini / Antigravity                                                     |
| **Status**    | Aprovada                                                                 |
| **Versão**    | 1.0                                                                      |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)                    |

---

## 1. Contexto e Motivação

O repositório `elessandrodev` registrou três alertas de segurança ativos reportados pelo GitHub Dependabot:

1. **Alerta #113 (`@vue/server-renderer` / `vue`):**
   - **Vulnerabilidade:** GHSA-g2v6-rqmx-r4w6 (Severidade Alta).
   - **Descrição:** XSS via missing carriage return (CR) em lista restrita de atributos no `@vue/server-renderer`.
2. **Alerta #114 (`postcss-selector-parser`):**
   - **Vulnerabilidade:** GHSA-rj75-hqrm-r3gf (Severidade Moderada).
   - **Descrição:** Complexidade quadrática na análise de seletores planos gerando esgotamento de CPU (DoS). Dependência transitiva do ecossistema PostCSS/Tailwind CSS v3.
3. **Alerta #115 (`source-map-js`):**
   - **Vulnerabilidade:** GHSA-68fv-2mgg-jv7q (Severidade Alta).
   - **Descrição:** DoS no event-loop através de offsets indexados de seções de source-map.

Além disso, a árvore transitiva do `tailwindcss` v3.4.x ancora versões de pacotes utilitários (`postcss-selector-parser` e `braces`) que podem introduzir riscos se não forem estritamente travadas em versões seguras através de `overrides` no gerenciador de pacotes (`npm`).

---

## 2. Objetivo

1. Atualizar o core do `vue` e executar saneamento seguro de auditoria (`npm update vue` e `npm audit fix`) para eliminar os alertas do `@vue/server-renderer` (#113) e `source-map-js` (#115).
2. Configurar a diretiva `"overrides"` em `package.json` para ancorar:
   - `"postcss-selector-parser": "^7.1.6"`
   - `"braces": "^3.0.3"`
   resolvendo o alerta #114 e prevenindo quebras no Tailwind CSS v3.
3. Reinstalar dependências (`npm install`) e certificar 0 vulnerabilidades via `npm audit`.
4. Validar os Quality Gates canônicos:
   - Execução integral da suíte de testes unitários e de resiliência (`npm test`) com 100% de aprovação (12/12).
   - Compilação do bundle de produção (`npm run build`) sem erros ou avisos de quebra.
5. Manter rastreabilidade documental SDD com TASK-007, QA-007, REVIEW-007, e atualização de `PROJECT.md` e `CHANGELOG.md` para release v1.9.1.
6. Realizar a publicação remota via Git (`develop` e `main`) para encerramento automático dos alertas pelo Dependabot.

---

## 3. Escopo

### Está incluído (IN)
- `package.json`: Configuração de `"overrides"` para `postcss-selector-parser` e `braces`.
- `package-lock.json`: Atualização determinística das dependências e subdependências sem vulnerabilidades.
- Verificação via `npm audit` confirmando 0 vulnerabilidades.
- Execução de testes de regressão com `npm test` e compilação com `npm run build`.
- Documentação SDD: `SPEC-007`, `TASK-007`, `QA-007`, `REVIEW-007`, `PROJECT.md` e `CHANGELOG.md` (v1.9.1).
- Envio para as branches remotas `develop` e `main` via Git.

### Não está incluído (OUT)
- Migração de versão principal do Tailwind CSS (migração para Tailwind v4 está fora de escopo para evitar breaking changes na UI).
- Alterações em regras de negócio ou componentes visuais da aplicação.

---

## 4. Critérios de Aceite

1. [ ] `package.json` contém os `overrides` para `postcss-selector-parser` e `braces`.
2. [ ] `npm audit` reporta 0 vulnerabilidades após a instalação.
3. [ ] `npm test` executa com sucesso (12/12 testes aprovados).
4. [ ] `npm run build` compila o bundle com sucesso.
5. [ ] Commits registrados em Português do Brasil no padrão Conventional Commits.
6. [ ] Dependabot alerts #113, #114 e #115 resolvidos no repositório GitHub.
