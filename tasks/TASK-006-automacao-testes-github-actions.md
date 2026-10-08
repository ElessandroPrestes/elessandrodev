# TASK-006 — Execução da Automação de Testes no GitHub Actions e Deploy

| Campo              | Valor                                                  |
|--------------------|--------------------------------------------------------|
| **ID**             | TASK-006                                               |
| **SPEC**           | SPEC-006                                               |
| **Data de início** | 2026-10-08                                             |
| **Agente**         | Gemini / Antigravity                                   |
| **Status**         | Concluída                                              |

---

## Escopo da Implementação

1. **Configuração de Scripts (`package.json`):**
   - Adicionar `"test": "node src/services/aiService.test.mjs"`.
2. **Resiliência do Test Runner (`src/services/aiService.test.mjs`):**
   - Permitir leitura direta de `process.env.VITE_GEMINI_API_KEY` quando executado em containers de CI sem arquivo `.env` físico.
3. **Pipeline de CI/CD (`.github/workflows/deploy.yml`):**
   - Adicionar etapa `Run automated tests` executando `npm test`.
4. **Quality Gates & Homologação:**
   - Executar `npm test` e `npm run build` localmente.
   - Registrar `reviews/QA-006.md` e `reviews/REVIEW-006.md`.
   - Atualizar `PROJECT.md` e `CHANGELOG.md` para versão 1.9.0.
   - Commitar alterações.
5. **Ciclo de Entrega Contínua (Git & GitHub Actions):**
   - Push na branch `develop`.
   - Monitorar execução remota no GitHub Actions até ficar verde.
   - Fazer merge de `develop` para `main`.
   - Push na branch `main`.
   - Monitorar execução remota no GitHub Actions (Build + Deploy Pages) até ficar verde.
   - Retornar para a branch `develop`.

---

## Checklist de Execução

- [x] SPEC-006 documentada e aprovada
- [x] `package.json` atualizado com script de teste
- [x] `aiService.test.mjs` adaptado para runners de CI
- [x] `.github/workflows/deploy.yml` atualizado
- [x] Testes locais e build validados
- [x] QA-006 e REVIEW-006 documentados
- [x] Documentação de release e governança atualizada (v1.9.0)
- [x] Commit e Push na branch `develop`
- [x] Acompanhamento do CI em `develop` até ficar verde
- [x] Merge e Push na branch `main`
- [x] Acompanhamento do CI/CD em `main` até ficar verde
- [x] Retorno à branch de trabalho `develop`
