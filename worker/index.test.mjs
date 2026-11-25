import assert from 'node:assert/strict'
import worker, { __resetCircuitBreakerForTests } from './index.js'
import { buildCacheKey } from './cache.js'
import { test } from 'node:test'
import { createCircuitBreaker } from './circuit.js'

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
    request('How can I get in touch directly with Elessandro?', { locale: 'pt' }),
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


const QUESTION = 'Experiência com sistemas legados'
const REDIS_URL = 'https://redis.example.test'
const REDIS_ENV = {
  UPSTASH_REDIS_REST_URL: REDIS_URL,
  UPSTASH_REDIS_REST_TOKEN: 'test-token',
  VISITOR_HASH_SECRET: 'test-secret',
}

function stubServices(t, { primary, alternative, redisUnavailable, redisDelay, now } = {}) {
  __resetCircuitBreakerForTests()
  const values = new Map()
  const counters = new Map()
  const calls = { embedding: 0, primary: 0, alternative: 0, redis: 0 }
  const circuit = createCircuitBreaker({ threshold: 3, cooldownMs: 1000, now })
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url !== REDIS_URL) {
      calls.primary++
      return primary?.(options) ?? Response.json({
        choices: [{ message: { content: 'Resposta do OpenRouter.' }, finish_reason: 'stop' }],
      })
    }

    calls.redis++
    if (redisDelay) await waitForAbort(options.signal)
    if (redisUnavailable) return new Response(null, { status: 503 })
    const [command, keyOrScript, valueOrKeyCount, redisKey, op, , ticket, outcome] = JSON.parse(options.body)
    if (command === 'GET') return Response.json({ result: values.get(keyOrScript) ?? null })
    if (command === 'SET') {
      assert.equal(redisKey, 'EX')
      assert.equal(op, 86400)
      values.set(keyOrScript, valueOrKeyCount)
      return Response.json({ result: 'OK' })
    }
    assert.equal(command, 'EVAL')
    if (redisKey.includes(':breaker:')) {
      const result = op === 'acquire' ? circuit.acquire() : circuit.finish(ticket, outcome)
      return Response.json({ result })
    }
    assert.match(redisKey, /visitor:v1:[a-f0-9]{64}$/)
    assert.equal(op, 60)
    const count = (counters.get(redisKey) ?? 0) + 1
    counters.set(redisKey, count)
    return Response.json({ result: count })
  })
  const env = {
    ...makeEnv({ aiRun: async (_model, input) => {
      if (input.text) {
        calls.embedding++
        return { data: [Array(1024).fill(0.01)] }
      }
      calls.alternative++
      return alternative?.(_model) ?? { response: 'Resposta do Workers AI.', usage: { completion_tokens: 8 } }
    } }),
    ...REDIS_ENV,
    MIN_SCORE: '0',
  }
  return { values, calls, env }
}

function quota() {
  return Response.json({ error: { message: 'free-models-per-day' } }, { status: 429 })
}

function waitForAbort(signal) {
  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

await test('Cache: normaliza acentos, artigos e pontuação e preserva negações e termos técnicos', async () => {
  const key = (question, revision = 'a', locale = 'pt') => buildCacheKey({ question, revision, locale })
  const original = await key('Experiência com os sistemas legados?')
  assert.equal(original, await key(' EXPERIENCIA, com sistemas   legados!! '))
  assert.notEqual(original, await key('Experiência com sistemas legados', 'b'))
  assert.notEqual(original, await key('Experiência com sistemas legados', 'a', 'en'))
  assert.notEqual(original, await key('Não experiência com sistemas legados'))
  assert.notEqual(await key('C++'), await key('C#'))
})

await test('Cache: miss grava resposta completa; hit durante cota pula embeddings, limiter e LLM', async (t) => {
  let exhausted = false
  const { env, calls, values } = stubServices(t, {
    primary: () => exhausted ? quota() : undefined,
  })
  const miss = await worker.fetch(request(QUESTION), env)
  assert.equal(miss.headers.get('X-Assistant-Cache'), 'MISS')
  const generated = await miss.json()
  assert.equal(generated.origin, 'llm')
  assert.equal(generated.provider, 'openrouter')
  assert.ok(Number.isFinite(Date.parse(generated.timestamp)))
  assert.equal(values.size, 1)

  exhausted = true
  const previous = { ...calls }
  const hit = await worker.fetch(request('Experiencia com os sistemas legados?'), env)
  assert.equal(hit.headers.get('X-Assistant-Cache'), 'HIT')
  assert.deepEqual(await hit.json(), { ...generated, origin: 'cache' })
  assert.deepEqual(calls, { ...previous, redis: previous.redis + 1 })
})

await test('Cota 429: Worker AI gera e sua resposta fica em cache', async (t) => {
  const { env, calls, values } = stubServices(t, {
    primary: quota,
    alternative: (model) => {
      assert.equal(model, '@cf/google/gemma-4-26b-a4b-it')
      return { choices: [{ message: { content: 'Resposta do Gemma.' }, finish_reason: 'stop' }] }
    },
  })
  const response = await worker.fetch(request(QUESTION), env)
  const answer = await response.json()
  assert.equal(answer.origin, 'llm')
  assert.equal(answer.provider, 'workers-ai')
  assert.equal(answer.response, 'Resposta do Gemma.')
  assert.equal(calls.primary, 1)
  assert.equal(calls.alternative, 1)
  assert.equal(values.size, 1)
})

await test('Cota 429 sem alternativo: retorna trechos e não cacheia degradação', async (t) => {
  const { env, calls, values } = stubServices(t, { primary: quota })
  env.WORKERS_AI_MODEL = ''
  const response = await worker.fetch(request(QUESTION), env)
  const answer = await response.json()
  assert.equal(response.status, 200)
  assert.equal(answer.origin, 'retrieval-only')
  assert.match(answer.response, /trechos relevantes do currículo/)
  assert.ok(answer.sources.length > 0)
  assert.equal(calls.alternative, 0)
  assert.equal(values.size, 0)
})

await test('5xx em ambos os provedores: devolve trechos em cada miss', async (t) => {
  const { env, calls, values } = stubServices(t, {
    primary: () => new Response(null, { status: 503 }),
    alternative: () => { throw new Error('detalhe sensível') },
  })
  for (let i = 0; i < 2; i++) {
    const response = await worker.fetch(request(QUESTION), env)
    const answer = await response.json()
    assert.equal(answer.origin, 'retrieval-only')
    assert.doesNotMatch(answer.response, /detalhe sensível/)
  }
  assert.equal(calls.embedding, 2)
  assert.equal(values.size, 0)
})

await test('Timeout do OpenRouter chama o alternativo dentro do orçamento', async (t) => {
  const { env, calls } = stubServices(t, {
    primary: ({ signal }) => waitForAbort(signal),
  })
  env.OPENROUTER_TIMEOUT_MS = '100'
  env.MIN_CALL_BUDGET_MS = '100'
  const keepEventLoop = setTimeout(() => {}, 1000)
  try {
    const response = await worker.fetch(request(QUESTION), env)
    assert.equal((await response.json()).provider, 'workers-ai')
    assert.equal(calls.primary, 1)
    assert.equal(calls.alternative, 1)
  } finally {
    clearTimeout(keepEventLoop)
  }
})

await test('Orçamento esgotado preserva a resposta com trechos e pula a geração', async (t) => {
  const { env, calls } = stubServices(t)
  env.WORKER_BUDGET_MS = '1000'
  env.MIN_CALL_BUDGET_MS = '2000'
  const response = await worker.fetch(request(QUESTION), env)
  assert.equal((await response.json()).origin, 'retrieval-only')
  assert.equal(calls.primary, 0)
  assert.equal(calls.alternative, 0)
})

await test('Breaker: três 429 abrem o circuito; sondagem concorrente única fecha após sucesso', async (t) => {
  let now = 10000
  let releaseProbe
  let probeStarted
  const started = new Promise((resolve) => { probeStarted = resolve })
  const { env, calls } = stubServices(t, {
    now: () => now,
    primary: () => {
      if (now < 11000) return quota()
      return new Promise((resolve) => { releaseProbe = resolve; probeStarted() })
    },
  })
  env.ENABLE_CACHE = 'false'
  for (let i = 0; i < 3; i++) {
    assert.equal((await (await worker.fetch(request(QUESTION), env)).json()).provider, 'workers-ai')
  }
  const blocked = await worker.fetch(request(QUESTION), env)
  assert.equal((await blocked.json()).provider, 'workers-ai')
  assert.equal(calls.primary, 3)

  now += 1000
  const probe = worker.fetch(request(QUESTION), env)
  await started
  const concurrent = await worker.fetch(request(QUESTION), env)
  assert.equal((await concurrent.json()).provider, 'workers-ai')
  assert.equal(calls.primary, 4)
  releaseProbe(Response.json({ choices: [{ message: { content: 'Recuperado' } }] }))
  assert.equal((await (await probe).json()).provider, 'openrouter')
  assert.equal(calls.primary, 4)
})

await test('Breaker: sondagem com falha reabre e resposta atrasada não fecha o circuito', () => {
  let now = 10000
  const breaker = createCircuitBreaker({ threshold: 1, cooldownMs: 1000, now: () => now })
  const first = breaker.acquire()
  assert.equal(breaker.finish(first, 'failure'), 'open')
  now += 1000
  const probe = breaker.acquire()
  assert.match(probe, /^probe:/)
  assert.equal(breaker.finish(first, 'success'), 'stale')
  assert.equal(breaker.finish(probe, 'failure'), 'open')
  now += 999
  assert.equal(breaker.acquire(), 'open')
  now++
  assert.equal(breaker.finish(breaker.acquire(), 'success'), 'closed')
  assert.match(breaker.acquire(), /^closed:/)
})

await test('Redis fora do ar: registra um aviso e segue com OpenRouter', async (t) => {
  const { env, calls } = stubServices(t, { redisUnavailable: true })
  const logs = []
  t.mock.method(console, 'warn', (message) => logs.push(JSON.parse(message)))
  t.mock.method(console, 'log', () => {})
  env.LOG_LEVEL = ''
  const response = await worker.fetch(request(QUESTION), env)
  assert.equal((await response.json()).provider, 'openrouter')
  assert.equal(response.headers.get('X-Assistant-Cache'), 'OFF')
  assert.equal(calls.redis, 1)
  assert.equal(logs.length, 1)
  assert.equal(logs[0].stage, 'redis')
  assert.equal(logs[0].outcome, 'unavailable')
  assert.ok(logs[0].requestId)
})

await test('Timeout do Redis: segue sem repetir operações Redis na requisição', async (t) => {
  const { env, calls } = stubServices(t, { redisDelay: true })
  env.REDIS_TIMEOUT_MS = '50'
  const keepEventLoop = setTimeout(() => {}, 1000)
  try {
    const response = await worker.fetch(request(QUESTION), env)
    assert.equal((await response.json()).origin, 'llm')
    assert.equal(calls.redis, 1)
  } finally {
    clearTimeout(keepEventLoop)
  }
})

await test('Rate limit Redis: limita geração e permite cache ou trechos', async (t) => {
  const { env, calls } = stubServices(t)
  env.CHAT_RATE_LIMIT_MAX = '1'
  await worker.fetch(request(QUESTION), env)
  const hit = await worker.fetch(request(QUESTION), env)
  const limited = await worker.fetch(request('Arquitetura e concorrência'), env)
  assert.equal((await hit.json()).origin, 'cache')
  const body = await limited.json()
  assert.equal(body.origin, 'retrieval-only')
  assert.match(body.response, /várias perguntas/)
  assert.equal(calls.primary, 1)
  assert.equal(calls.alternative, 0)
})

await test('Rate limit nativo preserva a proteção quando Redis falha', async (t) => {
  const { env, calls } = stubServices(t, { redisUnavailable: true })
  env.CHAT_RATE_LIMITER = { limit: async () => ({ success: false }) }
  const response = await worker.fetch(request(QUESTION), env)
  assert.equal((await response.json()).origin, 'retrieval-only')
  assert.equal(calls.primary, 0)
})

await test('Respostas truncadas de ambos os provedores não entram no cache', async (t) => {
  const { env, values } = stubServices(t, {
    primary: () => Response.json({ choices: [{ message: { content: 'Truncada' }, finish_reason: 'length' }] }),
    alternative: () => ({ response: 'Truncada', finish_reason: 'length' }),
  })
  const response = await worker.fetch(request(QUESTION), env)
  assert.equal((await response.json()).origin, 'retrieval-only')
  assert.equal(values.size, 0)
})

await test('Geração sem metadados de completude é exibida e fica fora do cache', async (t) => {
  const { env, values } = stubServices(t, {
    primary: quota,
    alternative: () => ({ response: 'Resposta ao vivo.' }),
  })
  const response = await worker.fetch(request(QUESTION), env)
  assert.equal((await response.json()).origin, 'llm')
  assert.equal(response.headers.get('X-Assistant-Cache'), 'OFF')
  assert.equal(values.size, 0)
})

await test('Sem nenhum LLM configurado, executa a busca e devolve trechos', async (t) => {
  const { env, calls } = stubServices(t)
  delete env.OPENROUTER_API_KEY
  env.WORKERS_AI_MODEL = ''
  const response = await worker.fetch(request(QUESTION), env)
  assert.equal((await response.json()).origin, 'retrieval-only')
  assert.equal(calls.embedding, 1)
  assert.equal(calls.primary, 0)
  assert.equal(calls.alternative, 0)
})

await test('Falha total do retrieval devolve LinkedIn e e-mail, sem erro do serviço', async (t) => {
  const { env, calls, values } = stubServices(t)
  env.AI.run = async () => { throw new Error('detalhe sensível') }
  const response = await worker.fetch(request(QUESTION), env)
  const answer = await response.json()
  assert.equal(response.status, 200)
  assert.equal(answer.origin, 'contact')
  assert.match(answer.response, /linkedin\.com/)
  assert.match(answer.response, /elessandrodev@gmail\.com/)
  assert.doesNotMatch(answer.response, /detalhe sensível/)
  assert.equal(calls.primary, 0)
  assert.equal(values.size, 0)
})

await test('Dimensão de embedding incompatível retorna contato', async (t) => {
  const { env } = stubServices(t)
  env.AI.run = async () => ({ data: [[0.1, 0.2, 0.3]] })
  const response = await worker.fetch(request(QUESTION), env)
  assert.equal((await response.json()).origin, 'contact')
})

await test('Logs correlacionam cache, provedor, breaker e origem sem pergunta ou segredo', async (t) => {
  const { env } = stubServices(t, { primary: quota })
  const logs = []
  t.mock.method(console, 'log', (line) => logs.push(JSON.parse(line)))
  env.LOG_LEVEL = ''
  const response = await worker.fetch(request(QUESTION), env)
  assert.ok(logs.every((entry) => entry.requestId === response.headers.get('X-Request-Id')))
  assert.ok(logs.some((entry) => entry.stage === 'cache' && entry.outcome === 'miss'))
  assert.ok(logs.some((entry) => entry.stage === 'breaker' && entry.outcome === 'closed'))
  assert.ok(logs.some((entry) => entry.provider === 'openrouter' && entry.outcome === 'quota'))
  assert.ok(logs.some((entry) => entry.provider === 'workers-ai' && entry.origin === 'llm'))
  assert.ok(logs.every((entry) => !JSON.stringify(entry).includes(QUESTION)))
  assert.ok(logs.every((entry) => !JSON.stringify(entry).includes(REDIS_ENV.VISITOR_HASH_SECRET)))
})
