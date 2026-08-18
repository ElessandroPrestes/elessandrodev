<script setup>
const experiences = [
  {
    role: 'Engenheiro de Software com IA Aplicada',
    company: 'EPM DEVTECH',
    project: null,
    period: 'Out/2025 - Mai/2026',
    highlights: [
      { label: 'Modernização Arquitetural', text: 'Liderei a migração integral da plataforma para PHP 8.2 e Laravel 12, eliminando mais de 56.400 linhas de código legado e preparando a base para evolução escalável.' },
      { label: 'Qualidade & Cobertura', text: 'Estruturei 2.399 testes automatizados (Pest/PHPUnit) distribuídos em 241 arquivos, aplicando SOLID e Clean Code para elevar a confiabilidade do software.' },
      { label: 'APIs & Automação', text: 'Desenvolvi 384 endpoints REST e integrações via WhatsApp Business, reduzindo processos operacionais manuais em 35%.' },
      { label: 'IA & Spec-Driven Development', text: 'Integrei Claude Code e metodologia SDD em todo o ciclo de vida (especificação, testes e refatoração), diminuindo o retrabalho técnico em 40% com esteiras CI/CD via Docker e GitLab.' },
    ],
    techs: ['PHP 8.2+', 'Laravel 12', 'REST APIs', 'Claude Code (SDD)', 'Pest/PHPUnit', 'Docker', 'GitLab CI/CD', 'Clean Code'],
  },
  {
    role: 'Analista Programador / Tech Lead',
    company: 'Datainfo',
    project: 'Projeto CAPES',
    period: 'Out/2024 - Set/2025',
    highlights: [
      { label: 'Escalabilidade Crítica (SIPREC / CAPES)', text: 'Coarquitei e liderei a migração para Microsserviços e BFF (Angular), garantindo suporte a 448+ IES nacionais, 10.000 usuários simultâneos e 2.500 RPS com latência abaixo de 300ms.' },
      { label: 'Liderança Técnica (SISCAD)', text: 'Liderei e executei do zero o desenvolvimento do sistema de cobrança administrativa com PHP (Laravel), Oracle DB, Redis e mensageria assíncrona com RabbitMQ.' },
      { label: 'Qualidade & DevOps', text: 'Elevei a qualidade de código em 45% com análise contínua via SonarQube e gerenciei deploys de ambientes críticos utilizando Docker e GitLab CI/CD.' },
      { label: 'Engenharia com IA', text: 'Aumentei as entregas da sprint em 25% implementando GitHub Copilot integrado à metodologia SDD, fluxos de RAG e protocolos MCP para contexto avançado, com mentoria técnica do time.' },
    ],
    techs: ['PHP', 'Laravel', 'Angular', 'Microservices', 'BFF', 'Oracle DB', 'Redis', 'RabbitMQ', 'SonarQube', 'Docker', 'GitLab CI/CD', 'SDD', 'RAG', 'MCP'],
  },
  {
    role: 'Desenvolvedor Full Stack',
    company: 'Energia Pecém',
    project: null,
    period: 'Mai/2023 - Jul/2024',
    highlights: [
      { label: 'Rastreabilidade em Tempo Real', text: 'Desenvolvi soluções de telemetria e validação de ativos com Node.js, Laravel e Vue.js, elevando a rastreabilidade operacional em 40%.' },
      { label: 'Arquitetura Orientada a Eventos (EDA)', text: 'Reduzi falhas em 35% e ampliei o processamento em 50% projetando fluxos assíncronos resilientes com RabbitMQ, Redis e Laravel Jobs.' },
      { label: 'Observabilidade Cloud', text: 'Assegurei 99,9% de disponibilidade (uptime) e reduzi incidentes críticos em 45% com monitoramento preditivo e alertas via Azure Monitor e Azure Communication Services.' },
    ],
    techs: ['Node.js', 'Laravel', 'Vue.js', 'PostgreSQL', 'Redis', 'RabbitMQ', 'Event-Driven Architecture', 'Azure Monitor'],
  },
  {
    role: 'Desenvolvedor de Sistemas',
    company: 'AMcom',
    project: 'Projeto GENIN - ONS',
    period: 'Jul/2022 - Abr/2023',
    highlights: [
      { label: 'Integrações de Missão Crítica', text: 'Viabilizei o cálculo de métricas para a alteração da bandeira tarifária nacional através de integrações com Itaipu e INMET via PHP (Laravel), REST e SOAP, com 100% de integridade de dados.' },
      { label: 'Baixa Latência & Ingestão', text: 'Reduzi a latência na ingestão de dados em escala nacional em 40% implementando microsserviços desacoplados em PostgreSQL com cache em Redis.' },
      { label: 'Infraestrutura & Automação AWS', text: 'Reduzi o tempo de deploy em 60% e mantive 99,9% de uptime automatizando esteiras no AWS CodeBuild, orquestração via API Gateway e monitoramento com CloudWatch.' },
    ],
    techs: ['PHP', 'Laravel', 'REST/SOAP', 'PostgreSQL', 'Redis', 'AWS CodeBuild', 'Amazon API Gateway', 'Amazon CloudWatch', 'Microservices'],
  },
  {
    role: 'Desenvolvedor Full Stack',
    company: 'Grupo Intellectus',
    project: null,
    period: 'Out/2021 - Jul/2022',
    highlights: [
      { label: 'Arquitetura Serverless em Nuvem', text: 'Projetei e implementei a plataforma de Xadrez Online em arquitetura Serverless na AWS, reduzindo custos em 35% com escalabilidade automática via AWS Lambda, SQS e SNS.' },
      { label: 'Escala Pública Educacional', text: 'Conectei e entreguei a solução para mais de 650 escolas estaduais em 141 municípios (SEDUC-MT), integrando frontend Angular a APIs REST em PHP (Laravel) com 99,9% de uptime em picos de tráfego.' },
      { label: 'Observabilidade & CI/CD', text: 'Estruturei centralização de logs e observabilidade com ELK Stack (reduzindo o MTTR em 50%) e automatizei deploys com GitHub Actions, acelerando entregas em 60%.' },
    ],
    techs: ['AWS Lambda', 'Amazon SQS', 'Amazon SNS', 'Angular', 'PHP', 'Laravel', 'ELK Stack', 'GitHub Actions', 'Serverless'],
  },
  {
    role: 'Desenvolvedor Full Stack',
    company: 'Paraiso',
    project: null,
    period: 'Ago/2016 - Set/2021',
    highlights: [
      { label: 'Evolução de ERP Corporativo', text: 'Elevei a eficiência operacional em 30% nas áreas financeira, logística e industrial, desenvolvendo módulos em PHP (Laravel, Symfony), PostgreSQL e Oracle.' },
      { label: 'Modernização & Microsserviços', text: 'Reduzi em 40% os custos de manutenção liderando a migração de monólitos legados para microsserviços e sistemas distribuídos com Node.js.' },
      { label: 'IoT Industrial & Tempo Real', text: 'Reduzi falhas operacionais em 30% integrando máquinas de produção aos sistemas de gestão via Azure IoT Cloud e protocolos de comunicação bidirecional com WebSockets.' },
      { label: 'Resiliência & Mensageria', text: 'Coarquitei fluxos orientados a eventos (EDA) na AWS com Kafka, RabbitMQ, Redis e PostgreSQL, garantindo 99,9% de disponibilidade sob práticas de Clean Architecture e SOLID.' },
    ],
    techs: ['PHP', 'Symfony', 'Laravel', 'Node.js', 'IoT Industrial', 'Azure Cloud', 'AWS', 'Apache Kafka', 'RabbitMQ', 'PostgreSQL', 'Oracle DB', 'WebSockets'],
  },
]
</script>

<template>
  <section aria-labelledby="experience-heading" class="max-w-3xl mx-auto w-full">
    <h2
      id="experience-heading"
      class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-10"
    >
      Experiência Profissional
    </h2>

    <ol class="relative border-l border-gray-800 space-y-0">
      <li
        v-for="(exp, index) in experiences"
        :key="index"
        class="relative pl-8 pb-12 last:pb-0"
      >
        <!-- Marcador da timeline -->
        <span
          class="absolute left-0 -translate-x-1/2 mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 ring-4 ring-gray-950"
          aria-hidden="true"
        />

        <article class="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">

          <!-- Topo: período + empresa -->
          <header class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-4">
            <div>
              <h3 class="text-base font-semibold text-white leading-snug">
                {{ exp.role }}
              </h3>
              <p class="text-sm font-medium text-indigo-400 mt-0.5">
                {{ exp.company }}
                <span v-if="exp.project" class="text-gray-400 font-normal">
                  - {{ exp.project }}
                </span>
              </p>
            </div>
            <time class="shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide sm:text-right mt-0.5">
              {{ exp.period }}
            </time>
          </header>

          <!-- Lista de tópicos -->
          <ul class="space-y-2.5 mb-5" role="list">
            <li
              v-for="(item, i) in exp.highlights"
              :key="i"
              class="flex gap-2.5 text-sm text-gray-400 leading-relaxed"
            >
              <span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
              <span>
                <strong class="text-gray-200 font-medium">{{ item.label }}:</strong>
                {{ item.text }}
              </span>
            </li>
          </ul>

          <!-- Badges de tecnologias -->
          <ul
            class="flex flex-wrap gap-2"
            :aria-label="`Tecnologias utilizadas em ${exp.company}`"
          >
            <li v-for="tech in exp.techs" :key="tech">
              <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                {{ tech }}
              </span>
            </li>
          </ul>

        </article>
      </li>
    </ol>
  </section>
</template>
