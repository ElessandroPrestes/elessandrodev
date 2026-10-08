# SPEC-001 — Refatoração do Chat: Resiliência, Baixa Latência e Streaming

| Campo         | Valor                                                                    |
|---------------|--------------------------------------------------------------------------|
| **ID**        | SPEC-001                                                                 |
| **Data**      | 2026-10-08                                                               |
| **Autor**     | Gemini / Antigravity                                                     |
| **Status**    | Aprovada                                                                 |
| **Versão**    | 1.0                                                                      |
| **Aprovador** | Elessandro Prestes Macedo (Product Owner & Tech Lead)                    |

---

## 1. Contexto e Motivação

O assistente conversacional do portfólio `elessandrodev` apresentava dois sintomas críticos:
1. **Erros 503 Service Unavailable** frequentes gerados pelo uso do alias instável `gemini-flash-latest` do Google Gemini e ausência de política diferenciada de retry/fallback para erros transitórios.
2. **Alta latência percebida** decorrente da ausência de streaming de respostas (o usuário aguardava a geração completa de 100% dos tokens antes de visualizar qualquer caractere na tela).

Além disso, a arquitetura atual é uma SPA estática hospedada no GitHub Pages sem backend intermediário, o que expõe a chave de demonstração no bundle do cliente — um débito técnico que deve ser documentado e mitigado com segurança e governança.

---

## 2. Objetivo

Refatorar a camada de IA e a interface do chat para atingir:
1. **Baixa latência percebida (TTFT):** Implementação de streaming token a token (`stream()`) com renderização progressiva de Markdown.
2. **Resiliência robusta:** Retry inteligente com exponential backoff e jitter aplicado **estritamente a erros transitórios** (503, 502, 504, 429, timeout, network error).
3. **Timeout controlado:** AbortController/timeout configurável por chamada para evitar travamentos indefinidos.
4. **Fallback determinístico:** Alternância automática para modelo de contingência após esgotamento de retries do modelo principal.
5. **UX transparente:** Mensagens de feedback informativas durante retry ("Tentando restabelecer a conexão..."), fallback ("Tentando uma alternativa...") e tratamento de interrupção após o primeiro token.
6. **Observabilidade estruturada:** Telemetria de latência (TTFT, latência total, modelo utilizado, retries, fallback) sem vazamento de dados sensíveis.
7. **Simplicidade arquitetural:** Zero overengineering (sem Redis, sem filas, sem dependências adicionais pesadas).

---

## 3. Escopo

### Está incluído (IN)
- Descontinuação do alias `gemini-flash-latest`.
- Modelo primário estável: `gemini-3.5-flash` (ou configurável via ambiente).
- Modelo de fallback: `gemini-3.5-flash-lite` / `gemini-3.8-flash`.
- Centralização de configurações de LLM em arquivo de configuração dedicado (`src/config/aiConfig.js`) e variáveis de ambiente.
- Implementação de streaming no serviço de IA e consumo reativo em `AiAssistant.vue`.
- Tratamento diferenciado: falha antes do primeiro token (permite retry/fallback) vs falha após o primeiro token (preserva tokens parciais e emite aviso amigável de interrupção sem reexecutar geração duplicada).
- Retry limitado com backoff exponencial + jitter (máx 2 retries).
- Timeout configurável (padrão: 30s).
- Suporte a logs de observabilidade estruturados.
- Suíte de testes automatizados cobrindo os cenários A, B, C, D, E e F.

### Não está incluído (OUT)
- Criação de backend intermediário (Node/Express/Serverless) neste momento, preservando o modelo serverless estático do GitHub Pages (documentado como débito arquitetural).
- Implementação de Vector Databases externas (Chroma, Pinecone, FAISS) — o contexto atual é mantido via prompt injection de alta eficiência.

---

## 4. Requisitos Funcionais

1. **Streaming em Tempo Real:** Conforme os tokens chegam do LLM, o texto da mensagem do assistente deve ser atualizado progressivamente no DOM e scrollado suavemente.
2. **Feedback de Estado Transitório:**
   - Durante tentativa de retry: exibir badge/status "Tentando restabelecer a conexão...".
   - Durante acionamento de fallback: exibir "Nosso serviço principal está temporariamente indisponível. Tentando uma alternativa...".
3. **Falha após o primeiro token:** Caso a conexão caia no meio do streaming, o texto já gerado deve ser mantido e uma mensagem de rodapé anexada: *"A resposta foi interrompida. Tente novamente."*.
4. **Erros Permanentes (400, 401, 403, 404):** Devem falhar imediatamente sem disparar retries inúteis, exibindo mensagem amigável no chat e detalhes apenas no console de log.

---

## 5. Requisitos Não-Funcionais

| Requisito        | Critério                                                                   |
|------------------|----------------------------------------------------------------------------|
| **TTFT**         | Menor que 3.5 segundos sob condições normais de rede                       |
| **Timeout**      | 30.000 ms (configurável por variável)                                      |
| **Retries**      | Máximo 2 tentativas com backoff base de 500ms + jitter                     |
| **Build**        | Compilação limpa pelo Vite (`npm run build`) com 0 erros                   |
| **Segurança**    | Nunca registrar chaves de API nos logs estruturados de observabilidade     |

---

## 6. Cenários de Teste Canônicos

- **Cenário A (Sucesso Direto):** Gemini retorna 200 via streaming -> Resposta progressiva fluida.
- **Cenário B (503 transitório -> Sucesso no Retry):** Primeira chamada falha com 503 -> Retry após backoff -> Sucesso.
- **Cenário C (503 persistente no Primário -> Fallback):** Retries esgotados no modelo primário -> Ativa modelo fallback -> Sucesso.
- **Cenário D (Todos falham):** Primário e fallback falham -> Exibe mensagem amigável sem expor stack trace.
- **Cenário E (Erro permanente 401/404):** Falha imediata sem loop de retries.
- **Cenário F (Streaming com interrupção):** Falha após o primeiro token -> Preserva saída parcial com aviso de interrupção.

---

## 7. Impactos e Dependências

### Arquivos a Criar
- `src/config/aiConfig.js`: Configurações centralizadas de modelos, retries, timeouts e backoffs.
- `src/services/aiService.test.mjs`: Suíte de testes automatizados dos cenários de resiliência e streaming.

### Arquivos a Modificar
- `src/services/aiService.js`: Implementação da função `streamAssistant()` com streaming, retries, backoff, jitter, timeout e fallback.
- `src/components/AiAssistant.vue`: Suporte a streaming reativo, estados transitórios e tratamento de interrupções.
- `.env.example` e `.env`: Variáveis `VITE_GEMINI_PRIMARY_MODEL`, `VITE_GEMINI_FALLBACK_MODEL`, etc.
- `PROJECT.md` e `CHANGELOG.md`: Registro da evolução v1.4.0.

---

## 8. Aprovação Humana

| Campo              | Valor                                                  |
|--------------------|--------------------------------------------------------|
| **Aprovado por**   | Elessandro Prestes Macedo (Product Owner & Tech Lead)  |
| **Data**           | 2026-10-08                                             |
| **Assinatura**     | [X] Aprovado [ ] Rejeitado                             |
| **Observações**    | Execução autorizada sob o protocolo Universal SDD.     |
