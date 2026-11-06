import assert from 'node:assert/strict'
import worker, { __resetCircuitBreakerForTests } from './index.js'
import { buildCacheKey } from './cache.js'
import { DEFAULT_MODELS } from './providers.js'

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    passed += 1
    console.log(`✅ [PASSOU] ${name}`)
  } catch (error) {
    failed += 1
    console.error(`❌ [FALHOU] ${name}`)
    console.error(`   ${error.message}`)
  }
}

function request(question, { origin = 'http://localhost:5212', locale = 'pt' } = {}) {
  return new Request('http://worker.test/', {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, locale }),
  })
}

function makeEnv({ aiRun } = {}) {
  return {
    OPENROUTER_API_KEY: 'test-key',
    ALLOWED_ORIGIN: 'http://localhost:5212',
    MIN_SCORE: '0.45',
    LOG_LEVEL: 'silent',
    AI: {
      run: aiRun || (async () => ({ data: [Array(1024).fill(0)] })),
    },
  }
}

function installCache() {
  const store = new Map()

  globalThis.caches = {
    default: {
      async match(key) {
        const value = store.get(String(key))
        if (!value) return undefined
        return new Response(JSON.stringify(value), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
      async put(key, response) {
        store.set(String(key), await response.json())
      },
    },
  }

  return store
}

await test('Contato em PT responde sem chamar AI nem OpenRouter', async () => {
  let aiCalls = 0
  let fetchCalls = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('OpenRouter não deveria ser chamado')
  }

  try {
    const response = await worker.fetch(
      request('Como entro em contato?'),
      makeEnv({
        aiRun: async () => {
          aiCalls += 1
          throw new Error('Embedding não deveria ser chamado')
        },
      }),
    )
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.match(body.response, /elessandrodev@gmail\.com/)
    assert.deepEqual(body.sources, [])
    assert.equal(aiCalls, 0)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

await test('Contato em EN usa resposta determinística em inglês', async () => {
  const response = await worker.fetch(
    request('How can I contact Elessandro?', { locale: 'pt' }),
    makeEnv(),
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.match(body.response, /Direct contact/)
  assert.match(body.response, /elessandro-prestes-macedo/)
})

await test('Origem inválida retorna 403 antes de qualquer processamento', async () => {
  let aiCalls = 0
  const response = await worker.fetch(
    request('Como entro em contato?', { origin: 'https://evil.example' }),
    makeEnv({
      aiRun: async () => {
        aiCalls += 1
        return { data: [Array(1024).fill(0)] }
      },
    }),
  )

  assert.equal(response.status, 403)
  assert.equal(aiCalls, 0)
})

await test('Pergunta vazia retorna 400', async () => {
  const response = await worker.fetch(request('   '), makeEnv())
  assert.equal(response.status, 400)
})

await test('Payload acima do limite retorna 413', async () => {
  const response = await worker.fetch(
    request('a'.repeat(2100)),
    makeEnv(),
  )
  assert.equal(response.status, 413)
})

await test('404 de um modelo tenta o próximo da cadeia', async () => {
  const originalFetch = globalThis.fetch
  const models = []
  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body)
    models.push(payload.model)

    if (models.length === 1) {
      return new Response(
        JSON.stringify({ error: { message: 'modelo indisponível' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: 'Resposta do segundo modelo.' } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const response = await worker.fetch(
      request('Onde houve modernização de sistemas legados?'),
      { ...makeEnv(), MODELS: 'modelo-a:free,modelo-b:free', MIN_SCORE: '0' },
    )
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.match(body.response, /segundo modelo/)
    assert.deepEqual(models, ['modelo-a:free', 'modelo-b:free'])
  } finally {
    globalThis.fetch = originalFetch
  }
})

await test('Fora do corpus usa safeFallback sem chamar OpenRouter', async () => {
  let fetchCalls = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('OpenRouter não deveria ser chamado')
  }

  try {
    const response = await worker.fetch(
      request('Qual é a capital da Mongólia?'),
      makeEnv(),
    )
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.match(body.response, /Não consegui responder isso com segurança/)
    assert.deepEqual(body.sources, [])
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

await test('Cache: chave muda com sourceHash e normaliza a pergunta', async () => {
  const base = {
    locale: 'pt',
    embeddingModel: '@cf/baai/bge-m3',
    question: 'Experiência com sistemas legados',
  }

  const keyA = await buildCacheKey({ ...base, sourceHash: 'hash-a' })
  const keyB = await buildCacheKey({ ...base, sourceHash: 'hash-b' })
  const keyNormalized = await buildCacheKey({
    ...base,
    question: '  EXPERIÊNCIA   com sistemas legados  ',
    sourceHash: 'hash-a',
  })

  assert.notEqual(keyA, keyB)
  assert.equal(keyA, keyNormalized)
})

await test('Cache: segunda pergunta idêntica não chama AI nem OpenRouter', async () => {
  installCache()
  const originalFetch = globalThis.fetch
  let aiCalls = 0
  let fetchCalls = 0
  const question = 'Qual a experiência com sistemas legados?'

  globalThis.fetch = async () => {
    fetchCalls += 1
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: 'Resposta cacheada [1]' } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const env = makeEnv({
    aiRun: async () => {
      aiCalls += 1
      return { data: [Array(1024).fill(0.01)] }
    },
  })
  env.MIN_SCORE = '0'

  try {
    const first = await worker.fetch(request(question), env)
    assert.equal(first.status, 200)
    assert.equal(first.headers.get('X-Assistant-Cache'), 'MISS')
    assert.equal(fetchCalls, 1)
    assert.equal(aiCalls, 1)

    const second = await worker.fetch(request(question), env)
    const body = await second.json()

    assert.equal(second.status, 200)
    assert.equal(second.headers.get('X-Assistant-Cache'), 'HIT')
    assert.equal(fetchCalls, 1)
    assert.equal(aiCalls, 1)
    assert.match(body.response, /cacheada/)
  } finally {
    globalThis.fetch = originalFetch
    delete globalThis.caches
  }
})

await test('Cota esgotada: não tenta o segundo modelo e usa Workers AI', async () => {
  installCache()
  const originalFetch = globalThis.fetch
  let openRouterCalls = 0
  const generationModels = []

  globalThis.fetch = async () => {
    openRouterCalls += 1
    return new Response(
      JSON.stringify({ error: { message: 'free-models-per-day' } }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '120',
        },
      },
    )
  }

  const env = makeEnv({
    aiRun: async (model, input) => {
      if (input?.messages) {
        generationModels.push(model)
        return { response: 'Resposta do fallback Workers AI.' }
      }
      return { data: [Array(1024).fill(0.01)] }
    },
  })
  env.MIN_SCORE = '0'
  env.MODELS = 'modelo-a:free,modelo-b:free'

  try {
    const response = await worker.fetch(
      request('Explique a atuação em sistemas legados.'),
      env,
    )
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(openRouterCalls, 1)
    assert.deepEqual(generationModels, ['@cf/meta/llama-3.1-8b-instruct-fp8'])
    assert.match(body.response, /fallback Workers AI/)
    assert.equal(response.headers.get('X-Assistant-Provider'), 'workers-ai')
    assert.ok(body.sources.length > 0)
  } finally {
    globalThis.fetch = originalFetch
    delete globalThis.caches
  }
})

await test('Todos os provedores esgotados: 429 com Retry-After', async () => {
  installCache()
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: { message: 'free-models-per-day' } }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '0',
        'Retry-After': '90',
      },
    })

  const env = makeEnv({
    aiRun: async (_model, input) => {
      if (input?.messages) throw new Error('workers-ai unavailable')
      return { data: [Array(1024).fill(0.01)] }
    },
  })
  env.MIN_SCORE = '0'

  try {
    const response = await worker.fetch(
      request('Fale sobre os projetos de IA.'),
      env,
    )
    const body = await response.json()

    assert.equal(response.status, 429)
    assert.match(body.error, /limite de uso gratuito/)
    assert.equal(response.headers.get('Retry-After'), '90')
  } finally {
    globalThis.fetch = originalFetch
    delete globalThis.caches
  }
})

await test('Cache desativado: duas chamadas iguais consultam o provedor', async () => {
  installCache()
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  const question = 'Pergunta com cache desativado?'

  globalThis.fetch = async () => {
    fetchCalls += 1
    return new Response(
      JSON.stringify({ choices: [{ message: { content: 'ok [1]' } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const env = makeEnv()
  env.MIN_SCORE = '0'
  env.ENABLE_CACHE = 'false'

  try {
    await worker.fetch(request(question), env)
    await worker.fetch(request(question), env)
    assert.equal(fetchCalls, 2)
  } finally {
    globalThis.fetch = originalFetch
    delete globalThis.caches
  }
})

await test('Modelos padrão existem em quantidade e são gratuitos', () => {
  assert.ok(DEFAULT_MODELS.length >= 2)
  assert.ok(DEFAULT_MODELS.every((model) => model.endsWith(':free')))
  assert.ok(!DEFAULT_MODELS.includes('minimax/minimax-m3.1-flash:free'))
})

await test('GET /health responde sem Origin, sem IA e ignora rate limit', async () => {
  let aiCalls = 0
  const env = makeEnv({
    aiRun: async () => {
      aiCalls += 1
      throw new Error('IA não deveria ser chamada')
    },
  })
  env.CHAT_RATE_LIMITER = {
    limit: async () => ({ success: false }),
  }

  const response = await worker.fetch(
    new Request('http://worker.test/health', { method: 'GET' }),
    env,
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.status, 'ok')
  assert.ok(body.chunkCount > 0)
  assert.ok(body.sourceHash)
  assert.equal(body.cacheEnabled, true)
  assert.ok(body.modelsConfigured >= 2)
  assert.ok(response.headers.get('X-Request-Id'))
  assert.equal(aiCalls, 0)
})

await test('Rate limit por IP retorna 429 com Retry-After sem chamar IA', async () => {
  let aiCalls = 0
  const env = makeEnv({
    aiRun: async () => {
      aiCalls += 1
      return { data: [Array(1024).fill(0.01)] }
    },
  })
  env.CHAT_RATE_LIMITER = {
    limit: async () => ({ success: false }),
  }

  const response = await worker.fetch(
    request('Qual a experiência com sistemas legados?'),
    env,
  )
  const body = await response.json()

  assert.equal(response.status, 429)
  assert.equal(response.headers.get('Retry-After'), '60')
  assert.equal(response.headers.get('X-Assistant-Stage'), 'rate-limit')
  assert.ok(response.headers.get('X-Request-Id'))
  assert.match(body.error, /limite de uso gratuito/)
  assert.equal(aiCalls, 0)
})

await test('Orçamento esgotado não chama provedor e responde 503 controlado', async () => {
  __resetCircuitBreakerForTests()
  const originalFetch = globalThis.fetch
  let fetchCalls = 0

  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('provedor não deveria ser chamado')
  }

  const env = makeEnv({
    aiRun: async (_model, input) => {
      if (input?.text) return { data: [Array(1024).fill(0.01)] }
      return { response: 'não deveria gerar' }
    },
  })
  env.MIN_SCORE = '0'
  env.ENABLE_CACHE = 'false'
  env.MODELS = 'budget-model:free'
  env.WORKER_BUDGET_MS = '1000'
  env.MIN_CALL_BUDGET_MS = '2000'

  try {
    const response = await worker.fetch(
      request('Pergunta sobre orçamento de tempo?'),
      env,
    )
    const body = await response.json()

    assert.equal(response.status, 503)
    assert.equal(response.headers.get('X-Assistant-Stage'), 'workers-ai')
    assert.ok(response.headers.get('X-Request-Id'))
    assert.match(body.error, /temporariamente indisponível/)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

await test('Circuit breaker abre após 3 falhas e evita nova chamada', async () => {
  __resetCircuitBreakerForTests()
  const originalFetch = globalThis.fetch
  let fetchCalls = 0

  globalThis.fetch = async () => {
    fetchCalls += 1
    return new Response(
      JSON.stringify({ error: { message: 'provedor fora do ar' } }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const env = makeEnv({
    aiRun: async (_model, input) => {
      if (input?.messages) return { response: 'fallback ok' }
      return { data: [Array(1024).fill(0.01)] }
    },
  })
  env.MIN_SCORE = '0'
  env.ENABLE_CACHE = 'false'
  env.MODELS = 'circuit-model:free'

  try {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await worker.fetch(
        request(`Pergunta de falha ${attempt}?`),
        env,
      )
      assert.equal(response.status, 200)
    }

    const response = await worker.fetch(request('Pergunta após breaker?'), env)
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.match(body.response, /fallback ok/)
    assert.equal(response.headers.get('X-Assistant-Provider'), 'workers-ai')
    assert.equal(fetchCalls, 3)
  } finally {
    globalThis.fetch = originalFetch
  }
})

await test('Cache negativo evita repetir embedding e provedores em 503', async () => {
  __resetCircuitBreakerForTests()
  installCache()
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  let embeddingCalls = 0
  let generationCalls = 0
  const question = 'Pergunta com cache negativo?'

  globalThis.fetch = async () => {
    fetchCalls += 1
    return new Response(
      JSON.stringify({ error: { message: 'provedor fora do ar' } }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const env = makeEnv({
    aiRun: async (_model, input) => {
      if (input?.messages) {
        generationCalls += 1
        throw new Error('workers-ai fora do ar')
      }
      embeddingCalls += 1
      return { data: [Array(1024).fill(0.01)] }
    },
  })
  env.MIN_SCORE = '0'
  env.MODELS = 'negative-model:free'

  try {
    const first = await worker.fetch(request(question), env)
    assert.equal(first.status, 503)
    assert.equal(first.headers.get('X-Assistant-Cache'), 'MISS')

    const second = await worker.fetch(request(question), env)
    const body = await second.json()

    assert.equal(second.status, 503)
    assert.equal(second.headers.get('X-Assistant-Cache'), 'NEGATIVE')
    assert.ok(second.headers.get('X-Request-Id'))
    assert.match(body.error, /temporariamente indisponível/)
    assert.equal(fetchCalls, 1)
    assert.equal(embeddingCalls, 1)
    assert.equal(generationCalls, 1)
  } finally {
    globalThis.fetch = originalFetch
    delete globalThis.caches
  }
})

await test('Retrieval com dimensão incompatível retorna 503 controlado', async () => {
  __resetCircuitBreakerForTests()
  const env = makeEnv({
    aiRun: async (_model, input) => {
      if (input?.text) return { data: [[0.1, 0.2, 0.3]] }
      return { response: 'não deveria gerar' }
    },
  })
  env.MIN_SCORE = '0'
  env.ENABLE_CACHE = 'false'

  const response = await worker.fetch(
    request('Pergunta com dimensão incompatível?'),
    env,
  )
  const body = await response.json()

  assert.equal(response.status, 503)
  assert.equal(response.headers.get('X-Assistant-Stage'), 'retrieval')
  assert.ok(response.headers.get('X-Request-Id'))
  assert.match(body.error, /temporariamente indisponível/)
})

await test('Log estruturado contém requestId, stage, timings e questionHash', async () => {
  __resetCircuitBreakerForTests()
  const originalFetch = globalThis.fetch
  const originalLog = console.log
  const logs = []

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: 'Resposta observável.' } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  console.log = (line) => {
    logs.push(String(line))
  }

  const env = makeEnv()
  env.MIN_SCORE = '0'
  env.ENABLE_CACHE = 'false'
  env.LOG_LEVEL = ''

  try {
    const response = await worker.fetch(request('Pergunta de log?'), env)
    const requestId = response.headers.get('X-Request-Id')
    const parsed = logs
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .find((entry) => entry?.event === 'assistant')

    assert.equal(response.status, 200)
    assert.ok(parsed)
    assert.equal(parsed.requestId, requestId)
    assert.equal(parsed.stage, 'openrouter')
    assert.equal(parsed.outcome, 'ok')
    assert.equal(parsed.cache, 'OFF')
    assert.match(parsed.questionHash, /^[a-f0-9]{64}$/)
    assert.ok(parsed.timings.totalMs >= 0)
    assert.ok(Array.isArray(parsed.attempts))
  } finally {
    console.log = originalLog
    globalThis.fetch = originalFetch
  }
})

console.log(
  `\nResultado: ${passed}/${passed + failed} testes do Worker passaram.`,
)

if (failed > 0) process.exit(1)
