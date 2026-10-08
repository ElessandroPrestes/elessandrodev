# Estratégia de Testes e Evidências — elessandrodev

> Diretrizes para garantia de qualidade, verificação contínua e registro de evidências.

---

## 1. Pirâmide e Abordagem de Testes

1. **Validação Estática e Build:**
   - Compilação estrita pelo Vite (`npm run build`).
   - Verificação de imports válidos, integridade de pacotes e ausência de dead code.
2. **Testes de Integração e Serviços:**
   - Teste das funções de orquestração de IA (`aiService.js`) garantindo que as cadeias LangChain inicializam corretamente e o fallback atua em caso de falha de modelo.
3. **Validação Visual e Manual:**
   - Checklists manuais cobrindo Mobile (320px / 375px), Desktop (1024px+), Dark Mode, Light Mode, alternância de idioma (PT/EN) e fluxo completo do chat de IA.

---

## 2. Registro Obrigatório de Evidências

Toda TASK concluída deve ter um arquivo correspondente gerado a partir do template em `templates/qa/QA-TEMPLATE.md` e salvo em `/reviews/QA-NNN.md` contendo:
- Saída de terminal do comando de build.
- Confirmação explícita de todos os itens do checklist manual.
- Assinatura e data de conclusão.
