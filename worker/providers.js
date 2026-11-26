const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
export const DEFAULT_WORKERS_AI_MODEL = '@cf/google/gemma-4-26b-a4b-it'
export const DEFAULT_WORKERS_AI_MAX_TOKENS = 768
export const DEFAULT_OPENROUTER_MAX_TOKENS = 3000
export const DEFAULT_OPENROUTER_TIMEOUT_MS = 8000
export const DEFAULT_WORKERS_AI_TIMEOUT_MS = 12000
export const DEFAULT_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
]

export function parseList(value, fallback = []) {
  const items = String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? [...new Set(items)] : fallback
}

function classifyFailure(status, detail, remaining) {
  if (status === 402 || (status === 429 && (
    remaining === '0' || /free-models-per-day|per-day|daily|credit|quota/i.test(detail)
  ))) return 'quota'
  if (status === 429) return 'rate-limit'
  if (status === 504) return 'timeout'
  if (status >= 500) return 'upstream'
  return 'rejected'
}

function completionState(reason, usage, maxTokens) {
  if (reason) {
    return ['stop', 'eos', 'end_turn', 'stop_sequence'].includes(reason) ? 'complete' : 'incomplete'
  }
  const tokens = usage?.completion_tokens
  if (Number.isFinite(tokens) && tokens > 0) return tokens < maxTokens ? 'complete' : 'incomplete'
  return 'unknown'
}

export async function callOpenRouter({
  env,
  model,
  system,
  user,
  timeoutMs = DEFAULT_OPENROUTER_TIMEOUT_MS,
  maxTokens = DEFAULT_OPENROUTER_MAX_TOKENS,
}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

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
        max_tokens: maxTokens,
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

    if (!response.ok || payload?.error) {
      const status = response.ok ? Number(payload.error.code) || 502 : response.status
      const reason = classifyFailure(
        status,
        String(payload?.error?.message ?? payload?.message ?? ''),
        response.headers.get('X-RateLimit-Remaining'),
      )
      return { ok: false, status, reason }
    }

    const choice = payload?.choices?.[0]
    const content = choice?.message?.content
    const text = Array.isArray(content)
      ? content
          .map((part) => (typeof part === 'string' ? part : part?.text || ''))
          .join('')
      : content

    const completion = completionState(choice?.finish_reason, payload?.usage, maxTokens)
    if (typeof text !== 'string' || !text.trim() || completion === 'incomplete') {
      return { ok: false, status: 502, reason: 'incomplete' }
    }

    return { ok: true, text: text.trim(), cacheable: completion === 'complete' }
  } catch (error) {
    const aborted = controller.signal.aborted || error?.name === 'AbortError'
    return { ok: false, status: aborted ? 504 : 502, reason: aborted ? 'timeout' : 'upstream' }
  } finally {
    clearTimeout(timer)
  }
}

export async function callWorkersAi({
  env,
  model,
  system,
  user,
  timeoutMs = DEFAULT_WORKERS_AI_TIMEOUT_MS,
  maxTokens = DEFAULT_WORKERS_AI_MAX_TOKENS,
}) {
  if (!env?.AI || typeof env.AI.run !== 'function') {
    return { ok: false, status: 503, reason: 'unconfigured' }
  }

  let timer

  try {
    const timeout = new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error('workers-ai-timeout')
        error.name = 'AbortError'
        reject(error)
      }, timeoutMs)
    })

    const result = await Promise.race([
      env.AI.run(model, {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
      timeout,
    ])

    const choice = result?.choices?.[0]
    const text = typeof result === 'string' ? result : choice?.message?.content ?? result?.response
    const completion = completionState(choice?.finish_reason ?? result?.finish_reason, result?.usage, maxTokens)
    if (typeof text !== 'string' || !text.trim() || completion === 'incomplete') {
      return {
        ok: false,
        status: 502,
        reason: 'incomplete',
      }
    }

    return {
      ok: true,
      text: text.trim(),
      cacheable: completion === 'complete',
    }
  } catch (error) {
    const status = error?.name === 'AbortError' ? 504 : Number(error?.status) || 502
    return { ok: false, status, reason: classifyFailure(status, '', null) }
  } finally {
    clearTimeout(timer)
  }
}
