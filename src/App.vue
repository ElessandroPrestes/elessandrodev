<script setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import AboutMe from './components/AboutMe.vue'
import Projects from './components/Projects.vue'
import Experience from './components/Experience.vue'
import AiAssistant from './components/AiAssistant.vue'

const cvPath = `${import.meta.env.BASE_URL}Elessandro_Prestes_Macedo_Software_Engineer.pdf`
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <a
      href="#main-content"
      class="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-gray-950 shadow-lg transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
    >
      Pular para o conteúdo principal
    </a>

    <Header />

    <main id="main-content" tabindex="-1" class="flex-1 w-full focus:outline-none">

      <!-- Hero -->
      <section
        aria-labelledby="hero-name"
        class="w-full border-b border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950"
      >
        <div class="max-w-3xl mx-auto px-6 py-20 sm:py-28 flex flex-col items-start gap-6">
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Portfólio &amp; Currículo
            </p>
            <h1
              id="hero-name"
              class="text-4xl sm:text-5xl font-bold tracking-tight text-white"
            >
              Elessandro Prestes Macedo
            </h1>
            <p class="text-lg sm:text-xl text-gray-300 font-medium leading-snug max-w-2xl">
              Senior Software Engineer | Backend &amp; Distributed Architectures | PHP, Node.js, Cloud (AWS/Azure) &amp; AI-Assisted Dev
            </p>
          </div>

          <!-- CTAs -->
          <div class="flex flex-wrap gap-3 pt-2">
            <a
              href="https://wa.me/5545999178290"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar no WhatsApp (abre em nova aba)"
              class="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.772.82 2.791.82 3.181 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-12.416C6.495 2 2 6.495 2 12.031c0 1.956.564 3.784 1.543 5.337L2 22l4.814-1.503c1.488.89 3.22 1.396 5.075 1.396 5.536 0 10.031-4.495 10.031-10.031C21.92 6.495 17.567 2 12.031 2z"/>
              </svg>
              Falar no WhatsApp
            </a>

            <a
              :href="cvPath"
              download
              class="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
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
              aria-label="Ver LinkedIn (abre em nova aba)"
              class="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Ver LinkedIn
            </a>
          </div>
        </div>
      </section>

      <!-- Sobre Mim -->
      <div class="w-full border-b border-gray-800">
        <div class="max-w-3xl mx-auto px-6 py-16">
          <AboutMe />
        </div>
      </div>

      <!-- Projetos em Destaque -->
      <div class="w-full border-b border-gray-800">
        <div class="max-w-3xl mx-auto px-6 py-16">
          <Projects />
        </div>
      </div>

      <!-- Experiência -->
      <div class="w-full border-b border-gray-800">
        <div class="max-w-3xl mx-auto px-6 py-16 pb-24">
          <Experience />
        </div>
      </div>

    </main>

    <Footer />
    <AiAssistant />
  </div>
</template>
