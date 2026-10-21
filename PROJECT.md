# PROJECT.md — Estado Canônico do Projeto

> **Nota:** Este é o documento de referência canônica absoluta do projeto **elessandrodev**.  
> Qualquer divergência entre este documento, as SPECs, o código e as evidências de QA deve ser tratada como defeito, mudança de escopo ou dívida documental — nunca resolvida silenciosamente.

---

## 1. Identificação

| Campo             | Valor                                                                                                    |
|-------------------|----------------------------------------------------------------------------------------------------------|
| **Nome**          | `elessandrodev` — Portfólio Interativo & Assistente de IA                                                |
| **Repositório**   | `ElessandroPrestes/elessandrodev`                                                                        |
| **URL Produção**  | [https://elessandroprestes.github.io/elessandrodev/](https://elessandroprestes.github.io/elessandrodev/) |
| **Deploy**        | GitHub Pages via GitHub Actions                                                                          |
| **Versão**        | 1.11.0                                                                                                   |
| **Autor**         | Elessandro Prestes Macedo (Software Engineer & Tech Lead)                                                |
| **Contato**       | [LinkedIn](https://www.linkedin.com/in/elessandro-prestes-macedo/) • WhatsApp: +55 (45) 99917-8290       |
| **Governança**    | **Universal SDD (Spec-Driven Development)**                                                              |

---

## 2. Propósito do Projeto

Portfólio de engenharia de software de alto impacto demonstrando senioridade técnica, histórico de liderança arquitetural, projetos de missão crítica e aplicação de IA no ciclo de desenvolvimento de software (SDD / RAG).

O projeto conta com:
1. **Design System Editorial:** Estética monocromática de alta precisão técnica com tipografia editorial (Space Grotesk, Inter, JetBrains Mono), Dark & Light Mode dinâmicos e conformidade estrita com WCAG 2.1 AA.
2. **Terminal de IA Conversacional (RAG real):** Assistente embarcado que consulta um índice de embeddings do histórico profissional, recupera trechos por cosseno + BM25 e gera respostas grounded com citação de fontes. A chave do provedor fica em um Cloudflare Worker, fora do bundle.
3. **Internacionalização (i18n):** Suporte nativo e fluido a Português (PT-BR) e Inglês (EN).

---

## 3. Stack Tecnológica Canônica

### 3.1 Frontend & Interface
| Tecnologia           | Versão   | Papel / Justificativa                                                     |
|----------------------|----------|---------------------------------------------------------------------------|
| **Vue.js**           | ^3.4.0   | Core da UI com Composition API, `<script setup>` e reatividade declarativa |
| **Vite**             | ^6.2.0   | Ferramenta de build de última geração e servidor de desenvolvimento       |
| **Tailwind CSS**     | ^3.4.0   | Estilização orientada a utilitários com tokens de cores e modo escuro     |
| **PostCSS**          | ^8.4.0   | Pipeline de transformação de CSS e prefixagem automática                  |
| **Marked**           | ^18.0.10 | Renderizador seguro de Markdown para as respostas da IA conversacional    |

### 3.2 Inteligência Artificial & Orquestração
| Tecnologia                     | Versão   | Papel / Justificativa                                                    |
|--------------------------------|----------|--------------------------------------------------------------------------|
| **Cloudflare Workers**         | runtime  | Backend do chat, CORS, prompt grounded e fallback de modelos             |
| **Cloudflare Workers AI**      | binding  | Embeddings com `@cf/baai/bge-m3`                                         |
| **OpenRouter**                 | API      | Geração de texto com cadeia de modelos gratuitos                         |
| **RAG híbrido**                | local    | Cosseno + BM25, threshold e citação de fontes                            |

### 3.3 Infraestrutura, Tooling & CI/CD
| Tecnologia           | Versão   | Papel / Justificativa                                                     |
|----------------------|----------|---------------------------------------------------------------------------|
| **GNU Make**         | Padrão   | Automação unificada de comandos de desenvolvimento, teste e build         |
| **Docker & Compose** | OCI      | Ambiente de desenvolvimento encapsulado e independente do SO host         |
| **GitHub Actions**   | v4       | Pipeline automatizada de build, validação e deploy contínuo no Pages      |

---

## 4. Arquitetura da Aplicação

### 4.1 Estrutura de Diretórios Canônica
```
src/
├── components/          # Componentes visuais atômicos e seções
│   ├── AiAssistant.vue  # Chat com fontes, retries e mensagens PT/EN
│   └── ...
├── composables/         # useTheme e useI18n
├── config/
│   └── aiConfig.js      # URL do Worker, retries, timeout e telemetria
├── i18n/locales/        # pt.js e en.js
├── services/
│   ├── aiService.js     # Cliente HTTP do Cloudflare Worker
│   └── aiService.test.mjs # 16 testes com fetch mockado
├── style.css
├── App.vue
└── main.js

knowledge/
├── rag/                 # Corpus versionado (perfil, experiências, projetos, FAQ)
└── eval/questions.json  # 20 perguntas de avaliação de retrieval

scripts/
├── build-index.mjs      # Gera embeddings e índice
├── check-index.mjs      # Valida sourceHash e consistência
├── eval-retrieval.mjs   # Mede hit@4, MRR e cobertura
└── rag-lib.mjs          # Utilitários compartilhados

shared/retrieval.js      # Tokenização, cosseno, BM25 e score híbrido

worker/
├── index.js             # HTTP, CORS, contato, RAG e OpenRouter
├── prompt.js            # Ficha, regras e contato determinístico
└── rag/
    ├── index.json       # Índice versionado
    └── retrieve.js      # Embedding, retrieval e fontes

wrangler.toml            # Binding AI e variáveis não sensíveis
```

### 4.2 Fluxo de Execução do Assistente
```
[Usuário envia mensagem]
         │
         ▼
[AiAssistant.vue]
  ├─ Valida palavras-chave de menu local
  └─ askAssistant(question, locale)
         │
         ▼
[aiService.js]
  ├─ POST { question, locale } para VITE_CHAT_API_URL
  ├─ Timeout via AbortController
  └─ Retry com backoff em 429/5xx/timeout/rede
         │
         ▼
[Cloudflare Worker]
  ├─ Valida Origin, payload e limites
  ├─ Intenção de contato ──► resposta determinística sem LLM
  ├─ Workers AI: embedding da pergunta
  ├─ Recuperação híbrida + threshold
  ├─ Sem chunks relevantes ──► fallback sem LLM
  └─ OpenRouter: geração com prompt canônico e fallback de modelos
         │
         ▼
[Resposta { response, sources }]
  └─ Vue renderiza Markdown + seção/score das fontes
```

---

## 5. Padrões de Qualidade & Quality Gates

1. **Build Estável:** O comando `npm run build` deve compilar com 0 erros.
2. **Acessibilidade:**
   - Suporte completo a navegação por teclado (`Tab`, `Shift+Tab`, `Enter`).
   - Contraste mínimo WCAG 2.1 AA (4.5:1 para texto normal, 3:1 para texto grande).
   - Skip links funcionais para foco rápido no conteúdo.
3. **Design Editorial & Mobile First:**
   - 320px, 640px, 768px, 1024px, 1280px e 1536px testados sem overflow horizontal.
4. **Resiliência do assistente:**
   - Suíte `src/services/aiService.test.mjs` com 16 testes: sucesso, 429, 5xx, 400, timeout, rede e configuração ausente.
   - Suítes do Worker com 10 testes de prompt e 7 de integração; `npm test` executa 33 testes.
   - `rag:eval` com hit@4 de 100% e MRR 0.975.

---

## 6. Segurança

- O frontend no GitHub Pages é estático e não contém chave de LLM.
- `OPENROUTER_API_KEY` existe apenas como secret do Cloudflare Worker.
- `CLOUDFLARE_API_TOKEN` de ingestão fica em `.env.ingest`, ignorado pelo Git.
- CORS restrito às origens de produção e desenvolvimento local.
- Limites de payload (2000 bytes) e pergunta (500 caracteres).
- O prompt usa a ficha canônica como fonte da verdade e os trechos recuperados como complemento; recusa quando não há base.
- O Worker sanitiza artefatos de idioma indevidos na resposta.

---

## 7. Próximos Passos & Backlog Estratégico (Universal SDD)

- [x] **SPEC-001 [IA & Resiliência]:** Refatoração do chat com streaming reativo, eliminação do alias instável `gemini-flash-latest`, retries com jitter e modelo de contingência (Concluída em v1.4.0).
- [x] **SPEC-002 [Conteúdo & i18n]:** Suporte a currículos bilíngues dinâmicos (PT-BR e EN) com integridade de assets e sincronização cadastral da trajetória na EPM DEVTECH (Concluída em v1.5.0).
- [x] **SPEC-003 [Editorial & Copy]:** Revisão e humanização da prosa editorial sob protocolo `/humanizer`, eliminando 25 padrões/clichês de IA e adotando tom pragmático de Engenheiro Sênior (Concluída em v1.6.0).
- [x] **SPEC-004 [Conteúdo & Domínio]:** Correção e atribuição factual inicial de modernização de legados para CAPES (SIPREC) e Grupo Paraíso (ERP Indústria Têxtil) (Concluída em v1.7.0; diretriz sobre EPM revista pela ADR-007).
- [x] **SPEC-005 [Editorial & Projetos]:** Atualização dos estudos de caso de engenharia (Selected Work) com novo título, manifesto de laboratórios arquiteturais e fundamentação de produção em "Origem & Contexto Real" (Concluída em v1.8.0).
- [x] **SPEC-006 [CI/CD & Quality Gates]:** Pipeline de automação de testes unitários e de resiliência no GitHub Actions antes do build e deploy (Concluída em v1.9.0).
- [x] **SPEC-007 [Segurança & Dependências]:** Remediação de vulnerabilidades do Dependabot (#113, #114 e #115) atualizando Vue, source-map-js e definindo overrides seguros para PostCSS/Tailwind v3 (Concluída em v1.9.1).
- [x] **SPEC-008 [Segurança & RAG]:** Migração para Cloudflare Worker, corpus Markdown, índice de embeddings, retrieval híbrido, citação de fontes e remoção de LangChain/Gemini do cliente (Concluída em v1.10.0).
- [x] **SPEC-009 [IA & Prompt]:** Prompt canônico com ficha, fidelidade factual, contato determinístico, fallback seguro e corpus alinhado ao currículo (Concluída em v1.11.0).

> **Backlog Estratégico (Mapeado em `ROADMAP.md` para execução futura mediante SPEC aprovada):**

1. **SPEC-010 [Performance]:** Code splitting adicional no Vite (`build.rollupOptions.output.manualChunks`) e avaliação de cache de embeddings.
2. **SPEC-011 [Experiência de Usuário]:** Histórico conversacional com janela deslizante (últimas 3 a 5 mensagens) com teto controlado de tokens para manter contexto sem inflar custos.
