# SPEC-006 — Integração de Testes Automatizados no Pipeline GitHub Actions

| Campo         | Valor                                                                    |
|---------------|--------------------------------------------------------------------------|
| **ID**        | SPEC-006                                                                 |
| **Data**      | 2026-10-08                                                               |
| **Autor**     | Gemini / Antigravity                                                     |
| **Status**    | Aprovada                                                                 |
| **Versão**    | 1.0                                                                      |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)                    |

---

## 1. Contexto e Motivação

O projeto `elessandrodev` possui uma suíte determinística de testes automatizados (`src/services/aiService.test.mjs`) que valida 12 cenários canônicos de resiliência, tolerância a falhas, retries exponenciais, jitter, fallbacks entre modelos e streaming de IA.

Atualmente, o pipeline de CI/CD em `.github/workflows/deploy.yml` executa apenas o passo `npm run build`. Integrar a suíte de testes automatizados (`npm test`) como quality gate bloqueante antes da etapa de compilação garante que:
1. Qualquer regressão no comportamento da IA ou quebra de contratos seja detectada imediatamente no CI.
2. Apenas builds validados e aprovados sejam gerados e publicados no GitHub Pages.
3. O fluxo de release Git (develop ➔ main) permaneça auditável, seguro e determinístico.

---

## 2. Objetivo

1. Definir o script canônico `"test": "node src/services/aiService.test.mjs"` em `package.json`.
2. Tornar a resolução de variáveis de ambiente em `src/services/aiService.test.mjs` resiliente à ausência de `.env` físico em runners de CI (lendo de `process.env.VITE_GEMINI_API_KEY` injetado pelo GitHub Actions).
3. Atualizar o workflow `.github/workflows/deploy.yml` para adicionar o step `Run automated tests` antes do `Build project`.
4. Validar o pipeline completo em ambiente local e no GitHub remoto:
   - Push na branch `develop` e acompanhamento do workflow até ficar verde (aprovado).
   - Merge na branch `main` e push, acompanhando o pipeline completo de Build e Deploy no GitHub Pages até ficar verde (aprovado).
5. Formalizar toda a entrega seguindo a governança Universal SDD.

---

## 3. Escopo

### Está incluído (IN)
- `package.json`: Inclusão do script `"test": "node src/services/aiService.test.mjs"`.
- `src/services/aiService.test.mjs`: Resolução condicional e segura de variáveis de ambiente (`process.env` / `.env`).
- `.github/workflows/deploy.yml`: Step de execução de testes automatizados com injeção de secret `VITE_GEMINI_API_KEY`.
- Teste local com `npm test` e `npm run build`.
- Documentação SDD: `TASK-006`, `QA-006`, `REVIEW-006`, `PROJECT.md` e `CHANGELOG.md` (v1.9.0).
- Git push para `develop`, monitoramento do CI remoto via `gh`, merge para `main`, push e monitoramento do deploy Pages remoto.

### Não está incluído (OUT)
- Alterações em regras de negócio da aplicação frontend ou componentes visuais.
- Modificação na arquitetura de hospedagem do GitHub Pages.

---

## 4. Critérios de Aceite

1. [ ] `package.json` possui o comando `"test"`.
2. [ ] `npm test` executa com sucesso localmente (12/12 testes).
3. [ ] `.github/workflows/deploy.yml` executa os testes antes do build.
4. [ ] Push na branch `develop` dispara o GitHub Actions e o run conclui com sucesso (verde).
5. [ ] Merge na branch `main` e push disparam o pipeline de Build & Deploy no GitHub Pages, concluindo com sucesso (verde).
6. [ ] A branch local de trabalho finaliza sincronizada em `develop`.
