<script setup>
const socialLinks = [
  {
    label: 'WhatsApp',
    href: 'https://wa.me/5545999178290',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.772.82 2.791.82 3.181 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-12.416C6.495 2 2 6.495 2 12.031c0 1.956.564 3.784 1.543 5.337L2 22l4.814-1.503c1.488.89 3.22 1.396 5.075 1.396 5.536 0 10.031-4.495 10.031-10.031C21.92 6.495 17.567 2 12.031 2z"/>
    </svg>`,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/ElessandroPrestes',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>`,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/elessandro-prestes-macedo/',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>`,
  },
  {
    label: 'GitLab',
    href: 'https://gitlab.com/elessandrodev',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M4.845.904a.9.9 0 0 0-.857.608L.05 13.144a.898.898 0 0 0 .326 1.004l11.625 8.45a.9.9 0 0 0 1.057 0l11.625-8.45a.898.898 0 0 0 .325-1.004L21.012 1.512a.9.9 0 0 0-.857-.608.9.9 0 0 0-.857.608l-2.895 8.913H7.597L4.702 1.512A.9.9 0 0 0 4.845.904z"/>
    </svg>`,
  },
]
</script>

<template>
  <header class="w-full border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
      <div class="min-w-0">
        <span class="text-lg font-semibold tracking-tight text-white sm:hidden">Elessandro</span>
        <span class="hidden text-lg font-semibold tracking-tight text-white sm:inline">Elessandro Prestes</span>
        <span class="hidden lg:inline text-gray-400 ml-2 text-sm">/ Senior Software Engineer</span>
      </div>

      <nav aria-label="Redes sociais">
        <ul class="flex items-center gap-1 sm:gap-2">
          <li v-for="link in socialLinks" :key="link.label">
            <a
              :href="link.href"
              :aria-label="`${link.label} (abre em nova aba)`"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              <span class="w-5 h-5" v-html="link.icon" />
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>
