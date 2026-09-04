<script setup>
import { useI18n } from '../composables/useI18n.js'

const { messages } = useI18n()
</script>

<template>
  <section id="toolbox" aria-labelledby="toolbox-title" class="w-full border-b border-slate-200/80 dark:border-neutral-800/80">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16">
      
      <!-- Cabeçalho da Seção -->
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
            <span>{{ messages.toolbox.tag }}</span>
            <span class="h-px w-8 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
            <span class="text-slate-500 dark:text-neutral-400">{{ messages.toolbox.subtag }}</span>
          </div>
          <h2 id="toolbox-title" class="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ messages.toolbox.title }}
          </h2>
        </div>

        <p class="font-mono text-xs text-slate-500 dark:text-neutral-400 max-w-sm sm:text-right">
          {{ messages.toolbox.description }}
        </p>
      </div>

      <!-- Lista Editorial de Domínios -->
      <div class="divide-y divide-slate-200/80 dark:divide-neutral-800/80">
        <div
          v-for="(cat, idx) in messages.toolbox.categories"
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
