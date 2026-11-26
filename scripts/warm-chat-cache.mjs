import pt from '../src/i18n/locales/pt.js'
import en from '../src/i18n/locales/en.js'

const { CHAT_WARMUP_URL: endpoint, CHAT_WARMUP_ORIGIN: origin } = process.env
if (!endpoint || !origin) {
  console.error('Defina CHAT_WARMUP_URL e CHAT_WARMUP_ORIGIN antes de executar.')
  process.exit(1)
}

for (const [locale, dictionary] of Object.entries({ pt, en })) {
  for (const { label, query } of dictionary.aiAssistant.suggestedTopics) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, locale }),
        signal: AbortSignal.timeout(70000),
        redirect: 'error',
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      console.log(`[${locale}] ${label} — ${result.origin ?? 'origem desconhecida'}`)
      if (result.origin === 'contact' && response.headers.get('X-Assistant-Stage') === 'contact') continue
      if (result.origin === 'cache') continue
      if (result.origin === 'llm' && response.headers.get('X-Assistant-Cache') === 'MISS') continue
      process.exitCode = 1
    } catch (error) {
      console.error(`[${locale}] ${label} — falha na consulta (${error.name})`)
      process.exitCode = 1
    }
  }
}
