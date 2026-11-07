import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { ProviderUnavailableError, RateLimitedError } from '../src/shared/errors.js'
import {
  createTestContext,
  fakeEmbeddings,
  fakeLlm,
  fakeRetriever,
  loadTestIndex,
  makeDocument,
} from './helpers.js'

const validPayload = {
  question: 'Quais tecnologias de backend Elessandro domina?',
  locale: 'pt',
}

describe('HTTP /api/chat', () => {
  it('expõe health e readiness sem secrets', async () => {
    const context = await createTestContext()

    const health = await request(context.app).get('/health').expect(200)
    expect(health.body).toMatchObject({
      status: 'ok',
      chunkCount: 36,
      sourceHash: expect.any(String),
    })
    expect(JSON.stringify(health.body)).not.toMatch(/OPENROUTER|CLOUDFLARE|token/i)

    const ready = await request(context.app).get('/ready').expect(200)
    expect(ready.body).toMatchObject({
      status: 'ready',
      checks: { index: true, embeddings: true, llm: true },
    })
  })

  it('responde pergunta válida com metadados e cache MISS', async () => {
    const context = await createTestContext()

    const response = await request(context.app)
      .post('/api/chat')
      .send(validPayload)
      .expect(200)

    expect(response.body.response).toBe(
      'Resposta de teste fundamentada [1]',
    )
    expect(response.body.sources).toHaveLength(1)
    expect(response.headers['x-request-id']).toBeTruthy()
    expect(response.headers['x-assistant-cache']).toBe('MISS')
    expect(response.headers['x-assistant-provider']).toBe('test')
    expect(response.headers['x-assistant-stage']).toBe('test')
  })

  it('serve a segunda pergunta idêntica do cache', async () => {
    const context = await createTestContext()

    await request(context.app).post('/api/chat').send(validPayload).expect(200)
    const second = await request(context.app)
      .post('/api/chat')
      .send(validPayload)
      .expect(200)

    expect(second.headers['x-assistant-cache']).toBe('HIT')
    expect(second.headers['x-assistant-stage']).toBe('cache')
    expect(second.headers['x-assistant-provider']).toBe('cache')
    const invoke = context.retriever.invoke as unknown as {
      mock: { calls: unknown[] }
    }
    expect(invoke.mock.calls).toHaveLength(1)
  })

  it('responde contato sem chamar retrieval nem LLM', async () => {
    const context = await createTestContext()

    const response = await request(context.app)
      .post('/api/chat')
      .send({ question: 'Como entro em contato?', locale: 'pt' })
      .expect(200)

    expect(response.body.response).toContain('elessandrodev@gmail.com')
    expect(response.body.sources).toEqual([])
    expect(response.headers['x-assistant-cache']).toBe('OFF')
    expect(response.headers['x-assistant-stage']).toBe('contact')
    expect(context.retriever.invoke).not.toHaveBeenCalled()
    expect(context.llm.generate).not.toHaveBeenCalled()
  })

  it('valida entrada e devolve mensagens localizadas', async () => {
    const context = await createTestContext()

    const empty = await request(context.app)
      .post('/api/chat')
      .send({ question: '   ', locale: 'pt' })
      .expect(400)
    expect(empty.body.error).toBe('Pergunta obrigatória.')
    expect(empty.headers['x-request-id']).toBeTruthy()

    const long = await request(context.app)
      .post('/api/chat')
      .send({ question: 'a'.repeat(501), locale: 'pt' })
      .expect(400)
    expect(long.body.error).toBe('Pergunta muito longa.')

    const locale = await request(context.app)
      .post('/api/chat')
      .send({ question: 'Qual a stack?', locale: 'fr' })
      .expect(400)
    expect(locale.body.error).toMatch(/Idioma inválido/)
  })

  it('rejeita payload acima do limite', async () => {
    const context = await createTestContext()

    const response = await request(context.app)
      .post('/api/chat')
      .send({ question: `a${'b'.repeat(5000)}`, locale: 'pt' })
      .expect(413)

    expect(response.body.error).toBeTruthy()
  })

  it('aplica allowlist de CORS e bloqueia origem desconhecida', async () => {
    const context = await createTestContext()

    const allowed = await request(context.app)
      .get('/health')
      .set('Origin', 'http://localhost:5212')
      .expect(200)
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5212',
    )

    const blocked = await request(context.app)
      .get('/health')
      .set('Origin', 'https://evil.example')
      .expect(403)
    expect(blocked.body.error).toBe('Origem não permitida.')
  })

  it('retorna 405 para métodos não permitidos e 404 para rota inexistente', async () => {
    const context = await createTestContext()

    const method = await request(context.app).get('/api/chat').expect(405)
    expect(method.headers.allow).toBe('POST, OPTIONS')

    await request(context.app).get('/nao-existe').expect(404)
  })

  it('devolve 503 genérico e faz cache negativo em falha do provedor', async () => {
    const context = await createTestContext({
      llm: fakeLlm({
        error: new ProviderUnavailableError('openrouter down', {
          stage: 'openrouter',
          status: 503,
        }),
      }),
    })

    const first = await request(context.app)
      .post('/api/chat')
      .send(validPayload)
      .expect(503)
    expect(first.headers['x-assistant-stage']).toBe('openrouter')
    expect(first.headers['x-assistant-cache']).toBe('MISS')
    expect(first.body.error).toMatch(/temporariamente indisponível/)
    expect(JSON.stringify(first.body)).not.toContain('openrouter down')

    const second = await request(context.app)
      .post('/api/chat')
      .send(validPayload)
      .expect(503)
    expect(second.headers['x-assistant-cache']).toBe('NEGATIVE')
    const invoke = context.retriever.invoke as unknown as {
      mock: { calls: unknown[] }
    }
    expect(invoke.mock.calls).toHaveLength(1)
  })

  it('propaga 429 com Retry-After sem cache negativo', async () => {
    const context = await createTestContext({
      llm: fakeLlm({
        error: new RateLimitedError('openrouter limit', 120, 'openrouter'),
      }),
    })

    const response = await request(context.app)
      .post('/api/chat')
      .send(validPayload)
      .expect(429)

    expect(response.headers['retry-after']).toBe('120')
    expect(response.headers['x-assistant-stage']).toBe('openrouter')
    expect(response.headers['x-assistant-cache']).toBe('MISS')
  })

  it('retorna 503 quando embeddings não estão configurados', async () => {
    const index = await loadTestIndex()
    const context = await createTestContext({
      embeddings: fakeEmbeddings(index.chunks[0].vector, false),
    })

    const response = await request(context.app)
      .post('/api/chat')
      .send(validPayload)
      .expect(503)

    expect(response.headers['x-assistant-stage']).toBe('embedding')
    expect(response.body.error).toMatch(/temporariamente indisponível/)
  })

  it('usa resposta segura quando não há trechos recuperados', async () => {
    const context = await createTestContext({
      retriever: fakeRetriever([]),
    })

    const response = await request(context.app)
      .post('/api/chat')
      .send(validPayload)
      .expect(200)

    expect(response.body.sources).toEqual([])
    expect(response.headers['x-assistant-cache']).toBe('OFF')
    expect(response.headers['x-assistant-provider']).toBe('safe-fallback')
    expect(context.llm.generate).not.toHaveBeenCalled()
  })

  it('ecoa X-Request-Id válido e substitui inválido', async () => {
    const context = await createTestContext()

    const echoed = await request(context.app)
      .post('/api/chat')
      .set('X-Request-Id', 'req-test-123')
      .send(validPayload)
      .expect(200)
    expect(echoed.headers['x-request-id']).toBe('req-test-123')
    expect(echoed.body.requestId).toBeUndefined()

    const invalid = await request(context.app)
      .get('/health')
      .set('X-Request-Id', '<script>alert(1)</script>')
      .expect(200)
    expect(invalid.headers['x-request-id']).not.toContain('<')
  })

  it('aplica rate limit configurado', async () => {
    const context = await createTestContext({
      configOverrides: {
        RATE_LIMIT_ENABLED: 'true',
        RATE_LIMIT_WINDOW_MS: '60000',
        CHAT_RATE_LIMIT_MAX: '2',
      },
    })

    await request(context.app).post('/api/chat').send(validPayload).expect(200)
    await request(context.app).post('/api/chat').send(validPayload).expect(200)
    const blocked = await request(context.app)
      .post('/api/chat')
      .send(validPayload)
      .expect(429)

    expect(blocked.headers['retry-after']).toBe('60')
    expect(blocked.headers['x-assistant-stage']).toBe('rate-limit')
  })

  it('mantém os aliases /chat e documents com metadados', async () => {
    const context = await createTestContext({
      retriever: fakeRetriever([
        makeDocument('Node.js e TypeScript.', {
          section: 'Stack',
          source: 'knowledge/rag/02-stack.md',
          score: 0.8,
        }),
      ]),
    })

    const response = await request(context.app)
      .post('/chat')
      .send(validPayload)
      .expect(200)

    expect(response.body.sources[0]).toEqual({
      section: 'Stack',
      source: 'knowledge/rag/02-stack.md',
      score: 0.8,
    })
  })
})
