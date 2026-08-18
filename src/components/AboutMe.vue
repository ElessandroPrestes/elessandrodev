<script setup>
const pillars = [
  {
    title: 'Engenharia Backend & Arquitetura',
    description: 'Domínio avançado em PHP (Laravel, Symfony) e Node.js/TypeScript, projetando ecossistemas baseados em Microservices, BFF, Event-Driven Architecture (EDA) e Serverless com foco em resiliência, baixa latência e alta concorrência.',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
  },
  {
    title: 'Cloud & Infraestrutura',
    description: 'Arquitetura e esteiras automatizadas em AWS e Azure, utilizando Docker, CI/CD (GitLab, GitHub Actions), mensageria assíncrona (RabbitMQ, Kafka) e cache distribuído (Redis).',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
  },
  {
    title: 'Qualidade & Observabilidade',
    description: 'Aplicação rigorosa de Clean Architecture, Princípios SOLID, TDD/Pest/PHPUnit, análise estática contínua (SonarQube) e monitoramento com ELK Stack e CloudWatch.',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    title: 'Engenharia Assistida por IA',
    description: 'Adoção pioneira de Spec-Driven Development (SDD) integrado a ferramentas como Claude Code e GitHub Copilot, acelerando ciclos de entrega, testes e refatoração com alto rigor técnico.',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  },
]

const metrics = [
  { value: '+9 Anos', label: 'Experiência em Engenharia' },
  { value: '2.500+ RPS', label: 'Throughput em Sistemas Críticos' },
  { value: '99.9%', label: 'Uptime & Alta Disponibilidade' },
  { value: '56k+ Linhas', label: 'Código Legado Modernizado' },
]
</script>

<template>
  <section aria-labelledby="about-heading" class="max-w-3xl mx-auto w-full space-y-10">
    <div>
      <h2
        id="about-heading"
        class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4"
      >
        Sobre mim
      </h2>

      <p class="text-gray-300 text-base sm:text-lg leading-relaxed">
        Engenheiro de Software Sênior com <strong class="text-white font-semibold">+9 anos de experiência</strong> especializado em desenvolvimento Backend, Full Stack e arquitetura de sistemas distribuídos de alta complexidade. Atuação consolidada na liderança técnica e modernização de plataformas críticas para organizações como <strong class="text-white font-semibold">CAPES</strong>, <strong class="text-white font-semibold">ONS</strong> e indústrias de grande porte.
      </p>
    </div>

    <!-- Pilares de Atuação & Especialidades -->
    <div class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
        Pilares de Atuação &amp; Especialidades
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article
          v-for="pillar in pillars"
          :key="pillar.title"
          class="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors flex flex-col gap-2.5"
        >
          <div class="flex items-center gap-2.5 text-indigo-400">
            <span class="p-2 rounded-lg bg-indigo-950/60 border border-indigo-900/50 text-indigo-400 shrink-0" v-html="pillar.icon" />
            <h4 class="text-sm font-semibold text-white leading-snug">
              {{ pillar.title }}
            </h4>
          </div>
          <p class="text-xs sm:text-sm text-gray-400 leading-relaxed">
            {{ pillar.description }}
          </p>
        </article>
      </div>
    </div>

    <!-- Grid de Métricas Rápidas -->
    <div class="pt-2">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          v-for="metric in metrics"
          :key="metric.value"
          class="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors"
        >
          <span class="block text-xl sm:text-2xl font-bold tracking-tight text-indigo-400">
            {{ metric.value }}
          </span>
          <span class="block text-xs font-medium text-gray-400 mt-1 leading-snug">
            {{ metric.label }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
