const CACHE_ORIGIN = 'https://assistant-cache.elessandrodev.internal'
const CACHE_PATH = '/chat'
const NEGATIVE_CACHE_SUFFIX = '?negative'
export const DEFAULT_CACHE_TTL_SECONDS = 86400
export const DEFAULT_NEGATIVE_CACHE_TTL_SECONDS = 60

export function normalizeQuestion(question) {
  return String(question ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(String(value ?? '')),
  )

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashQuestion(question) {
  return sha256Hex(normalizeQuestion(question))
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

  return `${CACHE_ORIGIN}${CACHE_PATH}/${await sha256Hex(material)}`
}

export function buildNegativeCacheKey(key) {
  if (!key) return null
  return `${key}${NEGATIVE_CACHE_SUFFIX}`
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

export async function readCachedFailure({ cacheStorage, key } = {}) {
  const cache = resolveCache(cacheStorage)
  if (!cache || !key) return null

  try {
    const cached = await cache.match(key)
    if (!cached) return null

    const body = await cached.json()
    if (!body || body.negative !== true) return null

    return {
      status: Number.isFinite(Number(body.status)) ? Number(body.status) : 503,
      stage: typeof body.stage === 'string' ? body.stage : 'generation',
    }
  } catch {
    return null
  }
}

export async function writeCachedFailure({
  cacheStorage,
  key,
  status = 503,
  stage = 'generation',
  ttlSeconds = DEFAULT_NEGATIVE_CACHE_TTL_SECONDS,
} = {}) {
  const cache = resolveCache(cacheStorage)
  if (!cache || !key) return

  const ttl = Number.isFinite(ttlSeconds)
    ? Math.min(60, Math.max(1, Math.floor(ttlSeconds)))
    : DEFAULT_NEGATIVE_CACHE_TTL_SECONDS

  try {
    const response = new Response(
      JSON.stringify({ negative: true, status, stage }),
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': `public, max-age=${ttl}`,
        },
      },
    )
    await cache.put(key, response)
  } catch {
    // Falha de cache nunca deve quebrar a resposta ao visitante.
  }
}
