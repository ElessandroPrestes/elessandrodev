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

const DEFAULT_EMBEDDING_MODEL = '@cf/baai/bge-m3'
const DEFAULT_MODELS = [
  'minimax/minimax-m3.1-flash:free',
  'google/gemma-4-31b-it:free',
]
const DEFAULT_ALLOWED_ORIGINS = [
  'https://elessandroprestes.github.io',
  'http://localhost:5212',
  'http://127.0.0.1:5212',
  'http://elessandrodev.localhost',
]
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const REQUEST_LIMIT = 2000
const QUESTION_LIMIT = 500
const MODEL_TIMEOUT_MS = 20000
const CJK_PATTERN = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/g

function parseList(value, fallback = []) {
  const items = String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? [...new Set(items)] : fallback
}

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

function jsonResponse(body, status, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  }

  if (origin) Object.assign(headers, corsHeaders(origin))

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
    ? 'The assistant reached a temporary request limit. Please try again in a few minutes.'
    : 'O assistente atingiu o limite temporário de requisições. Tente novamente em alguns minutos.'
}

function unavailableMessage(locale) {
  return locale === 'en'
    ? 'The assistant is temporarily unavailable. Please try again shortly.'
    : 'O assistente está temporariamente indisponível. Tente novamente em instantes.'
}

function buildUserPrompt(context, question) {
  return `<trechos_recuperados>\n${context}\n</trechos_recuperados>\n\n<pergunta>\n${question}\n</pergunta>`
}

async function callOpenRouter({ env, model, system, user }) {
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

    if (!response.ok) {
      const detail = payload?.error?.message || payload?.message || ''
      return {
        ok: false,
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
        detail: String(detail).slice(0, 160),
      }
    }

    const content = payload?.choices?.[0]?.message?.content
    const text = Array.isArray(content)
      ? content
          .map((part) => (typeof part === 'string' ? part : part?.text || ''))
          .join('')
      : content

    if (typeof text !== 'string' || !text.trim()) {
      return { ok: false, status: 502, retryable: true }
    }

    return { ok: true, text: text.trim() }
  } catch (error) {
    const aborted = error?.name === 'AbortError'
    return { ok: false, status: aborted ? 504 : 502, retryable: true }
  } finally {
    clearTimeout(timer)
  }
}

async function generateAnswer({ env, locale, retrieved, question }) {
  const models = parseList(env.MODELS, DEFAULT_MODELS)
  const system = buildSystemPrompt(locale)
  const user = buildUserPrompt(buildContext(retrieved), question)
  let lastStatus = 503

  for (const model of models) {
    const result = await callOpenRouter({ env, model, system, user })

    if (result.ok) {
      const text = sanitizeAnswer(result.text)
      if (text && cjkRatio(result.text) <= 0.1) return { ok: true, text }
      lastStatus = 502
      continue
    }

    lastStatus = result.status
    console.error('[chat] model failed:', result.status, result.detail || '')

    if (!result.retryable && (result.status === 401 || result.status === 403)) {
      break
    }
  }

  return { ok: false, status: lastStatus }
}

export default {
  async fetch(request, env) {
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

    if (!env.OPENROUTER_API_KEY) {
      return jsonResponse({ error: unavailableMessage(locale) }, 503, origin)
    }

    if (!env.AI || !Array.isArray(index?.chunks) || index.chunks.length === 0) {
      return jsonResponse({ error: unavailableMessage(locale) }, 503, origin)
    }

    const embeddingModel = env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL
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
        return jsonResponse({ error: rateLimitMessage(locale) }, 429, origin)
      }

      console.error('[chat] generation failed with status:', answer.status)
      return jsonResponse({ error: unavailableMessage(locale) }, 503, origin)
    }

    return jsonResponse(
      {
        response: sanitizeAnswer(answer.text),
        sources: formatSources(retrieved),
      },
      200,
      origin,
    )
  },
}
