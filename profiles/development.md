# Perfil Operacional: Desenvolvimento

> Diretrizes de ambiente e workflow durante a fase ativa de desenvolvimento.

---

## 1. Comandos de Ambiente
```bash
# Iniciar servidor local
npm run dev

# Ou via Docker
make up
make logs
```

## 2. Verificação Pré-Commit
1. Rodar `npm run build` localmente.
2. Certificar que o favicon carrega sem erro 404.
3. Certificar que chamadas de IA funcionam com o modelo configurado em `.env`.
4. Garantir que não há modificações indesejadas em arquivos fora do escopo da TASK ativa.
