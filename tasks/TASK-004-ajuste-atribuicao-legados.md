# TASK-004 — Execução do Ajuste de Atribuição de Sistemas Legados

| Campo              | Valor                                                  |
|--------------------|--------------------------------------------------------|
| **ID**             | TASK-004                                               |
| **SPEC**           | SPEC-004                                               |
| **Data de início** | 2026-10-08                                             |
| **Agente**         | Gemini / Antigravity                                   |
| **Status**         | Concluída                                              |

---

## Escopo da Implementação

1. **Componente Visual (`src/components/Statement.vue`):**
   - Ajustar parágrafo de introdução em PT e EN separando sistemas distribuídos / concorrência (ONS e Energia Pecém) da modernização de legados (CAPES e Grupo Paraíso).
2. **Dicionário em Português (`src/i18n/locales/pt.js`):**
   - Ajustar métrica de destaque em `statement.highlights` para `-40% Custos` (modernização de ERP legado no Grupo Paraíso) e `2.399 Testes` na EPM DEVTECH.
   - Atualizar casos de aplicação no princípio `ARCH-01` para `SIPREC / CAPES (448+ IES) · Grupo Paraíso (ERP Indústria Têxtil)`.
   - Limpar termos de sistemas legados da EPM DEVTECH (2026 e 2025-2026).
   - Enfatizar modernização de monolito legado na CAPES (SIPREC) e no Grupo Paraíso (ERP Têxtil e indústria).
3. **Dicionário em Inglês (`src/i18n/locales/en.js`):**
   - Sincronizar paridade exata para todas as alterações realizadas em `pt.js`.
4. **Contexto da IA (`src/services/aiService.js`):**
   - Ajustar histórico de EPM DEVTECH, CAPES e Grupo Paraíso em `ELESSANDRO_CONTEXT`.
   - Incluir nota de domínio explícita destacando que modernização de legados ocorreu única e exclusivamente na CAPES e no Grupo Paraíso.
5. **Quality Gates & Homologação:**
   - Executar `node src/services/aiService.test.mjs` (12/12).
   - Executar `npm run build` (0 erros).
   - Registrar `reviews/QA-004.md` e `reviews/REVIEW-004.md`.
   - Atualizar `PROJECT.md` e `CHANGELOG.md` para versão 1.7.0.

---

## Checklist de Execução

- [x] SPEC-004 documentada e aprovada
- [x] `Statement.vue` ajustado (PT e EN)
- [x] `pt.js` ajustado
- [x] `en.js` ajustado
- [x] `aiService.js` atualizado com nota de domínio de legados
- [x] Testes automatizados executados com sucesso
- [x] Build de produção validado com 0 erros
- [x] QA-004 e REVIEW-004 documentados
- [x] Documentação de release e governança atualizada
