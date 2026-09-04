<script setup>
import ThemeToggle from './ThemeToggle.vue'

const navItems = [
  { num: '01', label: 'Work', href: '#selected-work' },
  { num: '02', label: 'Architecture', href: '#core-engineering' },
  { num: '03', label: 'Trajectory', href: '#trajectory' },
  { num: '04', label: 'Toolbox', href: '#toolbox' },
  { num: '05', label: 'Contact', href: '#contact' },
]
</script>

<template>
  <header class="w-full border-b border-slate-200/80 dark:border-neutral-800/80 bg-[#fbfbfb]/90 dark:bg-[#0a0b0e]/90 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      
      <!-- Identidade / Masthead -->
      <a href="#" class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
        <span class="font-display font-bold tracking-tight text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          ELESSANDRO PRESTES
        </span>
        <span class="font-mono text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-widest">
          / ARCHITECT &amp; TECH LEAD
        </span>
      </a>

      <!-- Status Operacional (Desktop) -->
      <div class="hidden xl:flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-neutral-400 border-x border-slate-200/80 dark:border-neutral-800/80 px-4 py-1">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>STATUS: DISPONÍVEL · IA NO DEV, SDD &amp; ARQUITETURA</span>
      </div>

      <!-- Navegação por Coordenadas Numéricas & Toggle -->
      <div class="flex items-center gap-3 sm:gap-6">
        <nav aria-label="Navegação editorial" class="hidden md:block">
          <ul class="flex items-center gap-4 lg:gap-6 font-mono text-xs">
            <li v-for="item in navItems" :key="item.num">
              <a
                :href="item.href"
                class="group text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center gap-1.5 py-1"
              >
                <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">{{ item.num }}</span>
                <span>{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>

        <div class="h-4 w-px bg-slate-200 dark:bg-neutral-800 hidden md:block" aria-hidden="true" />

        <!-- Theme Toggle -->
        <ThemeToggle />
      </div>

    </div>
  </header>
</template>
