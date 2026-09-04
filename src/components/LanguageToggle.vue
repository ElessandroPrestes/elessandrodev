<script setup>
import { useI18n } from '../composables/useI18n.js'

const { locale, setLocale } = useI18n()
</script>

<template>
  <div
    class="inline-flex items-center p-0.5 border border-slate-300 dark:border-neutral-700 bg-slate-100/90 dark:bg-neutral-900/90 transition-colors"
    role="group"
    :aria-label="locale === 'pt' ? 'Selecionar idioma' : 'Select language'"
  >
    <button
      type="button"
      @click="setLocale('pt')"
      :aria-pressed="locale === 'pt'"
      :aria-label="locale === 'pt' ? 'Mudar para Português (ativo)' : 'Switch to Portuguese'"
      class="px-2 py-1 font-mono text-[11px] uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      :class="[
        locale === 'pt'
          ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-bold shadow-xs border-b border-indigo-600 dark:border-indigo-400'
          : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white font-normal'
      ]"
    >
      PT
    </button>

    <span class="text-slate-300 dark:text-neutral-750 font-mono text-[10px] px-0.5 select-none" aria-hidden="true">/</span>

    <button
      type="button"
      @click="setLocale('en')"
      :aria-pressed="locale === 'en'"
      :aria-label="locale === 'en' ? 'Switch to English (active)' : 'Mudar para Inglês'"
      class="px-2 py-1 font-mono text-[11px] uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      :class="[
        locale === 'en'
          ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-bold shadow-xs border-b border-indigo-600 dark:border-indigo-400'
          : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white font-normal'
      ]"
    >
      EN
    </button>
  </div>
</template>
