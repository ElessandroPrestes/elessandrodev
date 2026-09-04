<script setup>
const principles = [
  {
    code: 'ARCH-01',
    title: 'Migração Gradual com Strangler Fig Pattern',
    headline: 'Evolução de monolitos legados sem interrupção operacional ou "Big Bang releases".',
    description: 'Abordo a modernização de sistemas corporativos através da interceptação gradual de chamadas e estrangulamento de módulos legados por meio de BFFs e microsserviços. Esse padrão assegura continuidade de negócio, reversibilidade imediata de deploys e validação em produção de cada fatia de domínio.',
    cases: 'SIPREC / CAPES (448+ IES) · Amura Sistemas (56.400+ linhas modernizadas).',
  },
  {
    code: 'ARCH-02',
    title: 'Arquitetura Orientada a Eventos (EDA) & Resiliência',
    headline: 'Desacoplamento temporal e alta vazão através de mensageria assíncrona tolerante a falhas.',
    description: 'Projeto ecossistemas baseados em brokers como RabbitMQ e Apache Kafka com Dead Letter Queues (DLQ), idempotência de consumo e fallback gracioso. Elimino acoplamento síncrono para garantir que picos de tráfego de downstream nunca derrubem o gateway principal da aplicação.',
    cases: 'Projeto SIGMA (Energia Pecém) · Processamento Regulatório ONS (AMcom) · SISCAD.',
  },
  {
    code: 'ARCH-03',
    title: 'IA no Ciclo de Desenvolvimento (SDD, RAG & LLMs)',
    headline: 'Engenharia assistida por IA, contratos executáveis, RAG e integrações com modelos de linguagem.',
    description: 'Nos meus últimos anos, venho aplicando Inteligência Artificial no ciclo de desenvolvimento de software, utilizando SDD (Spec-Driven Development), RAG (Retrieval-Augmented Generation) e integrações com LLMs. Conecto especificações executáveis a fluxos de engenharia aumentados por IA para eliminar retrabalho, blindar contratos de software e garantir rastreabilidade determinística do design ao deploy.',
    cases: 'Engenharia assistida com Claude Code, Gemini, Copilot, RAG e MCP (-40% retrabalho).',
  },
  {
    code: 'ARCH-04',
    title: 'Qualidade Determinística, TDD & Observabilidade',
    headline: 'Clean Architecture, suítes massivas de testes e telemetria ativa para redução de MTTR.',
    description: 'Qualidade de software não é acidental: aplico TDD com suítes unitárias e de integração (2.399 testes na Amura Sistemas com Pest/PHPUnit), análise estática contínua no SonarQube (+45% de conformidade de código) e instrumentação via ELK Stack e CloudWatch para detecção preditiva de anomalias.',
    cases: 'Plataformas de alta escala SEDUC-MT · Datainfo CAPES · ONS - Energia Pecém.',
  },
]
</script>

<template>
  <section id="core-engineering" aria-labelledby="engineering-title" class="w-full border-b border-slate-200/80 dark:border-neutral-800/80">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16">
      
      <!-- Cabeçalho da Seção -->
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
            <span>03 / ENGINEERING</span>
            <span class="h-px w-8 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
            <span class="text-slate-500 dark:text-neutral-400">DISCIPLINAS ARQUITETURAIS</span>
          </div>
          <h2 id="engineering-title" class="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Princípios Técnicos &amp; IA Aplicada
          </h2>
        </div>

        <p class="font-mono text-xs text-slate-500 dark:text-neutral-400 max-w-sm sm:text-right">
          Como penso e estruturo software para tolerar escala, falhas e aplicar IA com rigor de engenharia.
        </p>
      </div>

      <!-- Grade Editorial de Pilares Técnicos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
        <article
          v-for="principle in principles"
          :key="principle.code"
          class="space-y-4 border-t border-slate-200 dark:border-neutral-800 pt-6"
        >
          <!-- Identificador de Código -->
          <div class="flex items-center justify-between font-mono text-xs text-indigo-600 dark:text-indigo-400">
            <span class="font-semibold tracking-wider">{{ principle.code }}</span>
            <span class="text-slate-400 dark:text-neutral-500">// ARCHITECTURE PILLAR</span>
          </div>

          <!-- Título e Subtítulo -->
          <h3 class="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
            {{ principle.title }}
          </h3>

          <p class="font-sans text-sm font-medium text-slate-700 dark:text-neutral-200 leading-normal">
            {{ principle.headline }}
          </p>

          <p class="font-sans text-xs sm:text-sm text-slate-500 dark:text-neutral-400 leading-relaxed">
            {{ principle.description }}
          </p>

          <!-- Aplicação Real -->
          <div class="pt-2 font-mono text-xs text-slate-600 dark:text-neutral-400 border-t border-slate-100 dark:border-neutral-850">
            <span class="text-[10px] uppercase tracking-wider text-slate-400 dark:text-neutral-500 block mb-1">
              APLICAÇÃO REAL COMPROVADA:
            </span>
            <span class="font-medium text-slate-800 dark:text-neutral-200">
              {{ principle.cases }}
            </span>
          </div>
        </article>
      </div>

    </div>
  </section>
</template>
