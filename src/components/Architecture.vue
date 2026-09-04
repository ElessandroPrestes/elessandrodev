<script setup>
import { useI18n } from '../composables/useI18n.js'

const { messages, locale } = useI18n()
</script>

<template>
  <section id="core-engineering" aria-labelledby="engineering-title" class="w-full border-b border-slate-200/80 dark:border-neutral-800/80">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16">
      
      <!-- Cabeçalho da Seção -->
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
            <span>{{ messages.architecture.tag }}</span>
            <span class="h-px w-8 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
            <span class="text-slate-500 dark:text-neutral-400">{{ messages.architecture.subtag }}</span>
          </div>
          <h2 id="engineering-title" class="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ messages.architecture.title }}
          </h2>
        </div>

        <p class="font-mono text-xs text-slate-500 dark:text-neutral-400 max-w-sm sm:text-right">
          {{ messages.architecture.description }}
        </p>
      </div>

      <!-- Grade Editorial de Pilares Técnicos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
        <article
          v-for="principle in messages.architecture.principles"
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
              {{ locale === 'pt' ? 'APLICAÇÃO REAL COMPROVADA:' : 'PROVEN PRODUCTION USE CASE:' }}
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
