<script setup>
const year = new Date().getFullYear()

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/ElessandroPrestes' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/elessandro-prestes-macedo/' },
  { label: 'GitLab', href: 'https://gitlab.com/elessandrodev' },
]
</script>

<template>
  <footer class="w-full border-t border-gray-800 bg-gray-950 mt-auto">
    <div class="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
      <p>
        &copy; {{ year }} Elessandro Prestes Macedo. Todos os direitos reservados.
      </p>

      <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        <span
          class="inline-flex min-h-10 items-center gap-1.5 px-2 font-medium text-indigo-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="12" cy="4" r="2" />
            <path d="M5 8h14M12 6v6M8 21l4-9 4 9M8 15h8" />
          </svg>
          Acessibilidade
        </span>

        <nav aria-label="Links sociais do rodapé">
          <ul class="flex items-center gap-1">
            <li v-for="link in socialLinks" :key="link.label">
              <a
                :href="link.href"
                :aria-label="`${link.label} (abre em nova aba)`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-h-10 items-center rounded px-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </footer>
</template>
