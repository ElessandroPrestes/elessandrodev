import { describe, expect, it, vi } from 'vitest'
import {
  calculateBackoff,
  isTransientError,
  retryWithBackoff,
} from '../src/shared/retry.js'
import { createCircuitBreaker } from '../src/shared/circuit-breaker.js'

describe('retry e circuit breaker', () => {
  it('classifica erros transitórios e permanentes', () => {
    expect(isTransientError({ status: 503 })).toBe(true)
    expect(isTransientError({ status: 429 })).toBe(true)
    expect(isTransientError({ status: 408 })).toBe(true)
    expect(isTransientError({ status: 400 })).toBe(false)
    expect(isTransientError({ status: 401 })).toBe(false)
    expect(isTransientError(new Error('request timeout'))).toBe(true)
    expect(isTransientError(new TypeError('fetch failed'))).toBe(true)
  })

  it('calcula backoff exponencial com jitter limitado', () => {
    const first = calculateBackoff(1, 100, 1000)
    const second = calculateBackoff(2, 100, 1000)
    const third = calculateBackoff(3, 100, 1000)

    expect(first).toBeGreaterThanOrEqual(100)
    expect(first).toBeLessThanOrEqual(200)
    expect(second).toBeGreaterThanOrEqual(200)
    expect(second).toBeLessThanOrEqual(300)
    expect(third).toBeGreaterThanOrEqual(400)
    expect(third).toBeLessThanOrEqual(500)
  })

  it('repete apenas erros transitórios', async () => {
    let attempts = 0
    const operation = vi.fn(async () => {
      attempts += 1
      if (attempts === 1) {
        throw Object.assign(new Error('unavailable'), { status: 503 })
      }
      return 'ok'
    })

    await expect(
      retryWithBackoff(operation, { attempts: 2, baseMs: 1, maxMs: 2 }),
    ).resolves.toBe('ok')
    expect(attempts).toBe(2)

    attempts = 0
    const permanent = vi.fn(async () => {
      attempts += 1
      throw Object.assign(new Error('bad request'), { status: 400 })
    })

    await expect(
      retryWithBackoff(permanent, { attempts: 3, baseMs: 1, maxMs: 2 }),
    ).rejects.toThrow('bad request')
    expect(attempts).toBe(1)
  })

  it('não executa quando o sinal já está abortado', async () => {
    const controller = new AbortController()
    controller.abort(new Error('stop'))
    const operation = vi.fn(async () => 'ok')

    await expect(
      retryWithBackoff(operation, {
        attempts: 2,
        baseMs: 1,
        signal: controller.signal,
      }),
    ).rejects.toThrow('stop')
    expect(operation).not.toHaveBeenCalled()
  })

  it('abre o circuito após o threshold e fecha após o cooldown', () => {
    let now = 0
    const breaker = createCircuitBreaker({
      threshold: 2,
      cooldownMs: 1000,
      now: () => now,
    })

    expect(breaker.isOpen('model')).toBe(false)
    breaker.recordFailure('model')
    expect(breaker.isOpen('model')).toBe(false)
    breaker.recordFailure('model')
    expect(breaker.isOpen('model')).toBe(true)

    now = 1001
    expect(breaker.isOpen('model')).toBe(false)
  })
})
