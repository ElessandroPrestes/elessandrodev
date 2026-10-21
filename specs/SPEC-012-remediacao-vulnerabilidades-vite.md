# SPEC-012 — Remediação das Vulnerabilidades do Vite

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | SPEC-012                                   |
| **Data**      | 2026-10-21                                 |
| **Autor**     | opencode / deepseek-v4.1-flash-free        |
| **Status**    | Aprovada                                   |
| **Versão**    | 1.0                                        |

---

## Contexto e Motivação

O Dependabot reportou cinco alertas abertos no `package-lock.json`, todos no pacote `vite` na versão `6.4.3` ou inferior:

| Alerta | Severidade | Vulnerabilidade |
|---|---|---|
| #120 | Baixa | Cross origin script execution through Vite custom middleware (CVE-2026-112945) |
| #119 | Média | Files outside `server.fs.allow` could be served on non-Windows machines (CVE-2026-112946) |
| #118 | Média | `launch-editor`: editor CLI flag misinterpretation (CVE-2026-112944) |
| #117 | Alta | `launch-editor`: `fs.existsSync()` bypass on Windows (CVE-2026-112942) |
| #116 | Média | `launch-editor`: `escapeCmdArgs()` omits `%` escaping on Windows (CVE-2026-112943) |

A versão corrigida indicada pelo Dependabot é **Vite 6.4.4**.

## Objetivo

Atualizar o Vite para `6.4.4` ou superior compatível com a série 6, regenerar o lockfile e confirmar que testes, retrieval e build continuam íntegros.

## Escopo

### Está incluído (IN)

- Atualização de `vite` em `package.json` e `package-lock.json`.
- Atualização transitiva de `launch-editor` e dependências relacionadas.
- Execução dos quality gates existentes.
- Registro documental em `PROJECT.md`, `CHANGELOG.md`, TASK, QA e REVIEW.
- Verificação dos alertas do Dependabot após o push.

### Não está incluído (OUT)

- Atualização de Vue, Tailwind, PostCSS ou outras dependências fora da cadeia do Vite, incluindo o salto para Tailwind 4.
- Mudanças de UI, copy, arquitetura ou comportamento do assistente.
- Alteração de workflows de CI além do necessário para validar o build.

## Requisitos Funcionais

1. O projeto deve usar Vite `>= 6.4.4` e `< 7`.
2. O lockfile deve ser regenerado de forma consistente pelo npm.
3. `npm test`, `npm run rag:check`, `npm run rag:eval` e `npm run build` devem passar.
4. Nenhuma vulnerabilidade aberta do Dependabot deve permanecer para `vite`/`launch-editor`. Os achados da cadeia Tailwind 3 são risco separado e estão fora do escopo.

## Requisitos Não-Funcionais

| Requisito | Critério |
|---|---|
| Segurança | Fechar os cinco alertas abertos |
| Compatibilidade | Manter `@vitejs/plugin-vue` e o build atuais |
| Estabilidade | Sem mudanças de comportamento no frontend ou Worker |
| Rastreabilidade | Evidências em QA-012/REVIEW-012 |

## Critérios de Aceitação

- [ ] `vite` resolvido para `6.4.4` no `package-lock.json`.
- [ ] `npm ls vite launch-editor` sem conflitos.
- [ ] `npm test` com 33/33 testes.
- [ ] `npm run build` sem erros.
- [ ] `npm audit` sem vulnerabilidades em `vite` ou `launch-editor`; achados da cadeia Tailwind 3 registrados à parte.
- [ ] Alertas Dependabot #116–#120 fechados após o push.

## Impactos e Dependências

### Arquivos a modificar
- `package.json`
- `package-lock.json`
- `PROJECT.md`
- `CHANGELOG.md`
- `ROADMAP.md`

### Dependências
- Depende de: nenhuma.
- Bloqueia: nenhuma.

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Regressão no dev server/build | Baixa | Rodar testes e build completos |
| Conflito com `@vitejs/plugin-vue` | Baixa | Manter a série 6 e validar o build |
| Lockfile com ruído | Média | Commitar apenas a atualização esperada |

## Referências

- Dependabot alerts #116, #117, #118, #119 e #120.
- `package.json` / `package-lock.json`.
- SPEC-007 (remediação anterior de vulnerabilidades).

---

## Aprovação Humana Obrigatória

| Campo              | Valor                       |
|--------------------|-----------------------------|
| **Aprovado por**   | Elessandro Prestes Macedo   |
| **Data**           | 2026-10-21                  |
| **Assinatura**     | [x] Aprovado [ ] Rejeitado  |
