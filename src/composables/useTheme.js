import { ref, readonly } from 'vue'

const THEME_STORAGE_KEY = 'theme'

const isDark = ref(false)
let isInitialized = false
let mediaQueryList = null

function applyTheme(dark) {
  isDark.value = dark
  const root = document.documentElement
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]')

  if (dark) {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
    if (metaColorScheme) {
      metaColorScheme.content = 'dark'
    }
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
    if (metaColorScheme) {
      metaColorScheme.content = 'light'
    }
  }
}

function handleSystemChange(event) {
  // Apenas altera se o usuário não tiver uma preferência explícita no localStorage
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (!savedTheme) {
    applyTheme(event.matches)
  }
}

export function useTheme() {
  if (!isInitialized && typeof window !== 'undefined') {
    isInitialized = true

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')

    if (savedTheme === 'dark') {
      applyTheme(true)
    } else if (savedTheme === 'light') {
      applyTheme(false)
    } else {
      // Fallback para preferência do sistema operacional
      applyTheme(mediaQueryList.matches)
    }

    // Ouvinte para sincronização com o SO em tempo real
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleSystemChange)
    } else if (mediaQueryList.addListener) {
      // Suporte legado
      mediaQueryList.addListener(handleSystemChange)
    }
  }

  function toggleTheme() {
    const nextDark = !isDark.value
    applyTheme(nextDark)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextDark ? 'dark' : 'light')
    } catch (e) {
      console.warn('Não foi possível salvar o tema no localStorage:', e)
    }
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      applyTheme(true)
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    } else if (theme === 'light') {
      applyTheme(false)
      localStorage.setItem(THEME_STORAGE_KEY, 'light')
    } else {
      // Resetar para automático do SO
      localStorage.removeItem(THEME_STORAGE_KEY)
      if (mediaQueryList) {
        applyTheme(mediaQueryList.matches)
      }
    }
  }

  return {
    isDark: readonly(isDark),
    toggleTheme,
    setTheme,
  }
}
