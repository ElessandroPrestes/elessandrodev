import { resolve } from 'node:path'
import { z } from 'zod'

export type LlmMode = 'openrouter' | 'mock'
export type EmbeddingsProvider = 'auto' | 'cloudflare' | 'openai-compatible' | 'none'
export type NodeEnv = 'development' | 'test' | 'production'

export interface AppConfig {
  nodeEnv: NodeEnv
  isProduction: boolean
  host: string
  port: number
  logLevel: string
  appVersion: string
  trustProxy: boolean | number
  corsOrigins: string[]
  requestBodyLimit: string
  questionMaxLength: number
  rateLimit: {
    enabled: boolean
    windowMs: number
    max: number
    chatMax: number
  }
  rag: {
    indexPath: string
    topK: number
    alpha: number
    minScore: number
  }
  embeddings: {
    provider: EmbeddingsProvider
    model: string
    dimensions: number
    timeoutMs: number
    cloudflareAccountId: string
    cloudflareApiToken: string
    baseUrl: string
    apiKey: string
    openAiCompatibleModel: string
  }
  llm: {
    mode: LlmMode
    apiKey: string
    baseUrl: string
    models: string[]
    timeoutMs: number
    maxTokens: number
    temperature: number
    maxAttemptsPerModel: number
    totalBudgetMs: number
    siteUrl: string
    appTitle: string
    circuitBreakerThreshold: number
    circuitBreakerMs: number
  }
  cache: {
    enabled: boolean
    ttlSeconds: number
    negativeTtlSeconds: number
  }
  shutdownTimeoutMs: number
}

const DEFAULT_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
]

const DEFAULT_CORS = [
  'http://localhost:5212',
  'http://127.0.0.1:5212',
  'http://elessandrodev.localhost',
]

function parseList(value: string | undefined, fallback: string[]): string[] {
  const items = String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? [...new Set(items)] : fallback
}

function parseTrustProxy(value: string): boolean | number {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false' || normalized === '') return false
  const numeric = Number(normalized)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 1
}

const booleanString = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (value === undefined || value === '') return true
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
    ctx.addIssue({ code: 'custom', message: `Booleano inválido: ${value}` })
    return z.NEVER
  })

const rawSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3201),
  LOG_LEVEL: z.string().default('info'),
  APP_VERSION: z.string().default('1.0.0-migration'),
  TRUST_PROXY: z.string().default('1'),
  CORS_ORIGINS: z.string().optional(),
  REQUEST_BODY_LIMIT: z.string().default('4kb'),
  QUESTION_MAX_LENGTH: z.coerce.number().int().min(1).max(4000).default(500),
  RATE_LIMIT_ENABLED: booleanString,
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(30),
  CHAT_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),

  RAG_INDEX_PATH: z.string().optional(),
  RAG_TOP_K: z.coerce.number().int().min(1).max(20).default(4),
  RAG_HYBRID_ALPHA: z.coerce.number().min(0).max(1).default(0.6),
  RAG_MIN_SCORE: z.coerce.number().min(-1).max(1).default(0.45),

  EMBEDDINGS_PROVIDER: z
    .enum(['auto', 'cloudflare', 'openai-compatible', 'none'])
    .default('auto'),
  EMBEDDING_MODEL: z.string().default('@cf/baai/bge-m3'),
  EMBEDDINGS_DIMENSIONS: z.coerce.number().int().min(1).default(1024),
  EMBEDDINGS_TIMEOUT_MS: z.coerce.number().int().min(1000).default(10000),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CF_ACCOUNT_ID: z.string().optional(),
  CF_API_TOKEN: z.string().optional(),
  EMBEDDINGS_BASE_URL: z.string().optional(),
  EMBEDDINGS_API_KEY: z.string().optional(),
  EMBEDDINGS_MODEL: z.string().optional(),

  LLM_MODE: z.enum(['openrouter', 'mock']).default('openrouter'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODELS: z.string().optional(),
  OPENROUTER_TIMEOUT_MS: z.coerce.number().int().min(1000).default(15000),
  OPENROUTER_MAX_TOKENS: z.coerce.number().int().min(64).default(3000),
  LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
  LLM_MAX_ATTEMPTS_PER_MODEL: z.coerce.number().int().min(1).max(5).default(2),
  LLM_TOTAL_BUDGET_MS: z.coerce.number().int().min(1000).default(25000),
  SITE_URL: z.string().default('http://localhost:5212'),
  APP_TITLE: z.string().default('Elessandro Portfolio'),
  CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().int().min(1).max(20).default(3),
  CIRCUIT_BREAKER_MS: z.coerce.number().int().min(1000).default(60000),

  ENABLE_CACHE: booleanString,
  CACHE_TTL_SECONDS: z.coerce.number().int().min(1).default(86400),
  NEGATIVE_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).max(300).default(60),

  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1000).default(10000),
})

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const raw = rawSchema.parse(env)

  return {
    nodeEnv: raw.NODE_ENV,
    isProduction: raw.NODE_ENV === 'production',
    host: raw.HOST,
    port: raw.PORT,
    logLevel: raw.LOG_LEVEL,
    appVersion: raw.APP_VERSION,
    trustProxy: parseTrustProxy(raw.TRUST_PROXY),
    corsOrigins: parseList(raw.CORS_ORIGINS, DEFAULT_CORS),
    requestBodyLimit: raw.REQUEST_BODY_LIMIT,
    questionMaxLength: raw.QUESTION_MAX_LENGTH,
    rateLimit: {
      enabled: raw.RATE_LIMIT_ENABLED,
      windowMs: raw.RATE_LIMIT_WINDOW_MS,
      max: raw.RATE_LIMIT_MAX,
      chatMax: raw.CHAT_RATE_LIMIT_MAX,
    },
    rag: {
      indexPath:
        raw.RAG_INDEX_PATH || resolve(process.cwd(), '../worker/rag/index.json'),
      topK: raw.RAG_TOP_K,
      alpha: raw.RAG_HYBRID_ALPHA,
      minScore: raw.RAG_MIN_SCORE,
    },
    embeddings: {
      provider: raw.EMBEDDINGS_PROVIDER,
      model: raw.EMBEDDING_MODEL,
      dimensions: raw.EMBEDDINGS_DIMENSIONS,
      timeoutMs: raw.EMBEDDINGS_TIMEOUT_MS,
      cloudflareAccountId:
        raw.CLOUDFLARE_ACCOUNT_ID || raw.CF_ACCOUNT_ID || '',
      cloudflareApiToken:
        raw.CLOUDFLARE_API_TOKEN || raw.CF_API_TOKEN || '',
      baseUrl: raw.EMBEDDINGS_BASE_URL || '',
      apiKey: raw.EMBEDDINGS_API_KEY || '',
      openAiCompatibleModel: raw.EMBEDDINGS_MODEL || raw.EMBEDDING_MODEL,
    },
    llm: {
      mode: raw.LLM_MODE,
      apiKey: raw.OPENROUTER_API_KEY || '',
      baseUrl: raw.OPENROUTER_BASE_URL,
      models: parseList(raw.OPENROUTER_MODELS, DEFAULT_MODELS),
      timeoutMs: raw.OPENROUTER_TIMEOUT_MS,
      maxTokens: raw.OPENROUTER_MAX_TOKENS,
      temperature: raw.LLM_TEMPERATURE,
      maxAttemptsPerModel: raw.LLM_MAX_ATTEMPTS_PER_MODEL,
      totalBudgetMs: raw.LLM_TOTAL_BUDGET_MS,
      siteUrl: raw.SITE_URL,
      appTitle: raw.APP_TITLE,
      circuitBreakerThreshold: raw.CIRCUIT_BREAKER_THRESHOLD,
      circuitBreakerMs: raw.CIRCUIT_BREAKER_MS,
    },
    cache: {
      enabled: raw.ENABLE_CACHE,
      ttlSeconds: raw.CACHE_TTL_SECONDS,
      negativeTtlSeconds: raw.NEGATIVE_CACHE_TTL_SECONDS,
    },
    shutdownTimeoutMs: raw.SHUTDOWN_TIMEOUT_MS,
  }
}
