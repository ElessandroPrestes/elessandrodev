# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.14.0] - 2026-11-07

> Migração paralela em branch isolada. Produção (GitHub Pages + Worker) permanece
> na 1.13.0; nada foi publicado por esta entrega.

### Adicionado
- **Migração do RAG para Node.js, LangChain.js e Kubernetes (SPEC-015 / TASK-015)**:
  - `backend/` com Node.js 24, TypeScript strict, Express 5 e configuração Zod.
  - Loader do índice existente com 36 chunks, 1024 dimensões e `sourceHash`.
  - Retrieval híbrido com paridade numérica e prompt grounded portado.
  - Embeddings Cloudflare BGE-M3 e endpoint OpenAI-compatible.
  - LLM OpenRouter via `ChatOpenAI`, com fallback, retry, timeout e circuit breaker.
  - Cache positivo/negativo, rate limit, CORS, Helmet, request-id e logs Pino.
  - Endpoints `/health`, `/ready`, `/api/chat` e alias `/chat`.
  - 55 testes determinísticos com Vitest e Supertest.
  - `backend/Dockerfile` multi-stage non-root com healthcheck.
  - `Dockerfile` do frontend com `nginx-unprivileged` e proxy `/api`.
  - `docker-compose.yml` local com backend + frontend e healthchecks.
  - `k8s/base` e overlays `local`/`oracle` com Kustomize, probes, resources,
    NetworkPolicy e Secret de exemplo.
  - Workflows `backend.yml`, `frontend.yml` e `infra.yml`, sem deploy.
  - ADR-010, ADR-011, ADR-012 e documentos de arquitetura, migração, segurança,
    desenvolvimento local, Kubernetes, testes e relatório.

### Modificado
- `VITE_CHAT_API_URL` padrão passa a `/api/chat`.
- `VITE_LLM_MAX_RETRIES` padrão passa a `0`: o backend é a fonte de resiliência.
- `vite.config.js` faz proxy de `/api` para `127.0.0.1:3201`.
- Cliente registra `X-Assistant-Cache` no diagnóstico.
- `PROJECT.md`, `README.md`, `ROADMAP.md` e `TASK-015` atualizados.

### Segurança
- Imagens rodam como usuários non-root (backend UID 100, frontend UID 101).
- Manifests usam `readOnlyRootFilesystem`, `drop: [ALL]`, seccomp e NetworkPolicy.
- Nenhum secret real versionado; apenas exemplos com placeholders.
- CI não possui etapa de deploy nem credenciais de produção.

### Qualidade
- Backend: `lint`, `typecheck`, **55/55** testes e `build` verdes.
- Frontend: **49/49** testes e `npm run build` verde.
- `docker compose config --quiet`: exit 0.
- `kustomize build` válido em `local` e `oracle`.
- Smoke do container: `/health` 200, `/ready` 503 esperado sem credenciais,
  400 para pergunta vazia e 403 para origem inválida.
- Revisão aprovada pelo PO em `REVIEW-015` (2026-11-07), sem autorização de deploy.

---

## [1.13.0] - 2026-11-06

### Adicionado
- **Resiliência do fallback, timeouts e observabilidade (SPEC-014 / TASK-014)**:
  - `WORKER_BUDGET_MS` como teto total de geração, com timeouts derivados do tempo restante.
  - `OPENROUTER_TIMEOUT_MS`, `WORKERS_AI_TIMEOUT_MS`, `MIN_CALL_BUDGET_MS` e `*_MAX_TOKENS` configuráveis.
  - `scripts/check-models.mjs` e `npm run models:check` para validar IDs da OpenRouter no CI.
  - `worker/circuit.js` com circuit breaker por modelo/provedor.
  - Cache negativo de `503` por até 60 s, com `X-Assistant-Cache: NEGATIVE`.
  - Cabeçalhos `X-Request-Id` e `X-Assistant-Stage` em todas as respostas relevantes.
  - Log JSON estruturado com `stage`, `outcome`, `providerStatus`, `timings`, `questionHash` e `attempts`.
  - Workers Logs habilitado em `wrangler.toml`.
  - Rate limit por IP na rota de chat (10 req/60 s) via binding `CHAT_RATE_LIMITER`.
  - `GET /health` sem IA para monitoramento externo.
  - `docs/operations.md` com runbook de diagnóstico, deploy e rollback.
  - Testes de orçamento, circuit breaker, cache negativo, rate limit, health, cabeçalhos e retrieval com dimensão incompatível.

### Modificado
- `MODELS` corrigido para `google/gemma-4-31b-it:free` e `google/gemma-4-26b-a4b-it:free`; o ID inexistente `minimax/minimax-m3.1-flash:free` foi removido.
- Timeout padrão do cliente elevado para 35000 ms, acima do orçamento do Worker.
- Fallback Workers AI passa a usar 768 tokens de saída por padrão.
- `retrieveChunks` protegido por `try/catch`, retornando `503` controlado com `X-Assistant-Stage: retrieval`.
- Cliente registra `X-Request-Id` e `X-Assistant-Stage` no console em caso de erro.
- `wrangler.toml`, `.dev.vars.example`, `.env.example`, README, `PROJECT.md`, `docs/architecture.md` e `ROADMAP.md` alinhados.

### Corrigido
- **503 intermitente em produção** causado por timeout de 20 s no fallback Workers AI.
- Modelo inexistente na primeira posição da cadeia OpenRouter, que consumia uma tentativa inválida por requisição.
- Desalinhamento entre o timeout do cliente (30 s) e o pior caso do Worker (~60 s).

### Segurança
- Rate limit por IP protege a cota compartilhada de OpenRouter e Workers AI.
- Logs usam `questionHash` e metadados de etapa; pergunta crua, prompt e chave não são registrados.
- Nenhuma credencial nova; `OPENROUTER_API_KEY` permanece como secret do Worker.

### Qualidade
- `npm test`: **48/48** (18 cliente + 10 prompt + 20 Worker).
- `npm run models:check`: 2 modelos válidos no catálogo público.
- `rag:check`: 36 chunks, 365.0 KB, `sourceHash` consistente.
- `rag:eval`: hit@4 **100%**, MRR **0.975**, cobertura **100%**.
- `npm run build`: sem erros; bundle sem segredos.
- `wrangler deploy --dry-run`: configuração aceita com o binding de rate limit.

### Deploy
- Worker `elessandrodev-chat` publicado em produção (versão `29c41a5d`, 2026-11-06).
- `GET /health`: `200` com `chunkCount: 36` e `sourceHash` consistente.
- Pergunta inédita: `200`, `X-Assistant-Cache: MISS`, `X-Assistant-Provider: workers-ai`, `X-Assistant-Stage: workers-ai`.
- Repetição da pergunta: `200`, `X-Assistant-Cache: HIT`, `X-Assistant-Stage: cache`.

---

## [1.12.0] - 2026-11-05

### Adicionado
- **Resiliência contra 429 da OpenRouter (SPEC-013 / TASK-013)**:
  - Fallback de geração para Cloudflare Workers AI (`WORKERS_AI_MODEL`) quando a cadeia OpenRouter falha.
  - Cache RAG-aware na Cache API, com chave `SHA-256(locale + pergunta normalizada + sourceHash + embeddingModel)`.
  - `CACHE_TTL_SECONDS` e `ENABLE_CACHE` configuráveis por variável de ambiente.
  - `Retry-After` nas respostas `429`.
  - Módulos `worker/cache.js` e `worker/providers.js`.
  - Testes de cache hit/miss, invalidação por `sourceHash`, fallback de provedor e `429` final.

### Modificado
- Worker interrompe a cadeia OpenRouter ao detectar `X-RateLimit-Remaining: 0` e aciona o Workers AI.
- Cliente HTTP deixa de retentar `429`; retries ficam restritos a rede, timeout e `5xx`.
- Mensagem de `429` passa a informar limite de uso gratuito e sugerir tentar mais tarde.
- `wrangler.toml`, `.dev.vars.example`, `.env.example`, README, `PROJECT.md`, `docs/architecture.md` e `ROADMAP.md` alinhados.

### Corrigido
- **Erro 429 em produção** por esgotamento da cota diária gratuita da OpenRouter: o assistente passa a responder via Workers AI.
- Retries do navegador que amplificavam o consumo de cota em `429`.

### Segurança
- Cache armazena apenas resposta e fontes públicas; nenhuma chave ou prompt completo é persistido.
- Nenhuma credencial nova; Workers AI já era usado para embeddings.

### Qualidade
- `npm test`: **38/38** (16 cliente + 10 prompt + 12 Worker).
- `rag:check`: 36 chunks, 365.0 KB, `sourceHash` consistente.
- `rag:eval`: hit@4 **100%**, MRR **0.975**, cobertura **100%**.
- `npm run build`: sem erros.

### Deploy
- Worker `elessandrodev-chat` publicado em produção (versão `269dcbb7`, 2026-11-05T13:01:55Z).
- Validado em produção: pergunta inédita retornou `200` via Workers AI (`X-Assistant-Cache: MISS`) e a repetição retornou `X-Assistant-Cache: HIT`.

---

## [1.11.1] - 2026-10-21

### Segurança
- **SPEC-012 / TASK-012**: Vite atualizado de `6.4.3` para `6.4.5`, corrigindo os alertas Dependabot #116–#120 (1 alto, 3 médios e 1 baixo).
- `launch-editor` vulnerável não está mais na árvore de dependências.
- Os 5 achados remanescentes do `npm audit` pertencem à cadeia Tailwind 3 e exigem upgrade major para Tailwind 4, fora do escopo desta correção.

---

## [1.11.0] - 2026-10-21

### Adicionado
- **Prompt canônico do assistente (SPEC-009 / TASK-009)**:
  - `worker/prompt.js` com ficha profissional, projetos, regras de fidelidade, escopo, segurança e idioma.
  - Resposta determinística de contato em PT/EN, sem chamada ao LLM.
  - Fallback seguro para perguntas fora do corpus.
  - Testes do prompt (10) e de integração do Worker (7).

### Modificado
- Worker passou a usar o prompt canônico e a resolver contato antes de embeddings/OpenRouter.
- `max_tokens` elevado para 3000 para comportar o raciocínio dos modelos free.
- Cadeia de modelos simplificada para MiniMax e Gemma; falhas 404 passam a tentar o próximo modelo.
- Corpus alinhado ao currículo: EPM DEVTECH, SIPREC, Grupo Paraíso e tecnologias não listadas.
- Índice reindexado com 36 chunks e 365.0 KB.

### Corrigido
- FAQ de modernização passou a incluir a EPM DEVTECH, evitando resposta meta sobre conflito de fontes.

### Governança
- ADR-007 formaliza o currículo como fonte da verdade e revê a diretriz da SPEC-004 sobre a EPM DEVTECH.
- Backlog renumerado: performance para SPEC-010 e histórico conversacional para SPEC-011.

### Segurança
- Nenhuma chave ou prompt sensível no bundle estático; validação de origem, payload e fallback mantidos.

---

## [1.10.0] - 2026-10-21

### Adicionado
- **RAG real com Cloudflare Worker (SPEC-008 / TASK-008)**:
  - Corpus versionado em `knowledge/rag/` (perfil, experiências, projetos e FAQ), incluindo a seção "Projetos de IA e RAG".
  - Pipeline de indexação (`rag:index`), avaliação (`rag:eval`) e validação (`rag:check`) com 20 perguntas PT/EN.
  - Índice com 34 chunks e embeddings `@cf/baai/bge-m3`; retrieval híbrido (cosseno + BM25), `MIN_SCORE=0.45`, `TOP_K=4` e `HYBRID_ALPHA=0.6`.
  - Cloudflare Worker com CORS, validação de payload, fallback de modelos da OpenRouter e sanitização de respostas.
  - Resposta `{ response, sources }` com seção e score das fontes exibidos no chat.
  - 16 testes do cliente HTTP (`aiService.test.mjs`) cobrindo sucesso, 429, 5xx, 400, timeout, rede e configuração ausente.

### Modificado
- **Frontend desacoplado do provedor de LLM**:
  - `aiService.js` passou a chamar o Worker; removidos LangChain e Google Gemini do bundle.
  - `aiConfig.js` centraliza `VITE_CHAT_API_URL`, retries, timeout e telemetria.
  - `AiAssistant.vue` renderiza fontes consultadas e mensagens de erro em PT/EN.
  - Porta local alterada para `5212` com `strictPort` e Caddy local documentado.
  - CI executa `rag:check` e injeta `VITE_CHAT_API_URL` no build.

### Segurança
- `OPENROUTER_API_KEY` movida para secret do Worker; nenhuma chave de LLM no bundle estático.
- CORS restrito às origens de produção, localhost e domínio local.
- Limites de payload (2000 bytes) e pergunta (500 caracteres).
- Remoção de artefatos CJK indevidos nas respostas.

### Corrigido
- Cobertura de perguntas sobre projetos de IA no retrieval.
- Falso negativo de CORS para `127.0.0.1:5212` e `elessandrodev.localhost`.
- Divergência entre corpus e índice detectada por `rag:check`.

### Qualidade
- `rag:eval`: hit@4 **100%**, MRR **0.975**, cobertura do threshold **100%**.
- `npm test`: **16/16**.
- `npm run build`: concluído, bundle principal ~211 KB.
- Worker: ~385 KB (gzip ~127 KB).

---

## [1.9.1] - 2026-10-08

### Corrigido
- **Remediação de Vulnerabilidades de Segurança do Dependabot (SPEC-007 / TASK-007)**:
  - Atualizado `vue` e `@vue/server-renderer` para `3.5.43`, sanando vulnerabilidade de XSS via missing CR (Alerta Dependabot #113 / GHSA-g2v6-rqmx-r4w6).
  - Atualizado `source-map-js` para `1.2.2` via `npm audit fix`, resolvendo vulnerabilidade de negação de serviço (DoS) no event-loop (Alerta Dependabot #115 / GHSA-68fv-2mgg-jv7q).
  - Configurados `"overrides"` no `package.json` para ancorar `postcss-selector-parser` em `^7.1.6` (resolvendo Alerta Dependabot #114 / GHSA-rj75-hqrm-r3gf) e `braces` em `^3.0.3`, prevenindo quebras e mantendo compatibilidade com Tailwind CSS v3.
  - Zero quebra na UI e aprovação total nos Quality Gates (`npm test` com 12/12 testes e `npm run build` com 0 erros).

---

## [1.9.0] - 2026-10-08

### Adicionado
- **Automação de Testes e Quality Gates no GitHub Actions (SPEC-006 / TASK-006)**:
  - Adicionado script `"test": "node src/services/aiService.test.mjs"` em `package.json`.
  - Configurada etapa bloqueante `Run automated tests` em `.github/workflows/deploy.yml` antes do `Build project`, garantindo validação dos 12 testes canônicos de resiliência e streaming de IA a cada push ou PR.
  - Implementada resolução resiliente de variáveis de ambiente em `src/services/aiService.test.mjs` para execução desacoplada em runners de CI e suporte a secrets.

---

## [1.8.0] - 2026-10-08

### Modificado
- **Atualização dos Estudos de Caso de Engenharia & Laboratórios Arquiteturais (SPEC-005 / TASK-005)**:
  - Redefinição do título e subtítulo da seção `02 / SELECTED WORK`: "Projetos em Destaque & Laboratórios Arquiteturais" (*Featured Case Studies & Architecture Labs*).
  - Inclusão do manifesto contextual conectando os repositórios públicos no GitHub aos desafios técnicos de alta concorrência, resiliência e escala vivenciados na carreira em produção.
  - Adição do campo **ORIGEM & CONTEXTO REAL** (*REAL-WORLD ORIGIN & CONTEXT*) em cada um dos 5 estudos de caso em `Projects.vue`, `pt.js` e `en.js`:
    - `universal-sdd`: Engenharia de Software Moderna & Liderança Técnica (EPM DevTech / Consultoria).
    - `elessandrodev`: Arquitetura de Dados & Interfaces Reativas (EPM DevTech).
    - `event-driven-processing-system`: Integrações críticas de missão em tempo real (Projeto GENIN / ONS via AMcom e Migrações CAPES).
    - `iot-mqtt-simulator`: Automação fabril e projetos industriais (Grupo Paraíso / Projetos IoT & Chão de Fábrica).
    - `fintech-wallet-solution`: Sistemas Críticos de Cobrança e Conciliação Financeira (SISCAD / CAPES via Datainfo e ERPs Corporativos).
  - Alinhamento analítico completo dos 5 projetos com problema e contexto aprofundados, soluções de engenharia, métricas de produção e stack técnica.
  - Sincronização do contexto RAG do assistente de IA conversacional (`aiService.js`).
  - Zero regressão: 100% de integridade em templates Vue 3, classes Tailwind CSS e aprovação com 12/12 testes automatizados e build de produção sem erros.

---

## [1.7.0] - 2026-10-08

### Modificado
- **Correção Factual e Atribuição de Modernização de Sistemas Legados (SPEC-004 / TASK-004)**:
  - Delimitação estrita de que a modernização de sistemas legados e o *Strangler Fig Pattern* em monólitos ocorreram exclusivamente na **CAPES** (Projeto SIPREC — modernização de sistema monolítico legado de avaliação da pós-graduação para microsserviços e BFF em Angular atendendo 448+ IES) e no **Grupo Paraíso** (ERP da Indústria Têxtil — migração gradual de ERP monolítico legado para microsserviços com Node.js via Strangler Fig Pattern, reduzindo custos em 40%, além de soluções de chão de fábrica e IoT).
  - Remoção completa de referências a sistemas legados, monólitos legados e "linhas legadas eliminadas" na **EPM DEVTECH**, reposicionando sua atuação para arquitetura e engenharia de plataformas web de alta performance em PHP 8.2 / Laravel 12 e Node.js, arquitetura modular, 2.399 testes automatizados com Pest/PHPUnit, APIs REST e IA aplicada com governança via SDD.
  - Correção do manifesto em `Statement.vue` (PT e EN) dissociando a modernização de legados do **Operador Nacional do Sistema Elétrico (ONS)** e da **Usina Termelétrica Energia Pecém**, consolidando suas atribuições corretas em sistemas distribuídos de alta concorrência e arquiteturas orientadas a eventos.
  - Atualização do princípio arquitetural ARCH-01 (*Strangler Fig Pattern*) para referenciar exclusivamente `SIPREC / CAPES (448+ IES)` e `Grupo Paraíso (ERP Indústria Têxtil)`.
  - Inclusão de `NOTA DE DOMÍNIO SOBRE MODERNIZAÇÃO DE SISTEMAS LEGADOS` no contexto do assistente de IA (`src/services/aiService.js`), assegurando fidelidade factual nas respostas interativas geradas pelo modelo.
  - Zero regressão: validação com 100% de sucesso na suíte de testes automatizados (12/12) e compilação limpa do Vite (`npm run build`).

---

## [1.6.0] - 2026-10-08

### Modificado
- **Revisão e Humanização da Prosa Editorial (SPEC-003 / TASK-003 / `/humanizer`)**:
  - Eliminação sistemática de 25 padrões e clichês de IA ("ecossistemas robustos", "blindar contratos", "pioneiro", "delve", "testament", "não é apenas X, é Y", tríades artificiais e excesso de travessões).
  - Adoção de tom de Engenheiro de Software Sênior & Tech Lead: técnico, direto, sóbrio e fundamentado em decisões arquiteturais, problemas reais e métricas mensuráveis de produção.
  - Alinhamento bilíngue completo em `src/i18n/locales/pt.js` e `src/i18n/locales/en.js`:
    - Eliminação de anglicismos descontextualizados na versão em português (ex.: "MÉTRICAS DE PRODUÇÃO", "PRÁTICAS TÉCNICAS", "IMPACTO EM PRODUÇÃO").
    - Redação em inglês técnico idiomático, conciso e natural para recrutadores e diretores de engenharia globais.
  - **Refinamento Factual do Setor de Energia (ONS vs. Usina Termelétrica Energia Pecém)**:
    - Correção e separação definitiva entre o **Operador Nacional do Sistema Elétrico (ONS)** (órgão coordenador e regulador do Sistema Interligado Nacional - SIN, fiscalizado pela Aneel, atuação via AMcom no projeto GENIN) e a **Usina Termelétrica Energia Pecém** (usina de geração térmica de energia no Ceará, atuação no projeto SIGMA), eliminando qualquer ambiguidade de vinculação ou alocação nos textos e no contexto RAG da IA.
  - Zero regressão visual: 100% de integridade preservada em templates Vue 3, classes Tailwind CSS, reatividade e suíte de testes automatizados (12/12).

---

## [1.5.0] - 2026-10-08

### Adicionado
- **Suporte a Currículos Bilíngues Nativos (SPEC-002 / TASK-002)**:
  - Disponibilização dos currículos oficiais em `public/`: `Elessandro_Prestes_Macedo_Engenheiro_de_Software.pdf` (Português) e `Elessandro_Prestes_Macedo_Software_Engineer.pdf` (Inglês).
  - Reatividade dinâmica de idioma no componente `Statement.vue` via `computed()` (`cvFilename` e `cvPath`), reagindo instantaneamente ao estado do `useI18n`.
  - Configuração segura de atributos `:download="cvFilename"`, `target="_blank"` e `rel="noopener noreferrer"`.
- **Atualização Cadastral e Cronológica da Trajetória**:
  - Inclusão da posição atual como **Líder Técnico em Engenharia de Software – Full Stack & Arquitetura de Sistemas** na **EPM DEVTECH** (Jun/2026 – Atual) em `pt.js` e `en.js`.
  - Consolidação da posição de **Engenheiro de Software com IA Aplicada** (Out/2025 – Mai/2026) sob a **EPM DEVTECH** (migração Laravel 12, 56.400+ linhas legadas eliminadas, 2.399 testes).
  - Sincronização rigorosa do contexto do assistente de IA (`src/services/aiService.js`) com os novos dados factuais.
  - Atualização do Toolbox com tecnologias complementares dos currículos oficiais (NestJS, MariaDB, MongoDB, Amazon MQ, Kubernetes, Vitest).

---

## [1.4.0] - 2026-10-08

### Adicionado
- **Adoção Integral do Framework Universal SDD (Spec-Driven Development)**:
  - Documentação canônica e governança: `UNIVERSAL_SDD_FRAMEWORK.md`, `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `COPILOT.md`, `ROADMAP.md`, `CONTRIBUTING.md` e `CODE_OF_CONDUCT.md`.
  - Templates executáveis de artefatos em `templates/`: `SPEC-TEMPLATE.md`, `TASK-TEMPLATE.md`, `QA-TEMPLATE.md`, `REVIEW-TEMPLATE.md` e `ADR-TEMPLATE.md`.
  - Padrões e quality gates em `standards/`: `ux-ui.md`, `design-system.md`, `accessibility.md`, `testing.md` e `quality-gates.md`.
  - Base de conhecimento em `knowledge/`: `stack.md`, `conventions.md` e `architecture.md`.
  - Workflows normativos em `workflows/`: `feature.md` e `bugfix.md`.
  - Perfis operacionais em `profiles/`: `development.md` e `qa.md`.
  - Missões e limites de agentes em `agents/`: `gemini.md`, `claude.md` e `po.md`.
  - Módulos de documentação em `docs/`: `getting-started.md`, `architecture.md`, `agents.md`, `workflows.md`, `knowledge-base.md`, `bootstrapping.md`, `governance.md`, `best-practices.md` e `faq.md`.
  - Registros de Decisões Arquiteturais em `adr/`: `ADR-001` a `ADR-005`.

### Corrigido
- **Resiliência e Eliminação de Erro 503 na IA (`aiService.js`)**:
  - Implementado failover multi-modelo com `gemini-3.5-flash` (primário), `gemini-3.6-flash`, `gemini-flash-latest` e `gemini-3.8-flash`, prevenindo interrupção do chat por sobrecarga de modelos.
- **Favicon Vetorial e Eliminação de Erro 404 (`public/favicon.svg`)**:
  - Criado favicon SVG vetorial com suporte dinâmico a modo escuro/claro via `prefers-color-scheme`, resolvendo falha de recurso não encontrado.

---

## [1.3.0] - 2026-09-04

### Adicionado
- **Internacionalização Bilíngue Completa (i18n PT-BR & EN)**:
  - Criação dos dicionários completos e tipados `src/i18n/locales/pt.js` e `src/i18n/locales/en.js`.
  - Implementação do composable reativo `src/composables/useI18n.js` com persistência em `localStorage`, detecção automática de preferência de idioma do navegador (`navigator.language`) e sincronização reativa de `<html lang>`.
  - Componente `LanguageToggle.vue` com UX-UI design editorial suíço (controle segmentado em monospace `[ PT / EN ]`, contraste WCAG 2.1 AA, acessibilidade com `role="group"` e `aria-pressed`).
  - Tradução técnica e editorial de 100% das seções: Statement, Selected Work (5 Case Studies), Architecture (4 pilares), Trajectory (6 posições com métricas X-Y-Z), Toolbox (8 domínios) e Footer.
  - Suporte a múltiplos idiomas no terminal do Assistente Virtual RAG (`AiAssistant.vue` e `aiService.js`), alternando prompts sugeridos, mensagens de sistema e instruindo a cadeia do Gemini a responder no idioma selecionado.

---

## [1.2.0] - 2026-09-04

### Adicionado
- **Reformulação Visual Completa — Editorial Tech & Brutalismo Sofisticado Suíço**:
  - Incorporação das fontes tipográficas `Space Grotesk` (display/títulos), `Inter` (corpo editorial) e `JetBrains Mono` (metadados e números de benchmarks).
  - Nova arquitetura de narrativa técnica em 6 blocos numerados (`01 Statement`, `02 Selected Work`, `03 Core Engineering`, `04 Trajectory`, `05 Technical Toolbox`, `06 Contact`).
  - Posicionamento assertivo sobre a aplicação de IA no ciclo de desenvolvimento com SDD e RAG.
  - Apresentação de projetos como **Estudos de Caso (Case Studies)** estruturados em grid assimétrico com detalhamento de problema, arquitetura, métricas mensuradas e stack curada em linha.
  - Componente `Architecture.vue` apresentando disciplinas arquiteturais profundas (Strangler Fig Pattern, Event-Driven Architecture, IA Aplicada com SDD/RAG e Qualidade Determinística/TDD).
  - Componente `Toolbox.vue` com agrupamento semântico por domínios de engenharia, erradicando paredes de badges/pills repetitivas.
  - Redesenho do `Experience.vue` para formato ledger/tabela cronológica técnica.
  - Refatoração do `Header.vue` com masthead editorial, navegação por coordenadas numéricas e indicador de status operacional.
  - Redesenho do `AiAssistant.vue` para estética de terminal técnico RAG minimalista.

### Modificado
- **Alinhamento e Refatoração de Experiência e Clientes**:
  - Atribuição correta da modernização legada (56.400+ linhas, Laravel 12, 2.399 testes automatizados) para a cliente **Amura Sistemas**.
  - Padronização de referências a sistemas de energia para **ONS - Energia Pecém**.
  - Expansão do escopo técnico na experiência do **Grupo Paraíso**, cobrindo toda a infraestrutura têxtil do chão de fábrica (IoT, WebSockets) até o varejo (e-commerce, CRM e microsserviços ERP).
  - Refatoração do posicionamento de IA para destacar a aplicação direta no ciclo de desenvolvimento de software com SDD, RAG e integrações com LLMs.
  - Atualização do contexto factual e prompts no assistente conversacional RAG (`aiService.js` e `AiAssistant.vue`).

## [1.1.0] - 2026-09-04

### Adicionado
- **Feature Light Mode e Dark Mode**:
  - Implementação de alternância de temas com estratégia `darkMode: 'class'` no Tailwind CSS.
  - Componente `ThemeToggle.vue` acessível no cabeçalho com ícones animados de Sol e Lua e semântica ARIA (`role="switch"`).
  - Composable reativo `useTheme.js` com detecção de preferência do sistema operacional (`prefers-color-scheme`), persistência em `localStorage` e escuta de eventos em tempo real.
  - Script síncrono inline no `<head>` do `index.html` e meta tag `color-scheme` para prevenção absoluta de FOUC.

---

## [1.0.0] - 2026-03-01

### Adicionado
- Lançamento inicial da Single Page Application (SPA) em Vue.js 3 e Tailwind CSS.
- Assistente Virtual com IA conversacional integrado a LangChain e Google Gemini (`gemini-2.5-flash`).
- Containerização completa com Docker e Docker Compose.
- Automação de tarefas com GNU Makefile.
- Pipeline de integração e entrega contínua (CI/CD) no GitHub Actions com deploy automatizado no GitHub Pages.
