<script setup>
const projects = [
  {
    id: 'elessandrodev',
    title: 'elessandrodev - Portfólio & Currículo Interativo com Assistente IA (RAG)',
    subtitle: 'Aplicação Web Reativa com Chatbot Assistido por IA via LangChain, Google Gemini & RAG',
    description:
      'Portfólio e currículo online interativo desenvolvido em Vue.js 3 com containerização Docker, integrando um assistente de IA conversacional alimentado por arquitetura RAG (Retrieval-Augmented Generation) com LangChain e a LLM Google Gemini para consulta contextual em tempo real dos dados profissionais.',
    highlights:
      'Assistente de IA com RAG e Google Gemini, LangChain, Vue.js 3 (Composition API), Containerização com Docker Compose e Deploy Automatizado no GitHub Pages.',
    techs: ['Vue.js 3', 'LangChain', 'Google Gemini', 'RAG / LLM', 'Docker', 'Tailwind CSS', 'Vite', 'JavaScript'],
    repoUrl: 'https://github.com/ElessandroPrestes/elessandrodev',
    liveUrl: 'https://elessandroprestes.github.io/elessandrodev/',
  },
  {
    id: 'universal-sdd',
    title: 'universal-sdd - Framework Universal Spec-Driven Development',
    subtitle: 'Engenharia de Software Orientada a Especificações com Agentes de IA',
    description:
      'Framework universal e agnóstico de linguagem para aplicação prática da metodologia Spec-Driven Development (SDD) com agentes autônomos de IA (Claude Code, GitHub Copilot, Gemini), padronizando especificações técnicas, testes automatizados e refatoração com alta rastreabilidade.',
    highlights:
      'Metodologia SDD estruturada, automação do ciclo de desenvolvimento, especificações executáveis e redução comprovada de retrabalho técnico.',
    techs: ['SDD', 'AI Agents', 'Claude Code', 'GitOps', 'DevOps', 'Clean Architecture'],
    repoUrl: 'https://github.com/ElessandroPrestes/universal-sdd',
    liveUrl: null,
  },
  {
    id: 'event-driven-processing-system',
    title: 'event-driven-processing-system - Pipeline de Processamento Distribuído (EDA)',
    subtitle: 'Arquitetura Orientada a Eventos com Alta Vazão e Mensageria Assíncrona',
    description:
      'Solução arquitetural de alta resiliência demonstrando um pipeline de ingestão e processamento assíncrono de eventos, integrando brokers de mensageria (RabbitMQ), estratégias de cache distribuído (Redis) e persistência escalável.',
    highlights:
      'Arquitetura desacoplada (EDA), tolerância a falhas com Dead Letter Queues (DLQ), processamento concorrente e observabilidade.',
    techs: ['EDA', 'RabbitMQ', 'Redis', 'Node.js', 'PostgreSQL', 'Docker', 'Microservices'],
    repoUrl: 'https://github.com/ElessandroPrestes/event-driven-processing-system',
    liveUrl: null,
  },
  {
    id: 'iot-mqtt-simulator',
    title: 'iot-mqtt-simulator - Plataforma de Telemetria e IoT em Nuvem',
    subtitle: 'Monitoramento e Ingestão de Sensores em Tempo Real via MQTT & WebSockets',
    description:
      'Ecossistema de telemetria industrial simulada integrando broker MQTT para captura contínua de métricas de sensores, microsserviço de processamento em tempo real com Node.js e visualização interativa em dashboard Vue.js.',
    highlights:
      'Comunicação bidirecional de baixa latência, simulação de parque fabril, telemetria em tempo real e integração cloud.',
    techs: ['IoT', 'MQTT', 'Node.js', 'Vue.js', 'WebSockets', 'Telemetria', 'Cloud'],
    repoUrl: 'https://github.com/ElessandroPrestes/iot-mqtt-simulator',
    liveUrl: null,
  },
  {
    id: 'fintech-wallet-solution',
    title: 'fintech-wallet-solution - Core Bancário & Carteira Digital Full Stack',
    subtitle: 'Simulador de Carteira Digital com Transações Concorrentes e ACID',
    description:
      'Plataforma completa de serviços financeiros para gestão de carteira digital, abrangendo autenticação segura (JWT/OAuth), cadastro de contas, depósitos, extratos em tempo real e transferências com controle estrito de concorrência e transações ACID.',
    highlights:
      'Controle de concorrência transacional (mitigação de race conditions e double-spending), arquitetura desacoplada, logs de auditoria e segurança.',
    techs: ['PHP / Node.js', 'PostgreSQL', 'Redis', 'JWT', 'REST API', 'ACID', 'Docker'],
    repoUrl: 'https://github.com/ElessandroPrestes/fintech-wallet-solution',
    liveUrl: null,
  },
]
</script>

<template>
  <section aria-labelledby="projects-heading" class="max-w-3xl mx-auto w-full">
    <div class="mb-10">
      <h2
        id="projects-heading"
        class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2"
      >
        Projetos em Destaque
      </h2>
      <p class="text-sm text-gray-400">
        Repositórios open-source e soluções técnicas comprovando arquitetura distribuída, IA aplicada, IoT e backend de alta escala.
      </p>
    </div>

    <div class="space-y-6">
      <article
        v-for="project in projects"
        :key="project.id"
        class="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors flex flex-col gap-4"
      >
        <!-- Header do Card -->
        <header class="space-y-1">
          <h3 class="text-base sm:text-lg font-semibold text-white leading-snug">
            {{ project.title }}
          </h3>
          <p class="text-xs sm:text-sm font-medium text-indigo-400">
            {{ project.subtitle }}
          </p>
        </header>

        <!-- Descrição -->
        <p class="text-sm text-gray-300 leading-relaxed">
          {{ project.description }}
        </p>

        <!-- Destaques -->
        <div class="text-xs text-gray-400 bg-gray-950/60 border border-gray-800/80 rounded-lg p-3">
          <strong class="text-gray-200 font-medium">Destaques Técnicos:</strong>
          {{ project.highlights }}
        </div>

        <!-- Badges de Tecnologias -->
        <ul
          class="flex flex-wrap gap-2 pt-1"
          :aria-label="`Tecnologias utilizadas em ${project.title}`"
        >
          <li v-for="tech in project.techs" :key="tech">
            <span
              class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700"
            >
              {{ tech }}
            </span>
          </li>
        </ul>

        <!-- Links de Ação -->
        <div class="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-800/80">
          <a
            :href="project.repoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            :aria-label="`Ver repositório de ${project.title} no GitHub (abre em nova aba)`"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-3.5 h-3.5 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
              />
            </svg>
            Repositório (GitHub)
          </a>

          <a
            v-if="project.liveUrl"
            :href="project.liveUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            :aria-label="`Ver demonstração ao vivo de ${project.title} (abre em nova aba)`"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Live Demo
          </a>
        </div>
      </article>
    </div>
  </section>
</template>
