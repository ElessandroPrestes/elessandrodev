# TASK-001 — Implementação da Refatoração do Chat: Streaming e Resiliência

| Campo              | Valor                                                  |
|--------------------|--------------------------------------------------------|
| **ID**             | TASK-001                                               |
| **SPEC**           | SPEC-001                                               |
| **Data de início** | 2026-10-08                                             |
| **Agente**         | Gemini / Antigravity                                   |
| **Status**         | Concluída                                              |

---

## Escopo da Implementação

Baseado na **SPEC-001** aprovada:
1. Criar `src/config/aiConfig.js` para centralizar configurações e variáveis de ambiente (modelos, retries, timeout, backoff, jitter).
2. Refatorar `src/services/aiService.js` para suportar `streamAssistant()` com:
   - Streaming token a token via LangChain;
   - Retry inteligente com exponential backoff + jitter estritamente para erros transitórios (503, 502, 504, 429, timeout, network error);
   - Timeout configurável com `AbortSignal`;
   - Fallback de modelo após esgotamento de retries do modelo primário;
   - Callbacks para eventos: `onToken`, `onStatus`, `onError`;
   - Observabilidade estruturada (medindo TTFT, latência total, modelo, retries e fallback).
3. Atualizar `src/components/AiAssistant.vue` para:
   - Renderização reativa de streaming em tempo real com auto-scroll suave;
   - Exibição de mensagens de transição informativas ("Tentando restabelecer...", "Tentando alternativa...");
   - Tratamento seguro de interrupção após o primeiro token (sem duplicação de resposta).
4. Configurar `.env` e `.env.example` com as variáveis limpas de configuração.
5. Criar suíte de testes automatizados `src/services/aiService.test.mjs` cobrindo cenários A até F.
6. Gerar relatório de QA em `reviews/QA-001.md` e Review em `reviews/REVIEW-001.md`.
7. Atualizar `PROJECT.md` e `CHANGELOG.md`.

---

## Arquivos a Criar

| Arquivo                             | Descrição                                            |
|-------------------------------------|------------------------------------------------------|
| `src/config/aiConfig.js`            | Centralização de parâmetros de IA e ambiente         |
| `src/services/aiService.test.mjs`   | Testes automatizados cobrindo cenários A a F         |

---

## Arquivos a Modificar

| Arquivo                             | Mudança                                              |
|-------------------------------------|------------------------------------------------------|
| `src/services/aiService.js`         | Implementação de streaming, retry, backoff e fallback|
| `src/components/AiAssistant.vue`    | Integração de streaming e estados transitórios de UX |
| `.env.example`                      | Declaração de variáveis centralizadas do LLM         |
| `.env`                              | Ajuste para modelo primário e secundário estáveis     |
| `PROJECT.md`                        | Registro do novo padrão arquitetural e streaming     |
| `CHANGELOG.md`                      | Registro da versão e das melhorias                   |

---

## Checklist de Execução

- [x] `src/config/aiConfig.js` criado e tipado
- [x] `src/services/aiService.js` refatorado com streaming e resiliência
- [x] `src/components/AiAssistant.vue` com streaming reativo e UX enriquecida
- [x] Testes automatizados executados e passando (12/12)
- [x] Build de produção (`npm run build`) validado com 0 erros
- [x] `reviews/QA-001.md` e `reviews/REVIEW-001.md` preenchidos
- [x] `PROJECT.md` e `CHANGELOG.md` atualizados
