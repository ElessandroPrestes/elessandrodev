<script setup>
import { useI18n } from '../composables/useI18n.js'

const { messages, locale } = useI18n()
</script>

<template>
  <section id="selected-work" aria-labelledby="work-title" class="w-full border-b border-slate-200/80 dark:border-neutral-800/80">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16 sm:space-y-20">
      
      <!-- Cabeçalho da Seção -->
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
            <span>{{ messages.projects.tag }}</span>
            <span class="h-px w-8 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
            <span class="text-slate-500 dark:text-neutral-400">{{ messages.projects.subtag }}</span>
          </div>
          <h2 id="work-title" class="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ messages.projects.title }}
          </h2>
        </div>

        <p class="font-mono text-xs text-slate-500 dark:text-neutral-400 max-w-sm sm:text-right">
          {{ messages.projects.description }}
        </p>
      </div>

      <!-- Lista Editorial de Case Studies -->
      <div class="space-y-16 sm:space-y-24">
        <article
          v-for="cs in messages.projects.caseStudies"
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
                :aria-label="locale === 'pt' ? `Ver código de ${cs.title} no GitHub` : `View source code of ${cs.title} on GitHub`"
              >
                <span>{{ messages.projects.labels.repo }}</span>
                <span aria-hidden="true">&nearr;</span>
              </a>

              <a
                v-if="cs.liveUrl"
                :href="cs.liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline pb-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                :aria-label="locale === 'pt' ? `Ver aplicação ${cs.title} ao vivo` : `View live application ${cs.title}`"
              >
                <span>{{ messages.projects.labels.live }}</span>
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
                {{ messages.projects.labels.problem }}
              </h4>
              <p class="font-sans text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                {{ cs.problem }}
              </p>
            </div>

            <!-- A Solução & Arquitetura -->
            <div class="md:col-span-4 space-y-3">
              <h4 class="font-mono text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full" aria-hidden="true" />
                {{ messages.projects.labels.solution }}
              </h4>
              <p class="font-sans text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                {{ cs.solution }}
              </p>
            </div>

            <!-- Métricas de Impacto -->
            <div class="md:col-span-3 space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-neutral-800 pt-4 md:pt-0 md:pl-6">
              <h4 class="font-mono text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-widest font-semibold">
                {{ messages.projects.labels.metrics }}
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

          <!-- Stack Editorial em Linha -->
          <div class="pt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-xs">
            <span class="text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">
              {{ messages.projects.labels.stack }}:
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
