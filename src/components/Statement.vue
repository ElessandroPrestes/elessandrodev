<script setup>
const cvPath = `${import.meta.env.BASE_URL}Elessandro_Prestes_Macedo_Software_Engineer.pdf`

const highlights = [
  { metric: '2.500+ RPS', label: 'Throughput Concorrente', context: 'SIPREC / CAPES (<300ms de latência)' },
  { metric: '56.400+ Linhas', label: 'Legado Eliminado', context: 'Migração Strangler Fig para Laravel 12 (Amura Sistemas)' },
  { metric: 'IA + SDD + RAG', label: 'Ciclo de Engenharia', context: 'IA aplicada com Claude Code, Gemini e RAG' },
  { metric: '2.399 Testes', label: 'Cobertura Automatizada', context: 'Em 241 arquivos com Pest/PHPUnit' },
  { metric: '99.9% Uptime', label: 'Disponibilidade Operacional', context: 'Plataformas distribuídas (ONS - Energia Pecém)' },
]
</script>

<template>
  <section id="statement" aria-labelledby="statement-title" class="w-full border-b border-slate-200/80 dark:border-neutral-800/80">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 flex flex-col gap-12 sm:gap-16">
      
      <!-- Seção & Título de Abertura -->
      <div class="space-y-6">
        <div class="flex items-center gap-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
          <span>01 / STATEMENT</span>
          <span class="h-px w-12 bg-indigo-600/40 dark:bg-indigo-400/40" aria-hidden="true" />
          <span class="text-slate-500 dark:text-neutral-400">IA APLICADA, SDD &amp; ARQUITETURA DE SISTEMAS</span>
        </div>

        <h1
          id="statement-title"
          class="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-4xl"
        >
          Construo arquiteturas resilientes, modernizo monolitos críticos e aplico IA no meu ciclo de desenvolvimento.
        </h1>
      </div>

      <!-- Composição Assimétrica: Manifesto e Ledger Técnico -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        <!-- Coluna Esquerda: Manifesto de Posicionamento -->
        <div class="lg:col-span-7 space-y-6">
          <p class="text-lg sm:text-xl text-slate-600 dark:text-neutral-300 font-normal leading-relaxed">
            Sou <strong class="text-slate-900 dark:text-white font-semibold">Elessandro Prestes Macedo</strong>, Engenheiro de Software Sênior &amp; Tech Lead com mais de 9 anos projetando ecossistemas distribuídos, microsserviços de alta concorrência e liderando modernizações de missão crítica para instituições como <strong class="text-slate-900 dark:text-white font-semibold">CAPES</strong> e o <strong class="text-slate-900 dark:text-white font-semibold">Operador Nacional do Sistema Elétrico (ONS - Energia Pecém)</strong>.
          </p>

          <p class="text-base sm:text-lg text-slate-700 dark:text-neutral-200 font-medium leading-relaxed">
            Nos últimos anos, venho aplicando Inteligência Artificial no ciclo de desenvolvimento de software, utilizando <strong class="text-indigo-600 dark:text-indigo-400 font-semibold">SDD (Spec-Driven Development)</strong>, <strong class="text-indigo-600 dark:text-indigo-400 font-semibold">RAG (Retrieval-Augmented Generation)</strong> e <strong class="text-indigo-600 dark:text-indigo-400 font-semibold">integrações com LLMs</strong> para blindar contratos de software, acelerar entregas e eliminar retrabalho com rigor técnico.
          </p>

          <!-- Ações Editoriais / Links Diretos -->
          <div class="pt-4 flex flex-wrap items-center gap-6 font-mono text-xs">
            <a
              :href="cvPath"
              download
              class="inline-flex items-center gap-2 text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors border-b border-slate-900 dark:border-white hover:border-indigo-600 dark:hover:border-indigo-400 pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>DOWNLOAD CURRÍCULO (PDF)</span>
              <span aria-hidden="true">&darr;</span>
            </a>

            <a
              href="https://wa.me/5545999178290"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors border-b border-slate-900 dark:border-white hover:border-emerald-600 dark:hover:border-emerald-400 pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>WHATSAPP DIRETO</span>
              <span aria-hidden="true">&rarr;</span>
            </a>

            <a
              href="https://www.linkedin.com/in/elessandro-prestes-macedo/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors border-b border-slate-300 dark:border-neutral-700 pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>LINKEDIN</span>
              <span aria-hidden="true">&nearr;</span>
            </a>

            <a
              href="https://github.com/ElessandroPrestes"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors border-b border-slate-300 dark:border-neutral-700 pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>GITHUB</span>
              <span aria-hidden="true">&nearr;</span>
            </a>
          </div>
        </div>

        <!-- Coluna Direita: Ledger Técnico / Métricas de Impacto Comprovado -->
        <div class="lg:col-span-5 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#12141a] p-6 sm:p-8 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-3">
            <span class="font-mono text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-widest">
              SYSTEM BENCHMARKS &amp; METRICS
            </span>
            <span class="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
              // PRODUCTION
            </span>
          </div>

          <div class="space-y-5">
            <div
              v-for="(item, idx) in highlights"
              :key="idx"
              class="flex flex-col gap-1 border-b border-slate-100 dark:border-neutral-850 last:border-0 pb-4 last:pb-0"
            >
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-mono text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {{ item.metric }}
                </span>
                <span class="font-mono text-xs uppercase tracking-wider text-slate-600 dark:text-neutral-400 font-medium">
                  {{ item.label }}
                </span>
              </div>
              <p class="font-sans text-xs text-slate-500 dark:text-neutral-400">
                {{ item.context }}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  </section>
</template>
