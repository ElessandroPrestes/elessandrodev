# ADR-010 — Backend RAG em Node.js + TypeScript + Express

| Campo           | Valor                                         |
|-----------------|-----------------------------------------------|
| **ID**          | ADR-010                                       |
| **Data**        | 2026-11-06                                    |
| **Autor**       | Agente de IA (opencode)                       |
| **Status**      | Aceito em 2026-11-06                          |
| **Decisores**   | Elessandro Prestes Macedo                     |
| **Relacionadas**| ADR-006, ADR-009, ADR-011, ADR-012, SPEC-015 |

---

## Contexto

O assistente RAG roda hoje no Cloudflare Worker `elessandrodev-chat`. A stack é
estável e resiliente (SPEC-014), mas o runtime proprietário limita portabilidade,
testes de integração locais e implantação em ambientes containerizados. A missão
aprovada pelo PO exige uma implementação paralela, verificável e independente, sem
alterar produção.

Restrições: manter o contrato `{ question, locale } → { response, sources }`,
preservar índice, corpus, chunking, retrieval e prompt; não fazer deploy nem
alterar o Worker nesta branch.

## Decisão

Criar `backend/` com Node.js 24, TypeScript strict e Express 5, isolado do
frontend, mantendo o Worker como rollback até a validação completa.

- Configuração centralizada com Zod em `backend/src/config/env.ts`.
- Organização por módulos: `rag`, `embeddings`, `llm`, `chat`, `health`.
- Middlewares próprios de request-id, logs Pino, erro, rate limit e 404.
- Segurança com Helmet, CORS restrito, corpo de 4 KB, pergunta de até 500
  caracteres e limites de taxa por IP.
- Endpoints `/health`, `/ready`, `/api/chat` e alias `/chat`.
- Cache em memória por réplica com TTL positivo e negativo.
- Shutdown gracioso em `SIGTERM`/`SIGINT`.
- Testes determinísticos com Vitest e Supertest, sem chamadas pagas por padrão.

## Consequências

### Positivas

- Runtime padronizado, portátil e containerizável.
- Testes de integração locais sem Wrangler.
- Contrato idêntico ao Worker, permitindo comparação e rollback.
- Configuração explícita e validada na inicialização.

### Negativas / Trade-offs

- Enquanto ambas as stacks existirem, há custo de manutenção duplicada.
- Rate limit e cache em memória não são compartilhados entre réplicas.
- O ambiente Node exige operação (processo, container, probes) que o Worker não
  exigia.
- Recursos de borda da Cloudflare deixam de ser automáticos.

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|---|---|---|---|
| Manter apenas o Worker | Zero migração | Não atende portabilidade nem K8s | Escopo aprovado exige alternativa Node |
| Fastify em vez de Express | Performance e schema nativo | Menor familiaridade no repositório | Express 5 é suficiente e amplamente conhecido |
| Hono | Leve e multiplataforma | Runtime de borda novamente | Não resolve o objetivo de container |
| NestJS | Estrutura pronta | Peso e complexidade desproporcionais | Backend pequeno não justifica |
| **Node + TypeScript + Express** | **Portátil, testável, previsível** | **Operação manual** | **Escolhida** |

## Conformidade e Validação

- `npm run lint`, `npm run typecheck`, `npm test` (55/55) e `npm run build`.
- Paridade híbrida e de prompt validada em testes dedicados.
- Evidências em `reviews/QA-015.md` e `reviews/REVIEW-015.md`.
- Revisar esta ADR quando o Worker for desativado ou o backend ganhar estado
  distribuído (cache/rate limit).
