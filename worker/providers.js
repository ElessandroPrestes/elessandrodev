const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
export const DEFAULT_WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8'
export const DEFAULT_MODELS = [
  'minimax/minimax-m3.1-flash:free',
  'google/gemma-4-31b-it:free',
]
const MODEL_TIMEOUT_MS = 20000

export function parseList(value, fallback = []) {
  const items = String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? [...new Set(items)] : fallback
}

function parseRetryAfter(value) {
  if (!value) return null

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds)

  const date = Date.parse(value)
  if (Number.isFinite(date)) {
    return Math.max(1, Math.ceil((date - Date.now()) / 1000))
  }

  return null
}

function parseReset(value) {
  if (!value) return null

  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return null

  if (numeric > 1e12) {
    return Math.max(1, Math.ceil(numeric / 1000 - Date.now() / 1000))
  }

  if (numeric > 1e9) {
    return Math.max(1, Math.ceil(numeric - Date.now() / 1000))
  }

  return Math.max(1, Math.ceil(numeric))
}

function parseRemaining(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function isQuotaExhausted({ status, remaining, detail }) {
  if (status !== 429) return false
  if (remaining !== null && remaining <= 0) return true
  return /free-models-per-day|per-day|daily|credit/i.test(String(detail ?? ''))
}

export async function callOpenRouter({ env, model, system, user }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS)

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          env.SITE_URL || 'https://elessandroprestes.github.io/elessandrodev/',
        'X-Title': 'Elessandro Portfolio',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    })

    const raw = await response.text()
    let payload = null
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = null
    }

    const remaining = parseRemaining(
      response.headers.get('X-RateLimit-Remaining'),
    )
    const retryAfter =
      parseRetryAfter(response.headers.get('Retry-After')) ??
      parseReset(response.headers.get('X-RateLimit-Reset'))

    if (!response.ok) {
      const detail = payload?.error?.message || payload?.message || ''
      const normalizedDetail = String(detail).slice(0, 160)

      return {
        ok: false,
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
        detail: normalizedDetail,
        quotaExhausted: isQuotaExhausted({
          status: response.status,
          remaining,
          detail: normalizedDetail,
        }),
        retryAfter,
      }
    }

    const content = payload?.choices?.[0]?.message?.content
    const text = Array.isArray(content)
      ? content
          .map((part) => (typeof part === 'string' ? part : part?.text || ''))
          .join('')
      : content

    if (typeof text !== 'string' || !text.trim()) {
      return { ok: false, status: 502, retryable: true, retryAfter }
    }

    return { ok: true, text: text.trim(), provider: 'openrouter', model }
  } catch (error) {
    const aborted = error?.name === 'AbortError'
    return { ok: false, status: aborted ? 504 : 502, retryable: true }
  } finally {
    clearTimeout(timer)
  }
}

export async function callWorkersAi({ env, model, system, user }) {
  if (!env?.AI || typeof env.AI.run !== 'function') {
    return { ok: false, status: 503, retryable: false, provider: 'workers-ai' }
  }

  let timer

  try {
    const timeout = new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error('workers-ai-timeout')
        error.name = 'AbortError'
        reject(error)
      }, MODEL_TIMEOUT_MS)
    })

    const result = await Promise.race([
      env.AI.run(model, {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
      timeout,
    ])

    const text = typeof result === 'string' ? result : result?.response

    if (typeof text !== 'string' || !text.trim()) {
      return {
        ok: false,
        status: 502,
        retryable: true,
        provider: 'workers-ai',
        detail: 'empty response',
      }
    }

    return {
      ok: true,
      text: text.trim(),
      provider: 'workers-ai',
      model,
    }
  } catch (error) {
    const aborted = error?.name === 'AbortError'
    return {
      ok: false,
      status: aborted ? 504 : 502,
      retryable: true,
      provider: 'workers-ai',
      detail: String(error?.message || 'unknown error').slice(0, 160),
    }
  } finally {
    clearTimeout(timer)
  }
}
