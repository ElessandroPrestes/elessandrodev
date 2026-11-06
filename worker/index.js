import index from './rag/index.json' with { type: 'json' }
import {
  buildContext,
  embedQuestion,
  formatSources,
  retrieveChunks,
} from './rag/retrieve.js'
import {
  buildSystemPrompt,
  contactReply,
  isContactQuestion,
  isEnglish,
  safeFallback,
} from './prompt.js'
import {
  buildCacheKey,
  buildNegativeCacheKey,
  hashQuestion,
  readCachedAnswer,
  readCachedFailure,
  writeCachedAnswer,
  writeCachedFailure,
  DEFAULT_CACHE_TTL_SECONDS,
  DEFAULT_NEGATIVE_CACHE_TTL_SECONDS,
} from './cache.js'
import {
  DEFAULT_MODELS,
  DEFAULT_OPENROUTER_MAX_TOKENS,
  DEFAULT_OPENROUTER_TIMEOUT_MS,
  DEFAULT_WORKERS_AI_MAX_TOKENS,
  DEFAULT_WORKERS_AI_MODEL,
  DEFAULT_WORKERS_AI_TIMEOUT_MS,
  callOpenRouter,
  callWorkersAi,
  parseList,
} from './providers.js'
import {
  DEFAULT_CIRCUIT_BREAKER_MS,
  DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
  createCircuitBreaker,
} from './circuit.js'

const DEFAULT_EMBEDDING_MODEL = '@cf/baai/bge-m3'
const DEFAULT_RETRY_AFTER_SECONDS = 3600
const DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS = 60
const DEFAULT_WORKER_BUDGET_MS = 25000
const DEFAULT_MIN_CALL_BUDGET_MS = 2000
const DEFAULT_ALLOWED_ORIGINS = [
  'https://elessandroprestes.github.io',
  'http://localhost:5212',
  'http://127.0.0.1:5212',
  'http://elessandrodev.localhost',
]
const REQUEST_LIMIT = 2000
const QUESTION_LIMIT = 500
const CJK_PATTERN =
  /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/g

let activeCircuitBreaker = null
let activeCircuitSignature = ''

function readInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function readFloat(value, fallback, min, max) {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function createRequestId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }
}

function isSilent(env) {
  return String(env.LOG_LEVEL || '').toLowerCase() === 'silent'
}

function logEvent(env, payload) {
  if (isSilent(env)) return
  console.log(JSON.stringify({ event: 'assistant', ...payload }))
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function jsonResponse(body, status, origin, extraHeaders = {}, requestId = null) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  }

  if (requestId) headers['X-Request-Id'] = requestId
  if (origin) Object.assign(headers, corsHeaders(origin))
  Object.assign(headers, extraHeaders)

  return new Response(JSON.stringify(body), { status, headers })
}

function sanitizeAnswer(text) {
  return String(text ?? '')
    .replace(CJK_PATTERN, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

function cjkRatio(text) {
  const value = String(text ?? '')
  if (!value) return 0
  return (value.length - value.replace(CJK_PATTERN, '').length) / value.length
}

function rateLimitMessage(locale) {
  return locale === 'en'
    ? 'The assistant reached its free usage limit and is temporarily unavailable. Please try again later.'
    : 'O assistente atingiu o limite de uso gratuito e está temporariamente indisponível. Tente novamente mais tarde.'
}

function unavailableMessage(locale) {
  return locale === 'en'
    ? 'The assistant is temporarily unavailable. Please try again shortly.'
    : 'O assistente está temporariamente indisponível. Tente novamente em instantes.'
}

function buildUserPrompt(context, question) {
  return `<trechos_recuperados>\n${context}\n</trechos_recuperados>\n\n<pergunta>\n${question}\n</pergunta>`
}

function isCacheEnabled(env) {
  const value = String(env.ENABLE_CACHE ?? 'true').toLowerCase()
  return value !== 'false' && value !== '0' && value !== 'off'
}

function getCircuitBreaker(env) {
  const threshold = readInt(
    env.CIRCUIT_BREAKER_THRESHOLD,
    DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
    1,
    20,
  )
  const cooldownMs = readInt(
    env.CIRCUIT_BREAKER_MS,
    DEFAULT_CIRCUIT_BREAKER_MS,
    1000,
    3600000,
  )
  const signature = `${threshold}:${cooldownMs}`

  if (!activeCircuitBreaker || activeCircuitSignature !== signature) {
    activeCircuitBreaker = createCircuitBreaker({ threshold, cooldownMs })
    activeCircuitSignature = signature
  }

  return activeCircuitBreaker
}

export function __resetCircuitBreakerForTests() {
  activeCircuitBreaker = null
  activeCircuitSignature = ''
}

function healthResponse(env, requestId, method) {
  const body = {
    status: 'ok',
    version: index?.version ?? null,
    chunkCount: Array.isArray(index?.chunks) ? index.chunks.length : 0,
    sourceHash: index?.sourceHash ?? null,
    cacheEnabled: isCacheEnabled(env),
    modelsConfigured: parseList(env.MODELS, DEFAULT_MODELS).length,
  }
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Request-Id': requestId,
    'Cache-Control': 'no-store',
  }

  return new Response(method === 'HEAD' ? null : JSON.stringify(body), {
    status: 200,
    headers,
  })
}

async function isRateLimited(request, env) {
  const limiter = env.CHAT_RATE_LIMITER
  if (!limiter || typeof limiter.limit !== 'function') return false

  const forwarded = request.headers.get('X-Forwarded-For')
  const key =
    request.headers.get('CF-Connecting-IP') ||
    forwarded?.split(',')[0]?.trim() ||
    'unknown'

  try {
    const result = await limiter.limit({ key })
    return result?.success === false
  } catch {
    return false
  }
}

async function generateAnswer({
  env,
  locale,
  retrieved,
  question,
  deadline,
}) {
  const models = env.OPENROUTER_API_KEY
    ? parseList(env.MODELS, DEFAULT_MODELS)
    : []
  const system = buildSystemPrompt(locale)
  const user = buildUserPrompt(buildContext(retrieved), question)
  const workersAiModel = String(
    env.WORKERS_AI_MODEL || DEFAULT_WORKERS_AI_MODEL,
  ).trim()
  const breaker = getCircuitBreaker(env)
  const minCallBudgetMs = readInt(
    env.MIN_CALL_BUDGET_MS,
    DEFAULT_MIN_CALL_BUDGET_MS,
    100,
    10000,
  )
  const startedAt = Date.now()
  const attempts = []
  let lastStatus = 503
  let lastStage = 'openrouter'
  let lastProvider = null
  let lastModel = null
  let rateLimited = false
  let retryAfter = null

  for (const model of models) {
    const key = `openrouter:${model}`

    if (breaker.isOpen(key)) {
      attempts.push({ provider: 'openrouter', model, skipped: 'circuit-open' })
      lastStatus = 503
      lastStage = 'openrouter'
      lastProvider = 'openrouter'
      lastModel = model
      continue
    }

    const remaining = deadline - Date.now()
    if (remaining < minCallBudgetMs) {
      attempts.push({ provider: 'openrouter', model, skipped: 'budget' })
      lastStatus = 504
      lastStage = 'openrouter'
      lastProvider = 'openrouter'
      lastModel = model
      break
    }

    const timeoutMs = Math.min(
      readInt(
        env.OPENROUTER_TIMEOUT_MS,
        DEFAULT_OPENROUTER_TIMEOUT_MS,
        1000,
        30000,
      ),
      remaining,
    )
    const callStartedAt = Date.now()
    const result = await callOpenRouter({
      env,
      model,
      system,
      user,
      timeoutMs,
      maxTokens: readInt(
        env.OPENROUTER_MAX_TOKENS,
        DEFAULT_OPENROUTER_MAX_TOKENS,
        128,
        8000,
      ),
    })
    const durationMs = Date.now() - callStartedAt
    attempts.push({
      provider: 'openrouter',
      model,
      status: result.status ?? 200,
      durationMs,
      ok: result.ok,
    })

    if (result.ok) {
      const text = sanitizeAnswer(result.text)
      if (text && cjkRatio(result.text) <= 0.1) {
        breaker.recordSuccess(key)
        return {
          ok: true,
          text,
          provider: result.provider,
          model,
          stage: 'openrouter',
          attempts,
          generationMs: Date.now() - startedAt,
        }
      }
      lastStatus = 502
      lastStage = 'openrouter'
      lastProvider = 'openrouter'
      lastModel = model
      continue
    }

    lastStatus = result.status
    lastStage = 'openrouter'
    lastProvider = 'openrouter'
    lastModel = model
    if (result.status === 429) rateLimited = true
    if (result.retryAfter) retryAfter = result.retryAfter
    if (result.status !== 429) breaker.recordFailure(key)

    if (result.quotaExhausted) break
    if (!result.retryable && (result.status === 401 || result.status === 403)) {
      break
    }
  }

  const workersAiKey = `workers-ai:${workersAiModel}`

  if (workersAiModel && breaker.isOpen(workersAiKey)) {
    attempts.push({
      provider: 'workers-ai',
      model: workersAiModel,
      skipped: 'circuit-open',
    })
    lastStage = 'workers-ai'
    lastProvider = 'workers-ai'
    lastModel = workersAiModel
  } else if (workersAiModel) {
    const remaining = deadline - Date.now()

    if (remaining < minCallBudgetMs) {
      attempts.push({
        provider: 'workers-ai',
        model: workersAiModel,
        skipped: 'budget',
      })
      lastStatus = 504
      lastStage = 'workers-ai'
      lastProvider = 'workers-ai'
      lastModel = workersAiModel
    } else {
      const timeoutMs = Math.min(
        readInt(
          env.WORKERS_AI_TIMEOUT_MS,
          DEFAULT_WORKERS_AI_TIMEOUT_MS,
          1000,
          30000,
        ),
        remaining,
      )
      const callStartedAt = Date.now()
      const fallback = await callWorkersAi({
        env,
        model: workersAiModel,
        system,
        user,
        timeoutMs,
        maxTokens: readInt(
          env.WORKERS_AI_MAX_TOKENS,
          DEFAULT_WORKERS_AI_MAX_TOKENS,
          128,
          2048,
        ),
      })
      const durationMs = Date.now() - callStartedAt
      attempts.push({
        provider: 'workers-ai',
        model: workersAiModel,
        status: fallback.status ?? 200,
        durationMs,
        ok: fallback.ok,
      })

      lastStage = 'workers-ai'
      lastProvider = 'workers-ai'
      lastModel = workersAiModel

      if (fallback.ok) {
        const text = sanitizeAnswer(fallback.text)
        if (text && cjkRatio(fallback.text) <= 0.1) {
          breaker.recordSuccess(workersAiKey)
          return {
            ok: true,
            text,
            provider: fallback.provider,
            model: workersAiModel,
            stage: 'workers-ai',
            attempts,
            generationMs: Date.now() - startedAt,
          }
        }
        lastStatus = 502
      } else {
        lastStatus = fallback.status
        if (fallback.status !== 429) breaker.recordFailure(workersAiKey)
      }
    }
  }

  if (rateLimited) {
    return {
      ok: false,
      status: 429,
      retryAfter: retryAfter || DEFAULT_RETRY_AFTER_SECONDS,
      stage: lastStage,
      provider: lastProvider,
      model: lastModel,
      attempts,
      generationMs: Date.now() - startedAt,
    }
  }

  return {
    ok: false,
    status: lastStatus,
    retryAfter,
    stage: lastStage,
    provider: lastProvider,
    model: lastModel,
    attempts,
    generationMs: Date.now() - startedAt,
  }
}

export default {
  async fetch(request, env, ctx) {
    const requestId = createRequestId()
    const startedAt = Date.now()
    const url = new URL(request.url)

    if (
      url.pathname === '/health' &&
      (request.method === 'GET' || request.method === 'HEAD')
    ) {
      return healthResponse(env, requestId, request.method)
    }

    const origin = request.headers.get('Origin')
    const allowedOrigins = parseList(env.ALLOWED_ORIGIN, DEFAULT_ALLOWED_ORIGINS)
    const isAllowed = Boolean(origin) && allowedOrigins.includes(origin)

    if (!isAllowed) {
      return jsonResponse(
        { error: 'Origem não permitida.' },
        403,
        null,
        {},
        requestId,
      )
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders(origin), 'X-Request-Id': requestId },
      })
    }

    if (request.method !== 'POST') {
      return jsonResponse(
        { error: 'Método não permitido.' },
        405,
        origin,
        {},
        requestId,
      )
    }

    if (url.pathname !== '/' && url.pathname !== '/chat') {
      return jsonResponse(
        { error: 'Rota não encontrada.' },
        404,
        origin,
        {},
        requestId,
      )
    }

    const raw = await request.text()
    if (raw.length > REQUEST_LIMIT) {
      return jsonResponse(
        { error: 'Payload muito grande.' },
        413,
        origin,
        {},
        requestId,
      )
    }

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return jsonResponse(
        { error: 'JSON inválido.' },
        400,
        origin,
        {},
        requestId,
      )
    }

    const question =
      typeof payload?.question === 'string' ? payload.question.trim() : ''
    const locale = payload?.locale === 'en' ? 'en' : 'pt'

    if (!question) {
      return jsonResponse(
        { error: 'Pergunta obrigatória.' },
        400,
        origin,
        {},
        requestId,
      )
    }

    if (question.length > QUESTION_LIMIT) {
      return jsonResponse(
        { error: 'Pergunta muito longa.' },
        400,
        origin,
        {},
        requestId,
      )
    }

    if (await isRateLimited(request, env)) {
      logEvent(env, {
        requestId,
        stage: 'rate-limit',
        outcome: 'rate_limited',
        providerStatus: 429,
        questionHash: await hashQuestion(question),
        timings: { totalMs: Date.now() - startedAt },
      })
      return jsonResponse(
        { error: rateLimitMessage(locale) },
        429,
        origin,
        {
          'Retry-After': String(DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS),
          'X-Assistant-Stage': 'rate-limit',
        },
        requestId,
      )
    }

    const answerLocale =
      locale === 'en' || isEnglish(question) ? 'en' : 'pt'

    if (isContactQuestion(question)) {
      return jsonResponse(
        { response: contactReply(answerLocale === 'en'), sources: [] },
        200,
        origin,
        { 'X-Assistant-Cache': 'OFF' },
        requestId,
      )
    }

    const questionHash = await hashQuestion(question)
    const timings = {
      embeddingMs: 0,
      retrievalMs: 0,
      generationMs: 0,
      totalMs: 0,
    }
    const embeddingModel =
      env.EMBEDDING_MODEL || index?.embeddingModel || DEFAULT_EMBEDDING_MODEL
    const cacheEnabled = isCacheEnabled(env)
    const sourceHash = index?.sourceHash || String(index?.version ?? '')
    const cacheKey =
      cacheEnabled && sourceHash
        ? await buildCacheKey({
            question,
            locale: answerLocale,
            sourceHash,
            embeddingModel,
          })
        : null
    let cacheState = cacheKey ? 'MISS' : 'OFF'

    if (cacheKey) {
      const cached = await readCachedAnswer({ key: cacheKey })
      if (cached) {
        timings.totalMs = Date.now() - startedAt
        logEvent(env, {
          requestId,
          questionHash,
          stage: 'cache',
          outcome: 'ok',
          provider: 'cache',
          providerStatus: 200,
          cache: 'HIT',
          timings,
        })
        return jsonResponse(
          cached,
          200,
          origin,
          { 'X-Assistant-Cache': 'HIT', 'X-Assistant-Stage': 'cache' },
          requestId,
        )
      }

      const cachedFailure = await readCachedFailure({
        key: buildNegativeCacheKey(cacheKey),
      })
      if (cachedFailure) {
        timings.totalMs = Date.now() - startedAt
        logEvent(env, {
          requestId,
          questionHash,
          stage: cachedFailure.stage,
          outcome: 'unavailable',
          providerStatus: cachedFailure.status,
          cache: 'NEGATIVE',
          timings,
        })
        return jsonResponse(
          { error: unavailableMessage(locale) },
          cachedFailure.status,
          origin,
          {
            'X-Assistant-Cache': 'NEGATIVE',
            'X-Assistant-Stage': cachedFailure.stage,
          },
          requestId,
        )
      }
    }

    const hasGenerationProvider =
      Boolean(env.OPENROUTER_API_KEY) || Boolean(env.AI?.run)

    if (!hasGenerationProvider) {
      timings.totalMs = Date.now() - startedAt
      logEvent(env, {
        requestId,
        questionHash,
        stage: 'openrouter',
        outcome: 'unavailable',
        providerStatus: 503,
        cache: cacheState,
        timings,
      })
      return jsonResponse(
        { error: unavailableMessage(locale) },
        503,
        origin,
        { 'X-Assistant-Cache': cacheState, 'X-Assistant-Stage': 'openrouter' },
        requestId,
      )
    }

    if (!env.AI || !Array.isArray(index?.chunks) || index.chunks.length === 0) {
      timings.totalMs = Date.now() - startedAt
      logEvent(env, {
        requestId,
        questionHash,
        stage: 'embedding',
        outcome: 'unavailable',
        providerStatus: 503,
        cache: cacheState,
        timings,
      })
      return jsonResponse(
        { error: unavailableMessage(locale) },
        503,
        origin,
        { 'X-Assistant-Cache': cacheState, 'X-Assistant-Stage': 'embedding' },
        requestId,
      )
    }

    const topK = readInt(env.TOP_K, 4, 1, 8)
    const alpha = readFloat(env.HYBRID_ALPHA, 0.6, 0, 1)
    const minScore = readFloat(env.MIN_SCORE, 0.45, 0, 1)

    let queryVector
    const embeddingStartedAt = Date.now()
    try {
      queryVector = await embedQuestion(env.AI, embeddingModel, question)
    } catch (error) {
      timings.embeddingMs = Date.now() - embeddingStartedAt
      timings.totalMs = Date.now() - startedAt
      logEvent(env, {
        requestId,
        questionHash,
        stage: 'embedding',
        outcome: 'unavailable',
        providerStatus: 503,
        cache: cacheState,
        detail: String(error?.message || 'unknown error').slice(0, 160),
        timings,
      })
      return jsonResponse(
        { error: unavailableMessage(locale) },
        503,
        origin,
        { 'X-Assistant-Cache': cacheState, 'X-Assistant-Stage': 'embedding' },
        requestId,
      )
    }
    timings.embeddingMs = Date.now() - embeddingStartedAt

    let retrieved
    const retrievalStartedAt = Date.now()
    try {
      retrieved = retrieveChunks({
        queryVector,
        question,
        chunks: index.chunks,
        topK,
        alpha,
        minScore,
      })
    } catch (error) {
      timings.retrievalMs = Date.now() - retrievalStartedAt
      timings.totalMs = Date.now() - startedAt
      logEvent(env, {
        requestId,
        questionHash,
        stage: 'retrieval',
        outcome: 'unavailable',
        providerStatus: 503,
        cache: cacheState,
        detail: String(error?.message || 'unknown error').slice(0, 160),
        timings,
      })
      return jsonResponse(
        { error: unavailableMessage(locale) },
        503,
        origin,
        { 'X-Assistant-Cache': cacheState, 'X-Assistant-Stage': 'retrieval' },
        requestId,
      )
    }
    timings.retrievalMs = Date.now() - retrievalStartedAt

    if (retrieved.length === 0) {
      timings.totalMs = Date.now() - startedAt
      logEvent(env, {
        requestId,
        questionHash,
        stage: 'retrieval',
        outcome: 'ok',
        provider: 'safe-fallback',
        providerStatus: 200,
        cache: 'OFF',
        timings,
      })
      return jsonResponse(
        { response: safeFallback(answerLocale === 'en'), sources: [] },
        200,
        origin,
        {},
        requestId,
      )
    }

    const budgetMs = readInt(
      env.WORKER_BUDGET_MS,
      DEFAULT_WORKER_BUDGET_MS,
      1000,
      60000,
    )
    const deadline = startedAt + budgetMs
    const answer = await generateAnswer({
      env,
      locale: answerLocale,
      retrieved,
      question,
      deadline,
    })
    timings.generationMs = answer.generationMs

    if (!answer.ok) {
      if (answer.status === 429) {
        timings.totalMs = Date.now() - startedAt
        logEvent(env, {
          requestId,
          questionHash,
          stage: answer.stage,
          outcome: 'rate_limited',
          provider: answer.provider,
          model: answer.model,
          providerStatus: 429,
          cache: cacheState,
          timings,
          attempts: answer.attempts,
        })
        return jsonResponse(
          { error: rateLimitMessage(locale) },
          429,
          origin,
          {
            'Retry-After': String(
              answer.retryAfter || DEFAULT_RETRY_AFTER_SECONDS,
            ),
            'X-Assistant-Cache': cacheState,
            'X-Assistant-Stage': answer.stage,
          },
          requestId,
        )
      }

      if (cacheEnabled && cacheKey) {
        const negativeTtl = readInt(
          env.NEGATIVE_CACHE_TTL_SECONDS,
          DEFAULT_NEGATIVE_CACHE_TTL_SECONDS,
          1,
          60,
        )
        const writePromise = writeCachedFailure({
          key: buildNegativeCacheKey(cacheKey),
          status: 503,
          stage: answer.stage,
          ttlSeconds: negativeTtl,
        })

        if (ctx?.waitUntil) {
          ctx.waitUntil(writePromise)
        } else {
          await writePromise
        }
      }

      timings.totalMs = Date.now() - startedAt
      logEvent(env, {
        requestId,
        questionHash,
        stage: answer.stage,
        outcome: 'unavailable',
        provider: answer.provider,
        model: answer.model,
        providerStatus: answer.status,
        cache: cacheState,
        timings,
        attempts: answer.attempts,
      })
      return jsonResponse(
        { error: unavailableMessage(locale) },
        503,
        origin,
        { 'X-Assistant-Cache': cacheState, 'X-Assistant-Stage': answer.stage },
        requestId,
      )
    }

    const body = {
      response: sanitizeAnswer(answer.text),
      sources: formatSources(retrieved),
    }

    if (cacheEnabled && cacheKey && body.sources.length > 0) {
      const ttlSeconds = readInt(
        env.CACHE_TTL_SECONDS,
        DEFAULT_CACHE_TTL_SECONDS,
        60,
        604800,
      )
      const writePromise = writeCachedAnswer({
        key: cacheKey,
        body,
        ttlSeconds,
      })

      if (ctx?.waitUntil) {
        ctx.waitUntil(writePromise)
      } else {
        await writePromise
      }
    }

    timings.totalMs = Date.now() - startedAt
    logEvent(env, {
      requestId,
      questionHash,
      stage: answer.stage,
      outcome: answer.provider === 'workers-ai' ? 'fallback' : 'ok',
      provider: answer.provider,
      model: answer.model,
      providerStatus: 200,
      cache: cacheState,
      timings,
      attempts: answer.attempts,
    })

    return jsonResponse(
      body,
      200,
      origin,
      {
        'X-Assistant-Cache': cacheState,
        'X-Assistant-Provider': answer.provider || 'unknown',
        'X-Assistant-Stage': answer.stage,
      },
      requestId,
    )
  },
}
