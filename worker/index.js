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
  readCachedAnswer,
  writeCachedAnswer,
  DEFAULT_CACHE_TTL_SECONDS,
} from './cache.js'
import { createRedis } from './redis.js'
import { isRateLimited } from './rate-limit.js'
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
  createSharedCircuit,
} from './circuit.js'

const DEFAULT_EMBEDDING_MODEL = '@cf/baai/bge-m3'
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
  const line = JSON.stringify({ event: 'assistant', ...payload })
  if (payload.level === 'warn') console.warn(line)
  else console.log(line)
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'X-Request-Id, X-Assistant-Cache, X-Assistant-Stage',
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

function buildUserPrompt(context, question) {
  return `<trechos_recuperados>\n${context}\n</trechos_recuperados>\n\n<pergunta>\n${question}\n</pergunta>`
}

function isCacheEnabled(env) {
  const value = String(env.ENABLE_CACHE ?? 'true').toLowerCase()
  return value !== 'false' && value !== '0' && value !== 'off'
}

function getCircuitBreaker(env, redis) {
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

  return createSharedCircuit(redis, activeCircuitBreaker, { threshold, cooldownMs })
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

async function generateAnswer({ env, locale, retrieved, question, deadline, circuit, log }) {
  const system = buildSystemPrompt(locale)
  const user = buildUserPrompt(buildContext(retrieved), question)
  const minBudget = readInt(env.MIN_CALL_BUDGET_MS, DEFAULT_MIN_CALL_BUDGET_MS, 100, 10000)
  const primaryTimeout = readInt(env.OPENROUTER_TIMEOUT_MS, DEFAULT_OPENROUTER_TIMEOUT_MS, 100, 30000)
  const alternativeTimeout = readInt(env.WORKERS_AI_TIMEOUT_MS, DEFAULT_WORKERS_AI_TIMEOUT_MS, 100, 30000)
  const alternative = typeof env.AI?.run === 'function'
    ? String(env.WORKERS_AI_MODEL ?? DEFAULT_WORKERS_AI_MODEL).trim()
    : ''

  async function attempt(provider, call, model, timeout, maxTokens, reserve = 0) {
    const timeoutMs = Math.min(timeout, deadline - Date.now() - reserve)
    if (timeoutMs < minBudget) {
      log({ stage: 'generation', outcome: 'budget', provider, model })
      return null
    }
    const start = Date.now()
    const result = await call({ env, model, system, user, timeoutMs, maxTokens })
    const text = result.ok && cjkRatio(result.text) <= 0.1
      ? sanitizeAnswer(result.text)
      : ''
    const outcome = text ? 'ok' : result.reason || 'incomplete'
    log({ stage: 'generation', outcome, provider, model, status: result.status, durationMs: Date.now() - start })
    return { text, provider, outcome, status: result.status, cacheable: result.cacheable }
  }

  if (env.OPENROUTER_API_KEY && deadline - Date.now() >= minBudget) {
    const permit = await circuit.acquire()
    log({ stage: 'breaker', outcome: permit.ticket.split(':')[0], shared: permit.shared })
    if (permit.ticket !== 'open') {
      let primary
      for (const model of parseList(env.MODELS, DEFAULT_MODELS)) {
        primary = await attempt(
          'openrouter', callOpenRouter, model, primaryTimeout,
          readInt(env.OPENROUTER_MAX_TOKENS, DEFAULT_OPENROUTER_MAX_TOKENS, 128, 8000),
          alternative ? minBudget : 0,
        ) ?? primary

        // Um modelo removido ou uma saída incompleta pode ser específico do modelo.
        if (!primary || primary.text || permit.ticket.startsWith('probe:') ||
            (primary.outcome !== 'incomplete' && primary.status !== 404)) break
      }
      const failure = ['rate-limit', 'quota', 'timeout', 'upstream'].includes(primary?.outcome)
      const outcome = !primary ? 'skipped' : failure ? 'failure' : 'success'
      const state = await circuit.finish(permit, outcome)
      log({ stage: 'breaker', outcome: state, shared: permit.shared })
      if (primary?.text) return primary
    }
  }

  if (!alternative) return null
  return attempt(
    'workers-ai', callWorkersAi, alternative, alternativeTimeout,
    readInt(env.WORKERS_AI_MAX_TOKENS, DEFAULT_WORKERS_AI_MAX_TOKENS, 128, 2048),
  )
}

async function embedWithTimeout(ai, model, question, timeoutMs) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('embedding-timeout')), timeoutMs)
  })
  try {
    return await Promise.race([embedQuestion(ai, model, question), timeout])
  } finally {
    clearTimeout(timer)
  }
}

export default {
  async fetch(request, env) {
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

    const answerLocale = locale === 'en' || isEnglish(question) ? 'en' : 'pt'
    const en = answerLocale === 'en'
    const log = (event) => logEvent(env, { requestId, ...event })
    function reply(body, stage, cache, outcome) {
      log({ stage, cache, outcome, origin: body.origin, provider: body.provider, totalMs: Date.now() - startedAt })
      return jsonResponse(body, 200, origin, {
        'X-Assistant-Cache': cache,
        'X-Assistant-Stage': stage,
        ...(body.provider ? { 'X-Assistant-Provider': body.provider } : {}),
      }, requestId)
    }
    function answerBody(response, origin, sources = [], provider = null) {
      return { response, sources, origin, provider, timestamp: new Date().toISOString() }
    }

    if (isContactQuestion(question)) {
      return reply(answerBody(contactReply(en), 'contact'), 'contact', 'OFF', 'ok')
    }

    const redis = createRedis(env, () => log({
      stage: 'redis', outcome: 'unavailable', level: 'warn',
    }))
    const embeddingModel = env.EMBEDDING_MODEL || index.embeddingModel || DEFAULT_EMBEDDING_MODEL
    const revision = [index.version, index.sourceHash, index.createdAt, embeddingModel].join(':')
    const cacheKey = redis && isCacheEnabled(env)
      ? await buildCacheKey({ question, locale: answerLocale, revision })
      : null
    let cache = 'OFF'
    if (cacheKey) {
      const cached = await readCachedAnswer(redis, cacheKey)
      if (cached) return reply(cached, 'cache', 'HIT', 'hit')
      if (cached !== undefined) cache = 'MISS'
    }
    log({ stage: 'cache', outcome: cache.toLowerCase() })

    const deadline = startedAt + readInt(env.WORKER_BUDGET_MS, DEFAULT_WORKER_BUDGET_MS, 1000, 60000)
    const limited = await isRateLimited(
      request, env, redis,
      readInt(env.CHAT_RATE_LIMIT_MAX, 10, 1, 1000),
      readInt(env.CHAT_RATE_LIMIT_WINDOW_SECONDS, 60, 1, 3600),
    )
    if (limited) log({ stage: 'rate-limit', outcome: 'limited' })

    let retrieved
    try {
      if (!env.AI?.run || !index.chunks?.length) throw new Error('retrieval-unavailable')
      const queryVector = await embedWithTimeout(
        env.AI, embeddingModel, question,
        Math.max(1, Math.min(deadline - Date.now(), readInt(env.EMBEDDING_TIMEOUT_MS, 5000, 100, 30000))),
      )
      retrieved = retrieveChunks({
        queryVector,
        question,
        chunks: index.chunks,
        topK: readInt(env.TOP_K, 4, 1, 8),
        alpha: readFloat(env.HYBRID_ALPHA, 0.6, 0, 1),
        minScore: readFloat(env.MIN_SCORE, 0.45, 0, 1),
      })
    } catch {
      return reply(answerBody(safeFallback(en), 'contact'), 'retrieval', cache, 'unavailable')
    }
    if (!retrieved.length) {
      return reply(answerBody(safeFallback(en), 'contact'), 'retrieval', cache, 'no-results')
    }

    const sources = formatSources(retrieved)
    const answer = limited ? null : await generateAnswer({
      env, locale: answerLocale, retrieved, question, deadline,
      circuit: getCircuitBreaker(env, redis), log,
    })
    if (!answer?.text) {
      const intro = limited
        ? (en ? 'You’ve sent several questions in a short time. Here are relevant excerpts from the résumé.' : 'Você enviou várias perguntas em pouco tempo. Aqui estão trechos relevantes do currículo.')
        : (en ? 'Live answers are temporarily unavailable. Here are relevant excerpts from the résumé.' : 'As respostas ao vivo estão temporariamente indisponíveis. Aqui estão trechos relevantes do currículo.')
      const excerpts = retrieved.map(({ chunk }) => `**${chunk.section}**

${chunk.text}`)
      return reply(answerBody([intro, ...excerpts].join('\n\n'), 'retrieval-only', sources), 'retrieval', cache, 'degraded')
    }

    const body = answerBody(answer.text, 'llm', sources, answer.provider)
    if (cacheKey && answer.cacheable) {
      const stored = await writeCachedAnswer(
        redis, cacheKey, body,
        readInt(env.CACHE_TTL_SECONDS, DEFAULT_CACHE_TTL_SECONDS, 60, 604800),
      )
      if (stored !== 'OK') cache = 'OFF'
    } else if (cacheKey) {
      cache = 'OFF'
    }
    return reply(body, answer.provider, cache, 'ok')
  },
}
