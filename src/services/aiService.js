import {
  AI_CONFIG,
  isTransientError,
  calculateBackoff,
  recordTelemetry,
} from '../config/aiConfig.js'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createUserError(code, message, status = 0) {
  const error = new Error(message)
  error.code = code
  if (status) error.status = status
  error.userMessage = message
  return error
}

async function requestOnce({ url, question, locale, timeoutMs, signal }) {
  const controller = new AbortController()
  let timedOut = false

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort(new Error('timeout'))
  }, timeoutMs)

  const handleExternalAbort = () => controller.abort(signal?.reason)
  if (signal) signal.addEventListener('abort', handleExternalAbort, { once: true })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, locale }),
      signal: controller.signal,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const error = new Error(data?.error || `HTTP ${response.status}`)
      error.status = response.status
      throw error
    }

    if (typeof data?.response !== 'string' || data.response.trim() === '') {
      const error = new Error(
        locale === 'en'
          ? 'The assistant returned an empty response.'
          : 'O assistente retornou uma resposta vazia.'
      )
      error.status = 502
      throw error
    }

    return {
      response: data.response,
      sources: Array.isArray(data.sources) ? data.sources : [],
      status: response.status,
    }
  } catch (error) {
    if (timedOut) {
      throw createUserError(
        'TIMEOUT',
        locale === 'en'
          ? 'The request timed out. Please try again.'
          : 'A requisição excedeu o tempo limite. Tente novamente.',
        504
      )
    }

    if (signal?.aborted) {
      throw createUserError(
        'ABORTED',
        locale === 'en' ? 'Request cancelled.' : 'Requisição cancelada.'
      )
    }

    throw error
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', handleExternalAbort)
  }
}

/**
 * Envia a pergunta ao Cloudflare Worker e retorna a resposta grounded com fontes.
 *
 * @param {string} question
 * @param {'pt'|'en'} locale
 * @param {Object} options
 * @param {Function} options.onStatus
 * @param {AbortSignal} options.signal
 * @param {number} options.maxRetries
 * @param {number} options.timeoutMs
 * @param {number} options.backoffBaseMs
 * @returns {Promise<{ response: string, sources: Array }>}
 */
export async function askAssistant(question, locale = 'pt', options = {}) {
  const {
    onStatus = () => {},
    signal = null,
    maxRetries = AI_CONFIG.maxRetries,
    timeoutMs = AI_CONFIG.timeoutMs,
    backoffBaseMs = AI_CONFIG.backoffBaseMs,
  } = options

  if (!AI_CONFIG.chatApiUrl) {
    throw createUserError(
      'MISSING_CHAT_API_URL',
      locale === 'en'
        ? 'The assistant endpoint is not configured. Set VITE_CHAT_API_URL in your .env file.'
        : 'O endpoint do assistente não está configurado. Defina VITE_CHAT_API_URL no arquivo .env.'
    )
  }

  const retries = Number.isFinite(maxRetries) ? Math.max(0, Math.floor(maxRetries)) : 0
  const effectiveTimeout = Number.isFinite(timeoutMs) ? Math.max(1, timeoutMs) : 30000
  const startedAt = performance.now()
  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await requestOnce({
        url: AI_CONFIG.chatApiUrl,
        question,
        locale,
        timeoutMs: effectiveTimeout,
        signal,
      })

      recordTelemetry({
        status: result.status,
        retryCount: attempt,
        fallbackUsed: false,
        totalLatencyMs: performance.now() - startedAt,
        retrievalTopScore: result.sources[0]?.score ?? null,
        retrievalHits: result.sources.length,
      })

      return { response: result.response, sources: result.sources }
    } catch (error) {
      lastError = error

      if (error?.code === 'ABORTED') break
      if (!isTransientError(error) || attempt >= retries) break

      onStatus(
        locale === 'en'
          ? 'Reconnecting to the assistant...'
          : 'Tentando restabelecer a conexão...',
        'retry'
      )

      await sleep(calculateBackoff(attempt + 1, backoffBaseMs))
    }
  }

  if (!lastError) {
    lastError = new Error(
      locale === 'en'
        ? 'Could not process your message.'
        : 'Não foi possível processar sua mensagem.'
    )
    lastError.status = 503
  }

  recordTelemetry({
    status: lastError.status || 503,
    retryCount: retries,
    fallbackUsed: false,
    totalLatencyMs: performance.now() - startedAt,
  })

  if (!lastError.userMessage) {
    const hasFriendlyWorkerMessage =
      Boolean(lastError.status) &&
      Boolean(lastError.message) &&
      !lastError.message.startsWith('HTTP ')

    if (lastError.status === 413) {
      lastError.userMessage = locale === 'en'
        ? 'The message is too long.'
        : 'A pergunta é muito longa.'
    } else if (hasFriendlyWorkerMessage) {
      lastError.userMessage = lastError.message
    } else {
      lastError.userMessage = locale === 'en'
        ? 'Could not process your message right now. Please try again in a few moments.'
        : 'Não consegui processar sua mensagem agora. Tente novamente em alguns instantes.'
    }
  }

  throw lastError
}

/**
 * Compatibilidade com a interface anterior de streaming.
 * O Worker retorna a resposta completa; o texto é emitido uma única vez.
 */
export async function streamAssistant(question, locale = 'pt', options = {}) {
  const result = await askAssistant(question, locale, options)
  if (typeof options.onToken === 'function') {
    options.onToken(result.response, result.response)
  }
  return result.response
}
