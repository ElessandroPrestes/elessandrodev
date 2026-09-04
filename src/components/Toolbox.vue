<script setup>
const categories = [
  {
    domain: 'BACKEND CORE & RUNTIMES',
    description: 'Serviços escaláveis de alta densidade, APIs RESTful e concorrência assíncrona.',
    items: ['PHP 8.2+', 'Laravel 12', 'Symfony', 'Node.js', 'TypeScript', 'Express', 'REST APIs', 'Clean Code'],
  },
  {
    domain: 'ARCHITECTURE & DISTRIBUTED SYSTEMS',
    description: 'Padrões de desacoplamento, modernização contínua e resiliência a falhas.',
    items: ['Microservices', 'Strangler Fig Pattern', 'Event-Driven Architecture (EDA)', 'BFF (Backend for Frontend)', 'Serverless Architecture', 'Clean Architecture', 'SOLID', 'Design Patterns'],
  },
  {
    domain: 'MESSAGING, STREAMING & CACHE',
    description: 'Comunicação assíncrona tolerante a falhas e sincronização de dados em memória.',
    items: ['RabbitMQ', 'Apache Kafka', 'Redis (Cache & State Management)', 'WebSockets', 'MQTT', 'Dead Letter Queues (DLQ)'],
  },
  {
    domain: 'DATA PLATFORMS & PERSISTENCE',
    description: 'Concorrência estrita, integridade relacional ACID e otimização de queries.',
    items: ['PostgreSQL', 'Oracle DB', 'MySQL', 'Transações ACID', 'Row-Level Locking', 'Migrations Automatizadas'],
  },
  {
    domain: 'CLOUD & DEVOPS INFRASTRUCTURE',
    description: 'Esteiras automatizadas de entrega, computação elástica e observabilidade.',
    items: ['AWS (Lambda, SQS, SNS, API Gateway, CloudWatch, CodeBuild)', 'Azure Cloud (Monitor, IoT)', 'Cloudflare', 'Docker & Docker Compose', 'GitLab CI/CD', 'GitHub Actions', 'GNU Make'],
  },
  {
    domain: 'IA NO CICLO DE DESENVOLVIMENTO, SDD & LLMs',
    description: 'Engenharia assistida por IA com contratos executáveis, RAG e integrações com modelos de linguagem.',
    items: ['Spec-Driven Development (SDD)', 'RAG (Retrieval-Augmented Generation)', 'Integrações com LLMs (Gemini, Claude, OpenAI)', 'universal-sdd framework', 'Claude Code', 'GitHub Copilot', 'LangChain.js', 'MCP (Model Context Protocol)'],
  },
  {
    domain: 'QUALITY ASSURANCE & TESTING',
    description: 'Engenharia de testes automatizados e análise estática contínua de código.',
    items: ['TDD (Test-Driven Development)', 'Pest PHP', 'PHPUnit', 'SonarQube (+45% qualidade)', 'Análise Estática de Código'],
  },
  {
    domain: 'FRONTEND SYSTEMS',
    description: 'Interfaces reativas modulares de alto desempenho e acessibilidade.',
    items: ['Vue.js 3 (Composition API)', 'Angular', 'Tailwind CSS', 'Vite', 'Acessibilidade WCAG 2.1 AA'],
  },
]
</script>

<template>
  <section id="toolbox" aria-labelledby="toolbox-title" class="w-full border-b border-slate-200/80 dark:border-neutral-800/80">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16">
      
      <!-- Cabeçalho da Seção -->
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
            <span>05 / TOOLBOX</span>
            <span class="h-px w-8 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
            <span class="text-slate-500 dark:text-neutral-400">ORGANIZAÇÃO POR CONTEXTO TÉCNICO</span>
          </div>
          <h2 id="toolbox-title" class="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Stack &amp; Ferramental de Engenharia
          </h2>
        </div>

        <p class="font-mono text-xs text-slate-500 dark:text-neutral-400 max-w-sm sm:text-right">
          Sem paredes de logotipos: ferramentas selecionadas e validadas em sistemas de produção real.
        </p>
      </div>

      <!-- Lista Editorial de Domínios (Sem Badges Repetitivas) -->
      <div class="divide-y divide-slate-200/80 dark:divide-neutral-800/80">
        <div
          v-for="(cat, idx) in categories"
          :key="idx"
          class="py-8 sm:py-10 first:pt-0 last:pb-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-baseline"
        >
          <!-- Domínio e Descrição -->
          <div class="lg:col-span-5 space-y-1">
            <h3 class="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {{ cat.domain }}
            </h3>
            <p class="font-sans text-xs text-slate-500 dark:text-neutral-400">
              {{ cat.description }}
            </p>
          </div>

          <!-- Itens em Linha Editorial -->
          <div class="lg:col-span-7">
            <p class="font-mono text-sm sm:text-base text-slate-800 dark:text-neutral-200 font-medium leading-relaxed">
              {{ cat.items.join(' · ') }}
            </p>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>
