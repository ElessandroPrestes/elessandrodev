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
  readCachedAnswer,
  writeCachedAnswer,
  buildCacheKey,
} from './cache.js'
import {
  DEFAULT_MODELS,
  DEFAULT_WORKERS_AI_MODEL,
  callOpenRouter,
  callWorkersAi,
  parseList,
} from './providers.js'

const DEFAULT_EMBEDDING_MODEL = '@cf/baai/bge-m3'
const DEFAULT_CACHE_TTL_SECONDS = 86400
const DEFAULT_RETRY_AFTER_SECONDS = 3600
const DEFAULT_ALLOWED_ORIGINS = [
  'https://elessandroprestes.github.io',
  'http://localhost:5212',
  'http://127.0.0.1:5212',
  'http://elessandrodev.localhost',
]
const REQUEST_LIMIT = 2000
const QUESTION_LIMIT = 500
const CJK_PATTERN = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/g

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

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function jsonResponse(body, status, origin, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  }

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

async function generateAnswer({ env, locale, retrieved, question }) {
  const models = env.OPENROUTER_API_KEY
    ? parseList(env.MODELS, DEFAULT_MODELS)
    : []
  const system = buildSystemPrompt(locale)
  const user = buildUserPrompt(buildContext(retrieved), question)
  const workersAiModel = String(
    env.WORKERS_AI_MODEL || DEFAULT_WORKERS_AI_MODEL,
  ).trim()
  let lastStatus = 503
  let rateLimited = false
  let retryAfter = null

  for (const model of models) {
    const result = await callOpenRouter({ env, model, system, user })

    if (result.ok) {
      const text = sanitizeAnswer(result.text)
      if (text && cjkRatio(result.text) <= 0.1) {
        return { ok: true, text, provider: result.provider, model }
      }
      lastStatus = 502
      continue
    }

    lastStatus = result.status
    if (result.status === 429) rateLimited = true
    if (result.retryAfter) retryAfter = result.retryAfter
    console.error('[chat] openrouter failed:', result.status, result.detail || '')

    if (result.quotaExhausted) break
    if (!result.retryable && (result.status === 401 || result.status === 403)) {
      break
    }
  }

  if (workersAiModel) {
    const fallback = await callWorkersAi({
      env,
      model: workersAiModel,
      system,
      user,
    })

    if (fallback.ok) {
      const text = sanitizeAnswer(fallback.text)
      if (text && cjkRatio(fallback.text) <= 0.1) {
        console.log('[chat] fallback provider used: workers-ai')
        return {
          ok: true,
          text,
          provider: fallback.provider,
          model: workersAiModel,
        }
      }
      lastStatus = 502
    } else {
      console.error(
        '[chat] workers-ai failed:',
        fallback.status,
        fallback.detail || '',
      )
      lastStatus = fallback.status
    }
  }

  if (rateLimited) {
    return {
      ok: false,
      status: 429,
      retryAfter: retryAfter || DEFAULT_RETRY_AFTER_SECONDS,
    }
  }

  return { ok: false, status: lastStatus, retryAfter }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin')
    const allowedOrigins = parseList(env.ALLOWED_ORIGIN, DEFAULT_ALLOWED_ORIGINS)
    const isAllowed = Boolean(origin) && allowedOrigins.includes(origin)

    if (!isAllowed) {
      return jsonResponse({ error: 'Origem não permitida.' }, 403, null)
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Método não permitido.' }, 405, origin)
    }

    const url = new URL(request.url)
    if (url.pathname !== '/' && url.pathname !== '/chat') {
      return jsonResponse({ error: 'Rota não encontrada.' }, 404, origin)
    }

    const raw = await request.text()
    if (raw.length > REQUEST_LIMIT) {
      return jsonResponse({ error: 'Payload muito grande.' }, 413, origin)
    }

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return jsonResponse({ error: 'JSON inválido.' }, 400, origin)
    }

    const question = typeof payload?.question === 'string' ? payload.question.trim() : ''
    const locale = payload?.locale === 'en' ? 'en' : 'pt'

    if (!question) {
      return jsonResponse({ error: 'Pergunta obrigatória.' }, 400, origin)
    }

    if (question.length > QUESTION_LIMIT) {
      return jsonResponse({ error: 'Pergunta muito longa.' }, 400, origin)
    }

    const answerLocale =
      locale === 'en' || isEnglish(question) ? 'en' : 'pt'

    if (isContactQuestion(question)) {
      return jsonResponse(
        { response: contactReply(answerLocale === 'en'), sources: [] },
        200,
        origin,
      )
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

    if (cacheKey) {
      const cached = await readCachedAnswer({ key: cacheKey })
      if (cached) {
        return jsonResponse(cached, 200, origin, {
          'X-Assistant-Cache': 'HIT',
        })
      }
    }

    const hasGenerationProvider =
      Boolean(env.OPENROUTER_API_KEY) || Boolean(env.AI?.run)

    if (!hasGenerationProvider) {
      return jsonResponse({ error: unavailableMessage(locale) }, 503, origin)
    }

    if (!env.AI || !Array.isArray(index?.chunks) || index.chunks.length === 0) {
      return jsonResponse({ error: unavailableMessage(locale) }, 503, origin)
    }

    const topK = readInt(env.TOP_K, 4, 1, 8)
    const alpha = readFloat(env.HYBRID_ALPHA, 0.6, 0, 1)
    const minScore = readFloat(env.MIN_SCORE, 0.45, 0, 1)

    let queryVector
    try {
      queryVector = await embedQuestion(env.AI, embeddingModel, question)
    } catch (error) {
      console.error('[chat] embedding failed:', error?.message || 'unknown error')
      return jsonResponse({ error: unavailableMessage(locale) }, 503, origin)
    }

    const retrieved = retrieveChunks({
      queryVector,
      question,
      chunks: index.chunks,
      topK,
      alpha,
      minScore,
    })

    if (retrieved.length === 0) {
      return jsonResponse(
        { response: safeFallback(answerLocale === 'en'), sources: [] },
        200,
        origin,
      )
    }

    const answer = await generateAnswer({
      env,
      locale: answerLocale,
      retrieved,
      question,
    })

    if (!answer.ok) {
      if (answer.status === 429) {
        return jsonResponse(
          { error: rateLimitMessage(locale) },
          429,
          origin,
          {
            'Retry-After': String(
              answer.retryAfter || DEFAULT_RETRY_AFTER_SECONDS,
            ),
          },
        )
      }

      console.error('[chat] generation failed with status:', answer.status)
      return jsonResponse({ error: unavailableMessage(locale) }, 503, origin)
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

    return jsonResponse(body, 200, origin, {
      'X-Assistant-Cache': cacheKey ? 'MISS' : 'OFF',
      'X-Assistant-Provider': answer.provider || 'unknown',
    })
  },
}
