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
    <div class="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
      <p>
        &copy; {{ year }} Elessandro Prestes Macedo. Todos os direitos reservados.
      </p>

      <nav aria-label="Links sociais do rodapé">
        <ul class="flex items-center gap-4">
          <li v-for="link in socialLinks" :key="link.label">
            <a
              :href="link.href"
              :aria-label="link.label"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              {{ link.label }}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
</template>
