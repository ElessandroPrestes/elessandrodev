/**
 * aiConfig.js — Configuração Centralizada de Inteligência Artificial
 * Governança sob Universal SDD: sem valores mágicos espalhados pelo código.
 */

const getEnv = (key, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key]
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key]
  }
  return fallback
}

export const AI_CONFIG = {
  apiKey: getEnv('VITE_GEMINI_API_KEY'),
  primaryModel: getEnv('VITE_GEMINI_PRIMARY_MODEL', getEnv('VITE_GEMINI_MODEL', 'gemini-3.5-flash')),
  fallbackModel: getEnv('VITE_GEMINI_FALLBACK_MODEL', 'gemini-3.5-flash-lite'),
  maxRetries: Number(getEnv('VITE_LLM_MAX_RETRIES', 2)),
  timeoutMs: Number(getEnv('VITE_LLM_TIMEOUT_MS', 30000)),
  backoffBaseMs: Number(getEnv('VITE_LLM_BACKOFF_BASE_MS', 500)),
  temperature: 0.4,
}

/**
 * Determina se um erro é puramente transitório (passível de retry/fallback)
 * ou permanente (que deve falhar imediatamente sem retries inúteis).
 *
 * @param {Error|any} error
 * @returns {boolean}
 */
export function isTransientError(error) {
  if (!error) return false

  const message = String(error.message || error).toLowerCase()
  const status = error.status || error.code || 0

  // Erros permanentes que NUNCA devem ter retry
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    message.includes('400') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('404') ||
    message.includes('api key') ||
    message.includes('invalid argument') ||
    message.includes('not found') ||
    message.includes('no longer available')
  ) {
    return false
  }

  // Erros transitórios que justificam retry e fallback
  if (
    status === 503 ||
    status === 502 ||
    status === 504 ||
    status === 500 ||
    status === 429 ||
    error.name === 'AbortError' ||
    error.name === 'TimeoutError' ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('504') ||
    message.includes('500') ||
    message.includes('429') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('unavailable') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('load resource')
  ) {
    return true
  }

  return false
}

/**
 * Calcula tempo de espera com backoff exponencial + jitter (aleatoriedade anti-ressonância)
 *
 * @param {number} attempt - Número da tentativa (1-indexed)
 * @param {number} baseMs - Tempo base em ms
 * @returns {number}
 */
export function calculateBackoff(attempt, baseMs = AI_CONFIG.backoffBaseMs) {
  const exponential = baseMs * Math.pow(2, attempt - 1)
  const jitter = Math.floor(Math.random() * 200) // 0 a 200ms de jitter
  return exponential + jitter
}

/**
 * Emite registro de telemetria estruturada sem vazar dados sensíveis
 *
 * @param {Object} telemetry
 */
export function recordTelemetry(telemetry) {
  // Garantir que nenhuma API Key ou prompt sensível seja exibido
  const cleanLog = {
    request_id: telemetry.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    provider: 'google-gemini',
    model: telemetry.model,
    status: telemetry.status || 200,
    retry_count: telemetry.retryCount || 0,
    fallback_used: Boolean(telemetry.fallbackUsed),
    ttft_ms: telemetry.ttftMs ? Math.round(telemetry.ttftMs) : null,
    llm_latency_ms: telemetry.llmLatencyMs ? Math.round(telemetry.llmLatencyMs) : null,
    total_latency_ms: telemetry.totalLatencyMs ? Math.round(telemetry.totalLatencyMs) : null,
  }

  if (import.meta.env?.DEV) {
    console.info('[Observabilidade IA]', cleanLog)
  }
}
