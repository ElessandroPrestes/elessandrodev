import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config/env.js'
import { testEnv } from './helpers.js'

describe('config', () => {
  it('aplica defaults seguros', () => {
    const config = loadConfig({})

    expect(config.port).toBe(3201)
    expect(config.rateLimit.enabled).toBe(true)
    expect(config.cache.enabled).toBe(true)
    expect(config.llm.models.length).toBeGreaterThan(0)
    expect(config.corsOrigins).toContain('http://localhost:5212')
    expect(config.rag.indexPath).toContain('worker/rag/index.json')
  })

  it('faz parse de listas, booleanos e trust proxy', () => {
    const config = loadConfig(
      testEnv({
        CORS_ORIGINS: 'https://a.test, https://b.test, https://a.test',
        OPENROUTER_MODELS: 'model-a, model-b, model-a',
        TRUST_PROXY: 'false',
        ENABLE_CACHE: 'false',
        RATE_LIMIT_ENABLED: 'false',
      }),
    )

    expect(config.corsOrigins).toEqual([
      'https://a.test',
      'https://b.test',
    ])
    expect(config.llm.models).toEqual(['model-a', 'model-b'])
    expect(config.trustProxy).toBe(false)
    expect(config.cache.enabled).toBe(false)
    expect(config.rateLimit.enabled).toBe(false)
  })

  it('rejeita PORT inválida', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow()
    expect(() => loadConfig({ PORT: '70000' })).toThrow()
  })

  it('mantém modo mock e embeddings desconfigurados no ambiente de teste', () => {
    const config = loadConfig(testEnv())

    expect(config.llm.mode).toBe('mock')
    expect(config.embeddings.provider).toBe('none')
  })
})
