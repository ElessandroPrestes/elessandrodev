# Kubernetes e Kustomize

> Documento da SPEC-015. Cobre `k8s/base`, `k8s/overlays/local` e
> `k8s/overlays/oracle`. Nenhum deploy é executado pela CI.

## 1. Estrutura

```
k8s/
├── base/
│   ├── serviceaccount.yaml
│   ├── configmap.yaml
│   ├── secret.example.yaml   # não incluso nos resources
│   ├── deployment-backend.yaml
│   ├── service-backend.yaml
│   ├── deployment-frontend.yaml
│   ├── service-frontend.yaml
│   └── networkpolicy.yaml
└── overlays/
    ├── local/    # imagens locais, 1 réplica, NodePort 30512
    └── oracle/   # 2 réplicas, imagens versionadas, Ingress de exemplo
```

## 2. Recursos aplicáveis

| Recurso | Destaque |
|---|---|
| Deployment backend | 1–2 réplicas, non-root, fs somente leitura, probes `/health` e `/ready` |
| Deployment frontend | Nginx unprivileged na 8080, probes em `/` |
| Service backend | ClusterIP `backend:3201` |
| Service frontend | ClusterIP `frontend:8080`; NodePort 30512 no overlay local |
| ConfigMap | Toda configuração não sensível |
| NetworkPolicy | Default deny, ingress explícito, DNS e 443 liberados |

## 3. Secret

```bash
kubectl create namespace elessandrodev
kubectl -n elessandrodev create secret generic elessandrodev-backend-secrets \
  --from-literal=OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
  --from-literal=CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
  --from-literal=CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN"
```

O Deployment referencia o Secret com `optional: true`. Sem ele, o pod inicia, mas
`/ready` retorna 503 enquanto os provedores não estiverem configurados.

## 4. Renderizar e aplicar

```bash
kubectl kustomize k8s/overlays/local > /tmp/local.yaml
kubectl apply -f /tmp/local.yaml

kubectl kustomize k8s/overlays/oracle > /tmp/oracle.yaml
kubectl apply -f /tmp/oracle.yaml
```

Antes do overlay `oracle`, ajuste:

1. `overlays/oracle/ingress.yaml` — host e `secretName` TLS reais.
2. `overlays/oracle/config-patch.yaml` — `CORS_ORIGINS` do domínio real.
3. `kustomization.yaml` — registry e tags das imagens.

## 5. Probes e ciclo de vida

- `startupProbe`: `/health` a cada 5 s, até 12 tentativas.
- `livenessProbe`: `/health` a cada 30 s.
- `readinessProbe`: `/ready` a cada 10 s; depende de índice, embeddings e LLM.
- `terminationGracePeriodSeconds: 20` no backend; shutdown gracioso configurado
  por `SHUTDOWN_TIMEOUT_MS`.

## 6. Limitações

- Cache, rate limit e circuit breaker são por réplica.
- O índice é imutável dentro da imagem; atualizar exige novo build e rollout.
- NetworkPolicy libera 443 para qualquer destino fora de faixas privadas; clusters
  com proxy corporativo precisam de ajuste.
- Não há HPA nem PDB nesta entrega; volumes são baixos e o rollout usa
  `maxUnavailable: 0`.

## 7. Validação em CI

`.github/workflows/infra.yml` executa:

- `docker compose config --quiet`.
- `kubectl kustomize k8s/overlays/local`.
- `kubectl kustomize k8s/overlays/oracle`.
- Build das duas imagens e verificação de UID diferente de zero.
