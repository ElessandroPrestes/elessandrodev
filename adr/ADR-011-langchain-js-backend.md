# ADR-011 — LangChain.js para Embeddings, Retrieval e Geração

| Campo           | Valor                                         |
|-----------------|-----------------------------------------------|
| **ID**          | ADR-011                                       |
| **Data**        | 2026-11-06                                    |
| **Autor**       | Agente de IA (opencode)                       |
| **Status**      | Aceito em 2026-11-06                          |
| **Decisores**   | Elessandro Prestes Macedo                     |
| **Relacionadas**| ADR-003, ADR-010, SPEC-015                    |

---

## Contexto

O Worker implementa retrieval híbrido (cosseno + BM25), prompt grounded e chamada
de provedores de forma artesanal. A migração para Node precisa reproduzir o mesmo
comportamento numérico e, ao mesmo tempo, reduzir código de integração com
provedores.

A ADR-003 havia registrado LangChain no cliente, que depois foi removido na
SPEC-008. Agora a dependência volta, mas exclusivamente no backend.

## Decisão

Usar LangChain.js no backend como camada de integração, sem delegar a lógica
factual do RAG:

- `@langchain/openai` fornece `ChatOpenAI` e `OpenAIEmbeddings` para endpoints
  compatíveis com a API OpenAI (OpenRouter, Ollama, vLLM).
- `@langchain/core` fornece `BaseRetriever` e tipos compartilhados.
- `@langchain/textsplitters` apoia scripts de manutenção do corpus.
- O retrieval híbrido continua implementado em `backend/src/modules/rag/` e é
  exposto como `BaseRetriever`, preservando pesos, threshold e ordenação.
- O prompt continua em `backend/src/modules/llm/prompt.ts`, portado do Worker.
- Embeddings Cloudflare BGE-M3 usam cliente REST próprio; o endpoint
  OpenAI-compatible usa LangChain.

## Consequências

### Positivas

- Menos código proprietário para falar com provedores OpenAI-compatible.
- Tipos e interfaces comuns para retriever e chat.
- Testes de paridade podem comparar o retriever Node com `shared/retrieval.js`.
- Troca de provedor compatível sem reescrever o cliente.

### Negativas / Trade-offs

- Novas dependências e superfície de atualização.
- Abstrações podem esconder detalhes de timeout, retry e cabeçalhos.
- A versão major do LangChain evolui rápido; versões estão fixadas no
  `package-lock.json`.
- O índice existente não é regenerado; a compatibilidade BGE-M3/1024 é validada na
  inicialização.

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|---|---|---|---|
| Cliente HTTP próprio | Controle total | Repetir integração e manutenção | LangChain reduz código sem perder o retriever |
| LangChain para todo o RAG | Menos código | Risco de divergência numérica | Paridade exige controle explícito |
| Vercel AI SDK | Bom ecossistema | Foco em streaming/UI | Backend precisa de retriever e embeddings |
| **LangChain apenas na integração** | **Equilíbrio** | **Dependências extras** | **Escolhida** |

## Conformidade e Validação

- `tests/hybrid-parity.test.ts` e `tests/prompt-parity.test.ts` comparam com a
  implementação vigente do Worker.
- `tests/embeddings.test.ts` e `tests/llm.test.ts` usam mocks/fetch controlado.
- `npm test` não realiza chamadas pagas por padrão.
- Revisar esta ADR se o contrato do `BaseRetriever` mudar em versões futuras.
