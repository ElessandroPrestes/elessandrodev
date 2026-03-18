<script setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import AboutMe from './components/AboutMe.vue'
import Experience from './components/Experience.vue'

const cvPath = `${import.meta.env.BASE_URL}Elessandro_Desenvolvedor_Full_Stack.pdf`
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Header />

    <main id="main-content" class="flex-1 w-full">

      <!-- Hero -->
      <section
        aria-labelledby="hero-name"
        class="w-full border-b border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950"
      >
        <div class="max-w-3xl mx-auto px-6 py-20 sm:py-28 flex flex-col items-start gap-6">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Portfólio &amp; Currículo
            </p>
            <h1
              id="hero-name"
              class="text-4xl sm:text-5xl font-bold tracking-tight text-white"
            >
              Elessandro Prestes Macedo
            </h1>
            <p class="text-xl text-gray-400 font-medium">
              Engenheiro de Software Full Stack
            </p>
          </div>

          <!-- CTAs -->
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              :href="cvPath"
              download
              class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              aria-label="Fazer download do currículo em PDF"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download do Currículo
            </a>

            <a
              href="https://www.linkedin.com/in/elessandro-prestes-macedo/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Ver LinkedIn
            </a>
          </div>
        </div>
      </section>

      <!-- Sobre Mim -->
      <section class="w-full border-b border-gray-800">
        <div class="max-w-3xl mx-auto px-6 py-16">
          <AboutMe />
        </div>
      </section>

      <!-- Experiência -->
      <section class="w-full">
        <div class="max-w-3xl mx-auto px-6 py-16 pb-24">
          <Experience />
        </div>
      </section>

    </main>

    <Footer />
  </div>
</template>
