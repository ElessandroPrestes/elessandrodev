import assert from 'node:assert/strict'
import worker from './index.js'
import { buildCacheKey } from './cache.js'

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

console.log(
  `\nResultado: ${passed}/${passed + failed} testes do Worker passaram.`,
)

if (failed > 0) process.exit(1)
