<script setup>
const caseStudies = [
  {
    num: '01',
    id: 'universal-sdd',
    title: 'universal-sdd',
    subtitle: 'Framework Universal Spec-Driven Development com Agentes de IA',
    tagline: 'Padronização metodológica agnóstica para desenvolvimento assistido por agentes de IA com rastreabilidade determinística.',
    problem: 'O avanço de agentes autônomos de IA (Claude Code, GitHub Copilot, Gemini) frequentemente gera retrabalho, dívida técnica e alucinações quando operados sem especificações rigorosas e quality gates automatizados.',
    solution: 'Criação de um framework universal e agnóstico de linguagem baseado no ciclo SPEC (draft/aprovada) → TASK → QA → REVIEW → RELEASE, transformando requisitos em contratos técnicos executáveis antes de qualquer codificação.',
    architecture: 'Clean Architecture, Especificações Markdown determinísticas, Quality Gates automatizados e esteiras GitOps integradas.',
    stack: 'Spec-Driven Development (SDD) · AI Agents · Claude Code · GitOps · Quality Gates · Clean Architecture',
    metrics: [
      { value: '-40%', label: 'Redução de Retrabalho Técnico' },
      { value: '100%', label: 'Rastreabilidade Requisito ↔ Código' },
    ],
    repoUrl: 'https://github.com/ElessandroPrestes/universal-sdd',
    liveUrl: null,
  },
  {
    num: '02',
    id: 'elessandrodev',
    title: 'elessandrodev',
    subtitle: 'Portfólio & Assistente Virtual RAG com LangChain e Gemini',
    tagline: 'Single Page Application com orquestração conversacional de IA fundamentada na arquitetura Retrieval-Augmented Generation.',
    problem: 'Visitantes técnicos e recrutadores necessitam consultar trajetórias, métricas de missão crítica e decisões arquiteturais de mais de 9 anos de forma instantânea e estritamente factual, sem respostas genéricas ou alucinações de LLM.',
    solution: 'Implementação de um pipeline RAG com orquestração de chains determinísticas no LangChain.js e Google Gemini, integrando parsing tipográfico de Markdown, containerização Docker e deploy contínuo.',
    architecture: 'RAG Pipeline, Chain de Prompt determinística, SPA Vue 3 Composition API, Webpack/Vite modular, Docker Compose e GitHub Pages.',
    stack: 'Vue.js 3 · LangChain.js · Google Gemini (2.5 Flash) · RAG · Tailwind CSS · Docker · Vite',
    metrics: [
      { value: '< 1.2s', label: 'Latência Média de Inferência' },
      { value: 'Zero', label: 'Alucinações Factuais sobre Experiência' },
    ],
    repoUrl: 'https://github.com/ElessandroPrestes/elessandrodev',
    liveUrl: 'https://elessandroprestes.github.io/elessandrodev/',
  },
  {
    num: '03',
    id: 'event-driven-processing-system',
    title: 'event-driven-processing-system',
    subtitle: 'Pipeline de Processamento Distribuído e Assíncrono (EDA)',
    tagline: 'Arquitetura resiliente de alta vazão para ingestão e consumo de eventos concorrentes com tolerância a falhas.',
    problem: 'Sistemas que processam requisições transacionais síncronas enfrentam gargalos severos de throughput sob picos de demanda, gerando perda de dados quando downstream services entram em saturação.',
    solution: 'Desenho de um pipeline assíncrono orientado a eventos (EDA) utilizando RabbitMQ com Dead Letter Queues (DLQ) para retry ordenado, Redis para deduplicação em memória e persistência relacional resiliente.',
    architecture: 'Event-Driven Architecture (EDA), Workers Concorrentes, Retry Policies com Exponential Backoff, DLQ e Cache Distribuído.',
    stack: 'EDA · RabbitMQ · Redis · Node.js / TypeScript · PostgreSQL · Docker · Microservices',
    metrics: [
      { value: 'Zero', label: 'Perda de Eventos sob Falha Downstream' },
      { value: '+50%', label: 'Capacidade de Throughput Elástico' },
    ],
    repoUrl: 'https://github.com/ElessandroPrestes/event-driven-processing-system',
    liveUrl: null,
  },
  {
    num: '04',
    id: 'iot-mqtt-simulator',
    title: 'iot-mqtt-simulator',
    subtitle: 'Plataforma de Telemetria Industrial & IoT em Nuvem',
    tagline: 'Ingestão e processamento de dados contínuos de sensores com visualização bidirecional em tempo real.',
    problem: 'Parques fabris operam centenas de sensores gerando telemetria em alta frequência, exigindo canal de baixa latência e consumo em tempo real sem degradação do banco de dados operacional.',
    solution: 'Simulador de sensores industriais conectado a broker MQTT com processamento concorrente em microsserviço Node.js e streaming bidirecional via WebSockets para dashboards de monitoramento operacional.',
    architecture: 'Publish-Subscribe (Pub/Sub) MQTT, WebSocket Streaming bidirecional, microsserviço de normalização e dashboard Vue.',
    stack: 'IoT · MQTT · Node.js · WebSockets · Vue.js · Time-Series Ingestion · Cloud Architecture',
    metrics: [
      { value: '< 50ms', label: 'Latência de Telemetria Real-Time' },
      { value: '100%', label: 'Integridade de Pacotes de Sensores' },
    ],
    repoUrl: 'https://github.com/ElessandroPrestes/iot-mqtt-simulator',
    liveUrl: null,
  },
  {
    num: '05',
    id: 'fintech-wallet-solution',
    title: 'fintech-wallet-solution',
    subtitle: 'Core Bancário & Carteira Digital com Concorrência Estrita (ACID)',
    tagline: 'Plataforma financeira de liquidação transacional com mitigação estrita de race conditions e double-spending.',
    problem: 'Transferências financeiras e extratos simultâneos em contas compartilhadas demandam controle absoluto de isolamento e concorrência para evitar saldo negativo ou dupla liquidação sob alta frequência.',
    solution: 'Arquitetura transacional bancária com controle de concorrência pessimista/otimista no PostgreSQL, tokens seguros com JWT, idempotência de requisições financeiras e logs de auditoria imutáveis.',
    architecture: 'Transações ACID, Row-Level Locking, Idempotency Keys, Arquitetura em Camadas (Controller-Service-Repository) e JWT/OAuth2.',
    stack: 'PHP 8.2 / Node.js · PostgreSQL · Redis · ACID · REST API · Docker · Audit Logs',
    metrics: [
      { value: '100% ACID', label: 'Isolamento de Concorrência' },
      { value: 'Zero', label: 'Risco de Double-Spending' },
    ],
    repoUrl: 'https://github.com/ElessandroPrestes/fintech-wallet-solution',
    liveUrl: null,
  },
]
</script>

<template>
  <section id="selected-work" aria-labelledby="work-title" class="w-full border-b border-slate-200/80 dark:border-neutral-800/80">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16 sm:space-y-20">
      
      <!-- Cabeçalho da Seção -->
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
            <span>02 / SELECTED WORK</span>
            <span class="h-px w-8 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
            <span class="text-slate-500 dark:text-neutral-400">ESTUDOS DE CASO DE ENGENHARIA</span>
          </div>
          <h2 id="work-title" class="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Projetos &amp; Decisões Arquiteturais
          </h2>
        </div>

        <p class="font-mono text-xs text-slate-500 dark:text-neutral-400 max-w-sm sm:text-right">
          Casos reais avaliados pelo problema de negócio, estratégia arquitetural e métricas comprovadas.
        </p>
      </div>

      <!-- Lista Editorial de Case Studies -->
      <div class="space-y-16 sm:space-y-24">
        <article
          v-for="cs in caseStudies"
          :key="cs.id"
          class="border-b border-slate-200/80 dark:border-neutral-800/80 pb-16 sm:pb-24 last:border-0 last:pb-0"
        >
          <!-- Topo do Case: Número + Título e Subtítulo -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start mb-8 sm:mb-12">
            
            <div class="lg:col-span-1">
              <span class="font-mono text-4xl sm:text-5xl font-bold tracking-tighter text-slate-300 dark:text-neutral-700">
                {{ cs.num }}
              </span>
            </div>

            <div class="lg:col-span-8 space-y-2">
              <h3 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {{ cs.title }}
              </h3>
              <p class="font-sans text-base sm:text-lg font-medium text-indigo-600 dark:text-indigo-400 leading-snug">
                {{ cs.subtitle }}
              </p>
              <p class="font-sans text-sm text-slate-500 dark:text-neutral-400 leading-relaxed pt-1">
                {{ cs.tagline }}
              </p>
            </div>

            <!-- Links de Ação -->
            <div class="lg:col-span-3 flex flex-wrap lg:flex-col items-start lg:items-end gap-3 pt-2 font-mono text-xs">
              <a
                :href="cs.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 border-b border-slate-900 dark:border-white hover:border-indigo-600 dark:hover:border-indigo-400 pb-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                :aria-label="`Ver código de ${cs.title} no GitHub`"
              >
                <span>REPOSITÓRIO GITHUB</span>
                <span aria-hidden="true">&nearr;</span>
              </a>

              <a
                v-if="cs.liveUrl"
                :href="cs.liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline pb-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                :aria-label="`Ver aplicação ${cs.title} ao vivo`"
              >
                <span>DEMONSTRAÇÃO ONLINE</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>

          </div>

          <!-- Grade Analítica: Problema, Solução & Métricas -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 bg-slate-50 dark:bg-[#12141a] p-6 sm:p-8 border border-slate-200/80 dark:border-neutral-800/80">
            
            <!-- O Desafio Técnico -->
            <div class="md:col-span-5 space-y-3">
              <h4 class="font-mono text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-amber-500 rounded-full" aria-hidden="true" />
                O PROBLEMA ARQUITETURAL
              </h4>
              <p class="font-sans text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                {{ cs.problem }}
              </p>
            </div>

            <!-- A Solução & Arquitetura -->
            <div class="md:col-span-4 space-y-3">
              <h4 class="font-mono text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full" aria-hidden="true" />
                DECISÃO &amp; ARQUITETURA
              </h4>
              <p class="font-sans text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                {{ cs.solution }}
              </p>
            </div>

            <!-- Métricas de Impacto -->
            <div class="md:col-span-3 space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-neutral-800 pt-4 md:pt-0 md:pl-6">
              <h4 class="font-mono text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-widest font-semibold">
                IMPACTO MENSURADO
              </h4>
              <div class="space-y-3">
                <div v-for="(m, mi) in cs.metrics" :key="mi">
                  <span class="block font-mono text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {{ m.value }}
                  </span>
                  <span class="block font-sans text-xs text-slate-500 dark:text-neutral-400 leading-snug">
                    {{ m.label }}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <!-- Stack Editorial em Linha (Sem Badges Repetitivas) -->
          <div class="pt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-xs">
            <span class="text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">
              STACK:
            </span>
            <span class="text-slate-700 dark:text-neutral-300 font-medium">
              {{ cs.stack }}
            </span>
          </div>

        </article>
      </div>

    </div>
  </section>
</template>
