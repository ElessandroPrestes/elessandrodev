import type { Logger } from 'pino'
import type { BaseRetriever } from '@langchain/core/retrievers'
import type { AppConfig } from '../../config/env.js'
import type { EmbeddingsClient } from '../embeddings/types.js'
import type { LlmAttempt, LlmClient } from '../llm/types.js'
import {
  buildSystemPrompt,
  buildUserPrompt,
  contactReply,
  isContactQuestion,
  isEnglish,
  safeFallback,
  type Locale,
} from '../llm/prompt.js'
import type { JsonVectorStore } from '../rag/json-vector-store.js'
import {
  buildRetrievedContext,
  formatSources,
  type Source,
} from '../rag/context.js'
import {
  AppError,
  ConfigurationError,
  ProviderUnavailableError,
  RateLimitedError,
} from '../../shared/errors.js'
import { hashQuestion } from '../../shared/hash.js'
import { sanitizeAnswer } from '../../shared/text.js'
import { withTimeout } from '../../shared/timeout.js'
import {
  buildCacheKey,
  buildNegativeCacheKey,
  type CachedAnswer,
  type CachedFailure,
  TtlCache,
} from './answer-cache.js'

export interface ChatAnswer {
  response: string
  sources: Source[]
  cache: 'HIT' | 'MISS' | 'NEGATIVE' | 'OFF'
  stage: string
  provider?: string
  model?: string
  timings: {
    embeddingMs: number
    retrievalMs: number
    generationMs: number
    totalMs: number
  }
  attempts?: LlmAttempt[]
}

export interface ChatServiceDependencies {
  config: AppConfig
  logger: Logger
  embeddings: EmbeddingsClient
  retriever: BaseRetriever
  llm: LlmClient
  store: JsonVectorStore
  answerCache: TtlCache<CachedAnswer>
  negativeCache: TtlCache<CachedFailure>
}

function withCacheState(error: unknown, cache: ChatAnswer['cache']): AppError {
  if (error instanceof AppError) {
    return new AppError(error.message, {
      status: error.status,
      code: error.code,
      expose: error.expose,
      stage: error.stage,
      retryAfter: error.retryAfter,
      details: { ...error.details, cache },
      cause: error,
    })
  }

  return new AppError('Erro ao processar a pergunta.', {
    status: 500,
    code: 'CHAT_FAILED',
    expose: false,
    details: { cache },
    cause: error,
  })
}

export class ChatService {
  constructor(private readonly deps: ChatServiceDependencies) {}

  async answer({
    question,
    locale,
    requestId,
    signal,
  }: {
    question: string
    locale: Locale
    requestId: string
    signal?: AbortSignal
  }): Promise<ChatAnswer> {
    const startedAt = Date.now()
    const answerLocale: Locale =
      locale === 'en' || isEnglish(question) ? 'en' : 'pt'
    const questionHash = hashQuestion(question)
    const timings = {
      embeddingMs: 0,
      retrievalMs: 0,
      generationMs: 0,
      totalMs: 0,
    }

    if (isContactQuestion(question)) {
      timings.totalMs = Date.now() - startedAt
      this.deps.logger.info(
        {
          requestId,
          questionHash,
          stage: 'contact',
          outcome: 'ok',
          cache: 'OFF',
          timings,
        },
        'assistant answered contact question',
      )
      return {
        response: contactReply(answerLocale === 'en'),
        sources: [],
        cache: 'OFF',
        stage: 'contact',
        timings,
      }
    }

    const { config, store, embeddings, retriever, llm } = this.deps
    const metadata = store.metadata
    const cacheEnabled = config.cache.enabled && Boolean(metadata.sourceHash)
    const cacheKey = cacheEnabled
      ? buildCacheKey({
          question,
          locale: answerLocale,
          sourceHash: metadata.sourceHash,
          embeddingModel: metadata.embeddingModel,
        })
      : null
    const cacheState: ChatAnswer['cache'] = cacheKey ? 'MISS' : 'OFF'

    if (cacheKey) {
      const cached = this.deps.answerCache.get(cacheKey)
      if (cached) {
        timings.totalMs = Date.now() - startedAt
        this.deps.logger.info(
          {
            requestId,
            questionHash,
            stage: 'cache',
            outcome: 'ok',
            provider: 'cache',
            cache: 'HIT',
            timings,
          },
          'assistant cache hit',
        )
        return {
          response: cached.response,
          sources: cached.sources,
          cache: 'HIT',
          stage: 'cache',
          provider: 'cache',
          timings,
        }
      }

      const cachedFailure = this.deps.negativeCache.get(
        buildNegativeCacheKey(cacheKey),
      )
      if (cachedFailure) {
        throw new ProviderUnavailableError(
          'O assistente está temporariamente indisponível (cache negativo).',
          {
            status: cachedFailure.status,
            stage: cachedFailure.stage,
            details: { cache: 'NEGATIVE' },
          },
        )
      }
    }

    try {
      if (!embeddings.isConfigured()) {
        throw new ConfigurationError(
          'Nenhum provedor de embeddings configurado.',
          'embedding',
        )
      }

      if (!store.isReady()) {
        throw new ConfigurationError('Índice RAG indisponível.', 'retrieval')
      }

      if (!llm.isConfigured()) {
        throw new ProviderUnavailableError(
          'Nenhum provedor de LLM configurado.',
          { stage: 'openrouter' },
        )
      }

      const retrievalStartedAt = Date.now()
      const documents = await withTimeout(
        (retrievalSignal) =>
          retriever.invoke(question, { signal: retrievalSignal }),
        config.embeddings.timeoutMs + 2000,
        signal,
      )
      timings.retrievalMs = Date.now() - retrievalStartedAt

      if (documents.length === 0) {
        timings.totalMs = Date.now() - startedAt
        this.deps.logger.info(
          {
            requestId,
            questionHash,
            stage: 'retrieval',
            outcome: 'ok',
            provider: 'safe-fallback',
            cache: 'OFF',
            timings,
          },
          'assistant safe fallback without context',
        )
        return {
          response: safeFallback(answerLocale === 'en'),
          sources: [],
          cache: 'OFF',
          stage: 'retrieval',
          provider: 'safe-fallback',
          timings,
        }
      }

      const system = buildSystemPrompt(answerLocale)
      const user = buildUserPrompt(buildRetrievedContext(documents), question)
      const deadline = startedAt + config.llm.totalBudgetMs
      const generated = await llm.generate({
        system,
        user,
        signal,
        deadline,
      })
      timings.generationMs = generated.generationMs

      const response = sanitizeAnswer(generated.text)
      if (!response) {
        throw new ProviderUnavailableError('O provedor retornou resposta vazia.', {
          stage: generated.stage,
          status: 502,
        })
      }

      const sources = formatSources(documents)
      const result: ChatAnswer = {
        response,
        sources,
        cache: cacheState,
        stage: generated.stage,
        provider: generated.provider,
        model: generated.model,
        timings: {
          ...timings,
          totalMs: Date.now() - startedAt,
        },
        attempts: generated.attempts,
      }

      if (cacheKey && sources.length > 0) {
        this.deps.answerCache.set(
          cacheKey,
          { response, sources },
          config.cache.ttlSeconds * 1000,
        )
      }

      this.deps.logger.info(
        {
          requestId,
          questionHash,
          stage: generated.stage,
          outcome: generated.provider === 'mock' ? 'mock' : 'ok',
          provider: generated.provider,
          model: generated.model,
          cache: cacheState,
          timings: result.timings,
          attempts: generated.attempts,
        },
        'assistant answered',
      )

      return result
    } catch (error) {
      const appError = withCacheState(error, cacheState)

      if (
        cacheKey &&
        appError.status !== 429 &&
        appError.status !== 400 &&
        appError.status !== 401 &&
        appError.status !== 403
      ) {
        this.deps.negativeCache.set(
          buildNegativeCacheKey(cacheKey),
          { status: appError.status, stage: appError.stage ?? 'generation' },
          config.cache.negativeTtlSeconds * 1000,
        )
      }

      timings.totalMs = Date.now() - startedAt
      this.deps.logger.error(
        {
          requestId,
          questionHash,
          stage: appError.stage ?? 'unknown',
          outcome:
            appError instanceof RateLimitedError ? 'rate_limited' : 'unavailable',
          status: appError.status,
          code: appError.code,
          cache: cacheState,
          timings,
          err: error,
        },
        'assistant failed',
      )

      throw appError
    }
  }
}
