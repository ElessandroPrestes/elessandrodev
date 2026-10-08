# ADR-003 — Assistente de IA Conversacional com LangChain.js e Google Gemini

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | ADR-003                                    |
| **Data**      | 2026-08-18                                 |
| **Autor**     | Elessandro Prestes Macedo                  |
| **Status**    | Aprovado                                   |
| **Decisores** | Elessandro Prestes Macedo                  |

---

## Contexto
Desejava-se incluir um assistente conversacional capaz de atuar como agente oficial do portfólio, respondendo perguntas técnicas sobre a carreira, métricas e projetos de Elessandro Prestes Macedo com baixa latência e alta precisão.

## Decisão
Integrar `@langchain/google-genai` e `@langchain/core` diretamente no frontend, utilizando a API Google Generative AI com injeção de contexto estruturado (padrão RAG canônico) e resiliência com rotação multi-modelo para evitar falhas 503 por alta demanda.

## Consequências
### Positivas
- Respostas rápidas e precisas aos recrutadores e líderes técnicos.
- Suporte bilíngue transparente (PT-BR / EN).
- Alta resiliência operacional com failover automático.

### Negativas / Trade-offs
- A chave de API do Gemini precisa de controle de cotas adequado no Google Cloud / AI Studio.
