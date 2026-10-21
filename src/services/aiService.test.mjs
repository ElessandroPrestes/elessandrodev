import assert from 'node:assert'

process.env.VITE_CHAT_API_URL = 'https://worker.test'

const { AI_CONFIG, isTransientError, calculateBackoff } = await import('../config/aiConfig.js')
const { askAssistant, streamAssistant } = await import('./aiService.js')

console.log('=== SUÍTE DE TESTES: CLIENTE DO CLOUDFLARE WORKER (Universal SDD) ===\n')

let passedTests = 0
let totalTests = 0

async function test(description, fn) {
  totalTests++
  try {
    await fn()
    console.log(`✅ [PASSOU] ${description}`)
    passedTests++
  } catch (err) {
    console.error(`❌ [FALHOU] ${description}:`, err.message)
    process.exitCode = 1
  }
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

await test('E.1: 401 é erro permanente', () => {
  const err = new Error('[401 Unauthorized] API key not valid')
  err.status = 401
  assert.strictEqual(isTransientError(err), false)
})

await test('E.2: 404 é erro permanente', () => {
  const err = new Error('not found [404]')
  err.status = 404
  assert.strictEqual(isTransientError(err), false)
})

await test('E.3: 413 é erro permanente', () => {
  const err = new Error('Payload muito grande.')
  err.status = 413
  assert.strictEqual(isTransientError(err), false)
})

await test('B.1: 503 é transitório', () => {
  const err = new Error('high demand [503]')
  err.status = 503
  assert.strictEqual(isTransientError(err), true)
})

await test('B.2: 429 é transitório', () => {
  const err = new Error('rate limit [429]')
  err.status = 429
  assert.strictEqual(isTransientError(err), true)
})

await test('B.3: timeout e rede são transitórios', () => {
  const timeoutErr = new Error('Timeout exceeded')
  timeoutErr.name = 'TimeoutError'
  const networkErr = new Error('Failed to fetch')
  assert.strictEqual(isTransientError(timeoutErr), true)
  assert.strictEqual(isTransientError(networkErr), true)
})

await test('Calcula backoff exponencial com jitter bounded', () => {
  const b1 = calculateBackoff(1, 100)
  const b2 = calculateBackoff(2, 100)
  const b3 = calculateBackoff(3, 100)
  assert.ok(b1 >= 100 && b1 <= 300, `b1=${b1}`)
  assert.ok(b2 >= 200 && b2 <= 400, `b2=${b2}`)
  assert.ok(b3 >= 400 && b3 <= 600, `b3=${b3}`)
})

await test('Sucesso: envia apenas { question, locale } e retorna fontes', async () => {
  let captured = null
  AI_CONFIG.chatApiUrl = 'https://worker.test'

  globalThis.fetch = async (url, init) => {
    captured = { url, init }
    return jsonResponse({
      response: 'Resposta fundamentada [1]',
      sources: [{ section: 'Stack — Cloud', source: 'knowledge/rag/00-perfil.md', score: 0.91 }],
    })
  }

  const result = await askAssistant('Quais clouds?', 'en')

  assert.strictEqual(captured.url, 'https://worker.test')
  assert.strictEqual(captured.init.method, 'POST')
  assert.strictEqual(captured.init.headers['Content-Type'], 'application/json')
  assert.deepStrictEqual(JSON.parse(captured.init.body), { question: 'Quais clouds?', locale: 'en' })
  assert.strictEqual(result.response, 'Resposta fundamentada [1]')
  assert.strictEqual(result.sources.length, 1)
  assert.strictEqual(result.sources[0].score, 0.91)
})

await test('Retry: 503 seguido de 200 preserva a resposta', async () => {
  let calls = 0
  const statuses = []
  AI_CONFIG.chatApiUrl = 'https://worker.test'

  globalThis.fetch = async () => {
    calls++
    if (calls === 1) return jsonResponse({ error: 'Serviço indisponível.' }, 503)
    return jsonResponse({ response: 'ok', sources: [] })
  }

  const result = await askAssistant('q', 'pt', {
    maxRetries: 1,
    backoffBaseMs: 1,
    onStatus: (status) => statuses.push(status),
  })

  assert.strictEqual(calls, 2)
  assert.strictEqual(result.response, 'ok')
  assert.ok(statuses.length >= 1)
})

await test('429: esgota retries e expõe mensagem amigável do Worker', async () => {
  let calls = 0
  AI_CONFIG.chatApiUrl = 'https://worker.test'

  globalThis.fetch = async () => {
    calls++
    return jsonResponse({ error: 'Muitas requisições. Tente novamente em instantes.' }, 429)
  }

  await assert.rejects(
    () => askAssistant('q', 'pt', { maxRetries: 1, backoffBaseMs: 1 }),
    (err) => {
      assert.strictEqual(err.status, 429)
      assert.match(err.userMessage, /Muitas requisições/)
      return true
    }
  )

  assert.strictEqual(calls, 2)
})

await test('400: não faz retry e mantém a mensagem do Worker', async () => {
  let calls = 0
  AI_CONFIG.chatApiUrl = 'https://worker.test'

  globalThis.fetch = async () => {
    calls++
    return jsonResponse({ error: 'Pergunta obrigatória.' }, 400)
  }

  await assert.rejects(
    () => askAssistant('q', 'pt', { maxRetries: 2, backoffBaseMs: 1 }),
    (err) => {
      assert.strictEqual(err.status, 400)
      assert.strictEqual(err.userMessage, 'Pergunta obrigatória.')
      return true
    }
  )

  assert.strictEqual(calls, 1)
})

await test('Resposta vazia vira 502 transitório', async () => {
  let calls = 0
  AI_CONFIG.chatApiUrl = 'https://worker.test'

  globalThis.fetch = async () => {
    calls++
    return jsonResponse({ response: '   ', sources: [] })
  }

  await assert.rejects(
    () => askAssistant('q', 'pt', { maxRetries: 1, backoffBaseMs: 1 }),
    (err) => {
      assert.strictEqual(err.status, 502)
      return true
    }
  )

  assert.strictEqual(calls, 2)
})

await test('Rede: erro transitório é repetido', async () => {
  let calls = 0
  AI_CONFIG.chatApiUrl = 'https://worker.test'

  globalThis.fetch = async () => {
    calls++
    if (calls === 1) throw new TypeError('Failed to fetch')
    return jsonResponse({ response: 'ok', sources: [] })
  }

  const result = await askAssistant('q', 'pt', { maxRetries: 1, backoffBaseMs: 1 })
  assert.strictEqual(calls, 2)
  assert.strictEqual(result.response, 'ok')
})

await test('Timeout: retorna código TIMEOUT e status 504', async () => {
  AI_CONFIG.chatApiUrl = 'https://worker.test'

  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      reject(err)
    })
  })

  await assert.rejects(
    () => askAssistant('q', 'pt', { timeoutMs: 10, maxRetries: 0 }),
    (err) => {
      assert.strictEqual(err.code, 'TIMEOUT')
      assert.strictEqual(err.status, 504)
      return true
    }
  )
})

await test('URL ausente: erro de configuração sem chamada de rede', async () => {
  const previousUrl = AI_CONFIG.chatApiUrl
  AI_CONFIG.chatApiUrl = ''

  let called = false
  globalThis.fetch = async () => {
    called = true
    return jsonResponse({ response: 'ok', sources: [] })
  }

  await assert.rejects(
    () => askAssistant('q', 'pt'),
    (err) => {
      assert.strictEqual(err.code, 'MISSING_CHAT_API_URL')
      assert.match(err.userMessage, /VITE_CHAT_API_URL/)
      return true
    }
  )

  assert.strictEqual(called, false)
  AI_CONFIG.chatApiUrl = previousUrl
})

await test('Compatibilidade: streamAssistant emite o texto completo uma vez', async () => {
  AI_CONFIG.chatApiUrl = 'https://worker.test'

  globalThis.fetch = async () => jsonResponse({ response: 'texto completo', sources: [] })

  let tokens = 0
  const text = await streamAssistant('q', 'pt', {
    onToken: (token, fullText) => {
      tokens++
      assert.strictEqual(token, 'texto completo')
      assert.strictEqual(fullText, 'texto completo')
    },
  })

  assert.strictEqual(tokens, 1)
  assert.strictEqual(text, 'texto completo')
})

console.log(`\nResultado: ${passedTests}/${totalTests} testes passaram.`)

if (passedTests !== totalTests) {
  process.exitCode = 1
}
