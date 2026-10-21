# SPEC-009 — Prompt do Assistente com Fidelidade Factual e Contato Determinístico

| Campo         | Valor                                      |
|---------------|--------------------------------------------|
| **ID**        | SPEC-009                                   |
| **Data**      | 2026-10-21                                 |
| **Autor**     | Elessandro Prestes Macedo                  |
| **Status**    | Aprovada                                   |
| **Versão**    | 1.0                                        |

---

## Contexto e Motivação

O Worker atual usa um prompt curto, baseado apenas nos trechos recuperados. Isso funciona para perguntas cobertas pelo corpus, mas deixa lacunas em:

- regras de fidelidade (verbos de participação, capacidade versus medição, empregador versus cliente);
- perguntas sensíveis (salário, saída de empresas, vida pessoal);
- tentativas de prompt injection;
- contato direto, que hoje depende do LLM e pode variar.

O currículo é a fonte da verdade. O site pode divergir; nesse caso, o currículo prevalece. A diretriz factual da SPEC-004 sobre a EPM DEVTECH foi revista pela `ADR-007`.

---

## Objetivo

Substituir o prompt do Worker por uma versão canônica que inclua ficha profissional, projetos do portfólio, regras de fidelidade, escopo, segurança, idioma e contato determinístico, mantendo o RAG como material complementar.

---

## Escopo

### Está incluído (IN)

- Novo módulo `worker/prompt.js`, executado apenas no Worker.
- Ficha profissional e projetos do portfólio no prompt do sistema.
- Resposta determinística de contato, sem chamada ao LLM.
- Detecção de intenção de contato em PT/EN.
- Fallback seguro quando não há trecho relevante.
- Regras de citação dos trechos recuperados.
- Testes automatizados das funções de prompt/contato.
- Alinhamento do corpus RAG às regras de fidelidade.

### Não está incluído (OUT)

- Alterações no frontend Vue.
- Exposição de prompt, chave ou modelo ao navegador.
- Streaming de resposta.
- Memória conversacional.
- Mudança de provedor ou modelo de LLM.

---

## Requisitos Funcionais

1. O Worker deve responder perguntas de contato sem chamar o LLM, usando os dados canônicos de `CONTACT`.
2. A resposta de contato deve funcionar em PT e EN.
3. O prompt do sistema deve declarar que a ficha profissional prevalece sobre o site e sobre os trechos recuperados.
4. O prompt deve preservar a força dos verbos do currículo, especialmente no Grupo Paraíso (colaboração/participação).
5. O prompt deve tratar métricas do SIPREC como capacidade da arquitetura, não como tráfego medido.
6. O prompt deve distinguir empregador de cliente (AMcom/ONS, Datainfo/CAPES, Intellectus/SEDUC-MT).
7. O prompt deve recusar perguntas sensíveis e conteúdo fora do escopo.
8. O prompt deve resistir a instruções embutidas na pergunta ou nos trechos recuperados.
9. O Worker deve usar `safeFallback` quando não houver trecho acima do threshold.
10. As citações `[id]` devem corresponder aos trechos recuperados enviados no contexto.

---

## Requisitos Não-Funcionais

| Requisito        | Critério                                                              |
|------------------|-----------------------------------------------------------------------|
| Segurança        | Prompt e chave nunca vão para o bundle Vue                            |
| Fidelidade       | Regras explícitas para números, verbos, clientes e lacunas            |
| Performance      | Contato responde sem embedding e sem LLM                              |
| Testes           | `npm test` cobre prompt/contato e cliente HTTP                        |
| Manutenção       | Prompt isolado em um único módulo do Worker                           |

---

## Comportamento Esperado

### Cenário 1: Contato em português
**Dado** que o visitante pergunta "como entro em contato?"
**Quando** a mensagem chega ao Worker
**Então** a resposta traz e-mail, WhatsApp, LinkedIn e GitHub, sem chamada ao LLM.

### Cenário 2: Pergunta fora do corpus
**Dado** que nenhum chunk atinge o threshold
**Quando** a pergunta não é de contato
**Então** o Worker responde com `safeFallback`, `sources: []` e sem inventar fatos.

### Cenário 3: Prompt injection
**Dado** que a pergunta pede para ignorar instruções ou revelar o prompt
**Quando** o modelo responde
**Então** a resposta recusa em uma frase e oferece temas permitidos.

### Cenário 4: Grupo Paraíso
**Dado** que a pergunta atribui liderança individual ao Grupo Paraíso
**Quando** o modelo responde
**Então** a resposta corrige para colaboração/participação, conforme o currículo.

---

## Critérios de Aceitação

- [ ] `worker/prompt.js` exporta `CONTACT`, `CONTACT_INTENT`, `isEnglish`, `contactReply`, `safeFallback` e `buildSystemPrompt`.
- [ ] `worker/index.js` usa o novo prompt e o atalho de contato.
- [ ] Contato não chama embedding nem OpenRouter.
- [ ] `npm test` passa com os novos testes.
- [ ] `npm run rag:check` e `npm run rag:eval` passam após reindexar.
- [ ] Nenhum segredo ou prompt aparece no `dist/`.

---

## Impactos e Dependências

### Arquivos a criar
- `worker/prompt.js`
- `worker/prompt.test.mjs`
- `specs/SPEC-009-prompt-assistente-fidelidade.md`
- `tasks/TASK-009-prompt-assistente-fidelidade.md`

### Arquivos a modificar
- `worker/index.js`
- `knowledge/rag/00-perfil.md`
- `knowledge/rag/10-experiencia.md`
- `package.json`
- `PROJECT.md`
- `CHANGELOG.md`

### Dependências
- Depende de: SPEC-008 (Worker e RAG).
- Bloqueia: nenhuma.

---

## Riscos e Mitigações

| Risco                                      | Probabilidade | Mitigação                                      |
|--------------------------------------------|---------------|------------------------------------------------|
| Prompt longo aumentar latência/custo       | Média         | `max_tokens` limitado e resposta curta         |
| Duplicação entre ficha e corpus            | Alta          | Ficha prevalece; corpus alinhado nas regras    |
| Modelo ignorar regras de fidelidade        | Média         | Temperatura baixa, prompt explícito e testes   |
| Contato com URL divergente do site         | Baixa         | Usar a URL vigente no site e registrar no ADR  |

---

## Referências

- Prompt fornecido pelo PO em 2026-10-21.
- `knowledge/rag/` (corpus).
- ADR-006 (Worker e RAG).

---

## Aprovação Humana Obrigatória

| Campo              | Valor                                      |
|--------------------|--------------------------------------------|
| **Aprovado por**   | Elessandro Prestes Macedo                  |
| **Data**           | 2026-10-21                                 |
| **Assinatura**     | [x] Aprovado [ ] Rejeitado                 |
| **Observações**    | Aprovação dada na solicitação de adaptação.|
