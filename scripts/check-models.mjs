import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const WRANGLER_PATH = fileURLToPath(new URL('../wrangler.toml', import.meta.url))
const CATALOG_URL = 'https://openrouter.ai/api/v1/models'

function readConfiguredModels() {
  const content = readFileSync(WRANGLER_PATH, 'utf8')
  const match = content.match(/^\s*MODELS\s*=\s*"([^"]*)"/m)
  if (!match) {
    throw new Error('MODELS não encontrado em wrangler.toml.')
  }

  return match[1]
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)
}

async function fetchCatalog() {
  const response = await fetch(CATALOG_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'elessandrodev-models-check',
    },
  })

  if (!response.ok) {
    throw new Error(`Catálogo respondeu HTTP ${response.status}.`)
  }

  const payload = await response.json()
  if (!Array.isArray(payload?.data)) {
    throw new Error('Catálogo da OpenRouter sem campo data.')
  }

  return new Set(payload.data.map((model) => model.id))
}

async function main() {
  const models = readConfiguredModels()
  if (models.length === 0) {
    throw new Error('MODELS está vazio em wrangler.toml.')
  }

  let catalog
  try {
    catalog = await fetchCatalog()
  } catch (error) {
    console.warn(
      `⚠️  Não foi possível validar os modelos da OpenRouter: ${error.message}`,
    )
    console.warn('   O CI continua; valide manualmente antes do deploy.')
    return
  }

  const missing = models.filter((model) => !catalog.has(model))
  if (missing.length > 0) {
    console.error('❌ Modelos inexistentes no catálogo público da OpenRouter:')
    for (const model of missing) console.error(`   - ${model}`)
    process.exitCode = 1
    return
  }

  const freeModels = models.filter((model) => model.endsWith(':free'))
  if (freeModels.length < 2) {
    console.error(
      '❌ MODELS deve manter ao menos dois modelos :free válidos para o fallback.',
    )
    process.exitCode = 1
    return
  }

  console.log(`✅ ${models.length} modelos validados no catálogo da OpenRouter.`)
  for (const model of models) console.log(`   - ${model}`)
}

await main()
