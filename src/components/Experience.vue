<script setup>
const trajectory = [
  {
    period: '2025 — 2026',
    role: 'Engenheiro de Software com IA Aplicada',
    company: 'Amura Sistemas',
    project: 'Modernização de Plataforma & SDD',
    summary: 'Liderança técnica na migração integral de monolito legado para PHP 8.2 e Laravel 12 através do Strangler Fig Pattern, estabelecendo esteiras CI/CD com Docker e governança com Spec-Driven Development (SDD).',
    highlights: [
      { metric: '56.400+ linhas legadas eliminadas', desc: 'substituídas por arquitetura limpa em Laravel 12 sem interrupção de serviço.' },
      { metric: '2.399 testes automatizados', desc: 'estruturados em 241 arquivos com Pest/PHPUnit, assegurando zero regressão.' },
      { metric: '384 rotas/endpoints REST e 181 migrations', desc: 'desenvolvendo automações com WhatsApp Business que reduziram processos manuais em 35%.' },
      { metric: '-40% retrabalho técnico', desc: 'alcançado via Spec-Driven Development (SDD) integrado a Claude Code, Copilot e Codex.' },
    ],
    stack: 'PHP 8.2+ · Laravel 12 · Strangler Fig Pattern · Claude Code (SDD) · Pest/PHPUnit · Docker · GitLab CI/CD · REST APIs',
  },
  {
    period: '2024 — 2025',
    role: 'Analista Programador / Tech Lead',
    company: 'Datainfo',
    project: 'Projeto CAPES (SIPREC & SISCAD)',
    summary: 'Coarquitetura da modernização do SIPREC para microsserviços e BFF (Angular) atendendo 448+ Instituições de Ensino Superior, além da concepção do SISCAD para automação de processos de cobrança administrativa.',
    highlights: [
      { metric: '10.000 usuários simultâneos e 2.500 RPS', desc: 'suportados com latência média inferior a 300ms no ecossistema SIPREC.' },
      { metric: 'Concepção do zero do SISCAD', desc: 'como Tech Lead via PHP/Laravel, Oracle DB, Redis e mensageria assíncrona com RabbitMQ.' },
      { metric: '+45% em qualidade de código', desc: 'e erradicação de vulnerabilidades críticas através de esteiras contínuas no SonarQube.' },
      { metric: '+25% de entrega de features por sprint', desc: 'via mentoria técnica e adoção do GitHub Copilot com SDD junto aos desenvolvedores.' },
    ],
    stack: 'PHP · Laravel · Angular · Microservices · BFF · Oracle DB · Redis · RabbitMQ · SonarQube · Docker · GitLab CI/CD · SDD',
  },
  {
    period: '2023 — 2024',
    role: 'Desenvolvedor Full Stack',
    company: 'Energia Pecém',
    project: 'Projeto SIGMA & Telemetria em Tempo Real',
    summary: 'Desenvolvimento e arquitetura de rastreabilidade de ativos operacionais em tempo real para o setor de geração e distribuição de energia.',
    highlights: [
      { metric: '+40% de rastreabilidade operacional', desc: 'desenvolvendo soluções de telemetria com Node.js, Laravel, Vue.js e PostgreSQL.' },
      { metric: '+50% de capacidade de processamento', desc: 'projetando arquitetura orientada a eventos (EDA) com RabbitMQ e Laravel Jobs.' },
      { metric: '-45% em incidentes de produção', desc: 'e aceleração drástica do MTTR implementando observabilidade via Azure Monitor.' },
      { metric: '99,9% de disponibilidade contínua', desc: 'garantida com desacoplamento de serviços e sincronização em memória com Redis.' },
    ],
    stack: 'Node.js · Laravel · Vue.js · PostgreSQL · Redis · RabbitMQ · Event-Driven Architecture · Azure Monitor',
  },
  {
    period: '2022 — 2023',
    role: 'Desenvolvedor de Sistemas',
    company: 'AMcom',
    project: 'Projeto GENIN — Operador Nacional do Sistema Elétrico (ONS)',
    summary: 'Arquitetura de ingestão de dados em escala nacional para cálculo e consolidação regulatória da bandeira tarifária de energia elétrica no Brasil.',
    highlights: [
      { metric: '100% de integridade transacional', desc: 'em integrações de missão crítica com Itaipu Binacional e INMET via PHP/Laravel e SOAP/REST.' },
      { metric: '-40% de latência na ingestão', desc: 'definindo microsserviços com Redis e PostgreSQL para consolidação climática e energética.' },
      { metric: '-60% no tempo de deploy e 99,9% uptime', desc: 'automatizando pipelines na AWS via CodeBuild, API Gateway e CloudWatch.' },
    ],
    stack: 'PHP · Laravel · REST/SOAP · PostgreSQL · Redis · AWS CodeBuild · Amazon API Gateway · Amazon CloudWatch',
  },
  {
    period: '2021 — 2022',
    role: 'Desenvolvedor Full Stack',
    company: 'Grupo Intellectus',
    project: 'Projeto Educacional — SEDUC-MT',
    summary: 'Desenvolvimento de plataforma de ensino em Serverless Architecture na AWS atendendo mais de 650 escolas estaduais em 141 municípios.',
    highlights: [
      { metric: '-35% de custos de infraestrutura', desc: 'com escalabilidade elástica automática na AWS via Lambda, SQS e SNS.' },
      { metric: '99,9% de disponibilidade em picos', desc: 'atendendo rede de escolas públicas conectando Angular no frontend e APIs Laravel.' },
      { metric: '-50% no tempo de diagnóstico (MTTR)', desc: 'estruturando centralização e observabilidade de logs com ELK Stack.' },
    ],
    stack: 'AWS Lambda · Amazon SQS · Amazon SNS · Angular · PHP · Laravel · ELK Stack · GitHub Actions · Serverless',
  },
  {
    period: '2016 — 2021',
    role: 'Desenvolvedor Full Stack',
    company: 'Grupo Paraíso',
    project: 'Infraestrutura Têxtil, Chão de Fábrica (IoT), Varejo, E-commerce & CRM',
    summary: 'Atuação em projetos de ponta a ponta na infraestrutura de software da indústria têxtil, desde o chão de fábrica e automação industrial (IoT) até operações de varejo como e-commerce, CRM corporativo e modernização gradual de ERP monolítico para microsserviços com Node.js.',
    highlights: [
      { metric: 'Chão de Fábrica & IoT Industrial', desc: 'automação e telemetria de maquinário têxtil em nuvem Azure com comunicação bidirecional em tempo real via WebSockets.' },
      { metric: 'Varejo, E-commerce & CRM', desc: 'integração de canais de vendas B2B/B2C, relacionamento e conciliação em tempo real com o ERP central corporativo.' },
      { metric: '-40% em custos de manutenção', desc: 'migração progressiva de monolito legado para microsserviços Node.js utilizando Strangler Fig Pattern sem parada de produção.' },
      { metric: '+30% de eficiência operacional', desc: 'em módulos corporativos financeiros, fiscais e industriais desenvolvidos com PHP (Laravel, Symfony) e Oracle DB.' },
    ],
    stack: 'PHP · Symfony · Laravel · Node.js · Strangler Fig · IoT Industrial · E-commerce · CRM · Azure · AWS · Kafka · RabbitMQ · WebSockets · TDD',
  },
]
</script>

<template>
  <section id="trajectory" aria-labelledby="trajectory-title" class="w-full border-b border-slate-200/80 dark:border-neutral-800/80">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16">
      
      <!-- Cabeçalho da Seção -->
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
            <span>04 / TRAJECTORY</span>
            <span class="h-px w-8 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
            <span class="text-slate-500 dark:text-neutral-400">REGISTRO CRONOLÓGICO DE ENGENHARIA</span>
          </div>
          <h2 id="trajectory-title" class="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Experiência &amp; Liderança Técnica
          </h2>
        </div>

        <p class="font-mono text-xs text-slate-500 dark:text-neutral-400 max-w-sm sm:text-right">
          Mais de 9 anos entregando resiliência, escalabilidade e modernização de plataformas críticas.
        </p>
      </div>

      <!-- Ledger Editorial Cronológico -->
      <div class="divide-y divide-slate-200/80 dark:divide-neutral-800/80">
        <article
          v-for="(job, idx) in trajectory"
          :key="idx"
          class="py-12 sm:py-16 first:pt-0 last:pb-0 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
        >
          <!-- Coluna 1: Período e Metadados -->
          <div class="lg:col-span-3 space-y-2">
            <time class="font-mono text-lg sm:text-xl font-bold text-slate-900 dark:text-white block">
              {{ job.period }}
            </time>
            <span class="font-mono text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              {{ job.company }}
            </span>
            <span v-if="job.project" class="font-sans text-xs text-slate-500 dark:text-neutral-400 block">
              {{ job.project }}
            </span>
          </div>

          <!-- Coluna 2: Cargo, Síntese e Realizações Técnicas -->
          <div class="lg:col-span-9 space-y-6">
            <div>
              <h3 class="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {{ job.role }}
              </h3>
              <p class="font-sans text-sm sm:text-base text-slate-600 dark:text-neutral-300 leading-relaxed mt-2">
                {{ job.summary }}
              </p>
            </div>

            <!-- Lista de Impactos X-Y-Z -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div
                v-for="(item, i) in job.highlights"
                :key="i"
                class="border-l-2 border-slate-300 dark:border-neutral-700 pl-3.5 space-y-1"
              >
                <span class="font-mono text-xs font-semibold text-slate-900 dark:text-neutral-200 block">
                  {{ item.metric }}
                </span>
                <span class="font-sans text-xs text-slate-500 dark:text-neutral-400 block leading-relaxed">
                  {{ item.desc }}
                </span>
              </div>
            </div>

            <!-- Stack Curada da Posição -->
            <div class="pt-2 font-mono text-xs text-slate-500 dark:text-neutral-400 border-t border-slate-100 dark:border-neutral-850 flex flex-wrap items-baseline gap-2">
              <span class="text-[10px] uppercase text-slate-400 dark:text-neutral-500 font-semibold">
                TECNOLOGIAS:
              </span>
              <span class="text-slate-700 dark:text-neutral-300 font-medium">
                {{ job.stack }}
              </span>
            </div>
          </div>
        </article>
      </div>

    </div>
  </section>
</template>
