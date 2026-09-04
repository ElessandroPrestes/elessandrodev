<script setup>
import Header from './components/Header.vue'
import Statement from './components/Statement.vue'
import Projects from './components/Projects.vue'
import Architecture from './components/Architecture.vue'
import Experience from './components/Experience.vue'
import Toolbox from './components/Toolbox.vue'
import Footer from './components/Footer.vue'
import AiAssistant from './components/AiAssistant.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#fbfbfb] text-slate-900 dark:bg-[#0a0b0e] dark:text-[#f3f4f6] font-sans antialiased transition-colors duration-200">
    
    <!-- Skip to Content Link Acessível -->
    <a
      href="#statement"
      class="fixed left-4 top-4 z-[100] -translate-y-24 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2 text-xs font-mono font-medium shadow-lg transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none"
    >
      [PULAR PARA O CONTEÚDO PRINCIPAL]
    </a>

    <!-- 00 / Masthead & System Status -->
    <Header />

    <!-- Conteúdo Principal Editorial -->
    <main id="main-content" tabindex="-1" class="flex-1 w-full focus:outline-none">
      
      <!-- 01 / Intro & Statement -->
      <Statement />

      <!-- 02 / Selected Work: Case Studies -->
      <Projects />

      <!-- 03 / Core Engineering & Architecture -->
      <Architecture />

      <!-- 04 / Trajectory: Technical Ledger -->
      <Experience />

      <!-- 05 / Technical Toolbox: Contextual Stack -->
      <Toolbox />

    </main>

    <!-- 06 / Inquiry & Contact -->
    <Footer />

    <!-- Terminal Interativo RAG (IA) -->
    <AiAssistant />

  </div>
</template>
