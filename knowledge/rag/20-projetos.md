# Projetos em Destaque e Laboratórios Arquiteturais

## Projetos de IA e RAG

Projetos com aplicação prática de Inteligência Artificial:

- **universal-sdd:** framework de Spec-Driven Development para agentes de IA, com Claude Code, GitOps e quality gates; 40% menos retrabalho e 100% de rastreabilidade entre requisito e código.
- **elessandrodev:** portfólio com assistente conversacional RAG real, índice de embeddings, recuperação híbrida (cosseno + BM25), citação de fontes e backend em Cloudflare Worker.
- **IA no ciclo de desenvolvimento:** SDD, RAG, MCP, Claude Code, GitHub Copilot e Codex na EPM DEVTECH, com redução de 40% em retrabalho.

## universal-sdd

Framework de Spec-Driven Development para agentes de IA.

- **Stack:** SDD, agentes de IA, Claude Code, GitOps, quality gates.
- **Origem:** engenharia de software moderna e liderança técnica na EPM DevTech e em consultoria.
- **Problema:** agentes de código sem governança amplificam débito técnico, retrabalho e perda de contexto.
- **Solução:** fluxo SPEC → TASK → QA → REVIEW → RELEASE, com especificações técnicas antes da geração de código e quality gates automatizados.
- **Resultados:** redução de 40% em retrabalho técnico e 100% de rastreabilidade entre requisito e código.
- **Repositório:** https://github.com/ElessandroPrestes/universal-sdd

## elessandrodev

Portfólio profissional com assistente conversacional baseado em RAG real.

- **Stack:** Vue.js 3, Vite, Tailwind CSS, Cloudflare Workers, Cloudflare Workers AI, OpenRouter, Docker.
- **Origem:** arquitetura de dados e interfaces reativas, a partir da trajetória profissional na EPM DevTech.
- **Problema:** recrutadores e líderes técnicos precisam validar stacks, decisões e casos de produção sem respostas genéricas ou alucinadas.
- **Solução:** pipeline com corpus em Markdown, chunking por seção, embeddings multilíngues, índice vetorial, recuperação por similaridade de cosseno, threshold de relevância e geração com citação de fontes.
- **Privacidade e segurança:** a chave do provedor de LLM fica em um Cloudflare Worker; o frontend envia apenas pergunta e idioma.
- **Resiliência:** fallback entre modelos gratuitos, timeout, retry com backoff e mensagem amigável para limite de requisições.
- **Demo:** https://elessandroprestes.github.io/elessandrodev/

## event-driven-processing-system

Pipeline assíncrono de eventos com dead letter queue (DLQ) e deduplicação em memória.

- **Stack:** EDA, RabbitMQ, Redis, Node.js/TypeScript, PostgreSQL.
- **Origem:** inspirado em integrações críticas de missão em tempo real do Projeto GENIN/ONS via AMcom e nas migrações da CAPES.
- **Características:** processamento assíncrono, tolerância a falhas, DLQ e deduplicação.
- **Resultados:** zero perda de eventos e aumento de 50% na capacidade elástica.

## iot-mqtt-simulator

Plataforma de telemetria e IoT industrial em tempo real.

- **Stack:** IoT, MQTT, WebSockets, Node.js, Vue.js 3, Docker.
- **Origem:** inspirado em projetos industriais e automação de chão de fábrica do Grupo Paraíso.
- **Características:** simulação de dispositivos, telemetria em tempo real e consistência de dados.
- **Resultados:** latência inferior a 50 ms via WebSocket e 100% de consistência.

## fintech-wallet-solution

Motor de carteira digital com partidas dobradas (double-entry bookkeeping) e locks transacionais estritos.

- **Stack:** PHP 8.2+, Laravel, Node.js, PostgreSQL, Redis, JWT, ACID.
- **Origem:** sistemas críticos de cobrança e conciliação financeira do SISCAD/CAPES via Datainfo e de ERPs corporativos.
- **Características:** consistência transacional, conciliação e controle de saldo.
- **Resultados:** zero divergência de saldos e 100% de conformidade ACID.
