<script setup>
import { useI18n } from '../composables/useI18n.js'

const { messages, locale } = useI18n()
</script>

<template>
  <section id="trajectory" aria-labelledby="trajectory-title" class="w-full border-b border-slate-200/80 dark:border-neutral-800/80">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16">
      
      <!-- Cabeçalho da Seção -->
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
            <span>{{ messages.experience.tag }}</span>
            <span class="h-px w-8 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
            <span class="text-slate-500 dark:text-neutral-400">{{ messages.experience.subtag }}</span>
          </div>
          <h2 id="trajectory-title" class="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ messages.experience.title }}
          </h2>
        </div>

        <p class="font-mono text-xs text-slate-500 dark:text-neutral-400 max-w-sm sm:text-right">
          {{ messages.experience.description }}
        </p>
      </div>

      <!-- Ledger Editorial Cronológico -->
      <div class="divide-y divide-slate-200/80 dark:divide-neutral-800/80">
        <article
          v-for="(job, idx) in messages.experience.trajectory"
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
                {{ locale === 'pt' ? 'TECNOLOGIAS:' : 'TECHNOLOGIES:' }}
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
