# ADR-012 — Implantação em Kubernetes com Kustomize

| Campo           | Valor                                         |
|-----------------|-----------------------------------------------|
| **ID**          | ADR-012                                       |
| **Data**        | 2026-11-06                                    |
| **Autor**       | Agente de IA (opencode)                       |
| **Status**      | Aceito em 2026-11-06                          |
| **Decisores**   | Elessandro Prestes Macedo                     |
| **Relacionadas**| ADR-010, SPEC-015                             |

---

## Contexto

A nova stack Node precisa de empacotamento e uma via de implantação reproduzível
em cluster, sem substituir o deploy atual do GitHub Pages/Worker. O escopo pede
Dockerfiles non-root, `docker-compose` local e manifests Kubernetes com overlays
`local` e `oracle`, validação em CI e nenhum deploy automático.

## Decisão

Empacotar frontend e backend em imagens separadas e descrever a implantação com
Kustomize:

- Backend: multi-stage `node:24-alpine`, dependências de produção, usuário `app`,
  healthcheck via `fetch /health`.
- Frontend: build Vite e runtime `nginx-unprivileged`, proxy `/api` para o serviço
  `backend`, porta 8080.
- `k8s/base`: ServiceAccount, ConfigMap, Deployments, Services e NetworkPolicy.
- `k8s/overlays/local`: imagens locais, 1 réplica, `NODE_ENV=development` e
  `NodePort 30512`.
- `k8s/overlays/oracle`: 2 réplicas, imagens versionadas, Ingress de exemplo e
  CORS de produção como placeholder.
- Secrets nunca versionados: apenas `secret.example.yaml` e `secretRef` opcional.
- CI valida `docker compose config`, `kubectl kustomize` nos dois overlays e build
  das imagens non-root, sem push e sem deploy.

## Consequências

### Positivas

- Implantação reproduzível e revisável por diff.
- Separação clara entre configuração e segredo.
- Probes, resources, non-root, `readOnlyRootFilesystem` e NetworkPolicy por padrão.
- Overlays permitem adaptar imagens e réplicas sem duplicar manifests.

### Negativas / Trade-offs

- Cache e rate limit em memória exigem réplicas com sessões não aderentes ou
  aceitação de variação por réplica.
- NetworkPolicy de egress precisa liberar DNS e 443; clusters com proxies podem
  exigir ajuste.
- O Ingress de exemplo usa host placeholder e TLS manual.
- Kustomize não cobre promoção automatizada; o deploy continua manual e fora
  desta branch.

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|---|---|---|---|
| Helm | Templating poderoso | Complexidade para dois serviços | Kustomize é suficiente |
| Manifestos estáticos duplicados | Simples de ler | Divergência entre ambientes | Overlays eliminam duplicação |
| Docker Compose também em produção | Familiaridade | Não atende cluster | Fora do escopo |
| **Kustomize base + overlays** | **Simples e auditável** | **Sem rollout automático** | **Escolhida** |

## Conformidade e Validação

- `docker compose config --quiet`.
- `kubectl kustomize k8s/overlays/local` e `.../oracle`.
- Build local das imagens e verificação de UID diferente de zero.
- CI em `.github/workflows/infra.yml` sem etapas de deploy.
- Revisar esta ADR antes do primeiro deploy real em cluster.
