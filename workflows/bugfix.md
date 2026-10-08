# Fluxo de Bugfix — elessandrodev

> Processo para investigação, correção e validação de defeitos segundo o Universal SDD.

---

## Fases do Fluxo de Correção

1. **Identificação e Evidência:**
   - Registrar o comportamento anômalo com evidências claras (prints, logs de console, códigos HTTP como 404, 503, etc.).
2. **Definição de Escopo e Causa Raiz:**
   - Para correções estruturais ou que alteram comportamento, criar uma SPEC de correção (`specs/SPEC-NNN-fix-nome.md`) ou vincular à TASK de correção.
3. **Implementação da Correção:**
   - Corrigir a causa raiz, evitando soluções cosméticas temporárias.
   - Preservar integridade do código e documentação adjacente.
4. **Validação e QA:**
   - Reproduzir o cenário anterior e confirmar a eliminação do defeito.
   - Rodar `npm run build`.
5. **Atualização Documental:**
   - Registrar a correção no `CHANGELOG.md` na seção `Corrigido` / `Fixed`.
   - Atualizar `PROJECT.md` se o estado canônico tiver sido afetado.
