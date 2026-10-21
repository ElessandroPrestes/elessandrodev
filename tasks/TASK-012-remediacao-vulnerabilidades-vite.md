# TASK-012 — Remediação das Vulnerabilidades do Vite

| Campo              | Valor                                         |
|--------------------|-----------------------------------------------|
| **ID**             | TASK-012                                      |
| **SPEC**           | SPEC-012                                      |
| **Data de início** | 2026-10-21                                    |
| **Agente**         | opencode / deepseek-v4.1-flash-free           |
| **Status**         | Concluída (v1.11.1 em produção)                |

---

## Escopo da Implementação

> Baseado na SPEC-012 aprovada, esta TASK implementa estritamente:

- Atualização do Vite para a versão corrigida.
- Regeneração do lockfile.
- Validação dos quality gates.
- Registro documental e verificação dos alertas.

---

## Arquivos a Criar

| Arquivo              | Descrição                          |
|----------------------|------------------------------------|
| `reviews/QA-012.md`  | Evidências de QA                   |
| `reviews/REVIEW-012.md` | Revisão técnica                 |

---

## Arquivos a Modificar

| Arquivo              | Mudança                              |
|----------------------|--------------------------------------|
| `package.json`       | Atualizar a faixa do Vite            |
| `package-lock.json`  | Regenerar com Vite 6.4.4             |
| `PROJECT.md`         | Registrar a versão 1.11.1            |
| `CHANGELOG.md`       | Registrar a correção de segurança    |
| `ROADMAP.md`         | Atualizar a versão atual             |

---

## Checklist de Implementação

- [x] `npm install vite@^6.4.4 --save-dev`
- [x] `npm ls vite launch-editor` sem conflitos
- [x] Lockfile com Vite 6.4.5
- [x] Nenhuma outra dependência alterada fora da cadeia
- [x] Documentação atualizada

---

## Checklist de Validação & QA

- [x] `npm audit` sem vulnerabilidades em Vite/launch-editor
- [x] `npm test` com 33/33 testes
- [x] `npm run rag:check` consistente
- [x] `npm run rag:eval` com hit@4 >= 0.80
- [x] `npm run build` sem erros
- [x] Varredura do bundle sem segredos
- [x] Alertas Dependabot #116–#120 fechados

---

## Evidências de Conclusão

### Dependências
```text
vite@6.4.5 (package.json: ^6.4.5, lock: 6.4.5)
launch-editor: não instalado
@vitejs/plugin-vue@6.0.5: compatível
```

### Testes e build
```text
16/16 testes do cliente HTTP
10/10 testes do prompt
7/7 testes do Worker
rag:check: 36 chunks, 365.0 KB, sourceHash a8ed790e...
rag:eval: hit@4 100.0%, MRR 0.975
build: 211.09 kB, ✓ built in 5.12s
bundle: limpo
```

### Dependabot
```text
Alertas #116–#120: fixed em 2026-10-21T18:54Z.
Alertas abertos no Dependabot: 0.
npm audit: 5 high remanescentes na cadeia Tailwind 3 (braces/chokidar/fast-glob/micromatch), fora do escopo.
```

---

## Aprovação

- QA: `reviews/QA-012.md`
- Review: `reviews/REVIEW-012.md`
- Release 1.11.1 publicada; CI verde e alertas Dependabot fechados.

---

## Notas do Agente

- A correção é restrita à cadeia do Vite; qualquer outro upgrade deve ser tratado em SPEC própria.
