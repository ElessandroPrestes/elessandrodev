export const DEFAULT_CACHE_TTL_SECONDS = 86400
export const DEFAULT_CACHE_HARD_TTL_SECONDS = 604800

const STOP_WORDS = new Set([
  'a', 'as', 'o', 'os', 'de', 'do', 'da', 'dos', 'das', 'um', 'uma',
  'the', 'an', 'of',
])

export function normalizeQuestion(question) {
  const words = question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .match(/[\p{L}\p{N}]+(?:[+#]+|\.[\p{L}\p{N}]+)*/gu) ?? []
  return words.filter((word) => !STOP_WORDS.has(word)).join(' ')
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function buildCacheKey({ question, locale, revision }) {
  const normalized = normalizeQuestion(question)
  if (!normalized) return null
  return `elessandrodev:chat:v1:${revision}:${locale}:${await sha256Hex(normalized)}`
}

export async function readCachedAnswer(redis, key) {
  const value = await redis(['GET', key])
  if (value === undefined) return undefined
  try {
    const answer = JSON.parse(value)
    if (answer?.origin === 'llm' && typeof answer.response === 'string' &&
        answer.response.trim() && Array.isArray(answer.sources) &&
        answer.sources.length && typeof answer.provider === 'string' &&
        Number.isFinite(Date.parse(answer.timestamp))) {
      return answer
    }
  } catch {
    // Um valor inválido equivale a um miss.
  }
  return null
}

export function writeCachedAnswer(redis, key, answer, ttlSeconds) {
  return redis(['SET', key, JSON.stringify(answer), 'EX', ttlSeconds])
}

export function classifyCachedAnswer(answer, freshTtlSeconds, hardTtlSeconds, now = Date.now()) {
  if (!answer) return 'MISS'
  const ageMs = now - Date.parse(answer.timestamp)
  if (ageMs < 0 || ageMs > hardTtlSeconds * 1000) return 'MISS'
  return ageMs <= freshTtlSeconds * 1000 ? 'FRESH' : 'STALE'
}
