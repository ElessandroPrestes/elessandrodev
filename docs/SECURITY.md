# Segurança — Backend Node.js e Infraestrutura

> Documento da SPEC-015. Aplica-se ao backend em `backend/` e aos manifests em
> `k8s/`. O Worker de produção mantém sua própria postura (ADR-009).

## 1. Segredos

- Nunca versionar `backend/.env`, `.env`, `.dev.vars` ou secrets reais.
- `backend/.env.example` contém apenas chaves vazias e comentários.
- Kubernetes usa `secretRef` opcional e `secret.example.yaml` com placeholders.
- Crie o Secret no cluster via `kubectl create secret generic`.
- CI não recebe chaves de produção; testes usam `LLM_MODE=mock` e
  `EMBEDDINGS_PROVIDER=none`.

## 2. Entrada e abuso

- Corpo limitado a 4 KB (`REQUEST_BODY_LIMIT`).
- Pergunta de até 500 caracteres (`QUESTION_MAX_LENGTH`).
- Schema Zod estrito: campos extras são rejeitados.
- Rate limit por IP em `/api/chat` e `/chat` (`CHAT_RATE_LIMIT_MAX`, padrão 20 por
  60 s).
- JSON inválido retorna 400; corpo grande retorna 413; método incorreto retorna 405.

## 3. CORS e cabeçalhos

- Allowlist explícita em `CORS_ORIGINS`; origem desconhecida recebe 403.
- `credentials: false`; apenas `Content-Type` e `X-Request-Id` são aceitos.
- Headers expostos para diagnóstico: `X-Request-Id`, `X-Assistant-Cache`,
  `X-Assistant-Provider`, `X-Assistant-Stage` e `Retry-After`.
- Helmet ativo com CSP desabilitada porque o HTML é servido pelo Nginx da SPA.
- Nginx adiciona `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy`.

## 4. Contêiner e cluster

- Backend roda como usuário `app` (UID 100/GID 101), sem root.
- Frontend usa `nginx-unprivileged` (UID 101) na porta 8080.
- `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`,
  `readOnlyRootFilesystem: true` e `seccompProfile: RuntimeDefault`.
- ServiceAccount do backend com `automountServiceAccountToken: false`.
- NetworkPolicy: nega tudo por padrão, libera frontend → backend:3201, libera
  ingress no frontend:8080, permite DNS e saída 443 para provedores.

## 5. Dados e logs

- Logs Pino incluem `requestId`, `questionHash`, etapa, status e latência.
- A pergunta crua, o prompt e as chaves não são registrados.
- Erros internos não expõem stack trace ao cliente.
- Respostas de erro são localizadas e genéricas quando não são seguras.

## 6. Verificações

- Varredura por segredos no diff antes de abrir PR.
- Testes de CORS, payload, schema, rate limit e headers em `backend/tests`.
- Revisão manual dos manifests e do `docker-compose.yml`.
- Nenhuma credencial real em `k8s/`, CI ou documentação.
