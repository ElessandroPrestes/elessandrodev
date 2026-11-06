const CACHE_ORIGIN = 'https://assistant-cache.elessandrodev.internal'
const CACHE_PATH = '/chat'
export const DEFAULT_CACHE_TTL_SECONDS = 86400

export function normalizeQuestion(question) {
  return String(question ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export async function buildCacheKey({
  question,
  locale,
  sourceHash,
  embeddingModel,
}) {
  const material = [
    locale,
    normalizeQuestion(question),
    String(sourceHash ?? ''),
    String(embeddingModel ?? ''),
  ].join('\n')

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(material),
  )
  const hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return `${CACHE_ORIGIN}${CACHE_PATH}/${hash}`
}

function resolveCache(cacheStorage) {
  if (cacheStorage) return cacheStorage
  if (typeof caches !== 'undefined' && caches.default) return caches.default
  return null
}

export async function readCachedAnswer({ cacheStorage, key } = {}) {
  const cache = resolveCache(cacheStorage)
  if (!cache || !key) return null

  try {
    const cached = await cache.match(key)
    if (!cached) return null
    const body = await cached.json()
    if (!body || typeof body.response !== 'string') return null
    return {
      response: body.response,
      sources: Array.isArray(body.sources) ? body.sources : [],
    }
  } catch {
    return null
  }
}

export async function writeCachedAnswer({
  cacheStorage,
  key,
  body,
  ttlSeconds = DEFAULT_CACHE_TTL_SECONDS,
} = {}) {
  const cache = resolveCache(cacheStorage)
  if (!cache || !key || !body) return

  const ttl = Number.isFinite(ttlSeconds)
    ? Math.max(60, Math.floor(ttlSeconds))
    : DEFAULT_CACHE_TTL_SECONDS

  try {
    const response = new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${ttl}`,
      },
    })
    await cache.put(key, response)
  } catch {
    // Falha de cache nunca deve quebrar a resposta ao visitante.
  }
}
