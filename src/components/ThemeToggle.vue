<script setup>
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="isDark"
    :aria-label="isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'"
    :title="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
    @click="toggleTheme"
    class="relative inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-800 dark:text-amber-400 dark:focus-visible:ring-offset-gray-950 cursor-pointer shadow-xs"
  >
    <span class="sr-only">
      {{ isDark ? 'Modo escuro ativado. Clique para alternar para modo claro.' : 'Modo claro ativado. Clique para alternar para modo escuro.' }}
    </span>

    <!-- Ícone de Sol (visível quando em Dark Mode para alternar para Light) -->
    <svg
      v-if="isDark"
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5 transition-transform duration-300 transform rotate-0 hover:rotate-45"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>

    <!-- Ícone de Lua (visível quando em Light Mode para alternar para Dark) -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5 transition-transform duration-300 transform -rotate-12 hover:rotate-0 text-slate-700"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </button>
</template>
