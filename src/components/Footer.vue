<script setup>
import { useI18n } from '../composables/useI18n.js'

const { messages, locale } = useI18n()
const year = new Date().getFullYear()

const channels = [
  { label: 'E-MAIL', value: 'elessandrodev@gmail.com', href: 'mailto:elessandrodev@gmail.com' },
  { label: 'WHATSAPP', value: '+55 (45) 99917-8290', href: 'https://wa.me/5545999178290' },
  { label: 'LINKEDIN', value: 'in/elessandro-prestes-macedo', href: 'https://www.linkedin.com/in/elessandro-prestes-macedo/' },
  { label: 'GITHUB', value: 'github.com/ElessandroPrestes', href: 'https://github.com/ElessandroPrestes' },
  { label: 'GITLAB', value: 'gitlab.com/elessandrodev', href: 'https://gitlab.com/elessandrodev' },
]
</script>

<template>
  <footer id="contact" class="w-full bg-[#fbfbfb] dark:bg-[#0a0b0e] transition-colors duration-200">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16">
      
      <!-- Cabeçalho da Seção -->
      <div class="space-y-6">
        <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
          <span>{{ messages.footer.tag }}</span>
          <span class="h-px w-8 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
          <span class="text-slate-500 dark:text-neutral-400">{{ messages.footer.subtag }}</span>
        </div>

        <h2 class="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white max-w-3xl leading-[1.1]">
          {{ messages.footer.title }}
        </h2>

        <p class="font-sans text-sm sm:text-base text-slate-600 dark:text-neutral-300 max-w-xl leading-relaxed">
          {{ messages.footer.description }}
        </p>
      </div>

      <!-- Canais de Contato Diretos -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-neutral-800">
        <div
          v-for="c in channels"
          :key="c.label"
          class="border-b border-slate-200/80 dark:border-neutral-800/80 pb-4 space-y-1"
        >
          <span class="font-mono text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-widest block font-semibold">
            {{ c.label }}
          </span>
          <a
            :href="c.href"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            <span>{{ c.value }}</span>
            <span aria-hidden="true" class="text-xs">&nearr;</span>
          </a>
        </div>

        <div class="border-b border-slate-200/80 dark:border-neutral-800/80 pb-4 space-y-1">
          <span class="font-mono text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-widest block font-semibold">
            {{ locale === 'pt' ? 'LOCALIZAÇÃO & FUSO' : 'LOCATION & TIMEZONE' }}
          </span>
          <p class="font-mono text-sm sm:text-base text-slate-900 dark:text-white">
            {{ locale === 'pt' ? 'Brasil (UTC-3 / Horário de Brasília)' : 'Brazil (UTC-3 / Brasília Time)' }}
          </p>
        </div>
      </div>

      <!-- Bottom Bar Editorial -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-8 border-t border-slate-200 dark:border-neutral-800 font-mono text-xs text-slate-500 dark:text-neutral-400">
        <p>
          &copy; {{ year }} ELESSANDRO PRESTES MACEDO. ALL RIGHTS RESERVED.
        </p>

        <p class="flex items-center gap-2 text-[11px]">
          <span class="text-emerald-600 dark:text-emerald-400 font-bold">&bull;</span>
          <span>{{ locale === 'pt' ? 'IA APLICADA (SDD & RAG) • WCAG 2.1 AA COMPLIANT' : 'APPLIED AI (SDD & RAG) • WCAG 2.1 AA COMPLIANT' }}</span>
        </p>
      </div>

    </div>
  </footer>
</template>
