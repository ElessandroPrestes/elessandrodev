import { sha256 } from '../../shared/hash.js'
import type { Source } from '../rag/context.js'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface CachedAnswer {
  response: string
  sources: Source[]
}

export interface CachedFailure {
  status: number
  stage: string
}

export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>()

  constructor(
    private readonly maxEntries = 500,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (this.now() >= entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.maxEntries > 0 && this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value
      if (oldest) this.store.delete(oldest)
    }
    this.store.set(key, {
      value,
      expiresAt: this.now() + Math.max(1, ttlMs),
    })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }
}

export function buildCacheKey({
  question,
  locale,
  sourceHash,
  embeddingModel,
}: {
  question: string
  locale: string
  sourceHash: string
  embeddingModel: string
}): string {
  return sha256(
    [question.trim(), locale, sourceHash, embeddingModel].join('\n'),
  )
}

export function buildNegativeCacheKey(cacheKey: string): string {
  return `negative:${cacheKey}`
}
