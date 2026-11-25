// Após uma falha, evita acumular timeouts Redis na mesma requisição.
export function createRedis(env, onFailure, fetcher = fetch) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null

  const timeoutMs = Number(env.REDIS_TIMEOUT_MS) || 500
  let available = true

  return async (command) => {
    if (!available) return undefined
    try {
      const response = await fetcher(env.UPSTASH_REDIS_REST_URL, {
        method: 'POST',
        redirect: 'error',
        headers: {
          Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
        signal: AbortSignal.timeout(Math.min(5000, Math.max(50, timeoutMs))),
      })
      if (!response.ok) throw new Error('redis-http')
      const payload = await response.json()
      if (payload.error || !Object.hasOwn(payload, 'result')) {
        throw new Error('redis-command')
      }
      return payload.result
    } catch {
      available = false
      onFailure()
      return undefined
    }
  }
}
