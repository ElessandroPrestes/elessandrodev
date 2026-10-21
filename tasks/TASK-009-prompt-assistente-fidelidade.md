# TASK-009 — Adaptar Prompt do Assistente com Fidelidade Factual

| Campo              | Valor                                         |
|--------------------|-----------------------------------------------|
| **ID**             | TASK-009                                      |
| **SPEC**           | SPEC-009                                      |
| **Data de início** | 2026-10-21                                    |
| **Agente**         | opencode / deepseek-v4.1-flash-free           |
| **Status**         | Concluída (aprovada em QA-009/REVIEW-009)      |

---

## Escopo da Implementação

> Baseado na SPEC-009 aprovada, esta TASK implementa estritamente:

- Módulo `worker/prompt.js` com ficha, projetos, regras e contato.
- Integração no `worker/index.js`.
- Atalho determinístico de contato.
- Fallback seguro.
- Testes do prompt/contato.
- Alinhamento do corpus às regras sensíveis.

---

## Arquivos a Criar

| Arquivo                     | Descrição                                      |
|-----------------------------|------------------------------------------------|
| `worker/prompt.js`          | Prompt canônico e funções de contato            |
| `worker/prompt.test.mjs`    | Testes de contato, idioma, fallback e prompt    |
| `worker/index.test.mjs`     | Testes de integração do Worker com mocks        |

---

## Arquivos a Modificar

| Arquivo                          | Mudança                                      |
|----------------------------------|----------------------------------------------|
| `worker/index.js`                | Importar prompt, atalho de contato e fallback|
| `knowledge/rag/00-perfil.md`     | Resumo, idioma e stack alinhados             |
| `knowledge/rag/10-experiencia.md`| Verbos e métricas alinhados à ficha          |
| `package.json`                   | Script de teste do Worker                    |
| `PROJECT.md`                     | Registrar SPEC-009 (após validação do PO)    |
| `CHANGELOG.md`                   | Registrar versão (após validação do PO)      |

---

## Checklist de Implementação

- [x] `worker/prompt.js` sem import no bundle Vue
- [x] Contato determinístico em PT/EN
- [x] Regras de fidelidade no prompt
- [x] Regras de segurança e escopo no prompt
- [x] Citações `[id]` coerentes com o contexto
- [x] Corpus alinhado (Paraíso, SIPREC, empregador/cliente)
- [x] Testes automatizados
- [ ] Commits em pt-BR (somente se solicitado)

---

## Checklist de Validação & QA

- [x] `npm test` com exit code 0 (33 testes)
- [x] `npm run rag:check` sem divergências
- [x] `npm run rag:eval` com hit@4 >= 0.80
- [x] `npm run build` sem erros
- [x] Contato local responde sem LLM
- [x] Fallback fora do corpus responde sem inventar
- [x] `dist/` sem prompt/chave

---

## Evidências de Conclusão

### Testes
```text
16/16 testes do cliente HTTP
10/10 testes do prompt
7/7 testes do Worker
Total: 33 testes passaram
```

### Retrieval
```text
Índice consistente: 36 chunks | 365.0 KB
sourceHash: a8ed790e465d3ef375be9d1044f658e9b46c2be2c4a3fa9301f1e2cb4da2b5a6
hit@4: 100.0% (20/20) | MRR: 0.975 | cobertura: 100.0%
```

### Build
```text
dist/assets/index-L8Dz2nt2.js   211.09 kB │ gzip: 69.96 kB
✓ built in 4.53s
Bundle scan: clean
```

### Validação local
```text
Contato PT:  200 em 0.57s, sem AI/OpenRouter
Contato EN:  200 em 0.05s, sem AI/OpenRouter
Fora do corpus: 200 em 0.36s, safeFallback, sources: []
Rust:        200, "não consta no currículo", fonte [1]
Paraíso:     200, corrige para colaboração/participação
ONS/Pecém/CAPES: 200 em 18.1s, separa organizações e projetos
Legacy EN:   200 em 10.9s, três organizações, sem meta-comentário
Build:       200, bundle aponta para 127.0.0.1:8788
```

---

## Aprovação

- QA: `reviews/QA-009.md`
- Review: `reviews/REVIEW-009.md`
- Validação manual do PO: aprovada em 2026-10-21.
- Commit e release 1.11.0 pendentes de execução.

---

## Notas do Agente

- O prompt é longo de propósito: ficha e projetos são a fonte da verdade.
- O corpus continua servindo para citações e detalhes adicionais.
- A URL do LinkedIn foi normalizada para a usada no site (`elessandro-prestes-macedo`), pendente de confirmação do PO.
- `max_tokens` foi elevado para 3000 porque os modelos free de raciocínio consumiam o orçamento antes de emitir a resposta.
- Cadeia de modelos: `minimax/minimax-m3.1-flash:free` e `google/gemma-4-31b-it:free`; 404 de um modelo agora tenta o próximo em vez de encerrar a cadeia.
- O FAQ de modernização foi alinhado à ficha para incluir a EPM DEVTECH e evitar resposta meta sobre conflito de fontes.
- A ADR-007 formaliza o currículo como fonte da verdade e substitui a diretriz da SPEC-004 sobre a EPM DEVTECH.
- O backlog foi renumerado: performance passou a SPEC-010 e histórico conversacional a SPEC-011.
