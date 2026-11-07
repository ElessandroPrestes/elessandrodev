import { describe, expect, it } from 'vitest'
import {
  buildCacheKey,
  buildNegativeCacheKey,
  TtlCache,
} from '../src/modules/chat/answer-cache.js'

describe('cache', () => {
  it('expira entradas pelo TTL', () => {
    let now = 0
    const cache = new TtlCache<string>(10, () => now)
    cache.set('key', 'value', 1000)

    expect(cache.get('key')).toBe('value')
    now = 1001
    expect(cache.get('key')).toBeUndefined()
  })

  it('remove a entrada mais antiga ao atingir o limite', () => {
    const cache = new TtlCache<string>(2)
    cache.set('a', '1', 10000)
    cache.set('b', '2', 10000)
    cache.set('c', '3', 10000)

    expect(cache.size).toBe(2)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('c')).toBe('3')
  })

  it('gera chave determinística e sensível ao índice', () => {
    const base = {
      question: 'Quais clouds?',
      locale: 'pt',
      sourceHash: 'hash-a',
      embeddingModel: '@cf/baai/bge-m3',
    }

    expect(buildCacheKey(base)).toBe(buildCacheKey({ ...base }))
    expect(buildCacheKey(base)).not.toBe(
      buildCacheKey({ ...base, sourceHash: 'hash-b' }),
    )
    expect(buildCacheKey(base)).not.toBe(
      buildCacheKey({ ...base, question: 'Outra pergunta?' }),
    )
    expect(buildNegativeCacheKey('abc')).toBe('negative:abc')
  })
})
