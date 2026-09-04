import { ref, computed } from 'vue'
import pt from '../i18n/locales/pt.js'
import en from '../i18n/locales/en.js'

const STORAGE_KEY = 'elessandro_locale'
const SUPPORTED_LOCALES = ['pt', 'en']
const DEFAULT_LOCALE = 'pt'

const dictionaries = { pt, en }

function resolveInitialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LOCALES.includes(saved)) {
      return saved
    }
    const navLang = typeof navigator !== 'undefined' ? navigator.language : ''
    if (navLang && navLang.toLowerCase().startsWith('en')) {
      return 'en'
    }
  } catch {
    // Fallback if localStorage or navigator is inaccessible
  }
  return DEFAULT_LOCALE
}

const currentLocale = ref(resolveInitialLocale())

function syncHtmlLang(lang) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  }
}

// Initial sync
syncHtmlLang(currentLocale.value)

export function useI18n() {
  function setLocale(newLocale) {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return
    currentLocale.value = newLocale
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch {
      // Ignore localStorage errors
    }
    syncHtmlLang(newLocale)
  }

  function toggleLocale() {
    setLocale(currentLocale.value === 'pt' ? 'en' : 'pt')
  }

  const messages = computed(() => dictionaries[currentLocale.value] || dictionaries.pt)

  function t(keyPath, replacements = {}) {
    if (!keyPath) return ''
    const keys = keyPath.split('.')
    let current = dictionaries[currentLocale.value] || dictionaries.pt

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        // Fallback to Portuguese if missing
        let fallback = dictionaries.pt
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey]
          } else {
            return keyPath
          }
        }
        current = fallback
        break
      }
    }

    if (typeof current === 'string' && Object.keys(replacements).length > 0) {
      return current.replace(/{(\w+)}/g, (_, token) => {
        return replacements[token] !== undefined ? replacements[token] : `{${token}}`
      })
    }

    return current
  }

  return {
    locale: currentLocale,
    setLocale,
    toggleLocale,
    t,
    messages,
  }
}
