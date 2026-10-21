import assert from 'node:assert/strict'
import worker from './index.js'

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

console.log(
  `\nResultado: ${passed}/${passed + failed} testes do Worker passaram.`,
)

if (failed > 0) process.exit(1)
