<script setup>
const experiences = [
  {
    role: 'Analista Programador Sênior',
    company: 'Datainfo',
    project: 'Projeto CAPES',
    period: 'Out/2024 — Set/2025',
    highlights: [
      { label: 'SISCAD (CAPES) — Tech Lead', text: 'Responsável pela liderança técnica, sustentação e evolução do Sistema de Cobrança Administrativa da CAPES.' },
      { label: 'Modernização Arquitetural (SIPREC)', text: 'Como Desenvolvedor tive atuação estratégica na migração de sistemas legados para Microserviços e BFF (Angular), focando no redesenho de componentes para modularidade e escalabilidade.' },
      { label: 'Garantia de Qualidade', text: 'Implementação de melhorias estruturais e mitigação de vulnerabilidades via SonarQube.' },
      { label: 'DevOps', text: 'Gestão de deploys em ambientes críticos com Docker e GitLab CI/CD.' },
    ],
    techs: ['PHP', 'Laravel', 'Angular', 'Oracle', 'Redis', 'RabbitMQ', 'SonarQube', 'Docker', 'GitLab CI/CD'],
  },
  {
    role: 'Desenvolvedor Full Stack',
    company: 'Energia Pecém',
    project: null,
    period: 'Mai/2023 — Jul/2024',
    highlights: [
      { label: 'Projeto SIGMA', text: 'Desenvolvimento de módulos de rastreio e validação de equipamentos em tempo real.' },
      { label: 'Gestão de Dados', text: 'Implementação de fluxos de inventário e sincronização operacional.' },
      { label: 'Arquitetura Assíncrona', text: 'Gerenciamento de alta carga através de filas (RabbitMQ) e Laravel Jobs.' },
      { label: 'Monitoramento Cloud', text: 'Gestão de saúde da aplicação via Azure Monitor e Azure Communication Services.' },
    ],
    techs: ['Node.js', 'Express', 'PHP', 'Laravel', 'Vue.js', 'PostgreSQL', 'Redis', 'RabbitMQ', 'Azure Monitor'],
  },
  {
    role: 'Desenvolvedor de Sistemas',
    company: 'AMcom',
    project: 'Projeto GENIN — ONS',
    period: 'Jul/2022 — Abr/2023',
    highlights: [
      { label: 'Integrações Nacionais', text: 'Desenvolvimento de integrações críticas com Itaipu e INMET utilizando PHP (Laravel), REST e SOAP.' },
      { label: 'Processamento Real-time', text: 'Implementação de microserviços para coleta e processamento de dados energéticos.' },
      { label: 'Infraestrutura AWS', text: 'Automação de pipelines via CodeBuild e API Gateway, com monitoramento via CloudWatch.' },
    ],
    techs: ['PHP', 'Laravel', 'REST', 'SOAP', 'PostgreSQL', 'Redis', 'AWS CodeBuild', 'API Gateway', 'CloudWatch'],
  },
  {
    role: 'Desenvolvedor Full Stack',
    company: 'Grupo Intellectus',
    project: null,
    period: 'Out/2021 — Jul/2022',
    highlights: [
      { label: 'Arquitetura Serverless', text: 'Implementação de plataforma de ensino em AWS Lambda, com mensageria via SQS e SNS.' },
      { label: 'Desenvolvimento Web', text: 'Construção de interfaces dinâmicas em Angular e backend em PHP (Laravel) integrados ao Sistema Educacional Estadual.' },
      { label: 'Observabilidade', text: 'Monitoramento de logs via ELK Stack e CI/CD via GitHub Actions.' },
    ],
    techs: ['AWS Lambda', 'SQS', 'SNS', 'Angular', 'PHP', 'Laravel', 'ELK Stack', 'GitHub Actions'],
  },
  {
    role: 'Desenvolvedor Full Stack',
    company: 'Grupo Paraíso',
    project: null,
    period: 'Jan/2016 — Set/2021',
    highlights: [
      { label: 'IoT Industrial & Azure', text: 'Responsável técnico por algumas integrações de sistemas de gestão a máquinas industriais em ambiente de produção.' },
      { label: 'E-commerce & AWS', text: 'Participação ativa na escolha de arquitetura de soluções de varejo e CRM hospedados em AWS.' },
      { label: 'Modernização de Legados', text: 'Transição de sistemas monolíticos para arquiteturas modernas.' },
      { label: 'Persistência e Mensageria', text: 'Modelagem robusta em Oracle e PostgreSQL, com sincronização via Kafka e RabbitMQ.' },
    ],
    techs: ['Azure Cloud', 'AWS', 'Node.js', 'PHP', 'Laravel', 'Symfony', 'Oracle', 'PostgreSQL', 'Kafka', 'RabbitMQ'],
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
                <span v-if="exp.project" class="text-gray-500 font-normal">
                  &mdash; {{ exp.project }}
                </span>
              </p>
            </div>
            <time class="shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide sm:text-right mt-0.5">
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
