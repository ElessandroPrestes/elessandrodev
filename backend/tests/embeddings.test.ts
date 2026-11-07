import { afterEach, describe, expect, it, vi } from 'vitest'
import { CloudflareBgeM3Embeddings } from '../src/modules/embeddings/cloudflare-bge-m3.embeddings.js'
import { OpenAiCompatibleEmbeddings } from '../src/modules/embeddings/openai-compatible.embeddings.js'
import { createEmbeddingsClient } from '../src/modules/embeddings/factory.js'
import { silentLogger } from '../src/shared/logger.js'
import { testConfig } from './helpers.js'

const vector = Array.from({ length: 1024 }, () => 0.1)

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('embeddings', () => {
  it('chama o Cloudflare Workers AI com BGE-M3 e valida 1024 dimensões', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ result: { data: [vector] } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const config = testConfig({
      EMBEDDINGS_PROVIDER: 'cloudflare',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'token',
    })
    const embeddings = new CloudflareBgeM3Embeddings(
      config,
      silentLogger(),
    )

    const result = await embeddings.embedQuery('teste')

    expect(result).toHaveLength(1024)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/accounts/account/ai/run/@cf/baai/bge-m3')
    expect(init.method).toBe('POST')
  })

  it('rejeita vetor com dimensão incompatível', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ result: { data: [Array(10).fill(0)] } })),
    )

    const config = testConfig({
      EMBEDDINGS_PROVIDER: 'cloudflare',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'token',
    })
    const embeddings = new CloudflareBgeM3Embeddings(
      config,
      silentLogger(),
    )

    await expect(embeddings.embedQuery('teste')).rejects.toMatchObject({
      code: 'EMBEDDING_DIMENSION_MISMATCH',
    })
  })

  it('repete 503 e retorna no sucesso seguinte', async () => {
    let calls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1
        if (calls === 1) {
          return jsonResponse({ error: 'unavailable' }, 503)
        }
        return jsonResponse({ result: { data: [vector] } })
      }),
    )

    const config = testConfig({
      EMBEDDINGS_PROVIDER: 'cloudflare',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'token',
    })
    const embeddings = new CloudflareBgeM3Embeddings(
      config,
      silentLogger(),
    )

    const result = await embeddings.embedQuery('teste')
    expect(result).toHaveLength(1024)
    expect(calls).toBe(2)
  })

  it('suporta endpoint OpenAI-compatible local (Ollama/vLLM)', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ data: [{ embedding: vector }] }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const config = testConfig({
      EMBEDDINGS_PROVIDER: 'openai-compatible',
      EMBEDDINGS_BASE_URL: 'http://127.0.0.1:11434/v1',
      EMBEDDINGS_MODEL: 'bge-m3',
    })
    const embeddings = new OpenAiCompatibleEmbeddings(
      config,
      silentLogger(),
    )

    const result = await embeddings.embedQuery('teste')
    expect(result).toHaveLength(1024)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://127.0.0.1:11434/v1/embeddings')
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'bge-m3',
      input: ['teste'],
    })
  })

  it('não repete 400 e não faz chamadas reais', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: 'bad request' }, 400),
    )
    vi.stubGlobal('fetch', fetchMock)

    const config = testConfig({
      EMBEDDINGS_PROVIDER: 'openai-compatible',
      EMBEDDINGS_BASE_URL: 'http://127.0.0.1:11434/v1',
      EMBEDDINGS_MODEL: 'bge-m3',
    })
    const embeddings = new OpenAiCompatibleEmbeddings(
      config,
      silentLogger(),
    )

    await expect(embeddings.embedQuery('teste')).rejects.toMatchObject({
      status: 502,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('factory escolhe unconfigured sem credenciais e endpoint quando há baseUrl', () => {
    const unconfigured = createEmbeddingsClient(
      testConfig({ EMBEDDINGS_PROVIDER: 'auto' }),
      silentLogger(),
    )
    expect(unconfigured.isConfigured()).toBe(false)

    const configured = createEmbeddingsClient(
      testConfig({
        EMBEDDINGS_PROVIDER: 'auto',
        EMBEDDINGS_BASE_URL: 'http://127.0.0.1:11434/v1',
        EMBEDDINGS_MODEL: 'bge-m3',
      }),
      silentLogger(),
    )
    expect(configured.isConfigured()).toBe(true)
  })
})
