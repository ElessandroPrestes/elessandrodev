const INCREMENT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count
`

export async function isRateLimited(request, env, redis, limit, windowSeconds) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  if (redis && env.VISITOR_HASH_SECRET) {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(env.VISITOR_HASH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(ip))
    const visitor = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
    const count = await redis(['EVAL', INCREMENT, 1, `elessandrodev:chat:visitor:v1:${visitor}`, windowSeconds])
    if (typeof count === 'number') return count > limit
  }

  try {
    const result = await env.CHAT_RATE_LIMITER?.limit({ key: ip })
    return result?.success === false
  } catch {
    return false
  }
}
