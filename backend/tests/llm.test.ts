import { describe, expect, it, vi } from 'vitest'
import { RunnableLambda } from '@langchain/core/runnables'
import { LangChainOpenRouterClient } from '../src/modules/llm/langchain-openrouter.client.js'
import { createCircuitBreaker } from '../src/shared/circuit-breaker.js'
import { silentLogger } from '../src/shared/logger.js'
import { testConfig } from './helpers.js'

function config(overrides: Record<string, string> = {}) {
  return testConfig({
    LLM_MODE: 'openrouter',
    OPENROUTER_API_KEY: 'test-key',
    OPENROUTER_MODELS: 'model-a,model-b',
    LLM_MAX_ATTEMPTS_PER_MODEL: '2',
    OPENROUTER_TIMEOUT_MS: '1000',
    ...overrides,
  })
}

function clientWith(
  chainFactory: (model: string) => unknown,
  overrides: Record<string, string> = {},
) {
  return new LangChainOpenRouterClient(
    config(overrides),
    silentLogger(),
    createCircuitBreaker({ threshold: 1, cooldownMs: 60000 }),
    chainFactory as never,
  )
}

describe('LangChain OpenRouter client', () => {
  it('usa LangChain para gerar a resposta', async () => {
    const client = clientWith((model) =>
      RunnableLambda.from(async () => `Resposta de ${model}`),
    )

    const result = await client.generate({ system: 's', user: 'u' })

    expect(result.text).toBe('Resposta de model-a')
    expect(result.provider).toBe('openrouter')
    expect(result.model).toBe('model-a')
    expect(result.attempts[0]?.ok).toBe(true)
  })

  it('faz fallback para o próximo modelo após 503', async () => {
    const calls: string[] = []
    const client = clientWith((model) =>
      RunnableLambda.from(async () => {
        calls.push(model)
        if (model === 'model-a') {
          throw Object.assign(new Error('unavailable'), { status: 503 })
        }
        return 'ok do fallback'
      }),
    )

    const result = await client.generate({ system: 's', user: 'u' })

    expect(result.text).toBe('ok do fallback')
    expect(result.model).toBe('model-b')
    expect(calls).toEqual(['model-a', 'model-a', 'model-b'])
  })

  it('não repete 429 no mesmo modelo e tenta o próximo', async () => {
    const calls: string[] = []
    const client = clientWith((model) =>
      RunnableLambda.from(async () => {
        calls.push(model)
        if (model === 'model-a') {
          throw Object.assign(new Error('rate limited'), { status: 429 })
        }
        return 'ok'
      }),
    )

    const result = await client.generate({ system: 's', user: 'u' })

    expect(result.model).toBe('model-b')
    expect(calls).toEqual(['model-a', 'model-b'])
  })

  it('retorna RateLimitedError quando todos os modelos são 429', async () => {
    const client = clientWith(() =>
      RunnableLambda.from(async () => {
        throw Object.assign(new Error('rate limited'), { status: 429 })
      }),
    )

    await expect(
      client.generate({ system: 's', user: 'u' }),
    ).rejects.toMatchObject({ status: 429, code: 'RATE_LIMITED' })
  })

  it('não tenta fallback em falha de autenticação', async () => {
    const calls: string[] = []
    const client = clientWith((model) =>
      RunnableLambda.from(async () => {
        calls.push(model)
        throw Object.assign(new Error('unauthorized'), { status: 401 })
      }),
    )

    await expect(
      client.generate({ system: 's', user: 'u' }),
    ).rejects.toMatchObject({ code: 'LLM_AUTH_FAILED' })
    expect(calls).toEqual(['model-a'])
  })

  it('abre o circuito e ignora o modelo na chamada seguinte', async () => {
    const factory = vi.fn((model: string) =>
      RunnableLambda.from(async () => {
        throw Object.assign(new Error(`down ${model}`), { status: 503 })
      }),
    )
    const client = clientWith(factory, {
      OPENROUTER_MODELS: 'model-a',
      LLM_MAX_ATTEMPTS_PER_MODEL: '1',
    })

    await expect(
      client.generate({ system: 's', user: 'u' }),
    ).rejects.toMatchObject({ status: 503 })

    await expect(
      client.generate({ system: 's', user: 'u' }),
    ).rejects.toMatchObject({ status: 503 })

    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('rejeita resposta vazia e faz fallback', async () => {
    const client = clientWith((model) =>
      RunnableLambda.from(async () =>
        model === 'model-a' ? '   ' : 'resposta válida',
      ),
    )

    const result = await client.generate({ system: 's', user: 'u' })
    expect(result.model).toBe('model-b')
  })

  it('aplica timeout na chamada do provedor', async () => {
    const client = clientWith(
      () =>
        RunnableLambda.from(async (_input, runnableConfig) => {
          return new Promise<string>((_resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('late')), 5000)
            runnableConfig?.signal?.addEventListener('abort', () => {
              clearTimeout(timer)
              reject(new DOMException('Aborted', 'AbortError'))
            })
          })
        }),
      { LLM_MAX_ATTEMPTS_PER_MODEL: '1' },
    )

    await expect(
      client.generate({ system: 's', user: 'u' }),
    ).rejects.toMatchObject({ status: 504 })
  })
})
