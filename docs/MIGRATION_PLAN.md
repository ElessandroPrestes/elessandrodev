# Plano de Migração — Worker para Node.js

> Documento da SPEC-015. A migração é paralela: nada é removido do Cloudflare
> até a validação e aprovação explícitas.

## 1. Princípios

- Branch isolada `feature/migrate-rag-node-langchain-kubernetes`.
- Produção (GitHub Pages + Worker) intocada.
- Sem regeneração de índice, corpus, chunking, retrieval ou prompt factual.
- Cada fase precisa de evidência de teste antes da seguinte.

## 2. Fases

| Fase | Entrega | Critério de saída |
|---|---|---|
| 1. Contrato | Endpoints e schema equivalentes | Testes HTTP cobrem sucesso, 400, 403, 413, 429 e 503 |
| 2. Paridade RAG | Loader, híbrido e prompt portados | Testes de paridade contra `shared/retrieval.js` e `worker/prompt.js` |
| 3. Provedores | Embeddings e LLM com mock e config real | Testes de timeout, retry, fallback e circuit breaker |
| 4. Frontend | `/api/chat` padrão e zero retry | `npm test` e `npm run build` verdes |
| 5. Empacotamento | Dockerfiles e Compose | Build local e `docker compose config` |
| 6. Cluster | Base Kustomize + overlays | `kubectl kustomize` válido em `local` e `oracle` |
| 7. CI e SDD | Workflows, ADRs, docs, QA e REVIEW | Pipeline sem deploy e artefatos completos |
| 8. Validação | Smoke local com stack real | `/health`, `/ready` e `/api/chat` conferidos |
| 9. Produção | Fora desta branch | Aprovação do PO, DNS, secrets e rollback definidos |

## 3. Estratégia de convivência

1. Frontend pode apontar para o Node via `VITE_CHAT_API_URL`.
2. O Worker continua respondendo em seu domínio atual.
3. A troca de tráfego só ocorre após comparação de respostas e latência.
4. O rollback é imediato: reverter `VITE_CHAT_API_URL` para o Worker.

## 4. Riscos

| Risco | Mitigação |
|---|---|
| Divergência de retrieval | Teste de paridade com o índice real |
| Custo de LLM em teste | `LLM_MODE=mock` e embeddings `none` |
| Índice incompatível | Validação de dimensão e `sourceHash` na inicialização |
| Segredo vazado | Apenas exemplos versionados e `secretRef` |
| Deploy acidental | Workflows sem etapa de deploy e branch protegida |

## 5. Critérios para desligar o Worker

- Backend Node validado em ambiente equivalente à produção.
- Monitoramento com `/health`, `/ready` e logs sem dados sensíveis.
- Rate limit e cache compatíveis com o volume observado.
- Plano de rollback testado.
- Aprovação formal do PO em SPEC posterior.
